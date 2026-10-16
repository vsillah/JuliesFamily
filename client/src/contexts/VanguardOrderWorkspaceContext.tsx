import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ConvexAuthProvider, useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { createKinfloConvexReactClient } from "@/lib/kinfloConvexRuntime";
import type { KinfloEngineeringReview } from "@/lib/kinfloIges";
import type { VanguardLocalReceipt } from "@/lib/kinfloVanguardOrderPortal";
import { getVanguardOrderRuntime } from "@/lib/kinfloVanguardOrderRuntime";
import {
  VanguardOrderWorkspaceContext as WorkspaceContext,
  type VanguardOrderWorkspaceState as WorkspaceState,
  type VanguardDraftCleanupResult as DraftCleanupResult,
  type VanguardSavedOrder as SavedOrder,
  type VanguardStoredSource as StoredSource,
} from "@/contexts/VanguardOrderWorkspace";

type PromoteResult = SavedOrder & { createdAt: number; deduplicated: boolean };
type PrepareUploadResult = {
  orderId: string;
  sourceItemId: string;
  revision: number;
  uploadUrl: string | null;
  uploadState: "upload_required" | "already_stored";
  deduplicated: boolean;
};
type AttachUploadResult = {
  orderId: string;
  sourceItemId: string;
  revision: number;
  attachmentState: "stored" | "rejected";
  rejectionCode: "stored_size_mismatch" | "stored_type_mismatch" | "stored_checksum_mismatch" | null;
  deduplicated: boolean;
};
type CancelUploadResult = {
  orderId: string;
  revision: number;
  cancelled: boolean;
  deduplicated: boolean;
};
type OrderListResult = {
  page: Array<SavedOrder & { status: string }>;
  isDone: boolean;
  continueCursor: string;
};
type OrderReadback = {
  order: SavedOrder;
  sourceItems: Array<{
    sourceItemId: string;
    label: string;
    byteSize: number | null;
    checksumSha256: string | null;
    storageStatus: "upload_prepared" | "stored_private" | null;
  }>;
};

const viewerQuery = makeFunctionReference<"query", Record<string, never>, { _id: string } | null>(
  "controlPlane:viewer",
);
const upsertCurrentUserMutation = makeFunctionReference<"mutation", Record<string, never>, string>(
  "controlPlane:upsertCurrentUser",
);
const promoteLocalIntakeMutation = makeFunctionReference<"mutation", Record<string, unknown>, PromoteResult>(
  "orders:promoteLocalIntake",
);
const prepareUploadMutation = makeFunctionReference<"mutation", Record<string, unknown>, PrepareUploadResult>(
  "orders:prepareUpload",
);
const attachStoredSourceMutation = makeFunctionReference<"mutation", Record<string, unknown>, AttachUploadResult>(
  "orders:attachStoredSource",
);
const cancelPreparedUploadMutation = makeFunctionReference<"mutation", Record<string, unknown>, CancelUploadResult>(
  "orders:cancelPreparedUpload",
);
const cancelDraftMutation = makeFunctionReference<"mutation", Record<string, unknown>, DraftCleanupResult>(
  "orders:cancelDraft",
);
const getMyOrderQuery = makeFunctionReference<"query", { orderId: string }, OrderReadback>(
  "orders:getMyOrder",
);
const listMyOrdersQuery = makeFunctionReference<"query", Record<string, unknown>, OrderListResult>(
  "orders:listMyOrders",
);

const unavailable = async () => {
  throw new Error("Private workspace access is not active. Your browser draft is unchanged.");
};

function uploadMediaType(file: File) {
  const normalized = file.type.trim().toLowerCase();
  return normalized === "application/iges" || normalized === "model/iges"
    ? normalized
    : "application/octet-stream";
}
async function reviewPrivateIgesSource(file: File) {
  const { prepareKinfloIgesReview } = await import("@/lib/kinfloIgesBrowser");
  return await prepareKinfloIgesReview(file);
}

function LiveWorkspaceProvider({ children, gate }: { children: ReactNode; gate: string }) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const viewer = useQuery(viewerQuery, isAuthenticated ? {} : "skip");
  const upsertCurrentUser = useMutation(upsertCurrentUserMutation);
  const promoteLocalIntake = useMutation(promoteLocalIntakeMutation);
  const prepareUpload = useMutation(prepareUploadMutation);
  const attachStoredSource = useMutation(attachStoredSourceMutation);
  const cancelPreparedUpload = useMutation(cancelPreparedUploadMutation);
  const cancelDraftMutationCall = useMutation(cancelDraftMutation);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "ready" | "failed">("idle");
  const [savedOrder, setSavedOrder] = useState<SavedOrder | null>(null);
  const [storedSource, setStoredSource] = useState<StoredSource | null>(null);
  const [dismissedDraftId, setDismissedDraftId] = useState<string | null>(null);
  const readback = useQuery(getMyOrderQuery, savedOrder ? { orderId: savedOrder.orderId } : "skip");
  const orderList = useQuery(
    listMyOrdersQuery,
    isAuthenticated && viewer ? { paginationOpts: { numItems: 10, cursor: null } } : "skip",
  );

  useEffect(() => {
    if (!isAuthenticated || viewer !== null || syncState !== "idle") return;
    setSyncState("syncing");
    void upsertCurrentUser({})
      .then(() => setSyncState("ready"))
      .catch(() => setSyncState("failed"));
  }, [isAuthenticated, syncState, upsertCurrentUser, viewer]);

  useEffect(() => {
    if (savedOrder || !orderList) return;
    const latestDraft = orderList.page[0];
    if (
      !latestDraft
      || latestDraft.status !== "draft"
      || latestDraft.orderId === dismissedDraftId
    ) return;
    setSavedOrder({
      orderId: latestDraft.orderId,
      orderNumber: latestDraft.orderNumber,
      revision: latestDraft.revision,
    });
  }, [dismissedDraftId, orderList, savedOrder]);

  const saveReceipt = useCallback(async (receipt: VanguardLocalReceipt) => {
    if (!isAuthenticated || syncState === "failed") {
      throw new Error("Sign in before saving this request.");
    }
    const result = await promoteLocalIntake({
      receipt: {
        schemaVersion: receipt.schemaVersion,
        receiptId: receipt.receiptId,
        source: receipt.source,
        persistence: receipt.persistence,
        sourcePackage: receipt.sourcePackage,
        goal: receipt.goal,
        discipline: receipt.discipline,
        constraints: receipt.constraints,
      },
      confirmation: {
        confirmed: true,
        consentVersion: "vanguard-browser-receipt-transfer-v1",
        fieldKeys: ["sourcePackage", "goal", "discipline", "constraints"],
      },
      idempotencyKey: `vanguard:promote:${receipt.receiptId}`,
    });
    const next = {
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      revision: result.revision,
    };
    setSavedOrder(next);
    return next;
  }, [isAuthenticated, promoteLocalIntake, syncState]);

  const uploadPrivateSource = useCallback(async (
    file: File,
    expectedReview: KinfloEngineeringReview | null,
  ) => {
    if (!savedOrder) throw new Error("Save the order draft before attaching a private source.");
    const preparedReview = await reviewPrivateIgesSource(file);
    if (expectedReview && preparedReview.review.digestSha256 !== expectedReview.digestSha256) {
      throw new Error("Choose the same IGES source that produced this engineering review.");
    }
    const uploadAttemptId = crypto.randomUUID().replaceAll("-", "");
    const prepared = await prepareUpload({
      orderId: savedOrder.orderId,
      expectedRevision: savedOrder.revision,
      idempotencyKey: `vanguard:prepare:${uploadAttemptId}`,
      fileName: preparedReview.review.fileName,
      mediaType: uploadMediaType(file),
      byteSize: preparedReview.review.sourceBytes,
      checksumSha256: preparedReview.review.digestSha256,
    });
    setSavedOrder((current) => current ? { ...current, revision: prepared.revision } : current);
    if (prepared.uploadState === "already_stored") {
      const existing = readback?.sourceItems.find((item) => item.sourceItemId === prepared.sourceItemId);
      const next = {
        sourceItemId: prepared.sourceItemId,
        fileName: existing?.label ?? preparedReview.review.fileName,
        byteSize: existing?.byteSize ?? preparedReview.review.sourceBytes,
        checksumSha256: existing?.checksumSha256 ?? preparedReview.review.digestSha256,
      };
      setStoredSource(next);
      return next;
    }
    if (!prepared.uploadUrl) throw new Error("Private upload could not be prepared.");
    const uploadResponse = await fetch(prepared.uploadUrl, {
      method: "POST",
      headers: { "Content-Type": uploadMediaType(file) },
      body: file,
    });
    if (!uploadResponse.ok) {
      const cancelled = await cancelPreparedUpload({
        orderId: savedOrder.orderId,
        sourceItemId: prepared.sourceItemId,
        expectedRevision: prepared.revision,
        idempotencyKey: `vanguard:cancel:${prepared.sourceItemId}`,
      });
      setSavedOrder((current) => current ? { ...current, revision: cancelled.revision } : current);
      throw new Error("The private source did not reach storage. The order draft is unchanged.");
    }
    const uploadPayload = await uploadResponse.json() as { storageId?: string };
    if (!uploadPayload.storageId) {
      throw new Error("Private storage did not return a source reference.");
    }
    const attachArgs = {
      orderId: savedOrder.orderId,
      sourceItemId: prepared.sourceItemId,
      storageId: uploadPayload.storageId,
      expectedRevision: prepared.revision,
      idempotencyKey: `vanguard:attach:${prepared.sourceItemId}`,
    };
    let attached: AttachUploadResult;
    try {
      attached = await attachStoredSource(attachArgs);
    } catch {
      attached = await attachStoredSource(attachArgs);
    }
    setSavedOrder((current) => current ? { ...current, revision: attached.revision } : current);
    if (attached.attachmentState !== "stored") {
      throw new Error("The uploaded source did not match its declared size or type and was removed.");
    }
    const next = {
      sourceItemId: attached.sourceItemId,
      fileName: preparedReview.review.fileName,
      byteSize: preparedReview.review.sourceBytes,
      checksumSha256: preparedReview.review.digestSha256,
    };
    setStoredSource(next);
    return next;
  }, [attachStoredSource, cancelPreparedUpload, prepareUpload, readback, savedOrder]);

  const cancelDraft = useCallback(async () => {
    if (!savedOrder) throw new Error("No saved draft is available to cancel.");
    const result = await cancelDraftMutationCall({
      orderId: savedOrder.orderId,
      expectedRevision: savedOrder.revision,
      idempotencyKey: `vanguard:cancel-draft:${savedOrder.orderId}`,
    });
    setDismissedDraftId(savedOrder.orderId);
    setSavedOrder(null);
    setStoredSource(null);
    return result;
  }, [cancelDraftMutationCall, savedOrder]);

  const value = useMemo<WorkspaceState>(() => ({
    mode: "convex_auth",
    gate,
    isLoading: authLoading || (isAuthenticated && (viewer === undefined || syncState === "syncing")),
    isAuthenticated: isAuthenticated && Boolean(viewer) && syncState !== "failed",
    savedOrder,
    storedSource,
    signIn: async () => {
      const redirectTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      await signIn("auth0", { redirectTo });
    },
    signOut: async () => { await signOut(); },
    saveReceipt,
    uploadPrivateSource,
    cancelDraft,
  }), [authLoading, cancelDraft, gate, isAuthenticated, saveReceipt, savedOrder, signIn, signOut, storedSource, syncState, uploadPrivateSource, viewer]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

function FixtureWorkspaceProvider({ children, gate }: { children: ReactNode; gate: string }) {
  const [savedOrder, setSavedOrder] = useState<SavedOrder | null>(null);
  const [storedSource, setStoredSource] = useState<StoredSource | null>(null);
  const value = useMemo<WorkspaceState>(() => ({
    mode: "local_fixture",
    gate,
    isLoading: false,
    isAuthenticated: true,
    savedOrder,
    storedSource,
    signIn: async () => undefined,
    signOut: async () => undefined,
    saveReceipt: async (receipt) => {
      const next = {
        orderId: "review-order",
        orderNumber: "VGD-REVIEW-1042",
        revision: 1,
      };
      setSavedOrder(next);
      return next;
    },
    uploadPrivateSource: async (file, expectedReview) => {
      if (!savedOrder) throw new Error("Save the order draft before attaching a private source.");
      const prepared = await reviewPrivateIgesSource(file);
      if (expectedReview && prepared.review.digestSha256 !== expectedReview.digestSha256) {
        throw new Error("Choose the same IGES source that produced this engineering review.");
      }
      const next = {
        sourceItemId: "review-source",
        fileName: prepared.review.fileName,
        byteSize: prepared.review.sourceBytes,
        checksumSha256: prepared.review.digestSha256,
      };
      setSavedOrder({ ...savedOrder, revision: savedOrder.revision + 2 });
      setStoredSource(next);
      return next;
    },
    cancelDraft: async () => {
      if (!savedOrder) throw new Error("No saved draft is available to cancel.");
      const result = {
        orderId: savedOrder.orderId,
        orderNumber: savedOrder.orderNumber,
        revision: savedOrder.revision + 1,
        cancelledAt: Date.now(),
        cleaned: {
          draftSections: 4,
          sourceItems: storedSource ? 1 : 0,
          storedObjects: storedSource ? 1 : 0,
        },
        deduplicated: false,
      };
      setSavedOrder(null);
      setStoredSource(null);
      return result;
    },
  }), [gate, savedOrder, storedSource]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

function ConfiguredWorkspaceProvider({ children, gate }: { children: ReactNode; gate: string }) {
  const client = useMemo(() => createKinfloConvexReactClient(), []);
  return (
    <ConvexAuthProvider
      client={client}
      storageNamespace="kinflo-vanguard-orders"
      shouldHandleCode={() => window.location.pathname === "/kinflo-sites/vanguard-enterprises/orders"}
      replaceURL={(relativeUrl) => window.history.replaceState({}, "", relativeUrl)}
    >
      <LiveWorkspaceProvider gate={gate}>{children}</LiveWorkspaceProvider>
    </ConvexAuthProvider>
  );
}

export function VanguardOrderWorkspaceProvider({ children }: { children: ReactNode }) {
  const runtime = getVanguardOrderRuntime();
  if (runtime.mode === "local_fixture") {
    return <FixtureWorkspaceProvider gate={runtime.gate}>{children}</FixtureWorkspaceProvider>;
  }
  if (runtime.mode === "convex_auth") {
    return <ConfiguredWorkspaceProvider gate={runtime.gate}>{children}</ConfiguredWorkspaceProvider>;
  }
  return (
    <WorkspaceContext.Provider value={{
      mode: "browser_local",
      gate: runtime.gate,
      isLoading: false,
      isAuthenticated: false,
      savedOrder: null,
      storedSource: null,
      signIn: unavailable,
      signOut: async () => undefined,
      saveReceipt: unavailable,
      uploadPrivateSource: unavailable,
      cancelDraft: unavailable,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
