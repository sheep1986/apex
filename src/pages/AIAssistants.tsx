import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { useUserContext } from '@/services/MinimalUserProvider';
import { voiceService, type VoiceAssistant } from '@/services/voice-service';
import {
  Activity,
  AlertCircle,
  Bot,
  Copy,
  Edit,
  Loader2,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// ── Create / Edit Assistant Form State ──────────────────────────────────────
interface AssistantFormState {
  name: string;
  firstMessage: string;
  systemPrompt: string;
  modelProvider: string;
  model: string;
  voiceProvider: string;
  voiceId: string;
  transcriberProvider: string;
  transcriberModel: string;
}

const defaultForm: AssistantFormState = {
  name: '',
  firstMessage: 'Hello! How can I help you today?',
  systemPrompt: 'You are a helpful AI assistant. Be professional, concise, and friendly.',
  modelProvider: 'openai',
  model: 'gpt-4o',
  voiceProvider: '11labs',
  voiceId: 'rachel',
  transcriberProvider: 'deepgram',
  transcriberModel: 'nova-2',
};

// ── Voice / Model Options ───────────────────────────────────────────────────
const MODEL_OPTIONS = [
  { provider: 'openai', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { provider: 'anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] },
  { provider: 'together-ai', models: ['meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'] },
];

const VOICE_OPTIONS = [
  { provider: '11labs', voices: [
    { id: 'rachel', label: 'Rachel (Professional)' },
    { id: 'drew', label: 'Drew (Conversational)' },
    { id: 'clyde', label: 'Clyde (Authoritative)' },
    { id: 'sarah', label: 'Sarah (Friendly)' },
    { id: 'emily', label: 'Emily (Calm)' },
  ]},
  { provider: 'openai', voices: [
    { id: 'alloy', label: 'Alloy' },
    { id: 'echo', label: 'Echo' },
    { id: 'fable', label: 'Fable' },
    { id: 'onyx', label: 'Onyx' },
    { id: 'nova', label: 'Nova' },
    { id: 'shimmer', label: 'Shimmer' },
  ]},
  { provider: 'deepgram', voices: [
    { id: 'asteria', label: 'Asteria' },
    { id: 'luna', label: 'Luna' },
    { id: 'stella', label: 'Stella' },
    { id: 'athena', label: 'Athena' },
  ]},
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function getVoiceLabel(assistant: VoiceAssistant): string {
  if (!assistant.voice) return 'Default';
  const provider = assistant.voice.provider || 'unknown';
  const voiceId = assistant.voice.voiceId || 'default';
  // Find human-readable label
  const providerVoices = VOICE_OPTIONS.find(v => v.provider === provider);
  const found = providerVoices?.voices.find(v => v.id === voiceId);
  return found ? found.label : `${voiceId}`;
}

function getModelLabel(assistant: VoiceAssistant): string {
  if (!assistant.model) return 'Default';
  return assistant.model.model || 'Unknown';
}

function getProviderLabel(provider: string): string {
  const map: Record<string, string> = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    '11labs': 'ElevenLabs',
    'deepgram': 'Deepgram',
    'together-ai': 'Together AI',
  };
  return map[provider] || provider;
}

// ── Component ───────────────────────────────────────────────────────────────
export default function AIAssistants() {
  const [assistants, setAssistants] = useState<VoiceAssistant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [initStatus, setInitStatus] = useState<'loading' | 'ready' | 'error' | 'unconfigured'>('loading');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userContext } = useUserContext();

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<VoiceAssistant | null>(null);
  const [deletingAssistant, setDeletingAssistant] = useState<VoiceAssistant | null>(null);
  const [formState, setFormState] = useState<AssistantFormState>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);

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

  // ── Fetch Assistants ──────────────────────────────────────────────────────
  const fetchAssistants = useCallback(async () => {
    if (initStatus !== 'ready') return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await voiceService.getAssistants();
      setAssistants(data || []);
    } catch (err: any) {
      console.error('Failed to fetch assistants:', err);
      setError(err.message || 'Failed to load assistants');
    } finally {
      setIsLoading(false);
    }
  }, [initStatus]);

  useEffect(() => {
    fetchAssistants();
  }, [fetchAssistants]);

  // ── Create / Update Assistant ─────────────────────────────────────────────
  const handleSaveAssistant = async () => {
    if (!formState.name.trim()) return;
    setIsSaving(true);
    setError(null);

    try {
      const payload: Partial<VoiceAssistant> = {
        name: formState.name.trim(),
        firstMessage: formState.firstMessage.trim() || undefined,
        model: {
          provider: formState.modelProvider,
          model: formState.model,
          systemMessage: formState.systemPrompt.trim() || undefined,
        },
        voice: {
          provider: formState.voiceProvider,
          voiceId: formState.voiceId,
        },
        transcriber: {
          provider: formState.transcriberProvider,
          model: formState.transcriberModel,
        },
      };

      if (editingAssistant) {
        await voiceService.updateAssistant(editingAssistant.id, payload);
      } else {
        await voiceService.createAssistant(payload);
      }

      setShowCreateDialog(false);
      setEditingAssistant(null);
      setFormState(defaultForm);
      await fetchAssistants();
    } catch (err: any) {
      console.error('Save assistant error:', err);
      setError(err.message || 'Failed to save assistant');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete Assistant ──────────────────────────────────────────────────────
  const handleDeleteAssistant = async () => {
    if (!deletingAssistant) return;
    setIsSaving(true);
    try {
      await voiceService.deleteAssistant(deletingAssistant.id);
      setShowDeleteDialog(false);
      setDeletingAssistant(null);
      await fetchAssistants();
    } catch (err: any) {
      console.error('Delete assistant error:', err);
      setError(err.message || 'Failed to delete assistant');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Clone Assistant ───────────────────────────────────────────────────────
  const handleCloneAssistant = async (assistant: VoiceAssistant) => {
    try {
      setIsLoading(true);
      await voiceService.createAssistant({
        name: `${assistant.name} (Copy)`,
        firstMessage: assistant.firstMessage,
        model: assistant.model,
        voice: assistant.voice,
        transcriber: assistant.transcriber,
      });
      await fetchAssistants();
    } catch (err: any) {
      setError(err.message || 'Failed to clone assistant');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Open Edit Dialog ──────────────────────────────────────────────────────
  const openEditDialog = (assistant: VoiceAssistant) => {
    setEditingAssistant(assistant);
    setFormState({
      name: assistant.name || '',
      firstMessage: assistant.firstMessage || '',
      systemPrompt: assistant.model?.systemMessage || '',
      modelProvider: assistant.model?.provider || 'openai',
      model: assistant.model?.model || 'gpt-4o',
      voiceProvider: assistant.voice?.provider || '11labs',
      voiceId: assistant.voice?.voiceId || 'rachel',
      transcriberProvider: assistant.transcriber?.provider || 'deepgram',
      transcriberModel: assistant.transcriber?.model || 'nova-2',
    });
    setShowCreateDialog(true);
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredAssistants = assistants.filter((a) =>
    a.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Loading / Error States ────────────────────────────────────────────────
  if (initStatus === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto" />
          <p className="text-gray-400">Connecting to Voice Network...</p>
        </div>
      </div>
    );
  }

  if (initStatus === 'unconfigured') {
    return (
      <div className="min-h-screen bg-black p-8">
        <Alert variant="destructive" className="border-red-900 bg-red-950/20 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Voice Not Configured</AlertTitle>
          <AlertDescription>
            This organization does not have a Voice Provider configuration. Please contact your platform administrator.
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
            Could not initialize Voice Service. Please check your network connection or permissions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── Available models for selected provider ────────────────────────────────
  const selectedModelProvider = MODEL_OPTIONS.find(m => m.provider === formState.modelProvider);
  const selectedVoiceProvider = VOICE_OPTIONS.find(v => v.provider === formState.voiceProvider);

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400">Manage your AI voice assistants</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchAssistants}
              disabled={isLoading}
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setEditingAssistant(null);
                setFormState(defaultForm);
                setShowCreateDialog(true);
              }}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Assistant
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="text-red-300 hover:text-red-100"
              >
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
                  <p className="text-sm text-gray-400">Total Assistants</p>
                  <p className="text-2xl font-bold text-white">{assistants.length}</p>
                </div>
                <Bot className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Voice Providers</p>
                  <p className="text-2xl font-bold text-white">
                    {new Set(assistants.map(a => a.voice?.provider).filter(Boolean)).size}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">AI Models</p>
                  <p className="text-2xl font-bold text-white">
                    {new Set(assistants.map(a => a.model?.model).filter(Boolean)).size}
                  </p>
                </div>
                <Phone className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Transcribers</p>
                  <p className="text-2xl font-bold text-white">
                    {new Set(assistants.map(a => a.transcriber?.provider).filter(Boolean)).size}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="text"
            placeholder="Search assistants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-gray-700 bg-gray-900/50 pl-10 text-white placeholder-gray-500 focus:border-emerald-500"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="ml-3 text-gray-400">Loading assistants...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredAssistants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Bot className="h-16 w-16 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-300">
              {searchQuery ? 'No assistants match your search' : 'No assistants yet'}
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              {searchQuery
                ? 'Try a different search term.'
                : 'Create your first AI voice assistant to start making calls, handling inbound enquiries, and automating conversations.'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => {
                  setEditingAssistant(null);
                  setFormState(defaultForm);
                  setShowCreateDialog(true);
                }}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Assistant
              </Button>
            )}
          </div>
        )}

        {/* Assistants Grid */}
        {!isLoading && filteredAssistants.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssistants.map((assistant) => (
              <Card
                key={assistant.id}
                className="border-gray-800 bg-gray-900 transition-shadow hover:shadow-lg hover:shadow-emerald-900/10"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg text-white truncate">{assistant.name}</CardTitle>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {getProviderLabel(assistant.model?.provider || 'openai')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getModelLabel(assistant)}
                        </Badge>
                      </div>
                    </div>
                    <Bot className="h-6 w-6 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Voice:</span>
                      <span className="font-medium text-white">{getVoiceLabel(assistant)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transcriber:</span>
                      <span className="font-medium text-white">
                        {getProviderLabel(assistant.transcriber?.provider || 'deepgram')}
                      </span>
                    </div>
                    {assistant.firstMessage && (
                      <div className="pt-2 border-t border-gray-800">
                        <p className="text-gray-400 text-xs">First Message:</p>
                        <p className="text-gray-300 text-xs mt-1 line-clamp-2 italic">
                          &ldquo;{assistant.firstMessage}&rdquo;
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="font-medium text-gray-300 text-xs">
                        {assistant.createdAt
                          ? new Date(assistant.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                      onClick={() => openEditDialog(assistant)}
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                      onClick={() => handleCloneAssistant(assistant)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-700 bg-gray-900 text-red-400 hover:bg-red-900/20"
                      onClick={() => {
                        setDeletingAssistant(assistant);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] bg-gray-950 border-gray-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAssistant ? 'Edit Assistant' : 'Create New Assistant'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingAssistant
                ? 'Update the configuration for this AI assistant.'
                : 'Configure a new AI voice assistant with your preferred model, voice, and behaviour.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Assistant Name</Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Sales Qualifier, Customer Support..."
                className="border-gray-700 bg-gray-900 text-white"
              />
            </div>

            {/* First Message */}
            <div className="grid gap-2">
              <Label htmlFor="firstMessage">First Message</Label>
              <Input
                id="firstMessage"
                value={formState.firstMessage}
                onChange={(e) => setFormState(prev => ({ ...prev, firstMessage: e.target.value }))}
                placeholder="The opening line when a call connects..."
                className="border-gray-700 bg-gray-900 text-white"
              />
            </div>

            {/* System Prompt */}
            <div className="grid gap-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={formState.systemPrompt}
                onChange={(e) => setFormState(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="Describe the assistant's personality, role, and behaviour..."
                className="border-gray-700 bg-gray-900 text-white min-h-[120px]"
              />
            </div>

            {/* Model Provider + Model */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Model Provider</Label>
                <Select
                  value={formState.modelProvider}
                  onValueChange={(value) => {
                    const provider = MODEL_OPTIONS.find(m => m.provider === value);
                    setFormState(prev => ({
                      ...prev,
                      modelProvider: value,
                      model: provider?.models[0] || 'gpt-4o',
                    }));
                  }}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-700">
                    {MODEL_OPTIONS.map(m => (
                      <SelectItem key={m.provider} value={m.provider}>
                        {getProviderLabel(m.provider)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Model</Label>
                <Select
                  value={formState.model}
                  onValueChange={(value) => setFormState(prev => ({ ...prev, model: value }))}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-700">
                    {selectedModelProvider?.models.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Voice Provider + Voice */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Voice Provider</Label>
                <Select
                  value={formState.voiceProvider}
                  onValueChange={(value) => {
                    const provider = VOICE_OPTIONS.find(v => v.provider === value);
                    setFormState(prev => ({
                      ...prev,
                      voiceProvider: value,
                      voiceId: provider?.voices[0]?.id || 'rachel',
                    }));
                  }}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-700">
                    {VOICE_OPTIONS.map(v => (
                      <SelectItem key={v.provider} value={v.provider}>
                        {getProviderLabel(v.provider)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Voice</Label>
                <Select
                  value={formState.voiceId}
                  onValueChange={(value) => setFormState(prev => ({ ...prev, voiceId: value }))}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-700">
                    {selectedVoiceProvider?.voices.map(voice => (
                      <SelectItem key={voice.id} value={voice.id}>{voice.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Transcriber */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Transcriber</Label>
                <Select
                  value={formState.transcriberProvider}
                  onValueChange={(value) => setFormState(prev => ({ ...prev, transcriberProvider: value }))}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-700">
                    <SelectItem value="deepgram">Deepgram</SelectItem>
                    <SelectItem value="talkscriber">Talkscriber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Transcriber Model</Label>
                <Select
                  value={formState.transcriberModel}
                  onValueChange={(value) => setFormState(prev => ({ ...prev, transcriberModel: value }))}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-700">
                    <SelectItem value="nova-2">Nova 2</SelectItem>
                    <SelectItem value="nova-2-general">Nova 2 General</SelectItem>
                    <SelectItem value="nova-2-phonecall">Nova 2 Phone Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingAssistant(null);
              }}
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAssistant}
              disabled={isSaving || !formState.name.trim()}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingAssistant ? (
                'Update Assistant'
              ) : (
                'Create Assistant'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Assistant</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete <strong className="text-white">{deletingAssistant?.name}</strong>?
              This action cannot be undone and will remove the assistant from the voice provider.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingAssistant(null);
              }}
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAssistant}
              disabled={isSaving}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
