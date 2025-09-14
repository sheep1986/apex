import React from 'react';
import { useUser, useAuth, SignInButton, SignOutButton } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const ClerkTest: React.FC = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const testBackendAuth = async () => {
    try {
      const token = await getToken();
      console.log('Clerk Token:', token);

      const response = await fetch('http://localhost:3001/api/health', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Backend Response:', data);
      alert(`Backend test ${response.ok ? 'successful' : 'failed'}: ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('Backend test failed:', error);
      alert('Backend test failed: ' + error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Clerk Authentication Test</h1>

      <div className="grid gap-6">
        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Current Clerk authentication state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span>Status:</span>
                <Badge variant={isSignedIn ? 'default' : 'secondary'}>
                  {isSignedIn ? 'Signed In' : 'Signed Out'}
                </Badge>
              </div>

              {isSignedIn ? (
                <div className="space-y-2">
                  <p>
                    <strong>User ID:</strong> {user?.id}
                  </p>
                  <p>
                    <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}
                  </p>
                  <p>
                    <strong>First Name:</strong> {user?.firstName}
                  </p>
                  <p>
                    <strong>Last Name:</strong> {user?.lastName}
                  </p>
                  <p>
                    <strong>Created:</strong> {user?.createdAt?.toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p>Please sign in to see user details</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Authentication Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Actions</CardTitle>
            <CardDescription>Sign in or out using Clerk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {isSignedIn ? (
                <>
                  <SignOutButton>
                    <Button variant="outline">Sign Out</Button>
                  </SignOutButton>
                  <Button onClick={testBackendAuth}>Test Backend Auth</Button>
                </>
              ) : (
                <SignInButton>
                  <Button>Sign In</Button>
                </SignInButton>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
            <CardDescription>Clerk and environment configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>Clerk Publishable Key:</span>
                <Badge variant="outline">
                  {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? '✓ Configured' : '✗ Missing'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>API URL:</span>
                <Badge variant="outline">
                  {import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>Environment:</span>
                <Badge variant="outline">
                  {import.meta.env.DEV ? 'Development' : 'Production'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw User Object */}
        {isSignedIn && (
          <Card>
            <CardHeader>
              <CardTitle>Raw User Object</CardTitle>
              <CardDescription>Complete user data from Clerk</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-md bg-gray-100 p-4 text-sm">
                {JSON.stringify(user, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClerkTest;
