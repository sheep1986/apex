import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  X,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  DollarSign,
  Phone,
  Target,
  TrendingUp,
  Clock,
  ExternalLink,
  MoreVertical,
  Eye,
  EyeOff,
  Archive,
  Star,
  Activity,
  RefreshCw,
  Search,
  ChevronDown,
  Filter,
  Sparkles,
  Bookmark,
  Mail,
  Globe,
  Calendar,
  FileText,
  CreditCard,
  MessageSquare,
  Building,
  Shield,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  useNotificationStore,
  Notification,
  NotificationCategory,
  NotificationType,
  NotificationPriority,
} from '@/lib/notification-store';

const NOTIFICATION_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  system: Zap,
  campaign: Target,
  billing: DollarSign,
  calls: Phone,
  performance: TrendingUp,
  security: Shield,
  message: MessageSquare,
  update: RefreshCw,
};

const CATEGORY_COLORS = {
  system: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    icon: 'text-purple-500',
  },
  calls: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    icon: 'text-blue-500',
  },
  campaigns: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-500',
  },
  performance: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
    icon: 'text-orange-500',
  },
  billing: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/20',
    icon: 'text-yellow-500',
  },
  security: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    icon: 'text-red-500',
  },
};

const PRIORITY_INDICATORS = {
  low: { color: 'bg-gray-400', pulse: false },
  medium: { color: 'bg-blue-500', pulse: false },
  high: { color: 'bg-orange-500', pulse: true },
  urgent: { color: 'bg-red-500', pulse: true },
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onAction?: (action: Notification['action']) => void;
}

const NotificationItem = React.memo(function NotificationItem({
  notification,
  onMarkAsRead,
  onRemove,
  onAction,
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = NOTIFICATION_ICONS[notification.type] || Info;
  const categoryStyle = CATEGORY_COLORS[notification.category] || CATEGORY_COLORS.system;
  const priorityStyle = PRIORITY_INDICATORS[notification.priority];
  const timeAgo = formatDistanceToNow(notification.timestamp, { addSuffix: true });

  const handleAction = () => {
    if (notification.action) {
      onAction?.(notification.action);
      if (notification.action.href) {
        window.open(notification.action.href, '_blank');
      }
      if (notification.action.callback) {
        notification.action.callback();
      }
    }
  };

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-lg border p-3 transition-all duration-200',
        'hover:border-gray-600/50 hover:bg-gray-800/30',
        !notification.read && 'border-gray-700/30 bg-gray-800/20',
        notification.read && 'border-gray-800/30 bg-transparent'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      {/* Priority indicator */}
      <div
        className={cn(
          'absolute left-2 top-2 h-2 w-2 rounded-full',
          priorityStyle.color,
          priorityStyle.pulse && 'animate-pulse'
        )}
      />

      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
      )}

      <div className="ml-4 flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200',
            categoryStyle.bg,
            categoryStyle.border,
            'border'
          )}
        >
          <IconComponent className={cn('h-4 w-4', categoryStyle.icon)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-2 flex items-start justify-between">
            <div className="flex-1">
              <h4
                className={cn(
                  'text-sm font-semibold leading-tight transition-colors duration-200',
                  !notification.read ? 'text-white' : 'text-gray-300',
                  isHovered && 'text-emerald-400'
                )}
              >
                {notification.title}
              </h4>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'border-0 px-2 py-0.5 text-xs font-medium',
                    categoryStyle.bg,
                    categoryStyle.text
                  )}
                >
                  {notification.category}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div
              className={cn(
                'flex items-center gap-1 opacity-0 transition-opacity duration-200',
                isHovered && 'opacity-100'
              )}
            >
              {notification.action && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction();
                  }}
                >
                  {notification.action.label}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-400 hover:bg-white/10 hover:text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-gray-700 bg-gray-900/95 backdrop-blur-xl"
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      notification.read
                        ? onMarkAsRead(notification.id)
                        : onMarkAsRead(notification.id);
                    }}
                    className="text-gray-300 hover:bg-white/10 hover:text-white"
                  >
                    {notification.read ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Mark as Unread
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Mark as Read
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(notification.id);
                    }}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Message */}
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-400">
            {notification.message}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">{notification.source}</span>
            {notification.metadata?.tags && (
              <div className="flex items-center gap-1">
                {notification.metadata.tags.slice(0, 2).map((tag: string, index: number) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-gray-700 px-1.5 py-0 text-xs text-gray-400"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const {
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getUnreadCount,
    getFilteredNotifications,
  } = useNotificationStore();

  const unreadCount = getUnreadCount();

  // Memoize filtered and sorted notifications for performance
  const sortedNotifications = React.useMemo(() => {
    // Filter notifications
    const filteredNotifications = notifications.filter((notification) => {
      const matchesSearch =
        searchQuery === '' ||
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.source.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filter === 'all' ||
        (filter === 'unread' && !notification.read) ||
        (filter === 'read' && notification.read);

      return matchesSearch && matchesFilter;
    });

    // Sort by timestamp (newest first) and unread first
    const sorted = [...filteredNotifications].sort((a, b) => {
      if (a.read !== b.read) {
        return a.read ? 1 : -1; // Unread first
      }
      const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return timeB.getTime() - timeA.getTime();
    });

    // Limit to 50 notifications for better performance
    return sorted.slice(0, 50);
  }, [notifications, searchQuery, filter]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleMarkAsRead = React.useCallback((id: string) => {
    markAsRead(id);
  }, [markAsRead]);

  const handleRemove = React.useCallback((id: string) => {
    removeNotification(id);
  }, [removeNotification]);

  const handleAction = (action: Notification['action']) => {
    if (action?.href) {
      window.open(action.href, '_blank');
    }
    if (action?.callback) {
      action.callback();
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="relative h-10 w-10 cursor-pointer inline-flex items-center justify-center bg-transparent border-none outline-none focus:outline-none">
          <Bell className={cn(
            "h-5 w-5 transition-colors duration-200",
            isOpen ? "text-emerald-400" : "text-gray-300 hover:text-white"
          )} />

          {/* Green notification dot indicator */}
          {unreadCount > 0 && (
            <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-emerald-500 shadow-lg"></div>
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-96 border-gray-700/50 bg-gray-900/95 p-0 shadow-2xl backdrop-blur-sm"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="relative border-b border-gray-800/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Sparkles className="h-4 w-4 text-gray-400" />
                Notifications
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                {unreadCount > 0 ? (
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    {unreadCount === 1 
                      ? `${unreadCount} new notification`
                      : `${unreadCount} new notifications`
                    }
                  </span>
                ) : (
                  "All caught up!"
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 px-2 text-xs text-gray-300 transition-all duration-200 hover:bg-gray-800/50 hover:text-white"
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Mark All Read
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-gray-700 bg-gray-900/95 backdrop-blur-xl"
                >
                  <DropdownMenuItem
                    onClick={clearAll}
                    className="text-gray-300 hover:bg-white/10 hover:text-white"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:bg-white/10 hover:text-white">
                    <Settings className="mr-2 h-4 w-4" />
                    Notification Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-2 border-b border-gray-800/30 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 transform text-gray-500" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 border-gray-700/50 bg-gray-800/50 pl-8 text-xs text-white transition-all duration-200 placeholder:text-gray-500 focus:border-gray-600 focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-1">
            {(['all', 'unread', 'read'] as const).map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(filterOption)}
                className={cn(
                  'h-6 px-2 text-xs capitalize transition-all duration-200',
                  filter === filterOption
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                )}
              >
                {filterOption === 'all' ? 'All' : filterOption === 'unread' ? 'Unread' : 'Read'}
                {filterOption === 'unread' && unreadCount > 0 && (
                  <Badge className="ml-1 border-0 bg-emerald-500 px-1 py-0 text-xs text-white">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-80">
          <div className="p-1">
            {sortedNotifications.length > 0 ? (
              <div className="space-y-1 p-2">
                {sortedNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onRemove={handleRemove}
                    onAction={handleAction}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="relative">
                  <Bell className="mx-auto mb-4 h-16 w-16 opacity-30" />
                  <Sparkles className="absolute -right-1 -top-1 h-6 w-6 animate-pulse text-emerald-400" />
                </div>
                <p className="mb-2 text-lg font-medium">
                  {searchQuery ? 'No matching notifications' : 'All clear!'}
                </p>
                <p className="max-w-xs text-center text-sm text-gray-600">
                  {searchQuery
                    ? 'Try adjusting your search or filters.'
                    : 'No new notifications right now.'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-gray-800/30 p-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{sortedNotifications.length} shown</span>
              <span>•</span>
              <span>{notifications.length} total</span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="mt-3 w-full h-9 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            onClick={() => {
              setIsOpen(false);
              navigate('/notifications');
            }}
          >
            View All Notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
