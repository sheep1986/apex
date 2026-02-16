import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserContext } from '@/services/MinimalUserProvider';
import { voiceService } from '@/services/voice-service';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  File,
  FileSpreadsheet,
  FileText,
  FileType2,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface KBFile {
  id: string;
  name: string;
  bytes?: number;
  status?: string;
  createdAt?: string;
  purpose?: string;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ACCEPTED_EXTENSIONS: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  '.pdf': { label: 'PDF', icon: FileText, color: 'text-red-400' },
  '.txt': { label: 'TXT', icon: FileType2, color: 'text-gray-400' },
  '.md': { label: 'MD', icon: FileText, color: 'text-blue-400' },
  '.csv': { label: 'CSV', icon: FileSpreadsheet, color: 'text-green-400' },
  '.docx': { label: 'DOCX', icon: FileText, color: 'text-blue-500' },
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtension = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
};

const getFileIcon = (name: string) => {
  const ext = getFileExtension(name);
  const config = ACCEPTED_EXTENSIONS[ext];
  if (config) {
    const Icon = config.icon;
    return <Icon className={`h-5 w-5 ${config.color}`} />;
  }
  return <File className="h-5 w-5 text-gray-400" />;
};

const getStatusBadge = (status?: string) => {
  switch (status) {
    case 'indexed':
    case 'processed':
      return <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"><CheckCircle2 className="mr-1 h-3 w-3" /> Ready</Badge>;
    case 'processing':
      return <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Processing</Badge>;
    case 'failed':
    case 'error':
      return <Badge className="border-red-500/30 bg-red-500/10 text-red-400"><XCircle className="mr-1 h-3 w-3" /> Failed</Badge>;
    default:
      return <Badge variant="outline" className="text-gray-400">{status || 'Unknown'}</Badge>;
  }
};

export default function KnowledgeBase() {
  const { userContext } = useUserContext();
  const { toast } = useToast();
  const [files, setFiles] = useState<KBFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Voice service readiness
  useEffect(() => {
    const interval = setInterval(() => {
      if (voiceService.isInitialized()) {
        setVoiceReady(true);
        clearInterval(interval);
      }
    }, 500);
    if (voiceService.isInitialized()) setVoiceReady(true);
    return () => clearInterval(interval);
  }, []);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    if (!voiceReady) return;
    setLoading(true);
    setError(null);
    try {
      const data = await voiceService.getFiles();
      setFiles(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load knowledge base files.');
      toast({ title: 'Error', description: 'Failed to load files. Please try again.', variant: 'destructive' });
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [voiceReady]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Upload handler with validation
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const reasons = rejectedFiles.map(r => {
        const name = r.file?.name || 'Unknown file';
        const errors = (r.errors || []).map((e: any) => e.message).join(', ');
        return `${name}: ${errors || 'Unsupported file type'}`;
      });
      setError(`Rejected: ${reasons.join('; ')}`);
      return;
    }

    if (acceptedFiles.length === 0) return;

    // Validate file sizes
    const oversized = acceptedFiles.filter(f => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      setError(`Files exceed ${MAX_FILE_SIZE_MB}MB limit: ${oversized.map(f => f.name).join(', ')}`);
      toast({ title: 'File too large', description: `Maximum file size is ${MAX_FILE_SIZE_MB}MB.`, variant: 'destructive' });
      return;
    }

    setUploading(true);
    setError(null);
    try {
      let uploaded = 0;
      for (const file of acceptedFiles) {
        await voiceService.uploadFile(file);
        uploaded++;
      }
      toast({ title: 'Upload Complete', description: `${uploaded} file${uploaded > 1 ? 's' : ''} uploaded successfully.` });
      await fetchFiles();
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
      toast({ title: 'Upload Error', description: err.message || 'Failed to upload file.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [fetchFiles, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: true,
  });

  // Delete handler
  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      await voiceService.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    } finally {
      setDeletingId(null);
    }
  };

  if (!voiceReady || loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-400" />
        <p className="text-gray-400">
          {!voiceReady ? 'Connecting to voice service...' : 'Loading knowledge base...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <BookOpen className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
              <p className="text-gray-400">Upload documents to give your assistants context</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={fetchFiles}
            disabled={loading}
            className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Files</p>
                  <p className="text-2xl font-bold text-white">{files.length}</p>
                </div>
                <File className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Ready</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {files.filter(f => f.status === 'indexed' || f.status === 'processed').length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Size</p>
                  <p className="text-2xl font-bold text-white">
                    {formatBytes(files.reduce((sum, f) => sum + (f.bytes || 0), 0))}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer ${
            isDragActive
              ? 'border-blue-500 bg-blue-500/5'
              : 'border-gray-800 hover:border-gray-600 bg-gray-900/30'
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-blue-400 animate-spin mb-3" />
              <p className="text-gray-300">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-600 mb-3" />
              <p className="text-gray-300 font-medium">
                {isDragActive ? 'Drop files here' : 'Drag & drop files, or click to browse'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {Object.entries(ACCEPTED_EXTENSIONS).map(([ext, config]) => (
                  <Badge key={ext} variant="outline" className="text-[10px] text-gray-400 border-gray-700">
                    {config.label}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Max {MAX_FILE_SIZE_MB}MB per file
              </p>
            </>
          )}
        </div>

        {/* File List */}
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id} className="border-gray-800 bg-gray-900 hover:border-gray-700 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        {getFileIcon(file.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{file.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          <span>{formatBytes(file.bytes)}</span>
                          {file.createdAt && (
                            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(file.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-700 bg-gray-900 text-red-400 hover:bg-red-950/30"
                        disabled={deletingId === file.id}
                        onClick={() => handleDelete(file.id)}
                      >
                        {deletingId === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="py-16 text-center">
              <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-600" />
              <h3 className="text-lg font-medium text-white">No files uploaded</h3>
              <p className="mx-auto max-w-sm text-sm text-gray-400 mt-1">
                Upload documents to build your knowledge base. Your AI assistants can reference these files during conversations.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
