import assert from "node:assert/strict";
import {
  executePreferenceSmoke,
  hashPreferenceSmokeNonce,
  type PreferenceDocument,
  type PreferenceSmokeReceipt,
  type PreferenceSmokeRequest,
  type PreferenceSmokeStore,
} from "../convex/preferenceSmokeCore.ts";

const now = 1_800_000_000_000;
const approvalId = "approval-phase177-source-test";
const nonce = "nonce-phase177-00000001";
const actor = { userId: "user-super-admin", platformRole: "super_admin" };
const gate = { enabled: true, approvalId, expiresAt: now + 60_000 };
const request: PreferenceSmokeRequest = {
  approvalId,
  expiresAt: now + 60_000,
  nonce,
  field: "dataDensity",
  value: "spacious",
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

class MemoryPreferenceSmokeStore implements PreferenceSmokeStore {
  preferences = new Map<unknown, PreferenceDocument>();
  receipts = new Map<string, PreferenceSmokeReceipt>();
  nextId = 1;

  constructor(initial?: PreferenceDocument) {
    if (initial) this.preferences.set(initial._id, clone(initial));
  }

  async findReceiptByNonceHash(nonceHash: string) {
    return this.receipts.get(nonceHash) ?? null;
  }

  async findUnscopedPreference(userId: unknown) {
    return clone(Array.from(this.preferences.values()).find((row) => (
      row.userId === userId && row.tenantId === undefined && row.siteId === undefined
    )) ?? null);
  }

  async patchPreference(id: unknown, fields: Record<string, unknown>) {
    const current = this.preferences.get(id);
    assert(current);
    this.preferences.set(id, { ...current, ...clone(fields) } as PreferenceDocument);
  }

  async insertPreference(fields: Record<string, unknown>) {
    const id = `preference-${this.nextId++}`;
    this.preferences.set(id, {
      _id: id,
      _creationTime: now,
      ...clone(fields),
    } as PreferenceDocument);
    return id;
  }

  async getPreference(id: unknown) {
    return clone(this.preferences.get(id) ?? null);
  }

  async replacePreference(id: unknown, fields: Record<string, unknown>) {
    const creationTime = this.preferences.get(id)?._creationTime ?? now;
    this.preferences.set(id, {
      _id: id,
      _creationTime: creationTime,
      ...clone(fields),
    } as PreferenceDocument);
  }

  async deletePreference(id: unknown) {
    this.preferences.delete(id);
  }

  async insertReceipt(receipt: PreferenceSmokeReceipt) {
    this.receipts.set(receipt.nonceHash, clone(receipt));
    return `receipt-${this.receipts.size}`;
  }
}

async function rejectsWith(label: string, run: () => Promise<unknown>, pattern: RegExp) {
  await assert.rejects(run, pattern);
  console.log(`✓ ${label}`);
}

await rejectsWith(
  "disabled server gate rejects",
  () => executePreferenceSmoke(new MemoryPreferenceSmokeStore(), actor, request, { ...gate, enabled: false }, now),
  /window is disabled/,
);

await rejectsWith(
  "unauthorized actor rejects",
  () => executePreferenceSmoke(
    new MemoryPreferenceSmokeStore(),
    { userId: "ordinary-user", platformRole: "user" },
    request,
    gate,
    now,
  ),
  /super admin access required/,
);

await rejectsWith(
  "expired approval rejects",
  () => executePreferenceSmoke(
    new MemoryPreferenceSmokeStore(),
    actor,
    { ...request, expiresAt: now - 1 },
    { ...gate, expiresAt: now - 1 },
    now,
  ),
  /approval has expired/,
);

const replayStore = new MemoryPreferenceSmokeStore();
const replayHash = await hashPreferenceSmokeNonce(nonce);
replayStore.receipts.set(replayHash, {
  functionName: "preferences.runPreferenceSmoke",
  actorUserId: actor.userId,
  approvalId,
  nonceHash: replayHash,
  requestedAt: now - 100,
  expiresAt: now + 60_000,
  completedAt: now - 99,
  sentinelField: "dataDensity",
  cleanupResult: "deleted_new",
  priorRowExisted: false,
  readBackVerified: true,
  redactionVersion: "preference-smoke-v1",
});
await rejectsWith(
  "replayed nonce rejects",
  () => executePreferenceSmoke(replayStore, actor, request, gate, now),
  /nonce has already been used/,
);

await rejectsWith(
  "forbidden field rejects",
  () => executePreferenceSmoke(
    new MemoryPreferenceSmokeStore(),
    actor,
    { ...request, field: "notificationPreferences" },
    gate,
    now,
  ),
  /field is not allowlisted/,
);

const original: PreferenceDocument = {
  _id: "preference-existing",
  _creationTime: now - 10_000,
  userId: actor.userId,
  notificationPreferences: { privateChannel: "retained", alerts: ["lead"] },
  interfacePreferences: { sidebar: "expanded" },
  defaultLandingPage: "/admin/kinflo-os",
  theme: "system",
  itemsPerPage: 50,
  dataDensity: "compact",
  defaultContentFilter: "assigned",
  createdAt: now - 10_000,
  updatedAt: now - 5_000,
};
const restoreStore = new MemoryPreferenceSmokeStore(original);
const restoreResult = await executePreferenceSmoke(restoreStore, actor, request, gate, now);
assert.deepEqual(await restoreStore.getPreference(original._id), original);
assert.equal(restoreResult.cleanupResult, "restored_existing");
console.log("✓ exact existing-row restore preserves all prior fields and timestamps");

const cleanupStore = new MemoryPreferenceSmokeStore();
const cleanupResult = await executePreferenceSmoke(
  cleanupStore,
  actor,
  { ...request, nonce: "nonce-phase177-00000002" },
  gate,
  now,
);
assert.equal(cleanupStore.preferences.size, 0);
assert.equal(cleanupResult.cleanupResult, "deleted_new");
console.log("✓ newly created preference row is deleted");

const serializedReceipt = JSON.stringify(cleanupResult);
assert(!serializedReceipt.includes(request.nonce));
assert(!serializedReceipt.includes(request.value));
assert(!serializedReceipt.includes("notificationPreferences"));
assert.equal(cleanupResult.nonceHash.length, 64);
assert.equal(cleanupStore.receipts.size, 1);
console.log("✓ receipt is persisted and redacts nonce, sentinel value, and raw preference payloads");

console.log("\nKinFlo preference smoke focused tests passed: 8 checks.");
console.log("Hosted mutation executed: no");
console.log("Provider writes: 0");
