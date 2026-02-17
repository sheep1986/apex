import React from 'react';
import LeadReviewQueue from '@/components/LeadReviewQueue';

const LeadReview: React.FC = () => {
  return (
    <div className="min-h-screen bg-black container mx-auto px-4 py-8">
      <LeadReviewQueue />
    </div>
  );
};

export default LeadReview;