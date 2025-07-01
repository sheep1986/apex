import { useState } from 'react'
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Phone, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Activity,
  Target,
  Mic
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Switch } from '../components/ui/switch'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'agent' | 'viewer'
  status: 'active' | 'inactive' | 'pending'
  avatar?: string
  lastActive: string
  permissions: {
    campaigns: boolean
    vapi: boolean
    crm: boolean
    analytics: boolean
    billing: boolean
    team: boolean
  }
  stats: {
    campaignsCreated: number
    callsHandled: number
    successRate: number
  }
}

export function Team() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@apexai.com',
      role: 'admin',
      status: 'active',
      avatar: '/avatars/sarah.jpg',
      lastActive: '2 minutes ago',
      permissions: {
        campaigns: true,
        vapi: true,
        crm: true,
        analytics: true,
        billing: true,
        team: true
      },
      stats: {
        campaignsCreated: 12,
        callsHandled: 1247,
        successRate: 89
      }
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@apexai.com',
      role: 'manager',
      status: 'active',
      avatar: '/avatars/mike.jpg',
      lastActive: '15 minutes ago',
      permissions: {
        campaigns: true,
        vapi: true,
        crm: true,
        analytics: true,
        billing: false,
        team: false
      },
      stats: {
        campaignsCreated: 8,
        callsHandled: 892,
        successRate: 87
      }
    },
    {
      id: '3',
      name: 'Emma Rodriguez',
      email: 'emma@apexai.com',
      role: 'agent',
      status: 'active',
      avatar: '/avatars/emma.jpg',
      lastActive: '1 hour ago',
      permissions: {
        campaigns: true,
        vapi: false,
        crm: true,
        analytics: false,
        billing: false,
        team: false
      },
      stats: {
        campaignsCreated: 5,
        callsHandled: 456,
        successRate: 84
      }
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david@apexai.com',
      role: 'viewer',
      status: 'pending',
      avatar: '/avatars/david.jpg',
      lastActive: 'Never',
      permissions: {
        campaigns: false,
        vapi: false,
        crm: false,
        analytics: true,
        billing: false,
        team: false
      },
      stats: {
        campaignsCreated: 0,
        callsHandled: 0,
        successRate: 0
      }
    }
  ])

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'agent',
    permissions: {
      campaigns: false,
      vapi: false,
      crm: false,
      analytics: false,
      billing: false,
      team: false
    }
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-900 text-red-400 border-red-800'
      case 'manager': return 'bg-blue-900 text-blue-400 border-blue-800'
      case 'agent': return 'bg-green-900 text-green-400 border-green-800'
      case 'viewer': return 'bg-gray-700 text-gray-300 border-gray-600'
      default: return 'bg-gray-700 text-gray-300 border-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900 text-green-400 border-green-800'
      case 'inactive': return 'bg-gray-700 text-gray-300 border-gray-600'
      case 'pending': return 'bg-yellow-900 text-yellow-400 border-yellow-800'
      default: return 'bg-gray-700 text-gray-300 border-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'inactive': return <AlertCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const handleInvite = () => {
    // Add new member logic here
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteData.email.split('@')[0],
      email: inviteData.email,
      role: inviteData.role as any,
      status: 'pending',
      lastActive: 'Never',
      permissions: inviteData.permissions,
      stats: {
        campaignsCreated: 0,
        callsHandled: 0,
        successRate: 0
      }
    }
    setMembers([...members, newMember])
    setShowInviteModal(false)
    setInviteData({
      email: '',
      role: 'agent',
      permissions: {
        campaigns: false,
        vapi: false,
        crm: false,
        analytics: false,
        billing: false,
        team: false
      }
    })
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Team Management</h1>
            <p className="text-gray-400">Manage team members, roles, and permissions</p>
          </div>
          <Button 
            className="bg-gradient-to-r from-brand-pink to-brand-magenta"
            onClick={() => setShowInviteModal(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Members</p>
                  <p className="text-2xl font-bold text-white">{members.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">{members.filter(m => m.status === 'active').length} active</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Campaigns</p>
                  <p className="text-2xl font-bold text-white">
                    {members.reduce((sum, member) => sum + member.stats.campaignsCreated, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">Across all members</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Calls</p>
                  <p className="text-2xl font-bold text-white">
                    {members.reduce((sum, member) => sum + member.stats.callsHandled, 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">Handled by team</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Avg Success Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round(members.reduce((sum, member) => sum + member.stats.successRate, 0) / members.length)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">Team average</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-gray-800">
            <TabsTrigger value="members" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" />
              Activity Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Team Members</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your team members and their access levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="bg-brand-pink/20 text-brand-pink">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-white font-medium">{member.name}</p>
                            <Badge className={getStatusColor(member.status)}>
                              {getStatusIcon(member.status)}
                              <span className="ml-1">{member.status}</span>
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm">{member.email}</p>
                          <p className="text-gray-400 text-sm">Last active: {member.lastActive}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <Badge className={getRoleColor(member.role)}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </Badge>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                            <span>{member.stats.campaignsCreated} campaigns</span>
                            <span>{member.stats.callsHandled.toLocaleString()} calls</span>
                            <span>{member.stats.successRate}% success</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Role Permissions</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure what each role can access and modify
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { role: 'Admin', description: 'Full access to all features and settings' },
                    { role: 'Manager', description: 'Can manage campaigns, view analytics, and manage team members' },
                    { role: 'Agent', description: 'Can create campaigns and access CRM data' },
                    { role: 'Viewer', description: 'Read-only access to analytics and reports' }
                  ].map((roleInfo, index) => (
                    <div key={index} className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-white font-medium">{roleInfo.role}</h4>
                          <p className="text-gray-400 text-sm">{roleInfo.description}</p>
                        </div>
                        <Badge className={getRoleColor(roleInfo.role.toLowerCase())}>
                          {roleInfo.role}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { name: 'Campaigns', icon: Target },
                          { name: 'Vapi AI', icon: Mic },
                          { name: 'CRM', icon: Users },
                          { name: 'Analytics', icon: Activity },
                          { name: 'Billing', icon: Shield },
                          { name: 'Team', icon: Users }
                        ].map((permission, permIndex) => (
                          <div key={permIndex} className="flex items-center space-x-2">
                            <permission.icon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-300">{permission.name}</span>
                            <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Track team member actions and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { user: 'Sarah Johnson', action: 'Created new campaign "Q4 Sales Outreach"', time: '2 minutes ago', type: 'campaign' },
                    { user: 'Mike Chen', action: 'Updated Vapi AI assistant settings', time: '15 minutes ago', type: 'vapi' },
                    { user: 'Emma Rodriguez', action: 'Added 50 new contacts to CRM', time: '1 hour ago', type: 'crm' },
                    { user: 'System', action: 'Campaign "Summer Promo" completed successfully', time: '2 hours ago', type: 'system' },
                    { user: 'David Kim', action: 'Joined the team', time: '1 day ago', type: 'team' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                      <div className="w-8 h-8 bg-brand-pink/20 rounded-full flex items-center justify-center">
                        <Target className="w-4 h-4 text-brand-pink" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">
                          <span className="font-medium">{activity.user}</span> {activity.action}
                        </p>
                        <p className="text-gray-400 text-xs">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Invite Team Member</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="colleague@company.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role" className="text-white">Role</Label>
                  <Select value={inviteData.role} onValueChange={(value) => setInviteData({...inviteData, role: value as any})}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Permissions</Label>
                  {Object.entries(inviteData.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => 
                          setInviteData({
                            ...inviteData, 
                            permissions: {...inviteData.permissions, [key]: checked}
                          })
                        }
                      />
                      <Label htmlFor={key} className="text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-brand-pink to-brand-magenta"
                  onClick={handleInvite}
                >
                  Send Invite
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 