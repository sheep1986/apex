import { UserProfileModal } from '@/components/UserProfileModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
    AlertCircle,
    ArrowLeft,
    Ban,
    Building,
    CheckCircle,
    CheckCircle2,
    ChevronRight,
    Clock,
    Copy,
    Info,
    Loader2,
    Mail,
    Phone,
    Save,
    Send,
    Settings,
    Trash2,
    User,
    UserPlus,
    Users,
    X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase-client';

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
  voice_engine_api_key?: string; // Contains the public key
  voice_engine_private_key?: string;
  voice_engine_settings?: any;
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

  // Voice settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // User profile modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  useEffect(() => {
    fetchOrganizationData();
  }, [id]);

  // Update Voice Engine fields when organization data changes


  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      
      // Import supabase service
      const { supabaseService } = await import('@/services/supabase-service');
      
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
          voice_engine_api_key: orgData.vapi_api_key,
          voice_engine_private_key: orgData.vapi_private_key,
          created_at: orgData.created_at,
          updated_at: orgData.updated_at,
        };
        
        setOrganization(org);
        setEditedOrg(org);
        

        
        
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
        console.error('Error fetching from Supabase:', err);
        setError('Organization not found');
        setLoading(false);
        return;
      }

      // Fetch invitations from Supabase (table may not exist yet)
      try {
        const { data: invData } = await supabase
          .from('invitations')
          .select('*')
          .eq('organization_id', id);
        if (invData) {
          setInvitations(invData);
        }
      } catch (err) {
        console.warn('Could not fetch invitations (table may not exist):', err);
        setInvitations([]);
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



      // Update organization in Supabase
      const result = await supabaseService.updateOrganization(id!, updateData);

      toast({
        title: 'Success',
        description: 'Organization details saved successfully',
      });

      // Skip the refresh for now to avoid errors
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

      // Create a new auth user via Supabase signUp (sends confirmation email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteEmail,
        password: crypto.randomUUID(), // temporary password; user sets their own via email
        options: {
          data: {
            full_name: `${inviteFirstName} ${inviteLastName}`.trim(),
            first_name: inviteFirstName,
            last_name: inviteLastName,
            role: inviteRole,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Link user to organization if auth succeeded
      if (authData.user) {
        try {
          await supabase
            .from('profiles')
            .update({
              organization_id: id,
              role: inviteRole,
              status: 'invited',
              invited_at: new Date().toISOString(),
            })
            .eq('id', authData.user.id);
        } catch (err) {
          console.warn('Could not update profile:', err);
        }

        try {
          await supabase.from('organization_members').insert({
            organization_id: id,
            user_id: authData.user.id,
            role: inviteRole === 'client_admin' ? 'admin' : 'member',
          });
        } catch (err) {
          console.warn('Could not create org membership:', err);
        }

        // Try to create an invitation record (table may not exist)
        try {
          await supabase.from('invitations').insert({
            organization_id: id,
            email: inviteEmail,
            first_name: inviteFirstName,
            last_name: inviteLastName,
            role: inviteRole,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        } catch (err) {
          console.warn('Could not create invitation record (table may not exist):', err);
        }
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

      // Refresh data
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
      // Get the invitation details to find the email
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (fetchError || !invitation) {
        throw new Error('Invitation not found');
      }

      // Re-invite via Supabase auth (resend confirmation)
      const { error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: crypto.randomUUID(),
        options: {
          data: {
            full_name: `${invitation.first_name || ''} ${invitation.last_name || ''}`.trim(),
            role: invitation.role,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      // Update the invitation record
      await supabase
        .from('invitations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', invitationId);

      if (authError && !authError.message.includes('already registered')) {
        throw new Error(authError.message);
      }

      toast({
        title: 'Success',
        description: 'Invitation resent successfully',
      });

      await fetchOrganizationData();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resend invitation',
        variant: 'destructive',
      });
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      // Try to update the invitation status to cancelled
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (updateError) {
        // If update fails, try delete as fallback
        const { error: deleteError } = await supabase
          .from('invitations')
          .delete()
          .eq('id', invitationId);

        if (deleteError) {
          throw new Error('Failed to cancel invitation');
        }
      }

      toast({
        title: 'Success',
        description: 'Invitation cancelled',
      });

      await fetchOrganizationData();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel invitation',
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
                  <h2 className="text-xl font-semibold text-white mb-2">Voice Integration</h2>
                  <p className="text-gray-400">Manage your Voice Engine settings</p>
                </div>

                <Separator className="bg-gray-800" />

                <Alert className="border-emerald-700 bg-emerald-900/20">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <AlertDescription className="text-emerald-200">
                    Trinity Voice Engine is active and managed by the platform.
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg bg-gray-800/50 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                        <Phone className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Voice Capabilities</p>
                        <p className="text-sm text-gray-400">Outbound and Inbound AI Calling</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Active
                    </Badge>
                  </div>
                </div>
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
        user={selectedUser as any}
        isOpen={showUserProfile}
        onClose={() => {
          setShowUserProfile(false);
          setSelectedUser(null);
        }}
        onResendInvitation={async (userId) => {
          try {
            // Get the user's email from the profiles table
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('email, full_name, role')
              .eq('id', userId)
              .single();

            if (profileError || !profile) {
              throw new Error('User not found');
            }

            // Re-send invitation via Supabase auth signUp (resend confirmation)
            const { error: authError } = await supabase.auth.signUp({
              email: profile.email,
              password: crypto.randomUUID(),
              options: {
                data: {
                  full_name: profile.full_name,
                  role: profile.role,
                },
                emailRedirectTo: `${window.location.origin}/login`,
              },
            });

            if (authError && !authError.message.includes('already registered')) {
              throw new Error(authError.message);
            }

            // Update the profile invited_at timestamp
            await supabase
              .from('profiles')
              .update({ invited_at: new Date().toISOString(), status: 'invited' })
              .eq('id', userId);

            toast({
              title: 'Success',
              description: 'Invitation resent successfully',
            });

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
            // Update user status to suspended in profiles
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ status: 'suspended', updated_at: new Date().toISOString() })
              .eq('id', userId);

            if (updateError) {
              throw new Error(updateError.message || 'Failed to suspend user');
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
            // Update user status to active in profiles
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ status: 'active', updated_at: new Date().toISOString() })
              .eq('id', userId);

            if (updateError) {
              throw new Error(updateError.message || 'Failed to activate user');
            }

            toast({
              title: 'User Activated',
              description: 'The user has been activated and can now access the platform.',
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