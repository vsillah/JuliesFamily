import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FlaskConical, Users, Target as TargetIcon, 
  TrendingUp, CheckCircle2, AlertCircle 
} from "lucide-react";

type Persona = "student" | "provider" | "parent" | "volunteer" | "donor" | null;
type FunnelStage = "awareness" | "consideration" | "decision" | "retention" | null;

interface Variant {
  id: string;
  name: string;
  description: string;
  trafficWeight: number;
  isControl: boolean;
  contentItemId?: string;
  configuration: Record<string, any>;
}

interface ReviewStepProps {
  testName: string;
  testDescription: string;
  testType: string;
  variants: Variant[];
  targetPersona: Persona;
  targetFunnelStage: FunnelStage;
  trafficAllocation: number;
}

const PERSONA_LABELS: Record<string, string> = {
  student: "Adult Education Student",
  provider: "Service Provider",
  parent: "Parent",
  volunteer: "Volunteer",
  donor: "Donor",
};

const STAGE_LABELS: Record<string, string> = {
  awareness: "Awareness (TOFU)",
  consideration: "Consideration (MOFU)",
  decision: "Decision (BOFU)",
  retention: "Retention",
};

const TEST_TYPE_LABELS: Record<string, string> = {
  hero_variation: "Hero Section Variation",
  cta_variation: "Call-to-Action Variation",
  service_card_order: "Service Card Order",
  event_card_order: "Event Card Order",
  messaging_test: "Messaging Test",
  layout_test: "Layout Test",
};

export function ReviewStep({
  testName,
  testDescription,
  testType,
  variants,
  targetPersona,
  targetFunnelStage,
  trafficAllocation,
}: ReviewStepProps) {
  const totalWeight = variants.reduce((sum, v) => sum + v.trafficWeight, 0);
  const hasControl = variants.some(v => v.isControl);
  const hasValidWeights = totalWeight === 100;

  const isReadyToLaunch = variants.length >= 2 && hasControl && hasValidWeights;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Launch</h3>
        <p className="text-sm text-muted-foreground">
          Review your test configuration before launching. You can edit any step by going back.
        </p>
      </div>

      {/* Test Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Test Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Test Name</p>
            <p className="font-medium">{testName || "Untitled Test"}</p>
          </div>
          {testDescription && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{testDescription}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Test Type</p>
            <Badge variant="outline">{TEST_TYPE_LABELS[testType] || testType}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Variants Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variants ({variants.length})</CardTitle>
          <CardDescription>
            {hasValidWeights ? (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-3 h-3" />
                Traffic weights balanced (100%)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-destructive">
                <AlertCircle className="w-3 h-3" />
                Traffic weights must sum to 100% (currently {totalWeight}%)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.id}>
              {index > 0 && <Separator className="my-3" />}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{variant.name}</p>
                    {variant.isControl && (
                      <Badge variant="outline" className="text-xs">Control</Badge>
                    )}
                  </div>
                  {variant.description && (
                    <p className="text-sm text-muted-foreground">{variant.description}</p>
                  )}
                  {variant.contentItemId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Content Item ID: {variant.contentItemId}
                    </p>
                  )}
                </div>
                <Badge className="shrink-0">{variant.trafficWeight}%</Badge>
              </div>
            </div>
          ))}
          
          {variants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No variants configured yet.</p>
              <p className="text-sm">Go back to Configure step to add variants.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Targeting Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Audience Targeting</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Persona</p>
              <Badge variant="outline">
                {targetPersona ? PERSONA_LABELS[targetPersona] : "All Personas"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Funnel Stage</p>
              <Badge variant="outline">
                {targetFunnelStage ? STAGE_LABELS[targetFunnelStage] : "All Stages"}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Traffic Allocation</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary"
                  style={{ width: `${trafficAllocation}%` }}
                />
              </div>
              <span className="text-sm font-medium">{trafficAllocation}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Launch Readiness */}
      {!isReadyToLaunch && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cannot launch test yet:</strong>
            <ul className="list-disc list-inside mt-2 text-sm space-y-1">
              {variants.length < 2 && (
                <li>Add at least 2 variants (current: {variants.length})</li>
              )}
              {!hasControl && variants.length > 0 && (
                <li>Mark one variant as the control</li>
              )}
              {!hasValidWeights && variants.length > 0 && (
                <li>Ensure traffic weights sum to 100%</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isReadyToLaunch && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <strong>Ready to launch!</strong> Click "Launch Test" below to start your A/B test.
            The test will begin immediately and visitor assignments will be tracked.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
