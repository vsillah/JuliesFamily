import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import Breadcrumbs from "@/components/Breadcrumbs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  VolunteerEvent,
  VolunteerShift,
  VolunteerEnrollment,
  VolunteerSessionLog,
} from "@shared/schema";

interface EnrichedEnrollment extends VolunteerEnrollment {
  shift: VolunteerShift & {
    event: VolunteerEvent;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export default function AdminVolunteerManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("events");

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative bg-muted/30 border-b">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Breadcrumbs
            items={[
              { label: "Admin Dashboard", href: "/admin" },
              { label: "Volunteer Management" },
            ]}
          />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold flex items-center gap-2">
                <Heart className="w-8 h-8 text-primary" />
                Volunteer Management
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg mt-2">
                Manage volunteer events, shifts, enrollments, and track volunteer hours
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events" data-testid="tab-events">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="shifts" data-testid="tab-shifts">
              <Clock className="w-4 h-4 mr-2" />
              Shifts
            </TabsTrigger>
            <TabsTrigger value="enrollments" data-testid="tab-enrollments">
              <Users className="w-4 h-4 mr-2" />
              Enrollments
            </TabsTrigger>
            <TabsTrigger value="attendance" data-testid="tab-attendance">
              <CheckCircle className="w-4 h-4 mr-2" />
              Attendance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <EventsTab />
          </TabsContent>

          <TabsContent value="shifts">
            <ShiftsTab />
          </TabsContent>

          <TabsContent value="enrollments">
            <EnrollmentsTab />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Events Tab Component
function EventsTab() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<VolunteerEvent | null>(null);

  const { data: events = [], isLoading } = useQuery<VolunteerEvent[]>({
    queryKey: ["/api/admin/volunteer/events"],
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) =>
      apiRequest("DELETE", `/api/admin/volunteer/events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/volunteer/events"] });
      toast({
        title: "Event Deleted",
        description: "The volunteer event has been deleted.",
      });
    },
  });

  const handleDelete = (eventId: string) => {
    if (confirm("Are you sure you want to delete this event? All associated shifts and enrollments will be deleted.")) {
      deleteMutation.mutate(eventId);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle>Volunteer Events</CardTitle>
          <CardDescription>Manage volunteer opportunities and roles</CardDescription>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-event">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <EventFormDialog
            event={selectedEvent}
            onClose={() => {
              setIsCreateDialogOpen(false);
              setSelectedEvent(null);
            }}
          />
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No volunteer events found. Create one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Hours/Session</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell className="max-w-md truncate">{event.description}</TableCell>
                  <TableCell>{event.estimatedHoursPerSession || 2}h</TableCell>
                  <TableCell>
                    {event.isActive ? (
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-500/10 text-gray-700 dark:text-gray-400">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsCreateDialogOpen(true);
                        }}
                        data-testid={`button-edit-event-${event.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(event.id)}
                        data-testid={`button-delete-event-${event.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Event Form Dialog
function EventFormDialog({
  event,
  onClose,
}: {
  event: VolunteerEvent | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: event?.name || "",
    description: event?.description || "",
    roleDescription: event?.roleDescription || "",
    coordinatorName: event?.coordinatorName || "",
    coordinatorEmail: event?.coordinatorEmail || "",
    estimatedHoursPerSession: event?.estimatedHoursPerSession || 2,
    typicalWeeklyCommitment: event?.typicalWeeklyCommitment || "1-2 hours",
    isActive: event?.isActive ?? true,
  });

  // Reset form data when event prop changes
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || "",
        description: event.description || "",
        roleDescription: event.roleDescription || "",
        coordinatorName: event.coordinatorName || "",
        coordinatorEmail: event.coordinatorEmail || "",
        estimatedHoursPerSession: event.estimatedHoursPerSession || 2,
        typicalWeeklyCommitment: event.typicalWeeklyCommitment || "1-2 hours",
        isActive: event.isActive ?? true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        roleDescription: "",
        coordinatorName: "",
        coordinatorEmail: "",
        estimatedHoursPerSession: 2,
        typicalWeeklyCommitment: "1-2 hours",
        isActive: true,
      });
    }
  }, [event]);

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      event
        ? apiRequest("PATCH", `/api/admin/volunteer/events/${event.id}`, data)
        : apiRequest("POST", "/api/admin/volunteer/events", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/volunteer/events"] });
      toast({
        title: event ? "Event Updated" : "Event Created",
        description: `The volunteer event has been ${event ? "updated" : "created"}.`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save event",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{event ? "Edit Event" : "Create Volunteer Event"}</DialogTitle>
        <DialogDescription>
          {event ? "Update event details" : "Create a new volunteer opportunity"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Event Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            data-testid="input-event-name"
          />
        </div>
        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={3}
            data-testid="input-event-description"
          />
        </div>
        <div>
          <Label htmlFor="roleDescription">Role Description</Label>
          <Textarea
            id="roleDescription"
            value={formData.roleDescription}
            onChange={(e) => setFormData({ ...formData, roleDescription: e.target.value })}
            rows={2}
            data-testid="input-event-role-description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="coordinatorName">Coordinator Name</Label>
            <Input
              id="coordinatorName"
              value={formData.coordinatorName}
              onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
              data-testid="input-coordinator-name"
            />
          </div>
          <div>
            <Label htmlFor="coordinatorEmail">Coordinator Email</Label>
            <Input
              id="coordinatorEmail"
              type="email"
              value={formData.coordinatorEmail}
              onChange={(e) => setFormData({ ...formData, coordinatorEmail: e.target.value })}
              data-testid="input-coordinator-email"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hoursPerSession">Estimated Hours/Session</Label>
            <Input
              id="hoursPerSession"
              type="number"
              min="1"
              max="8"
              value={formData.estimatedHoursPerSession}
              onChange={(e) =>
                setFormData({ ...formData, estimatedHoursPerSession: parseInt(e.target.value) })
              }
              data-testid="input-hours-per-session"
            />
          </div>
          <div>
            <Label htmlFor="weeklyCommitment">Typical Weekly Commitment</Label>
            <Input
              id="weeklyCommitment"
              value={formData.typicalWeeklyCommitment}
              onChange={(e) =>
                setFormData({ ...formData, typicalWeeklyCommitment: e.target.value })
              }
              data-testid="input-weekly-commitment"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            data-testid="checkbox-event-active"
          />
          <Label htmlFor="isActive">Event is active and accepting volunteers</Label>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-event">
            {createMutation.isPending ? "Saving..." : event ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

// Shifts Tab Component
function ShiftsTab() {
  const { toast } = useToast();
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<VolunteerShift | null>(null);

  const { data: events = [] } = useQuery<VolunteerEvent[]>({
    queryKey: ["/api/admin/volunteer/events"],
  });

  const { data: shifts = [], isLoading } = useQuery<
    (VolunteerShift & { event: VolunteerEvent })[]
  >({
    queryKey: ["/api/admin/volunteer/shifts"],
  });

  const deleteMutation = useMutation({
    mutationFn: (shiftId: string) =>
      apiRequest("DELETE", `/api/admin/volunteer/shifts/${shiftId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/volunteer/shifts"] });
      toast({
        title: "Shift Deleted",
        description: "The volunteer shift has been deleted.",
      });
    },
  });

  const filteredShifts = shifts.filter(
    (shift) => eventFilter === "all" || shift.eventId === eventFilter
  );

  const handleDelete = (shiftId: string) => {
    if (confirm("Are you sure you want to delete this shift? All enrollments will be deleted.")) {
      deleteMutation.mutate(shiftId);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle>Volunteer Shifts</CardTitle>
          <CardDescription>Manage scheduled volunteer shifts</CardDescription>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-shift">
              <Plus className="w-4 h-4 mr-2" />
              Create Shift
            </Button>
          </DialogTrigger>
          <ShiftFormDialog
            shift={selectedShift}
            events={events}
            onClose={() => {
              setIsCreateDialogOpen(false);
              setSelectedShift(null);
            }}
          />
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="event-filter">Filter by Event</Label>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger id="event-filter" data-testid="select-event-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading shifts...</div>
        ) : filteredShifts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No shifts found. Create one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Volunteers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.map((shift) => (
                <TableRow key={shift.id} data-testid={`row-shift-${shift.id}`}>
                  <TableCell className="font-medium">{shift.event.name}</TableCell>
                  <TableCell>{format(new Date(shift.shiftDate), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    {shift.startTime} - {shift.endTime}
                  </TableCell>
                  <TableCell>
                    {shift.currentEnrollments}/{shift.maxVolunteers || "∞"}
                  </TableCell>
                  <TableCell>
                    {shift.status === "scheduled" && (
                      <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                        Scheduled
                      </Badge>
                    )}
                    {shift.status === "completed" && (
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                        Completed
                      </Badge>
                    )}
                    {shift.status === "cancelled" && (
                      <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
                        Cancelled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedShift(shift);
                          setIsCreateDialogOpen(true);
                        }}
                        data-testid={`button-edit-shift-${shift.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(shift.id)}
                        data-testid={`button-delete-shift-${shift.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Shift Form Dialog
function ShiftFormDialog({
  shift,
  events,
  onClose,
}: {
  shift: VolunteerShift | null;
  events: VolunteerEvent[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    eventId: shift?.eventId || "",
    shiftDate: shift?.shiftDate
      ? format(new Date(shift.shiftDate), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    startTime: shift?.startTime || "09:00",
    endTime: shift?.endTime || "11:00",
    maxVolunteers: shift?.maxVolunteers || 5,
    location: shift?.location || "",
    notes: shift?.notes || "",
    status: shift?.status || "scheduled",
  });

  // Reset form data when shift prop changes
  useEffect(() => {
    if (shift) {
      setFormData({
        eventId: shift.eventId || "",
        shiftDate: format(new Date(shift.shiftDate), "yyyy-MM-dd"),
        startTime: shift.startTime || "09:00",
        endTime: shift.endTime || "11:00",
        maxVolunteers: shift.maxVolunteers || 5,
        location: shift.location || "",
        notes: shift.notes || "",
        status: shift.status || "scheduled",
      });
    } else {
      setFormData({
        eventId: "",
        shiftDate: format(new Date(), "yyyy-MM-dd"),
        startTime: "09:00",
        endTime: "11:00",
        maxVolunteers: 5,
        location: "",
        notes: "",
        status: "scheduled",
      });
    }
  }, [shift]);

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        shiftDate: new Date(data.shiftDate),
      };
      return shift
        ? apiRequest("PATCH", `/api/admin/volunteer/shifts/${shift.id}`, payload)
        : apiRequest("POST", "/api/admin/volunteer/shifts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/volunteer/shifts"] });
      toast({
        title: shift ? "Shift Updated" : "Shift Created",
        description: `The volunteer shift has been ${shift ? "updated" : "created"}.`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save shift",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{shift ? "Edit Shift" : "Create Volunteer Shift"}</DialogTitle>
        <DialogDescription>
          {shift ? "Update shift details" : "Schedule a new volunteer shift"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="eventId">Event *</Label>
          <Select
            value={formData.eventId}
            onValueChange={(value) => setFormData({ ...formData, eventId: value })}
          >
            <SelectTrigger id="eventId" data-testid="select-shift-event">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="shiftDate">Date *</Label>
          <Input
            id="shiftDate"
            type="date"
            value={formData.shiftDate}
            onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
            required
            data-testid="input-shift-date"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime">Start Time *</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
              data-testid="input-start-time"
            />
          </div>
          <div>
            <Label htmlFor="endTime">End Time *</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
              data-testid="input-end-time"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="maxVolunteers">Max Volunteers</Label>
          <Input
            id="maxVolunteers"
            type="number"
            min="1"
            value={formData.maxVolunteers || ""}
            onChange={(e) =>
              setFormData({ ...formData, maxVolunteers: parseInt(e.target.value) || 0 })
            }
            data-testid="input-max-volunteers"
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            data-testid="input-shift-location"
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger id="status" data-testid="select-shift-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            data-testid="input-shift-notes"
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-shift">
            {createMutation.isPending ? "Saving..." : shift ? "Update Shift" : "Create Shift"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

// Enrollments Tab Component
function EnrollmentsTab() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: enrollments = [], isLoading } = useQuery<EnrichedEnrollment[]>({
    queryKey: ["/api/admin/volunteer/enrollments"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ enrollmentId, status }: { enrollmentId: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/volunteer/enrollments/${enrollmentId}`, {
        enrollmentStatus: status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/volunteer/enrollments"] });
      toast({
        title: "Status Updated",
        description: "Enrollment status has been updated.",
      });
    },
  });

  const filteredEnrollments = enrollments.filter(
    (enrollment) => statusFilter === "all" || enrollment.enrollmentStatus === statusFilter
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volunteer Enrollments</CardTitle>
        <CardDescription>Manage volunteer shift enrollments and applications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="status-filter">Filter by Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading enrollments...</div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No enrollments found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Volunteer</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Shift Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id} data-testid={`row-enrollment-${enrollment.id}`}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{enrollment.user?.name || "Unknown"}</div>
                      <div className="text-sm text-muted-foreground">{enrollment.user?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{enrollment.shift.event.name}</TableCell>
                  <TableCell>
                    {format(new Date(enrollment.shift.shiftDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {enrollment.shift.startTime} - {enrollment.shift.endTime}
                  </TableCell>
                  <TableCell>
                    {enrollment.enrollmentStatus === "registered" && (
                      <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                        Registered
                      </Badge>
                    )}
                    {enrollment.enrollmentStatus === "confirmed" && (
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                        Confirmed
                      </Badge>
                    )}
                    {enrollment.enrollmentStatus === "cancelled" && (
                      <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
                        Cancelled
                      </Badge>
                    )}
                    {enrollment.enrollmentStatus === "completed" && (
                      <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400">
                        Completed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={enrollment.enrollmentStatus}
                      onValueChange={(status) =>
                        updateStatusMutation.mutate({
                          enrollmentId: enrollment.id,
                          status,
                        })
                      }
                    >
                      <SelectTrigger
                        className="w-32"
                        data-testid={`select-enrollment-status-${enrollment.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="registered">Registered</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Attendance Tab Component
function AttendanceTab() {
  const { toast } = useToast();
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrichedEnrollment | null>(null);

  const { data: enrollments = [] } = useQuery<EnrichedEnrollment[]>({
    queryKey: ["/api/admin/volunteer/enrollments"],
  });

  const { data: sessionLogs = [], isLoading } = useQuery<
    (VolunteerSessionLog & {
      enrollment: EnrichedEnrollment;
    })[]
  >({
    queryKey: ["/api/admin/volunteer/session-logs"],
  });

  const completedEnrollments = enrollments.filter(
    (e) => new Date(e.shift.shiftDate) <= new Date()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle>Attendance Logging</CardTitle>
          <CardDescription>Track volunteer attendance and hours served</CardDescription>
        </div>
        <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-log-attendance">
              <Plus className="w-4 h-4 mr-2" />
              Log Attendance
            </Button>
          </DialogTrigger>
          <AttendanceLogDialog
            enrollments={completedEnrollments}
            onClose={() => {
              setIsLogDialogOpen(false);
              setSelectedEnrollment(null);
            }}
          />
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading attendance logs...</div>
        ) : sessionLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No attendance logs found. Log attendance for completed shifts.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Volunteer</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionLogs.map((log) => (
                <TableRow key={log.id} data-testid={`row-session-log-${log.id}`}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {log.enrollment.user?.name || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.enrollment.user?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{log.enrollment.shift.event.name}</TableCell>
                  <TableCell>{format(new Date(log.sessionDate), "MMM d, yyyy")}</TableCell>
                  <TableCell>{(log.minutesServed / 60).toFixed(1)}h</TableCell>
                  <TableCell>
                    {log.attendanceStatus === "present" && (
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                        Present
                      </Badge>
                    )}
                    {log.attendanceStatus === "absent" && (
                      <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
                        Absent
                      </Badge>
                    )}
                    {log.attendanceStatus === "excused" && (
                      <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                        Excused
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{log.notes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Attendance Log Dialog
function AttendanceLogDialog({
  enrollments,
  onClose,
}: {
  enrollments: EnrichedEnrollment[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    enrollmentId: "",
    attendanceStatus: "present",
    minutesServed: 120,
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/volunteer/session-logs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/volunteer/session-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/volunteer/enrollments"] });
      toast({
        title: "Attendance Logged",
        description: "Volunteer attendance has been recorded.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log attendance",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enrollmentId) {
      toast({
        title: "Error",
        description: "Please select an enrollment",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Log Volunteer Attendance</DialogTitle>
        <DialogDescription>Record attendance and hours for a volunteer shift</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="enrollmentId">Select Enrollment *</Label>
          <Select
            value={formData.enrollmentId}
            onValueChange={(value) => setFormData({ ...formData, enrollmentId: value })}
          >
            <SelectTrigger id="enrollmentId" data-testid="select-log-enrollment">
              <SelectValue placeholder="Select a shift enrollment" />
            </SelectTrigger>
            <SelectContent>
              {enrollments.map((enrollment) => (
                <SelectItem key={enrollment.id} value={enrollment.id}>
                  {enrollment.user?.name} - {enrollment.shift.event.name} (
                  {format(new Date(enrollment.shift.shiftDate), "MMM d")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="attendanceStatus">Attendance Status *</Label>
          <Select
            value={formData.attendanceStatus}
            onValueChange={(value) => setFormData({ ...formData, attendanceStatus: value })}
          >
            <SelectTrigger id="attendanceStatus" data-testid="select-attendance-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="excused">Excused Absence</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="minutesServed">Minutes Served</Label>
          <Input
            id="minutesServed"
            type="number"
            min="0"
            step="15"
            value={formData.minutesServed}
            onChange={(e) =>
              setFormData({ ...formData, minutesServed: parseInt(e.target.value) || 0 })
            }
            data-testid="input-minutes-served"
          />
          <p className="text-sm text-muted-foreground mt-1">
            {(formData.minutesServed / 60).toFixed(1)} hours
          </p>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            data-testid="input-log-notes"
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            data-testid="button-save-attendance"
          >
            {createMutation.isPending ? "Saving..." : "Log Attendance"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
