import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
};

const MAX_BATCH_SIZE = 5000; // Max contacts per import

interface ImportContact {
    phone: string;
    name?: string;
    email?: string;
    company?: string;
    metadata?: Record<string, string>;
}

/**
 * Normalizes a phone string to E.164 format.
 * Strips non-digit chars (except leading +), ensures 10+ digits.
 */
function normalizePhone(raw: string): string | null {
    if (!raw) return null;
    let cleaned = raw.replace(/[^\d+]/g, '');
    // If no + prefix and 10 digits, assume US
    if (!cleaned.startsWith('+') && cleaned.length === 10) {
        cleaned = '+1' + cleaned;
    }
    // If no + prefix and 11 digits starting with 1, add +
    if (!cleaned.startsWith('+') && cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = '+' + cleaned;
    }
    // Validate minimum length
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return null;
    if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
    return cleaned;
}

export const handler: Handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        // 1. Authenticate User
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing or invalid Authorization header' }) };
        }
        const token = authHeader.split(' ')[1];

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        // 2. Identify Organization
        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();

        if (memberError || !member) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'User does not belong to an organization' }) };
        }

        const organizationId = member.organization_id;

        // 3. Parse & Validate Request
        const { campaignId, contacts } = JSON.parse(event.body || '{}');

        if (!campaignId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing campaignId' }) };
        }

        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing or empty contacts array' }) };
        }

        if (contacts.length > MAX_BATCH_SIZE) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: `Max ${MAX_BATCH_SIZE} contacts per import` }) };
        }

        // 4. Verify campaign belongs to this org
        const { data: campaign, error: campError } = await supabase
            .from('campaigns')
            .select('id, organization_id, status')
            .eq('id', campaignId)
            .single();

        if (campError || !campaign) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Campaign not found' }) };
        }

        if (campaign.organization_id !== organizationId) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'Access denied to this campaign' }) };
        }

        // 5. Sanitize & Normalize Contacts
        const sanitized: { phone: string; name: string; metadata: Record<string, string> }[] = [];
        const invalid: { index: number; phone: string; reason: string }[] = [];

        for (let i = 0; i < contacts.length; i++) {
            const raw = contacts[i] as ImportContact;
            const normalized = normalizePhone(raw.phone);
            if (!normalized) {
                invalid.push({ index: i, phone: raw.phone || '', reason: 'Invalid phone number' });
                continue;
            }

            // Build metadata from extra fields
            const metadata: Record<string, string> = {};
            if (raw.name) metadata.contactName = raw.name;
            if (raw.email) metadata.email = raw.email;
            if (raw.company) metadata.company = raw.company;
            if (raw.metadata) {
                for (const [k, v] of Object.entries(raw.metadata)) {
                    if (typeof v === 'string') metadata[k] = v;
                }
            }

            sanitized.push({
                phone: normalized,
                name: raw.name || '',
                metadata,
            });
        }

        if (sanitized.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'No valid contacts after sanitization',
                    invalid,
                }),
            };
        }

        // 6. Bulk Upsert Contacts & Create Campaign Items
        let created = 0;
        let skipped = 0;
        const CHUNK_SIZE = 50;

        for (let i = 0; i < sanitized.length; i += CHUNK_SIZE) {
            const chunk = sanitized.slice(i, i + CHUNK_SIZE);

            const itemsToInsert: any[] = [];

            for (const contact of chunk) {
                // Upsert contact: find existing by phone_e164 or create
                let contactId: string;

                const { data: existing } = await supabase
                    .from('contacts')
                    .select('id')
                    .eq('organization_id', organizationId)
                    .eq('phone_e164', contact.phone)
                    .maybeSingle();

                if (existing) {
                    contactId = existing.id;
                } else {
                    const { data: newContact, error: createErr } = await supabase
                        .from('contacts')
                        .insert({
                            organization_id: organizationId,
                            name: contact.name,
                            phone_e164: contact.phone,
                            metadata: contact.metadata,
                        } as any)
                        .select('id')
                        .single();

                    if (createErr || !newContact) {
                        skipped++;
                        continue;
                    }
                    contactId = newContact.id;
                }

                // Check for duplicate campaign_items (same campaign + contact)
                const { data: existingItem } = await supabase
                    .from('campaign_items')
                    .select('id')
                    .eq('campaign_id', campaignId)
                    .eq('contact_id', contactId)
                    .maybeSingle();

                if (existingItem) {
                    skipped++;
                    continue;
                }

                itemsToInsert.push({
                    organization_id: organizationId,
                    campaign_id: campaignId,
                    contact_id: contactId,
                    status: 'pending',
                });
            }

            if (itemsToInsert.length > 0) {
                const { error: insertErr } = await supabase
                    .from('campaign_items')
                    .insert(itemsToInsert);

                if (insertErr) {
                    console.error('[CampaignImport] Batch insert error:', insertErr.message);
                } else {
                    created += itemsToInsert.length;
                }
            }
        }

        // 7. Update campaign total_leads count
        const { count: totalItems } = await supabase
            .from('campaign_items')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', campaignId);

        await supabase
            .from('campaigns')
            .update({ total_leads: totalItems || 0 })
            .eq('id', campaignId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                imported: created,
                skipped,
                invalid: invalid.length,
                invalidDetails: invalid.slice(0, 20), // Return first 20 invalid entries
                totalInCampaign: totalItems || 0,
            }),
        };
    } catch (error: any) {
        console.error('[CampaignImport] Error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Import failed: ' + (error.message || 'Unknown error') }),
        };
    }
};
