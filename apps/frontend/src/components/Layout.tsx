import React, { useMemo, useEffect, useState } from 'react';
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
  Phone, 
  Users, 
  BarChart3, 
  Settings, 
  Bot,
  MessageSquare,
  CreditCard,
  Bell,
  Database,
  Building,
  UserCheck,
  PhoneCall,
  Target,
  Zap,
  Monitor,
  DollarSign,
  HeadphonesIcon,
  Shield,
  Activity,
  Menu,
  Calendar
} from 'lucide-react';
import { UserDropdown } from './UserDropdown';
import { NotificationBell } from './NotificationBell';
import { useUserContext } from '@/services/MinimalUserProvider';
import { useNotificationStore } from '@/lib/notification-store';
import { DebugAuth } from './DebugAuth';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

interface MenuItem {
  title: string;
  titleKey: string;
  url: string;
  icon: any;
  isActive: (path: string) => boolean;
  badge?: string;
  adminOnly?: boolean;
}

// Platform Owner Menu Items
const platformOwnerMenuItems = [
  {
    title: 'Platform Overview',
    titleKey: 'platform_overview',
    url: '/platform',
    icon: Home,
    isActive: (path: string) => path === '/platform' || path === '/platform-owner',
  },
  {
    title: 'Organizations',
    titleKey: 'organizations',
    url: '/organizations',
    icon: Building,
    isActive: (path: string) => path === '/organizations' || path.startsWith('/organization'),
  },
  {
    title: 'User Management',
    titleKey: 'user_management',
    url: '/user-management',
    icon: UserCheck,
    isActive: (path: string) => path === '/user-management',
  },
  {
    title: 'Platform Analytics',
    titleKey: 'platform_analytics',
    url: '/platform-analytics',
    icon: BarChart3,
    isActive: (path: string) => path === '/platform-analytics',
  },
  {
    title: 'Support Tickets',
    titleKey: 'support_tickets',
    url: '/support-tickets',
    icon: HeadphonesIcon,
    isActive: (path: string) => path === '/support-tickets',
  },
  {
    title: 'System Health',
    titleKey: 'system_health',
    url: '/system-health',
    icon: Activity,
    isActive: (path: string) => path === '/system-health',
  },
  {
    title: 'Security & Audit',
    titleKey: 'security_audit',
    url: '/audit-logs',
    icon: Shield,
    isActive: (path: string) => path === '/audit-logs',
  },
];

// Agency Menu Items
const agencyMenuItems = [
  {
    title: 'Agency Dashboard',
    titleKey: 'agency_dashboard',
    url: '/agency',
    icon: Home,
    isActive: (path: string) => path === '/agency',
  },
  {
    title: 'Client Management',
    titleKey: 'client_management',
    url: '/clients',
    icon: Building,
    isActive: (path: string) => path === '/clients' || path.startsWith('/client/'),
  },
  {
    title: 'Campaigns',
    titleKey: 'campaigns',
    url: '/campaigns',
    icon: Target,
    isActive: (path: string) => path === '/campaigns' || path.startsWith('/campaigns/'),
  },
  {
    title: 'Analytics',
    titleKey: 'analytics',
    url: '/analytics',
    icon: BarChart3,
    isActive: (path: string) => path === '/analytics',
  },
  {
    title: 'Team',
    titleKey: 'team',
    url: '/team-management',
    icon: Users,
    isActive: (path: string) => path === '/team-management',
  },
  {
    title: 'Billing',
    titleKey: 'billing',
    url: '/billing',
    icon: CreditCard,
    isActive: (path: string) => path === '/billing',
  },
  {
    title: 'Settings',
    titleKey: 'settings',
    url: '/settings',
    icon: Settings,
    isActive: (path: string) => path === '/settings' || path.startsWith('/settings/'),
  },
];

// Client Menu Items (original menu)
const clientMenuItems = [
  {
    title: 'Dashboard',
    titleKey: 'dashboard',
    url: '/dashboard',
    icon: Home,
    isActive: (path: string) => path === '/dashboard',
  },
  {
    title: 'Campaigns',
    titleKey: 'campaigns',
    url: '/campaigns',
    icon: Target,
    isActive: (path: string) => path === '/campaigns' || path.startsWith('/campaigns/'),
  },
  {
    title: 'CRM',
    titleKey: 'crm',
    url: '/crm',
    icon: Database,
    isActive: (path: string) => path === '/crm',
  },
  {
    title: 'Appointments',
    titleKey: 'appointments',
    url: '/appointments',
    icon: Calendar,
    isActive: (path: string) => path === '/appointments',
  },
  {
    title: 'All Calls',
    titleKey: 'all_calls',
    url: '/all-calls',
    icon: PhoneCall,
    isActive: (path: string) => path === '/all-calls',
  },
  {
    title: 'Live Monitor',
    titleKey: 'live_monitor',
    url: '/live-calls',
    icon: Monitor,
    isActive: (path: string) => path === '/live-calls',
  },
  {
    title: 'Analytics',
    titleKey: 'analytics',
    url: '/analytics',
    icon: BarChart3,
    isActive: (path: string) => path === '/analytics',
  },
  {
    title: 'Cost Analytics',
    titleKey: 'cost_analytics',
    url: '/cost-analytics',
    icon: DollarSign,
    isActive: (path: string) => path === '/cost-analytics',
  },
  {
    title: 'Team',
    titleKey: 'team_management',
    url: '/team-management',
    icon: Users,
    isActive: (path: string) => path === '/team-management',
  },
  {
    title: 'Organization',
    titleKey: 'organization',
    url: '/organization-settings',
    icon: Building,
    isActive: (path: string) => path === '/organization-settings',
    adminOnly: true,
  },
  {
    title: 'Settings',
    titleKey: 'settings',
    url: '/settings',
    icon: Settings,
    isActive: (path: string) => path === '/settings' || path.startsWith('/settings/'),
  },
];

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userContext } = useUserContext();
  const { addNotification, notifications } = useNotificationStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user: clerkUser } = useClerkUser();
  
  // Initial redirect for platform owner (only on first load)
  useEffect(() => {
    const email = clerkUser?.primaryEmailAddress?.emailAddress;
    // Only redirect if on root paths or client-specific paths
    const clientPaths = ['/dashboard', '/campaigns', '/crm', '/all-calls', '/live-calls'];
    const isOnClientPath = clientPaths.some(path => location.pathname.startsWith(path));
    
    if (email === 'sean@artificialmedia.co.uk' && isOnClientPath) {
      console.log('🚀 Redirecting platform owner away from client path to /platform');
      navigate('/platform', { replace: true });
    }
  }, [clerkUser, location.pathname, navigate]);
  
  // Initialize demo notifications
  useEffect(() => {
    if (notifications.length === 0) {
      console.log('🔔 Layout: Initializing demo notifications');
      
      // Add some demo notifications
      addNotification({
        type: 'success',
        title: 'Campaign Performance Alert',
        message: 'Summer Sale campaign exceeded target conversion rate by 15%! Great job on the optimization.',
        category: 'campaigns',
        priority: 'medium',
        source: 'Campaign Engine',
        read: false,
        action: {
          label: 'View Campaign',
          href: '/campaigns'
        }
      });

      addNotification({
        type: 'warning',
        title: 'Low Credit Balance',
        message: 'VAPI credits running low. Current balance: 150 credits. Consider topping up.',
        category: 'billing',
        priority: 'high',
        source: 'Billing System',
        read: false,
        action: {
          label: 'Add Credits',
          href: '/billing'
        }
      });

      addNotification({
        type: 'info',
        title: 'System Update Complete',
        message: 'Platform has been updated to v2.1.3 with improved call quality and new analytics features.',
        category: 'system',
        priority: 'low',
        source: 'System',
        read: true
      });
    }
  }, [notifications.length, addNotification]);
  
  // Get the appropriate menu items based on user role
  const menuItems = useMemo(() => {
    const userRole = userContext?.role?.toLowerCase();
    console.log('🎯 Layout: Determining menu for role:', userRole);
    
    switch (userRole) {
      case 'platform_owner':
        return platformOwnerMenuItems;
      case 'agency_owner':
      case 'agency_admin':
      case 'agency_user':
        return agencyMenuItems;
      case 'client_admin':
      case 'client_user':
      default:
        return clientMenuItems;
    }
  }, [userContext?.role]);

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      {/* Custom Cyberpunk Sidebar with Hover Expansion */}
      <div className={`group relative transition-all duration-300 ease-in-out z-50 ${
        isMobileMenuOpen 
          ? 'fixed inset-y-0 left-0 w-[280px] md:relative md:w-16 md:hover:w-[280px]' 
          : 'hidden md:block md:w-16 md:hover:w-[280px]'
      }`}>
        {/* Sidebar Background with Gradient Overlay */}
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl border-r border-cyan-400/10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/5 to-transparent pointer-events-none"></div>
        
        {/* Sidebar Content */}
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-cyan-400/10">
            <div className="flex items-center cursor-pointer transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-400/20 flex-shrink-0">
                <Zap className="h-6 w-6 text-black font-bold" />
              </div>
              <div className={`ml-3 transition-opacity duration-300 whitespace-nowrap overflow-hidden ${
                isMobileMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <h1 className="text-xl font-bold text-cyan-400 uppercase tracking-wider">Apex AI</h1>
                <p className="text-xs text-white/60">Voice AI Platform</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 py-5">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                // Skip admin-only items for non-admin users
                if (item.adminOnly && userContext?.role !== 'client_admin' && userContext?.role !== 'platform_owner') {
                  return null;
                }
                
                const isActive = item.isActive(location.pathname);
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      nav-item flex items-center px-4 py-3.5 text-sm font-medium transition-all duration-300 
                      border-l-3 relative mx-2 rounded-lg
                      ${isActive 
                        ? 'bg-cyan-400/10 text-cyan-400 border-l-cyan-400' 
                        : 'text-white/70 border-l-transparent hover:bg-cyan-400/5 hover:text-cyan-400 hover:border-l-cyan-400/30'
                      }
                    `}
                  >
                    {/* Active state indicator */}
                    {isActive && (
                      <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-cyan-400 to-transparent"></div>
                    )}
                    
                    <item.icon className={`
                      h-5 w-5 flex-shrink-0 transition-all duration-300
                      ${isActive ? 'text-cyan-400' : 'text-white/60 group-hover:text-cyan-400'}
                    `} />
                    <span className={`ml-3 tracking-wide whitespace-nowrap overflow-hidden transition-opacity duration-300 ${
                      isMobileMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>{item.title}</span>
                    
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-cyan-400/10">
            <div className="flex items-center cursor-pointer transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-semibold text-black text-sm flex-shrink-0">
                {userContext?.firstName?.[0] || 'U'}{userContext?.lastName?.[0] || 'U'}
              </div>
              <div className="ml-3 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
                <div className="text-sm font-semibold text-white">
                  {userContext?.firstName || 'User'} {userContext?.lastName || ''}
                </div>
                <div className="text-xs text-white/60">
                  {userContext?.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'User'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-900/50 via-black to-gray-900/50">
        {/* Top Bar */}
        <header className="h-[70px] bg-black/95 backdrop-blur-xl border-b border-cyan-400/10 flex items-center justify-between px-4 sm:px-6 lg:px-8 relative z-50">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-wide">
              {(() => {
                const activeItem = menuItems.find(item => item.isActive(location.pathname));
                return activeItem ? activeItem.title : 'Dashboard';
              })()}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-5">
            <NotificationBell />
            <UserDropdown />
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-black">
          <Outlet />
        </main>
      </div>
      
      {/* Debug Component - Remove in production */}
      {/* <DebugAuth /> */}
    </div>
  );
};

export default Layout;