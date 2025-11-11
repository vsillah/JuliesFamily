import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Image as ImageIcon, AlertCircle, GripVertical, Upload, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useBaselineConfig } from "@/hooks/useABTestBaseline";
import CopyVariantGenerator from "../CopyVariantGenerator";
import { HistoricalTestResults } from "../HistoricalTestResults";
import type { ContentItem } from "@shared/schema";
import type { BaselineTarget } from "../ABTestWizard";

interface Variant {
  id: string;
  name: string;
  description: string;
  trafficWeight: number;
  isControl: boolean;
  contentItemId?: string;
  configuration: Record<string, any>;
  creationMode?: 'existing' | 'custom'; // How this variant was created
}

interface ConfigureStepProps {
  testType: string;
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
  baselineTarget?: BaselineTarget;
  onBaselineTargetChange: (target: BaselineTarget | undefined) => void;
}

const PERSONAS = [
  { value: 'student', label: 'Student' },
  { value: 'donor', label: 'Donor' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'partner', label: 'Partner' },
  { value: 'general', label: 'General Public' },
];

const FUNNEL_STAGES = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'consideration', label: 'Consideration' },
  { value: 'decision', label: 'Decision' },
  { value: 'retention', label: 'Retention' },
];

export function ConfigureStep({ testType, variants, onVariantsChange, baselineTarget, onBaselineTargetChange }: ConfigureStepProps) {
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch content items based on test type
  const contentType = getContentTypeForTest(testType);
  const { data: contentItems = [], isLoading: isLoadingContent } = useQuery<ContentItem[]>({
    queryKey: contentType ? [`/api/content/type/${contentType}`] : [],
    enabled: !!contentType && (testType === 'hero_variation' || testType === 'cta_variation'),
  });
  
  // Fetch images for image selection
  const { data: images = [] } = useQuery<any[]>({
    queryKey: ["/api/images"],
    enabled: testType === 'hero_variation' || testType === 'cta_variation',
  });

  // Fetch baseline configuration (lazy - only enabled when baselineTarget is set)
  const hasBaselineTarget = !!(baselineTarget?.persona && baselineTarget?.funnelStage);
  const { data: baselineConfig, isLoading: isLoadingBaseline } = useBaselineConfig(
    baselineTarget?.persona,
    baselineTarget?.funnelStage,
    testType,
    hasBaselineTarget
  );

  // Handler to auto-populate control variant with baseline configuration
  const handleControlToggle = async (variantId: string, checked: boolean) => {
    if (checked) {
      // Check if baseline target is set
      if (!hasBaselineTarget) {
        toast({
          title: "Baseline reference required",
          description: "Please select a persona and funnel stage above to auto-populate the control variant.",
          variant: "default",
        });
        // Still mark as control, but don't populate
        onVariantsChange(
          variants.map(v => ({ ...v, isControl: v.id === variantId }))
        );
        return;
      }

      // Prefetch baseline config if not already loaded
      const config = baselineConfig || await queryClient.ensureQueryData({
        queryKey: ['/api/ab-tests/baseline-config', { 
          persona: baselineTarget.persona, 
          funnelStage: baselineTarget.funnelStage, 
          testType 
        }],
      });

      if (config) {
        // Auto-populate the variant with baseline configuration
        onVariantsChange(
          variants.map(v => 
            v.id === variantId 
              ? { ...v, isControl: true, configuration: config }
              : { ...v, isControl: false }
          )
        );

        toast({
          title: "Control variant populated",
          description: "Configuration auto-populated with current live settings.",
        });
      } else {
        // Baseline fetch failed, just mark as control
        onVariantsChange(
          variants.map(v => ({ ...v, isControl: v.id === variantId }))
        );
      }
    } else {
      // Unchecking control - prevent if this is the only control variant
      const hasOtherControl = variants.some(v => v.id !== variantId && v.isControl);
      if (!hasOtherControl && variants.length > 1) {
        toast({
          title: "Cannot remove control",
          description: "At least one variant must be marked as control. Please mark another variant as control first.",
          variant: "destructive",
        });
        return;
      }
      // Allow unchecking if it's the only variant or there's another control
      onVariantsChange(
        variants.map(v => v.id === variantId ? { ...v, isControl: false } : v)
      );
    }
  };

  const addVariant = () => {
    const variantCount = variants.length;
    const newVariant: Variant = {
      id: `variant-${Date.now()}`,
      name: variantCount === 0 ? "Control (Original)" : `Variant ${String.fromCharCode(65 + variantCount)}`,
      description: "",
      trafficWeight: 50,
      isControl: variantCount === 0,
      configuration: {},
    };
    
    onVariantsChange([...variants, newVariant]);
    setExpandedVariant(newVariant.id);
  };

  const removeVariant = (id: string) => {
    onVariantsChange(variants.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, updates: Partial<Variant>) => {
    onVariantsChange(
      variants.map(v => v.id === id ? { ...v, ...updates } : v)
    );
  };

  const totalWeight = variants.reduce((sum, v) => sum + v.trafficWeight, 0);
  const hasControl = variants.some(v => v.isControl);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configure Test Variants</h3>
        <p className="text-sm text-muted-foreground">
          Create different versions to test against each other. Each variant can reference existing content from the Content Manager.
        </p>
      </div>

      {/* Baseline Target Selector */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">Baseline Reference (Optional)</CardTitle>
              <CardDescription className="text-xs mt-1">
                Select a persona and funnel stage to auto-populate the control variant with current live configuration
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Persona</Label>
              <Select
                value={baselineTarget?.persona || ""}
                onValueChange={(value) => {
                  if (value && baselineTarget?.funnelStage) {
                    onBaselineTargetChange({ persona: value, funnelStage: baselineTarget.funnelStage });
                  } else if (value) {
                    onBaselineTargetChange({ persona: value, funnelStage: '' });
                  } else {
                    onBaselineTargetChange(undefined);
                  }
                }}
              >
                <SelectTrigger data-testid="select-baseline-persona" className="h-8">
                  <SelectValue placeholder="Select persona..." />
                </SelectTrigger>
                <SelectContent>
                  {PERSONAS.map((persona) => (
                    <SelectItem key={persona.value} value={persona.value}>
                      {persona.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Funnel Stage</Label>
              <Select
                value={baselineTarget?.funnelStage || ""}
                onValueChange={(value) => {
                  if (value && baselineTarget?.persona) {
                    onBaselineTargetChange({ persona: baselineTarget.persona, funnelStage: value });
                  } else if (value) {
                    onBaselineTargetChange({ persona: '', funnelStage: value });
                  } else {
                    onBaselineTargetChange(undefined);
                  }
                }}
              >
                <SelectTrigger data-testid="select-baseline-funnel" className="h-8">
                  <SelectValue placeholder="Select stage..." />
                </SelectTrigger>
                <SelectContent>
                  {FUNNEL_STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic weight warning */}
      {totalWeight !== 100 && variants.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Traffic weights should sum to 100%. Currently: {totalWeight}%
          </AlertDescription>
        </Alert>
      )}

      {/* Control variant warning */}
      {!hasControl && variants.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            At least one variant should be marked as the control (baseline) for comparison.
          </AlertDescription>
        </Alert>
      )}

      {/* Variants list */}
      <div className="space-y-4">
        {variants.map((variant, index) => (
          <Card key={variant.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Input
                        value={variant.name}
                        onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                        className="font-semibold h-8 max-w-xs"
                        placeholder="Variant name"
                        data-testid={`input-variant-name-${index}`}
                      />
                      {variant.isControl && (
                        <>
                          <Badge variant="outline" className="text-xs">Control</Badge>
                          {hasBaselineTarget && Object.keys(variant.configuration || {}).length > 0 && (
                            <Badge variant="secondary" className="text-xs">Current Live</Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedVariant(expandedVariant === variant.id ? null : variant.id)}
                    data-testid={`button-toggle-variant-${index}`}
                  >
                    {expandedVariant === variant.id ? "Collapse" : "Expand"}
                  </Button>
                  {!variant.isControl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(variant.id)}
                      data-testid={`button-remove-variant-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {expandedVariant === variant.id && (
              <CardContent className="space-y-4 pt-0">
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={variant.description}
                    onChange={(e) => updateVariant(variant.id, { description: e.target.value })}
                    placeholder="What's different in this variant?"
                    rows={2}
                    data-testid={`input-variant-description-${index}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Traffic Weight (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={variant.trafficWeight}
                      onChange={(e) => updateVariant(variant.id, { trafficWeight: parseInt(e.target.value) || 0 })}
                      data-testid={`input-variant-weight-${index}`}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={variant.isControl}
                        onCheckedChange={(checked) => handleControlToggle(variant.id, checked)}
                        data-testid={`switch-variant-control-${index}`}
                      />
                      <Label className="text-sm">
                        Mark as control
                        {hasBaselineTarget && variant.isControl && isLoadingBaseline && (
                          <span className="text-xs text-muted-foreground ml-2">(loading baseline...)</span>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Content selection based on test type */}
                {renderVariantConfig(testType, variant, updateVariant, contentItems, isLoadingContent, images)}

                {/* Historical test results for control variant */}
                {variant.isControl && (
                  <div className="mt-4 pt-4 border-t">
                    <HistoricalTestResults
                      persona={baselineTarget?.persona}
                      funnelStage={baselineTarget?.funnelStage}
                      testType={testType}
                    />
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Add variant button */}
      <Button
        variant="outline"
        onClick={addVariant}
        className="w-full"
        data-testid="button-add-variant"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Variant
      </Button>

      {variants.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No variants yet. Add your first variant to get started.</p>
          <Button onClick={addVariant} data-testid="button-add-first-variant">
            <Plus className="w-4 h-4 mr-2" />
            Add First Variant
          </Button>
        </div>
      )}
    </div>
  );
}

function getContentTypeForTest(testType: string): string | null {
  const typeMap: Record<string, string> = {
    'hero_variation': 'hero',
    'cta_variation': 'cta',
    'service_card_order': 'service',
    'event_card_order': 'event',
  };
  return typeMap[testType] || null;
}

function renderVariantConfig(
  testType: string,
  variant: Variant,
  updateVariant: (id: string, updates: Partial<Variant>) => void,
  contentItems: ContentItem[],
  isLoading: boolean,
  images: any[]
) {
  // Hero or CTA variation: support both existing and custom modes
  if (testType === 'hero_variation' || testType === 'cta_variation') {
    const mode = variant.creationMode || 'existing';
    const contentTypeLabel = testType === 'hero_variation' ? 'Hero Section' : 'CTA Section';
    
    return (
      <div className="space-y-4">
        {/* Mode selector */}
        <div>
          <Label>Content Source</Label>
          <RadioGroup
            value={mode}
            onValueChange={(value) => updateVariant(variant.id, { creationMode: value as 'existing' | 'custom' })}
            className="flex gap-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id={`${variant.id}-existing`} />
              <Label htmlFor={`${variant.id}-existing`} className="font-normal cursor-pointer">
                Select Existing
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id={`${variant.id}-custom`} />
              <Label htmlFor={`${variant.id}-custom`} className="font-normal cursor-pointer">
                Create Custom
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Existing content selector */}
        {mode === 'existing' && (
          <div>
            <Label>{contentTypeLabel}</Label>
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-2">Loading content items...</div>
            ) : (
              <Select
                value={variant.contentItemId || ""}
                onValueChange={(value) => updateVariant(variant.id, { contentItemId: value })}
              >
                <SelectTrigger data-testid={`select-content-item-${variant.id}`}>
                  {variant.contentItemId ? (
                    <span className="truncate">
                      {contentItems.find(item => item.id === variant.contentItemId)?.title || "Unknown item"} 
                      <span className="text-muted-foreground ml-2">
                        • ID: {variant.contentItemId.slice(-8)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Choose an existing item...</span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {contentItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex flex-col gap-1 py-1">
                        <div className="flex items-center gap-2">
                          {item.imageName && <ImageIcon className="w-3 h-3 text-muted-foreground" />}
                          <span className="font-medium">{item.title}</span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {item.imageName && <span>Image: {item.imageName}</span>}
                          <span>•</span>
                          <span>ID: {item.id.slice(-8)}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {variant.contentItemId && (
              <p className="text-xs text-muted-foreground mt-1">
                This variant will display the selected {contentTypeLabel.toLowerCase()}
              </p>
            )}
          </div>
        )}

        {/* Custom content form */}
        {mode === 'custom' && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Create a new {contentTypeLabel.toLowerCase()} that will be saved to the Content Manager
            </p>
            
            {/* Image selection */}
            <div className="space-y-2">
              <Label>Image</Label>
              
              {/* Image preview */}
              {variant.configuration?.imageName && (
                <div className="relative aspect-video rounded-md overflow-hidden bg-muted max-w-xs">
                  <img
                    src={images.find(img => img.name === variant.configuration?.imageName)?.cloudinarySecureUrl || ''}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Image selector */}
              <Select 
                value={variant.configuration?.imageName || ''}
                onValueChange={(imageName: string) => 
                  updateVariant(variant.id, { 
                    configuration: { ...variant.configuration, imageName } 
                  })
                }
              >
                <SelectTrigger data-testid={`select-image-${variant.id}`}>
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
              
              <p className="text-xs text-muted-foreground">
                Note: Upload new images through the Content Manager
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title / Headline</Label>
              <Input
                value={variant.configuration?.title || ''}
                onChange={(e) =>
                  updateVariant(variant.id, {
                    configuration: { ...variant.configuration, title: e.target.value }
                  })
                }
                placeholder="Enter headline text"
                data-testid={`input-custom-title-${variant.id}`}
              />
              {variant.configuration?.title && 
                contentItems.some(item => 
                  item.title.toLowerCase() === variant.configuration?.title?.toLowerCase()
                ) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    A content item with this title already exists. Consider using a unique name to avoid confusion.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Description</Label>
                <CopyVariantGenerator
                  buttonText="Generate with AI"
                  buttonVariant="outline"
                  contentType={testType === 'hero_variation' ? 'hero' : 'cta'}
                  onSelectVariant={(text) => {
                    updateVariant(variant.id, {
                      configuration: { ...variant.configuration, description: text }
                    });
                  }}
                />
              </div>
              <Textarea
                value={variant.configuration?.description || ''}
                onChange={(e) =>
                  updateVariant(variant.id, {
                    configuration: { ...variant.configuration, description: e.target.value }
                  })
                }
                placeholder="Enter description text"
                rows={3}
                data-testid={`input-custom-description-${variant.id}`}
              />
            </div>

            {/* CTA Buttons (for hero only) */}
            {testType === 'hero_variation' && (
              <>
                <div>
                  <Label>Primary Button Text</Label>
                  <Input
                    value={variant.configuration?.primaryButton || ''}
                    onChange={(e) =>
                      updateVariant(variant.id, {
                        configuration: { ...variant.configuration, primaryButton: e.target.value }
                      })
                    }
                    placeholder="e.g., Get Started"
                    data-testid={`input-custom-primary-btn-${variant.id}`}
                  />
                </div>
                <div>
                  <Label>Secondary Button Text</Label>
                  <Input
                    value={variant.configuration?.secondaryButton || ''}
                    onChange={(e) =>
                      updateVariant(variant.id, {
                        configuration: { ...variant.configuration, secondaryButton: e.target.value }
                      })
                    }
                    placeholder="e.g., Learn More"
                    data-testid={`input-custom-secondary-btn-${variant.id}`}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Card order tests: configure ordering
  if (testType === 'service_card_order' || testType === 'event_card_order') {
    return (
      <div>
        <Label>Card Order Configuration</Label>
        <Textarea
          value={JSON.stringify(variant.configuration || {}, null, 2)}
          onChange={(e) => {
            try {
              const config = JSON.parse(e.target.value);
              updateVariant(variant.id, { configuration: config });
            } catch (err) {
              // Invalid JSON, don't update
            }
          }}
          placeholder='{"order": ["newest", "popular", "featured"]}'
          rows={4}
          className="font-mono text-sm"
          data-testid={`input-variant-config-${variant.id}`}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Define card ordering logic as JSON
        </p>
      </div>
    );
  }

  // Messaging test: text overrides
  if (testType === 'messaging_test') {
    return (
      <div>
        <Label>Message Overrides</Label>
        <Textarea
          value={JSON.stringify(variant.configuration || {}, null, 2)}
          onChange={(e) => {
            try {
              const config = JSON.parse(e.target.value);
              updateVariant(variant.id, { configuration: config });
            } catch (err) {
              // Invalid JSON, don't update
            }
          }}
          placeholder='{"headline": "New headline", "cta": "Custom CTA text"}'
          rows={4}
          className="font-mono text-sm"
          data-testid={`input-variant-config-${variant.id}`}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Define text overrides as JSON
        </p>
      </div>
    );
  }

  // Default: generic configuration
  return (
    <div>
      <Label>Configuration</Label>
      <Textarea
        value={JSON.stringify(variant.configuration || {}, null, 2)}
        onChange={(e) => {
          try {
            const config = JSON.parse(e.target.value);
            updateVariant(variant.id, { configuration: config });
          } catch (err) {
            // Invalid JSON, don't update
          }
        }}
        placeholder='{}'
        rows={4}
        className="font-mono text-sm"
        data-testid={`input-variant-config-${variant.id}`}
      />
    </div>
  );
}
