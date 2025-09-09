"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clerk_auth_1 = require("../middleware/clerk-auth");
const vapi_integration_service_1 = require("../services/vapi-integration-service");
const supabase_client_1 = __importDefault(require("../services/supabase-client"));
const router = (0, express_1.Router)();
router.use(clerk_auth_1.authenticateUser);
router.post('/test', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const userRole = req.user?.role;
        if (userRole !== 'platform_owner' && userRole !== 'client_admin') {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: 'Only administrators can test VAPI connection'
            });
        }
        if (!organizationId) {
            return res.status(400).json({
                error: 'User not associated with an organization'
            });
        }
        console.log('🔌 Testing VAPI connection for organization:', organizationId);
        const vapiService = await vapi_integration_service_1.VAPIIntegrationService.forOrganization(organizationId);
        if (!vapiService) {
            return res.status(400).json({
                error: 'VAPI not configured',
                message: 'Please configure VAPI credentials first',
                hasCredentials: false
            });
        }
        const testResult = await vapiService.testConnection();
        console.log('🔌 VAPI connection test result:', testResult);
        if (testResult.connected) {
            await supabase_client_1.default
                .from('organizations')
                .update({
                settings: supabase_client_1.default.sql `
            COALESCE(settings, '{}'::jsonb) || 
            jsonb_build_object('vapi', 
              COALESCE(settings->'vapi', '{}'::jsonb) || 
              jsonb_build_object(
                'lastTested', ${new Date().toISOString()},
                'testResult', ${JSON.stringify(testResult)}::jsonb
              )
            )
          `,
                updated_at: new Date().toISOString()
            })
                .eq('id', organizationId);
        }
        res.json({
            success: testResult.connected,
            message: testResult.message,
            details: testResult.details,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Error testing VAPI connection:', error);
        res.status(500).json({
            success: false,
            error: 'Connection test failed',
            message: error.message || 'Internal server error'
        });
    }
});
router.post('/assistants', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const userRole = req.user?.role;
        if (userRole !== 'platform_owner' && userRole !== 'client_admin') {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: 'Only administrators can sync VAPI assistants'
            });
        }
        if (!organizationId) {
            return res.status(400).json({
                error: 'User not associated with an organization'
            });
        }
        console.log('🔄 Syncing VAPI assistants for organization:', organizationId);
        const vapiService = await vapi_integration_service_1.VAPIIntegrationService.forOrganization(organizationId);
        if (!vapiService) {
            return res.status(400).json({
                error: 'VAPI not configured',
                message: 'Please configure VAPI credentials first',
                hasCredentials: false
            });
        }
        const syncResult = await vapiService.syncAssistants();
        console.log('🔄 Assistant sync result:', syncResult);
        if (syncResult.success) {
            await supabase_client_1.default
                .from('organizations')
                .update({
                settings: supabase_client_1.default.sql `
            COALESCE(settings, '{}'::jsonb) || 
            jsonb_build_object('vapi', 
              COALESCE(settings->'vapi', '{}'::jsonb) || 
              jsonb_build_object(
                'lastAssistantSync', ${new Date().toISOString()},
                'assistantCount', ${syncResult.count}
              )
            )
          `,
                updated_at: new Date().toISOString()
            })
                .eq('id', organizationId);
        }
        res.json({
            success: syncResult.success,
            count: syncResult.count,
            message: syncResult.success
                ? `Successfully synced ${syncResult.count} assistants`
                : syncResult.error || 'Sync failed',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Error syncing assistants:', error);
        res.status(500).json({
            success: false,
            error: 'Assistant sync failed',
            message: error.message || 'Internal server error'
        });
    }
});
router.post('/phone-numbers', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const userRole = req.user?.role;
        if (userRole !== 'platform_owner' && userRole !== 'client_admin') {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: 'Only administrators can sync VAPI phone numbers'
            });
        }
        if (!organizationId) {
            return res.status(400).json({
                error: 'User not associated with an organization'
            });
        }
        console.log('🔄 Syncing VAPI phone numbers for organization:', organizationId);
        const vapiService = await vapi_integration_service_1.VAPIIntegrationService.forOrganization(organizationId);
        if (!vapiService) {
            return res.status(400).json({
                error: 'VAPI not configured',
                message: 'Please configure VAPI credentials first',
                hasCredentials: false
            });
        }
        const syncResult = await vapiService.syncPhoneNumbers();
        console.log('🔄 Phone number sync result:', syncResult);
        if (syncResult.success) {
            await supabase_client_1.default
                .from('organizations')
                .update({
                settings: supabase_client_1.default.sql `
            COALESCE(settings, '{}'::jsonb) || 
            jsonb_build_object('vapi', 
              COALESCE(settings->'vapi', '{}'::jsonb) || 
              jsonb_build_object(
                'lastPhoneSync', ${new Date().toISOString()},
                'phoneCount', ${syncResult.count}
              )
            )
          `,
                updated_at: new Date().toISOString()
            })
                .eq('id', organizationId);
        }
        res.json({
            success: syncResult.success,
            count: syncResult.count,
            message: syncResult.success
                ? `Successfully synced ${syncResult.count} phone numbers`
                : syncResult.error || 'Sync failed',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Error syncing phone numbers:', error);
        res.status(500).json({
            success: false,
            error: 'Phone number sync failed',
            message: error.message || 'Internal server error'
        });
    }
});
router.post('/all', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const userRole = req.user?.role;
        if (userRole !== 'platform_owner' && userRole !== 'client_admin') {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: 'Only administrators can sync VAPI data'
            });
        }
        if (!organizationId) {
            return res.status(400).json({
                error: 'User not associated with an organization'
            });
        }
        console.log('🔄 Syncing all VAPI data for organization:', organizationId);
        const vapiService = await vapi_integration_service_1.VAPIIntegrationService.forOrganization(organizationId);
        if (!vapiService) {
            return res.status(400).json({
                error: 'VAPI not configured',
                message: 'Please configure VAPI credentials first',
                hasCredentials: false
            });
        }
        const [assistantResult, phoneResult] = await Promise.all([
            vapiService.syncAssistants(),
            vapiService.syncPhoneNumbers()
        ]);
        console.log('🔄 Full sync results:', { assistantResult, phoneResult });
        await supabase_client_1.default
            .from('organizations')
            .update({
            settings: supabase_client_1.default.sql `
          COALESCE(settings, '{}'::jsonb) || 
          jsonb_build_object('vapi', 
            COALESCE(settings->'vapi', '{}'::jsonb) || 
            jsonb_build_object(
              'lastFullSync', ${new Date().toISOString()},
              'assistantCount', ${assistantResult.count},
              'phoneCount', ${phoneResult.count}
            )
          )
        `,
            updated_at: new Date().toISOString()
        })
            .eq('id', organizationId);
        res.json({
            success: assistantResult.success && phoneResult.success,
            assistants: {
                success: assistantResult.success,
                count: assistantResult.count,
                error: assistantResult.error
            },
            phoneNumbers: {
                success: phoneResult.success,
                count: phoneResult.count,
                error: phoneResult.error
            },
            message: `Synced ${assistantResult.count} assistants and ${phoneResult.count} phone numbers`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Error in full sync:', error);
        res.status(500).json({
            success: false,
            error: 'Full sync failed',
            message: error.message || 'Internal server error'
        });
    }
});
router.get('/status', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const userRole = req.user?.role;
        if (userRole !== 'platform_owner' && userRole !== 'client_admin') {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: 'Only administrators can view sync status'
            });
        }
        if (!organizationId) {
            return res.status(400).json({
                error: 'User not associated with an organization'
            });
        }
        const { data: org, error } = await supabase_client_1.default
            .from('organizations')
            .select('settings, vapi_public_key, vapi_private_key')
            .eq('id', organizationId)
            .single();
        if (error || !org) {
            return res.status(404).json({
                error: 'Organization not found'
            });
        }
        const vapiSettings = org.settings?.vapi || {};
        const hasCredentials = !!(org.vapi_private_key && (org.vapi_public_key || org.vapi_api_key));
        const [assistantCount, phoneCount] = await Promise.all([
            supabase_client_1.default
                .from('vapi_assistants')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId)
                .eq('is_active', true),
            supabase_client_1.default
                .from('phone_numbers')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId)
                .eq('provider', 'vapi')
                .eq('is_active', true)
        ]);
        res.json({
            hasCredentials,
            configured: hasCredentials,
            lastTested: vapiSettings.lastTested,
            testResult: vapiSettings.testResult,
            lastAssistantSync: vapiSettings.lastAssistantSync,
            lastPhoneSync: vapiSettings.lastPhoneSync,
            lastFullSync: vapiSettings.lastFullSync,
            localCounts: {
                assistants: assistantCount.count || 0,
                phoneNumbers: phoneCount.count || 0
            },
            syncedCounts: {
                assistants: vapiSettings.assistantCount || 0,
                phoneNumbers: vapiSettings.phoneCount || 0
            }
        });
    }
    catch (error) {
        console.error('❌ Error getting sync status:', error);
        res.status(500).json({
            error: 'Failed to get sync status',
            message: error.message || 'Internal server error'
        });
    }
});
exports.default = router;
