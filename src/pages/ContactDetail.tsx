
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserContext } from '@/services/MinimalUserProvider';
import { createClient } from '@supabase/supabase-js';
import { FileText, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const { userContext } = useUserContext();
  const [contact, setContact] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userContext?.organization_id && id) {
      loadData();
    }
  }, [userContext, id]);

  const loadData = async () => {
    setLoading(true);
    // 1. Fetch Contact
    const { data: contactData } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .eq('organization_id', userContext?.organization_id)
      .single();
    
    setContact(contactData);

    // 2. Fetch or Construct Activity Timeline
    // Ideally we query the 'activities' table directly.
    const { data: activityData } = await supabase
        .from('activities')
        .select('*')
        .eq('contact_id', id)
        .eq('organization_id', userContext?.organization_id)
        .order('occurred_at', { ascending: false });
    
    setActivities(activityData || []);
    setLoading(false);
  };

  if (!contact) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 space-y-6 bg-black min-h-screen text-white">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
                {contact.name || 'Unknown Contact'}
                <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                    Contact
                </Badge>
            </h1>
            <div className="text-gray-400 mt-2 flex items-center gap-4">
                <span className="flex items-center gap-2"><Phone className="h-4 w-4"/> {contact.phone_e164}</span>
                <span className="text-sm">ID: {contact.id}</span>
            </div>
        </div>
        <div>
            <Button className="bg-emerald-600 hover:bg-emerald-700">Call Now</Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Metadata / Notes */}
        <div className="col-span-1 space-y-6">
            <Card className="bg-gray-900 border-gray-800">
                <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                        <span className="text-gray-400">Email</span>
                        <span>{contact.email || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                        <span className="text-gray-400">Created</span>
                        <span>{new Date(contact.created_at).toLocaleDateString()}</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Right: Timeline / Activity */}
        <div className="col-span-2">
            <Tabs defaultValue="timeline">
                <TabsList className="bg-gray-900 border-gray-800">
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="tickets">Tickets</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="mt-4 space-y-4">
                    {activities.length === 0 && <div className="text-gray-500">No activity recorded.</div>}
                    
                    {activities.map((act) => (
                        <Card key={act.id} className="bg-gray-900 border-gray-800">
                            <CardContent className="p-4 flex gap-4">
                                <div className="mt-1">
                                    {act.type.includes('call') ? <Phone className="text-blue-400" /> : <FileText className="text-yellow-400" />}
                                </div>
                                <div>
                                    <div className="font-semibold">{act.summary || act.type}</div>
                                    <div className="text-sm text-gray-400">{new Date(act.occurred_at).toLocaleString()}</div>
                                    {act.metadata && (
                                        <div className="mt-2 text-xs bg-gray-800 p-2 rounded">
                                            <pre>{JSON.stringify(act.metadata, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
                
                <TabsContent value="tickets">
                    <div className="text-gray-500">Tickets list view would go here.</div>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
