import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function QuickAuthRedirect() {
  const { user: clerkUser, isLoaded } = useClerkUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!clerkUser) {
      navigate('/login', { replace: true });
      return;
    }

    const email = clerkUser.primaryEmailAddress?.emailAddress;
    console.log('QuickAuthRedirect - User email:', email);
    
    // Quick role determination based on email
    if (email === 'sean@artificialmedia.co.uk') {
      console.log('Redirecting to platform (owner)');
      navigate('/platform', { replace: true });
    } else if (email === 'seanwentz99@gmail.com') {
      console.log('Redirecting to dashboard (client admin)');
      navigate('/dashboard', { replace: true });
    } else {
      // Default to dashboard for other users
      console.log('Redirecting to dashboard (default)');
      navigate('/dashboard', { replace: true });
    }
  }, [isLoaded, clerkUser, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Redirecting to your dashboard...</h2>
      </div>
    </div>
  );
}