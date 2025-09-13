import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Play,
  Eye,
  MoreHorizontal,
  FileText,
  MessageSquare,
  User,
  Bot,
  Download,
  Star,
  Flag,
  Archive,
  Trash2,
  Copy,
  Share2,
  ExternalLink,
  Volume2,
  Pause,
  SkipForward,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Mic,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface CallRecord {
  id: string;
  type: 'inbound' | 'outbound' | 'missed';
  contact: {
    name: string;
    phone: string;
    company?: string;
  };
  agent: {
    name: string;
    type: 'human' | 'ai';
  };
  campaign?: {
    name: string;
    id: string;
  };
  startTime: string;
  duration: number;
  outcome:
    | 'connected'
    | 'voicemail'
    | 'no_answer'
    | 'busy'
    | 'failed'
    | 'interested'
    | 'not_interested'
    | 'callback';
  sentiment: 'positive' | 'neutral' | 'negative';
  cost: number;
  recording?: string;
  transcript?: string;
  notes?: string;
  leadId?: string;
  status: 'completed' | 'in-progress' | 'missed' | 'failed';
}

interface CallsTableProps {
  calls: CallRecord[];
  onSelectCall: (call: CallRecord) => void;
  selectedCalls: string[];
  onSelectCalls: (callIds: string[]) => void;
}

export default function CallsTable({
  calls,
  onSelectCall,
  selectedCalls,
  onSelectCalls,
}: CallsTableProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getCallIcon = (type: string) => {
    const iconClass = 'w-4 h-4';
    switch (type) {
      case 'inbound':
        return <PhoneIncoming className={cn(iconClass, 'text-blue-400')} />;
      case 'outbound':
        return <PhoneOutgoing className={cn(iconClass, 'text-emerald-400')} />;
      case 'missed':
        return <PhoneMissed className={cn(iconClass, 'text-red-400')} />;
      default:
        return <Phone className={iconClass} />;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    const baseClass = 'text-xs font-medium px-2 py-0.5';
    switch (outcome) {
      case 'connected':
      case 'interested':
        return (
          <Badge
            className={cn(baseClass, 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400')}
          >
            {outcome}
          </Badge>
        );
      case 'callback':
        return (
          <Badge className={cn(baseClass, 'border-blue-500/20 bg-blue-500/10 text-blue-400')}>
            {outcome}
          </Badge>
        );
      case 'voicemail':
        return (
          <Badge className={cn(baseClass, 'border-orange-500/20 bg-orange-500/10 text-orange-400')}>
            {outcome}
          </Badge>
        );
      case 'not_interested':
      case 'failed':
        return (
          <Badge className={cn(baseClass, 'border-red-500/20 bg-red-500/10 text-red-400')}>
            {outcome}
          </Badge>
        );
      default:
        return (
          <Badge className={cn(baseClass, 'border-zinc-600 bg-zinc-700 text-zinc-400')}>
            {outcome}
          </Badge>
        );
    }
  };

  const getSentimentIndicator = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return (
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3 text-green-400" />
            <span className="text-xs text-green-400">Positive</span>
          </div>
        );
      case 'negative':
        return (
          <div className="flex items-center space-x-1">
            <TrendingDown className="h-3 w-3 text-red-400" />
            <span className="text-xs text-red-400">Negative</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded-full bg-zinc-600" />
            <span className="text-xs text-zinc-400">Neutral</span>
          </div>
        );
    }
  };

  const handlePlayRecording = (e: React.MouseEvent, call: CallRecord) => {
    e.stopPropagation();
    if (call.recording) {
      if (playingCallId === call.id) {
        setPlayingCallId(null);
        toast({
          title: 'Recording Paused',
          description: `Paused recording for ${call.contact.name}`,
        });
      } else {
        setPlayingCallId(call.id);
        toast({
          title: 'Playing Recording',
          description: `Playing recording for ${call.contact.name}`,
        });
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectCalls(calls.map((call) => call.id));
    } else {
      onSelectCalls([]);
    }
  };

  const handleSelectCall = (callId: string, checked: boolean) => {
    if (checked) {
      onSelectCalls([...selectedCalls, callId]);
    } else {
      onSelectCalls(selectedCalls.filter((id) => id !== callId));
    }
  };

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={selectedCalls.length === calls.length && calls.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="border-zinc-600"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Campaign</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Duration</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Outcome</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Sentiment</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Assistant</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Cost</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => (
              <tr
                key={call.id}
                className={cn(
                  'cursor-pointer border-b border-zinc-800 transition-all duration-200',
                  hoveredRow === call.id && 'bg-zinc-900/50',
                  selectedCalls.includes(call.id) && 'bg-zinc-900'
                )}
                onMouseEnter={() => setHoveredRow(call.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onSelectCall(call)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedCalls.includes(call.id)}
                    onCheckedChange={(checked) => handleSelectCall(call.id, checked as boolean)}
                    className="border-zinc-600"
                  />
                </td>
                <td className="px-4 py-3">
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                        {getCallIcon(call.type)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="capitalize">{call.type} call</p>
                    </TooltipContent>
                  </Tooltip>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="flex items-center gap-2 font-medium text-white">
                      {call.contact.name}
                      {call.status === 'in-progress' && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                          Live
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-zinc-500">{call.contact.phone}</p>
                    {call.contact.company && (
                      <p className="mt-0.5 text-xs text-zinc-600">{call.contact.company}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {call.campaign ? (
                    <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                      {call.campaign.name}
                    </Badge>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-zinc-500" />
                    <span className="text-white">{formatDuration(call.duration)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{getOutcomeBadge(call.outcome)}</td>
                <td className="px-4 py-3">{getSentimentIndicator(call.sentiment)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {call.agent.type === 'ai' ? (
                      <Bot className="h-4 w-4 text-blue-400" />
                    ) : (
                      <User className="h-4 w-4 text-zinc-400" />
                    )}
                    <span className="text-sm text-white">{call.agent.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-zinc-500" />
                    <span className="text-white">{call.cost.toFixed(2)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-400">{formatDate(call.startTime)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {call.recording && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handlePlayRecording(e, call)}
                            className="p-1.5 hover:bg-zinc-800"
                          >
                            {playingCallId === call.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{playingCallId === call.id ? 'Pause' : 'Play'} recording</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {call.transcript && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast({
                                title: 'Transcript Available',
                                description: 'Opening transcript viewer...',
                              });
                            }}
                            className="p-1.5 hover:bg-zinc-800"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View transcript</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="p-1.5 hover:bg-zinc-800">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-zinc-800 bg-zinc-900">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem onClick={() => navigate(`/calls/${call.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {call.leadId && (
                          <DropdownMenuItem onClick={() => navigate(`/leads/${call.leadId}`)}>
                            <User className="mr-2 h-4 w-4" />
                            View Lead
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Add Note
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Flag className="mr-2 h-4 w-4" />
                          Flag for Review
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download Recording
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem className="text-red-400">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}
