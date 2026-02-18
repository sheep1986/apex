/**
 * Backfill Vapi Ownership — One-time script
 *
 * Tags all existing Vapi resources (phone numbers, assistants, squads, tools)
 * with your organization_id so the new multi-tenant isolation layer can find them.
 *
 * Usage:
 *   npx tsx scripts/backfill-vapi-ownership.ts
 *
 * Required env vars:
 *   VAPI_PRIVATE_API_KEY
 *   VITE_SUPABASE_URL (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Set TARGET_ORG_ID below to your organization UUID.
 */

import { createClient } from '@supabase/supabase-js';

// ─── Configuration ──────────────────────────────────────────────────────────
const TARGET_ORG_ID = 'de077a94-a24e-4b27-a7d8-025031098c80'; // Trinity Labs AI

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapiApiKey = process.env.VAPI_PRIVATE_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !vapiApiKey) {
  console.error('❌ Missing required environment variables');
  console.error('   VITE_SUPABASE_URL / SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('   VAPI_PRIVATE_API_KEY:', !!vapiApiKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function vapiGet(endpoint: string): Promise<any[]> {
  const resp = await fetch(`https://api.vapi.ai${endpoint}`, {
    headers: { 'Authorization': `Bearer ${vapiApiKey}` },
  });
  if (!resp.ok) {
    console.error(`❌ Vapi API ${endpoint} returned ${resp.status}`);
    return [];
  }
  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

// ─── Backfill Phone Numbers ──────────────────────────────────────────────────
async function backfillPhoneNumbers() {
  console.log('\n📞 Backfilling phone numbers...');
  const numbers = await vapiGet('/phone-number');
  console.log(`   Found ${numbers.length} phone numbers in Vapi`);

  let created = 0, skipped = 0;
  for (const num of numbers) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('phone_numbers')
      .select('id')
      .eq('vapi_number_id', num.id)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from('phone_numbers').insert({
      organization_id: TARGET_ORG_ID,
      number: num.number || num.phoneNumber || '',
      status: 'active',
      vapi_number_id: num.id,
    });

    if (error) {
      console.error(`   ⚠️ Failed to insert ${num.number}: ${error.message}`);
    } else {
      created++;
    }
  }
  console.log(`   ✅ Created ${created}, Skipped ${skipped} (already exist)`);
}

// ─── Backfill Assistants ─────────────────────────────────────────────────────
async function backfillAssistants() {
  console.log('\n🤖 Backfilling assistants...');
  const assistants = await vapiGet('/assistant');
  console.log(`   Found ${assistants.length} assistants in Vapi`);

  let created = 0, skipped = 0;
  for (const asst of assistants) {
    const { data: existing } = await supabase
      .from('assistants')
      .select('id')
      .eq('vapi_assistant_id', asst.id)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from('assistants').insert({
      organization_id: TARGET_ORG_ID,
      vapi_assistant_id: asst.id,
      name: asst.name || 'Unnamed Assistant',
    });

    if (error) {
      console.error(`   ⚠️ Failed to insert ${asst.name}: ${error.message}`);
    } else {
      created++;
    }
  }
  console.log(`   ✅ Created ${created}, Skipped ${skipped} (already exist)`);
}

// ─── Backfill Squads ─────────────────────────────────────────────────────────
async function backfillSquads() {
  console.log('\n👥 Backfilling squads...');
  const squads = await vapiGet('/squad');
  console.log(`   Found ${squads.length} squads in Vapi`);

  let created = 0, skipped = 0;
  for (const squad of squads) {
    const { data: existing } = await supabase
      .from('voice_squads')
      .select('id')
      .eq('provider_squad_id', squad.id)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from('voice_squads').insert({
      organization_id: TARGET_ORG_ID,
      provider_squad_id: squad.id,
      name: squad.name || 'Unnamed Squad',
      members_config: squad.members || [],
    });

    if (error) {
      console.error(`   ⚠️ Failed to insert squad ${squad.name}: ${error.message}`);
    } else {
      created++;
    }
  }
  console.log(`   ✅ Created ${created}, Skipped ${skipped} (already exist)`);
}

// ─── Backfill Tools ──────────────────────────────────────────────────────────
async function backfillTools() {
  console.log('\n🔧 Backfilling tools...');
  const tools = await vapiGet('/tool');
  console.log(`   Found ${tools.length} tools in Vapi`);

  let created = 0, skipped = 0;
  for (const tool of tools) {
    const { data: existing } = await supabase
      .from('voice_tools')
      .select('id')
      .eq('provider_tool_id', tool.id)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from('voice_tools').insert({
      organization_id: TARGET_ORG_ID,
      provider_tool_id: tool.id,
      name: tool.function?.name || tool.name || 'Unnamed Tool',
      description: tool.function?.description || '',
      type: tool.type || 'function',
    });

    if (error) {
      console.error(`   ⚠️ Failed to insert tool ${tool.name}: ${error.message}`);
    } else {
      created++;
    }
  }
  console.log(`   ✅ Created ${created}, Skipped ${skipped} (already exist)`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔒 Vapi Ownership Backfill Script');
  console.log(`   Target Org: ${TARGET_ORG_ID}`);
  console.log(`   Supabase: ${supabaseUrl}`);

  // Verify org exists
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', TARGET_ORG_ID)
    .single();

  if (!org) {
    console.error(`❌ Organization ${TARGET_ORG_ID} not found`);
    process.exit(1);
  }
  console.log(`   Org Name: ${org.name}`);

  await backfillPhoneNumbers();
  await backfillAssistants();
  await backfillSquads();
  await backfillTools();

  console.log('\n✅ Backfill complete!');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
