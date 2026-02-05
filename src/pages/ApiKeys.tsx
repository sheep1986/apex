import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/auth';
import { useToast } from '@/hooks/use-toast';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Copy,
    Download,
    Edit2,
    Eye,
    EyeOff,
    Key,
    MoreVertical,
    Plus,
    RefreshCw,
    Shield,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  lastUsed: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
  permissions: string[];
  status: 'active' | 'expired' | 'revoked';
  usage: {
    calls: number;
    lastCall: Date | null;
  };
}

export default function ApiKeys() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read']);
  const [newKeyExpiry, setNewKeyExpiry] = useState('never');
  const [generatedKey, setGeneratedKey] = useState('');
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/user/api-keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch API keys',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the API key',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions,
          expiry: newKeyExpiry,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedKey(data.key);
        setShowGeneratedKey(true);
        setNewKeyName('');
        setNewKeyPermissions(['read']);
        setNewKeyExpiry('never');
        fetchApiKeys();
        toast({
          title: 'API Key Created',
          description: 'Your new API key has been generated successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchApiKeys();
        toast({
          title: 'API Key Revoked',
          description: 'The API key has been revoked successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke API key',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'expired':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'revoked':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-gray-400">Manage your API keys and access tokens</p>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                Create New Key
              </Button>
            </DialogTrigger>
            <DialogContent className="border-gray-700 bg-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Create New API Key</DialogTitle>
                <DialogDescription>
                  Generate a new API key for accessing the Trinity Labs AI platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Key Name</Label>
                  <Input
                    id="name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production App"
                    className="border-gray-600 bg-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="space-y-2">
                    {['read', 'write', 'delete'].map((permission) => (
                      <label key={permission} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewKeyPermissions([...newKeyPermissions, permission]);
                            } else {
                              setNewKeyPermissions(
                                newKeyPermissions.filter((p) => p !== permission)
                              );
                            }
                          }}
                          className="rounded border-gray-600 bg-gray-700 text-emerald-600"
                        />
                        <span className="capitalize text-white">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiration</Label>
                  <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                    <SelectTrigger className="border-gray-600 bg-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={createApiKey}
                  disabled={isCreating}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isCreating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      Creating...
                    </>
                  ) : (
                    'Create API Key'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Generated Key Alert */}
        {showGeneratedKey && (
          <Alert className="mb-6 border-emerald-700 bg-emerald-900/20">
            <Key className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-white">Your new API key has been created!</p>
                <p className="text-sm text-gray-300">
                  Make sure to copy it now. You won't be able to see it again.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 rounded bg-gray-800 p-2 font-mono text-sm text-white">
                    {generatedKey}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedKey)}
                    className="border-gray-600"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowGeneratedKey(false)}
                  className="mt-2"
                >
                  Close
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="border-gray-700 bg-gray-800">
            <TabsTrigger value="active">Active Keys</TabsTrigger>
            <TabsTrigger value="all">All Keys</TabsTrigger>
            <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          </TabsList>

          {/* Active Keys Tab */}
          <TabsContent value="active" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
              </div>
            ) : (
              apiKeys
                .filter((key) => key.status === 'active')
                .map((apiKey) => (
                  <Card key={apiKey.id} className="border-gray-700 bg-gray-800">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-white">{apiKey.name}</h3>
                            <Badge className={getStatusColor(apiKey.status)}>{apiKey.status}</Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Created {formatDate(apiKey.createdAt)}</span>
                            </div>
                            {apiKey.lastUsed && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Last used {formatDate(apiKey.lastUsed)}</span>
                              </div>
                            )}
                            {apiKey.expiresAt && (
                              <div className="flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                <span>Expires {formatDate(apiKey.expiresAt)}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <code className="rounded bg-gray-700 px-3 py-1 font-mono text-sm text-gray-300">
                              {apiKey.prefix}...
                              {showKey[apiKey.id] ? apiKey.key.slice(-8) : '••••••••'}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setShowKey({ ...showKey, [apiKey.id]: !showKey[apiKey.id] })
                              }
                              className="text-gray-400 hover:text-white"
                            >
                              {showKey[apiKey.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(apiKey.key)}
                              className="text-gray-400 hover:text-white"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">Permissions:</span>
                            {apiKey.permissions.map((permission) => (
                              <Badge key={permission} variant="secondary" className="bg-gray-700">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-white"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="border-gray-700 bg-gray-800">
                            <DropdownMenuItem className="text-gray-300 hover:text-white">
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-gray-300 hover:text-white">
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Regenerate Key
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400 hover:text-red-300"
                              onClick={() => revokeApiKey(apiKey.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Revoke Key
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          {/* All Keys Tab */}
          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
              </div>
            ) : (
              apiKeys.map((apiKey) => (
                <Card key={apiKey.id} className="border-gray-700 bg-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">{apiKey.name}</h3>
                          <Badge className={getStatusColor(apiKey.status)}>{apiKey.status}</Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Created {formatDate(apiKey.createdAt)}</span>
                          </div>
                          {apiKey.lastUsed && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Last used {formatDate(apiKey.lastUsed)}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <code className="rounded bg-gray-700 px-3 py-1 font-mono text-sm text-gray-300">
                            {apiKey.prefix}...••••••••
                          </code>
                        </div>
                      </div>

                      {apiKey.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeApiKey(apiKey.id)}
                          className="border-red-600 text-red-400 hover:bg-red-600/20"
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Usage Analytics Tab */}
          <TabsContent value="usage" className="space-y-6">
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="text-white">API Usage Overview</CardTitle>
                <CardDescription>Monitor your API key usage and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">24,567</p>
                    <p className="mt-1 text-sm text-gray-400">Total API Calls</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-400">98.5%</p>
                    <p className="mt-1 text-sm text-gray-400">Success Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">145ms</p>
                    <p className="mt-1 text-sm text-gray-400">Avg Response Time</p>
                  </div>
                </div>

                <Separator className="my-6 bg-gray-700" />

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white">Usage by Key</h4>
                  {apiKeys
                    .filter((key) => key.status === 'active')
                    .map((apiKey) => (
                      <div key={apiKey.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Key className="h-4 w-4 text-gray-400" />
                          <span className="text-white">{apiKey.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-400">{apiKey.usage.calls} calls</span>
                          <Activity className="h-4 w-4 text-emerald-400" />
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="outline" className="border-gray-600">
                    <Download className="mr-2 h-4 w-4" />
                    Export Usage Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Best Practices Card */}
        <Card className="mt-6 border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-emerald-400" />
              API Key Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-400" />
                <span>Never share your API keys publicly or commit them to version control</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-400" />
                <span>Use environment variables to store API keys in your applications</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-400" />
                <span>Rotate your API keys regularly and revoke unused keys</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-400" />
                <span>
                  Use different keys for different environments (development, staging, production)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-400" />
                <span>Monitor API key usage and set up alerts for unusual activity</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
