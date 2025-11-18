import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { provisioningWizardSchema, type ProvisioningWizard } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2, 
  Globe, 
  Mail, 
  User, 
  Sparkles, 
  Download, 
  FileText, 
  Settings,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Crown,
  Lock,
  Search,
  Users,
  Calendar,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ScrapedData {
  logo: string | null;
  themeColors: any | null;
  personas: string[];
  programs: Array<{ title: string; description: string; url?: string }>;
  events: Array<{ title: string; description: string; date?: string; location?: string; url?: string }>;
  testimonials: Array<{ quote: string; author: string; role?: string }>;
  errors: string[];
}

interface ProvisioningWizardProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 1, title: "Organization Details", icon: Building2 },
  { id: 2, title: "Content Strategy", icon: FileText },
  { id: 3, title: "Features", icon: Settings },
  { id: 4, title: "Review", icon: Check },
];

// Feature definitions with tier requirements
const FEATURES = [
  // Standard tier features
  { key: 'donation_forms', label: 'Donation Forms', description: 'Accept online donations', tier: 'standard' },
  { key: 'lead_capture', label: 'Lead Capture', description: 'Collect visitor information', tier: 'standard' },
  { key: 'email_notifications', label: 'Email Notifications', description: 'Automated email alerts', tier: 'standard' },
  { key: 'content_management', label: 'Content Management', description: 'Manage programs and events', tier: 'standard' },
  
  // Pro tier features
  { key: 'ab_testing', label: 'A/B Testing', description: 'Test and optimize content', tier: 'pro' },
  { key: 'advanced_analytics', label: 'Advanced Analytics', description: 'Detailed insights and reports', tier: 'pro' },
  { key: 'sms_notifications', label: 'SMS Notifications', description: 'Text message alerts', tier: 'pro' },
  { key: 'email_automation', label: 'Email Automation', description: 'Automated email campaigns', tier: 'pro' },
  
  // Premium tier features
  { key: 'crm_advanced', label: 'Advanced CRM', description: 'Full relationship management', tier: 'premium' },
  { key: 'custom_domains', label: 'Custom Domains', description: 'Use your own domain', tier: 'premium' },
  { key: 'white_label', label: 'White Label', description: 'Remove KinFlo branding', tier: 'premium' },
  { key: 'api_access', label: 'API Access', description: 'Integrate with external systems', tier: 'premium' },
];

const TIER_ORDER = { standard: 0, pro: 1, premium: 2 };

export function ProvisioningWizard({ open, onClose }: ProvisioningWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const { toast } = useToast();
  
  // Track programmatic closes to avoid double-calling onClose
  const isProgrammaticClose = useRef(false);
  
  // Reset scraped data and form when wizard closes
  const resetWizardState = () => {
    setScrapedData(null);
    setCurrentStep(1);
    form.reset();
  };
  
  // Programmatically close the wizard
  const closeWizard = () => {
    isProgrammaticClose.current = true;
    resetWizardState();
    onClose();
  };

  const form = useForm<ProvisioningWizard>({
    resolver: zodResolver(provisioningWizardSchema),
    defaultValues: {
      name: "",
      tier: "standard",
      existingWebsiteUrl: "",
      contactName: "",
      contactEmail: "",
      contentStrategy: "default_templates",
      programsUrls: [],
      eventsUrls: [],
      testimonialsUrls: [],
      enabledFeatures: [],
    },
  });

  const scrapeMutation = useMutation({
    mutationFn: async (params: { url: string; programsUrls?: string[]; eventsUrls?: string[]; testimonialsUrls?: string[] }) => {
      const response = await apiRequest('POST', '/api/admin/organizations/scrape-website', params);
      return response.json();
    },
    onSuccess: (data: ScrapedData) => {
      setScrapedData(data);
      if (data.errors.length > 0) {
        toast({
          title: "Website Scanned with Warnings",
          description: `Found ${data.personas.length} personas, ${data.programs.length} programs, ${data.events.length} events, ${data.testimonials.length} testimonials. Check warnings below.`,
        });
      } else {
        toast({
          title: "Website Scanned Successfully",
          description: `Found ${data.personas.length} personas, ${data.programs.length} programs, ${data.events.length} events, ${data.testimonials.length} testimonials.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to scan website",
        variant: "destructive",
      });
    },
  });

  const provisionMutation = useMutation({
    mutationFn: async (data: ProvisioningWizard) => {
      const response = await apiRequest('POST', '/api/admin/organizations/provision', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Organization Provisioned Successfully",
        description: `${data.organization.name} is ready to go. Welcome email sent!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      closeWizard();
    },
    onError: (error: any) => {
      toast({
        title: "Provisioning Failed",
        description: error.message || "Failed to provision organization",
        variant: "destructive",
      });
    },
  });

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate);
    
    if (!isValid) {
      return;
    }
    
    // Step 2: Additional validation for import_from_website strategy
    if (currentStep === 2) {
      const strategy = form.getValues('contentStrategy');
      const url = form.getValues('existingWebsiteUrl');
      
      if (strategy === 'import_from_website' && !url) {
        toast({
          title: "Website URL Required",
          description: "Please enter a website URL or choose a different content strategy",
          variant: "destructive",
        });
        return;
      }
      
      if (strategy === 'import_from_website' && url && !scrapedData) {
        toast({
          title: "Scan Required",
          description: "Please click 'Scan Website' before continuing, or choose a different content strategy",
          variant: "destructive",
        });
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = form.handleSubmit((data) => {
    // Include scraped data if importing from website
    const submissionData = {
      ...data,
      ...(scrapedData && { scrapedData }),
    };
    provisionMutation.mutate(submissionData);
  });

  const getFieldsForStep = (step: number): (keyof ProvisioningWizard)[] => {
    switch (step) {
      case 1:
        return ['name', 'tier', 'contactName', 'contactEmail'];
      case 2:
        return ['contentStrategy', 'existingWebsiteUrl'];
      case 3:
        return ['enabledFeatures'];
      default:
        return [];
    }
  };

  const selectedTier = form.watch('tier');
  const selectedFeatures = form.watch('enabledFeatures');
  const contentStrategy = form.watch('contentStrategy');

  const progress = (currentStep / STEPS.length) * 100;

  // Reset scrapedData when strategy changes away from import_from_website
  useEffect(() => {
    if (contentStrategy !== 'import_from_website') {
      setScrapedData(null);
    }
  }, [contentStrategy]);
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        // If this is a programmatic close, reset the flag and don't call onClose again
        if (isProgrammaticClose.current) {
          isProgrammaticClose.current = false;
          return;
        }
        // User-initiated close (clicking X or outside)
        resetWizardState();
        onClose();
      }
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-provisioning-wizard">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            New Organization Setup Wizard
          </DialogTitle>
          <DialogDescription>
            Let's get your organization set up with content and features
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-1 ${
                  currentStep === step.id ? 'text-primary font-medium' : 
                  currentStep > step.id ? 'text-muted-foreground' : 'text-muted-foreground/50'
                }`}
                data-testid={`step-indicator-${step.id}`}
              >
                <step.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-bar" />
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Organization Details */}
            {currentStep === 1 && (
              <div className="space-y-4" data-testid="step-organization-details">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            placeholder="e.g., Red Cross Boston" 
                            className="pl-9"
                            data-testid="input-org-name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription Tier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tier">
                            <SelectValue placeholder="Select a tier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard" data-testid="select-tier-standard">
                            Standard - Essential features
                          </SelectItem>
                          <SelectItem value="pro" data-testid="select-tier-pro">
                            Pro - Advanced features
                          </SelectItem>
                          <SelectItem value="premium" data-testid="select-tier-premium">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4 text-yellow-500" />
                              Premium - All features
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            placeholder="e.g., John Smith" 
                            className="pl-9"
                            data-testid="input-contact-name"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        They'll receive the welcome email with setup instructions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="email"
                            placeholder="john@example.org" 
                            className="pl-9"
                            data-testid="input-contact-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Content Strategy */}
            {currentStep === 2 && (
              <div className="space-y-4" data-testid="step-content-strategy">
                <FormField
                  control={form.control}
                  name="contentStrategy"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>How would you like to populate content?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid gap-4"
                        >
                          <Card 
                            className={`cursor-pointer transition-colors ${
                              field.value === 'default_templates' ? 'border-primary ring-2 ring-primary' : ''
                            }`}
                            onClick={() => field.onChange('default_templates')}
                            data-testid="card-strategy-templates"
                          >
                            <CardHeader>
                              <div className="flex items-start gap-3">
                                <RadioGroupItem value="default_templates" id="default_templates" />
                                <div className="flex-1">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Use Default Templates (Recommended)
                                  </CardTitle>
                                  <CardDescription>
                                    Start with pre-built programs, testimonials, and events
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>

                          <Card 
                            className={`transition-colors ${
                              field.value === 'import_from_website' ? 'border-primary ring-2 ring-primary' : ''
                            }`}
                            data-testid="card-strategy-import"
                          >
                            <CardHeader>
                              <div className="flex items-start gap-3">
                                <div className="pt-0.5">
                                  <RadioGroupItem value="import_from_website" id="import_from_website" />
                                </div>
                                <div className="flex-1 space-y-3">
                                  <div 
                                    className="cursor-pointer"
                                    onClick={() => field.onChange('import_from_website')}
                                  >
                                    <CardTitle className="text-base flex items-center gap-2">
                                      <Download className="h-4 w-4" />
                                      Import & Scan Website
                                    </CardTitle>
                                    <CardDescription>
                                      Automatically detect personas and extract content from your existing website
                                    </CardDescription>
                                  </div>
                                  
                                  {field.value === 'import_from_website' && !scrapedData && (
                                    <div className="pt-2 space-y-3">
                                      <FormField
                                        control={form.control}
                                        name="existingWebsiteUrl"
                                        render={({ field: urlField }) => (
                                          <FormItem>
                                            <FormLabel>Website URL</FormLabel>
                                            <FormControl>
                                              <div className="relative">
                                                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                  {...urlField}
                                                  type="url"
                                                  placeholder="https://example.org" 
                                                  className="pl-9"
                                                  data-testid="input-website-url"
                                                />
                                              </div>
                                            </FormControl>
                                            <FormDescription>
                                              Enter your organization's website to automatically import content
                                            </FormDescription>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <Separator className="my-4" />
                                      
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                          <Settings className="h-4 w-4" />
                                          Content Page Mapping (Optional)
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          Specify up to 5 URLs per section for comprehensive content extraction
                                        </p>
                                        
                                        <FormField
                                          control={form.control}
                                          name="programsUrls"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-sm">Programs/Services Pages</FormLabel>
                                              <FormControl>
                                                <div className="space-y-2">
                                                  {field.value.map((url, index) => (
                                                    <div key={index} className="flex gap-2">
                                                      <Input 
                                                        type="url"
                                                        placeholder="https://example.org/programs" 
                                                        value={url}
                                                        onChange={(e) => {
                                                          const newUrls = [...field.value];
                                                          newUrls[index] = e.target.value;
                                                          field.onChange(newUrls);
                                                        }}
                                                        data-testid={`input-programs-url-${index}`}
                                                      />
                                                      <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                          const newUrls = field.value.filter((_, i) => i !== index);
                                                          field.onChange(newUrls);
                                                        }}
                                                        data-testid={`button-remove-programs-url-${index}`}
                                                      >
                                                        ×
                                                      </Button>
                                                    </div>
                                                  ))}
                                                  {field.value.length < 5 && (
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => field.onChange([...field.value, ''])}
                                                      data-testid="button-add-programs-url"
                                                    >
                                                      + Add Programs URL
                                                    </Button>
                                                  )}
                                                </div>
                                              </FormControl>
                                              <FormDescription className="text-xs">
                                                e.g., /what-we-do/programs/, /services/youth-programs/
                                              </FormDescription>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={form.control}
                                          name="eventsUrls"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-sm">Events Pages</FormLabel>
                                              <FormControl>
                                                <div className="space-y-2">
                                                  {field.value.map((url, index) => (
                                                    <div key={index} className="flex gap-2">
                                                      <Input 
                                                        type="url"
                                                        placeholder="https://example.org/events" 
                                                        value={url}
                                                        onChange={(e) => {
                                                          const newUrls = [...field.value];
                                                          newUrls[index] = e.target.value;
                                                          field.onChange(newUrls);
                                                        }}
                                                        data-testid={`input-events-url-${index}`}
                                                      />
                                                      <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                          const newUrls = field.value.filter((_, i) => i !== index);
                                                          field.onChange(newUrls);
                                                        }}
                                                        data-testid={`button-remove-events-url-${index}`}
                                                      >
                                                        ×
                                                      </Button>
                                                    </div>
                                                  ))}
                                                  {field.value.length < 5 && (
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => field.onChange([...field.value, ''])}
                                                      data-testid="button-add-events-url"
                                                    >
                                                      + Add Events URL
                                                    </Button>
                                                  )}
                                                </div>
                                              </FormControl>
                                              <FormDescription className="text-xs">
                                                e.g., /what-we-do/annual-events/, /calendar/
                                              </FormDescription>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={form.control}
                                          name="testimonialsUrls"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-sm">Testimonials/Success Stories Pages</FormLabel>
                                              <FormControl>
                                                <div className="space-y-2">
                                                  {field.value.map((url, index) => (
                                                    <div key={index} className="flex gap-2">
                                                      <Input 
                                                        type="url"
                                                        placeholder="https://example.org/testimonials" 
                                                        value={url}
                                                        onChange={(e) => {
                                                          const newUrls = [...field.value];
                                                          newUrls[index] = e.target.value;
                                                          field.onChange(newUrls);
                                                        }}
                                                        data-testid={`input-testimonials-url-${index}`}
                                                      />
                                                      <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                          const newUrls = field.value.filter((_, i) => i !== index);
                                                          field.onChange(newUrls);
                                                        }}
                                                        data-testid={`button-remove-testimonials-url-${index}`}
                                                      >
                                                        ×
                                                      </Button>
                                                    </div>
                                                  ))}
                                                  {field.value.length < 5 && (
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => field.onChange([...field.value, ''])}
                                                      data-testid="button-add-testimonials-url"
                                                    >
                                                      + Add Testimonials URL
                                                    </Button>
                                                  )}
                                                </div>
                                              </FormControl>
                                              <FormDescription className="text-xs">
                                                e.g., /our-impact/success-stories/, /testimonials/
                                              </FormDescription>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                      <Button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const url = form.getValues('existingWebsiteUrl');
                                          if (!url) {
                                            toast({
                                              title: "Website URL Required",
                                              description: "Please enter a website URL in the field above",
                                              variant: "destructive",
                                            });
                                            return;
                                          }
                                          // Validate URL format
                                          try {
                                            new URL(url);
                                          } catch {
                                            toast({
                                              title: "Invalid URL",
                                              description: "Please enter a valid website URL (e.g., https://example.org)",
                                              variant: "destructive",
                                            });
                                            return;
                                          }
                                          scrapeMutation.mutate({
                                            url,
                                            programsUrls: form.getValues('programsUrls').filter(u => u.trim()),
                                            eventsUrls: form.getValues('eventsUrls').filter(u => u.trim()),
                                            testimonialsUrls: form.getValues('testimonialsUrls').filter(u => u.trim()),
                                          });
                                        }}
                                        disabled={scrapeMutation.isPending}
                                        className="w-full"
                                        data-testid="button-scan-website"
                                      >
                                        {scrapeMutation.isPending ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Scanning Website...
                                          </>
                                        ) : (
                                          <>
                                            <Search className="mr-2 h-4 w-4" />
                                            Scan Website
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                  
                                  {field.value === 'import_from_website' && scrapedData && (
                                    <div className="pt-2 space-y-2">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Check className="h-4 w-4 text-green-600" />
                                        <span>
                                          Scanned: {scrapedData.personas.length} personas, {scrapedData.programs.length} programs, 
                                          {scrapedData.events.length} events, {scrapedData.testimonials.length} testimonials
                                        </span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const url = form.getValues('existingWebsiteUrl');
                                          if (url) {
                                            scrapeMutation.mutate({
                                            url,
                                            programsUrls: form.getValues('programsUrls').filter(u => u.trim()),
                                            eventsUrls: form.getValues('eventsUrls').filter(u => u.trim()),
                                            testimonialsUrls: form.getValues('testimonialsUrls').filter(u => u.trim()),
                                          });
                                          }
                                        }}
                                        disabled={scrapeMutation.isPending}
                                        className="w-full"
                                        data-testid="button-rescan-website"
                                      >
                                        <Search className="mr-2 h-4 w-4" />
                                        Scan Again
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                          </Card>

                          <Card 
                            className={`cursor-pointer transition-colors ${
                              field.value === 'start_blank' ? 'border-primary ring-2 ring-primary' : ''
                            }`}
                            onClick={() => field.onChange('start_blank')}
                            data-testid="card-strategy-blank"
                          >
                            <CardHeader>
                              <div className="flex items-start gap-3">
                                <RadioGroupItem value="start_blank" id="start_blank" />
                                <div className="flex-1">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Start Blank
                                  </CardTitle>
                                  <CardDescription>
                                    Create everything from scratch
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {contentStrategy === 'import_from_website' && scrapedData && (
                  <div className="space-y-4">
                    {/* Errors/Warnings */}
                    {scrapedData.errors.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside space-y-1">
                            {scrapedData.errors.map((error, i) => (
                              <li key={i} className="text-sm">{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Logo and Theme Colors Preview */}
                    {(scrapedData.logo || scrapedData.themeColors) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Extracted Branding
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {scrapedData.logo && (
                              <div>
                                <p className="text-sm font-medium mb-2">Logo</p>
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                                  <img 
                                    src={scrapedData.logo} 
                                    alt="Extracted logo" 
                                    className="h-12 w-12 object-contain bg-white rounded"
                                    data-testid="img-extracted-logo"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground truncate">{scrapedData.logo}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {scrapedData.themeColors && (
                              <div>
                                <p className="text-sm font-medium mb-2">Theme Colors</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {scrapedData.themeColors.primary && (
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="h-8 w-8 rounded border"
                                        style={{ backgroundColor: scrapedData.themeColors.primary }}
                                        data-testid="color-primary"
                                      />
                                      <div>
                                        <p className="text-xs font-medium">Primary</p>
                                        <p className="text-xs text-muted-foreground">{scrapedData.themeColors.primary}</p>
                                      </div>
                                    </div>
                                  )}
                                  {scrapedData.themeColors.accent && (
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="h-8 w-8 rounded border"
                                        style={{ backgroundColor: scrapedData.themeColors.accent }}
                                        data-testid="color-accent"
                                      />
                                      <div>
                                        <p className="text-xs font-medium">Accent</p>
                                        <p className="text-xs text-muted-foreground">{scrapedData.themeColors.accent}</p>
                                      </div>
                                    </div>
                                  )}
                                  {scrapedData.themeColors.background && (
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="h-8 w-8 rounded border"
                                        style={{ backgroundColor: scrapedData.themeColors.background }}
                                        data-testid="color-background"
                                      />
                                      <div>
                                        <p className="text-xs font-medium">Background</p>
                                        <p className="text-xs text-muted-foreground">{scrapedData.themeColors.background}</p>
                                      </div>
                                    </div>
                                  )}
                                  {scrapedData.themeColors.text && (
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="h-8 w-8 rounded border"
                                        style={{ backgroundColor: scrapedData.themeColors.text }}
                                        data-testid="color-text"
                                      />
                                      <div>
                                        <p className="text-xs font-medium">Text</p>
                                        <p className="text-xs text-muted-foreground">{scrapedData.themeColors.text}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Detected Personas */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Detected Personas ({scrapedData.personas.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {scrapedData.personas.map((persona) => (
                            <Badge key={persona} variant="secondary">
                              {persona}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Programs */}
                    {scrapedData.programs.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Programs ({scrapedData.programs.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[150px]">
                            <div className="space-y-3">
                              {scrapedData.programs.map((program, i) => (
                                <div key={i} className="border-b last:border-0 pb-2 last:pb-0">
                                  <h5 className="font-medium text-sm">{program.title}</h5>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {program.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}

                    {/* Events */}
                    {scrapedData.events.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Events ({scrapedData.events.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[100px]">
                            <div className="space-y-2">
                              {scrapedData.events.map((event, i) => (
                                <div key={i} className="text-sm">
                                  <span className="font-medium">{event.title}</span>
                                  {event.date && <span className="text-muted-foreground ml-2">• {event.date}</span>}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}

                    {/* Testimonials */}
                    {scrapedData.testimonials.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Testimonials ({scrapedData.testimonials.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[100px]">
                            <div className="space-y-2">
                              {scrapedData.testimonials.map((testimonial, i) => (
                                <div key={i} className="text-sm">
                                  <p className="italic line-clamp-2">"{testimonial.quote}"</p>
                                  <p className="text-muted-foreground text-xs mt-1">
                                    - {testimonial.author}
                                    {testimonial.role && `, ${testimonial.role}`}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}

                  </div>
                )}
              </div>
            )}

            {/* Step 3: Feature Configuration */}
            {currentStep === 3 && (
              <div className="space-y-4" data-testid="step-features">
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Tier-Based Features
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Features are automatically enabled based on the {selectedTier} tier. 
                    Premium features can be enabled with an upgrade.
                  </p>
                </div>

                <div className="space-y-3">
                  {FEATURES.map((feature) => {
                    const isIncluded = TIER_ORDER[feature.tier as keyof typeof TIER_ORDER] <= 
                                      TIER_ORDER[selectedTier as keyof typeof TIER_ORDER];
                    const isLocked = !isIncluded;

                    return (
                      <Card 
                        key={feature.key} 
                        className={isLocked ? 'opacity-60' : ''}
                        data-testid={`card-feature-${feature.key}`}
                      >
                        <CardHeader className="py-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isIncluded || selectedFeatures.includes(feature.key)}
                              disabled={isLocked}
                              onCheckedChange={(checked) => {
                                if (checked && !isIncluded) {
                                  form.setValue('enabledFeatures', [...selectedFeatures, feature.key]);
                                } else if (!checked && !isIncluded) {
                                  form.setValue('enabledFeatures', selectedFeatures.filter(f => f !== feature.key));
                                }
                              }}
                              data-testid={`checkbox-feature-${feature.key}`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-sm">{feature.label}</CardTitle>
                                {isIncluded && (
                                  <Badge variant="secondary" className="text-xs">
                                    Included
                                  </Badge>
                                )}
                                {isLocked && (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    {feature.tier}
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="text-xs mt-1">
                                {feature.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-4" data-testid="step-review">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Review & Confirm</h3>
                  <p className="text-sm text-muted-foreground">
                    Please review the details before provisioning
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Organization Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium" data-testid="review-org-name">{form.getValues('name')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tier:</span>
                      <Badge variant="secondary" data-testid="review-tier">{form.getValues('tier')}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium" data-testid="review-contact">
                        {form.getValues('contactName')} ({form.getValues('contactEmail')})
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Content Strategy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge data-testid="review-content-strategy">
                      {form.getValues('contentStrategy').replace(/_/g, ' ')}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Features ({FEATURES.filter(f => 
                        TIER_ORDER[f.tier as keyof typeof TIER_ORDER] <= TIER_ORDER[selectedTier as keyof typeof TIER_ORDER]
                      ).length + selectedFeatures.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {FEATURES.filter(f => {
                        const isIncluded = TIER_ORDER[f.tier as keyof typeof TIER_ORDER] <= 
                                          TIER_ORDER[selectedTier as keyof typeof TIER_ORDER];
                        return isIncluded || selectedFeatures.includes(f.key);
                      }).map(f => (
                        <Badge key={f.key} variant="secondary" data-testid={`review-feature-${f.key}`}>
                          {f.label}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || provisionMutation.isPending}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  data-testid="button-next"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={provisionMutation.isPending}
                  data-testid="button-provision"
                >
                  {provisionMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Provisioning...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Provision Organization
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
