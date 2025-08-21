import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Building,
  Users,
  Mail,
  Settings,
  Send,
  Copy,
  Trash2,
  Save,
  X,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Key,
  Globe,
  Phone,
  MapPin,
  ChevronRight,
  ChevronLeft,
  User,
  CheckCircle2,
  FileText,
  ArrowLeft,
  Info,
  Loader2,
  Eye,
  EyeOff,
  Ban,
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { UserProfileModal } from '@/components/UserProfileModal';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  plan: string;
  monthly_cost: number;
  primary_color?: string;
  secondary_color?: string;
  website?: string;
  phone?: string;
  address?: string;
  country?: string;
  industry?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  vapi_api_key?: string; // Contains the public key
  vapi_private_key?: string;
  vapi_settings?: any;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  status: string;
  email_verified?: boolean;
  created_at: string;
  invited_at?: string;
  invitation_accepted_at?: string;
  first_login_at?: string;
  last_login_at?: string;
  last_activity_at?: string;
  login_count?: number;
  display_status?: string;
  invited_by_name?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

const STEPS = [
  { id: 1, name: 'Details', icon: Building },
  { id: 2, name: 'Team', icon: Users },
  { id: 3, name: 'Settings', icon: Settings },
];

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
];

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Real Estate',
  'Retail',
  'Manufacturing',
  'Education',
  'Marketing & Advertising',
  'Other',
];

const ROLES = [
  { value: 'client_admin', label: 'Admin', description: 'Full access to organization' },
  { value: 'client_user', label: 'User', description: 'Can manage campaigns' },
];

export default function OrganizationManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(2); // Start on Team tab to match screenshot
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Invitation modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState('client_user');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Editable organization data
  const [editedOrg, setEditedOrg] = useState<Partial<Organization>>({});

  // VAPI settings
  const [vapiPrivateKey, setVapiPrivateKey] = useState('');
  const [vapiPublicKey, setVapiPublicKey] = useState('');
  const [vapiWebhookUrl, setVapiWebhookUrl] = useState('https://api.apexai.com/webhooks/vapi');
  const [vapiEnabled, setVapiEnabled] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);

  // User profile modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  useEffect(() => {
    fetchOrganizationData();
  }, [id]);

  // Update VAPI fields when organization data changes
  useEffect(() => {
    if (organization) {
      console.log('🔄 Updating VAPI fields from organization data:', {
        vapi_api_key: organization.vapi_api_key,
        vapi_private_key: organization.vapi_private_key,
        fullOrg: organization
      });
      setVapiPrivateKey(organization.vapi_private_key || '');
      setVapiPublicKey(organization.vapi_api_key || ''); // vapi_api_key contains the public key
      setVapiEnabled(!!organization.vapi_api_key || !!organization.vapi_private_key);
    }
  }, [organization]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      
      // Import supabase service
      const { supabaseService } = await import('@/services/supabase-service');
      
      console.log('🔍 Fetching organization data for ID:', id);
      
      // Fetch organization from Supabase
      try {
        const orgData = await supabaseService.getOrganization(id!);
        
        if (!orgData) {
          throw new Error('Organization not found');
        }
        
        // Transform the organization data to match our interface
        const org: Organization = {
          id: orgData.id,
          name: orgData.name,
          slug: orgData.slug,
          type: orgData.type,
          status: orgData.status,
          plan: orgData.plan,
          monthly_cost: orgData.monthly_cost,
          primary_color: orgData.primary_color,
          secondary_color: orgData.secondary_color,
          website: orgData.website,
          phone: orgData.phone,
          address: orgData.address,
          country: orgData.country,
          industry: orgData.industry,
          contact_name: orgData.contact_name,
          contact_email: orgData.billing_email || orgData.contact_email,
          contact_phone: orgData.contact_phone,
          vapi_api_key: orgData.vapi_api_key,
          vapi_private_key: orgData.vapi_private_key,
          created_at: orgData.created_at,
          updated_at: orgData.updated_at,
        };
        
        setOrganization(org);
        setEditedOrg(org);
        
        // Load VAPI settings if available - using correct column names
        console.log('🔑 Loading VAPI settings from Supabase:', {
          vapi_api_key: orgData.vapi_api_key,
          vapi_private_key: orgData.vapi_private_key,
          fullOrgData: orgData
        });
        
        // Always set VAPI fields
        // Note: Currently vapi_api_key contains the public key, we'll handle this correctly
        setVapiPrivateKey(orgData.vapi_private_key || '');
        setVapiPublicKey(orgData.vapi_api_key || ''); // vapi_api_key contains the public key
        setVapiEnabled(!!(orgData.vapi_api_key || orgData.vapi_private_key));
        
        // Also set webhook URL
        setVapiWebhookUrl(`https://api.apexai.com/webhooks/vapi`);
        
        // Fetch users for this organization
        try {
          const users = await supabaseService.getUsers(id);
          const transformedUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            phone: u.phone,
            role: u.role,
            status: u.status,
            email_verified: u.email_verified,
            created_at: u.created_at,
            invited_at: u.invited_at,
            last_login_at: u.last_login_at,
          }));
          setUsers(transformedUsers);
        } catch (err) {
          console.warn('Failed to fetch users:', err);
          setUsers([]);
        }
        
        setError(null);
        setLoading(false);
        return;
      } catch (err) {
        console.error('❌ Error fetching from Supabase:', err);
        setError('Organization not found');
        setLoading(false);
        return;
      }

      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      // Fetch organization details
      const orgResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/organizations/${id}`, {
        headers,
      });

      if (!orgResponse.ok) throw new Error('Failed to fetch organization');
      const orgData = await orgResponse.json();
      const org = orgData.organization || orgData;
      setOrganization(org);
      setEditedOrg(org);

      // Load VAPI settings if available
      if (org.vapi_settings || org.settings?.vapi) {
        const vapiSettings = org.vapi_settings ? 
          (typeof org.vapi_settings === 'string' ? JSON.parse(org.vapi_settings) : org.vapi_settings) : 
          org.settings?.vapi;
        
        setVapiPrivateKey(vapiSettings.privateKey || vapiSettings.apiKey || '');
        setVapiPublicKey(vapiSettings.publicKey || '');
        setVapiWebhookUrl(vapiSettings.webhookUrl || 'https://api.apexai.com/webhooks/vapi');
        setVapiEnabled(vapiSettings.enabled !== undefined ? vapiSettings.enabled : true);
      }

      // Fetch users
      const usersResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/organizations/${id}/users`, {
        headers,
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      // Fetch invitations
      const invitationsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/organizations/${id}/invitations`, {
        headers,
      });
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setInvitations(invitationsData.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organization data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Import supabase service
      const { supabaseService } = await import('@/services/supabase-service');

      // Prepare the update data - only include fields that exist in the table
      const updateData: any = {
        name: editedOrg.name,
        billing_email: editedOrg.contact_email,
        phone: editedOrg.phone,
        address: editedOrg.address,
        country: editedOrg.country,
        website: editedOrg.website,
        industry: editedOrg.industry,
        updated_at: new Date().toISOString(),
      };

      // Add VAPI settings if on settings step
      if (currentStep === 3) {
        // Save to the correct columns based on existing database structure
        updateData.vapi_private_key = vapiPrivateKey;
        // vapi_api_key column stores the public key
        updateData.vapi_api_key = vapiPublicKey;
        console.log('💾 Including VAPI settings in update');
      }

      console.log('📤 Attempting to save organization with data:', {
        id: id,
        updateData: updateData,
        currentStep: currentStep
      });

      // Update organization in Supabase
      const result = await supabaseService.updateOrganization(id!, updateData);
      console.log('✅ Update result:', result);

      toast({
        title: 'Success',
        description: 'Organization details saved successfully',
      });

      // Skip the refresh for now to avoid errors
      console.log('✅ Save completed successfully - skipping refresh to avoid errors');
    } catch (error) {
      console.error('❌ Error saving changes:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error
      });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const sendInvitation = async () => {
    try {
      setSendingInvite(true);
      const token = await getToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/organizations/${id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          email: inviteEmail,
          firstName: inviteFirstName,
          lastName: inviteLastName,
          role: inviteRole,
          inviterName: 'Admin', // You might want to get this from the current user
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      toast({
        title: 'Success',
        description: `Invitation sent to ${inviteEmail}`,
      });

      // Reset form and close modal
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      setInviteRole('client_user');
      setShowInviteModal(false);
      
      // Refresh invitations
      await fetchOrganizationData();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error('Failed to resend invitation');

      toast({
        title: 'Success',
        description: 'Invitation resent successfully',
      });
      
      await fetchOrganizationData();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive',
      });
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error('Failed to cancel invitation');

      toast({
        title: 'Success',
        description: 'Invitation cancelled',
      });
      
      await fetchOrganizationData();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation',
        variant: 'destructive',
      });
    }
  };

  const copyInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Copied!',
      description: 'Invitation link copied to clipboard',
    });
  };

  const getUserStatusDisplay = (user: User) => {
    // Determine the actual status based on user data
    if (user.status === 'active' && user.last_login_at) {
      return { status: 'active', label: 'Active' };
    } else if (user.status === 'invited' && !user.invitation_accepted_at) {
      return { status: 'invited', label: 'Invitation Pending' };
    } else if (user.status === 'active' && !user.last_login_at) {
      return { status: 'never_logged_in', label: 'Never Logged In' };
    } else if (user.status === 'suspended') {
      return { status: 'suspended', label: 'Suspended' };
    } else if (user.status === 'inactive') {
      return { status: 'inactive', label: 'Inactive' };
    }
    return { status: user.status, label: user.status };
  };

  const getStatusBadge = (status: string, label?: string) => {
    const variants: Record<string, any> = {
      active: { className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
      invited: { className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Mail },
      never_logged_in: { className: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: Clock },
      pending: { className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock },
      cancelled: { className: 'bg-red-500/10 text-red-400 border-red-500/20', icon: X },
      accepted: { className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: CheckCircle2 },
      suspended: { className: 'bg-red-500/10 text-red-400 border-red-500/20', icon: Ban },
      inactive: { className: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: Ban },
    };
    
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    
    return (
      <Badge variant="outline" className={variant.className}>
        <Icon className="mr-1 h-3 w-3" />
        {label || status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const openUserProfile = (user: User) => {
    // Calculate and add the display status to the user object
    const statusDisplay = getUserStatusDisplay(user);
    const userWithDisplayStatus = {
      ...user,
      display_status: statusDisplay.label
    };
    setSelectedUser(userWithDisplayStatus);
    setShowUserProfile(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-950">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Organization not found</h2>
              <p className="text-gray-400 mb-6">The organization you're looking for doesn't exist or you don't have access.</p>
              <Button
                onClick={() => navigate('/organizations')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Back to Organizations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Building className="h-8 w-8 text-emerald-500" />
              <div>
                <h1 className="text-3xl font-bold text-white">{organization.name}</h1>
                <p className="text-gray-400">Manage organization settings and team members</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/organizations')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Organizations
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save as Draft
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/organizations')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isCompleted
                        ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
                        : 'bg-gray-900/50 text-gray-500 hover:bg-gray-900'
                    }`}
                  >
                    <div className={`rounded-full p-2 ${
                      isActive
                        ? 'bg-emerald-500/20'
                        : isCompleted
                        ? 'bg-gray-700'
                        : 'bg-gray-800'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{step.name}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Step 1: Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Organization Details</h2>
                  <p className="text-gray-400">Update your organization's basic information</p>
                </div>

                <Separator className="bg-gray-800" />

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">
                      Business Name *
                    </Label>
                    <Input
                      id="name"
                      value={editedOrg.name || ''}
                      onChange={(e) => setEditedOrg({ ...editedOrg, name: e.target.value })}
                      className="mt-2 bg-gray-800 border-gray-700 text-white"
                      placeholder="e.g., Acme Marketing Agency"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_email" className="text-gray-300">
                      Business Email *
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={editedOrg.contact_email || ''}
                      onChange={(e) => setEditedOrg({ ...editedOrg, contact_email: e.target.value })}
                      className="mt-2 bg-gray-800 border-gray-700 text-white"
                      placeholder="contact@acmemarketing.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country" className="text-gray-300">
                      Country of Residence *
                    </Label>
                    <Select
                      value={editedOrg.country || ''}
                      onValueChange={(value) => setEditedOrg({ ...editedOrg, country: value })}
                    >
                      <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <span className="flex items-center gap-2">
                              <span>{country.flag}</span>
                              <span>{country.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-gray-300">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={editedOrg.phone || ''}
                      onChange={(e) => setEditedOrg({ ...editedOrg, phone: e.target.value })}
                      className="mt-2 bg-gray-800 border-gray-700 text-white"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-gray-300">
                      Website (Optional)
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={editedOrg.website || ''}
                      onChange={(e) => setEditedOrg({ ...editedOrg, website: e.target.value })}
                      className="mt-2 bg-gray-800 border-gray-700 text-white"
                      placeholder="https://www.acmemarketing.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="industry" className="text-gray-300">
                      Industry (Optional)
                    </Label>
                    <Select
                      value={editedOrg.industry || ''}
                      onValueChange={(value) => setEditedOrg({ ...editedOrg, industry: value })}
                    >
                      <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="address" className="text-gray-300">
                    Business Address
                  </Label>
                  <Textarea
                    id="address"
                    value={editedOrg.address || ''}
                    onChange={(e) => setEditedOrg({ ...editedOrg, address: e.target.value })}
                    className="mt-2 bg-gray-800 border-gray-700 text-white"
                    placeholder="123 Main Street, Suite 100&#10;City, State 12345"
                    rows={3}
                  />
                </div>

                <Alert className="border-gray-700 bg-gray-800/50">
                  <Info className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-gray-300">
                    This information helps us customize your experience and ensure compliance with local regulations.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 2: Team */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">Team Members</h2>
                    <p className="text-gray-400">Manage who has access to your organization</p>
                  </div>
                  <Button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </div>

                <Separator className="bg-gray-800" />

                {/* Active Members */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Active Members</h3>
                  {users.length > 0 ? (
                    <div className="space-y-3">
                      {users.map((user) => {
                        const statusDisplay = getUserStatusDisplay(user);
                        return (
                          <div
                            key={user.id}
                            className="flex items-center justify-between rounded-lg bg-gray-800/50 p-4 cursor-pointer hover:bg-gray-800/70 transition-colors"
                            onClick={() => openUserProfile(user)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                                <User className="h-5 w-5 text-emerald-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-sm text-gray-400">{user.email}</p>
                                {user.last_login_at && (
                                  <p className="text-xs text-gray-500">
                                    Last login: {new Date(user.last_login_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="border-gray-700 text-gray-400">
                                {user.role.replace('client_', '')}
                              </Badge>
                              {getStatusBadge(statusDisplay.status, statusDisplay.label)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
                      <Users className="mx-auto mb-3 h-12 w-12 text-gray-600" />
                      <p className="text-gray-400">No team members yet. Start by inviting someone!</p>
                    </div>
                  )}
                </div>

                {/* Pending Invitations */}
                {invitations.filter(inv => inv.status === 'pending').length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Pending Invitations</h3>
                    <div className="space-y-3">
                      {invitations
                        .filter(inv => inv.status === 'pending')
                        .map((invitation) => (
                          <div
                            key={invitation.id}
                            className="flex items-center justify-between rounded-lg bg-gray-800/50 p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                                <Mail className="h-5 w-5 text-yellow-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {invitation.first_name} {invitation.last_name}
                                </p>
                                <p className="text-sm text-gray-400">{invitation.email}</p>
                                <p className="text-xs text-gray-500">
                                  Expires {new Date(invitation.expires_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyInviteLink(invitation.id)}
                                className="text-gray-400 hover:text-white"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resendInvitation(invitation.id)}
                                className="text-gray-400 hover:text-white"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelInvitation(invitation.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Settings */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">VAPI Integration</h2>
                  <p className="text-gray-400">Configure your VAPI settings for AI calling capabilities</p>
                </div>

                <Separator className="bg-gray-800" />

                <Alert className="border-emerald-700 bg-emerald-900/20">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <AlertDescription className="text-emerald-200">
                    VAPI integration enables AI-powered outbound calling. Get your API keys from{' '}
                    <a
                      href="https://vapi.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      vapi.ai
                    </a>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="vapiPrivateKey" className="text-gray-300">
                      VAPI Private Key
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="vapiPrivateKey"
                        type={showPrivateKey ? 'text' : 'password'}
                        value={vapiPrivateKey}
                        onChange={(e) => setVapiPrivateKey(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white pr-10"
                        placeholder="Enter your VAPI Private Key"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="vapiPublicKey" className="text-gray-300">
                      VAPI Public Key
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="vapiPublicKey"
                        type={showPublicKey ? 'text' : 'password'}
                        value={vapiPublicKey}
                        onChange={(e) => setVapiPublicKey(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white pr-10"
                        placeholder="Enter your VAPI Public Key"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPublicKey(!showPublicKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPublicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="vapiWebhookUrl" className="text-gray-300">
                      Webhook URL
                    </Label>
                    <Input
                      id="vapiWebhookUrl"
                      value={vapiWebhookUrl}
                      onChange={(e) => setVapiWebhookUrl(e.target.value)}
                      className="mt-2 bg-gray-800 border-gray-700 text-white"
                      placeholder="https://api.apexai.com/webhooks/vapi"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-4">
                    <div>
                      <p className="font-medium text-white">Enable VAPI Integration</p>
                      <p className="text-sm text-gray-400">Allow AI-powered calling for your campaigns</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={vapiEnabled}
                        onChange={(e) => setVapiEnabled(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                    </label>
                  </div>
                </div>

                <Alert className="border-gray-700 bg-gray-800/50">
                  <Key className="h-4 w-4 text-gray-400" />
                  <AlertDescription className="text-gray-300">
                    Your API keys are encrypted and stored securely. Never share them publicly.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite Member Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Invite Team Member</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send an invitation to add a new member to your organization
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="inviteFirstName" className="text-gray-300">
                  First Name
                </Label>
                <Input
                  id="inviteFirstName"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                  className="mt-2 bg-gray-800 border-gray-700 text-white"
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="inviteLastName" className="text-gray-300">
                  Last Name
                </Label>
                <Input
                  id="inviteLastName"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                  className="mt-2 bg-gray-800 border-gray-700 text-white"
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="inviteEmail" className="text-gray-300">
                Email Address
              </Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-2 bg-gray-800 border-gray-700 text-white"
                placeholder="john.doe@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="inviteRole" className="text-gray-300">
                Role
              </Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <p className="font-medium">{role.label}</p>
                        <p className="text-sm text-gray-400">{role.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteModal(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={sendInvitation}
              disabled={!inviteEmail || !inviteFirstName || !inviteLastName || sendingInvite}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {sendingInvite ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedUser}
        isOpen={showUserProfile}
        onClose={() => {
          setShowUserProfile(false);
          setSelectedUser(null);
        }}
        onResendInvitation={async (userId) => {
          try {
            const token = await getToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/${userId}/resend-invitation`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify({
                inviterName: 'Admin', // You might want to get this from the current user context
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to resend invitation');
            }

            const result = await response.json();
            
            // Show invitation link if email wasn't sent
            if (result.inviteLink && result.warning) {
              toast({
                title: 'Invitation Link Generated',
                description: (
                  <div className="space-y-2">
                    <p>{result.message}</p>
                    <div className="mt-2 p-2 bg-gray-800 rounded text-xs break-all">
                      {result.inviteLink}
                    </div>
                    <p className="text-xs text-gray-400">{result.warning}</p>
                    <div className="mt-3 p-2 bg-blue-900/20 border border-blue-800 rounded text-xs">
                      <p className="font-semibold text-blue-400 mb-1">To enable automatic email sending:</p>
                      <p className="text-gray-300">1. Get a free Resend API key at resend.com</p>
                      <p className="text-gray-300">2. Add to your /apps/backend/.env file:</p>
                      <p className="text-gray-300 font-mono bg-gray-800 p-1 rounded mt-1">RESEND_API_KEY=re_your_api_key</p>
                      <p className="text-gray-300">3. Restart the backend server</p>
                    </div>
                  </div>
                ),
                duration: 15000, // Show for 15 seconds
              });
            } else {
              toast({
                title: 'Success',
                description: result.message,
              });
            }

            // Refresh user data to show updated status
            await fetchOrganizationData();
          } catch (error) {
            console.error('Error resending invitation:', error);
            toast({
              title: 'Error',
              description: error instanceof Error ? error.message : 'Failed to resend invitation',
              variant: 'destructive',
            });
          }
        }}
        onSuspendUser={async (userId) => {
          if (!confirm('Are you sure you want to suspend this user? They will lose access to the platform.')) {
            return;
          }

          try {
            const token = await getToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/${userId}/suspend`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify({
                reason: 'Suspended by administrator',
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to suspend user');
            }

            toast({
              title: 'User Suspended',
              description: 'The user has been suspended and can no longer access the platform.',
            });

            // Refresh user data to show updated status
            await fetchOrganizationData();
            setShowUserProfile(false);
          } catch (error) {
            console.error('Error suspending user:', error);
            toast({
              title: 'Error',
              description: error instanceof Error ? error.message : 'Failed to suspend user',
              variant: 'destructive',
            });
          }
        }}
        onActivateUser={async (userId) => {
          try {
            const token = await getToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/${userId}/activate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to activate user');
            }

            const result = await response.json();

            toast({
              title: 'User Activated',
              description: result.message,
            });

            // Refresh user data to show updated status
            await fetchOrganizationData();
            setShowUserProfile(false);
          } catch (error) {
            console.error('Error activating user:', error);
            toast({
              title: 'Error',
              description: error instanceof Error ? error.message : 'Failed to activate user',
              variant: 'destructive',
            });
          }
        }}
      />
    </div>
  );
}