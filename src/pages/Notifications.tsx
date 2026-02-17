import React, { useState, useMemo } from 'react';
import {
  Bell,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  ChevronRight,
  Trash2,
  CheckCheck,
  Clock,
  Archive,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotificationStore } from '@/lib/notification-store';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  
  // Calculate stats from notifications array
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, unread, byType };
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-emerald-400';
      case 'error':
        return 'border-l-red-400';
      case 'warning':
        return 'border-l-yellow-400';
      case 'info':
      default:
        return 'border-l-blue-400';
    }
  };

  const formatTimeAgo = (timestamp: Date | string | number) => {
    const now = new Date();
    let date: Date;

    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Unknown';
    }

    if (isNaN(date.getTime())) {
      return 'Unknown';
    }

    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesSearch =
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || notification.type === filterType;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'unread' && !notification.read) ||
        (filterStatus === 'read' && notification.read);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, searchTerm, filterType, filterStatus]);

  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredNotifications.slice(startIndex, endIndex);
  }, [filteredNotifications, currentPage]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(paginatedNotifications.map((n) => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleSelectNotification = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedNotifications([...selectedNotifications, id]);
    } else {
      setSelectedNotifications(selectedNotifications.filter((nId) => nId !== id));
    }
  };

  const handleBulkAction = (action: 'read' | 'delete') => {
    selectedNotifications.forEach((id) => {
      if (action === 'read') {
        markAsRead(id);
      } else {
        deleteNotification(id);
      }
    });
    setSelectedNotifications([]);
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);

    if (notification.metadata?.leadId) {
      navigate(`/leads/${notification.metadata.leadId}`);
    } else if (notification.metadata?.campaignId) {
      navigate(`/campaigns/${notification.metadata.campaignId}`);
    } else if (notification.metadata?.ticketId) {
      navigate(`/support-tickets/${notification.metadata.ticketId}`);
    } else if (notification.action?.href) {
      navigate(notification.action.href);
    }
  };

  return (
    <div className="min-h-screen bg-black space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 rounded-lg">
            <Bell className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-gray-400">View and manage your notifications</p>
          </div>
        </div>
        <div className="flex gap-2">
          {stats.unread > 0 && (
            <Button onClick={markAllAsRead} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate('/settings')}
            className="border-gray-700 hover:bg-gray-800"
          >
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-gray-800 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="rounded-lg p-3 border border-blue-500/20 bg-blue-500/10">
                <Bell className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-amber-400">{stats.unread}</p>
              </div>
              <div className="rounded-lg p-3 border border-amber-500/20 bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Success</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.byType.success || 0}</p>
              </div>
              <div className="rounded-lg p-3 border border-emerald-500/20 bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Warnings</p>
                <p className="text-2xl font-bold text-amber-400">{stats.byType.warning || 0}</p>
              </div>
              <div className="rounded-lg p-3 border border-red-500/20 bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-gray-800 bg-gray-900">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-gray-600 bg-gray-900/50 pl-10 text-white"
                />
              </div>
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] border-gray-600 bg-gray-900/50">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-800">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] border-gray-600 bg-gray-900/50">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-800">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedNotifications.length > 0 && (
            <div className="mt-4 flex items-center gap-4 rounded-lg border border-emerald-700/30 bg-emerald-900/20 p-3">
              <span className="text-sm text-emerald-400">
                {selectedNotifications.length} selected
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleBulkAction('read')}
                className="text-emerald-400 hover:text-emerald-300"
              >
                <CheckCheck className="mr-1 h-4 w-4" />
                Mark as Read
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleBulkAction('delete')}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedNotifications([])}
                className="ml-auto text-gray-400 hover:text-gray-300"
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="border-gray-800 bg-gray-900">
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Bell className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg">No notifications found</p>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search' : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 border-b border-gray-700 p-4">
                <Checkbox
                  checked={
                    selectedNotifications.length === paginatedNotifications.length &&
                    paginatedNotifications.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                  className="border-gray-600"
                />
                <span className="text-sm text-gray-400">Select all on this page</span>
              </div>

              <div className="divide-y divide-gray-700">
                {paginatedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'group relative flex cursor-pointer items-start border-l-4 p-4 transition-colors hover:bg-gray-700/50',
                      getNotificationColor(notification.type),
                      !notification.read && 'bg-gray-700/30'
                    )}
                  >
                    <Checkbox
                      checked={selectedNotifications.includes(notification.id)}
                      onCheckedChange={(checked) =>
                        handleSelectNotification(notification.id, checked as boolean)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="mr-4 mt-1 border-gray-600"
                    />

                    <div
                      className="min-w-0 flex-1"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <p
                                className={cn(
                                  'text-sm font-medium',
                                  notification.read ? 'text-gray-300' : 'text-white'
                                )}
                              >
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <Badge className="border-emerald-500/30 bg-emerald-500/20 text-xs text-emerald-400">
                                  New
                                </Badge>
                              )}
                            </div>

                            <p className="mb-2 text-sm text-gray-400">{notification.message}</p>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{formatTimeAgo(notification.timestamp)}</span>
                              {notification.category && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{notification.category}</span>
                                </>
                              )}
                              {notification.source && (
                                <>
                                  <span>•</span>
                                  <span>{notification.source}</span>
                                </>
                              )}
                            </div>

                            {notification.action && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-auto p-0 text-xs text-emerald-400 hover:text-emerald-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (notification.action?.href) {
                                    navigate(notification.action.href);
                                  }
                                }}
                              >
                                {notification.action.label}
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="ml-4 flex items-center gap-2">
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                          )}
                          <ChevronRight className="h-4 w-4 text-gray-600 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-700 p-4">
                  <p className="text-sm text-gray-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of{' '}
                    {filteredNotifications.length} notifications
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-gray-600 hover:bg-gray-700"
                    >
                      Previous
                    </Button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            'w-10',
                            currentPage === pageNum
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'border-gray-600 hover:bg-gray-700'
                          )}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-gray-600 hover:bg-gray-700"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
