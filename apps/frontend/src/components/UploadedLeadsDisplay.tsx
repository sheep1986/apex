import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import {
  Users,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Building,
  Download,
  Play,
} from 'lucide-react';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  company?: string;
  title?: string;
  status:
    | 'pending'
    | 'called'
    | 'connected'
    | 'no_answer'
    | 'voicemail'
    | 'busy'
    | 'failed'
    | 'completed'
    | 'do_not_call';
  callAttempts: number;
  lastCallAt?: string;
}

interface UploadedLeadsDisplayProps {
  leads: Lead[];
  campaignId: string;
  campaignName: string;
  onStartCampaign?: (campaignId: string) => void;
  onDownloadReport?: (campaignId: string) => void;
}

export function UploadedLeadsDisplay({
  leads,
  campaignId,
  campaignName,
  onStartCampaign,
  onDownloadReport,
}: UploadedLeadsDisplayProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'called':
        return 'bg-blue-100 text-blue-800';
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'no_answer':
        return 'bg-gray-100 text-gray-800';
      case 'voicemail':
        return 'bg-purple-100 text-purple-800';
      case 'busy':
        return 'bg-orange-100 text-orange-800';
      case 'do_not_call':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const stats = {
    total: leads.length,
    pending: leads.filter((l) => l.status === 'pending').length,
    called: leads.filter((l) => l.status === 'called').length,
    connected: leads.filter((l) => l.status === 'connected').length,
    completed: leads.filter((l) => l.status === 'completed').length,
    failed: leads.filter((l) => l.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{campaignName}</h2>
          <p className="text-sm text-gray-500">Campaign ID: {campaignId}</p>
        </div>
        <div className="flex space-x-2">
          {onDownloadReport && (
            <Button variant="outline" onClick={() => onDownloadReport(campaignId)}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
          {onStartCampaign && stats.pending > 0 && (
            <Button onClick={() => onStartCampaign(campaignId)}>
              <Play className="mr-2 h-4 w-4" />
              Start Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.called}</p>
                <p className="text-sm text-gray-500">Called</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.connected}</p>
                <p className="text-sm text-gray-500">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
                <p className="text-sm text-gray-500">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Uploaded Leads ({leads.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(lead.status)}
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {lead.firstName} {lead.lastName}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{lead.phone}</span>
                        </span>
                        {lead.email && (
                          <span className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{lead.email}</span>
                          </span>
                        )}
                        {lead.company && (
                          <span className="flex items-center space-x-1">
                            <Building className="h-3 w-3" />
                            <span>{lead.company}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status.replace('_', ' ')}
                    </Badge>
                    <div className="text-right text-sm text-gray-500">
                      <div>Attempts: {lead.callAttempts}</div>
                      {lead.lastCallAt && (
                        <div>Last: {new Date(lead.lastCallAt).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
