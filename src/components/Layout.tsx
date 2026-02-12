
import trinitySidebarIcon from "@/assets/trinity-sidebar-icon.png";
import { useUser } from "@/hooks/auth";
import { useNotificationStore } from "@/lib/notification-store";
import { useUserContext } from "@/services/MinimalUserProvider";
import {
    Activity,
    BarChart3,
    BookOpen,
    Building,
    DollarSign,
    HeadphonesIcon,
    Home,
    Monitor,
    Phone,
    PhoneCall,
    Settings,
    Share2,
    Shield,
    Target,
    UserCheck,
    Wallet,
    Wrench,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { NotificationBell } from "./NotificationBell";
import { UserDropdown } from "./UserDropdown";

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
const platformOwnerMenuItems: MenuItem[] = [
  {
    title: "Platform Overview",
    titleKey: "platform_overview",
    url: "/platform",
    icon: Home,
    isActive: (path: string) =>
      path === "/platform" || path === "/platform-owner",
  },
  {
    title: "Organizations",
    titleKey: "organizations",
    url: "/organizations",
    icon: Building,
    isActive: (path: string) =>
      path === "/organizations" || path.startsWith("/organization"),
  },
  {
    title: "User Management",
    titleKey: "user_management",
    url: "/user-management",
    icon: UserCheck,
    isActive: (path: string) => path === "/user-management",
  },
  {
    title: "Platform Analytics",
    titleKey: "platform_analytics",
    url: "/platform-analytics",
    icon: BarChart3,
    isActive: (path: string) => path === "/platform-analytics",
  },
  {
    title: "Support Tickets",
    titleKey: "support_tickets",
    url: "/support-tickets",
    icon: HeadphonesIcon,
    isActive: (path: string) => path === "/support-tickets",
  },
  {
    title: "System Health",
    titleKey: "system_health",
    url: "/system-health",
    icon: Activity,
    isActive: (path: string) => path === "/system-health",
  },
  {
    title: "Security & Audit",
    titleKey: "security_audit",
    url: "/audit-logs",
    icon: Shield,
    isActive: (path: string) => path === "/audit-logs",
  },
  {
    title: "Intelligent Routing",
    titleKey: "squads",
    url: "/squads",
    icon: Share2,
    isActive: (path: string) => path === "/squads",
  },
];

// Agency Menu Items
const agencyMenuItems: MenuItem[] = [
  {
    title: "Client Management",
    titleKey: "client_management",
    url: "/clients",
    icon: Building,
    isActive: (path: string) =>
      path === "/clients" || path.startsWith("/client/"),
  },
  {
    title: "Campaigns",
    titleKey: "campaigns",
    url: "/campaigns",
    icon: Target,
    isActive: (path: string) =>
      path === "/campaigns" || path.startsWith("/campaigns/"),
  },
  {
    title: "Assistants",
    titleKey: "assistants",
    url: "/ai-assistants",
    icon: HeadphonesIcon,
    isActive: (path: string) => path === "/ai-assistants",
  },
  {
    title: "Telephony",
    titleKey: "telephony",
    url: "/telephony",
    icon: Phone,
    isActive: (path: string) => path === "/telephony",
  },
  {
    title: "Tools",
    titleKey: "tools",
    url: "/tools",
    icon: Wrench,
    isActive: (path: string) => path === "/tools",
  },
  {
    title: "Knowledge Base",
    titleKey: "knowledge",
    url: "/knowledge",
    icon: BookOpen,
    isActive: (path: string) => path === "/knowledge",
  },
  {
    title: "Intelligent Routing",
    titleKey: "squads",
    url: "/squads",
    icon: Share2,
    isActive: (path: string) => path === "/squads",
  },
  {
    title: "Analytics",
    titleKey: "analytics",
    url: "/analytics",
    icon: BarChart3,
    isActive: (path: string) => path === "/analytics",
  },
  {
    title: "Billing",
    titleKey: "billing",
    url: "/billing",
    icon: Wallet,
    isActive: (path: string) => path === "/billing",
  },
  {
    title: "Settings",
    titleKey: "settings",
    url: "/settings",
    icon: Settings,
    isActive: (path: string) =>
      path === "/settings" || path.startsWith("/settings/"),
  },
];

// Client Menu Items
const clientMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    titleKey: "dashboard",
    url: "/dashboard",
    icon: Home,
    isActive: (path: string) => path === "/dashboard",
  },
  {
    title: "Campaigns",
    titleKey: "campaigns",
    url: "/campaigns",
    icon: Target,
    isActive: (path: string) =>
      path === "/campaigns" || path.startsWith("/campaigns/"),
  },
  {
    title: "Assistants",
    titleKey: "assistants",
    url: "/ai-assistants",
    icon: HeadphonesIcon,
    isActive: (path: string) => path === "/ai-assistants",
  },
  {
    title: "Telephony",
    titleKey: "telephony",
    url: "/telephony",
    icon: Phone,
    isActive: (path: string) => path === "/telephony",
  },
  {
    title: "Tools",
    titleKey: "tools",
    url: "/tools",
    icon: Wrench,
    isActive: (path: string) => path === "/tools",
  },
  {
    title: "Knowledge Base",
    titleKey: "knowledge",
    url: "/knowledge",
    icon: BookOpen,
    isActive: (path: string) => path === "/knowledge",
  },
  {
    title: "Intelligent Routing",
    titleKey: "squads",
    url: "/squads",
    icon: Share2,
    isActive: (path: string) => path === "/squads",
  },
  {
    title: "All Calls",
    titleKey: "all_calls",
    url: "/all-calls",
    icon: PhoneCall,
    isActive: (path: string) => path === "/all-calls",
  },
  {
    title: "Live Monitor",
    titleKey: "live_monitor",
    url: "/live-calls",
    icon: Monitor,
    isActive: (path: string) => path === "/live-calls",
  },
  {
    title: "Analytics",
    titleKey: "analytics",
    url: "/analytics",
    icon: BarChart3,
    isActive: (path: string) => path === "/analytics",
  },
  {
    title: "Billing",
    titleKey: "billing",
    url: "/billing",
    icon: Wallet,
    isActive: (path: string) => path === "/billing",
  },
  {
    title: "Organization",
    titleKey: "organization",
    url: "/organization-settings",
    icon: Building,
    isActive: (path: string) => path === "/organization-settings",
    adminOnly: true,
  },
  {
    title: "Settings",
    titleKey: "settings",
    url: "/settings",
    icon: Settings,
    isActive: (path: string) =>
      path === "/settings" || path.startsWith("/settings/"),
  },
];

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userContext } = useUserContext();
  const { addNotification, notifications } = useNotificationStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();

  // Initial redirect
  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    const clientPaths = [
      "/dashboard",
      "/campaigns",
      "/crm",
      "/all-calls",
      "/live-calls",
    ];
    const isOnClientPath = clientPaths.some((path) =>
      location.pathname.startsWith(path)
    );

    if (email === "sean@artificialmedia.co.uk" && isOnClientPath) {
      // navigate("/platform", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Initialize demo notifications
  useEffect(() => {
    if (notifications.length === 0) {
      addNotification({
        type: "success",
        title: "System Online",
        message: "Platform services operational.",
        category: "system",
        priority: "low",
        source: "System",
        read: true,
      });
    }
  }, [notifications.length, addNotification]);

  const menuItems = useMemo(() => {
    const userRole = userContext?.role?.toLowerCase();
    switch (userRole) {
      case "platform_owner":
        return platformOwnerMenuItems;
      case "agency_owner":
      case "agency_admin":
      case "agency_user":
        return agencyMenuItems;
      case "client_admin":
      case "client_user":
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
      
      {/* Sidebar */}
      <div className={`
          group relative transition-all duration-300 ease-in-out z-50 flex-shrink-0
          ${isMobileMenuOpen 
            ? "fixed inset-y-0 left-0 w-64 md:relative md:w-16 md:hover:w-64" 
            : "hidden md:block md:w-16 md:hover:w-64"}
      `}>
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl border-r border-white/10"></div>
        <div className="relative h-full flex flex-col">
            {/* Header / Logo */}
            <div className="p-4 border-b border-white/10 h-16 flex items-center justify-center overflow-hidden">
                <img src={trinitySidebarIcon} alt="Logo" className="h-8 w-8 object-contain" />
            </div>

             {/* Navigation */}
          <div className="flex-1 py-4 overflow-y-auto custom-scrollbar">
            <nav className="flex flex-col space-y-1">
              {menuItems.map((item) => {
                if (
                  (item.adminOnly) &&
                  userContext?.role !== "client_admin" &&
                  userContext?.role !== "platform_owner"
                ) {
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
                      relative mx-2 rounded-lg group
                      ${isActive ? "bg-transparent text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}
                    `}
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${isActive ? "text-green-500 scale-110" : "text-white/60 group-hover:text-white"}`} />
                    <span className="ml-3 tracking-wide whitespace-nowrap overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 absolute left-12">
                      {item.title}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-black">
        <header className="h-[70px] bg-black/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
            <h2 className="text-xl font-semibold text-white">
                {menuItems.find(i => i.isActive(location.pathname))?.title || "Dashboard"}
            </h2>
            <div className="flex items-center gap-4">
                <NotificationBell />
                <UserDropdown />
            </div>
        </header>
        <main className="flex-1 overflow-auto bg-black">
            <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
