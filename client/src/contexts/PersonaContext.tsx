import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { type Persona, type FunnelStage as BaseFunnelStage } from "@shared/defaults/personas";

export type { Persona };
export type FunnelStage = BaseFunnelStage | null;

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
  setPersona: (persona: Persona) => Promise<void>;
  funnelStage: FunnelStage;
  showPersonaModal: boolean;
  setShowPersonaModal: (show: boolean) => void;
  isPersonaLoading: boolean;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

const PERSONA_STORAGE_KEY = "julies-persona";
const PERSONA_MODAL_SHOWN_KEY = "julies-persona-modal-shown";
const ADMIN_PERSONA_KEY = "admin-persona-override";
const ADMIN_FUNNEL_KEY = "admin-funnel-override";

export function PersonaProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Initialize persona from session storage to avoid flash
  const getInitialPersona = (): Persona => {
    const adminOverride = sessionStorage.getItem(ADMIN_PERSONA_KEY);
    if (adminOverride && adminOverride !== "none") {
      return adminOverride as Persona;
    }
    // Don't read from session storage for non-admin users during initialization
    // It will be set in the useEffect after auth completes
    return null;
  };
  
  const [persona, setPersonaState] = useState<Persona>(getInitialPersona);
  const [funnelStage, setFunnelStage] = useState<FunnelStage>(null);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  // If we have an admin override already, we're not loading
  const [isPersonaLoading, setIsPersonaLoading] = useState(() => {
    const adminOverride = sessionStorage.getItem(ADMIN_PERSONA_KEY);
    return !(adminOverride && adminOverride !== "none");
  });

  useEffect(() => {
    // Don't do anything while auth is loading
    if (isLoading) {
      setIsPersonaLoading(true);
      return;
    }

    // Don't show persona modal on Kinflo product landing pages
    // Use startsWith to handle query strings and trailing slashes
    const isKinfloPage = location.startsWith('/kinflo') || location.startsWith('/product');

    let timeoutId: NodeJS.Timeout | null = null;

    const adminOverride = sessionStorage.getItem(ADMIN_PERSONA_KEY);
    
    if (adminOverride && adminOverride !== "none") {
      // Admin override takes priority
      setPersonaState(adminOverride as Persona);
    } else if (isAuthenticated && user) {
      // For authenticated users, load persona from database
      if (user.persona) {
        setPersonaState(user.persona as Persona);
      }
      // Don't show modal for authenticated users
    } else {
      // For unauthenticated users, use session storage
      const storedPersona = sessionStorage.getItem(PERSONA_STORAGE_KEY);
      const modalShown = sessionStorage.getItem(PERSONA_MODAL_SHOWN_KEY);
      
      if (storedPersona && storedPersona !== "null") {
        setPersonaState(storedPersona as Persona);
      } else if (!modalShown && !adminOverride && !isKinfloPage) {
        // Only show modal for unauthenticated users on Julie's pages (not Kinflo)
        timeoutId = setTimeout(() => {
          setShowPersonaModal(true);
          sessionStorage.setItem(PERSONA_MODAL_SHOWN_KEY, "true");
        }, 2000);
      }
    }
    
    const adminFunnelOverride = sessionStorage.getItem(ADMIN_FUNNEL_KEY);
    if (adminFunnelOverride && adminFunnelOverride !== "none") {
      setFunnelStage(adminFunnelOverride as FunnelStage);
    } else {
      setFunnelStage("awareness");
    }

    // Mark persona as loaded
    setIsPersonaLoading(false);

    // Cleanup timeout if component unmounts or location changes
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, user, isLoading, location]);

  const setPersona = async (newPersona: Persona) => {
    setPersonaState(newPersona);
    
    if (isAuthenticated) {
      // For authenticated users, save to database
      try {
        await apiRequest("PATCH", "/api/user/persona", { persona: newPersona });
      } catch (error) {
        console.error("Failed to save persona preference:", error);
      }
    } else {
      // For unauthenticated users, save to session storage
      if (newPersona) {
        sessionStorage.setItem(PERSONA_STORAGE_KEY, newPersona);
      } else {
        sessionStorage.removeItem(PERSONA_STORAGE_KEY);
      }
    }
  };

  return (
    <PersonaContext.Provider value={{ persona, setPersona, funnelStage, showPersonaModal, setShowPersonaModal, isPersonaLoading }}>
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
