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
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-persona-selection">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">Welcome to Julie's Family Learning Program</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Help us personalize your experience. What brings you here today?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {personaConfigs.map((config) => {
            const IconComponent = iconComponents[config.iconName];
            return (
              <Button
                key={config.id}
                variant="outline"
                className="h-auto p-4 justify-start text-left hover-elevate"
                onClick={() => handlePersonaSelect(config.id)}
                data-testid={`button-persona-${config.id}`}
              >
                <div className="flex items-start gap-3 w-full">
                  <IconComponent className="w-6 h-6 flex-shrink-0 text-primary" />
                  <div className="flex-1">
                    <div className="font-semibold text-base mb-1">{config.label}</div>
                    <div className="text-sm text-muted-foreground">{config.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
            data-testid="button-skip-persona"
          >
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
