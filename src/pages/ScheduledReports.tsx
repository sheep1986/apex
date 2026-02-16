import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase-client';
import {
  Calendar,
  Clock,
  FileBarChart,
  Loader2,
  Mail,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ScheduledReport {
  id: string;
  name: string;
  report_type: string;
  frequency: string;
  day_of_week: number | null;
  day_of_month: number | null;
  recipients: string[];
  is_active: boolean;
  last_sent_at: string | null;
  created_at: string;
}

const REPORT_TYPES = [
  { value: 'usage', label: 'Usage Report' },
  { value: 'calls', label: 'Call Activity' },
  { value: 'campaigns', label: 'Campaign Performance' },
  { value: 'billing', label: 'Billing Summary' },
  { value: 'team', label: 'Team Activity' },
  { value: 'deals', label: 'Deal Pipeline' },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ScheduledReports() {
  const { organization } = useSupabaseAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    report_type: 'usage',
    frequency: 'weekly',
    day_of_week: 1,
    day_of_month: 1,
    recipients: '',
  });

  const fetchReports = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReports(data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to load scheduled reports.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [organization?.id, toast]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const createReport = async () => {
    if (!newReport.name.trim() || !organization?.id) return;
    const recipientList = newReport.recipients.split(',').map(r => r.trim()).filter(Boolean);
    if (recipientList.length === 0) {
      toast({ title: 'Error', description: 'Add at least one recipient email.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.from('scheduled_reports').insert({
        organization_id: organization.id,
        name: newReport.name.trim(),
        report_type: newReport.report_type,
        frequency: newReport.frequency,
        day_of_week: newReport.frequency === 'weekly' ? newReport.day_of_week : null,
        day_of_month: newReport.frequency === 'monthly' ? newReport.day_of_month : null,
        recipients: recipientList,
      });
      if (error) throw error;
      toast({ title: 'Report Created', description: 'Scheduled report has been set up.' });
      setShowCreate(false);
      setNewReport({ name: '', report_type: 'usage', frequency: 'weekly', day_of_week: 1, day_of_month: 1, recipients: '' });
      fetchReports();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create report.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const toggleReport = async (id: string, active: boolean) => {
    await supabase.from('scheduled_reports').update({ is_active: active }).eq('id', id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, is_active: active } : r));
  };

  const deleteReport = async (id: string) => {
    await supabase.from('scheduled_reports').delete().eq('id', id);
    setReports(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Deleted', description: 'Scheduled report removed.' });
  };

  const [sendingNow, setSendingNow] = useState<string | null>(null);

  const sendNow = async (report: ScheduledReport) => {
    setSendingNow(report.id);
    try {
      const response = await fetch('/.netlify/functions/report-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id }),
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: 'Report Sent', description: `"${report.name}" has been emailed to ${report.recipients.length} recipient(s).` });
        // Refresh to show updated last_sent_at
        fetchReports();
      } else {
        toast({ title: 'Send Failed', description: 'Report could not be generated. Check recipient emails.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to send report.', variant: 'destructive' });
    } finally {
      setSendingNow(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FileBarChart className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Scheduled Reports</h1>
              <p className="text-gray-400">Automate recurring reports delivered to your inbox</p>
            </div>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="py-16 text-center">
              <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-600" />
              <h3 className="text-lg font-medium text-white">No scheduled reports</h3>
              <p className="mx-auto max-w-sm text-sm text-gray-400 mt-1">
                Set up automated reports to receive key metrics on a daily, weekly, or monthly basis.
              </p>
              <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create First Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Card key={report.id} className="border-gray-800 bg-gray-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white">{report.name}</h3>
                        <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-700 capitalize">
                          {report.report_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant={report.is_active ? 'default' : 'secondary'} className="text-[10px]">
                          {report.is_active ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {report.frequency === 'daily' ? 'Every day' :
                           report.frequency === 'weekly' ? `Every ${DAYS_OF_WEEK[report.day_of_week || 0]}` :
                           `Monthly on the ${report.day_of_month}${report.day_of_month === 1 ? 'st' : report.day_of_month === 2 ? 'nd' : report.day_of_month === 3 ? 'rd' : 'th'}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}
                        </span>
                        {report.last_sent_at && (
                          <span>Last sent: {new Date(report.last_sent_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-700 text-emerald-400 hover:bg-emerald-950/30"
                        onClick={() => sendNow(report)}
                        disabled={sendingNow === report.id}
                      >
                        {sendingNow === report.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Play className="h-4 w-4" />}
                        <span className="ml-1 text-xs">Send Now</span>
                      </Button>
                      <Switch
                        checked={report.is_active}
                        onCheckedChange={(checked) => toggleReport(report.id, checked)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-700 text-red-400 hover:bg-red-950/30"
                        onClick={() => deleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Schedule Report</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white">Report Name</Label>
                <Input
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  className="mt-1 border-gray-700 bg-gray-800 text-white"
                  placeholder="Weekly Call Summary"
                />
              </div>
              <div>
                <Label className="text-white">Report Type</Label>
                <Select value={newReport.report_type} onValueChange={(v) => setNewReport({ ...newReport, report_type: v })}>
                  <SelectTrigger className="mt-1 border-gray-700 bg-gray-800 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {REPORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Frequency</Label>
                <Select value={newReport.frequency} onValueChange={(v) => setNewReport({ ...newReport, frequency: v })}>
                  <SelectTrigger className="mt-1 border-gray-700 bg-gray-800 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {newReport.frequency === 'weekly' && (
                <div>
                  <Label className="text-white">Day of Week</Label>
                  <Select value={String(newReport.day_of_week)} onValueChange={(v) => setNewReport({ ...newReport, day_of_week: parseInt(v) })}>
                    <SelectTrigger className="mt-1 border-gray-700 bg-gray-800 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {DAYS_OF_WEEK.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {newReport.frequency === 'monthly' && (
                <div>
                  <Label className="text-white">Day of Month</Label>
                  <Input
                    type="number"
                    value={newReport.day_of_month}
                    onChange={(e) => setNewReport({ ...newReport, day_of_month: parseInt(e.target.value) || 1 })}
                    className="mt-1 border-gray-700 bg-gray-800 text-white"
                    min="1" max="28"
                  />
                </div>
              )}
              <div>
                <Label className="text-white">Recipients (comma-separated emails)</Label>
                <Input
                  value={newReport.recipients}
                  onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })}
                  className="mt-1 border-gray-700 bg-gray-800 text-white"
                  placeholder="alice@company.com, bob@company.com"
                />
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-gray-700">Cancel</Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={createReport}
                disabled={creating || !newReport.name.trim()}
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {creating ? 'Creating...' : 'Create Schedule'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
