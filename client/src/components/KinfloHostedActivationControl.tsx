import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { AlertTriangle, CheckCircle2, Loader2, Rocket, ShieldCheck } from "lucide-react";
import { useKinfloAdminIdentity } from "@/contexts/KinfloAdminIdentityContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getKinfloIdentityRuntime,
  isApprovedKinfloDevActivationTarget,
  KINFLO_APPROVED_DEV_ACTIVATION_DEPLOYMENT,
} from "@/lib/kinfloIdentityRuntime";

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

type ActivationSeedResult = {
  tenantId: string;
  siteId: string;
  homepageId: string;
  revisionId: string;
  blockCount: number;
  tenantCreated: boolean;
  siteCreated: boolean;
  resolverArgs: { subdomain?: string; route: string };
};

const activationReadinessQuery = makeFunctionReference<"query", Record<string, never>, ActivationReadiness>(
  "activation:readiness",
);
const seedSmokeSiteMutation = makeFunctionReference<
  "mutation",
  {
    tenantName: string;
    tenantSlug: string;
    siteName: string;
    siteSlug: string;
    subdomain: string;
    templateKey: string;
  },
  ActivationSeedResult
>("activation:seedSmokeSite");

const vanguardSeedArgs = {
  tenantName: "Vanguard Enterprises",
  tenantSlug: "vanguard-enterprises",
  siteName: "Vanguard Enterprises",
  siteSlug: "vanguard-enterprises",
  subdomain: "vanguard-enterprises",
  templateKey: "advisor-consultant",
} as const;

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : "The seed failed without an error message.";
}

function FixtureHostedActivationControl() {
  return (
    <Card className="border-sky-200 bg-sky-50/60 shadow-sm" data-testid="section-kinflo-preview-activation-control">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-sky-700 text-white hover:bg-sky-700">Dev activation</Badge>
              <Badge variant="outline" className="border-sky-200 bg-white text-sky-800">
                {KINFLO_APPROVED_DEV_ACTIVATION_DEPLOYMENT}
              </Badge>
              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-800">
                Visual QA fixture
              </Badge>
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-950">Vanguard seed</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Create or reuse the Vanguard tenant and site, publish its seeded homepage, and record the existing activation audit event.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="shrink-0 bg-sky-700 text-white hover:bg-sky-800"
                data-testid="button-kinflo-run-vanguard-seed"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Review Vanguard seed
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Run the approved Vanguard dev seed?</AlertDialogTitle>
                <AlertDialogDescription>
                  This calls activation.seedSmokeSite once on {KINFLO_APPROVED_DEV_ACTIVATION_DEPLOYMENT}. Tenant, site, and subdomain slugs are fixed to vanguard-enterprises. It does not switch adapters, send providers, or invite users.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                Tenant: vanguard-enterprises<br />
                Site: vanguard-enterprises<br />
                Template: advisor-consultant
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Close fixture</AlertDialogCancel>
                <Button disabled>Execution disabled in visual QA</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <Alert className="mt-4 border-emerald-200 bg-emerald-50 text-emerald-950">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Seed is ready for captain review</AlertTitle>
          <AlertDescription>
            The signed-in user is a platform admin and readiness points to run activation smoke seed. This fixture cannot execute the mutation.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

function LiveHostedActivationControl() {
  const runtime = getKinfloIdentityRuntime();
  const approvedDevTarget = isApprovedKinfloDevActivationTarget(runtime.publicUrl);
  const readiness = useQuery(activationReadinessQuery, approvedDevTarget ? {} : "skip");
  const seedSmokeSite = useMutation(seedSmokeSiteMutation);
  const [status, setStatus] = useState<"idle" | "running" | "succeeded" | "failed">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ActivationSeedResult | null>(null);

  const seedReady = approvedDevTarget
    && readiness?.platformAdmin === true
    && readiness.nextRequiredAction === "run_activation_smoke_seed";

  return (
    <Card className="border-sky-200 bg-sky-50/60 shadow-sm" data-testid="section-kinflo-preview-activation-control">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-sky-700 text-white hover:bg-sky-700">Dev activation</Badge>
              <Badge variant="outline" className="border-sky-200 bg-white text-sky-800">
                {KINFLO_APPROVED_DEV_ACTIVATION_DEPLOYMENT}
              </Badge>
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-950">Vanguard seed</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Create or reuse the Vanguard tenant and site, publish its seeded homepage, and record the existing activation audit event.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={!seedReady || status === "running" || status === "succeeded"}
                className="shrink-0 bg-sky-700 text-white hover:bg-sky-800"
                data-testid="button-kinflo-run-vanguard-seed"
              >
                {status === "running" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                {status === "succeeded" ? "Vanguard seed complete" : "Review Vanguard seed"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Run the approved Vanguard dev seed?</AlertDialogTitle>
                <AlertDialogDescription>
                  This calls activation.seedSmokeSite once on {KINFLO_APPROVED_DEV_ACTIVATION_DEPLOYMENT}. Tenant, site, and subdomain slugs are fixed to vanguard-enterprises. It does not switch adapters, send providers, or invite users.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                Tenant: vanguard-enterprises<br />
                Site: vanguard-enterprises<br />
                Template: advisor-consultant
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-sky-700 text-white hover:bg-sky-800"
                  onClick={() => {
                    setStatus("running");
                    setError("");
                    void seedSmokeSite(vanguardSeedArgs)
                      .then((seedResult) => {
                        setResult(seedResult);
                        setStatus("succeeded");
                      })
                      .catch((seedError) => {
                        setError(messageFromError(seedError));
                        setStatus("failed");
                      });
                  }}
                  data-testid="button-kinflo-confirm-vanguard-seed"
                >
                  Run Vanguard dev seed
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {!approvedDevTarget ? (
          <Alert variant="destructive" className="mt-4 bg-white">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Dev target mismatch</AlertTitle>
            <AlertDescription>
              This control stays disabled unless the authenticated preview points to {KINFLO_APPROVED_DEV_ACTIVATION_DEPLOYMENT}.
            </AlertDescription>
          </Alert>
        ) : readiness === undefined ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600" data-testid="text-kinflo-vanguard-seed-loading">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking activation readiness.
          </div>
        ) : !seedReady ? (
          <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-950">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Seed is still gated</AlertTitle>
            <AlertDescription>
              Readiness requires {readiness.nextRequiredAction.replaceAll("_", " ")}. Complete that step before running the Vanguard seed.
            </AlertDescription>
          </Alert>
        ) : null}

        {status === "failed" ? (
          <Alert variant="destructive" className="mt-4 bg-white" data-testid="text-kinflo-vanguard-seed-error">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Vanguard seed failed</AlertTitle>
            <AlertDescription>
              {error} Next step: keep adapter switching and live smoke off, confirm the dev deployment, then retry once.
            </AlertDescription>
          </Alert>
        ) : null}

        {status === "succeeded" && result ? (
          <Alert className="mt-4 border-emerald-200 bg-emerald-50 text-emerald-950" data-testid="text-kinflo-vanguard-seed-success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Vanguard seed complete</AlertTitle>
            <AlertDescription>
              Tenant {result.tenantCreated ? "created" : "reused"}; site {result.siteCreated ? "created" : "reused"}; {result.blockCount} homepage blocks published. Next step: review the returned tenant and site records before any adapter switch or live smoke.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function KinfloHostedActivationControl() {
  const identity = useKinfloAdminIdentity();
  const activationEvidence = new URLSearchParams(window.location.search).get("activationEvidence");
  if (identity.source === "local_fixture" && activationEvidence === "seed-ready") {
    return <FixtureHostedActivationControl />;
  }
  if (identity.source !== "convex_auth") {
    return null;
  }
  return <LiveHostedActivationControl />;
}
