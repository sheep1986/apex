import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase-client';
import { triggerWebhook } from '@/services/webhook-trigger';
import {
  DollarSign,
  GripVertical,
  Loader2,
  Plus,
  Target,
  TrendingUp,
  Trophy,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Deal {
  id: string;
  title: string;
  value: number | null;
  stage: string;
  lead_id: string | null;
  assigned_to_user_id: string | null;
  created_at: string;
  contact_name?: string;
  contact_phone?: string;
  assignee_name?: string;
  source_campaign_id?: string | null;
  source_call_id?: string | null;
  source_campaign_name?: string;
}

const STAGES = [
  { id: 'pipeline', label: 'Pipeline', color: 'border-blue-500', bg: 'bg-blue-500/10', icon: Target },
  { id: 'proposal', label: 'Proposal', color: 'border-yellow-500', bg: 'bg-yellow-500/10', icon: TrendingUp },
  { id: 'negotiation', label: 'Negotiation', color: 'border-purple-500', bg: 'bg-purple-500/10', icon: DollarSign },
  { id: 'closed_won', label: 'Won', color: 'border-emerald-500', bg: 'bg-emerald-500/10', icon: Trophy },
  { id: 'closed_lost', label: 'Lost', color: 'border-red-500', bg: 'bg-red-500/10', icon: XCircle },
];

export default function SalesPipeline() {
  const { organization } = useSupabaseAuth();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDeal, setNewDeal] = useState({ title: '', value: '', stage: 'pipeline' });
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_deals')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to load deals.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [organization?.id, toast]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const createDeal = async () => {
    if (!newDeal.title.trim() || !organization?.id) return;
    setCreating(true);
    try {
      // Auto-attribution: Try to find the most recent campaign that contacted leads
      // matching the deal title (heuristic: search campaign_items for recent activity)
      let sourceCampaignId: string | null = null;
      let sourceCallId: string | null = null;

      try {
        // Look for recent campaign items with calls for this org
        const { data: recentCampaignItem } = await supabase
          .from('campaign_items')
          .select('campaign_id, voice_call_id, campaigns(id, name)')
          .eq('organization_id', organization.id)
          .not('voice_call_id', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (recentCampaignItem) {
          sourceCampaignId = recentCampaignItem.campaign_id;
          sourceCallId = recentCampaignItem.voice_call_id;
        }
      } catch {
        // Attribution is best-effort — don't block deal creation
      }

      const { error } = await supabase.from('crm_deals').insert({
        organization_id: organization.id,
        title: newDeal.title.trim(),
        value: newDeal.value ? parseFloat(newDeal.value) : null,
        stage: newDeal.stage,
        source_campaign_id: sourceCampaignId,
        source_call_id: sourceCallId,
        attributed_at: sourceCampaignId ? new Date().toISOString() : null,
      });
      if (error) throw error;

      const attribution = sourceCampaignId ? ' (attributed to campaign)' : '';
      toast({ title: 'Deal Created', description: `"${newDeal.title}" added to pipeline.${attribution}` });
      setNewDeal({ title: '', value: '', stage: 'pipeline' });
      setShowCreate(false);
      fetchDeals();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create deal.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const updateDealStage = async (dealId: string, newStage: string) => {
    try {
      const deal = deals.find(d => d.id === dealId);
      const { error } = await supabase
        .from('crm_deals')
        .update({ stage: newStage })
        .eq('id', dealId);
      if (error) throw error;
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));

      // Dispatch webhook events for stage changes
      if (organization?.id) {
        const eventType = (newStage === 'won') ? 'deal.closed_won'
          : (newStage === 'lost') ? 'deal.stage_changed'
          : 'deal.stage_changed';
        triggerWebhook(organization.id, eventType, {
          dealId,
          previousStage: deal?.stage || 'unknown',
          newStage,
          title: deal?.title,
          value: deal?.value,
        });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update deal stage.', variant: 'destructive' });
    }
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
    setDraggingId(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (dealId) {
      updateDealStage(dealId, stage);
    }
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const dealsByStage = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    STAGES.forEach(s => { map[s.id] = []; });
    deals.forEach(d => {
      if (map[d.stage]) {
        map[d.stage].push(d);
      } else {
        map['pipeline'].push(d);
      }
    });
    return map;
  }, [deals]);

  const totalPipelineValue = useMemo(() => {
    return deals
      .filter(d => d.stage !== 'closed_lost')
      .reduce((sum, d) => sum + (d.value || 0), 0);
  }, [deals]);

  const wonValue = useMemo(() => {
    return deals
      .filter(d => d.stage === 'closed_won')
      .reduce((sum, d) => sum + (d.value || 0), 0);
  }, [deals]);

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
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Sales Pipeline</h1>
              <p className="text-gray-400">{deals.length} deals &middot; Drag to move between stages</p>
            </div>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Pipeline</p>
                <p className="text-xl font-bold text-white">${totalPipelineValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </CardContent>
          </Card>
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Won Revenue</p>
                <p className="text-xl font-bold text-emerald-400">${wonValue.toLocaleString()}</p>
              </div>
              <Trophy className="h-8 w-8 text-emerald-500" />
            </CardContent>
          </Card>
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Deals</p>
                <p className="text-xl font-bold text-white">
                  {deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const StageIcon = stage.icon;
            const stageDeals = dealsByStage[stage.id] || [];
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

            return (
              <div
                key={stage.id}
                className={`flex-shrink-0 w-72 rounded-lg border ${stage.color} ${stage.bg} ${
                  draggingId ? 'border-dashed' : ''
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Stage Header */}
                <div className="p-3 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StageIcon className="h-4 w-4 text-gray-300" />
                      <span className="text-sm font-semibold text-white">{stage.label}</span>
                      <Badge variant="outline" className="text-[10px] text-gray-400">
                        {stageDeals.length}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      ${stageTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Deal Cards */}
                <div className="p-2 space-y-2 min-h-[200px]">
                  {stageDeals.length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-8">No deals</p>
                  )}
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onDragEnd={handleDragEnd}
                      className={`rounded-lg border border-gray-800 bg-gray-900 p-3 cursor-grab active:cursor-grabbing transition-all ${
                        draggingId === deal.id ? 'opacity-50 scale-95' : 'hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{deal.title}</p>
                          {deal.value != null && (
                            <p className="text-xs text-emerald-400 font-mono mt-1">
                              ${deal.value.toLocaleString()}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-500 mt-1">
                            {new Date(deal.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <GripVertical className="h-4 w-4 text-gray-600 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Deal Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">New Deal</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white">Deal Title</Label>
                <Input
                  value={newDeal.title}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  className="mt-1 border-gray-700 bg-gray-800 text-white"
                  placeholder="Premium Plan Upgrade"
                />
              </div>
              <div>
                <Label className="text-white">Value ($)</Label>
                <Input
                  type="number"
                  value={newDeal.value}
                  onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                  className="mt-1 border-gray-700 bg-gray-800 text-white"
                  placeholder="5000"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label className="text-white">Stage</Label>
                <Select
                  value={newDeal.stage}
                  onValueChange={(v) => setNewDeal({ ...newDeal, stage: v })}
                >
                  <SelectTrigger className="mt-1 border-gray-700 bg-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {STAGES.filter(s => s.id !== 'closed_lost').map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-gray-700">
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={createDeal}
                disabled={creating || !newDeal.title.trim()}
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {creating ? 'Creating...' : 'Create Deal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
