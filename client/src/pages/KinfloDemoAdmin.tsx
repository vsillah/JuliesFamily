import { useState } from "react";
import { ArrowLeft, Eye, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import AdminKinfloShell from "@/pages/AdminKinfloShell";
import { ReviewFixtureIdentityGate } from "@/components/KinfloAdminRoute";
import { Button } from "@/components/ui/button";

function DemoUnavailable() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12 text-white">
      <section className="w-full max-w-xl border border-white/15 bg-white/[0.05] p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">KinFlo demo</p>
        <h1 className="mt-3 text-3xl font-semibold">The admin demo is not enabled on this build.</h1>
        <p className="mt-4 leading-7 text-slate-300">Use the protected demo Preview URL supplied for your meeting, or return to the public KinFlo homepage.</p>
        <Button asChild className="mt-7 bg-emerald-300 text-slate-950 hover:bg-emerald-200">
          <Link href="/">Return to KinFlo home</Link>
        </Button>
      </section>
    </main>
  );
}

export default function KinfloDemoAdmin() {
  const enabled = import.meta.env.DEV || import.meta.env.VITE_KINFLO_PUBLIC_DEMO === "true";
  const [scopeReady] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    const params = new URLSearchParams(window.location.search);
    if (!params.has("tenant") || !params.has("site")) {
      params.set("tenant", "vanguard-enterprises");
      params.set("site", "vanguard-enterprises");
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`);
    }
    return true;
  });

  if (!enabled || !scopeReady) {
    return <DemoUnavailable />;
  }

  return (
    <ReviewFixtureIdentityGate>
      <div className="min-h-screen bg-background text-foreground">
        <div className="sticky top-0 z-50 border-b border-emerald-300/25 bg-slate-950 px-4 py-3 text-white shadow-lg sm:px-6">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-300 text-slate-950">
                <Eye className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">KinFlo admin demo</p>
                <p className="text-xs leading-5 text-slate-300">Read-only fixture workspace for presentations. No sign-in, tenant writes, provider calls, or live data.</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden items-center gap-1.5 text-xs text-emerald-200 sm:inline-flex"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Fixture-backed</span>
              <Button asChild size="sm" variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> KinFlo home</Link>
              </Button>
            </div>
          </div>
        </div>
        <AdminKinfloShell />
      </div>
    </ReviewFixtureIdentityGate>
  );
}
