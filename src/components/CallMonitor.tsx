import React, { useState, useEffect } from 'react';
import { Phone, Clock, User, TrendingUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

interface ActiveCall {
  id: string;
  leadName: string;
  phoneNumber: string;
  duration: string;
  status: string;
}

interface CallStats {
  avgDuration: string;
  answerRate: string;
  qualifiedToday: number;
}

interface CallMonitorProps {
  campaignId: string;
}

export const CallMonitor: React.FC<CallMonitorProps> = ({ campaignId }) => {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [callStats, setCallStats] = useState<CallStats | null>(null);

  useEffect(() => {
    // Initial fetch of active calls
    const loadActiveCalls = async () => {
      const { data } = await supabase
        .from('voice_calls')
        .select('id, contact_name, phone_number, duration, status')
        .eq('campaign_id', campaignId)
        .in('status', ['in-progress', 'ringing', 'queued'])
        .order('created_at', { ascending: false });

      if (data) {
        setActiveCalls(data.map(c => ({
          id: c.id,
          leadName: c.contact_name || 'Unknown',
          phoneNumber: c.phone_number || '',
          duration: c.duration ? `${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : '0s',
          status: c.status || 'unknown',
        })));
      }

      // Get stats
      const { count: totalCount } = await supabase.from('voice_calls').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId);
      const { count: answeredCount } = await supabase.from('voice_calls').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId).eq('status', 'completed');
      const { data: avgData } = await supabase.from('voice_calls').select('duration').eq('campaign_id', campaignId).not('duration', 'is', null);

      const avgDuration = avgData && avgData.length > 0 ? avgData.reduce((sum, c) => sum + (c.duration || 0), 0) / avgData.length : 0;
      const answerRate = totalCount && totalCount > 0 ? ((answeredCount || 0) / totalCount * 100) : 0;

      setCallStats({
        avgDuration: `${Math.floor(avgDuration / 60)}m`,
        answerRate: `${answerRate.toFixed(0)}%`,
        qualifiedToday: answeredCount || 0,
      });
    };

    loadActiveCalls();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`call-monitor-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_calls', filter: `campaign_id=eq.${campaignId}` }, () => {
        loadActiveCalls(); // Reload on any change
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [campaignId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Stats Cards */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <Phone className="h-8 w-8 text-blue-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Active Calls</p>
            <p className="text-2xl font-semibold">{activeCalls.length}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <Clock className="h-8 w-8 text-green-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Avg Duration</p>
            <p className="text-2xl font-semibold">{callStats?.avgDuration || '0m'}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <User className="h-8 w-8 text-purple-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Answer Rate</p>
            <p className="text-2xl font-semibold">{callStats?.answerRate || '0%'}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-orange-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Qualified Today</p>
            <p className="text-2xl font-semibold">{callStats?.qualifiedToday || '0'}</p>
          </div>
        </div>
      </div>
      
      {/* Active Calls List */}
      <div className="col-span-full bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Active Calls</h3>
          <div className="space-y-2">
            {activeCalls.map(call => (
              <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">{call.leadName}</p>
                    <p className="text-sm text-gray-500">{call.phoneNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{call.duration}</p>
                  <p className="text-xs text-gray-500">{call.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
