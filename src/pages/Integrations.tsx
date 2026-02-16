import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase-client';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Webhook,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  description: string;
  event_types: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  event_type: string;
  status_code: number | null;
  success: boolean;
  attempted_at: string;
}

const EVENT_TYPES = [
  { id: 'call.completed', label: 'Call Completed' },
  { id: 'call.failed', label: 'Call Failed' },
  { id: 'lead.qualified', label: 'Lead Qualified' },
  { id: 'deal.stage_changed', label: 'Deal Stage Changed' },
  { id: 'deal.closed_won', label: 'Deal Won' },
  { id: 'campaign.completed', label: 'Campaign Completed' },
  { id: 'contact.created', label: 'Contact Created' },
];

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'whsec_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Integrations() {
  const { organization } = useSupabaseAuth();
  const { toast } = useToast();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [newEndpoint, setNewEndpoint] = useState({
    url: '',
    description: '',
    event_types: [] as string[],
    secret: generateSecret(),
  });

  const fetchEndpoints = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEndpoints(data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to load webhooks.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [organization?.id, toast]);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  const fetchDeliveries = async (endpointId: string) => {
    try {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('id, event_type, status_code, success, attempted_at')
        .eq('webhook_endpoint_id', endpointId)
        .order('attempted_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setDeliveries(prev => ({ ...prev, [endpointId]: data || [] }));
      setSelectedEndpoint(endpointId);
    } catch (err: any) {
      console.error('Failed to load deliveries:', err);
    }
  };

  const createEndpoint = async () => {
    if (!newEndpoint.url.trim() || !organization?.id) return;
    if (newEndpoint.event_types.length === 0) {
      toast({ title: 'Error', description: 'Select at least one event type.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.from('webhook_endpoints').insert({
        organization_id: organization.id,
        url: newEndpoint.url.trim(),
        secret: newEndpoint.secret,
        description: newEndpoint.description.trim() || null,
        event_types: newEndpoint.event_types,
      });
      if (error) throw error;
      toast({ title: 'Webhook Created', description: 'Endpoint added successfully.' });
      setShowCreate(false);
      setNewEndpoint({ url: '', description: '', event_types: [], secret: generateSecret() });
      fetchEndpoints();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create webhook.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const toggleEndpoint = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('webhook_endpoints')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
      setEndpoints(prev => prev.map(ep => ep.id === id ? { ...ep, is_active: isActive } : ep));
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update webhook.', variant: 'destructive' });
    }
  };

  const deleteEndpoint = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhook_endpoints')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Webhook endpoint removed.' });
      setEndpoints(prev => prev.filter(ep => ep.id !== id));
      if (selectedEndpoint === id) setSelectedEndpoint(null);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete webhook.', variant: 'destructive' });
    }
  };

  const testEndpoint = async (ep: WebhookEndpoint) => {
    setTesting(ep.id);
    try {
      // Dispatch a real test.ping event to the customer's endpoint via webhook-dispatch
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch('/.netlify/functions/webhook-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          organizationId: organization!.id,
          eventType: 'test.ping',
          endpointId: ep.id,
          payload: {
            message: 'Test webhook from Trinity Labs AI',
            timestamp: new Date().toISOString(),
          },
        }),
      });
      if (!response.ok) throw new Error('Dispatch failed');
      toast({ title: 'Test Sent', description: 'Test event dispatched to your endpoint.' });
      // Refresh delivery history after a short delay to show the result
      setTimeout(() => {
        if (selectedEndpoint === ep.id) fetchDeliveries(ep.id);
      }, 1500);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to send test.', variant: 'destructive' });
    } finally {
      setTesting(null);
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast({ title: 'Copied', description: 'Webhook secret copied to clipboard.' });
  };

  const toggleEventType = (eventType: string) => {
    setNewEndpoint(prev => ({
      ...prev,
      event_types: prev.event_types.includes(eventType)
        ? prev.event_types.filter(e => e !== eventType)
        : [...prev.event_types, eventType],
    }));
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
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Webhook className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Integrations</h1>
              <p className="text-gray-400">Configure outbound webhooks for real-time event delivery</p>
            </div>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Webhook
          </Button>
        </div>

        {/* Endpoints List */}
        {endpoints.length === 0 ? (
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="py-16 text-center">
              <Globe className="mx-auto mb-4 h-16 w-16 text-gray-600" />
              <h3 className="text-lg font-medium text-white">No webhooks configured</h3>
              <p className="mx-auto max-w-sm text-sm text-gray-400 mt-1">
                Add webhook endpoints to receive real-time notifications when events occur in your account.
              </p>
              <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Your First Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {endpoints.map((ep) => (
              <Card key={ep.id} className={`border-gray-800 bg-gray-900 ${selectedEndpoint === ep.id ? 'border-purple-500/50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={ep.is_active ? 'default' : 'secondary'} className="text-[10px]">
                          {ep.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {ep.description && (
                          <span className="text-sm text-white font-medium">{ep.description}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-400 font-mono truncate">
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        {ep.url}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ep.event_types.map(et => (
                          <Badge key={et} variant="outline" className="text-[10px] text-gray-400 border-gray-700">
                            {et}
                          </Badge>
                        ))}
                      </div>
                      {ep.last_triggered_at && (
                        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last triggered: {new Date(ep.last_triggered_at).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={ep.is_active}
                        onCheckedChange={(checked) => toggleEndpoint(ep.id, checked)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-700 text-gray-300"
                        onClick={() => testEndpoint(ep)}
                        disabled={testing === ep.id}
                      >
                        {testing === ep.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-700 text-gray-300"
                        onClick={() => fetchDeliveries(ep.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-700 text-red-400 hover:bg-red-950/30"
                        onClick={() => deleteEndpoint(ep.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Delivery Log */}
                  {selectedEndpoint === ep.id && deliveries[ep.id] && (
                    <div className="mt-4 border-t border-gray-800 pt-3">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Recent Deliveries</h4>
                      {deliveries[ep.id].length === 0 ? (
                        <p className="text-xs text-gray-500">No deliveries yet.</p>
                      ) : (
                        <div className="space-y-1">
                          {deliveries[ep.id].map((d) => (
                            <div key={d.id} className="flex items-center justify-between text-xs bg-gray-800/50 rounded p-2">
                              <div className="flex items-center gap-2">
                                {d.success ? (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-400" />
                                )}
                                <span className="text-gray-300">{d.event_type}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500">
                                {d.status_code && (
                                  <Badge variant="outline" className="text-[10px]">{d.status_code}</Badge>
                                )}
                                <span>{new Date(d.attempted_at).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Webhook Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-800 bg-gray-900 p-6 max-h-[85vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Add Webhook Endpoint</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white">Endpoint URL</Label>
                <Input
                  value={newEndpoint.url}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, url: e.target.value })}
                  className="mt-1 border-gray-700 bg-gray-800 text-white"
                  placeholder="https://your-server.com/webhook"
                  type="url"
                />
              </div>

              <div>
                <Label className="text-white">Description (optional)</Label>
                <Input
                  value={newEndpoint.description}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, description: e.target.value })}
                  className="mt-1 border-gray-700 bg-gray-800 text-white"
                  placeholder="Production CRM webhook"
                />
              </div>

              <div>
                <Label className="text-white">Signing Secret</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={newEndpoint.secret}
                    readOnly
                    className="border-gray-700 bg-gray-800 text-white font-mono text-xs"
                  />
                  <Button variant="outline" size="sm" onClick={() => copySecret(newEndpoint.secret)} className="border-gray-700">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setNewEndpoint({ ...newEndpoint, secret: generateSecret() })} className="border-gray-700">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Save this secret — it won't be shown again after creation.</p>
              </div>

              <div>
                <Label className="text-white mb-2 block">Event Types</Label>
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_TYPES.map((et) => (
                    <button
                      key={et.id}
                      onClick={() => toggleEventType(et.id)}
                      className={`text-left text-xs rounded-lg border p-2 transition-colors ${
                        newEndpoint.event_types.includes(et.id)
                          ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                          : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {et.label}
                    </button>
                  ))}
                </div>
                {newEndpoint.event_types.length === 0 && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Select at least one event type
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-gray-700">
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={createEndpoint}
                disabled={creating || !newEndpoint.url.trim() || newEndpoint.event_types.length === 0}
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {creating ? 'Creating...' : 'Create Endpoint'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
