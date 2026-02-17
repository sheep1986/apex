import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  Database, 
  Calendar, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X,
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription } from '../ui/alert';

interface CampaignExportProps {
  campaignId: string;
  campaignName: string;
}

interface ExportRequest {
  exportType: 'all' | 'qualified' | 'unqualified' | 'contacted' | 'new';
  format: 'csv' | 'json' | 'xlsx';
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  includeRecordings: boolean;
  includeAnalytics: boolean;
  includeTasks: boolean;
  customFields?: string[];
}

interface ExportJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  exportType: string;
  format: string;
  recordCount: number;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  progress?: number;
}

const formatOptions = [
  { value: 'csv', label: 'CSV', description: 'Comma-separated values for Excel' },
  { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
  { value: 'xlsx', label: 'Excel', description: 'Microsoft Excel format' }
];

const exportTypes = [
  { value: 'all', label: 'All Leads', description: 'Export all leads regardless of status' },
  { value: 'qualified', label: 'Qualified Leads', description: 'Only leads that passed qualification' },
  { value: 'unqualified', label: 'Unqualified Leads', description: 'Leads that did not qualify' },
  { value: 'contacted', label: 'Contacted Leads', description: 'Leads that have been called' },
  { value: 'new', label: 'New Leads', description: 'Leads that have not been contacted' }
];

export const CampaignExport: React.FC<CampaignExportProps> = ({ 
  campaignId, 
  campaignName 
}) => {
  const [exportRequest, setExportRequest] = useState<ExportRequest>({
    exportType: 'all',
    format: 'csv',
    includeRecordings: false,
    includeAnalytics: true,
    includeTasks: false
  });
  
  const [exportHistory, setExportHistory] = useState<ExportJob[]>([]);
  const [activeExports, setActiveExports] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [selectedCustomFields, setSelectedCustomFields] = useState<string[]>([]);

  useEffect(() => {
    fetchExportHistory();
    fetchCustomFields();
    // Only poll for active exports if there are any
    if (activeExports.length > 0) {
      const interval = setInterval(() => {
        fetchActiveExports();
      }, 10000); // Changed from 2000ms to 10000ms (10 seconds)
      return () => clearInterval(interval);
    }
  }, [campaignId, activeExports.length]);

  const fetchExportHistory = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/exports`);
      const data = await response.json();
      setExportHistory(data.map((exportItem: any) => ({
        ...exportItem,
        createdAt: new Date(exportItem.createdAt),
        completedAt: exportItem.completedAt ? new Date(exportItem.completedAt) : undefined
      })));
    } catch (error) {
      console.error('Error fetching export history:', error);
    }
  };

  const fetchActiveExports = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/exports?status=processing`);
      const data = await response.json();
      setActiveExports(data.map((exportItem: any) => ({
        ...exportItem,
        createdAt: new Date(exportItem.createdAt),
        completedAt: exportItem.completedAt ? new Date(exportItem.completedAt) : undefined
      })));
    } catch (error) {
      console.error('Error fetching active exports:', error);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/custom-fields`);
      const data = await response.json();
      setCustomFields(data);
    } catch (error) {
      console.error('Error fetching custom fields:', error);
    }
  };

  const startExport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const requestData = {
        ...exportRequest,
        customFields: selectedCustomFields.length > 0 ? selectedCustomFields : undefined
      };
      
      const response = await fetch(`/api/campaigns/${campaignId}/exports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Export request failed');
      }

      const result = await response.json();
      
      // Add to active exports
      setActiveExports(prev => [...prev, {
        id: result.exportId,
        status: 'processing',
        exportType: exportRequest.exportType,
        format: exportRequest.format,
        recordCount: 0,
        createdAt: new Date(),
        progress: 0
      }]);

      // Reset form
      setExportRequest({
        exportType: 'all',
        format: 'csv',
        includeRecordings: false,
        includeAnalytics: true,
        includeTasks: false
      });
      setSelectedCustomFields([]);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelExport = async (exportId: string) => {
    try {
      await fetch(`/api/exports/${exportId}/cancel`, {
        method: 'POST',
      });
      
      setActiveExports(prev => prev.filter(exp => exp.id !== exportId));
    } catch (error) {
      console.error('Error canceling export:', error);
    }
  };

  const deleteExport = async (exportId: string) => {
    try {
      await fetch(`/api/exports/${exportId}`, {
        method: 'DELETE',
      });
      
      setExportHistory(prev => prev.filter(exp => exp.id !== exportId));
    } catch (error) {
      console.error('Error deleting export:', error);
    }
  };

  const downloadExport = (downloadUrl: string, format: string) => {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${campaignName}-export.${format}`;
    a.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Campaign Export
          </CardTitle>
          <p className="text-sm text-gray-600">
            Export campaign data and analytics for {campaignName}
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="configure" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="configure">Configure</TabsTrigger>
              <TabsTrigger value="active">Active ({activeExports.length})</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="configure" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Type */}
                <div className="space-y-3">
                  <h3 className="font-medium">Export Type</h3>
                  <Select
                    value={exportRequest.exportType}
                    onValueChange={(value) => setExportRequest({ ...exportRequest, exportType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {exportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Format */}
                <div className="space-y-3">
                  <h3 className="font-medium">Format</h3>
                  <Select
                    value={exportRequest.format}
                    onValueChange={(value) => setExportRequest({ ...exportRequest, format: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formatOptions.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          <div>
                            <div className="font-medium">{format.label}</div>
                            <div className="text-sm text-gray-500">{format.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-3">
                <h3 className="font-medium">Date Range (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
                    <Input
                      id="startDate"
                      type="date"
                      value={exportRequest.dateRange?.startDate ? exportRequest.dateRange.startDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const startDate = e.target.value ? new Date(e.target.value) : undefined;
                        setExportRequest({ 
                          ...exportRequest, 
                          dateRange: startDate ? { 
                            ...exportRequest.dateRange, 
                            startDate,
                            endDate: exportRequest.dateRange?.endDate || startDate
                          } : undefined
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
                    <Input
                      id="endDate"
                      type="date"
                      value={exportRequest.dateRange?.endDate ? exportRequest.dateRange.endDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const endDate = e.target.value ? new Date(e.target.value) : undefined;
                        setExportRequest({ 
                          ...exportRequest, 
                          dateRange: endDate ? { 
                            ...exportRequest.dateRange, 
                            startDate: exportRequest.dateRange?.startDate || endDate,
                            endDate
                          } : undefined
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Include Options */}
              <div className="space-y-3">
                <h3 className="font-medium">Include Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeRecordings"
                      checked={exportRequest.includeRecordings}
                      onCheckedChange={(checked) => 
                        setExportRequest({ ...exportRequest, includeRecordings: checked as boolean })
                      }
                    />
                    <label htmlFor="includeRecordings" className="text-sm font-medium">
                      Call Recordings
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAnalytics"
                      checked={exportRequest.includeAnalytics}
                      onCheckedChange={(checked) => 
                        setExportRequest({ ...exportRequest, includeAnalytics: checked as boolean })
                      }
                    />
                    <label htmlFor="includeAnalytics" className="text-sm font-medium">
                      Analytics Data
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeTasks"
                      checked={exportRequest.includeTasks}
                      onCheckedChange={(checked) => 
                        setExportRequest({ ...exportRequest, includeTasks: checked as boolean })
                      }
                    />
                    <label htmlFor="includeTasks" className="text-sm font-medium">
                      Compliance Data
                    </label>
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Custom Fields</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {customFields.map((field) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox
                          id={field}
                          checked={selectedCustomFields.includes(field)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCustomFields(prev => [...prev, field]);
                            } else {
                              setSelectedCustomFields(prev => prev.filter(f => f !== field));
                            }
                          }}
                        />
                        <label htmlFor={field} className="text-sm">
                          {field}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert className="border-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Export Button */}
              <div className="flex justify-end">
                <Button
                  onClick={startExport}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {loading ? 'Starting Export...' : 'Start Export'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="active" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Active Exports</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchActiveExports}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <div className="space-y-3">
                {activeExports.map((exportJob) => (
                  <Card key={exportJob.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(exportJob.status)}
                          <div>
                            <p className="font-medium">
                              {exportTypes.find(t => t.value === exportJob.exportType)?.label}
                            </p>
                            <p className="text-sm text-gray-600">
                              {exportJob.format.toUpperCase()} • Started {formatDate(exportJob.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(exportJob.status)} text-white`}>
                            {exportJob.status.toUpperCase()}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelExport(exportJob.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {exportJob.progress !== undefined && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{exportJob.progress}%</span>
                          </div>
                          <Progress value={exportJob.progress} className="h-2" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {activeExports.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No active exports</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Export History</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchExportHistory}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {exportHistory.map((exportJob) => (
                    <Card key={exportJob.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(exportJob.status)}
                            <div>
                              <p className="font-medium">
                                {exportTypes.find(t => t.value === exportJob.exportType)?.label}
                              </p>
                              <p className="text-sm text-gray-600">
                                {exportJob.format.toUpperCase()} • 
                                {exportJob.recordCount} records • 
                                {exportJob.fileSize && formatFileSize(exportJob.fileSize)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(exportJob.createdAt)}
                                {exportJob.completedAt && ` • Completed ${formatDate(exportJob.completedAt)}`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(exportJob.status)} text-white`}>
                              {exportJob.status.toUpperCase()}
                            </Badge>
                            
                            {exportJob.status === 'completed' && exportJob.downloadUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadExport(exportJob.downloadUrl!, exportJob.format)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            )}
                            
                            {exportJob.status === 'failed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => alert(exportJob.error)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Error
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteExport(exportJob.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {exportHistory.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No export history</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};