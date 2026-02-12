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
import { useUserContext } from '@/services/MinimalUserProvider';
import { voiceService, type VoiceAssistant, type VoicePhoneNumber } from '@/services/voice-service';
import {
  AlertCircle,
  Bot,
  Globe,
  Loader2,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [initStatus, setInitStatus] = useState<'loading' | 'ready' | 'error' | 'unconfigured'>('loading');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userContext } = useUserContext();

  // Configure dialog
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<VoicePhoneNumber | null>(null);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('');
  const [numberName, setNumberName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
    let attempts = 0;
    const maxAttempts = 10;

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

    return () => clearInterval(checkInit);
  }, [userContext]);

  // ── Fetch Data ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (initStatus !== 'ready') return;
    setIsLoading(true);
    setError(null);
    try {
      const [numbers, assts] = await Promise.all([
        voiceService.getPhoneNumbers(),
        voiceService.getAssistants(),
      ]);
      setPhoneNumbers(numbers || []);
      setAssistants(assts || []);
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

  // ── Configure Number (assign assistant + rename) ──────────────────────────
  const handleSaveConfig = async () => {
    if (!selectedNumber) return;
    setIsSaving(true);
    setError(null);
    try {
      await voiceService.updatePhoneNumber(selectedNumber.id, {
        assistantId: selectedAssistantId === 'none' ? null : selectedAssistantId || null,
        name: numberName || undefined,
      });
      setShowConfigDialog(false);
      setSelectedNumber(null);
      setSelectedAssistantId('');
      setNumberName('');
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

  // ── Loading / Error States ────────────────────────────────────────────────
  if (initStatus === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500 mx-auto" />
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
  const assignedNumbers = phoneNumbers.filter(n => n.assistantId).length;
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
                <Phone className="h-8 w-8 text-purple-500" />
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
                <PhoneCall className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Unassigned</p>
                  <p className="text-2xl font-bold text-yellow-400">{unassignedNumbers}</p>
                </div>
                <PhoneIncoming className="h-8 w-8 text-yellow-500" />
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
                <Globe className="h-8 w-8 text-blue-500" />
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
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
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
                            {!assignedAssistant && (
                              <span className="text-sm text-yellow-500">Unassigned</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                          onClick={() => {
                            setSelectedNumber(number);
                            setSelectedAssistantId(number.assistantId || '');
                            setNumberName(number.name || '');
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
      </div>

      {/* ── Configure Number Dialog ──────────────────────────────────────── */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[480px] bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Configure Phone Number</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedNumber && (
                <>Update settings for <strong className="text-white font-mono">{formatPhoneNumber(selectedNumber.number)}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Number Name */}
            <div className="grid gap-2">
              <Label className="text-gray-300">Display Name</Label>
              <Input
                value={numberName}
                onChange={(e) => setNumberName(e.target.value)}
                placeholder="e.g. Sales Line, Support Hotline..."
                className="border-gray-700 bg-gray-900 text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500">
                A friendly name to identify this number in your dashboard.
              </p>
            </div>

            {/* Assigned Assistant */}
            <div className="grid gap-2">
              <Label className="text-gray-300">Assigned Assistant</Label>
              <Select
                value={selectedAssistantId}
                onValueChange={setSelectedAssistantId}
              >
                <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                  <SelectValue placeholder="Select an assistant..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-gray-700">
                  <SelectItem value="none">None (Unassigned)</SelectItem>
                  {assistants.map(asst => (
                    <SelectItem key={asst.id} value={asst.id}>
                      {asst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Inbound calls to this number will be handled by the selected assistant.
              </p>
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
                setNumberName('');
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
    </div>
  );
}
