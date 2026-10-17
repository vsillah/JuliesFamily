import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileUp, LoaderCircle, LockKeyhole, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VanguardIgesViewer from "@/components/VanguardIgesViewer";
import { prepareKinfloIgesReview } from "@/lib/kinfloIgesBrowser";
import {
  KINFLO_IGES_LIMITS,
  asKinfloIgesError,
  type KinfloEngineeringReview,
  type KinfloIgesGeometry,
} from "@/lib/kinfloIges";
import {
  KINFLO_IGES_EXPORT_CAPABILITIES,
  createKinfloDerivedInspectionExport,
  type KinfloDerivedExportFormat,
} from "@/lib/kinfloIgesWorkspace";

type CadState = "empty" | "loading" | "malformed" | "unsupported" | "too-large" | "no-geometry" | "error" | "ready";

const errorStateByCode = {
  NO_SOURCE: "empty",
  MALFORMED: "malformed",
  UNSUPPORTED: "unsupported",
  TOO_LARGE: "too-large",
  NO_GEOMETRY: "no-geometry",
  INVALID_GEOMETRY: "malformed",
  OUTPUT_LIMIT: "too-large",
  CONVERSION_FAILED: "malformed",
  RUNTIME_UNAVAILABLE: "error",
  TIMEOUT: "error",
} as const;

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  return `${(value / 1024).toFixed(1)} KiB`;
}

function formatDimensions(value: [number, number, number]) {
  return value.map((item) => `${item.toFixed(2)} mm`).join(" × ");
}

export default function VanguardIgesIntake({ onReviewChange }: { onReviewChange: (review: KinfloEngineeringReview | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionIdRef = useRef(0);
  const [state, setState] = useState<CadState>("empty");
  const [message, setMessage] = useState("Choose a real .igs or .iges file to inspect on this device.");
  const [geometry, setGeometry] = useState<KinfloIgesGeometry | null>(null);
  const [review, setReview] = useState<KinfloEngineeringReview | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);

  function openFilePicker() {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    inputRef.current.click();
  }

  function clearSelection() {
    selectionIdRef.current += 1;
    if (inputRef.current) inputRef.current.value = "";
    setGeometry(null);
    setReview(null);
    setSourceFile(null);
    onReviewChange(null);
    setState("empty");
    setMessage("Choose a real .igs or .iges file to inspect on this device.");
  }

  async function inspectFile(file: File | undefined) {
    const selectionId = ++selectionIdRef.current;
    setGeometry(null);
    setReview(null);
    setSourceFile(null);
    onReviewChange(null);
    if (!file) {
      setState("empty");
      setMessage("No file was selected. Choose a nonempty .igs or .iges file.");
      return;
    }

    setState("loading");
    setMessage("Validating the IGES records and building local triangle geometry…");
    try {
      const prepared = await prepareKinfloIgesReview(file);
      if (selectionId !== selectionIdRef.current) return;
      setGeometry(prepared.geometry);
      setReview(prepared.review);
      setSourceFile(file);
      onReviewChange(prepared.review);
      setState("ready");
      setMessage("The file passed bounded admission and is ready for engineering review.");
    } catch (error) {
      if (selectionId !== selectionIdRef.current) return;
      const safeError = asKinfloIgesError(error);
      setState(errorStateByCode[safeError.code]);
      setMessage(safeError.message);
    }
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  function downloadOriginalSource() {
    if (!sourceFile || !review) return;
    downloadBlob(sourceFile, review.fileName);
  }

  function downloadDerived(format: KinfloDerivedExportFormat) {
    if (!geometry || !review) return;
    const derived = createKinfloDerivedInspectionExport(geometry, review.fileName, format);
    downloadBlob(new Blob([derived.content], { type: derived.mimeType }), derived.fileName);
  }

  return (
    <section className="mt-6 min-w-0 space-y-4" data-testid="vanguard-iges-intake" data-cad-state={state}>
      <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-600 text-white hover:bg-blue-600">Browser-local IGES</Badge>
              <Badge variant="outline">Engineering review only</Badge>
            </div>
            <h5 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">Inspect a real model before the request handoff</h5>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-300">
              The browser reads and renders the selected file locally. The source file and triangle geometry are never uploaded, saved to Vanguard, or attached to the receipt.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button type="button" onClick={openFilePicker} disabled={state === "loading"} className="bg-slate-950 text-white hover:bg-slate-800">
              <FileUp className="mr-2 h-4 w-4" /> {review ? "Choose another" : "Choose IGES file"}
            </Button>
            {review ? <Button type="button" variant="outline" onClick={clearSelection}><X className="mr-2 h-4 w-4" /> Clear</Button> : null}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".igs,.iges"
          aria-label="Choose an IGES file for browser-local engineering review"
          className="sr-only"
          data-testid="vanguard-iges-file-input"
          onChange={(event) => void inspectFile(event.currentTarget.files?.[0])}
        />
        <div className="mt-4 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
          <span>.igs or .iges only</span>
          <span>Maximum {Math.round(KINFLO_IGES_LIMITS.sourceBytes / 1024)} KiB</span>
          <span>Strict 80-column records</span>
          <span>No external references</span>
        </div>
      </div>

      {state !== "ready" ? (
        <div className={`rounded-xl border p-5 ${state === "loading" || state === "empty" ? "border-blue-200 bg-blue-50 text-blue-950" : "border-red-200 bg-red-50 text-red-950"}`} role={state === "loading" ? "status" : state === "empty" ? undefined : "alert"}>
          <div className="flex items-start gap-3">
            {state === "loading" ? <LoaderCircle className="mt-0.5 h-5 w-5 shrink-0 animate-spin" /> : state === "empty" ? <FileUp className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
            <div>
              <div className="font-semibold capitalize">{state === "too-large" ? "File exceeds a bounded limit" : state === "no-geometry" ? "No triangle geometry" : state}</div>
              <p className="mt-1 text-sm leading-6">{message}</p>
              {state !== "loading" && state !== "empty" ? <Button type="button" variant="outline" size="sm" onClick={openFilePicker} className="mt-3 bg-white">Choose a different file</Button> : null}
            </div>
          </div>
        </div>
      ) : null}

      {state === "ready" && geometry && review ? (
        <div className="min-w-0 space-y-4" data-testid="vanguard-iges-ready">
          <VanguardIgesViewer geometry={geometry} />
          <section className="min-w-0 rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900" aria-labelledby="vanguard-iges-downloads-heading" data-testid="vanguard-iges-export-panel">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h6 id="vanguard-iges-downloads-heading" className="font-semibold text-slate-950 dark:text-white">Download and export capabilities</h6>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-300">The original validated file stays exact. STL and OBJ are real exports of the browser-generated triangle inspection mesh; they are not editable CAD solids or manufacturing-certified conversions.</p>
              </div>
              <Badge variant="outline" className="w-fit">Browser-local only</Badge>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {KINFLO_IGES_EXPORT_CAPABILITIES.map((capability) => {
                const testId = `vanguard-iges-export-${capability.format}`;
                const handleDownload = capability.format === "source"
                  ? downloadOriginalSource
                  : capability.format === "stl" || capability.format === "obj"
                    ? () => downloadDerived(capability.format)
                    : undefined;
                return (
                  <div key={capability.format} className={`rounded-lg border p-3 ${capability.available ? "border-blue-200 bg-white" : "border-slate-300 bg-slate-100"}`} data-testid={`${testId}-row`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-slate-950">{capability.label}</span><code className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-700">{capability.extension}</code></div>
                        <p className="mt-1 text-[11px] leading-4 text-slate-700">{capability.detail}</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-600" disabled={!capability.available || !handleDownload} onClick={handleDownload} aria-label={capability.available ? `Download ${capability.label} ${capability.extension}` : `${capability.label} export unavailable`} data-testid={testId}>
                        <Download className="mr-1.5 h-4 w-4" /> {capability.available ? "Download" : "Unavailable"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-950 dark:text-emerald-100"><CheckCircle2 className="h-5 w-5" /> Local geometry ready</div>
              <Badge variant="outline" className="border-emerald-300 bg-white text-emerald-900">{review.receiptId}</Badge>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Filename", review.fileName],
                ["Source size", formatBytes(review.sourceBytes)],
                ["Meshes", String(review.meshCount)],
                ["Vertices", review.vertexCount.toLocaleString()],
                ["Triangles", review.triangleCount.toLocaleString()],
                ["Normalized extents", formatDimensions(review.boundingBoxMm)],
              ].map(([label, value]) => <div key={label} className="min-w-0 rounded-lg border border-emerald-200 bg-white/80 px-3 py-2"><dt className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">{label}</dt><dd className="mt-1 break-words text-xs text-slate-900">{value}</dd></div>)}
            </dl>
            <div className="mt-3 rounded-lg border border-emerald-200 bg-white/80 px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">Sanitized SHA-256 digest</div>
              <div className="mt-1 break-all font-mono text-[10px] text-slate-700" data-testid="vanguard-iges-digest">{review.digestSha256}</div>
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-emerald-950 dark:text-emerald-100"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /> This summary supports engineering review. It is not a quote, dimensional inspection, certification, or manufacturing guarantee.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
