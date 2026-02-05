
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUserContext } from '@/services/MinimalUserProvider';
import { createClient } from '@supabase/supabase-js';
import { Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function ContactsPage() {
  const { userContext } = useUserContext();
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (userContext?.organization_id) {
      loadContacts();
    }
  }, [userContext, search]);

  const loadContacts = async () => {
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', userContext?.organization_id)
      .order('created_at', { ascending: false });
    
    if (search) {
        query = query.or(`name.ilike.%${search}%,phone_e164.ilike.%${search}%`);
    }

    const { data } = await query;
    setContacts(data || []);
  };

  return (
    <div className="p-8 space-y-6 bg-black min-h-screen text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <div className="flex gap-2">
            <Input 
                placeholder="Search..." 
                className="bg-gray-800 border-gray-700 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {contacts.map((contact) => (
          <Card key={contact.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-800 rounded-full">
                        <User className="text-emerald-500 h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-semibold text-lg">{contact.name || 'Unknown Caller'}</div>
                        <div className="text-gray-400 text-sm flex items-center gap-2">
                            <Phone className="h-3 w-3" /> {contact.phone_e164}
                        </div>
                    </div>
                </div>
                <div className="text-gray-500 text-sm">
                    Added {new Date(contact.created_at).toLocaleDateString()}
                </div>
            </CardContent>
          </Card>
        ))}
        {contacts.length === 0 && (
            <div className="text-center py-12 text-gray-500">No contacts found</div>
        )}
      </div>
    </div>
  );
}
