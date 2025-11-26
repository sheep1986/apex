import { useAuth } from '@clerk/clerk-react';
import { AlertTriangle } from 'lucide-react';

export default function Unauthorized() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Account Not Found
        </h1>

        <p className="text-gray-600 text-center mb-6">
          Your account is not authorized to access this platform. Please contact your administrator to set up your account.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            What can you do?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Contact your organization administrator</li>
            <li>Request account creation in the database</li>
            <li>Verify you're using the correct email address</li>
          </ul>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full bg-gray-900 text-white rounded-md py-2 px-4 hover:bg-gray-800 transition-colors"
        >
          Sign Out
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
