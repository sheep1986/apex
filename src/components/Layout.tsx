
import trinitySidebarFull from "@/assets/trinity-sidebar-full.png";
import trinitySidebarIcon from "@/assets/trinity-sidebar-icon.png";
import { useUser } from "@/hooks/auth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useNotificationStore } from "@/lib/notification-store";
import { useUserContext } from "@/services/MinimalUserProvider";
import {
    Activity,
    BarChart3,
    BookOpen,
    Building,
    DollarSign,
    FlaskConical,
    GitBranch,
    Headset,
    HeadphonesIcon,
    Home,
    Menu,
    Monitor,
    Phone,
    PhoneCall,
    Settings,
    Share2,
    Shield,
    Target,
    TrendingUp,
    UserCheck,
    Users,
    Wallet,
    FileBarChart,
    Mail,
    Palette,
    Webhook,
    Wrench,
    X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase-client";
import CommandPalette from "./CommandPalette";
import { NotificationBell } from "./NotificationBell";
import { SubscriptionGuard } from "./SubscriptionGuard";
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
    title: "Workflows",
    titleKey: "workflows",
    url: "/workflows",
    icon: GitBranch,
    isActive: (path: string) => path === "/workflows",
  },
  {
    title: "Test Suites",
    titleKey: "test_suites",
    url: "/test-suites",
    icon: FlaskConical,
    isActive: (path: string) => path === "/test-suites",
  },
  {
    title: "Contacts",
    titleKey: "contacts",
    url: "/contacts",
    icon: Users,
    isActive: (path: string) =>
      path === "/contacts" || path.startsWith("/contacts/"),
  },
  {
    title: "Sales Pipeline",
    titleKey: "pipeline",
    url: "/pipeline",
    icon: TrendingUp,
    isActive: (path: string) => path === "/pipeline",
  },
  {
    title: "Agent Dashboard",
    titleKey: "agent_dashboard",
    url: "/agent-dashboard",
    icon: Headset,
    isActive: (path: string) => path === "/agent-dashboard",
  },
  {
    title: "Call Quality",
    titleKey: "call_quality",
    url: "/call-quality-review",
    icon: Activity,
    isActive: (path: string) => path === "/call-quality-review",
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
    title: "Integrations",
    titleKey: "integrations",
    url: "/integrations",
    icon: Webhook,
    isActive: (path: string) => path === "/integrations",
  },
  {
    title: "Scheduled Reports",
    titleKey: "scheduled-reports",
    url: "/scheduled-reports",
    icon: FileBarChart,
    isActive: (path: string) => path === "/scheduled-reports",
  },
  {
    title: "Email Templates",
    titleKey: "email-templates",
    url: "/email-templates",
    icon: Mail,
    isActive: (path: string) => path === "/email-templates",
  },
  {
    title: "GDPR & Compliance",
    titleKey: "gdpr-compliance",
    url: "/gdpr-compliance",
    icon: Shield,
    isActive: (path: string) => path === "/gdpr-compliance",
    adminOnly: true,
  },
  {
    title: "Agency Branding",
    titleKey: "agency-branding",
    url: "/agency-branding",
    icon: Palette,
    isActive: (path: string) => path === "/agency-branding",
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
    title: "Workflows",
    titleKey: "workflows",
    url: "/workflows",
    icon: GitBranch,
    isActive: (path: string) => path === "/workflows",
  },
  {
    title: "Test Suites",
    titleKey: "test_suites",
    url: "/test-suites",
    icon: FlaskConical,
    isActive: (path: string) => path === "/test-suites",
  },
  {
    title: "Contacts",
    titleKey: "contacts",
    url: "/contacts",
    icon: Users,
    isActive: (path: string) =>
      path === "/contacts" || path.startsWith("/contacts/"),
  },
  {
    title: "Sales Pipeline",
    titleKey: "pipeline",
    url: "/pipeline",
    icon: TrendingUp,
    isActive: (path: string) => path === "/pipeline",
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
    title: "Agent Dashboard",
    titleKey: "agent_dashboard",
    url: "/agent-dashboard",
    icon: Headset,
    isActive: (path: string) => path === "/agent-dashboard",
  },
  {
    title: "Call Quality",
    titleKey: "call_quality",
    url: "/call-quality-review",
    icon: Activity,
    isActive: (path: string) => path === "/call-quality-review",
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
    title: "Integrations",
    titleKey: "integrations",
    url: "/integrations",
    icon: Webhook,
    isActive: (path: string) => path === "/integrations",
  },
  {
    title: "Scheduled Reports",
    titleKey: "scheduled-reports",
    url: "/scheduled-reports",
    icon: FileBarChart,
    isActive: (path: string) => path === "/scheduled-reports",
  },
  {
    title: "Email Templates",
    titleKey: "email-templates",
    url: "/email-templates",
    icon: Mail,
    isActive: (path: string) => path === "/email-templates",
  },
  {
    title: "GDPR & Compliance",
    titleKey: "gdpr-compliance",
    url: "/gdpr-compliance",
    icon: Shield,
    isActive: (path: string) => path === "/gdpr-compliance",
    adminOnly: true,
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

  // Subscribe to realtime hot lead + call completion notifications
  useRealtimeNotifications(userContext?.organization_id);

  // ─── Session Timeout Enforcement ──────────────────────────────────
  // Reads the org's security settings and forces logout after inactivity
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSessionTimeout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const orgId = userContext?.organization_id;
    if (!orgId) return;

    let timeoutMs = 0;
    let cancelled = false;

    // Fetch security settings from the org
    supabase
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        const sessionTimeout = data?.settings?.security?.sessionTimeout;
        if (!sessionTimeout || sessionTimeout <= 0) return;

        timeoutMs = sessionTimeout * 60_000; // minutes → ms

        const resetTimer = () => {
          if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
          sessionTimeoutRef.current = setTimeout(handleSessionTimeout, timeoutMs);
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(e => document.addEventListener(e, resetTimer));
        resetTimer();

        // Store cleanup reference
        (window as any).__sessionTimeoutCleanup = () => {
          if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
          events.forEach(e => document.removeEventListener(e, resetTimer));
        };
      });

    return () => {
      cancelled = true;
      if ((window as any).__sessionTimeoutCleanup) {
        (window as any).__sessionTimeoutCleanup();
        delete (window as any).__sessionTimeoutCleanup;
      }
    };
  }, [userContext?.organization_id, handleSessionTimeout]);

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
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
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
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        <div className="relative h-full flex flex-col">
            {/* Header / Logo — animated: icon collapses out, full logo slides in */}
            <div className="p-4 border-b border-white/10">
              <div className="relative flex items-center h-12 w-full">
                {/* Collapsed: icon centered, fades/slides out on hover */}
                <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out ${
                  isMobileMenuOpen
                    ? "left-0 translate-x-0 opacity-0 pointer-events-none"
                    : "left-1/2 -translate-x-1/2 opacity-100 group-hover:left-0 group-hover:translate-x-0 group-hover:opacity-0"
                }`}>
                  <img src={trinitySidebarIcon} alt="Trinity" className="h-9 w-9 object-contain max-w-none" />
                </div>
                {/* Expanded: full logo slides in */}
                <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out flex items-center ${
                  isMobileMenuOpen
                    ? "left-0 translate-x-0 opacity-100"
                    : "left-0 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                }`}>
                  <img src={trinitySidebarFull} alt="Trinity Labs AI" className="h-9 w-auto object-contain" />
                </div>
              </div>
            </div>

             {/* Navigation */}
          <div className="flex-1 py-4 overflow-y-auto custom-scrollbar">
            <nav className="flex flex-col space-y-1">
              {menuItems.map((item) => {
                if (
                  item.adminOnly &&
                  !["client_admin", "platform_owner", "agency_admin", "agency_owner", "org_owner", "admin"].includes(
                    userContext?.role || ""
                  )
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
                      relative mx-2 rounded-lg
                      ${isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}
                    `}
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`} />
                    <span className={`ml-3 tracking-wide whitespace-nowrap overflow-hidden transition-opacity duration-300 absolute left-12 ${
                      isMobileMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}>
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
      <div className="flex-1 flex flex-col bg-black min-w-0">
        <header className="h-[70px] bg-black/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <h2 className="text-lg sm:text-xl font-semibold text-white truncate">
                  {menuItems.find(i => i.isActive(location.pathname))?.title || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <NotificationBell />
                <UserDropdown />
            </div>
        </header>
        <main className="flex-1 overflow-auto bg-black">
            <SubscriptionGuard>
              <Outlet />
            </SubscriptionGuard>
        </main>
      </div>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette />
    </div>
  );
};

export default Layout;
