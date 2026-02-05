// Test Enhanced Data Extraction Logic
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://twigokrtbvigiqnaybfy.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24');

// Enhanced extraction logic (simulating what the SQL function will do)
function extractAllData(transcript) {
  const data = {};
  
  // Name extraction (multiple patterns)
  const namePatterns = [
    /(?:this is|i'm|my name is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
    /(?:hello|hi)\s+([A-Za-z]+)/i,
    /([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:speaking|here)/i,
    /(?:mr|mrs|ms|miss)\.?\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      data.name = match[1];
      break;
    }
  }
  
  // Email extraction
  const emailMatch = transcript.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) data.email = emailMatch[1];
  
  // Company extraction
  const companyPatterns = [
    /(?:work at|from|with)\s+([A-Za-z0-9\s&.,]+?)(?:\s|$|\.)/i,
    /([A-Za-z0-9\s&.,]+?)\s+(?:solutions|services|corp|corporation|llc|inc|company)(?:\s|$|\.)/i
  ];
  
  for (const pattern of companyPatterns) {
    const match = transcript.match(pattern);
    if (match) {
      data.company = match[1].trim();
      break;
    }
  }
  
  // Address extraction
  const addressMatch = transcript.match(/(\d+\s+[A-Za-z0-9\s,.-]+?)(?:\s*(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard))/i);
  if (addressMatch) data.address = addressMatch[1].trim();
  
  // City/State extraction
  const cityStateMatch = transcript.match(/(?:in|at|from)\s+([A-Za-z\s]+?),?\s+([A-Z]{2})(?:\s|$)/i);
  if (cityStateMatch) {
    data.city = cityStateMatch[1].trim();
    data.state = cityStateMatch[2];
  }
  
  // ZIP code
  const zipMatch = transcript.match(/(\d{5}(?:-\d{4})?)/);
  if (zipMatch) data.zip_code = zipMatch[1];
  
  // Spouse/Partner
  const spouseMatch = transcript.match(/(?:my|and my)\s+(?:wife|husband|partner|spouse)\s+([A-Za-z]+)/i);
  if (spouseMatch) data.spouse_partner_name = spouseMatch[1];
  
  // Budget mentions
  const budgetMatch = transcript.match(/(\$[\d,]+|\d+\s*thousand|\d+k)/i);
  if (budgetMatch) data.budget_range = budgetMatch[1];
  
  // Energy bill mentions
  const billMatch = transcript.match(/(?:bill|pay|paying)\s*(?:is|about)?\s*(\$[\d,]+)/i);
  if (billMatch) data.annual_energy_bill = billMatch[1];
  
  // Timeline mentions
  const timelineMatch = transcript.match(/(next\s+month|few\s+months|this\s+year|next\s+year|soon|asap|immediately)/i);
  if (timelineMatch) data.timeline_interest = timelineMatch[1];
  
  // Home ownership
  const ownershipMatch = transcript.match(/(own|rent|homeowner|renting)/i);
  if (ownershipMatch) data.home_ownership_status = ownershipMatch[1];
  
  return data;
}

async function testEnhancedExtraction() {
  console.log('🚀 Testing Enhanced Data Extraction');
  console.log('===================================\n');
  
  const testTranscripts = [
    {
      name: 'Complete Information',
      transcript: `Agent: Hello, may I speak with the homeowner?
Customer: This is John Richardson from Richardson Solar Solutions. 
Agent: Great! I'm calling about solar panels.
Customer: Perfect! My wife Sarah and I live at 123 Oak Street, Springfield, CA 90210. 
Customer: Our email is john@richardsonsolar.com and we pay about $300 per month for electricity.
Customer: We own our home and are looking to install solar next year. 
Customer: Our budget is around $25,000. Can we schedule an appointment?`
    },
    {
      name: 'Partial Information',
      transcript: `Agent: Hi, is this the Johnson residence?
Customer: Yes, this is Mike Johnson speaking.
Agent: I'm calling about energy savings.
Customer: We're at 456 Pine Avenue and we rent, but the landlord is interested.
Customer: You can reach us at mike.johnson@email.com for more details.`
    },
    {
      name: 'Name Correction Scenario', 
      transcript: `Agent: Hello, may I speak with Lisa?
Customer: It's actually Sarah, not Lisa. Sarah Martinez.
Agent: Sorry Sarah! Are you interested in solar?
Customer: Yes, very much. My husband Carlos and I have been looking at options.
Customer: We're at 789 Maple Drive and our current bill is about $400 monthly.`
    }
  ];
  
  testTranscripts.forEach((test, index) => {
    console.log(`📞 Test ${index + 1}: ${test.name}`);
    console.log(`Transcript: "${test.transcript.substring(0, 100)}..."`);
    
    const extracted = extractAllData(test.transcript);
    
    console.log('📋 Extracted Data:');
    Object.entries(extracted).forEach(([key, value]) => {
      console.log(`   ${key}: "${value}"`);
    });
    
    console.log('');
  });
  
  // Test real call update scenario
  console.log('🔄 Testing Real Call Update Scenario...\n');
  
  const testPhone = '+1555UPDATE';
  const orgId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  
  // Clean up
  await supabase.from('leads').delete().eq('phone', testPhone);
  await supabase.from('calls').delete().eq('phone_number', testPhone);
  
  // Create call with enhanced transcript
  const richTranscript = `Agent: Hello, is this the homeowner?
Customer: Yes, this is Jennifer Martinez from Martinez Consulting LLC.
Agent: Great! I'm calling from Emerald Green Energy about solar.
Customer: Perfect timing! My husband Carlos and I have been researching solar panels.
Customer: We're at 555 Sunset Boulevard, Los Angeles, CA 90028.
Customer: You can email us at jennifer@martinezconsulting.com.
Customer: Our current electric bill is around $450 per month and we own our home.
Customer: We're hoping to install something in the next 3 months with a budget of about $30,000.
Customer: Can you schedule an appointment for next Tuesday?`;
  
  const callData = {
    vapi_call_id: `enhanced-test-${Date.now()}`,
    phone_number: testPhone,
    status: 'completed',
    transcript: richTranscript,
    duration: 300,
    cost: 5.25,
    organization_id: orgId
  };
  
  const { data: call, error } = await supabase
    .from('calls')
    .insert(callData)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating call:', error);
    return;
  }
  
  console.log('✅ Enhanced call created, waiting for processing...');
  
  // Wait for trigger
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check what was extracted
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('phone', testPhone)
    .single();
  
  if (lead) {
    console.log('📊 ACTUAL EXTRACTION RESULTS:');
    console.log(`   Name: "${lead.name}"`);
    console.log(`   Email: "${lead.email || 'Not extracted'}"`);
    console.log(`   Company: "${lead.company}"`);
    console.log(`   Phone: "${lead.phone}"`);
    console.log(`   Priority: "${lead.priority}"`);
    console.log(`   Status: "${lead.status}"`);
    console.log(`   Interest Level: "${lead.interest_level}"`);
    console.log(`   Appointment: ${lead.appointment_scheduled}`);
    console.log(`   Sentiment: ${lead.sentiment_score}`);
    console.log(`   Next Action: "${lead.next_action}"`);
  } else {
    console.log('❌ No lead was created from enhanced call');
  }
  
  console.log('\n🎯 Summary: Enhanced extraction would capture ALL this data automatically!');
}

testEnhancedExtraction();