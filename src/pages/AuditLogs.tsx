
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/services/supabase-client';
import { format, subDays } from 'date-fns';
import { Calendar, Clock, Download, FileText, Loader2, Search, Shield, User } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface AuditLog {
    id: string;
    created_at: string;
    action: string;
    resource_type: string;
    resource_id: string;
    actor_id: string;
    changed_fields: string[];
    actor_name?: string;
    actor_email?: string;
}

const DATE_RANGES = [
    { label: 'Last 24 hours', value: '1' },
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'All time', value: 'all' },
];

const ACTION_TYPES = ['All', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'INVITE', 'ROLE_CHANGE'];

export default function AuditLogs() {
    const { organization } = useSupabaseAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('30');
    const [actionFilter, setActionFilter] = useState('All');

    const resolveActors = useCallback(async (logEntries: AuditLog[]): Promise<AuditLog[]> => {
        const actorIds = [...new Set(logEntries.map(l => l.actor_id).filter(Boolean))];
        if (actorIds.length === 0) return logEntries;

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, first_name, last_name')
            .in('id', actorIds);

        const profileMap = new Map<string, { email: string; name: string }>();
        (profiles || []).forEach((p: any) => {
            const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email;
            profileMap.set(p.id, { email: p.email, name });
        });

        return logEntries.map(log => ({
            ...log,
            actor_name: profileMap.get(log.actor_id)?.name,
            actor_email: profileMap.get(log.actor_id)?.email,
        }));
    }, []);

    const fetchLogs = useCallback(async () => {
        if (!organization?.id) return;
        setLoading(true);
        try {
            let query = supabase
                .from('audit_logs')
                .select('*')
                .eq('organization_id', organization.id)
                .order('created_at', { ascending: false })
                .limit(500);

            if (dateRange !== 'all') {
                const since = subDays(new Date(), parseInt(dateRange)).toISOString();
                query = query.gte('created_at', since);
            }

            if (actionFilter !== 'All') {
                query = query.eq('action', actionFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            const resolved = await resolveActors(data || []);
            setLogs(resolved);
        } catch (err) {
            console.error('Audit log fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [organization?.id, dateRange, actionFilter, resolveActors]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filteredLogs = useMemo(() => {
        if (!searchTerm.trim()) return logs;
        const term = searchTerm.toLowerCase();
        return logs.filter(log =>
            log.resource_type.toLowerCase().includes(term) ||
            log.action.toLowerCase().includes(term) ||
            (log.actor_name && log.actor_name.toLowerCase().includes(term)) ||
            (log.actor_email && log.actor_email.toLowerCase().includes(term)) ||
            (log.actor_id && log.actor_id.includes(searchTerm))
        );
    }, [logs, searchTerm]);

    const exportLogs = () => {
        const csv = [
            ['Timestamp', 'Actor', 'Email', 'Action', 'Resource', 'Changes'].join(','),
            ...filteredLogs.map(log => [
                log.created_at,
                log.actor_name || log.actor_id || 'System',
                log.actor_email || '',
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
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <Shield className="h-8 w-8 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                            <p className="text-gray-400">Immutable record of system modifications</p>
                        </div>
                    </div>
                    <Button
                        onClick={exportLogs}
                        disabled={filteredLogs.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <Input
                            placeholder="Search by actor, action, or resource..."
                            className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-44 bg-gray-900 border-gray-700 text-white">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                            {DATE_RANGES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="w-36 bg-gray-900 border-gray-700 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                            {ACTION_TYPES.map((a) => (
                                <SelectItem key={a} value={a}>{a === 'All' ? 'All Actions' : a}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-gray-200 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-400" />
                                <span>{filteredLogs.length} {filteredLogs.length === 1 ? 'Entry' : 'Entries'}</span>
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
                                            <TableCell colSpan={5} className="text-center py-12">
                                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500 mb-2" />
                                                <span className="text-gray-500">Loading audit logs...</span>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                                No audit records found for the selected filters.
                                            </TableCell>
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
                                                        <div>
                                                            <span className="text-xs font-medium">
                                                                {log.actor_name || 'System'}
                                                            </span>
                                                            {log.actor_email && (
                                                                <p className="text-[10px] text-gray-500">{log.actor_email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                                        log.action === 'DELETE' ? 'bg-red-900/50 text-red-200 border border-red-900' :
                                                        log.action === 'UPDATE' ? 'bg-blue-900/50 text-blue-200 border border-blue-900' :
                                                        log.action === 'LOGIN' || log.action === 'LOGOUT' ? 'bg-purple-900/50 text-purple-200 border border-purple-900' :
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
