import { Request, Response, Router } from 'express';
import CallsDataService from '../services/calls-data-service';
import { StableVapiDataService } from '../services/stable-vapi-data-service';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes

/**
 * CALLS API
 * 
 * Provides endpoints to access and manage call data
 */

/**
 * GET /api/calls
 * Get all calls for the current user/organization with filtering, pagination, and search
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      search = '',
      type = 'all',
      outcome = 'all',
      sentiment = 'all',
      agent = 'all',
      campaign = 'all',
      dateRange = 'all',
      sortBy = 'startTime',
      sortOrder = 'desc'
    } = req.query;

    // Convert query parameters to correct types
    const pageNum = parseInt(Array.isArray(page) ? page[0] : page, 10);
    const limitNum = parseInt(Array.isArray(limit) ? limit[0] : limit, 10);
    const searchStr = Array.isArray(search) ? search[0] : search;
    const typeStr = Array.isArray(type) ? type[0] : type;
    const outcomeStr = Array.isArray(outcome) ? outcome[0] : outcome;
    const sortByStr = Array.isArray(sortBy) ? sortBy[0] : sortBy;
    const sortOrderStr = Array.isArray(sortOrder) ? sortOrder[0] : sortOrder as 'desc' | 'asc';

    // Get organization ID for filtering
    const organizationId = req.user?.organizationId;
    const userEmail = req.user?.email;
    
    console.log('🔍 AllCalls API: User authenticated:', !!req.user);
    console.log('🔍 AllCalls API: Organization ID:', organizationId);
    console.log('🔍 AllCalls API: User email:', userEmail);
    console.log('🔍 AllCalls API: Request query params:', req.query);
    
    if (!organizationId) {
      return res.status(400).json({
        error: 'Organization ID not found'
      });
    }

    // Calculate pagination
    const offset = (pageNum - 1) * limitNum;

    // Get calls data from the calls table
    const { data: callsData, total, error } = await CallsDataService.getOrganizationCalls({
      organizationId,
      page: pageNum,
      limit: limitNum,
      search: searchStr,
      type: typeStr,
      outcome: outcomeStr,
      sortBy: sortByStr,
      sortOrder: sortOrderStr
    });

    console.log('🔍 AllCalls API: Calls query result - total:', total, 'data count:', callsData?.length);
    console.log('🔍 AllCalls API: First call record:', callsData?.[0]);
    
    if (error) {
      console.error('❌ AllCalls API: Error fetching calls data:', error);
      return res.status(500).json({ error: 'Failed to fetch calls' });
    }

    // Transform call data to match frontend CallRecord interface
    const calls = callsData.map(call => ({
      id: call.vapi_call_id || call.id,
      type: call.direction === 'inbound' ? 'inbound' as const : 'outbound' as const,
      contact: {
        name: call.customer_name || extractNameFromTranscript(call.transcript) || 'Unknown',
        phone: call.phone_number || 'Unknown',
        company: extractCompanyFromTranscript(call.transcript)
      },
      agent: {
        name: 'AI Assistant',
        type: 'ai' as const
      },
      campaign: call.campaign_id ? {
        name: `Campaign ${call.campaign_id}`,
        id: call.campaign_id
      } : undefined,
      startTime: call.started_at,
      duration: call.duration || 0,
      outcome: call.outcome || mapCallStatusToOutcome(call.status),
      sentiment: call.sentiment || analyzeSentimentFromTranscript(call.transcript || call.summary),
      cost: call.cost || 0,
      recording: call.recording_url,
      transcript: call.transcript,
      notes: call.summary,
      status: call.status === 'completed' || call.ended_at ? 'completed' : 'in-progress' as const
    }));

    // Calculate metrics from the data
    const metrics = calculateCallMetrics(calls);

    console.log('✅ AllCalls API: Sending response - calls count:', calls.length, 'metrics:', metrics);

    res.json({
      success: true,
      calls,
      metrics,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calls' 
    });
  }
});

// Helper functions for data transformation
function extractNameFromTranscript(transcript?: string): string | undefined {
  if (!transcript) return undefined;
  // Simple name extraction - could be enhanced with better parsing
  const nameMatch = transcript.match(/(?:my name is|I'm|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
  return nameMatch ? nameMatch[1] : undefined;
}

function extractCompanyFromTranscript(transcript?: string): string | undefined {
  if (!transcript) return undefined;
  // Simple company extraction - could be enhanced
  const companyMatch = transcript.match(/(?:from|at|with)\s+([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Company|Ltd))/i);
  return companyMatch ? companyMatch[1] : undefined;
}

function mapCallStatusToOutcome(status?: string): string {
  if (!status) return 'unknown';
  
  const statusMap: Record<string, string> = {
    'ended': 'connected',
    'completed': 'connected', 
    'no-answer': 'no_answer',
    'busy': 'busy',
    'failed': 'failed',
    'voicemail': 'voicemail',
    'hangup': 'connected',
    'answered': 'connected'
  };
  
  return statusMap[status.toLowerCase()] || 'unknown';
}

function analyzeSentimentFromTranscript(text?: string): 'positive' | 'neutral' | 'negative' {
  if (!text) return 'neutral';
  
  // Simple sentiment analysis - could be enhanced with AI
  const positiveWords = /\b(great|good|yes|interested|perfect|awesome|wonderful|excellent|thank you)\b/gi;
  const negativeWords = /\b(no|not interested|busy|stop|remove|don't|won't|can't|bad)\b/gi;
  
  const positiveCount = (text.match(positiveWords) || []).length;
  const negativeCount = (text.match(negativeWords) || []).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function calculateCallMetrics(calls: any[]) {
  const totalCalls = calls.length;
  const connectedCalls = calls.filter(c => c.outcome === 'connected').length;
  const totalDuration = calls.reduce((sum, call) => sum + call.duration, 0);
  const totalCost = calls.reduce((sum, call) => sum + call.cost, 0);
  const positiveCalls = calls.filter(c => c.sentiment === 'positive').length;
  
  return {
    totalCalls,
    connectedCalls,
    totalDuration,
    totalCost,
    averageDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
    connectionRate: totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0,
    positiveRate: totalCalls > 0 ? Math.round((positiveCalls / totalCalls) * 100) : 0
  };
}

/**
 * GET /api/calls/metrics
 * Get call metrics summary
 */
router.get('/metrics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get organization ID for filtering
    const organizationId = req.user?.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({
        error: 'Organization ID not found'
      });
    }

    // Get call metrics from the service
    const stats = await CallsDataService.getOrganizationCallMetrics(organizationId);
    
    if (!stats) {
      return res.json({
        totalCalls: 0,
        connectedCalls: 0,
        totalDuration: 0,
        totalCost: 0,
        averageDuration: 0,
        connectionRate: 0,
        positiveRate: 0
      });
    }

    // Stats already match frontend expectations
    const metrics = stats;

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching call metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch call metrics' 
    });
  }
});

/**
 * POST /api/calls/export
 * Export calls to CSV
 */
router.post('/export', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get organization ID for filtering
    const organizationId = req.user?.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({
        error: 'Organization ID not found'
      });
    }

    const { filters = {}, searchTerm = '' } = req.body;

    // Generate CSV data using the service
    const csvData = await CallsDataService.exportCallsToCSV(organizationId);
    
    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=calls-export.csv');
    
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting calls:', error);
    res.status(500).json({ 
      error: 'Failed to export calls' 
    });
  }
});

/**
 * GET /api/calls/user/:email
 * Get calls for a specific user
 */
router.get('/user/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        error: 'Valid email address required' 
      });
    }

    const calls = await StableVapiDataService.getUserRecentCalls(email, 100);
    
    res.json({
      success: true,
      data: calls
    });
  } catch (error) {
    console.error('Error fetching user calls:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user calls' 
    });
  }
});

/**
 * GET /api/calls/stats/:email
 * Get call statistics for a specific user
 */
router.get('/stats/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        error: 'Valid email address required' 
      });
    }

    const stats = await StableVapiDataService.getUserCallStats(email);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching user call stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user call stats' 
    });
  }
});

export default router;