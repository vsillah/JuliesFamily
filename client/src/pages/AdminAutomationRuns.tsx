import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  History, Play, CheckCircle2, XCircle, Clock, AlertCircle, 
  ChevronDown, ChevronUp, Target, Zap, TrendingUp, Settings
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { TierGate } from "@/components/TierGate";
import { TIERS } from "@shared/tiers";

export default function AdminAutomationRuns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());

  // Fetch automation runs
  const { data: runs = [], isLoading: runsLoading } = useQuery({
    queryKey: ["/api/automation/runs"],
  });

  // Manual trigger mutation
  const triggerMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/automation/run");
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/runs"] });
      toast({
        title: "Automation triggered",
        description: `Found ${result.candidatesIdentified || 0} candidates and created ${result.testsCreated || 0} tests`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to trigger automation",
        variant: "destructive",
      });
    },
  });

  const toggleExpanded = (runId: string) => {
    const newExpanded = new Set(expandedRuns);
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId);
    } else {
      newExpanded.add(runId);
    }
    setExpandedRuns(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "running":
        return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "running":
        return <Badge className="bg-blue-600">Running</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const breadcrumbItems = [
    { label: "Admin", href: "/admin" },
    { label: "Automation", href: "/admin/automation-rules" },
    { label: "Run History" },
  ];

  if (!user?.role || !["admin", "super_admin"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin privileges to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <TierGate requiredTier={TIERS.PREMIUM} featureName="Automation History">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between mb-6 mt-4">
        <div>
          <h1 className="text-3xl font-bold">Automation Run History</h1>
          <p className="text-muted-foreground mt-1">
            View automation evaluation results and test creation history
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/automation-rules">
            <Button variant="outline" data-testid="button-view-rules">
              View Rules
            </Button>
          </Link>
          <Link href="/admin/automation-config">
            <Button variant="outline" data-testid="button-configure">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </Link>
          <Button
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
            data-testid="button-trigger-automation"
          >
            <Play className="w-4 h-4 mr-2" />
            {triggerMutation.isPending ? "Running..." : "Trigger Automation"}
          </Button>
        </div>
      </div>

      {/* Runs List */}
      {runsLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">Loading automation runs...</div>
          </CardContent>
        </Card>
      ) : runs.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No automation runs yet</h3>
              <p className="text-muted-foreground mb-4">
                Automation will run on schedule or you can trigger it manually.
              </p>
              <Button onClick={() => triggerMutation.mutate()} disabled={triggerMutation.isPending}>
                <Play className="w-4 h-4 mr-2" />
                {triggerMutation.isPending ? "Running..." : "Run Automation Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {runs.map((run: any) => {
            const isExpanded = expandedRuns.has(run.id);
            const results = run.results || {};
            
            return (
              <Card key={run.id} data-testid={`run-${run.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(run.status)}
                        <CardTitle className="text-lg">
                          Automation Run
                        </CardTitle>
                        {getStatusBadge(run.status)}
                      </div>
                      <CardDescription>
                        {run.startedAt &&
                          `Started ${formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}`}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpanded(run.id)}
                      data-testid={`button-expand-${run.id}`}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 rounded-md bg-muted">
                      <div className="text-2xl font-bold">{results.rulesEvaluated || 0}</div>
                      <div className="text-xs text-muted-foreground">Rules Evaluated</div>
                    </div>
                    <div className="text-center p-3 rounded-md bg-muted">
                      <div className="text-2xl font-bold">{results.contentEvaluated || 0}</div>
                      <div className="text-xs text-muted-foreground">Content Evaluated</div>
                    </div>
                    <div className="text-center p-3 rounded-md bg-blue-50 dark:bg-blue-950">
                      <div className="text-2xl font-bold text-blue-600">{results.candidatesIdentified || 0}</div>
                      <div className="text-xs text-muted-foreground">Candidates Found</div>
                    </div>
                    <div className="text-center p-3 rounded-md bg-green-50 dark:bg-green-950">
                      <div className="text-2xl font-bold text-green-600">{results.testsCreated || 0}</div>
                      <div className="text-xs text-muted-foreground">Tests Created</div>
                    </div>
                  </div>

                  {results.winnersPromoted > 0 && (
                    <div className="mb-4 p-3 rounded-md bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium">
                          {results.winnersPromoted} winning variant{results.winnersPromoted !== 1 ? 's' : ''} automatically promoted
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Duration and Timestamp */}
                  {run.completedAt && (
                    <div className="text-sm text-muted-foreground mb-4">
                      Completed {formatDistanceToNow(new Date(run.completedAt), { addSuffix: true })}
                      {run.startedAt && run.completedAt && (
                        <>
                          {" • Duration: "}
                          {Math.round(
                            (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000
                          )}s
                        </>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {run.status === "failed" && run.error && (
                    <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-destructive mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">Error</div>
                          <div className="text-sm text-muted-foreground">{run.error}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && results.candidates && results.candidates.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Candidates Identified ({results.candidates.length})
                      </h4>
                      <div className="space-y-2">
                        {results.candidates.map((candidate: any, idx: number) => (
                          <div
                            key={idx}
                            className="border rounded-md p-3 text-sm"
                            data-testid={`candidate-${idx}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium">{candidate.contentType || "Content"}</div>
                                {candidate.contentItemId && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    ID: {candidate.contentItemId}
                                  </div>
                                )}
                              </div>
                              {candidate.testCreated && (
                                <Badge className="bg-green-600 ml-2">Test Created</Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {candidate.persona && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Persona:</span>{" "}
                                  <span className="font-medium">{candidate.persona}</span>
                                </div>
                              )}
                              {candidate.funnelStage && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Stage:</span>{" "}
                                  <span className="font-medium">{candidate.funnelStage}</span>
                                </div>
                              )}
                              {candidate.compositeScore !== undefined && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Score:</span>{" "}
                                  <span className="font-medium text-destructive">
                                    {candidate.compositeScore}
                                  </span>
                                </div>
                              )}
                              {candidate.reason && (
                                <div className="text-xs col-span-2">
                                  <span className="text-muted-foreground">Reason:</span>{" "}
                                  <span className="font-medium">{candidate.reason}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isExpanded && results.safetyLimitsEnforced && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        Safety limits were enforced during this run
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
    </TierGate>
  );
}
