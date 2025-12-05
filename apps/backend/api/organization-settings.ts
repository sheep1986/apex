import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/clerk-auth';
import supabase from '../services/supabase-client';

const router = Router();

/**
 * GET /api/organization-settings/:settingKey
 * Get a specific organization setting
 */
router.get('/:settingKey', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { settingKey } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    if (!organizationId) {
      return res.status(400).json({
        error: 'Missing organization ID',
        message: 'x-organization-id header is required'
      });
    }

    console.log(`🔍 Fetching setting "${settingKey}" for organization:`, organizationId);

    // Get the organization to retrieve settings
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

    // Map setting keys to organization fields and defaults
    const settingDefaults: Record<string, any> = {
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

    // Get the setting value from organization or use default
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

    console.log(`✅ Setting "${settingKey}" retrieved:`, settingValue);

    res.json({
      settingKey,
      value: settingValue,
      organizationId
    });
  } catch (error: any) {
    console.error('❌ Error fetching organization setting:', error);
    res.status(500).json({
      error: 'Failed to fetch setting',
      message: error.message
    });
  }
});

/**
 * PUT /api/organization-settings/:settingKey
 * Update a specific organization setting
 */
router.put('/:settingKey', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { settingKey } = req.params;
    const { value } = req.body;
    const organizationId = req.headers['x-organization-id'] as string;

    if (!organizationId) {
      return res.status(400).json({
        error: 'Missing organization ID',
        message: 'x-organization-id header is required'
      });
    }

    console.log(`🔧 Updating setting "${settingKey}" for organization:`, organizationId);

    // Map setting keys to organization fields
    const settingFieldMap: Record<string, string> = {
      'max_concurrent_calls': 'max_concurrent_calls',
      'vapi/credentials': 'vapi_api_key'
    };

    const field = settingFieldMap[settingKey];

    if (!field) {
      return res.status(400).json({
        error: 'Invalid setting',
        message: `Setting "${settingKey}" cannot be updated directly`
      });
    }

    // Update the organization
    const updateData: any = {};

    if (settingKey === 'vapi/credentials') {
      updateData.vapi_api_key = value.apiKey || value;
      if (value.phoneNumberIds) updateData.vapi_phone_number_ids = value.phoneNumberIds;
      if (value.assistantIds) updateData.vapi_assistant_ids = value.assistantIds;
    } else {
      updateData[field] = value;
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating organization setting:', error);
      return res.status(500).json({
        error: 'Failed to update setting',
        message: error.message
      });
    }

    console.log(`✅ Setting "${settingKey}" updated successfully`);

    res.json({
      success: true,
      settingKey,
      value,
      organizationId
    });
  } catch (error: any) {
    console.error('❌ Error updating organization setting:', error);
    res.status(500).json({
      error: 'Failed to update setting',
      message: error.message
    });
  }
});

export default router;
