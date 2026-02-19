import { InboundCapacityEstimator } from '@/components/InboundCapacityEstimator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { useUserContext } from '@/services/MinimalUserProvider';
import { voiceService, type VoiceAssistant, type VoicePhoneNumber, type VoiceSquad } from '@/services/voice-service';
import {
  AlertCircle,
  Bot,
  Clock,
  Globe,
  Loader2,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
interface AvailableNumber {
  e164: string;
  friendlyName: string;
  location?: string;
  cost?: number;
  vanity?: boolean;
}

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

interface BusinessHoursSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface BusinessHoursConfig {
  enabled: boolean;
  timezone: string;
  schedule: BusinessHoursSchedule;
}

type AfterHoursAction = 'forward' | 'voicemail' | 'hangup';

const DAY_LABELS: { key: keyof BusinessHoursSchedule; label: string; short: string }[] = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
];

const DEFAULT_SCHEDULE: BusinessHoursSchedule = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '09:00', end: '17:00' },
  sunday: { enabled: false, start: '09:00', end: '17:00' },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatPhoneNumber(number: string): string {
  if (!number) return 'N/A';
  if (number.startsWith('+44')) {
    const local = number.slice(3);
    return `+44 ${local.slice(0, 4)} ${local.slice(4)}`;
  }
  if (number.startsWith('+1') && number.length === 12) {
    const area = number.slice(2, 5);
    const prefix = number.slice(5, 8);
    const line = number.slice(8);
    return `+1 (${area}) ${prefix}-${line}`;
  }
  return number;
}

function getProviderBadge(provider: string) {
  const providerMap: Record<string, { label: string; color: string }> = {
    vapi: { label: 'Managed', color: 'bg-emerald-900/30 text-emerald-400 border-emerald-800' },
    twilio: { label: 'Twilio', color: 'bg-purple-900/30 text-purple-400 border-purple-800' },
    vonage: { label: 'Vonage', color: 'bg-blue-900/30 text-blue-400 border-blue-800' },
  };
  const p = providerMap[provider?.toLowerCase()] || { label: provider || 'Unknown', color: 'bg-gray-800 text-gray-400 border-gray-700' };
  return <Badge variant="outline" className={`text-xs ${p.color}`}>{p.label}</Badge>;
}

// ── Component ───────────────────────────────────────────────────────────────
export default function Telephony() {
  const [phoneNumbers, setPhoneNumbers] = useState<VoicePhoneNumber[]>([]);
  const [assistants, setAssistants] = useState<VoiceAssistant[]>([]);
  const [squads, setSquads] = useState<VoiceSquad[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [initStatus, setInitStatus] = useState<'loading' | 'ready' | 'error' | 'unconfigured'>('loading');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userContext } = useUserContext();

  // Configure dialog
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<VoicePhoneNumber | null>(null);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('');
  const [selectedSquadId, setSelectedSquadId] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<'assistant' | 'squad'>('assistant');
  const [numberName, setNumberName] = useState('');
  const [numberServerUrl, setNumberServerUrl] = useState('');
  const [fallbackType, setFallbackType] = useState<'none' | 'number'>('none');
  const [fallbackNumber, setFallbackNumber] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiDisabledForwardTo, setAiDisabledForwardTo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Business hours state
  const [businessHoursEnabled, setBusinessHoursEnabled] = useState(false);
  const [businessHoursTimezone, setBusinessHoursTimezone] = useState('America/New_York');
  const [businessHoursSchedule, setBusinessHoursSchedule] = useState<BusinessHoursSchedule>({ ...DEFAULT_SCHEDULE });
  const [afterHoursAction, setAfterHoursAction] = useState<AfterHoursAction>('voicemail');
  const [afterHoursForwardTo, setAfterHoursForwardTo] = useState('');
  const [afterHoursGreeting, setAfterHoursGreeting] = useState('');

  // SIP Trunk dialog
  const [showSipDialog, setShowSipDialog] = useState(false);
  const [sipUri, setSipUri] = useState('');
  const [sipName, setSipName] = useState('');
  const [sipTransport, setSipTransport] = useState<'udp' | 'tcp' | 'tls'>('udp');
  const [sipAuthUser, setSipAuthUser] = useState('');
  const [sipAuthPassword, setSipAuthPassword] = useState('');
  const [isCreatingSip, setIsCreatingSip] = useState(false);

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [numberToDelete, setNumberToDelete] = useState<VoicePhoneNumber | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Buy dialog
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [buyAreaCode, setBuyAreaCode] = useState('');
  const [buyName, setBuyName] = useState('');
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBuyNumber, setSelectedBuyNumber] = useState<AvailableNumber | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  // ── Initialize Voice Service ──────────────────────────────────────────────
  useEffect(() => {
    // Already initialized — skip polling entirely
    if (voiceService.isInitialized()) {
      setInitStatus('ready');
      return;
    }

    let attempts = 0;
    const maxAttempts = 20; // 10 seconds (covers retry window: 1s + 2s + 4s)

    const checkInit = setInterval(() => {
      attempts++;
      if (voiceService.isInitialized()) {
        setInitStatus('ready');
        clearInterval(checkInit);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInit);
        if (!userContext?.organization_id) {
          setInitStatus('unconfigured');
        } else {
          setInitStatus('error');
        }
      }
    }, 500);

    // Subscribe to init event for instant recovery (belt-and-suspenders with polling)
    const handleInit = () => {
      setInitStatus('ready');
      clearInterval(checkInit);
    };
    voiceService.onInitialized(handleInit);

    return () => {
      clearInterval(checkInit);
      voiceService.offInitialized(handleInit);
    };
  }, [userContext]);

  // ── Fetch Data ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (initStatus !== 'ready') return;
    setIsLoading(true);
    setError(null);
    try {
      const [numbers, assts, squadsData] = await Promise.all([
        voiceService.getPhoneNumbers(),
        voiceService.getAssistants(),
        voiceService.getSquads(),
      ]);
      setPhoneNumbers(numbers || []);
      setAssistants(assts || []);
      setSquads(squadsData || []);
    } catch (err: any) {
      console.error('Failed to fetch telephony data:', err);
      setError(err.message || 'Failed to load phone numbers');
    } finally {
      setIsLoading(false);
    }
  }, [initStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredNumbers = phoneNumbers.filter((n) =>
    n.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Get assistant name by ID ──────────────────────────────────────────────
  const getAssistantName = (assistantId?: string) => {
    if (!assistantId) return null;
    const asst = assistants.find(a => a.id === assistantId);
    return asst?.name || 'Unknown Assistant';
  };

  const getSquadName = (squadId?: string) => {
    if (!squadId) return null;
    const squad = squads.find(s => s.id === squadId);
    return squad?.name || 'Unknown AI Team';
  };

  // ── Configure Number (assign assistant + rename) ──────────────────────────
  const handleSaveConfig = async () => {
    if (!selectedNumber) return;
    setIsSaving(true);
    setError(null);
    try {
      const updates: any = {
        name: numberName || undefined,
      };
      if (assignmentType === 'assistant') {
        updates.assistantId = selectedAssistantId === 'none' ? null : selectedAssistantId || null;
        updates.squadId = null;
      } else {
        updates.squadId = selectedSquadId === 'none' ? null : selectedSquadId || null;
        updates.assistantId = null;
      }
      if (numberServerUrl) {
        updates.serverUrl = numberServerUrl;
      }
      if (fallbackType === 'number' && fallbackNumber) {
        updates.fallbackDestination = { type: 'number', number: fallbackNumber };
      } else {
        updates.fallbackDestination = null;
      }
      await voiceService.updatePhoneNumber(selectedNumber.id, updates);

      // Save AI toggle + business hours to Supabase
      try {
        const { supabase } = await import('@/services/supabase-client');
        await supabase
          .from('phone_numbers')
          .update({
            ai_enabled: aiEnabled,
            ai_disabled_forward_to: !aiEnabled ? aiDisabledForwardTo || null : null,
          })
          .eq('e164', selectedNumber.number);

        // Get or create inbound route for business hours
        const { data: phoneRow } = await supabase
          .from('phone_numbers')
          .select('inbound_route_id, organization_id')
          .eq('e164', selectedNumber.number)
          .single();

        if (phoneRow) {
          const businessHoursPayload = {
            business_hours: businessHoursEnabled ? {
              enabled: true,
              timezone: businessHoursTimezone,
              schedule: businessHoursSchedule,
            } : { enabled: false },
            after_hours_action: afterHoursAction,
            after_hours_forward_to: afterHoursAction === 'forward' ? afterHoursForwardTo || null : null,
            after_hours_greeting: afterHoursGreeting || null,
          };

          if (phoneRow.inbound_route_id) {
            await supabase
              .from('inbound_routes')
              .update(businessHoursPayload)
              .eq('id', phoneRow.inbound_route_id);
          } else {
            // Create a new inbound route and link it
            const { data: newRoute } = await supabase
              .from('inbound_routes')
              .insert({
                organization_id: phoneRow.organization_id,
                config: {},
                ...businessHoursPayload,
              })
              .select('id')
              .single();
            if (newRoute) {
              await supabase
                .from('phone_numbers')
                .update({ inbound_route_id: newRoute.id })
                .eq('e164', selectedNumber.number);
            }
          }
        }
      } catch {
        // Business hours save is non-critical
      }

      setShowConfigDialog(false);
      setSelectedNumber(null);
      setSelectedAssistantId('');
      setSelectedSquadId('');
      setAssignmentType('assistant');
      setNumberName('');
      setNumberServerUrl('');
      setFallbackType('none');
      setFallbackNumber('');
      setAiEnabled(true);
      setAiDisabledForwardTo('');
      setBusinessHoursEnabled(false);
      setBusinessHoursTimezone('America/New_York');
      setBusinessHoursSchedule({ ...DEFAULT_SCHEDULE });
      setAfterHoursAction('voicemail');
      setAfterHoursForwardTo('');
      setAfterHoursGreeting('');
      await fetchData();
    } catch (err: any) {
      console.error('Failed to update phone number:', err);
      setError(err.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete Number ─────────────────────────────────────────────────────────
  const handleDeleteNumber = async () => {
    if (!numberToDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await voiceService.deletePhoneNumber(numberToDelete.id);
      setShowDeleteDialog(false);
      setNumberToDelete(null);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to delete phone number:', err);
      setError(err.message || 'Failed to delete phone number');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Search Available Numbers ──────────────────────────────────────────────
  const handleSearchNumbers = async () => {
    if (!buyAreaCode || buyAreaCode.length < 3) {
      setError('Please enter a valid 3-digit area code');
      return;
    }
    setIsSearching(true);
    setAvailableNumbers([]);
    setSelectedBuyNumber(null);
    setError(null);
    try {
      const result = await voiceService.searchAvailableNumbers(buyAreaCode);
      // The backend returns { success, numbers }
      const nums = Array.isArray(result) ? result : (result as any)?.numbers || [];
      setAvailableNumbers(nums);
      if (nums.length === 0) {
        setError('No numbers available for that area code. Try a different one.');
      }
    } catch (err: any) {
      console.error('Failed to search numbers:', err);
      setError(err.message || 'Failed to search for available numbers');
    } finally {
      setIsSearching(false);
    }
  };

  // ── Buy Number ────────────────────────────────────────────────────────────
  const handleBuyNumber = async () => {
    if (!selectedBuyNumber) return;
    setIsBuying(true);
    setError(null);
    try {
      await voiceService.buyPhoneNumber(selectedBuyNumber.e164, buyName || undefined);
      setShowBuyDialog(false);
      setBuyAreaCode('');
      setBuyName('');
      setAvailableNumbers([]);
      setSelectedBuyNumber(null);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to purchase number:', err);
      setError(err.message || 'Failed to purchase phone number');
    } finally {
      setIsBuying(false);
    }
  };

  // ── Reset buy dialog ─────────────────────────────────────────────────────
  const closeBuyDialog = () => {
    setShowBuyDialog(false);
    setBuyAreaCode('');
    setBuyName('');
    setAvailableNumbers([]);
    setSelectedBuyNumber(null);
  };

  // ── Create SIP Trunk ─────────────────────────────────────────────────────
  const handleCreateSipTrunk = async () => {
    if (!sipUri.trim()) return;
    setIsCreatingSip(true);
    setError(null);
    try {
      await voiceService.createPhoneNumber({
        provider: 'byo-sip-trunk',
        number: sipUri.trim(),
        name: sipName.trim() || 'SIP Trunk',
        sipTrunkConfig: {
          uri: sipUri.trim(),
          transport: sipTransport,
          ...(sipAuthUser ? {
            authentication: {
              username: sipAuthUser,
              password: sipAuthPassword,
            }
          } : {}),
        },
      } as any);
      setShowSipDialog(false);
      setSipUri('');
      setSipName('');
      setSipTransport('udp');
      setSipAuthUser('');
      setSipAuthPassword('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create SIP trunk');
    } finally {
      setIsCreatingSip(false);
    }
  };

  // ── Loading / Error States ────────────────────────────────────────────────
  if (initStatus === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto" />
          <p className="text-gray-400">Connecting to Telephony Network...</p>
        </div>
      </div>
    );
  }

  if (initStatus === 'unconfigured') {
    return (
      <div className="min-h-screen bg-black p-8">
        <Alert variant="destructive" className="border-red-900 bg-red-950/20 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Telephony Not Configured</AlertTitle>
          <AlertDescription>
            This organization does not have voice credentials configured. Please contact your platform administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (initStatus === 'error') {
    return (
      <div className="min-h-screen bg-black p-8">
        <Alert variant="destructive" className="border-yellow-900 bg-yellow-950/20 text-yellow-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Failed</AlertTitle>
          <AlertDescription>
            Could not connect to the telephony service. Check your configuration or network.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalNumbers = phoneNumbers.length;
  const assignedNumbers = phoneNumbers.filter(n => n.assistantId || n.squadId).length;
  const unassignedNumbers = totalNumbers - assignedNumbers;
  const providers = new Set(phoneNumbers.map(n => n.provider).filter(Boolean));

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Phone className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Telephony</h1>
              <p className="text-gray-400">Manage phone numbers and call routing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowSipDialog(true)}
              variant="outline"
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              <Server className="mr-2 h-4 w-4" />
              BYO SIP Trunk
            </Button>
            <Button
              onClick={() => setShowBuyDialog(true)}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Buy Number
            </Button>
            <Button
              variant="outline"
              onClick={fetchData}
              disabled={isLoading}
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <Alert variant="destructive" className="border-red-900 bg-red-950/20 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-red-300 hover:text-red-100">
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Numbers</p>
                  <p className="text-2xl font-bold text-white">{totalNumbers}</p>
                </div>
                <div className="rounded-lg p-3 border border-purple-500/20 bg-purple-500/10">
                  <Phone className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Assigned</p>
                  <p className="text-2xl font-bold text-emerald-400">{assignedNumbers}</p>
                </div>
                <div className="rounded-lg p-3 border border-emerald-500/20 bg-emerald-500/10">
                  <PhoneCall className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Unassigned</p>
                  <p className="text-2xl font-bold text-amber-400">{unassignedNumbers}</p>
                </div>
                <div className="rounded-lg p-3 border border-amber-500/20 bg-amber-500/10">
                  <PhoneIncoming className="h-5 w-5 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Providers</p>
                  <p className="text-2xl font-bold text-white">{providers.size}</p>
                </div>
                <div className="rounded-lg p-3 border border-blue-500/20 bg-blue-500/10">
                  <Globe className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="text"
            placeholder="Search phone numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-gray-700 bg-gray-900/50 pl-10 text-white placeholder-gray-500 focus:border-purple-500"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="ml-3 text-gray-400">Loading phone numbers...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredNumbers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Phone className="h-16 w-16 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-300">
              {searchQuery ? 'No numbers match your search' : 'No phone numbers yet'}
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              {searchQuery
                ? 'Try a different search term.'
                : 'Purchase your first phone number to start receiving and making calls with your AI assistants.'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowBuyDialog(true)}
                className="bg-emerald-600 text-white hover:bg-emerald-700 mt-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Buy Your First Number
              </Button>
            )}
          </div>
        )}

        {/* Phone Numbers List */}
        {!isLoading && filteredNumbers.length > 0 && (
          <div className="space-y-3">
            {filteredNumbers.map((number) => {
              const assignedAssistant = getAssistantName(number.assistantId);
              const assignedSquad = getSquadName(number.squadId);
              return (
                <Card
                  key={number.id}
                  className="border-gray-800 bg-gray-900 hover:border-gray-700 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          {number.assistantId ? (
                            <PhoneOutgoing className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Phone className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-mono font-medium text-white">
                              {formatPhoneNumber(number.number)}
                            </p>
                            {getProviderBadge(number.provider)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {number.name && (
                              <span className="text-sm text-gray-400">{number.name}</span>
                            )}
                            {assignedAssistant && (
                              <span className="text-sm text-emerald-400 flex items-center gap-1">
                                <Bot className="h-3 w-3" />
                                {assignedAssistant}
                              </span>
                            )}
                            {!assignedAssistant && number.squadId && (
                              <span className="text-sm text-blue-400 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {assignedSquad}
                              </span>
                            )}
                            {!assignedAssistant && !number.squadId && (
                              <span className="text-sm text-yellow-500">Unassigned</span>
                            )}
                            {number.serverUrl && (
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Server className="h-3 w-3" />
                                Custom URL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                          onClick={async () => {
                            setSelectedNumber(number);
                            setSelectedAssistantId(number.assistantId || '');
                            setSelectedSquadId(number.squadId || '');
                            setAssignmentType(number.squadId ? 'squad' : 'assistant');
                            setNumberName(number.name || '');
                            setNumberServerUrl(number.serverUrl || '');
                            setFallbackType(number.fallbackDestination?.number ? 'number' : 'none');
                            setFallbackNumber(number.fallbackDestination?.number || '');
                            // Load business hours from inbound_routes
                            try {
                              const { supabase } = await import('@/services/supabase-client');
                              const { data: phoneRow } = await supabase
                                .from('phone_numbers')
                                .select('inbound_route_id, ai_enabled, ai_disabled_forward_to')
                                .eq('e164', number.number)
                                .single();
                              if (phoneRow) {
                                setAiEnabled(phoneRow.ai_enabled !== false);
                                setAiDisabledForwardTo(phoneRow.ai_disabled_forward_to || '');
                              }
                              if (phoneRow?.inbound_route_id) {
                                const { data: route } = await supabase
                                  .from('inbound_routes')
                                  .select('business_hours, after_hours_action, after_hours_forward_to, after_hours_greeting')
                                  .eq('id', phoneRow.inbound_route_id)
                                  .single();
                                if (route) {
                                  const bh = route.business_hours;
                                  setBusinessHoursEnabled(bh?.enabled ?? false);
                                  setBusinessHoursTimezone(bh?.timezone || 'America/New_York');
                                  setBusinessHoursSchedule(bh?.schedule ? { ...DEFAULT_SCHEDULE, ...bh.schedule } : { ...DEFAULT_SCHEDULE });
                                  setAfterHoursAction((route.after_hours_action as AfterHoursAction) || 'voicemail');
                                  setAfterHoursForwardTo(route.after_hours_forward_to || '');
                                  setAfterHoursGreeting(route.after_hours_greeting || '');
                                } else {
                                  setBusinessHoursEnabled(false);
                                  setBusinessHoursTimezone('America/New_York');
                                  setBusinessHoursSchedule({ ...DEFAULT_SCHEDULE });
                                  setAfterHoursAction('voicemail');
                                  setAfterHoursForwardTo('');
                                  setAfterHoursGreeting('');
                                }
                              } else {
                                setBusinessHoursEnabled(false);
                                setBusinessHoursTimezone('America/New_York');
                                setBusinessHoursSchedule({ ...DEFAULT_SCHEDULE });
                                setAfterHoursAction('voicemail');
                                setAfterHoursForwardTo('');
                                setAfterHoursGreeting('');
                              }
                            } catch {
                              // If loading fails, reset to defaults
                              setBusinessHoursEnabled(false);
                              setBusinessHoursTimezone('America/New_York');
                              setBusinessHoursSchedule({ ...DEFAULT_SCHEDULE });
                              setAfterHoursAction('voicemail');
                              setAfterHoursForwardTo('');
                              setAfterHoursGreeting('');
                            }
                            setShowConfigDialog(true);
                          }}
                        >
                          <Settings className="mr-1 h-4 w-4" />
                          Configure
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-900/50 bg-gray-900 text-red-400 hover:bg-red-950/30 hover:text-red-300"
                          onClick={() => {
                            setNumberToDelete(number);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Inbound Capacity Estimator */}
        {!isLoading && phoneNumbers.length > 0 && (
          <InboundCapacityEstimator currentPhoneNumbers={phoneNumbers.length} />
        )}
      </div>

      {/* ── Configure Number Dialog ──────────────────────────────────────── */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[560px] bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Configure Phone Number</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedNumber && (
                <>Update settings for <strong className="text-white font-mono">{formatPhoneNumber(selectedNumber.number)}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Number Name */}
            <div className="grid gap-2">
              <Label className="text-gray-300">Display Name</Label>
              <Input
                value={numberName}
                onChange={(e) => setNumberName(e.target.value)}
                placeholder="e.g. Sales Line, Support Hotline..."
                className="border-gray-700 bg-gray-900 text-white placeholder-gray-500"
              />
            </div>

            {/* AI Enabled Toggle */}
            <div className="grid gap-2">
              <Label className="text-gray-300">AI Handling</Label>
              <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900 p-3">
                <div>
                  <p className="text-sm font-medium text-white">AI Enabled</p>
                  <p className="text-xs text-gray-400">
                    {aiEnabled ? 'AI assistant will handle calls' : 'Calls will be forwarded directly'}
                  </p>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    aiEnabled ? 'bg-emerald-500' : 'bg-gray-600'
                  }`}
                  onClick={() => setAiEnabled(!aiEnabled)}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      aiEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {!aiEnabled && (
                <div className="mt-1">
                  <Label className="text-gray-400 text-xs">Forward calls to:</Label>
                  <Input
                    value={aiDisabledForwardTo}
                    onChange={(e) => setAiDisabledForwardTo(e.target.value)}
                    placeholder="+1234567890"
                    className="border-gray-700 bg-gray-900 text-white placeholder-gray-500 mt-1"
                  />
                </div>
              )}
            </div>

            {/* Assignment Type Toggle */}
            <div className="grid gap-2">
              <Label className="text-gray-300">Route Calls To</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAssignmentType('assistant')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm transition-all ${
                    assignmentType === 'assistant'
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <Bot className="h-4 w-4" /> Assistant
                </button>
                <button
                  onClick={() => setAssignmentType('squad')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm transition-all ${
                    assignmentType === 'squad'
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <Users className="h-4 w-4" /> AI Team
                </button>
              </div>
            </div>

            {/* Assistant Selection */}
            {assignmentType === 'assistant' && (
              <div className="grid gap-2">
                <Label className="text-gray-300">Assigned Assistant</Label>
                <Select value={selectedAssistantId} onValueChange={setSelectedAssistantId}>
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue placeholder="Select an assistant..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-700">
                    <SelectItem value="none">None (Unassigned)</SelectItem>
                    {assistants.map(asst => (
                      <SelectItem key={asst.id} value={asst.id}>{asst.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* AI Team Selection */}
            {assignmentType === 'squad' && (
              <div className="grid gap-2">
                <Label className="text-gray-300">Assigned AI Team</Label>
                <Select value={selectedSquadId} onValueChange={setSelectedSquadId}>
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue placeholder="Select an AI Team..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-700">
                    <SelectItem value="none">None (Unassigned)</SelectItem>
                    {squads.map(squad => (
                      <SelectItem key={squad.id} value={squad.id}>
                        {squad.name} ({squad.members?.length || 0} members)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Server URL Override */}
            <div className="grid gap-2">
              <Label className="text-gray-300">Server URL Override</Label>
              <Input
                value={numberServerUrl}
                onChange={(e) => setNumberServerUrl(e.target.value)}
                placeholder="https://your-server.com/webhook"
                className="border-gray-700 bg-gray-900 text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500">
                Optional. Override the assistant's default webhook URL for this number.
              </p>
            </div>

            {/* Fallback Destination */}
            <div className="grid gap-2">
              <Label className="text-gray-300">Fallback Destination</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFallbackType('none')}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                    fallbackType === 'none'
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  None
                </button>
                <button
                  onClick={() => setFallbackType('number')}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                    fallbackType === 'number'
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  Phone Number
                </button>
              </div>
              {fallbackType === 'number' && (
                <Input
                  value={fallbackNumber}
                  onChange={(e) => setFallbackNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="border-gray-700 bg-gray-900 text-white placeholder-gray-500"
                />
              )}
              <p className="text-xs text-gray-500">
                Where calls route if the primary handler fails or is unavailable.
              </p>
            </div>

            {/* Business Hours */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  Business Hours
                </Label>
                <Switch
                  checked={businessHoursEnabled}
                  onCheckedChange={setBusinessHoursEnabled}
                />
              </div>

              {businessHoursEnabled && (
                <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                  {/* Timezone */}
                  <div className="grid gap-2">
                    <Label className="text-gray-400 text-xs">Timezone</Label>
                    <Select value={businessHoursTimezone} onValueChange={setBusinessHoursTimezone}>
                      <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-950 border-gray-700">
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Day Grid */}
                  <div className="space-y-2">
                    <Label className="text-gray-400 text-xs">Schedule</Label>
                    <div className="space-y-1.5">
                      {DAY_LABELS.map(({ key, short }) => {
                        const day = businessHoursSchedule[key];
                        return (
                          <div
                            key={key}
                            className={`flex items-center gap-3 rounded-md border p-2 transition-colors ${
                              day.enabled
                                ? 'border-gray-700 bg-gray-800'
                                : 'border-gray-800 bg-gray-900/30'
                            }`}
                          >
                            <Switch
                              checked={day.enabled}
                              onCheckedChange={(checked) =>
                                setBusinessHoursSchedule((prev) => ({
                                  ...prev,
                                  [key]: { ...prev[key], enabled: checked },
                                }))
                              }
                              className="scale-75"
                            />
                            <span className={`w-10 text-sm font-medium ${day.enabled ? 'text-white' : 'text-gray-500'}`}>
                              {short}
                            </span>
                            {day.enabled ? (
                              <div className="flex items-center gap-1.5 ml-auto">
                                <input
                                  type="time"
                                  value={day.start}
                                  onChange={(e) =>
                                    setBusinessHoursSchedule((prev) => ({
                                      ...prev,
                                      [key]: { ...prev[key], start: e.target.value },
                                    }))
                                  }
                                  className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
                                />
                                <span className="text-gray-500 text-xs">to</span>
                                <input
                                  type="time"
                                  value={day.end}
                                  onChange={(e) =>
                                    setBusinessHoursSchedule((prev) => ({
                                      ...prev,
                                      [key]: { ...prev[key], end: e.target.value },
                                    }))
                                  }
                                  className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
                                />
                              </div>
                            ) : (
                              <span className="ml-auto text-xs text-gray-500">Closed</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* After-Hours Action */}
                  <div className="grid gap-2">
                    <Label className="text-gray-400 text-xs">After-Hours Action</Label>
                    <div className="flex gap-2">
                      {([
                        { value: 'voicemail' as const, label: 'Voicemail' },
                        { value: 'forward' as const, label: 'Forward' },
                        { value: 'hangup' as const, label: 'Hang Up' },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setAfterHoursAction(opt.value)}
                          className={`flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                            afterHoursAction === opt.value
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                              : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Forward-to Number (conditional) */}
                  {afterHoursAction === 'forward' && (
                    <div className="grid gap-2">
                      <Label className="text-gray-400 text-xs">Forward To</Label>
                      <Input
                        value={afterHoursForwardTo}
                        onChange={(e) => setAfterHoursForwardTo(e.target.value)}
                        placeholder="+1234567890"
                        className="border-gray-700 bg-gray-800 text-white placeholder-gray-500"
                      />
                    </div>
                  )}

                  {/* After-Hours Greeting */}
                  <div className="grid gap-2">
                    <Label className="text-gray-400 text-xs">After-Hours Greeting</Label>
                    <Textarea
                      value={afterHoursGreeting}
                      onChange={(e) => setAfterHoursGreeting(e.target.value)}
                      placeholder="We are currently closed. Our business hours are Monday through Friday, 9 AM to 5 PM. Please leave a message."
                      rows={3}
                      className="border-gray-700 bg-gray-800 text-white placeholder-gray-500 resize-none text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Number Details */}
            {selectedNumber && (
              <div className="space-y-2 text-sm bg-gray-900/50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-400">Number:</span>
                  <span className="text-white font-mono">{formatPhoneNumber(selectedNumber.number)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Provider:</span>
                  <span className="text-white capitalize">{selectedNumber.provider || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">
                    {selectedNumber.createdAt
                      ? new Date(selectedNumber.createdAt).toLocaleDateString('en-GB')
                      : 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfigDialog(false);
                setSelectedNumber(null);
                setSelectedAssistantId('');
                setSelectedSquadId('');
                setAssignmentType('assistant');
                setNumberName('');
                setNumberServerUrl('');
                setFallbackType('none');
                setFallbackNumber('');
                setBusinessHoursEnabled(false);
                setBusinessHoursTimezone('America/New_York');
                setBusinessHoursSchedule({ ...DEFAULT_SCHEDULE });
                setAfterHoursAction('voicemail');
                setAfterHoursForwardTo('');
                setAfterHoursGreeting('');
              }}
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ───────────────────────────────────── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Release Phone Number</DialogTitle>
            <DialogDescription className="text-gray-400">
              This action cannot be undone. The phone number will be released back to the provider and can no longer receive calls.
            </DialogDescription>
          </DialogHeader>

          {numberToDelete && (
            <div className="space-y-3 py-4">
              <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Number:</span>
                  <span className="text-white font-mono font-medium">{formatPhoneNumber(numberToDelete.number)}</span>
                </div>
                {numberToDelete.name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{numberToDelete.name}</span>
                  </div>
                )}
                {numberToDelete.assistantId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Assigned to:</span>
                    <span className="text-emerald-400">{getAssistantName(numberToDelete.assistantId)}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-yellow-400">
                Any active calls on this number will be disconnected and any inbound routing will stop immediately.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setNumberToDelete(null);
              }}
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteNumber}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Releasing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Release Number
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Buy Number Dialog ────────────────────────────────────────────── */}
      <Dialog open={showBuyDialog} onOpenChange={(open) => { if (!open) closeBuyDialog(); else setShowBuyDialog(true); }}>
        <DialogContent className="sm:max-w-[540px] bg-gray-950 border-gray-800 text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Phone Number</DialogTitle>
            <DialogDescription className="text-gray-400">
              Search for available phone numbers by area code and purchase one for your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Search Section */}
            <div className="grid gap-2">
              <Label className="text-gray-300">Area Code</Label>
              <div className="flex gap-2">
                <Input
                  value={buyAreaCode}
                  onChange={(e) => setBuyAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="e.g. 415, 212, 310..."
                  maxLength={3}
                  className="border-gray-700 bg-gray-900 text-white placeholder-gray-500 font-mono"
                />
                <Button
                  onClick={handleSearchNumbers}
                  disabled={isSearching || buyAreaCode.length < 3}
                  className="bg-purple-600 text-white hover:bg-purple-700 min-w-[100px]"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Enter a US area code to search for available numbers.
              </p>
            </div>

            {/* Available Numbers */}
            {availableNumbers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-gray-300">Available Numbers</Label>
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {availableNumbers.map((num) => (
                    <button
                      key={num.e164}
                      onClick={() => setSelectedBuyNumber(num)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedBuyNumber?.e164 === num.e164
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-white">{num.friendlyName || formatPhoneNumber(num.e164)}</p>
                          {num.location && (
                            <p className="text-xs text-gray-500 mt-0.5">{num.location}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {num.vanity && (
                            <Badge variant="outline" className="text-xs bg-amber-900/30 text-amber-400 border-amber-800">
                              Vanity
                            </Badge>
                          )}
                          {num.cost !== undefined && (
                            <span className="text-sm text-gray-400">${num.cost.toFixed(2)}/mo</span>
                          )}
                          {selectedBuyNumber?.e164 === num.e164 && (
                            <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Display Name for purchased number */}
            {selectedBuyNumber && (
              <div className="grid gap-2">
                <Label className="text-gray-300">Display Name (optional)</Label>
                <Input
                  value={buyName}
                  onChange={(e) => setBuyName(e.target.value)}
                  placeholder="e.g. Sales Line, Support Hotline..."
                  className="border-gray-700 bg-gray-900 text-white placeholder-gray-500"
                />
              </div>
            )}

            {/* Selected number summary */}
            {selectedBuyNumber && (
              <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Selected:</span>
                  <span className="text-white font-mono">{selectedBuyNumber.friendlyName || formatPhoneNumber(selectedBuyNumber.e164)}</span>
                </div>
                {selectedBuyNumber.cost !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly cost:</span>
                    <span className="text-emerald-400">${selectedBuyNumber.cost.toFixed(2)}/mo</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeBuyDialog}
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBuyNumber}
              disabled={!selectedBuyNumber || isBuying}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isBuying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Purchasing...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Purchase Number
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BYO SIP Trunk Dialog */}
      <Dialog open={showSipDialog} onOpenChange={setShowSipDialog}>
        <DialogContent className="max-w-lg border-gray-800 bg-gray-950 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-400" />
              Bring Your Own SIP Trunk
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Connect your existing SIP trunk provider for inbound and outbound calling.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-gray-300">Display Name</Label>
              <Input
                value={sipName}
                onChange={(e) => setSipName(e.target.value)}
                placeholder="e.g. Office SIP Line"
                className="border-gray-700 bg-gray-900 text-white placeholder-gray-500"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-gray-300">SIP URI *</Label>
              <Input
                value={sipUri}
                onChange={(e) => setSipUri(e.target.value)}
                placeholder="sip:+15551234567@trunk.provider.com"
                className="border-gray-700 bg-gray-900 text-white placeholder-gray-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                The full SIP URI including protocol, number, and domain
              </p>
            </div>

            <div className="grid gap-2">
              <Label className="text-gray-300">Transport Protocol</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['udp', 'tcp', 'tls'] as const).map((proto) => (
                  <button
                    key={proto}
                    onClick={() => setSipTransport(proto)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      sipTransport === proto
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                        : 'border-gray-700 bg-gray-900 text-gray-500 hover:border-gray-600'
                    }`}
                  >
                    {proto.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Authentication (optional)</Label>
                <Shield className="h-4 w-4 text-gray-500" />
              </div>
              <div className="grid gap-2">
                <Input
                  value={sipAuthUser}
                  onChange={(e) => setSipAuthUser(e.target.value)}
                  placeholder="Username"
                  className="border-gray-700 bg-gray-900 text-white placeholder-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Input
                  type="password"
                  value={sipAuthPassword}
                  onChange={(e) => setSipAuthPassword(e.target.value)}
                  placeholder="Password"
                  className="border-gray-700 bg-gray-900 text-white placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSipDialog(false);
                setSipUri('');
                setSipName('');
                setSipTransport('udp');
                setSipAuthUser('');
                setSipAuthPassword('');
              }}
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSipTrunk}
              disabled={!sipUri.trim() || isCreatingSip}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isCreatingSip ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Server className="mr-2 h-4 w-4" />
                  Create SIP Trunk
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
