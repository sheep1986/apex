import { Handler, schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.URL || 'http://localhost:8888';

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

/**
 * Sequence Execution Worker
 *
 * Runs every 2 minutes via Netlify scheduled functions.
 * Processes campaign sequences by:
 *   1. Finding contacts whose next_action_at has passed
 *   2. Executing the current step (call, sms, email, wait)
 *   3. Advancing to the next step or completing the sequence
 */
const worker: Handler = async () => {
  try {
    const now = new Date().toISOString();

    // 1. Find all active sequence progress records where next_action_at <= now
    const { data: dueItems, error } = await supabase
      .from('campaign_sequence_progress')
      .select(`
        *,
        campaign_sequences(
          id, campaign_id, organization_id, is_active,
          campaign_sequence_steps(*)
        )
      `)
      .eq('status', 'active')
      .lte('next_action_at', now)
      .limit(100);

    if (error) {
      console.error('Sequence worker query error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Query failed' }) };
    }

    if (!dueItems || dueItems.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ processed: 0 }) };
    }

    let processed = 0;
    let errors = 0;

    for (const progress of dueItems) {
      try {
        const sequence = progress.campaign_sequences;
        if (!sequence || !sequence.is_active) {
          // Sequence was deactivated — pause this contact
          await supabase
            .from('campaign_sequence_progress')
            .update({ status: 'paused' })
            .eq('id', progress.id);
          continue;
        }

        const allSteps = (sequence.campaign_sequence_steps || [])
          .sort((a: any, b: any) => a.step_order - b.step_order);

        if (allSteps.length === 0) continue;

        // Find current step
        const currentStep = allSteps.find((s: any) => s.id === progress.current_step_id);
        if (!currentStep) {
          // No current step — start from step 1
          const firstStep = allSteps[0];
          await executeStep(firstStep, progress, sequence);
          processed++;
          continue;
        }

        // Execute the current step
        await executeStep(currentStep, progress, sequence);
        processed++;
      } catch (err: any) {
        console.error(`Sequence step error for progress ${progress.id}:`, err);
        errors++;

        // Mark as failed after repeated errors
        await supabase
          .from('campaign_sequence_progress')
          .update({ status: 'failed' })
          .eq('id', progress.id);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ processed, errors, total: dueItems.length }),
    };
  } catch (err: any) {
    console.error('Sequence worker fatal error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

/**
 * Execute a single sequence step for a contact, then advance to next step.
 */
async function executeStep(step: any, progress: any, sequence: any) {
  const orgId = sequence.organization_id;
  const contactId = progress.contact_id;

  // Get contact info
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (!contact) {
    await supabase
      .from('campaign_sequence_progress')
      .update({ status: 'failed' })
      .eq('id', progress.id);
    return;
  }

  switch (step.step_type) {
    case 'call': {
      // Dispatch a voice call via the make-call function
      try {
        await fetch(`${siteUrl}/.netlify/functions/make-call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: orgId,
            assistantId: step.config?.assistant_id,
            phoneNumber: contact.phone,
            contactId: contact.id,
            campaignId: sequence.campaign_id,
            // Internal call — bypass user auth by using service call pattern
            _serviceCall: true,
          }),
        });
      } catch (err: any) {
        console.error('Sequence call dispatch error:', err);
      }
      break;
    }

    case 'sms': {
      // Send SMS
      const smsBody = renderVariables(step.config?.body || '', contact);
      try {
        await supabase.from('sms_messages').insert({
          organization_id: orgId,
          campaign_id: sequence.campaign_id,
          contact_id: contact.id,
          from_number: 'auto', // Will be resolved by sms-send
          to_number: contact.phone,
          body: smsBody,
          direction: 'outbound',
          status: 'queued',
          credits_used: 0.015,
        });

        // Trigger actual SMS send
        await fetch(`${siteUrl}/.netlify/functions/sms-send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: orgId,
            to: contact.phone,
            body: smsBody,
            contactId: contact.id,
            campaignId: sequence.campaign_id,
            _serviceCall: true,
          }),
        });
      } catch (err: any) {
        console.error('Sequence SMS error:', err);
      }
      break;
    }

    case 'email': {
      // Send email
      const variables: Record<string, string> = {
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        company: contact.company || '',
        email: contact.email || '',
        phone: contact.phone || '',
      };

      try {
        await fetch(`${siteUrl}/.netlify/functions/email-send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: orgId,
            to: contact.email,
            templateId: step.config?.template_id !== 'custom' ? step.config?.template_id : undefined,
            subject: step.config?.subject,
            bodyHtml: step.config?.body,
            variables,
            contactId: contact.id,
            campaignId: sequence.campaign_id,
            _serviceCall: true,
          }),
        });
      } catch (err: any) {
        console.error('Sequence email error:', err);
      }
      break;
    }

    case 'wait': {
      // Wait is handled by scheduling next_action_at — no actual action to take.
      // The step itself IS the wait. Just advance to next step with the delay.
      break;
    }

    default:
      console.error(`Unknown step type: ${step.step_type}`);
  }

  // Advance to next step
  await advanceToNextStep(progress, step, sequence);
}

/**
 * Advance the contact to the next step in the sequence.
 */
async function advanceToNextStep(progress: any, currentStep: any, sequence: any) {
  const allSteps = (sequence.campaign_sequence_steps || [])
    .sort((a: any, b: any) => a.step_order - b.step_order);

  const currentIndex = allSteps.findIndex((s: any) => s.id === currentStep.id);
  const nextStep = allSteps[currentIndex + 1];

  if (!nextStep) {
    // Sequence complete
    await supabase
      .from('campaign_sequence_progress')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        current_step_id: currentStep.id,
      })
      .eq('id', progress.id);

    // Dispatch webhook
    await dispatchWebhook(sequence.organization_id, 'campaign.completed', {
      sequenceId: sequence.id,
      contactId: progress.contact_id,
    });
    return;
  }

  // Calculate next_action_at based on next step type
  let delayMs = 0;
  if (nextStep.step_type === 'wait') {
    const hours = nextStep.config?.duration_hours || 24;
    delayMs = hours * 60 * 60 * 1000;
  } else {
    // Small delay between non-wait steps (30 seconds) to avoid hammering
    delayMs = 30_000;
  }

  const nextActionAt = new Date(Date.now() + delayMs).toISOString();

  // If next step is a 'wait', we skip it and schedule for the step AFTER the wait
  if (nextStep.step_type === 'wait') {
    const stepAfterWait = allSteps[currentIndex + 2];
    if (stepAfterWait) {
      await supabase
        .from('campaign_sequence_progress')
        .update({
          current_step_id: stepAfterWait.id,
          next_action_at: nextActionAt,
        })
        .eq('id', progress.id);
    } else {
      // Wait is the last step — complete the sequence after the delay
      await supabase
        .from('campaign_sequence_progress')
        .update({
          status: 'completed',
          completed_at: nextActionAt,
          current_step_id: nextStep.id,
        })
        .eq('id', progress.id);
    }
  } else {
    await supabase
      .from('campaign_sequence_progress')
      .update({
        current_step_id: nextStep.id,
        next_action_at: nextActionAt,
      })
      .eq('id', progress.id);
  }
}

/**
 * Replace template variables with contact data.
 */
function renderVariables(template: string, contact: any): string {
  return template
    .replace(/\{\{first_name\}\}/g, contact.first_name || '')
    .replace(/\{\{last_name\}\}/g, contact.last_name || '')
    .replace(/\{\{company\}\}/g, contact.company || '')
    .replace(/\{\{email\}\}/g, contact.email || '')
    .replace(/\{\{phone\}\}/g, contact.phone || '');
}

/**
 * Fire a webhook event for the organization.
 */
async function dispatchWebhook(orgId: string, eventType: string, payload: any) {
  try {
    await fetch(`${siteUrl}/.netlify/functions/webhook-dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: orgId, eventType, payload }),
    });
  } catch {
    // Non-critical — don't fail the sequence over a webhook
  }
}

// Run every 2 minutes
export const handler = schedule('*/2 * * * *', worker);
