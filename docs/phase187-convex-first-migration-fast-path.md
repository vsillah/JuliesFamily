# Phase 187: Convex-first migration fast path

Status: source-only decision packet. Supabase remains read-only and frozen;
Convex activation, codegen, deployment, imports, and data writes are separate
gates.

## Decision

Move KinFlo's tenant-scoped control-plane and CRM source of truth toward Convex
without attempting a row-for-row Supabase import.

The approved live parity check found:

- zero rows in the inspected CRM tables (`leads`, `interactions`,
  `pipeline_stages`, `lead_assignments`, `tasks`, `pipeline_history`, and both
  funnel progression tables);
- no `tenant_id` or `site_id` ownership columns in those CRM tables;
- no Vanguard organization or user matches in the live source; and
- one Julie organization match with no scoped users or CRM records.

Therefore, Supabase cannot currently provide a trustworthy tenant/site-scoped
CRM migration input. Treating it as an empty legacy shell is faster and safer
than inventing ownership mappings or importing unscoped records.

## Target boundary

| Area | Fast-path source of truth | Current state | Boundary |
| --- | --- | --- | --- |
| KinFlo tenant/site control plane | Convex | Existing fixture contract | Read-only activation first |
| KinFlo CRM fixtures | Convex | Deterministic Vanguard and Julie fixtures | Seed/import requires a separate write approval |
| Supabase CRM tables | Legacy evidence only | Empty and ownership-incomplete | No writes, migration, or cutover |
| Julie public/legacy routes | Existing legacy path | Outside this packet | Preserve until separately migrated |
| Portfolio | Existing Supabase path | Out of scope | No changes |

## Ordered work

1. **Readiness and generated API review**
   Confirm the approved Convex development target, run the repository's
   required preflight and codegen only after explicit approval, and review the
   generated query/mutation names against the adapter contract.

2. **Convex read-only smoke**
   Verify Vanguard and Julie tenant/site reads against the exact scoped
   fixtures or approved Convex records. Confirm authorization, source labels,
   read-only metadata, and fixture rollback before changing the app selector.

3. **Convex data ownership decision**
   Decide whether the existing deterministic fixtures become development seed
   data or whether an approved export from another source is required. No
   Supabase row is eligible for import without a new ownership mapping.

4. **Read-only adapter selection**
   Switch only the bounded read-only surfaces after their smoke evidence is
   captured. Keep the fixture provider available and fail closed on scope,
   binding, blank-state, or parity mismatch.

5. **CRM write activation**
   Separately authorize and verify the exact Convex CRM mutations, synthetic
   reversible smoke data, cleanup, and rollback. This is not authorized by this
   packet.

6. **Supabase retirement decision**
   After Convex reads and approved writes are proven, archive or remove the
   KinFlo Supabase dependency in a separately reviewed change. Do not touch
   Portfolio or Julie's legacy path as part of that decision.

## Explicit exclusions

This packet does not authorize:

- Supabase migrations, schema changes, exports, imports, or writes;
- Convex codegen, deployment, hosted smoke, data seeding, imports, or writes;
- adapter runtime configuration changes or application cutover;
- CRM/provider actions, invitations, publishing, uploads, or communications;
- Auth0, Infisical, Vercel, Portfolio, or Julie legacy-route changes.

## Next approval gate

The next actionable gate is Convex development readiness. It must name the
exact Convex project/deployment and authorize only preflight, codegen, generated
API review, and read-only smoke for the Vanguard and Julie scopes. No data
write, import, deployment, Supabase change, or adapter cutover is included.

## Evidence

- `docs/phase186-live-read-parity-result.md`
- `docs/phase184-source-read-adapter-contract.md`
- `docs/phase185-read-parity-harness.md`
- `docs/phase176-read-only-live-adapter-cutover.md`
- `docs/phase182-production-read-only-adapter-cutover.md`
- `docs/convex-adapter-switch-plan.json`
