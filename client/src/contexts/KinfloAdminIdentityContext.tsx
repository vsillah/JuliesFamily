import { createContext, useContext, type ReactNode } from "react";

export type KinfloAdminIdentitySource = "convex_auth" | "local_fixture";

export type KinfloAdminIdentity = {
  isLoading: boolean;
  isAdmin: boolean;
  source: KinfloAdminIdentitySource;
};

export function canAccessKinfloAdmin(identity: KinfloAdminIdentity) {
  return identity.source === "local_fixture" || identity.isAdmin;
}

const KinfloAdminIdentityContext = createContext<KinfloAdminIdentity | null>(null);

export function KinfloAdminIdentityProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: KinfloAdminIdentity;
}) {
  return (
    <KinfloAdminIdentityContext.Provider value={value}>
      {children}
    </KinfloAdminIdentityContext.Provider>
  );
}

export function useKinfloAdminIdentity() {
  const identity = useContext(KinfloAdminIdentityContext);
  if (!identity) {
    throw new Error("KinFlo admin identity must be provided by KinfloAdminRoute.");
  }
  return identity;
}
