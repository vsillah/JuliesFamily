import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Users, Target as TargetIcon, TrendingUp } from "lucide-react";

type Persona = "student" | "provider" | "parent" | "volunteer" | "donor" | null;
type FunnelStage = "awareness" | "consideration" | "decision" | "retention" | null;

interface TargetStepProps {
  targetPersona: Persona;
  targetFunnelStage: FunnelStage;
  trafficAllocation: number;
  onPersonaChange: (persona: Persona) => void;
  onFunnelStageChange: (stage: FunnelStage) => void;
  onTrafficChange: (traffic: number) => void;
}

const PERSONAS = [
  { value: null, label: "All Personas", description: "Show to everyone" },
  { value: "student", label: "Adult Education Student", description: "Prospective or current students" },
  { value: "provider", label: "Service Provider", description: "Healthcare or social service professionals" },
  { value: "parent", label: "Parent", description: "Parents seeking family services" },
  { value: "volunteer", label: "Volunteer", description: "Potential or active volunteers" },
  { value: "donor", label: "Donor", description: "Current or prospective donors" },
];

const FUNNEL_STAGES = [
  { value: null, label: "All Stages", description: "Every visitor" },
  { value: "awareness", label: "Awareness (TOFU)", description: "Just discovered your organization" },
  { value: "consideration", label: "Consideration (MOFU)", description: "Evaluating options" },
  { value: "decision", label: "Decision (BOFU)", description: "Ready to take action" },
  { value: "retention", label: "Retention", description: "Existing clients/donors" },
];

export function TargetStep({
  targetPersona,
  targetFunnelStage,
  trafficAllocation,
  onPersonaChange,
  onFunnelStageChange,
  onTrafficChange,
}: TargetStepProps) {
  const selectedPersona = PERSONAS.find(p => p.value === targetPersona);
  const selectedStage = FUNNEL_STAGES.find(s => s.value === targetFunnelStage);

  // Calculate estimated audience size (simplified)
  const getAudienceSize = () => {
    let base = 100;
    if (targetPersona) base *= 0.20; // Each persona is ~20% of traffic
    if (targetFunnelStage) base *= 0.25; // Each stage is ~25% of traffic
    base *= (trafficAllocation / 100);
    return Math.round(base);
  };

  const audienceSize = getAudienceSize();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Target Audience</h3>
        <p className="text-sm text-muted-foreground">
          Choose which visitors will see this test. More specific targeting gives clearer insights but requires more time to reach statistical significance.
        </p>
      </div>

      {/* Persona Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base">Persona Targeting</CardTitle>
              <CardDescription className="text-sm">
                Limit test to a specific visitor persona
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Persona</Label>
            <Select
              value={targetPersona || "all"}
              onValueChange={(value) => onPersonaChange(value === "all" ? null : value as Persona)}
            >
              <SelectTrigger data-testid="select-persona">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERSONAS.map((persona) => (
                  <SelectItem key={persona.value || "all"} value={persona.value || "all"}>
                    <div>
                      <div className="font-medium">{persona.label}</div>
                      <div className="text-xs text-muted-foreground">{persona.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedPersona && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                <strong>Selected:</strong> {selectedPersona.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{selectedPersona.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funnel Stage Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TargetIcon className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base">Funnel Stage Targeting</CardTitle>
              <CardDescription className="text-sm">
                Limit test to a specific point in the visitor journey
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Funnel Stage</Label>
            <Select
              value={targetFunnelStage || "all"}
              onValueChange={(value) => onFunnelStageChange(value === "all" ? null : value as FunnelStage)}
            >
              <SelectTrigger data-testid="select-funnel-stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUNNEL_STAGES.map((stage) => (
                  <SelectItem key={stage.value || "all"} value={stage.value || "all"}>
                    <div>
                      <div className="font-medium">{stage.label}</div>
                      <div className="text-xs text-muted-foreground">{stage.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedStage && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                <strong>Selected:</strong> {selectedStage.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{selectedStage.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Traffic Allocation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base">Traffic Allocation</CardTitle>
              <CardDescription className="text-sm">
                Percentage of targeted visitors to include in test
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Test Traffic</Label>
              <Badge variant="outline">{trafficAllocation}%</Badge>
            </div>
            <Slider
              value={[trafficAllocation]}
              onValueChange={(values) => onTrafficChange(values[0])}
              min={10}
              max={100}
              step={10}
              data-testid="slider-traffic"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>10%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <div className="p-3 bg-muted rounded-md space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Test participants:</span>
              <span className="font-medium">{trafficAllocation}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Excluded visitors:</span>
              <span className="font-medium">{100 - trafficAllocation}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audience Summary */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Estimated reach:</strong> ~{audienceSize}% of total website traffic will see this test.
          {audienceSize < 20 && (
            <span className="block mt-1 text-xs">
              ⚠️ Small audience size may require 2-4 weeks to reach statistical significance.
            </span>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
