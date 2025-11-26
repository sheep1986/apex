// OpenAI Transcript Analyzer Service
// Analyzes call transcripts to determine outcomes and sentiment
// Now uses secure backend endpoint instead of exposing API keys

import { apiClient } from '../lib/api-client';

export interface TranscriptAnalysis {
  outcome: 'connected' | 'voicemail' | 'no_answer' | 'busy' | 'failed' | 'interested' | 'not_interested' | 'callback' | 'hung_up';
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  summary: string;
  keyPoints: string[];
  nextSteps?: string;
  callbackRequested: boolean;
  appointmentScheduled: boolean;
  interestedInProduct: boolean;
  // Enhanced analysis fields
  leadScore?: number;
  nextBestAction?: string;
  callbackTiming?: string;
  keyObjections?: string[];
  buyingSignals?: string[];
  urgencyLevel?: string;
  engagementLevel?: number;
}

/**
 * Analyze transcript using backend API endpoint (secure)
 * This keeps OpenAI API keys on the server, not in the frontend
 */
export async function analyzeTranscriptWithOpenAI(
  transcript: string,
  callId?: string,
  campaignId?: string,
  apiKey?: string // Deprecated parameter for backwards compatibility
): Promise<TranscriptAnalysis> {
  try {
    // Get organization ID from localStorage
    const organizationId = localStorage.getItem('organization_id');

    if (!organizationId) {
      console.warn('No organization ID found, using fallback analysis');
      return fallbackAnalysis(transcript);
    }

    // Call backend API for analysis
    const response = await apiClient.post('/transcript-analysis', {
      transcript,
      callId,
      campaignId,
      organizationId
    });

    if (!response.data.success) {
      throw new Error('Analysis failed');
    }

    const analysis = response.data.analysis;

    // Map backend response to our interface
    return {
      outcome: analysis.outcome || 'connected',
      sentiment: analysis.sentiment || 'neutral',
      confidence: analysis.confidence || 0.8,
      summary: analysis.summary || 'Call completed',
      keyPoints: analysis.keyPoints || [],
      nextSteps: analysis.suggestedFollowUp,
      callbackRequested: analysis.nextBestAction === 'call_back' || analysis.callbackTiming !== 'never',
      appointmentScheduled: analysis.nextBestAction === 'schedule_meeting',
      interestedInProduct: analysis.leadScore > 60,
      // Enhanced fields
      leadScore: analysis.leadScore,
      nextBestAction: analysis.nextBestAction,
      callbackTiming: analysis.callbackTiming,
      keyObjections: analysis.keyObjections,
      buyingSignals: analysis.buyingSignals,
      urgencyLevel: analysis.urgencyLevel,
      engagementLevel: analysis.engagementLevel
    };
  } catch (error: any) {
    console.error('Backend transcript analysis failed:', error);
    console.warn('Falling back to keyword-based analysis');
    return fallbackAnalysis(transcript);
  }
}

// Fallback analysis when OpenAI is not available
function fallbackAnalysis(transcript: string): TranscriptAnalysis {
  const lowerTranscript = transcript.toLowerCase();
  
  // Detect outcomes based on keywords
  let outcome: TranscriptAnalysis['outcome'] = 'connected';
  let sentiment: TranscriptAnalysis['sentiment'] = 'neutral';
  let callbackRequested = false;
  let appointmentScheduled = false;
  let interestedInProduct = false;
  
  // Check for specific outcomes
  if (lowerTranscript.includes('hung up') || lowerTranscript.includes('call ended')) {
    outcome = 'hung_up';
    sentiment = 'negative';
  } else if (lowerTranscript.includes('voicemail') || lowerTranscript.includes('leave a message')) {
    outcome = 'voicemail';
  } else if (lowerTranscript.includes('call me back') || lowerTranscript.includes('call back later')) {
    outcome = 'callback';
    callbackRequested = true;
  } else if (
    lowerTranscript.includes('interested') || 
    lowerTranscript.includes('sounds good') ||
    lowerTranscript.includes('tell me more') ||
    lowerTranscript.includes('yes') && lowerTranscript.includes('appointment')
  ) {
    outcome = 'interested';
    sentiment = 'positive';
    interestedInProduct = true;
  } else if (
    lowerTranscript.includes('not interested') || 
    lowerTranscript.includes("don't need") ||
    lowerTranscript.includes('no thank')
  ) {
    outcome = 'not_interested';
    sentiment = 'negative';
  }
  
  // Check for appointment scheduling
  if (
    lowerTranscript.includes('appointment') || 
    lowerTranscript.includes('schedule') ||
    lowerTranscript.includes('saturday at') ||
    lowerTranscript.includes('monday at') ||
    lowerTranscript.includes('tuesday at') ||
    lowerTranscript.includes('wednesday at') ||
    lowerTranscript.includes('thursday at') ||
    lowerTranscript.includes('friday at')
  ) {
    appointmentScheduled = true;
    sentiment = 'positive';
    outcome = 'interested';
    interestedInProduct = true;
  }
  
  // Extract key points from the transcript
  const keyPoints: string[] = [];
  
  if (appointmentScheduled) {
    keyPoints.push('Appointment scheduled');
  }
  if (callbackRequested) {
    keyPoints.push('Callback requested');
  }
  if (interestedInProduct) {
    keyPoints.push('Customer showed interest');
  }
  if (lowerTranscript.includes('solar')) {
    keyPoints.push('Discussed solar energy');
  }
  if (lowerTranscript.includes('consultation')) {
    keyPoints.push('Free consultation offered');
  }
  
  // Generate summary
  let summary = 'Call completed. ';
  if (appointmentScheduled) {
    summary = 'Appointment successfully scheduled. ';
  } else if (callbackRequested) {
    summary = 'Customer requested a callback. ';
  } else if (outcome === 'interested') {
    summary = 'Customer expressed interest. ';
  } else if (outcome === 'not_interested') {
    summary = 'Customer declined the offer. ';
  }
  
  return {
    outcome,
    sentiment,
    confidence: 0.7, // Lower confidence for fallback analysis
    summary,
    keyPoints,
    nextSteps: appointmentScheduled ? 'Follow up before appointment' : 
               callbackRequested ? 'Schedule callback' :
               outcome === 'interested' ? 'Send follow-up information' : undefined,
    callbackRequested,
    appointmentScheduled,
    interestedInProduct
  };
}

// Analyze multiple calls in batch using backend endpoint
export async function analyzeCallsBatch(
  calls: Array<{ id: string; transcript: string; callId?: string; campaignId?: string }>,
  apiKey?: string // Deprecated
): Promise<Map<string, TranscriptAnalysis>> {
  try {
    const organizationId = localStorage.getItem('organization_id');

    if (!organizationId) {
      console.warn('No organization ID, falling back to individual analysis');
      return fallbackBatchAnalysis(calls);
    }

    // Use backend batch endpoint for better performance
    const response = await apiClient.post('/transcript-analysis/batch', {
      transcripts: calls.map(call => ({
        callId: call.callId || call.id,
        transcript: call.transcript,
        campaignId: call.campaignId
      })),
      organizationId
    });

    const results = new Map<string, TranscriptAnalysis>();

    if (response.data.success && response.data.results) {
      response.data.results.forEach((result: any) => {
        if (result.analysis) {
          const analysis = result.analysis;
          results.set(result.callId, {
            outcome: analysis.outcome || 'connected',
            sentiment: analysis.sentiment || 'neutral',
            confidence: analysis.confidence || 0.8,
            summary: analysis.summary || 'Call completed',
            keyPoints: analysis.keyPoints || [],
            nextSteps: analysis.suggestedFollowUp,
            callbackRequested: analysis.nextBestAction === 'call_back',
            appointmentScheduled: analysis.nextBestAction === 'schedule_meeting',
            interestedInProduct: analysis.leadScore > 60,
            leadScore: analysis.leadScore,
            nextBestAction: analysis.nextBestAction,
            callbackTiming: analysis.callbackTiming,
            keyObjections: analysis.keyObjections,
            buyingSignals: analysis.buyingSignals,
            urgencyLevel: analysis.urgencyLevel,
            engagementLevel: analysis.engagementLevel
          });
        }
      });
    }

    return results;
  } catch (error) {
    console.error('Batch analysis failed:', error);
    return fallbackBatchAnalysis(calls);
  }
}

// Fallback batch analysis
function fallbackBatchAnalysis(
  calls: Array<{ id: string; transcript: string }>
): Map<string, TranscriptAnalysis> {
  const results = new Map<string, TranscriptAnalysis>();

  calls.forEach(call => {
    results.set(call.id, fallbackAnalysis(call.transcript));
  });

  return results;
}