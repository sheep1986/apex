import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Crown, User, RefreshCw } from 'lucide-react';

export const DevAuthSwitcher: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<'owner' | 'client'>('client');
  const [isVisible, setIsVisible] = useState(false);

  // Show only in development mode
  useEffect(() => {
    setIsVisible(import.meta.env.DEV);
  }, []);

  const switchToOwner = () => {
    console.log('🔄 Switching to Platform Owner mode');
    localStorage.setItem('dev_auth_mode', 'owner');
    localStorage.setItem('auth_token', 'owner-token');
    setCurrentMode('owner');
    // Trigger custom event for immediate context update
    window.dispatchEvent(new CustomEvent('authModeChange', { detail: 'owner' }));
    // Force reload to ensure all components update
    setTimeout(() => window.location.reload(), 100);
  };

  const switchToClient = () => {
    console.log('🔄 Switching to Client Admin mode');
    localStorage.setItem('dev_auth_mode', 'client');
    localStorage.setItem('auth_token', 'test-token');
    setCurrentMode('client');
    // Trigger custom event for immediate context update
    window.dispatchEvent(new CustomEvent('authModeChange', { detail: 'client' }));
    // Force reload to ensure all components update
    setTimeout(() => window.location.reload(), 100);
  };

  // Determine current mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('dev_auth_mode');
    if (savedMode === 'owner') {
      setCurrentMode('owner');
    } else {
      setCurrentMode('client');
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 border-gray-700 bg-gray-900">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <RefreshCw className="h-4 w-4" />
            Development Auth Mode
          </CardTitle>
          <CardDescription className="text-xs">
            Switch between platform owner and client user
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Current Mode:</span>
              <Badge variant={currentMode === 'owner' ? 'default' : 'secondary'}>
                {currentMode === 'owner' ? (
                  <>
                    <Crown className="mr-1 h-3 w-3" />
                    Platform Owner
                  </>
                ) : (
                  <>
                    <User className="mr-1 h-3 w-3" />
                    Client User
                  </>
                )}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={switchToOwner}
                disabled={currentMode === 'owner'}
                size="sm"
                className="flex-1"
                variant={currentMode === 'owner' ? 'default' : 'outline'}
              >
                <Crown className="mr-1 h-3 w-3" />
                Owner
              </Button>

              <Button
                onClick={switchToClient}
                disabled={currentMode === 'client'}
                size="sm"
                className="flex-1"
                variant={currentMode === 'client' ? 'default' : 'outline'}
              >
                <User className="mr-1 h-3 w-3" />
                Client
              </Button>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              {currentMode === 'owner' ? (
                <>
                  <strong>Sean Wentz</strong> - Platform Owner
                  <br />
                  sean@artificialmedia.co.uk
                </>
              ) : (
                <>
                  <strong>ABS SDH</strong> - Client Admin
                  <br />
                  info@artificialmedia.co.uk
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
