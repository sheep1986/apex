import React, { useState, useEffect } from 'react';
import { Phone, Clock, User, TrendingUp } from 'lucide-react';

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
    // WebSocket connection for real-time updates
    const ws = new WebSocket(`ws://localhost:3001/calls/${campaignId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'call_started') {
        setActiveCalls(prev => [...prev, data.call]);
      } else if (data.type === 'call_ended') {
        setActiveCalls(prev => prev.filter(call => call.id !== data.call.id));
      } else if (data.type === 'stats_update') {
        setCallStats(data.stats);
      }
    };
    
    return () => ws.close();
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
