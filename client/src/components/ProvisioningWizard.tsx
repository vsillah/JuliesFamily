import { useState } from "react";
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
  Lock
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  // Basic tier features
  { key: 'donation_forms', label: 'Donation Forms', description: 'Accept online donations', tier: 'basic' },
  { key: 'lead_capture', label: 'Lead Capture', description: 'Collect visitor information', tier: 'basic' },
  { key: 'email_notifications', label: 'Email Notifications', description: 'Automated email alerts', tier: 'basic' },
  { key: 'content_management', label: 'Content Management', description: 'Manage programs and events', tier: 'basic' },
  
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

const TIER_ORDER = { basic: 0, pro: 1, premium: 2 };

export function ProvisioningWizard({ open, onClose }: ProvisioningWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  const form = useForm<ProvisioningWizard>({
    resolver: zodResolver(provisioningWizardSchema),
    defaultValues: {
      name: "",
      tier: "basic",
      existingWebsiteUrl: "",
      contactName: "",
      contactEmail: "",
      contentStrategy: "default_templates",
      enabledFeatures: [],
    },
  });

  const provisionMutation = useMutation({
    mutationFn: async (data: ProvisioningWizard) => {
      const response = await apiRequest('POST', '/api/admin/organizations/provision', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Organization Provisioned! 🎉",
        description: `${data.organization.name} is ready to go. Welcome email sent!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      form.reset();
      setCurrentStep(1);
      onClose();
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
    
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = form.handleSubmit((data) => {
    provisionMutation.mutate(data);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
                          <SelectItem value="basic" data-testid="select-tier-basic">
                            Basic - Essential features
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

                <FormField
                  control={form.control}
                  name="existingWebsiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Existing Website URL (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="url"
                            placeholder="https://example.org" 
                            className="pl-9"
                            data-testid="input-website-url"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        We can use this for content inspiration
                      </FormDescription>
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
                            className={`cursor-pointer transition-colors ${
                              field.value === 'import_from_website' ? 'border-primary ring-2 ring-primary' : ''
                            }`}
                            onClick={() => field.onChange('import_from_website')}
                            data-testid="card-strategy-import"
                          >
                            <CardHeader>
                              <div className="flex items-start gap-3">
                                <RadioGroupItem value="import_from_website" id="import_from_website" />
                                <div className="flex-1">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Import from Website
                                    <Badge variant="secondary">Coming Soon</Badge>
                                  </CardTitle>
                                  <CardDescription>
                                    We'll scrape content from their existing site
                                  </CardDescription>
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

                {contentStrategy === 'import_from_website' && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">
                        Website import is coming in a future update. For now, we'll use default templates 
                        that you can customize after setup.
                      </p>
                    </CardContent>
                  </Card>
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
