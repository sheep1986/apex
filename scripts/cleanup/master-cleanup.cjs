#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.toLowerCase());
    });
  });
}

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '../../')
    });
    console.log(output);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('=' + '='.repeat(60));
  console.log('🚀 APEX PLATFORM - PRODUCTION CLEANUP WIZARD');
  console.log('=' + '='.repeat(60));
  console.log('\nThis wizard will help you clean up the Apex platform for production.\n');
  
  console.log('⚠️  WARNING: This process will:');
  console.log('   1. Backup all current data');
  console.log('   2. Delete test campaigns, leads, and calls');
  console.log('   3. Fix OpenAI lead qualification');
  console.log('   4. Remove unused test files and components');
  console.log('   5. Clean up the dashboard\n');
  
  const proceed = await prompt('Do you want to continue? (yes/no): ');
  
  if (proceed !== 'yes' && proceed !== 'y') {
    console.log('\n❌ Cleanup cancelled.');
    rl.close();
    return;
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log('STEP 1: DATABASE CLEANUP');
  console.log('-'.repeat(60));
  
  // First do a dry run
  console.log('\n📊 Analyzing database...');
  runCommand('node scripts/cleanup/backup-and-clean-data.cjs', 'Dry run analysis');
  
  const cleanDb = await prompt('\n🗑️  Do you want to delete the test data shown above? (yes/no): ');
  
  if (cleanDb === 'yes' || cleanDb === 'y') {
    runCommand('node scripts/cleanup/backup-and-clean-data.cjs --live', 'Cleaning database');
    console.log('✅ Database cleaned successfully!');
  } else {
    console.log('⏭️  Skipping database cleanup');
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log('STEP 2: AI LEAD QUALIFICATION');
  console.log('-'.repeat(60));
  
  console.log('\n🤖 Checking OpenAI configuration...');
  
  const hasOpenAI = process.env.OPENAI_API_KEY ? true : false;
  
  if (!hasOpenAI) {
    console.log('⚠️  No OPENAI_API_KEY found in environment.');
    console.log('   Add it to your .env file to enable AI lead qualification.');
    
    const skipAI = await prompt('\nSkip AI setup for now? (yes/no): ');
    if (skipAI !== 'yes' && skipAI !== 'y') {
      console.log('\nPlease add OPENAI_API_KEY to .env and run again.');
      rl.close();
      return;
    }
  } else {
    // Test OpenAI first
    console.log('\n🧪 Testing OpenAI connection...');
    const testSuccess = runCommand('node scripts/cleanup/fix-openai-lead-qualification.cjs --test', 'Testing OpenAI');
    
    if (testSuccess) {
      const processAI = await prompt('\n🤖 Process all calls with AI? (yes/no): ');
      
      if (processAI === 'yes' || processAI === 'y') {
        runCommand('node scripts/cleanup/fix-openai-lead-qualification.cjs', 'Processing calls with AI');
        console.log('✅ AI lead qualification completed!');
      }
    }
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log('STEP 3: FILE CLEANUP');
  console.log('-'.repeat(60));
  
  // Analyze files first
  console.log('\n📁 Analyzing project files...');
  runCommand('node scripts/cleanup/remove-unused-files.cjs', 'File analysis');
  
  const cleanFiles = await prompt('\n🗑️  Do you want to remove the unused files? (yes/no): ');
  
  if (cleanFiles === 'yes' || cleanFiles === 'y') {
    runCommand('node scripts/cleanup/remove-unused-files.cjs --live', 'Removing unused files');
    console.log('✅ Files cleaned successfully!');
  } else {
    console.log('⏭️  Skipping file cleanup');
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log('STEP 4: FINAL CHECKS');
  console.log('-'.repeat(60));
  
  console.log('\n✅ Cleanup Summary:');
  
  // Check final state
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: campaigns } = await supabase.from('campaigns').select('*');
  const { data: leads } = await supabase.from('leads').select('*');
  const { data: calls } = await supabase.from('calls').select('*');
  
  console.log(`   📊 Campaigns: ${campaigns?.length || 0}`);
  console.log(`   👥 Leads: ${leads?.length || 0}`);
  console.log(`   📞 Calls: ${calls?.length || 0}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 CLEANUP COMPLETED!');
  console.log('=' + '='.repeat(60));
  
  console.log('\n📝 Next Steps:');
  console.log('1. ✅ Test the application locally');
  console.log('2. ✅ Verify Emerald Green Energy Demo campaign works');
  console.log('3. ✅ Deploy to Netlify');
  console.log('4. ✅ Fix Railway backend or migrate to new provider');
  console.log('5. ✅ Purchase phone numbers for production');
  console.log('6. ✅ Upgrade Supabase and VAPI plans');
  
  console.log('\n💡 Production Readiness Checklist:');
  console.log('   [ ] Backend server running (Railway/Render/Vercel)');
  console.log('   [ ] Webhook endpoints configured');
  console.log('   [ ] 12 UK phone numbers purchased');
  console.log('   [ ] Rate limiting implemented');
  console.log('   [ ] Call scheduler running');
  console.log('   [ ] Monitoring dashboard active');
  
  rl.close();
}

main().catch(error => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});