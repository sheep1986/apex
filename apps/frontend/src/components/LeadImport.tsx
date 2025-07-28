import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

interface ValidationResult {
  valid: boolean;
  validRows: number;
  errorRows: number;
  errors: string[];
}

interface LeadImportProps {
  campaignId: string;
  onImportComplete: (result: ImportResult) => void;
}

export const LeadImport: React.FC<LeadImportProps> = ({ campaignId, onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      validateFile(selectedFile);
    }
  };

  const validateFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/leads/validate`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/leads/import`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      onImportComplete(result);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded-lg">
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Upload Lead List</h3>
      <p className="mt-1 text-sm text-gray-500">
        CSV file with columns: name, phone, company, email (optional)
      </p>
      
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="mt-4"
      />
      
      {validationResult && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            {validationResult.valid ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span className="text-sm">
              {validationResult.validRows} valid rows, {validationResult.errorRows} errors
            </span>
          </div>
          
          {validationResult.errors.length > 0 && (
            <div className="mt-2 text-left">
              <p className="text-sm font-medium text-red-600">Errors:</p>
              <ul className="text-sm text-red-500 list-disc ml-4">
                {validationResult.errors.slice(0, 5).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={handleImport}
        disabled={!file || !validationResult?.valid || importing}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
      >
        {importing ? 'Importing...' : 'Import Leads'}
      </button>
    </div>
  );
};
