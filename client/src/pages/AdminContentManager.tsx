import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ContentItem, ImageAsset, ContentVisibility, AbTest, GoogleReview } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, GripVertical, Eye, EyeOff, Image as ImageIcon, Upload, X, Grid3x3, Filter, Info, Instagram, Facebook, Linkedin, Video as VideoIcon } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import PersonaMatrixGrid from "@/components/PersonaMatrixGrid";
import ContentUsageIndicator from "@/components/ContentUsageIndicator";
import ConsolidatedVisibilityBadge from "@/components/ConsolidatedVisibilityBadge";
import { PERSONAS, FUNNEL_STAGES, PERSONA_LABELS, FUNNEL_STAGE_LABELS, type Persona, type FunnelStage } from "@shared/defaults/personas";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
function SortableContentCard({ item, onToggleActive, onEdit, onDelete, getImageUrl }: {
  item: ContentItem;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getImageUrl: (name: string | null) => string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`w-full max-w-full ${!item.isActive ? "border-2 border-dashed border-muted-foreground/30 bg-muted/20" : ""}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 cursor-move hover-elevate p-2 rounded"
            data-testid={`drag-handle-${item.id}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>

          {getImageUrl(item.imageName) && (
            <div className="flex-shrink-0">
              <img
                src={getImageUrl(item.imageName)!}
                alt={item.title}
                className={`w-24 h-24 object-cover rounded border border-border ${!item.isActive ? "opacity-50" : ""}`}
              />
            </div>
          )}

          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className={`font-semibold text-lg mb-2 break-normal ${!item.isActive ? "text-muted-foreground" : ""}`} data-testid={`text-title-${item.id}`}>
                  {item.title}
                </h3>
                
                <ConsolidatedVisibilityBadge contentId={item.id} isActive={item.isActive} />
                
                {item.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2 break-normal" data-testid={`text-description-${item.id}`}>
                    {item.description}
                  </p>
                )}
                
                <ContentUsageIndicator contentId={item.id} />
                
                {/* Platform indicator for social media posts */}
                {item.type === 'socialMedia' && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {((item.metadata as any)?.platform ?? 'instagram') === 'facebook' ? (
                        <>
                          <Facebook className="w-3 h-3 mr-1" />
                          Facebook
                        </>
                      ) : ((item.metadata as any)?.platform === 'linkedin') ? (
                        <>
                          <Linkedin className="w-3 h-3 mr-1" />
                          LinkedIn
                        </>
                      ) : (
                        <>
                          <Instagram className="w-3 h-3 mr-1" />
                          Instagram
                        </>
                      )}
                    </Badge>
                  </div>
                )}
                
                {/* Category indicator for videos */}
                {item.type === 'video' && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Badge variant="outline" className="text-xs">
                      <VideoIcon className="w-3 h-3 mr-1" />
                      {((item.metadata as any)?.category === 'virtual_tour') ? 'Virtual Tour' : 
                       ((item.metadata as any)?.category === 'program_highlight') ? 'Program Highlight' : 
                       'Student Story'}
                    </Badge>
                    {(item.metadata as any)?.videoId && (
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        ID: {(item.metadata as any)?.videoId}
                      </code>
                    )}
                  </div>
                )}
                
                {item.imageName && item.imageName.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 flex-wrap">
                    <ImageIcon className="w-3 h-3 flex-shrink-0" />
                    <span className="font-mono break-all">{item.imageName}</span>
                  </p>
                )}
                {item.metadata && typeof item.metadata === 'object' && item.metadata !== null && Object.keys(item.metadata as Record<string, any>).length > 0 ? (
                  <div className="text-xs text-muted-foreground mt-2">
                    <span className="font-medium">Metadata: </span>
                    <code className="text-xs break-all">{JSON.stringify(item.metadata).substring(0, 100)}...</code>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onToggleActive}
                  data-testid={`button-toggle-active-${item.id}`}
                  aria-label={item.isActive ? "Hide from website" : "Show on website"}
                  aria-pressed={!!item.isActive}
                  title={item.isActive ? "Hide from website" : "Show on website"}
                  className="gap-1.5"
                >
                  {item.isActive ? (
                    <>
                      <EyeOff className="w-4 h-4" data-testid={`icon-action-hide-${item.id}`} />
                      <span className="hidden sm:inline">Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" data-testid={`icon-action-show-${item.id}`} />
                      <span className="hidden sm:inline">Show</span>
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEdit}
                  data-testid={`button-edit-${item.id}`}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
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
  );
}

export default function AdminContentManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("matrix");
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    type: "service",
    title: "",
    description: "",
    imageName: "",
    metadata: {} as any
  });
  const [newItemPersona, setNewItemPersona] = useState<Persona | "">(""); 
  const [newItemFunnelStage, setNewItemFunnelStage] = useState<FunnelStage | "">(""); 
  const [editItemPersona, setEditItemPersona] = useState<Persona | "">(""); 
  const [editItemFunnelStage, setEditItemFunnelStage] = useState<FunnelStage | "">("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  
  // Multi-select state for lead magnet visibility
  const [selectedLeadMagnetCombos, setSelectedLeadMagnetCombos] = useState<Set<string>>(new Set());
  
  // Helper to create combo key from persona and stage
  const getComboKey = (persona: Persona, stage: FunnelStage) => `${persona}:${stage}`;

  const { data: services = [], isLoading: servicesLoading} = useQuery<ContentItem[]>({
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

  const { data: socialMediaPosts = [], isLoading: socialMediaLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/socialMedia"],
  });

  const { data: videos = [], isLoading: videosLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/video"],
  });

  const { data: googleReviews = [], isLoading: googleReviewsLoading } = useQuery<GoogleReview[]>({
    queryKey: ["/api/google-reviews/all"],
  });

  const { data: images = [] } = useQuery<ImageAsset[]>({
    queryKey: ["/api/admin/images"],
  });

  // Fetch all visibility settings for matrix view
  const { data: allVisibilitySettings = [] } = useQuery<ContentVisibility[]>({
    queryKey: ["/api/content/visibility"],
    enabled: activeTab === "matrix",
  });
  
  // Load visibility settings when editing any content item
  useEffect(() => {
    if (editingItem?.id) {
      // Find all visibility records for this content item
      const visibilityForItem = allVisibilitySettings.filter(v => v.contentItemId === editingItem.id);
      const combos = new Set<string>();
      visibilityForItem.forEach(v => {
        if (v.persona && v.funnelStage) {
          combos.add(getComboKey(v.persona as Persona, v.funnelStage as FunnelStage));
        }
      });
      setSelectedLeadMagnetCombos(combos);
    } else if (!editingItem) {
      // Reset when closing dialog
      setSelectedLeadMagnetCombos(new Set());
    }
  }, [editingItem, allVisibilitySettings]);

  // Fetch all A/B tests for matrix view
  const { data: allAbTests = [] } = useQuery<AbTest[]>({
    queryKey: ["/api/admin/ab-tests"],
    enabled: activeTab === "matrix",
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Load existing persona×journey assignments when editing
  useEffect(() => {
    if (editingItem) {
      const currentItemId = editingItem.id;
      const controller = new AbortController();
      
      // Fetch existing assignments
      fetch(`/api/content/${currentItemId}/usage`, { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          // Verify this response is still for the current item
          if (editingItem?.id === currentItemId) {
            if (data.visibilityAssignments && data.visibilityAssignments.length > 0) {
              const firstAssignment = data.visibilityAssignments[0];
              setEditItemPersona(firstAssignment.persona || "");
              setEditItemFunnelStage(firstAssignment.funnelStage || "");
            } else {
              // Reset if no assignments
              setEditItemPersona("");
              setEditItemFunnelStage("");
            }
          }
        })
        .catch(err => {
          // Ignore abort errors
          if (err.name !== 'AbortError') {
            console.error("Error loading assignments:", err);
            if (editingItem?.id === currentItemId) {
              setEditItemPersona("");
              setEditItemFunnelStage("");
            }
          }
        });
      
      return () => controller.abort();
    } else {
      // Reset when dialog closes
      setEditItemPersona("");
      setEditItemFunnelStage("");
    }
  }, [editingItem]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ContentItem> }) => {
      return apiRequest("PATCH", `/api/content/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.startsWith("/api/content/type") || key?.startsWith("/api/content/") && key?.includes("/usage");
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content/visibility"] });
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
          return key?.startsWith("/api/content/type") || key?.startsWith("/api/content/") && key?.includes("/usage");
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content/visibility"] });
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
          return key?.startsWith("/api/content/type") || key?.startsWith("/api/content/") && key?.includes("/usage");
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content/visibility"] });
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

  const toggleGoogleReviewActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/google-reviews/${id}/visibility`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/google-reviews/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/google-reviews"] });
    },
  });

  const handleSaveEdit = () => {
    if (!editingItem) return;
    
    let metadata = editingItem.metadata;
    
    if (editingItem.type === 'socialMedia') {
      metadata = { ...(editingItem.metadata || {}), platform: (editingItem.metadata as any)?.platform || 'instagram' };
    } else if (editingItem.type === 'video') {
      metadata = { 
        ...(editingItem.metadata || {}), 
        videoId: (editingItem.metadata as any)?.videoId || '',
        category: (editingItem.metadata as any)?.category || 'student_story'
      };
    }
    
    const updates: any = {
      title: editingItem.title,
      description: editingItem.description,
      imageName: editingItem.imageName,
      isActive: editingItem.isActive,
      metadata
    };
    
    // Send visibility combinations for all content types
    const combos = Array.from(selectedLeadMagnetCombos).map(key => {
      const [persona, funnelStage] = key.split(':');
      return { persona, funnelStage };
    });
    updates.visibilityCombos = combos;
    
    updateMutation.mutate({
      id: editingItem.id,
      updates
    });
  };

  const handleCreate = () => {
    let itemToCreate = newItem;
    
    if (newItem.type === 'socialMedia') {
      itemToCreate = { ...newItem, metadata: { ...newItem.metadata, platform: (newItem.metadata as any)?.platform || 'instagram' } };
    } else if (newItem.type === 'video') {
      itemToCreate = { 
        ...newItem, 
        metadata: { 
          ...newItem.metadata, 
          videoId: (newItem.metadata as any)?.videoId || '',
          category: (newItem.metadata as any)?.category || 'student_story'
        } 
      };
    }
    
    const payload: any = itemToCreate;
    
    // Send visibility combinations for all content types
    const combos = Array.from(selectedLeadMagnetCombos).map(key => {
      const [persona, funnelStage] = key.split(':');
      return { persona, funnelStage };
    });
    payload.visibilityCombos = combos;
    
    createMutation.mutate(payload);
  };

  const handleCreateFromMatrix = (contentType: string, persona: Persona, stage: FunnelStage) => {
    // Reset newItem with the selected type
    setNewItem({
      type: contentType,
      title: "",
      description: "",
      imageName: "",
      metadata: contentType === 'socialMedia' ? { platform: 'instagram' } : contentType === 'video' ? { videoId: '', category: 'student_story' } : {}
    });
    
    // Pre-fill persona and journey stage
    setNewItemPersona(persona);
    setNewItemFunnelStage(stage);
    
    // Open create dialog
    setIsCreateDialogOpen(true);
    
    // Switch to the appropriate tab
    setActiveTab(contentType);
  };

  const handleScreenshotAnalysis = async (file: File, isEdit: boolean = false) => {
    setIsAnalyzing(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Convert to base64 for API
      const base64 = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.readAsDataURL(file);
      });

      const response = await apiRequest("POST", "/api/analyze-social-post", {
        imageBase64: base64,
      });
      const analysis = await response.json();

      // Auto-populate fields based on analysis
      if (isEdit && editingItem) {
        setEditingItem({
          ...editingItem,
          title: analysis.suggestedTitle || editingItem.title,
          description: analysis.caption || editingItem.description,
          metadata: {
            ...(editingItem.metadata || {}),
            platform: analysis.platform || 'instagram',
            link: analysis.suggestedLink || (editingItem.metadata as any)?.link || '',
          },
        });
      } else {
        setNewItem({
          ...newItem,
          title: analysis.suggestedTitle || newItem.title,
          description: analysis.caption || newItem.description,
          metadata: {
            ...(newItem.metadata || {}),
            platform: analysis.platform || 'instagram',
            link: analysis.suggestedLink || (newItem.metadata as any)?.link || '',
          },
        });
      }

      toast({
        title: "Analysis Complete",
        description: "Post details have been extracted from the screenshot. Please review and adjust as needed.",
      });
    } catch (error) {
      console.error("Screenshot analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the screenshot. Please fill in the details manually.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent, items: ContentItem[], type: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(items, oldIndex, newIndex);

      // Update order values
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        order: index,
      }));

      // Batch update the orders
      Promise.all(
        updates.map(({ id, order }) =>
          apiRequest("PATCH", `/api/content/${id}`, { order })
        )
      ).then(() => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key?.startsWith("/api/content/type");
          }
        });
        toast({
          title: "Order Updated",
          description: `${type} order has been saved`,
        });
      });
    }
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => handleDragEnd(event, items, type)}
      >
        <SortableContext
          items={items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {items.map((item) => (
              <SortableContentCard
                key={item.id}
                item={item}
                onToggleActive={() => toggleActiveMutation.mutate({ id: item.id, isActive: !item.isActive })}
                onEdit={() => setEditingItem(item)}
                onDelete={() => {
                  if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
                    deleteMutation.mutate(item.id);
                  }
                }}
                getImageUrl={getImageUrl}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Content Manager" }]} />
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">Content Manager</h1>
          <p className="text-muted-foreground">
            Manage all website content including services, events, testimonials, and lead magnets
          </p>
        </div>
      </div>

      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="px-4 sm:px-0">
                  <TabsList className="inline-flex">
                    <TabsTrigger value="matrix" data-testid="tab-matrix" className="whitespace-nowrap flex-shrink-0">
                      <Grid3x3 className="w-4 h-4 mr-2" />
                      Matrix View
                    </TabsTrigger>
                    <TabsTrigger value="hero" data-testid="tab-hero" className="whitespace-nowrap flex-shrink-0">Hero ({heroContent.length})</TabsTrigger>
                    <TabsTrigger value="cta" data-testid="tab-cta" className="whitespace-nowrap flex-shrink-0">CTA ({ctaContent.length})</TabsTrigger>
                    <TabsTrigger value="service" data-testid="tab-services" className="whitespace-nowrap flex-shrink-0">Services ({services.length})</TabsTrigger>
                    <TabsTrigger value="event" data-testid="tab-events" className="whitespace-nowrap flex-shrink-0">Events ({events.length})</TabsTrigger>
                    <TabsTrigger value="testimonial" data-testid="tab-testimonials" className="whitespace-nowrap flex-shrink-0">Testimonials ({testimonials.length})</TabsTrigger>
                    <TabsTrigger value="socialMedia" data-testid="tab-social-media" className="whitespace-nowrap flex-shrink-0">Social Media ({socialMediaPosts.length})</TabsTrigger>
                    <TabsTrigger value="video" data-testid="tab-videos" className="whitespace-nowrap flex-shrink-0">Videos ({videos.length})</TabsTrigger>
                    <TabsTrigger value="googleReviews" data-testid="tab-google-reviews" className="whitespace-nowrap flex-shrink-0">Google Reviews ({googleReviews.length})</TabsTrigger>
                    <TabsTrigger value="lead_magnet" data-testid="tab-lead-magnets" className="whitespace-nowrap flex-shrink-0">Lead Magnets ({leadMagnets.length})</TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-shrink-0">
                {activeTab !== "matrix" && activeTab !== "googleReviews" && (
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
            </div>
          </div>

          <TabsContent value="matrix" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="w-full">
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
                  <span>Scroll horizontally to see all funnel stages</span>
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
                  onCreateContent={handleCreateFromMatrix}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {heroLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderContentList(heroContent, "hero")
            )}
          </TabsContent>

          <TabsContent value="cta" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {ctaLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderContentList(ctaContent, "cta")
            )}
          </TabsContent>

          <TabsContent value="service" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {servicesLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderContentList(services, "service")
            )}
          </TabsContent>

          <TabsContent value="event" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {eventsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderContentList(events, "event")
            )}
          </TabsContent>

          <TabsContent value="testimonial" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {testimonialsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderContentList(testimonials, "testimonial")
            )}
          </TabsContent>

          <TabsContent value="socialMedia" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {socialMediaLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderContentList(socialMediaPosts, "socialMedia")
            )}
          </TabsContent>

          <TabsContent value="video" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {videosLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderContentList(videos, "video")
            )}
          </TabsContent>

          <TabsContent value="googleReviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {googleReviewsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : googleReviews.length === 0 ? (
              <Card className="w-full">
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No Google Reviews synced yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Sync reviews from the Dashboard to manage them here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {googleReviews.map((review) => (
                  <Card
                    key={review.id}
                    className={`w-full ${
                      !review.isActive 
                        ? "border-2 border-dashed border-muted-foreground/30 bg-muted/20" 
                        : ""
                    }`}
                    data-testid={`google-review-card-${review.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {review.authorPhotoUrl ? (
                          <img
                            src={review.authorPhotoUrl}
                            alt={review.authorName}
                            className={`w-12 h-12 rounded-full object-cover flex-shrink-0 ${
                              !review.isActive ? "opacity-50" : ""
                            }`}
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ${
                            !review.isActive ? "opacity-50" : ""
                          }`}>
                            <span className="text-lg font-semibold text-primary">
                              {review.authorName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <h3 className={`font-semibold text-lg mb-2 break-normal ${
                                !review.isActive ? "text-muted-foreground" : ""
                              }`}>
                                {review.authorName}
                              </h3>
                              
                              <div className="flex flex-col gap-1 mb-2">
                                {review.isActive ? (
                                  <Badge 
                                    className="text-xs flex-shrink-0 bg-primary/10 text-primary border border-primary/30 font-semibold w-fit" 
                                    data-testid={`badge-visible-${review.id}`}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Visible
                                  </Badge>
                                ) : (
                                  <>
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs flex-shrink-0 font-semibold w-fit" 
                                      data-testid={`badge-not-visible-${review.id}`}
                                    >
                                      <EyeOff className="w-3 h-3 mr-1" />
                                      Not visible
                                    </Badge>
                                    <p className="text-xs text-muted-foreground" data-testid={`text-reason-${review.id}`}>
                                      Item is disabled
                                    </p>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mb-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-sm ${
                                      i < review.rating
                                        ? "text-yellow-400"
                                        : "text-muted"
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              {review.relativeTimeDescription && (
                                <p className="text-xs text-muted-foreground">
                                  {review.relativeTimeDescription}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  toggleGoogleReviewActiveMutation.mutate({
                                    id: review.id,
                                    isActive: !review.isActive,
                                  })
                                }
                                data-testid={`button-toggle-review-${review.id}`}
                                aria-label={review.isActive ? "Hide from website" : "Show on website"}
                                aria-pressed={!!review.isActive}
                                title={review.isActive ? "Hide from website" : "Show on website"}
                                className="gap-1.5"
                              >
                                {review.isActive ? (
                                  <>
                                    <EyeOff className="w-4 h-4" />
                                    <span className="hidden sm:inline">Hide</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4" />
                                    <span className="hidden sm:inline">Show</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {review.text && (
                            <p className="text-sm text-muted-foreground leading-relaxed mt-2 break-normal">
                              {review.text}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lead_magnet" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              {/* Social Media specific fields */}
              {editingItem.type === 'socialMedia' && (
                <>
                  {/* AI Screenshot Analysis */}
                  <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/20">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm font-semibold">Quick Import from Screenshot</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload a screenshot of your social media post and we'll automatically extract the caption, platform, and link.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 items-start">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleScreenshotAnalysis(file, true);
                        }}
                        className="hidden"
                        id="screenshot-upload-edit"
                        disabled={isAnalyzing}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('screenshot-upload-edit')?.click()}
                        disabled={isAnalyzing}
                        data-testid="button-analyze-screenshot-edit"
                        className="flex-shrink-0"
                      >
                        {isAnalyzing ? (
                          "Analyzing..."
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Analyze Screenshot
                          </>
                        )}
                      </Button>
                      {screenshotPreview && (
                        <img 
                          src={screenshotPreview} 
                          alt="Screenshot preview"
                          className="w-20 h-20 object-cover rounded border border-border"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-platform">Platform</Label>
                    <Select
                      value={(editingItem.metadata as any)?.platform || "instagram"}
                      onValueChange={(value) => setEditingItem({ ...editingItem, metadata: { ...(editingItem.metadata as any || {}), platform: value } })}
                    >
                      <SelectTrigger id="edit-platform" data-testid="select-edit-platform">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select which platform this post is from
                  </p>
                </div>
              </>
              )}
              
              {/* Video specific fields for edit */}
              {editingItem.type === 'video' && (
                <>
                  <div>
                    <Label htmlFor="edit-video-url">YouTube URL or Video ID</Label>
                    <Input
                      id="edit-video-url"
                      value={(editingItem.metadata as any)?.videoId || ""}
                      onChange={(e) => {
                        const input = e.target.value.trim();
                        let videoId = input;
                        
                        // Extract video ID from full YouTube URL
                        if (input.includes('youtube.com') || input.includes('youtu.be')) {
                          const urlMatch = input.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                          if (urlMatch) videoId = urlMatch[1];
                        }
                        
                        setEditingItem({ ...editingItem, metadata: { ...(editingItem.metadata as any || {}), videoId } });
                      }}
                      placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ"
                      data-testid="input-edit-video-url"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste a YouTube URL or just the video ID
                    </p>
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                      <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                        <span className="text-base">⚠️</span>
                        <span><strong>Note:</strong> YouTube Shorts often have embedding restrictions and may not display properly. For best results, use regular YouTube videos (not /shorts/ URLs).</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-video-category">Category</Label>
                    <Select
                      value={(editingItem.metadata as any)?.category || "student_story"}
                      onValueChange={(value) => setEditingItem({ ...editingItem, metadata: { ...(editingItem.metadata as any || {}), category: value } })}
                    >
                      <SelectTrigger id="edit-video-category" data-testid="select-edit-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student_story">Student Story</SelectItem>
                        <SelectItem value="virtual_tour">Virtual Tour</SelectItem>
                        <SelectItem value="program_highlight">Program Highlight</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select the type of video content
                    </p>
                  </div>
                </>
              )}
              
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
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingItem.isActive ?? true}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, isActive: checked })}
                  data-testid="switch-edit-active"
                />
                <Label>Active (visible on website)</Label>
              </div>
              
              {/* Multi-select visibility assignment for all content types */}
              <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/20">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm font-semibold">Visibility Assignment</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select which persona and journey stage combinations should see this content. You can select multiple combinations.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {PERSONAS.map((persona) => (
                    <div key={persona} className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">{PERSONA_LABELS[persona]}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4">
                        {FUNNEL_STAGES.map((stage) => {
                          const comboKey = getComboKey(persona, stage);
                          const isChecked = selectedLeadMagnetCombos.has(comboKey);
                          return (
                            <div key={comboKey} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`edit-combo-${comboKey}`}
                                checked={isChecked}
                                onChange={(e) => {
                                  const newSet = new Set(selectedLeadMagnetCombos);
                                  if (e.target.checked) {
                                    newSet.add(comboKey);
                                  } else {
                                    newSet.delete(comboKey);
                                  }
                                  setSelectedLeadMagnetCombos(newSet);
                                }}
                                className="rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                                data-testid={`checkbox-edit-${comboKey}`}
                              />
                              <Label htmlFor={`edit-combo-${comboKey}`} className="text-sm font-normal cursor-pointer leading-tight">
                                {FUNNEL_STAGE_LABELS[stage]}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
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
            
            {/* Social Media specific fields for create */}
            {activeTab === 'socialMedia' && (
              <>
                {/* AI Screenshot Analysis */}
                <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/20">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Label className="text-sm font-semibold">Quick Import from Screenshot</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload a screenshot of your social media post and we'll automatically extract the caption, platform, and link.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 items-start">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleScreenshotAnalysis(file, false);
                      }}
                      className="hidden"
                      id="screenshot-upload-create"
                      disabled={isAnalyzing}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('screenshot-upload-create')?.click()}
                      disabled={isAnalyzing}
                      data-testid="button-analyze-screenshot-create"
                      className="flex-shrink-0"
                    >
                      {isAnalyzing ? (
                        "Analyzing..."
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Analyze Screenshot
                        </>
                      )}
                    </Button>
                    {screenshotPreview && (
                      <img 
                        src={screenshotPreview} 
                        alt="Screenshot preview"
                        className="w-20 h-20 object-cover rounded border border-border"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="create-platform">Platform</Label>
                  <Select
                    value={(newItem.metadata as any)?.platform || "instagram"}
                    onValueChange={(value) => setNewItem({ ...newItem, metadata: { ...(newItem.metadata as any || {}), platform: value } })}
                  >
                    <SelectTrigger id="create-platform" data-testid="select-create-platform">
                      <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select which platform this post is from
                </p>
              </div>
              </>
            )}
            
            {/* Video specific fields for create */}
            {activeTab === 'video' && (
              <>
                <div>
                  <Label htmlFor="create-video-url">YouTube URL or Video ID</Label>
                  <Input
                    id="create-video-url"
                    value={(newItem.metadata as any)?.videoId || ""}
                    onChange={(e) => {
                      const input = e.target.value.trim();
                      let videoId = input;
                      
                      // Extract video ID from full YouTube URL
                      if (input.includes('youtube.com') || input.includes('youtu.be')) {
                        const urlMatch = input.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                        if (urlMatch) videoId = urlMatch[1];
                      }
                      
                      setNewItem({ ...newItem, metadata: { ...(newItem.metadata as any || {}), videoId } });
                    }}
                    placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ"
                    data-testid="input-create-video-url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste a YouTube URL or just the video ID
                  </p>
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                    <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                      <span className="text-base">⚠️</span>
                      <span><strong>Note:</strong> YouTube Shorts often have embedding restrictions and may not display properly. For best results, use regular YouTube videos (not /shorts/ URLs).</span>
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="create-video-category">Category</Label>
                  <Select
                    value={(newItem.metadata as any)?.category || "student_story"}
                    onValueChange={(value) => setNewItem({ ...newItem, metadata: { ...(newItem.metadata as any || {}), category: value } })}
                  >
                    <SelectTrigger id="create-video-category" data-testid="select-create-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student_story">Student Story</SelectItem>
                      <SelectItem value="virtual_tour">Virtual Tour</SelectItem>
                      <SelectItem value="program_highlight">Program Highlight</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select the type of video content
                  </p>
                </div>
              </>
            )}
            
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
            
            {/* Multi-select visibility assignment for all content types */}
            <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-semibold">Visibility Assignment</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select which persona and journey stage combinations should see this content. You can select multiple combinations.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {PERSONAS.map((persona) => (
                  <div key={persona} className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">{PERSONA_LABELS[persona]}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4">
                      {FUNNEL_STAGES.map((stage) => {
                        const comboKey = getComboKey(persona, stage);
                        const isChecked = selectedLeadMagnetCombos.has(comboKey);
                        return (
                          <div key={comboKey} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`create-combo-${comboKey}`}
                              checked={isChecked}
                              onChange={(e) => {
                                const newSet = new Set(selectedLeadMagnetCombos);
                                if (e.target.checked) {
                                  newSet.add(comboKey);
                                } else {
                                  newSet.delete(comboKey);
                                }
                                setSelectedLeadMagnetCombos(newSet);
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                              data-testid={`checkbox-create-${comboKey}`}
                            />
                            <Label htmlFor={`create-combo-${comboKey}`} className="text-sm font-normal cursor-pointer leading-tight">
                              {FUNNEL_STAGE_LABELS[stage]}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
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
