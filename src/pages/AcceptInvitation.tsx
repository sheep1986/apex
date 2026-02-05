import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail, Lock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/hooks/auth';
import { SignUpButton } from '@clerk/clerk-react';

interface InvitationDetails {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationName: string;
  expiresAt: string;
}

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (token) {
      validateInvitation();
    } else {
      setError('No invitation token provided');
      setLoading(false);
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      // Remove the /api prefix since it's already in the invitations router
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/invitations/validate/${token}`
      );
      
      const data = await response.json();
      console.log('Invitation validation response:', data);
      
      if (!response.ok || !data.valid) {
        setError(data.error || 'Invalid or expired invitation');
      } else {
        setInvitation(data.invitation);
      }
    } catch (err) {
      console.error('Error validating invitation:', err);
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  
  // Check if user just signed up and we need to link their account
  useEffect(() => {
    if (isSignedIn && user && invitation && token) {
      linkUserToOrganization();
    }
  }, [isSignedIn, user, invitation, token]);
  
  const linkUserToOrganization = async () => {
    try {
      setSubmitting(true);
      const authToken = await getToken();
      
      // Call the accept-clerk endpoint to link the user
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/invitations/accept-clerk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            token,
            clerkUserId: user.clerkId || user.id,
          }),
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'Your account has been linked. Redirecting to dashboard...',
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to link account');
      }
    } catch (err) {
      console.error('Error linking account:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to link account',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptInvitation = async () => {
    // This is now just a placeholder since the SignUpButton handles the signup
    console.log('Signup will be handled by Clerk SignUpButton');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <Button
                onClick={() => navigate('/login')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-white">
            Join {invitation.organizationName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-emerald-900/20 border-emerald-700">
            <Mail className="h-4 w-4 text-emerald-500" />
            <AlertDescription className="text-emerald-200">
              You've been invited to join as a {invitation.role.replace('client_', '').replace('_', ' ')}.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Your Information</Label>
              <div className="rounded-lg bg-gray-800 p-3 space-y-1">
                <p className="text-white">
                  <User className="inline h-4 w-4 mr-2 text-gray-400" />
                  {invitation.firstName} {invitation.lastName}
                </p>
                <p className="text-gray-400 text-sm">{invitation.email}</p>
              </div>
            </div>

            {!isSignedIn && (
              <Alert className="bg-blue-900/20 border-blue-700">
                <AlertDescription className="text-blue-200">
                  Click "Sign Up & Join" below to create your account with Clerk. You'll be redirected back here after signup.
                </AlertDescription>
              </Alert>
            )}
            
            {isSignedIn && (
              <Alert className="bg-green-900/20 border-green-700">
                <AlertDescription className="text-green-200">
                  Welcome back! Click "Complete Setup" to link your account to {invitation.organizationName}.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-gray-400">
              This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            {!isSignedIn ? (
              <SignUpButton 
                mode="modal"
                afterSignUpUrl={`/accept-invitation?token=${token}`}
                signUpForceRedirectUrl={`/accept-invitation?token=${token}`}
              >
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Sign Up & Join
                </Button>
              </SignUpButton>
            ) : submitting ? (
              <Button disabled className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Linking Account...
              </Button>
            ) : (
              <Button
                onClick={() => linkUserToOrganization()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}