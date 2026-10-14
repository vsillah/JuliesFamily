import { useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Boxes, Check, CheckCircle2, CircleDashed, ClipboardCheck,
  FileStack, FolderKanban, HelpCircle, LayoutDashboard, LockKeyhole, PackageCheck,
  PanelRight, Settings, ShieldCheck, SlidersHorizontal, Target, UserRound, Wrench,
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
const workspaceTools = [
  { label: "Workspace", icon: LayoutDashboard, active: true },
  { label: "Builds", icon: FolderKanban, active: false },
  { label: "Materials", icon: Boxes, active: false },
];

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
    if (sourcePackage.length === 0) missing.push("Choose at least one available material");
    if (goal.trim().length < 20) missing.push("Describe the build goal in at least 20 characters");
    if (!discipline) missing.push("Choose the discipline that should review the request");
    if (constraints.length === 0 && constraintNotes.trim().length === 0) missing.push("Name a constraint or record that none are known yet");
    return missing;
  }, [constraints, constraintNotes, discipline, goal, sourcePackage]);

  const readyForQuoteReview = missingInputs.length === 0;
  const progress = ((step + 1) / vanguardWorkflow.intakeStages.length) * 100;
  const currentStage = vanguardWorkflow.intakeStages[step];

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
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 shadow-2xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900" data-testid="vanguard-reversr-intake-app" data-workspace-mode="browser-local">
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" data-testid="vanguard-reversr-desktop-header">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black tracking-tight text-white">RR</div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black tracking-[0.16em] text-slate-950 dark:text-white">REVERSR</span>
                <Badge className="bg-amber-500 text-slate-950 hover:bg-amber-500">ReversR order request</Badge>
                <Badge variant="outline">Vanguard client journey</Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Machine reconstruction · Request to delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 sm:flex"><ShieldCheck className="h-3.5 w-3.5" /> Draft stays on this device</div>
            <Button type="button" variant="outline" size="sm" disabled className="bg-white dark:bg-slate-900"><UserRound className="mr-2 h-4 w-4" /> Sign in to save</Button>
          </div>
        </div>
        <div className="border-t border-slate-100 px-4 py-2 dark:border-slate-800 sm:px-5" data-testid="vanguard-reversr-phase-rail">
          <ol className="flex gap-2 overflow-x-auto pb-1" aria-label="ReversR order phases">
            {vanguardWorkflow.intakeStages.map((stage, index) => {
              const Icon = stepIcons[index];
              const isActive = step === index;
              const isComplete = index < step;
              return (
                <li key={stage.key} className="min-w-[150px] flex-1">
                  <button type="button" onClick={() => goToStep(index)} className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${isActive ? "border-amber-400 bg-amber-50 text-slate-950 dark:bg-amber-950/40 dark:text-amber-100" : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-900"}`} aria-current={isActive ? "step" : undefined} data-testid={`vanguard-intake-step-${stage.key}`}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isComplete ? "bg-emerald-600 text-white" : isActive ? "bg-amber-500 text-slate-950" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span>
                    <span className="min-w-0"><span className="block text-[10px] font-semibold uppercase tracking-wide">Phase {index + 1}</span><span className="block truncate text-xs font-semibold">{stage.label}</span></span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <Progress value={progress} className="h-1 rounded-none bg-slate-100 dark:bg-slate-800" />
      </header>

      <div className="grid min-w-0 xl:grid-cols-[184px_minmax(0,1fr)_320px]" data-testid="vanguard-reversr-desktop-workspace">
        <nav className="hidden border-r border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950 xl:flex xl:min-h-[660px] xl:flex-col" aria-label="ReversR workspace">
          <div className="space-y-1">
            {workspaceTools.map((item) => {
              const Icon = item.icon;
              return <button key={item.label} type="button" disabled={!item.active} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${item.active ? "bg-slate-950 text-white" : "text-slate-400"}`}><Icon className="h-4 w-4" /> {item.label}</button>;
            })}
          </div>
          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Current build</p>
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40"><div className="text-xs font-semibold text-slate-950 dark:text-amber-100">Untitled request</div><div className="mt-1 text-[11px] leading-4 text-slate-600 dark:text-amber-200">Details remain here until you continue to the order portal.</div></div>
          </div>
          <div className="mt-auto space-y-1 border-t border-slate-200 pt-3 dark:border-slate-800">
            <button type="button" disabled className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400"><HelpCircle className="h-4 w-4" /> Support</button>
            <button type="button" disabled className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400"><Settings className="h-4 w-4" /> Settings</button>
          </div>
        </nav>

        <main className="min-w-0 bg-slate-50 p-3 dark:bg-slate-900 sm:p-5" data-testid="vanguard-reversr-workspace-canvas">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div><div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">{currentStage.label}</div><h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">Assemble the request Vanguard can review</h3></div>
            <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-emerald-800">Available now</Badge>
          </div>

          <section className="min-h-[515px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950 sm:p-6">
            {step === 0 ? (
              <div data-testid="vanguard-intake-source-package">
                <Badge variant="outline">Materials package</Badge>
                <h4 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">What do you have today?</h4>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Build an inventory of the drawings, measurements, images, or existing parts that can guide the work.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {vanguardWorkflow.sourcePackageOptions.map((item) => {
                    const selected = sourcePackage.includes(item.label);
                    return (
                      <button key={item.label} type="button" onClick={() => toggleValue(item.label, sourcePackage, setSourcePackage)} className={`rounded-xl border p-4 text-left transition ${selected ? "border-amber-400 bg-amber-50 shadow-sm dark:bg-amber-950/40" : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"}`} aria-pressed={selected}>
                        <div className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-950 dark:text-white">{item.label}</span><span className={`flex h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-amber-500 bg-amber-500 text-slate-950" : "border-slate-300 text-transparent dark:border-slate-600"}`}><Check className="h-4 w-4" /></span></div>
                        <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.description}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" /><span><strong>Private upload is intentionally unavailable.</strong> File transfer becomes available after account access, retention rules, and sharing controls are in place. For now, name what you have without attaching it.</span></div>
              </div>
            ) : null}

            {step === 1 ? (
              <div data-testid="vanguard-intake-request-goal">
                <Badge variant="outline">Build requirement</Badge>
                <h4 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">What should change when the work is done?</h4>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Name the current problem, the result you need, and the environment where the finished work must perform.</p>
                <div className="mt-6 space-y-2"><Label htmlFor="vanguard-reversr-goal">Build goal</Label><Textarea id="vanguard-reversr-goal" value={goal} onChange={(event) => { setGoal(event.target.value); setReceiptReady(false); }} placeholder="Example: Rebuild this worn bracket from the available drawing and measurements so it can be manufactured in stainless steel." rows={10} /><div className="flex justify-between text-xs text-slate-500"><span>Include the desired outcome and working conditions.</span><span>{goal.trim().length} characters</span></div></div>
              </div>
            ) : null}

            {step === 2 ? (
              <div data-testid="vanguard-intake-discipline">
                <Badge variant="outline">Work routing</Badge>
                <h4 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">Which team should begin the review?</h4>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Choose a starting discipline. A Vanguard associate confirms the route before scope and pricing.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {vanguardWorkflow.disciplines.map((item) => (
                    <button key={item.label} type="button" onClick={() => { setDiscipline(item.label); setReceiptReady(false); }} className={`rounded-xl border p-4 text-left transition ${discipline === item.label ? "border-amber-400 bg-amber-50 shadow-sm dark:bg-amber-950/40" : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"}`} aria-pressed={discipline === item.label}>
                      <div className="flex items-start justify-between gap-3"><span><span className="block font-semibold text-slate-950 dark:text-white">{item.label}</span><span className="mt-2 block text-xs leading-5 text-slate-600 dark:text-slate-300">{item.description}</span></span>{discipline === item.label ? <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" /> : <CircleDashed className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div data-testid="vanguard-intake-constraints">
                <Badge variant="outline">Build constraints</Badge>
                <h4 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">What can the build not ignore?</h4>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Flag the conditions that will shape technical review, pricing, or delivery planning.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">{vanguardWorkflow.constraintOptions.map((item) => <label key={item} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"><Checkbox checked={constraints.includes(item)} onCheckedChange={() => toggleValue(item, constraints, setConstraints)} /><span>{item}</span></label>)}</div>
                <div className="mt-5 space-y-2"><Label htmlFor="vanguard-reversr-constraint-notes">Additional conditions</Label><Textarea id="vanguard-reversr-constraint-notes" value={constraintNotes} onChange={(event) => { setConstraintNotes(event.target.value); setReceiptReady(false); }} placeholder="Add dimensions, materials, deadlines, target systems, known risks, or write 'No other constraints known yet.'" rows={5} /></div>
              </div>
            ) : null}

            {step === 4 ? (
              <div data-testid="vanguard-intake-readiness">
                <Badge variant="outline">Request review</Badge>
                <h4 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">Check the package before handoff</h4>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">A complete request gives Vanguard enough context to begin an associate review. Scope, price, assignment, and production still require later decisions.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">{[["Available materials", sourcePackage.join(", ") || "Missing"], ["Build goal", goal.trim() || "Missing"], ["Starting discipline", discipline || "Missing"], ["Constraints", [...constraints, constraintNotes.trim()].filter(Boolean).join(", ") || "Missing"]].map(([label, value]) => <div key={label} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div><div className="mt-2 break-words text-sm leading-6 text-slate-800 dark:text-slate-200">{value}</div></div>)}</div>
                <Button type="button" disabled={!readyForQuoteReview} onClick={() => setReceiptReady(true)} className="mt-5 h-auto w-full whitespace-normal bg-amber-700 py-2.5 text-white hover:bg-amber-800" data-testid="vanguard-generate-local-receipt"><PackageCheck className="mr-2 h-4 w-4" /> Prepare request receipt</Button>
                {receiptReady ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/40" role="status" data-testid="vanguard-build-request-receipt"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 font-semibold text-emerald-950 dark:text-emerald-100"><PackageCheck className="h-5 w-5" /> Request receipt ready</div><p className="mt-2 text-sm leading-6 text-emerald-900 dark:text-emerald-200">Continue to review this package beside the Vanguard order path. Nothing has been sent.</p></div><Badge className="w-fit bg-emerald-700 hover:bg-emerald-700">Browser draft</Badge></div><Button type="button" onClick={continueToOrderPortal} className="mt-4 h-auto w-full whitespace-normal bg-slate-950 py-2.5 text-white hover:bg-slate-800" data-testid="vanguard-continue-to-order-portal"><LockKeyhole className="mr-2 h-4 w-4" /> Continue to secure order portal</Button></div> : null}
              </div>
            ) : null}
          </section>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"><Button type="button" variant="outline" onClick={() => goToStep(step - 1)} disabled={step === 0}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button><div className="text-center text-xs text-slate-500 dark:text-slate-400">Phase {step + 1} of {vanguardWorkflow.intakeStages.length}</div><Button type="button" onClick={() => goToStep(step + 1)} disabled={step === vanguardWorkflow.intakeStages.length - 1} className="bg-slate-950 hover:bg-slate-800">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
        </main>

        <aside className="border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950 xl:min-h-[660px] xl:border-l xl:border-t-0" data-testid="vanguard-reversr-workspace-inspector">
          <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 font-semibold text-slate-950 dark:text-white"><PanelRight className="h-4 w-4" /> Request package</div><Badge variant="outline">{readyForQuoteReview ? "Complete" : `${missingInputs.length} open`}</Badge></div>
          <div className="mt-4 space-y-2">
            {[["Materials", sourcePackage.length ? `${sourcePackage.length} selected` : "Not started", sourcePackage.length > 0], ["Build goal", goal.trim().length >= 20 ? "Recorded" : "Needs detail", goal.trim().length >= 20], ["Discipline", discipline || "Not selected", Boolean(discipline)], ["Constraints", constraints.length || constraintNotes.trim() ? "Recorded" : "Not recorded", Boolean(constraints.length || constraintNotes.trim())]].map(([label, value, complete]) => (
              <button key={String(label)} type="button" onClick={() => goToStep(["Materials", "Build goal", "Discipline", "Constraints"].indexOf(String(label)))} className="flex w-full items-start justify-between gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"><span><span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">{label}</span><span className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">{String(value)}</span></span>{complete ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <CircleDashed className="h-4 w-4 shrink-0 text-amber-600" />}</button>
            ))}
          </div>
          <div className={`mt-5 rounded-xl border p-4 ${readyForQuoteReview ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40" : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"}`}>{readyForQuoteReview ? <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-300" /> : <ClipboardCheck className="h-5 w-5 text-amber-700 dark:text-amber-300" />}<div className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{readyForQuoteReview ? "Ready for request review" : "Complete the open items"}</div>{!readyForQuoteReview ? <ul className="mt-3 space-y-2">{missingInputs.map((item) => <li key={item} className="flex gap-2 text-[11px] leading-4 text-slate-700 dark:text-slate-300"><CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0" />{item}</li>)}</ul> : <p className="mt-2 text-xs leading-5 text-slate-700 dark:text-slate-300">The package has enough detail to prepare a receipt and move to the order portal.</p>}</div>
          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800"><div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Order handoff</div><ol className="mt-3 space-y-3">{["Request receipt", "Account and sharing", "Associate scope and quote", "Build and delivery"].map((label, index) => <li key={label} className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${index === 0 ? "bg-amber-500 text-slate-950" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>{index + 1}</span><span>{label}</span>{index > 0 ? <LockKeyhole className="ml-auto h-3.5 w-3.5 text-slate-400" /> : null}</li>)}</ol></div>
        </aside>
      </div>
    </div>
  );
}
