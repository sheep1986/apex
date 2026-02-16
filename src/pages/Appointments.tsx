import React, { useState } from 'react';
import { AppointmentsSection } from '../components/AppointmentsSection';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar, CalendarCheck, Clock, CheckCircle, AlertCircle, ExternalLink, Unlink } from 'lucide-react';
import { useApiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export default function Appointments() {
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    completed: 0,
    upcoming: 0
  });
  const [loading, setLoading] = useState(true);
  
  const apiClient = useApiClient();
  const { toast } = useToast();

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Fetch all appointments
      const response = await apiClient.get('/appointments');
      const appointments = Array.isArray(response.data) ? response.data : 
                          Array.isArray(response) ? response : [];

      // Calculate stats
      const stats = appointments.reduce((acc: any, apt: any) => {
        const aptDate = new Date(apt.scheduled_at);
        
        // Today's appointments
        if (aptDate.toDateString() === today.toDateString()) {
          acc.today++;
        }
        
        // This week's appointments
        if (aptDate >= today && aptDate <= weekEnd) {
          acc.thisWeek++;
        }
        
        // Status-based counts
        if (apt.status === 'completed') {
          acc.completed++;
        } else if (['scheduled', 'confirmed'].includes(apt.status) && aptDate >= today) {
          acc.upcoming++;
        }
        
        return acc;
      }, { today: 0, thisWeek: 0, completed: 0, upcoming: 0 });

      setStats(stats);
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Appointments</h1>
          <p className="text-gray-400">Manage your scheduled appointments and meetings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={async () => {
              try {
                const response = await apiClient.post('/.netlify/functions/calendar-sync', {
                  action: 'google-auth-url',
                });
                if (response.authUrl) {
                  window.open(response.authUrl, '_blank');
                } else {
                  toast({ title: 'Info', description: 'Google Calendar integration requires GOOGLE_CLIENT_ID to be configured.' });
                }
              } catch {
                toast({ title: 'Info', description: 'Calendar sync available when Google credentials are configured.' });
              }
            }}
          >
            <CalendarCheck className="mr-2 h-4 w-4" />
            Connect Google Calendar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Today</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.today}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.thisWeek}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Upcoming</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.upcoming}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.completed}</p>
              </div>
              <div className="p-3 bg-gray-500/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <AppointmentsSection showAll={true} />
        </CardContent>
      </Card>
    </div>
  );
}