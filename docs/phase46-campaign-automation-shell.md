# Phase 46 Campaign Automation Shell

This phase exposes provider-light campaign automation readiness inside the KinFlo OS shell.

Command:

```bash
npm run kinflo:validate-campaign-shell
```

## Added Scope

Admin route:

- `/admin/kinflo-os`

Shell surface:

- `Campaign Automation`
- site selector
- campaign selector
- campaign channel selector
- campaign status selector
- campaign name field
- campaign objective field
- approval owner field
- campaign step review list
- disabled `Live approval gated` action
- disabled `Live send gated` action

Convex functions:

- `campaigns.listCampaignDrafts`
- `campaigns.upsertCampaignDraft`
- `campaigns.requestCampaignApproval`
- `campaigns.approveCampaignDraft`
- `entitlements.checkEntitlementLimit`

Convex tables:

- `campaigns`
- `campaignSteps`
- `campaignApprovals`
- `automationSafetyPolicies`
- `aiGenerationRecords`

Local edits update React state only. No campaign enrollment, email send, SMS send, AI generation, automation run, analytics promotion, webhook, provider state, or production data is written.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No SendGrid, Twilio, Stripe, Cloudinary, object storage, AI provider, browser automation, analytics, or production data write is performed.

Campaign approval records review state only. A later hosted phase must separately prove provider integrations, consent, unsubscribe handling, rate limits, AI provenance, and live smoke execution.

## Current Result

Latest result:

- Campaign shell route: `/admin/kinflo-os`.
- Campaign controls: 8.
- Convex campaign functions: 5.
- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- Provider APIs touched: no.
- Live sends: no.
- Generated API imported: no.
- Live Convex execution: no.

This does not claim live email, SMS, AI generation, lead enrollment, analytics, or campaign automation is active. It proves the tenant-safe campaign draft and approval workflow is visible, reviewable, permission-mapped, and ready for a later hosted activation gate.
