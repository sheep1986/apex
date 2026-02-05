"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calls_data_service_1 = __importDefault(require("../services/calls-data-service"));
const stable_vapi_data_service_1 = require("../services/stable-vapi-data-service");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { page = '1', limit = '50', search = '', type = 'all', outcome = 'all', sentiment = 'all', agent = 'all', campaign = 'all', dateRange = 'all', sortBy = 'startTime', sortOrder = 'desc' } = req.query;
        const pageNum = parseInt(Array.isArray(page) ? page[0] : page, 10);
        const limitNum = parseInt(Array.isArray(limit) ? limit[0] : limit, 10);
        const searchStr = Array.isArray(search) ? search[0] : search;
        const typeStr = Array.isArray(type) ? type[0] : type;
        const outcomeStr = Array.isArray(outcome) ? outcome[0] : outcome;
        const sortByStr = Array.isArray(sortBy) ? sortBy[0] : sortBy;
        const sortOrderStr = Array.isArray(sortOrder) ? sortOrder[0] : sortOrder;
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
        const offset = (pageNum - 1) * limitNum;
        const { data: callsData, total, error } = await calls_data_service_1.default.getOrganizationCalls({
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
        const calls = callsData.map(call => ({
            id: call.vapi_call_id || call.id,
            type: call.direction === 'inbound' ? 'inbound' : 'outbound',
            contact: {
                name: call.customer_name || extractNameFromTranscript(call.transcript) || 'Unknown',
                phone: call.phone_number || 'Unknown',
                company: extractCompanyFromTranscript(call.transcript)
            },
            agent: {
                name: 'AI Assistant',
                type: 'ai'
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
            status: call.status === 'completed' || call.ended_at ? 'completed' : 'in-progress'
        }));
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
    }
    catch (error) {
        console.error('Error fetching calls:', error);
        res.status(500).json({
            error: 'Failed to fetch calls'
        });
    }
});
function extractNameFromTranscript(transcript) {
    if (!transcript)
        return undefined;
    const nameMatch = transcript.match(/(?:my name is|I'm|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    return nameMatch ? nameMatch[1] : undefined;
}
function extractCompanyFromTranscript(transcript) {
    if (!transcript)
        return undefined;
    const companyMatch = transcript.match(/(?:from|at|with)\s+([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Company|Ltd))/i);
    return companyMatch ? companyMatch[1] : undefined;
}
function mapCallStatusToOutcome(status) {
    if (!status)
        return 'unknown';
    const statusMap = {
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
function analyzeSentimentFromTranscript(text) {
    if (!text)
        return 'neutral';
    const positiveWords = /\b(great|good|yes|interested|perfect|awesome|wonderful|excellent|thank you)\b/gi;
    const negativeWords = /\b(no|not interested|busy|stop|remove|don't|won't|can't|bad)\b/gi;
    const positiveCount = (text.match(positiveWords) || []).length;
    const negativeCount = (text.match(negativeWords) || []).length;
    if (positiveCount > negativeCount)
        return 'positive';
    if (negativeCount > positiveCount)
        return 'negative';
    return 'neutral';
}
function calculateCallMetrics(calls) {
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
router.get('/metrics', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({
                error: 'Organization ID not found'
            });
        }
        const stats = await calls_data_service_1.default.getOrganizationCallMetrics(organizationId);
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
        const metrics = stats;
        res.json(metrics);
    }
    catch (error) {
        console.error('Error fetching call metrics:', error);
        res.status(500).json({
            error: 'Failed to fetch call metrics'
        });
    }
});
router.post('/export', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({
                error: 'Organization ID not found'
            });
        }
        const { filters = {}, searchTerm = '' } = req.body;
        const csvData = await calls_data_service_1.default.exportCallsToCSV(organizationId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=calls-export.csv');
        res.send(csvData);
    }
    catch (error) {
        console.error('Error exporting calls:', error);
        res.status(500).json({
            error: 'Failed to export calls'
        });
    }
});
router.get('/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                error: 'Valid email address required'
            });
        }
        const calls = await stable_vapi_data_service_1.StableVapiDataService.getUserRecentCalls(email, 100);
        res.json({
            success: true,
            data: calls
        });
    }
    catch (error) {
        console.error('Error fetching user calls:', error);
        res.status(500).json({
            error: 'Failed to fetch user calls'
        });
    }
});
router.get('/stats/:email', async (req, res) => {
    try {
        const { email } = req.params;
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                error: 'Valid email address required'
            });
        }
        const stats = await stable_vapi_data_service_1.StableVapiDataService.getUserCallStats(email);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching user call stats:', error);
        res.status(500).json({
            error: 'Failed to fetch user call stats'
        });
    }
});
exports.default = router;
