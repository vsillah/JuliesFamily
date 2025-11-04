import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ContentItem } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, GripVertical, Eye, EyeOff } from "lucide-react";

export default function AdminContentManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("service");
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    type: "service",
    title: "",
    description: "",
    imageName: "",
    metadata: {} as any
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/service"],
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/event"],
  });

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/testimonial"],
  });

  const { data: leadMagnets = [], isLoading: leadMagnetsLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/lead_magnet"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ContentItem> }) => {
      return apiRequest("PATCH", `/api/content/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.startsWith("/api/content/type");
        }
      });
      toast({
        title: "Success",
        description: "Content updated successfully",
      });
      setEditingItem(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      return apiRequest("POST", "/api/content", item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.startsWith("/api/content/type");
        }
      });
      toast({
        title: "Success",
        description: "Content created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewItem({
        type: "service",
        title: "",
        description: "",
        imageName: "",
        metadata: {}
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create content",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/content/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.startsWith("/api/content/type");
        }
      });
      toast({
        title: "Success",
        description: "Content deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/content/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.startsWith("/api/content/type");
        }
      });
    },
  });

  const handleSaveEdit = () => {
    if (!editingItem) return;
    updateMutation.mutate({
      id: editingItem.id,
      updates: {
        title: editingItem.title,
        description: editingItem.description,
        imageName: editingItem.imageName,
        metadata: editingItem.metadata
      }
    });
  };

  const handleCreate = () => {
    createMutation.mutate(newItem);
  };

  const renderContentList = (items: ContentItem[], type: string) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>No {type}s found. Create your first one!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className={item.isActive ? "" : "opacity-60"}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 cursor-move hover-elevate p-2 rounded" data-testid={`drag-handle-${item.id}`}>
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1" data-testid={`text-title-${item.id}`}>
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-description-${item.id}`}>
                          {item.description}
                        </p>
                      )}
                      {item.imageName && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Image: <span className="font-mono">{item.imageName}</span>
                        </p>
                      )}
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          <span className="font-medium">Metadata:</span> {JSON.stringify(item.metadata, null, 2).substring(0, 100)}...
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActiveMutation.mutate({ id: item.id, isActive: !item.isActive })}
                        data-testid={`button-toggle-active-${item.id}`}
                      >
                        {item.isActive ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingItem(item)}
                        data-testid={`button-edit-${item.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">Content Manager</h1>
          <p className="text-muted-foreground">
            Manage all website content including services, events, testimonials, and lead magnets
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="service" data-testid="tab-services">Services ({services.length})</TabsTrigger>
              <TabsTrigger value="event" data-testid="tab-events">Events ({events.length})</TabsTrigger>
              <TabsTrigger value="testimonial" data-testid="tab-testimonials">Testimonials ({testimonials.length})</TabsTrigger>
              <TabsTrigger value="lead_magnet" data-testid="tab-lead-magnets">Lead Magnets ({leadMagnets.length})</TabsTrigger>
            </TabsList>
            
            <Button
              onClick={() => {
                setNewItem({ ...newItem, type: activeTab });
                setIsCreateDialogOpen(true);
              }}
              data-testid="button-create-new"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </div>

          <TabsContent value="service">
            {servicesLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderContentList(services, "service")
            )}
          </TabsContent>

          <TabsContent value="event">
            {eventsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderContentList(events, "event")
            )}
          </TabsContent>

          <TabsContent value="testimonial">
            {testimonialsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderContentList(testimonials, "testimonial")
            )}
          </TabsContent>

          <TabsContent value="lead_magnet">
            {leadMagnetsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderContentList(leadMagnets, "lead magnet")
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-content">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription>Make changes to the content item</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  data-testid="input-edit-title"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={4}
                  data-testid="input-edit-description"
                />
              </div>
              <div>
                <Label htmlFor="edit-image">Image Name (Cloudinary)</Label>
                <Input
                  id="edit-image"
                  value={editingItem.imageName || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, imageName: e.target.value })}
                  placeholder="e.g., service-children"
                  data-testid="input-edit-image"
                />
              </div>
              <div>
                <Label htmlFor="edit-metadata">Metadata (JSON)</Label>
                <Textarea
                  id="edit-metadata"
                  value={JSON.stringify(editingItem.metadata || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditingItem({ ...editingItem, metadata: JSON.parse(e.target.value) });
                    } catch {}
                  }}
                  rows={6}
                  className="font-mono text-sm"
                  data-testid="input-edit-metadata"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingItem.isActive}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, isActive: checked })}
                  data-testid="switch-edit-active"
                />
                <Label>Active (visible on website)</Label>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setEditingItem(null)} data-testid="button-cancel-edit">
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateMutation.isPending} data-testid="button-save-edit">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-content">
          <DialogHeader>
            <DialogTitle>Create New Content</DialogTitle>
            <DialogDescription>Add a new {activeTab.replace("_", " ")} to your website</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-title">Title</Label>
              <Input
                id="create-title"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                placeholder="Enter title"
                data-testid="input-create-title"
              />
            </div>
            <div>
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                rows={4}
                placeholder="Enter description"
                data-testid="input-create-description"
              />
            </div>
            <div>
              <Label htmlFor="create-image">Image Name (Cloudinary)</Label>
              <Input
                id="create-image"
                value={newItem.imageName}
                onChange={(e) => setNewItem({ ...newItem, imageName: e.target.value })}
                placeholder="e.g., service-children"
                data-testid="input-create-image"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-create">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !newItem.title} data-testid="button-submit-create">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
