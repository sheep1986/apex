import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabaseService } from '../services/supabase-service';
import { useUser } from '../hooks/auth';

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status: 'new' | 'contacted' | 'interested' | 'qualified' | 'converted' | 'unqualified' | 'pending';
  priority: 'low' | 'medium' | 'high';
  source: string;
  campaign: string;
  notes?: string;
  cid: string;
  date: string;
  value: number;
  assignedTo: string;
  assignedToId?: string;
  owner?: string;
  lastContactDate: string;
  nextFollowUp?: string;
  lastActivity: string;
  activities: number;
  tags: string[];
}

interface ContactsContextType {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  updateContactStatus: (contactId: string, status: Contact['status']) => void;
  loading: boolean;
  error: string | null;
  refreshContacts: () => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within ContactsProvider');
  }
  return context;
};

export const ContactsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isSignedIn, isLoaded } = useUser();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!isSignedIn || !user || !user.organization_id) {
        console.log('⚠️ No user logged in or no organization, skipping contacts fetch');
        setContacts([]);
        return;
      }

      const organizationId = user.organization_id;
      console.log(`🔍 Fetching contacts for organization: ${organizationId}`);
      console.log(`🔍 User: ${user.email} (${user.role})`);
      
      // Fetch from leads table with simplified query to avoid join issues
      const { data, error: fetchError } = await supabaseService.client
        .from('leads')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      console.log('📊 Raw contacts data:', data);
      console.log('❌ Fetch error:', fetchError);

      if (fetchError) {
        throw fetchError;
      }

      // Transform Supabase data to match Contact interface
      // Map current leads table structure to Contact interface
      const transformedContacts: Contact[] = (data || []).map((lead: any) => {
        // Extract first and last name from the name field
        const nameParts = (lead.name || '').split(' ');
        const firstName = nameParts[0] || undefined;
        const lastName = nameParts.slice(1).join(' ') || undefined;
        
        return {
          id: lead.id,
          firstName: firstName,
          lastName: lastName,
          email: lead.email || undefined,
          phone: lead.phone || undefined,
          company: lead.company || 'Unknown Company',
          title: undefined, // Not in current leads schema
          status: lead.status || 'new',
          priority: lead.priority || 'medium',
          source: lead.source || 'call', // Use actual source field
          campaign: lead.campaign_id ? `Campaign ${lead.campaign_id.substring(0, 8)}` : 'No Campaign',
          notes: lead.notes || undefined,
          cid: lead.id,
          date: lead.created_at,
          value: 0, // Not in current leads schema
          assignedTo: 'System', // Auto-converted leads
          assignedToId: undefined,
          owner: 'System',
          lastContactDate: lead.updated_at || lead.created_at,
          nextFollowUp: lead.next_action ? lead.created_at : undefined,
          lastActivity: lead.updated_at || lead.created_at,
          activities: lead.call_id ? 1 : 0, // If has call_id, then 1 activity
          tags: []
        };
      });

      setContacts(transformedContacts);
      console.log(`✅ Loaded ${transformedContacts.length} contacts from database`);
    } catch (err) {
      console.error('❌ Error fetching contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const refreshContacts = async () => {
    await fetchContacts();
  };

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && user && user.organization_id) {
        fetchContacts();
      } else {
        setLoading(false);
        setContacts([]);
      }
    }
  }, [isLoaded, isSignedIn, user?.organization_id]);

  const updateContactStatus = (contactId: string, status: Contact['status']) => {
    setContacts((prevContacts) => {
      const contactExists = prevContacts.find((contact) => contact.id === contactId);
      if (!contactExists) {
        console.warn(`Contact with ID ${contactId} not found`);
        return prevContacts;
      }

      return prevContacts.map((contact) =>
        contact.id === contactId ? { ...contact, status } : contact
      );
    });
  };

  return (
    <ContactsContext.Provider value={{ contacts, setContacts, updateContactStatus, loading, error, refreshContacts }}>
      {children}
    </ContactsContext.Provider>
  );
};
