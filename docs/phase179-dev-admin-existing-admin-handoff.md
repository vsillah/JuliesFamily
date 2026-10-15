# Phase 179: existing-admin dev activation handoff

## Decision

Use an existing KinFlo development platform administrator to execute the already-approved Vanguard seed from the authenticated PR #48 preview. Do not grant the currently signed-in non-admin identity platform administration, do not retry `controlPlane.bootstrapPlatformAdmin`, and do not edit the `users` table in the Convex dashboard.

An application role-grant change is not safer for this incident:

- `users.platformRole` has only `user` and `super_admin`; it has no expiry, grant record, or scoped platform role.
- Several server paths read `platformRole === "super_admin"` directly, so a temporary parallel grant would be incomplete unless the authorization model were redesigned across the control plane.
- A mutation that patched the existing role would create full platform authority and a standing escalation surface to solve a one-time dev execution handoff.
- The existing `activation.seedSmokeSite` mutation already requires a signed-in platform administrator and writes the `activation_smoke_seeded` audit event.

The least-privilege handoff changes the executor, not the non-admin user's role.

## Bound snapshot

This packet records the captain-provided state observed on October 14, 2026. It is not proof that the state remains current:

- Convex dev deployment: `hallowed-manatee-765`
- Open activation-control review: PR `#48`, kept separate from this packet
- Platform administrators: `4`
- Active tenants: `2`
- Sites: `3`
- `vanguard-enterprises` tenant/site: absent
- Approved Vanguard seed: not executed
- The signed-in preview identity: authenticated and synced, but not a platform administrator
- One bootstrap attempt: rejected with `Platform admin already exists`

Refresh these values read-only immediately before an execution handoff. Do not print or copy user email addresses, auth subjects, tokens, deployment secrets, or raw account records into the captain thread or evidence.

## Why the dashboard-only handoff is safer

The recommended surface is the authenticated KinFlo admin dashboard supplied by PR #48, not a Convex data-table edit and not a new authorization endpoint. An existing administrator signs into the preview and uses the fixed, reviewed control. The server remains the authority:

- `activation.seedSmokeSite` rejects a caller who is not `super_admin`.
- The preview control is bound to `hallowed-manatee-765`.
- The seed arguments are fixed to the Vanguard tenant, site, subdomain, and approved starter template.
- The mutation creates the existing `activation_smoke_seeded` audit record.
- No bootstrap, role grant, invitation, upload, order write, provider call, code generation, production change, or `.env.local` write is needed.

## Existing-admin execution handoff

This packet does not authorize execution. The integration captain must bind the already-approved seed to an existing administrator, the exact preview, and a fresh preflight before the administrator clicks the final confirmation.

### 1. Refresh and bind

1. Confirm PR #48 is still the reviewed activation-control change and its checks are green.
2. Record its exact head commit and current Vercel preview deployment id in the captain's private execution receipt.
3. Confirm the preview's browser-public Convex URL resolves to `hallowed-manatee-765` without printing the URL value.
4. Confirm Convex `SITE_URL` is still intentionally bound to that exact preview for this dev-only handoff.
5. Use read-only checks to confirm `4` platform administrators, `2` active tenants, `3` sites, and no tenant or site with slug `vanguard-enterprises`.
6. Select one of the existing four development platform administrators as the executor. Verify the identity privately; record only a sanitized executor label in evidence.

Stop if the PR head, preview deployment, Convex deployment, `SITE_URL`, counts, Vanguard absence, or executor authority does not match. A mismatch requires a new captain decision.

### 2. Open the exact surface

1. In the integrated Codex browser, open the exact PR #48 preview route `/admin/kinflo-os?tab=hosted-activation`.
2. Sign out the non-admin identity if it is still active.
3. Sign in as the selected existing development platform administrator.
4. Confirm the route renders the KinFlo admin shell and the Vanguard control shows deployment `hallowed-manatee-765`.
5. Confirm readiness resolves to platform admin and `run activation smoke seed`.

Stop if the page offers first-admin bootstrap, reports a target mismatch, remains gated, or identifies the session as a non-admin. Never retry bootstrap.

### 3. Review the one bounded write

Click **Review Vanguard seed**, then verify the confirmation dialog shows exactly:

- tenant name: `Vanguard Enterprises`
- tenant slug: `vanguard-enterprises`
- site name: `Vanguard Enterprises`
- site slug: `vanguard-enterprises`
- subdomain: `vanguard-enterprises`
- template: `advisor-consultant`
- deployment: `hallowed-manatee-765`

The dialog must not include adapter switching, invitations, uploads, order creation, provider actions, billing, code generation, or production changes.

### 4. Captain execution gate

Only after the captain issues the exact approval binding below may the existing administrator click **Run Vanguard dev seed** once.

If the result is failed, unknown, interrupted, or times out, stop. Do not retry. Preserve the visible error, network receipt, and current read-only counts for reconciliation.

### 5. Read-only closeout

After a confirmed success, use read-only checks to verify:

- active tenants increased from `2` to `3`;
- sites increased from `3` to `4`;
- exactly one tenant and one site use slug `vanguard-enterprises`;
- the site uses template `advisor-consultant`;
- the homepage and its published blocks exist;
- one `activation_smoke_seeded` audit event identifies the existing admin executor and Vanguard site internally;
- platform administrator count remains `4`;
- the non-admin identity remains `user`;
- uploads, orders, invitations, provider-like events, production writes, and `.env.local` writes remain `0`.

Keep raw ids and identity fields in private evidence only. Report sanitized counts, slugs, event type, commit, preview deployment id, and pass/fail state to the captain.

## Rollback and removal

This source-only packet adds no runtime function, schema, role grant, environment value, or deployment. Its source rollback is a normal revert of the Phase 179 commit, followed by `npm run kinflo:validate-dev-admin-existing-admin-handoff`.

If the seed has not executed, removal is straightforward:

1. Restore Convex `SITE_URL` to its pre-handoff value if the captain temporarily changed it under separate authority.
2. Close or supersede the PR #48 preview.
3. Remove the PR #48 one-click activation UI in a scoped follow-up PR if the control is no longer needed.
4. Verify the dev counts and the absence of `vanguard-enterprises` read-only.

If the seed succeeds, do not delete or patch its tenant, site, membership, pages, blocks, visibility rules, theme tokens, navigation items, feature flags, revisions, publish events, or audit event by hand. The existing mutation writes across those records and no reviewed atomic cleanup operation exists. Data rollback therefore requires a separate cleanup design, exact pre-state evidence, a dedicated approval, and a one-attempt execution binding.

The PR #48 control-removal follow-up should remove the hosted activation control from the admin shell, remove its client-only fixture and capture script when no longer used, and re-run the identity, Convex, client build, desktop, and mobile validation gates. The underlying server mutation predates PR #48 and must not be removed casually because other activation tooling may reference it.

## Required captain approval

Use this exact continuation language after replacing the bracketed values with freshly verified values:

> Approve the existing-admin Vanguard dev-seed handoff on Convex deployment `hallowed-manatee-765` through PR #48 preview commit `[full commit]` and Vercel preview deployment `[deployment id]`. Bind execution to the privately verified existing development platform administrator `[sanitized executor label]`. Preconditions must remain `4` platform admins, `2` active tenants, `3` sites, and no `vanguard-enterprises` tenant or site. Authorize one call only to `activation.seedSmokeSite` with tenant, site, and subdomain slug `vanguard-enterprises` and template `advisor-consultant`. Do not call `bootstrapPlatformAdmin`, grant or edit roles, retry a failed or unknown result, upload files, write orders, run codegen or broader smoke, change production, call providers, write `.env.local`, or expose identity or secret values. Stop on any binding or preflight mismatch. On confirmed success, perform only the read-only closeout in Phase 179 and prepare the scoped PR #48 control-removal recommendation; do not run data cleanup without a separate approval.

## Validation

```bash
npm run kinflo:validate-dev-admin-existing-admin-handoff
npm run convex:check
```

No client UI changes are made in this lane, so desktop/mobile screenshots and an MP4 are not required for this Phase 179 packet. PR #48 retains its own visual evidence and Human QA gate.
