import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  FlaskConical, Plus, Play, Pause, CheckCircle2, Trash2, 
  BarChart3, Edit, TrendingUp, Users, Target
} from "lucide-react";
import { useLocation, Link } from "wouter";
import type { AbTest, AbTestVariant } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ABTestWizard, type TestConfiguration } from "@/components/ABTestWizard";

export default function AdminABTesting() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<AbTest | null>(null);

  // New test form
  const [newTest, setNewTest] = useState({
    name: "",
    description: "",
    type: "card_order" as string,
    targetPersona: "all" as string,
    targetFunnelStage: "all" as string,
    trafficAllocation: 100,
  });

  // New variant form
  const [newVariant, setNewVariant] = useState({
    name: "",
    description: "",
    trafficWeight: 50,
    configuration: "",
    isControl: false,
  });

  // Fetch all tests
  const { data: tests = [], isLoading } = useQuery<AbTest[]>({
    queryKey: ["/api/ab-tests"],
    retry: false,
  });

  // Handle wizard completion
  const handleWizardComplete = async (config: TestConfiguration) => {
    try {
      // Create the test from the wizard configuration
      const testData = {
        name: config.name,
        description: config.description,
        type: config.type,
        targetPersona: config.targetPersona === null ? undefined : config.targetPersona,
        targetFunnelStage: config.targetFunnelStage === null ? undefined : config.targetFunnelStage,
        trafficAllocation: config.trafficAllocation,
        status: 'draft',
      };

      await createTestMutation.mutateAsync(testData);
      
      // Note: For now, we create the test in draft mode
      // Full variant creation will be added when we build the Configure step
      toast({
        title: "Test created",
        description: "Your A/B test has been created in draft mode. Add variants to activate it.",
      });
    } catch (error) {
      console.error("Error creating test from wizard:", error);
    }
  };

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (testData: any) => {
      return await apiRequest("POST", "/api/ab-tests", testData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ab-tests"] });
      setIsCreateDialogOpen(false);
      setNewTest({
        name: "",
        description: "",
        type: "card_order",
        targetPersona: "all",
        targetFunnelStage: "all",
        trafficAllocation: 100,
      });
      toast({
        title: "Test created",
        description: "A/B test has been successfully created.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create A/B test.",
        variant: "destructive",
      });
    },
  });

  // Update test status mutation
  const updateTestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/ab-tests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ab-tests"] });
      toast({
        title: "Test updated",
        description: "Test status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update test status.",
        variant: "destructive",
      });
    },
  });

  // Delete test mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/ab-tests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ab-tests"] });
      toast({
        title: "Test deleted",
        description: "A/B test has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete test.",
        variant: "destructive",
      });
    },
  });

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: async ({ testId, variantData }: { testId: string; variantData: any }) => {
      return await apiRequest("POST", `/api/ab-tests/${testId}/variants`, variantData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ab-tests"] });
      setIsVariantDialogOpen(false);
      setNewVariant({
        name: "",
        description: "",
        trafficWeight: 50,
        configuration: "",
        isControl: false,
      });
      toast({
        title: "Variant created",
        description: "Test variant has been added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create variant.",
        variant: "destructive",
      });
    },
  });

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate("/");
    return null;
  }

  const handleCreateTest = () => {
    // Convert "all" values to null for the backend
    const testData = {
      ...newTest,
      targetPersona: newTest.targetPersona === "all" ? null : newTest.targetPersona,
      targetFunnelStage: newTest.targetFunnelStage === "all" ? null : newTest.targetFunnelStage,
    };
    createTestMutation.mutate(testData);
  };

  const handleCreateVariant = () => {
    if (!selectedTest) return;

    let parsedConfig = {};
    try {
      if (newVariant.configuration.trim()) {
        parsedConfig = JSON.parse(newVariant.configuration);
      }
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Configuration must be valid JSON.",
        variant: "destructive",
      });
      return;
    }

    createVariantMutation.mutate({
      testId: selectedTest.id,
      variantData: {
        ...newVariant,
        configuration: parsedConfig,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Draft", variant: "secondary" },
      active: { label: "Active", variant: "default" },
      paused: { label: "Paused", variant: "outline" },
      completed: { label: "Completed", variant: "secondary" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  const testTypeLabels: Record<string, string> = {
    card_order: "Card Order",
    layout: "Layout",
    messaging: "Messaging",
    cta: "Call-to-Action",
    hero: "Hero Section",
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading A/B tests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs items={[{ label: "Admin Dashboard", href: "/admin" }, { label: "A/B Testing" }]} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary flex items-center gap-2">
                <FlaskConical className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                <span className="break-words">A/B Testing Dashboard</span>
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Create experiments and track conversion performance
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <Link href="/admin">
                <Button variant="outline" data-testid="button-back-dashboard" size="sm" className="w-full sm:w-auto">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span className="sm:inline">CRM Dashboard</span>
                </Button>
              </Link>
              <Button
                variant="default"
                onClick={() => setIsWizardOpen(true)}
                data-testid="button-create-test"
                size="sm"
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Test
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tests.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tests.filter(t => t.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">Running now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tests.filter(t => t.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">With winners</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft Tests</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tests.filter(t => t.status === 'draft').length}
              </div>
              <p className="text-xs text-muted-foreground">In preparation</p>
            </CardContent>
          </Card>
        </div>

        {/* Tests List */}
        <div className="space-y-4">
          {tests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FlaskConical className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No A/B Tests Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first experiment to start optimizing your website.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-test">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Test
                </Button>
              </CardContent>
            </Card>
          ) : (
            tests.map(test => (
              <Card key={test.id} data-testid={`card-test-${test.id}`}>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <CardTitle className="break-words">{test.name}</CardTitle>
                        {getStatusBadge(test.status)}
                        <Badge variant="outline">{testTypeLabels[test.type]}</Badge>
                      </div>
                      <CardDescription className="break-words">{test.description}</CardDescription>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
                        {test.targetPersona && (
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{personaLabels[test.targetPersona]}</span>
                          </div>
                        )}
                        {test.targetFunnelStage && (
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <TrendingUp className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{funnelStageLabels[test.targetFunnelStage]}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Target className="w-3 h-3 flex-shrink-0" />
                          <span>{test.trafficAllocation}% traffic</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:flex-nowrap">
                      {test.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateTestMutation.mutate({ id: test.id, status: 'active' })}
                          data-testid={`button-start-${test.id}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </Button>
                      )}
                      {test.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTestMutation.mutate({ id: test.id, status: 'paused' })}
                          data-testid={`button-pause-${test.id}`}
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                      )}
                      {test.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateTestMutation.mutate({ id: test.id, status: 'active' })}
                          data-testid={`button-resume-${test.id}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTest(test);
                          setIsVariantDialogOpen(true);
                        }}
                        data-testid={`button-add-variant-${test.id}`}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Variant
                      </Button>
                      <Link href={`/admin/ab-testing/${test.id}`}>
                        <Button size="sm" variant="secondary" data-testid={`button-analytics-${test.id}`}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this test?")) {
                            deleteTestMutation.mutate(test.id);
                          }
                        }}
                        data-testid={`button-delete-${test.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Test Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-test">
          <DialogHeader>
            <DialogTitle>Create New A/B Test</DialogTitle>
            <DialogDescription>Set up a new experiment to optimize your website</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-name">Test Name*</Label>
              <Input
                id="test-name"
                value={newTest.name}
                onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                placeholder="e.g., Service Cards Order Test"
                data-testid="input-test-name"
              />
            </div>
            <div>
              <Label htmlFor="test-description">Description</Label>
              <Textarea
                id="test-description"
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                rows={3}
                placeholder="What are you testing and why?"
                data-testid="input-test-description"
              />
            </div>
            <div>
              <Label htmlFor="test-type">Test Type*</Label>
              <Select
                value={newTest.type}
                onValueChange={(value) => setNewTest({ ...newTest, type: value })}
              >
                <SelectTrigger data-testid="select-test-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card_order">Card Order</SelectItem>
                  <SelectItem value="layout">Layout</SelectItem>
                  <SelectItem value="messaging">Messaging</SelectItem>
                  <SelectItem value="cta">Call-to-Action</SelectItem>
                  <SelectItem value="hero">Hero Section</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-persona">Target Persona (Optional)</Label>
                <Select
                  value={newTest.targetPersona}
                  onValueChange={(value) => setNewTest({ ...newTest, targetPersona: value })}
                >
                  <SelectTrigger data-testid="select-test-persona">
                    <SelectValue placeholder="All personas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All personas</SelectItem>
                    <SelectItem value="student">Adult Education Student</SelectItem>
                    <SelectItem value="provider">Service Provider</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="donor">Donor</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="test-funnel">Target Funnel Stage (Optional)</Label>
                <Select
                  value={newTest.targetFunnelStage}
                  onValueChange={(value) => setNewTest({ ...newTest, targetFunnelStage: value })}
                >
                  <SelectTrigger data-testid="select-test-funnel">
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    <SelectItem value="awareness">Awareness (TOFU)</SelectItem>
                    <SelectItem value="consideration">Consideration (MOFU)</SelectItem>
                    <SelectItem value="decision">Decision (BOFU)</SelectItem>
                    <SelectItem value="retention">Retention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="test-traffic">Traffic Allocation (%)</Label>
              <Input
                id="test-traffic"
                type="number"
                min="1"
                max="100"
                value={newTest.trafficAllocation}
                onChange={(e) => setNewTest({ ...newTest, trafficAllocation: parseInt(e.target.value) || 100 })}
                data-testid="input-test-traffic"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of matching visitors to include in the test
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTest}
                disabled={createTestMutation.isPending || !newTest.name}
                data-testid="button-submit-create"
              >
                {createTestMutation.isPending ? "Creating..." : "Create Test"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Variant Dialog */}
      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-variant">
          <DialogHeader>
            <DialogTitle>Add Test Variant</DialogTitle>
            <DialogDescription>
              Create a new variant for: {selectedTest?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="variant-name">Variant Name*</Label>
              <Input
                id="variant-name"
                value={newVariant.name}
                onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                placeholder="e.g., Control, Variant A, Variant B"
                data-testid="input-variant-name"
              />
            </div>
            <div>
              <Label htmlFor="variant-description">Description</Label>
              <Textarea
                id="variant-description"
                value={newVariant.description}
                onChange={(e) => setNewVariant({ ...newVariant, description: e.target.value })}
                rows={2}
                placeholder="What's different in this variant?"
                data-testid="input-variant-description"
              />
            </div>
            <div>
              <Label htmlFor="variant-weight">Traffic Weight (%)</Label>
              <Input
                id="variant-weight"
                type="number"
                min="0"
                max="100"
                value={newVariant.trafficWeight}
                onChange={(e) => setNewVariant({ ...newVariant, trafficWeight: parseInt(e.target.value) || 50 })}
                data-testid="input-variant-weight"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of test traffic to show this variant (weights should sum to 100)
              </p>
            </div>
            <div>
              <Label htmlFor="variant-config">Configuration (JSON)</Label>
              <Textarea
                id="variant-config"
                value={newVariant.configuration}
                onChange={(e) => setNewVariant({ ...newVariant, configuration: e.target.value })}
                rows={6}
                placeholder='{"cardOrder": ["service-1", "service-2", "service-3"]}'
                className="font-mono text-sm"
                data-testid="input-variant-config"
              />
              <p className="text-xs text-muted-foreground mt-1">
                JSON object with variant-specific settings
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newVariant.isControl}
                onCheckedChange={(checked) => setNewVariant({ ...newVariant, isControl: checked })}
                data-testid="switch-variant-control"
              />
              <Label>Mark as Control (baseline) variant</Label>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsVariantDialogOpen(false)}
                data-testid="button-cancel-variant"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateVariant}
                disabled={createVariantMutation.isPending || !newVariant.name}
                data-testid="button-submit-variant"
              >
                {createVariantMutation.isPending ? "Creating..." : "Add Variant"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* A/B Test Wizard */}
      <ABTestWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onComplete={handleWizardComplete}
      />
    </div>
  );
}
