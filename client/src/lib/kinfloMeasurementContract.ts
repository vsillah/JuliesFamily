export const KINFLO_MEASUREMENT_CONTRACT_VERSION = "phase5-preview-v1";

export type KinfloMeasurementEventName =
  | "preview_opened"
  | "variant_exposure"
  | "cta_interaction"
  | "section_view";

export type KinfloMeasurementEventSchema = {
  version: typeof KINFLO_MEASUREMENT_CONTRACT_VERSION;
  eventName: KinfloMeasurementEventName;
  requiredFields: readonly ["tenantSlug", "siteSlug", "persona", "journeyStage"];
  optionalFields: readonly ["experimentKey", "variantKey", "route", "device", "elementKey"];
  mode: "read_only_preview";
  emission: "disabled";
  persistence: "disabled";
};

export type KinfloPreviewMeasurementEnvelope = {
  schemaVersion: typeof KINFLO_MEASUREMENT_CONTRACT_VERSION;
  eventName: KinfloMeasurementEventName;
  tenantSlug: string;
  siteSlug: string;
  persona: string;
  journeyStage: string;
  experimentKey?: string;
  variantKey?: string;
  route?: string;
  device?: "desktop" | "tablet" | "mobile";
  elementKey?: string;
  mode: "read_only_preview";
  emitted: false;
  persisted: false;
};

export const kinfloMeasurementEventSchema: KinfloMeasurementEventSchema = {
  version: KINFLO_MEASUREMENT_CONTRACT_VERSION,
  eventName: "preview_opened",
  requiredFields: ["tenantSlug", "siteSlug", "persona", "journeyStage"],
  optionalFields: ["experimentKey", "variantKey", "route", "device", "elementKey"],
  mode: "read_only_preview",
  emission: "disabled",
  persistence: "disabled",
};

export function buildKinfloPreviewMeasurementEnvelope(input: Omit<KinfloPreviewMeasurementEnvelope, "schemaVersion" | "mode" | "emitted" | "persisted">) {
  return {
    ...input,
    schemaVersion: KINFLO_MEASUREMENT_CONTRACT_VERSION,
    mode: "read_only_preview" as const,
    emitted: false as const,
    persisted: false as const,
  };
}
