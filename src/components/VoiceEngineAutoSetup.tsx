import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { AlertCircle, CheckCircle, Loader2, Zap } from 'lucide-react';
import React, { useState } from 'react';

interface VoiceEngineAutoSetupProps {
  onComplete: (voiceEngineKey: string) => void;
  organizationId: string;
}

export const VoiceEngineAutoSetup: React.FC<VoiceEngineAutoSetupProps> = ({
  onComplete,
  organizationId,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'configuring' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAutoSetup = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Voice Engine API key');
      return;
    }

    setLoading(true);
    setStatus('configuring');
    setError(null);

    try {
      // Call the backend to configure the voice engine
      await api.post('/voice-engine-auto-setup', {
        voiceEngineApiKey: apiKey
      });

      setStatus('success');
      
      if (onComplete) {
        onComplete(apiKey);
      }
      
      setApiKey(''); // Clear security sensitive data
    } catch (err: any) {
      console.error('Setup failed:', err);
      setError(err.response?.data?.error || 'Failed to configure voice engine. Please check your key and try again.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          One-Click Voice Engine Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'idle' && (
          <>
            <Alert>
              <AlertDescription>
                Enter your Voice Engine API key below and we'll automatically:
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Configure ALL your assistants with our webhook</li>
                  <li>Import your phone numbers</li>
                  <li>Enable call tracking and lead capture</li>
                  <li>Set up real-time analytics</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">Voice Engine API Key</label>
              <Input
                type="password"
                placeholder="da8956d4-0508-474e-bd96-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Find this in your provider dashboard under API Keys
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleAutoSetup}
              disabled={!apiKey.trim()}
              size="lg"
              className="w-full"
            >
              Configure My Voice Engine
            </Button>
          </>
        )}

        {status === 'configuring' && (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500" />
            <p className="text-sm text-muted-foreground">
              Configuring your Voice Engine assistants...
            </p>
            <p className="text-xs text-muted-foreground">
              This usually takes 10-30 seconds
            </p>
          </div>
        )}

        {status === 'success' && result && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Voice Engine configured successfully!
              </AlertDescription>
            </Alert>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <h4 className="font-medium">Setup Complete:</h4>
              <ul className="text-sm space-y-1">
                <li>✅ {result.stats.assistantsConfigured} assistants configured</li>
                <li>✅ {result.stats.phoneNumbersImported} phone numbers imported</li>
                <li>✅ Webhook URL: <code className="text-xs bg-background px-1 py-0.5 rounded">
                  {result.stats.webhookUrl}
                </code></li>
              </ul>
            </div>

            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Start Using Voice Engine
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => {
                setStatus('idle');
                setError('');
              }}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};