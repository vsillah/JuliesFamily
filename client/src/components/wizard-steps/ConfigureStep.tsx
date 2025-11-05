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
import { Plus, Trash2, Image as ImageIcon, AlertCircle, GripVertical } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ContentItem } from "@shared/schema";

interface Variant {
  id: string;
  name: string;
  description: string;
  trafficWeight: number;
  isControl: boolean;
  contentItemId?: string;
  configuration: Record<string, any>;
}

interface ConfigureStepProps {
  testType: string;
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
}

export function ConfigureStep({ testType, variants, onVariantsChange }: ConfigureStepProps) {
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  // Fetch content items based on test type
  const contentType = getContentTypeForTest(testType);
  const { data: contentItems = [], isLoading: isLoadingContent } = useQuery<ContentItem[]>({
    queryKey: contentType ? [`/api/content/type/${contentType}`] : [],
    enabled: !!contentType && (testType === 'hero_variation' || testType === 'cta_variation'),
  });

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
                        <Badge variant="outline" className="text-xs">Control</Badge>
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
                        onCheckedChange={(checked) => {
                          // Only allow one control
                          if (checked) {
                            onVariantsChange(
                              variants.map(v => ({ ...v, isControl: v.id === variant.id }))
                            );
                          }
                        }}
                        data-testid={`switch-variant-control-${index}`}
                      />
                      <Label className="text-sm">Mark as control</Label>
                    </div>
                  </div>
                </div>

                {/* Content selection based on test type */}
                {renderVariantConfig(testType, variant, updateVariant, contentItems, isLoadingContent)}
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
  isLoading: boolean
) {
  // Hero or CTA variation: select from existing content items
  if (testType === 'hero_variation' || testType === 'cta_variation') {
    return (
      <div>
        <Label>
          {testType === 'hero_variation' ? 'Select Hero Section' : 'Select CTA Section'}
        </Label>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-2">Loading content items...</div>
        ) : (
          <Select
            value={variant.contentItemId || ""}
            onValueChange={(value) => updateVariant(variant.id, { contentItemId: value })}
          >
            <SelectTrigger data-testid={`select-content-item-${variant.id}`}>
              <SelectValue placeholder="Choose an existing item..." />
            </SelectTrigger>
            <SelectContent>
              {contentItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center gap-2">
                    {item.imageName && <ImageIcon className="w-4 h-4" />}
                    <span>{item.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {variant.contentItemId && (
          <p className="text-xs text-muted-foreground mt-1">
            This variant will display the selected {testType === 'hero_variation' ? 'hero' : 'CTA'} content
          </p>
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
