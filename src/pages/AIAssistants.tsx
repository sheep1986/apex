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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import WebCallWidget from '@/components/WebCallWidget';
import { useUserContext } from '@/services/MinimalUserProvider';
import { supabase } from '@/services/supabase-client';
import { voiceService, type VoiceAssistant } from '@/services/voice-service';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bot,
  Brain,
  Copy,
  Edit,
  FileUp,
  Loader2,
  MessageSquare,
  Mic,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  Sliders,
  Trash2,
  Volume2,
  Wand2,
  Wrench,
  X,
  Info,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// ── Create / Edit Assistant Form State ──────────────────────────────────────
interface AssistantFormState {
  // Basic
  name: string;
  firstMessage: string;
  systemPrompt: string;
  // Model
  modelProvider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  emotionRecognition: boolean;
  // Voice
  voiceProvider: string;
  voiceId: string;
  stability: number;
  similarityBoost: number;
  speed: number;
  // Transcriber
  transcriberProvider: string;
  transcriberModel: string;
  transcriberLanguage: string;
  smartFormat: boolean;
  keywords: string;
  endpointing: number;
  // Call Settings
  recordingEnabled: boolean;
  maxDurationSeconds: number;
  silenceTimeoutSeconds: number;
  responseDelaySeconds: number;
  endCallMessage: string;
  backgroundSound: string;
  backchannelingEnabled: boolean;
  // Analysis
  summaryEnabled: boolean;
  summaryPrompt: string;
  structuredDataEnabled: boolean;
  structuredDataSchema: string;
  successEvalEnabled: boolean;
  successEvalRubric: string;
  // Behavior
  firstMessageMode: string;
  waitSeconds: number;
  smartEndpointingEnabled: boolean;
  punctuationSeconds: number;
  noPunctuationSeconds: number;
  numberSeconds: number;
  stopNumWords: number;
  stopVoiceSeconds: number;
  stopBackoffSeconds: number;
  endCallEnabled: boolean;
  endCallMaxDurationMessage: string;
  idleMessages: string;
  idleTimeoutSeconds: number;
  idleMaxSpokenCount: number;
  // Advanced
  voicemailDetectionEnabled: boolean;
  voicemailProvider: string;
  backgroundDenoisingEnabled: boolean;
  hipaaEnabled: boolean;
  stereoRecordingEnabled: boolean;
  variableValues: string;
  videoRecordingEnabled: boolean;
  transcriptSavingEnabled: boolean;
}

const defaultForm: AssistantFormState = {
  name: '',
  firstMessage: 'Hello! How can I help you today?',
  systemPrompt: 'You are a helpful AI assistant. Be professional, concise, and friendly.',
  modelProvider: 'openai',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 250,
  emotionRecognition: false,
  voiceProvider: '11labs',
  voiceId: 'rachel',
  stability: 0.5,
  similarityBoost: 0.75,
  speed: 1.0,
  transcriberProvider: 'deepgram',
  transcriberModel: 'nova-2',
  transcriberLanguage: 'en',
  smartFormat: true,
  keywords: '',
  endpointing: 255,
  recordingEnabled: true,
  maxDurationSeconds: 1800,
  silenceTimeoutSeconds: 30,
  responseDelaySeconds: 0,
  endCallMessage: '',
  backgroundSound: 'off',
  backchannelingEnabled: false,
  // Analysis
  summaryEnabled: false,
  summaryPrompt: '',
  structuredDataEnabled: false,
  structuredDataSchema: '',
  successEvalEnabled: false,
  successEvalRubric: '',
  // Behavior
  firstMessageMode: 'assistant-speaks-first',
  waitSeconds: 0,
  smartEndpointingEnabled: true,
  punctuationSeconds: 0.1,
  noPunctuationSeconds: 1.5,
  numberSeconds: 0.5,
  stopNumWords: 0,
  stopVoiceSeconds: 0.2,
  stopBackoffSeconds: 1.0,
  endCallEnabled: false,
  endCallMaxDurationMessage: '',
  idleMessages: '',
  idleTimeoutSeconds: 10,
  idleMaxSpokenCount: 3,
  // Advanced
  voicemailDetectionEnabled: false,
  voicemailProvider: 'twilio',
  backgroundDenoisingEnabled: false,
  hipaaEnabled: false,
  stereoRecordingEnabled: false,
  variableValues: '',
  videoRecordingEnabled: false,
  transcriptSavingEnabled: true,
};

// ── Voice / Model Options ───────────────────────────────────────────────────
const MODEL_OPTIONS = [
  { provider: 'openai', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { provider: 'anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] },
  { provider: 'together-ai', models: ['meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'] },
  { provider: 'groq', models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'] },
  { provider: 'google', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
  { provider: 'openrouter', models: ['meta-llama/llama-3.1-70b-instruct', 'anthropic/claude-3.5-sonnet'] },
  { provider: 'perplexity', models: ['llama-3.1-sonar-large-128k-online'] },
  { provider: 'deepinfra', models: ['meta-llama/Meta-Llama-3.1-70B-Instruct'] },
  { provider: 'custom-llm', models: ['custom'] },
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
  { provider: 'playht', voices: [
    { id: 'jennifer', label: 'Jennifer' },
    { id: 'michael', label: 'Michael' },
    { id: 'emma', label: 'Emma' },
  ]},
  { provider: 'rime', voices: [
    { id: 'mist', label: 'Mist' },
    { id: 'wave', label: 'Wave' },
    { id: 'glow', label: 'Glow' },
  ]},
  { provider: 'azure', voices: [
    { id: 'en-US-JennyNeural', label: 'Jenny (Neural)' },
    { id: 'en-US-GuyNeural', label: 'Guy (Neural)' },
    { id: 'en-US-AriaNeural', label: 'Aria (Neural)' },
  ]},
  { provider: 'lmnt', voices: [
    { id: 'lily', label: 'Lily' },
    { id: 'daniel', label: 'Daniel' },
  ]},
  { provider: 'cartesia', voices: [
    { id: 'sonic-english', label: 'Sonic English' },
  ]},
  { provider: 'neets', voices: [
    { id: 'vits', label: 'VITS' },
  ]},
  { provider: 'smallest-ai', voices: [
    { id: 'lightning', label: 'Lightning' },
  ]},
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-AU', label: 'English (AU)' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
];

const TRANSCRIBER_OPTIONS = [
  { provider: 'deepgram', models: ['nova-2', 'nova-2-general', 'nova-2-phonecall'] },
  { provider: 'gladia', models: ['default'] },
  { provider: 'assembly-ai', models: ['default'] },
  { provider: 'talkscriber', models: ['default'] },
];

const BACKGROUND_SOUND_OPTIONS = [
  { value: 'off', label: 'None' },
  { value: 'office', label: 'Office' },
  { value: 'static', label: 'Static' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'restaurant', label: 'Restaurant' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function getVoiceLabel(assistant: VoiceAssistant): string {
  if (!assistant.voice) return 'Default';
  const provider = assistant.voice.provider || 'unknown';
  const voiceId = assistant.voice.voiceId || 'default';
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
    'deepgram': 'Trinity STT',
    'together-ai': 'Together AI',
    'groq': 'Groq',
    'google': 'Google',
    'openrouter': 'OpenRouter',
    'perplexity': 'Perplexity',
    'deepinfra': 'DeepInfra',
    'custom-llm': 'Custom LLM',
    'playht': 'PlayHT',
    'rime': 'Rime',
    'azure': 'Azure',
    'lmnt': 'LMNT',
    'cartesia': 'Cartesia',
    'neets': 'Neets',
    'smallest-ai': 'Smallest AI',
    'gladia': 'Gladia',
    'assembly-ai': 'AssemblyAI',
    'talkscriber': 'Talkscriber',
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

  // Web call state
  const [testCallAssistant, setTestCallAssistant] = useState<VoiceAssistant | null>(null);

  // Tools & Knowledge Base state
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [availableTools, setAvailableTools] = useState<Array<{ id: string; name: string; description?: string; type: string }>>([]);
  const [availableFiles, setAvailableFiles] = useState<Array<{ id: string; name: string; status?: string }>>([]);
  const [toolsLoading, setToolsLoading] = useState(false);

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

  // ── Load Available Tools & Files ──────────────────────────────────────────
  const loadToolsAndFiles = useCallback(async (editingVapiAssistantId?: string) => {
    setToolsLoading(true);
    try {
      // Load available tools from Supabase
      const orgId = userContext?.organization_id;
      if (orgId) {
        const { data: tools } = await supabase
          .from('voice_tools')
          .select('id, name, description, type')
          .eq('organization_id', orgId)
          .eq('is_active', true)
          .order('name');
        setAvailableTools(tools || []);

        // If editing, load current tool links
        if (editingVapiAssistantId) {
          const { data: dbAssistant } = await supabase
            .from('assistants')
            .select('id')
            .eq('vapi_assistant_id', editingVapiAssistantId)
            .eq('organization_id', orgId)
            .single();

          if (dbAssistant) {
            const { data: links } = await supabase
              .from('assistant_tools')
              .select('tool_id')
              .eq('assistant_id', dbAssistant.id);
            setSelectedToolIds((links || []).map((l: any) => l.tool_id));
          } else {
            setSelectedToolIds([]);
          }
        } else {
          setSelectedToolIds([]);
        }
      }

      // Load available files from Vapi
      try {
        const files = await voiceService.getFiles();
        setAvailableFiles(files.map((f: any) => ({ id: f.id, name: f.name || f.originalName || f.id, status: f.status })));

        // If editing, load current file IDs from the assistant's knowledgeBase
        if (editingVapiAssistantId) {
          try {
            const assistantData = await voiceService.getAssistant(editingVapiAssistantId);
            const kbFileIds = (assistantData as any)?.model?.knowledgeBase?.fileIds || [];
            setSelectedFileIds(kbFileIds);
          } catch {
            setSelectedFileIds([]);
          }
        } else {
          setSelectedFileIds([]);
        }
      } catch {
        setAvailableFiles([]);
        setSelectedFileIds([]);
      }
    } catch (err) {
      console.warn('Failed to load tools/files:', err);
    }
    setToolsLoading(false);
  }, [userContext?.organization_id]);

  // ── Create / Update Assistant ─────────────────────────────────────────────
  const handleSaveAssistant = async () => {
    if (!formState.name.trim()) return;
    setIsSaving(true);
    setError(null);

    try {
      // Parse variable values from key=value lines
      const parsedVariableValues: Record<string, string> = {};
      if (formState.variableValues.trim()) {
        formState.variableValues.trim().split('\n').forEach(line => {
          const eqIdx = line.indexOf('=');
          if (eqIdx > 0) {
            parsedVariableValues[line.slice(0, eqIdx).trim()] = line.slice(eqIdx + 1).trim();
          }
        });
      }

      // Parse structured data schema
      let parsedSchema: Record<string, any> | undefined;
      if (formState.structuredDataEnabled && formState.structuredDataSchema.trim()) {
        try {
          parsedSchema = JSON.parse(formState.structuredDataSchema);
        } catch {
          setError('Structured Data Schema must be valid JSON');
          setIsSaving(false);
          return;
        }
      }

      const payload: Partial<VoiceAssistant> = {
        name: formState.name.trim(),
        firstMessage: formState.firstMessage.trim() || undefined,
        firstMessageMode: formState.firstMessageMode !== 'assistant-speaks-first'
          ? formState.firstMessageMode as VoiceAssistant['firstMessageMode']
          : undefined,
        model: {
          provider: formState.modelProvider,
          model: formState.model,
          systemMessage: formState.systemPrompt.trim() || undefined,
          temperature: formState.temperature,
          maxTokens: formState.maxTokens,
          emotionRecognitionEnabled: formState.emotionRecognition || undefined,
        },
        voice: {
          provider: formState.voiceProvider,
          voiceId: formState.voiceId,
          ...(formState.voiceProvider === '11labs' ? {
            stability: formState.stability,
            similarityBoost: formState.similarityBoost,
            speed: formState.speed,
          } : {}),
        },
        transcriber: {
          provider: formState.transcriberProvider,
          model: formState.transcriberModel,
          language: formState.transcriberLanguage || undefined,
          smartFormat: formState.smartFormat,
          keywords: formState.keywords ? formState.keywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
          endpointing: formState.endpointing !== 255 ? formState.endpointing : undefined,
        },
        recordingEnabled: formState.recordingEnabled,
        maxDurationSeconds: formState.maxDurationSeconds || undefined,
        silenceTimeoutSeconds: formState.silenceTimeoutSeconds || undefined,
        responseDelaySeconds: formState.responseDelaySeconds || undefined,
        endCallMessage: formState.endCallMessage.trim() || undefined,
        backgroundSound: formState.backgroundSound !== 'off' ? formState.backgroundSound : undefined,
        backchannelingEnabled: formState.backchannelingEnabled || undefined,
        // Analysis Plan
        analysisPlan: (formState.summaryEnabled || formState.structuredDataEnabled || formState.successEvalEnabled) ? {
          summaryPlan: formState.summaryEnabled ? {
            enabled: true,
            prompt: formState.summaryPrompt.trim() || undefined,
          } : undefined,
          structuredDataPlan: formState.structuredDataEnabled ? {
            enabled: true,
            schema: parsedSchema,
          } : undefined,
          successEvaluationPlan: formState.successEvalEnabled ? {
            enabled: true,
            rubric: formState.successEvalRubric.trim() || undefined,
          } : undefined,
        } : undefined,
        // Artifact Plan
        artifactPlan: {
          recordingEnabled: formState.recordingEnabled,
          videoRecordingEnabled: formState.videoRecordingEnabled || undefined,
          transcriptPlan: { enabled: formState.transcriptSavingEnabled },
        },
        // Behavior Plans
        startSpeakingPlan: {
          waitSeconds: formState.waitSeconds || undefined,
          smartEndpointingEnabled: formState.smartEndpointingEnabled,
          transcriptionEndpointingPlan: {
            onPunctuationSeconds: formState.punctuationSeconds,
            onNoPunctuationSeconds: formState.noPunctuationSeconds,
            onNumberSeconds: formState.numberSeconds,
          },
        },
        stopSpeakingPlan: {
          numWords: formState.stopNumWords || undefined,
          voiceSeconds: formState.stopVoiceSeconds || undefined,
          backoffSeconds: formState.stopBackoffSeconds || undefined,
        },
        endCallPlan: formState.endCallEnabled ? {
          enabled: true,
          maxCallDurationMessage: formState.endCallMaxDurationMessage.trim() || undefined,
        } : undefined,
        messagePlan: (formState.idleMessages.trim()) ? {
          idleMessages: formState.idleMessages.split('\n').map(m => m.trim()).filter(Boolean),
          idleTimeoutSeconds: formState.idleTimeoutSeconds,
          idleMaxSpokenCount: formState.idleMaxSpokenCount,
        } : undefined,
        // Advanced
        voicemailDetection: formState.voicemailDetectionEnabled ? {
          enabled: true,
          provider: formState.voicemailProvider || undefined,
        } : undefined,
        backgroundDenoisingEnabled: formState.backgroundDenoisingEnabled || undefined,
        hipaaEnabled: formState.hipaaEnabled || undefined,
        stereoRecordingEnabled: formState.stereoRecordingEnabled || undefined,
        variableValues: Object.keys(parsedVariableValues).length > 0 ? parsedVariableValues : undefined,
      };

      // Include toolIds and fileIds for Vapi sync
      const payloadWithExtras = {
        ...payload,
        toolIds: selectedToolIds.length > 0 ? selectedToolIds : [],
        fileIds: selectedFileIds.length > 0 ? selectedFileIds : [],
      };

      if (editingAssistant) {
        await voiceService.updateAssistant(editingAssistant.id, payloadWithExtras);
      } else {
        await voiceService.createAssistant(payloadWithExtras);
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
        recordingEnabled: assistant.recordingEnabled,
        maxDurationSeconds: assistant.maxDurationSeconds,
        silenceTimeoutSeconds: assistant.silenceTimeoutSeconds,
        endCallMessage: assistant.endCallMessage,
        backgroundSound: assistant.backgroundSound,
        backchannelingEnabled: assistant.backchannelingEnabled,
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
      temperature: assistant.model?.temperature ?? 0.7,
      maxTokens: assistant.model?.maxTokens ?? 250,
      emotionRecognition: assistant.model?.emotionRecognitionEnabled ?? false,
      voiceProvider: assistant.voice?.provider || '11labs',
      voiceId: assistant.voice?.voiceId || 'rachel',
      stability: assistant.voice?.stability ?? 0.5,
      similarityBoost: assistant.voice?.similarityBoost ?? 0.75,
      speed: assistant.voice?.speed ?? 1.0,
      transcriberProvider: assistant.transcriber?.provider || 'deepgram',
      transcriberModel: assistant.transcriber?.model || 'nova-2',
      transcriberLanguage: assistant.transcriber?.language || 'en',
      smartFormat: assistant.transcriber?.smartFormat ?? true,
      keywords: assistant.transcriber?.keywords?.join(', ') || '',
      endpointing: assistant.transcriber?.endpointing ?? 255,
      recordingEnabled: assistant.recordingEnabled ?? true,
      maxDurationSeconds: assistant.maxDurationSeconds ?? 1800,
      silenceTimeoutSeconds: assistant.silenceTimeoutSeconds ?? 30,
      responseDelaySeconds: assistant.responseDelaySeconds ?? 0,
      endCallMessage: assistant.endCallMessage || '',
      backgroundSound: assistant.backgroundSound || 'off',
      backchannelingEnabled: assistant.backchannelingEnabled ?? false,
      // Analysis
      summaryEnabled: assistant.analysisPlan?.summaryPlan?.enabled ?? false,
      summaryPrompt: assistant.analysisPlan?.summaryPlan?.prompt || '',
      structuredDataEnabled: assistant.analysisPlan?.structuredDataPlan?.enabled ?? false,
      structuredDataSchema: assistant.analysisPlan?.structuredDataPlan?.schema
        ? JSON.stringify(assistant.analysisPlan.structuredDataPlan.schema, null, 2) : '',
      successEvalEnabled: assistant.analysisPlan?.successEvaluationPlan?.enabled ?? false,
      successEvalRubric: assistant.analysisPlan?.successEvaluationPlan?.rubric || '',
      // Behavior
      firstMessageMode: assistant.firstMessageMode || 'assistant-speaks-first',
      waitSeconds: assistant.startSpeakingPlan?.waitSeconds ?? 0,
      smartEndpointingEnabled: assistant.startSpeakingPlan?.smartEndpointingEnabled ?? true,
      punctuationSeconds: assistant.startSpeakingPlan?.transcriptionEndpointingPlan?.onPunctuationSeconds ?? 0.1,
      noPunctuationSeconds: assistant.startSpeakingPlan?.transcriptionEndpointingPlan?.onNoPunctuationSeconds ?? 1.5,
      numberSeconds: assistant.startSpeakingPlan?.transcriptionEndpointingPlan?.onNumberSeconds ?? 0.5,
      stopNumWords: assistant.stopSpeakingPlan?.numWords ?? 0,
      stopVoiceSeconds: assistant.stopSpeakingPlan?.voiceSeconds ?? 0.2,
      stopBackoffSeconds: assistant.stopSpeakingPlan?.backoffSeconds ?? 1.0,
      endCallEnabled: assistant.endCallPlan?.enabled ?? false,
      endCallMaxDurationMessage: assistant.endCallPlan?.maxCallDurationMessage || '',
      idleMessages: assistant.messagePlan?.idleMessages?.join('\n') || '',
      idleTimeoutSeconds: assistant.messagePlan?.idleTimeoutSeconds ?? 10,
      idleMaxSpokenCount: assistant.messagePlan?.idleMaxSpokenCount ?? 3,
      // Advanced
      voicemailDetectionEnabled: assistant.voicemailDetection?.enabled ?? false,
      voicemailProvider: assistant.voicemailDetection?.provider || 'twilio',
      backgroundDenoisingEnabled: assistant.backgroundDenoisingEnabled ?? false,
      hipaaEnabled: assistant.hipaaEnabled ?? false,
      stereoRecordingEnabled: assistant.stereoRecordingEnabled ?? false,
      variableValues: assistant.variableValues
        ? Object.entries(assistant.variableValues).map(([k, v]) => `${k}=${v}`).join('\n') : '',
      videoRecordingEnabled: assistant.artifactPlan?.videoRecordingEnabled ?? false,
      transcriptSavingEnabled: assistant.artifactPlan?.transcriptPlan?.enabled ?? true,
    });
    loadToolsAndFiles(assistant.id);
    setShowCreateDialog(true);
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredAssistants = assistants.filter((a) =>
    a.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Voice Service Status Banner (non-blocking) ───────────────────────────
  const voiceServiceReady = initStatus === 'ready';

  const renderStatusBanner = () => {
    if (initStatus === 'loading') {
      return (
        <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-200">Connecting to Voice Network...</p>
        </div>
      );
    }
    if (initStatus === 'unconfigured') {
      return (
        <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-200">
          <Info className="h-4 w-4 text-amber-400" />
          <AlertTitle className="text-amber-200">Voice Service Not Configured</AlertTitle>
          <AlertDescription className="text-amber-200/80">
            Your organization doesn't have a Voice Provider set up yet. To create and manage AI assistants,
            ask your platform administrator to configure the Vapi API key in the Netlify environment variables.
          </AlertDescription>
        </Alert>
      );
    }
    if (initStatus === 'error') {
      return (
        <Alert className="border-yellow-500/20 bg-yellow-500/10 text-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <AlertTitle className="text-yellow-200">Voice Service Unavailable</AlertTitle>
          <AlertDescription className="text-yellow-200/80">
            Could not connect to the Voice Service. Assistants are displayed in read-only mode.
            Check your network connection or contact your administrator to verify the Voice Provider configuration.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  // ── Available models for selected provider ────────────────────────────────
  const selectedModelProvider = MODEL_OPTIONS.find(m => m.provider === formState.modelProvider);
  const selectedVoiceProvider = VOICE_OPTIONS.find(v => v.provider === formState.voiceProvider);

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Voice Service Status Banner */}
        {renderStatusBanner()}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400">Manage your AI voice assistants</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchAssistants}
              disabled={isLoading || !voiceServiceReady}
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setEditingAssistant(null);
                setFormState(defaultForm);
                loadToolsAndFiles();
                setShowCreateDialog(true);
              }}
              disabled={!voiceServiceReady}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700 disabled:opacity-50"
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
              {searchQuery
                ? 'No assistants match your search'
                : !voiceServiceReady
                  ? 'Voice Service setup required'
                  : 'No assistants yet'}
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              {searchQuery
                ? 'Try a different search term.'
                : !voiceServiceReady
                  ? 'Configure your Voice Provider (Vapi API key) to start creating and managing AI assistants.'
                  : 'Create your first AI voice assistant to start making calls, handling inbound enquiries, and automating conversations.'}
            </p>
            {!searchQuery && voiceServiceReady && (
              <Button
                onClick={() => {
                  setEditingAssistant(null);
                  setFormState(defaultForm);
                  loadToolsAndFiles();
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
                        {assistant.recordingEnabled && (
                          <Badge variant="outline" className="text-xs text-red-400 border-red-800">
                            REC
                          </Badge>
                        )}
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
                    <div className="flex justify-between">
                      <span className="text-gray-400">Temperature:</span>
                      <span className="font-medium text-white">
                        {assistant.model?.temperature ?? 0.7}
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
                      className="border-emerald-700 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40"
                      onClick={() => setTestCallAssistant(assistant)}
                      title="Test Call"
                    >
                      <PhoneCall className="h-4 w-4" />
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
        <DialogContent className="sm:max-w-[720px] bg-gray-950 border-gray-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingAssistant ? 'Edit Assistant' : 'Create New Assistant'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingAssistant
                ? 'Update the configuration for this AI assistant.'
                : 'Configure a new AI voice assistant with full control over model, voice, transcription, and call behaviour.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-900 border border-gray-800">
              <TabsTrigger value="basics" className="text-xs data-[state=active]:bg-gray-800">
                <Bot className="mr-1 h-3 w-3" /> Basics
              </TabsTrigger>
              <TabsTrigger value="model" className="text-xs data-[state=active]:bg-gray-800">
                <Sliders className="mr-1 h-3 w-3" /> Model
              </TabsTrigger>
              <TabsTrigger value="voice" className="text-xs data-[state=active]:bg-gray-800">
                <Volume2 className="mr-1 h-3 w-3" /> Voice
              </TabsTrigger>
              <TabsTrigger value="transcriber" className="text-xs data-[state=active]:bg-gray-800">
                <Mic className="mr-1 h-3 w-3" /> Transcriber
              </TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-4 bg-gray-900 border border-gray-800 mt-1">
              <TabsTrigger value="call" className="text-xs data-[state=active]:bg-gray-800">
                <Settings2 className="mr-1 h-3 w-3" /> Call
              </TabsTrigger>
              <TabsTrigger value="analysis" className="text-xs data-[state=active]:bg-gray-800">
                <BarChart3 className="mr-1 h-3 w-3" /> Analysis
              </TabsTrigger>
              <TabsTrigger value="behavior" className="text-xs data-[state=active]:bg-gray-800">
                <Brain className="mr-1 h-3 w-3" /> Behavior
              </TabsTrigger>
              <TabsTrigger value="tools-kb" className="text-xs data-[state=active]:bg-gray-800">
                <Wrench className="mr-1 h-3 w-3" /> Tools & KB
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs data-[state=active]:bg-gray-800">
                <Wand2 className="mr-1 h-3 w-3" /> Advanced
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Basics ─────────────────────────────────────────── */}
            <TabsContent value="basics" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Assistant Name *</Label>
                  <Input
                    id="name"
                    value={formState.name}
                    onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Sales Qualifier, Customer Support..."
                    className="border-gray-700 bg-gray-900 text-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="firstMessage">First Message</Label>
                  <Input
                    id="firstMessage"
                    value={formState.firstMessage}
                    onChange={(e) => setFormState(prev => ({ ...prev, firstMessage: e.target.value }))}
                    placeholder="The opening line when a call connects..."
                    className="border-gray-700 bg-gray-900 text-white"
                  />
                  <p className="text-xs text-gray-500">What the assistant says when the call starts.</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="systemPrompt">System Prompt</Label>
                  <Textarea
                    id="systemPrompt"
                    value={formState.systemPrompt}
                    onChange={(e) => setFormState(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    placeholder="Describe the assistant's personality, role, and behaviour..."
                    className="border-gray-700 bg-gray-900 text-white min-h-[160px]"
                  />
                  <p className="text-xs text-gray-500">Instructions that define the assistant&apos;s personality, knowledge, and behaviour.</p>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab: Model ──────────────────────────────────────────── */}
            <TabsContent value="model" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Provider</Label>
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

              <div className="space-y-3 rounded-lg border border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Temperature</Label>
                    <p className="text-xs text-gray-500 mt-0.5">Controls creativity. Lower = more focused, higher = more creative.</p>
                  </div>
                  <span className="text-sm font-mono text-emerald-400 min-w-[3rem] text-right">{formState.temperature.toFixed(1)}</span>
                </div>
                <Slider
                  value={[formState.temperature]}
                  onValueChange={(val) => setFormState(prev => ({ ...prev, temperature: val[0] }))}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3 rounded-lg border border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Max Tokens</Label>
                    <p className="text-xs text-gray-500 mt-0.5">Maximum response length. Higher = longer responses, more cost.</p>
                  </div>
                  <span className="text-sm font-mono text-emerald-400 min-w-[3rem] text-right">{formState.maxTokens}</span>
                </div>
                <Slider
                  value={[formState.maxTokens]}
                  onValueChange={(val) => setFormState(prev => ({ ...prev, maxTokens: val[0] }))}
                  min={50}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div>
                  <Label>Emotion Recognition</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Detect caller emotions and adapt responses accordingly.</p>
                </div>
                <Switch
                  checked={formState.emotionRecognition}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, emotionRecognition: checked }))}
                />
              </div>
            </TabsContent>

            {/* ── Tab: Voice ──────────────────────────────────────────── */}
            <TabsContent value="voice" className="space-y-4 mt-4">
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

              {/* ElevenLabs-specific tuning */}
              {formState.voiceProvider === '11labs' && (
                <div className="space-y-4 rounded-lg border border-gray-800 p-4">
                  <h4 className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                    <Sliders className="h-4 w-4" /> ElevenLabs Voice Tuning
                  </h4>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Stability</Label>
                      <span className="text-xs font-mono text-gray-400">{formState.stability.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[formState.stability]}
                      onValueChange={(val) => setFormState(prev => ({ ...prev, stability: val[0] }))}
                      min={0}
                      max={1}
                      step={0.01}
                    />
                    <p className="text-xs text-gray-500">Lower = more expressive/variable. Higher = more consistent/stable.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Similarity Boost</Label>
                      <span className="text-xs font-mono text-gray-400">{formState.similarityBoost.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[formState.similarityBoost]}
                      onValueChange={(val) => setFormState(prev => ({ ...prev, similarityBoost: val[0] }))}
                      min={0}
                      max={1}
                      step={0.01}
                    />
                    <p className="text-xs text-gray-500">How closely the output matches the original voice. Higher = more accurate.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Speed</Label>
                      <span className="text-xs font-mono text-gray-400">{formState.speed.toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={[formState.speed]}
                      onValueChange={(val) => setFormState(prev => ({ ...prev, speed: val[0] }))}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />
                    <p className="text-xs text-gray-500">Speech rate. 1.0 is normal speed.</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Tab: Transcriber ────────────────────────────────────── */}
            <TabsContent value="transcriber" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Transcriber Provider</Label>
                  <Select
                    value={formState.transcriberProvider}
                    onValueChange={(value) => setFormState(prev => ({ ...prev, transcriberProvider: value }))}
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-950 border-gray-700">
                      {TRANSCRIBER_OPTIONS.map(t => (
                        <SelectItem key={t.provider} value={t.provider}>
                          {getProviderLabel(t.provider)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Model</Label>
                  <Select
                    value={formState.transcriberModel}
                    onValueChange={(value) => setFormState(prev => ({ ...prev, transcriberModel: value }))}
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-950 border-gray-700">
                      {(TRANSCRIBER_OPTIONS.find(t => t.provider === formState.transcriberProvider)?.models || ['default']).map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Language</Label>
                <Select
                  value={formState.transcriberLanguage}
                  onValueChange={(value) => setFormState(prev => ({ ...prev, transcriberLanguage: value }))}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-700">
                    {LANGUAGE_OPTIONS.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Primary language for speech-to-text transcription.</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="keywords">Boost Keywords</Label>
                <Input
                  id="keywords"
                  value={formState.keywords}
                  onChange={(e) => setFormState(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="e.g. Trinity Labs, SaaS, premium plan..."
                  className="border-gray-700 bg-gray-900 text-white"
                />
                <p className="text-xs text-gray-500">Comma-separated. Helps the transcriber recognise industry terms, brand names, etc.</p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div>
                  <Label>Smart Format</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Auto-format numbers, dates, and currencies in transcripts.</p>
                </div>
                <Switch
                  checked={formState.smartFormat}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, smartFormat: checked }))}
                />
              </div>

              <div className="space-y-3 rounded-lg border border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Endpointing (ms)</Label>
                    <p className="text-xs text-gray-500 mt-0.5">How long to wait after silence before processing speech. Lower = faster, more interruptions.</p>
                  </div>
                  <span className="text-sm font-mono text-emerald-400">{formState.endpointing}ms</span>
                </div>
                <Slider
                  value={[formState.endpointing]}
                  onValueChange={(val) => setFormState(prev => ({ ...prev, endpointing: val[0] }))}
                  min={50}
                  max={500}
                  step={5}
                />
              </div>
            </TabsContent>

            {/* ── Tab: Call Settings ──────────────────────────────────── */}
            <TabsContent value="call" className="space-y-4 mt-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div>
                  <Label>Call Recording</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Record all calls for this assistant. Required for analytics and playback.</p>
                </div>
                <Switch
                  checked={formState.recordingEnabled}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, recordingEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div>
                  <Label>Backchannel Responses</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Natural verbal cues like &quot;uh-huh&quot;, &quot;I see&quot;, &quot;right&quot; while listening.</p>
                </div>
                <Switch
                  checked={formState.backchannelingEnabled}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, backchannelingEnabled: checked }))}
                />
              </div>

              <div className="space-y-3 rounded-lg border border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Max Call Duration</Label>
                    <p className="text-xs text-gray-500 mt-0.5">Automatically end the call after this many minutes.</p>
                  </div>
                  <span className="text-sm font-mono text-emerald-400">{Math.round(formState.maxDurationSeconds / 60)} min</span>
                </div>
                <Slider
                  value={[formState.maxDurationSeconds]}
                  onValueChange={(val) => setFormState(prev => ({ ...prev, maxDurationSeconds: val[0] }))}
                  min={60}
                  max={3600}
                  step={60}
                />
              </div>

              <div className="space-y-3 rounded-lg border border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Silence Timeout</Label>
                    <p className="text-xs text-gray-500 mt-0.5">End the call if no speech is detected for this long.</p>
                  </div>
                  <span className="text-sm font-mono text-emerald-400">{formState.silenceTimeoutSeconds}s</span>
                </div>
                <Slider
                  value={[formState.silenceTimeoutSeconds]}
                  onValueChange={(val) => setFormState(prev => ({ ...prev, silenceTimeoutSeconds: val[0] }))}
                  min={5}
                  max={120}
                  step={5}
                />
              </div>

              <div className="space-y-3 rounded-lg border border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Response Delay</Label>
                    <p className="text-xs text-gray-500 mt-0.5">Artificial pause before the assistant responds. Makes it sound more natural.</p>
                  </div>
                  <span className="text-sm font-mono text-emerald-400">{formState.responseDelaySeconds.toFixed(1)}s</span>
                </div>
                <Slider
                  value={[formState.responseDelaySeconds]}
                  onValueChange={(val) => setFormState(prev => ({ ...prev, responseDelaySeconds: val[0] }))}
                  min={0}
                  max={3}
                  step={0.1}
                />
              </div>

              <div className="grid gap-2">
                <Label>Background Sound</Label>
                <Select
                  value={formState.backgroundSound}
                  onValueChange={(value) => setFormState(prev => ({ ...prev, backgroundSound: value }))}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-700">
                    {BACKGROUND_SOUND_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Ambient background audio during calls. &quot;Office&quot; adds a realistic call-centre feel.</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endCallMessage">End Call Message</Label>
                <Input
                  id="endCallMessage"
                  value={formState.endCallMessage}
                  onChange={(e) => setFormState(prev => ({ ...prev, endCallMessage: e.target.value }))}
                  placeholder="e.g. Thank you for your time. Goodbye!"
                  className="border-gray-700 bg-gray-900 text-white"
                />
                <p className="text-xs text-gray-500">Final message spoken before the assistant ends the call.</p>
              </div>
            </TabsContent>

            {/* ── Tab: Analysis ──────────────────────────────────────── */}
            <TabsContent value="analysis" className="space-y-4 mt-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div>
                  <Label>Call Summary</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Generate an automatic summary after each call ends.</p>
                </div>
                <Switch
                  checked={formState.summaryEnabled}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, summaryEnabled: checked }))}
                />
              </div>

              {formState.summaryEnabled && (
                <div className="grid gap-2 pl-4 border-l-2 border-emerald-800">
                  <Label htmlFor="summaryPrompt">Summary Prompt</Label>
                  <Textarea
                    id="summaryPrompt"
                    value={formState.summaryPrompt}
                    onChange={(e) => setFormState(prev => ({ ...prev, summaryPrompt: e.target.value }))}
                    placeholder="Custom prompt for generating the call summary..."
                    className="border-gray-700 bg-gray-900 text-white min-h-[80px]"
                  />
                  <p className="text-xs text-gray-500">Leave empty to use the default summary prompt.</p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div>
                  <Label>Structured Data Extraction</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Extract structured fields from calls (e.g. budget, interest level, name).</p>
                </div>
                <Switch
                  checked={formState.structuredDataEnabled}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, structuredDataEnabled: checked }))}
                />
              </div>

              {formState.structuredDataEnabled && (
                <div className="grid gap-2 pl-4 border-l-2 border-emerald-800">
                  <Label htmlFor="structuredDataSchema">JSON Schema</Label>
                  <Textarea
                    id="structuredDataSchema"
                    value={formState.structuredDataSchema}
                    onChange={(e) => setFormState(prev => ({ ...prev, structuredDataSchema: e.target.value }))}
                    placeholder={'{\n  "type": "object",\n  "properties": {\n    "budget": { "type": "string" },\n    "interested": { "type": "boolean" }\n  }\n}'}
                    className="border-gray-700 bg-gray-900 text-white min-h-[120px] font-mono text-xs"
                  />
                  <p className="text-xs text-gray-500">Define the JSON schema for data to extract from each call.</p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div>
                  <Label>Success Evaluation</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Automatically score whether the call achieved its goal.</p>
                </div>
                <Switch
                  checked={formState.successEvalEnabled}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, successEvalEnabled: checked }))}
                />
              </div>

              {formState.successEvalEnabled && (
                <div className="grid gap-2 pl-4 border-l-2 border-emerald-800">
                  <Label htmlFor="successEvalRubric">Evaluation Rubric</Label>
                  <Textarea
                    id="successEvalRubric"
                    value={formState.successEvalRubric}
                    onChange={(e) => setFormState(prev => ({ ...prev, successEvalRubric: e.target.value }))}
                    placeholder="e.g. Call is successful if an appointment is booked and the caller confirms their email..."
                    className="border-gray-700 bg-gray-900 text-white min-h-[80px]"
                  />
                  <p className="text-xs text-gray-500">Describe the criteria for a successful call.</p>
                </div>
              )}
            </TabsContent>

            {/* ── Tab: Behavior ──────────────────────────────────────── */}
            <TabsContent value="behavior" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label>First Message Mode</Label>
                <Select
                  value={formState.firstMessageMode}
                  onValueChange={(value) => setFormState(prev => ({ ...prev, firstMessageMode: value }))}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-700">
                    <SelectItem value="assistant-speaks-first">Assistant Speaks First</SelectItem>
                    <SelectItem value="assistant-speaks-first-with-model-generated-message">Assistant Speaks First (Model Generated)</SelectItem>
                    <SelectItem value="assistant-waits-for-user">Assistant Waits for User</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Controls who speaks first when a call begins.</p>
              </div>

              {/* Start Speaking Plan */}
              <div className="space-y-3 rounded-lg border border-gray-800 p-4">
                <h4 className="text-sm font-medium text-emerald-400">Start Speaking Plan</h4>
                <p className="text-xs text-gray-500">Controls when the assistant begins responding after the user stops speaking.</p>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Smart Endpointing</Label>
                    <p className="text-xs text-gray-500 mt-0.5">AI-powered detection of when the user has finished speaking.</p>
                  </div>
                  <Switch
                    checked={formState.smartEndpointingEnabled}
                    onCheckedChange={(checked) => setFormState(prev => ({ ...prev, smartEndpointingEnabled: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Wait Time Before Speaking</Label>
                    <span className="text-xs font-mono text-gray-400">{formState.waitSeconds.toFixed(1)}s</span>
                  </div>
                  <Slider
                    value={[formState.waitSeconds]}
                    onValueChange={(val) => setFormState(prev => ({ ...prev, waitSeconds: val[0] }))}
                    min={0} max={3} step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">After Punctuation</Label>
                    <span className="text-xs font-mono text-gray-400">{formState.punctuationSeconds.toFixed(1)}s</span>
                  </div>
                  <Slider
                    value={[formState.punctuationSeconds]}
                    onValueChange={(val) => setFormState(prev => ({ ...prev, punctuationSeconds: val[0] }))}
                    min={0} max={3} step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Without Punctuation</Label>
                    <span className="text-xs font-mono text-gray-400">{formState.noPunctuationSeconds.toFixed(1)}s</span>
                  </div>
                  <Slider
                    value={[formState.noPunctuationSeconds]}
                    onValueChange={(val) => setFormState(prev => ({ ...prev, noPunctuationSeconds: val[0] }))}
                    min={0} max={5} step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">After Number</Label>
                    <span className="text-xs font-mono text-gray-400">{formState.numberSeconds.toFixed(1)}s</span>
                  </div>
                  <Slider
                    value={[formState.numberSeconds]}
                    onValueChange={(val) => setFormState(prev => ({ ...prev, numberSeconds: val[0] }))}
                    min={0} max={3} step={0.1}
                  />
                </div>
              </div>

              {/* Stop Speaking Plan */}
              <div className="space-y-3 rounded-lg border border-gray-800 p-4">
                <h4 className="text-sm font-medium text-emerald-400">Stop Speaking Plan</h4>
                <p className="text-xs text-gray-500">Controls when the assistant stops speaking if interrupted by the user.</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Word Threshold</Label>
                    <span className="text-xs font-mono text-gray-400">{formState.stopNumWords} words</span>
                  </div>
                  <Slider
                    value={[formState.stopNumWords]}
                    onValueChange={(val) => setFormState(prev => ({ ...prev, stopNumWords: val[0] }))}
                    min={0} max={10} step={1}
                  />
                  <p className="text-xs text-gray-500">How many words the user must speak to trigger interruption (0 = any).</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Voice Detection Time</Label>
                    <span className="text-xs font-mono text-gray-400">{formState.stopVoiceSeconds.toFixed(1)}s</span>
                  </div>
                  <Slider
                    value={[formState.stopVoiceSeconds]}
                    onValueChange={(val) => setFormState(prev => ({ ...prev, stopVoiceSeconds: val[0] }))}
                    min={0} max={2} step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Backoff Time</Label>
                    <span className="text-xs font-mono text-gray-400">{formState.stopBackoffSeconds.toFixed(1)}s</span>
                  </div>
                  <Slider
                    value={[formState.stopBackoffSeconds]}
                    onValueChange={(val) => setFormState(prev => ({ ...prev, stopBackoffSeconds: val[0] }))}
                    min={0} max={5} step={0.1}
                  />
                  <p className="text-xs text-gray-500">How long to wait before the assistant can resume speaking after being interrupted.</p>
                </div>
              </div>

              {/* End Call Plan */}
              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div>
                  <Label>Auto End Call</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Automatically end the call when the max duration is reached.</p>
                </div>
                <Switch
                  checked={formState.endCallEnabled}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, endCallEnabled: checked }))}
                />
              </div>

              {formState.endCallEnabled && (
                <div className="grid gap-2 pl-4 border-l-2 border-emerald-800">
                  <Label htmlFor="endCallMaxDurationMessage">Max Duration Message</Label>
                  <Input
                    id="endCallMaxDurationMessage"
                    value={formState.endCallMaxDurationMessage}
                    onChange={(e) => setFormState(prev => ({ ...prev, endCallMaxDurationMessage: e.target.value }))}
                    placeholder="e.g. We've reached the time limit. Thank you for your call!"
                    className="border-gray-700 bg-gray-900 text-white"
                  />
                </div>
              )}

              {/* Idle Messages */}
              <div className="space-y-3 rounded-lg border border-gray-800 p-4">
                <h4 className="text-sm font-medium text-emerald-400">Idle Messages</h4>
                <p className="text-xs text-gray-500">Messages the assistant speaks when the conversation goes silent.</p>

                <div className="grid gap-2">
                  <Label htmlFor="idleMessages">Messages (one per line)</Label>
                  <Textarea
                    id="idleMessages"
                    value={formState.idleMessages}
                    onChange={(e) => setFormState(prev => ({ ...prev, idleMessages: e.target.value }))}
                    placeholder={"Are you still there?\nIs there anything else I can help with?\nTake your time, I'm here when you're ready."}
                    className="border-gray-700 bg-gray-900 text-white min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Idle Timeout</Label>
                      <span className="text-xs font-mono text-gray-400">{formState.idleTimeoutSeconds}s</span>
                    </div>
                    <Slider
                      value={[formState.idleTimeoutSeconds]}
                      onValueChange={(val) => setFormState(prev => ({ ...prev, idleTimeoutSeconds: val[0] }))}
                      min={5} max={60} step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Max Times</Label>
                      <span className="text-xs font-mono text-gray-400">{formState.idleMaxSpokenCount}x</span>
                    </div>
                    <Slider
                      value={[formState.idleMaxSpokenCount]}
                      onValueChange={(val) => setFormState(prev => ({ ...prev, idleMaxSpokenCount: val[0] }))}
                      min={1} max={10} step={1}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab: Tools & Knowledge Base ───────────────────────── */}
            <TabsContent value="tools-kb" className="space-y-4 mt-4">
              {/* Tools Section */}
              <div className="rounded-lg border border-gray-800 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-emerald-400" />
                  <Label className="text-sm font-semibold">Tools</Label>
                </div>
                <p className="mb-3 text-xs text-gray-500">
                  Select tools this assistant can use during calls (function calling, transfers, etc).
                </p>
                {toolsLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    <span className="text-sm text-gray-400">Loading tools...</span>
                  </div>
                ) : availableTools.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No tools available. Create tools in the Tools page first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableTools.map((tool) => (
                      <label
                        key={tool.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                          selectedToolIds.includes(tool.id)
                            ? 'border-emerald-600 bg-emerald-500/10'
                            : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedToolIds.includes(tool.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedToolIds((prev) => [...prev, tool.id]);
                            } else {
                              setSelectedToolIds((prev) => prev.filter((id) => id !== tool.id));
                            }
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-white">{tool.name}</span>
                          <span className="ml-2 text-xs text-gray-500">({tool.type})</span>
                          {tool.description && (
                            <p className="mt-0.5 text-xs text-gray-400">{tool.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {selectedToolIds.length > 0 && (
                  <p className="mt-2 text-xs text-emerald-400">
                    {selectedToolIds.length} tool{selectedToolIds.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Knowledge Base Section */}
              <div className="rounded-lg border border-gray-800 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-blue-400" />
                  <Label className="text-sm font-semibold">Knowledge Base Files</Label>
                </div>
                <p className="mb-3 text-xs text-gray-500">
                  Link uploaded files to this assistant for retrieval-augmented generation (RAG).
                </p>
                {toolsLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    <span className="text-sm text-gray-400">Loading files...</span>
                  </div>
                ) : availableFiles.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No files uploaded. Upload files via the Knowledge Base section to use them here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableFiles.map((file) => (
                      <label
                        key={file.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                          selectedFileIds.includes(file.id)
                            ? 'border-blue-600 bg-blue-500/10'
                            : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFileIds.includes(file.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFileIds((prev) => [...prev, file.id]);
                            } else {
                              setSelectedFileIds((prev) => prev.filter((id) => id !== file.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-white">{file.name}</span>
                        {file.status && file.status !== 'indexed' && (
                          <Badge variant="outline" className="text-xs">
                            {file.status}
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>
                )}
                {selectedFileIds.length > 0 && (
                  <p className="mt-2 text-xs text-blue-400">
                    {selectedFileIds.length} file{selectedFileIds.length !== 1 ? 's' : ''} linked
                  </p>
                )}
              </div>
            </TabsContent>

            {/* ── Tab: Advanced ──────────────────────────────────────── */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div>
                  <Label>Voicemail Detection</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Detect voicemail/answering machines and handle accordingly.</p>
                </div>
                <Switch
                  checked={formState.voicemailDetectionEnabled}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, voicemailDetectionEnabled: checked }))}
                />
              </div>

              {formState.voicemailDetectionEnabled && (
                <div className="grid gap-2 pl-4 border-l-2 border-emerald-800">
                  <Label>Detection Provider</Label>
                  <Select
                    value={formState.voicemailProvider}
                    onValueChange={(value) => setFormState(prev => ({ ...prev, voicemailProvider: value }))}
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-950 border-gray-700">
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="vapi">Trinity (Default)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div>
                  <Label>Background Denoising</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Remove background noise from the caller's audio.</p>
                </div>
                <Switch
                  checked={formState.backgroundDenoisingEnabled}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, backgroundDenoisingEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div>
                  <Label>Stereo Recording</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Record assistant and caller on separate audio channels.</p>
                </div>
                <Switch
                  checked={formState.stereoRecordingEnabled}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, stereoRecordingEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div>
                  <Label>Video Recording</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Enable video recording for web calls.</p>
                </div>
                <Switch
                  checked={formState.videoRecordingEnabled}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, videoRecordingEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div>
                  <Label>Transcript Saving</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Save the full transcript for each call.</p>
                </div>
                <Switch
                  checked={formState.transcriptSavingEnabled}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, transcriptSavingEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <div>
                    <Label>HIPAA Compliance</Label>
                    <p className="text-xs text-gray-500 mt-0.5">Enable HIPAA-compliant mode. Requires an Enterprise plan with HIPAA enabled.</p>
                  </div>
                </div>
                <Switch
                  checked={formState.hipaaEnabled}
                  onCheckedChange={(checked) => setFormState(prev => ({ ...prev, hipaaEnabled: checked }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="variableValues">Variable Values</Label>
                <Textarea
                  id="variableValues"
                  value={formState.variableValues}
                  onChange={(e) => setFormState(prev => ({ ...prev, variableValues: e.target.value }))}
                  placeholder={"companyName=Acme Corp\nagentName=Sarah\ntimezone=EST"}
                  className="border-gray-700 bg-gray-900 text-white min-h-[100px] font-mono text-xs"
                />
                <p className="text-xs text-gray-500">Key=value pairs (one per line). These can be referenced in the system prompt as {"{{variableName}}"}.</p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
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

      {/* ── Web Call Test Widget ──────────────────────────────────────────── */}
      {testCallAssistant && (
        <WebCallWidget
          assistantId={testCallAssistant.id}
          assistantName={testCallAssistant.name}
          onClose={() => setTestCallAssistant(null)}
        />
      )}
    </div>
  );
}
