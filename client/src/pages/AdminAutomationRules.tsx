import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Trash2, Edit, Play, Pause, Zap, TrendingDown, Target } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";

export default function AdminAutomationRules() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  const [ruleForm, setRuleForm] = useState({
    name: "",
    description: "",
    metricWeightProfileId: "",
    targetPersona: "all" as string,
    targetFunnelStage: "all" as string,
    contentType: "all" as string,
    baselineWindow: 30,
    minimumSampleSize: 100,
    compositeScoreThreshold: 5000,
    statisticalConfidence: 95,
    isActive: true,
  });

  // Fetch automation rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ["/api/automation/rules"],
  });

  // Fetch metric weight profiles for dropdown
  const { data: metricProfiles = [] } = useQuery({
    queryKey: ["/api/automation/metric-weight-profiles"],
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/automation/rules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Rule created",
        description: "Automation rule has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create automation rule",
        variant: "destructive",
      });
    },
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/automation/rules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
      setIsEditDialogOpen(false);
      setEditingRule(null);
      resetForm();
      toast({
        title: "Rule updated",
        description: "Automation rule has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update automation rule",
        variant: "destructive",
      });
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/automation/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
      toast({
        title: "Rule deleted",
        description: "Automation rule has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete automation rule",
        variant: "destructive",
      });
    },
  });

  // Toggle rule activation mutation
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/automation/rules/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
      toast({
        title: "Rule updated",
        description: "Rule activation status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update rule",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setRuleForm({
      name: "",
      description: "",
      metricWeightProfileId: "",
      targetPersona: "all",
      targetFunnelStage: "all",
      contentType: "all",
      baselineWindow: 30,
      minimumSampleSize: 100,
      compositeScoreThreshold: 5000,
      statisticalConfidence: 95,
      isActive: true,
    });
  };

  const handleCreate = () => {
    const formData = {
      ...ruleForm,
      targetPersona: ruleForm.targetPersona === "all" ? "" : ruleForm.targetPersona,
      targetFunnelStage: ruleForm.targetFunnelStage === "all" ? "" : ruleForm.targetFunnelStage,
      contentType: ruleForm.contentType === "all" ? "" : ruleForm.contentType,
    };
    createRuleMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (editingRule) {
      const formData = {
        ...ruleForm,
        targetPersona: ruleForm.targetPersona === "all" ? "" : ruleForm.targetPersona,
        targetFunnelStage: ruleForm.targetFunnelStage === "all" ? "" : ruleForm.targetFunnelStage,
        contentType: ruleForm.contentType === "all" ? "" : ruleForm.contentType,
      };
      updateRuleMutation.mutate({ id: editingRule.id, data: formData });
    }
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description || "",
      metricWeightProfileId: rule.metricWeightProfileId || "",
      targetPersona: rule.targetPersona || "all",
      targetFunnelStage: rule.targetFunnelStage || "all",
      contentType: rule.contentType || "all",
      baselineWindow: rule.baselineWindow,
      minimumSampleSize: rule.minimumSampleSize,
      compositeScoreThreshold: rule.compositeScoreThreshold,
      statisticalConfidence: rule.statisticalConfidence,
      isActive: rule.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this automation rule?")) {
      deleteRuleMutation.mutate(id);
    }
  };

  const handleToggleActive = (rule: any) => {
    toggleRuleMutation.mutate({ id: rule.id, isActive: !rule.isActive });
  };

  const breadcrumbItems = [
    { label: "Admin", href: "/admin" },
    { label: "Automation Rules" },
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

  const personas = ["parent", "student", "provider", "donor", "volunteer"];
  const funnelStages = ["awareness", "interest", "consideration", "conversion"];
  const contentTypes = ["hero", "testimonial", "service", "event", "impact_stat", "cta"];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between mb-6 mt-4">
        <div>
          <h1 className="text-3xl font-bold">Automation Rules</h1>
          <p className="text-muted-foreground mt-1">
            Configure rules to automatically identify and test underperforming content
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/automation-runs">
            <Button variant="outline" data-testid="button-view-runs">
              View Runs
            </Button>
          </Link>
          <Link href="/admin/automation-config">
            <Button variant="outline" data-testid="button-configure">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </Link>
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-rule">
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Rules List */}
      {rulesLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">Loading automation rules...</div>
          </CardContent>
        </Card>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No automation rules configured</h3>
              <p className="text-muted-foreground mb-4">
                Create your first automation rule to start automatically testing content.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule: any) => {
            const profile = metricProfiles.find((p: any) => p.id === rule.metricWeightProfileId);
            
            return (
              <Card key={rule.id} data-testid={`rule-${rule.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-xl">{rule.name}</CardTitle>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {rule.description && (
                        <CardDescription>{rule.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(rule)}
                        title={rule.isActive ? "Pause rule" : "Activate rule"}
                        data-testid={`button-toggle-${rule.id}`}
                      >
                        {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(rule)}
                        data-testid={`button-edit-${rule.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(rule.id)}
                        data-testid={`button-delete-${rule.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Target Audience</div>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {rule.targetPersona || "All Personas"}
                        </Badge>
                        <Badge variant="outline">
                          {rule.targetFunnelStage || "All Stages"}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Content Type</div>
                      <Badge variant="outline">{rule.contentType || "All Types"}</Badge>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Metric Profile</div>
                      <div className="font-medium text-sm">
                        {profile?.name || "No profile"}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Performance Threshold</div>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="w-4 h-4 text-destructive" />
                        <span className="font-medium text-sm">
                          Score &lt; {rule.compositeScoreThreshold}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Baseline Window:</span>{" "}
                      <span className="font-medium">{rule.baselineWindow} days</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Min Sample Size:</span>{" "}
                      <span className="font-medium">{rule.minimumSampleSize}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Confidence:</span>{" "}
                      <span className="font-medium">{rule.statisticalConfidence}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Rule Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setEditingRule(null);
          resetForm();
        }
      }}>
        <DialogContent className="w-screen h-[100dvh] max-w-none rounded-none p-4 overflow-y-auto sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Automation Rule" : "Create Automation Rule"}</DialogTitle>
            <DialogDescription>
              Configure criteria for automatically identifying and testing underperforming content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ruleName">Rule Name</Label>
              <Input
                id="ruleName"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                placeholder="e.g., Hero Underperformer - Parents"
                data-testid="input-rule-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ruleDescription">Description (Optional)</Label>
              <Textarea
                id="ruleDescription"
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                placeholder="Describe when this rule should trigger..."
                rows={2}
                data-testid="input-rule-description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetPersona">Target Persona (Optional)</Label>
                <Select
                  value={ruleForm.targetPersona}
                  onValueChange={(value) => setRuleForm({ ...ruleForm, targetPersona: value })}
                >
                  <SelectTrigger id="targetPersona" data-testid="select-target-persona">
                    <SelectValue placeholder="All Personas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Personas</SelectItem>
                    {personas.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetFunnelStage">Target Funnel Stage (Optional)</Label>
                <Select
                  value={ruleForm.targetFunnelStage}
                  onValueChange={(value) => setRuleForm({ ...ruleForm, targetFunnelStage: value })}
                >
                  <SelectTrigger id="targetFunnelStage" data-testid="select-target-funnel-stage">
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {funnelStages.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type (Optional)</Label>
              <Select
                value={ruleForm.contentType}
                onValueChange={(value) => setRuleForm({ ...ruleForm, contentType: value })}
              >
                <SelectTrigger id="contentType" data-testid="select-content-type">
                  <SelectValue placeholder="All Content Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content Types</SelectItem>
                  {contentTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metricProfileId">Metric Weight Profile</Label>
              <Select
                value={ruleForm.metricWeightProfileId}
                onValueChange={(value) => setRuleForm({ ...ruleForm, metricWeightProfileId: value })}
              >
                <SelectTrigger id="metricProfileId" data-testid="select-metric-profile">
                  <SelectValue placeholder="Select a metric profile..." />
                </SelectTrigger>
                <SelectContent>
                  {metricProfiles.map((profile: any) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baselineWindow">Baseline Window (days)</Label>
                <Input
                  id="baselineWindow"
                  type="number"
                  min={7}
                  max={90}
                  value={ruleForm.baselineWindow}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, baselineWindow: parseInt(e.target.value) || 30 })
                  }
                  data-testid="input-baseline-window"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumSampleSize">Minimum Sample Size</Label>
                <Input
                  id="minimumSampleSize"
                  type="number"
                  min={50}
                  max={10000}
                  value={ruleForm.minimumSampleSize}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, minimumSampleSize: parseInt(e.target.value) || 100 })
                  }
                  data-testid="input-minimum-sample-size"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="compositeScoreThreshold">Performance Threshold (0-10000)</Label>
                <Input
                  id="compositeScoreThreshold"
                  type="number"
                  min={0}
                  max={10000}
                  value={ruleForm.compositeScoreThreshold}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, compositeScoreThreshold: parseInt(e.target.value) || 5000 })
                  }
                  data-testid="input-composite-score-threshold"
                />
                <p className="text-xs text-muted-foreground">
                  Content scoring below this threshold will be flagged for testing
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statisticalConfidence">Statistical Confidence (%)</Label>
                <Input
                  id="statisticalConfidence"
                  type="number"
                  min={80}
                  max={99}
                  value={ruleForm.statisticalConfidence}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, statisticalConfidence: parseInt(e.target.value) || 95 })
                  }
                  data-testid="input-statistical-confidence"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="isActive"
                checked={ruleForm.isActive}
                onCheckedChange={(checked) => setRuleForm({ ...ruleForm, isActive: checked })}
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive">Rule is active</Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setEditingRule(null);
                  resetForm();
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={editingRule ? handleUpdate : handleCreate}
                disabled={
                  !ruleForm.name ||
                  !ruleForm.metricWeightProfileId ||
                  createRuleMutation.isPending ||
                  updateRuleMutation.isPending
                }
                data-testid="button-save-rule"
                className="w-full sm:w-auto"
              >
                {createRuleMutation.isPending || updateRuleMutation.isPending
                  ? "Saving..."
                  : editingRule
                  ? "Update Rule"
                  : "Create Rule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
