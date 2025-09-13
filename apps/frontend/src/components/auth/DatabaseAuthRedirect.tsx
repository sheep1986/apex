import { useUser } from '@/hooks/auth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function DatabaseAuthRedirect() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    console.log('DatabaseAuthRedirect - User role from DB:', user.role);
    
    // Route based on database role
    if (user.role === 'platform_owner') {
      console.log('Redirecting to platform (owner)');
      navigate('/platform', { replace: true });
    } else if (user.role === 'user_admin' || user.role === 'client_admin') {
      console.log('Redirecting to dashboard (admin)');
      navigate('/dashboard', { replace: true });
    } else {
      // Default to dashboard for other users
      console.log('Redirecting to dashboard (default)');
      navigate('/dashboard', { replace: true });
    }
  }, [isLoaded, user, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading user data...</p>
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