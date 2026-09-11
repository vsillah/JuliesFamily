# Phase 61 Client Provisioning Execution Manifest

## Validation

```bash
npm run kinflo:validate-client-provisioning-execution
npm run kinflo:dry-run-client-provisioning
```

## Scope

Phase 61 adds a provider-light execution manifest for the Phase 60 provisioning orders.

- Manifest: `docs/convex-client-provisioning-execution-manifest.json`.
- Status: `provider-light-dry-run-contract`.
- Client execution orders: 3.
- Dry-run steps: 7.
- Live provisioning execution: gated.

The manifest defines the order in which client provisioning could run later:

- Julie Family seeded retrofit review,
- Advisor client tenant/site/invite/domain/lead/publish order,
- Campaign microsite site-editor and campaign approval order.

## Provider Boundary

- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.
- Provider APIs touched: no.
- Secrets read or printed: no.
- Claude Code credential check: passed with `ANTHROPIC_API_KEY` injected from 1Password item `ANTHROPIC_API_KEY` in vault `Portfolio / dev`.
- Claude Code frame pass: completed as a short design probe; keep the panel preview-only, show per-step blocked reasons, and defer copy/export until executable dry-run approval.

No tenant, site, membership, invitation, email, billing, domain, storage, publish, lead, campaign, AI, SMS, or provider write is executed by this phase.

## Next Activation Gate

This manifest can become executable only after hosted Convex activation, generated API review, read-only hosted smokes, mutation smoke approval, rollback owner assignment, and provider-specific approval gates are complete.
