# Vanguard associate assist and co-edit foundation

Status: Phase 3 provider-light runtime foundation

Date: October 13, 2026

Client path: `/kinflo-sites/vanguard-enterprises/orders`

Associate path: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`

Machine-readable contract: `docs/vanguard-order-operations-contract.json`

## What this slice proves

Clients can see the three support levels planned for a Vanguard build request: guidance, co-editing, and associate preparation for client confirmation. The screen explains what the associate can see, how long access lasts, and how the client can revoke it. The support action remains unavailable until client identity is active.

The KinFlo Site Studio workspace adds a compact associate queue record for the same sample order. It shows the current draft section, consent state, intervention type, fields shared with the associate, fields kept private, access expiry, next step, activity log, and blocked-state recovery.

This slice uses one existing KinFlo/Vanguard order workflow. It does not create a parallel CRM or a second order record.

## Visibility and consent

Every draft starts private. An associate can see a draft only after the client requests support and confirms the fields to share.

The visibility states are:

1. `private`: only the client can see the draft.
2. `share_requested`: the client is reviewing the proposed access scope.
3. `shared`: the approved associate can use the granted scopes until expiry or revoke.
4. `expired`: the access window ended. The associate loses access.
5. `revoked`: the client ended access. The associate loses access immediately.

Consent is recorded separately as `not_granted`, `pending`, `active`, `expired`, or `revoked`. A later runtime must authorize against both the grant and the latest draft revision on every read and write. An expired or revoked session cannot resume until the client creates a new grant.

## Assistance levels

### Assist

The associate may view the shared draft fields and leave comments. The client keeps edit control.

Scopes: `view_draft`, `comment`.

### Co-edit

The associate may view, comment on, and edit the shared fields. Revision-aware writes must stop stale changes and return a clear refresh path.

Scopes: `view_draft`, `comment`, `edit_draft`.

### Prepare for client

The associate may complete the shared portion of the draft and return it to the client. The client must review and confirm the result before submission.

Scopes: `view_draft`, `comment`, `edit_draft`, `submit_for_client`, `takeover_session`.

## Handoff and resume rules

- The client initiates sharing, chooses the fields, selects the assistance level, and sets the access end time.
- The associate accepts the assignment before opening the shared draft.
- The client owns the session unless the grant includes takeover.
- Co-edit writes carry the last-seen revision. A conflict pauses the write and returns both people to the latest draft.
- Takeover returns the draft to the client for final confirmation. It does not permit silent submission.
- Revoke ends access immediately. Expiry ends access at the recorded time.
- Resume after revoke or expiry requires a new client grant.

## Audit trail

The future live implementation must record append-only events for the support request, consent grant, assignment acceptance, each draft view, comments, edits, handoff, revoke, and expiry. Events carry tenant, site, order, grant, actor, scope, draft revision, timestamp, and a safe summary. Audit summaries must not copy private field values or file contents.

## Privacy boundary

The associate can see only the fields named in the active grant. Other orders, billing details, contact records outside the order, and unshared draft sections remain private. Private files and uploads remain disabled. A later upload phase needs separate approval for file type, size, retention, scanning, deletion, legal hold, and export-control rules.

## Runtime gate

PR #15 owns the client identity cutover and remains separate. Live assist needs that identity boundary plus approved generated bindings and role-gated Convex functions. Until those gates pass, the client action and associate acceptance action stay disabled.

The first live implementation must preserve:

- server-side ownership and role checks;
- an active, unexpired, unrevoked access grant for every read and write;
- field-level scope enforcement;
- revision-aware draft writes;
- append-only audit events;
- client confirmation before submission;
- indexed queue reads with pagination.

## Validation and evidence

Run:

```sh
npm run check
npm run kinflo:validate-vanguard-order-operations-architecture
npm run kinflo:validate-vanguard-order-portal
npm run kinflo:validate-vanguard-associate-assist
npm run build:client
```

For privacy-safe UI evidence, start the local server at `127.0.0.1:5177`, then run:

```sh
npm run kinflo:capture-vanguard-associate-assist-qa
```

The capture includes 1280px desktop, 768px tablet, and 390px mobile client support states plus the desktop associate queue. It uses sample values and a browser-only admin response.

## Provider boundary

- External writes: 0.
- Live Convex reads or mutations: 0.
- Generated Convex API imports: 0.
- Convex codegen: not run.
- `.env.local`: absent and untracked.
- Private file upload: disabled.
- Customer or private data: none.
- Production deployment: not performed.
