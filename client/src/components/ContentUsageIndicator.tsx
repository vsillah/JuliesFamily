import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, FlaskConical, Eye, CheckCircle2, Pause, FileEdit } from "lucide-react";

interface UsageData {
  visibilityAssignments: { persona: string | null; funnelStage: string | null; }[];
  abTests: { testId: string; testName: string; variantName: string; status: string; }[];
}

interface ContentUsageIndicatorProps {
  contentId: string;
}

const PERSONA_LABELS: Record<string, string> = {
  "adult_education_student": "Student",
  "service_provider": "Provider",
  "parent": "Parent",
  "donor": "Donor",
  "volunteer": "Volunteer",
};

const FUNNEL_STAGE_LABELS: Record<string, string> = {
  "awareness": "Awareness",
  "consideration": "Consideration",
  "decision": "Decision",
  "retention": "Retention",
};

export default function ContentUsageIndicator({ contentId }: ContentUsageIndicatorProps) {
  const { data: usage, isLoading } = useQuery<UsageData>({
    queryKey: [`/api/content/${contentId}/usage`],
    staleTime: 30000, // Cache for 30 seconds to avoid excessive requests
  });

  if (isLoading || !usage) {
    return null;
  }

  const { visibilityAssignments, abTests } = usage;
  
  // Group tests by status
  const activeTests = abTests.filter(test => test.status === 'active');
  const pausedTests = abTests.filter(test => test.status === 'paused');
  const completedTests = abTests.filter(test => test.status === 'completed');
  const draftTests = abTests.filter(test => test.status === 'draft');

  // No usage badges to show (consolidated badge handles visibility status)
  if (visibilityAssignments.length === 0 && abTests.length === 0) {
    return null;
  }

  // Format visibility assignments for display
  const getAssignmentSummary = () => {
    if (visibilityAssignments.length === 0) return null;

    // Check if it's assigned to all personas and stages
    const hasAllPersonas = visibilityAssignments.some(a => a.persona === null);
    const hasAllStages = visibilityAssignments.some(a => a.funnelStage === null);

    if (hasAllPersonas && hasAllStages) {
      return "All Personas × All Stages";
    }

    const personas = new Set<string>();
    const stages = new Set<string>();

    visibilityAssignments.forEach(({ persona, funnelStage }) => {
      if (persona) personas.add(PERSONA_LABELS[persona] || persona);
      if (funnelStage) stages.add(FUNNEL_STAGE_LABELS[funnelStage] || funnelStage);
    });

    const parts: string[] = [];
    if (personas.size > 0) {
      if (personas.size <= 2) {
        parts.push(Array.from(personas).join(", "));
      } else {
        parts.push(`${personas.size} Personas`);
      }
    }
    if (stages.size > 0) {
      if (stages.size <= 2) {
        parts.push(Array.from(stages).join(", "));
      } else {
        parts.push(`${stages.size} Stages`);
      }
    }

    return parts.join(" × ");
  };

  const assignmentSummary = getAssignmentSummary();

  // Detailed breakdown for tooltip
  const getDetailedBreakdown = () => {
    const lines: string[] = [];

    if (visibilityAssignments.length > 0) {
      lines.push("Visible in:");
      visibilityAssignments.forEach(({ persona, funnelStage }) => {
        const personaLabel = persona ? (PERSONA_LABELS[persona] || persona) : "All Personas";
        const stageLabel = funnelStage ? (FUNNEL_STAGE_LABELS[funnelStage] || funnelStage) : "All Stages";
        lines.push(`  • ${personaLabel} → ${stageLabel}`);
      });
    }

    if (abTests.length > 0) {
      if (lines.length > 0) lines.push("");
      lines.push("A/B Tests:");
      abTests.forEach(({ testName, variantName, status }) => {
        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
        lines.push(`  [${statusLabel}] ${testName} (${variantName})`);
      });
    }

    return lines.join("\n");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {assignmentSummary && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="default" className="text-xs cursor-help" data-testid={`badge-visibility-${contentId}`}>
              <Users className="w-3 h-3 mr-1" />
              {assignmentSummary}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <pre className="text-xs whitespace-pre-wrap">{getDetailedBreakdown()}</pre>
          </TooltipContent>
        </Tooltip>
      )}

      {activeTests.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="text-xs cursor-help" data-testid={`badge-ab-test-active-${contentId}`}>
              <FlaskConical className="w-3 h-3 mr-1" />
              {activeTests.length} Active {activeTests.length === 1 ? "Test" : "Tests"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="text-xs">
              <div className="font-semibold mb-1">Active A/B Tests:</div>
              {activeTests.map(test => (
                <div key={test.testId} className="mb-1">
                  • {test.testName} ({test.variantName})
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}

      {pausedTests.length > 0 && (
        <Badge variant="outline" className="text-xs" data-testid={`badge-ab-test-paused-${contentId}`}>
          <Pause className="w-3 h-3 mr-1" />
          {pausedTests.length} Paused
        </Badge>
      )}

      {draftTests.length > 0 && (
        <Badge variant="secondary" className="text-xs" data-testid={`badge-ab-test-draft-${contentId}`}>
          <FileEdit className="w-3 h-3 mr-1" />
          {draftTests.length} Draft
        </Badge>
      )}

      {completedTests.length > 0 && (
        <Badge variant="outline" className="text-xs" data-testid={`badge-ab-test-completed-${contentId}`}>
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {completedTests.length} Completed
        </Badge>
      )}
    </div>
  );
}
