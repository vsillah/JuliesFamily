import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, FileText, MessageSquare, CheckCircle, Clock, XCircle, Trash2 } from "lucide-react";
import type { ContentItem } from "@shared/schema";

const PASSION_OPTIONS = [
  { id: 'literacy', label: 'Literacy & Reading' },
  { id: 'stem', label: 'STEM & Technology' },
  { id: 'arts', label: 'Arts & Creativity' },
  { id: 'nutrition', label: 'Nutrition & Health' },
  { id: 'community', label: 'Community Building' },
];

const submissionSchema = z.object({
  type: z.enum(['student_project', 'student_testimonial']),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  passionTags: z.array(z.string()).min(1, "Select at least one passion area"),
  files: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
    uploadedAt: z.string().optional(),
  })).optional(),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

export function StudentSubmissionForm() {
  const { toast } = useToast();
  const [submissionType, setSubmissionType] = useState<'student_project' | 'student_testimonial'>('student_project');
  const [showUploader, setShowUploader] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; alt: string; uploadedAt: string }>>([]);

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      type: submissionType,
      title: "",
      description: "",
      passionTags: [],
      files: [],
    },
  });

  const passionTags = form.watch("passionTags");

  // Fetch student's previous submissions
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/student/submissions"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      return apiRequest("POST", "/api/student/submit", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/submissions"] });
      toast({
        title: "Success!",
        description: "Your submission has been sent for review.",
      });
      form.reset();
      setUploadedFiles([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUploadComplete = (objectPath: string) => {
    const newFile = {
      url: objectPath,
      alt: form.getValues("title") || "Uploaded file",
      uploadedAt: new Date().toISOString(),
    };
    setUploadedFiles([...uploadedFiles, newFile]);
    setShowUploader(false);
    toast({
      title: "File uploaded",
      description: "Your file has been uploaded successfully.",
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const onSubmit = (data: SubmissionFormData) => {
    submitMutation.mutate({
      ...data,
      type: submissionType,
      files: uploadedFiles,
    });
  };

  const getStatusBadge = (item: ContentItem) => {
    const status = (item.metadata as any)?.status || 'pending';
    
    if (status === 'approved' && item.isActive) {
      return (
        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30" data-testid={`badge-status-${item.id}`}>
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    }
    if (status === 'rejected') {
      return (
        <Badge variant="destructive" data-testid={`badge-status-${item.id}`}>
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" data-testid={`badge-status-${item.id}`}>
        <Clock className="w-3 h-3 mr-1" />
        Pending Review
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>Share Your Work</CardTitle>
          <CardDescription>
            Share your class projects and testimonials with the community. Your submission will be reviewed before being published.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Submission Type */}
            <div className="space-y-3">
              <Label>What would you like to share?</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={submissionType === 'student_project' ? 'default' : 'outline'}
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => {
                    setSubmissionType('student_project');
                    form.setValue('type', 'student_project');
                  }}
                  data-testid="button-type-project"
                >
                  <FileText className="w-6 h-6" />
                  <span>Class Project</span>
                </Button>
                <Button
                  type="button"
                  variant={submissionType === 'student_testimonial' ? 'default' : 'outline'}
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => {
                    setSubmissionType('student_testimonial');
                    form.setValue('type', 'student_testimonial');
                  }}
                  data-testid="button-type-testimonial"
                >
                  <MessageSquare className="w-6 h-6" />
                  <span>Testimonial</span>
                </Button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder={submissionType === 'student_project' ? "My Amazing Project" : "My Learning Journey"}
                {...form.register("title")}
                data-testid="input-title"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {submissionType === 'student_project' ? 'Project Description' : 'Your Story'} *
              </Label>
              <Textarea
                id="description"
                rows={6}
                placeholder={submissionType === 'student_project' 
                  ? "Describe your project, what you learned, and what you're proud of..."
                  : "Share your experience in the program and how it has impacted you..."
                }
                {...form.register("description")}
                data-testid="input-description"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* Passion Tags */}
            <div className="space-y-3">
              <Label>Related Topics * (Select at least one)</Label>
              <div className="space-y-2">
                {PASSION_OPTIONS.map((passion) => (
                  <div key={passion.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`passion-${passion.id}`}
                      checked={passionTags.includes(passion.id)}
                      onCheckedChange={(checked) => {
                        const current = passionTags;
                        const updated = checked
                          ? [...current, passion.id]
                          : current.filter(p => p !== passion.id);
                        form.setValue("passionTags", updated);
                      }}
                      data-testid={`checkbox-passion-${passion.id}`}
                    />
                    <Label htmlFor={`passion-${passion.id}`} className="text-sm font-normal cursor-pointer">
                      {passion.label}
                    </Label>
                  </div>
                ))}
              </div>
              {form.formState.errors.passionTags && (
                <p className="text-sm text-destructive">{form.formState.errors.passionTags.message}</p>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <Label>Photos & Files {submissionType === 'student_project' && '(Optional)'}</Label>
              <div className="space-y-3">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">{file.url.split('/').pop()}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      data-testid={`button-remove-file-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploader(true)}
                  className="w-full"
                  data-testid="button-upload-file"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full"
              data-testid="button-submit"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Submissions</CardTitle>
          <CardDescription>
            Track the status of your previous submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              You haven't submitted anything yet. Share your first project or testimonial above!
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1" data-testid={`text-submission-title-${submission.id}`}>
                            {submission.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-submission-description-${submission.id}`}>
                            {submission.description}
                          </p>
                        </div>
                        {getStatusBadge(submission)}
                      </div>
                      
                      {submission.passionTags && submission.passionTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {submission.passionTags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {PASSION_OPTIONS.find(p => p.id === tag)?.label || tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {(submission.metadata as any)?.status === 'rejected' && (submission.metadata as any)?.rejectionReason && (
                        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                          <p className="text-sm text-destructive">
                            <strong>Feedback:</strong> {(submission.metadata as any).rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Object Uploader Modal */}
      <ObjectUploader
        open={showUploader}
        onClose={() => setShowUploader(false)}
        onUploadComplete={handleUploadComplete}
        enableAiNaming={true}
      />
    </div>
  );
}
