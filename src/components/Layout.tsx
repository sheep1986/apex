import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Menu,
  X,
  Bell,
  UserCircle,
  Coins,
  Plus,
  Zap,
  Phone
} from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/campaigns', icon: Zap },
  { name: 'Phone Numbers', href: '/phone-numbers', icon: Phone },
]

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const location = useLocation()

  const getPageTitle = () => {
    const currentNav = navigation.find(item => item.href === location.pathname)
    return currentNav ? currentNav.name : 'Dashboard'
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Icon Only */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-16 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-gray-925 border-r border-gray-800
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-center px-3 py-4 border-b border-gray-800">
            <img 
              src="/am-web-logo-white.png" 
              alt="Platform" 
              className="h-8 w-8"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center justify-center p-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-gradient-to-r from-brand-pink to-brand-magenta text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                  title={item.name}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              )
            })}
          </nav>

          {/* Credits Status */}
          <div className="px-2 py-4 border-t border-gray-800">
            <div className="bg-gray-900 rounded-lg p-2">
              <div className="flex flex-col items-center space-y-1">
                <Coins className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-medium">2,847</span>
                <span className="text-xs text-gray-400">Credits</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top navigation */}
        <header className="bg-gray-925 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-gray-400 hover:text-white"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <h1 className="text-xl font-semibold text-white">{getPageTitle()}</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Credits indicator */}
              <div 
                className="hidden md:flex items-center space-x-2 px-3 py-1 bg-yellow-900/20 rounded-full cursor-pointer hover:bg-yellow-900/30 transition-colors"
                onClick={() => setShowCreditsModal(true)}
              >
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-400 font-medium">2,847 Credits</span>
                <Button size="sm" className="ml-2 h-6 bg-yellow-600 hover:bg-yellow-700 text-white">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative text-gray-400 hover:text-white">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-brand-pink text-white text-xs">
                  3
                </Badge>
              </Button>

              {/* User menu */}
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <UserCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 bg-gray-950 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Credits Modal */}
      {showCreditsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Credits Balance</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreditsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Coins className="h-8 w-8 text-yellow-400" />
                  <span className="text-3xl font-bold text-yellow-400">2,847</span>
                </div>
                <p className="text-gray-400">Available Credits</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">This month usage:</span>
                  <span className="text-white">153 credits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Last purchase:</span>
                  <span className="text-white">Dec 15, 2024</span>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink">
                <Plus className="h-4 w-4 mr-2" />
                Purchase More Credits
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
