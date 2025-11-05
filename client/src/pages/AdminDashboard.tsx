import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, TrendingUp, Target, Mail, Phone, Calendar,
  BarChart3, Filter, Download, UserPlus, Image as ImageIcon, FileText,
  Shield, BookOpen
} from "lucide-react";
import type { Lead } from "@shared/schema";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Link } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";
import LeadDetailsDialog from "@/components/LeadDetailsDialog";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPersona, setSelectedPersona] = useState<string>("all");
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<string>("all");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);

  // Fetch analytics data
  const { data: analytics } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
    retry: false,
  });

  // Fetch leads
  const queryParams = new URLSearchParams();
  if (selectedPersona !== "all") queryParams.append("persona", selectedPersona);
  if (selectedFunnelStage !== "all") queryParams.append("funnelStage", selectedFunnelStage);
  const queryString = queryParams.toString();

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads", queryString],
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
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs items={[{ label: "Admin Dashboard" }]} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary">CRM Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Manage leads and track funnel performance
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/guide">
                <Button variant="outline" data-testid="button-admin-guide">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Help Guide
                </Button>
              </Link>
              <Link href="/admin/content">
                <Button variant="outline" data-testid="button-manage-content">
                  <FileText className="w-4 h-4 mr-2" />
                  Manage Content
                </Button>
              </Link>
              <Link href="/admin/images">
                <Button variant="outline" data-testid="button-manage-images">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Manage Images
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline" data-testid="button-manage-users">
                  <Shield className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/ab-testing">
                <Button variant="outline" data-testid="button-ab-testing">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  A/B Testing
                </Button>
              </Link>
              <Button variant="default" data-testid="button-export-data">
                <Download className="w-4 h-4 mr-2" />
                Export Data
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Leads Management</CardTitle>
                <CardDescription>View and manage all leads</CardDescription>
              </div>
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 border rounded-md text-sm"
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
                  className="px-3 py-2 border rounded-md text-sm"
                  value={selectedFunnelStage}
                  onChange={(e) => setSelectedFunnelStage(e.target.value)}
                  data-testid="select-funnel-filter"
                >
                  <option value="all">All Stages</option>
                  {Object.entries(funnelStageLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
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
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    data-testid={`lead-card-${lead.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <Badge variant="secondary">
                          {personaLabels[lead.persona] || lead.persona}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={`${funnelStageColors[lead.funnelStage]} text-white border-0`}
                        >
                          {funnelStageLabels[lead.funnelStage] || lead.funnelStage}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {lead.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          Score: {lead.engagementScore}
                        </div>
                        {lead.lastInteractionDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Last: {format(new Date(lead.lastInteractionDate), "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
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
