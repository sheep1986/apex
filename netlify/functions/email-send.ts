import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const EMAIL_CREDITS = 1; // 1 credit per email (credit-based billing)

/**
 * Render template variables: {{first_name}}, {{company}}, etc.
 */
function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  return rendered;
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // 1. Authenticate
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // 2. Get organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'No organization found' }) };
    }

    const organizationId = member.organization_id;

    // 3. Parse request
    const {
      to,
      subject,
      bodyHtml,
      bodyText,
      templateId,
      variables = {},
      contactId,
      campaignId,
      fromName,
      fromEmail,
    } = JSON.parse(event.body || '{}');

    if (!to) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required field: to' }) };
    }

    // 4. Get org details for from address
    const { data: org } = await supabase
      .from('organizations')
      .select('name, settings')
      .eq('id', organizationId)
      .single();

    const senderName = fromName || org?.name || 'Trinity AI';
    const senderEmail = fromEmail || org?.settings?.billing_email || 'noreply@trinityai.com';

    // 5. Resolve template if provided
    let finalSubject = subject || '';
    let finalBodyHtml = bodyHtml || '';
    let finalBodyText = bodyText || '';

    if (templateId) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .eq('organization_id', organizationId)
        .single();

      if (template) {
        finalSubject = renderTemplate(template.subject, variables);
        finalBodyHtml = renderTemplate(template.body_html, variables);
        finalBodyText = renderTemplate(template.body_text || '', variables);

        // Increment usage count
        await supabase
          .from('email_templates')
          .update({ usage_count: (template.usage_count || 0) + 1 })
          .eq('id', templateId);
      }
    } else {
      // Render variables in direct content too
      finalSubject = renderTemplate(finalSubject, variables);
      finalBodyHtml = renderTemplate(finalBodyHtml, variables);
      finalBodyText = renderTemplate(finalBodyText, variables);
    }

    if (!finalSubject || !finalBodyHtml) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing subject or body content' }) };
    }

    // 6. Insert email record
    const { data: emailRecord, error: insertError } = await supabase
      .from('email_messages')
      .insert({
        organization_id: organizationId,
        campaign_id: campaignId || null,
        contact_id: contactId || null,
        template_id: templateId || null,
        from_email: senderEmail,
        from_name: senderName,
        to_email: to,
        subject: finalSubject,
        body_html: finalBodyHtml,
        body_text: finalBodyText,
        status: 'sending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Email insert error:', insertError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create email record' }) };
    }

    // 7. Send via Resend
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${senderName} <${senderEmail}>`,
            to: [to],
            subject: finalSubject,
            html: finalBodyHtml,
            text: finalBodyText || undefined,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          await supabase
            .from('email_messages')
            .update({
              status: 'sent',
              provider_id: result.id,
              sent_at: new Date().toISOString(),
            })
            .eq('id', emailRecord.id);

          // Deduct credits via credit system
          await supabase.rpc('record_credit_usage', {
            p_organization_id: organizationId,
            p_credits: EMAIL_CREDITS,
            p_action_type: 'email',
            p_unit_count: 1,
            p_description: `Email to ${to}`,
            p_reference_id: emailRecord.id,
            p_metadata: { to_email: to, subject: finalSubject },
          }).catch((err: any) => {
            console.warn('Email credit tracking failed (non-critical):', err?.message);
          });
        } else {
          await supabase
            .from('email_messages')
            .update({
              status: 'failed',
              error_message: result.message || 'Resend error',
            })
            .eq('id', emailRecord.id);

          return { statusCode: 502, headers, body: JSON.stringify({ error: 'Email delivery failed', detail: result.message }) };
        }
      } catch (emailError: any) {
        await supabase
          .from('email_messages')
          .update({
            status: 'failed',
            error_message: emailError.message,
          })
          .eq('id', emailRecord.id);

        return { statusCode: 502, headers, body: JSON.stringify({ error: 'Email provider error' }) };
      }
    } else {
      // No Resend configured — mark as sent for demo
      await supabase
        .from('email_messages')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', emailRecord.id);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        emailId: emailRecord.id,
        message: 'Email sent successfully',
      }),
    };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
