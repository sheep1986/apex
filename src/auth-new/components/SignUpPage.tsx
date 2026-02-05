import { SignUp } from '@clerk/clerk-react';

const SignUpPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join Trinity Labs AI</h1>
          <p className="text-gray-400">Create your account to start AI-powered calling</p>
        </div>
        
        <div className="bg-gray-900/80 backdrop-blur-md rounded-lg shadow-2xl border border-gray-800 p-6">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                formButtonPrimary: "bg-gradient-to-r from-emerald-500 to-pink-500 hover:from-emerald-600 hover:to-pink-600 text-sm normal-case",
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
            path="/auth-new/sign-up"
            signInUrl="/auth-new/sign-in"
            fallbackRedirectUrl="/auth-new/redirect"
            forceRedirectUrl="/auth-new/redirect"
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
};

export default SignUpPage;