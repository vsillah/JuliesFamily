# Phase 74: Adapter Switch Evidence Matrix

Phase 74 adds a provider-light evidence matrix for the fixture-to-live adapter switch. It translates the Phase 50 switch order into a reviewable proof map: generated API coverage, smoke evidence, rollback posture, design quality gate, and human blockers for each adapter surface.

Command:

```bash
npm run kinflo:validate-adapter-switch-evidence
```

## Added Artifact

- Matrix: `docs/convex-adapter-switch-evidence-matrix.json`
- Status: `provider_light_adapter_switch_evidence`
- Adapter surfaces: 12
- Design research sources: 5
- Claude Code frame review: pending CLI credential repair

## Research Applied

The matrix uses current public design references from Webby Awards 2026, UX Design Awards, Awwwards SaaS examples, SaaS UI 2026 trend analysis, and Muzli dashboard examples. The useful pattern is consistent: polished products make the active object clear, keep operational screens calm, show proof before action, and make desktop/mobile review states inspectable.

For KinFlo OS, that becomes a product bar:

- the active tenant, site, launch packet, or CRM object must be visible immediately,
- configuration controls must show what can be changed, what is gated, and why,
- launch and adapter-switch surfaces must show owner, evidence, blockers, rollback, and approval status,
- public client sites must pass desktop and mobile visual QA before client handoff,
- provider, AI, campaign, domain, invite, and lead-write actions stay visibly blocked until approved.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No tenant/site launch, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Current Result

The matrix proves that every adapter switch surface remains blocked while still being concrete enough to hand to hosted activation later:

- each surface maps back to `docs/convex-adapter-switch-plan.json`,
- each Convex function is present in `KINFLO_GENERATED_API_BINDINGS`,
- each surface has smoke evidence and rollback text,
- every surface keeps `switchAllowed`, `providerWrites`, and `liveConvexExecution` false,
- every design gate is explicit before the surface can become client-facing.
- the site-factory surface now requires `siteFactory.listClientWebsiteLaunchComposer` plus `client website launch composer read` smoke evidence before any generated API switch.

## Next Safe Work

Keep the matrix current as design QA and hosted activation evidence improves. After Claude Code CLI credentials are repaired, run a two-frame design critique against the Kinflo OS command shell and the public client-site preview, then apply only reviewed provider-light design deltas.
