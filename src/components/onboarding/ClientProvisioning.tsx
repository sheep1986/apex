import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface ClientProvisioningProps {
  data: any;
  onComplete: (data: any) => void;
  onPrevious?: () => void;
  loading?: boolean;
}

const ClientProvisioning: React.FC<ClientProvisioningProps> = ({
  data,
  onComplete,
  onPrevious,
  loading = false,
}) => {
  const handleSubmit = () => {
    onComplete({
      provisioning: {
        subdomain: 'client-workspace',
        welcomeEmailSent: false,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-white">Account Provisioning</h2>
        <p className="text-gray-400">Setting up your workspace and integrations</p>
      </div>

      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Workspace Setup</CardTitle>
          <CardDescription>Configuring your dedicated workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300">Your workspace is being configured...</p>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {onPrevious && (
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="ml-auto bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Continue to Welcome
        </Button>
      </div>
    </div>
  );
};

export default ClientProvisioning;
