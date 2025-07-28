import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestAuth() {
  const { user, getToken, isSignedIn } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [vapiApiKey, setVapiApiKey] = useState('');
  const [vapiPrivateKey, setVapiPrivateKey] = useState('');

  useEffect(() => {
    // Get token on load
    const fetchToken = async () => {
      const t = await getToken();
      setToken(t);
    };
    fetchToken();
  }, [getToken]);

  const testSetupEndpoint = async () => {
    setLoading(true);
    try {
      const currentToken = await getToken();
      console.log('🔑 Testing with token:', currentToken ? 'Present' : 'None');
      console.log('🔑 Token type:', currentToken?.substring(0, 20));

      const testData = {
        businessName: 'Test Company ' + Date.now(),
        adminEmail: user?.email || 'test@example.com',
        adminFirstName: user?.firstName || 'Test',
        adminLastName: user?.lastName || 'User',
        teamSize: '0-5',
        addTeamMembers: false,
        teamMembers: [],
        vapiApiKey: vapiApiKey,
        vapiPrivateKey: vapiPrivateKey
      };

      console.log('📤 Sending test data:', testData);

      const response = await fetch('http://localhost:3001/api/organization-setup/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': currentToken ? `Bearer ${currentToken}` : ''
        },
        body: JSON.stringify(testData)
      });

      console.log('📥 Response status:', response.status);
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        result = { error: 'Failed to parse response', rawText: await response.text() };
      }

      setTestResult({
        status: response.status,
        ok: response.ok,
        data: result
      });

    } catch (error: any) {
      console.error('❌ Test endpoint error:', error);
      setTestResult({
        error: true,
        message: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Auth Test Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Auth Status</h3>
              <p className="text-white">Signed In: {isSignedIn ? 'Yes' : 'No'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400">User Info</h3>
              <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400">Token</h3>
              <p className="text-xs text-gray-300 break-all">
                {token ? `${token.substring(0, 50)}...` : 'No token'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="vapiPrivateKey" className="block text-sm font-medium text-gray-400 mb-1">
                  VAPI Private Key (Bearer Token)
                </label>
                <input
                  id="vapiPrivateKey"
                  type="password"
                  value={vapiPrivateKey}
                  onChange={(e) => setVapiPrivateKey(e.target.value)}
                  placeholder="Enter your VAPI private key"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="vapiApiKey" className="block text-sm font-medium text-gray-400 mb-1">
                  VAPI Public Key
                </label>
                <input
                  id="vapiApiKey"
                  type="text"
                  value={vapiApiKey}
                  onChange={(e) => setVapiApiKey(e.target.value)}
                  placeholder="Enter your VAPI public key"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              {(vapiApiKey || vapiPrivateKey) && (
                <div className="text-sm text-gray-400">
                  <p>Private Key: {vapiPrivateKey ? '••••••••' : 'Not set'}</p>
                  <p>Public Key: {vapiApiKey ? `${vapiApiKey.substring(0, 10)}...` : 'Not set'}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={testSetupEndpoint}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? 'Testing...' : 'Test Organization Setup Endpoint'}
              </Button>
              
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:3001/api/organization-setup/health');
                    const data = await response.json();
                    alert('Health check: ' + JSON.stringify(data));
                  } catch (error: any) {
                    alert('Health check failed: ' + error.message);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Test Health Check
              </Button>
            </div>

            {testResult && (
              <div>
                <h3 className="text-sm font-medium text-gray-400">Test Result</h3>
                <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}