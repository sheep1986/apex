// Enable TypeScript support for importing .ts files
require('ts-node/register');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Vercel
app.set('trust proxy', true);

// CORS configuration
const allowedOrigins = [
  'https://cheery-hamster-593ff7.netlify.app',
  'https://tourmaline-hummingbird-cdcef0.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'http://localhost:5522',
  'http://localhost:3000',
  'http://localhost:8080'
];

if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  console.log(`🔍 CORS: ${req.method} ${req.path} from origin: ${origin || 'no-origin'}`);
  
  if (origin) {
    if (allowedOrigins.includes(origin) || origin.endsWith('.netlify.app')) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      console.log('✅ CORS allowed for:', origin);
    } else {
      console.log('❌ CORS blocked for:', origin);
    }
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers,X-Org-Id,X-User-Id,X-Request-Id');
  res.header('Access-Control-Expose-Headers', 'Content-Length,Content-Range,X-Content-Range');
  res.header('Access-Control-Max-Age', '86400');
  res.header('Vary', 'Origin');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight OPTIONS request handled');
    return res.status(204).end();
  }
  
  next();
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.3.0-simple',
    cors: {
      configured: true,
      cors_origin: process.env.CORS_ORIGIN || 'not set',
      frontend_url: process.env.FRONTEND_URL || 'not set',
      netlify_allowed: true,
      bulletproof: true
    }
  });
});

// Diagnostic endpoint for deployment verification
app.get('/__meta', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const distApi = path.join(__dirname, 'api');
  let files = [];
  try { 
    files = fs.readdirSync(distApi); 
  } catch {}
  
  res.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    node: process.version,
    distApiFiles: files,
    now: new Date().toISOString(),
    buildInfo: {
      vercelBuild: !!process.env.VERCEL,
      distExists: fs.existsSync(__dirname),
      apiDirExists: fs.existsSync(distApi)
    }
  });
});

// Basic VAPI data endpoint (simplified)
app.get('/api/vapi-data', (req, res) => {
  res.json({
    message: 'VAPI data endpoint is working',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

// Transcript Analysis endpoint - AI-powered call analysis
app.post('/api/transcript-analysis', async (req, res) => {
  try {
    const OpenAI = require('openai');
    const { createClient } = require('@supabase/supabase-js');

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

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // System prompt for GPT-4
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

    // Call OpenAI GPT-4
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

    // Structure the response
    const enhancedAnalysis = {
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

    // Update database if callId provided
    if (callId && organizationId) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        );

        const { error: updateError } = await supabase
          .from('calls')
          .update({
            sentiment: enhancedAnalysis.sentiment,
            outcome: enhancedAnalysis.outcome,
            summary: enhancedAnalysis.summary,
            analysis: {
              leadScore: enhancedAnalysis.leadScore,
              nextBestAction: enhancedAnalysis.nextBestAction,
              callbackTiming: enhancedAnalysis.callbackTiming,
              keyObjections: enhancedAnalysis.keyObjections,
              buyingSignals: enhancedAnalysis.buyingSignals,
              competitorsMentioned: enhancedAnalysis.competitorsMentioned,
              urgencyLevel: enhancedAnalysis.urgencyLevel,
              talkToListenRatio: enhancedAnalysis.talkToListenRatio,
              engagementLevel: enhancedAnalysis.engagementLevel,
              keyPoints: enhancedAnalysis.keyPoints,
              suggestedFollowUp: enhancedAnalysis.suggestedFollowUp
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
      analysis: enhancedAnalysis
    });

  } catch (error) {
    console.error('❌ Transcript analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message || 'Internal server error'
    });
  }
});

// Organization Settings endpoints
app.get('/api/organization-settings/:settingKey', async (req, res) => {
  try {
    const { settingKey } = req.params;
    const organizationId = req.headers['x-organization-id'];

    if (!organizationId) {
      return res.status(400).json({
        error: 'Missing organization ID',
        message: 'x-organization-id header is required'
      });
    }

    console.log(`🔍 Fetching setting "${settingKey}" for organization:`, organizationId);

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );

    // Get the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.error('❌ Error fetching organization:', orgError);
      return res.status(404).json({
        error: 'Organization not found',
        message: orgError?.message || 'Organization does not exist'
      });
    }

    // Setting defaults
    const settingDefaults = {
      'max_concurrent_calls': 5,
      'default_working_hours': {
        start: '09:00',
        end: '17:00',
        timezone: 'America/New_York'
      },
      'compliance_settings': {
        enableDNC: true,
        respectOptOuts: true,
        recordCalls: true,
        maxCallsPerContact: 3
      },
      'vapi/credentials': {
        apiKey: org.vapi_api_key || '',
        organizationId: organizationId
      }
    };

    let settingValue = settingDefaults[settingKey];

    // For VAPI credentials, pull from organization
    if (settingKey === 'vapi/credentials') {
      settingValue = {
        apiKey: org.vapi_api_key || '',
        organizationId: organizationId,
        phoneNumberIds: org.vapi_phone_number_ids || [],
        assistantIds: org.vapi_assistant_ids || []
      };
    }

    // For max_concurrent_calls, check if org has a setting
    if (settingKey === 'max_concurrent_calls') {
      settingValue = org.max_concurrent_calls || settingDefaults[settingKey];
    }

    if (settingValue === undefined) {
      return res.status(404).json({
        error: 'Setting not found',
        message: `Setting "${settingKey}" does not exist`
      });
    }

    console.log(`✅ Setting "${settingKey}" retrieved`);

    res.json({
      settingKey,
      value: settingValue,
      organizationId
    });
  } catch (error) {
    console.error('❌ Error fetching organization setting:', error);
    res.status(500).json({
      error: 'Failed to fetch setting',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Campaign executor endpoint for manual triggering or Vercel cron
app.get('/api/trigger-campaign-executor', async (req, res) => {
  console.log('🎯 Campaign executor endpoint called...');

  try {
    const { campaignExecutor } = require('./services/campaign-executor');
    await campaignExecutor.processCampaigns();
    res.json({
      success: true,
      message: 'Campaign processing triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Campaign executor error:', error);
    res.status(500).json({
      error: 'Campaign processing failed',
      message: error.message
    });
  }
});

// Export for Vercel
module.exports = app;

// Start server if not in Vercel
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Apex AI Calling Platform API Server (Simple) running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔍 Meta endpoint: http://localhost:${PORT}/__meta`);
    console.log(`⚠️  Note: Campaign executor is NOT running automatically on Vercel`);
    console.log(`    Use /api/trigger-campaign-executor or set up Vercel Cron`);
  });
}