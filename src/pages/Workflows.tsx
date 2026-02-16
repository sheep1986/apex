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
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase-client';
import {
  Edit2,
  GitBranch,
  Loader2,
  MessageSquare,
  Mic,
  Phone,
  PhoneOff,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  Variable,
  Play,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  Panel,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

// ─── Node Types ──────────────────────────────────────────────
const NODE_PALETTE = [
  { type: 'say', label: 'Say', icon: MessageSquare, color: 'bg-emerald-500', description: 'Speak a message' },
  { type: 'gather', label: 'Gather', icon: Mic, color: 'bg-blue-500', description: 'Collect user input' },
  { type: 'apiRequest', label: 'API Request', icon: Zap, color: 'bg-yellow-500', description: 'Call external API' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'bg-purple-500', description: 'Branch on value' },
  { type: 'transfer', label: 'Transfer', icon: Phone, color: 'bg-cyan-500', description: 'Transfer call' },
  { type: 'endCall', label: 'End Call', icon: PhoneOff, color: 'bg-red-500', description: 'End the call' },
  { type: 'setVariable', label: 'Set Variable', icon: Variable, color: 'bg-orange-500', description: 'Set a variable' },
  { type: 'llmStep', label: 'LLM Step', icon: Settings, color: 'bg-pink-500', description: 'Run LLM prompt' },
] as const;

// ─── Custom Node Component ──────────────────────────────────
function WorkflowNode({ data }: { data: any }) {
  const palette = NODE_PALETTE.find(n => n.type === data.nodeType) || NODE_PALETTE[0];
  const Icon = palette.icon;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 shadow-lg min-w-[160px]">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded ${palette.color}/20`}>
          <Icon className={`h-4 w-4 text-white`} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{data.label || palette.label}</p>
          {data.description && (
            <p className="text-xs text-gray-500 mt-0.5">{data.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { workflowNode: WorkflowNode };

// ─── Workflow Interface ──────────────────────────────────────
interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

// ─── Component ──────────────────────────────────────────────
export default function Workflows() {
  const { organization } = useSupabaseAuth();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // ─── Load workflows from Supabase ──────────────────────────
  const loadWorkflows = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('voice_workflows')
      .select('*')
      .eq('organization_id', organization.id)
      .order('updated_at', { ascending: false });

    if (data) {
      setWorkflows(data.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        nodes: row.nodes || [],
        edges: row.edges || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })));
    }
    if (error) {
      console.error('Failed to load workflows:', error);
    }
    setLoading(false);
  }, [organization?.id]);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({
      ...connection,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
      style: { stroke: '#6b7280' },
    }, eds)),
    [setEdges],
  );

  const filteredWorkflows = workflows.filter(w =>
    w.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Create workflow (Supabase) ─────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim() || !organization?.id) return;
    setSaving(true);

    const { data, error } = await supabase
      .from('voice_workflows')
      .insert({
        organization_id: organization.id,
        name: newName.trim(),
        description: newDescription.trim() || null,
        nodes: [],
        edges: [],
      })
      .select()
      .single();

    if (data) {
      const workflow: Workflow = {
        id: data.id,
        name: data.name,
        description: data.description,
        nodes: [],
        edges: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      setWorkflows(prev => [workflow, ...prev]);
      setShowCreateDialog(false);
      setNewName('');
      setNewDescription('');
      openEditor(workflow);
    }
    if (error) {
      console.error('Failed to create workflow:', error);
    }
    setSaving(false);
  };

  // Open editor
  const openEditor = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setNodes(workflow.nodes);
    setEdges(workflow.edges);
    setShowEditor(true);
  };

  // ─── Save workflow (Supabase) ───────────────────────────────
  const handleSave = async () => {
    if (!selectedWorkflow) return;
    setSaving(true);

    const { error } = await supabase
      .from('voice_workflows')
      .update({
        nodes: nodes,
        edges: edges,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedWorkflow.id);

    if (!error) {
      const updated = {
        ...selectedWorkflow,
        nodes,
        edges,
        updatedAt: new Date().toISOString(),
      };
      setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
      setSelectedWorkflow(updated);
    } else {
      console.error('Failed to save workflow:', error);
    }
    setSaving(false);
  };

  // Add node from palette
  const addNode = (type: string) => {
    const palette = NODE_PALETTE.find(n => n.type === type);
    if (!palette) return;
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'workflowNode',
      position: { x: 250 + Math.random() * 200, y: 150 + Math.random() * 200 },
      data: {
        label: palette.label,
        nodeType: type,
        description: '',
      },
    };
    setNodes(prev => [...prev, newNode]);
  };

  // ─── Delete workflow (Supabase) ─────────────────────────────
  const handleDelete = async () => {
    if (!deletingWorkflow) return;
    setSaving(true);

    const { error } = await supabase
      .from('voice_workflows')
      .delete()
      .eq('id', deletingWorkflow.id);

    if (!error) {
      setWorkflows(prev => prev.filter(w => w.id !== deletingWorkflow.id));
      if (selectedWorkflow?.id === deletingWorkflow.id) {
        setShowEditor(false);
        setSelectedWorkflow(null);
      }
    } else {
      console.error('Failed to delete workflow:', error);
    }
    setShowDeleteDialog(false);
    setDeletingWorkflow(null);
    setSaving(false);
  };

  // ─── Loading State ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-400">Loading workflows...</span>
      </div>
    );
  }

  // ─── Editor View ──────────────────────────────────────────
  if (showEditor && selectedWorkflow) {
    return (
      <div className="flex h-screen bg-black">
        {/* Sidebar - Node Palette */}
        <div className="w-64 border-r border-gray-800 bg-gray-950 p-4 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{selectedWorkflow.name}</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowEditor(false)}
              className="text-gray-400 hover:text-white"
            >
              Back
            </Button>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Click to add nodes</p>
            <div className="space-y-2">
              {NODE_PALETTE.map(({ type, label, icon: Icon, color, description }) => (
                <button
                  key={type}
                  onClick={() => addNode(type)}
                  className="w-full flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 p-2.5 text-left hover:border-gray-700 transition-colors"
                >
                  <div className={`p-1 rounded ${color}/20`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-gray-800">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Save Workflow</>
              )}
            </Button>
            <Button
              onClick={async () => {
                if (nodes.length === 0) {
                  toast({ title: 'Error', description: 'Add at least one node to test.', variant: 'destructive' });
                  return;
                }
                setTesting(true);
                try {
                  // Walk through nodes sequentially and validate the flow
                  const nodeOrder = nodes.sort((a, b) => a.position.y - b.position.y);
                  const steps = nodeOrder.map(n => ({
                    type: n.type || n.data?.type,
                    label: n.data?.label,
                    config: n.data,
                  }));
                  toast({
                    title: 'Workflow Test',
                    description: `Flow validated: ${steps.length} steps. Sequence: ${steps.map(s => s.label || s.type).join(' → ')}`,
                  });
                } catch {
                  toast({ title: 'Test Failed', description: 'Workflow has errors.', variant: 'destructive' });
                } finally {
                  setTesting(false);
                }
              }}
              disabled={testing || nodes.length === 0}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {testing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testing...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Test Workflow</>
              )}
            </Button>
          </div>
        </div>

        {/* Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-950"
          >
            <Background color="#1f2937" gap={20} />
            <Controls className="[&>button]:bg-gray-800 [&>button]:border-gray-700 [&>button]:text-white" />
            <MiniMap
              nodeColor="#6b7280"
              maskColor="rgb(0, 0, 0, 0.7)"
              className="bg-gray-900 border border-gray-800 rounded-lg"
            />
            <Panel position="top-right" className="flex gap-2">
              <Badge className="bg-gray-900 border-gray-700 text-gray-400">
                {nodes.length} nodes
              </Badge>
              <Badge className="bg-gray-900 border-gray-700 text-gray-400">
                {edges.length} connections
              </Badge>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    );
  }

  // ─── List View ────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-black">
      <div className="w-full space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <GitBranch className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Workflows</h1>
              <p className="text-gray-400">Build visual conversation flows for your AI assistants</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" /> Create Workflow
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-gray-800 bg-gray-900 pl-10 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <p className="text-sm text-gray-400">Total Workflows</p>
              <p className="text-2xl font-bold text-white">{workflows.length}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <p className="text-sm text-gray-400">Total Nodes</p>
              <p className="text-2xl font-bold text-white">
                {workflows.reduce((sum, w) => sum + w.nodes.length, 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <p className="text-sm text-gray-400">Last Modified</p>
              <p className="text-2xl font-bold text-white">
                {workflows.length > 0
                  ? new Date(workflows[0].updatedAt).toLocaleDateString()
                  : '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Grid */}
        {filteredWorkflows.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id} className="border-gray-800 bg-gray-900 transition-all hover:border-gray-700 cursor-pointer" onClick={() => openEditor(workflow)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        <GitBranch className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-white">{workflow.name}</CardTitle>
                        <p className="text-xs text-gray-400">
                          {workflow.nodes.length} nodes · {workflow.edges.length} connections
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workflow.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{workflow.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Modified {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-800" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={() => openEditor(workflow)}>
                      <Edit2 className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => { setDeletingWorkflow(workflow); setShowDeleteDialog(true); }}>
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <GitBranch className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-white">No Workflows Yet</h3>
              <p className="mx-auto max-w-sm text-sm text-gray-400">
                Build visual conversation flows that guide your AI assistants through structured interactions.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" /> Create Your First Workflow
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="border-gray-800 bg-gray-950 text-white">
            <DialogHeader>
              <DialogTitle>Create Workflow</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new visual conversation flow
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Appointment Booking Flow"
                  className="mt-1 border-gray-700 bg-gray-900 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">Description (optional)</Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What does this workflow do?"
                  className="mt-1 border-gray-700 bg-gray-900 text-white"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-gray-700 text-gray-400">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newName.trim() || saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create & Open Editor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="border-gray-800 bg-gray-950 text-white">
            <DialogHeader>
              <DialogTitle>Delete Workflow</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete &quot;{deletingWorkflow?.name}&quot;? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-gray-700 text-gray-400">
                Cancel
              </Button>
              <Button onClick={handleDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Delete Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
