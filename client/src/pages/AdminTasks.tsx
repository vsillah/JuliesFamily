import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ListTodo, Filter, Plus, CheckCircle2, Clock, User as UserIcon, Calendar, X
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UniversalSearch } from "@/components/UniversalSearch";

export default function AdminTasks() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Filters (use special "__all__" value instead of empty string for Select compatibility)
  const [filterLead, setFilterLead] = useState("__all__");
  const [filterAssignee, setFilterAssignee] = useState("__all__");
  const [filterStatus, setFilterStatus] = useState("__all__");
  
  // Task creation form
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("");
  const [taskLeadId, setTaskLeadId] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDescription, setTaskDescription] = useState("");

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate("/");
    return null;
  }

  // Fetch all leads for filtering/assignment
  const { data: leads = [], isError: leadsError } = useQuery<any[]>({
    queryKey: ["/api/admin/leads"],
    retry: false,
  });

  // Fetch all users for filtering/assignment
  const { data: users = [], isError: usersError } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  // Build query string for task filters
  const buildTaskQueryUrl = () => {
    const params = new URLSearchParams();
    if (filterLead && filterLead !== "__all__") {
      params.append("leadId", filterLead);
    }
    if (filterAssignee && filterAssignee !== "__all__") {
      params.append("assignedTo", filterAssignee);
    }
    // Only send status to API if it's not "overdue" (overdue is computed client-side)
    if (filterStatus && filterStatus !== "__all__" && filterStatus !== "overdue") {
      params.append("status", filterStatus);
    }
    const queryString = params.toString();
    return queryString ? `/api/tasks?${queryString}` : "/api/tasks";
  };

  const { data: rawTasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: [buildTaskQueryUrl()],
    retry: false,
  });

  // Apply client-side filtering for "overdue" status
  const tasks = filterStatus === "overdue" 
    ? rawTasks.filter((task: any) => {
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
        return isOverdue;
      })
    : rawTasks;

  // Task creation mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      return await apiRequest("POST", "/api/tasks", taskData);
    },
    onSuccess: () => {
      // Invalidate all task queries (predicate matches any query key starting with /api/tasks)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/tasks');
        }
      });
      toast({
        title: "Task Created",
        description: "The task has been created successfully.",
      });
      setShowAddTask(false);
      setTaskTitle("");
      setTaskType("");
      setTaskLeadId("");
      setTaskAssignee("");
      setTaskDueDate("");
      setTaskPriority("medium");
      setTaskDescription("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Task update mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      return await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      // Invalidate all task queries (predicate matches any query key starting with /api/tasks)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/tasks');
        }
      });
      toast({
        title: "Task Updated",
        description: "The task has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = () => {
    if (leadsError || usersError) {
      toast({
        title: "Error",
        description: "Unable to load leads or users. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (!taskTitle || !taskType || !taskLeadId || !taskAssignee) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Title, Type, Lead, Assignee).",
        variant: "destructive",
      });
      return;
    }
    
    createTaskMutation.mutate({
      leadId: taskLeadId,
      title: taskTitle,
      taskType,
      assignedTo: taskAssignee,
      dueDate: taskDueDate || null,
      priority: taskPriority,
      description: taskDescription || null,
      status: "pending",
    });
  };

  const handleToggleTaskComplete = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus },
    });
  };

  const clearFilters = () => {
    setFilterLead("__all__");
    setFilterAssignee("__all__");
    setFilterStatus("__all__");
  };

  const activeFilterCount = [
    filterLead !== "__all__" ? filterLead : null,
    filterAssignee !== "__all__" ? filterAssignee : null,
    filterStatus !== "__all__" ? filterStatus : null
  ].filter(Boolean).length;

  // Count stats
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t: any) => t.status === "pending").length;
  const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
  const overdueTasks = tasks.filter((t: any) => 
    t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  const breadcrumbItems = [
    { label: "Admin", href: "/admin" },
    { label: "Task Management", href: "/admin/tasks" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ListTodo className="w-8 h-8" />
            Task Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track all team tasks</p>
        </div>
        <Button onClick={() => setShowAddTask(!showAddTask)} data-testid="button-toggle-add-task">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Task Form */}
      {showAddTask && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
            <CardDescription>Add a new task for a lead</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title *</Label>
                <Input
                  id="task-title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g., Follow up call"
                  data-testid="input-task-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-type">Task Type *</Label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger id="task-type" data-testid="select-task-type">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-lead">Lead *</Label>
                <Select value={taskLeadId} onValueChange={setTaskLeadId}>
                  <SelectTrigger id="task-lead" data-testid="select-task-lead">
                    <SelectValue placeholder="Select lead..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead: any) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.firstName} {lead.lastName} ({lead.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assign To *</Label>
                <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                  <SelectTrigger id="task-assignee" data-testid="select-task-assignee">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  data-testid="input-task-due-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger id="task-priority" data-testid="select-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="task-description">Description (Optional)</Label>
              <Textarea
                id="task-description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Add task details..."
                className="min-h-20"
                data-testid="textarea-task-description"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleCreateTask}
                disabled={createTaskMutation.isPending}
                data-testid="button-create-task"
              >
                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddTask(false)}
                data-testid="button-cancel-task"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary">{activeFilterCount} active</Badge>
              )}
            </CardTitle>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="filter-lead">Filter by Lead</Label>
            <Select value={filterLead} onValueChange={setFilterLead}>
              <SelectTrigger id="filter-lead" data-testid="select-filter-lead">
                <SelectValue placeholder="All leads" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All leads</SelectItem>
                {leads.map((lead: any) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.firstName} {lead.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="filter-assignee">Filter by Assignee</Label>
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger id="filter-assignee" data-testid="select-filter-assignee">
                <SelectValue placeholder="All assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All assignees</SelectItem>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="filter-status">Filter by Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="filter-status" data-testid="select-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({tasks.length})</CardTitle>
          <CardDescription>
            {activeFilterCount > 0 
              ? `Showing filtered tasks (${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} applied)`
              : "Showing all tasks"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {activeFilterCount > 0 ? "No tasks match the selected filters." : "No tasks yet. Create one to get started."}
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task: any) => {
                const taskUser = users.find((u: any) => u.id === task.assignedTo);
                const taskLead = leads.find((l: any) => l.id === task.leadId);
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
                
                return (
                  <div
                    key={task.id}
                    className={`p-4 border rounded-md space-y-2 ${task.status === "completed" ? "bg-muted/30 opacity-75" : ""}`}
                    data-testid={`task-${task.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 mt-0.5"
                          onClick={() => handleToggleTaskComplete(task.id, task.status)}
                          data-testid={`button-toggle-task-${task.id}`}
                        >
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="h-5 w-5 border-2 rounded-full" />
                          )}
                        </Button>
                        <div className="flex-1 space-y-2">
                          <div className={`font-medium ${task.status === "completed" ? "line-through" : ""}`}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground">{task.description}</div>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-3 h-3" />
                              Lead: {taskLead ? `${taskLead.firstName} ${taskLead.lastName}` : "Unknown"}
                            </span>
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-3 h-3" />
                              Assignee: {taskUser ? `${taskUser.firstName} ${taskUser.lastName}` : "Unassigned"}
                            </span>
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : ""}`}>
                                <Clock className="w-3 h-3" />
                                {format(new Date(task.dueDate), "MMM d, yyyy")}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Created {format(new Date(task.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          task.priority === "high" ? "destructive" :
                          task.priority === "medium" ? "default" :
                          "secondary"
                        } className="text-xs">
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.taskType.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
