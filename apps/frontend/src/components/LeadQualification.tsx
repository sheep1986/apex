import React, { useState, useEffect } from 'react';
import { Star, Phone, Calendar, DollarSign, User, Play } from 'lucide-react';

interface QualifiedLead {
  id: string;
  name: string;
  company: string;
  qualificationScore: number;
  budgetRange: string;
  timeline: number;
  aiSummary: string;
  nextSteps: string;
  recordingUrl?: string;
}

interface LeadQualificationProps {
  campaignId: string;
}

export const LeadQualification: React.FC<LeadQualificationProps> = ({ campaignId }) => {
  const [qualifiedLeads, setQualifiedLeads] = useState<QualifiedLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<QualifiedLead | null>(null);

  useEffect(() => {
    fetchQualifiedLeads();
  }, [campaignId]);

  const fetchQualifiedLeads = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/qualified-leads`);
      const leads = await response.json();
      setQualifiedLeads(leads);
    } catch (error) {
      console.error('Failed to fetch qualified leads:', error);
    }
  };

  const playCallRecording = (recordingUrl: string) => {
    window.open(recordingUrl, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Qualified Leads List */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium">Qualified Leads</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {qualifiedLeads.map(lead => (
              <div
                key={lead.id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedLead(lead)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                      <p className="text-sm text-gray-500">{lead.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">{lead.qualificationScore}</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm">{lead.budgetRange}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-blue-500 mr-1" />
                      <span className="text-sm">{lead.timeline} days</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Lead Details */}
      {selectedLead && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium">Lead Details</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Name</p>
                <p className="text-sm text-gray-600">{selectedLead.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Company</p>
                <p className="text-sm text-gray-600">{selectedLead.company}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Qualification Score</p>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${selectedLead.qualificationScore}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{selectedLead.qualificationScore}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">AI Analysis</p>
                <p className="text-sm text-gray-600">{selectedLead.aiSummary}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Next Steps</p>
                <p className="text-sm text-gray-600">{selectedLead.nextSteps}</p>
              </div>
              
              {selectedLead.recordingUrl && (
                <button
                  onClick={() => playCallRecording(selectedLead.recordingUrl)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play Call Recording
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
