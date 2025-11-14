import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, TrendingUp, Target, Mail, Phone, Calendar,
  BarChart3, Filter, Download, UserPlus, Image as ImageIcon, FileText,
  Shield, BookOpen, MessageSquare, Kanban, Settings, ChevronDown, Database, GraduationCap, Clock, UserCog
} from "lucide-react";
import type { Lead } from "@shared/schema";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Link } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";
import LeadDetailsDialog from "@/components/LeadDetailsDialog";
import { UniversalSearch } from "@/components/UniversalSearch";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPersona, setSelectedPersona] = useState<string>("all");
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<string>("all");
  const [selectedEngagement, setSelectedEngagement] = useState<string>("all");
  const [selectedLeadStatus, setSelectedLeadStatus] = useState<string>("all");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);

  // Fetch analytics data
  const { data: analytics } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
    retry: false,
  });

  // Fetch leads with combined filters
  const queryParams = new URLSearchParams();
  if (selectedPersona !== "all") queryParams.append("persona", selectedPersona);
  if (selectedFunnelStage !== "all") queryParams.append("funnelStage", selectedFunnelStage);
  if (selectedEngagement !== "all") queryParams.append("engagement", selectedEngagement);
  if (selectedLeadStatus !== "all") queryParams.append("leadStatus", selectedLeadStatus);
  const queryString = queryParams.toString();
  const leadsUrl = queryString ? `/api/admin/leads?${queryString}` : "/api/admin/leads";

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: [leadsUrl],
    retry: false,
  });


  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate("/");
    return null;
  }

  // Show loading state
  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const personaLabels: Record<string, string> = {
    student: "Adult Education Student",
    provider: "Service Provider",
    parent: "Parent",
    donor: "Donor",
    volunteer: "Volunteer",
  };

  const funnelStageLabels: Record<string, string> = {
    awareness: "Awareness (TOFU)",
    consideration: "Consideration (MOFU)",
    decision: "Decision (BOFU)",
    retention: "Retention",
  };

  const funnelStageColors: Record<string, string> = {
    awareness: "bg-blue-500",
    consideration: "bg-yellow-500",
    decision: "bg-green-500",
    retention: "bg-purple-500",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header Section */}
      <div className="relative bg-muted/30 border-b">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Breadcrumbs items={[{ label: "Admin Dashboard" }]} />
          <div className="flex flex-col gap-6 mt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-serif font-bold">CRM Dashboard</h1>
                <p className="text-muted-foreground text-base sm:text-lg mt-2">
                  Manage leads and track funnel performance
                </p>
              </div>
              <UniversalSearch />
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Primary CRM Actions */}
              <Link href="/admin/pipeline">
                <Button variant="default" size="sm" data-testid="button-pipeline-board">
                  <Kanban className="w-4 h-4 mr-2" />
                  Pipeline
                </Button>
              </Link>
              <Link href="/admin/tasks">
                <Button variant="default" size="sm" data-testid="button-tasks">
                  <Target className="w-4 h-4 mr-2" />
                  Tasks
                </Button>
              </Link>

              {/* Analytics Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" data-testid="button-analytics-menu">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/cac-ltgp" className="flex items-center cursor-pointer">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      CAC:LTGP Analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/donor-lifecycle" className="flex items-center cursor-pointer">
                      <Users className="w-4 h-4 mr-2" />
                      Donor Lifecycle
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/funnel-analytics" className="flex items-center cursor-pointer" data-testid="link-funnel-analytics">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Funnel Analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/ab-testing" className="flex items-center cursor-pointer">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      A/B Testing
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Communication Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-communication-menu">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Communication
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/email-campaigns" className="flex items-center cursor-pointer">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Campaigns
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/email-reports" className="flex items-center cursor-pointer" data-testid="link-email-reports">
                      <Clock className="w-4 h-4 mr-2" />
                      Email Reports
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/sms-notifications" className="flex items-center cursor-pointer">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      SMS Notifications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Content & Settings Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-settings-menu">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/content" className="flex items-center cursor-pointer">
                      <FileText className="w-4 h-4 mr-2" />
                      Manage Content
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/images" className="flex items-center cursor-pointer">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Manage Images
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/users" className="flex items-center cursor-pointer">
                      <Shield className="w-4 h-4 mr-2" />
                      Manage Users
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/role-provisioning" className="flex items-center cursor-pointer" data-testid="link-role-provisioning">
                      <UserCog className="w-4 h-4 mr-2" />
                      Role Provisioning
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/student-enrollments" className="flex items-center cursor-pointer" data-testid="link-student-enrollments">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Student Enrollments
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/backups" className="flex items-center cursor-pointer">
                      <Database className="w-4 h-4 mr-2" />
                      Database Backups
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/guide" className="flex items-center cursor-pointer">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Help Guide
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Quick Actions */}
              <Button variant="outline" size="sm" data-testid="button-export-data">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalLeads}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.converted}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalLeads > 0 
                  ? `${Math.round((analytics.converted / analytics.totalLeads) * 100)}% conversion rate`
                  : "No leads yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(analytics.avgEngagementScore)}</div>
              <p className="text-xs text-muted-foreground">Engagement score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Decision Stage</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.byFunnelStage.decision}</div>
              <p className="text-xs text-muted-foreground">Ready to convert</p>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Visualization */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Funnel by Stage</CardTitle>
            <CardDescription>Lead distribution across funnel stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(funnelStageLabels).map(([stage, label]) => {
                const count = analytics.byFunnelStage[stage];
                const percentage = analytics.totalLeads > 0 
                  ? (count / analytics.totalLeads) * 100 
                  : 0;
                
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-sm text-muted-foreground">{count} leads ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${funnelStageColors[stage]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Leads Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle>Leads Management</CardTitle>
                <CardDescription>View and manage all leads</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  className="px-3 py-2 border rounded-md text-sm flex-1"
                  value={selectedPersona}
                  onChange={(e) => setSelectedPersona(e.target.value)}
                  data-testid="select-persona-filter"
                >
                  <option value="all">All Personas</option>
                  {Object.entries(personaLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <select
                  className="px-3 py-2 border rounded-md text-sm flex-1"
                  value={selectedFunnelStage}
                  onChange={(e) => setSelectedFunnelStage(e.target.value)}
                  data-testid="select-funnel-filter"
                >
                  <option value="all">All Stages</option>
                  {Object.entries(funnelStageLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <select
                  className="px-3 py-2 border rounded-md text-sm flex-1"
                  value={selectedEngagement}
                  onChange={(e) => setSelectedEngagement(e.target.value)}
                  data-testid="select-engagement-filter"
                >
                  <option value="all">All Engagement</option>
                  <option value="high_engagers">High Engagers (5+ opens or 2+ clicks)</option>
                  <option value="active">Active (opened in last 30 days)</option>
                  <option value="clickers">Clickers (at least 1 click)</option>
                  <option value="non_openers">Non-Openers (never opened)</option>
                  <option value="inactive">Inactive (no activity in 60 days)</option>
                </select>
                <select
                  className="px-3 py-2 border rounded-md text-sm flex-1"
                  value={selectedLeadStatus}
                  onChange={(e) => setSelectedLeadStatus(e.target.value)}
                  data-testid="select-lead-status-filter"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="nurture">Nurture</option>
                  <option value="disqualified">Disqualified</option>
                  <option value="unresponsive">Unresponsive</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No leads found matching the selected filters</p>
                </div>
              ) : (
                leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover-elevate"
                    data-testid={`lead-card-${lead.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {personaLabels[lead.persona] || lead.persona}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={`${funnelStageColors[lead.funnelStage]} text-white border-0 text-xs`}
                        >
                          {funnelStageLabels[lead.funnelStage] || lead.funnelStage}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={`text-xs ${
                            (lead.leadStatus === 'active' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200') ||
                            (lead.leadStatus === 'nurture' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200') ||
                            (lead.leadStatus === 'disqualified' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200') ||
                            (lead.leadStatus === 'unresponsive' && 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200') ||
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}
                          data-testid={`badge-lead-status-${lead.id}`}
                        >
                          {(lead.leadStatus === 'active' && 'Active') ||
                           (lead.leadStatus === 'nurture' && 'Nurture') ||
                           (lead.leadStatus === 'disqualified' && 'Disqualified') ||
                           (lead.leadStatus === 'unresponsive' && 'Unresponsive') ||
                           'Active'}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 min-w-0">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 flex-shrink-0" />
                          <span>Score: {lead.engagementScore}</span>
                        </div>
                        {lead.lastInteractionDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">Last: </span>
                            <span>{format(new Date(lead.lastInteractionDate), "MMM d, yyyy")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full sm:w-auto flex-shrink-0"
                      onClick={() => {
                        setSelectedLeadId(lead.id);
                        setIsLeadDialogOpen(true);
                      }}
                      data-testid={`button-view-lead-${lead.id}`}
                    >
                      View Details
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <LeadDetailsDialog
        leadId={selectedLeadId}
        open={isLeadDialogOpen}
        onOpenChange={setIsLeadDialogOpen}
      />
    </div>
  );
}
