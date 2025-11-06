import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";

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
    <div className="flex flex-col gap-1">
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
    </div>
  );
}
