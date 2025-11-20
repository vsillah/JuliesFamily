import { createContext, useContext, ReactNode, useEffect } from "react";
import { type OrganizationLayout } from "@shared/schema";
import { getLayoutTheme } from "@shared/layouts";
import { useOrganization } from "./OrganizationContext";

interface LayoutContextType {
  layout: OrganizationLayout;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const { organization } = useOrganization();
  const layout = organization?.layout || 'classic';
  const layoutTheme = getLayoutTheme(layout);

  // Apply theme class to document root for global styling
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all existing theme classes
    root.classList.remove('theme-classic', 'theme-nature', 'theme-modern', 'theme-community');
    
    // Add current theme class
    root.classList.add(layoutTheme.cssClass);
    
    return () => {
      // Cleanup: remove theme class when unmounting
      root.classList.remove(layoutTheme.cssClass);
    };
  }, [layoutTheme.cssClass]);

  return (
    <LayoutContext.Provider value={{ layout }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
