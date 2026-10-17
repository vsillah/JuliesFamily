import { useEffect, useRef, useState } from "react";
import { Expand, Home, Move3D, Rotate3D, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KinfloIgesGeometry } from "@/lib/kinfloIges";
import {
  KINFLO_IGES_HOME_TRANSFORM,
  getKinfloPlacedCenter,
  normalizeKinfloIgesTransform,
  type KinfloIgesTransform,
  type KinfloSpatialAxis,
} from "@/lib/kinfloIgesWorkspace";

type ViewerMode = "orbit" | "move";

type ViewerActions = {
  fit?: () => void;
  home?: () => void;
  setMode?: (mode: ViewerMode) => void;
  applyTransform?: (transform: KinfloIgesTransform) => void;
};

const axes: KinfloSpatialAxis[] = ["x", "y", "z"];
const axisLabel: Record<KinfloSpatialAxis, string> = { x: "X", y: "Y", z: "Z" };
const outlineButtonClass = "border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400";

function formatSpatial(value: number) {
  return Number(value.toFixed(3)).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function NumericField({ label, value, unit, onChange, testId }: {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
  testId: string;
}) {
  return (
    <label className="relative block min-w-0" style={{ minWidth: 0, width: "100%" }}>
      <span className="sr-only">{label}</span>
      <input
        type="number"
        value={Number(value.toFixed(3))}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 pr-8 text-right font-mono text-xs text-slate-950 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        aria-label={`${label} in ${unit}`}
        data-testid={testId}
        style={{ minWidth: 0, width: "100%" }}
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500" aria-hidden="true">{unit}</span>
    </label>
  );
}

export default function VanguardIgesViewer({ geometry }: { geometry: KinfloIgesGeometry }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<ViewerActions>({});
  const [viewerState, setViewerState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [mode, setMode] = useState<ViewerMode>("orbit");
  const [translationStep, setTranslationStep] = useState(1);
  const [rotationStep, setRotationStep] = useState(5);
  const [transform, setTransform] = useState<KinfloIgesTransform>({
    translationMm: { ...KINFLO_IGES_HOME_TRANSFORM.translationMm },
    rotationDeg: { ...KINFLO_IGES_HOME_TRANSFORM.rotationDeg },
    zoomPercent: KINFLO_IGES_HOME_TRANSFORM.zoomPercent,
  });

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => undefined;

    async function mountViewer() {
      try {
        const [THREE, { OrbitControls }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/controls/OrbitControls.js"),
        ]);
        const host = hostRef.current;
        if (cancelled || !host) return;
        const mountedHost = host;

        mountedHost.innerHTML = "";
        const width = Math.max(mountedHost.clientWidth, 320);
        const height = Math.max(mountedHost.clientHeight, 320);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        renderer.setClearColor(0xe8eef4, 1);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.setAttribute("data-testid", "vanguard-iges-canvas");
        renderer.domElement.setAttribute("aria-label", "Interactive 3D engineering-review model. Drag to orbit, Shift-drag or right-drag to pan, and scroll to zoom.");
        renderer.domElement.tabIndex = 0;
        renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none;cursor:grab";
        mountedHost.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, width / height, 0.01, 10_000_000);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.screenSpacePanning = true;
        controls.minDistance = 0.001;
        controls.maxDistance = 10_000_000;

        const transformGroup = new THREE.Group();
        const modelGroup = new THREE.Group();
        transformGroup.add(modelGroup);
        scene.add(transformGroup);
        const material = new THREE.MeshStandardMaterial({ color: 0x9aa9b6, metalness: 0.48, roughness: 0.42, side: THREE.DoubleSide });
        const geometries: InstanceType<typeof THREE.BufferGeometry>[] = [];
        for (const mesh of geometry.meshes) {
          const modelGeometry = new THREE.BufferGeometry();
          modelGeometry.setAttribute("position", new THREE.Float32BufferAttribute(mesh.positions, 3));
          modelGeometry.setIndex(mesh.indices);
          modelGeometry.computeVertexNormals();
          modelGeometry.computeBoundingBox();
          geometries.push(modelGeometry);
          modelGroup.add(new THREE.Mesh(modelGeometry, material));
        }

        modelGroup.rotation.x = -Math.PI / 2;
        const initialBounds = new THREE.Box3().setFromObject(modelGroup);
        modelGroup.position.sub(initialBounds.getCenter(new THREE.Vector3()));
        const displaySize = new THREE.Box3().setFromObject(modelGroup).getSize(new THREE.Vector3());
        const largest = Math.max(displaySize.x, displaySize.y, displaySize.z);
        if (!Number.isFinite(largest) || largest <= 0) throw new Error("invalid model bounds");

        scene.add(new THREE.HemisphereLight(0xffffff, 0x607080, 2.2));
        const key = new THREE.DirectionalLight(0xffffff, 3.2);
        key.position.set(3, 5, 4);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0x9fc8ff, 1.4);
        fill.position.set(-4, 1, -2);
        scene.add(fill);

        const grid = new THREE.GridHelper(Math.max(largest * 2.8, 10), 18, 0x8394a3, 0xc5d0da);
        grid.position.y = -displaySize.y / 2 - Math.max(largest * 0.22, 0.5);
        scene.add(grid);
        scene.add(new THREE.AxesHelper(Math.max(largest * 0.72, 2)));

        let homeDistance = 1;
        const publishCamera = () => {
          const distance = Math.max(camera.position.distanceTo(controls.target), 0.000001);
          const zoomPercent = Math.min(400, Math.max(25, (homeDistance / distance) * 100));
          renderer.domElement.dataset.cameraPosition = camera.position.toArray().map((value) => value.toFixed(4)).join(",");
          renderer.domElement.dataset.cameraTarget = controls.target.toArray().map((value) => value.toFixed(4)).join(",");
          renderer.domElement.dataset.zoomPercent = zoomPercent.toFixed(1);
          setTransform((current) => ({ ...current, zoomPercent: Number(zoomPercent.toFixed(1)) }));
        };
        controls.addEventListener("change", publishCamera);

        const fitModel = () => {
          const viewportHeight = Math.max(mountedHost.clientHeight, 320);
          const viewportWidth = Math.max(mountedHost.clientWidth, 320);
          camera.aspect = viewportWidth / viewportHeight;
          const verticalFov = THREE.MathUtils.degToRad(camera.fov);
          const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
          const distance = (largest / (2 * Math.tan(Math.min(verticalFov, horizontalFov) / 2))) * 1.45;
          homeDistance = distance;
          camera.position.set(distance * 0.82, distance * 0.58, distance * 0.82);
          camera.near = Math.max(distance / 1000, 0.01);
          camera.far = distance * 1000;
          camera.updateProjectionMatrix();
          controls.target.set(0, 0, 0);
          controls.update();
          publishCamera();
        };

        const setViewerMode = (nextMode: ViewerMode) => {
          controls.mouseButtons.LEFT = nextMode === "orbit" ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
          renderer.domElement.style.cursor = nextMode === "orbit" ? "grab" : "move";
          renderer.domElement.dataset.interactionMode = nextMode;
          setMode(nextMode);
        };

        const applyTransform = (nextTransform: KinfloIgesTransform) => {
          const normalized = normalizeKinfloIgesTransform(nextTransform);
          transformGroup.position.set(normalized.translationMm.x, normalized.translationMm.y, normalized.translationMm.z);
          transformGroup.rotation.set(
            THREE.MathUtils.degToRad(normalized.rotationDeg.x),
            THREE.MathUtils.degToRad(normalized.rotationDeg.y),
            THREE.MathUtils.degToRad(normalized.rotationDeg.z),
          );
          const direction = camera.position.clone().sub(controls.target).normalize();
          camera.position.copy(controls.target).add(direction.multiplyScalar(homeDistance / (normalized.zoomPercent / 100)));
          controls.update();
          renderer.domElement.dataset.modelTranslationMm = Object.values(normalized.translationMm).map((value) => value.toFixed(3)).join(",");
          renderer.domElement.dataset.modelRotationDeg = Object.values(normalized.rotationDeg).map((value) => value.toFixed(3)).join(",");
          setTransform(normalized);
        };

        const homeView = () => {
          fitModel();
          applyTransform({
            translationMm: { ...KINFLO_IGES_HOME_TRANSFORM.translationMm },
            rotationDeg: { ...KINFLO_IGES_HOME_TRANSFORM.rotationDeg },
            zoomPercent: KINFLO_IGES_HOME_TRANSFORM.zoomPercent,
          });
        };

        fitModel();
        setViewerMode("orbit");
        applyTransform({
          translationMm: { ...KINFLO_IGES_HOME_TRANSFORM.translationMm },
          rotationDeg: { ...KINFLO_IGES_HOME_TRANSFORM.rotationDeg },
          zoomPercent: KINFLO_IGES_HOME_TRANSFORM.zoomPercent,
        });
        actionsRef.current = { fit: fitModel, home: homeView, setMode: setViewerMode, applyTransform };

        let animationFrame = 0;
        const render = () => {
          controls.update();
          renderer.render(scene, camera);
          animationFrame = window.requestAnimationFrame(render);
        };
        render();

        const resizeObserver = new ResizeObserver(() => {
          const nextWidth = Math.max(mountedHost.clientWidth, 320);
          const nextHeight = Math.max(mountedHost.clientHeight, 320);
          renderer.setSize(nextWidth, nextHeight);
          camera.aspect = nextWidth / nextHeight;
          camera.updateProjectionMatrix();
        });
        resizeObserver.observe(mountedHost);
        setViewerState("ready");

        cleanup = () => {
          window.cancelAnimationFrame(animationFrame);
          resizeObserver.disconnect();
          controls.removeEventListener("change", publishCamera);
          controls.dispose();
          geometries.forEach((item) => item.dispose());
          material.dispose();
          renderer.dispose();
          mountedHost.replaceChildren();
          actionsRef.current = {};
        };
      } catch {
        if (!cancelled) setViewerState("unavailable");
      }
    }

    void mountViewer();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [geometry]);

  const applyTransform = (nextTransform: KinfloIgesTransform) => {
    actionsRef.current.applyTransform?.(normalizeKinfloIgesTransform(nextTransform));
  };

  const changeAxis = (kind: "translationMm" | "rotationDeg", axis: KinfloSpatialAxis, value: number) => {
    applyTransform({ ...transform, [kind]: { ...transform[kind], [axis]: value } });
  };

  const nudgeAxis = (kind: "translationMm" | "rotationDeg", axis: KinfloSpatialAxis, delta: number) => {
    changeAxis(kind, axis, transform[kind][axis] + delta);
  };

  const placedCenter = getKinfloPlacedCenter(transform);

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-100" data-testid="vanguard-iges-viewer" data-viewer-state={viewerState}>
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-900">3D engineering review</div>
          <div className="text-[11px] leading-4 text-slate-500">Left-drag uses the selected mode · Shift/right-drag pans · scroll or pinch zooms</div>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="3D model controls">
          <Button type="button" size="sm" variant="outline" className={mode === "orbit" ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 hover:text-white" : outlineButtonClass} aria-pressed={mode === "orbit"} aria-label="Use orbit and rotation mouse controls" onClick={() => { actionsRef.current.setMode?.("orbit"); hostRef.current?.querySelector("canvas")?.focus(); }} data-testid="vanguard-iges-orbit">
            <Rotate3D className="mr-1.5 h-4 w-4" /> Orbit / rotate
          </Button>
          <Button type="button" size="sm" variant="outline" className={mode === "move" ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 hover:text-white" : outlineButtonClass} aria-pressed={mode === "move"} aria-label="Use move and pan mouse controls" onClick={() => { actionsRef.current.setMode?.("move"); hostRef.current?.querySelector("canvas")?.focus(); }} data-testid="vanguard-iges-move">
            <Move3D className="mr-1.5 h-4 w-4" /> Move / pan
          </Button>
          <Button type="button" size="sm" variant="outline" className={outlineButtonClass} onClick={() => actionsRef.current.fit?.()} data-testid="vanguard-iges-fit"><Expand className="mr-1.5 h-4 w-4" /> Fit</Button>
          <Button type="button" size="sm" variant="outline" className={outlineButtonClass} onClick={() => actionsRef.current.home?.()} data-testid="vanguard-iges-reset"><Home className="mr-1.5 h-4 w-4" /> Home</Button>
        </div>
      </div>

      <div className="relative h-[340px] w-full sm:h-[420px]">
        <div ref={hostRef} className="absolute inset-0" data-testid="vanguard-iges-canvas-host" />
        {viewerState === "loading" ? <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-600">Preparing the 3D canvas…</div> : null}
        {viewerState === "unavailable" ? <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-sm text-red-700">This browser could not start the WebGL review canvas.</div> : null}
      </div>

      <div className="grid min-w-0 gap-3 border-t border-slate-200 bg-slate-50 p-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-3" aria-labelledby="vanguard-spatial-heading" data-testid="vanguard-iges-spatial-readout">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h6 id="vanguard-spatial-heading" className="text-xs font-semibold text-slate-950">Spatial coordinates</h6>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">Geometry coordinates are normalized to millimetres for browser review. The original file’s declared unit is unavailable.</p>
            </div>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-900">Source unit: unknown</span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[410px] border-collapse text-right text-[11px]">
              <caption className="sr-only">Model bounding box extents, minimum, maximum, and source center by spatial axis</caption>
              <thead><tr className="text-slate-500"><th className="px-2 py-1 text-left">Axis</th><th className="px-2 py-1">Extent</th><th className="px-2 py-1">Min</th><th className="px-2 py-1">Max</th><th className="px-2 py-1">Source center</th></tr></thead>
              <tbody>{axes.map((axis, index) => <tr key={axis} className="border-t border-slate-100 font-mono text-slate-900"><th className="px-2 py-2 text-left font-semibold">{axisLabel[axis]}</th><td className="px-2 py-2">{formatSpatial(geometry.boundingBoxMm[index])} mm</td><td className="px-2 py-2">{formatSpatial(geometry.boundsMm.min[index])}</td><td className="px-2 py-2">{formatSpatial(geometry.boundsMm.max[index])}</td><td className="px-2 py-2">{formatSpatial(geometry.boundsMm.center[index])}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2" aria-label="Current placed model center">
            {axes.map((axis) => <div key={axis} className="rounded-md bg-slate-100 px-2 py-2"><div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Placed center {axisLabel[axis]}</div><div className="mt-1 font-mono text-xs text-slate-950" data-testid={`vanguard-iges-placed-center-${axis}`}>{formatSpatial(placedCenter[axis])} mm</div></div>)}
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-3" aria-labelledby="vanguard-precision-heading" data-testid="vanguard-iges-precision-controls">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><h6 id="vanguard-precision-heading" className="text-xs font-semibold text-slate-950">Precision placement</h6><p className="mt-1 text-[11px] leading-4 text-slate-500">Nudge or enter exact review transforms. These controls change the local view only.</p></div>
            <Button type="button" size="sm" variant="outline" className={outlineButtonClass} onClick={() => actionsRef.current.home?.()} aria-label="Reset all translation, rotation, zoom, orbit, and pan values to home">Reset all</Button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Move step<input type="number" min="0.001" max="100000" step="0.1" value={translationStep} onChange={(event) => setTranslationStep(Math.max(0.001, Number(event.currentTarget.value) || 1))} className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-right font-mono text-xs" aria-label="Translation nudge step in millimetres" data-testid="vanguard-iges-translation-step" /></label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Rotate step<input type="number" min="0.1" max="180" step="0.5" value={rotationStep} onChange={(event) => setRotationStep(Math.max(0.1, Number(event.currentTarget.value) || 5))} className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-right font-mono text-xs" aria-label="Rotation nudge step in degrees" data-testid="vanguard-iges-rotation-step" /></label>
          </div>

          <div className="mt-3 space-y-2" aria-label="Translation controls">
            {axes.map((axis) => <div key={`translation-${axis}`} className="grid min-w-0 items-center gap-1" style={{ gridTemplateColumns: "16px 32px minmax(0, 1fr) 32px" }}><span className="text-xs font-bold text-slate-700">{axisLabel[axis]}</span><Button type="button" size="icon" variant="outline" className={`h-8 w-8 ${outlineButtonClass}`} onClick={() => nudgeAxis("translationMm", axis, -translationStep)} aria-label={`Move model ${axisLabel[axis]} negative by ${translationStep} millimetres`} data-testid={`vanguard-iges-translate-${axis}-minus`}>−</Button><NumericField label={`${axisLabel[axis]} translation`} value={transform.translationMm[axis]} unit="mm" onChange={(value) => changeAxis("translationMm", axis, value)} testId={`vanguard-iges-translation-${axis}`} /><Button type="button" size="icon" variant="outline" className={`h-8 w-8 ${outlineButtonClass}`} onClick={() => nudgeAxis("translationMm", axis, translationStep)} aria-label={`Move model ${axisLabel[axis]} positive by ${translationStep} millimetres`} data-testid={`vanguard-iges-translate-${axis}-plus`}>+</Button></div>)}
          </div>

          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3" aria-label="Rotation controls">
            {axes.map((axis) => <div key={`rotation-${axis}`} className="grid min-w-0 items-center gap-1" style={{ gridTemplateColumns: "16px 32px minmax(0, 1fr) 32px" }}><span className="text-xs font-bold text-slate-700">{axisLabel[axis]}</span><Button type="button" size="icon" variant="outline" className={`h-8 w-8 ${outlineButtonClass}`} onClick={() => nudgeAxis("rotationDeg", axis, -rotationStep)} aria-label={`Rotate model around ${axisLabel[axis]} negative by ${rotationStep} degrees`} data-testid={`vanguard-iges-rotate-${axis}-minus`}>−</Button><NumericField label={`${axisLabel[axis]} rotation`} value={transform.rotationDeg[axis]} unit="°" onChange={(value) => changeAxis("rotationDeg", axis, value)} testId={`vanguard-iges-rotation-${axis}`} /><Button type="button" size="icon" variant="outline" className={`h-8 w-8 ${outlineButtonClass}`} onClick={() => nudgeAxis("rotationDeg", axis, rotationStep)} aria-label={`Rotate model around ${axisLabel[axis]} positive by ${rotationStep} degrees`} data-testid={`vanguard-iges-rotate-${axis}-plus`}>+</Button></div>)}
          </div>

          <div className="mt-3 grid grid-cols-[36px_minmax(0,1fr)_36px] items-center gap-2 border-t border-slate-100 pt-3" aria-label="Zoom controls">
            <Button type="button" size="icon" variant="outline" className={`h-9 w-9 ${outlineButtonClass}`} disabled={transform.zoomPercent <= 25} onClick={() => applyTransform({ ...transform, zoomPercent: transform.zoomPercent - 10 })} aria-label="Zoom model out by ten percent" data-testid="vanguard-iges-zoom-out"><ZoomOut className="h-4 w-4" /></Button>
            <NumericField label="Model zoom" value={transform.zoomPercent} unit="%" onChange={(value) => applyTransform({ ...transform, zoomPercent: value })} testId="vanguard-iges-zoom-percent" />
            <Button type="button" size="icon" variant="outline" className={`h-9 w-9 ${outlineButtonClass}`} disabled={transform.zoomPercent >= 400} onClick={() => applyTransform({ ...transform, zoomPercent: transform.zoomPercent + 10 })} aria-label="Zoom model in by ten percent" data-testid="vanguard-iges-zoom-in"><ZoomIn className="h-4 w-4" /></Button>
          </div>
        </section>
      </div>
    </div>
  );
}
