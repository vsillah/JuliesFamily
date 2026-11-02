# Phase 176: read-only live adapter cutover

This phase wires the first live Convex data batch into the KinFlo admin shell. The full live adapter stays blocked.

## Included reads

- Tenant control plane: tenant list, first-tenant site list, and platform audit events.
- Plans and entitlements: plan catalog, entitlement usage, and a zero-increment site-limit check.
- Public renderer: published-site resolution for the selected site's subdomain and root route.
- Launch readiness: site readiness plus platform activation counts.

The shell keeps its fixture snapshot until every query in the bounded batch has returned. If the read-only gate is incomplete, the fixture provider stays selected.

## Runtime gate

All four conditions must be true:

1. `VITE_CONVEX_URL` is configured through the approved environment path.
2. `VITE_KINFLO_READ_ONLY_GENERATED_API_AVAILABLE=true` records that the ignored generated bindings and query names were reviewed.
3. `VITE_KINFLO_READ_ONLY_SMOKE_VERIFIED=true` records that the approved read-only smoke passed.
4. `VITE_KINFLO_READ_ONLY_ADAPTER_MODE=live_verified` explicitly selects this batch.

Missing or misspelled values fail closed to fixtures. The original `liveKinfloShellAdapter` still has `canUseLiveData: false`, so this phase cannot enable mutation surfaces by accident.

## Source boundary

The client uses reviewed query bindings from the `@kinflo-phase174-generated-api` alias. Development resolves that alias to ignored `convex/_generated/api`; clean-checkout builds resolve it to a query-only stub so committed client code does not depend on generated files. The `convex/_generated remains ignored` validation confirms that boundary. `.env.local remains absent` is a validation requirement, not an operator suggestion.

No mutation-backed live smoke was run. This phase does not mount mutation hooks, run a Convex deployment, import production data, publish a site, create a lead, send an invitation, call a provider, change DNS, or activate billing.

## Validation

```bash
npm run convex:check
npm run kinflo:validate-generated-api
npm run kinflo:validate-live-adapter
npm run kinflo:validate-read-only-live-adapter
npm run kinflo:validate-adapter-switch-cutover-checklist
npm run check
```

The next gate is captain review of the draft PR. Hosted environment selection and read-only smoke evidence remain separate operational decisions.
