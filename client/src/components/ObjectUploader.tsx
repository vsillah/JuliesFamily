// Object Storage File Uploader Component with AI-Powered Naming
// Reference: blueprint:javascript_object_storage
import { useEffect, useState } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type UppyInstance = Uppy;

interface ObjectUploaderProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (uploadToken: string, objectPath?: string) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  maxNumberOfFiles?: number;
  enableAiNaming?: boolean;
}

export function ObjectUploader({
  open,
  onClose,
  onUploadComplete,
  acceptedFileTypes = ["image/*"],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  maxNumberOfFiles = 1,
  enableAiNaming = true,
}: ObjectUploaderProps) {
  const [uploadToken, setUploadToken] = useState<string>("");
  const [originalFilename, setOriginalFilename] = useState<string>("");
  const [showNamingDialog, setShowNamingDialog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedFilename, setSuggestedFilename] = useState("");
  const [editedFilename, setEditedFilename] = useState("");
  const [category, setCategory] = useState("");
  const { toast } = useToast();
  
  const [uppy] = useState<UppyInstance>(() => {
    return new Uppy({
      restrictions: {
        maxFileSize,
        maxNumberOfFiles,
        allowedFileTypes: acceptedFileTypes,
      },
      autoProceed: false,
    }).use(AwsS3, {
      async getUploadParameters(file) {
        try {
          const response = await fetch("/api/objects/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get upload URL: ${response.status} ${errorText}`);
          }
          
          const data = await response.json();
          
          if (!data.uploadURL || !data.uploadToken) {
            throw new Error("No upload URL or token received from server");
          }
          
          // Store the upload token for later use
          setUploadToken(data.uploadToken);
          
          return {
            method: "PUT",
            url: data.uploadURL,
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
          };
        } catch (error) {
          console.error("Error getting upload parameters:", error);
          throw error;
        }
      },
    });
  });

  useEffect(() => {
    const handleComplete = async (result: any) => {
      if (result.successful && result.successful.length > 0 && uploadToken) {
        const uploadedFile = result.successful[0];
        const filename = uploadedFile.name;
        setOriginalFilename(filename);
        
        // If AI naming is enabled and this is an image, trigger AI analysis
        if (enableAiNaming && acceptedFileTypes.some(type => type.includes('image'))) {
          setIsAnalyzing(true);
          setShowNamingDialog(true);
          
          try {
            const response = await apiRequest("POST", "/api/analyze-image-for-naming", {
              uploadToken,
              originalFilename: filename,
            });
            const analysis = await response.json();
            
            setSuggestedFilename(analysis.finalFilename);
            setEditedFilename(analysis.finalFilename);
            setCategory(analysis.category);
            
            toast({
              title: "AI Analysis Complete",
              description: `Suggested filename: ${analysis.finalFilename}`,
            });
          } catch (error) {
            console.error("Error analyzing image:", error);
            toast({
              title: "AI Analysis Failed",
              description: "Please review and confirm the original filename",
              variant: "destructive",
            });
            // Fall back to original filename but keep dialog open for user to confirm
            setSuggestedFilename(filename);
            setEditedFilename(filename);
            setCategory("general");
          } finally {
            setIsAnalyzing(false);
          }
        } else {
          // No AI naming - just call onUploadComplete with token (old flow)
          // This is used for profile photos and other uploads that have their own finalization endpoints
          onUploadComplete(uploadToken);
          uppy.cancelAll();
        }
      }
    };

    uppy.on("complete", handleComplete);

    return () => {
      uppy.off("complete", handleComplete);
    };
  }, [uppy, onUploadComplete, uploadToken, enableAiNaming, acceptedFileTypes, toast]);

  const handleConfirmFilename = async () => {
    // Validate filename format
    if (!/^[a-z0-9_-]+\.[a-z0-9]+$/i.test(editedFilename)) {
      toast({
        title: "Invalid Filename",
        description: "Filename must contain only letters, numbers, hyphens, underscores, and a valid extension.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call backend to finalize upload with the new filename
      const response = await apiRequest("POST", "/api/objects/finalize-upload", {
        uploadToken,
        finalFilename: editedFilename,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to finalize upload");
      }
      
      const result = await response.json();

      // Pass the finalized object path to parent
      onUploadComplete(uploadToken, result.objectPath);
      uppy.cancelAll();
      setShowNamingDialog(false);
      
      toast({
        title: "Upload Complete",
        description: `File saved as ${result.filename}`,
      });
      
      // Reset state
      setUploadToken("");
      setOriginalFilename("");
      setSuggestedFilename("");
      setEditedFilename("");
      setCategory("");
    } catch (error) {
      console.error("Error finalizing upload:", error);
      toast({
        title: "Failed to Finalize Upload",
        description: error instanceof Error ? error.message : "Please check the filename and try again",
        variant: "destructive",
      });
      // Keep dialog open so user can correct the filename
    }
  };

  const handleCancelNaming = async () => {
    try {
      // Finalize with original filename
      const response = await apiRequest("POST", "/api/objects/finalize-upload", {
        uploadToken,
        finalFilename: originalFilename,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to finalize upload");
      }
      
      const result = await response.json();

      onUploadComplete(uploadToken, result.objectPath);
      uppy.cancelAll();
      setShowNamingDialog(false);
      
      toast({
        title: "Upload Complete",
        description: `File saved as ${result.filename}`,
      });
      
      // Reset state
      setUploadToken("");
      setOriginalFilename("");
      setSuggestedFilename("");
      setEditedFilename("");
      setCategory("");
    } catch (error) {
      console.error("Error finalizing upload with original name:", error);
      toast({
        title: "Failed to Finalize Upload",
        description: error instanceof Error ? error.message : "Please correct the filename and try again",
        variant: "destructive",
      });
      // Keep dialog open, switch to AI-suggested name for user to edit
      setEditedFilename(suggestedFilename || originalFilename);
    }
  };

  return (
    <>
      <DashboardModal
        uppy={uppy}
        open={open}
        onRequestClose={onClose}
        proudlyDisplayPoweredByUppy={false}
        note={`Upload up to ${maxNumberOfFiles} file(s), max ${Math.round(maxFileSize / 1024 / 1024)}MB each`}
      />

      <Dialog open={showNamingDialog} onOpenChange={setShowNamingDialog}>
        <DialogContent className="sm:max-w-[600px]" data-testid="dialog-ai-naming">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI-Generated Filename
            </DialogTitle>
            <DialogDescription>
              AI has analyzed your image and suggested a descriptive filename. You can edit it before confirming.
            </DialogDescription>
          </DialogHeader>

          {isAnalyzing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-sm text-secondary-foreground">
                Analyzing image with AI...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Original Filename</Label>
                <div className="text-sm text-secondary-foreground bg-muted p-2 rounded-md">
                  {originalFilename}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Category</Label>
                  <Badge variant="secondary" className="text-xs" data-testid="badge-category">
                    {category}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filename">AI-Suggested Filename (editable)</Label>
                <Input
                  id="filename"
                  value={editedFilename}
                  onChange={(e) => setEditedFilename(e.target.value)}
                  placeholder="Enter filename..."
                  data-testid="input-filename"
                />
                <p className="text-xs text-secondary-foreground">
                  Format: {category}_description_YYYYMMDD_hash.ext
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelNaming}
              disabled={isAnalyzing}
              data-testid="button-use-original"
            >
              Use Original Name
            </Button>
            <Button
              onClick={handleConfirmFilename}
              disabled={isAnalyzing || !editedFilename}
              data-testid="button-confirm-filename"
            >
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
