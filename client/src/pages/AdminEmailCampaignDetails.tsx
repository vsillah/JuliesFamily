import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Users, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, ArrowLeft, BarChart3, MousePointerClick, Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Link } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";
import CampaignTimeSeriesChart from "@/components/CampaignTimeSeriesChart";
import BestSendTimeInsights from "@/components/BestSendTimeInsights";
import type { EmailCampaign } from "@shared/schema";

interface EnrollmentDetail {
  enrollment: {
    id: string;
    leadId: string;
    campaignId: string;
    status: string;
    currentStepNumber: number | null;
    enrolledAt: Date;
    lastEmailSentAt: Date | null;
  };
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface EmailLogDetail {
  id: string;
  subject: string;
  status: string;
  sentAt: Date | null;
  errorMessage: string | null;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface CampaignAnalytics {
  totalSent: number;
  totalOpens: number;
  uniqueOpens: number;
  totalClicks: number;
  uniqueClicks: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  uniqueEngagementRate: number;
}

export default function AdminEmailCampaignDetails() {
  const [, params] = useRoute("/admin/email-campaigns/:id");
  const campaignId = params?.id;
  const { toast } = useToast();
  const [enrollmentPage, setEnrollmentPage] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const enrollmentPageSize = 50;
  const logPageSize = 100;

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery<EmailCampaign>({
    queryKey: ['/api/email-campaigns', campaignId],
    enabled: !!campaignId,
  });

  // Fetch enrollment details with pagination
  const { data: enrollmentData, isLoading: enrollmentsLoading, refetch: refetchEnrollments } = useQuery<{
    data: EnrollmentDetail[];
    stats: {
      total: number;
      active: number;
      completed: number;
      paused: number;
    };
    limit: number;
    offset: number;
  }>({
    queryKey: ['/api/email-enrollments/campaign', campaignId, 'details', { limit: enrollmentPageSize, offset: enrollmentPage * enrollmentPageSize }],
    enabled: !!campaignId,
  });

  // Fetch email logs with independent pagination
  const { data: logData, isLoading: logsLoading } = useQuery<{
    data: EmailLogDetail[];
    total: number;
    limit: number;
    offset: number;
  }>({
    queryKey: ['/api/email-logs/campaign', campaignId, { limit: logPageSize, offset: logPage * logPageSize }],
    enabled: !!campaignId,
  });

  // Fetch campaign analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<CampaignAnalytics>({
    queryKey: ['/api/email-campaigns', campaignId, 'analytics'],
    enabled: !!campaignId,
  });

  // Fetch campaign link performance
  const { data: linkPerformance, isLoading: linkPerformanceLoading } = useQuery<Array<{
    url: string;
    totalClicks: number;
    uniqueClicks: number;
    ctr: number;
  }>>({
    queryKey: ['/api/email-campaigns', campaignId, 'link-performance'],
    enabled: !!campaignId,
  });

  // Backfill mutation (for Graduation Path only)
  const backfillMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/email-enrollments/backfill-graduation-path');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-enrollments/campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['/api/email-logs/campaign', campaignId] });
      refetchEnrollments();
      toast({
        title: "Backfill Complete",
        description: `Successfully enrolled ${data.enrolledCount} leads in graduation path`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Backfill Failed",
        description: error.message || "Failed to complete backfill",
      });
    },
  });

  if (!campaignId) {
    return <div className="p-6">Invalid campaign ID</div>;
  }

  if (campaignLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return <div className="p-6">Campaign not found</div>;
  }

  const enrollments = enrollmentData?.data || [];
  const stats = enrollmentData?.stats || { total: 0, active: 0, completed: 0, paused: 0 };
  const enrollmentTotalPages = Math.ceil(stats.total / enrollmentPageSize);

  const emailLogs = logData?.data || [];
  const logTotal = logData?.total || 0;
  const logTotalPages = Math.ceil(logTotal / logPageSize);

  // Check if this is the Graduation Path campaign
  const isGraduationPath = campaign.name.toLowerCase().includes('graduation');

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Breadcrumbs items={[
        { label: "Admin Dashboard", href: "/admin" },
        { label: "Email Campaigns", href: "/admin/email-campaigns" },
        { label: campaign.name }
      ]} />

      <div className="mt-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/email-campaigns">
              <Button variant="outline" size="icon" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{campaign.name}</h1>
                <Badge variant={campaign.isActive ? "default" : "secondary"}>
                  {campaign.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {campaign.description && (
                <p className="text-muted-foreground mt-1">{campaign.description}</p>
              )}
            </div>
          </div>
          
          {isGraduationPath && (
            <Button
              onClick={() => backfillMutation.mutate()}
              disabled={backfillMutation.isPending}
              data-testid="button-backfill"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${backfillMutation.isPending ? 'animate-spin' : ''}`} />
              {backfillMutation.isPending ? "Processing..." : "Backfill Enrollments"}
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paused</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paused}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Analytics is default to foreground campaign performance */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="enrollments" data-testid="tab-enrollments">
              <Users className="w-4 h-4 mr-2" />
              Enrollments
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">
              <Mail className="w-4 h-4 mr-2" />
              Email Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {analyticsLoading ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-muted-foreground text-center">Loading analytics...</p>
                </CardContent>
              </Card>
            ) : !analytics || analytics.totalSent === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">No Activity Yet</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Metrics will populate after the first email is sent. Once your campaign is active and emails are delivered, you'll see open rates, click rates, and engagement metrics here.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Hero Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-3xl font-bold">{analytics.openRate}%</div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(analytics.openRate, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analytics.uniqueOpens} of {analytics.totalSent} recipients opened
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                      <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-3xl font-bold">{analytics.clickRate}%</div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(analytics.clickRate, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analytics.uniqueClicks} of {analytics.totalSent} recipients clicked
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-3xl font-bold">{analytics.uniqueEngagementRate}%</div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(analytics.uniqueEngagementRate, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recipients who opened or clicked
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Time-Series Analytics Chart */}
                {campaignId && <CampaignTimeSeriesChart campaignId={campaignId} />}

                {/* Detailed Metrics Grid */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Metrics</CardTitle>
                    <CardDescription>
                      Comprehensive breakdown of email campaign performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Sent</p>
                        <p className="text-2xl font-bold">{analytics.totalSent}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Opens</p>
                        <p className="text-2xl font-bold">{analytics.totalOpens}</p>
                        <p className="text-xs text-muted-foreground">
                          {analytics.uniqueOpens} unique
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Clicks</p>
                        <p className="text-2xl font-bold">{analytics.totalClicks}</p>
                        <p className="text-xs text-muted-foreground">
                          {analytics.uniqueClicks} unique
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Click-to-Open Rate</p>
                        <p className="text-2xl font-bold">{analytics.clickToOpenRate}%</p>
                        <p className="text-xs text-muted-foreground">
                          Of those who opened
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Link Performance Section with Visual Ranking */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MousePointerClick className="w-5 h-5" />
                      Link Performance Ranking
                    </CardTitle>
                    <CardDescription>
                      Visual ranking of top-performing links sorted by click-through rate
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {linkPerformanceLoading ? (
                      <p className="text-muted-foreground">Loading link performance...</p>
                    ) : !linkPerformance || linkPerformance.length === 0 ? (
                      <div className="text-center py-8">
                        <MousePointerClick className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No link clicks yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Link performance data will appear once recipients click on links in your emails
                        </p>
                      </div>
                    ) : (() => {
                      const sortedLinks = [...linkPerformance].sort((a, b) => b.ctr - a.ctr);
                      const maxCTR = Math.max(...sortedLinks.map(l => l.ctr));
                      
                      const getPerformanceTier = (ctr: number) => {
                        if (sortedLinks.length === 1) return 'high';
                        const avgCTR = sortedLinks.reduce((sum, l) => sum + l.ctr, 0) / sortedLinks.length;
                        if (ctr >= avgCTR * 1.2) return 'high';
                        if (ctr >= avgCTR * 0.8) return 'medium';
                        return 'low';
                      };
                      
                      return (
                        <div className="space-y-4">
                          {sortedLinks.map((link, index) => {
                            const tier = getPerformanceTier(link.ctr);
                            const relativeWidth = maxCTR > 0 ? (link.ctr / maxCTR) * 100 : 0;
                            
                            return (
                              <div 
                                key={index} 
                                className="space-y-2 p-4 rounded-lg border hover-elevate"
                                data-testid={`container-link-rank-${index}`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <Badge 
                                      variant={index < 3 ? "default" : "secondary"}
                                      className="shrink-0"
                                      data-testid={`badge-rank-${index}`}
                                    >
                                      #{index + 1}
                                    </Badge>
                                    <div className="flex-1 min-w-0">
                                      <a 
                                        href={link.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-primary hover:underline block truncate"
                                        title={link.url}
                                        data-testid={`link-url-${index}`}
                                      >
                                        {link.url}
                                      </a>
                                    </div>
                                  </div>
                                  <Badge 
                                    variant={
                                      tier === 'high' ? 'default' : 
                                      tier === 'medium' ? 'secondary' : 
                                      'outline'
                                    }
                                    className="shrink-0 flex items-center gap-1"
                                    data-testid={`badge-tier-${index}`}
                                  >
                                    {tier === 'high' ? (
                                      <>
                                        <TrendingUp className="w-3 h-3" />
                                        High
                                      </>
                                    ) : tier === 'medium' ? (
                                      <>
                                        <Minus className="w-3 h-3" />
                                        Medium
                                      </>
                                    ) : (
                                      <>
                                        <TrendingDown className="w-3 h-3" />
                                        Low
                                      </>
                                    )}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground text-xs">Total Clicks</p>
                                    <p className="font-semibold" data-testid={`text-total-clicks-${index}`}>
                                      {link.totalClicks}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Unique Clicks</p>
                                    <p className="font-semibold" data-testid={`text-unique-clicks-${index}`}>
                                      {link.uniqueClicks}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Click-Through Rate</p>
                                    <p className="font-semibold" data-testid={`text-ctr-${index}`}>
                                      {link.ctr.toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Performance</span>
                                    <span className="font-medium">{relativeWidth.toFixed(0)}% of top</span>
                                  </div>
                                  <div className="w-full bg-secondary rounded-full h-2" data-testid={`progress-bar-${index}`}>
                                    <div 
                                      className={`h-2 rounded-full transition-all ${
                                        tier === 'high' ? 'bg-primary' : 
                                        tier === 'medium' ? 'bg-blue-500' : 
                                        'bg-muted-foreground'
                                      }`}
                                      style={{ width: `${relativeWidth}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Best Send Time Insights */}
                {campaignId && <BestSendTimeInsights scope="campaign" scopeId={campaignId} />}
              </>
            )}
          </TabsContent>

          <TabsContent value="enrollments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Leads</CardTitle>
                <CardDescription>
                  View all leads enrolled in this campaign and their progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {enrollmentsLoading ? (
                  <p className="text-muted-foreground">Loading enrollments...</p>
                ) : enrollments.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No enrollments yet</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lead</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Current Step</TableHead>
                          <TableHead>Enrolled</TableHead>
                          <TableHead>Last Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollments.map((item) => (
                          <TableRow key={item.enrollment.id} data-testid={`row-enrollment-${item.enrollment.id}`}>
                            <TableCell className="font-medium">
                              {item.lead ? `${item.lead.firstName} ${item.lead.lastName}` : 'Unknown'}
                            </TableCell>
                            <TableCell>{item.lead?.email || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  item.enrollment.status === 'active' ? 'default' :
                                  item.enrollment.status === 'completed' ? 'secondary' :
                                  'outline'
                                }
                              >
                                {item.enrollment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.enrollment.currentStepNumber || 0}</TableCell>
                            <TableCell>
                              {new Date(item.enrollment.enrolledAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {item.enrollment.lastEmailSentAt
                                ? new Date(item.enrollment.lastEmailSentAt).toLocaleDateString()
                                : 'Never'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {enrollmentTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {enrollmentPage * enrollmentPageSize + 1}-{Math.min((enrollmentPage + 1) * enrollmentPageSize, stats.total)} of {stats.total}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEnrollmentPage(p => Math.max(0, p - 1))}
                            disabled={enrollmentPage === 0}
                            data-testid="button-prev-enrollment-page"
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEnrollmentPage(p => Math.min(enrollmentTotalPages - 1, p + 1))}
                            disabled={enrollmentPage >= enrollmentTotalPages - 1}
                            data-testid="button-next-enrollment-page"
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
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Delivery Logs</CardTitle>
                <CardDescription>
                  View email delivery status for all enrolled leads
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <p className="text-muted-foreground">Loading logs...</p>
                ) : emailLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No email logs found</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lead</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent At</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emailLogs.map((log) => (
                          <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                            <TableCell className="font-medium">
                              {log.lead ? `${log.lead.firstName} ${log.lead.lastName}` : 'Unknown'}
                            </TableCell>
                            <TableCell>{log.subject}</TableCell>
                            <TableCell>
                              {log.status === 'sent' ? (
                                <Badge variant="default">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Sent
                                </Badge>
                              ) : log.status === 'failed' ? (
                                <Badge variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Failed
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {log.errorMessage && (
                                <span className="text-sm text-destructive flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {log.errorMessage}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination for Logs */}
                    {logTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {logPage * logPageSize + 1}-{Math.min((logPage + 1) * logPageSize, logTotal)} of {logTotal}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLogPage(p => Math.max(0, p - 1))}
                            disabled={logPage === 0}
                            data-testid="button-prev-log-page"
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLogPage(p => Math.min(logTotalPages - 1, p + 1))}
                            disabled={logPage >= logTotalPages - 1}
                            data-testid="button-next-log-page"
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
