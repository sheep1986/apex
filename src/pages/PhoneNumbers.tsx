import { useState } from 'react'
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Flame,
  RefreshCw,
  Trash2,
  LayoutGrid,
  ChevronDown
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
    number: '+33 1 42 34 56 78',
    status: 'warming',
    callsMade: 298,
    maxCalls: 400,
    leadsGenerated: 78,
    conversionRate: 26.2
  }
]

export function PhoneNumbers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredNumbers = phoneNumbers.filter(number => {
    const matchesSearch = number.number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || number.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white">Phone Numbers</h1>
          <p className="text-gray-400 mt-1">Manage your calling phone numbers and monitor their health</p>
          <div className="flex items-center mt-3 space-x-4">
            <div className="text-sm">
              <span className="text-gray-400">Call Balance:</span>
              <span className="text-green-400 font-medium ml-2">$329.48</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">PAYG Rate:</span>
              <span className="text-white font-medium ml-2">$0.015/min</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink">
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* Phone Numbers Management */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Phone Number Accounts</CardTitle>
              <CardDescription className="text-gray-400">
                Monitor and manage your calling phone numbers
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
                placeholder="Search phone numbers..."
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
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="warming">Warming</SelectItem>
                <SelectItem value="disconnected">Disconnected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600">
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {/* Phone Numbers Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    <input type="checkbox" className="rounded border-gray-600 bg-gray-800" />
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">PHONE NUMBER</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">CALLS MADE</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">LEADS GENERATED</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">CONVERSION RATE</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredNumbers.map((number) => (
                  <tr key={number.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-4 px-4">
                      <input type="checkbox" className="rounded border-gray-600 bg-gray-800" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <Flame className={`w-4 h-4 ${
                          number.status === 'connected' ? 'text-green-400' : 
                          number.status === 'warming' ? 'text-yellow-400' : 
                          'text-gray-500'
                        }`} />
                        <div>
                          <div className="text-white font-medium">{number.number}</div>
                          {number.status === 'disconnected' && (
                            <Badge variant="destructive" className="mt-1 text-xs">
                              Disconnected
                            </Badge>
                          )}
                          {number.status === 'warming' && (
                            <Badge className="mt-1 text-xs bg-yellow-900 text-yellow-400 border-yellow-800">
                              Warming
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300">
                      {number.callsMade} of {number.maxCalls}
                    </td>
                    <td className="py-4 px-4 text-gray-300">
                      {number.leadsGenerated}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-medium ${number.conversionRate > 20 ? 'text-green-400' : 'text-red-400'}`}>
                        {number.conversionRate}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem className="text-gray-300 hover:text-white">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reconnect number
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove number
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredNumbers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No phone numbers found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
