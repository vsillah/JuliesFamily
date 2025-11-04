import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SelectedCard } from "./PersonaMatrixGrid";
import type { ContentVisibility, ImageAsset, AbTest, AbTestVariant } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, FlaskConical, Upload, Image as ImageIcon } from "lucide-react";
import { PERSONA_LABELS, FUNNEL_STAGE_LABELS } from "@shared/defaults/personas";

interface MatrixEditPanelProps {
  selectedCard: SelectedCard;
  visibilitySettings: ContentVisibility[];
  images: ImageAsset[];
  abTests: AbTest[];
  onClose: () => void;
}

export default function MatrixEditPanel({
  selectedCard,
  visibilitySettings,
  images,
  abTests,
  onClose,
}: MatrixEditPanelProps) {
  const { toast } = useToast();
  const { persona, stage, contentType, contentItem } = selectedCard;

  // Find existing visibility setting
  const existingVisibility = contentItem
    ? visibilitySettings.find(
        v => v.contentItemId === contentItem.id && 
             v.persona === persona && 
             v.funnelStage === stage
      )
    : null;

  // Form state
  const [titleOverride, setTitleOverride] = useState(existingVisibility?.titleOverride || "");
  const [descriptionOverride, setDescriptionOverride] = useState(existingVisibility?.descriptionOverride || "");
  const [imageNameOverride, setImageNameOverride] = useState(existingVisibility?.imageNameOverride || "");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Load existing values when selected card changes
  useEffect(() => {
    setTitleOverride(existingVisibility?.titleOverride || "");
    setDescriptionOverride(existingVisibility?.descriptionOverride || "");
    setImageNameOverride(existingVisibility?.imageNameOverride || "");
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
  }, [selectedCard, existingVisibility]);

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch active A/B tests for this permutation and content type
  const { data: activeTests = [] } = useQuery<AbTest[]>({
    queryKey: ["/api/admin/ab-tests", persona, stage, contentType, contentItem?.id],
    enabled: !!contentItem,
    select: (tests) => tests.filter(
      t => t.status === 'active' && 
           t.targetPersona === persona && 
           t.targetFunnelStage === stage &&
           t.type === contentType // Filter by content type
    ),
  });

  // Save visibility mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!contentItem) return;

      // First upload image if there's a new one
      let finalImageName = imageNameOverride;
      if (selectedImageFile) {
        const formData = new FormData();
        formData.append("image", selectedImageFile);
        
        // Generate unique name from filename without extension
        const baseName = selectedImageFile.name.replace(/\.[^/.]+$/, "");
        const uniqueName = `${baseName}-${Date.now()}`;
        formData.append("name", uniqueName);
        formData.append("usage", contentType);
        formData.append("localPath", "");
        
        const uploadResult = await fetch("/api/admin/images/upload", {
          method: "POST",
          body: formData,
        }).then(res => res.json());
        
        if (uploadResult.error || !uploadResult.name) {
          throw new Error(uploadResult.message || "Image upload failed");
        }
        
        finalImageName = uploadResult.name;
      }

      // Create or update visibility setting
      if (existingVisibility) {
        return await apiRequest("PATCH", `/api/content/visibility/${existingVisibility.id}`, {
          titleOverride: titleOverride || null,
          descriptionOverride: descriptionOverride || null,
          imageNameOverride: finalImageName || null,
        });
      } else {
        return await apiRequest("POST", "/api/content/visibility", {
          contentItemId: contentItem.id,
          persona,
          funnelStage: stage,
          titleOverride: titleOverride || null,
          descriptionOverride: descriptionOverride || null,
          imageNameOverride: finalImageName || null,
          isVisible: true,
          order: 0,
        });
      }
    },
    onSuccess: async () => {
      // Invalidate and immediately refetch all related queries
      await queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.includes("/api/content") || key?.includes("/api/admin/images");
        },
        refetchType: 'active'
      });
      
      toast({
        title: "Saved",
        description: "Configuration updated successfully",
      });
      
      // Close dialog after refetch completes
      setTimeout(() => {
        onClose();
      }, 300);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    },
  });

  const displayTitle = titleOverride || contentItem?.title || `${contentType} content`;
  const displayImage = imageNameOverride || contentItem?.imageName;
  const imageAsset = images.find(img => img.name === displayImage);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Edit Configuration</h2>
        <p className="text-sm text-muted-foreground">
          {PERSONA_LABELS[persona]} • {FUNNEL_STAGE_LABELS[stage]}
        </p>
      </div>

      {!contentItem ? (
        <div className="p-6 text-center text-muted-foreground">
          <p>No content item available for this type.</p>
          <p className="text-sm mt-2">Create content in the Content Manager first.</p>
        </div>
      ) : (
        <Tabs defaultValue="default" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="default">Default</TabsTrigger>
            <TabsTrigger value="variants" disabled={activeTests.length === 0}>
              Variants {activeTests.length > 0 && `(${activeTests.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="default" className="p-6 space-y-4">
            {/* Title Override */}
            <div className="space-y-2">
              <Label htmlFor="title-override">Title Override</Label>
              <Input
                id="title-override"
                value={titleOverride}
                onChange={(e) => setTitleOverride(e.target.value)}
                placeholder={contentItem.title || "Enter custom title"}
                data-testid="input-title-override"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default: "{contentItem.title}"
              </p>
            </div>

            {/* Description Override */}
            <div className="space-y-2">
              <Label htmlFor="description-override">Description Override</Label>
              <Textarea
                id="description-override"
                value={descriptionOverride}
                onChange={(e) => setDescriptionOverride(e.target.value)}
                placeholder={contentItem.description || "Enter custom description"}
                rows={4}
                data-testid="textarea-description-override"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default description
              </p>
            </div>

            {/* Image Selection */}
            <div className="space-y-2">
              <Label>Image</Label>
              
              {/* Current image preview */}
              {(imagePreviewUrl || imageAsset) && (
                <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                  <img
                    src={imagePreviewUrl || imageAsset?.cloudinarySecureUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Image picker */}
              <Select value={imageNameOverride} onValueChange={setImageNameOverride}>
                <SelectTrigger data-testid="select-image">
                  <SelectValue placeholder="Select from library" />
                </SelectTrigger>
                <SelectContent>
                  {images.map((img) => (
                    <SelectItem key={img.id} value={img.name}>
                      {img.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Upload new image */}
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Label
                  htmlFor="image-upload"
                  className="flex items-center gap-2 cursor-pointer bg-secondary text-secondary-foreground hover-elevate px-4 py-2 rounded-md text-sm"
                >
                  <Upload className="h-4 w-4" />
                  Upload New Image
                </Label>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full"
              data-testid="button-save-config"
            >
              {saveMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>

            {/* A/B Test Info */}
            {activeTests.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">Active A/B Tests</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    This configuration has {activeTests.length} active test{activeTests.length > 1 ? 's' : ''}.
                    View variants in the Variants tab.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="variants" className="p-6">
            {activeTests.length === 0 ? (
              <p className="text-center text-muted-foreground">No active A/B tests</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  A/B test variant management coming soon
                </p>
                {activeTests.map((test) => (
                  <Card key={test.id}>
                    <CardHeader>
                      <CardTitle className="text-sm">{test.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {test.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
