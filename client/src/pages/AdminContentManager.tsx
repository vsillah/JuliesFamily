import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ContentItem, ImageAsset, ContentVisibility, AbTest } from "@shared/schema";
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
import { Pencil, Trash2, Plus, GripVertical, Eye, EyeOff, Image as ImageIcon, Upload, X, Grid3x3 } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import PersonaMatrixGrid from "@/components/PersonaMatrixGrid";

export default function AdminContentManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("service");
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [matrixConfigItem, setMatrixConfigItem] = useState<ContentItem | null>(null);
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

  const { data: heroContent = [], isLoading: heroLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/hero"],
  });

  const { data: ctaContent = [], isLoading: ctaLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/cta"],
  });

  const { data: images = [] } = useQuery<ImageAsset[]>({
    queryKey: ["/api/admin/images"],
  });

  // Fetch all visibility settings for matrix view
  const { data: allVisibilitySettings = [] } = useQuery<ContentVisibility[]>({
    queryKey: ["/api/content/visibility"],
    enabled: activeTab === "matrix",
  });

  // Fetch all A/B tests for matrix view
  const { data: allAbTests = [] } = useQuery<AbTest[]>({
    queryKey: ["/api/admin/ab-tests"],
    enabled: activeTab === "matrix",
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

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

  const uploadImageMutation = useMutation<ImageAsset, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/admin/images/upload", formData);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/images"] });
      toast({
        title: "Image uploaded",
        description: "Image has been successfully uploaded.",
      });
      if (editingItem) {
        setEditingItem({ ...editingItem, imageName: data.name });
      } else {
        setNewItem({ ...newItem, imageName: data.name });
      }
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      setUploadingImage(false);
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      setUploadingImage(false);
    },
  });

  const handleQuickImageUpload = async (file: File, type: string) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append("image", file);
    formData.append("name", file.name.replace(/\.[^/.]+$/, ""));
    formData.append("usage", type);
    
    setUploadingImage(true);
    uploadImageMutation.mutate(formData);
  };

  const getImageUrl = (imageName: string | null) => {
    if (!imageName) return null;
    const image = images.find(img => img.name === imageName);
    return image?.cloudinarySecureUrl || null;
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
                
                {getImageUrl(item.imageName) && (
                  <div className="flex-shrink-0">
                    <img 
                      src={getImageUrl(item.imageName)!} 
                      alt={item.title}
                      className="w-24 h-24 object-cover rounded border border-border"
                    />
                  </div>
                )}
                
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
                      {item.imageName && item.imageName.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          <span className="font-mono">{item.imageName}</span>
                        </p>
                      )}
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          <span className="font-medium">Metadata: </span>
                          <code className="text-xs">{JSON.stringify(item.metadata).substring(0, 100)}...</code>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMatrixConfigItem(item)}
                        data-testid={`button-configure-variants-${item.id}`}
                        title="Configure persona×stage variants"
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </Button>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        <Breadcrumbs items={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Content Manager" }]} />
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">Content Manager</h1>
          <p className="text-muted-foreground">
            Manage all website content including services, events, testimonials, and lead magnets
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="matrix" data-testid="tab-matrix">
                <Grid3x3 className="w-4 h-4 mr-2" />
                Matrix View
              </TabsTrigger>
              <TabsTrigger value="hero" data-testid="tab-hero">Hero ({heroContent.length})</TabsTrigger>
              <TabsTrigger value="cta" data-testid="tab-cta">CTA ({ctaContent.length})</TabsTrigger>
              <TabsTrigger value="service" data-testid="tab-services">Services ({services.length})</TabsTrigger>
              <TabsTrigger value="event" data-testid="tab-events">Events ({events.length})</TabsTrigger>
              <TabsTrigger value="testimonial" data-testid="tab-testimonials">Testimonials ({testimonials.length})</TabsTrigger>
              <TabsTrigger value="lead_magnet" data-testid="tab-lead-magnets">Lead Magnets ({leadMagnets.length})</TabsTrigger>
            </TabsList>
            
            {activeTab !== "matrix" && (
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
            )}
          </div>

          <TabsContent value="matrix">
            <Card>
              <CardHeader>
                <CardTitle>Persona × Journey Stage Matrix</CardTitle>
                <CardDescription>
                  Configure content for all persona and funnel stage combinations. Click any card to edit.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-md">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  <span>Scroll horizontally to see all personas</span>
                </div>
                <PersonaMatrixGrid
                  contentItems={{
                    hero: heroContent,
                    cta: ctaContent,
                    service: services,
                    event: events,
                    testimonial: testimonials,
                    lead_magnet: leadMagnets,
                  }}
                  visibilitySettings={allVisibilitySettings}
                  images={images}
                  abTests={allAbTests}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hero">
            {heroLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderContentList(heroContent, "hero")
            )}
          </TabsContent>

          <TabsContent value="cta">
            {ctaLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderContentList(ctaContent, "cta")
            )}
          </TabsContent>

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
              <div className="space-y-3">
                <Label>Image</Label>
                
                {/* Image Preview */}
                {getImageUrl(editingItem.imageName) && (
                  <div className="relative inline-block">
                    <img 
                      src={getImageUrl(editingItem.imageName)!} 
                      alt="Preview"
                      className="w-full max-w-sm h-48 object-cover rounded border border-border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setEditingItem({ ...editingItem, imageName: null })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                {/* Image Selector */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={editingItem.imageName || "none"}
                      onValueChange={(value) => setEditingItem({ ...editingItem, imageName: value === "none" ? null : value })}
                    >
                      <SelectTrigger data-testid="select-edit-image">
                        <SelectValue placeholder="Select an existing image..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No image</SelectItem>
                        {images.map((img) => (
                          <SelectItem key={img.id} value={img.name}>
                            {img.name} ({img.usage})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Quick Upload */}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleQuickImageUpload(file, editingItem.type);
                      }}
                      className="hidden"
                      id="quick-upload-edit"
                      disabled={uploadingImage}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('quick-upload-edit')?.click()}
                      disabled={uploadingImage}
                      data-testid="button-upload-image-edit"
                    >
                      {uploadingImage ? (
                        "Uploading..."
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              {/* Hero/CTA specific fields */}
              {(editingItem.type === 'hero' || editingItem.type === 'cta') && (
                <>
                  <div>
                    <Label htmlFor="edit-persona">Persona</Label>
                    <Select
                      value={(editingItem.metadata as any)?.persona || "donor"}
                      onValueChange={(value) => setEditingItem({ ...editingItem, metadata: { ...(editingItem.metadata as any || {}), persona: value } })}
                    >
                      <SelectTrigger id="edit-persona" data-testid="select-edit-persona">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Adult Education Student</SelectItem>
                        <SelectItem value="provider">Service Provider</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="donor">Donor</SelectItem>
                        <SelectItem value="volunteer">Volunteer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {editingItem.type === 'hero' && (
                    <div>
                      <Label htmlFor="edit-subtitle">Subtitle</Label>
                      <Input
                        id="edit-subtitle"
                        value={(editingItem.metadata as any)?.subtitle || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, metadata: { ...(editingItem.metadata as any || {}), subtitle: e.target.value } })}
                        placeholder="– Julie's Mission –"
                        data-testid="input-edit-subtitle"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="edit-primary-button">Primary Button Text</Label>
                    <Input
                      id="edit-primary-button"
                      value={(editingItem.metadata as any)?.primaryButton || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, metadata: { ...(editingItem.metadata as any || {}), primaryButton: e.target.value } })}
                      placeholder="Donate Now"
                      data-testid="input-edit-primary-button"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-secondary-button">Secondary Button Text</Label>
                    <Input
                      id="edit-secondary-button"
                      value={(editingItem.metadata as any)?.secondaryButton || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, metadata: { ...(editingItem.metadata as any || {}), secondaryButton: e.target.value } })}
                      placeholder="Learn More"
                      data-testid="input-edit-secondary-button"
                    />
                  </div>
                </>
              )}
              
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
                  checked={editingItem.isActive ?? true}
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
            <div className="space-y-3">
              <Label>Image</Label>
              
              {/* Image Preview */}
              {getImageUrl(newItem.imageName) && (
                <div className="relative inline-block">
                  <img 
                    src={getImageUrl(newItem.imageName)!} 
                    alt="Preview"
                    className="w-full max-w-sm h-48 object-cover rounded border border-border"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => setNewItem({ ...newItem, imageName: "" })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {/* Image Selector */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={newItem.imageName || "none"}
                    onValueChange={(value) => setNewItem({ ...newItem, imageName: value === "none" ? "" : value })}
                  >
                    <SelectTrigger data-testid="select-create-image">
                      <SelectValue placeholder="Select an existing image..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No image</SelectItem>
                      {images.map((img) => (
                        <SelectItem key={img.id} value={img.name}>
                          {img.name} ({img.usage})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Quick Upload */}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleQuickImageUpload(file, newItem.type);
                    }}
                    className="hidden"
                    id="quick-upload-create"
                    disabled={uploadingImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('quick-upload-create')?.click()}
                    disabled={uploadingImage}
                    data-testid="button-upload-image-create"
                  >
                    {uploadingImage ? (
                      "Uploading..."
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Hero/CTA specific fields for create */}
            {(activeTab === 'hero' || activeTab === 'cta') && (
              <>
                <div>
                  <Label htmlFor="create-persona">Persona</Label>
                  <Select
                    value={(newItem.metadata as any)?.persona || "donor"}
                    onValueChange={(value) => setNewItem({ ...newItem, metadata: { ...(newItem.metadata as any || {}), persona: value } })}
                  >
                    <SelectTrigger id="create-persona" data-testid="select-create-persona">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Adult Education Student</SelectItem>
                      <SelectItem value="provider">Service Provider</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="donor">Donor</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {activeTab === 'hero' && (
                  <div>
                    <Label htmlFor="create-subtitle">Subtitle</Label>
                    <Input
                      id="create-subtitle"
                      value={(newItem.metadata as any)?.subtitle || ""}
                      onChange={(e) => setNewItem({ ...newItem, metadata: { ...(newItem.metadata as any || {}), subtitle: e.target.value } })}
                      placeholder="– Julie's Mission –"
                      data-testid="input-create-subtitle"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="create-primary-button">Primary Button Text</Label>
                  <Input
                    id="create-primary-button"
                    value={(newItem.metadata as any)?.primaryButton || ""}
                    onChange={(e) => setNewItem({ ...newItem, metadata: { ...(newItem.metadata as any || {}), primaryButton: e.target.value } })}
                    placeholder="Donate Now"
                    data-testid="input-create-primary-button"
                  />
                </div>
                
                <div>
                  <Label htmlFor="create-secondary-button">Secondary Button Text</Label>
                  <Input
                    id="create-secondary-button"
                    value={(newItem.metadata as any)?.secondaryButton || ""}
                    onChange={(e) => setNewItem({ ...newItem, metadata: { ...(newItem.metadata as any || {}), secondaryButton: e.target.value } })}
                    placeholder="Learn More"
                    data-testid="input-create-secondary-button"
                  />
                </div>
              </>
            )}
            
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

      {matrixConfigItem && (
        <MatrixConfigDialog
          contentItem={matrixConfigItem}
          open={!!matrixConfigItem}
          onOpenChange={(open) => !open && setMatrixConfigItem(null)}
        />
      )}
    </div>
  );
}
