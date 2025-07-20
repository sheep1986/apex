import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { 
  Home, 
  Users, 
  BarChart3, 
  Settings, 
  CreditCard,
  Database,
  Building,
  UserCheck,
  PhoneCall,
  Target,
  DollarSign,
  Palette,
  Monitor
} from 'lucide-react';
import { UserDropdown } from './UserDropdown';
import { NotificationBell } from './NotificationBell';
import { useUserContext } from '../services/MinimalUserProvider';

// TypeScript interface for menu items
interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  isActive: (path: string) => boolean;
  badge?: string;
}

// Role-based menu configurations
const getMenuItemsForRole = (role: string): MenuItem[] => {
  const baseItems = [
    {
      title: 'Dashboard',
      url: role === 'platform_owner' ? '/platform' : role.includes('agency') ? '/agency' : '/dashboard',
      icon: Home,
      isActive: (path: string) => {
        if (role === 'platform_owner') return path === '/platform';
        if (role.includes('agency')) return path === '/agency';
        return path === '/dashboard';
      },
    },
  ];

  // Platform owner menu items (highest priority)
  if (role === 'platform_owner') {
    return [
      ...baseItems,
      {
        title: 'Organizations',
        url: '/organizations',
        icon: Building,
        isActive: (path: string) => path === '/organizations',
      },
      {
        title: 'User Management',
        url: '/user-management',
        icon: Users,
        isActive: (path: string) => path === '/user-management',
      },
      {
        title: 'Platform Analytics',
        url: '/platform-analytics',
        icon: BarChart3,
        isActive: (path: string) => path === '/platform-analytics',
      },
      {
        title: 'System Health',
        url: '/system-health',
        icon: Monitor,
        isActive: (path: string) => path === '/system-health',
      },
      {
        title: 'API Management',
        url: '/api-keys',
        icon: Settings,
        isActive: (path: string) => path === '/api-keys',
      },
      {
        title: 'Billing',
        url: '/billing',
        icon: CreditCard,
        isActive: (path: string) => path === '/billing',
      },
    ];
  }

  // Agency-specific menu items
  if (role.includes('agency')) {
    return [
      ...baseItems,
      {
        title: 'Client Portfolio',
        url: '/clients',
        icon: Building,
        isActive: (path: string) => path === '/clients',
      },
      {
        title: 'Revenue Analytics',
        url: '/agency-analytics',
        icon: DollarSign,
        isActive: (path: string) => path === '/agency-analytics',
      },
      {
        title: 'Campaigns',
        url: '/campaigns',
        icon: Target,
        isActive: (path: string) => path === '/campaigns' || path.startsWith('/campaigns/'),
      },
      {
        title: 'All Calls',
        url: '/all-calls',
        icon: PhoneCall,
        isActive: (path: string) => path === '/all-calls',
      },
      {
        title: 'Client Onboarding',
        url: '/client-onboarding',
        icon: UserCheck,
        isActive: (path: string) => path === '/client-onboarding',
      },
      {
        title: 'White Label',
        url: '/white-label',
        icon: Palette,
        isActive: (path: string) => path === '/white-label',
      },
      {
        title: 'Team Management',
        url: '/team-management',
        icon: Users,
        isActive: (path: string) => path === '/team-management',
      },
    ];
  }

  // Client user menu items (default) - includes both client_admin and client_user
  const clientItems = [
    ...baseItems,
    {
      title: 'Campaigns',
      url: '/campaigns',
      icon: Target,
      isActive: (path: string) => path === '/campaigns' || path.startsWith('/campaigns/'),
    },
    {
      title: 'CRM',
      url: '/crm',
      icon: Database,
      isActive: (path: string) => path === '/crm',
    },
    {
      title: 'All Calls',
      url: '/all-calls',
      icon: PhoneCall,
      isActive: (path: string) => path === '/all-calls',
    },
    {
      title: 'Analytics',
      url: '/analytics',
      icon: BarChart3,
      isActive: (path: string) => path === '/analytics',
    },
  ];

  // Add Team Management for admin users (client_admin)
  if (role.includes('admin') || role === 'client_admin') {
    clientItems.push({
      title: 'Team Management',
      url: '/team-management',
      icon: Users,
      isActive: (path: string) => path === '/team-management',
    });
  }

  // Add Settings for all users
  clientItems.push({
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    isActive: (path: string) => path === '/settings' || path === '/profile-settings',
  });

  return clientItems;
};

const Layout: React.FC = () => {
  const location = useLocation();
  const { userContext } = useUserContext();
  
  // Get role-based menu items
  let userRole = userContext?.role?.toLowerCase() || 'client_user';
  
  // Debug: Log role detection
  console.log('🔍 Layout Role Detection Debug:', {
    originalRole: userContext?.role,
    normalizedRole: userRole,
    userContext: userContext,
    menuItemsLength: getMenuItemsForRole(userRole).length,
    menuItems: getMenuItemsForRole(userRole).map(item => item.title),
    expectedCRM: userRole === 'client_admin' ? 'SHOULD SHOW CRM' : 'no CRM expected',
    timestamp: new Date().toISOString(),
    userContextComplete: JSON.stringify(userContext, null, 2)
  });
  
  
  const menuItems = getMenuItemsForRole(userRole);

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Modern Professional Sidebar */}
      <div className="group">
        {/* Sidebar Container */}
        <div className="fixed left-0 top-0 z-40 h-full w-20 group-hover:w-64 transition-all duration-300 ease-out bg-gray-950/95 backdrop-blur-xl border-r border-gray-800/50">
          {/* Brand Section */}
          <div className="flex h-20 items-center justify-center border-b border-gray-800/30 px-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                <img 
                  src="https://i.ibb.co/CpCFL2Sn/Screenshot-2025-07-16-at-22-49-Photoroom-1.png" 
                  alt="Apex AI Logo" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div className="overflow-hidden transition-all duration-300 group-hover:w-auto w-0">
                <div className="whitespace-nowrap">
                  <h1 className="text-lg font-bold text-white">Apex AI</h1>
                  <p className="text-xs text-gray-400">
                    {userRole === 'platform_owner' ? 'Platform Owner' :
                     userRole.includes('agency') ? 'Agency Portal' : 
                     userRole.includes('admin') ? 'Client Admin Portal' : 'Client Portal'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 py-6 px-3">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = item.isActive(location.pathname);
                const Icon = item.icon;
                
                return (
                  <li key={item.title}>
                    <Link
                      to={item.url}
                      className={`
                        relative flex items-center h-12 rounded-xl transition-all duration-200
                        ${isActive 
                          ? 'bg-amber-500/15 text-amber-400 shadow-lg shadow-amber-500/10' 
                          : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
                        }
                        group/item
                      `}
                    >
                      {/* Active Indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-400 rounded-r-full"></div>
                      )}
                      
                      {/* Icon Container */}
                      <div className="flex items-center justify-center min-w-[3rem] h-12">
                        <Icon className={`h-5 w-5 transition-colors duration-200 ${
                          isActive ? 'text-amber-400' : 'text-gray-400 group-hover/item:text-white'
                        }`} />
                      </div>
                      
                      {/* Text Container */}
                      <div className="overflow-hidden transition-all duration-300 group-hover:w-auto w-0">
                        <div className="flex items-center justify-between whitespace-nowrap pr-4">
                          <span className="text-sm font-medium">{item.title}</span>
                          {'badge' in item && item.badge && (
                            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Collapsed Badge Indicator */}
                      {'badge' in item && item.badge && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full group-hover:hidden"></div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* User Profile Section */}
          <div className="border-t border-gray-800/30 p-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold shadow-lg">
                  SW
                </div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-gray-950"></div>
              </div>
              <div className="overflow-hidden transition-all duration-300 group-hover:w-auto w-0">
                <div className="whitespace-nowrap">
                  <p className="text-sm font-semibold text-white">
                    {userContext?.firstName || 'Sean'} {userContext?.lastName || 'Wentz'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {userRole === 'platform_owner' ? 'Platform Owner' :
                     userRole.includes('agency') ? 'Agency Owner' : 
                     userRole.includes('admin') ? 'Client Admin' : 'Client User'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar Spacer */}
        <div className="w-20 group-hover:w-64 transition-all duration-300 ease-out"></div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-900/50 via-black to-gray-900/50">
        {/* Top Bar */}
        <header className="h-[70px] bg-black/95 backdrop-blur-xl border-b border-cyan-400/10 flex items-center justify-between px-8 relative z-50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white tracking-wide">
              {menuItems.find(item => item.isActive(location.pathname))?.title || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-5">
            <NotificationBell />
            <UserDropdown />
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-black">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;