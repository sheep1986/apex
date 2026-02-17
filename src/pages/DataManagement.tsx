import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Database,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  RotateCcw,
  Archive,
  FileText,
  Users,
  Phone,
  Target,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Activity,
  Settings,
  RefreshCw,
  Eye,
  Edit,
  X,
  Save,
} from 'lucide-react';

interface DataTable {
  name: string;
  type: 'calls' | 'leads' | 'campaigns' | 'users' | 'analytics';
  records: number;
  size: string;
  lastUpdated: string;
  retention: string;
  status: 'active' | 'archived' | 'pending_deletion';
  description: string;
}

interface DataOperation {
  id: string;
  type: 'export' | 'import' | 'delete' | 'backup' | 'cleanup';
  status: 'running' | 'completed' | 'failed' | 'pending';
  progress: number;
  startTime: string;
  endTime?: string;
  details: string;
  recordsProcessed?: number;
  totalRecords?: number;
}

export default function DataManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [operations, setOperations] = useState<DataOperation[]>([]);

  const [dataTables, setDataTables] = useState<DataTable[]>([
    {
      name: 'calls',
      type: 'calls',
      records: 45623,
      size: '2.3 GB',
      lastUpdated: '2024-01-20T15:30:00Z',
      retention: '2 years',
      status: 'active',
      description: 'Call records, transcripts, and metadata'
    },
    {
      name: 'leads',
      type: 'leads',
      records: 12847,
      size: '156 MB',
      lastUpdated: '2024-01-20T14:45:00Z',
      retention: '3 years',
      status: 'active',
      description: 'Lead information and qualification data'
    },
    {
      name: 'campaigns',
      type: 'campaigns',
      records: 234,
      size: '45 MB',
      lastUpdated: '2024-01-20T12:15:00Z',
      retention: '5 years',
      status: 'active',
      description: 'Campaign configurations and performance data'
    },
    {
      name: 'users',
      type: 'users',
      records: 567,
      size: '12 MB',
      lastUpdated: '2024-01-20T10:20:00Z',
      retention: 'Indefinite',
      status: 'active',
      description: 'User accounts and authentication data'
    },
    {
      name: 'analytics_archive_2023',
      type: 'analytics',
      records: 892345,
      size: '4.7 GB',
      lastUpdated: '2023-12-31T23:59:59Z',
      retention: '7 years',
      status: 'archived',
      description: 'Historical analytics data from 2023'
    },
    {
      name: 'temp_imports',
      type: 'leads',
      records: 1234,
      size: '23 MB',
      lastUpdated: '2024-01-15T09:30:00Z',
      retention: '30 days',
      status: 'pending_deletion',
      description: 'Temporary import data awaiting cleanup'
    }
  ]);

  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    includeMetadata: true,
    compressFiles: true,
    dateRange: 'all',
    customStartDate: '',
    customEndDate: '',
  });

  const [cleanupOptions, setCleanupOptions] = useState({
    duplicateLeads: true,
    oldCallRecords: false,
    tempFiles: true,
    archivedData: false,
    retentionDays: 365,
  });

  useEffect(() => {
    loadData();
    loadOperations();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const loadOperations = () => {
    setOperations([
      {
        id: '1',
        type: 'export',
        status: 'completed',
        progress: 100,
        startTime: '2024-01-20T14:00:00Z',
        endTime: '2024-01-20T14:15:00Z',
        details: 'Exported calls data (January 2024)',
        recordsProcessed: 5432,
        totalRecords: 5432,
      },
      {
        id: '2',
        type: 'cleanup',
        status: 'running',
        progress: 67,
        startTime: '2024-01-20T15:30:00Z',
        details: 'Removing duplicate lead records',
        recordsProcessed: 2847,
        totalRecords: 4234,
      },
      {
        id: '3',
        type: 'backup',
        status: 'pending',
        progress: 0,
        startTime: '2024-01-20T16:00:00Z',
        details: 'Scheduled weekly backup',
      },
    ]);
  };

  const filteredTables = dataTables.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         table.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || table.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleTableSelection = (tableName: string, checked: boolean) => {
    if (checked) {
      setSelectedTables(prev => [...prev, tableName]);
    } else {
      setSelectedTables(prev => prev.filter(name => name !== tableName));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTables(filteredTables.map(table => table.name));
    } else {
      setSelectedTables([]);
    }
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      toast({
        title: 'No Tables Selected',
        description: 'Please select at least one table to export.',
        variant: 'destructive',
      });
      return;
    }

    const newOperation: DataOperation = {
      id: Date.now().toString(),
      type: 'export',
      status: 'running',
      progress: 0,
      startTime: new Date().toISOString(),
      details: `Exporting ${selectedTables.length} table(s) as ${exportOptions.format.toUpperCase()}`,
      recordsProcessed: 0,
      totalRecords: selectedTables.reduce((sum, tableName) => {
        const table = dataTables.find(t => t.name === tableName);
        return sum + (table?.records || 0);
      }, 0),
    };

    setOperations(prev => [newOperation, ...prev]);
    setShowExportModal(false);

    // Simulate export progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setOperations(prev => prev.map(op => 
          op.id === newOperation.id 
            ? { 
                ...op, 
                status: 'completed', 
                progress: 100, 
                endTime: new Date().toISOString(),
                recordsProcessed: op.totalRecords 
              }
            : op
        ));

        toast({
          title: 'Export Completed',
          description: `Successfully exported ${selectedTables.length} table(s).`,
        });
      } else {
        setOperations(prev => prev.map(op => 
          op.id === newOperation.id 
            ? { 
                ...op, 
                progress: Math.floor(progress),
                recordsProcessed: Math.floor((progress / 100) * (op.totalRecords || 0))
              }
            : op
        ));
      }
    }, 500);

    setSelectedTables([]);
  };

  const handleCleanup = async () => {
    const selectedOptions = Object.entries(cleanupOptions)
      .filter(([key, value]) => value === true && key !== 'retentionDays')
      .map(([key]) => key);

    if (selectedOptions.length === 0) {
      toast({
        title: 'No Cleanup Options Selected',
        description: 'Please select at least one cleanup option.',
        variant: 'destructive',
      });
      return;
    }

    const newOperation: DataOperation = {
      id: Date.now().toString(),
      type: 'cleanup',
      status: 'running',
      progress: 0,
      startTime: new Date().toISOString(),
      details: `Data cleanup: ${selectedOptions.join(', ')}`,
      recordsProcessed: 0,
      totalRecords: 10000, // Estimated records to process
    };

    setOperations(prev => [newOperation, ...prev]);
    setShowCleanupModal(false);

    // Simulate cleanup progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setOperations(prev => prev.map(op => 
          op.id === newOperation.id 
            ? { 
                ...op, 
                status: 'completed', 
                progress: 100, 
                endTime: new Date().toISOString(),
                recordsProcessed: op.totalRecords 
              }
            : op
        ));

        toast({
          title: 'Cleanup Completed',
          description: `Data cleanup completed successfully.`,
        });
      } else {
        setOperations(prev => prev.map(op => 
          op.id === newOperation.id 
            ? { 
                ...op, 
                progress: Math.floor(progress),
                recordsProcessed: Math.floor((progress / 100) * (op.totalRecords || 0))
              }
            : op
        ));
      }
    }, 800);
  };

  const handleDeleteTables = async () => {
    if (selectedTables.length === 0) {
      toast({
        title: 'No Tables Selected',
        description: 'Please select at least one table to delete.',
        variant: 'destructive',
      });
      return;
    }

    // Filter out protected tables
    const protectedTables = ['users', 'campaigns'];
    const tablesToDelete = selectedTables.filter(table => !protectedTables.includes(table));
    const protectedSelected = selectedTables.filter(table => protectedTables.includes(table));

    if (protectedSelected.length > 0) {
      toast({
        title: 'Protected Tables Selected',
        description: `Cannot delete protected tables: ${protectedSelected.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    if (tablesToDelete.length === 0) {
      toast({
        title: 'No Deletable Tables',
        description: 'All selected tables are protected from deletion.',
        variant: 'destructive',
      });
      return;
    }

    setDataTables(prev => prev.filter(table => !tablesToDelete.includes(table.name)));
    setSelectedTables([]);

    toast({
      title: 'Tables Deleted',
      description: `Successfully deleted ${tablesToDelete.length} table(s).`,
    });
  };

  const getStatusColor = (status: DataTable['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-600';
      case 'archived': return 'bg-blue-600';
      case 'pending_deletion': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: DataTable['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'archived': return <Archive className="h-4 w-4" />;
      case 'pending_deletion': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: DataTable['type']) => {
    switch (type) {
      case 'calls': return <Phone className="h-5 w-5 text-blue-400" />;
      case 'leads': return <Users className="h-5 w-5 text-emerald-400" />;
      case 'campaigns': return <Target className="h-5 w-5 text-purple-400" />;
      case 'users': return <Shield className="h-5 w-5 text-yellow-400" />;
      case 'analytics': return <Activity className="h-5 w-5 text-gray-400" />;
      default: return <Database className="h-5 w-5 text-gray-400" />;
    }
  };

  const getOperationIcon = (type: DataOperation['type']) => {
    switch (type) {
      case 'export': return <Download className="h-4 w-4" />;
      case 'import': return <Upload className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'backup': return <Archive className="h-4 w-4" />;
      case 'cleanup': return <RotateCcw className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getOperationStatusColor = (status: DataOperation['status']) => {
    switch (status) {
      case 'completed': return 'text-emerald-400';
      case 'running': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading data management...</p>
        </div>
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
              <Database className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Data Management</h1>
              <p className="text-gray-400">View, export, and manage your platform data</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCleanupModal(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Data Cleanup
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Records</CardTitle>
              <div className="rounded-lg p-2 border border-blue-500/20 bg-blue-500/10">
                <Database className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {dataTables.reduce((sum, table) => sum + table.records, 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">Across all tables</p>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Storage Used</CardTitle>
              <div className="rounded-lg p-2 border border-purple-500/20 bg-purple-500/10">
                <HardDrive className="h-4 w-4 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">7.2 GB</div>
              <p className="text-xs text-gray-500">15.4% of quota used</p>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Tables</CardTitle>
              <div className="rounded-lg p-2 border border-emerald-500/20 bg-emerald-500/10">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {dataTables.filter(table => table.status === 'active').length}
              </div>
              <p className="text-xs text-gray-500">
                {dataTables.filter(table => table.status === 'archived').length} archived
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Running Operations</CardTitle>
              <div className="rounded-lg p-2 border border-amber-500/20 bg-amber-500/10">
                <Activity className="h-4 w-4 text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {operations.filter(op => op.status === 'running').length}
              </div>
              <p className="text-xs text-gray-500">
                {operations.filter(op => op.status === 'pending').length} pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Data Tables</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your database tables and records
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search tables..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 border-gray-700 bg-gray-800 text-white"
                  />
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40 border-gray-700 bg-gray-800 text-white">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-800">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="calls">Calls</SelectItem>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="campaigns">Campaigns</SelectItem>
                      <SelectItem value="users">Users</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Bulk Actions */}
            {selectedTables.length > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                <span className="text-sm text-gray-300">
                  {selectedTables.length} table(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportModal(true)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-gray-800 bg-gray-900 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Tables?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        This action cannot be undone. This will permanently delete the selected tables and all their data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteTables}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Tables
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTables([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {/* Select All Header */}
              <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                <Checkbox
                  checked={filteredTables.length > 0 && selectedTables.length === filteredTables.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium text-gray-300">Select All</span>
              </div>

              {/* Table List */}
              {filteredTables.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4 transition-all hover:bg-gray-800"
                >
                  <Checkbox
                    checked={selectedTables.includes(table.name)}
                    onCheckedChange={(checked) => handleTableSelection(table.name, checked as boolean)}
                  />
                  
                  <div className="flex items-center gap-3">
                    {getTypeIcon(table.type)}
                    <div>
                      <h4 className="font-medium text-white">{table.name}</h4>
                      <p className="text-sm text-gray-400">{table.description}</p>
                    </div>
                  </div>

                  <div className="ml-auto grid grid-cols-5 gap-6 text-sm">
                    <div>
                      <p className="text-gray-400">Records</p>
                      <p className="font-medium text-white">{table.records.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Size</p>
                      <p className="font-medium text-white">{table.size}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Retention</p>
                      <p className="font-medium text-white">{table.retention}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Last Updated</p>
                      <p className="font-medium text-white">
                        {new Date(table.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Badge className={getStatusColor(table.status)}>
                        {getStatusIcon(table.status)}
                        <span className="ml-1">{table.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

              {filteredTables.length === 0 && (
                <div className="py-8 text-center">
                  <Database className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No tables found</h3>
                  <p className="text-gray-500">
                    {searchTerm || filterType !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No data tables available.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Operations */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-white">Recent Operations</CardTitle>
            <CardDescription className="text-gray-400">
              Track data operations and their progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {operations.map((operation) => (
                <div
                  key={operation.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    {getOperationIcon(operation.type)}
                    <div>
                      <p className="font-medium text-white capitalize">{operation.type}</p>
                      <p className="text-sm text-gray-400">{operation.details}</p>
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-6">
                    {operation.status === 'running' && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 rounded-full bg-gray-700">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all"
                            style={{ width: `${operation.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">{operation.progress}%</span>
                      </div>
                    )}

                    {operation.recordsProcessed !== undefined && operation.totalRecords && (
                      <div className="text-sm text-gray-400">
                        {operation.recordsProcessed.toLocaleString()} / {operation.totalRecords.toLocaleString()}
                      </div>
                    )}

                    <div className="text-sm">
                      <span className={getOperationStatusColor(operation.status)}>
                        {operation.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500">
                      {new Date(operation.startTime).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}

              {operations.length === 0 && (
                <div className="py-8 text-center">
                  <Activity className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                  <p className="text-gray-400">No recent operations</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Export Modal */}
        <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
          <DialogContent className="max-w-2xl border-gray-800 bg-gray-900 text-white">
            <DialogHeader>
              <DialogTitle>Export Data</DialogTitle>
              <DialogDescription className="text-gray-400">
                Configure export settings for selected tables
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-white">Export Format</h4>
                <Select
                  value={exportOptions.format}
                  onValueChange={(value) => setExportOptions({...exportOptions, format: value})}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    <SelectItem value="sql">SQL Dump</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white">Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="metadata"
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) => 
                        setExportOptions({...exportOptions, includeMetadata: checked as boolean})
                      }
                    />
                    <Label htmlFor="metadata" className="text-gray-300">Include metadata</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compress"
                      checked={exportOptions.compressFiles}
                      onCheckedChange={(checked) => 
                        setExportOptions({...exportOptions, compressFiles: checked as boolean})
                      }
                    />
                    <Label htmlFor="compress" className="text-gray-300">Compress files</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowExportModal(false)}
                  className="border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Start Export
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cleanup Modal */}
        <Dialog open={showCleanupModal} onOpenChange={setShowCleanupModal}>
          <DialogContent className="max-w-2xl border-gray-800 bg-gray-900 text-white">
            <DialogHeader>
              <DialogTitle>Data Cleanup</DialogTitle>
              <DialogDescription className="text-gray-400">
                Select cleanup operations to optimize your database
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-white">Cleanup Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="duplicates"
                        checked={cleanupOptions.duplicateLeads}
                        onCheckedChange={(checked) => 
                          setCleanupOptions({...cleanupOptions, duplicateLeads: checked as boolean})
                        }
                      />
                      <Label htmlFor="duplicates" className="text-gray-300">Remove duplicate leads</Label>
                    </div>
                    <Badge variant="outline" className="text-xs">~1,234 duplicates</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="temp"
                        checked={cleanupOptions.tempFiles}
                        onCheckedChange={(checked) => 
                          setCleanupOptions({...cleanupOptions, tempFiles: checked as boolean})
                        }
                      />
                      <Label htmlFor="temp" className="text-gray-300">Remove temporary files</Label>
                    </div>
                    <Badge variant="outline" className="text-xs">~23 MB</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="old-calls"
                        checked={cleanupOptions.oldCallRecords}
                        onCheckedChange={(checked) => 
                          setCleanupOptions({...cleanupOptions, oldCallRecords: checked as boolean})
                        }
                      />
                      <Label htmlFor="old-calls" className="text-gray-300">Archive old call records</Label>
                    </div>
                    <Badge variant="outline" className="text-xs">Older than 1 year</Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
                  <div className="text-sm text-gray-300">
                    <p className="mb-1 font-medium text-yellow-400">Cleanup Warning</p>
                    <p>
                      Data cleanup operations cannot be undone. Please ensure you have recent backups before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCleanupModal(false)}
                  className="border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCleanup}
                  className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Start Cleanup
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}