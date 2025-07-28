import React from 'react';
import { ClerkProvider, SignIn } from '@clerk/clerk-react';

function App() {
      return (
              <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
                    <div className="min-h-screen bg-gray-950 text-white">
                            <SignIn 
                                          fallbackRedirectUrl="/dashboard"
                                          forceRedirectUrl="/dashboard"
                                          routing="path"
                                          path="/login"
                                          signUpUrl="/signup"
                                        />
                          </div>div>
                  </ClerkProvider>ClerkProvider>
            );
}

export default App;</ClerkProvider>
