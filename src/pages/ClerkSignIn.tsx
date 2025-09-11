import { SignIn } from '@clerk/clerk-react';

export default function ClerkSignIn() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Apex AI</h1>
          <p className="text-gray-400">Sign in to access your platform</p>
        </div>
        <SignIn 
          fallbackRedirectUrl="/auth/redirect"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-gray-900 border border-gray-800 shadow-xl",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton: "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
              formFieldLabel: "text-gray-300",
              formFieldInput: "bg-gray-800 border-gray-700 text-white",
              footerActionLink: "text-emerald-500 hover:text-emerald-400",
              identityPreviewText: "text-gray-300",
              identityPreviewEditButton: "text-emerald-500 hover:text-emerald-400",
              formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white",
              dividerLine: "bg-gray-800",
              dividerText: "text-gray-500",
              formFieldInputShowPasswordButton: "text-gray-400 hover:text-gray-300",
              otpCodeFieldInput: "bg-gray-800 border-gray-700 text-white",
              formResendCodeLink: "text-emerald-500 hover:text-emerald-400",
            },
            variables: {
              colorPrimary: "#10b981",
              colorBackground: "#111827",
              colorInputBackground: "#1f2937",
              colorInputText: "#ffffff",
              colorText: "#ffffff",
              colorTextSecondary: "#9ca3af",
              colorNeutral: "#374151",
              borderRadius: "0.5rem",
            }
          }}
        />
      </div>
    </div>
  );
}