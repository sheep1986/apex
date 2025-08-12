import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  Send,
  Ban,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  status: string;
  email_verified: boolean;
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

interface UserProfileModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onResendInvitation?: (userId: string) => void;
  onSuspendUser?: (userId: string) => void;
  onActivateUser?: (userId: string) => void;
}

export function UserProfileModal({
  user,
  isOpen,
  onClose,
  onResendInvitation,
  onSuspendUser,
  onActivateUser,
}: UserProfileModalProps) {
  if (!user) return null;

  const getStatusBadge = (status: string, displayStatus?: string) => {
    const statusConfig: Record<string, any> = {
      active: { 
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', 
        icon: CheckCircle,
        label: 'Active'
      },
      invited: { 
        className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 
        icon: Mail,
        label: displayStatus || 'Invited'
      },
      'Invitation Pending': { 
        className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 
        icon: Clock,
        label: 'Invitation Pending'
      },
      'Invitation Expired': { 
        className: 'bg-red-500/10 text-red-400 border-red-500/20', 
        icon: AlertCircle,
        label: 'Invitation Expired'
      },
      'Never Logged In': { 
        className: 'bg-gray-500/10 text-gray-400 border-gray-500/20', 
        icon: User,
        label: 'Never Logged In'
      },
      inactive: { 
        className: 'bg-gray-500/10 text-gray-400 border-gray-500/20', 
        icon: Ban,
        label: 'Inactive'
      },
      suspended: { 
        className: 'bg-red-500/10 text-red-400 border-red-500/20', 
        icon: Ban,
        label: 'Suspended'
      },
    };

    const config = statusConfig[displayStatus || status] || statusConfig.invited;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleDisplay = role
      .replace('client_', '')
      .replace('_', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return (
      <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-400">
        <Shield className="mr-1 h-3 w-3" />
        {roleDisplay}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLastLoginInfo = (lastLogin?: string) => {
    if (!lastLogin) return { text: 'Never logged in', className: 'text-gray-400' };
    
    const daysSinceLogin = Math.floor((Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLogin === 0) {
      return { text: 'Today', className: 'text-emerald-400' };
    } else if (daysSinceLogin === 1) {
      return { text: 'Yesterday', className: 'text-emerald-400' };
    } else if (daysSinceLogin < 7) {
      return { text: `${daysSinceLogin} days ago`, className: 'text-blue-400' };
    } else if (daysSinceLogin < 30) {
      return { text: `${Math.floor(daysSinceLogin / 7)} weeks ago`, className: 'text-yellow-400' };
    } else {
      return { text: `${Math.floor(daysSinceLogin / 30)} months ago`, className: 'text-red-400' };
    }
  };

  const lastLoginInfo = getLastLoginInfo(user.last_login_at);
  
  // Determine the actual status based on user data
  const actualStatus = (() => {
    if (user.status === 'suspended') return 'suspended';
    if (user.status === 'invited' || !user.last_login_at) return 'invited';
    if (user.status === 'active' && user.last_login_at) return 'active';
    return user.status;
  })();
  
  const actualDisplayStatus = (() => {
    if (user.status === 'suspended') return 'Suspended';
    if (!user.last_login_at && (user.status === 'invited' || user.status === 'active')) return 'Invitation Pending';
    if (user.status === 'active' && user.last_login_at) return 'Active';
    return user.display_status || user.status;
  })();
  
  const isInvitationPending = !user.last_login_at && (user.status === 'invited' || user.status === 'active');
  const canResendInvitation = isInvitationPending;
  const canSuspend = user.status === 'active' && user.last_login_at;
  const canActivate = user.status === 'suspended' || user.status === 'inactive';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">User Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <User className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-sm text-gray-400">{user.email}</p>
                {user.phone && (
                  <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />
                    {user.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {getStatusBadge(actualStatus, actualDisplayStatus)}
              {getRoleBadge(user.role)}
            </div>
          </div>

          {/* Status Alert */}
          {isInvitationPending && (
            <Alert className="border-yellow-700 bg-yellow-900/20">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200">
                This user has been invited but hasn't set up their account yet. 
                {user.display_status === 'Invitation Expired' 
                  ? ' Their invitation has expired and needs to be resent.'
                  : ' They need to check their email and complete the signup process.'}
              </AlertDescription>
            </Alert>
          )}

          {user.status === 'suspended' && (
            <Alert className="border-red-700 bg-red-900/20">
              <Ban className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                This user account is suspended and cannot access the platform.
              </AlertDescription>
            </Alert>
          )}

          <Separator className="bg-gray-800" />

          {/* Account Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Account Information
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Created</p>
                <p className="text-white">{formatDate(user.created_at)}</p>
              </div>
              
              {user.invited_at && (
                <div>
                  <p className="text-sm text-gray-400">Invited</p>
                  <p className="text-white">{formatDate(user.invited_at)}</p>
                  {user.invited_by_name && (
                    <p className="text-xs text-gray-500">by {user.invited_by_name}</p>
                  )}
                </div>
              )}
              
              {user.invitation_accepted_at && (
                <div>
                  <p className="text-sm text-gray-400">Invitation Accepted</p>
                  <p className="text-white">{formatDate(user.invitation_accepted_at)}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-400">Email Verified</p>
                <p className="text-white flex items-center gap-1">
                  {user.email_verified ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      Verified
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                      Not Verified
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Login Activity */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Login Activity
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">First Login</p>
                <p className="text-white">{formatDate(user.first_login_at)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Last Login</p>
                <p className={`font-medium ${lastLoginInfo.className}`}>
                  {lastLoginInfo.text}
                </p>
                {user.last_login_at && (
                  <p className="text-xs text-gray-500">{formatDate(user.last_login_at)}</p>
                )}
              </div>
              
              {user.login_count !== undefined && (
                <div>
                  <p className="text-sm text-gray-400">Total Logins</p>
                  <p className="text-white">{user.login_count}</p>
                </div>
              )}
              
              {user.last_activity_at && (
                <div>
                  <p className="text-sm text-gray-400">Last Activity</p>
                  <p className="text-white">
                    {formatDistanceToNow(new Date(user.last_activity_at), { addSuffix: true })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            {canResendInvitation && onResendInvitation && (
              <Button
                onClick={() => onResendInvitation(user.id)}
                variant="outline"
                className="border-yellow-700 text-yellow-400 hover:bg-yellow-900/20"
              >
                <Send className="mr-2 h-4 w-4" />
                Resend Invitation
              </Button>
            )}
            
            {canSuspend && onSuspendUser && (
              <Button
                onClick={() => onSuspendUser(user.id)}
                variant="outline"
                className="border-red-700 text-red-400 hover:bg-red-900/20"
              >
                <Ban className="mr-2 h-4 w-4" />
                Suspend User
              </Button>
            )}
            
            {canActivate && onActivateUser && (
              <Button
                onClick={() => onActivateUser(user.id)}
                variant="outline"
                className="border-emerald-700 text-emerald-400 hover:bg-emerald-900/20"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Activate User
              </Button>
            )}
            
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}