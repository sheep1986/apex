import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { SignUp, useAuth } from '@clerk/clerk-react';

export const EnhancedSignUpPage: React.FC = () => {
  const { isSignedIn } = useAuth();
  
  // Redirect if already signed in
  if (isSignedIn) {
    return <Navigate to="/portal" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-gray-900 border border-gray-800 shadow-xl",
              headerTitle: "text-white text-2xl",
              headerSubtitle: "text-gray-400",
              formButtonPrimary: "bg-gradient-to-r from-emerald-500 to-pink-500 hover:from-emerald-600 hover:to-pink-600",
              formFieldLabel: "text-gray-300",
              formFieldInput: "bg-gray-800 border-gray-700 text-white",
              formFieldInputShowPasswordButton: "text-gray-400 hover:text-gray-300",
              footerActionLink: "text-emerald-400 hover:text-emerald-300",
              identityPreviewText: "text-gray-300",
              identityPreviewEditButton: "text-emerald-400 hover:text-emerald-300",
              alert: "bg-red-500/10 border-red-500",
              alertText: "text-red-400",
              dividerLine: "bg-gray-700",
              dividerText: "text-gray-400",
              socialButtonsBlockButton: "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700",
              socialButtonsBlockButtonText: "text-gray-300",
              formResendCodeLink: "text-emerald-400 hover:text-emerald-300",
            }
          }}
          routing="path"
          path="/signup"
          signInUrl="/login"
          fallbackRedirectUrl="/portal"
          forceRedirectUrl="/portal"
        />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-emerald-400 hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};