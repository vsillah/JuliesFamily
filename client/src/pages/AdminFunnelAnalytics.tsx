import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Users, Target, Zap, ArrowRight, Clock } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { format } from "date-fns";
import { TierGate } from "@/components/TierGate";
import { TIERS } from "@shared/tiers";

interface ProgressionHistory {
  id: string;
  leadId: string;
  fromStage: string | null;
  toStage: string;
  reason: string;
  engagementScore: number;
  triggeredBy: string | null;
  createdAt: string;
  lead?: {
    firstName: string;
    lastName: string;
    email: string;
    persona: string;
  };
}

interface FunnelStats {
  totalProgressions: number;
  progressionsByStage: Record<string, number>;
  progressionsByPersona: Record<string, number>;
  averageVelocityDays: Record<string, number>;
  recentProgressions: ProgressionHistory[];
}

const STAGE_LABELS: Record<string, string> = {
  awareness: "Awareness",
  consideration: "Consideration",
  decision: "Decision",
  retention: "Retention"
};

const PERSONA_LABELS: Record<string, string> = {
  donor: "Donor",
  adult_education_student: "Student",
  parent: "Parent",
  volunteer: "Volunteer",
  service_provider: "Provider",
  other: "Other"
};

export default function AdminFunnelAnalytics() {
  const [selectedPersona, setSelectedPersona] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("funnel");

  const { data: stats, isLoading } = useQuery<FunnelStats>({
    queryKey: selectedPersona === 'all' 
      ? ['/api/admin/funnel/stats'] 
      : ['/api/admin/funnel/stats', { persona: selectedPersona }],
  });

  const handlePersonaDrillDown = (persona: string) => {
    setSelectedPersona(persona);
    setActiveTab('history');
  };

  const renderStageCard = (stage: string, count: number, isLast: boolean = false) => (
    <div key={stage} className="flex items-center gap-3" data-testid={`stage-card-${stage}`}>
      <Card className="flex-1">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {STAGE_LABELS[stage] || stage}
            </CardTitle>
            <Badge variant="secondary" data-testid={`stage-count-${stage}`}>
              {count} leads
            </Badge>
          </div>
        </CardHeader>
      </Card>
      {!isLast && (
        <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Breadcrumbs
            items={[
              { label: "Admin", path: "/admin" },
              { label: "Funnel Analytics", path: "/admin/funnel-analytics" }
            ]}
          />
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const stages = ["awareness", "consideration", "decision", "retention"];

  return (
    <TierGate requiredTier={TIERS.PREMIUM} featureName="Funnel Analytics">
      <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: "Admin", path: "/admin" },
            { label: "Funnel Analytics", path: "/admin/funnel-analytics" }
          ]}
        />

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Funnel Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track lead progression through sales funnel stages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter by persona:</span>
            <Select value={selectedPersona} onValueChange={setSelectedPersona}>
              <SelectTrigger className="w-[180px]" data-testid="select-persona-filter">
                <SelectValue placeholder="All personas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="option-persona-all">All Personas</SelectItem>
                <SelectItem value="donor" data-testid="option-persona-donor">Donor</SelectItem>
                <SelectItem value="adult_education_student" data-testid="option-persona-student">Student</SelectItem>
                <SelectItem value="parent" data-testid="option-persona-parent">Parent</SelectItem>
                <SelectItem value="volunteer" data-testid="option-persona-volunteer">Volunteer</SelectItem>
                <SelectItem value="service_provider" data-testid="option-persona-provider">Provider</SelectItem>
                <SelectItem value="other" data-testid="option-persona-other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-total-progressions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Progressions
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-progressions">
                {stats?.totalProgressions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                All-time stage changes
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-leads">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Leads
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-leads">
                {Object.values(stats?.progressionsByStage || {}).reduce((sum, count) => sum + count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently in funnel
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-decision-stage">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Decision Stage
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-decision-count">
                {stats?.progressionsByStage?.decision || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                High-intent leads
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-retention-stage">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Retention
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-retention-count">
                {stats?.progressionsByStage?.retention || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Converted leads
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="funnel" data-testid="tab-funnel-flow">
              Funnel Flow
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-progression-history">
              Progression History
            </TabsTrigger>
            <TabsTrigger value="personas" data-testid="tab-by-persona">
              By Persona
            </TabsTrigger>
          </TabsList>

          <TabsContent value="funnel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Funnel Visualization</CardTitle>
                <CardDescription>
                  Current distribution of leads across funnel stages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stages.map((stage, idx) =>
                  renderStageCard(
                    stage,
                    stats?.progressionsByStage?.[stage] || 0,
                    idx === stages.length - 1
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Progressions</CardTitle>
                <CardDescription>
                  Latest lead stage transitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recentProgressions && stats.recentProgressions.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentProgressions.map((progression) => (
                      <div
                        key={progression.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                        data-testid={`progression-${progression.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {progression.lead?.firstName} {progression.lead?.lastName}
                            </p>
                            {progression.lead?.persona && (
                              <Badge variant="outline" className="text-xs">
                                {PERSONA_LABELS[progression.lead.persona] || progression.lead.persona}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>
                              {progression.fromStage
                                ? STAGE_LABELS[progression.fromStage]
                                : "New"}
                            </span>
                            <ArrowRight className="w-3 h-3" />
                            <span className="font-medium text-foreground">
                              {STAGE_LABELS[progression.toStage]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {progression.reason}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div data-testid={`progression-score-${progression.id}`}>
                            Score: {progression.engagementScore}
                          </div>
                          <div className="mt-1">
                            {format(new Date(progression.createdAt), 'MMM d, h:mm a')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No progression history yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Progressions by Persona</CardTitle>
                <CardDescription>
                  Breakdown of stage movements and progression velocity by user type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats?.progressionsByPersona || {}).map(([persona, count]) => {
                    const velocity = stats?.averageVelocityDays?.[persona];
                    return (
                      <div
                        key={persona}
                        className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover-elevate"
                        data-testid={`persona-stat-${persona}`}
                        onClick={() => handlePersonaDrillDown(persona)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {PERSONA_LABELS[persona] || persona}
                            </p>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-muted-foreground">
                              {count} progression{count !== 1 ? 's' : ''}
                            </p>
                            {velocity !== undefined && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span data-testid={`persona-velocity-${persona}`}>
                                  {velocity} days avg
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Click to view progression history
                          </p>
                        </div>
                        <Badge variant="secondary" data-testid={`persona-count-${persona}`}>
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                  {Object.keys(stats?.progressionsByPersona || {}).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No persona data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </TierGate>
  );
}
