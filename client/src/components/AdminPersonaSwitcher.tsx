import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, GraduationCap, Handshake, Baby, Heart, Hand, TrendingUp, X } from "lucide-react";
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
  onOpenDialog?: () => void;
}

export function AdminPersonaSwitcher({ isScrolled = false, onOpenDialog }: AdminPersonaSwitcherProps) {
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

  const handleApply = async () => {
    await setPersona(selectedPersona);
    if (selectedFunnel && selectedFunnel !== "none") {
      sessionStorage.setItem(ADMIN_FUNNEL_KEY, selectedFunnel);
    } else {
      sessionStorage.removeItem(ADMIN_FUNNEL_KEY);
    }
    sessionStorage.setItem(ADMIN_PERSONA_KEY, selectedPersona || "none");
    setShowDialog(false);
    window.location.reload();
  };

  const handleReset = async () => {
    await setPersona(null);
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
          onClick={() => {
            setShowDialog(true);
            // Small delay before closing mobile menu to allow dialog to open
            setTimeout(() => onOpenDialog?.(), 100);
          }}
          data-testid="button-admin-persona-switcher"
          className={isScrolled ? "" : "border-white/30 text-white hover:bg-white/10"}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview Mode
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogPortal>
          <DialogOverlay className="z-[1100]" />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-[50%] top-[50%] z-[1100] grid w-full max-w-[600px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
            )}
            data-testid="dialog-admin-persona-switcher"
          >
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
                  <SelectContent className="z-[1200]">
                    <SelectItem value="none">Default (No persona)</SelectItem>
                    {personaConfigs.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.label}
                      </SelectItem>
                    ))}
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
                  <SelectContent className="z-[1200]">
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

            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
