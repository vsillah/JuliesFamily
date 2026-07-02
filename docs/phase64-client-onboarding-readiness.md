# Phase 64 Client Onboarding Readiness

## Validation

```bash
npm run kinflo:validate-client-onboarding-readiness
npm run kinflo:dry-run-client-onboarding-readiness
```

## Scope

Phase 64 adds provider-light onboarding task and readiness scoring contracts for the Phase 6 Site Factory and Client Onboarding milestone.

- Manifest: `docs/convex-client-onboarding-readiness-manifest.json`.
- Convex function: `siteFactory.listClientWebsiteOnboardingReadiness`.
- Status: `provider-light-readiness-contract`.
- Readiness trackers: 3.
- Task groups: 6.
- Onboarding tasks: 18.
- Blocked tasks: 7.
- Live onboarding task writes: gated.

The trackers give each client site a repeatable launch prep model:

- Julie Family founding tenant retrofit,
- Advisor client tenant/site/admin handoff,
- Campaign microsite consent and conversion launch.

## Provider Boundary

No onboarding task, tenant, site, membership, invitation, email, billing, domain, storage, publish, lead, campaign, AI, SMS, provider, generated API, or hosted Convex write is executed.

The query is a read-only contract for what the hosted onboarding workflow should later return after Vambah approves hosted Convex activation, generated API review, read-only smokes, mutation smoke order, provider checks, and launch packet handoff.

## Next Activation Gate

Before live onboarding activation:

1. Approve hosted Convex ownership, billing, backup, auth, and env setup.
2. Run approved Convex codegen and review generated API bindings.
3. Smoke read-only onboarding, launch readiness, public preview, and permission queries.
4. Approve tenant/site/invite/lead/publish mutation smoke order.
5. Confirm launch packet destination, client owner, privacy posture, and provider readiness before any external handoff.
