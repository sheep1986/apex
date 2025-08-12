import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase-client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export const DebugSupabaseSession = () => {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    setLoading(true);
    try {
      // Method 1: Direct from supabase client
      const { data: { session: directSession }, error } = await supabase.auth.getSession();
      
      // Method 2: Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      // Method 3: Check localStorage
      const localStorage_sb_token = localStorage.getItem('sb-twigokrtbvigiqnaybfy-auth-token');
      
      setSessionInfo({
        directSession,
        currentUser,
        localStorage_sb_token: localStorage_sb_token ? JSON.parse(localStorage_sb_token) : null,
        error,
        userError,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error checking session:', e);
      setSessionInfo({ error: e.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    checkSession();
  }, []);

  const testApiCall = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/platform-analytics/overview', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || 'NO_TOKEN'}`
        }
      });
      const data = await response.json();
      console.log('API Response:', data);
      alert(`API Response: ${response.status} - ${JSON.stringify(data).substring(0, 100)}...`);
    } catch (e) {
      console.error('API call failed:', e);
      alert(`API call failed: ${e.message}`);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Supabase Session Debug</CardTitle>
          <Button onClick={checkSession} className="w-fit">Refresh Session Info</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Direct Session from Supabase:</h3>
                <pre className="bg-gray-800 p-4 rounded text-xs text-gray-300 overflow-auto">
                  {JSON.stringify(sessionInfo?.directSession, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Current User from Supabase:</h3>
                <pre className="bg-gray-800 p-4 rounded text-xs text-gray-300 overflow-auto">
                  {JSON.stringify(sessionInfo?.currentUser, null, 2)}
                </pre>
              </div>


              <div>
                <h3 className="text-lg font-semibold text-white mb-2">LocalStorage Token:</h3>
                <pre className="bg-gray-800 p-4 rounded text-xs text-gray-300 overflow-auto">
                  {JSON.stringify(sessionInfo?.localStorage_sb_token, null, 2)}
                </pre>
              </div>

              <div className="pt-4">
                <Button onClick={testApiCall} variant="outline">
                  Test API Call with Session Token
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};