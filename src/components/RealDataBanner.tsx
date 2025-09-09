import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface RealDataBannerProps {
  hasData: boolean;
}

export function RealDataBanner({ hasData }: RealDataBannerProps) {
  if (hasData) {
    return (
      <Alert className="border-emerald-800 bg-emerald-900/20 mb-6">
        <CheckCircle className="h-4 w-4 text-emerald-400" />
        <AlertDescription className="text-emerald-300">
          Dashboard is showing live data from your Emerald Green Energy Demo campaign.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-yellow-800 bg-yellow-900/20 mb-6">
      <AlertCircle className="h-4 w-4 text-yellow-400" />
      <AlertDescription className="text-yellow-300">
        <strong>Live Dashboard Active</strong> - This dashboard now shows real data from your database. 
        Import leads and start your campaign to see activity. The mock data has been removed.
      </AlertDescription>
    </Alert>
  );
}