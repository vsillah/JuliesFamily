import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, Send, CheckCircle, XCircle, AlertCircle, Target, Plus, Eye } from "lucide-react";

interface Lead {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  jobTitle: string | null;
  qualificationScore: number | null;
  qualificationStatus: string;
  qualificationInsights: string | null;
  outreachStatus: string;
  persona: string;
  enrichmentData: any;
}

interface ICPCriterion {
  id: string;
  name: string;
  category: string;
  description: string;
  weight: number;
}

export default function AdminLeadSourcing() {
  const { toast } = useToast();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [outreachFilter, setOutreachFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showICPDialog, setShowICPDialog] = useState(false);
  const [newICPCriterion, setNewICPCriterion] = useState({
    name: "",
    category: "industry",
    description: "",
    weight: 5,
  });

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/admin/leads'],
  });

  const { data: icpCriteria = [] } = useQuery<ICPCriterion[]>({
    queryKey: ['/api/admin/icp-criteria'],
  });

  const qualifyLeadsMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      return await apiRequest('/api/admin/leads/qualify', {
        method: 'POST',
        body: { leadIds },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/leads'] });
      setSelectedLeads([]);
      toast({
        title: "Leads Qualified",
        description: "Selected leads have been qualified successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Qualification Failed",
        description: error.message || "Failed to qualify leads",
        variant: "destructive",
      });
    },
  });

  const generateOutreachMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return await apiRequest(`/api/admin/leads/${leadId}/generate-outreach`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/leads'] });
      toast({
        title: "Outreach Generated",
        description: "Outreach email has been generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate outreach email",
        variant: "destructive",
      });
    },
  });

  const bulkGenerateOutreachMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      const promises = leadIds.map(id =>
        apiRequest(`/api/admin/leads/${id}/generate-outreach`, { method: 'POST' })
      );
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/leads'] });
      setSelectedLeads([]);
      toast({
        title: "Outreach Generated",
        description: "Outreach emails generated for selected leads",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate outreach emails",
        variant: "destructive",
      });
    },
  });

  const createICPMutation = useMutation({
    mutationFn: async (data: typeof newICPCriterion) => {
      return await apiRequest('/api/admin/icp-criteria', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/icp-criteria'] });
      setShowICPDialog(false);
      setNewICPCriterion({ name: "", category: "industry", description: "", weight: 5 });
      toast({
        title: "ICP Criterion Created",
        description: "New criterion has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create ICP criterion",
        variant: "destructive",
      });
    },
  });

  const deleteICPMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/icp-criteria/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/icp-criteria'] });
      toast({
        title: "ICP Criterion Deleted",
        description: "Criterion has been removed successfully",
      });
    },
  });

  const updateOutreachStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      return await apiRequest(`/api/admin/leads/${leadId}/outreach-status`, {
        method: 'PATCH',
        body: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/leads'] });
      toast({
        title: "Status Updated",
        description: "Outreach status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update outreach status",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateOutreachStatusMutation = useMutation({
    mutationFn: async ({ leadIds, status }: { leadIds: string[]; status: string }) => {
      return await apiRequest('/api/admin/leads/bulk-outreach-status', {
        method: 'PATCH',
        body: { leadIds, status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/leads'] });
      setSelectedLeads([]);
      toast({
        title: "Status Updated",
        description: "Outreach status updated for selected leads",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to bulk update outreach status",
        variant: "destructive",
      });
    },
  });

  const filteredLeads = leads.filter(lead => {
    if (statusFilter !== "all" && lead.qualificationStatus !== statusFilter) return false;
    if (outreachFilter !== "all" && lead.outreachStatus !== outreachFilter) return false;
    
    if (minScore && lead.qualificationScore !== null && lead.qualificationScore < parseFloat(minScore)) {
      return false;
    }
    if (maxScore && lead.qualificationScore !== null && lead.qualificationScore > parseFloat(maxScore)) {
      return false;
    }
    
    return true;
  });

  const getStatusBadge = (status: string, score?: number | null) => {
    if (status === "qualified") {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600" data-testid={`badge-qualified`}>
          <CheckCircle className="w-3 h-3 mr-1" />
          Qualified {score ? `(${score})` : ''}
        </Badge>
      );
    }
    if (status === "disqualified") {
      return (
        <Badge variant="destructive" data-testid={`badge-disqualified`}>
          <XCircle className="w-3 h-3 mr-1" />
          Disqualified
        </Badge>
      );
    }
    if (status === "review_needed") {
      return (
        <Badge variant="secondary" data-testid={`badge-review-needed`}>
          <AlertCircle className="w-3 h-3 mr-1" />
          Review Needed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" data-testid={`badge-pending`}>
        <Target className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const getOutreachBadge = (status: string) => {
    if (status === "sent") {
      return <Badge variant="default" data-testid={`badge-outreach-sent`}>Sent</Badge>;
    }
    if (status === "draft_ready") {
      return <Badge variant="secondary" data-testid={`badge-outreach-draft`}>Draft Ready</Badge>;
    }
    return <Badge variant="outline" data-testid={`badge-outreach-pending`}>Pending</Badge>;
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelect = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  const qualifiedCount = leads.filter(l => l.qualificationStatus === "qualified").length;
  const pendingCount = leads.filter(l => l.qualificationStatus === "pending").length;
  const needsOutreachCount = leads.filter(
    l => l.qualificationStatus === "qualified" && 
    (l.outreachStatus === "pending" || l.outreachStatus === "draft_ready")
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-lead-sourcing">Lead Sourcing</h1>
          <p className="text-muted-foreground">AI-powered lead qualification and outreach management</p>
        </div>
        <Dialog open={showICPDialog} onOpenChange={setShowICPDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-manage-icp">
              <Target className="w-4 h-4 mr-2" />
              Manage ICP Criteria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ICP Criteria Management</DialogTitle>
              <DialogDescription>
                Define criteria for qualifying ideal customer profiles
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Add New Criterion</h3>
                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="icp-name">Name</Label>
                    <Input
                      id="icp-name"
                      value={newICPCriterion.name}
                      onChange={(e) => setNewICPCriterion({ ...newICPCriterion, name: e.target.value })}
                      placeholder="e.g., Enterprise Company Size"
                      data-testid="input-icp-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="icp-category">Category</Label>
                    <Select
                      value={newICPCriterion.category}
                      onValueChange={(value) => setNewICPCriterion({ ...newICPCriterion, category: value })}
                    >
                      <SelectTrigger id="icp-category" data-testid="select-icp-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="industry">Industry</SelectItem>
                        <SelectItem value="company_size">Company Size</SelectItem>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="role">Role/Title</SelectItem>
                        <SelectItem value="geography">Geography</SelectItem>
                        <SelectItem value="technology">Technology Stack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="icp-description">Description</Label>
                    <Textarea
                      id="icp-description"
                      value={newICPCriterion.description}
                      onChange={(e) => setNewICPCriterion({ ...newICPCriterion, description: e.target.value })}
                      placeholder="Describe what qualifies as a match..."
                      data-testid="textarea-icp-description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="icp-weight">Weight (1-10)</Label>
                    <Input
                      id="icp-weight"
                      type="number"
                      min="1"
                      max="10"
                      value={newICPCriterion.weight}
                      onChange={(e) => setNewICPCriterion({ ...newICPCriterion, weight: parseInt(e.target.value) || 5 })}
                      data-testid="input-icp-weight"
                    />
                  </div>
                  <Button
                    onClick={() => createICPMutation.mutate(newICPCriterion)}
                    disabled={!newICPCriterion.name || !newICPCriterion.description || createICPMutation.isPending}
                    data-testid="button-create-icp"
                  >
                    {createICPMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Criterion
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Current Criteria ({icpCriteria.length})</h3>
                {icpCriteria.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No criteria defined yet</p>
                ) : (
                  <div className="space-y-2">
                    {icpCriteria.map((criterion: ICPCriterion) => (
                      <Card key={criterion.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{criterion.name}</h4>
                                <Badge variant="outline">{criterion.category}</Badge>
                                <Badge variant="secondary">Weight: {criterion.weight}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{criterion.description}</p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteICPMutation.mutate(criterion.id)}
                              data-testid={`button-delete-icp-${criterion.id}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-leads">{leads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Qualification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-leads">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-qualified-leads">{qualifiedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Needs Outreach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-needs-outreach">{needsOutreachCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <CardTitle>Leads</CardTitle>
              <CardDescription>Manage and qualify your lead pipeline</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="Qualification Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="disqualified">Disqualified</SelectItem>
                  <SelectItem value="review_needed">Review Needed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={outreachFilter} onValueChange={setOutreachFilter}>
                <SelectTrigger className="w-48" data-testid="select-outreach-filter">
                  <SelectValue placeholder="Outreach Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outreach</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="draft_ready">Draft Ready</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Min Score"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                  className="w-28"
                  data-testid="input-min-score"
                />
                <Input
                  type="number"
                  placeholder="Max Score"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  className="w-28"
                  data-testid="input-max-score"
                />
              </div>
            </div>
          </div>
          
          {selectedLeads.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                onClick={() => qualifyLeadsMutation.mutate(selectedLeads)}
                disabled={qualifyLeadsMutation.isPending}
                data-testid="button-bulk-qualify"
              >
                {qualifyLeadsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Target className="w-4 h-4 mr-2" />
                )}
                Qualify {selectedLeads.length}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => bulkGenerateOutreachMutation.mutate(selectedLeads)}
                disabled={bulkGenerateOutreachMutation.isPending}
                data-testid="button-bulk-outreach"
              >
                {bulkGenerateOutreachMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Generate Outreach ({selectedLeads.length})
              </Button>
              
              <Button
                variant="outline"
                onClick={() => bulkUpdateOutreachStatusMutation.mutate({ leadIds: selectedLeads, status: 'draft_ready' })}
                disabled={bulkUpdateOutreachStatusMutation.isPending}
                data-testid="button-bulk-mark-draft"
              >
                {bulkUpdateOutreachStatusMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Mark Draft Ready
              </Button>
              
              <Button
                variant="outline"
                onClick={() => bulkUpdateOutreachStatusMutation.mutate({ leadIds: selectedLeads, status: 'sent' })}
                disabled={bulkUpdateOutreachStatusMutation.isPending}
                data-testid="button-bulk-mark-sent"
              >
                {bulkUpdateOutreachStatusMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Mark Sent
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No leads found matching the current filters
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === filteredLeads.length}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Outreach</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={() => toggleSelect(lead.id)}
                        data-testid={`checkbox-lead-${lead.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-name-${lead.id}`}>
                      {lead.firstName} {lead.lastName}
                    </TableCell>
                    <TableCell data-testid={`text-email-${lead.id}`}>{lead.email}</TableCell>
                    <TableCell data-testid={`text-company-${lead.id}`}>{lead.company || '-'}</TableCell>
                    <TableCell data-testid={`text-title-${lead.id}`}>{lead.jobTitle || '-'}</TableCell>
                    <TableCell>
                      {getStatusBadge(lead.qualificationStatus, lead.qualificationScore)}
                    </TableCell>
                    <TableCell>
                      {getOutreachBadge(lead.outreachStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedLead(lead)}
                              data-testid={`button-view-${lead.id}`}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Lead Details</DialogTitle>
                            </DialogHeader>
                            {selectedLead && (
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-semibold mb-2">Contact Information</h3>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-muted-foreground">Name:</span> {selectedLead.firstName} {selectedLead.lastName}</div>
                                    <div><span className="text-muted-foreground">Email:</span> {selectedLead.email}</div>
                                    <div><span className="text-muted-foreground">Company:</span> {selectedLead.company || 'N/A'}</div>
                                    <div><span className="text-muted-foreground">Title:</span> {selectedLead.jobTitle || 'N/A'}</div>
                                  </div>
                                </div>
                                
                                {selectedLead.qualificationInsights && (
                                  <div>
                                    <h3 className="font-semibold mb-2">AI Qualification Insights</h3>
                                    <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                                      {selectedLead.qualificationInsights}
                                    </div>
                                  </div>
                                )}
                                
                                {selectedLead.enrichmentData && (
                                  <div>
                                    <h3 className="font-semibold mb-2">Enrichment Data</h3>
                                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                                      {JSON.stringify(selectedLead.enrichmentData, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                
                                <div>
                                  <h3 className="font-semibold mb-2">Outreach Actions</h3>
                                  <div className="flex gap-2 flex-wrap">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateOutreachStatusMutation.mutate({ leadId: selectedLead.id, status: 'pending' })}
                                      disabled={updateOutreachStatusMutation.isPending}
                                      data-testid={`button-status-pending-${selectedLead.id}`}
                                    >
                                      Mark Pending
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateOutreachStatusMutation.mutate({ leadId: selectedLead.id, status: 'draft_ready' })}
                                      disabled={updateOutreachStatusMutation.isPending}
                                      data-testid={`button-status-draft-${selectedLead.id}`}
                                    >
                                      Mark Draft Ready
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => updateOutreachStatusMutation.mutate({ leadId: selectedLead.id, status: 'sent' })}
                                      disabled={updateOutreachStatusMutation.isPending}
                                      data-testid={`button-status-sent-${selectedLead.id}`}
                                    >
                                      <Send className="w-3 h-3 mr-1" />
                                      Mark Sent
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {lead.qualificationStatus === "qualified" && 
                         (lead.outreachStatus === "pending" || !lead.outreachStatus) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateOutreachMutation.mutate(lead.id)}
                            disabled={generateOutreachMutation.isPending}
                            data-testid={`button-generate-${lead.id}`}
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Generate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {icpCriteria.length === 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100">
              <AlertCircle className="w-5 h-5 inline mr-2" />
              No ICP Criteria Configured
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-200">
              Set up Ideal Customer Profile (ICP) criteria to enable AI-powered lead qualification.
              Click "Manage ICP Criteria" above to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
