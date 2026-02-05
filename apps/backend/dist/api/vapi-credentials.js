"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clerk_auth_1 = require("../middleware/clerk-auth");
const supabase_client_1 = __importDefault(require("../services/supabase-client"));
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
router.use(clerk_auth_1.authenticateUser);
function hashForAudit(value) {
    return crypto_1.default.createHash('sha256').update(value).digest('hex').substring(0, 16);
}
async function logKeyChange(organizationId, userId, changeType, fieldChanged, oldValue, newValue, req) {
    try {
        await supabase_client_1.default.from('vapi_key_audit').insert({
            organization_id: organizationId,
            changed_by: userId,
            change_type: changeType,
            field_changed: fieldChanged,
            old_value_hash: oldValue ? hashForAudit(oldValue) : null,
            new_value_hash: newValue ? hashForAudit(newValue) : null,
            ip_address: req?.ip || req?.connection?.remoteAddress,
            user_agent: req?.headers?.['user-agent']
        });
    }
    catch (error) {
        console.error('Failed to log key change to audit:', error);
    }
}
router.get('/', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const userRole = req.user?.role;
        if (!organizationId) {
            return res.status(400).json({
                error: 'User not associated with an organization',
                hasPublicKey: false,
                hasPrivateKey: false
            });
        }
        console.log('🔑 Fetching VAPI credentials for organization:', organizationId);
        const { data: organization, error } = await supabase_client_1.default
            .from('organizations')
            .select('id, name, vapi_public_key, vapi_private_key, vapi_webhook_url, settings, vapi_api_key')
            .eq('id', organizationId)
            .single();
        if (error || !organization) {
            console.error('❌ Error fetching organization:', error);
            return res.status(404).json({
                error: 'Organization not found',
                hasPublicKey: false,
                hasPrivateKey: false
            });
        }
        const publicKey = organization.vapi_public_key || organization.vapi_api_key || organization.settings?.vapi?.publicKey;
        const privateKey = organization.vapi_private_key || organization.settings?.vapi?.privateKey;
        const webhookUrl = organization.vapi_webhook_url || organization.settings?.vapi?.webhookUrl || `${process.env.BACKEND_URL}/api/vapi-webhook`;
        const hasPublicKey = !!publicKey;
        const hasPrivateKey = !!privateKey;
        const response = {
            hasPublicKey,
            hasPrivateKey,
            hasCredentials: hasPublicKey && hasPrivateKey,
            organizationId: organization.id,
            organizationName: organization.name
        };
        if (userRole === 'platform_owner' || userRole === 'client_admin') {
            response.credentials = {
                vapi_public_key: publicKey,
                vapi_private_key: privateKey,
                vapi_webhook_url: webhookUrl
            };
            console.log('✅ VAPI credentials returned to admin:', {
                hasPublicKey,
                hasPrivateKey,
                publicKeyPreview: publicKey ? publicKey.substring(0, 10) + '...' : 'NONE',
                role: userRole
            });
        }
        else {
            console.log('✅ VAPI credentials check for non-admin:', {
                hasPublicKey,
                hasPrivateKey,
                role: userRole
            });
        }
        res.json(response);
    }
    catch (error) {
        console.error('❌ Error in VAPI credentials endpoint:', error);
        res.status(500).json({
            error: 'Internal server error',
            hasPublicKey: false,
            hasPrivateKey: false
        });
    }
});
router.put('/', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const userRole = req.user?.role;
        const userId = req.user?.id;
        if (userRole !== 'platform_owner' && userRole !== 'client_admin') {
            return res.status(403).json({ error: 'Insufficient permissions. Only admins can update VAPI credentials.' });
        }
        if (!organizationId) {
            return res.status(400).json({ error: 'User not associated with an organization' });
        }
        const { vapi_public_key, vapi_private_key, vapi_webhook_url } = req.body;
        if (vapi_public_key === undefined && vapi_private_key === undefined && vapi_webhook_url === undefined) {
            return res.status(400).json({ error: 'No credentials provided to update' });
        }
        if (vapi_public_key !== undefined && vapi_public_key !== null && vapi_public_key !== '') {
            if (typeof vapi_public_key !== 'string' || vapi_public_key.length < 10) {
                return res.status(400).json({ error: 'Invalid public key format' });
            }
        }
        if (vapi_private_key !== undefined && vapi_private_key !== null && vapi_private_key !== '') {
            if (typeof vapi_private_key !== 'string' || vapi_private_key.length < 10) {
                return res.status(400).json({ error: 'Invalid private key format' });
            }
        }
        const { data: currentOrg } = await supabase_client_1.default
            .from('organizations')
            .select('vapi_public_key, vapi_private_key, vapi_api_key')
            .eq('id', organizationId)
            .single();
        const updateData = {
            updated_at: new Date().toISOString()
        };
        let fieldChanged = '';
        if (vapi_public_key !== undefined) {
            updateData.vapi_public_key = vapi_public_key;
            updateData.vapi_api_key = vapi_public_key;
            fieldChanged = 'vapi_public_key';
        }
        if (vapi_private_key !== undefined) {
            updateData.vapi_private_key = vapi_private_key;
            fieldChanged = fieldChanged ? 'both' : 'vapi_private_key';
        }
        if (vapi_webhook_url !== undefined) {
            updateData.vapi_webhook_url = vapi_webhook_url;
        }
        updateData.settings = supabase_client_1.default.sql `
      COALESCE(settings, '{}'::jsonb) || 
      jsonb_build_object('vapi', jsonb_build_object(
        'publicKey', ${vapi_public_key !== undefined ? vapi_public_key : supabase_client_1.default.sql `COALESCE(settings->'vapi'->>'publicKey', vapi_public_key)`},
        'privateKey', ${vapi_private_key !== undefined ? vapi_private_key : supabase_client_1.default.sql `COALESCE(settings->'vapi'->>'privateKey', vapi_private_key)`},
        'webhookUrl', ${vapi_webhook_url !== undefined ? vapi_webhook_url : supabase_client_1.default.sql `COALESCE(settings->'vapi'->>'webhookUrl', vapi_webhook_url)`},
        'updated_at', ${new Date().toISOString()}
      ))
    `;
        const { data: organization, error } = await supabase_client_1.default
            .from('organizations')
            .update(updateData)
            .eq('id', organizationId)
            .select()
            .single();
        if (error) {
            console.error('❌ Error updating VAPI credentials:', error);
            return res.status(500).json({ error: 'Failed to update credentials' });
        }
        if (fieldChanged) {
            await logKeyChange(organizationId, userId, currentOrg ? 'UPDATE' : 'CREATE', fieldChanged, fieldChanged.includes('public') ? (currentOrg?.vapi_public_key || currentOrg?.vapi_api_key) : currentOrg?.vapi_private_key, fieldChanged.includes('public') ? vapi_public_key : vapi_private_key, req);
        }
        console.log('✅ VAPI credentials updated for organization:', organizationId);
        res.json({
            message: 'Credentials updated successfully',
            hasPublicKey: !!vapi_public_key,
            hasPrivateKey: !!vapi_private_key,
            webhookUrl: vapi_webhook_url || organization.vapi_webhook_url
        });
    }
    catch (error) {
        console.error('❌ Error updating VAPI credentials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const userRole = req.user?.role;
        const userId = req.user?.id;
        if (userRole !== 'platform_owner' && userRole !== 'client_admin') {
            return res.status(403).json({ error: 'Insufficient permissions. Only admins can delete VAPI credentials.' });
        }
        if (!organizationId) {
            return res.status(400).json({ error: 'User not associated with an organization' });
        }
        const { data: currentOrg } = await supabase_client_1.default
            .from('organizations')
            .select('vapi_public_key, vapi_private_key, vapi_api_key')
            .eq('id', organizationId)
            .single();
        const { error } = await supabase_client_1.default
            .from('organizations')
            .update({
            vapi_public_key: null,
            vapi_private_key: null,
            vapi_api_key: null,
            vapi_webhook_url: null,
            settings: supabase_client_1.default.sql `
          COALESCE(settings, '{}'::jsonb) - 'vapi'
        `,
            updated_at: new Date().toISOString()
        })
            .eq('id', organizationId);
        if (error) {
            console.error('❌ Error deleting VAPI credentials:', error);
            return res.status(500).json({ error: 'Failed to delete credentials' });
        }
        await logKeyChange(organizationId, userId, 'DELETE', 'both', currentOrg?.vapi_public_key || currentOrg?.vapi_api_key, undefined, req);
        console.log('✅ VAPI credentials deleted for organization:', organizationId);
        res.json({
            message: 'Credentials deleted successfully',
            hasPublicKey: false,
            hasPrivateKey: false
        });
    }
    catch (error) {
        console.error('❌ Error deleting VAPI credentials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
