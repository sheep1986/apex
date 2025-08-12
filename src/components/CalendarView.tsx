import React from 'react';
import { Calendar, Clock, MapPin, User, AlertCircle, CheckCircle, Phone, Video, Users } from 'lucide-react';

interface Appointment {
  id: string;
  type: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration_minutes?: number;
  location_type?: string;
  location_details?: any;
  status: string;
  confirmation_status: string;
  agenda?: string;
  preparation_notes?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority: string;
  due_date: string;
  due_time?: string;
  status: string;
  notes?: string;
}

interface CalendarViewProps {
  appointments: Appointment[];
  tasks: Task[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onTaskClick?: (task: Task) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  tasks,
  onAppointmentClick,
  onTaskClick
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const getAppointmentIcon = (type: string, locationType?: string) => {
    if (locationType === 'video') return <Video className="h-4 w-4" />;
    if (locationType === 'in_person') return <MapPin className="h-4 w-4" />;
    if (type === 'meeting') return <Users className="h-4 w-4" />;
    return <Phone className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-900/30 border-red-800';
      case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-800';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-800';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-400" />;
      case 'tentative': return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Combine and sort appointments and tasks by date
  const allItems = [
    ...appointments.map(apt => ({ ...apt, itemType: 'appointment' as const })),
    ...tasks.map(task => ({ ...task, itemType: 'task' as const, date: task.due_date, time: task.due_time }))
  ].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time || '00:00'}`);
    const dateB = new Date(`${b.date} ${b.time || '00:00'}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Group items by date
  const groupedItems = allItems.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof allItems>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Calendar & Tasks</h3>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">
            {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}, 
            {' '}{tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Calendar Items */}
      {Object.keys(groupedItems).length === 0 ? (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-600 mb-3" />
          <p className="text-gray-400">No upcoming appointments or tasks</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([date, items]) => (
            <div key={date} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-700" />
                <span className="text-sm font-medium text-gray-400">
                  {formatDate(date)}
                </span>
                <div className="h-px flex-1 bg-gray-700" />
              </div>

              {/* Items for this date */}
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.itemType === 'appointment' && onAppointmentClick) {
                        onAppointmentClick(item as Appointment);
                      } else if (item.itemType === 'task' && onTaskClick) {
                        onTaskClick(item as Task);
                      }
                    }}
                    className="group cursor-pointer rounded-lg border border-gray-700/50 bg-gray-800/50 p-4 transition-all hover:border-gray-600 hover:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        {/* Title and Type */}
                        <div className="flex items-center gap-3">
                          {item.itemType === 'appointment' ? (
                            <>
                              {getAppointmentIcon((item as Appointment).type, (item as Appointment).location_type)}
                              <span className="text-sm font-medium text-white">
                                {item.title}
                              </span>
                              {getStatusIcon((item as Appointment).status)}
                            </>
                          ) : (
                            <>
                              <div className={`flex items-center gap-2 rounded px-2 py-1 text-xs font-medium border ${getPriorityColor((item as Task).priority)}`}>
                                {(item as Task).priority}
                              </div>
                              <span className="text-sm font-medium text-white">
                                {item.title}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Time and Details */}
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          {item.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(item.time)}
                              {item.itemType === 'appointment' && (item as Appointment).duration_minutes && (
                                <span> ({(item as Appointment).duration_minutes} min)</span>
                              )}
                            </div>
                          )}
                          
                          {item.itemType === 'appointment' && (item as Appointment).location_type && (
                            <div className="flex items-center gap-1">
                              {(item as Appointment).location_type === 'in_person' && <MapPin className="h-3 w-3" />}
                              {(item as Appointment).location_type === 'video' && <Video className="h-3 w-3" />}
                              {(item as Appointment).location_type === 'phone' && <Phone className="h-3 w-3" />}
                              <span className="capitalize">{(item as Appointment).location_type.replace('_', ' ')}</span>
                            </div>
                          )}

                          {item.itemType === 'task' && (item as Task).category && (
                            <span className="capitalize">{(item as Task).category.replace('_', ' ')}</span>
                          )}
                        </div>

                        {/* Description or Agenda */}
                        {(item.description || (item as Appointment).agenda) && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {item.description || (item as Appointment).agenda}
                          </p>
                        )}

                        {/* Preparation Notes */}
                        {item.itemType === 'appointment' && (item as Appointment).preparation_notes && (
                          <div className="mt-2 rounded bg-blue-900/20 border border-blue-800/50 p-2">
                            <p className="text-xs text-blue-400">
                              Prep: {(item as Appointment).preparation_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Item Type Badge */}
                      <div className="ml-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          item.itemType === 'appointment' 
                            ? 'bg-blue-900/30 text-blue-400 border border-blue-800'
                            : 'bg-purple-900/30 text-purple-400 border border-purple-800'
                        }`}>
                          {item.itemType === 'appointment' ? 'Appointment' : 'Task'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {appointments.filter(a => new Date(a.date) >= new Date().setHours(0,0,0,0) && new Date(a.date) < new Date().setHours(24,0,0,0)).length}
          </div>
          <div className="text-xs text-gray-400">Today</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {appointments.filter(a => {
              const aptDate = new Date(a.date);
              const today = new Date();
              const nextWeek = new Date(today);
              nextWeek.setDate(nextWeek.getDate() + 7);
              return aptDate >= today && aptDate <= nextWeek;
            }).length}
          </div>
          <div className="text-xs text-gray-400">This Week</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length}
          </div>
          <div className="text-xs text-gray-400">High Priority</div>
        </div>
      </div>
    </div>
  );
};