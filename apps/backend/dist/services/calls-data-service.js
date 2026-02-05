"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallsDataService = void 0;
const supabase_client_1 = __importDefault(require("./supabase-client"));
class CallsDataService {
    static async getOrganizationCalls(filters) {
        try {
            const { organizationId, page = 1, limit = 50, search = '', type = 'all', outcome = 'all', status = 'all', sortBy = 'started_at', sortOrder = 'desc' } = filters;
            const offset = (page - 1) * limit;
            let query = supabase_client_1.default
                .from('calls')
                .select('*', { count: 'exact' })
                .eq('organization_id', organizationId);
            if (type !== 'all') {
                query = query.eq('direction', type);
            }
            if (outcome !== 'all') {
                query = query.eq('outcome', outcome);
            }
            if (status !== 'all') {
                query = query.eq('status', status);
            }
            if (search) {
                query = query.or(`transcript.ilike.%${search}%,summary.ilike.%${search}%,customer_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
            }
            query = query
                .order(sortBy, { ascending: sortOrder === 'asc' })
                .range(offset, offset + limit - 1);
            const { data, error, count } = await query;
            if (error) {
                console.error('❌ Error fetching organization calls:', error);
                return { data: [], total: 0, error: error.message };
            }
            return { data: data || [], total: count || 0 };
        }
        catch (error) {
            console.error('❌ Error in getOrganizationCalls:', error);
            return {
                data: [],
                total: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    static async getOrganizationCallMetrics(organizationId) {
        try {
            const { data, error } = await supabase_client_1.default
                .from('calls')
                .select('status, duration, cost, sentiment, outcome')
                .eq('organization_id', organizationId);
            if (error) {
                console.error('❌ Error fetching call metrics:', error);
                return null;
            }
            if (!data || data.length === 0) {
                return {
                    totalCalls: 0,
                    connectedCalls: 0,
                    totalDuration: 0,
                    totalCost: 0,
                    averageDuration: 0,
                    connectionRate: 0,
                    positiveRate: 0
                };
            }
            const totalCalls = data.length;
            const connectedCalls = data.filter(call => call.status === 'completed' || call.status === 'answered').length;
            const totalDuration = data.reduce((sum, call) => sum + (call.duration || 0), 0);
            const totalCost = data.reduce((sum, call) => sum + (call.cost || 0), 0);
            const positiveCalls = data.filter(call => call.sentiment === 'positive').length;
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
        catch (error) {
            console.error('❌ Error in getOrganizationCallMetrics:', error);
            return null;
        }
    }
    static async getCallById(callId, organizationId) {
        try {
            const { data, error } = await supabase_client_1.default
                .from('calls')
                .select('*')
                .eq('id', callId)
                .eq('organization_id', organizationId)
                .single();
            if (error) {
                console.error('❌ Error fetching call by ID:', error);
                return null;
            }
            return data;
        }
        catch (error) {
            console.error('❌ Error in getCallById:', error);
            return null;
        }
    }
    static async exportCallsToCSV(organizationId) {
        try {
            const { data } = await this.getOrganizationCalls({
                organizationId,
                limit: 1000
            });
            if (!data || data.length === 0) {
                return 'No call data available for export';
            }
            const headers = [
                'Call ID',
                'Direction',
                'Status',
                'Started At',
                'Duration (s)',
                'Cost ($)',
                'Phone Number',
                'Customer Name',
                'Outcome',
                'Sentiment',
                'Summary'
            ];
            const csvRows = [headers.join(',')];
            data.forEach(call => {
                const row = [
                    call.vapi_call_id || call.id,
                    call.direction,
                    call.status,
                    call.started_at,
                    call.duration || 0,
                    call.cost || 0,
                    call.phone_number || '',
                    call.customer_name || '',
                    call.outcome || '',
                    call.sentiment || '',
                    (call.summary || '').replace(/"/g, '""')
                ];
                csvRows.push(row.map(field => `"${field}"`).join(','));
            });
            return csvRows.join('\n');
        }
        catch (error) {
            console.error('❌ Error exporting calls to CSV:', error);
            return 'Error generating CSV export';
        }
    }
}
exports.CallsDataService = CallsDataService;
exports.default = CallsDataService;
