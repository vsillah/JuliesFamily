import type { KinfloIgesGeometry } from "@/lib/kinfloIges";

export type KinfloSpatialAxis = "x" | "y" | "z";
export type KinfloSpatialVector = Record<KinfloSpatialAxis, number>;

export type KinfloIgesTransform = {
  translationMm: KinfloSpatialVector;
  rotationDeg: KinfloSpatialVector;
  zoomPercent: number;
};

export const KINFLO_IGES_HOME_TRANSFORM: KinfloIgesTransform = Object.freeze({
  translationMm: Object.freeze({ x: 0, y: 0, z: 0 }),
  rotationDeg: Object.freeze({ x: 0, y: 0, z: 0 }),
  zoomPercent: 100,
});

export const KINFLO_IGES_EXPORT_CAPABILITIES = Object.freeze([
  {
    format: "source",
    extension: ".igs/.iges",
    label: "Original validated IGES",
    available: true,
    detail: "Exact browser-selected source bytes; no conversion.",
  },
  {
    format: "stl",
    extension: ".stl",
    label: "Derived inspection mesh",
    available: true,
    detail: "ASCII triangle mesh using browser-normalized millimeter coordinates.",
  },
  {
    format: "obj",
    extension: ".obj",
    label: "Derived inspection mesh",
    available: true,
    detail: "Wavefront triangle mesh using browser-normalized millimeter coordinates.",
  },
  {
    format: "step",
    extension: ".step/.stp",
    label: "STEP solid model",
    available: false,
    detail: "Unavailable: the browser review has triangles, not a verified editable solid/topology export.",
  },
] as const);

export type KinfloDerivedExportFormat = "stl" | "obj";

const clampFinite = (value: number, minimum: number, maximum: number, fallback: number) => (
  Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback
);

export function normalizeKinfloIgesTransform(transform: KinfloIgesTransform): KinfloIgesTransform {
  return {
    translationMm: {
      x: clampFinite(transform.translationMm.x, -1_000_000, 1_000_000, 0),
      y: clampFinite(transform.translationMm.y, -1_000_000, 1_000_000, 0),
      z: clampFinite(transform.translationMm.z, -1_000_000, 1_000_000, 0),
    },
    rotationDeg: {
      x: clampFinite(transform.rotationDeg.x, -360, 360, 0),
      y: clampFinite(transform.rotationDeg.y, -360, 360, 0),
      z: clampFinite(transform.rotationDeg.z, -360, 360, 0),
    },
    zoomPercent: clampFinite(transform.zoomPercent, 25, 400, 100),
  };
}

export function getKinfloPlacedCenter(transform: KinfloIgesTransform): KinfloSpatialVector {
  const normalized = normalizeKinfloIgesTransform(transform);
  return { ...normalized.translationMm };
}

function safeExportName(sourceName: string, extension: string) {
  const base = sourceName.replace(/\.(igs|iges)$/i, "").replace(/[^A-Za-z0-9 _.-]/g, "_").trim() || "vanguard-model";
  return `${base}-inspection-mesh-mm.${extension}`;
}

function triangleNormal(points: number[][]) {
  const [a, b, c] = points;
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const cross = [
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0],
  ];
  const length = Math.hypot(cross[0], cross[1], cross[2]) || 1;
  return cross.map((value) => value / length);
}

const formatCoordinate = (value: number) => Number(value.toFixed(6)).toString();

export function createKinfloDerivedInspectionExport(
  geometry: KinfloIgesGeometry,
  sourceName: string,
  format: KinfloDerivedExportFormat,
) {
  if (format === "obj") {
    const lines = [
      "# Vanguard / ReversR browser-local inspection mesh",
      "# Coordinates normalized to millimeters; OBJ does not encode units.",
    ];
    let vertexOffset = 1;
    geometry.meshes.forEach((mesh, meshIndex) => {
      lines.push(`o inspection_mesh_${meshIndex + 1}`);
      for (let offset = 0; offset < mesh.positions.length; offset += 3) {
        lines.push(`v ${formatCoordinate(mesh.positions[offset])} ${formatCoordinate(mesh.positions[offset + 1])} ${formatCoordinate(mesh.positions[offset + 2])}`);
      }
      for (let offset = 0; offset < mesh.indices.length; offset += 3) {
        lines.push(`f ${mesh.indices[offset] + vertexOffset} ${mesh.indices[offset + 1] + vertexOffset} ${mesh.indices[offset + 2] + vertexOffset}`);
      }
      vertexOffset += mesh.positions.length / 3;
    });
    return {
      fileName: safeExportName(sourceName, "obj"),
      mimeType: "text/plain;charset=utf-8",
      content: `${lines.join("\n")}\n`,
    };
  }

  const lines = ["solid vanguard_reversr_inspection_mesh_mm"];
  geometry.meshes.forEach((mesh) => {
    for (let offset = 0; offset < mesh.indices.length; offset += 3) {
      const points = mesh.indices.slice(offset, offset + 3).map((index) => mesh.positions.slice(index * 3, index * 3 + 3));
      const normal = triangleNormal(points);
      lines.push(`  facet normal ${normal.map(formatCoordinate).join(" ")}`, "    outer loop");
      points.forEach((point) => lines.push(`      vertex ${point.map(formatCoordinate).join(" ")}`));
      lines.push("    endloop", "  endfacet");
    }
  });
  lines.push("endsolid vanguard_reversr_inspection_mesh_mm");
  return {
    fileName: safeExportName(sourceName, "stl"),
    mimeType: "model/stl;charset=utf-8",
    content: `${lines.join("\n")}\n`,
  };
}
