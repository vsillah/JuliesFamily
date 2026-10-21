# KinFlo Phase 7 Operations Contract

Phase 7 establishes a universal, tenant/site-scoped operations boundary for analytics, task routing, and communication workflows.

## Analytics

Analytics previews are read models with an explicit source and freshness label. The current contract uses preview fixtures and marks live emission and persistence as disabled. A metric cannot be treated as live telemetry until a later activation gate provides a scoped source and a measurement policy.

## Task routing

Tasks carry tenant and site scope, status, priority, and optional assignment. The transition map is explicit; unsupported transitions, missing `operations:task:manage`, and scope mismatches fail closed. The admin surface shows the decision but keeps the apply action disabled in preview mode.

## Communication drafts

Templates carry trigger intent and draft delivery state. The preview surface can review copy and approval posture, but email/SMS transport remains disabled even when a future approval and permission are supplied. No provider or send API is referenced by this phase.

## Julie fixture boundary

Julie-specific content remains a fixture in the existing audience and experiment contracts. Phase 7 does not import or use Julie definitions as a default for another tenant/site.

## Deferred gates

Convex schema/codegen, live analytics emission, task persistence and routing, email/SMS providers, uploads, deployment, hosted smoke, and production configuration remain separately gated.
