import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Database,
  FileStack,
  HandHelping,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OrderLifecycleNavigation from "@/components/OrderLifecycleNavigation";
import VanguardThemeControl from "@/components/VanguardThemeControl";
import { useVanguardTheme } from "@/hooks/useVanguardTheme";
import {
  VANGUARD_LOCAL_RECEIPT_STORAGE_KEY,
  parseVanguardLocalReceipt,
  vanguardAssociateAssistContract,
  vanguardOrderLifecycleNavigation,
  vanguardOrderPortalContract,
  vanguardPortalOrderFixture,
} from "@/lib/kinfloVanguardOrderPortal";
import { vanguardWorkflow } from "@/lib/kinfloVanguardWorkflow";

const milestoneTone = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  current: "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
  upcoming: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
} as const;

export default function VanguardOrderPortal() {
  const { mode: themeMode, setMode: setThemeMode } = useVanguardTheme();
  const [localReceipt] = useState(() => {
    if (typeof window === "undefined") return null;
    return parseVanguardLocalReceipt(window.sessionStorage.getItem(VANGUARD_LOCAL_RECEIPT_STORAGE_KEY));
  });
  const [showTransferReview, setShowTransferReview] = useState(() => Boolean(localReceipt));

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-50" data-testid="vanguard-order-portal">
      <header className="border-b border-slate-200 bg-white text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-28 shrink-0 items-center justify-center rounded-lg bg-white p-2">
              <img src={vanguardWorkflow.company.logo.image} alt={vanguardWorkflow.company.logo.alt} className="max-h-full w-auto object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Secure client workspace</div>
              <h1 className="mt-1 text-xl font-semibold sm:text-2xl">Vanguard order portal</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <VanguardThemeControl mode={themeMode} onChange={setThemeMode} />
            <Button asChild variant="outline" className="w-fit border-slate-300 bg-white text-slate-950 hover:bg-slate-100 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:text-white">
              <Link href="/kinflo-sites/vanguard-enterprises#build-request"><ArrowLeft className="mr-2 h-4 w-4" /> Back to build request</Link>
            </Button>
          </div>
        </div>
      </header>

      <OrderLifecycleNavigation
        activeKey={localReceipt ? "review" : "track"}
        eyebrow="ReversR and Vanguard share one order"
        items={[...vanguardOrderLifecycleNavigation]}
      />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8" data-testid="vanguard-order-portal-foundation">
        <section id="request-receipt" className="scroll-mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30 sm:p-6" data-testid="vanguard-order-receipt-continuity">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-700 text-white hover:bg-emerald-700">{localReceipt ? "Browser draft ready" : "No draft attached"}</Badge>
                <Badge variant="outline" className="border-emerald-300 bg-white text-emerald-800 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-200">ReversR request receipt</Badge>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{localReceipt ? "Your request arrived with you" : "Start with a ReversR request"}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-200">
                {localReceipt ? "Review the details below. They remain in this browser until account-based saving is available." : "Prepare the request first, then return here to review the receipt and follow the order path."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="border-emerald-300 bg-white text-emerald-900 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-100">
                <Link href="/kinflo-sites/vanguard-enterprises#build-request">{localReceipt ? "Edit request" : "Start request"}</Link>
              </Button>
              {localReceipt ? <Button type="button" onClick={() => setShowTransferReview((value) => !value)} className="bg-blue-600 text-white hover:bg-blue-700" data-testid="vanguard-order-receipt-details">{showTransferReview ? "Hide receipt" : "Review receipt"}</Button> : null}
            </div>
          </div>
        </section>

        {showTransferReview && localReceipt ? (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-800 dark:bg-blue-950/40 sm:p-7" data-testid="vanguard-order-transfer-review">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <Badge className="bg-blue-700 hover:bg-blue-700">Review before saving</Badge>
                <h2 className="mt-3 text-xl font-semibold text-blue-950 dark:text-blue-100">Confirm the request details</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-900 dark:text-blue-200">These details stay in this browser until sign-in is available. Nothing has been sent to Vanguard.</p>
              </div>
              <Badge variant="outline" className="w-fit border-blue-300 bg-white text-blue-800 dark:border-blue-700 dark:bg-slate-900 dark:text-blue-200">Browser draft</Badge>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ["Available materials", localReceipt.sourcePackage.join(", ")],
                ["Discipline", localReceipt.discipline],
                ["Build goal", localReceipt.goal],
                ["Constraints", localReceipt.constraints.join(", ")],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-blue-200 bg-white p-4 dark:border-blue-800 dark:bg-slate-900">
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">{label}</div>
                  <div className="mt-2 break-words text-sm leading-6 text-slate-800 dark:text-slate-200">{value}</div>
                </div>
              ))}
            </div>
            {localReceipt.engineeringReview ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30" data-testid="vanguard-order-engineering-review-summary">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-emerald-950 dark:text-emerald-100">IGES engineering-review summary</div>
                  <Badge variant="outline" className="border-emerald-300 bg-white text-emerald-900">{localReceipt.engineeringReview.receiptId}</Badge>
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["Filename", localReceipt.engineeringReview.fileName],
                    ["Source size", `${(localReceipt.engineeringReview.sourceBytes / 1024).toFixed(1)} KiB`],
                    ["Meshes", String(localReceipt.engineeringReview.meshCount)],
                    ["Vertices", localReceipt.engineeringReview.vertexCount.toLocaleString()],
                    ["Triangles", localReceipt.engineeringReview.triangleCount.toLocaleString()],
                    ["Bounding box", localReceipt.engineeringReview.boundingBoxMm.map((value) => `${value.toFixed(2)} mm`).join(" × ")],
                  ].map(([label, value]) => <div key={label} className="rounded-lg border border-emerald-200 bg-white p-3"><dt className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">{label}</dt><dd className="mt-1 break-words text-xs text-slate-900">{value}</dd></div>)}
                </dl>
                <div className="mt-3 break-all rounded-lg border border-emerald-200 bg-white p-3 font-mono text-[10px] text-slate-700">SHA-256 {localReceipt.engineeringReview.digestSha256}</div>
                <p className="mt-3 text-xs leading-5 text-emerald-950 dark:text-emerald-100">This sanitized browser-local summary is for engineering review only. It is not a quote, dimensional inspection, certification, or manufacturing guarantee. The source file and geometry are not attached.</p>
              </div>
            ) : null}
            <Button type="button" disabled className="mt-4 bg-blue-600 text-white" data-testid="vanguard-order-promote-gated"><PackageCheck className="mr-2 h-4 w-4" /> Save as draft · sign-in required</Button>
          </section>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7" data-testid="vanguard-order-auth-gate">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-600 text-white hover:bg-blue-600">Sign in required</Badge>
              <Badge variant="outline" className="border-slate-300 dark:border-slate-600">Order portal</Badge>
            </div>
            <div className="mt-5 flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-emerald-300 dark:bg-slate-800"><LockKeyhole className="h-5 w-5" /></span>
              <div>
                <h2 className="text-2xl font-semibold">Sign in before saving this request</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  This request is still stored in your browser. Sign-in is required before Vanguard can save it as a draft or add it to your order history. Account-based draft saving is not available yet.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button type="button" disabled className="bg-blue-600 text-white" data-testid="vanguard-order-sign-in-gated"><ShieldCheck className="mr-2 h-4 w-4" /> Sign in to save request</Button>
              <Button type="button" variant="outline" disabled={!localReceipt} onClick={() => setShowTransferReview((value) => !value)} data-testid="vanguard-order-review-transfer">
                <FileStack className="mr-2 h-4 w-4" /> {showTransferReview ? "Hide request details" : "Review request details"}
              </Button>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{vanguardOrderPortalContract.blockedReason}</p>
          </div>

          <aside className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950/40" data-testid="vanguard-order-data-boundary">
            <div className="flex items-center gap-2 font-semibold text-blue-950 dark:text-blue-100"><Database className="h-5 w-5" /> Request status</div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg border border-blue-200 bg-white/80 p-3 dark:border-blue-800 dark:bg-slate-900/80"><dt className="text-xs text-blue-700 dark:text-blue-300">Request storage</dt><dd className="mt-1 font-semibold">This browser session</dd></div>
              <div className="rounded-lg border border-blue-200 bg-white/80 p-3 dark:border-blue-800 dark:bg-slate-900/80"><dt className="text-xs text-blue-700 dark:text-blue-300">Saved order</dt><dd className="mt-1 font-semibold">Not created</dd></div>
              <div className="rounded-lg border border-blue-200 bg-white/80 p-3 dark:border-blue-800 dark:bg-slate-900/80"><dt className="text-xs text-blue-700 dark:text-blue-300">Private uploads</dt><dd className="mt-1 font-semibold">Not available</dd></div>
              <div className="rounded-lg border border-blue-200 bg-white/80 p-3 dark:border-blue-800 dark:bg-slate-900/80"><dt className="text-xs text-blue-700 dark:text-blue-300">Next step</dt><dd className="mt-1 font-semibold">Sign in when account access opens</dd></div>
            </dl>
          </aside>
        </section>

        {!localReceipt ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" data-testid="vanguard-order-empty-receipt">
            No request receipt is attached to this session. Return to the build request, complete the required details, and choose <strong>Continue to secure order portal</strong>.
          </section>
        ) : null}

        <section id="associate-support" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7" data-testid="vanguard-order-assist-request">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">Associate support</Badge>
                <Badge variant="outline" className="border-slate-300">Sign in required</Badge>
              </div>
              <div className="mt-4 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800"><HandHelping className="h-5 w-5" /></span>
                <div>
                  <h2 className="text-2xl font-semibold">Need help finishing your request?</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Choose what a Vanguard associate can see and how they can help. You set the access end time, and you can revoke access sooner.
                  </p>
                </div>
              </div>
            </div>
            <Button type="button" disabled data-testid="vanguard-order-request-assistance-gated"><UsersRound className="mr-2 h-4 w-4" /> Sign in to request support</Button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3" data-testid="vanguard-order-assist-modes">
            {vanguardAssociateAssistContract.modes.map((mode) => (
              <article key={mode.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <div className="text-sm font-semibold text-slate-950 dark:text-white">{mode.clientLabel}</div>
                <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{mode.summary}</p>
              </article>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950/40" data-testid="vanguard-order-assist-consent-boundary">
              <div className="flex items-center gap-2 text-sm font-semibold text-teal-950 dark:text-teal-100"><ShieldCheck className="h-4 w-4" /> You control what is shared</div>
              <p className="mt-2 text-xs leading-5 text-teal-900 dark:text-teal-200">{vanguardAssociateAssistContract.privacyBoundary}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40" data-testid="vanguard-order-assist-auth-recovery">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-950 dark:text-blue-100"><Clock3 className="h-4 w-4" /> Support is not active yet</div>
              <p className="mt-2 text-xs leading-5 text-blue-900 dark:text-blue-200">{vanguardAssociateAssistContract.recoveryStep}</p>
            </div>
          </div>
        </section>

        <section id="order-tracking" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7" data-testid="vanguard-order-tracking-preview">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-violet-300 bg-violet-50 text-violet-800">Saved order path</Badge>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">{vanguardPortalOrderFixture.clientStatusLabel}</Badge>
              </div>
              <h2 className="mt-3 text-2xl font-semibold">{localReceipt ? "Your request will follow this path after it is saved" : "See how a Vanguard order moves"}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{vanguardPortalOrderFixture.lastUpdatedLabel}</p>
            </div>
            <div className="grid gap-3 md:max-w-md md:grid-cols-2" data-testid="vanguard-order-ownership-summary">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Current owner</div>
                <p className="mt-1 leading-5 text-slate-800 dark:text-slate-200">{vanguardPortalOrderFixture.currentOwner}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Next action</div>
                <p className="mt-1 leading-5 text-slate-800 dark:text-slate-200">{vanguardPortalOrderFixture.nextAction}</p>
              </div>
            </div>
          </div>

          <ol className="mt-6 grid gap-3 lg:grid-cols-5" aria-label="Order preview milestones">
            {vanguardPortalOrderFixture.milestones.map((milestone, index) => (
              <li key={milestone.key} className={`rounded-xl border p-4 ${milestoneTone[milestone.state]}`} data-testid={`vanguard-order-milestone-${milestone.key}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide">Step {index + 1}</span>
                  {milestone.state === "complete" ? <CheckCircle2 className="h-4 w-4" /> : milestone.state === "current" ? <CircleDashed className="h-4 w-4" /> : <Check className="h-4 w-4 opacity-30" />}
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">{milestone.label}</div>
                <p className="mt-2 text-xs leading-5">{milestone.clientDetail}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs leading-5 text-violet-900 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
            No saved Vanguard order has been created from this browser draft. {localReceipt ? "Your browser draft has not been sent to Vanguard." : "Start a request to prepare your own browser draft."}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-7" data-testid="vanguard-order-promotion-contract">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><ShieldCheck className="h-4 w-4" /> Before you save</div>
          <h2 className="mt-2 text-xl font-semibold">What the order portal will confirm</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {vanguardOrderPortalContract.promotionRequirements.map((requirement) => (
              <div key={requirement} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">{requirement}</div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">{vanguardOrderPortalContract.sourceManifestBoundary}</p>
        </section>
      </main>
    </div>
  );
}
