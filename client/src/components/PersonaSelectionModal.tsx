import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap, Handshake, Baby, Heart, Hand } from "lucide-react";
import { usePersona, personaConfigs } from "@/contexts/PersonaContext";

const iconComponents = {
  GraduationCap,
  Handshake,
  Baby,
  Heart,
  Hand
};

export default function PersonaSelectionModal() {
  const { showPersonaModal, setShowPersonaModal, setPersona } = usePersona();

  const handlePersonaSelect = (personaId: typeof personaConfigs[number]["id"]) => {
    setPersona(personaId);
    setShowPersonaModal(false);
  };

  const handleSkip = () => {
    setShowPersonaModal(false);
  };

  return (
    <Dialog open={showPersonaModal} onOpenChange={setShowPersonaModal}>
      <DialogContent className="sm:max-w-[650px] bg-muted/30 border-muted" data-testid="dialog-persona-selection">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-3xl sm:text-4xl font-serif font-semibold text-[#f7f5f3]">
            Welcome to <span className="italic">Julie's</span>
          </DialogTitle>
          <DialogDescription className="text-base sm:text-lg pt-3 max-w-md mx-auto leading-relaxed text-[#f7f5f3]">
            We're here to support your journey. Help us personalize your experience by telling us what brings you here today.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-6 px-1">
          {personaConfigs.map((config) => {
            const IconComponent = iconComponents[config.iconName];
            return (
              <button
                key={config.id}
                onClick={() => handlePersonaSelect(config.id)}
                className="group relative bg-card border border-card-border rounded-md p-5 text-left transition-all hover-elevate active-elevate-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                data-testid={`button-persona-${config.id}`}
              >
                <div className="flex items-start gap-4 w-full">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="font-semibold text-lg mb-1.5 text-foreground">{config.label}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{config.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center pt-2 pb-2 border-t border-muted">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-skip-persona"
          >
            I'll explore on my own
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
