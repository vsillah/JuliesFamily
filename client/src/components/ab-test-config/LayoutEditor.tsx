import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Check } from "lucide-react";
import { useLayoutTemplates } from "./hooks/useLayoutTemplates";
import type { LayoutConfig } from "@shared/schema";

interface LayoutEditorProps {
  value: LayoutConfig;
  onChange: (value: LayoutConfig) => void;
  errors?: Record<string, string>;
}

export function LayoutEditor({ value, onChange, errors }: LayoutEditorProps) {
  const { data: templates } = useLayoutTemplates();

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
        ...value.options,
        [key]: optionValue,
      },
    });
  };

  const selectedTemplate = templates.find(t => t.id === value.template);

  return (
    <div className="space-y-4" data-testid="layout-editor">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Choose Layout Template</Label>
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

      {selectedTemplate && (
        <div className="space-y-4 pt-2 border-t">
          <h4 className="text-sm font-semibold">Layout Options</h4>

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
      )}
    </div>
  );
}
