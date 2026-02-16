
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase-client';
import { triggerWebhook } from '@/services/webhook-trigger';
import { Loader2, Mail, Phone, Plus, Search, Users, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ContactsPage() {
  const { organization } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '' });

  const loadContacts = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone_e164.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data } = await query;
    setContacts(data || []);
    setLoading(false);
  }, [organization?.id, search]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleCreateContact = async () => {
    if (!newContact.name.trim() && !newContact.phone.trim()) {
      toast({ title: 'Error', description: 'Name or phone number is required.', variant: 'destructive' });
      return;
    }
    if (!organization?.id) return;

    setCreating(true);
    try {
      const { error } = await supabase.from('contacts').insert({
        organization_id: organization.id,
        name: newContact.name.trim() || null,
        phone_e164: newContact.phone.trim() || null,
        email: newContact.email.trim() || null,
      });

      if (error) throw error;

      // Dispatch contact.created webhook event
      triggerWebhook(organization.id, 'contact.created', {
        name: newContact.name.trim() || null,
        phone: newContact.phone.trim() || null,
        email: newContact.email.trim() || null,
      });

      toast({ title: 'Contact Created', description: `${newContact.name || newContact.phone} has been added.` });
      setShowCreateDialog(false);
      setNewContact({ name: '', phone: '', email: '' });
      loadContacts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create contact.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Contacts</h1>
              <p className="text-gray-400">{contacts.length} contacts in your CRM</p>
            </div>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Contact
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, phone, or email..."
            className="border-gray-700 bg-gray-900/50 pl-10 text-white placeholder-gray-500 focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Loading */}
        {loading && contacts.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-400">Loading contacts...</span>
          </div>
        )}

        {/* Contact List */}
        {(!loading || contacts.length > 0) && (
          <div className="grid gap-2">
            {contacts.map((contact) => (
              <Card
                key={contact.id}
                className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
                onClick={() => navigate(`/contacts/${contact.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-sm font-bold text-white">
                      {(contact.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{contact.name || 'Unknown'}</div>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        {contact.phone_e164 && (
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.phone_e164}</span>
                        )}
                        {contact.email && (
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {contact.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}

            {contacts.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Users className="h-16 w-16 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-300">
                  {search ? 'No contacts match your search' : 'No contacts yet'}
                </h3>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  {search ? 'Try a different search term.' : 'Create your first contact or they will be added automatically from campaigns.'}
                </p>
                {!search && (
                  <Button variant="outline" className="border-gray-700" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Contact
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Contact Modal */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Create Contact</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateDialog(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white">Name</Label>
                <Input
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="border-gray-700 bg-gray-800 text-white"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label className="text-white">Phone Number</Label>
                <Input
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="border-gray-700 bg-gray-800 text-white"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <Label className="text-white">Email (optional)</Label>
                <Input
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="border-gray-700 bg-gray-800 text-white"
                  placeholder="john@example.com"
                  type="email"
                />
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleCreateContact}
                disabled={creating}
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {creating ? 'Creating...' : 'Create Contact'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
