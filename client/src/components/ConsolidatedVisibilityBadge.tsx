import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, ExternalLink } from "lucide-react";
import { PERSONA_LABELS, FUNNEL_STAGE_LABELS } from "@shared/defaults/personas";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UsageData {
  visibilityAssignments: { persona: string | null; funnelStage: string | null; }[];
  abTests: { testId: string; testName: string; variantName: string; status: string; }[];
}

interface ConsolidatedVisibilityBadgeProps {
  contentId: string;
  isActive: boolean | null;
}

export default function ConsolidatedVisibilityBadge({ 
  contentId, 
  isActive 
}: ConsolidatedVisibilityBadgeProps) {
  const { data: usage, isLoading } = useQuery<UsageData>({
    queryKey: [`/api/content/${contentId}/usage`],
    staleTime: 30000,
  });

  // Function to open preview in new tab with specific persona and funnel stage
  const openPreview = (persona: string | null, funnelStage: string | null) => {
    // Open new window
    const previewWindow = window.open('/', '_blank');
    
    if (previewWindow) {
      // Helper to apply overrides and reload
      const applyOverride = () => {
        previewWindow.sessionStorage.setItem('admin-persona-override', persona || 'none');
        previewWindow.sessionStorage.setItem('admin-funnel-override', funnelStage || 'none');
        // Reload to apply the preview mode
        previewWindow.location.reload();
      };
      
      // If window is already loaded (cached), apply immediately
      if (previewWindow.document.readyState === 'complete') {
        applyOverride();
      } else {
        // Otherwise wait for load event
        previewWindow.addEventListener('load', applyOverride, { once: true });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="secondary" className="text-xs flex-shrink-0 font-semibold w-fit">
          Loading...
        </Badge>
      </div>
    );
  }

  const hasPersonaAssignments = (usage?.visibilityAssignments?.length ?? 0) > 0;
  const isItemActive = isActive ?? false;
  const isVisible = isItemActive && hasPersonaAssignments;

  const getReasonText = () => {
    if (!isItemActive && !hasPersonaAssignments) {
      return "Item is disabled and has no persona assignments";
    }
    if (!isItemActive) {
      return "Item is disabled";
    }
    if (!hasPersonaAssignments) {
      return "No persona assignments";
    }
    return null;
  };

  const reasonText = getReasonText();

  return (
    <div className="flex flex-col gap-1.5">
      {isVisible ? (
        <Badge 
          className="text-xs flex-shrink-0 bg-primary/10 text-primary border border-primary/30 font-semibold w-fit" 
          data-testid={`badge-visible-${contentId}`}
        >
          <Eye className="w-3 h-3 mr-1" />
          Visible
        </Badge>
      ) : (
        <>
          <Badge 
            variant="secondary" 
            className="text-xs flex-shrink-0 font-semibold w-fit" 
            data-testid={`badge-not-visible-${contentId}`}
          >
            <EyeOff className="w-3 h-3 mr-1" />
            Not visible
          </Badge>
          {reasonText && (
            <p className="text-xs text-muted-foreground" data-testid={`text-reason-${contentId}`}>
              {reasonText}
            </p>
          )}
        </>
      )}
      
      {hasPersonaAssignments && (
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {usage?.visibilityAssignments.map((assignment, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center border border-border rounded-md px-2.5 py-0.5 text-xs bg-accent/50 font-normal cursor-pointer hover-elevate transition-all group"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPreview(assignment.persona, assignment.funnelStage);
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  data-testid={`badge-assignment-${contentId}-${index}`}
                >
                  {PERSONA_LABELS[assignment.persona as keyof typeof PERSONA_LABELS] || assignment.persona || 'All'} × {FUNNEL_STAGE_LABELS[assignment.funnelStage as keyof typeof FUNNEL_STAGE_LABELS] || assignment.funnelStage || 'All'}
                  <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to preview this combination</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
}
