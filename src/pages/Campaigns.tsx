
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/services/supabase-client';
import {
  AlertTriangle,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Megaphone,
  Pause,
  Phone,
  PhoneOff,
  Play,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface CampaignProgress {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  failed: number;
}

const getStatusBadge = (status: string, pausedReason?: string | null) => {
  switch (status) {
    case 'running':
      return <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Running</Badge>;
    case 'completed':
      return <Badge className="border-gray-500/30 bg-gray-500/10 text-gray-400">Completed</Badge>;
    case 'paused':
      return (
        <div className="flex items-center gap-1.5">
          <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-400">Paused</Badge>
          {pausedReason === 'insufficient_credits' && (
            <span className="text-xs text-amber-400/70">Insufficient Credits</span>
          )}
        </div>
      );
    case 'scheduled':
      return <Badge className="border-purple-500/30 bg-purple-500/10 text-purple-400">Scheduled</Badge>;
    case 'draft':
      return <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-400 border">Draft</Badge>;
    case 'failed':
      return <Badge className="border-red-500/30 bg-red-500/10 text-red-400">Failed</Badge>;
    default:
      return <Badge variant="outline" className="text-gray-400">{status}</Badge>;
  }
};

export const Campaigns = () => {
    const { organization } = useSupabaseAuth();
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [progressMap, setProgressMap] = useState<Record<string, CampaignProgress>>({});
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (organization?.id) {
            loadCampaigns();
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [organization]);

    // Auto-refresh running campaigns every 15 seconds
    useEffect(() => {
        const hasRunning = campaigns.some(c => c.status === 'running');
        if (hasRunning) {
            pollRef.current = setInterval(() => {
                loadCampaigns();
            }, 15000);
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [campaigns]);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('organization_id', organization?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const campList = data || [];
            setCampaigns(campList);

            // Fetch progress for all campaigns with leads
            const campIds = campList.filter(c => (c.total_leads || 0) > 0).map(c => c.id);
            if (campIds.length > 0) {
                await loadProgress(campIds);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadProgress = async (campaignIds: string[]) => {
        try {
            // Fetch all campaign_items for these campaigns with status counts
            const { data: items } = await supabase
                .from('campaign_items')
                .select('campaign_id, status')
                .in('campaign_id', campaignIds);

            if (!items) return;

            const progress: Record<string, CampaignProgress> = {};
            for (const item of items) {
                if (!progress[item.campaign_id]) {
                    progress[item.campaign_id] = { total: 0, pending: 0, in_progress: 0, completed: 0, failed: 0 };
                }
                const p = progress[item.campaign_id];
                p.total++;
                if (item.status === 'pending' || item.status === 'queued') p.pending++;
                else if (item.status === 'in_progress') p.in_progress++;
                else if (item.status === 'completed') p.completed++;
                else if (item.status === 'failed') p.failed++;
            }
            setProgressMap(progress);
        } catch (err) {
            console.error('Progress load error:', err);
        }
    };

    const handleActivateCampaign = async (campaignId: string) => {
        try {
            // Credit-gate: check if org has sufficient credits before activating
            if (organization?.id) {
                const { data: orgData } = await supabase
                    .from('organizations')
                    .select('credit_balance, included_credits, credits_used_this_period')
                    .eq('id', organization.id)
                    .single();

                if (orgData) {
                    const remainingIncluded = Math.max(0, (orgData.included_credits || 0) - (orgData.credits_used_this_period || 0));
                    const hasCredits = remainingIncluded > 0 || (orgData.credit_balance || 0) > 0;

                    if (!hasCredits) {
                        // Check if auto-recharge is enabled
                        const { data: arConfig } = await supabase
                            .from('auto_recharge_config')
                            .select('enabled')
                            .eq('organization_id', organization.id)
                            .maybeSingle();

                        if (!arConfig?.enabled) {
                            alert('Insufficient credits. Please top up or enable auto-recharge before launching a campaign.');
                            return;
                        }
                    }
                }
            }

            await supabase
                .from('campaigns')
                .update({ status: 'running', paused_reason: null, updated_at: new Date().toISOString() })
                .eq('id', campaignId);
            await loadCampaigns();
        } catch (err) {
            console.error(err);
        }
    };

    const handlePauseCampaign = async (campaignId: string) => {
        try {
            await supabase
                .from('campaigns')
                .update({ status: 'paused', paused_reason: 'manual', updated_at: new Date().toISOString() })
                .eq('id', campaignId);
            await loadCampaigns();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredCampaigns = campaigns.filter(c =>
        !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats
    const totalCampaigns = campaigns.length;
    const runningCampaigns = campaigns.filter(c => c.status === 'running').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    const totalLeads = campaigns.reduce((sum, c) => sum + (c.total_leads || c.lead_count || 0), 0);

    const getProgressPercent = (camp: any): number => {
        const p = progressMap[camp.id];
        if (!p || p.total === 0) {
            // Fallback to results_summary if available
            if (camp.results_summary?.total > 0) {
                return 100;
            }
            return 0;
        }
        return Math.round(((p.completed + p.failed) / p.total) * 100);
    };

    return (
        <div className="min-h-screen bg-black">
            <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                            <Megaphone className="h-8 w-8 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Campaigns</h1>
                            <p className="text-gray-400">Manage outbound voice broadcasts</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/campaigns/new">
                            <Button className="bg-emerald-600 hover:bg-emerald-700">
                                <Plus className="mr-2 h-4 w-4" /> New Campaign
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={loadCampaigns}
                            disabled={loading}
                            className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card className="border-gray-800 bg-gray-900">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">Total Campaigns</p>
                                    <p className="text-2xl font-bold text-white">{totalCampaigns}</p>
                                </div>
                                <Megaphone className="h-8 w-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-800 bg-gray-900">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">Running</p>
                                    <p className="text-2xl font-bold text-emerald-400">{runningCampaigns}</p>
                                </div>
                                <Phone className="h-8 w-8 text-emerald-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-800 bg-gray-900">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">Completed</p>
                                    <p className="text-2xl font-bold text-gray-300">{completedCampaigns}</p>
                                </div>
                                <BarChart2 className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-800 bg-gray-900">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">Total Leads</p>
                                    <p className="text-2xl font-bold text-white">{totalLeads.toLocaleString()}</p>
                                </div>
                                <Users className="h-8 w-8 text-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search campaigns..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-gray-700 bg-gray-900/50 pl-10 text-white placeholder-gray-500 focus:border-purple-500"
                    />
                </div>

                {/* Loading */}
                {loading && campaigns.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        <span className="ml-3 text-gray-400">Loading campaigns...</span>
                    </div>
                )}

                {/* Campaign List */}
                {(!loading || campaigns.length > 0) && (
                    <div className="grid gap-4">
                        {filteredCampaigns.map((camp) => {
                            const progress = progressMap[camp.id];
                            const progressPercent = getProgressPercent(camp);
                            const hasProgress = progress && progress.total > 0;
                            const isRunning = camp.status === 'running';
                            const isDraft = camp.status === 'draft';
                            const isPaused = camp.status === 'paused';
                            const isCompleted = camp.status === 'completed';
                            const summary = camp.results_summary;

                            return (
                            <Card key={camp.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4 items-start flex-1 min-w-0">
                                            <div className={`p-3 rounded-lg shrink-0 ${isRunning ? 'bg-emerald-900/30 text-emerald-400' : isCompleted ? 'bg-blue-900/30 text-blue-400' : 'bg-gray-800 text-gray-400'}`}>
                                                {isRunning ? (
                                                    <Phone className="h-6 w-6 animate-pulse" />
                                                ) : isCompleted ? (
                                                    <CheckCircle2 className="h-6 w-6" />
                                                ) : (
                                                    <BarChart2 className="h-6 w-6" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-lg text-white truncate">{camp.name}</h3>
                                                    {getStatusBadge(camp.status, camp.paused_reason)}
                                                    {isRunning && loading && (
                                                        <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                                                    <span className="capitalize">{camp.type?.replace('_', ' ') || 'Voice'}</span>
                                                    {(camp.total_leads || 0) > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {camp.total_leads} leads
                                                        </span>
                                                    )}
                                                    {camp.created_at && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(camp.created_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {camp.completed_at && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Completed {new Date(camp.completed_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Progress Section */}
                                                {(hasProgress || isCompleted) && (
                                                    <div className="mt-3 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Progress
                                                                value={progressPercent}
                                                                className="h-2 flex-1 bg-gray-800"
                                                            />
                                                            <span className="text-xs font-medium text-gray-400 w-10 text-right">
                                                                {progressPercent}%
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs">
                                                            {hasProgress && (
                                                                <>
                                                                    {progress.completed > 0 && (
                                                                        <span className="flex items-center gap-1 text-emerald-400">
                                                                            <CheckCircle2 className="h-3 w-3" />
                                                                            {progress.completed} completed
                                                                        </span>
                                                                    )}
                                                                    {progress.in_progress > 0 && (
                                                                        <span className="flex items-center gap-1 text-blue-400">
                                                                            <Phone className="h-3 w-3" />
                                                                            {progress.in_progress} active
                                                                        </span>
                                                                    )}
                                                                    {progress.pending > 0 && (
                                                                        <span className="flex items-center gap-1 text-gray-500">
                                                                            <Clock className="h-3 w-3" />
                                                                            {progress.pending} queued
                                                                        </span>
                                                                    )}
                                                                    {progress.failed > 0 && (
                                                                        <span className="flex items-center gap-1 text-red-400">
                                                                            <XCircle className="h-3 w-3" />
                                                                            {progress.failed} failed
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                            {!hasProgress && summary && (
                                                                <>
                                                                    <span className="flex items-center gap-1 text-emerald-400">
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                        {summary.completed || 0} completed
                                                                    </span>
                                                                    {(summary.failed || 0) > 0 && (
                                                                        <span className="flex items-center gap-1 text-red-400">
                                                                            <XCircle className="h-3 w-3" />
                                                                            {summary.failed} failed
                                                                        </span>
                                                                    )}
                                                                    <span className="text-gray-500">
                                                                        {summary.total || 0} total
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Feature flags */}
                                                <div className="flex gap-1.5 mt-2">
                                                    {camp.voicemail_detection && (
                                                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-500">
                                                            <PhoneOff className="h-2.5 w-2.5 mr-1" /> VM Detection
                                                        </Badge>
                                                    )}
                                                    {camp.analysis_plan && (
                                                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-500">
                                                            <BarChart2 className="h-2.5 w-2.5 mr-1" /> Analysis
                                                        </Badge>
                                                    )}
                                                    {camp.variable_mapping && (
                                                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-500">
                                                            <Shield className="h-2.5 w-2.5 mr-1" /> Variables
                                                        </Badge>
                                                    )}
                                                    {camp.max_concurrent_calls > 0 && (
                                                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-500">
                                                            <Clock className="h-2.5 w-2.5 mr-1" /> Max {camp.max_concurrent_calls} concurrent
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 shrink-0 ml-4">
                                            {(isDraft || isPaused) && (camp.total_leads || 0) > 0 && (
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    onClick={() => handleActivateCampaign(camp.id)}
                                                >
                                                    <Play className="h-3.5 w-3.5 mr-1" />
                                                    {isPaused ? 'Resume' : 'Launch'}
                                                </Button>
                                            )}
                                            {isRunning && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-900/20"
                                                    onClick={() => handlePauseCampaign(camp.id)}
                                                >
                                                    <Pause className="h-3.5 w-3.5 mr-1" />
                                                    Pause
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-400 hover:text-white"
                                                onClick={() => navigate(`/campaigns/${camp.id}`)}
                                            >
                                                Details
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            );
                        })}

                        {filteredCampaigns.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                <Megaphone className="h-16 w-16 text-gray-600" />
                                <h3 className="text-lg font-medium text-gray-300">
                                    {searchQuery ? 'No campaigns match your search' : 'No campaigns yet'}
                                </h3>
                                <p className="text-sm text-gray-500 text-center max-w-md">
                                    {searchQuery
                                        ? 'Try a different search term.'
                                        : 'Create your first campaign to start making outbound voice calls to your leads.'}
                                </p>
                                {!searchQuery && (
                                    <Link to="/campaigns/new">
                                        <Button className="bg-emerald-600 hover:bg-emerald-700 mt-2">
                                            <Plus className="mr-2 h-4 w-4" /> Create Your First Campaign
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Campaigns;
