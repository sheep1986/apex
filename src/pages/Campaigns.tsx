
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/services/supabase-client';
import { BarChart2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const Campaigns = () => {
    const { organization, user } = useSupabaseAuth();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (organization?.id) {
            loadCampaigns();
        }
    }, [organization]);

    const loadCampaigns = async () => {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('organization_id', organization?.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setCampaigns(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Campaigns</h1>
                    <p className="text-gray-400">Manage outbound voice broadcasts.</p>
                </div>
                <Link to="/campaigns/new">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="mr-2 h-4 w-4" /> New Campaign
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4">
                {campaigns.map((camp) => (
                    <Card key={camp.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex gap-4 items-center">
                                <div className={`p-3 rounded-lg ${camp.status === 'running' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                                    <BarChart2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{camp.name}</h3>
                                    <div className="flex gap-2 text-sm text-gray-400">
                                        <span className="capitalize">{camp.type.replace('_', ' ')}</span>
                                        <span>•</span>
                                        <span className={`capitalize ${camp.status === 'running' ? 'text-emerald-400' : ''}`}>
                                            {camp.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                {/* Actions placeholder */}
                                <Button variant="ghost" size="sm">Details</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {campaigns.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500 bg-gray-900/50 rounded-xl border border-dashed border-gray-800">
                        <p>No campaigns found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Campaigns;
