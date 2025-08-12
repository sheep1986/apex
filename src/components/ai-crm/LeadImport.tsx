import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface LeadImportProps {
  campaignId: string;
  onImportComplete: (result: ImportResult) => void;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  duplicates: number;
  errors: string[];
  batchId?: string;
}

interface ImportProgress {
  phase: 'uploading' | 'processing' | 'validating' | 'importing' | 'complete' | 'error';
  percentage: number;
  message: string;
}

export const LeadImport: React.FC<LeadImportProps> = ({ campaignId, onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({
    phase: 'uploading',
    percentage: 0,
    message: 'Ready to import'
  });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredFields = ['phone_number', 'first_name'];
  const optionalFields = ['last_name', 'company', 'email', 'timezone', 'custom_field_1', 'custom_field_2'];

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setProgress({
      phase: 'uploading',
      percentage: 0,
      message: 'File selected, ready to import'
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const startImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress({
      phase: 'uploading',
      percentage: 10,
      message: 'Uploading file...'
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('campaignId', campaignId);

      // Upload and process file
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await response.json();
      
      setProgress({
        phase: 'processing',
        percentage: 30,
        message: 'Processing CSV file...'
      });

      // Poll for import progress
      await pollImportProgress(uploadResult.batchId);

    } catch (error) {
      setProgress({
        phase: 'error',
        percentage: 0,
        message: `Import failed: ${error.message}`
      });
      setImporting(false);
    }
  };

  const pollImportProgress = async (batchId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/leads/import/status/${batchId}`);
        const status = await response.json();

        switch (status.phase) {
          case 'validating':
            setProgress({
              phase: 'validating',
              percentage: 50,
              message: 'Validating lead data...'
            });
            break;
          case 'importing':
            setProgress({
              phase: 'importing',
              percentage: 70 + (status.processedCount / status.totalCount) * 25,
              message: `Importing leads... ${status.processedCount}/${status.totalCount}`
            });
            break;
          case 'complete':
            setProgress({
              phase: 'complete',
              percentage: 100,
              message: 'Import completed successfully!'
            });
            setResult({
              success: true,
              imported: status.imported,
              failed: status.failed,
              duplicates: status.duplicates,
              errors: status.errors || [],
              batchId: status.batchId
            });
            setImporting(false);
            clearInterval(pollInterval);
            onImportComplete(status);
            break;
          case 'error':
            setProgress({
              phase: 'error',
              percentage: 0,
              message: `Import failed: ${status.error}`
            });
            setResult({
              success: false,
              imported: 0,
              failed: status.totalCount || 0,
              duplicates: 0,
              errors: [status.error],
              batchId: status.batchId
            });
            setImporting(false);
            clearInterval(pollInterval);
            break;
        }
      } catch (error) {
        console.error('Error polling import progress:', error);
        clearInterval(pollInterval);
        setImporting(false);
      }
    }, 2000);
  };

  const resetImport = () => {
    setFile(null);
    setResult(null);
    setImporting(false);
    setProgress({
      phase: 'uploading',
      percentage: 0,
      message: 'Ready to import'
    });
  };

  const downloadTemplate = () => {
    const template = [
      requiredFields.concat(optionalFields).join(','),
      '+15551234567,John,Doe,Acme Corp,john@acme.com,America/New_York,Value1,Value2'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Lead Import
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="template">Template</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            {!file && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Maximum file size: 10MB
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  Select File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}

            {file && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {!importing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetImport}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {importing && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {progress.message}
                      </span>
                      <Badge variant={progress.phase === 'error' ? 'destructive' : 'default'}>
                        {progress.phase.toUpperCase()}
                      </Badge>
                    </div>
                    <Progress value={progress.percentage} className="w-full" />
                  </div>
                )}

                {result && (
                  <Alert className={result.success ? 'border-green-500' : 'border-red-500'}>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <AlertDescription>
                        {result.success ? (
                          <div>
                            <p className="font-medium">Import completed successfully!</p>
                            <p className="text-sm mt-1">
                              Imported: {result.imported}, Failed: {result.failed}, 
                              Duplicates: {result.duplicates}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">Import failed</p>
                            {result.errors.map((error, index) => (
                              <p key={index} className="text-sm mt-1">{error}</p>
                            ))}
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                {!importing && !result && (
                  <div className="flex gap-2">
                    <Button onClick={startImport} className="flex-1">
                      Start Import
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={resetImport}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="template" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-3">CSV Template</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download our template to ensure your CSV file has the correct format.
                </p>
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Required Fields</h4>
                  <ul className="space-y-1">
                    {requiredFields.map(field => (
                      <li key={field} className="text-sm flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          {field}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-blue-600">Optional Fields</h4>
                  <ul className="space-y-1">
                    {optionalFields.map(field => (
                      <li key={field} className="text-sm flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-yellow-800">Important Notes:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Phone numbers must be in E.164 format (e.g., +15551234567)</li>
                  <li>• Duplicate phone numbers will be skipped</li>
                  <li>• Timezone should be in IANA format (e.g., America/New_York)</li>
                  <li>• Custom fields can contain any text data</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};