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
      
      // Fetch from leads table instead of contacts
      // Simplified query - removed complex joins that were causing 400 errors
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
      // Use undefined for missing data instead of empty strings
      const transformedContacts: Contact[] = (data || []).map((contact: any) => ({
        id: contact.id,
        firstName: contact.first_name || undefined,
        lastName: contact.last_name || undefined,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        company: contact.company || undefined,
        title: contact.job_title || undefined, // Note: field is job_title not title
        status: contact.status || 'new',
        priority: contact.priority || 'medium',
        source: contact.lead_source || contact.source || 'ai_voice_call',
        campaign: contact.campaigns?.name || 'General',
        notes: contact.notes || undefined,
        cid: contact.id,
        date: contact.created_at,
        value: contact.conversion_value || contact.value || 0,
        assignedTo: contact.uploaded_by ? `${contact.uploaded_by.first_name} ${contact.uploaded_by.last_name}` : 'Unassigned',
        assignedToId: contact.uploaded_by?.id || undefined,
        owner: contact.uploaded_by ? `${contact.uploaded_by.first_name} ${contact.uploaded_by.last_name}` : 'Unassigned',
        lastContactDate: contact.last_call_at || contact.last_contact_date || contact.created_at,
        nextFollowUp: contact.next_call_at || contact.next_follow_up || undefined,
        lastActivity: contact.last_call_at || contact.last_activity || contact.created_at,
        activities: contact.call_attempts || contact.activities_count || 0,
        tags: contact.tags || []
      }));

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
