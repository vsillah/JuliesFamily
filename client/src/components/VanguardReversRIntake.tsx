import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  FileStack,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { vanguardWorkflow } from "@/lib/kinfloVanguardWorkflow";
import {
  VANGUARD_LOCAL_RECEIPT_STORAGE_KEY,
  VANGUARD_ORDER_PORTAL_PATH,
  createVanguardLocalReceipt,
} from "@/lib/kinfloVanguardOrderPortal";

const stepIcons = [FileStack, Target, Wrench, SlidersHorizontal, ClipboardCheck];

export default function VanguardReversRIntake() {
  const [step, setStep] = useState(0);
  const [sourcePackage, setSourcePackage] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [constraints, setConstraints] = useState<string[]>([]);
  const [constraintNotes, setConstraintNotes] = useState("");
  const [receiptReady, setReceiptReady] = useState(false);

  const missingInputs = useMemo(() => {
    const missing: string[] = [];
    if (sourcePackage.length === 0) missing.push("Select at least one source-package item");
    if (goal.trim().length < 20) missing.push("Describe the build goal in at least 20 characters");
    if (!discipline) missing.push("Choose the discipline that should review the request");
    if (constraints.length === 0 && constraintNotes.trim().length === 0) missing.push("Name a constraint or record that none are known yet");
    return missing;
  }, [constraints, constraintNotes, discipline, goal, sourcePackage]);

  const readyForQuoteReview = missingInputs.length === 0;
  const progress = ((step + 1) / vanguardWorkflow.intakeStages.length) * 100;

  function toggleValue(value: string, values: string[], update: (next: string[]) => void) {
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    setReceiptReady(false);
  }

  function goToStep(next: number) {
    setStep(Math.max(0, Math.min(vanguardWorkflow.intakeStages.length - 1, next)));
  }

  function continueToOrderPortal() {
    const receipt = createVanguardLocalReceipt({
      sourcePackage,
      goal: goal.trim(),
      discipline,
      constraints: [...constraints, constraintNotes.trim()].filter(Boolean),
    });
    window.sessionStorage.setItem(VANGUARD_LOCAL_RECEIPT_STORAGE_KEY, JSON.stringify(receipt));
    window.location.assign(`${VANGUARD_ORDER_PORTAL_PATH}?source=local-receipt`);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5" data-testid="vanguard-reversr-intake-app">
      <div className="border-b border-slate-200 bg-slate-950 px-4 py-4 text-white sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-500 text-slate-950 hover:bg-amber-500">ReversR Rebuild</Badge>
              <Badge variant="outline" className="border-white/20 text-slate-200">Embedded Vanguard intake</Badge>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-300">Build a reviewable request package before an associate scopes the work.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <LockKeyhole className="h-4 w-4 text-amber-300" />
            Local fixture · nothing leaves this page
          </div>
        </div>
        <Progress value={progress} className="mt-4 h-1.5 bg-white/15" />
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav className="min-w-0 max-w-full overflow-hidden border-b border-slate-200 bg-slate-50 p-3 lg:border-b-0 lg:border-r" aria-label="ReversR Rebuild intake steps">
          <ol className="flex max-w-full gap-2 overflow-x-auto lg:flex-col">
            {vanguardWorkflow.intakeStages.map((stage, index) => {
              const Icon = stepIcons[index];
              const isActive = step === index;
              const isComplete = index < step;
              return (
                <li key={stage.key} className="min-w-[156px] lg:min-w-0">
                  <button
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition ${isActive ? "border-amber-300 bg-amber-50 text-slate-950" : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white"}`}
                    aria-current={isActive ? "step" : undefined}
                    data-testid={`vanguard-intake-step-${stage.key}`}
                  >
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isComplete ? "bg-emerald-600 text-white" : isActive ? "bg-amber-500 text-slate-950" : "bg-slate-200 text-slate-600"}`}>
                      {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span>
                      <span className="block text-xs font-semibold">{index + 1}. {stage.label}</span>
                      <span className="mt-1 block text-[11px] leading-4 text-slate-500">{stage.summary}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="min-w-0 p-4 sm:p-6">
          {step === 0 ? (
            <div data-testid="vanguard-intake-source-package">
              <Badge variant="outline">Source package</Badge>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">What do you have today?</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Select the materials an associate would inventory. This preview records categories only; it does not accept file uploads.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {vanguardWorkflow.sourcePackageOptions.map((item) => {
                  const selected = sourcePackage.includes(item.label);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => toggleValue(item.label, sourcePackage, setSourcePackage)}
                      className={`rounded-xl border p-4 text-left ${selected ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                      aria-pressed={selected}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-950">{item.label}</span>
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-amber-500 bg-amber-500 text-slate-950" : "border-slate-300 text-transparent"}`}><Check className="h-4 w-4" /></span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-600">{item.description}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                Private upload is intentionally unavailable. A live release needs retention rules, access controls, and an approved attachment manifest first.
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div data-testid="vanguard-intake-request-goal">
              <Badge variant="outline">Request goal</Badge>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">What should change when the work is done?</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Describe the result in plain language. Name the current problem, the desired outcome, and the environment where the build must work.</p>
              <div className="mt-6 space-y-2">
                <Label htmlFor="vanguard-reversr-goal">Build goal</Label>
                <Textarea
                  id="vanguard-reversr-goal"
                  value={goal}
                  onChange={(event) => { setGoal(event.target.value); setReceiptReady(false); }}
                  placeholder="Example: Rebuild this worn bracket from the available drawing and measurements so it can be manufactured in stainless steel."
                  rows={7}
                />
                <div className="text-right text-xs text-slate-500">{goal.trim().length} characters</div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div data-testid="vanguard-intake-discipline">
              <Badge variant="outline">Discipline and type</Badge>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">Who should review this request?</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Choose one starting discipline. A Vanguard associate can adjust the route after the source inventory.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {vanguardWorkflow.disciplines.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => { setDiscipline(item.label); setReceiptReady(false); }}
                    className={`rounded-xl border p-4 text-left ${discipline === item.label ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:border-slate-300"}`}
                    aria-pressed={discipline === item.label}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block font-semibold text-slate-950">{item.label}</span>
                        <span className="mt-2 block text-xs leading-5 text-slate-600">{item.description}</span>
                      </span>
                      {discipline === item.label ? <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-700" /> : <CircleDashed className="h-5 w-5 shrink-0 text-slate-300" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div data-testid="vanguard-intake-constraints">
              <Badge variant="outline">Constraints</Badge>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">What can the build not ignore?</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Flag what will shape the quote, technical review, or delivery plan.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {vanguardWorkflow.constraintOptions.map((item) => (
                  <label key={item} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm text-slate-700 hover:bg-slate-50">
                    <Checkbox checked={constraints.includes(item)} onCheckedChange={() => toggleValue(item, constraints, setConstraints)} />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                <Label htmlFor="vanguard-reversr-constraint-notes">Constraint notes</Label>
                <Textarea
                  id="vanguard-reversr-constraint-notes"
                  value={constraintNotes}
                  onChange={(event) => { setConstraintNotes(event.target.value); setReceiptReady(false); }}
                  placeholder="Add dimensions, materials, deadlines, target systems, known risks, or write 'No other constraints known yet.'"
                  rows={4}
                />
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div data-testid="vanguard-intake-readiness">
              <Badge variant="outline">Readiness and quote gate</Badge>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">Review the package before handoff</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">ReversR checks whether the request is ready for Vanguard associate review. A complete local package still does not approve a quote or start fulfillment.</p>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-3">
                  {[
                    ["Source package", sourcePackage.join(", ") || "Missing"],
                    ["Request goal", goal.trim() || "Missing"],
                    ["Discipline", discipline || "Missing"],
                    ["Constraints", [...constraints, constraintNotes.trim()].filter(Boolean).join(", ") || "Missing"],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                      <div className="mt-2 break-words text-sm leading-6 text-slate-800">{value}</div>
                    </div>
                  ))}
                </div>
                <aside className={`h-fit rounded-xl border p-4 ${readyForQuoteReview ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                  {readyForQuoteReview ? <ShieldCheck className="h-6 w-6 text-emerald-700" /> : <LockKeyhole className="h-6 w-6 text-amber-700" />}
                  <h4 className="mt-3 font-semibold text-slate-950">{readyForQuoteReview ? "Ready for associate review" : "Readiness gate is locked"}</h4>
                  <p className="mt-2 text-xs leading-5 text-slate-700">
                    {readyForQuoteReview ? "The local package has the minimum fields for a Vanguard associate to inventory and scope." : "Complete the missing inputs before preparing a local receipt."}
                  </p>
                  {!readyForQuoteReview ? (
                    <ul className="mt-3 space-y-2">
                      {missingInputs.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-slate-700"><CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0" />{item}</li>)}
                    </ul>
                  ) : null}
                </aside>
              </div>

              <Button
                type="button"
                disabled={!readyForQuoteReview}
                onClick={() => setReceiptReady(true)}
                className="mt-5 h-auto w-full whitespace-normal bg-amber-700 py-2.5 text-white hover:bg-amber-800"
                data-testid="vanguard-generate-local-receipt"
              >
                <PackageCheck className="mr-2 h-4 w-4" /> Prepare local request receipt
              </Button>

              {receiptReady ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5" role="status" data-testid="vanguard-build-request-receipt">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-emerald-950"><PackageCheck className="h-5 w-5" /> Local request receipt ready</div>
                      <p className="mt-2 text-sm leading-6 text-emerald-900">A Vanguard associate would receive this package for source inventory, missing-input review, and a quote/scope decision.</p>
                    </div>
                    <Badge className="w-fit bg-emerald-700 hover:bg-emerald-700">VE-RRB-PREVIEW</Badge>
                  </div>
                  <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                    <div className="rounded-md bg-white/70 p-3"><span className="block text-emerald-700">Discipline</span><span className="mt-1 block font-semibold text-emerald-950">{discipline}</span></div>
                    <div className="rounded-md bg-white/70 p-3"><span className="block text-emerald-700">Next owner</span><span className="mt-1 block font-semibold text-emerald-950">Vanguard intake associate</span></div>
                    <div className="rounded-md bg-white/70 p-3"><span className="block text-emerald-700">Transmission</span><span className="mt-1 block font-semibold text-emerald-950">None · local receipt</span></div>
                  </div>
                  <Button
                    type="button"
                    onClick={continueToOrderPortal}
                    className="mt-4 h-auto w-full whitespace-normal bg-slate-950 py-2.5 text-white hover:bg-slate-800"
                    data-testid="vanguard-continue-to-order-portal"
                  >
                    <LockKeyhole className="mr-2 h-4 w-4" /> Continue to secure order portal
                  </Button>
                  <p className="mt-2 text-xs leading-5 text-emerald-800">Transfers the safe receipt fields within this browser session only. Authentication and Convex draft creation remain gated.</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={() => goToStep(step - 1)} disabled={step === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div className="text-xs text-slate-500">Step {step + 1} of {vanguardWorkflow.intakeStages.length}</div>
            <Button type="button" onClick={() => goToStep(step + 1)} disabled={step === vanguardWorkflow.intakeStages.length - 1} className="bg-slate-950 hover:bg-slate-800">
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
