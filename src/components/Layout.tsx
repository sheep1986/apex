import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  Menu, 
  X, 
  Phone, 
  Users, 
  BarChart3, 
  Settings, 
  DollarSign, 
  Target,
  FileText,
  Calendar,
  HelpCircle,
  Zap,
  Building,
  Activity,
  CreditCard,
  Bell,
  Search,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Mock user data - in real app this would come from auth context
const mockUser = {
  name: 'Sam',
  email: 'sean@example.com',
  role: 'agency_admin', // 'agency_admin', 'campaign_manager', 'analyst', 'new_user'
  organization: 'Digital Marketing Agency',
  avatar: '/avatars/sean.jpg'
}

const getNavigationItems = (role: string) => {
  const baseItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: Activity,
      badge: null
    }
  ]

  switch (role) {
    case 'new_user':
      return [
        ...baseItems,
        {
          title: 'Get Started',
          href: '/onboarding',
          icon: Zap,
          badge: 'New'
        },
        {
          title: 'Tutorials',
          href: '/help/tutorials',
          icon: HelpCircle,
          badge: null
        }
      ]
    
    case 'agency_admin':
      return [
        ...baseItems,
        {
          title: 'Campaigns',
          href: '/campaigns',
          icon: Target,
          badge: '12'
        },
        {
          title: 'Clients',
          href: '/clients',
          icon: Building,
          badge: '8'
        },
        {
          title: 'Leads',
          href: '/leads',
          icon: FileText,
          badge: '2.8k'
        },
        {
          title: 'Analytics',
          href: '/analytics',
          icon: BarChart3,
          badge: null
        },
        {
          title: 'Live Calls',
          href: '/live-calls',
          icon: Phone,
          badge: '3'
        },
        {
          title: 'Team',
          href: '/team',
          icon: Users,
          badge: null
        },
        {
          title: 'Billing',
          href: '/billing',
          icon: DollarSign,
          badge: null
        }
      ]
    
    case 'campaign_manager':
      return [
        ...baseItems,
        {
          title: 'Campaigns',
          href: '/campaigns',
          icon: Target,
          badge: '6'
        },
        {
          title: 'Leads',
          href: '/leads',
          icon: FileText,
          badge: '1.2k'
        },
        {
          title: 'Analytics',
          href: '/analytics',
          icon: BarChart3,
          badge: null
        },
        {
          title: 'Live Calls',
          href: '/live-calls',
          icon: Phone,
          badge: '2'
        },
        {
          title: 'Phone Numbers',
          href: '/phone-numbers',
          icon: Phone,
          badge: null
        }
      ]
    
    default:
      return [
        ...baseItems,
        {
          title: 'Campaigns',
          href: '/campaigns',
          icon: Target,
          badge: '12'
        },
        {
          title: 'Leads',
          href: '/leads',
          icon: FileText,
          badge: '2.8k'
        },
        {
          title: 'Analytics',
          href: '/analytics',
          icon: BarChart3,
          badge: null
        },
        {
          title: 'Live Calls',
          href: '/live-calls',
          icon: Phone,
          badge: '3'
        },
        {
          title: 'VAPI Dashboard',
          href: '/vapi',
          icon: Zap,
          badge: null
        },
        {
          title: 'Phone Numbers',
          href: '/phone-numbers',
          icon: Phone,
          badge: null
        },
        {
          title: 'CRM',
          href: '/crm',
          icon: Users,
          badge: null
        },
        {
          title: 'Team',
          href: '/team',
          icon: Users,
          badge: null
        },
        {
          title: 'Billing',
          href: '/billing',
          icon: DollarSign,
          badge: null
        },
        {
          title: 'Settings',
          href: '/settings',
          icon: Settings,
          badge: null
        }
      ]
  }
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user] = useState(mockUser)
  const location = useLocation()
  const navigationItems = getNavigationItems(user.role)

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-950 lg:flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex-shrink-0 h-screen`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <img 
              src="/am-web-logo-white.png" 
              alt="Apex AI Calling Platform" 
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold text-white">Apex</h1>
              <p className="text-xs text-gray-400">AI Calling Platform</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-pink/10 text-brand-pink border border-brand-pink/20'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <Badge 
                    variant={item.badge === 'New' ? 'default' : 'secondary'}
                    className={`text-xs ${
                      item.badge === 'New' 
                        ? 'bg-brand-pink text-white' 
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-800 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-between space-x-3 p-3 pr-2 hover:bg-gray-800">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-gray-700 text-white">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.organization}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
              <DropdownMenuLabel className="text-gray-300">Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="text-gray-300 hover:bg-gray-700">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 hover:bg-gray-700">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="text-red-400 hover:bg-gray-700">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto p-0 m-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              {/* Search Bar */}
              <div className="hidden md:flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns, leads, or settings..."
                  className="bg-transparent border-none outline-none text-white placeholder-gray-400 text-sm w-64"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs">
                  3
                </Badge>
              </Button>

              {/* Quick Actions */}
              {user.role !== 'new_user' && (
                <Button className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink">
                  <Phone className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
