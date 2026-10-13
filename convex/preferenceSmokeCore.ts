export const PREFERENCE_SMOKE_FUNCTION_NAME = "preferences.runPreferenceSmoke" as const;
export const PREFERENCE_SMOKE_SENTINEL_FIELD = "dataDensity" as const;
export const PREFERENCE_SMOKE_REDACTION_VERSION = "preference-smoke-v1" as const;

export type PreferenceSmokeSentinel = "compact" | "comfortable" | "spacious";

export type PreferenceSmokeRequest = {
  approvalId: string;
  expiresAt: number;
  nonce: string;
  field: string;
  value: PreferenceSmokeSentinel;
};

export type PreferenceSmokeActor = {
  userId: unknown;
  platformRole?: string;
};

export type PreferenceSmokeServerGate = {
  enabled: boolean;
  approvalId?: string;
  expiresAt?: number;
};

export type PreferenceDocument = Record<string, unknown> & {
  _id: unknown;
  _creationTime?: number;
  userId: unknown;
  tenantId?: unknown;
  siteId?: unknown;
  dataDensity?: PreferenceSmokeSentinel;
  createdAt: number;
  updatedAt: number;
};

export type PreferenceSmokeReceipt = {
  functionName: typeof PREFERENCE_SMOKE_FUNCTION_NAME;
  actorUserId: unknown;
  approvalId: string;
  nonceHash: string;
  requestedAt: number;
  expiresAt: number;
  completedAt: number;
  sentinelField: typeof PREFERENCE_SMOKE_SENTINEL_FIELD;
  cleanupResult: "restored_existing" | "deleted_new";
  priorRowExisted: boolean;
  readBackVerified: true;
  redactionVersion: typeof PREFERENCE_SMOKE_REDACTION_VERSION;
};

export type PreferenceSmokeStore = {
  findReceiptByNonceHash(nonceHash: string): Promise<unknown | null>;
  findUnscopedPreference(userId: unknown): Promise<PreferenceDocument | null>;
  patchPreference(id: unknown, fields: Record<string, unknown>): Promise<void>;
  insertPreference(fields: Record<string, unknown>): Promise<unknown>;
  getPreference(id: unknown): Promise<PreferenceDocument | null>;
  replacePreference(id: unknown, fields: Record<string, unknown>): Promise<void>;
  deletePreference(id: unknown): Promise<void>;
  insertReceipt(receipt: PreferenceSmokeReceipt): Promise<unknown>;
};

function assertNonEmptyBoundedString(value: string, label: string, maximum: number) {
  if (!value.trim() || value.length > maximum) {
    throw new Error(`${label} is invalid`);
  }
}

function preferenceFields(document: PreferenceDocument) {
  const { _id: _discardId, _creationTime: _discardCreationTime, ...fields } = document;
  return fields;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

function exactPreferenceMatch(left: PreferenceDocument, right: Record<string, unknown>) {
  return JSON.stringify(canonicalize(preferenceFields(left))) === JSON.stringify(canonicalize(right));
}

export async function hashPreferenceSmokeNonce(nonce: string) {
  const bytes = new TextEncoder().encode(nonce);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function validatePreferenceSmokeRequest(
  actor: PreferenceSmokeActor,
  request: PreferenceSmokeRequest,
  gate: PreferenceSmokeServerGate,
  timestamp: number,
) {
  if (actor.platformRole !== "super_admin") {
    throw new Error("Platform super admin access required");
  }
  if (!gate.enabled) {
    throw new Error("Preference smoke window is disabled");
  }
  assertNonEmptyBoundedString(request.approvalId, "Approval id", 160);
  assertNonEmptyBoundedString(request.nonce, "Request nonce", 256);
  if (request.nonce.length < 16) {
    throw new Error("Request nonce is invalid");
  }
  if (!gate.approvalId || request.approvalId !== gate.approvalId) {
    throw new Error("Preference smoke approval binding does not match");
  }
  if (!Number.isFinite(gate.expiresAt) || !Number.isFinite(request.expiresAt)) {
    throw new Error("Preference smoke expiry is invalid");
  }
  if (timestamp >= (gate.expiresAt as number) || timestamp >= request.expiresAt) {
    throw new Error("Preference smoke approval has expired");
  }
  if (request.expiresAt !== gate.expiresAt) {
    throw new Error("Preference smoke expiry binding does not match");
  }
  if (request.field !== PREFERENCE_SMOKE_SENTINEL_FIELD) {
    throw new Error("Preference smoke field is not allowlisted");
  }
  if (!(["compact", "comfortable", "spacious"] as string[]).includes(request.value)) {
    throw new Error("Preference smoke value is not allowlisted");
  }

  return await hashPreferenceSmokeNonce(request.nonce);
}

export async function executePreferenceSmoke(
  store: PreferenceSmokeStore,
  actor: PreferenceSmokeActor,
  request: PreferenceSmokeRequest,
  gate: PreferenceSmokeServerGate,
  timestamp: number,
) {
  const nonceHash = await validatePreferenceSmokeRequest(actor, request, gate, timestamp);
  if (await store.findReceiptByNonceHash(nonceHash)) {
    throw new Error("Preference smoke nonce has already been used");
  }

  const prior = await store.findUnscopedPreference(actor.userId);
  const priorFields = prior ? preferenceFields(prior) : null;
  const preferenceId = prior
    ? prior._id
    : await store.insertPreference({
        userId: actor.userId,
        dataDensity: request.value,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

  if (prior) {
    await store.patchPreference(preferenceId, {
      dataDensity: request.value,
      updatedAt: timestamp,
    });
  }

  const written = await store.getPreference(preferenceId);
  if (!written || written.dataDensity !== request.value) {
    throw new Error("Preference smoke sentinel read-back failed");
  }

  let cleanupResult: PreferenceSmokeReceipt["cleanupResult"];
  if (prior && priorFields) {
    await store.replacePreference(preferenceId, priorFields);
    const restored = await store.getPreference(preferenceId);
    if (!restored || !exactPreferenceMatch(restored, priorFields)) {
      throw new Error("Preference smoke exact restore failed");
    }
    cleanupResult = "restored_existing";
  } else {
    await store.deletePreference(preferenceId);
    if (await store.getPreference(preferenceId)) {
      throw new Error("Preference smoke new-row cleanup failed");
    }
    cleanupResult = "deleted_new";
  }

  const receipt: PreferenceSmokeReceipt = {
    functionName: PREFERENCE_SMOKE_FUNCTION_NAME,
    actorUserId: actor.userId,
    approvalId: request.approvalId,
    nonceHash,
    requestedAt: timestamp,
    expiresAt: request.expiresAt,
    completedAt: timestamp,
    sentinelField: PREFERENCE_SMOKE_SENTINEL_FIELD,
    cleanupResult,
    priorRowExisted: Boolean(prior),
    readBackVerified: true,
    redactionVersion: PREFERENCE_SMOKE_REDACTION_VERSION,
  };
  const receiptId = await store.insertReceipt(receipt);

  return { receiptId, ...receipt };
}
