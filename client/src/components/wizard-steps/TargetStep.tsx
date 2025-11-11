import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Users, TrendingUp, Info } from "lucide-react";

interface TargetStepProps {
  selectedCombinations: Set<string>;
  trafficAllocation: number;
  onCombinationsChange: (combinations: Set<string>) => void;
  onTrafficChange: (traffic: number) => void;
}

const PERSONAS = [
  { value: "student", label: "Adult Education Student" },
  { value: "provider", label: "Service Provider" },
  { value: "parent", label: "Parent" },
  { value: "volunteer", label: "Volunteer" },
  { value: "donor", label: "Donor" },
];

const FUNNEL_STAGES = [
  { value: "awareness", label: "Awareness" },
  { value: "consideration", label: "Consideration" },
  { value: "decision", label: "Decision" },
  { value: "retention", label: "Retention" },
];

const PERSONA_LABELS: Record<string, string> = {
  student: "Adult Education Student",
  provider: "Service Provider",
  parent: "Parent",
  volunteer: "Volunteer",
  donor: "Donor",
};

const FUNNEL_STAGE_LABELS: Record<string, string> = {
  awareness: "Awareness",
  consideration: "Consideration",
  decision: "Decision",
  retention: "Retention",
};

const getComboKey = (persona: string, stage: string) => `${persona}:${stage}`;

export function TargetStep({
  selectedCombinations,
  trafficAllocation,
  onCombinationsChange,
  onTrafficChange,
}: TargetStepProps) {
  // Fetch available persona×stage combinations that have visible content
  const { data: availableCombinations = [], isLoading, isError, error } = useQuery<{ persona: string; funnelStage: string; }[]>({
    queryKey: ['/api/content/available-combinations'],
  });

  // Create a Set of available combination keys for quick lookup
  const availableCombosSet = new Set(
    availableCombinations.map(c => getComboKey(c.persona, c.funnelStage))
  );

  // Calculate estimated audience reach
  const getAudienceSize = () => {
    const totalPossibleCombinations = 20; // 5 personas × 4 stages
    const selectedCount = selectedCombinations.size;
    
    if (selectedCount === 0) {
      return 0;
    }
    
    // Calculate percentage of all possible combinations
    const combinationPercentage = (selectedCount / totalPossibleCombinations) * 100;
    
    // Apply traffic allocation
    const reach = (combinationPercentage * (trafficAllocation / 100));
    
    return Math.round(reach);
  };

  const audienceSize = getAudienceSize();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Target Audience</h3>
        <p className="text-sm text-muted-foreground">
          Select which persona and journey stage combinations should see this test. Only combinations with existing content are available for selection.
        </p>
      </div>

      {/* Persona × Stage Multi-Select Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <CardTitle className="text-base">Persona × Journey Stage Selection</CardTitle>
              <CardDescription className="text-sm">
                Select the audience segments you want to test
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading available combinations...</div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Failed to load combinations.</strong>
                {(() => {
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                  const is401 = errorMessage.startsWith('401');
                  const is403 = errorMessage.startsWith('403');
                  
                  if (is401 || is403) {
                    return (
                      <>
                        <span className="block mt-1">Authentication required.</span>
                        <span className="block mt-1 text-xs">Please log in or refresh your session to continue.</span>
                      </>
                    );
                  }
                  
                  return <span className="block mt-1">{errorMessage}</span>;
                })()}
              </AlertDescription>
            </Alert>
          ) : availableCombinations.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No content visibility combinations found. Create content in the Content Manager first with specific persona×stage assignments before creating A/B tests.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-lg">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Select multiple combinations to test. Grayed-out checkboxes indicate no content is currently assigned to that combination.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {PERSONAS.map((persona) => (
                  <div key={persona.value} className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      {persona.label}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4">
                      {FUNNEL_STAGES.map((stage) => {
                        const comboKey = getComboKey(persona.value, stage.value);
                        const isAvailable = availableCombosSet.has(comboKey);
                        const isChecked = selectedCombinations.has(comboKey);
                        
                        return (
                          <div key={comboKey} className="flex items-center space-x-2">
                            <Checkbox
                              id={`target-combo-${comboKey}`}
                              checked={isChecked}
                              disabled={!isAvailable}
                              onCheckedChange={(checked) => {
                                const newSet = new Set(selectedCombinations);
                                if (checked) {
                                  newSet.add(comboKey);
                                } else {
                                  newSet.delete(comboKey);
                                }
                                onCombinationsChange(newSet);
                              }}
                              data-testid={`checkbox-target-${comboKey}`}
                            />
                            <Label 
                              htmlFor={`target-combo-${comboKey}`} 
                              className={`text-sm font-normal cursor-pointer leading-tight ${
                                !isAvailable ? 'text-muted-foreground opacity-50' : ''
                              }`}
                            >
                              {stage.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {selectedCombinations.size > 0 && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-2">
                    Selected: {selectedCombinations.size} combination{selectedCombinations.size !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(selectedCombinations).map((combo) => {
                      const [persona, stage] = combo.split(':');
                      return (
                        <Badge key={combo} variant="secondary" className="text-xs">
                          {PERSONA_LABELS[persona]} - {FUNNEL_STAGE_LABELS[stage]}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
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
          {audienceSize < 20 && selectedCombinations.size > 0 && (
            <span className="block mt-1 text-xs">
              ⚠️ Small audience size may require 2-4 weeks to reach statistical significance.
            </span>
          )}
          {selectedCombinations.size === 0 && (
            <span className="block mt-1 text-xs">
              ⚠️ Please select at least one persona×stage combination to target.
            </span>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
