import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Calendar, Clock, MapPin, User, Phone, Mail, 
  Plus, CheckCircle, XCircle, AlertCircle, 
  ChevronRight, Filter, Search
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import { useApiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';

interface Appointment {
  id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  lead_name?: string;
  lead_email?: string;
  lead_phone?: string;
  lead_company?: string;
  assigned_to_name?: string;
  ai_confidence_score?: number;
  ai_extracted_datetime?: string;
  ai_meeting_purpose?: string;
  source: string;
  campaign_name?: string;
}

interface AppointmentsSectionProps {
  leadId?: string;
  contactId?: string;
  showAll?: boolean;
}

export const AppointmentsSection: React.FC<AppointmentsSectionProps> = ({ 
  leadId, 
  contactId, 
  showAll = true 
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  const apiClient = useApiClient();
  const { toast } = useToast();

  // New appointment form state
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    description: '',
    scheduled_at: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    duration_minutes: 30,
    location: 'Phone',
    lead_name: '',
    lead_email: '',
    lead_phone: '',
    lead_company: '',
  });

  useEffect(() => {
    fetchAppointments();
  }, [leadId, contactId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let endpoint = '/appointments';
      const params = new URLSearchParams();
      
      if (leadId) params.append('lead_id', leadId);
      if (contactId) params.append('contact_id', contactId);
      if (!showAll) params.append('limit', '5');
      
      const response = await apiClient.get(`${endpoint}?${params}`);
      const data = Array.isArray(response.data) ? response.data : 
                   Array.isArray(response) ? response : [];
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appointments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    try {
      const response = await apiClient.post('/appointments', {
        ...newAppointment,
        lead_id: leadId,
        contact_id: contactId,
        source: 'manual',
      });
      
      toast({
        title: 'Success',
        description: 'Appointment created successfully',
      });
      
      setShowCreateModal(false);
      fetchAppointments();
      
      // Reset form
      setNewAppointment({
        title: '',
        description: '',
        scheduled_at: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        duration_minutes: 30,
        location: 'Phone',
        lead_name: '',
        lead_email: '',
        lead_phone: '',
        lead_company: '',
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create appointment',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/appointments/${appointmentId}`, { status: newStatus });
      toast({
        title: 'Success',
        description: `Appointment ${newStatus}`,
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update appointment',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'no_show':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getDateLabel = (date: string) => {
    const appointmentDate = new Date(date);
    if (isToday(appointmentDate)) return 'Today';
    if (isTomorrow(appointmentDate)) return 'Tomorrow';
    return format(appointmentDate, 'MMM d, yyyy');
  };

  const appointmentsArray = Array.isArray(appointments) ? appointments : [];
  const filteredAppointments = appointmentsArray.filter(appointment => {
    const matchesSearch = 
      appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.lead_company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const appointmentDate = new Date(appointment.scheduled_at);
    
    switch (filter) {
      case 'today':
        return matchesSearch && isToday(appointmentDate);
      case 'upcoming':
        return matchesSearch && !isPast(appointmentDate);
      case 'past':
        return matchesSearch && isPast(appointmentDate);
      default:
        return matchesSearch;
    }
  });

  const groupedAppointments = filteredAppointments.reduce((groups, appointment) => {
    const dateLabel = getDateLabel(appointment.scheduled_at);
    if (!groups[dateLabel]) groups[dateLabel] = [];
    groups[dateLabel].push(appointment);
    return groups;
  }, {} as Record<string, Appointment[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Appointments</h3>
          <p className="text-sm text-gray-400">
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Appointment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-800"
          />
        </div>
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-40 bg-gray-900 border-gray-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Appointments List */}
      <div className="space-y-6">
        {Object.entries(groupedAppointments).map(([dateLabel, dateAppointments]) => (
          <div key={dateLabel}>
            <h4 className="text-sm font-medium text-gray-400 mb-3">{dateLabel}</h4>
            <div className="space-y-3">
              {dateAppointments.map((appointment) => (
                <Card 
                  key={appointment.id} 
                  className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-white">{appointment.title}</h5>
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(appointment.status)}
                          >
                            {appointment.status}
                          </Badge>
                          {appointment.source === 'ai_call' && (
                            <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                              AI Detected
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(appointment.scheduled_at), 'h:mm a')}
                            <span className="text-gray-600">•</span>
                            {appointment.duration_minutes} min
                          </div>
                          {appointment.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {appointment.location}
                            </div>
                          )}
                        </div>

                        {appointment.lead_name && (
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-gray-300">
                              <User className="w-3 h-3" />
                              {appointment.lead_name}
                            </div>
                            {appointment.lead_company && (
                              <span className="text-gray-500">{appointment.lead_company}</span>
                            )}
                          </div>
                        )}

                        {appointment.ai_meeting_purpose && (
                          <p className="mt-2 text-sm text-gray-500 italic">
                            "{appointment.ai_meeting_purpose}"
                          </p>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No appointments found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm ? 'Try adjusting your search' : 'Schedule your first appointment'}
            </p>
          </div>
        )}
      </div>

      {/* Create Appointment Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>
              Create a new appointment manually
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newAppointment.title}
                onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                placeholder="e.g., Sales call with John"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date & Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={newAppointment.scheduled_at}
                  onChange={(e) => setNewAppointment({ ...newAppointment, scheduled_at: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select 
                  value={newAppointment.duration_minutes.toString()} 
                  onValueChange={(value) => setNewAppointment({ ...newAppointment, duration_minutes: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newAppointment.location}
                onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                placeholder="e.g., Phone, Zoom, Office"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_name">Lead Name</Label>
              <Input
                id="lead_name"
                value={newAppointment.lead_name}
                onChange={(e) => setNewAppointment({ ...newAppointment, lead_name: e.target.value })}
                placeholder="Contact name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lead_email">Email</Label>
                <Input
                  id="lead_email"
                  type="email"
                  value={newAppointment.lead_email}
                  onChange={(e) => setNewAppointment({ ...newAppointment, lead_email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lead_phone">Phone</Label>
                <Input
                  id="lead_phone"
                  value={newAppointment.lead_phone}
                  onChange={(e) => setNewAppointment({ ...newAppointment, lead_phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notes</Label>
              <Textarea
                id="description"
                value={newAppointment.description}
                onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                placeholder="Additional notes about the appointment..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAppointment}
              disabled={!newAppointment.title || !newAppointment.scheduled_at}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Modal */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedAppointment?.title}</DialogTitle>
            <DialogDescription>
              Appointment details and actions
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Status</span>
                  <Badge 
                    variant="secondary" 
                    className={getStatusColor(selectedAppointment.status)}
                  >
                    {selectedAppointment.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Date & Time</span>
                  <span className="text-sm text-white">
                    {format(new Date(selectedAppointment.scheduled_at), 'PPp')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Duration</span>
                  <span className="text-sm text-white">
                    {selectedAppointment.duration_minutes} minutes
                  </span>
                </div>

                {selectedAppointment.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Location</span>
                    <span className="text-sm text-white">{selectedAppointment.location}</span>
                  </div>
                )}

                {selectedAppointment.lead_name && (
                  <div className="border-t border-gray-800 pt-3">
                    <h4 className="text-sm font-medium text-white mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{selectedAppointment.lead_name}</span>
                      </div>
                      {selectedAppointment.lead_email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{selectedAppointment.lead_email}</span>
                        </div>
                      )}
                      {selectedAppointment.lead_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{selectedAppointment.lead_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedAppointment.source === 'ai_call' && (
                  <div className="border-t border-gray-800 pt-3">
                    <h4 className="text-sm font-medium text-white mb-2">AI Detection</h4>
                    {selectedAppointment.ai_confidence_score && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Confidence</span>
                        <span className="text-sm text-white">
                          {(selectedAppointment.ai_confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                    {selectedAppointment.ai_extracted_datetime && (
                      <div className="text-sm text-gray-400 italic">
                        "They mentioned: {selectedAppointment.ai_extracted_datetime}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-800">
                {selectedAppointment.status === 'scheduled' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'confirmed')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'cancelled')}
                      className="flex-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
                {selectedAppointment.status === 'confirmed' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'completed')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'no_show')}
                      className="flex-1 border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      No Show
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};