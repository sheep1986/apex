
import { format } from 'date-fns';
import { FileText, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../services/supabase-service';

interface AuditLog {
    id: string;
    created_at: string;
    action: string;
    resource_type: string;
    resource_id: string;
    actor_id: string;
    changed_fields: string[];
}

export function AuditLogViewer() {
    const { organization } = useSupabaseAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!organization) return;
        fetchLogs();
    }, [organization]);

    const fetchLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('organization_id', organization!.id)
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Audit Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-400" />
                    Immutable Audit Log (Last 50)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-slate-800 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-950">
                            <TableRow className="border-slate-800 hover:bg-slate-950">
                                <TableHead className="text-slate-400">Timestamp</TableHead>
                                <TableHead className="text-slate-400">Actor</TableHead>
                                <TableHead className="text-slate-400">Action</TableHead>
                                <TableHead className="text-slate-400">Resource</TableHead>
                                <TableHead className="text-slate-400">Changes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">Loading...</TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">No audit records found.</TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/50">
                                        <TableCell className="font-mono text-xs text-slate-300">
                                            {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                                        </TableCell>
                                        <TableCell className="text-slate-300 flex items-center gap-1">
                                            <User className="h-3 w-3 text-slate-500" />
                                            <span className="font-mono text-xs">{log.actor_id?.slice(0, 8)}...</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                                log.action === 'DELETE' ? 'bg-red-900/50 text-red-200' :
                                                log.action === 'UPDATE' ? 'bg-blue-900/50 text-blue-200' :
                                                'bg-emerald-900/50 text-emerald-200'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-400 text-xs">
                                            {log.resource_type}
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-xs truncate max-w-[200px]">
                                            {log.changed_fields?.join(', ') || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
