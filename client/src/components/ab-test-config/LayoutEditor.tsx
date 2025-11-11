import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useLayoutTemplates } from "./hooks/useLayoutTemplates";
import type { LayoutConfig } from "@shared/schema";

interface LayoutEditorProps {
  value: LayoutConfig;
  onChange: (value: LayoutConfig) => void;
  errors?: Record<string, string>;
}

export function LayoutEditor({ value, onChange, errors }: LayoutEditorProps) {
  const { data: templates, isLoading, error } = useLayoutTemplates();

  const handleTemplateChange = (templateId: string) => {
    onChange({
      ...value,
      template: templateId as any,
    });
  };

  const handleOptionChange = (key: string, optionValue: any) => {
    onChange({
      ...value,
      options: {
        ...(value.options ?? {}),
        [key]: optionValue,
      },
    });
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="layout-editor-loading">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-4" data-testid="layout-editor-error">
        <div className="flex items-center gap-2 text-destructive py-4">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Failed to load layout templates. Please try again.</span>
        </div>
      </div>
    );
  }

  // Guard against undefined templates
  if (!templates || templates.length === 0) {
    return (
      <div className="space-y-4" data-testid="layout-editor-empty">
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">No layout templates available.</span>
        </div>
      </div>
    );
  }

  const selectedTemplate = templates.find(t => t.id === value.template);
  const hasInvalidTemplate = value.template && !selectedTemplate;

  return (
    <div className="space-y-4" data-testid="layout-editor">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Choose Layout Template</Label>
        
        {/* Warning for missing/invalid template */}
        {hasInvalidTemplate && (
          <div className="flex flex-col gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md mb-3" data-testid="layout-editor-invalid-template">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm flex-1">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Template No Longer Available
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                  The previously selected template "{value.template}" is no longer available. 
                  Please select a new template below.
                </p>
              </div>
            </div>
            
            {/* Show saved configuration for reference */}
            {value.options && Object.keys(value.options).length > 0 && (
              <div className="pl-6 space-y-1">
                <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                  Your Previous Settings:
                </p>
                <div className="text-xs text-amber-800 dark:text-amber-200 space-y-0.5">
                  {value.options.cardStyle && (
                    <div>• Card Style: {value.options.cardStyle}</div>
                  )}
                  {value.options.spacing && (
                    <div>• Spacing: {value.options.spacing}</div>
                  )}
                  {value.options.imagePosition && (
                    <div>• Image Position: {value.options.imagePosition}</div>
                  )}
                  {value.options.columnsOnMobile && (
                    <div>• Mobile Columns: {value.options.columnsOnMobile}</div>
                  )}
                  {value.options.showImages !== undefined && (
                    <div>• Show Images: {value.options.showImages ? 'Yes' : 'No'}</div>
                  )}
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200 mt-1.5">
                  These settings will be preserved when you select a new template.
                </p>
              </div>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {templates.map((template) => {
            const isSelected = value.template === template.id;
            return (
              <Card
                key={template.id}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary border-2 bg-primary/5'
                    : 'hover-elevate'
                }`}
                onClick={() => handleTemplateChange(template.id)}
                data-testid={`layout-template-${template.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  </div>
                  <div className="text-2xl font-mono text-muted-foreground shrink-0">
                    {template.preview}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        {errors?.template && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.template}
          </p>
        )}
      </div>

      {/* Always show layout options panel - even for legacy variants with missing templates and undefined options */}
      <div className="space-y-4 pt-2 border-t">
        <h4 className="text-sm font-semibold">Layout Options</h4>
        
        {hasInvalidTemplate && !selectedTemplate && (
          <p className="text-xs text-muted-foreground mb-3">
            Select a template above to configure layout options.
          </p>
        )}

        <div className="space-y-4">{/* Layout options container always renders */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card Style */}
            <div className="space-y-2">
              <Label htmlFor="card-style" className="text-sm font-medium">Card Style</Label>
              <Select
                value={value.options?.cardStyle || 'elevated'}
                onValueChange={(val) => handleOptionChange('cardStyle', val)}
              >
                <SelectTrigger id="card-style" className="text-sm" data-testid="select-card-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elevated">Elevated (with shadow)</SelectItem>
                  <SelectItem value="flat">Flat (no shadow)</SelectItem>
                  <SelectItem value="bordered">Bordered (outline only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Visual appearance of content cards
              </p>
            </div>

            {/* Spacing */}
            <div className="space-y-2">
              <Label htmlFor="spacing" className="text-sm font-medium">Spacing</Label>
              <Select
                value={value.options?.spacing || 'comfortable'}
                onValueChange={(val) => handleOptionChange('spacing', val)}
              >
                <SelectTrigger id="spacing" className="text-sm" data-testid="select-spacing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact (tight spacing)</SelectItem>
                  <SelectItem value="comfortable">Comfortable (medium spacing)</SelectItem>
                  <SelectItem value="spacious">Spacious (generous spacing)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Gap between content cards
              </p>
            </div>

            {/* Image Position */}
            <div className="space-y-2">
              <Label htmlFor="image-position" className="text-sm font-medium">Image Position</Label>
              <Select
                value={value.options?.imagePosition || 'top'}
                onValueChange={(val) => handleOptionChange('imagePosition', val)}
              >
                <SelectTrigger id="image-position" className="text-sm" data-testid="select-image-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top (above content)</SelectItem>
                  <SelectItem value="left">Left (beside content)</SelectItem>
                  <SelectItem value="right">Right (beside content)</SelectItem>
                  <SelectItem value="background">Background (behind text)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Where images appear in cards
              </p>
            </div>

            {/* Mobile Columns */}
            <div className="space-y-2">
              <Label htmlFor="mobile-columns" className="text-sm font-medium">Mobile Columns</Label>
              <Select
                value={value.options?.columnsOnMobile || '1'}
                onValueChange={(val) => handleOptionChange('columnsOnMobile', val)}
              >
                <SelectTrigger id="mobile-columns" className="text-sm" data-testid="select-mobile-columns">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Column (stacked)</SelectItem>
                  <SelectItem value="2">2 Columns (side-by-side)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Number of columns on mobile devices
              </p>
            </div>
          </div>

          {/* Show Images Toggle */}
          <div className="flex items-center gap-3 pt-2">
            <Switch
              checked={value.options?.showImages !== false}
              onCheckedChange={(checked) => handleOptionChange('showImages', checked)}
              data-testid="switch-show-images"
            />
            <div>
              <Label className="text-sm font-medium">Show Images</Label>
              <p className="text-xs text-muted-foreground">
                Display images in content cards (hide for text-only layout)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
