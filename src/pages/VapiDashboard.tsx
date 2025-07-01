import { useState, useEffect } from 'react'
import { 
  Phone, 
  Mic, 
  Users, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Settings,
  Plus,
  Zap,
  Target,
  BarChart3,
  Headphones,
  MessageSquare,
  Calendar,
  Star
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Separator } from '../components/ui/separator'

interface Assistant {
  id: string
  name: string
  status: 'active' | 'paused' | 'draft'
  voice: string
  language: string
  callsToday: number
  successRate: number
  avgDuration: number
  creditsUsed: number
  lastCall: string
}

interface Call {
  id: string
  assistant: string
  phoneNumber: string
  status: 'connecting' | 'in-progress' | 'completed' | 'failed'
  duration: number
  sentiment: 'positive' | 'neutral' | 'negative'
  outcome: string
  timestamp: string
}

export function VapiDashboard() {
  const [assistants, setAssistants] = useState<Assistant[]>([
    {
      id: '1',
      name: 'Sales Assistant Sarah',
      status: 'active',
      voice: 'shimmer',
      language: 'English',
      callsToday: 47,
      successRate: 89,
      avgDuration: 127,
      creditsUsed: 23.50,
      lastCall: '2 minutes ago'
    },
    {
      id: '2',
      name: 'Support Agent Mike',
      status: 'active',
      voice: 'joe',
      language: 'English',
      callsToday: 23,
      successRate: 94,
      avgDuration: 89,
      creditsUsed: 12.75,
      lastCall: '5 minutes ago'
    },
    {
      id: '3',
      name: 'Lead Qualifier Emma',
      status: 'paused',
      voice: 'emma',
      language: 'English',
      callsToday: 0,
      successRate: 78,
      avgDuration: 156,
      creditsUsed: 0,
      lastCall: '1 hour ago'
    }
  ])

  const [activeCalls, setActiveCalls] = useState<Call[]>([
    {
      id: 'call-1',
      assistant: 'Sales Assistant Sarah',
      phoneNumber: '+1 (555) 123-4567',
      status: 'in-progress',
      duration: 45,
      sentiment: 'positive',
      outcome: 'Lead Qualified',
      timestamp: '2 minutes ago'
    },
    {
      id: 'call-2',
      assistant: 'Support Agent Mike',
      phoneNumber: '+1 (555) 987-6543',
      status: 'connecting',
      duration: 0,
      sentiment: 'neutral',
      outcome: 'Connecting...',
      timestamp: 'Just now'
    }
  ])

  const [credits, setCredits] = useState({
    balance: 1247.50,
    usedToday: 36.25,
    totalCalls: 70,
    avgCostPerCall: 0.52
  })

  const toggleAssistantStatus = (id: string) => {
    setAssistants(prev => prev.map(assistant => 
      assistant.id === id 
        ? { ...assistant, status: assistant.status === 'active' ? 'paused' : 'active' }
        : assistant
    ))
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Vapi AI Dashboard</h1>
            <p className="text-gray-400">Real-time AI calling management and analytics</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="bg-green-900 text-green-400 border-green-800">
              <Activity className="w-3 h-3 mr-1" />
              All Systems Operational
            </Badge>
            <Button className="bg-gradient-to-r from-brand-pink to-brand-magenta">
              <Plus className="w-4 h-4 mr-2" />
              New Assistant
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Calls</p>
                  <p className="text-2xl font-bold text-white">{activeCalls.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400">+12% from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Credits Balance</p>
                  <p className="text-2xl font-bold text-white">${credits.balance.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-brand-pink/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-brand-pink" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">Used today: ${credits.usedToday}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Calls Today</p>
                  <p className="text-2xl font-bold text-white">{credits.totalCalls}</p>
                </div>
                <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">Avg cost: ${credits.avgCostPerCall}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-white">87%</p>
                </div>
                <div className="w-12 h-12 bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-400">+5% this week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="assistants" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-gray-800">
            <TabsTrigger value="assistants" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              AI Assistants
            </TabsTrigger>
            <TabsTrigger value="calls" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Phone className="w-4 h-4 mr-2" />
              Live Calls
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assistants" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {assistants.map((assistant) => (
                <Card key={assistant.id} className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-brand-pink/20 text-brand-pink">
                            {assistant.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-white">{assistant.name}</CardTitle>
                          <CardDescription className="text-gray-400">
                            {assistant.voice} • {assistant.language}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAssistantStatus(assistant.id)}
                        className={`${
                          assistant.status === 'active' 
                            ? 'text-green-400 hover:text-green-300' 
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                      >
                        {assistant.status === 'active' ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={`${
                          assistant.status === 'active' 
                            ? 'bg-green-900 text-green-400 border-green-800'
                            : assistant.status === 'paused'
                            ? 'bg-yellow-900 text-yellow-400 border-yellow-800'
                            : 'bg-gray-700 text-gray-300 border-gray-600'
                        }`}
                      >
                        {assistant.status.charAt(0).toUpperCase() + assistant.status.slice(1)}
                      </Badge>
                      {assistant.status === 'active' && (
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Calls Today</p>
                        <p className="text-lg font-semibold text-white">{assistant.callsToday}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Success Rate</p>
                        <p className="text-lg font-semibold text-white">{assistant.successRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Avg Duration</p>
                        <p className="text-lg font-semibold text-white">{assistant.avgDuration}s</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Credits Used</p>
                        <p className="text-lg font-semibold text-white">${assistant.creditsUsed}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Last call: {assistant.lastCall}</span>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calls" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Live Call Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Real-time monitoring of active AI calls
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeCalls.length === 0 ? (
                  <div className="text-center py-12">
                    <Phone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No active calls at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeCalls.map((call) => (
                      <div key={call.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            call.status === 'in-progress' ? 'bg-green-400 animate-pulse' :
                            call.status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                            'bg-gray-400'
                          }`}></div>
                          <div>
                            <p className="text-white font-medium">{call.assistant}</p>
                            <p className="text-gray-400 text-sm">{call.phoneNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-white font-medium">{call.duration}s</p>
                            <p className="text-gray-400 text-sm">{call.status}</p>
                          </div>
                          <Badge className={`${
                            call.sentiment === 'positive' ? 'bg-green-900 text-green-400' :
                            call.sentiment === 'negative' ? 'bg-red-900 text-red-400' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {call.sentiment}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Headphones className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Call Performance</CardTitle>
                  <CardDescription className="text-gray-400">
                    Last 7 days performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Calls</span>
                      <span className="text-white font-semibold">1,247</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Success Rate</span>
                      <span className="text-green-400 font-semibold">87%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Avg Duration</span>
                      <span className="text-white font-semibold">2m 13s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Credits Used</span>
                      <span className="text-white font-semibold">$647.50</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Voice Performance</CardTitle>
                  <CardDescription className="text-gray-400">
                    Top performing AI voices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { voice: 'shimmer', successRate: 94, calls: 456, rating: 4.8 },
                      { voice: 'joe', successRate: 89, calls: 342, rating: 4.6 },
                      { voice: 'emma', successRate: 87, calls: 289, rating: 4.5 },
                      { voice: 'mike', successRate: 85, calls: 234, rating: 4.3 }
                    ].map((voice, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-brand-pink/20 rounded-full flex items-center justify-center">
                            <Mic className="w-4 h-4 text-brand-pink" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{voice.voice}</p>
                            <p className="text-gray-400 text-sm">{voice.calls} calls</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-semibold">{voice.successRate}%</p>
                          <div className="flex items-center text-yellow-400">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-sm ml-1">{voice.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 