import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Key,
  Phone,
  Bot,
  Settings,
  Database,
  TestTube,
} from 'lucide-react';

interface VAPIDebugInfo {
  organizationId: string;
  organizationName: string;
  vapiSettings: {
    hasVapiApiKey: boolean;
    vapiApiKeyMasked: string | null;
    vapiAssistantId: string | null;
    vapiPhoneNumberId: string | null;
    vapiWebhookUrl: string | null;
    hasSettingsVapi: boolean;
    hasVapiSettingsColumn: boolean;
    vapiSettingsContent: string | null;
    hasOrgSettingsRecord: boolean;
    orgSettingsCount: number;
  };
  vapiServiceStatus: {
    available: boolean;
    source: string | null;
    error: string | null;
  };
  vapiConfig: {
    hasCredentials: boolean;
    apiKey: string | null;
    assistantId: string | null;
    phoneNumberId: string | null;
    webhookUrl: string | null;
    configuredAt: string | null;
    lastTested: string | null;
    testResults: any;
  };
  apiTestResult: {
    tested: boolean;
    success: boolean;
    error: string | null;
    assistantsCount: number;
    phoneNumbersCount: number;
  };
  localData: {
    vapiAssistantsCount: number;
    vapiAssistants: any[];
  };
  recommendations: string[];
}

export default function VAPIDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<VAPIDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testApiKey, setTestApiKey] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const loadDebugInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/debug-vapi/settings');
      setDebugInfo(response.data);
    } catch (err: any) {
      console.error('Failed to load VAPI debug info:', err);
      setError(err.response?.data?.error || 'Failed to load debug information');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!testApiKey.trim()) {
      setError('Please enter an API key to test');
      return;
    }

    setTestingConnection(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await apiClient.post('/debug-vapi/test-connection', {
        apiKey: testApiKey,
      });
      setTestResult(response.data);
    } catch (err: any) {
      console.error('Failed to test VAPI connection:', err);
      setError(err.response?.data?.error || 'Failed to test connection');
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  if (loading && !debugInfo) {
    return (
      <Card className="border-gray-800 bg-[#111]">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
            <p className="text-gray-400">Loading VAPI debug information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-gray-800 bg-[#111]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              VAPI Debug Information
            </span>
            <Button onClick={loadDebugInfo} disabled={loading} size="sm" variant="outline">
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-900 bg-red-900/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {debugInfo && (
            <>
              {/* Organization Info */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-400">Organization</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Name</span>
                    <span className="text-sm text-white">{debugInfo.organizationName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">ID</span>
                    <code className="rounded bg-gray-900 px-2 py-1 text-xs">
                      {debugInfo.organizationId}
                    </code>
                  </div>
                </div>
              </div>

              {/* VAPI Service Status */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-400">VAPI Service Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {debugInfo.vapiServiceStatus.available ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      Service{' '}
                      {debugInfo.vapiServiceStatus.available ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                  {debugInfo.vapiServiceStatus.source && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Credentials Source</span>
                      <Badge variant="outline" className="text-xs">
                        {debugInfo.vapiServiceStatus.source}
                      </Badge>
                    </div>
                  )}
                  {debugInfo.vapiServiceStatus.error && (
                    <Alert className="border-red-900 bg-red-900/20">
                      <AlertDescription className="text-xs">
                        {debugInfo.vapiServiceStatus.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Database Settings */}
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-400">
                  <Database className="h-4 w-4" />
                  Database Settings
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    {debugInfo.vapiSettings.hasVapiApiKey ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-gray-500" />
                    )}
                    <span className="text-xs text-gray-500">vapi_api_key column</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {debugInfo.vapiSettings.hasSettingsVapi ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-gray-500" />
                    )}
                    <span className="text-xs text-gray-500">settings.vapi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {debugInfo.vapiSettings.hasVapiSettingsColumn ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-gray-500" />
                    )}
                    <span className="text-xs text-gray-500">vapi_settings column</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {debugInfo.vapiSettings.hasOrgSettingsRecord ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-gray-500" />
                    )}
                    <span className="text-xs text-gray-500">organization_settings</span>
                  </div>
                </div>
                {debugInfo.vapiSettings.vapiApiKeyMasked && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-500">API Key</span>
                    <code className="rounded bg-gray-900 px-2 py-1 text-xs">
                      {debugInfo.vapiSettings.vapiApiKeyMasked}
                    </code>
                  </div>
                )}
              </div>

              {/* API Test Results */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-400">API Test Results</h3>
                {debugInfo.apiTestResult.tested ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {debugInfo.apiTestResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        API Connection {debugInfo.apiTestResult.success ? 'Successful' : 'Failed'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {debugInfo.apiTestResult.assistantsCount} Assistants
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {debugInfo.apiTestResult.phoneNumbersCount} Phone Numbers
                        </span>
                      </div>
                    </div>
                    {debugInfo.apiTestResult.error && (
                      <Alert className="border-red-900 bg-red-900/20">
                        <AlertDescription className="text-xs">
                          {debugInfo.apiTestResult.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">API not tested</p>
                )}
              </div>

              {/* Recommendations */}
              {debugInfo.recommendations.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-400">Recommendations</h3>
                  <div className="space-y-2">
                    {debugInfo.recommendations.map((rec, index) => (
                      <Alert key={index} className="border-yellow-900 bg-yellow-900/20">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">{rec}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Test Connection Card */}
      <Card className="border-gray-800 bg-[#111]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test VAPI Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-api-key">VAPI API Key</Label>
            <Input
              id="test-api-key"
              type="password"
              placeholder="Enter VAPI API key to test"
              value={testApiKey}
              onChange={(e) => setTestApiKey(e.target.value)}
              className="border-gray-800 bg-gray-900"
            />
          </div>

          <Button
            onClick={testConnection}
            disabled={testingConnection || !testApiKey.trim()}
            className="w-full"
          >
            {testingConnection ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>

          {testResult && (
            <Alert
              className={
                testResult.success
                  ? 'border-green-900 bg-green-900/20'
                  : 'border-red-900 bg-red-900/20'
              }
            >
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Connection {testResult.success ? 'Successful' : 'Failed'}</span>
                  </div>
                  {testResult.results && (
                    <div className="mt-2 space-y-1 text-xs">
                      <div>
                        Assistants:{' '}
                        {testResult.results.assistants.success
                          ? `✓ ${testResult.results.assistants.count} found`
                          : `✗ ${testResult.results.assistants.error}`}
                      </div>
                      <div>
                        Phone Numbers:{' '}
                        {testResult.results.phoneNumbers.success
                          ? `✓ ${testResult.results.phoneNumbers.count} found`
                          : `✗ ${testResult.results.phoneNumbers.error}`}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
