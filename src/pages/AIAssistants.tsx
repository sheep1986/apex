import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Activity,
    Bot,
    Copy,
    Edit,
    MessageSquare,
    Phone,
    Plus,
    Search,
    Trash2
} from 'lucide-react';
import { useState } from 'react';

interface Assistant {
  id: string;
  name: string;
  type: 'inbound' | 'outbound' | 'web';
  status: 'active' | 'inactive';
  model: string;
  voice: string;
  calls: number;
  avgDuration: string;
  successRate: number;
}

export default function AIAssistants() {
  const [searchQuery, setSearchQuery] = useState('');

  const assistants: Assistant[] = [
    {
      id: '1',
      name: 'Sales Qualifier Bot',
      type: 'outbound',
      status: 'active',
      model: 'GPT-4',
      voice: 'Rachel (Premium)',
      calls: 1234,
      avgDuration: '3:45',
      successRate: 78,
    },
    {
      id: '2',
      name: 'Customer Support Agent',
      type: 'inbound',
      status: 'active',
      model: 'GPT-3.5 Turbo',
      voice: 'OpenAI - Alloy',
      calls: 5678,
      avgDuration: '5:12',
      successRate: 92,
    },
    {
      id: '3',
      name: 'Appointment Scheduler',
      type: 'web',
      status: 'inactive',
      model: 'Claude 3',
      voice: 'Deepgram - Nova',
      calls: 890,
      avgDuration: '2:30',
      successRate: 85,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400">Manage your high-fidelity voice assistants</p>
          </div>
          <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Assistant
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Assistants</p>
                  <p className="text-2xl font-bold text-white">3</p>
                </div>
                <Bot className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Assistants</p>
                  <p className="text-2xl font-bold text-white">2</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Calls</p>
                  <p className="text-2xl font-bold text-white">7,802</p>
                </div>
                <Phone className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Success Rate</p>
                  <p className="text-2xl font-bold text-white">85%</p>
                </div>
                <MessageSquare className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="text"
            placeholder="Search assistants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-gray-700 bg-gray-900/50 pl-10 text-white placeholder-gray-500 focus:border-emerald-500"
          />
        </div>

        {/* Assistants Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assistants.map((assistant) => (
            <Card
              key={assistant.id}
              className="border-gray-800 bg-gray-900 transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">{assistant.name}</CardTitle>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={assistant.type === 'outbound' ? 'default' : 'secondary'}>
                        {assistant.type}
                      </Badge>
                      <Badge variant={assistant.status === 'active' ? 'default' : 'outline'}>
                        {assistant.status}
                      </Badge>
                    </div>
                  </div>
                  <Bot className="h-6 w-6 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Model:</span>
                    <span className="font-medium text-white">{assistant.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Voice:</span>
                    <span className="font-medium text-white">{assistant.voice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Calls:</span>
                    <span className="font-medium text-white">
                      {assistant.calls.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Duration:</span>
                    <span className="font-medium text-white">{assistant.avgDuration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Success Rate:</span>
                    <span className="font-medium text-emerald-400">{assistant.successRate}%</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-700 bg-gray-900 text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
