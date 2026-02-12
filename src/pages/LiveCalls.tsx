import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserContext } from '@/services/MinimalUserProvider';
import { voiceService, type VoiceCall } from '@/services/voice-service';
import {
  Activity,
  Clock,
  Loader2,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────

const formatDuration = (startedAt: string): string => {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - start) / 1000);
  if (elapsed < 0) return '0:00';
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getCallTypeIcon = (type: string) => {
  switch (type) {
    case 'inboundPhoneCall':
      return <PhoneIncoming className="h-5 w-5 text-emerald-400" />;
    case 'outboundPhoneCall':
      return <PhoneOutgoing className="h-5 w-5 text-blue-400" />;
    case 'webCall':
      return <Phone className="h-5 w-5 text-purple-400" />;
    default:
      return <Phone className="h-5 w-5 text-gray-400" />;
  }
};

const getCallTypeLabel = (type: string) => {
  switch (type) {
    case 'inboundPhoneCall':
      return 'Inbound';
    case 'outboundPhoneCall':
      return 'Outbound';
    case 'webCall':
      return 'Web Call';
    default:
      return type;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'in-progress':
      return (
        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <Activity className="mr-1 h-3 w-3 animate-pulse" />
          In Progress
        </Badge>
      );
    case 'ringing':
      return (
        <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
          <Radio className="mr-1 h-3 w-3 animate-pulse" />
          Ringing
        </Badge>
      );
    case 'queued':
      return (
        <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-400">
          <Clock className="mr-1 h-3 w-3" />
          Queued
        </Badge>
      );
    case 'forwarding':
      return (
        <Badge className="border-purple-500/30 bg-purple-500/10 text-purple-400">
          <PhoneCall className="mr-1 h-3 w-3 animate-pulse" />
          Forwarding
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-gray-400">
          {status}
        </Badge>
      );
  }
};

// ─── Component ───────────────────────────────────────────────────

export default function LiveCalls() {
  const { userContext } = useUserContext();

  const [liveCalls, setLiveCalls] = useState<VoiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [, setTick] = useState(0); // Force re-render for elapsed time

  // ─── Voice service readiness ─────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      if (voiceService.isInitialized()) {
        setVoiceReady(true);
        clearInterval(interval);
      }
    }, 500);
    if (voiceService.isInitialized()) setVoiceReady(true);
    return () => clearInterval(interval);
  }, []);

  // ─── Fetch live calls ────────────────────────────────────────

  useEffect(() => {
    if (voiceReady) {
      fetchLiveCalls();
    }
  }, [voiceReady]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!voiceReady) return;

    const refreshInterval = setInterval(() => {
      fetchLiveCalls();
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [voiceReady]);

  // Update elapsed time every second
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  const fetchLiveCalls = async () => {
    try {
      const allCalls = await voiceService.getCalls({ limit: 50 });
      // Filter to only active calls (not ended)
      const active = (allCalls || []).filter(
        (call) => call.status !== 'ended'
      );
      setLiveCalls(active);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch live calls:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading state ───────────────────────────────────────────

  if (!voiceReady || loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-gray-400">
          {!voiceReady ? 'Connecting to voice service...' : 'Loading live calls...'}
        </p>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen w-full bg-black">
      <div className="w-full space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400">
              Monitor active calls in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button
              onClick={fetchLiveCalls}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Live Status Banner */}
        <Card className={`border ${liveCalls.length > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-800 bg-gray-900'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${liveCalls.length > 0 ? 'animate-pulse bg-emerald-500' : 'bg-gray-600'}`} />
                <div>
                  <p className="font-medium text-white">
                    {liveCalls.length > 0
                      ? `${liveCalls.length} Active Call${liveCalls.length !== 1 ? 's' : ''}`
                      : 'No Active Calls'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {liveCalls.length > 0
                      ? 'Monitoring in real-time — auto-refreshes every 5 seconds'
                      : 'Calls will appear here when your AI assistants are on a call'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <PhoneIncoming className="h-4 w-4 text-emerald-400" />
                  <span>
                    {liveCalls.filter((c) => c.type === 'inboundPhoneCall').length} inbound
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneOutgoing className="h-4 w-4 text-blue-400" />
                  <span>
                    {liveCalls.filter((c) => c.type === 'outboundPhoneCall').length} outbound
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Calls Grid */}
        {liveCalls.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {liveCalls.map((call) => (
              <Card key={call.id} className="border-gray-800 bg-gray-900 transition-all hover:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        {getCallTypeIcon(call.type)}
                      </div>
                      <div>
                        <CardTitle className="text-base text-white">
                          {call.customer?.name || call.customer?.number || 'Unknown Caller'}
                        </CardTitle>
                        <p className="text-xs text-gray-400">
                          {getCallTypeLabel(call.type)}
                          {call.customer?.number ? ` — ${call.customer.number}` : ''}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(call.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Duration */}
                  <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Duration</span>
                    </div>
                    <span className="font-mono text-lg font-semibold text-white">
                      {call.startedAt ? formatDuration(call.startedAt) : '—'}
                    </span>
                  </div>

                  {/* Assistant */}
                  {call.assistantId && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Assistant</span>
                      <span className="font-mono text-xs text-gray-300">
                        {call.assistantId.slice(0, 12)}...
                      </span>
                    </div>
                  )}

                  {/* Call ID */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Call ID</span>
                    <span className="font-mono text-xs text-gray-500">
                      {call.id.slice(0, 12)}...
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty state */
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <Phone className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-white">No Active Calls</h3>
              <p className="mx-auto max-w-sm text-sm text-gray-400">
                When your AI assistants are handling calls, they'll appear here in real-time
                with live duration tracking and status updates.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export { LiveCalls };
