// Identify which calls are real VAPI calls vs mock/test data
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function identifyCallTypes() {
  console.log('🔍 ANALYZING CALL DATA: Real VAPI vs Mock/Test Calls\n');
  console.log('=' .repeat(60));
  
  // Fetch all calls
  const { data: calls, error } = await supabase
    .from('calls')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching calls:', error);
    return;
  }
  
  console.log(`\nTotal calls in database: ${calls?.length || 0}`);
  console.log('=' .repeat(60));
  
  // Analyze call characteristics
  const mockIndicators = {
    roundCosts: [],
    simIds: [],
    testNames: [],
    noVapiIds: [],
    noRecordings: [],
    noTranscripts: [],
    suspiciousDurations: []
  };
  
  const realIndicators = {
    vapiIds: [],
    recordings: [],
    transcripts: [],
    realisticCosts: []
  };
  
  calls?.forEach(call => {
    // Check for mock indicators
    
    // 1. Round cost numbers (likely mock)
    const cost = parseFloat(call.cost || 0);
    if (cost > 0 && cost % 0.25 === 0) {
      mockIndicators.roundCosts.push(call);
    }
    
    // 2. ID patterns suggesting simulation
    if (call.id?.includes('sim-') || call.id?.includes('test-') || call.id?.includes('mock-')) {
      mockIndicators.simIds.push(call);
    }
    
    // 3. Test names in customer data
    const customerName = call.customer_name || '';
    if (customerName.toLowerCase().includes('test') || 
        customerName.toLowerCase().includes('demo') ||
        customerName.toLowerCase().includes('sample')) {
      mockIndicators.testNames.push(call);
    }
    
    // 4. Missing VAPI call ID
    if (!call.vapi_call_id || call.vapi_call_id === 'pending') {
      mockIndicators.noVapiIds.push(call);
    }
    
    // 5. No recording URL
    if (!call.recording_url) {
      mockIndicators.noRecordings.push(call);
    }
    
    // 6. No transcript
    if (!call.transcript || call.transcript === '[]') {
      mockIndicators.noTranscripts.push(call);
    }
    
    // 7. Suspicious exact durations (60, 120, 180 seconds)
    if (call.duration && call.duration % 60 === 0) {
      mockIndicators.suspiciousDurations.push(call);
    }
    
    // Check for real VAPI indicators
    
    // 1. Has proper VAPI call ID
    if (call.vapi_call_id && call.vapi_call_id !== 'pending' && call.vapi_call_id.length > 20) {
      realIndicators.vapiIds.push(call);
    }
    
    // 2. Has recording URL
    if (call.recording_url && (call.recording_url.includes('vapi') || call.recording_url.includes('twilio'))) {
      realIndicators.recordings.push(call);
    }
    
    // 3. Has transcript with conversation
    if (call.transcript && call.transcript !== '[]' && call.transcript.length > 50) {
      realIndicators.transcripts.push(call);
    }
    
    // 4. Realistic costs (non-round numbers)
    if (cost > 0 && cost % 0.25 !== 0) {
      realIndicators.realisticCosts.push(call);
    }
  });
  
  // Analysis Results
  console.log('\n📊 MOCK/TEST DATA INDICATORS:');
  console.log('-' .repeat(60));
  
  console.log(`\n❌ Round cost numbers (e.g., $5.00, $2.25): ${mockIndicators.roundCosts.length} calls`);
  if (mockIndicators.roundCosts.length > 0) {
    mockIndicators.roundCosts.slice(0, 3).forEach(c => {
      console.log(`   - ${c.id.substring(0, 8)}... Cost: $${c.cost}`);
    });
  }
  
  console.log(`\n❌ Simulation IDs (sim-, test-, mock-): ${mockIndicators.simIds.length} calls`);
  if (mockIndicators.simIds.length > 0) {
    mockIndicators.simIds.slice(0, 3).forEach(c => {
      console.log(`   - ${c.id}`);
    });
  }
  
  console.log(`\n❌ Test customer names: ${mockIndicators.testNames.length} calls`);
  if (mockIndicators.testNames.length > 0) {
    mockIndicators.testNames.slice(0, 3).forEach(c => {
      console.log(`   - "${c.customer_name}"`);
    });
  }
  
  console.log(`\n❌ Missing VAPI call ID: ${mockIndicators.noVapiIds.length} calls`);
  console.log(`❌ No recording URL: ${mockIndicators.noRecordings.length} calls`);
  console.log(`❌ No transcript: ${mockIndicators.noTranscripts.length} calls`);
  console.log(`❌ Exact minute durations: ${mockIndicators.suspiciousDurations.length} calls`);
  
  console.log('\n\n✅ REAL VAPI CALL INDICATORS:');
  console.log('-' .repeat(60));
  
  console.log(`\n✅ Valid VAPI call IDs: ${realIndicators.vapiIds.length} calls`);
  if (realIndicators.vapiIds.length > 0) {
    realIndicators.vapiIds.slice(0, 3).forEach(c => {
      console.log(`   - ${c.vapi_call_id}`);
    });
  }
  
  console.log(`\n✅ Has recording URLs: ${realIndicators.recordings.length} calls`);
  console.log(`✅ Has transcripts: ${realIndicators.transcripts.length} calls`);
  console.log(`✅ Realistic costs: ${realIndicators.realisticCosts.length} calls`);
  
  // Calculate confidence scores
  console.log('\n\n🎯 CALL CLASSIFICATION:');
  console.log('=' .repeat(60));
  
  let definitelyMock = 0;
  let likelyMock = 0;
  let uncertain = 0;
  let likelyReal = 0;
  let definitelyReal = 0;
  
  calls?.forEach(call => {
    let mockScore = 0;
    let realScore = 0;
    
    // Count mock indicators
    if (mockIndicators.roundCosts.includes(call)) mockScore += 2;
    if (mockIndicators.simIds.includes(call)) mockScore += 3;
    if (mockIndicators.testNames.includes(call)) mockScore += 2;
    if (mockIndicators.noVapiIds.includes(call)) mockScore += 3;
    if (mockIndicators.noRecordings.includes(call)) mockScore += 1;
    if (mockIndicators.noTranscripts.includes(call)) mockScore += 1;
    if (mockIndicators.suspiciousDurations.includes(call)) mockScore += 1;
    
    // Count real indicators
    if (realIndicators.vapiIds.includes(call)) realScore += 3;
    if (realIndicators.recordings.includes(call)) realScore += 2;
    if (realIndicators.transcripts.includes(call)) realScore += 2;
    if (realIndicators.realisticCosts.includes(call)) realScore += 1;
    
    // Classify
    if (mockScore >= 5) definitelyMock++;
    else if (mockScore >= 3) likelyMock++;
    else if (realScore >= 4) definitelyReal++;
    else if (realScore >= 2) likelyReal++;
    else uncertain++;
  });
  
  console.log('\nCall Classification Results:');
  console.log(`  🔴 Definitely Mock/Test: ${definitelyMock} calls`);
  console.log(`  🟠 Likely Mock/Test: ${likelyMock} calls`);
  console.log(`  🟡 Uncertain: ${uncertain} calls`);
  console.log(`  🟢 Likely Real VAPI: ${likelyReal} calls`);
  console.log(`  ✅ Definitely Real VAPI: ${definitelyReal} calls`);
  
  const mockTotal = definitelyMock + likelyMock;
  const realTotal = definitelyReal + likelyReal;
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 SUMMARY:');
  console.log('=' .repeat(60));
  
  if (mockTotal > realTotal) {
    console.log('\n⚠️  VERDICT: Most calls appear to be MOCK/TEST data');
    console.log(`   - ${mockTotal} mock calls vs ${realTotal} real calls`);
    console.log('\n   This explains why calls aren\'t being made through VAPI!');
  } else if (realTotal > 0) {
    console.log('\n✅ VERDICT: Some real VAPI calls exist');
    console.log(`   - ${realTotal} real calls vs ${mockTotal} mock calls`);
  } else {
    console.log('\n❌ VERDICT: No real VAPI calls detected');
    console.log('   All calls appear to be test/mock data');
  }
  
  // Show sample real calls if any exist
  if (realIndicators.vapiIds.length > 0) {
    console.log('\n📞 SAMPLE REAL VAPI CALLS:');
    console.log('-' .repeat(60));
    realIndicators.vapiIds.slice(0, 3).forEach(call => {
      console.log(`\nCall ID: ${call.id}`);
      console.log(`VAPI ID: ${call.vapi_call_id}`);
      console.log(`Customer: ${call.customer_name}`);
      console.log(`Duration: ${call.duration}s`);
      console.log(`Cost: $${call.cost}`);
      console.log(`Recording: ${call.recording_url ? 'Yes' : 'No'}`);
    });
  }
  
  // Recommendations
  console.log('\n\n💡 RECOMMENDATIONS TO GET REAL CALLS:');
  console.log('=' .repeat(60));
  console.log('\n1. VERIFY VAPI CREDENTIALS:');
  console.log('   - Check that real VAPI API keys are configured');
  console.log('   - Ensure VAPI webhook is properly set up');
  console.log('   - Verify phone numbers are provisioned in VAPI');
  
  console.log('\n2. TEST WITH REAL VAPI CALL:');
  console.log('   - Use the VAPI dashboard to make a test call');
  console.log('   - Or use the campaign automation scripts with real API');
  console.log('   - Monitor the webhook endpoint for incoming data');
  
  console.log('\n3. CHECK WEBHOOK INTEGRATION:');
  console.log('   - Ensure /api/vapi-webhook is receiving VAPI events');
  console.log('   - Check that webhook URL is registered in VAPI dashboard');
  console.log('   - Verify webhook authentication is working');
  
  console.log('\n4. SCRIPTS TO RUN:');
  console.log('   - node check-vapi-credentials.cjs (verify API keys)');
  console.log('   - node make-real-vapi-call.cjs (initiate real call)');
  console.log('   - node monitor-vapi-webhook.cjs (watch for events)');
  
  console.log('\n' + '=' .repeat(60));
  console.log('✨ Once real VAPI calls are flowing, the platform will show live data!');
  console.log('=' .repeat(60));
}

identifyCallTypes();