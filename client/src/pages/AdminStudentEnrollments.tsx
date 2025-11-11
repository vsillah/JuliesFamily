import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  Laptop,
  Wifi,
} from "lucide-react";
import { format } from "date-fns";
import Breadcrumbs from "@/components/Breadcrumbs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TechGoesHomeEnrollment, TechGoesHomeAttendance } from "@shared/schema";

interface EnrichedEnrollment extends TechGoesHomeEnrollment {
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  classesCompleted: number;
  percentComplete: number;
}

interface EnrollmentWithDetails extends EnrichedEnrollment {
  attendance: TechGoesHomeAttendance[];
  progress: any;
}

export default function AdminStudentEnrollments() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrichedEnrollment | null>(null);
  const [isAttendanceSheetOpen, setIsAttendanceSheetOpen] = useState(false);
  const [enrollmentDetails, setEnrollmentDetails] = useState<EnrollmentWithDetails | null>(null);

  // Fetch all enrollments
  const { data: enrollments = [], isLoading } = useQuery<EnrichedEnrollment[]>({
    queryKey: ["/api/admin/tgh/enrollments"],
    enabled: !!user?.isAdmin, // Only fetch if user is admin
  });

  // Redirect if not admin (after all hooks are called to avoid React hooks violation)
  if (user && !user.isAdmin) {
    navigate("/");
    return null;
  }

  // Filter enrollments
  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesSearch = !searchTerm || 
      enrollment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.programName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || enrollment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Delete enrollment mutation
  const deleteMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      apiRequest("DELETE", `/api/admin/tgh/enrollments/${enrollmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tgh/enrollments"] });
      toast({
        title: "Enrollment Withdrawn",
        description: "The enrollment has been marked as withdrawn.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to withdraw enrollment",
        variant: "destructive",
      });
    },
  });

  // Fetch enrollment details
  const fetchEnrollmentDetails = async (enrollmentId: string) => {
    const response = await fetch(`/api/admin/tgh/enrollments/${enrollmentId}`);
    if (!response.ok) throw new Error("Failed to fetch enrollment details");
    return response.json();
  };

  const handleViewAttendance = async (enrollment: EnrichedEnrollment) => {
    setSelectedEnrollment(enrollment);
    const details = await fetchEnrollmentDetails(enrollment.id);
    setEnrollmentDetails(details);
    setIsAttendanceSheetOpen(true);
  };

  const handleDeleteEnrollment = (enrollmentId: string) => {
    if (confirm("Are you sure you want to withdraw this enrollment? This action cannot be undone.")) {
      deleteMutation.mutate(enrollmentId);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      active: { className: "bg-green-500/10 text-green-700 dark:text-green-400", label: "Active" },
      completed: { className: "bg-blue-500/10 text-blue-700 dark:text-blue-400", label: "Completed" },
      withdrawn: { className: "bg-gray-500/10 text-gray-700 dark:text-gray-400", label: "Withdrawn" },
    };
    const variant = variants[status] || variants.active;
    return <Badge className={variant.className} data-testid={`badge-status-${status}`}>{variant.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative bg-muted/30 border-b">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Breadcrumbs
            items={[
              { label: "Admin Dashboard", href: "/admin" },
              { label: "Student Enrollments" },
            ]}
          />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold flex items-center gap-2">
                <GraduationCap className="w-8 h-8 text-primary" />
                Student Enrollments
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg mt-2">
                Manage Tech Goes Home program enrollments and track student progress
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-enrollment">
                  <Plus className="w-4 h-4 mr-2" />
                  New Enrollment
                </Button>
              </DialogTrigger>
              <EnrollmentFormDialog
                onClose={() => {
                  setIsCreateDialogOpen(false);
                  setSelectedEnrollment(null);
                }}
                enrollment={null}
              />
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by student name, email, or program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-enrollments"
              />
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enrollments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollments ({filteredEnrollments.length})</CardTitle>
            <CardDescription>
              View and manage all student enrollments in the Tech Goes Home program
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading enrollments...</div>
            ) : filteredEnrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No enrollments found. Create one to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Enrollment Date</TableHead>
                      <TableHead>Rewards</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id} data-testid={`row-enrollment-${enrollment.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium" data-testid="text-student-name">
                              {enrollment.user?.name || "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {enrollment.user?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{enrollment.programName}</TableCell>
                        <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="text-sm font-medium" data-testid="text-progress-percentage">
                              {enrollment.percentComplete}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {enrollment.classesCompleted}/{enrollment.totalClassesRequired} classes
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {enrollment.enrollmentDate
                            ? format(new Date(enrollment.enrollmentDate), "MMM d, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {enrollment.chromebookReceived && (
                              <Laptop className="w-4 h-4 text-green-600" title="Chromebook received" />
                            )}
                            {enrollment.internetActivated && (
                              <Wifi className="w-4 h-4 text-blue-600" title="Internet activated" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewAttendance(enrollment)}
                              data-testid={`button-view-attendance-${enrollment.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEnrollment(enrollment);
                                setIsCreateDialogOpen(true);
                              }}
                              data-testid={`button-edit-enrollment-${enrollment.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEnrollment(enrollment.id)}
                              data-testid={`button-delete-enrollment-${enrollment.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Sheet */}
      {enrollmentDetails && (
        <AttendanceSheet
          enrollmentDetails={enrollmentDetails}
          isOpen={isAttendanceSheetOpen}
          onClose={() => {
            setIsAttendanceSheetOpen(false);
            setEnrollmentDetails(null);
          }}
        />
      )}
    </div>
  );
}

// Enrollment Form Dialog Component
function EnrollmentFormDialog({
  enrollment,
  onClose,
}: {
  enrollment: EnrichedEnrollment | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    userId: enrollment?.userId || "",
    programName: enrollment?.programName || "Tech Goes Home",
    enrollmentDate: enrollment?.enrollmentDate
      ? format(new Date(enrollment.enrollmentDate), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    programStartDate: enrollment?.programStartDate
      ? format(new Date(enrollment.programStartDate), "yyyy-MM-dd")
      : "",
    programEndDate: enrollment?.programEndDate
      ? format(new Date(enrollment.programEndDate), "yyyy-MM-dd")
      : "",
    status: enrollment?.status || "active",
    totalClassesRequired: enrollment?.totalClassesRequired || 15,
    chromebookReceived: enrollment?.chromebookReceived || false,
    internetActivated: enrollment?.internetActivated || false,
    notes: enrollment?.notes || "",
  });

  // Fetch all users for student selection
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      enrollment
        ? apiRequest("PATCH", `/api/admin/tgh/enrollments/${enrollment.id}`, data)
        : apiRequest("POST", "/api/admin/tgh/enrollments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tgh/enrollments"] });
      toast({
        title: enrollment ? "Enrollment Updated" : "Enrollment Created",
        description: `Successfully ${enrollment ? "updated" : "created"} the enrollment.`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${enrollment ? "update" : "create"} enrollment`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: any = {
      userId: formData.userId,
      programName: formData.programName,
      enrollmentDate: new Date(formData.enrollmentDate),
      status: formData.status,
      totalClassesRequired: parseInt(formData.totalClassesRequired.toString()),
      chromebookReceived: formData.chromebookReceived,
      internetActivated: formData.internetActivated,
      notes: formData.notes || null,
    };
    
    if (formData.programStartDate) {
      submitData.programStartDate = new Date(formData.programStartDate);
    }
    if (formData.programEndDate) {
      submitData.programEndDate = new Date(formData.programEndDate);
    }
    
    saveMutation.mutate(submitData);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle data-testid="dialog-title-enrollment-form">
          {enrollment ? "Edit Enrollment" : "Create New Enrollment"}
        </DialogTitle>
        <DialogDescription>
          {enrollment
            ? "Update enrollment details and track student progress."
            : "Enroll a new student in the Tech Goes Home program."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="student">Student *</Label>
          <Select
            value={formData.userId}
            onValueChange={(value) => setFormData({ ...formData, userId: value })}
            disabled={!!enrollment}
          >
            <SelectTrigger id="student" data-testid="select-student">
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="programName">Program Name *</Label>
            <Input
              id="programName"
              value={formData.programName}
              onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
              required
              data-testid="input-program-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalClasses">Total Classes Required *</Label>
            <Input
              id="totalClasses"
              type="number"
              min="1"
              value={formData.totalClassesRequired}
              onChange={(e) =>
                setFormData({ ...formData, totalClassesRequired: parseInt(e.target.value) })
              }
              required
              data-testid="input-total-classes"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="enrollmentDate">Enrollment Date *</Label>
            <Input
              id="enrollmentDate"
              type="date"
              value={formData.enrollmentDate}
              onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
              required
              data-testid="input-enrollment-date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status" data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="programStartDate">Program Start Date</Label>
            <Input
              id="programStartDate"
              type="date"
              value={formData.programStartDate}
              onChange={(e) => setFormData({ ...formData, programStartDate: e.target.value })}
              data-testid="input-program-start-date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="programEndDate">Program End Date</Label>
            <Input
              id="programEndDate"
              type="date"
              value={formData.programEndDate}
              onChange={(e) => setFormData({ ...formData, programEndDate: e.target.value })}
              data-testid="input-program-end-date"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Rewards</Label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="chromebook"
                checked={formData.chromebookReceived}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, chromebookReceived: checked as boolean })
                }
                data-testid="checkbox-chromebook"
              />
              <Label htmlFor="chromebook" className="cursor-pointer">
                Chromebook Received
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="internet"
                checked={formData.internetActivated}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, internetActivated: checked as boolean })
                }
                data-testid="checkbox-internet"
              />
              <Label htmlFor="internet" className="cursor-pointer">
                Internet Activated
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Additional notes about this enrollment..."
            data-testid="textarea-notes"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-enrollment">
            {saveMutation.isPending ? "Saving..." : enrollment ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

// Attendance Sheet Component
function AttendanceSheet({
  enrollmentDetails,
  isOpen,
  onClose,
}: {
  enrollmentDetails: EnrollmentWithDetails;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [newAttendance, setNewAttendance] = useState({
    classDate: format(new Date(), "yyyy-MM-dd"),
    classNumber: enrollmentDetails.attendance.length + 1,
    attended: true,
    isMakeup: false,
    hoursCredits: 2,
    notes: "",
  });

  // Delete attendance mutation
  const deleteAttendanceMutation = useMutation({
    mutationFn: (attendanceId: string) =>
      apiRequest("DELETE", `/api/admin/tgh/attendance/${attendanceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tgh/enrollments"] });
      toast({
        title: "Attendance Deleted",
        description: "The attendance record has been removed.",
      });
    },
  });

  // Create attendance mutation
  const createAttendanceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/tgh/attendance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tgh/enrollments"] });
      setIsAddingAttendance(false);
      setNewAttendance({
        classDate: format(new Date(), "yyyy-MM-dd"),
        classNumber: enrollmentDetails.attendance.length + 2,
        attended: true,
        isMakeup: false,
        hoursCredits: 2,
        notes: "",
      });
      toast({
        title: "Attendance Added",
        description: "The attendance record has been created.",
      });
    },
  });

  const handleAddAttendance = () => {
    createAttendanceMutation.mutate({
      enrollmentId: enrollmentDetails.id,
      classDate: new Date(newAttendance.classDate),
      classNumber: newAttendance.classNumber,
      attended: newAttendance.attended,
      isMakeup: newAttendance.isMakeup,
      hoursCredits: newAttendance.hoursCredits,
      notes: newAttendance.notes || null,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle data-testid="sheet-title-attendance">
            Attendance - {enrollmentDetails.user?.name}
          </SheetTitle>
          <SheetDescription>
            Manage attendance records for this enrollment. Track classes attended and progress.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progress Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Classes Completed:</span>
                <span className="font-semibold" data-testid="text-classes-completed">
                  {enrollmentDetails.progress?.classesCompleted || 0} /{" "}
                  {enrollmentDetails.totalClassesRequired}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Hours Earned:</span>
                <span className="font-semibold">{enrollmentDetails.progress?.hoursCompleted || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Completion:</span>
                <span className="font-semibold">{enrollmentDetails.progress?.percentComplete || 0}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Records */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Attendance Records</h3>
              <Button
                size="sm"
                onClick={() => setIsAddingAttendance(!isAddingAttendance)}
                data-testid="button-add-attendance"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </div>

            {/* Add Attendance Form */}
            {isAddingAttendance && (
              <Card className="mb-4">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="classDate">Class Date *</Label>
                      <Input
                        id="classDate"
                        type="date"
                        value={newAttendance.classDate}
                        onChange={(e) =>
                          setNewAttendance({ ...newAttendance, classDate: e.target.value })
                        }
                        data-testid="input-class-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="classNumber">Class Number *</Label>
                      <Input
                        id="classNumber"
                        type="number"
                        min="1"
                        value={newAttendance.classNumber}
                        onChange={(e) =>
                          setNewAttendance({ ...newAttendance, classNumber: parseInt(e.target.value) })
                        }
                        data-testid="input-class-number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="attended"
                        checked={newAttendance.attended}
                        onCheckedChange={(checked) =>
                          setNewAttendance({ ...newAttendance, attended: checked as boolean })
                        }
                        data-testid="checkbox-attended"
                      />
                      <Label htmlFor="attended" className="cursor-pointer">
                        Attended
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isMakeup"
                        checked={newAttendance.isMakeup}
                        onCheckedChange={(checked) =>
                          setNewAttendance({ ...newAttendance, isMakeup: checked as boolean })
                        }
                        data-testid="checkbox-makeup"
                      />
                      <Label htmlFor="isMakeup" className="cursor-pointer">
                        Makeup Class
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hoursCredits">Hours/Credits *</Label>
                    <Input
                      id="hoursCredits"
                      type="number"
                      min="0"
                      step="0.5"
                      value={newAttendance.hoursCredits}
                      onChange={(e) =>
                        setNewAttendance({ ...newAttendance, hoursCredits: parseFloat(e.target.value) })
                      }
                      data-testid="input-hours"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendanceNotes">Notes</Label>
                    <Textarea
                      id="attendanceNotes"
                      value={newAttendance.notes}
                      onChange={(e) => setNewAttendance({ ...newAttendance, notes: e.target.value })}
                      rows={2}
                      data-testid="textarea-attendance-notes"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingAttendance(false)}
                      data-testid="button-cancel-attendance"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddAttendance}
                      disabled={createAttendanceMutation.isPending}
                      data-testid="button-save-attendance"
                    >
                      {createAttendanceMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attendance List */}
            {enrollmentDetails.attendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records yet. Add the first class above.
              </div>
            ) : (
              <div className="space-y-2">
                {enrollmentDetails.attendance
                  .sort((a, b) => new Date(b.classDate).getTime() - new Date(a.classDate).getTime())
                  .map((record) => (
                    <Card key={record.id} data-testid={`attendance-record-${record.id}`}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Class {record.classNumber}</span>
                              {record.attended ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              {record.isMakeup && (
                                <Badge variant="outline" className="text-xs">
                                  Makeup
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(record.classDate), "MMM d, yyyy")}
                            </div>
                            <div className="text-sm">
                              {record.hoursCredits} hour{record.hoursCredits !== 1 ? "s" : ""}
                            </div>
                            {record.notes && (
                              <div className="text-sm text-muted-foreground mt-2">{record.notes}</div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (
                                confirm("Are you sure you want to delete this attendance record?")
                              ) {
                                deleteAttendanceMutation.mutate(record.id);
                              }
                            }}
                            data-testid={`button-delete-attendance-${record.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
