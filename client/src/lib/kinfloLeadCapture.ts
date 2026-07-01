import {
  getKinfloConvexRuntime,
  KINFLO_CONVEX_FUNCTIONS,
  type KinfloConvexRuntimeSnapshot,
} from "./kinfloConvexRuntime";

export const KINFLO_LEAD_CAPTURE_CONVEX_FUNCTION = KINFLO_CONVEX_FUNCTIONS.crmSubmitLead;

export type KinfloLeadCaptureInput = {
  siteId?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  persona?: string;
  journeyStage?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  consent?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type KinfloCrmSubmitLeadPayload = {
  siteId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  persona?: string;
  journeyStage?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  consent?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type KinfloLegacyLeadPayload = {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  persona?: string;
  funnelStage: string;
  leadSource: string;
  notes?: string;
  tags?: string[];
  consent?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type KinfloLeadCaptureContract = {
  convexFunction: typeof KINFLO_LEAD_CAPTURE_CONVEX_FUNCTION;
  convexPayload?: KinfloCrmSubmitLeadPayload;
  legacyPayload: KinfloLegacyLeadPayload;
  runtime: "legacy_api" | "convex_contract_ready";
  runtimeBoundary: KinfloConvexRuntimeSnapshot;
  missingConvexFields: string[];
};

export type KinfloLeadCaptureSubmission = KinfloLeadCaptureContract & {
  lead: unknown;
};

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function definedFields<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as Partial<T>;
}

export function buildKinfloLeadCaptureContract(
  input: KinfloLeadCaptureInput,
): KinfloLeadCaptureContract {
  const runtimeBoundary = getKinfloConvexRuntime();
  const journeyStage = clean(input.journeyStage) ?? "awareness";
  const source = clean(input.source) ?? "website";
  const missingConvexFields = clean(input.siteId) ? [] : ["siteId"];

  const sharedFields = definedFields({
    email: clean(input.email) ?? "",
    firstName: clean(input.firstName),
    lastName: clean(input.lastName),
    phone: clean(input.phone),
    persona: clean(input.persona),
    journeyStage,
    source,
    notes: clean(input.notes),
    tags: input.tags?.filter(Boolean),
    consent: input.consent,
    metadata: input.metadata,
  });

  return {
    convexFunction: KINFLO_LEAD_CAPTURE_CONVEX_FUNCTION,
    convexPayload: clean(input.siteId)
      ? {
          siteId: clean(input.siteId)!,
          ...(sharedFields as Omit<KinfloCrmSubmitLeadPayload, "siteId">),
        }
      : undefined,
    legacyPayload: {
      firstName: clean(input.firstName),
      lastName: clean(input.lastName),
      email: clean(input.email) ?? "",
      phone: clean(input.phone),
      persona: clean(input.persona),
      funnelStage: journeyStage,
      leadSource: source,
      notes: clean(input.notes),
      tags: input.tags?.filter(Boolean),
      consent: input.consent,
      metadata: input.metadata,
    },
    runtime: missingConvexFields.length === 0 ? "convex_contract_ready" : "legacy_api",
    runtimeBoundary,
    missingConvexFields,
  };
}

export async function submitKinfloLeadCapture(
  input: KinfloLeadCaptureInput,
  options: { legacyEndpoint?: string } = {},
): Promise<KinfloLeadCaptureSubmission> {
  const contract = buildKinfloLeadCaptureContract(input);
  const response = await fetch(options.legacyEndpoint ?? "/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(contract.legacyPayload),
  });

  if (!response.ok) {
    throw new Error("Failed to submit lead");
  }

  return {
    ...contract,
    lead: await response.json(),
  };
}
