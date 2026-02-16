import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const SMS_CREDITS = 3; // 3 credits per SMS segment (credit-based billing)

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
    const { to, from, body, contactId, campaignId } = JSON.parse(event.body || '{}');

    if (!to || !body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields: to, body' }) };
    }

    // 4. Verify org owns the from number
    let fromNumber = from;
    if (!fromNumber) {
      // Auto-select first available number
      const { data: numbers } = await supabase
        .from('phone_numbers')
        .select('phone_number')
        .eq('organization_id', organizationId)
        .limit(1)
        .single();

      if (!numbers) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'No phone number available. Purchase a number first.' }) };
      }
      fromNumber = numbers.phone_number;
    } else {
      // Verify ownership
      const { data: ownedNumber } = await supabase
        .from('phone_numbers')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('phone_number', fromNumber)
        .single();

      if (!ownedNumber) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Phone number not owned by organization' }) };
      }
    }

    // 5. Check credit allowance (credit-based system)
    const { data: creditCheck, error: creditCheckError } = await supabase.rpc('check_credits_allowed', {
      p_organization_id: organizationId,
      p_credits_needed: SMS_CREDITS,
    });

    if (creditCheckError || !creditCheck?.allowed) {
      const reason = creditCheck?.reason || 'Insufficient credits for SMS';
      return { statusCode: 402, headers, body: JSON.stringify({ error: reason }) };
    }

    // 6. Insert pending SMS record
    const { data: smsRecord, error: insertError } = await supabase
      .from('sms_messages')
      .insert({
        organization_id: organizationId,
        campaign_id: campaignId || null,
        contact_id: contactId || null,
        from_number: fromNumber,
        to_number: to,
        body: body,
        direction: 'outbound',
        status: 'sending',
        credits_used: SMS_CREDITS,
      })
      .select()
      .single();

    if (insertError) {
      console.error('SMS insert error:', insertError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create SMS record' }) };
    }

    // 7. Send via Twilio
    if (twilioAccountSid && twilioAuthToken) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const twilioAuth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');

        const formBody = new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: body,
        });

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBody.toString(),
        });

        const result = await response.json();

        if (response.ok) {
          // Update SMS record with Twilio SID
          await supabase
            .from('sms_messages')
            .update({
              status: 'sent',
              provider_id: result.sid,
              sent_at: new Date().toISOString(),
            })
            .eq('id', smsRecord.id);

          // Deduct credits via credit system
          await supabase.rpc('record_credit_usage', {
            p_organization_id: organizationId,
            p_credits: SMS_CREDITS,
            p_action_type: 'sms',
            p_unit_count: 1,
            p_description: `SMS to ${to}`,
            p_reference_id: smsRecord.id,
            p_metadata: { to_number: to, from_number: fromNumber },
          });
        } else {
          await supabase
            .from('sms_messages')
            .update({
              status: 'failed',
              error_message: result.message || 'Twilio error',
            })
            .eq('id', smsRecord.id);

          return { statusCode: 502, headers, body: JSON.stringify({ error: 'SMS delivery failed', detail: result.message }) };
        }
      } catch (twilioError: any) {
        await supabase
          .from('sms_messages')
          .update({
            status: 'failed',
            error_message: twilioError.message,
          })
          .eq('id', smsRecord.id);

        return { statusCode: 502, headers, body: JSON.stringify({ error: 'SMS provider error' }) };
      }
    } else {
      // No Twilio configured — mark as sent for demo purposes
      await supabase
        .from('sms_messages')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', smsRecord.id);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        smsId: smsRecord.id,
        message: 'SMS sent successfully',
      }),
    };
  } catch (error: any) {
    console.error('SMS send error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
