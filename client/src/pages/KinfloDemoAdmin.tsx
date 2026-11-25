import { useState } from "react";
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
    // The platform level and the scope chooser have no tenant selected; only the tenant level gets a default scope.
    const tenantLevel = params.get("view") !== "platform" && params.get("scope") !== "choose";
    if (tenantLevel && (!params.has("tenant") || !params.has("site"))) {
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
      {/* The shared KinFlo level bar (brand, platform/tenant level, fixture boundary) comes from the fixture provider. */}
      <AdminKinfloShell />
    </ReviewFixtureIdentityGate>
  );
}
