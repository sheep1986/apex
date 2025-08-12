import { useNavigate } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';

export const TestAuthSimple = () => {
  const navigate = useNavigate();
  const showNewAuth = import.meta.env.VITE_USE_NEW_AUTH === 'true';
  
  if (!showNewAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-4">New Auth System Disabled</h1>
          <p className="text-gray-400">
            Set VITE_USE_NEW_AUTH=true in your environment to enable.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Test New Auth</h1>
          <p className="text-gray-400">Testing Clerk integration directly</p>
        </div>
        
        <div className="bg-gray-900/80 backdrop-blur-md rounded-lg shadow-2xl border border-gray-800 p-6">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                formButtonPrimary: "bg-gradient-to-r from-emerald-500 to-pink-500 hover:from-emerald-600 hover:to-pink-600 text-sm normal-case",
                formFieldLabel: "text-gray-300",
                formFieldInput: "bg-gray-800 border-gray-700 text-white",
                footerActionLink: "text-emerald-400 hover:text-emerald-300",
              }
            }}
            routing="path"
            path="/test-auth-simple"
            signUpUrl="/signup"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          />
        </div>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};