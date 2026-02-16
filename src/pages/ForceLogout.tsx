import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase-client';

export default function ForceLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    const forceLogout = async () => {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Force sign out from Supabase
      await supabase.auth.signOut();
      
      // Wait a bit to ensure cleanup
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    };
    
    forceLogout();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Logging out...</div>
    </div>
  );
}