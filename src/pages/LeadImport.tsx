import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
} from 'lucide-react';

export default function LeadImport() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<
    'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  >('idle');

  const recentImports = [
    {
      id: '1',
      filename: 'sales_leads_jan_2024.csv',
      date: '2024-01-15 10:30 AM',
      totalRows: 5432,
      successfulRows: 5398,
      failedRows: 34,
      status: 'complete',
    },
    {
      id: '2',
      filename: 'marketing_contacts.csv',
      date: '2024-01-14 3:45 PM',
      totalRows: 2156,
      successfulRows: 2156,
      failedRows: 0,
      status: 'complete',
    },
    {
      id: '3',
      filename: 'webinar_attendees.csv',
      date: '2024-01-13 9:15 AM',
      totalRows: 789,
      successfulRows: 0,
      failedRows: 789,
      status: 'error',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('uploading');
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setImportStatus('processing');
          setTimeout(() => {
            setImportStatus('complete');
          }, 2000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-black space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Import Leads</h1>
        <p className="mt-1 text-muted-foreground">
          Upload CSV files to import leads into your campaigns
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <FileSpreadsheet className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-2 text-lg font-medium">Drop your CSV file here, or click to browse</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Supports CSV files up to 50MB with standard lead fields
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Select File
              </Button>
            </label>
          </div>

          {importStatus !== 'idle' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {importStatus === 'uploading' && 'Uploading file...'}
                  {importStatus === 'processing' && 'Processing leads...'}
                  {importStatus === 'complete' && 'Import complete!'}
                  {importStatus === 'error' && 'Import failed'}
                </span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />

              {importStatus === 'complete' && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Successfully imported 5,398 leads. 34 rows had errors and were skipped.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="space-y-2 rounded-lg bg-gray-50 p-4">
            <h4 className="text-sm font-medium">Required CSV Format:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• First Name, Last Name, Email, Phone (required)</li>
              <li>• Company, Title, Tags (optional)</li>
              <li>• Custom fields supported with proper headers</li>
            </ul>
            <Button variant="link" size="sm" className="h-auto p-0">
              <Download className="mr-1 h-3 w-3" />
              Download sample CSV template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Imports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Imports</CardTitle>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentImports.map((import_) => (
              <div
                key={import_.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{import_.filename}</p>
                    <p className="text-sm text-muted-foreground">{import_.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">{import_.totalRows.toLocaleString()} rows</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-600">
                        {import_.successfulRows.toLocaleString()} success
                      </span>
                      {import_.failedRows > 0 && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-red-600">{import_.failedRows} failed</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Badge variant={import_.status === 'complete' ? 'default' : 'destructive'}>
                    {import_.status === 'complete' ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <XCircle className="mr-1 h-3 w-3" />
                    )}
                    {import_.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Import Guidelines */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Import Guidelines:</strong> Ensure phone numbers include country codes. Duplicate
          leads (based on phone number) will be automatically skipped. Maximum 50,000 rows per
          import for optimal performance.
        </AlertDescription>
      </Alert>
    </div>
  );
}
