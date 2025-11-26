import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Enhanced Transcript Analysis Interface
 * This provides comprehensive AI-driven insights for call transcripts
 */
interface EnhancedAnalysis {
  // Basic analysis
  sentiment: 'positive' | 'neutral' | 'negative';
  outcome: string;
  confidence: number;

  // Advanced AI-driven features
  leadScore: number; // 0-100, predicted conversion probability
  nextBestAction: 'call_back' | 'email' | 'schedule_meeting' | 'no_action' | 'close_deal';
  callbackTiming: 'immediate' | '1_day' | '3_days' | '1_week' | 'never';

  // Detailed insights
  keyObjections: string[]; // What objections did prospect raise?
  buyingSignals: string[]; // Indicators of interest
  competitorsMentioned: string[];
  urgencyLevel: 'high' | 'medium' | 'low';

  // Call quality metrics
  talkToListenRatio: number; // How much did AI talk vs. listen?
  engagementLevel: number; // 0-100

  // Summary
  summary: string;
  keyPoints: string[];
  suggestedFollowUp: string;
}

/**
 * Analyze a single transcript with GPT-4
 */
async function analyzeTranscriptWithGPT4(transcript: string): Promise<EnhancedAnalysis> {
  const systemPrompt = `You are an expert sales call analyst. Analyze the following sales call transcript and provide comprehensive insights.

Your analysis should include:
1. Overall sentiment (positive, neutral, or negative)
2. Call outcome (interested, not_interested, callback, voicemail, etc.)
3. Lead score (0-100) - likelihood of conversion
4. Next best action (call_back, email, schedule_meeting, no_action, close_deal)
5. When to follow up (immediate, 1_day, 3_days, 1_week, never)
6. Key objections raised by the prospect
7. Buying signals (indicators they're interested)
8. Competitors mentioned
9. Urgency level (high, medium, low)
10. Talk-to-listen ratio (estimate percentage AI talked vs. listened)
11. Engagement level (0-100)
12. A concise summary
13. Key points from the conversation
14. Suggested follow-up message

Return your analysis as valid JSON matching this structure:
{
  "sentiment": "positive|neutral|negative",
  "outcome": "interested|not_interested|callback|voicemail|no_answer|gatekeeper|wrong_number",
  "confidence": 0.0-1.0,
  "leadScore": 0-100,
  "nextBestAction": "call_back|email|schedule_meeting|no_action|close_deal",
  "callbackTiming": "immediate|1_day|3_days|1_week|never",
  "keyObjections": ["objection1", "objection2"],
  "buyingSignals": ["signal1", "signal2"],
  "competitorsMentioned": ["competitor1"],
  "urgencyLevel": "high|medium|low",
  "talkToListenRatio": 0.0-1.0,
  "engagementLevel": 0-100,
  "summary": "Brief summary",
  "keyPoints": ["point1", "point2"],
  "suggestedFollowUp": "Follow-up message"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this call transcript:\n\n${transcript}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');

    return {
      sentiment: analysis.sentiment || 'neutral',
      outcome: analysis.outcome || 'unknown',
      confidence: analysis.confidence || 0.8,
      leadScore: analysis.leadScore || 50,
      nextBestAction: analysis.nextBestAction || 'no_action',
      callbackTiming: analysis.callbackTiming || 'never',
      keyObjections: analysis.keyObjections || [],
      buyingSignals: analysis.buyingSignals || [],
      competitorsMentioned: analysis.competitorsMentioned || [],
      urgencyLevel: analysis.urgencyLevel || 'low',
      talkToListenRatio: analysis.talkToListenRatio || 0.5,
      engagementLevel: analysis.engagementLevel || 50,
      summary: analysis.summary || '',
      keyPoints: analysis.keyPoints || [],
      suggestedFollowUp: analysis.suggestedFollowUp || ''
    };
  } catch (error: any) {
    console.error('Error analyzing transcript with GPT-4:', error);
    throw new Error(`GPT-4 analysis failed: ${error.message}`);
  }
}

/**
 * POST /api/transcript-analysis
 * Analyze a call transcript with AI
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { transcript, callId, campaignId, organizationId } = req.body;

    // Validation
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Transcript text is required'
      });
    }

    if (transcript.length < 10) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Transcript too short for analysis'
      });
    }

    console.log('📝 Analyzing transcript...', {
      transcriptLength: transcript.length,
      callId,
      campaignId
    });

    // Perform AI analysis
    const analysis = await analyzeTranscriptWithGPT4(transcript);

    // If callId provided, update the call record in database
    if (callId && organizationId) {
      try {
        const { error: updateError } = await supabase
          .from('calls')
          .update({
            sentiment: analysis.sentiment,
            outcome: analysis.outcome,
            summary: analysis.summary,
            analysis: {
              leadScore: analysis.leadScore,
              nextBestAction: analysis.nextBestAction,
              callbackTiming: analysis.callbackTiming,
              keyObjections: analysis.keyObjections,
              buyingSignals: analysis.buyingSignals,
              competitorsMentioned: analysis.competitorsMentioned,
              urgencyLevel: analysis.urgencyLevel,
              talkToListenRatio: analysis.talkToListenRatio,
              engagementLevel: analysis.engagementLevel,
              keyPoints: analysis.keyPoints,
              suggestedFollowUp: analysis.suggestedFollowUp
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', callId)
          .eq('organization_id', organizationId);

        if (updateError) {
          console.error('❌ Error updating call record:', updateError);
        } else {
          console.log('✅ Call record updated with analysis');
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        // Don't fail the request if DB update fails
      }
    }

    res.json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error('❌ Transcript analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/transcript-analysis/batch
 * Analyze multiple transcripts in batch
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { transcripts, organizationId } = req.body;

    if (!Array.isArray(transcripts) || transcripts.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Transcripts array is required'
      });
    }

    if (transcripts.length > 50) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Maximum 50 transcripts per batch'
      });
    }

    console.log(`📝 Analyzing ${transcripts.length} transcripts in batch...`);

    // Process in chunks of 5 for rate limiting
    const results: Array<{ callId: string; analysis: EnhancedAnalysis }> = [];
    const chunkSize = 5;

    for (let i = 0; i < transcripts.length; i += chunkSize) {
      const chunk = transcripts.slice(i, i + chunkSize);

      const chunkResults = await Promise.all(
        chunk.map(async (item: any) => {
          try {
            const analysis = await analyzeTranscriptWithGPT4(item.transcript);

            // Update database if callId provided
            if (item.callId && organizationId) {
              await supabase
                .from('calls')
                .update({
                  sentiment: analysis.sentiment,
                  outcome: analysis.outcome,
                  summary: analysis.summary,
                  analysis: analysis,
                  updated_at: new Date().toISOString()
                })
                .eq('id', item.callId)
                .eq('organization_id', organizationId);
            }

            return {
              callId: item.callId,
              analysis
            };
          } catch (error: any) {
            console.error(`Error analyzing call ${item.callId}:`, error);
            return {
              callId: item.callId,
              error: error.message
            };
          }
        })
      );

      results.push(...chunkResults);

      // Small delay between chunks to respect rate limits
      if (i + chunkSize < transcripts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      success: true,
      results,
      processed: results.length,
      total: transcripts.length
    });

  } catch (error: any) {
    console.error('❌ Batch transcript analysis error:', error);
    res.status(500).json({
      error: 'Batch analysis failed',
      message: error.message || 'Internal server error'
    });
  }
});

export default router;
