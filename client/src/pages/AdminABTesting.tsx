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
  BarChart3, Edit, TrendingUp, Users, Target, ChevronDown, ChevronUp, AlertCircle,
  Sparkles, Loader2
} from "lucide-react";
import { useLocation, Link } from "wouter";
import type { AbTestWithVariants, AbTestVariant } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ABTestWizard, type TestConfiguration } from "@/components/ABTestWizard";

export default function AdminABTesting() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<AbTestWithVariants | null>(null);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  // New test form
  const [newTest, setNewTest] = useState({
    name: "",
    description: "",
    type: "card_order" as string,
    targetPersona: "all" as string,
    targetFunnelStage: "all" as string,
    trafficAllocation: 100,
  });

  // Edit test form
  const [editTest, setEditTest] = useState({
    name: "",
    description: "",
    type: "card_order" as string,
    targetPersona: "all" as string,
    targetFunnelStage: "all" as string,
    trafficAllocation: 100,
  });

  // New variant form - configuration fields separated for easier editing
  const [newVariant, setNewVariant] = useState({
    name: "",
    description: "",
    trafficWeight: 50,
    isControl: false,
    // Configuration fields (type-specific)
    title: "",
    ctaText: "",
    ctaLink: "",
    secondaryCtaText: "",
    secondaryCtaLink: "",
    buttonVariant: "default" as string,
    imageName: "",
    // JSON fallback for unsupported types
    jsonConfig: "",
  });

  // Fetch all tests with variants
  const { data: tests = [], isLoading } = useQuery<AbTestWithVariants[]>({
    queryKey: ["/api/ab-tests"],
    retry: false,
  });

  // Handle wizard completion
  const handleWizardComplete = async (config: TestConfiguration) => {
    try {
      // Validate configuration
      if (config.variants.length < 2) {
        toast({
          title: "Invalid configuration",
          description: "You must have at least 2 variants to create a test.",
          variant: "destructive",
        });
        return;
      }

      const hasControl = config.variants.some(v => v.isControl);
      if (!hasControl) {
        toast({
          title: "Invalid configuration",
          description: "At least one variant must be marked as the control (baseline).",
          variant: "destructive",
        });
        return;
      }

      const totalWeight = config.variants.reduce((sum, v) => sum + v.trafficWeight, 0);
      if (totalWeight !== 100) {
        toast({
          title: "Invalid configuration",
          description: "Variant traffic weights must sum to 100%.",
          variant: "destructive",
        });
        return;
      }

      // Create the test
      const testData = {
        name: config.name,
        description: config.description,
        type: config.type,
        targetPersona: config.targetPersona || undefined,
        targetFunnelStage: config.targetFunnelStage || undefined,
        trafficAllocation: config.trafficAllocation,
        status: 'active', // Start as active since it's fully configured
      };

      // First, create content items for custom variants
      const variantsWithContentIds = await Promise.all(
        config.variants.map(async (variant) => {
          // If it's a custom variant, create a content item first
          if (variant.creationMode === 'custom' && variant.configuration) {
            const contentType = config.type === 'hero' ? 'hero' : 'cta';
            const contentItemData = {
              type: contentType,
              title: variant.configuration.title || variant.name,
              description: variant.configuration.description || '',
              imageName: variant.configuration.imageName || null,
              isActive: true,
              order: 0,
              metadata: {
                persona: config.targetPersona || null,
                funnelStage: config.targetFunnelStage || null,
                primaryButton: variant.configuration.primaryButton || '',
                secondaryButton: variant.configuration.secondaryButton || '',
                subtitle: `A/B Test Variant: ${variant.name}`,
              },
            };
            
            const response = await apiRequest("POST", "/api/content", contentItemData);
            const createdContent = await response.json();
            
            return {
              ...variant,
              contentItemId: createdContent.id,
            };
          }
          
          return variant;
        })
      );
      
      // Create the test using apiRequest directly to get proper response
      const response = await apiRequest("POST", "/api/ab-tests", testData);
      const createdTest = await response.json() as AbTest;
      
      if (!createdTest?.id) {
        throw new Error("Failed to create test - no ID returned");
      }
      
      // Create variants for the test
      for (const variant of variantsWithContentIds) {
        const variantData = {
          name: variant.name,
          description: variant.description,
          trafficWeight: variant.trafficWeight,
          configuration: JSON.stringify(variant.configuration || {}),
          isControl: variant.isControl,
          contentItemId: variant.contentItemId || undefined,
        };
        
        await apiRequest("POST", `/api/ab-tests/${createdTest.id}/variants`, variantData);
      }
      
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/ab-tests"] });

      toast({
        title: "Test created successfully!",
        description: `${config.variants.length} variants added. Your test is now active.`,
      });
      
      setIsWizardOpen(false);
    } catch (error) {
      console.error("Error creating test from wizard:", error);
      toast({
        title: "Error",
        description: "Failed to create A/B test. Please try again.",
        variant: "destructive",
      });
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

  // Edit test mutation
  const editTestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/ab-tests/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ab-tests"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Test updated",
        description: "A/B test has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update A/B test.",
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
        isControl: false,
        title: "",
        ctaText: "",
        ctaLink: "",
        secondaryCtaText: "",
        secondaryCtaLink: "",
        buttonVariant: "default",
        imageName: "",
        jsonConfig: "",
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

  // AI suggestion mutation for variant name and description
  const suggestVariantNameMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTest) throw new Error("No test selected");
      
      // Build configuration from current form state
      let configuration: Record<string, any> = {};
      if (selectedTest.type === 'hero' || selectedTest.type === 'cta' || selectedTest.type === 'messaging') {
        if (newVariant.title) configuration.title = newVariant.title;
        if (newVariant.ctaText) configuration.ctaText = newVariant.ctaText;
        if (newVariant.ctaLink) configuration.ctaLink = newVariant.ctaLink;
        if (newVariant.secondaryCtaText) configuration.secondaryCtaText = newVariant.secondaryCtaText;
        if (newVariant.secondaryCtaLink) configuration.secondaryCtaLink = newVariant.secondaryCtaLink;
        if (newVariant.buttonVariant && newVariant.buttonVariant !== "default") {
          configuration.buttonVariant = newVariant.buttonVariant;
        }
        if (newVariant.imageName) configuration.imageName = newVariant.imageName;
      } else {
        // For JSON-based types, parse the config
        if (newVariant.jsonConfig.trim()) {
          try {
            configuration = JSON.parse(newVariant.jsonConfig);
          } catch {
            throw new Error("Invalid JSON configuration");
          }
        }
      }

      const response = await apiRequest("POST", "/api/ai/suggest-variant-name", {
        testType: selectedTest.type,
        configuration,
        persona: selectedTest.targetPersona || undefined,
        funnelStage: selectedTest.targetFunnelStage || undefined,
      });
      
      return await response.json();
    },
    onSuccess: (data: { name: string; description: string }) => {
      // Store previous values for undo
      const previousName = newVariant.name;
      const previousDescription = newVariant.description;

      // Auto-populate the fields
      setNewVariant({
        ...newVariant,
        name: data.name,
        description: data.description,
      });

      // Show success toast with undo action
      toast({
        title: "AI Suggestions Applied",
        description: "Name and description have been generated. You can edit them further.",
        action: {
          label: "Undo",
          onClick: () => {
            setNewVariant({
              ...newVariant,
              name: previousName,
              description: previousDescription,
            });
            toast({
              title: "Reverted",
              description: "AI suggestions have been undone.",
            });
          },
        },
      });
    },
    onError: (error: any) => {
      toast({
        title: "Suggestion Failed",
        description: error.message || "Failed to generate AI suggestions. Please try again.",
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

  const handleEditTest = () => {
    if (!selectedTest) return;
    
    // Convert "all" values to null for the backend
    const testData = {
      name: editTest.name,
      description: editTest.description,
      type: editTest.type,
      targetPersona: editTest.targetPersona === "all" ? null : editTest.targetPersona,
      targetFunnelStage: editTest.targetFunnelStage === "all" ? null : editTest.targetFunnelStage,
      trafficAllocation: editTest.trafficAllocation,
    };
    editTestMutation.mutate({ id: selectedTest.id, data: testData });
  };

  const openEditDialog = (test: AbTestWithVariants) => {
    setSelectedTest(test);
    setEditTest({
      name: test.name,
      description: test.description || "",
      type: test.type,
      targetPersona: test.targetPersona || "all",
      targetFunnelStage: test.targetFunnelStage || "all",
      trafficAllocation: test.trafficAllocation || 100,
    });
    setIsEditDialogOpen(true);
  };

  const toggleTestExpanded = (testId: string) => {
    setExpandedTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  };

  const getVariantPreview = (variant: AbTestVariant) => {
    let config = variant.configuration as any;
    
    // Handle legacy string-stored configurations by parsing them
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch {
        return 'Custom configuration';
      }
    }
    
    if (!config || typeof config !== 'object') return null;
    
    // Extract key fields based on what's in the configuration
    const preview: string[] = [];
    if (config.title) preview.push(`"${config.title}"`);
    if (config.ctaText) preview.push(`CTA: "${config.ctaText}"`);
    if (config.buttonVariant) preview.push(`Style: ${config.buttonVariant}`);
    if (config.imageName) preview.push(`Image: ${config.imageName}`);
    
    return preview.length > 0 ? preview.join(' • ') : 'Custom configuration';
  };

  const handleCreateVariant = () => {
    if (!selectedTest) return;

    // VALIDATION: Check traffic allocation before submission
    const existingAllocation = selectedTest.variants?.reduce((sum, v) => sum + v.trafficWeight, 0) || 0;
    const proposedTotal = existingAllocation + newVariant.trafficWeight;
    
    if (proposedTotal > 100) {
      toast({
        title: "Traffic Allocation Exceeded",
        description: `Cannot add variant. Total allocation would be ${proposedTotal}% (exceeds 100% by ${proposedTotal - 100}%).`,
        variant: "destructive",
      });
      return;
    }

    let config: Record<string, any> = {};
    
    // For types with custom forms, build from individual fields
    if (selectedTest.type === 'hero' || selectedTest.type === 'cta' || selectedTest.type === 'messaging') {
      if (newVariant.title) config.title = newVariant.title;
      if (newVariant.ctaText) config.ctaText = newVariant.ctaText;
      if (newVariant.ctaLink) config.ctaLink = newVariant.ctaLink;
      if (newVariant.secondaryCtaText) config.secondaryCtaText = newVariant.secondaryCtaText;
      if (newVariant.secondaryCtaLink) config.secondaryCtaLink = newVariant.secondaryCtaLink;
      if (newVariant.buttonVariant && newVariant.buttonVariant !== "default") config.buttonVariant = newVariant.buttonVariant;
      if (newVariant.imageName) config.imageName = newVariant.imageName;
    } else {
      // For other types, parse JSON config
      if (newVariant.jsonConfig.trim()) {
        try {
          config = JSON.parse(newVariant.jsonConfig);
        } catch (error) {
          toast({
            title: "Invalid JSON",
            description: "Configuration must be valid JSON.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    createVariantMutation.mutate({
      testId: selectedTest.id,
      variantData: {
        name: newVariant.name,
        description: newVariant.description,
        trafficWeight: newVariant.trafficWeight,
        isControl: newVariant.isControl,
        configuration: config,
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
                        onClick={() => openEditDialog(test)}
                        data-testid={`button-edit-${test.id}`}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
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
                
                {/* Variants Section */}
                {test.variants && test.variants.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTestExpanded(test.id)}
                        className="w-full justify-between py-4 hover-elevate"
                        data-testid={`button-toggle-variants-${test.id}`}
                      >
                        <span className="text-sm font-medium">
                          {test.variants.length} {test.variants.length === 1 ? 'Variant' : 'Variants'}
                        </span>
                        {expandedTests.has(test.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      
                      {expandedTests.has(test.id) && (
                        <div className="space-y-2 pb-4 px-4" data-testid={`variants-list-${test.id}`}>
                          {test.variants.map(variant => (
                            <div
                              key={variant.id}
                              className="flex items-start justify-between gap-4 p-3 rounded-md bg-muted/50"
                              data-testid={`variant-item-${variant.id}`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{variant.name}</span>
                                  {variant.isControl && (
                                    <Badge variant="secondary" className="text-xs">Control</Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {variant.trafficWeight}%
                                  </Badge>
                                </div>
                                {variant.description && (
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {variant.description}
                                  </p>
                                )}
                                {getVariantPreview(variant) && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {getVariantPreview(variant)}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  // TODO: Open edit variant dialog
                                  toast({
                                    title: "Coming soon",
                                    description: "Variant editing will be available shortly.",
                                  });
                                }}
                                data-testid={`button-edit-variant-${variant.id}`}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
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

      {/* Edit Test Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-test">
          <DialogHeader>
            <DialogTitle>Edit A/B Test</DialogTitle>
            <DialogDescription>Update test settings and configuration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-test-name">Test Name*</Label>
              <Input
                id="edit-test-name"
                value={editTest.name}
                onChange={(e) => setEditTest({ ...editTest, name: e.target.value })}
                placeholder="e.g., Service Cards Order Test"
                data-testid="input-edit-test-name"
              />
            </div>
            <div>
              <Label htmlFor="edit-test-description">Description</Label>
              <Textarea
                id="edit-test-description"
                value={editTest.description}
                onChange={(e) => setEditTest({ ...editTest, description: e.target.value })}
                rows={3}
                placeholder="What are you testing and why?"
                data-testid="input-edit-test-description"
              />
            </div>
            <div>
              <Label htmlFor="edit-test-type">Test Type*</Label>
              <Select
                value={editTest.type}
                onValueChange={(value) => setEditTest({ ...editTest, type: value })}
              >
                <SelectTrigger data-testid="select-edit-test-type">
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
                <Label htmlFor="edit-test-persona">Target Persona (Optional)</Label>
                <Select
                  value={editTest.targetPersona}
                  onValueChange={(value) => setEditTest({ ...editTest, targetPersona: value })}
                >
                  <SelectTrigger data-testid="select-edit-test-persona">
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
                <Label htmlFor="edit-test-funnel">Target Funnel Stage (Optional)</Label>
                <Select
                  value={editTest.targetFunnelStage}
                  onValueChange={(value) => setEditTest({ ...editTest, targetFunnelStage: value })}
                >
                  <SelectTrigger data-testid="select-edit-test-funnel">
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
              <Label htmlFor="edit-test-traffic">Traffic Allocation (%)</Label>
              <Input
                id="edit-test-traffic"
                type="number"
                min="1"
                max="100"
                value={editTest.trafficAllocation}
                onChange={(e) => setEditTest({ ...editTest, trafficAllocation: parseInt(e.target.value) || 100 })}
                data-testid="input-edit-test-traffic"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of matching visitors to include in the test
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditTest}
                disabled={editTestMutation.isPending || !editTest.name}
                data-testid="button-submit-edit"
              >
                {editTestMutation.isPending ? "Saving..." : "Save Changes"}
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
            {/* AI Suggestion Button */}
            <div>
              <Button
                variant="outline"
                onClick={() => suggestVariantNameMutation.mutate()}
                disabled={suggestVariantNameMutation.isPending || (() => {
                  // Disable if no configuration data to base suggestions on
                  if (!selectedTest) return true;
                  
                  if (selectedTest.type === 'hero' || selectedTest.type === 'cta' || selectedTest.type === 'messaging') {
                    // For form-based types, check if at least one field has content
                    return !newVariant.title && !newVariant.ctaText && !newVariant.ctaLink && !newVariant.imageName;
                  } else {
                    // For JSON-based types, check if JSON is not empty
                    return !newVariant.jsonConfig.trim();
                  }
                })()}
                className="w-full"
                data-testid="button-ai-suggest-variant-name"
              >
                {suggestVariantNameMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Suggestions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Suggest Name & Description with AI
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-1.5">
                {(() => {
                  if (!selectedTest) return null;
                  
                  if (selectedTest.type === 'hero' || selectedTest.type === 'cta' || selectedTest.type === 'messaging') {
                    if (!newVariant.title && !newVariant.ctaText && !newVariant.ctaLink && !newVariant.imageName) {
                      return "Fill in at least one configuration field to enable AI suggestions";
                    }
                  } else {
                    if (!newVariant.jsonConfig.trim()) {
                      return "Add configuration JSON to enable AI suggestions";
                    }
                  }
                  return "AI will analyze your configuration to suggest a descriptive name and explanation";
                })()}
              </p>
            </div>
            <div className="space-y-2">
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
              {(() => {
                // Current allocation from existing variants
                const existingAllocation = selectedTest?.variants?.reduce((sum, v) => sum + v.trafficWeight, 0) || 0;
                
                // Proposed allocation including this new variant
                const proposedTotal = existingAllocation + newVariant.trafficWeight;
                const remainingAfterProposed = 100 - proposedTotal;
                const isOverAllocated = proposedTotal > 100;
                const isFullyAllocated = proposedTotal === 100;
                
                return (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Current: <span className="font-medium text-foreground">{existingAllocation}%</span>
                      </span>
                      <span className="text-muted-foreground">
                        After New: <span className={`font-medium ${isOverAllocated ? 'text-destructive' : isFullyAllocated ? 'text-warning' : 'text-foreground'}`}>
                          {proposedTotal}%
                        </span>
                      </span>
                      {isOverAllocated ? (
                        <span className="text-muted-foreground">
                          Over by: <span className="font-medium text-destructive">
                            {Math.abs(remainingAfterProposed)}%
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Remaining: <span className={`font-medium ${isFullyAllocated ? 'text-warning' : 'text-foreground'}`}>
                            {remainingAfterProposed}%
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                      {/* Existing allocation (gray background)  */}
                      <div 
                        className="absolute h-full bg-muted-foreground/30 transition-all"
                        style={{ width: `${Math.min(existingAllocation, 100)}%` }}
                      />
                      {/* Proposed total allocation (colored based on state, can exceed 100%) */}
                      <div 
                        className={`absolute h-full transition-all ${isOverAllocated ? 'bg-destructive' : isFullyAllocated ? 'bg-warning' : 'bg-primary'}`}
                        style={{ width: `${proposedTotal}%`, maxWidth: '150%' }}
                      />
                      {/* Visual indicator when over 100% - striped pattern overlay */}
                      {isOverAllocated && (
                        <div 
                          className="absolute h-full bg-destructive/50 transition-all"
                          style={{ 
                            left: '100%',
                            width: `${proposedTotal - 100}%`,
                            maxWidth: '50%',
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)'
                          }}
                        />
                      )}
                    </div>
                    {isOverAllocated && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Would exceed 100% by {proposedTotal - 100}% (total: {proposedTotal}%)
                      </p>
                    )}
                    {isFullyAllocated && !isOverAllocated && (
                      <p className="text-xs text-warning flex items-center gap-1">
                        Perfect! This will use all 100% of traffic allocation.
                      </p>
                    )}
                    {!isOverAllocated && !isFullyAllocated && remainingAfterProposed > 0 && (
                      <p className="text-xs text-muted-foreground">
                        After adding this variant, {remainingAfterProposed}% will remain unallocated
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
            {/* Configuration Fields - Dynamic based on test type */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-md border">
              <h4 className="text-sm font-medium">Variant Configuration</h4>
              
              {/* Hero and CTA tests get title/headline field */}
              {(selectedTest?.type === 'hero' || selectedTest?.type === 'cta' || selectedTest?.type === 'messaging') && (
                <div>
                  <Label htmlFor="variant-title">
                    {selectedTest?.type === 'hero' ? 'Title/Headline' : selectedTest?.type === 'cta' ? 'Headline' : 'Title'}
                  </Label>
                  <Input
                    id="variant-title"
                    value={newVariant.title}
                    onChange={(e) => setNewVariant({ ...newVariant, title: e.target.value })}
                    placeholder={selectedTest?.type === 'hero' ? 'e.g., Ready to Take the First Step?' : 'e.g., Transform Your Future'}
                    data-testid="input-variant-title"
                  />
                </div>
              )}

              {/* CTA button text field */}
              {(selectedTest?.type === 'hero' || selectedTest?.type === 'cta') && (
                <div>
                  <Label htmlFor="variant-cta-text">Button Text</Label>
                  <Input
                    id="variant-cta-text"
                    value={newVariant.ctaText}
                    onChange={(e) => setNewVariant({ ...newVariant, ctaText: e.target.value })}
                    placeholder="e.g., Get Started, Learn More"
                    data-testid="input-variant-cta-text"
                  />
                </div>
              )}

              {/* Button style selector */}
              {(selectedTest?.type === 'hero' || selectedTest?.type === 'cta') && (
                <div>
                  <Label htmlFor="variant-button-style">Button Style</Label>
                  <Select
                    value={newVariant.buttonVariant}
                    onValueChange={(value) => setNewVariant({ ...newVariant, buttonVariant: value })}
                  >
                    <SelectTrigger data-testid="select-variant-button-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Primary (Default)</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Hero-specific fields */}
              {selectedTest?.type === 'hero' && (
                <>
                  <div>
                    <Label htmlFor="variant-image">Image Name</Label>
                    <Input
                      id="variant-image"
                      value={newVariant.imageName}
                      onChange={(e) => setNewVariant({ ...newVariant, imageName: e.target.value })}
                      placeholder="e.g., hero-student, hero-volunteer"
                      data-testid="input-variant-image"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Reference to existing image in the system
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="variant-cta-link">Button Link (optional)</Label>
                    <Input
                      id="variant-cta-link"
                      value={newVariant.ctaLink}
                      onChange={(e) => setNewVariant({ ...newVariant, ctaLink: e.target.value })}
                      placeholder="e.g., /programs, /get-started"
                      data-testid="input-variant-cta-link"
                    />
                  </div>
                </>
              )}

              {/* JSON fallback for other test types */}
              {selectedTest?.type !== 'hero' && selectedTest?.type !== 'cta' && selectedTest?.type !== 'messaging' && (
                <div>
                  <Label htmlFor="variant-json">Configuration (JSON)</Label>
                  <Textarea
                    id="variant-json"
                    value={newVariant.jsonConfig}
                    onChange={(e) => setNewVariant({ ...newVariant, jsonConfig: e.target.value })}
                    rows={6}
                    placeholder='{"cardOrder": ["service-1", "service-2", "service-3"]}'
                    className="font-mono text-sm"
                    data-testid="input-variant-json"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JSON object with variant-specific settings for {testTypeLabels[selectedTest?.type || ''] || 'this test type'}
                  </p>
                </div>
              )}
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
                disabled={createVariantMutation.isPending || !newVariant.name || (() => {
                  const allocatedWeight = selectedTest?.variants?.reduce((sum, v) => sum + v.trafficWeight, 0) || 0;
                  return (allocatedWeight + newVariant.trafficWeight) > 100;
                })()}
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
