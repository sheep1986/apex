import React, { useState } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';

interface CampaignExportProps {
  campaignId: string;
}

export const CampaignExport: React.FC<CampaignExportProps> = ({ campaignId }) => {
  const [exportType, setExportType] = useState<'all' | 'qualified' | 'unqualified'>('all');
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days' | 'custom'>('all');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    
    try {
      const params = new URLSearchParams({
        type: exportType,
        dateRange,
        format: 'csv',
      });
      
      const response = await fetch(`/api/campaigns/${campaignId}/export?${params}`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `campaign-${campaignId}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <Download className="h-5 w-5 text-gray-400 mr-2" />
        <h3 className="text-lg font-medium">Export Campaign Data</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Type
          </label>
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value as any)}
            className="w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="all">All Leads</option>
            <option value="qualified">Qualified Leads Only</option>
            <option value="unqualified">Unqualified Leads Only</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-600 mb-2">Export will include:</p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Lead contact information</li>
            <li>• Call attempts and outcomes</li>
            <li>• Qualification scores and analysis</li>
            <li>• Call recording links</li>
            <li>• Cost and performance metrics</li>
          </ul>
        </div>
        
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </>
          )}
        </button>
      </div>
    </div>
  );
};
