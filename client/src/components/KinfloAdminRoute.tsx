import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ConvexAuthProvider, useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { AlertTriangle, CheckCircle2, Loader2, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  KinfloAdminIdentityProvider,
  type KinfloAdminIdentity,
} from "@/contexts/KinfloAdminIdentityContext";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { createKinfloConvexReactClient } from "@/lib/kinfloConvexRuntime";
import {
  getKinfloIdentityRuntime,
  isApprovedKinfloDevActivationTarget,
  KINFLO_APPROVED_DEV_ACTIVATION_DEPLOYMENT,
} from "@/lib/kinfloIdentityRuntime";
import {
  FixtureKinfloShellSnapshotProvider,
  ReadOnlyLiveKinfloShellSnapshotProvider,
} from "@/contexts/KinfloShellSnapshotContext";
import {
  DisabledKinfloPreferencesAdapterProvider,
  LiveKinfloPreferencesAdapterProvider,
} from "@/contexts/KinfloPreferencesAdapterContext";
import {
  DisabledKinfloThemeWriteAdapterProvider,
  LiveKinfloThemeWriteAdapterProvider,
} from "@/contexts/KinfloThemeWriteAdapterContext";
import { Phase174GeneratedReadOnlyHarness } from "@/components/Phase174GeneratedReadOnlyHarness";
import { isPhase174GeneratedReadOnlyHarnessRequested } from "@/lib/kinfloPhase174GeneratedReadOnlyHarness";

type ConvexViewer = {
  _id: string;
  email?: string;
  name?: string;
  platformRole?: "user" | "super_admin";
};

const viewerQuery = makeFunctionReference<"query", Record<string, never>, ConvexViewer | null>(
  "controlPlane:viewer",
);
const upsertCurrentUserMutation = makeFunctionReference<"mutation", Record<string, never>, string>(
  "controlPlane:upsertCurrentUser",
);

type ActivationReadiness = {
  authenticated: boolean;
  userSynced: boolean;
  platformRole: "user" | "super_admin" | null;
  platformAdmin: boolean;
  platformAdminExists: boolean;
  tenantCount: number;
  siteCount: number;
  publishedSiteCount: number;
  starterTemplates: { key: string; label: string }[];
  nextRequiredAction:
    | "sign_in"
    | "upsert_current_user"
    | "bootstrap_platform_admin"
    | "request_platform_admin_access"
    | "run_activation_smoke_seed";
};

const activationReadinessQuery = makeFunctionReference<"query", Record<string, never>, ActivationReadiness>(
  "activation:readiness",
);
const bootstrapPlatformAdminMutation = makeFunctionReference<"mutation", Record<string, never>, string>(
  "controlPlane:bootstrapPlatformAdmin",
);

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : "The request failed without an error message.";
}

function IdentityGateCard({
  title,
  detail,
  action,
  busy = false,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
  busy?: boolean;
}) {
  const isWarning = title === "KinFlo identity unavailable"
    || title === "KinFlo identity sync failed"
    || title === "KinFlo admin access required";
  const Icon = busy ? Loader2 : isWarning ? AlertTriangle : ShieldCheck;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-5 text-slate-950 shadow-sm sm:p-6"
        data-testid="section-kinflo-identity-gate"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
            <Icon
              className={`h-5 w-5 ${isWarning ? "text-amber-600" : "text-slate-600"} ${busy ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0 pt-0.5">
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
          </div>
        </div>
        {action ? <div className="mt-6">{action}</div> : null}
      </section>
    </main>
  );
}

function LocalFixtureIdentityGate({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const value: KinfloAdminIdentity = {
    isLoading,
    isAdmin,
    source: "local_fixture",
  };

  return (
    <KinfloAdminIdentityProvider value={value}>
      <FixtureKinfloShellSnapshotProvider>
        <DisabledKinfloPreferencesAdapterProvider>
          <DisabledKinfloThemeWriteAdapterProvider>{children}</DisabledKinfloThemeWriteAdapterProvider>
        </DisabledKinfloPreferencesAdapterProvider>
      </FixtureKinfloShellSnapshotProvider>
    </KinfloAdminIdentityProvider>
  );
}

function LocalActivationEvidenceGate({ children }: { children: ReactNode }) {
  const initialState = new URLSearchParams(window.location.search).get("activationEvidence") === "seed-ready"
    ? "seed-ready"
    : "bootstrap";
  const [evidenceState, setEvidenceState] = useState<"bootstrap" | "seed-ready">(initialState);

  if (evidenceState === "seed-ready") {
    return <LocalFixtureIdentityGate>{children}</LocalFixtureIdentityGate>;
  }

  return (
    <IdentityGateCard
      title="Set up the first KinFlo dev admin"
      detail={`No platform admin exists on ${KINFLO_APPROVED_DEV_ACTIVATION_DEPLOYMENT}. This one-time action promotes only your signed-in KinFlo identity. It does not create a tenant or site.`}
      action={(
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => {
              const nextUrl = new URL(window.location.href);
              nextUrl.searchParams.set("activationEvidence", "seed-ready");
              window.history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
              setEvidenceState("seed-ready");
            }}
            data-testid="button-kinflo-bootstrap-platform-admin"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Preview successful bootstrap
          </Button>
          <p className="rounded-md border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-900" data-testid="text-kinflo-activation-evidence-fixture">
            Visual QA fixture. This button changes the local display only; it does not call Convex.
          </p>
        </div>
      )}
    />
  );
}

function ConvexIdentityGate({ children }: { children: ReactNode }) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const viewer = useQuery(viewerQuery, isAuthenticated ? {} : "skip");
  const activationReadiness = useQuery(activationReadinessQuery, isAuthenticated ? {} : "skip");
  const upsertCurrentUser = useMutation(upsertCurrentUserMutation);
  const bootstrapPlatformAdmin = useMutation(bootstrapPlatformAdminMutation);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "complete" | "failed">("idle");
  const [signInPending, setSignInPending] = useState(false);
  const [bootstrapState, setBootstrapState] = useState<"idle" | "running" | "succeeded" | "failed">("idle");
  const [bootstrapError, setBootstrapError] = useState("");
  const [bootstrapAcknowledged, setBootstrapAcknowledged] = useState(false);
  const runtime = getKinfloIdentityRuntime();
  const approvedDevTarget = isApprovedKinfloDevActivationTarget(runtime.publicUrl);

  useEffect(() => {
    if (!isAuthenticated || viewer !== null || syncState !== "idle") {
      return;
    }

    setSyncState("syncing");
    void upsertCurrentUser({})
      .then(() => setSyncState("complete"))
      .catch(() => setSyncState("failed"));
  }, [isAuthenticated, syncState, upsertCurrentUser, viewer]);

  if (authLoading) {
    return (
      <IdentityGateCard
        title="Checking KinFlo identity"
        detail="The admin shell is waiting for the Convex Auth session."
        busy
      />
    );
  }

  if (!isAuthenticated) {
    const redirectTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    return (
      <IdentityGateCard
        title="Sign in to KinFlo"
        detail="KinFlo admin uses an isolated Convex Auth session. Julie's public and legacy routes keep their existing sign-in flow."
        action={(
          <Button
            className="w-full"
            disabled={signInPending}
            onClick={() => {
              setSignInPending(true);
              void signIn("auth0", { redirectTo }).finally(() => setSignInPending(false));
            }}
          >
            {signInPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            Continue with Auth0
          </Button>
        )}
      />
    );
  }

  if (
    viewer === undefined
    || syncState === "syncing"
    || (viewer === null && syncState === "complete")
  ) {
    return (
      <IdentityGateCard
        title="Loading KinFlo access"
        detail="The authenticated identity is being resolved against the Convex user projection."
        busy
      />
    );
  }

  if (syncState === "failed" || viewer === null) {
    return (
      <IdentityGateCard
        title="KinFlo identity sync failed"
        detail="No KinFlo access was granted. Ask the integration captain to verify the Convex Auth deployment and user projection before retrying."
        action={(
          <Button variant="secondary" className="w-full" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        )}
      />
    );
  }

  if (bootstrapState === "succeeded" && !bootstrapAcknowledged) {
    return (
      <IdentityGateCard
        title="KinFlo dev admin ready"
        detail="Your signed-in identity is now the platform admin. Continue to the hosted activation tab to review the fixed Vanguard seed."
        action={(
          <Button
            className="w-full"
            onClick={() => setBootstrapAcknowledged(true)}
            data-testid="button-kinflo-bootstrap-continue"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Continue to Vanguard seed review
          </Button>
        )}
      />
    );
  }

  if (viewer.platformRole !== "super_admin") {
    if (activationReadiness === undefined) {
      return (
        <IdentityGateCard
          title="Checking KinFlo admin setup"
          detail="KinFlo is checking whether this signed-in identity can claim the first dev admin role."
          busy
        />
      );
    }

    const canBootstrap = approvedDevTarget
      && activationReadiness.nextRequiredAction === "bootstrap_platform_admin"
      && !activationReadiness.platformAdminExists;

    if (canBootstrap) {
      return (
        <IdentityGateCard
          title={bootstrapState === "succeeded" ? "KinFlo dev admin ready" : "Set up the first KinFlo dev admin"}
          detail={bootstrapState === "succeeded"
            ? "Your signed-in identity is now the platform admin. Continue to the hosted activation tab to review the Vanguard seed."
            : `No platform admin exists on ${KINFLO_APPROVED_DEV_ACTIVATION_DEPLOYMENT}. This one-time action promotes only your signed-in KinFlo identity. It does not create a tenant or site.`}
          busy={bootstrapState === "running"}
          action={bootstrapState === "succeeded" ? (
            <Button
              className="w-full"
              onClick={() => setBootstrapAcknowledged(true)}
              data-testid="button-kinflo-bootstrap-continue"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Continue to Vanguard seed review
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                className="w-full"
                disabled={bootstrapState === "running"}
                onClick={() => {
                  setBootstrapState("running");
                  setBootstrapError("");
                  void bootstrapPlatformAdmin({})
                    .then(() => setBootstrapState("succeeded"))
                    .catch((error) => {
                      setBootstrapError(messageFromError(error));
                      setBootstrapState("failed");
                    });
                }}
                data-testid="button-kinflo-bootstrap-platform-admin"
              >
                {bootstrapState === "running" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Bootstrap dev admin
              </Button>
              {bootstrapState === "failed" ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-800" data-testid="text-kinflo-bootstrap-error">
                  Bootstrap failed: {bootstrapError} Next step: confirm the signed-in identity and dev deployment, then retry once.
                </p>
              ) : (
                <p className="text-xs leading-5 text-slate-600">
                  Next step after success: review the fixed Vanguard seed on the hosted activation tab.
                </p>
              )}
            </div>
          )}
        />
      );
    }

    return (
      <IdentityGateCard
        title="KinFlo admin access required"
        detail={activationReadiness.platformAdminExists
          ? "Your identity is valid, but another platform admin already exists. Ask that admin to grant the required role."
          : "Your identity is valid, but this deployment is not approved for the dev bootstrap control."}
        action={(
          <Button variant="secondary" className="w-full" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        )}
      />
    );
  }

  if (isPhase174GeneratedReadOnlyHarnessRequested(window.location.search)) {
    return (
      <KinfloAdminIdentityProvider
        value={{ isLoading: false, isAdmin: true, source: "convex_auth" }}
      >
        <Phase174GeneratedReadOnlyHarness />
      </KinfloAdminIdentityProvider>
    );
  }

  return (
    <KinfloAdminIdentityProvider
      value={{ isLoading: false, isAdmin: true, source: "convex_auth" }}
    >
      <ReadOnlyLiveKinfloShellSnapshotProvider>
        <LiveKinfloPreferencesAdapterProvider>
          <LiveKinfloThemeWriteAdapterProvider>{children}</LiveKinfloThemeWriteAdapterProvider>
        </LiveKinfloPreferencesAdapterProvider>
      </ReadOnlyLiveKinfloShellSnapshotProvider>
    </KinfloAdminIdentityProvider>
  );
}

function ConfiguredConvexIdentityRoute({ children }: { children: ReactNode }) {
  const client = useMemo(() => createKinfloConvexReactClient(), []);
  return (
    <ConvexAuthProvider
      client={client}
      storageNamespace="kinflo-admin"
      shouldHandleCode={() => window.location.pathname === "/admin/kinflo-os"}
      replaceURL={(relativeUrl) => window.history.replaceState({}, "", relativeUrl)}
    >
      <ConvexIdentityGate>{children}</ConvexIdentityGate>
    </ConvexAuthProvider>
  );
}

export default function KinfloAdminRoute({ children }: { children: ReactNode }) {
  const runtime = getKinfloIdentityRuntime();

  if (runtime.mode === "local_fixture") {
    const activationEvidence = new URLSearchParams(window.location.search).get("activationEvidence");
    if (activationEvidence === "bootstrap" || activationEvidence === "seed-ready") {
      return <LocalActivationEvidenceGate>{children}</LocalActivationEvidenceGate>;
    }
    return <LocalFixtureIdentityGate>{children}</LocalFixtureIdentityGate>;
  }

  if (runtime.mode !== "convex_auth" || !runtime.publicUrl) {
    return (
      <IdentityGateCard
        title="KinFlo identity unavailable"
        detail={`${runtime.gate} This route is fail-closed and will not fall back to the legacy Postgres session.`}
      />
    );
  }

  return <ConfiguredConvexIdentityRoute>{children}</ConfiguredConvexIdentityRoute>;
}
