import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, GraduationCap, Handshake, Baby, Heart, Hand, TrendingUp } from "lucide-react";
import { usePersona, personaConfigs, type Persona } from "@/contexts/PersonaContext";
import { useAuth } from "@/hooks/useAuth";

const iconComponents = {
  GraduationCap,
  Handshake,
  Baby,
  Heart,
  Hand,
};

type FunnelStage = "awareness" | "consideration" | "decision" | "retention";

const funnelStageConfigs = [
  { id: "awareness", label: "Awareness (TOFU)", description: "Just discovered us" },
  { id: "consideration", label: "Consideration (MOFU)", description: "Exploring options" },
  { id: "decision", label: "Decision (BOFU)", description: "Ready to enroll/donate" },
  { id: "retention", label: "Retention", description: "Active participant" },
];

const ADMIN_PERSONA_KEY = "admin-persona-override";
const ADMIN_FUNNEL_KEY = "admin-funnel-override";

interface AdminPersonaSwitcherProps {
  isScrolled?: boolean;
}

export function AdminPersonaSwitcher({ isScrolled = false }: AdminPersonaSwitcherProps) {
  const { user } = useAuth();
  const { persona, setPersona } = usePersona();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona>(persona);
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelStage | "none">(
    sessionStorage.getItem(ADMIN_FUNNEL_KEY) as FunnelStage || "none"
  );

  useEffect(() => {
    const adminPersonaOverride = sessionStorage.getItem(ADMIN_PERSONA_KEY);
    if (adminPersonaOverride && adminPersonaOverride !== "none") {
      setSelectedPersona(adminPersonaOverride as Persona);
    } else {
      setSelectedPersona(persona);
    }

    const adminFunnelOverride = sessionStorage.getItem(ADMIN_FUNNEL_KEY);
    if (adminFunnelOverride) {
      setSelectedFunnel(adminFunnelOverride as FunnelStage);
    } else {
      setSelectedFunnel("none");
    }
  }, [persona]);

  if (!user?.isAdmin) {
    return null;
  }

  const handleApply = () => {
    setPersona(selectedPersona);
    if (selectedFunnel && selectedFunnel !== "none") {
      sessionStorage.setItem(ADMIN_FUNNEL_KEY, selectedFunnel);
    } else {
      sessionStorage.removeItem(ADMIN_FUNNEL_KEY);
    }
    sessionStorage.setItem(ADMIN_PERSONA_KEY, selectedPersona || "none");
    setShowDialog(false);
    window.location.reload();
  };

  const handleReset = () => {
    setPersona(null);
    setSelectedPersona(null);
    setSelectedFunnel("none");
    sessionStorage.removeItem(ADMIN_FUNNEL_KEY);
    sessionStorage.removeItem(ADMIN_PERSONA_KEY);
    setShowDialog(false);
    window.location.reload();
  };

  const isOverriding = sessionStorage.getItem(ADMIN_PERSONA_KEY) !== null;
  const currentFunnel = sessionStorage.getItem(ADMIN_FUNNEL_KEY) as FunnelStage;
  const currentPersonaConfig = personaConfigs.find(p => p.id === persona);
  const currentFunnelConfig = funnelStageConfigs.find(f => f.id === currentFunnel);

  return (
    <>
      <div className="flex items-center gap-2">
        {isOverriding && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Viewing as: {currentPersonaConfig?.label || "Default"}
              {currentFunnelConfig && ` • ${currentFunnelConfig.label}`}
            </span>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDialog(true)}
          data-testid="button-admin-persona-switcher"
          className={isScrolled ? "" : "border-white/30 text-white hover:bg-white/10"}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview Mode
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]" data-testid="dialog-admin-persona-switcher">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Admin Preview Mode
            </DialogTitle>
            <DialogDescription>
              Preview the site from different user perspectives. Choose a persona type and funnel stage to see personalized content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Persona Type</label>
              <Select
                value={selectedPersona || "none"}
                onValueChange={(value) => setSelectedPersona(value === "none" ? null : value as Persona)}
              >
                <SelectTrigger data-testid="select-persona">
                  <SelectValue placeholder="Select a persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default (No persona)</SelectItem>
                  {personaConfigs.map((config) => {
                    const IconComponent = iconComponents[config.iconName];
                    return (
                      <SelectItem key={config.id} value={config.id!}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedPersona && (
                <p className="text-sm text-muted-foreground">
                  {personaConfigs.find(p => p.id === selectedPersona)?.description}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Funnel Stage
              </label>
              <Select
                value={selectedFunnel}
                onValueChange={(value) => setSelectedFunnel(value as FunnelStage | "none")}
              >
                <SelectTrigger data-testid="select-funnel">
                  <SelectValue placeholder="Select a funnel stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None selected</SelectItem>
                  {funnelStageConfigs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFunnel && selectedFunnel !== "none" && (
                <p className="text-sm text-muted-foreground">
                  {funnelStageConfigs.find(f => f.id === selectedFunnel)?.description}
                </p>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-md border">
              <p className="text-sm text-muted-foreground">
                <strong>Preview Mode</strong> lets you see how different users experience the site. Content will be personalized based on the selected persona and funnel stage.
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            {isOverriding && (
              <Button
                variant="outline"
                onClick={handleReset}
                data-testid="button-reset-view"
              >
                Reset to Default
              </Button>
            )}
            <Button
              onClick={handleApply}
              data-testid="button-apply-view"
            >
              Apply Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
