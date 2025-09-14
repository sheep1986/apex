import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart3, List, FileText } from 'lucide-react';
import { CampaignCallLog } from '../components/CampaignCallLogWithExport';
import { CallTranscriptModal } from '../components/CallTranscriptModal';
import { CampaignAnalyticsDashboard } from '../components/CampaignAnalyticsDashboard';

export default function ComprehensiveCampaignAnalytics() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  const handleViewTranscript = (callId: string) => {
    setSelectedCallId(callId);
    setShowTranscriptModal(true);
  };

  const handleCloseTranscript = () => {
    setShowTranscriptModal(false);
    setSelectedCallId(null);
  };

  if (!campaignId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Invalid campaign ID</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/campaigns')}
          className="text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Dashboard
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Call Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <CampaignAnalyticsDashboard campaignId={campaignId} />
        </TabsContent>

        <TabsContent value="calls" className="space-y-6">
          <CampaignCallLog 
            campaignId={campaignId}
            onViewTranscript={handleViewTranscript}
          />
        </TabsContent>
      </Tabs>

      {/* Transcript Modal */}
      <CallTranscriptModal
        isOpen={showTranscriptModal}
        onClose={handleCloseTranscript}
        callId={selectedCallId}
      />
    </div>
  );
}