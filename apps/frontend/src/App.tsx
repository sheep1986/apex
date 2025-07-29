import React, { useEffect, useState } from 'react';
import { ClerkProvider, SignedIn, SignedOut, SignIn, useUser } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MzEwMTMsImV4cCI6MjA1MjQwNzAxM30.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MzEwMTMsImV4cCI6MjA1MjQwNzAxM30';
const supabase = createClient(supabaseUrl, supabaseKey);

// Multi-tenant redirect component
function AuthenticatedRedirect() {
          const { user } = useUser();
          const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
              if (user && !isRedirecting) {
                            handleUserRedirect();
              }
  }, [user, isRedirecting]);

  const handleUserRedirect = async () => {
              setIsRedirecting(true);

              try {
                            // Check if user exists in Supabase
                const { data: existingUser, error: fetchError } = await supabase
                              .from('users')
                              .select('*, organizations(*)')
                              .eq('clerk_id', user.id)
                              .single();

                if (fetchError && fetchError.code !== 'PGRST116') {
                                console.error('Error fetching user:', fetchError);
                                return;
                }

                let userData = existingUser;

                // Create user if doesn't exist
                if (!existingUser) {
                                const { data: newUser, error: createError } = await supabase
                                  .from('users')
                                  .insert({
                                                      clerk_id: user.id,
                                                      email: user.emailAddresses[0]?.emailAddress,
                                                      first_name: user.firstName,
                                                      last_name: user.lastName,
                                                      organization_id: '00000000-0000-0000-0000-000000000000' // Default to platform
                                  })
                                  .select('*, organizations(*)')
                                  .single();

                              if (createError) {
                                                console.error('Error creating user:', createError);
                                                return;
                              }
                                userData = newUser;
                }

                // Determine redirect URL based on organization
                let redirectUrl = '/dashboard'; // Default fallback

                if (userData.organizations) {
                                const orgType = userData.organizations.type;
                                const orgSlug = userData.organizations.slug;

                              switch (orgType) {
                                      case 'platform':
                                                          redirectUrl = '/owner-portal';
                                                          break;
                                      case 'agency':
                                                          redirectUrl = `/agency/${orgSlug}/dashboard`;
                                                          break;
                                      default:
                                                          redirectUrl = '/dashboard';
                              }
                }

                // Redirect to appropriate portal
                window.location.href = redirectUrl;

              } catch (error) {
                            console.error('Error in user redirect:', error);
                            // Fallback to dashboard
                window.location.href = '/dashboard';
              }
  };

  if (isRedirecting) {
              return (
                            <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
                                    <div className="text-center">
                                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>div>
                                              <h2 className="text-xl font-semibold mb-2">Authentication Successful</h2>h2>
                                              <p className="text-gray-400">Redirecting to your portal...</p>p>
                                            </div>div>
                                  </div>div>
                          );
  }
        
          return null;
}

function App() {
          return (
                      <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
                            <div className="min-h-screen bg-gray-950 text-white">
                                    <SignedOut>
                                              <div className="min-h-screen flex items-center justify-center">
                                                          <div className="w-full max-w-md">
                                                                        <div className="text-center mb-8">
                                                                                        <h1 className="text-3xl font-bold text-white mb-2">Welcome to Apex AI</h1>h1>
                                                                                        <p className="text-gray-400">Sign in to access your portal</p>p>
                                                                                      </div>div>
                                                                        <SignIn 
                                                                                                appearance={{
                                                                                                                          elements: {
                                                                                                                                                      rootBox: "mx-auto",
                                                                                                                                                      card: "bg-gray-900 border border-gray-800",
                                                                                                                                  }
                                                                                                        }}
                                                                                                routing="path"
                                                                                                path="/login"
                                                                                                signUpUrl="/signup"
                                                                                              />
                                                                      </div>div>
                                                        </div>div>
                                            </SignedOut>SignedOut>
                                    
                                    <SignedIn>
                                              <AuthenticatedRedirect />
                                            </SignedIn>SignedIn>
                                  </div>div>
                          </ClerkProvider>ClerkProvider>
                    );
}

export default App;</div>
