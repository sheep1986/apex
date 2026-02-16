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
import { Textarea } from '@/components/ui/textarea';
import { useUserContext } from '@/services/MinimalUserProvider';
import { voiceService, type VoiceTool } from '@/services/voice-service';
import {
  AlertCircle,
  Code2,
  Copy,
  Edit2,
  Loader2,
  PhoneForwarded,
  PhoneOff,
  Plus,
  Search,
  Server,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// ─── Constants ──────────────────────────────────────────────────────

const TOOL_TYPES = [
  { value: 'function', label: 'Function', icon: Code2, description: 'Custom function with JSON parameters — executed via your server' },
  { value: 'endCall', label: 'End Call', icon: PhoneOff, description: 'Programmatically end the call' },
  { value: 'transferCall', label: 'Transfer Call', icon: PhoneForwarded, description: 'Transfer the call to another number or assistant' },
  { value: 'dtmf', label: 'DTMF', icon: Zap, description: 'Send DTMF tones during a call' },
  { value: 'output', label: 'Output', icon: Server, description: 'Return structured data from the conversation' },
  { value: 'ghl', label: 'GoHighLevel', icon: Wrench, description: 'Integration with GoHighLevel CRM' },
  { value: 'make', label: 'Make.com', icon: Wrench, description: 'Integration with Make.com workflows' },
] as const;

type ToolType = typeof TOOL_TYPES[number]['value'];

interface ToolFormState {
  type: ToolType;
  name: string;
  description: string;
  parameters: string; // JSON string
  serverUrl: string;
  serverSecret: string;
  asyncExecution: boolean;
  requestStartMessage: string;
  requestCompleteMessage: string;
  requestFailedMessage: string;
  requestDelayedMessage: string;
}

const defaultForm: ToolFormState = {
  type: 'function',
  name: '',
  description: '',
  parameters: '{\n  "type": "object",\n  "properties": {},\n  "required": []\n}',
  serverUrl: '',
  serverSecret: '',
  asyncExecution: false,
  requestStartMessage: '',
  requestCompleteMessage: '',
  requestFailedMessage: '',
  requestDelayedMessage: '',
};

// ─── Component ──────────────────────────────────────────────────────

export default function Tools() {
  const { userContext } = useUserContext();
  const [tools, setTools] = useState<VoiceTool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingTool, setEditingTool] = useState<VoiceTool | null>(null);
  const [deletingTool, setDeletingTool] = useState<VoiceTool | null>(null);
  const [formState, setFormState] = useState<ToolFormState>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Voice service readiness ─────────────────────────────────────
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

  // ─── Fetch tools ─────────────────────────────────────────────────
  const fetchTools = useCallback(async () => {
    if (!voiceReady) return;
    setLoading(true);
    setError(null);
    try {
      const data = await voiceService.getTools();
      setTools(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tools');
    } finally {
      setLoading(false);
    }
  }, [voiceReady]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  // ─── Create / Update ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!formState.name.trim() && formState.type === 'function') return;
    setIsSaving(true);
    setError(null);

    try {
      let parsedParams;
      try {
        parsedParams = JSON.parse(formState.parameters);
      } catch {
        parsedParams = { type: 'object', properties: {}, required: [] };
      }

      const payload: any = {
        type: formState.type,
      };

      if (formState.type === 'function') {
        payload.function = {
          name: formState.name.trim(),
          description: formState.description.trim() || undefined,
          parameters: parsedParams,
        };
      }

      if (formState.serverUrl) {
        payload.server = {
          url: formState.serverUrl,
          ...(formState.serverSecret ? { secret: formState.serverSecret } : {}),
        };
      }

      const messages: any[] = [];
      if (formState.requestStartMessage) messages.push({ type: 'request-start', content: formState.requestStartMessage });
      if (formState.requestCompleteMessage) messages.push({ type: 'request-complete', content: formState.requestCompleteMessage });
      if (formState.requestFailedMessage) messages.push({ type: 'request-failed', content: formState.requestFailedMessage });
      if (formState.requestDelayedMessage) messages.push({ type: 'request-response-delayed', content: formState.requestDelayedMessage });
      if (messages.length > 0) payload.messages = messages;

      if (formState.asyncExecution) {
        payload.async = true;
      }

      if (editingTool) {
        await voiceService.updateTool(editingTool.id, payload);
      } else {
        await voiceService.createTool(payload);
      }

      setShowCreateDialog(false);
      setEditingTool(null);
      setFormState(defaultForm);
      await fetchTools();
    } catch (err: any) {
      setError(err.message || 'Failed to save tool');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingTool) return;
    setIsSaving(true);
    try {
      await voiceService.deleteTool(deletingTool.id);
      setShowDeleteDialog(false);
      setDeletingTool(null);
      await fetchTools();
    } catch (err: any) {
      setError(err.message || 'Failed to delete tool');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Clone ────────────────────────────────────────────────────────
  const handleClone = async (tool: VoiceTool) => {
    try {
      setLoading(true);
      const payload: any = { type: tool.type };
      if (tool.function) {
        payload.function = { ...tool.function, name: `${tool.function.name}_copy` };
      }
      if (tool.server) payload.server = tool.server;
      if (tool.messages) payload.messages = tool.messages;
      await voiceService.createTool(payload);
      await fetchTools();
    } catch (err: any) {
      setError(err.message || 'Failed to clone tool');
    } finally {
      setLoading(false);
    }
  };

  // ─── Edit Dialog ──────────────────────────────────────────────────
  const openEdit = (tool: VoiceTool) => {
    setEditingTool(tool);
    setFormState({
      type: tool.type as ToolType,
      name: tool.function?.name || '',
      description: tool.function?.description || '',
      parameters: tool.function?.parameters ? JSON.stringify(tool.function.parameters, null, 2) : defaultForm.parameters,
      serverUrl: tool.server?.url || '',
      serverSecret: tool.server?.secret || '',
      asyncExecution: tool.async || false,
      requestStartMessage: tool.messages?.find(m => m.type === 'request-start')?.content || '',
      requestCompleteMessage: tool.messages?.find(m => m.type === 'request-complete')?.content || '',
      requestFailedMessage: tool.messages?.find(m => m.type === 'request-failed')?.content || '',
      requestDelayedMessage: tool.messages?.find(m => m.type === 'request-response-delayed')?.content || '',
    });
    setShowCreateDialog(true);
  };

  // ─── Filter ───────────────────────────────────────────────────────
  const filteredTools = tools.filter((t) => {
    const name = t.function?.name || t.type || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getToolTypeInfo = (type: string) => {
    return TOOL_TYPES.find(t => t.value === type) || TOOL_TYPES[0];
  };

  // ─── Loading state ────────────────────────────────────────────────
  if (!voiceReady || loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-gray-400">
          {!voiceReady ? 'Connecting to voice service...' : 'Loading tools...'}
        </p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-black">
      <div className="w-full space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Tools</h1>
            <p className="text-gray-400">Create and manage tools your AI assistants can use during calls</p>
          </div>
          <Button
            onClick={() => { setEditingTool(null); setFormState(defaultForm); setShowCreateDialog(true); }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Tool
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-gray-800 bg-gray-900 pl-10 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <p className="text-sm text-gray-400">Total Tools</p>
              <p className="text-2xl font-bold text-white">{tools.length}</p>
            </CardContent>
          </Card>
          {['function', 'endCall', 'transferCall'].map(type => {
            const info = getToolTypeInfo(type);
            const count = tools.filter(t => t.type === type).length;
            return (
              <Card key={type} className="border-gray-800 bg-gray-900">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-400">{info.label}</p>
                  <p className="text-2xl font-bold text-white">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tool Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTools.map((tool) => {
              const typeInfo = getToolTypeInfo(tool.type);
              const TypeIcon = typeInfo.icon;
              return (
                <Card key={tool.id} className="border-gray-800 bg-gray-900 transition-all hover:border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                          <TypeIcon className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-white">
                            {tool.function?.name || tool.type}
                          </CardTitle>
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {tool.function?.description || typeInfo.description}
                          </p>
                        </div>
                      </div>
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        {typeInfo.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tool.server?.url && (
                      <div className="flex items-center gap-2 text-sm">
                        <Server className="h-3 w-3 text-gray-500" />
                        <span className="truncate text-gray-400">{tool.server.url}</span>
                      </div>
                    )}
                    {tool.function?.parameters?.properties && (
                      <div className="text-xs text-gray-500">
                        {Object.keys(tool.function.parameters.properties).length} parameters
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={() => openEdit(tool)}>
                        <Edit2 className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={() => handleClone(tool)}>
                        <Copy className="h-3 w-3 mr-1" /> Clone
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => { setDeletingTool(tool); setShowDeleteDialog(true); }}>
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <Wrench className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-white">No Tools Yet</h3>
              <p className="mx-auto max-w-sm text-sm text-gray-400">
                Tools let your AI assistants perform actions during calls — look up orders, check availability, transfer calls, and more.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" /> Create Your First Tool
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl border-gray-800 bg-gray-950 text-white">
            <DialogHeader>
              <DialogTitle>{editingTool ? 'Edit Tool' : 'Create Tool'}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingTool ? 'Update your tool configuration' : 'Define a new tool for your AI assistants'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Tool Type */}
              <div>
                <Label className="text-gray-400">Tool Type</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {TOOL_TYPES.map(({ value, label, icon: Icon, description }) => (
                    <button
                      key={value}
                      onClick={() => setFormState(s => ({ ...s, type: value }))}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        formState.type === value
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${formState.type === value ? 'text-emerald-400' : 'text-gray-500'}`} />
                      <div>
                        <p className="text-sm font-medium text-white">{label}</p>
                        <p className="text-xs text-gray-500">{description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {formState.type === 'function' && (
                <>
                  <div>
                    <Label className="text-gray-400">Function Name</Label>
                    <Input
                      value={formState.name}
                      onChange={(e) => setFormState(s => ({ ...s, name: e.target.value }))}
                      placeholder="e.g. lookupOrder"
                      className="mt-1 border-gray-700 bg-gray-900 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-400">Description</Label>
                    <Textarea
                      value={formState.description}
                      onChange={(e) => setFormState(s => ({ ...s, description: e.target.value }))}
                      placeholder="What does this tool do? The AI uses this to decide when to call it."
                      className="mt-1 border-gray-700 bg-gray-900 text-white"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="text-gray-400">Parameters (JSON Schema)</Label>
                    <Textarea
                      value={formState.parameters}
                      onChange={(e) => setFormState(s => ({ ...s, parameters: e.target.value }))}
                      className="mt-1 border-gray-700 bg-gray-900 font-mono text-sm text-white"
                      rows={6}
                    />
                  </div>
                </>
              )}

              {/* Server URL (for function tools) */}
              {formState.type === 'function' && (
                <div>
                  <Label className="text-gray-400">Server URL</Label>
                  <Input
                    value={formState.serverUrl}
                    onChange={(e) => setFormState(s => ({ ...s, serverUrl: e.target.value }))}
                    placeholder="https://your-server.com/tool-handler"
                    className="mt-1 border-gray-700 bg-gray-900 text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to use the assistant&apos;s default server URL
                  </p>
                </div>
              )}

              {/* Async execution toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-400">Async Execution</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Tool runs in background without blocking the conversation</p>
                </div>
                <button
                  onClick={() => setFormState(s => ({ ...s, asyncExecution: !s.asyncExecution }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formState.asyncExecution ? 'bg-emerald-600' : 'bg-gray-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formState.asyncExecution ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Tool Messages */}
              <div className="space-y-3">
                <Label className="text-gray-400">Spoken Messages</Label>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">While executing</p>
                    <Input
                      value={formState.requestStartMessage}
                      onChange={(e) => setFormState(s => ({ ...s, requestStartMessage: e.target.value }))}
                      placeholder='"Let me look that up for you..."'
                      className="border-gray-700 bg-gray-900 text-white text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">On success</p>
                    <Input
                      value={formState.requestCompleteMessage}
                      onChange={(e) => setFormState(s => ({ ...s, requestCompleteMessage: e.target.value }))}
                      placeholder='"I found that information..."'
                      className="border-gray-700 bg-gray-900 text-white text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">On failure</p>
                    <Input
                      value={formState.requestFailedMessage}
                      onChange={(e) => setFormState(s => ({ ...s, requestFailedMessage: e.target.value }))}
                      placeholder='"Sorry, I wasn&apos;t able to complete that..."'
                      className="border-gray-700 bg-gray-900 text-white text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">If delayed</p>
                    <Input
                      value={formState.requestDelayedMessage}
                      onChange={(e) => setFormState(s => ({ ...s, requestDelayedMessage: e.target.value }))}
                      placeholder='"Still working on that, one moment..."'
                      className="border-gray-700 bg-gray-900 text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-gray-700 text-gray-400">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingTool ? 'Update Tool' : 'Create Tool'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="border-gray-800 bg-gray-950 text-white">
            <DialogHeader>
              <DialogTitle>Delete Tool</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete &quot;{deletingTool?.function?.name || deletingTool?.type}&quot;?
                This action cannot be undone and may affect assistants using this tool.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-gray-700 text-gray-400">
                Cancel
              </Button>
              <Button onClick={handleDelete} disabled={isSaving} className="bg-red-600 hover:bg-red-700">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Tool
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export { Tools };
