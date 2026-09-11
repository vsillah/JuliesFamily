# Phase 47 AI Review Provenance Shell

This phase exposes provider-light AI provenance and review readiness inside the KinFlo OS shell.

Command:

```bash
npm run kinflo:validate-ai-review-shell
```

## Added Scope

Admin route:

- `/admin/kinflo-os`

Shell surface:

- `AI Review`
- site selector
- AI record selector
- review status selector
- prompt summary field
- output summary field
- publish target field
- reviewer notes field
- source input list
- disabled `Live AI review gated` action
- disabled `Live AI publish gated` action

Convex functions:

- `aiReview.listAiGenerationRecords`
- `aiReview.upsertAiGenerationRecord`
- `aiReview.reviewAiGenerationRecord`

Convex table:

- `aiGenerationRecords`

Local edits update React state only. No AI provider request, prompt execution, generated content publish, campaign send, public-site mutation, provider state, or production data is written.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No OpenAI, AI Gateway, SendGrid, Twilio, Stripe, Cloudinary, object storage, browser automation, content publish, campaign automation, or production data write is performed.

AI review records provenance and approval state only. A later hosted phase must separately prove provider credentials, usage caps, source-safe prompts, reviewer approval, publish target routing, and live smoke execution.

## Current Result

Latest result:

- AI review shell route: `/admin/kinflo-os`.
- AI review controls: 9.
- Convex AI review functions: 3.
- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- AI provider touched: no.
- Generated content published: no.
- Generated API imported: no.
- Live Convex execution: no.

This does not claim live AI generation, generated-copy publishing, campaign sending, or public-site mutation is active. It proves the tenant-safe AI provenance and review workflow is visible, reviewable, permission-mapped, and ready for a later hosted activation gate.
