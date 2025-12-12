import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateUser } from '../middleware/clerk-auth';
import { VAPIIntegrationService } from '../services/vapi-integration-service';
import { createClient } from '@supabase/supabase-js';

// Create supabase client directly if module not found
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const router = Router();

// Apply authentication
router.use(authenticateUser);

// GET /api/vapi-data/assistants - Get VAPI assistants for the user's organization
router.get('/assistants', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({ 
        error: 'User not associated with an organization',
        assistants: [] 
      });
    }

    console.log('🔍 Fetching VAPI assistants for organization:', organizationId);

    // Get VAPI service for the organization
    const vapiService = await VAPIIntegrationService.forOrganization(organizationId);
    
    if (!vapiService) {
      console.log('⚠️ No VAPI service available for organization');
      return res.json({ 
        assistants: [],
        message: 'VAPI integration not configured. Please add your VAPI API key in Organization Settings.',
        requiresConfiguration: true
      });
    }

    // Fetch assistants from VAPI
    const assistants = await vapiService.listAssistants();
    
    console.log(`✅ Retrieved ${assistants.length} assistants from VAPI`);
    
    res.json({ 
      assistants,
      count: assistants.length 
    });

  } catch (error) {
    console.error('❌ Error fetching VAPI assistants:', error);
    res.status(500).json({ 
      error: 'Failed to fetch assistants',
      assistants: [] 
    });
  }
});

// GET /api/vapi-data/phone-numbers - Get VAPI phone numbers for the user's organization
router.get('/phone-numbers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({ 
        error: 'User not associated with an organization',
        phoneNumbers: [] 
      });
    }

    console.log('📱 Fetching phone numbers for organization:', organizationId);

    // First try to fetch from Supabase
    let phoneNumbers = [];
    
    try {
      const { data: dbPhoneNumbers, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('organization_id', organizationId);
        
      if (!error && dbPhoneNumbers && dbPhoneNumbers.length > 0) {
        console.log(`✅ Found ${dbPhoneNumbers.length} phone numbers in database`);
        // Transform to match VAPI format
        phoneNumbers = dbPhoneNumbers.map(phone => ({
          id: phone.id,
          number: phone.number,
          provider: phone.provider || 'vapi',
          country: phone.country_code || 'US',
          name: phone.number,
          status: phone.status
        }));
      } else {
        console.log('📡 No phone numbers in database, trying VAPI API...');
        // Fallback to VAPI API
        const vapiService = await VAPIIntegrationService.forOrganization(organizationId);
        
        if (!vapiService) {
          console.log('⚠️ No VAPI service available for organization');
          return res.json({ 
            phoneNumbers: [],
            message: 'VAPI integration not configured. Please add your VAPI API key in Organization Settings.',
            requiresConfiguration: true
          });
        }

        // Fetch phone numbers from VAPI
        phoneNumbers = await vapiService.getPhoneNumbers();
      }
    } catch (error) {
      console.error('Error fetching from database, trying VAPI:', error);
      // Try VAPI as fallback
      const vapiService = await VAPIIntegrationService.forOrganization(organizationId);
      if (vapiService) {
        phoneNumbers = await vapiService.getPhoneNumbers();
      }
    }
    
    console.log(`✅ Retrieved ${phoneNumbers.length} phone numbers from VAPI`);
    
    res.json({ 
      phoneNumbers,
      count: phoneNumbers.length 
    });

  } catch (error) {
    console.error('❌ Error fetching VAPI phone numbers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch phone numbers',
      phoneNumbers: [] 
    });
  }
});

// GET /api/vapi-data/all - Get all VAPI data (assistants and phone numbers)
router.get('/all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({ 
        error: 'User not associated with an organization',
        assistants: [],
        phoneNumbers: [] 
      });
    }

    console.log('🔄 Fetching all VAPI data for organization:', organizationId);

    // Get VAPI service for the organization
    const vapiService = await VAPIIntegrationService.forOrganization(organizationId);
    
    if (!vapiService) {
      console.log('⚠️ No VAPI service available for organization');
      return res.json({ 
        assistants: [],
        phoneNumbers: [],
        message: 'VAPI integration not configured' 
      });
    }

    // Fetch both assistants and phone numbers in parallel
    const [assistants, phoneNumbers] = await Promise.all([
      vapiService.listAssistants().catch(() => []),
      vapiService.getPhoneNumbers().catch(() => [])
    ]);
    
    console.log(`✅ Retrieved ${assistants.length} assistants and ${phoneNumbers.length} phone numbers from VAPI`);
    
    res.json({ 
      assistants,
      phoneNumbers,
      assistantCount: assistants.length,
      phoneNumberCount: phoneNumbers.length
    });

  } catch (error) {
    console.error('❌ Error fetching VAPI data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch VAPI data',
      assistants: [],
      phoneNumbers: [] 
    });
  }
});

// POST /api/vapi-data/sync-call/:callId - Sync a single call from VAPI
router.post('/sync-call/:callId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const { callId } = req.params;

    if (!organizationId) {
      return res.status(400).json({ error: 'User not associated with an organization' });
    }

    if (!callId) {
      return res.status(400).json({ error: 'Call ID is required' });
    }

    console.log('🔄 Syncing call from VAPI:', callId);

    // Get VAPI service for the organization
    const vapiService = await VAPIIntegrationService.forOrganization(organizationId);

    if (!vapiService) {
      return res.status(400).json({
        error: 'VAPI integration not configured. Please add your VAPI API key in Organization Settings.'
      });
    }

    // Fetch call details from VAPI
    const vapiCall = await vapiService.getCall(callId);

    if (!vapiCall) {
      return res.status(404).json({ error: 'Call not found in VAPI' });
    }

    console.log('📞 VAPI call data:', {
      id: vapiCall.id,
      status: vapiCall.status,
      duration: vapiCall.duration,
      cost: vapiCall.cost,
      hasRecording: !!vapiCall.recordingUrl,
      hasTranscript: !!vapiCall.transcript
    });

    // Calculate duration from timestamps if not provided
    let duration = vapiCall.duration || 0;
    if (!duration && vapiCall.startedAt && vapiCall.endedAt) {
      const startTime = new Date(vapiCall.startedAt).getTime();
      const endTime = new Date(vapiCall.endedAt).getTime();
      duration = Math.round((endTime - startTime) / 1000);
    }

    // Build transcript from messages if not available
    let transcript = vapiCall.transcript || '';
    if (!transcript && vapiCall.messages && vapiCall.messages.length > 0) {
      transcript = vapiCall.messages
        .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg: any) => `${msg.role === 'assistant' ? 'AI' : 'User'}: ${msg.message}`)
        .join('\n');
    }

    // Update call record in database
    const updateData = {
      vapi_call_id: vapiCall.id,
      duration: duration,
      cost: vapiCall.cost || 0,
      recording_url: vapiCall.recordingUrl || vapiCall.stereoRecordingUrl || null,
      transcript: transcript || null,
      summary: vapiCall.summary || vapiCall.analysis?.summary || null,
      status: vapiCall.status === 'ended' ? 'completed' : vapiCall.status,
      started_at: vapiCall.startedAt,
      ended_at: vapiCall.endedAt,
      outcome: mapVapiStatusToOutcome(vapiCall.endedReason, duration),
      sentiment: vapiCall.analysis?.userSentiment || null,
      updated_at: new Date().toISOString()
    };

    // Try to update existing call or insert new one
    const { data: existingCall } = await supabase
      .from('calls')
      .select('id')
      .or(`id.eq.${callId},vapi_call_id.eq.${callId}`)
      .single();

    let savedCall;
    if (existingCall) {
      // Update existing call
      const { data, error } = await supabase
        .from('calls')
        .update(updateData)
        .or(`id.eq.${callId},vapi_call_id.eq.${callId}`)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating call:', error);
        return res.status(500).json({ error: 'Failed to update call record' });
      }
      savedCall = data;
    } else {
      // Insert new call
      const { data, error } = await supabase
        .from('calls')
        .insert({
          id: callId,
          organization_id: organizationId,
          ...updateData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting call:', error);
        return res.status(500).json({ error: 'Failed to create call record' });
      }
      savedCall = data;
    }

    console.log('✅ Call synced successfully:', savedCall.id);

    res.json({
      success: true,
      call: savedCall,
      vapiData: {
        duration,
        cost: vapiCall.cost,
        hasRecording: !!vapiCall.recordingUrl,
        hasTranscript: !!transcript
      }
    });

  } catch (error) {
    console.error('❌ Error syncing call from VAPI:', error);
    res.status(500).json({ error: 'Failed to sync call' });
  }
});

// POST /api/vapi-data/sync-calls - Sync all recent calls from VAPI
router.post('/sync-calls', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const { campaignId, limit = 100 } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'User not associated with an organization' });
    }

    console.log('🔄 Syncing calls from VAPI for organization:', organizationId);

    // Get VAPI service for the organization
    const vapiService = await VAPIIntegrationService.forOrganization(organizationId);

    if (!vapiService) {
      return res.status(400).json({
        error: 'VAPI integration not configured. Please add your VAPI API key in Organization Settings.'
      });
    }

    // Fetch recent calls from VAPI
    const vapiCalls = await vapiService.listCalls({ limit });

    console.log(`📞 Found ${vapiCalls.length} calls in VAPI`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const vapiCall of vapiCalls) {
      try {
        // Calculate duration
        let duration = vapiCall.duration || 0;
        if (!duration && vapiCall.startedAt && vapiCall.endedAt) {
          const startTime = new Date(vapiCall.startedAt).getTime();
          const endTime = new Date(vapiCall.endedAt).getTime();
          duration = Math.round((endTime - startTime) / 1000);
        }

        // Build transcript from messages
        let transcript = vapiCall.transcript || '';
        if (!transcript && vapiCall.messages && vapiCall.messages.length > 0) {
          transcript = vapiCall.messages
            .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
            .map((msg: any) => `${msg.role === 'assistant' ? 'AI' : 'User'}: ${msg.message}`)
            .join('\n');
        }

        const callData = {
          id: vapiCall.id,
          vapi_call_id: vapiCall.id,
          organization_id: organizationId,
          campaign_id: campaignId || null,
          customer_phone: vapiCall.customer?.number || null,
          customer_name: vapiCall.customer?.name || null,
          duration: duration,
          cost: vapiCall.cost || 0,
          recording_url: vapiCall.recordingUrl || vapiCall.stereoRecordingUrl || null,
          transcript: transcript || null,
          summary: vapiCall.summary || vapiCall.analysis?.summary || null,
          status: vapiCall.status === 'ended' ? 'completed' : vapiCall.status,
          started_at: vapiCall.startedAt,
          ended_at: vapiCall.endedAt,
          outcome: mapVapiStatusToOutcome(vapiCall.endedReason, duration),
          sentiment: vapiCall.analysis?.userSentiment || null,
          direction: vapiCall.type?.includes('inbound') ? 'inbound' : 'outbound',
          created_at: vapiCall.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Upsert call record
        const { error } = await supabase
          .from('calls')
          .upsert(callData, { onConflict: 'id' });

        if (error) {
          console.error(`❌ Error syncing call ${vapiCall.id}:`, error);
          errorCount++;
        } else {
          syncedCount++;
        }
      } catch (err) {
        console.error(`❌ Error processing call ${vapiCall.id}:`, err);
        errorCount++;
      }
    }

    console.log(`✅ Sync complete: ${syncedCount} synced, ${errorCount} errors`);

    res.json({
      success: true,
      totalCalls: vapiCalls.length,
      syncedCount,
      errorCount
    });

  } catch (error) {
    console.error('❌ Error syncing calls from VAPI:', error);
    res.status(500).json({ error: 'Failed to sync calls' });
  }
});

// Helper function to map VAPI status to outcome
function mapVapiStatusToOutcome(endedReason?: string, duration?: number): string {
  if (!endedReason) {
    return duration && duration > 30 ? 'connected' : 'unknown';
  }

  if (endedReason === 'customer-ended-call') return 'connected';
  if (endedReason === 'assistant-ended-call') return 'completed';
  if (endedReason.includes('pipeline-error')) return 'failed';
  if (endedReason === 'silence-timeout') return 'no_answer';
  if (endedReason === 'exceeded-max-duration') return 'connected';

  return duration && duration > 30 ? 'connected' : 'no_answer';
}

export default router;