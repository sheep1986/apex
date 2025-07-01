import { useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Building, 
  Users, 
  Phone, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Mail,
  Star,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu'

interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  status: 'active' | 'inactive' | 'pending'
  campaigns: number
  leads: number
  calls: number
  spend: number
  lastActivity: string
  avatar?: string
  rating: number
}

export function Clients() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const clients: Client[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      company: 'TechFlow Solutions',
      email: 'sarah@techflow.com',
      phone: '+1 (555) 123-4567',
      status: 'active',
      campaigns: 3,
      leads: 1247,
      calls: 2847,
      spend: 2847.50,
      lastActivity: '2 hours ago',
      rating: 4.8
    },
    {
      id: '2',
      name: 'Mike Chen',
      company: 'Digital Dynamics',
      email: 'mike@digitaldynamics.com',
      phone: '+1 (555) 987-6543',
      status: 'active',
      campaigns: 5,
      leads: 2156,
      calls: 4123,
      spend: 5123.75,
      lastActivity: '1 hour ago',
      rating: 4.9
    },
    {
      id: '3',
      name: 'Emma Rodriguez',
      company: 'Growth Partners',
      email: 'emma@growthpartners.com',
      phone: '+1 (555) 456-7890',
      status: 'active',
      campaigns: 2,
      leads: 892,
      calls: 1654,
      spend: 1987.25,
      lastActivity: '3 hours ago',
      rating: 4.7
    },
    {
      id: '4',
      name: 'David Thompson',
      company: 'Innovate Labs',
      email: 'david@innovatelabs.com',
      phone: '+1 (555) 321-6540',
      status: 'pending',
      campaigns: 1,
      leads: 234,
      calls: 456,
      spend: 567.80,
      lastActivity: '1 day ago',
      rating: 4.5
    },
    {
      id: '5',
      name: 'Lisa Wang',
      company: 'ScaleUp Ventures',
      email: 'lisa@scaleupventures.com',
      phone: '+1 (555) 789-0123',
      status: 'inactive',
      campaigns: 0,
      leads: 0,
      calls: 0,
      spend: 0,
      lastActivity: '1 week ago',
      rating: 4.6
    }
  ]

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    pending: clients.filter(c => c.status === 'pending').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
    totalSpend: clients.reduce((sum, c) => sum + c.spend, 0),
    totalCalls: clients.reduce((sum, c) => sum + c.calls, 0),
    totalLeads: clients.reduce((sum, c) => sum + c.leads, 0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'inactive': return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white">Clients</h1>
            <p className="text-gray-400 mt-1">Manage your agency clients and their campaigns</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Client
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Clients</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-400">+2 this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Clients</p>
                  <p className="text-2xl font-bold text-white">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-400">+1 this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Calls</p>
                  <p className="text-2xl font-bold text-white">{stats.totalCalls.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-400">+12% this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">${stats.totalSpend.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-pink-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-pink-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-400">+8% this month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search clients by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-white placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:text-white"
              onClick={() => setSelectedStatus('all')}
            >
              All ({stats.total})
            </Button>
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:text-white"
              onClick={() => setSelectedStatus('active')}
            >
              Active ({stats.active})
            </Button>
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:text-white"
              onClick={() => setSelectedStatus('pending')}
            >
              Pending ({stats.pending})
            </Button>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={client.avatar} />
                      <AvatarFallback className="bg-gray-800 text-white">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-white text-lg">{client.name}</CardTitle>
                      <CardDescription className="text-gray-400">{client.company}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-900 border-gray-800">
                      <DropdownMenuItem className="text-gray-300 hover:text-white">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-300 hover:text-white">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Client
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-300 hover:text-white">
                        <Mail className="w-4 h-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Badge className={getStatusColor(client.status)}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </Badge>
                  <div className="flex items-center text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-sm">{client.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{client.campaigns}</p>
                    <p className="text-xs text-gray-400">Campaigns</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{client.leads.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Leads</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{client.calls.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Calls</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-white">${client.spend.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Total Spend</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Last Activity</p>
                    <p className="text-xs text-gray-300">{client.lastActivity}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1 border-gray-700 text-gray-300 hover:text-white">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-gray-700 text-gray-300 hover:text-white">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center">
              <Building className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No clients found</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first client'}
              </p>
              <Button className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink">
                <Plus className="w-4 h-4 mr-2" />
                Add New Client
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 