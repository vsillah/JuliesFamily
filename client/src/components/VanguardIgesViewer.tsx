import { useEffect, useRef, useState } from "react";
import { Expand, Rotate3D, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KinfloIgesGeometry } from "@/lib/kinfloIges";

type ViewerActions = {
  fit?: () => void;
  reset?: () => void;
};

export default function VanguardIgesViewer({ geometry }: { geometry: KinfloIgesGeometry }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<ViewerActions>({});
  const [viewerState, setViewerState] = useState<"loading" | "ready" | "unavailable">("loading");

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
        renderer.domElement.setAttribute("aria-label", "Interactive 3D engineering-review model");
        renderer.domElement.tabIndex = 0;
        renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none;cursor:grab";
        mountedHost.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, width / height, 0.01, 10_000);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.screenSpacePanning = true;
        const publishCamera = () => {
          renderer.domElement.dataset.cameraPosition = camera.position.toArray().map((value) => value.toFixed(4)).join(",");
        };
        controls.addEventListener("change", publishCamera);

        const group = new THREE.Group();
        const material = new THREE.MeshStandardMaterial({
          color: 0x9aa9b6,
          metalness: 0.48,
          roughness: 0.42,
          side: THREE.DoubleSide,
        });
        const geometries: InstanceType<typeof THREE.BufferGeometry>[] = [];
        const meshes: InstanceType<typeof THREE.Mesh>[] = [];
        for (const mesh of geometry.meshes) {
          const modelGeometry = new THREE.BufferGeometry();
          modelGeometry.setAttribute("position", new THREE.Float32BufferAttribute(mesh.positions, 3));
          modelGeometry.setIndex(mesh.indices);
          modelGeometry.computeVertexNormals();
          modelGeometry.computeBoundingBox();
          geometries.push(modelGeometry);
          const modelMesh = new THREE.Mesh(modelGeometry, material);
          meshes.push(modelMesh);
          group.add(modelMesh);
        }
        scene.add(group);

        const bounds = new THREE.Box3().setFromObject(group);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const largest = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(largest) || largest <= 0) throw new Error("invalid model bounds");
        group.position.sub(center);

        scene.add(new THREE.HemisphereLight(0xffffff, 0x607080, 2.2));
        const key = new THREE.DirectionalLight(0xffffff, 3.2);
        key.position.set(3, 5, 4);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0x9fc8ff, 1.4);
        fill.position.set(-4, 1, -2);
        scene.add(fill);

        const gridSize = Math.max(largest * 2.8, 10);
        const grid = new THREE.GridHelper(gridSize, 18, 0x8394a3, 0xc5d0da);
        grid.position.y = -size.y / 2 - largest * 0.08;
        scene.add(grid);

        const fitModel = () => {
          const viewportHeight = Math.max(mountedHost.clientHeight, 320);
          const viewportWidth = Math.max(mountedHost.clientWidth, 320);
          camera.aspect = viewportWidth / viewportHeight;
          const verticalFov = THREE.MathUtils.degToRad(camera.fov);
          const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
          const distance = (largest / (2 * Math.tan(Math.min(verticalFov, horizontalFov) / 2))) * 1.45;
          camera.position.set(distance * 0.82, distance * 0.58, distance * 0.82);
          camera.near = Math.max(distance / 1000, 0.01);
          camera.far = distance * 100;
          camera.updateProjectionMatrix();
          controls.target.set(0, 0, 0);
          controls.update();
          publishCamera();
        };

        const resetView = () => {
          group.rotation.set(-Math.PI / 2, 0, 0);
          group.position.copy(center).multiplyScalar(-1);
          grid.rotation.set(0, 0, 0);
          fitModel();
        };

        group.rotation.x = -Math.PI / 2;
        fitModel();
        actionsRef.current = { fit: fitModel, reset: resetView };

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
          controls.dispose();
          controls.removeEventListener("change", publishCamera);
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

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-100" data-testid="vanguard-iges-viewer" data-viewer-state={viewerState}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <div>
          <div className="text-xs font-semibold text-slate-900">3D engineering review</div>
          <div className="text-[11px] text-slate-500">Drag to orbit · scroll or pinch to zoom</div>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="3D model controls">
          <Button type="button" size="sm" variant="outline" onClick={() => hostRef.current?.querySelector("canvas")?.focus()} className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-950" data-testid="vanguard-iges-orbit">
            <Rotate3D className="mr-1.5 h-4 w-4" /> Orbit
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => actionsRef.current.fit?.()} className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-950" data-testid="vanguard-iges-fit">
            <Expand className="mr-1.5 h-4 w-4" /> Fit
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => actionsRef.current.reset?.()} className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-950" data-testid="vanguard-iges-reset">
            <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
          </Button>
        </div>
      </div>
      <div className="relative h-[340px] w-full sm:h-[420px]">
        <div ref={hostRef} className="absolute inset-0" data-testid="vanguard-iges-canvas-host" />
        {viewerState === "loading" ? <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-600">Preparing the 3D canvas…</div> : null}
        {viewerState === "unavailable" ? <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-sm text-red-700">This browser could not start the WebGL review canvas.</div> : null}
      </div>
    </div>
  );
}
