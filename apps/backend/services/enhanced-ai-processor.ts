/**
 * Enhanced AI Processor for Call Analysis and CRM Integration
 * Uses VAPI's built-in analysis (summary, successEvaluation, structuredData)
 * instead of requiring OpenAI for transcript analysis
 */

import supabase from './supabase-client';

interface VapiCallData {
  id?: string;
  transcript?: string;
  summary?: string;
  analysis?: {
    summary?: string;
    structuredData?: any;
    successEvaluation?: string;
    userSentiment?: 'positive' | 'negative' | 'neutral';
  };
  customer?: {
    number?: string;
    name?: string;
  };
  cost?: number;
  duration?: number;
  startedAt?: string;
  endedAt?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
}

interface CallAnalysisResult {
  outcome: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
  isPositiveLead: boolean;
  structuredData: {
    contactName?: string;
    email?: string;
    phone?: string;
    company?: string;
    interestLevel?: string;
    appointmentScheduled?: boolean;
    appointmentDate?: string;
    callbackRequested?: boolean;
    decisionMaker?: boolean;
    objections?: string[];
    nextSteps?: string;
    doNotCall?: boolean;
  };
  confidence: number;
}

/**
 * Process call with enhanced AI using VAPI's built-in analysis
 */
export async function processCallWithEnhancedAI(
  callId: string,
  transcript: string,
  vapiCallData: VapiCallData
): Promise<void> {
  console.log('🤖 Enhanced AI Processing for call:', callId);

  try {
    // Extract analysis from VAPI data
    const analysis = analyzeVapiCallData(vapiCallData, transcript);

    console.log('📊 Analysis result:', {
      outcome: analysis.outcome,
      sentiment: analysis.sentiment,
      isPositiveLead: analysis.isPositiveLead,
      hasStructuredData: !!Object.keys(analysis.structuredData).length
    });

    // Update call record with analysis
    const updateData: any = {
      outcome: analysis.outcome,
      sentiment: analysis.sentiment,
      summary: analysis.summary,
      status: 'completed',
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('calls')
      .update(updateData)
      .eq('id', callId);

    if (updateError) {
      console.error('❌ Error updating call with analysis:', updateError);
    }

    // If positive lead, push to CRM
    if (analysis.isPositiveLead) {
      console.log('✅ Positive lead detected! Pushing to CRM...');
      await pushLeadToCRM(callId, vapiCallData, analysis);
    } else {
      console.log('⚠️ Call not marked as positive lead, skipping CRM push');
    }

  } catch (error) {
    console.error('❌ Enhanced AI processing failed:', error);

    // Update call status to completed even if processing fails
    await supabase
      .from('calls')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', callId);
  }
}

/**
 * Analyze VAPI call data without requiring OpenAI
 */
function analyzeVapiCallData(vapiData: VapiCallData, transcript: string): CallAnalysisResult {
  const analysis = vapiData.analysis || {};
  const structuredData = analysis.structuredData || {};

  // Use VAPI's successEvaluation if available
  const successEvaluation = analysis.successEvaluation?.toLowerCase() || '';
  const vapiSummary = analysis.summary || vapiData.summary || '';
  const userSentiment = analysis.userSentiment || 'neutral';

  // Determine if positive lead based on VAPI's evaluation
  let isPositiveLead = false;
  let confidence = 0.5;

  // Check VAPI's success evaluation first (most reliable)
  if (successEvaluation === 'true' || successEvaluation === 'success' || successEvaluation === 'yes') {
    isPositiveLead = true;
    confidence = 0.9;
  } else if (successEvaluation === 'false' || successEvaluation === 'failure' || successEvaluation === 'no') {
    isPositiveLead = false;
    confidence = 0.9;
  }

  // Check structured data for positive indicators
  if (structuredData.interestedInProduct === true ||
      structuredData.interestLevel === 'high' ||
      structuredData.interestLevel === 'very interested') {
    isPositiveLead = true;
    confidence = Math.max(confidence, 0.85);
  }

  if (structuredData.appointmentScheduled === true) {
    isPositiveLead = true;
    confidence = 0.95;
  }

  // Fallback to keyword analysis if no VAPI analysis
  if (!analysis.successEvaluation && !structuredData.interestLevel) {
    const keywordAnalysis = analyzeTranscriptKeywords(transcript);
    isPositiveLead = keywordAnalysis.isPositive;
    confidence = keywordAnalysis.confidence;
  }

  // Determine outcome
  let outcome = 'connected';
  if (isPositiveLead) {
    outcome = structuredData.appointmentScheduled ? 'appointment_scheduled' : 'interested';
  } else if (structuredData.callbackRequested) {
    outcome = 'callback_requested';
  } else if (structuredData.doNotCall) {
    outcome = 'do_not_call';
  }

  // Map VAPI sentiment to our sentiment
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (userSentiment === 'positive' || isPositiveLead) {
    sentiment = 'positive';
  } else if (userSentiment === 'negative') {
    sentiment = 'negative';
  }

  return {
    outcome,
    sentiment,
    summary: vapiSummary || generateSummaryFromTranscript(transcript),
    isPositiveLead,
    structuredData: {
      contactName: structuredData.contactName || vapiData.customer?.name,
      email: structuredData.email,
      phone: structuredData.phone || vapiData.customer?.number,
      company: structuredData.company,
      interestLevel: structuredData.interestLevel,
      appointmentScheduled: structuredData.appointmentScheduled,
      appointmentDate: structuredData.appointmentDate,
      callbackRequested: structuredData.askedToCallBack || structuredData.callbackRequested,
      decisionMaker: structuredData.decisionMaker,
      objections: structuredData.objections,
      nextSteps: structuredData.nextSteps,
      doNotCall: structuredData.doNotCall
    },
    confidence
  };
}

/**
 * Fallback keyword analysis when VAPI analysis is not available
 */
function analyzeTranscriptKeywords(transcript: string): { isPositive: boolean; confidence: number } {
  const lowerTranscript = transcript.toLowerCase();

  const positiveKeywords = [
    'interested',
    'sounds good',
    'tell me more',
    'schedule',
    'appointment',
    'yes',
    'absolutely',
    'definitely',
    'perfect',
    'great',
    'wonderful',
    'love to',
    'sign up',
    'sign me up',
    'let\'s do it',
    'come by',
    'visit'
  ];

  const negativeKeywords = [
    'not interested',
    'no thank',
    'don\'t need',
    'don\'t want',
    'remove me',
    'stop calling',
    'do not call',
    'busy',
    'wrong number',
    'can\'t talk',
    'hang up'
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  for (const keyword of positiveKeywords) {
    if (lowerTranscript.includes(keyword)) {
      positiveScore++;
    }
  }

  for (const keyword of negativeKeywords) {
    if (lowerTranscript.includes(keyword)) {
      negativeScore++;
    }
  }

  const isPositive = positiveScore > negativeScore && positiveScore >= 2;
  const totalScore = positiveScore + negativeScore;
  const confidence = totalScore > 0 ? Math.min(0.7, 0.4 + (positiveScore / totalScore) * 0.3) : 0.4;

  return { isPositive, confidence };
}

/**
 * Generate a basic summary from transcript
 */
function generateSummaryFromTranscript(transcript: string): string {
  if (!transcript) return 'Call completed';

  const lines = transcript.split('\n').filter(line => line.trim());
  if (lines.length === 0) return 'Call completed';

  // Take first and last few lines for context
  const previewLines = lines.slice(0, 3).concat(lines.slice(-2));
  const preview = previewLines.join(' ').substring(0, 200);

  return `Call transcript: ${preview}...`;
}

/**
 * Push positive lead to CRM (leads table)
 */
async function pushLeadToCRM(
  callId: string,
  vapiData: VapiCallData,
  analysis: CallAnalysisResult
): Promise<void> {
  try {
    // Get the call record to find campaign and organization
    const { data: callRecord, error: callError } = await supabase
      .from('calls')
      .select('campaign_id, organization_id, customer_phone, customer_name')
      .eq('id', callId)
      .single();

    if (callError || !callRecord) {
      console.error('❌ Could not find call record for CRM push:', callError);
      return;
    }

    // Check if lead already exists for this phone number
    const phone = analysis.structuredData.phone || callRecord.customer_phone;
    if (!phone) {
      console.error('❌ No phone number available for lead creation');
      return;
    }

    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .eq('organization_id', callRecord.organization_id)
      .single();

    if (existingLead) {
      console.log('📋 Lead already exists, updating...');

      // Update existing lead with new call information
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: analysis.structuredData.appointmentScheduled ? 'qualified' : 'contacted',
          last_contact_date: new Date().toISOString(),
          notes: `Updated from call on ${new Date().toLocaleDateString()}: ${analysis.summary}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('❌ Error updating existing lead:', updateError);
      } else {
        console.log('✅ Existing lead updated successfully');
      }
      return;
    }

    // Parse contact name
    const fullName = analysis.structuredData.contactName || callRecord.customer_name || 'Unknown Contact';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create new lead
    const leadData = {
      organization_id: callRecord.organization_id,
      campaign_id: callRecord.campaign_id,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      email: analysis.structuredData.email || null,
      company: analysis.structuredData.company || null,
      status: analysis.structuredData.appointmentScheduled ? 'qualified' : 'new',
      source: 'vapi_call',
      notes: `Created from AI call on ${new Date().toLocaleDateString()}\n\nSummary: ${analysis.summary}\n\nInterest Level: ${analysis.structuredData.interestLevel || 'High'}\n\nAppointment: ${analysis.structuredData.appointmentScheduled ? 'Yes - ' + (analysis.structuredData.appointmentDate || 'TBD') : 'No'}`,
      score: analysis.structuredData.appointmentScheduled ? 90 : 70,
      last_contact_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating lead in CRM:', insertError);
      return;
    }

    console.log('✅ Lead created successfully in CRM:', newLead.id);

    // Update call record to link to the lead
    await supabase
      .from('calls')
      .update({
        lead_id: newLead.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', callId);

  } catch (error) {
    console.error('❌ Error pushing lead to CRM:', error);
  }
}
