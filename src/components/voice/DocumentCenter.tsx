
import { AlertCircle, CheckCircle, Database, FileText, Loader2, Upload } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { voiceService } from '../../services/voice-service';

export const DocumentCenter: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]); // In reality, fetch from DB
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setError(null);
    try {
      for (const file of acceptedFiles) {
        // Upload via our wrapper
        const result = await voiceService.uploadFile(file);
        // Optimistic update
        setFiles(prev => [...prev, {
            id: result.file.id,
            name: result.file.filename,
            status: 'ready',
            size: (file.size / 1024).toFixed(1) + ' KB'
        }]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
        'application/pdf': ['.pdf'],
        'text/plain': ['.txt'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-4">
          Knowledge Base (RAG)
        </h1>
        <p className="text-white/60 text-lg max-w-3xl">
          Upload documents to give your assistants "Memory". They will use this information to answer user questions intelligently.
        </p>
      </div>

      {/* Upload Zone */}
      <div 
        {...getRootProps()} 
        className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
            ${isDragActive ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-white/20 bg-white/5'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-green-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
            {uploading ? (
                <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
            ) : (
                <Upload className="h-8 w-8 text-green-400" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
                {uploading ? 'Processing document...' : 'Drop Knowledge Files Here'}
            </h3>
            <p className="text-white/40">
              Support for PDF, TXT, DOCX. Max 10MB per file.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
        </div>
      )}

      {/* File List */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
            <Database className="h-5 w-5 text-green-400" />
            <h3 className="font-semibold text-white">Indexed Documents</h3>
        </div>
        
        {files.length === 0 ? (
            <div className="p-12 text-center text-white/30">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                No documents uploaded yet.
            </div>
        ) : (
            <div className="divide-y divide-white/5">
                {files.map((file, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white/70" />
                            </div>
                            <div>
                                <h4 className="text-white font-medium">{file.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-white/40">
                                    <span>{file.size}</span>
                                    <span>•</span>
                                    <span>Added just now</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                            <CheckCircle className="h-3 w-3" />
                            Ready
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
