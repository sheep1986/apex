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
import { useUserContext } from '@/services/MinimalUserProvider';
import { voiceService, type VoiceAssistant, type VoiceSquad, type VoiceSquadMember } from '@/services/voice-service';
import {
  AlertCircle,
  ArrowRight,
  Copy,
  Edit2,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// ─── Component ──────────────────────────────────────────────────────

export default function Squads() {
  const { userContext } = useUserContext();
  const [squads, setSquads] = useState<VoiceSquad[]>([]);
  const [assistants, setAssistants] = useState<VoiceAssistant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSquad, setEditingSquad] = useState<VoiceSquad | null>(null);
  const [deletingSquad, setDeletingSquad] = useState<VoiceSquad | null>(null);
  const [squadName, setSquadName] = useState('');
  const [members, setMembers] = useState<Array<{ assistantId: string; transferTo: string[] }>>([]);
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

  // ─── Fetch data ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!voiceReady) return;
    setLoading(true);
    setError(null);
    try {
      const [squadsData, assistantsData] = await Promise.all([
        voiceService.getSquads(),
        voiceService.getAssistants(),
      ]);
      setSquads(squadsData || []);
      setAssistants(assistantsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [voiceReady]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Helpers ──────────────────────────────────────────────────────
  const getAssistantName = (id: string) => {
    return assistants.find(a => a.id === id)?.name || id.slice(0, 12) + '...';
  };

  const addMember = () => {
    setMembers(prev => [...prev, { assistantId: '', transferTo: [] }]);
  };

  const removeMember = (index: number) => {
    setMembers(prev => prev.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: 'assistantId', value: string) => {
    setMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  // ─── Create / Update ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!squadName.trim() || members.length < 2) return;
    setIsSaving(true);
    setError(null);

    try {
      const squadMembers: VoiceSquadMember[] = members
        .filter(m => m.assistantId)
        .map((m, _idx, arr) => ({
          assistantId: m.assistantId,
          assistantDestinations: arr
            .filter(other => other.assistantId !== m.assistantId && other.assistantId)
            .map(other => ({
              type: 'assistant' as const,
              assistantName: getAssistantName(other.assistantId),
              message: `Transferring you now...`,
              description: `Transfer to ${getAssistantName(other.assistantId)}`,
            })),
        }));

      if (editingSquad) {
        await voiceService.updateSquad(editingSquad.id, {
          name: squadName.trim(),
          members: squadMembers,
        });
      } else {
        await voiceService.createSquad({
          name: squadName.trim(),
          members: squadMembers,
        });
      }

      setShowCreateDialog(false);
      setEditingSquad(null);
      setSquadName('');
      setMembers([]);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save squad');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingSquad) return;
    setIsSaving(true);
    try {
      await voiceService.deleteSquad(deletingSquad.id);
      setShowDeleteDialog(false);
      setDeletingSquad(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete squad');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Edit Dialog ──────────────────────────────────────────────────
  const openEdit = (squad: VoiceSquad) => {
    setEditingSquad(squad);
    setSquadName(squad.name);
    setMembers(
      squad.members.map(m => ({
        assistantId: m.assistantId || '',
        transferTo: m.assistantDestinations?.map(d => d.assistantName || '') || [],
      }))
    );
    setShowCreateDialog(true);
  };

  const openCreate = () => {
    setEditingSquad(null);
    setSquadName('');
    setMembers([{ assistantId: '', transferTo: [] }, { assistantId: '', transferTo: [] }]);
    setShowCreateDialog(true);
  };

  // ─── Filter ───────────────────────────────────────────────────────
  const filteredSquads = squads.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Loading ──────────────────────────────────────────────────────
  if (!voiceReady || loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-gray-400">
          {!voiceReady ? 'Connecting to voice service...' : 'Loading squads...'}
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
            <h1 className="text-2xl font-bold text-white">Squads</h1>
            <p className="text-gray-400">
              Create multi-agent teams that can transfer callers between specialists
            </p>
          </div>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" /> Create Squad
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
            placeholder="Search squads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-gray-800 bg-gray-900 pl-10 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <p className="text-sm text-gray-400">Total Squads</p>
              <p className="text-2xl font-bold text-white">{squads.length}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <p className="text-sm text-gray-400">Total Members</p>
              <p className="text-2xl font-bold text-white">
                {squads.reduce((sum, s) => sum + (s.members?.length || 0), 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <p className="text-sm text-gray-400">Available Assistants</p>
              <p className="text-2xl font-bold text-white">{assistants.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Squad Grid */}
        {filteredSquads.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredSquads.map((squad) => (
              <Card key={squad.id} className="border-gray-800 bg-gray-900 transition-all hover:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        <Users className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-white">{squad.name}</CardTitle>
                        <p className="text-xs text-gray-400">
                          {squad.members?.length || 0} members
                        </p>
                      </div>
                    </div>
                    <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Member chain */}
                  <div className="flex flex-wrap items-center gap-2">
                    {squad.members?.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <Badge variant="outline" className="border-gray-700 text-gray-300">
                          {member.assistantId ? getAssistantName(member.assistantId) : 'Inline'}
                        </Badge>
                        {idx < (squad.members?.length || 0) - 1 && (
                          <ArrowRight className="h-3 w-3 text-gray-600" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={() => openEdit(squad)}>
                      <Edit2 className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => { setDeletingSquad(squad); setShowDeleteDialog(true); }}>
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
                <Users className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-white">No Squads Yet</h3>
              <p className="mx-auto max-w-sm text-sm text-gray-400">
                Squads let you create multi-agent teams. For example, a receptionist can transfer callers to
                billing support or technical support based on the conversation.
              </p>
              <Button onClick={openCreate} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" /> Create Your First Squad
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl border-gray-800 bg-gray-950 text-white">
            <DialogHeader>
              <DialogTitle>{editingSquad ? 'Edit Squad' : 'Create Squad'}</DialogTitle>
              <DialogDescription className="text-gray-400">
                Build a multi-agent team. Each member can transfer callers to other members.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <Label className="text-gray-400">Squad Name</Label>
                <Input
                  value={squadName}
                  onChange={(e) => setSquadName(e.target.value)}
                  placeholder="e.g. Customer Support Team"
                  className="mt-1 border-gray-700 bg-gray-900 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-400">Members (min 2)</Label>
                <div className="mt-2 space-y-3">
                  {members.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Badge className="w-6 h-6 flex items-center justify-center border-gray-700 bg-gray-800 text-gray-400 text-xs">
                        {idx + 1}
                      </Badge>
                      <select
                        value={member.assistantId}
                        onChange={(e) => updateMember(idx, 'assistantId', e.target.value)}
                        className="flex-1 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                      >
                        <option value="">Select an assistant...</option>
                        {assistants.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                      {members.length > 2 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-500 hover:text-red-400"
                          onClick={() => removeMember(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-gray-700 text-gray-400"
                  onClick={addMember}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Member
                </Button>
              </div>

              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                <p className="text-sm font-medium text-gray-300 mb-2">How Squads Work</p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• The first member starts the conversation</li>
                  <li>• Each member can transfer to any other member</li>
                  <li>• Transfer messages are spoken during handoff</li>
                  <li>• Assign squads to phone numbers instead of single assistants</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-gray-700 text-gray-400">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !squadName.trim() || members.filter(m => m.assistantId).length < 2}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSquad ? 'Update Squad' : 'Create Squad'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="border-gray-800 bg-gray-950 text-white">
            <DialogHeader>
              <DialogTitle>Delete Squad</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete &quot;{deletingSquad?.name}&quot;?
                Phone numbers assigned to this squad will need to be reconfigured.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-gray-700 text-gray-400">
                Cancel
              </Button>
              <Button onClick={handleDelete} disabled={isSaving} className="bg-red-600 hover:bg-red-700">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Squad
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export { Squads };
