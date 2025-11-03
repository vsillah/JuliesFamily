import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, Trash2, ExternalLink, Image as ImageIcon } from "lucide-react";
import type { ImageAsset } from "@shared/schema";

export default function AdminImages() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState("");
  const [imageUsage, setImageUsage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: images, isLoading } = useQuery<ImageAsset[]>({
    queryKey: ["/api/admin/images"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/admin/images/upload", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/images"] });
      toast({
        title: "Image uploaded",
        description: "Image has been successfully uploaded and upscaled.",
      });
      setSelectedFile(null);
      setImageName("");
      setImageUsage("");
      setPreviewUrl(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/images/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/images"] });
      toast({
        title: "Image deleted",
        description: "Image has been successfully deleted from Cloudinary and database.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !imageName || !imageUsage) {
      toast({
        title: "Missing information",
        description: "Please select a file, provide a name, and select usage category.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("name", imageName);
    formData.append("usage", imageUsage);

    uploadMutation.mutate(formData);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This will remove it from Cloudinary and the database.`)) {
      deleteMutation.mutate(id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-serif font-bold mb-2">Image Management</h1>
      <p className="text-muted-foreground mb-8">
        Upload and manage images with automatic AI upscaling via Cloudinary
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Image</CardTitle>
            <CardDescription>
              Images are automatically upscaled using Cloudinary's AI enhancement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-file">Image File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    data-testid="input-image-file"
                  />
                </div>
                {previewUrl && (
                  <div className="mt-2 border rounded-md overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                      data-testid="img-preview"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-name">Image Name</Label>
                <Input
                  id="image-name"
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  placeholder="e.g., Hero Background - Students"
                  data-testid="input-image-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-usage">Usage Category</Label>
                <Select value={imageUsage} onValueChange={setImageUsage}>
                  <SelectTrigger id="image-usage" data-testid="select-image-usage">
                    <SelectValue placeholder="Select usage category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero Section</SelectItem>
                    <SelectItem value="service">Service Cards</SelectItem>
                    <SelectItem value="event">Event Cards</SelectItem>
                    <SelectItem value="testimonial">Testimonials</SelectItem>
                    <SelectItem value="logo">Logo</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={uploadMutation.isPending || !selectedFile || !imageName || !imageUsage}
                data-testid="button-upload-image"
              >
                {uploadMutation.isPending ? (
                  "Uploading..."
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Upscale Image
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uploaded Images</CardTitle>
            <CardDescription>
              All images are optimized and served from Cloudinary CDN
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading images...</p>
            ) : images && images.length > 0 ? (
              <div className="space-y-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="flex items-start gap-4 p-4 border rounded-md hover-elevate"
                    data-testid={`card-image-${image.id}`}
                  >
                    <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-md overflow-hidden">
                      {image.cloudinarySecureUrl ? (
                        <img
                          src={image.cloudinarySecureUrl}
                          alt={image.name}
                          className="w-full h-full object-cover"
                          data-testid={`img-thumbnail-${image.id}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 truncate" data-testid={`text-image-name-${image.id}`}>
                        {image.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {image.usage} • {image.width}×{image.height} • {formatFileSize(image.fileSize || 0)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(image.cloudinarySecureUrl, "_blank")}
                          data-testid={`button-view-${image.id}`}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(image.id, image.name)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${image.id}`}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No images uploaded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
