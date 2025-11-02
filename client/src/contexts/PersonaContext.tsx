import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Persona = 
  | "student"
  | "provider"
  | "parent"
  | "donor"
  | "volunteer"
  | null;

export interface PersonaConfig {
  id: Persona;
  label: string;
  description: string;
  iconName: "GraduationCap" | "Handshake" | "Baby" | "Heart" | "Hand";
}

export const personaConfigs: PersonaConfig[] = [
  {
    id: "student",
    label: "Adult Education Student",
    description: "I want to finish my high school education",
    iconName: "GraduationCap"
  },
  {
    id: "provider",
    label: "Service Provider",
    description: "I'm helping someone find education programs",
    iconName: "Handshake"
  },
  {
    id: "parent",
    label: "Parent",
    description: "I'm looking for preschool or childcare",
    iconName: "Baby"
  },
  {
    id: "donor",
    label: "Donor",
    description: "I want to support your mission",
    iconName: "Heart"
  },
  {
    id: "volunteer",
    label: "Volunteer",
    description: "I want to give my time and skills",
    iconName: "Hand"
  }
];

interface PersonaContextType {
  persona: Persona;
  setPersona: (persona: Persona) => void;
  showPersonaModal: boolean;
  setShowPersonaModal: (show: boolean) => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

const PERSONA_STORAGE_KEY = "julies-persona";
const PERSONA_MODAL_SHOWN_KEY = "julies-persona-modal-shown";

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersonaState] = useState<Persona>(null);
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  useEffect(() => {
    const storedPersona = sessionStorage.getItem(PERSONA_STORAGE_KEY);
    const modalShown = sessionStorage.getItem(PERSONA_MODAL_SHOWN_KEY);
    
    if (storedPersona && storedPersona !== "null") {
      setPersonaState(storedPersona as Persona);
    } else if (!modalShown) {
      setTimeout(() => {
        setShowPersonaModal(true);
        sessionStorage.setItem(PERSONA_MODAL_SHOWN_KEY, "true");
      }, 2000);
    }
  }, []);

  const setPersona = (newPersona: Persona) => {
    setPersonaState(newPersona);
    if (newPersona) {
      sessionStorage.setItem(PERSONA_STORAGE_KEY, newPersona);
    } else {
      sessionStorage.removeItem(PERSONA_STORAGE_KEY);
    }
  };

  return (
    <PersonaContext.Provider value={{ persona, setPersona, showPersonaModal, setShowPersonaModal }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
}
