import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CampaignCallLog } from '../components/CampaignCallLogWithExport';
import { CallTranscriptModal } from '../components/CallTranscriptModal';

export default function CampaignCallLogPage() {
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

      {/* Call Log */}
      <CampaignCallLog 
        campaignId={campaignId}
        onViewTranscript={handleViewTranscript}
      />

      {/* Transcript Modal */}
      <CallTranscriptModal
        isOpen={showTranscriptModal}
        onClose={handleCloseTranscript}
        callId={selectedCallId}
      />
    </div>
  );
}