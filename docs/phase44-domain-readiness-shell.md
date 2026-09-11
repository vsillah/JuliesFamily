# Phase 44 Domain Readiness Shell

This phase exposes provider-light custom-domain readiness inside the KinFlo OS shell.

Command:

```bash
npm run kinflo:validate-domain-shell
```

## Added Scope

Admin route:

- `/admin/kinflo-os`

Shell surface:

- `Domain Readiness`
- site selector
- domain selector
- domain status selector
- primary-domain checkbox
- bare hostname field
- TXT verification token field
- rollback plan field
- DNS checklist
- disabled `Live DNS save gated` action

Convex functions:

- `siteBuilder.upsertDomain`
- `entitlements.checkEntitlementLimit`
- `publicSite.resolvePublishedSite`

Local edits update React state only. No domain row, DNS record, SSL certificate, Vercel domain attachment, hostname routing, provider state, or production data is written.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No DNS record, SSL certificate, Vercel domain, Cloudflare, registrar, provider, payment, email, SMS, storage, browser automation, or production data write is performed.

## Current Result

Latest result:

- Domain shell route: `/admin/kinflo-os`.
- Domain controls: 7.
- Convex domain functions: 3.
- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- DNS provider touched: no.
- SSL provider touched: no.
- Generated API imported: no.
- Live Convex execution: no.

This does not claim live domain verification, DNS provisioning, SSL issuance, or custom-domain routing is active. It proves the client-site domain readiness workflow is visible, reviewable, and mapped to the existing provider-light `siteBuilder.upsertDomain` contract.
