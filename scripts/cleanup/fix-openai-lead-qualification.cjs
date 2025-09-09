const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

// OpenAI API key - MUST be set in environment variable
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is required');
  console.log('   Set it with: export OPENAI_API_KEY=your-key-here');
  process.exit(1);
}

const LEAD_QUALIFICATION_PROMPT = `You are an AI assistant analyzing sales call transcripts for solar panel lead qualification.

Analyze the transcript and provide a JSON response with:
1. score: 1-10 rating of lead quality
2. qualified: boolean (true if score >= 7)
3. interest_level: "high", "medium", "low", or "none"
4. pain_points: array of identified pain points (high energy bills, environmental concerns, etc)
5. objections: array of any objections raised
6. next_action: recommended next step
7. summary: brief 2-3 sentence summary
8. appointment_booked: boolean if appointment was scheduled
9. callback_requested: boolean if they want a callback
10. property_suitable: boolean if property seems suitable for solar

Key scoring criteria:
- 9-10: Hot lead - appointment booked, high interest, suitable property
- 7-8: Warm lead - interested, needs follow-up, few objections
- 5-6: Cool lead - some interest but significant objections
- 3-4: Cold lead - minimal interest, major objections
- 1-2: Not interested or hostile

Return ONLY valid JSON, no additional text.`;

async function callOpenAI(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.3,
      max_tokens: 500
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.error) {
            reject(new Error(parsed.error.message));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function analyzeCallTranscript(transcript, callData) {
  try {
    const completion = await callOpenAI([
      {
        role: "system",
        content: LEAD_QUALIFICATION_PROMPT
      },
      {
        role: "user",
        content: `Analyze this call transcript:\n\nDuration: ${callData.duration || 0} seconds\nOutcome: ${callData.outcome || 'unknown'}\n\nTranscript:\n${transcript}`
      }
    ]);

    const response = completion.choices[0].message.content;
    
    // Parse JSON response
    try {
      const analysis = JSON.parse(response);
      return {
        success: true,
        analysis
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', response);
      return {
        success: false,
        error: 'Invalid JSON response',
        rawResponse: response
      };
    }
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function updateLeadWithAIAnalysis(leadId, analysis) {
  const { error } = await supabase
    .from('leads')
    .update({
      ai_score: analysis.score,
      ai_qualified: analysis.qualified,
      ai_interest_level: analysis.interest_level,
      ai_summary: analysis.summary,
      ai_next_action: analysis.next_action,
      ai_pain_points: analysis.pain_points,
      ai_objections: analysis.objections,
      appointment_booked: analysis.appointment_booked,
      callback_requested: analysis.callback_requested,
      property_suitable: analysis.property_suitable,
      ai_processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', leadId);
  
  return !error;
}

async function processCallsWithAI() {
  console.log('🤖 Starting AI Lead Qualification Process...\n');
  
  // Get all calls with transcripts that haven't been AI processed
  const { data: calls, error } = await supabase
    .from('calls')
    .select(`
      *,
      leads (
        id,
        ai_processed_at,
        ai_score
      )
    `)
    .not('transcript', 'is', null)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching calls:', error);
    return;
  }
  
  console.log(`Found ${calls.length} calls with transcripts\n`);
  
  let processed = 0;
  let failed = 0;
  
  for (const call of calls) {
    // Skip if no lead associated
    if (!call.lead_id) {
      console.log(`⚠️  Call ${call.id} has no associated lead`);
      continue;
    }
    
    // Skip if already AI processed (unless forced)
    if (call.leads?.ai_processed_at && !process.argv.includes('--force')) {
      console.log(`✓ Lead ${call.lead_id} already processed (score: ${call.leads.ai_score})`);
      continue;
    }
    
    console.log(`\n📞 Processing call ${call.id}...`);
    console.log(`   Campaign: ${call.campaign_id}`);
    console.log(`   Duration: ${call.duration}s`);
    console.log(`   Transcript length: ${call.transcript.length} chars`);
    
    // Analyze with OpenAI
    const result = await analyzeCallTranscript(call.transcript, call);
    
    if (result.success) {
      console.log(`   ✅ AI Analysis Complete:`);
      console.log(`      Score: ${result.analysis.score}/10`);
      console.log(`      Qualified: ${result.analysis.qualified ? 'Yes' : 'No'}`);
      console.log(`      Interest: ${result.analysis.interest_level}`);
      console.log(`      Next Action: ${result.analysis.next_action}`);
      
      // Update the lead with AI analysis
      const updated = await updateLeadWithAIAnalysis(call.lead_id, result.analysis);
      
      if (updated) {
        console.log(`   ✅ Lead updated successfully`);
        processed++;
      } else {
        console.log(`   ❌ Failed to update lead`);
        failed++;
      }
    } else {
      console.log(`   ❌ AI Analysis Failed: ${result.error}`);
      failed++;
    }
    
    // Rate limiting - avoid hitting OpenAI too fast
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 AI Lead Qualification Summary:');
  console.log(`   ✅ Successfully processed: ${processed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏭️  Skipped (already processed): ${calls.length - processed - failed}`);
  
  // Show qualified leads
  const { data: qualifiedLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('ai_qualified', true)
    .order('ai_score', { ascending: false });
  
  if (qualifiedLeads && qualifiedLeads.length > 0) {
    console.log('\n🌟 Qualified Leads:');
    qualifiedLeads.forEach(lead => {
      console.log(`   - ${lead.first_name} ${lead.last_name} (Score: ${lead.ai_score}/10)`);
      console.log(`     Next: ${lead.ai_next_action}`);
    });
  }
}

// Add database columns if they don't exist
async function ensureAIColumns() {
  console.log('🔧 Checking database schema...\n');
  
  // This would normally be done via migration, but for quick fix:
  const sqlCommands = [
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score INTEGER`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_qualified BOOLEAN DEFAULT false`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_interest_level TEXT`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_summary TEXT`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_next_action TEXT`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_pain_points JSONB`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_objections JSONB`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS appointment_booked BOOLEAN DEFAULT false`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS callback_requested BOOLEAN DEFAULT false`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_suitable BOOLEAN`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMP WITH TIME ZONE`
  ];
  
  console.log('Note: Run these SQL commands in Supabase SQL Editor if columns are missing:');
  sqlCommands.forEach(cmd => console.log(cmd + ';'));
  console.log('');
}

// Test with a single call first
async function testSingleCall() {
  const { data: call } = await supabase
    .from('calls')
    .select('*')
    .not('transcript', 'is', null)
    .limit(1)
    .single();
  
  if (!call) {
    console.log('No calls with transcripts found');
    return;
  }
  
  console.log('🧪 Testing with single call...');
  console.log(`   Call ID: ${call.id}`);
  console.log(`   Transcript preview: ${call.transcript.substring(0, 200)}...`);
  
  const result = await analyzeCallTranscript(call.transcript, call);
  
  if (result.success) {
    console.log('\n✅ Test successful! AI Analysis:');
    console.log(JSON.stringify(result.analysis, null, 2));
  } else {
    console.log('\n❌ Test failed:', result.error);
    if (result.rawResponse) {
      console.log('Raw response:', result.rawResponse);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testSingleCall();
  } else if (args.includes('--schema')) {
    await ensureAIColumns();
  } else {
    await ensureAIColumns();
    await processCallsWithAI();
  }
}

main().catch(console.error);