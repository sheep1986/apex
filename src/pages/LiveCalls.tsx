import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Clock, 
  MapPin, 
  User, 
  MessageSquare,
  Calendar,
  TrendingUp,
  Users,
  Activity,
  Zap
} from 'lucide-react'

interface TranscriptEntry {
  speaker: string
  text: string
}

interface Call {
  id: string
  agent: {
    name: string
    avatar: string
    status: 'online' | 'offline' | 'busy'
  }
  prospect: {
    name: string
    phone: string
    location: string
  }
  status: 'ringing' | 'connected' | 'voicemail' | 'ended'
  duration: number
  startTime: string
  campaign: string
  sentiment: 'positive' | 'neutral' | 'negative'
  transcript: TranscriptEntry[]
}

const mockActiveCalls: Call[] = [
  {
    id: '1',
    agent: {
      name: 'Sarah Johnson',
      avatar: '/avatars/sarah.jpg',
      status: 'online'
    },
    prospect: {
      name: 'Michael Chen',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA'
    },
    status: 'connected',
    duration: 245, // 4:05
    startTime: '2025-01-07T10:30:00Z',
    campaign: 'Tech Startup Outreach',
    sentiment: 'positive',
    transcript: [
      { speaker: 'Agent', text: 'Hi Michael, this is Sarah from TechCorp. How are you today?' },
      { speaker: 'Prospect', text: 'Hi Sarah, I\'m doing well, thanks for asking.' },
      { speaker: 'Agent', text: 'Great! I\'m reaching out because we noticed your company is growing rapidly.' },
      { speaker: 'Prospect', text: 'Yes, we\'ve been quite busy lately. What can I help you with?' }
    ]
  },
  {
    id: '2',
    agent: {
      name: 'Mike Rodriguez',
      avatar: '/avatars/mike.jpg',
      status: 'online'
    },
    prospect: {
      name: 'Emily Davis',
      phone: '+1 (555) 987-6543',
      location: 'Austin, TX'
    },
    status: 'ringing',
    duration: 12,
    startTime: '2025-01-07T10:35:00Z',
    campaign: 'SaaS Sales Campaign',
    sentiment: 'neutral',
    transcript: []
  },
  {
    id: '3',
    agent: {
      name: 'Emma Wilson',
      avatar: '/avatars/emma.jpg',
      status: 'online'
    },
    prospect: {
      name: 'David Thompson',
      phone: '+1 (555) 456-7890',
      location: 'Seattle, WA'
    },
    status: 'voicemail',
    duration: 180,
    startTime: '2025-01-07T10:25:00Z',
    campaign: 'Enterprise Solutions',
    sentiment: 'neutral',
    transcript: [
      { speaker: 'Agent', text: 'Hi David, this is Emma calling about your recent inquiry.' },
      { speaker: 'System', text: 'Voicemail recording...' }
    ]
  }
]

const mockRecentCalls: Call[] = [
  {
    id: '4',
    agent: {
      name: 'David Kim',
      avatar: '/avatars/david.jpg',
      status: 'offline'
    },
    prospect: {
      name: 'Lisa Anderson',
      phone: '+1 (555) 321-6547',
      location: 'Denver, CO'
    },
    status: 'ended',
    duration: 420,
    startTime: '2025-01-07T09:45:00Z',
    campaign: 'Lead Qualification',
    sentiment: 'positive',
    transcript: []
  },
  {
    id: '5',
    agent: {
      name: 'Sarah Johnson',
      avatar: '/avatars/sarah.jpg',
      status: 'online'
    },
    prospect: {
      name: 'Robert Wilson',
      phone: '+1 (555) 789-1234',
      location: 'Chicago, IL'
    },
    status: 'ended',
    duration: 180,
    startTime: '2025-01-07T09:30:00Z',
    campaign: 'Tech Startup Outreach',
    sentiment: 'negative',
    transcript: []
  }
]

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'bg-green-500'
    case 'ringing':
      return 'bg-yellow-500'
    case 'voicemail':
      return 'bg-blue-500'
    case 'ended':
      return 'bg-gray-500'
    default:
      return 'bg-gray-500'
  }
}

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return 'text-green-400'
    case 'negative':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
}

const getAgentStatusColor = (status: string) => {
  switch (status) {
    case 'online':
      return 'bg-green-500'
    case 'busy':
      return 'bg-yellow-500'
    case 'offline':
      return 'bg-gray-500'
    default:
      return 'bg-gray-500'
  }
}

export function LiveCalls() {
  const [activeTab, setActiveTab] = useState('active')

  const stats = [
    {
      label: 'Active Calls',
      value: mockActiveCalls.length.toString(),
      icon: PhoneCall,
      color: 'bg-green-500 text-white'
    },
    {
      label: 'Avg Duration',
      value: '3:42',
      icon: Clock,
      color: 'bg-blue-500 text-white'
    },
    {
      label: 'Success Rate',
      value: '78%',
      icon: TrendingUp,
      color: 'bg-pink-500 text-white'
    },
    {
      label: 'Online Agents',
      value: '4',
      icon: Users,
      color: 'bg-purple-500 text-white'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto w-full px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-2">Live Calls</h1>
          <p className="text-gray-400">Monitor active calls and agent performance in real-time</p>
        </div>
        <Button className="bg-gradient-to-r from-brand-pink to-brand-magenta text-white font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-all duration-200">
          <Phone className="w-4 h-4 mr-2" />
          Start New Call
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/80 backdrop-blur-md shadow-xl p-0">
            <CardContent className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg shadow-md flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full bg-gray-900/80 border border-gray-800 rounded-full p-1 gap-2 shadow-lg">
          <TabsTrigger 
            value="active" 
            className="flex-1 rounded-full px-6 py-2 text-base font-semibold transition-all duration-200 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=inactive]:bg-gray-900/0 data-[state=inactive]:text-gray-400 focus:outline-none"
          >
            Active Calls ({mockActiveCalls.length})
          </TabsTrigger>
          <TabsTrigger 
            value="recent" 
            className="flex-1 rounded-full px-6 py-2 text-base font-semibold transition-all duration-200 data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=inactive]:bg-gray-900/0 data-[state=inactive]:text-gray-400 focus:outline-none"
          >
            Recent Calls ({mockRecentCalls.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            {mockActiveCalls.map((call) => (
              <Card key={call.id} className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/90 backdrop-blur-md shadow-xl p-0">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-gray-800">
                        <AvatarImage src={call.agent.avatar} alt={call.agent.name} />
                        <AvatarFallback className="bg-gray-800 text-white">
                          {call.agent.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-base font-bold text-white leading-tight">{call.agent.name}</h3>
                        <p className="text-xs text-gray-400">Agent</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full border-2 border-gray-900 ml-2 ${getAgentStatusColor(call.agent.status)}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(call.status)} text-white`}>
                        {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-400 ml-2">{formatDuration(call.duration)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Prospect Info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <User className="w-4 h-4 text-gray-400" />
                        {call.prospect.name}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {call.prospect.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {call.prospect.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Activity className="w-4 h-4 text-gray-400" />
                        {call.campaign}
                      </div>
                    </div>
                    {/* Live Transcript - always show */}
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Live Transcript</h4>
                      <div className="bg-gray-900/70 rounded-lg p-2 max-h-24 overflow-y-auto border border-gray-800 text-sm">
                        {call.transcript.length > 0 ? (
                          call.transcript.map((entry, index) => (
                            <div key={index} className="mb-1 last:mb-0">
                              <span className={`font-medium ${entry.speaker === 'Agent' ? 'text-pink-400' : entry.speaker === 'Prospect' ? 'text-blue-400' : 'text-gray-400'}`}>{entry.speaker}:</span>
                              <span className="ml-2 text-gray-300">{entry.text}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500 italic">No transcript yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800">
                    <span className={`text-xs ${getSentimentColor(call.sentiment)}`}>Sentiment: {call.sentiment.charAt(0).toUpperCase() + call.sentiment.slice(1)}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="rounded-md p-1 h-7 w-7 border border-pink-400 hover:bg-pink-900/20 transition-all duration-200">
                        <MessageSquare className="w-3 h-3 text-pink-400" />
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-md p-1 h-7 w-7 border border-pink-400 hover:bg-pink-900/20 transition-all duration-200">
                        <Calendar className="w-3 h-3 text-pink-400" />
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-md p-1 h-7 w-7 border border-red-400 hover:bg-red-900/20 transition-all duration-200">
                        <PhoneOff className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <div className="space-y-4">
            {mockRecentCalls.map((call) => (
              <Card key={call.id} className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/90 backdrop-blur-md shadow-xl p-0">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10 border border-gray-800">
                        <AvatarImage src={call.agent.avatar} alt={call.agent.name} />
                        <AvatarFallback className="bg-gray-800 text-white">
                          {call.agent.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-base font-semibold text-white">{call.agent.name}</h3>
                        <p className="text-sm text-gray-400">{call.prospect.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{formatDuration(call.duration)}</p>
                        <p className="text-xs text-gray-400">Duration</p>
                      </div>
                      <Badge className={`px-2 py-1 rounded-full text-xs ${getStatusColor(call.status)} text-white`}>
                        {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                      </Badge>
                      <span className={`text-sm ${getSentimentColor(call.sentiment)}`}>
                        {call.sentiment.charAt(0).toUpperCase() + call.sentiment.slice(1)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 