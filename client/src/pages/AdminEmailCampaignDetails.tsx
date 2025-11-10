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
import { Mail, Users, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";
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

        {/* Tabs */}
        <Tabs defaultValue="enrollments" className="w-full">
          <TabsList>
            <TabsTrigger value="enrollments" data-testid="tab-enrollments">
              Enrollments
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">
              Email Logs
            </TabsTrigger>
          </TabsList>

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
