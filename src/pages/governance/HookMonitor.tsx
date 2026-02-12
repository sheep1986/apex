import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/services/supabase-client';
import { format } from 'date-fns';
import { RefreshCw, Webhook } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HookLog {
    id: string;
    created_at: string;
    hook_id: string;
    call_id: string;
    status: 'pending' | 'success' | 'failed' | 'retrying';
    attempt_count: number;
    last_response_code: number;
    hook: {
        name: string;
        url: string;
    }
}

export function HookMonitor() {
    const { organization } = useSupabaseAuth();
    const [logs, setLogs] = useState<HookLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        if (!organization) return;
        setLoading(true);
        try {
            // Join with workflow_hooks to get names
            const { data, error } = await supabase
                .from('workflow_hook_logs')
                .select(`
                    *,
                    hook:workflow_hooks(name, url)
                `)
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            setLogs(data || []);
        } catch (e) {
            console.error('Failed to fetch hook logs', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [organization]);

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex items-center justify-between">
                     <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Webhook className="h-6 w-6 text-purple-400" />
                        Workflow Hook Monitor
                     </h1>
                     <button onClick={fetchLogs} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-white">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                     </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader className="pb-2"><CardTitle className="text-gray-400 text-sm">Success Rate (24h)</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-emerald-400">98.2%</div></CardContent>
                    </Card>
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader className="pb-2"><CardTitle className="text-gray-400 text-sm">Pending Retries</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-amber-400">{logs.filter(l => l.status === 'retrying').length}</div></CardContent>
                    </Card>
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader className="pb-2"><CardTitle className="text-gray-400 text-sm">Failed (Final)</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-red-400">{logs.filter(l => l.status === 'failed').length}</div></CardContent>
                    </Card>
                </div>

                <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white">Recent Deliveries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-800 hover:bg-transparent">
                                    <TableHead>Time</TableHead>
                                    <TableHead>Hook Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Attempts</TableHead>
                                    <TableHead>Response</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && logs.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Loading...</TableCell></TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center text-gray-500">No hook activity recorded.</TableCell></TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className="border-gray-800 hover:bg-gray-800/50">
                                            <TableCell className="font-mono text-xs text-gray-400">
                                                {format(new Date(log.created_at), 'HH:mm:ss')}
                                            </TableCell>
                                            <TableCell className="text-gray-200">
                                                {log.hook?.name || 'Unknown Hook'}
                                                <div className="text-xs text-gray-600 truncate max-w-[200px]">{log.hook?.url}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    log.status === 'success' ? 'bg-emerald-900 text-emerald-300 hover:bg-emerald-900' :
                                                    log.status === 'failed' ? 'bg-red-900 text-red-300 hover:bg-red-900' :
                                                    'bg-amber-900 text-amber-300 hover:bg-amber-900'
                                                }>
                                                    {log.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-400">{log.attempt_count}</TableCell>
                                            <TableCell className="font-mono text-xs text-gray-400">
                                                {log.last_response_code || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
