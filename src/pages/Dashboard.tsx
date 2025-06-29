import { 
  TrendingUp, 
  Users, 
  Activity,
  Zap,
  Shield,
  Plus,
  CreditCard,
  DollarSign,
  Coins,
  Eye,
  Calendar,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// Simple dashboard data
const dashboardStats = {
  totalCredits: 1247,
  creditsUsedToday: 89,
  totalUsers: 5,
  activeProjects: 2
}

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400 mt-1">
            Here's what's happening with your account today.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Credits</CardTitle>
            <Coins className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{dashboardStats.totalCredits.toLocaleString()}</div>
            <p className="text-xs text-gray-400 mt-1">
              <span className="text-green-400">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Credits Used Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{dashboardStats.creditsUsedToday}</div>
            <p className="text-xs text-gray-400 mt-1">
              <span className="text-blue-400">+8%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Team Members</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{dashboardStats.totalUsers}</div>
            <p className="text-xs text-gray-400 mt-1">
              2 active now
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{dashboardStats.activeProjects}</div>
            <p className="text-xs text-gray-400 mt-1">
              <span className="text-green-400">+1</span> this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credits Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Coins className="w-5 h-5 mr-2 text-yellow-400" />
              Credits Overview
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your current credit balance and usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Available Credits</span>
              <span className="text-xl font-bold text-white">1,247</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Used this month</span>
                <span className="text-gray-300">753 / 2000</span>
              </div>
              <Progress value={37.65} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button variant="outline" className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600">
                <Eye className="w-4 h-4 mr-2" />
                View Usage
              </Button>
              <Button className="bg-gradient-to-r from-brand-pink to-brand-magenta">
                <Plus className="w-4 h-4 mr-2" />
                Buy Credits
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your latest platform activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-white">Project created</p>
                  <p className="text-xs text-gray-400">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-white">Credits purchased</p>
                  <p className="text-xs text-gray-400">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-white">Team member invited</p>
                  <p className="text-xs text-gray-400">3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-brand-pink/10 to-brand-magenta/10 border-brand-pink/20">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-400">
            Get started with your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink h-auto p-4 flex-col space-y-2">
              <Zap className="w-6 h-6" />
              <span>Create Project</span>
              <span className="text-xs opacity-80">Start something new</span>
            </Button>
            <Button className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 h-auto p-4 flex-col space-y-2 transition-all duration-200">
              <CreditCard className="w-6 h-6 text-blue-400" />
              <span className="font-medium">Manage Billing</span>
              <span className="text-xs text-gray-300">Update payment info</span>
            </Button>
            <Button className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 h-auto p-4 flex-col space-y-2 transition-all duration-200">
              <Users className="w-6 h-6 text-green-400" />
              <span className="font-medium">Invite Team</span>
              <span className="text-xs text-gray-300">Add team members</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
