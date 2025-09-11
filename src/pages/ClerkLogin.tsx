import { SignIn, useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ClerkLogin() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already signed in, redirect immediately
    if (isLoaded && isSignedIn) {
      // Navigate to the actual platform route with layout
      window.location.href = '/platform';
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Don't render anything until Clerk is loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // If signed in, don't show the sign-in form
  if (isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Apex AI</h1>
          <p className="text-gray-400">Sign in to access your AI calling platform</p>
        </div>
        
        <div className="bg-gray-900 rounded-lg shadow-xl p-6 border border-gray-800">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-sm normal-case',
                card: 'shadow-none bg-transparent',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                formFieldInput: 'bg-gray-800 border-gray-700 text-white',
                footerActionLink: 'text-emerald-500 hover:text-emerald-400',
                identityPreviewText: 'text-gray-300',
                identityPreviewEditButtonIcon: 'text-gray-400',
                formFieldLabel: 'text-gray-300',
                dividerLine: 'bg-gray-700',
                dividerText: 'text-gray-400',
                socialButtonsBlockButton: 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white',
                socialButtonsBlockButtonText: 'text-white',
                formHeaderTitle: 'text-white',
                formHeaderSubtitle: 'text-gray-400',
                alertText: 'text-white',
                footerAction: 'text-gray-400',
                footerActionText: 'text-gray-400',
                footer: 'hidden'
              },
              layout: {
                socialButtonsVariant: 'blockButton',
                showOptionalFields: true
              }
            }}
            fallbackRedirectUrl="/platform"
            forceRedirectUrl="/platform"
            signUpUrl="/signup"
          />
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Secure authentication powered by Clerk
          </p>
        </div>
      </div>
    </div>
  );
}