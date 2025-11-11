import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AITextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fieldType: string;
  contentType: string;
  title?: string;
  persona?: string;
  rows?: number;
  placeholder?: string;
  id?: string;
  "data-testid"?: string;
  helperText?: string;
  getContext?: () => { title?: string; persona?: string };
}

export function AITextarea({
  label,
  value,
  onChange,
  fieldType,
  contentType,
  title,
  persona,
  rows = 4,
  placeholder,
  id,
  "data-testid": dataTestId,
  helperText,
  getContext,
}: AITextareaProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const previousValueRef = useRef<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      
      // Get dynamic context if provided, otherwise use props
      const context = getContext ? getContext() : { title, persona };
      
      // Store current value for undo
      previousValueRef.current = value;

      const response = await apiRequest("POST", "/api/ai/generate-field-text", {
        fieldType,
        contentType,
        currentValue: value || undefined,
        title: context.title,
        persona: context.persona,
      });

      const data = await response.json();
      
      if (data.text) {
        onChange(data.text);
        
        // Show success toast with undo option
        toast({
          title: "AI Generated",
          description: "Text has been generated. You can edit it further or undo.",
          action: previousValueRef.current !== null ? {
            label: "Undo",
            onClick: () => {
              if (previousValueRef.current !== null) {
                onChange(previousValueRef.current);
                previousValueRef.current = null;
                toast({
                  title: "Undone",
                  description: "AI generation has been undone.",
                });
              }
            },
          } : undefined,
        });
      }
    } catch (error: any) {
      console.error("AI generation failed:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="h-auto py-1"
          data-testid={`button-ai-generate-${fieldType}`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 mr-1.5" />
              Generate with AI
            </>
          )}
        </Button>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        data-testid={dataTestId}
        disabled={isGenerating}
      />
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
