import React, { useState, useEffect } from 'react';
import { Shield, Clock, PhoneOff, AlertTriangle } from 'lucide-react';

interface ComplianceStats {
  dncViolations: number;
  callingHourViolations: number;
  totalCalls: number;
  complianceRate: number;
}

interface ComplianceDashboardProps {
  campaignId: string;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ campaignId }) => {
  const [complianceStats, setComplianceStats] = useState<ComplianceStats | null>(null);
  const [recentViolations, setRecentViolations] = useState<any[]>([]);

  useEffect(() => {
    fetchComplianceData();
  }, [campaignId]);

  const fetchComplianceData = async () => {
    try {
      const [statsResponse, violationsResponse] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}/compliance/stats`),
        fetch(`/api/campaigns/${campaignId}/compliance/violations`)
      ]);
      
      const stats = await statsResponse.json();
      const violations = await violationsResponse.json();
      
      setComplianceStats(stats);
      setRecentViolations(violations);
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Compliance Rate</p>
              <p className="text-2xl font-semibold">{complianceStats?.complianceRate || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <PhoneOff className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">DNC Violations</p>
              <p className="text-2xl font-semibold">{complianceStats?.dncViolations || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Hour Violations</p>
              <p className="text-2xl font-semibold">{complianceStats?.callingHourViolations || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Calls</p>
              <p className="text-2xl font-semibold">{complianceStats?.totalCalls || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calling Hours Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Calling Hours Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <input
              type="time"
              defaultValue="09:00"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <input
              type="time"
              defaultValue="17:00"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="rounded border-gray-300" />
            <span className="ml-2 text-sm text-gray-700">Skip weekends</span>
          </label>
        </div>
      </div>

      {/* Recent Violations */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium">Recent Violations</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentViolations.length > 0 ? (
            recentViolations.map((violation, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{violation.leadName}</p>
                    <p className="text-sm text-gray-500">{violation.phoneNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      violation.type === 'dnc' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {violation.type === 'dnc' ? 'DNC' : 'Hours'}
                    </span>
                    <p className="text-xs text-gray-500">{violation.timestamp}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No violations found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
