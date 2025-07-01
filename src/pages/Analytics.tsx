import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Phone, 
  Mic, 
  Target, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Activity,
  PieChart,
  LineChart,
  BarChart,
  MapPin,
  Globe,
  Star,
  MessageSquare
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
// Removed useBalance import - using mock data instead

interface AnalyticsData {
  overview: {
    totalCalls: number
    successRate: number
    avgDuration: number
    totalRevenue: number
    activeCampaigns: number
    totalAssistants: number
  }
  trends: {
    calls: { date: string; value: number }[]
    revenue: { date: string; value: number }[]
    successRate: { date: string; value: number }[]
  }
  campaigns: {
    id: string
    name: string
    calls: number
    successRate: number
    revenue: number
    status: 'active' | 'paused' | 'completed'
  }[]
  assistants: {
    id: string
    name: string
    calls: number
    successRate: number
    avgDuration: number
    rating: number
  }[]
  topPerformers: {
    type: 'campaign' | 'assistant' | 'voice'
    name: string
    metric: string
    value: number
    change: number
  }[]
}

export function Analytics() {
  // Mock balance data - in real app this would come from context
  const balance = 1247.00
  const [timeRange, setTimeRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<AnalyticsData>({
    overview: {
      totalCalls: 1247,
      successRate: 87,
      avgDuration: 133,
      totalRevenue: 647.50,
      activeCampaigns: 12,
      totalAssistants: 8
    },
    trends: {
      calls: [
        { date: 'Mon', value: 45 }, { date: 'Tue', value: 52 }, { date: 'Wed', value: 48 },
        { date: 'Thu', value: 61 }, { date: 'Fri', value: 55 }, { date: 'Sat', value: 38 },
        { date: 'Sun', value: 42 }
      ],
      revenue: [
        { date: 'Mon', value: 23.50 }, { date: 'Tue', value: 27.25 }, { date: 'Wed', value: 24.75 },
        { date: 'Thu', value: 31.50 }, { date: 'Fri', value: 28.75 }, { date: 'Sat', value: 19.50 },
        { date: 'Sun', value: 21.75 }
      ],
      successRate: [
        { date: 'Mon', value: 85 }, { date: 'Tue', value: 89 }, { date: 'Wed', value: 87 },
        { date: 'Thu', value: 91 }, { date: 'Fri', value: 88 }, { date: 'Sat', value: 82 },
        { date: 'Sun', value: 86 }
      ]
    },
    campaigns: [
      { id: '1', name: 'Sales Outreach Q4', calls: 234, successRate: 89, revenue: 156.75, status: 'active' },
      { id: '2', name: 'Customer Support', calls: 189, successRate: 94, revenue: 98.50, status: 'active' },
      { id: '3', name: 'Lead Qualification', calls: 156, successRate: 78, revenue: 87.25, status: 'active' },
      { id: '4', name: 'Appointment Booking', calls: 98, successRate: 91, revenue: 67.80, status: 'paused' }
    ],
    assistants: [
      { id: '1', name: 'Sales Assistant Sarah', calls: 456, successRate: 94, avgDuration: 127, rating: 4.8 },
      { id: '2', name: 'Support Agent Mike', calls: 342, successRate: 89, avgDuration: 89, rating: 4.6 },
      { id: '3', name: 'Lead Qualifier Emma', calls: 289, successRate: 87, avgDuration: 156, rating: 4.5 },
      { id: '4', name: 'Booking Agent John', calls: 234, successRate: 85, avgDuration: 98, rating: 4.3 }
    ],
    topPerformers: [
      { type: 'campaign', name: 'Sales Outreach Q4', metric: 'Success Rate', value: 89, change: 12 },
      { type: 'assistant', name: 'Sales Assistant Sarah', metric: 'Calls Handled', value: 456, change: 8 },
      { type: 'voice', name: 'shimmer', metric: 'Rating', value: 4.8, change: 5 }
    ]
  })

  const refreshData = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  useEffect(() => {
    refreshData()
  }, [timeRange])

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`

  return (
    <div className="max-w-7xl mx-auto w-full px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-gray-400">Comprehensive insights across campaigns, AI assistants, and performance metrics</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-gray-900 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refreshData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Calls</p>
                  <p className="text-2xl font-bold text-white">{data.overview.totalCalls.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400">+12% from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-white">{data.overview.successRate}%</p>
                </div>
                <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400">+5% from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Avg Duration</p>
                  <p className="text-2xl font-bold text-white">{formatDuration(data.overview.avgDuration)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                <span className="text-red-400">-3% from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Revenue</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(data.overview.totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-brand-pink/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-brand-pink" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400">+18% from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Campaigns</p>
                  <p className="text-2xl font-bold text-white">{data.overview.activeCampaigns}</p>
                </div>
                <div className="w-12 h-12 bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">2 paused, 1 completed</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">AI Assistants</p>
                  <p className="text-2xl font-bold text-white">{data.overview.totalAssistants}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <Mic className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">6 active, 2 paused</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900 border-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Target className="w-4 h-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="assistants" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Mic className="w-4 h-4 mr-2" />
              AI Assistants
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trends Chart */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Call Volume Trends</CardTitle>
                  <CardDescription className="text-gray-400">
                    Daily call volume over the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between space-x-2">
                    {data.trends.calls.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-gradient-to-t from-brand-pink to-brand-magenta rounded-t"
                          style={{ height: `${(item.value / 70) * 100}%` }}
                        ></div>
                        <span className="text-xs text-gray-400 mt-2">{item.date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Success Rate Chart */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Success Rate Trends</CardTitle>
                  <CardDescription className="text-gray-400">
                    Daily success rate performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between space-x-2">
                    {data.trends.successRate.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                          style={{ height: `${item.value}%` }}
                        ></div>
                        <span className="text-xs text-gray-400 mt-2">{item.date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Top Performers</CardTitle>
                <CardDescription className="text-gray-400">
                  Best performing campaigns, assistants, and voices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {data.topPerformers.map((performer, index) => (
                    <div key={index} className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={`${
                          performer.type === 'campaign' ? 'bg-blue-900 text-blue-400' :
                          performer.type === 'assistant' ? 'bg-purple-900 text-purple-400' :
                          'bg-green-900 text-green-400'
                        }`}>
                          {performer.type.charAt(0).toUpperCase() + performer.type.slice(1)}
                        </Badge>
                        <div className="flex items-center text-sm">
                          <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                          <span className="text-green-400">+{performer.change}%</span>
                        </div>
                      </div>
                      <h4 className="text-white font-medium mb-1">{performer.name}</h4>
                      <p className="text-gray-400 text-sm mb-2">{performer.metric}</p>
                      <p className="text-2xl font-bold text-white">
                        {performer.type === 'voice' ? performer.value.toFixed(1) : performer.value.toLocaleString()}
                        {performer.type === 'voice' && <Star className="w-4 h-4 text-yellow-400 inline ml-1" />}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Campaign Performance</CardTitle>
                <CardDescription className="text-gray-400">
                  Detailed performance metrics for all campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-brand-pink/20 rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 text-brand-pink" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{campaign.name}</p>
                          <p className="text-gray-400 text-sm">{campaign.calls.toLocaleString()} calls</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-white font-medium">{campaign.successRate}%</p>
                          <p className="text-gray-400 text-sm">Success Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-medium">{formatCurrency(campaign.revenue)}</p>
                          <p className="text-gray-400 text-sm">Revenue</p>
                        </div>
                        <Badge className={`${
                          campaign.status === 'active' ? 'bg-green-900 text-green-400' :
                          campaign.status === 'paused' ? 'bg-yellow-900 text-yellow-400' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assistants" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">AI Assistant Performance</CardTitle>
                <CardDescription className="text-gray-400">
                  Performance metrics for all AI assistants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.assistants.map((assistant) => (
                    <div key={assistant.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-indigo-900/20 rounded-lg flex items-center justify-center">
                          <Mic className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{assistant.name}</p>
                          <p className="text-gray-400 text-sm">{assistant.calls.toLocaleString()} calls handled</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-white font-medium">{assistant.successRate}%</p>
                          <p className="text-gray-400 text-sm">Success Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-medium">{formatDuration(assistant.avgDuration)}</p>
                          <p className="text-gray-400 text-sm">Avg Duration</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-white font-medium ml-1">{assistant.rating}</span>
                          </div>
                          <p className="text-gray-400 text-sm">Rating</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Key Performance Indicators</CardTitle>
                  <CardDescription className="text-gray-400">
                    Critical metrics for platform performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Call Success Rate</span>
                      <span className="text-white">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Customer Satisfaction</span>
                      <span className="text-white">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">System Uptime</span>
                      <span className="text-white">99.9%</span>
                    </div>
                    <Progress value={99.9} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Response Time</span>
                      <span className="text-white">1.2s</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Geographic Distribution */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Geographic Distribution</CardTitle>
                  <CardDescription className="text-gray-400">
                    Call volume by region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { region: 'North America', calls: 456, percentage: 45 },
                      { region: 'Europe', calls: 234, percentage: 23 },
                      { region: 'Asia Pacific', calls: 189, percentage: 19 },
                      { region: 'Latin America', calls: 98, percentage: 10 },
                      { region: 'Other', calls: 34, percentage: 3 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-white">{item.region}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-400">{item.calls.toLocaleString()}</span>
                          <span className="text-brand-pink font-medium">{item.percentage}%</span>
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