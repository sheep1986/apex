
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/services/supabase-client';
import { format } from 'date-fns';
import { Clock, Download, FileText, Search, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuditLog {
    id: string;
    created_at: string;
    action: string;
    resource_type: string;
    resource_id: string;
    actor_id: string;
    changed_fields: string[];
}

export default function AuditLogs() {
    const { organization } = useSupabaseAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
                .limit(100);
            
            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Audit Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => 
        log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.actor_id && log.actor_id.includes(searchTerm))
    );

    const exportLogs = () => {
        const csv = [
            ['Timestamp', 'Actor', 'Action', 'Resource', 'Changes'].join(','),
            ...filteredLogs.map(log => [
                log.created_at,
                log.actor_id || 'System',
                log.action,
                log.resource_type,
                `"${(log.changed_fields || []).join(';')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                 {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-emerald-500" />
                        <div>
                        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                        <p className="text-gray-400">Immutable record of system modifications</p>
                        </div>
                    </div>
                    <Button
                        onClick={exportLogs}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>

                <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                        <CardTitle className=" text-gray-200 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-400" />
                                <span>Recent Entries (100)</span>
                            </div>
                            <div className="w-64">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input 
                                        placeholder="Search logs..." 
                                        className="pl-8 bg-gray-950 border-gray-700 text-white h-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-gray-800 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-950">
                                    <TableRow className="border-gray-800 hover:bg-gray-950">
                                        <TableHead className="text-gray-400">Timestamp</TableHead>
                                        <TableHead className="text-gray-400">Actor</TableHead>
                                        <TableHead className="text-gray-400">Action</TableHead>
                                        <TableHead className="text-gray-400">Resource</TableHead>
                                        <TableHead className="text-gray-400">Changes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading immutable logs...</TableCell>
                                        </TableRow>
                                    ) : filteredLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">No audit records found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredLogs.map((log) => (
                                            <TableRow key={log.id} className="border-gray-800 hover:bg-gray-800/50">
                                                <TableCell className="font-mono text-xs text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-gray-600" />
                                                        {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-300">
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3 text-gray-500" />
                                                        <span className="font-mono text-xs">{log.actor_id ? log.actor_id.slice(0, 8) : 'System'}...</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                                        log.action === 'DELETE' ? 'bg-red-900/50 text-red-200 border border-red-900' :
                                                        log.action === 'UPDATE' ? 'bg-blue-900/50 text-blue-200 border border-blue-900' :
                                                        'bg-emerald-900/50 text-emerald-200 border border-emerald-900'
                                                    }`}>
                                                        {log.action}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-400 text-xs font-mono">
                                                    {log.resource_type}
                                                </TableCell>
                                                <TableCell className="text-gray-500 text-xs truncate max-w-[200px]">
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
            </div>
        </div>
    );
}
