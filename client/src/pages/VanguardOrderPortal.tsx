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
import {
  VANGUARD_LOCAL_RECEIPT_STORAGE_KEY,
  parseVanguardLocalReceipt,
  vanguardAssociateAssistContract,
  vanguardOrderPortalContract,
  vanguardPortalOrderFixture,
} from "@/lib/kinfloVanguardOrderPortal";
import { vanguardWorkflow } from "@/lib/kinfloVanguardWorkflow";

const milestoneTone = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-800",
  current: "border-blue-300 bg-blue-50 text-blue-900",
  upcoming: "border-slate-200 bg-slate-50 text-slate-600",
} as const;

export default function VanguardOrderPortal() {
  const [showTransferReview, setShowTransferReview] = useState(false);
  const [localReceipt] = useState(() => {
    if (typeof window === "undefined") return null;
    return parseVanguardLocalReceipt(window.sessionStorage.getItem(VANGUARD_LOCAL_RECEIPT_STORAGE_KEY));
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950" data-testid="vanguard-order-portal">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-28 shrink-0 items-center justify-center rounded-lg bg-white p-2">
              <img src={vanguardWorkflow.company.logo.image} alt={vanguardWorkflow.company.logo.alt} className="max-h-full w-auto object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Secure client workspace</div>
              <h1 className="mt-1 text-xl font-semibold sm:text-2xl">Vanguard order portal</h1>
            </div>
          </div>
          <Button asChild variant="outline" className="w-fit border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
            <Link href="/kinflo-sites/vanguard-enterprises#build-request"><ArrowLeft className="mr-2 h-4 w-4" /> Back to build request</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8" data-testid="vanguard-order-portal-foundation">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" data-testid="vanguard-order-auth-gate">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-500 text-slate-950 hover:bg-amber-500">Sign in required</Badge>
              <Badge variant="outline" className="border-slate-300">Order portal</Badge>
            </div>
            <div className="mt-5 flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-amber-300"><LockKeyhole className="h-5 w-5" /></span>
              <div>
                <h2 className="text-2xl font-semibold">Sign in before saving this request</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  This request is still stored in your browser. Sign-in is required before Vanguard can save it as a draft or add it to your order history. Draft saving is not available in this preview.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button type="button" disabled data-testid="vanguard-order-sign-in-gated"><ShieldCheck className="mr-2 h-4 w-4" /> Sign in to save request</Button>
              <Button type="button" variant="outline" disabled={!localReceipt} onClick={() => setShowTransferReview((value) => !value)} data-testid="vanguard-order-review-transfer">
                <FileStack className="mr-2 h-4 w-4" /> {showTransferReview ? "Hide request details" : "Review request details"}
              </Button>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">{vanguardOrderPortalContract.blockedReason}</p>
          </div>

          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5" data-testid="vanguard-order-data-boundary">
            <div className="flex items-center gap-2 font-semibold text-amber-950"><Database className="h-5 w-5" /> Request status</div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg border border-amber-200 bg-white/80 p-3"><dt className="text-xs text-amber-700">Request storage</dt><dd className="mt-1 font-semibold">This browser session</dd></div>
              <div className="rounded-lg border border-amber-200 bg-white/80 p-3"><dt className="text-xs text-amber-700">Saved order</dt><dd className="mt-1 font-semibold">Not created</dd></div>
              <div className="rounded-lg border border-amber-200 bg-white/80 p-3"><dt className="text-xs text-amber-700">Private uploads</dt><dd className="mt-1 font-semibold">Not available</dd></div>
              <div className="rounded-lg border border-amber-200 bg-white/80 p-3"><dt className="text-xs text-amber-700">Next step</dt><dd className="mt-1 font-semibold">Sign in when account access opens</dd></div>
            </dl>
          </aside>
        </section>

        {showTransferReview && localReceipt ? (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm sm:p-7" data-testid="vanguard-order-transfer-review">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <Badge className="bg-blue-700 hover:bg-blue-700">Review before saving</Badge>
                <h2 className="mt-3 text-xl font-semibold text-blue-950">Confirm the request details</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-900">These details stay in this browser until sign-in is available. Nothing has been sent to Vanguard.</p>
              </div>
              <Badge variant="outline" className="w-fit border-blue-300 bg-white text-blue-800">{localReceipt.receiptId}</Badge>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ["Available materials", localReceipt.sourcePackage.join(", ")],
                ["Discipline", localReceipt.discipline],
                ["Build goal", localReceipt.goal],
                ["Constraints", localReceipt.constraints.join(", ")],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-blue-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">{label}</div>
                  <div className="mt-2 break-words text-sm leading-6 text-slate-800">{value}</div>
                </div>
              ))}
            </div>
            <Button type="button" disabled className="mt-4" data-testid="vanguard-order-promote-gated"><PackageCheck className="mr-2 h-4 w-4" /> Save as draft · sign-in required</Button>
          </section>
        ) : null}

        {!localReceipt ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm leading-6 text-slate-600" data-testid="vanguard-order-empty-receipt">
            No request receipt is attached to this session. Return to the build request, complete the required details, and choose <strong>Continue to secure order portal</strong>.
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" data-testid="vanguard-order-assist-request">
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
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Choose what a Vanguard associate can see and how they can help. You set the access end time, and you can revoke access sooner.
                  </p>
                </div>
              </div>
            </div>
            <Button type="button" disabled data-testid="vanguard-order-request-assistance-gated"><UsersRound className="mr-2 h-4 w-4" /> Sign in to request support</Button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3" data-testid="vanguard-order-assist-modes">
            {vanguardAssociateAssistContract.modes.map((mode) => (
              <article key={mode.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-950">{mode.clientLabel}</div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{mode.summary}</p>
              </article>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4" data-testid="vanguard-order-assist-consent-boundary">
              <div className="flex items-center gap-2 text-sm font-semibold text-teal-950"><ShieldCheck className="h-4 w-4" /> You control what is shared</div>
              <p className="mt-2 text-xs leading-5 text-teal-900">{vanguardAssociateAssistContract.privacyBoundary}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4" data-testid="vanguard-order-assist-auth-recovery">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-950"><Clock3 className="h-4 w-4" /> Support is not active yet</div>
              <p className="mt-2 text-xs leading-5 text-amber-900">{vanguardAssociateAssistContract.recoveryStep}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" data-testid="vanguard-order-tracking-preview">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-violet-300 bg-violet-50 text-violet-800">Order tracking preview</Badge>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">{vanguardPortalOrderFixture.clientStatusLabel}</Badge>
              </div>
              <h2 className="mt-3 text-2xl font-semibold">{vanguardPortalOrderFixture.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{vanguardPortalOrderFixture.orderNumber} · {vanguardPortalOrderFixture.lastUpdatedLabel}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm md:max-w-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next action</div>
              <p className="mt-1 leading-5 text-slate-800">{vanguardPortalOrderFixture.nextAction}</p>
            </div>
          </div>

          <ol className="mt-6 grid gap-3 lg:grid-cols-5" aria-label="Order preview milestones">
            {vanguardPortalOrderFixture.milestones.map((milestone, index) => (
              <li key={milestone.key} className={`rounded-xl border p-4 ${milestoneTone[milestone.state]}`} data-testid={`vanguard-order-milestone-${milestone.key}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide">Step {index + 1}</span>
                  {milestone.state === "complete" ? <CheckCircle2 className="h-4 w-4" /> : milestone.state === "current" ? <CircleDashed className="h-4 w-4" /> : <Check className="h-4 w-4 opacity-30" />}
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-950">{milestone.label}</div>
                <p className="mt-2 text-xs leading-5">{milestone.clientDetail}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs leading-5 text-violet-900">
            This sample shows how clients will follow an order. It is not an active Vanguard order.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white sm:p-7" data-testid="vanguard-order-promotion-contract">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-300"><ShieldCheck className="h-4 w-4" /> Before you save</div>
          <h2 className="mt-2 text-xl font-semibold">What the order portal will confirm</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {vanguardOrderPortalContract.promotionRequirements.map((requirement) => (
              <div key={requirement} className="rounded-lg border border-white/15 bg-white/5 p-3 text-sm leading-6 text-slate-200">{requirement}</div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-400">{vanguardOrderPortalContract.sourceManifestBoundary}</p>
        </section>
      </main>
    </div>
  );
}
