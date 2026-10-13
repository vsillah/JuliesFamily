import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ConvexAuthProvider, useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { AlertTriangle, Loader2, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  KinfloAdminIdentityProvider,
  type KinfloAdminIdentity,
} from "@/contexts/KinfloAdminIdentityContext";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { createKinfloConvexReactClient } from "@/lib/kinfloConvexRuntime";
import { getKinfloIdentityRuntime } from "@/lib/kinfloIdentityRuntime";
import {
  FixtureKinfloShellSnapshotProvider,
  ReadOnlyLiveKinfloShellSnapshotProvider,
} from "@/contexts/KinfloShellSnapshotContext";
import {
  DisabledKinfloPreferencesAdapterProvider,
  LiveKinfloPreferencesAdapterProvider,
} from "@/contexts/KinfloPreferencesAdapterContext";

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
        <DisabledKinfloPreferencesAdapterProvider>{children}</DisabledKinfloPreferencesAdapterProvider>
      </FixtureKinfloShellSnapshotProvider>
    </KinfloAdminIdentityProvider>
  );
}

function ConvexIdentityGate({ children }: { children: ReactNode }) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const viewer = useQuery(viewerQuery, isAuthenticated ? {} : "skip");
  const upsertCurrentUser = useMutation(upsertCurrentUserMutation);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "complete" | "failed">("idle");
  const [signInPending, setSignInPending] = useState(false);

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

  if (viewer.platformRole !== "super_admin") {
    return (
      <IdentityGateCard
        title="KinFlo admin access required"
        detail="Your identity is valid, but the Convex product record does not grant platform administration."
        action={(
          <Button variant="secondary" className="w-full" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        )}
      />
    );
  }

  return (
    <KinfloAdminIdentityProvider
      value={{ isLoading: false, isAdmin: true, source: "convex_auth" }}
    >
      <ReadOnlyLiveKinfloShellSnapshotProvider>
        <LiveKinfloPreferencesAdapterProvider>{children}</LiveKinfloPreferencesAdapterProvider>
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
