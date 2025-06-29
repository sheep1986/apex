import { useState } from 'react'
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Play,
  Pause,
  ChevronDown,
  Edit3,
  Trash2,
  Copy,
  Download,
  Share,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Mock data for campaigns
const campaigns = [
  {
    id: '1',
    name: '[AI] [2025-06-10] Campaign Business Development',
    description: 'Enterprise B2B Outreach',
    status: 'active',
    progress: 75,
    leadsCalled: 145,
    answered: 23,
    calledBack: 8,
    opportunities: 3,
    tags: ['B2B', 'Enterprise']
  },
  {
    id: '2',
    name: 'Car Dealers - Malta',
    description: 'Malta Car Dealer',
    status: 'completed',
    progress: 100,
    leadsCalled: 89,
    answered: 34,
    calledBack: 12,
    opportunities: 5,
    tags: ['Car', 'Malta']
  },
  {
    id: '3',
    name: 'UK Cleaning Services Outreach',
    description: 'UK Cleaning companies',
    status: 'bounces',
    progress: 48,
    leadsCalled: 67,
    answered: 8,
    calledBack: 2,
    opportunities: 0,
    bounceRate: 48,
    tags: ['UK Cleaning companies']
  },
  {
    id: '4',
    name: 'SaaS Startup Outreach',
    description: 'Technology Startups',
    status: 'draft',
    progress: 0,
    leadsCalled: 0,
    answered: 0,
    calledBack: 0,
    opportunities: 0,
    tags: ['SaaS', 'Tech']
  },
  {
    id: '5',
    name: 'Healthcare Providers Campaign',
    description: 'Medical Practice Outreach',
    status: 'paused',
    progress: 32,
    leadsCalled: 45,
    answered: 12,
    calledBack: 3,
    opportunities: 1,
    tags: ['Healthcare']
  }
]

// Mock call data for demonstration
const mockCalls = [
  {
    id: 'call-1',
    status: 'Interested',
    contact: 'Michael Chen',
    date: '2025-06-28 10:15',
    duration: '3:24',
    sentiment: 'Positive',
    outcome: 'Interested',
    transcript: 'Hi Michael, this is Alex from TechCorp Solutions. I wanted to discuss how our AI platform can help your business...',
    fullTranscript: `Hi Michael, this is Alex from TechCorp Solutions. I wanted to discuss how our AI platform can help your business streamline operations and increase sales.\n\nMichael: That sounds interesting. Can you tell me more about the integration process?\n\nAlex: Absolutely! We offer seamless integration with your existing CRM and tools...`,
    recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    keyInfo: {
      phone: '+1-555-0123',
      campaign: '[AI] [2025-06-10] Campaign Business Development',
      duration: '3:24',
      aiScore: '8.7/10',
      notes: 'Asked about integration. Interested in a demo.'
    }
  },
  {
    id: 'call-2',
    status: 'Meeting booked',
    contact: 'Jennifer Rodriguez',
    date: '2025-06-28 09:50',
    duration: '2:10',
    sentiment: 'Very Positive',
    outcome: 'Meeting Booked',
    transcript: "Hello Jennifer, I'm calling from TechCorp Solutions. I see you booked a meeting for Thursday...",
    fullTranscript: `Hello Jennifer, I'm calling from TechCorp Solutions. I see you booked a meeting for Thursday.\n\nJennifer: Yes, I'm looking forward to learning more about your AI automation.\n\nAlex: Great! I'll send a calendar invite and a demo link...`,
    recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    keyInfo: {
      phone: '+1-555-0456',
      campaign: '[AI] [2025-06-10] Campaign Business Development',
      duration: '2:10',
      aiScore: '9.2/10',
      notes: 'Meeting scheduled for Thursday.'
    }
  },
  {
    id: 'call-3',
    status: 'Not interested',
    contact: 'Robert Kim',
    date: '2025-06-27 16:45',
    duration: '1:05',
    sentiment: 'Negative',
    outcome: 'Not Interested',
    transcript: "Hi Robert, this is Alex from TechCorp Solutions. I wanted to see if you're open to exploring new AI solutions...",
    fullTranscript: `Hi Robert, this is Alex from TechCorp Solutions. I wanted to see if you're open to exploring new AI solutions.\n\nRobert: We're happy with our current provider, thanks.\n\nAlex: Understood! If anything changes, feel free to reach out.`,
    recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    keyInfo: {
      phone: '+1-555-0789',
      campaign: '[AI] [2025-06-10] Campaign Business Development',
      duration: '1:05',
      aiScore: '4.1/10',
      notes: 'Not interested at this time.'
    }
  }
];

const callStatuses = [
  { label: 'Lead', color: 'text-blue-400', icon: '⚡' },
  { label: 'Interested', color: 'text-green-400', icon: '💡' },
  { label: 'Meeting booked', color: 'text-yellow-400', icon: '📅' },
  { label: 'Meeting completed', color: 'text-purple-400', icon: '✅' },
  { label: 'Won', color: 'text-pink-400', icon: '🏆' },
  { label: 'Not interested', color: 'text-red-400', icon: '🚫' },
];

export function Campaigns() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')

  const getStatusBadge = (status: string, bounceRate?: number) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-900 text-blue-400 border-blue-800">Active</Badge>
      case 'completed':
        return <Badge className="bg-green-900 text-green-400 border-green-800">Completed</Badge>
      case 'draft':
        return <Badge className="bg-gray-700 text-gray-300 border-gray-600">Draft</Badge>
      case 'paused':
        return <Badge className="bg-yellow-900 text-yellow-400 border-yellow-800">Paused</Badge>
      case 'bounces':
        return (
          <div className="flex items-center space-x-2">
            <Badge className="bg-red-900 text-red-400 border-red-800">
              Bounces {bounceRate}%
            </Badge>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return b.id.localeCompare(a.id)
      case 'oldest':
        return a.id.localeCompare(b.id)
      case 'name-az':
        return a.name.localeCompare(b.name)
      case 'name-za':
        return b.name.localeCompare(a.name)
      default:
        return 0
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white">Campaigns</h1>
          <p className="text-gray-400 mt-1">Manage your AI calling campaigns and track performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink">
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* Campaigns Management */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Campaign Management</CardTitle>
              <CardDescription className="text-gray-400">
                Monitor and control your AI calling campaigns
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="bounces">Bounces</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name-az">Name A-Z</SelectItem>
                <SelectItem value="name-za">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campaigns Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    <input type="checkbox" className="rounded border-gray-600 bg-gray-800" />
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">CAMPAIGN NAME</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">STATUS</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">PROGRESS</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">LEADS CALLED</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">ANSWERED</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">CALLED BACK</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">OPPORTUNITIES</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {sortedCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-4 px-4">
                      <input type="checkbox" className="rounded border-gray-600 bg-gray-800" />
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="text-white font-medium mb-1">{campaign.name}</div>
                        <div className="text-gray-400 text-sm">{campaign.description}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {campaign.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-400">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(campaign.status, campaign.bounceRate)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Progress value={campaign.progress} className="w-16 h-2" />
                        <span className="text-gray-300 text-sm font-medium">{campaign.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300 font-medium">
                      {campaign.leadsCalled}
                    </td>
                    <td className="py-4 px-4 text-gray-300 font-medium">
                      {campaign.answered}
                    </td>
                    <td className="py-4 px-4 text-gray-300 font-medium">
                      {campaign.calledBack}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-green-400 font-medium">{campaign.opportunities}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-400 hover:text-white p-1"
                          title={campaign.status === 'paused' ? 'Click to resume' : 'Click to pause'}
                        >
                          {campaign.status === 'paused' ? (
                            <Play className="w-4 h-4" />
                          ) : campaign.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-gray-800 border-gray-700">
                            <DropdownMenuItem className="text-gray-300 hover:text-white">
                              <Edit3 className="w-4 h-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-gray-300 hover:text-white">
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate campaign
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-gray-300 hover:text-white">
                              <Download className="w-4 h-4 mr-2" />
                              Download analytics CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-gray-300 hover:text-white">
                              <Share className="w-4 h-4 mr-2" />
                              Share Campaign
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400 hover:text-red-300">
                              <Trash2 className="w-4 h-4 mr-2" />
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

          {sortedCampaigns.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No campaigns found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- New Campaign Calls Section --- */}
      <CampaignCallsSection />
    </div>
  )
}

function CampaignCallsSection() {
  const [selectedCallId, setSelectedCallId] = useState(mockCalls[0].id);
  const selectedCall = mockCalls.find(call => call.id === selectedCallId);

  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Sidebar */}
      <aside className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col space-y-2 min-w-[180px]">
        <h2 className="text-lg font-bold text-white mb-2">Status</h2>
        {callStatuses.map(status => (
          <div key={status.label} className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-800 rounded px-2 py-1 ${status.color}`}>
            <span>{status.icon}</span>
            <span>{status.label}</span>
          </div>
        ))}
      </aside>
      {/* Call List */}
      <section className="col-span-1 md:col-span-1 bg-gray-900 border border-gray-800 rounded-lg p-0 flex flex-col">
        <div className="border-b border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Calls</h2>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
          {mockCalls.map(call => (
            <div
              key={call.id}
              className={`p-4 cursor-pointer hover:bg-gray-800 transition ${selectedCallId === call.id ? 'bg-gray-800' : ''}`}
              onClick={() => setSelectedCallId(call.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`text-xl ${call.status === 'Interested' ? 'text-green-400' : call.status === 'Meeting booked' ? 'text-yellow-400' : call.status === 'Not interested' ? 'text-red-400' : 'text-blue-400'}`}>{callStatuses.find(s => s.label === call.status)?.icon}</span>
                  <span className="font-medium text-white">{call.contact}</span>
                </div>
                <span className="text-xs text-gray-400">{call.date}</span>
              </div>
              <div className="text-gray-400 text-sm mt-1 line-clamp-2">{call.transcript}</div>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-gray-500">{call.duration}</span>
                <span className="text-xs text-gray-500">{call.sentiment}</span>
                <span className="text-xs text-gray-500">{call.outcome}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Call Details */}
      <aside className="col-span-1 bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col">
        {selectedCall && (
          <>
            <div className="flex items-center space-x-3 mb-2">
              <span className={`text-2xl ${callStatuses.find(s => s.label === selectedCall.status)?.color}`}>{callStatuses.find(s => s.label === selectedCall.status)?.icon}</span>
              <span className="text-xl font-bold text-white">{selectedCall.contact}</span>
              <span className="text-xs text-gray-400">{selectedCall.date}</span>
            </div>
            <div className="mb-4">
              <audio controls className="w-full">
                <source src={selectedCall.recordingUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
            <div className="mb-4">
              <h3 className="text-md font-semibold text-white mb-1">Transcript</h3>
              <div className="bg-gray-800 rounded p-3 text-gray-300 text-sm whitespace-pre-line max-h-48 overflow-y-auto">{selectedCall.fullTranscript}</div>
            </div>
            <div className="mb-2">
              <h3 className="text-md font-semibold text-white mb-1">Key Information</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li><b>Phone:</b> {selectedCall.keyInfo.phone}</li>
                <li><b>Campaign:</b> {selectedCall.keyInfo.campaign}</li>
                <li><b>Duration:</b> {selectedCall.keyInfo.duration}</li>
                <li><b>AI Score:</b> {selectedCall.keyInfo.aiScore}</li>
                <li><b>Notes:</b> {selectedCall.keyInfo.notes}</li>
              </ul>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
