import { useState } from 'react'
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Flame,
  Trash2,
  LayoutGrid,
  ChevronDown,
  BarChart3,
  Filter,
  Zap,
  CreditCard,
  Users,
  ArrowUpDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
// Removed useBalance import - using mock data instead

// Mock data for phone numbers
const phoneNumbers = [
  {
    id: '1',
    number: '+1 (555) 123-4567',
    status: 'connected',
    callsMade: 245,
    maxCalls: 500,
    leadsGenerated: 67,
    conversionRate: 27.3
  },
  {
    id: '2',
    number: '+1 (555) 987-6543',
    status: 'disconnected',
    callsMade: 89,
    maxCalls: 200,
    leadsGenerated: 0,
    conversionRate: 0
  },
  {
    id: '3',
    number: '+1 (555) 456-7890',
    status: 'connected',
    callsMade: 567,
    maxCalls: 750,
    leadsGenerated: 89,
    conversionRate: 15.7
  },
  {
    id: '4',
    number: '+44 20 7123 4567',
    status: 'connected',
    callsMade: 123,
    maxCalls: 300,
    leadsGenerated: 45,
    conversionRate: 36.6
  },
  {
    id: '5',
    number: '+1 (555) 222-1111',
    status: 'connected',
    callsMade: 321,
    maxCalls: 400,
    leadsGenerated: 50,
    conversionRate: 12.5
  },
  {
    id: '6',
    number: '+1 (555) 333-2222',
    status: 'disconnected',
    callsMade: 210,
    maxCalls: 300,
    leadsGenerated: 10,
    conversionRate: 4.8
  },
  {
    id: '7',
    number: '+1 (555) 444-3333',
    status: 'connected',
    callsMade: 400,
    maxCalls: 600,
    leadsGenerated: 80,
    conversionRate: 20.0
  },
  {
    id: '8',
    number: '+1 (555) 555-4444',
    status: 'connected',
    callsMade: 150,
    maxCalls: 250,
    leadsGenerated: 30,
    conversionRate: 12.0
  },
  {
    id: '9',
    number: '+1 (555) 666-5555',
    status: 'disconnected',
    callsMade: 50,
    maxCalls: 100,
    leadsGenerated: 5,
    conversionRate: 5.0
  },
  {
    id: '10',
    number: '+1 (555) 777-6666',
    status: 'connected',
    callsMade: 600,
    maxCalls: 800,
    leadsGenerated: 120,
    conversionRate: 25.0
  },
  {
    id: '11',
    number: '+1 (555) 888-7777',
    status: 'connected',
    callsMade: 200,
    maxCalls: 350,
    leadsGenerated: 40,
    conversionRate: 11.4
  },
  {
    id: '12',
    number: '+1 (555) 999-8888',
    status: 'disconnected',
    callsMade: 75,
    maxCalls: 150,
    leadsGenerated: 8,
    conversionRate: 6.7
  },
  {
    id: '13',
    number: '+44 20 8000 0000',
    status: 'connected',
    callsMade: 350,
    maxCalls: 500,
    leadsGenerated: 60,
    conversionRate: 17.1
  },
  {
    id: '14',
    number: '+44 20 9000 1111',
    status: 'connected',
    callsMade: 275,
    maxCalls: 400,
    leadsGenerated: 35,
    conversionRate: 9.5
  },
  {
    id: '15',
    number: '+44 20 1000 2222',
    status: 'disconnected',
    callsMade: 120,
    maxCalls: 200,
    leadsGenerated: 12,
    conversionRate: 10.0
  },
  {
    id: '16',
    number: '+44 20 2000 3333',
    status: 'connected',
    callsMade: 450,
    maxCalls: 600,
    leadsGenerated: 75,
    conversionRate: 16.7
  },
  {
    id: '17',
    number: '+44 20 3000 4444',
    status: 'connected',
    callsMade: 180,
    maxCalls: 300,
    leadsGenerated: 25,
    conversionRate: 8.3
  },
  {
    id: '18',
    number: '+44 20 4000 5555',
    status: 'disconnected',
    callsMade: 95,
    maxCalls: 150,
    leadsGenerated: 8,
    conversionRate: 8.4
  },
  {
    id: '19',
    number: '+44 20 5000 6666',
    status: 'connected',
    callsMade: 520,
    maxCalls: 700,
    leadsGenerated: 95,
    conversionRate: 18.3
  },
  {
    id: '20',
    number: '+44 20 6000 7777',
    status: 'connected',
    callsMade: 300,
    maxCalls: 450,
    leadsGenerated: 45,
    conversionRate: 15.0
  },
  {
    id: '21',
    number: '+44 20 7000 8888',
    status: 'disconnected',
    callsMade: 65,
    maxCalls: 120,
    leadsGenerated: 6,
    conversionRate: 9.2
  },
  {
    id: '22',
    number: '+44 20 8000 9999',
    status: 'connected',
    callsMade: 380,
    maxCalls: 550,
    leadsGenerated: 65,
    conversionRate: 17.1
  },
  {
    id: '23',
    number: '+44 20 9000 0001',
    status: 'connected',
    callsMade: 220,
    maxCalls: 350,
    leadsGenerated: 30,
    conversionRate: 8.6
  },
  {
    id: '24',
    number: '+44 20 1000 1112',
    status: 'disconnected',
    callsMade: 85,
    maxCalls: 180,
    leadsGenerated: 7,
    conversionRate: 8.2
  },
  {
    id: '25',
    number: '+44 20 2000 2223',
    status: 'connected',
    callsMade: 480,
    maxCalls: 650,
    leadsGenerated: 85,
    conversionRate: 17.7
  },
  {
    id: '26',
    number: '+44 20 3000 3334',
    status: 'connected',
    callsMade: 160,
    maxCalls: 280,
    leadsGenerated: 20,
    conversionRate: 7.1
  },
  {
    id: '27',
    number: '+44 20 4000 4445',
    status: 'disconnected',
    callsMade: 110,
    maxCalls: 200,
    leadsGenerated: 9,
    conversionRate: 8.2
  },
  {
    id: '28',
    number: '+44 20 5000 5556',
    status: 'connected',
    callsMade: 550,
    maxCalls: 750,
    leadsGenerated: 100,
    conversionRate: 18.2
  },
  {
    id: '29',
    number: '+44 20 6000 6667',
    status: 'connected',
    callsMade: 240,
    maxCalls: 380,
    leadsGenerated: 35,
    conversionRate: 9.2
  },
  {
    id: '30',
    number: '+44 20 7000 7778',
    status: 'disconnected',
    callsMade: 70,
    maxCalls: 140,
    leadsGenerated: 5,
    conversionRate: 7.1
  }
]

const numberOptions = [
  { value: 'all', label: 'All Numbers' },
  { value: 'connected', label: 'Connected' },
  { value: 'disconnected', label: 'Disconnected' },
]

export function PhoneNumbers() {
  // Mock balance data - in real app this would come from context
  const balance = 1247.00;
  const [searchTerm, setSearchTerm] = useState('')
  const [numberFilter, setNumberFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const allSelected = phoneNumbers.length > 0 && selectedRows.length === phoneNumbers.length
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows([])
    } else {
      setSelectedRows(phoneNumbers.map((n) => n.id))
    }
  }
  const toggleRow = (id: string) => {
    setSelectedRows((prev) => prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id])
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <span className="inline-block rounded-full bg-green-600 text-white px-3 py-1 text-xs font-semibold">Connected</span>;
      case 'disconnected':
        return <span className="inline-block rounded-full bg-red-600 text-white px-3 py-1 text-xs font-semibold">Disconnected</span>;
      default:
        return null;
    }
  }

  const filteredNumbers = phoneNumbers.filter(number => {
    const matchesSearch = number.number.toLowerCase().includes(searchTerm.toLowerCase())
    let matchesNumber = true
    if (numberFilter === 'connected') matchesNumber = number.status === 'connected'
    else if (numberFilter === 'disconnected') matchesNumber = number.status === 'disconnected'
    return matchesSearch && matchesNumber
  })

  const sortedNumbers = [...filteredNumbers].sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return b.id.localeCompare(a.id)
      case 'oldest':
        return a.id.localeCompare(b.id)
      case 'name-az':
        return a.number.localeCompare(b.number)
      case 'name-za':
        return b.number.localeCompare(a.number)
      default:
        return 0
    }
  })

  return (
    <div className="max-w-7xl mx-auto w-full px-4">
      <div className="space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white">Phone Numbers</h1>
            <p className="text-gray-400 mt-1">Manage your calling phone numbers and monitor their health</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink transition-colors">
              <Plus className="w-4 h-4 mr-2 text-white" />
              Add New
            </Button>
          </div>
        </div>

        {/* Phone Numbers Management */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Phone Number Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor and manage your calling phone numbers
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
                  placeholder="Search phone numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border border-neutral-800 text-white placeholder-gray-400 rounded-lg"
                />
              </div>
              <Select value={numberFilter} onValueChange={setNumberFilter}>
                <SelectTrigger className="w-[180px] bg-gray-800 border border-gray-800 text-white rounded-lg">
                  <SelectValue placeholder="All Numbers" />
                </SelectTrigger>
                <SelectContent className="glassy-dropdown-content rounded-xl shadow-2xl border border-gray-800 bg-gradient-to-br from-gray-900/90 via-gray-950/90 to-black/95 backdrop-blur-xl">
                  <SelectItem value="all" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">All Numbers</SelectItem>
                  <SelectItem value="connected" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Connected</SelectItem>
                  <SelectItem value="disconnected" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Disconnected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[180px] bg-gray-800 border border-gray-800 text-white rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glassy-dropdown-content rounded-xl shadow-2xl border border-gray-800 bg-gradient-to-br from-gray-900/90 via-gray-950/90 to-black/95 backdrop-blur-xl">
                  <SelectItem value="newest" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Newest first</SelectItem>
                  <SelectItem value="oldest" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Oldest first</SelectItem>
                  <SelectItem value="name-az" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Number A-Z</SelectItem>
                  <SelectItem value="name-za" className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">Number Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Phone Numbers Table */}
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
                  <tr className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 sticky top-0 z-10">
                    <th className="w-12 px-2 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="accent-purple-600 focus:ring-2 focus:ring-purple-500 rounded"
                      />
                    </th>
                    <th className="pl-3 pr-2 py-3 text-left text-xs font-medium text-white tracking-wider w-1/4 min-w-[180px]">PHONE NUMBER</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white tracking-wider">STATUS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white tracking-wider">CALLS MADE</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white tracking-wider">LEADS GENERATED</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white tracking-wider">CONVERSION RATE</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedNumbers.map((number) => (
                    <tr key={number.id} className="border-b border-zinc-800 hover:bg-zinc-900 transition-colors">
                      <td className="w-12 px-2 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(number.id)}
                          onChange={() => toggleRow(number.id)}
                          className="accent-purple-600 focus:ring-2 focus:ring-purple-500 rounded"
                        />
                      </td>
                      <td className="pl-3 pr-2 py-3 flex items-center gap-2 min-w-[180px]">
                        <span className="truncate font-medium text-white text-sm">{number.number}</span>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(number.status)}
                      </td>
                      <td className="py-4 px-4 text-gray-300 font-medium">
                        {number.callsMade} of {number.maxCalls}
                      </td>
                      <td className="py-4 px-4 text-gray-300 font-medium">
                        {number.leadsGenerated}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-medium ${number.conversionRate > 20 ? 'text-green-400' : 'text-red-400'}`}>{number.conversionRate}%</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="relative group bg-transparent hover:bg-transparent p-1">
                                <MoreHorizontal className="w-4 h-4 text-gray-400 group-hover:text-brand-pink transition-colors" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-gray-800 border-gray-700">
                              <DropdownMenuItem className="text-gray-300 hover:text-white">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Disconnect Number
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

            {sortedNumbers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No phone numbers found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions - copied from Dashboard */}
        <Card className="bg-gray-900 border-gray-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">
              Get started with your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-gradient-to-r from-[#e05b8e] to-[#f26a5a] hover:from-[#f26a5a] hover:to-[#e05b8e] flex flex-col items-center justify-center p-4 shadow-md text-white font-semibold transition-colors cursor-pointer" onClick={() => window.location.href='/campaigns/new'}>
                <Zap className="w-6 h-6 text-white mb-1" />
                <span className="font-medium">Start a New Campaign</span>
                <span className="text-xs text-white/80 mt-1">Get started here</span>
              </div>
              <div className="rounded-lg bg-[#3b7c6e] hover:bg-[#2e5e53] flex flex-col items-center justify-center p-4 shadow-md text-white font-semibold transition-colors cursor-pointer">
                <CreditCard className="w-6 h-6 text-white mb-1" />
                <span className="font-medium">Manage Billing</span>
                <span className="text-xs text-white/80 mt-1">Update payment info</span>
              </div>
              <div className="rounded-lg bg-[#6c4fc1] hover:bg-[#4b368a] flex flex-col items-center justify-center p-4 shadow-md text-white font-semibold transition-colors cursor-pointer">
                <Users className="w-6 h-6 text-white mb-1" />
                <span className="font-medium">Invite Team</span>
                <span className="text-xs text-white/80 mt-1">Add team members</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
