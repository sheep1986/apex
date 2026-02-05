const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test data for different scenarios
const testScenarios = [
  {
    name: 'Positive - High Interest',
    transcript: `Agent: Hi, is this John Smith?
Customer: Yes, this is John.
Agent: I'm calling from Emerald Green Energy about solar panel installation.
Customer: Oh yes, I'm very interested in learning more about solar panels for my home.
Agent: Great! We can schedule an appointment for next week.
Customer: That sounds good, let's do Tuesday at 2 PM.`,
    expectedPriority: 'high',
    expectedStatus: 'qualified',
    shouldCreateLead: true
  },
  {
    name: 'Positive - Callback Request',
    transcript: `Agent: Hello, may I speak with Sarah Johnson?
Customer: This is Sarah.
Agent: I'm calling about our energy saving solutions.
Customer: I'm busy right now, but I'm interested. Can you call me back tomorrow?
Agent: Of course, I'll call you tomorrow at the same time.`,
    expectedPriority: 'medium',
    expectedStatus: 'new',
    shouldCreateLead: true
  },
  {
    name: 'Negative - Not Interested',
    transcript: `Agent: Hi, is this Mike Brown?
Customer: Yes.
Agent: I'm calling about solar panels.
Customer: Not interested, please remove me from your list.
Agent: I understand, have a good day.`,
    expectedPriority: null,
    expectedStatus: null,
    shouldCreateLead: false
  },
  {
    name: 'Neutral - Maybe',
    transcript: `Agent: Hello, is this Lisa Davis?
Customer: Yes, speaking.
Agent: I'm calling about renewable energy options.
Customer: I'm not sure, maybe in the future. I need to think about it.
Agent: I understand, we'll follow up in a few months.`,
    expectedPriority: 'low',
    expectedStatus: 'new',
    shouldCreateLead: true
  }
];

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up previous test data...');
  
  // Delete test calls and their associated leads
  const testPhones = ['+1234567890', '+1234567891', '+1234567892', '+1234567893'];
  
  // Delete test leads
  const { error: leadError } = await supabase
    .from('leads')
    .delete()
    .in('phone', testPhones);
  
  if (leadError) {
    console.error('Error cleaning up leads:', leadError);
  }
  
  // Delete test calls
  const { error: callError } = await supabase
    .from('calls')
    .delete()
    .in('phone_number', testPhones);
  
  if (callError) {
    console.error('Error cleaning up calls:', callError);
  }
  
  console.log('✅ Cleanup complete\n');
}

async function createTestCall(scenario, index) {
  const phoneNumber = `+123456789${index}`;
  const callData = {
    vapi_call_id: `test-call-${Date.now()}-${index}`,
    phone_number: phoneNumber,
    status: 'completed',
    transcript: scenario.transcript,
    duration: Math.floor(Math.random() * 300) + 60,
    cost: parseFloat((Math.random() * 5 + 1).toFixed(2)),
    end_reason: 'Customer ended call',
    campaign_id: null,
    organization_id: '2566d8c5-2245-4a3c-b539-4cea21a07d9b' // Use existing org ID from sample
  };
  
  console.log(`\n📞 Test ${index + 1}: ${scenario.name}`);
  console.log(`Phone: ${phoneNumber}`);
  
  // Insert the call
  const { data: callData_1, error: callError } = await supabase
    .from('calls')
    .insert(callData)
    .select()
    .single();
  
  if (callError) {
    console.error('❌ Error creating call:', callError);
    return null;
  }
  
  console.log(`✅ Call created with ID: ${callData_1.id}`);
  
  // Wait for trigger to process
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check if lead was created
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('phone', phoneNumber)
    .single();
  
  if (scenario.shouldCreateLead) {
    if (lead) {
      console.log(`✅ Lead created successfully!`);
      console.log(`   - Name: ${lead.name || 'Not extracted'}`);
      console.log(`   - Priority: ${lead.priority}`);
      console.log(`   - Status: ${lead.status}`);
      console.log(`   - Call ID: ${lead.call_id}`);
      
      // Verify priority and status
      if (lead.priority === scenario.expectedPriority) {
        console.log(`   ✅ Priority matches expected: ${scenario.expectedPriority}`);
      } else {
        console.log(`   ⚠️ Priority mismatch! Expected: ${scenario.expectedPriority}, Got: ${lead.priority}`);
      }
      
      if (lead.status === scenario.expectedStatus) {
        console.log(`   ✅ Status matches expected: ${scenario.expectedStatus}`);
      } else {
        console.log(`   ⚠️ Status mismatch! Expected: ${scenario.expectedStatus}, Got: ${lead.status}`);
      }
    } else {
      console.error(`❌ Lead was NOT created (but should have been)`);
    }
  } else {
    if (!lead) {
      console.log(`✅ Lead correctly NOT created (negative transcript)`);
    } else {
      console.error(`❌ Lead was created but shouldn't have been`);
    }
  }
  
  return { call: callData_1, lead };
}

async function testDuplicatePrevention() {
  console.log('\n\n🔄 Testing Duplicate Prevention...');
  
  const duplicatePhone = '+1234567899';
  const callData = {
    vapi_call_id: `test-duplicate-${Date.now()}-1`,
    phone_number: duplicatePhone,
    status: 'completed',
    transcript: 'Agent: Hi! Customer: I am very interested in your solar panels!',
    duration: 120,
    cost: 2.50,
    end_reason: 'Customer ended call',
    organization_id: '2566d8c5-2245-4a3c-b539-4cea21a07d9b' // Use existing org ID from sample
  };
  
  // Create first call
  console.log('Creating first call...');
  const { data: call1 } = await supabase
    .from('calls')
    .insert(callData)
    .select()
    .single();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check lead was created
  const { data: lead1 } = await supabase
    .from('leads')
    .select('*')
    .eq('phone', duplicatePhone)
    .single();
  
  if (lead1) {
    console.log(`✅ First lead created with ID: ${lead1.id}`);
  }
  
  // Create second call with same phone
  console.log('Creating second call with same phone number...');
  callData.vapi_call_id = `test-duplicate-${Date.now()}-2`;
  callData.transcript = 'Agent: Following up. Customer: Still interested!';
  
  const { data: call2 } = await supabase
    .from('calls')
    .insert(callData)
    .select()
    .single();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check that no duplicate lead was created
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('phone', duplicatePhone);
  
  if (leads.length === 1) {
    console.log('✅ Duplicate prevention working! Only one lead exists');
    console.log(`   Lead still has ID: ${leads[0].id}`);
  } else {
    console.error(`❌ Duplicate prevention failed! Found ${leads.length} leads`);
  }
}

async function checkSystemStatus() {
  console.log('\n\n📊 System Status Check...');
  
  // Check if we can access basic functions
  console.log('⚠️ Cannot verify triggers (requires admin access)');
  
  // Check leads table structure
  try {
    await supabase
      .from('leads')
      .select('*')
      .limit(0);
    
    console.log('✅ Leads table is accessible and ready');
  } catch (error) {
    console.error('❌ Error accessing leads table:', error);
  }
  
  // Get statistics
  const { data: stats } = await supabase
    .from('leads')
    .select('status, priority')
    .neq('call_id', null);
  
  if (stats && stats.length > 0) {
    const statusCounts = {};
    const priorityCounts = {};
    
    stats.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
      priorityCounts[lead.priority] = (priorityCounts[lead.priority] || 0) + 1;
    });
    
    console.log('\n📈 Lead Statistics:');
    console.log('By Status:', statusCounts);
    console.log('By Priority:', priorityCounts);
  }
}

async function runTests() {
  console.log('🚀 Starting Lead Conversion System Tests');
  console.log('=========================================');
  
  try {
    // Clean up any previous test data
    await cleanupTestData();
    
    // Test each scenario
    for (let i = 0; i < testScenarios.length; i++) {
      await createTestCall(testScenarios[i], i);
    }
    
    // Test duplicate prevention
    await testDuplicatePrevention();
    
    // Check system status
    await checkSystemStatus();
    
    console.log('\n\n✨ All tests completed!');
    console.log('Check your Apex dashboard to see the converted leads.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the tests
runTests();