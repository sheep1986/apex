// OpenAI Transcript Analyzer Service
// Analyzes call transcripts to determine outcomes and sentiment

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
}

export async function analyzeTranscriptWithOpenAI(
  transcript: string,
  apiKey?: string
): Promise<TranscriptAnalysis> {
  // Use environment variable if no API key provided
  const openaiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!openaiKey) {
    console.warn('No OpenAI API key found, using fallback analysis');
    return fallbackAnalysis(transcript);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert call analyst. Analyze the following call transcript and provide a detailed analysis in JSON format.

Determine:
1. Call outcome - Choose from: connected, voicemail, no_answer, busy, failed, interested, not_interested, callback, hung_up
2. Sentiment - positive, neutral, or negative
3. Whether a callback was requested
4. Whether an appointment was scheduled
5. Whether the customer showed interest in the product/service

Rules for outcomes:
- "interested": Customer shows clear interest in the product/service
- "not_interested": Customer explicitly declines or shows no interest
- "callback": Customer requests to be called back later
- "hung_up": Call ended abruptly or customer hung up
- "connected": Call was answered and completed normally
- "voicemail": Left a voicemail message
- "no_answer": No one answered
- "busy": Line was busy
- "failed": Technical failure

Provide response in this exact JSON format:
{
  "outcome": "string",
  "sentiment": "string",
  "confidence": number (0-1),
  "summary": "string",
  "keyPoints": ["string"],
  "nextSteps": "string",
  "callbackRequested": boolean,
  "appointmentScheduled": boolean,
  "interestedInProduct": boolean
}`
          },
          {
            role: 'user',
            content: `Analyze this call transcript:\n\n${transcript}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    return {
      outcome: analysis.outcome || 'connected',
      sentiment: analysis.sentiment || 'neutral',
      confidence: analysis.confidence || 0.5,
      summary: analysis.summary || 'Call completed',
      keyPoints: analysis.keyPoints || [],
      nextSteps: analysis.nextSteps,
      callbackRequested: analysis.callbackRequested || false,
      appointmentScheduled: analysis.appointmentScheduled || false,
      interestedInProduct: analysis.interestedInProduct || false
    };
  } catch (error) {
    console.error('OpenAI analysis failed:', error);
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

// Analyze multiple calls in batch
export async function analyzeCallsBatch(
  calls: Array<{ id: string; transcript: string }>,
  apiKey?: string
): Promise<Map<string, TranscriptAnalysis>> {
  const results = new Map<string, TranscriptAnalysis>();
  
  // Process in parallel but limit concurrency to avoid rate limits
  const batchSize = 3;
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    const analyses = await Promise.all(
      batch.map(call => analyzeTranscriptWithOpenAI(call.transcript, apiKey))
    );
    
    batch.forEach((call, index) => {
      results.set(call.id, analyses[index]);
    });
  }
  
  return results;
}