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
  Info,
  BarChart3,
  Filter,
  ArrowUpDown,
  Phone,
  Users
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
import { useNavigate } from 'react-router-dom'

// Mock data for campaigns
const initialCampaigns = [
  {
    id: '1',
    name: 'Healthcare Providers Campaign',
    description: 'Medical Practice Outreach',
    status: 'paused',
    progress: 60,
    leadsCalled: 120,
    answered: 30,
    calledBack: 10,
    opportunities: 2,
    tags: ['Healthcare']
  },
  {
    id: '2',
    name: 'SaaS Startup Outreach',
    description: 'Technology Startups',
    status: 'draft',
    progress: 20,
    leadsCalled: 40,
    answered: 5,
    calledBack: 1,
    opportunities: 0,
    tags: ['SaaS', 'Tech']
  },
  {
    id: '3',
    name: 'Car Dealers - Malta',
    description: 'Malta Car Dealer',
    status: 'active',
    progress: 80,
    leadsCalled: 200,
    answered: 50,
    calledBack: 15,
    opportunities: 5,
    tags: ['Car', 'Malta']
  },
  {
    id: '4',
    name: 'UK Cleaning Services Outreach',
    description: 'UK Cleaning companies',
    status: 'disabled',
    progress: 0,
    leadsCalled: 0,
    answered: 0,
    calledBack: 0,
    opportunities: 0,
    tags: ['UK Cleaning companies']
  },
  {
    id: '5',
    name: 'Real Estate Agents - London',
    description: 'London Real Estate Professionals',
    status: 'active',
    progress: 45,
    leadsCalled: 150,
    answered: 35,
    calledBack: 8,
    opportunities: 3,
    tags: ['Real Estate', 'London']
  },
  {
    id: '6',
    name: 'Restaurant Owners - Manchester',
    description: 'Manchester Restaurant Outreach',
    status: 'active',
    progress: 70,
    leadsCalled: 180,
    answered: 45,
    calledBack: 12,
    opportunities: 4,
    tags: ['Restaurant', 'Manchester']
  },
  {
    id: '7',
    name: 'Law Firms - Birmingham',
    description: 'Birmingham Legal Services',
    status: 'paused',
    progress: 30,
    leadsCalled: 90,
    answered: 20,
    calledBack: 5,
    opportunities: 1,
    tags: ['Legal', 'Birmingham']
  },
  {
    id: '8',
    name: 'Dental Practices - Scotland',
    description: 'Scottish Dental Clinics',
    status: 'active',
    progress: 55,
    leadsCalled: 140,
    answered: 32,
    calledBack: 9,
    opportunities: 2,
    tags: ['Dental', 'Scotland']
  },
  {
    id: '9',
    name: 'Fitness Centers - Wales',
    description: 'Welsh Fitness Industry',
    status: 'draft',
    progress: 15,
    leadsCalled: 30,
    answered: 3,
    calledBack: 0,
    opportunities: 0,
    tags: ['Fitness', 'Wales']
  },
  {
    id: '10',
    name: 'IT Consultants - Bristol',
    description: 'Bristol IT Services',
    status: 'active',
    progress: 65,
    leadsCalled: 160,
    answered: 38,
    calledBack: 11,
    opportunities: 3,
    tags: ['IT', 'Bristol']
  },
  {
    id: '11',
    name: 'Marketing Agencies - Leeds',
    description: 'Leeds Marketing Firms',
    status: 'active',
    progress: 75,
    leadsCalled: 190,
    answered: 48,
    calledBack: 14,
    opportunities: 5,
    tags: ['Marketing', 'Leeds']
  },
  {
    id: '12',
    name: 'Construction Companies - Liverpool',
    description: 'Liverpool Construction',
    status: 'paused',
    progress: 40,
    leadsCalled: 110,
    answered: 25,
    calledBack: 6,
    opportunities: 2,
    tags: ['Construction', 'Liverpool']
  },
  {
    id: '13',
    name: 'Financial Advisors - Edinburgh',
    description: 'Edinburgh Financial Services',
    status: 'active',
    progress: 85,
    leadsCalled: 220,
    answered: 55,
    calledBack: 18,
    opportunities: 6,
    tags: ['Finance', 'Edinburgh']
  },
  {
    id: '14',
    name: 'Retail Stores - Cardiff',
    description: 'Cardiff Retail Sector',
    status: 'draft',
    progress: 10,
    leadsCalled: 25,
    answered: 2,
    calledBack: 0,
    opportunities: 0,
    tags: ['Retail', 'Cardiff']
  },
  {
    id: '15',
    name: 'Manufacturing - Sheffield',
    description: 'Sheffield Manufacturing',
    status: 'active',
    progress: 50,
    leadsCalled: 130,
    answered: 30,
    calledBack: 7,
    opportunities: 2,
    tags: ['Manufacturing', 'Sheffield']
  },
  {
    id: '16',
    name: 'Education Centers - Newcastle',
    description: 'Newcastle Education',
    status: 'active',
    progress: 60,
    leadsCalled: 145,
    answered: 35,
    calledBack: 10,
    opportunities: 3,
    tags: ['Education', 'Newcastle']
  },
  {
    id: '17',
    name: 'Transportation - Glasgow',
    description: 'Glasgow Transport Services',
    status: 'paused',
    progress: 35,
    leadsCalled: 95,
    answered: 22,
    calledBack: 5,
    opportunities: 1,
    tags: ['Transport', 'Glasgow']
  },
  {
    id: '18',
    name: 'Healthcare Tech - Oxford',
    description: 'Oxford Health Technology',
    status: 'active',
    progress: 90,
    leadsCalled: 250,
    answered: 65,
    calledBack: 20,
    opportunities: 8,
    tags: ['Health Tech', 'Oxford']
  },
  {
    id: '19',
    name: 'E-commerce - Cambridge',
    description: 'Cambridge Online Retail',
    status: 'active',
    progress: 70,
    leadsCalled: 175,
    answered: 42,
    calledBack: 13,
    opportunities: 4,
    tags: ['E-commerce', 'Cambridge']
  },
  {
    id: '20',
    name: 'Consulting Firms - Belfast',
    description: 'Belfast Business Consulting',
    status: 'draft',
    progress: 5,
    leadsCalled: 15,
    answered: 1,
    calledBack: 0,
    opportunities: 0,
    tags: ['Consulting', 'Belfast']
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
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const allSelected = initialCampaigns.length > 0 && selectedRows.length === initialCampaigns.length;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows([]);
    } else {
      setSelectedRows(initialCampaigns.map((c) => c.id));
    }
  };
  const toggleRow = (id: string) => {
    setSelectedRows((prev) => prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]);
  };
  const [campaigns, setCampaigns] = useState(initialCampaigns);

  // Handler to toggle campaign status between 'active' and 'paused'
  const toggleCampaignStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          if (c.status === 'active') {
            return { ...c, status: 'paused' };
          } else if (c.status === 'paused') {
            return { ...c, status: 'active' };
          } else {
            // For draft, disabled, or any other status, set to active
            return { ...c, status: 'active' };
          }
        }
        return c;
      })
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-block rounded-full bg-green-600 text-white px-3 py-1 text-xs font-semibold">Active</span>;
      case 'disabled':
        return <span className="inline-block rounded-full bg-red-600 text-white px-3 py-1 text-xs font-semibold">Disabled</span>;
      case 'draft':
        return <span className="inline-block rounded-full bg-blue-500 text-white px-3 py-1 text-xs font-semibold">Draft</span>;
      case 'paused':
        return <span className="inline-block rounded-full bg-gray-500 text-white px-3 py-1 text-xs font-semibold">Paused</span>;
      default:
        return null;
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
    <div className="max-w-7xl mx-auto w-full px-4 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white">Campaigns</h1>
          <p className="text-gray-400 mt-1">Manage your AI calling campaigns and track performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink transition-colors"
            onClick={() => navigate('/campaigns/new')}
          >
            <Plus className="w-4 h-4 mr-2 text-white" />
            New Campaign
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
            <div className="w-full sm:w-1/2 max-w-[320px] relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border border-neutral-800 text-white placeholder-gray-400 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[220px] bg-gray-800 border border-gray-800 text-white rounded-lg">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="glassy-dropdown-content rounded-xl shadow-2xl border border-gray-800 bg-gradient-to-br from-gray-900/90 via-gray-950/90 to-black/95 backdrop-blur-xl">
                <SelectItem value="all" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">All statuses</SelectItem>
                <SelectItem value="active" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Active</SelectItem>
                <SelectItem value="disabled" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Disabled</SelectItem>
                <SelectItem value="draft" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Draft</SelectItem>
                <SelectItem value="paused" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Paused</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full bg-gray-800 border border-gray-800 text-white rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glassy-dropdown-content rounded-xl shadow-2xl border border-gray-800 bg-gradient-to-br from-gray-900/90 via-gray-950/90 to-black/95 backdrop-blur-xl">
                <SelectItem value="newest" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Newest first</SelectItem>
                <SelectItem value="oldest" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Oldest first</SelectItem>
                <SelectItem value="name-az" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Name A-Z</SelectItem>
                <SelectItem value="name-za" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campaigns Table */}
          <div
            className="overflow-y-scroll overflow-x-hidden rounded-lg always-show-scrollbar"
            style={{
              maxHeight: 400,
              minHeight: 200,
              border: '1px solid #222',
              background: '#18181b',
              scrollbarWidth: 'auto',
              msOverflowStyle: 'scrollbar',
            }}
          >
            <table className="w-full table-fixed">
              <thead>
                <tr className="bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 sticky top-0 z-10">
                  <th className="w-12 px-2 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="accent-purple-600 focus:ring-2 focus:ring-purple-500 rounded"
                    />
                  </th>
                  <th className="pl-3 pr-2 py-3 text-left text-xs font-medium text-white tracking-wider w-1/4 min-w-[180px]">CAMPAIGN NAME</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white tracking-wider">STATUS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white tracking-wider">PROGRESS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white tracking-wider">LEADS CALLED</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white tracking-wider">ANSWERED</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {sortedCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-zinc-800 hover:bg-zinc-900 transition-colors">
                    <td className="w-12 px-2 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(campaign.id)}
                        onChange={() => toggleRow(campaign.id)}
                        className="accent-purple-600 focus:ring-2 focus:ring-purple-500 rounded"
                      />
                    </td>
                    <td className="pl-3 pr-2 py-3 flex items-center gap-2 min-w-[180px]">
                      <span 
                        className="truncate font-medium text-white text-sm cursor-pointer hover:text-brand-pink transition-colors"
                        onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      >
                        {campaign.name}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="py-4 px-4 align-middle">
                      <div className="flex items-center space-x-2">
                        <div className="w-24">
                          <Progress value={campaign.progress} indicatorClassName="bg-green-500" className="h-2 bg-gray-800" />
                        </div>
                        <span className="text-gray-300 text-sm font-medium">{campaign.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300 font-medium">
                      {campaign.leadsCalled}
                    </td>
                    <td className="py-4 px-4 text-gray-300 font-medium">
                      {campaign.answered}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="relative group bg-transparent hover:bg-transparent p-1"
                          title={campaign.status === 'active' ? 'Click to pause' : 'Click to resume'}
                          onClick={() => toggleCampaignStatus(campaign.id)}
                        >
                          {campaign.status === 'active' ? (
                            <Pause className="w-4 h-4 text-gray-400 group-hover:text-brand-pink transition-colors" />
                          ) : (
                            <Play className="w-4 h-4 text-gray-400 group-hover:text-brand-pink transition-colors" />
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="relative group bg-transparent hover:bg-transparent p-1">
                              <MoreHorizontal className="w-4 h-4 text-gray-400 group-hover:text-brand-pink transition-colors" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-gray-800 border-gray-700">
                            <DropdownMenuItem 
                              className="text-gray-300 hover:text-white"
                              onClick={() => navigate(`/campaigns/${campaign.id}`)}
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              View Details
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
