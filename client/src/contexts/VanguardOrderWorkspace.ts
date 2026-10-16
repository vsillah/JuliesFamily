import { createContext, useContext } from "react";
import type { KinfloEngineeringReview } from "@/lib/kinfloIges";
import type { VanguardLocalReceipt } from "@/lib/kinfloVanguardOrderPortal";

export type VanguardSavedOrder = {
  orderId: string;
  orderNumber: string;
  revision: number;
};

export type VanguardStoredSource = {
  sourceItemId: string;
  fileName: string;
  byteSize: number;
  checksumSha256: string;
};

export type VanguardDraftCleanupResult = {
  orderId: string;
  orderNumber: string;
  revision: number;
  cancelledAt: number;
  cleaned: {
    draftSections: number;
    sourceItems: number;
    storedObjects: number;
  };
  deduplicated: boolean;
};

export type VanguardOrderWorkspaceState = {
  mode: "browser_local" | "local_fixture" | "convex_auth";
  gate: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  savedOrder: VanguardSavedOrder | null;
  storedSource: VanguardStoredSource | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  saveReceipt: (receipt: VanguardLocalReceipt) => Promise<VanguardSavedOrder>;
  uploadPrivateSource: (
    file: File,
    expectedReview: KinfloEngineeringReview | null,
  ) => Promise<VanguardStoredSource>;
  cancelDraft: () => Promise<VanguardDraftCleanupResult>;
};

const unavailable = async () => {
  throw new Error("Private workspace access is not active. Your browser draft is unchanged.");
};

export const VanguardOrderWorkspaceContext = createContext<VanguardOrderWorkspaceState>({
  mode: "browser_local",
  gate: "Private workspace sign-in is not configured. Your request remains in this browser.",
  isLoading: false,
  isAuthenticated: false,
  savedOrder: null,
  storedSource: null,
  signIn: unavailable,
  signOut: async () => undefined,
  saveReceipt: unavailable,
  uploadPrivateSource: unavailable,
  cancelDraft: unavailable,
});

export function useVanguardOrderWorkspace() {
  return useContext(VanguardOrderWorkspaceContext);
}
