import { createContext, useContext, ReactNode } from "react";
import { type OrganizationLayout } from "@shared/schema";
import { useOrganization } from "./OrganizationContext";

interface LayoutContextType {
  layout: OrganizationLayout;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const { organization } = useOrganization();
  const layout = organization?.layout || 'classic';

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
