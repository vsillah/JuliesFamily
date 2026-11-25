# Kinflo CRM Operating Contract

This contract turns the Kinflo admin hierarchy into an operating model shared by the platform, tenant, and site workspaces.

The machine-readable source is `docs/kinflo-crm-operating-contract.json`. Validate it with:

```bash
npm run kinflo:validate-crm-operating-contract
```

## Scope

- Kinflo is the parent SaaS platform.
- Tenants are consumer organizations.
- Sites are child workspaces owned by tenants.
- L0 Overview aggregates platform usage, capacity, and attention.
- L1 lanes own their health signals and operating metrics.
- L2 and L3 surfaces own scoped configuration and task execution.

## Capability surfacing

Tenant profiles control which capabilities are surfaced without creating separate admin architectures:

- `nonprofit`: CRM and communications, content and experimentation, administrative governance, program outcomes, and platform health.
- `for_profit`: CRM and communications, content and experimentation, administrative governance, and platform health.
- `starter`: CRM and communications, administrative governance, and platform health.

Julie-specific learner, family-program, volunteer, donor, and fundraising operations are not required for Vanguard. They remain possible profile capabilities for nonprofit tenants without becoming part of the Vanguard surface.

## Operational record path

Every L3 task must resolve through:

```text
role + scope + capability + action
```

The task must identify its source record, read or write action, validation rule, blocker, next action, and audit event. A navigation item without that contract remains discovery-only.

The current CRM spine already represents leads, pipeline stages, progression rules, progression events, lead events, follow-up tasks, entitlement checks, and audit events. The next implementation slice is the Control vertical slice that resolves tenant, site, membership, entitlement, and capability state before CRM actions are surfaced.

## Analytics

CRM events feed tenant-level metrics for contacts, pipeline movement, follow-up tasks, journey conversion, access reviews, and audit events. The platform Overview aggregates those signals across tenants while preserving tenant and site boundaries.

## Safety boundary

This phase is source-only. It does not execute Convex queries or mutations, import generated API bindings, connect providers, modify configuration, or write data. Live actions remain approval-gated until the contract, authorization, and rendered workflow checks pass.

## Roadmap

1. Contract: define scope, lanes, capabilities, entities, actions, events, and metrics.
2. Control vertical slice: resolve tenant, site, role, entitlement, and audit context.
3. Tenant CRM vertical slice: connect CRM records to the shared capability and permission contract.
4. Analytics aggregation: derive L1 metrics and L0 cross-tenant views from governed events.
5. Governed live actions: enable only explicitly approved mutations and provider boundaries.
