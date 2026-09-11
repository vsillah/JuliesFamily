# Phase 38 Access Delegation Shell

This phase exposes scoped client-admin and editor invitation preparation inside the provider-light KinFlo OS shell.

Command:

```bash
npm run kinflo:validate-access-shell
```

## Added Scope

Admin route:

- `/admin/kinflo-os`

Shell surface:

- `Access Delegation Packet`
- invite email input
- tenant selector
- site selector
- role selector
- permission preview for tenant admin, site admin, and site editor roles
- readiness checklist
- disabled `Live invite gated` action until hosted Convex auth, generated API bindings, email delivery, and live smoke are approved

Convex functions:

- `controlPlane.createInvitation`
- `controlPlane.grantMembership`
- `controlPlane.acceptInvitation`
- `controlPlane.listAuditEvents`

Local edits update React state only. No invitation token is generated, no email is sent, and no membership is created.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No provider, payment, email, SMS, storage, DNS, browser automation, or production data write is performed.

## Current Result

Latest result:

- Access shell route: `/admin/kinflo-os`.
- Delegation controls: 4.
- Convex invitation functions: 4.
- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.

This does not claim live invitations are active. It proves Vambah can review tenant, site, role, and permission-scoped access packets before hosted activation.
