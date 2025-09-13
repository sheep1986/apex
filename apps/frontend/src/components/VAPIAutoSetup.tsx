import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, Zap, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api-client';

interface VAPIAutoSetupProps {
  organizationId: string;
  onComplete?: () => void;
}

export const VAPIAutoSetup: React.FC<VAPIAutoSetupProps> = ({ organizationId, onComplete }) => {
  const [vapiKey, setVapiKey] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [status, setStatus] = useState<'idle' | 'configuring' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleAutoSetup = async () => {
    if (!vapiKey.trim()) {
      setError('Please enter your VAPI API key');
      return;
    }

    setIsConfiguring(true);
    setStatus('configuring');
    setError('');

    try {
      const response = await api.post('/vapi-auto-setup', {
        organizationId,
        vapiApiKey: vapiKey
      });

      setResult(response);
      setStatus('success');
      
      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to configure VAPI');
      setStatus('error');
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          One-Click VAPI Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'idle' && (
          <>
            <Alert>
              <AlertDescription>
                Enter your VAPI API key below and we'll automatically:
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Configure ALL your assistants with our webhook</li>
                  <li>Import your phone numbers</li>
                  <li>Enable call tracking and lead capture</li>
                  <li>Set up real-time analytics</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">VAPI API Key</label>
              <Input
                type="password"
                placeholder="da8956d4-0508-474e-bd96-..."
                value={vapiKey}
                onChange={(e) => setVapiKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Find this in your VAPI dashboard under API Keys
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
              disabled={!vapiKey.trim()}
              size="lg"
              className="w-full"
            >
              Configure My VAPI Account
            </Button>
          </>
        )}

        {status === 'configuring' && (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Configuring your VAPI assistants...
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
                VAPI account configured successfully!
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
              Start Using VAPI
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