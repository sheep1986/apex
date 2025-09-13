import React from 'react';
import {
  Check,
  Trophy,
  Users,
  Phone,
  Calendar,
  TrendingUp,
  DollarSign,
  Target,
  Star,
  Crown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CampaignCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  leadCount: number;
  estimatedCost: string;
  assistantName: string;
  phoneNumber: string;
  schedulingType: string;
  scheduleDate?: string;
  scheduleTime?: string;
}

export default function CampaignCreatedModal({
  isOpen,
  onClose,
  campaignName,
  leadCount,
  estimatedCost,
  assistantName,
  phoneNumber,
  schedulingType,
  scheduleDate,
  scheduleTime,
}: CampaignCreatedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md border-gray-800 bg-gray-900">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-blue-500">
            <Check className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl text-white">Campaign Created Successfully!</CardTitle>
          <p className="mt-2 text-sm text-gray-400">
            Your campaign &quot;{campaignName}&quot; has been created and is ready to launch.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Campaign Summary */}
          <div className="space-y-3 rounded-lg bg-gray-800 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Campaign</span>
              <span className="font-medium text-white">{campaignName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Leads</span>
              <span className="font-medium text-white">{leadCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Assistant</span>
              <span className="font-medium text-white">{assistantName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Phone</span>
              <span className="font-medium text-white">{phoneNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Schedule</span>
              <span className="font-medium text-white">
                {schedulingType === 'now' ? 'Immediate' : `${scheduleDate} ${scheduleTime}`}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-700 pt-3">
              <span className="text-sm text-gray-400">Estimated Cost</span>
              <span className="font-bold text-emerald-400">${estimatedCost}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700"
            >
              View Campaign
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              Create Another
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
