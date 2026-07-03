# Phase 147: Configuration Admin Invitation Readiness

Phase 147 brings the selected client site's admin invitation readiness into the Configure lane so super admin can review invite recipient, role scope, evidence, copy blocks, blocked actions, rollback, and function mapping without leaving configuration review.

Command:

```bash
npm run kinflo:validate-configuration-admin-invitation-readiness
```

## Route Contract

Base route:

`/admin/kinflo-os?tab=site-studio&studioLane=configuration`

Selected site:

`studioSite=julies-family-public|advisor-client-site|campaign-microsite`

Configure workspace:

`studioConfigure=review|change|approval|save`

Existing detail tabs stay preserved by workspace:

`studioConfig=blockers|evidence|functions`

`studioChange=blockers|evidence|functions`

`studioApproval=blockers|evidence|functions`

`studioSave=blockers|evidence|audit|rollback|publish|domain|invite|experience|functions`

## What Changed

- `section-kinflo-client-configuration-admin-invitation-readiness` adds the selected site's invitation readiness packet to Configure.
- `text-kinflo-client-configuration-admin-invitation-readiness` names the active readiness packet.
- `section-kinflo-client-configuration-admin-invitation-scope` shows platform, tenant, or site invite scope.
- `section-kinflo-client-configuration-admin-invitation-copy` keeps invite copy blocks visible without enabling delivery.
- `section-kinflo-client-configuration-admin-invitation-checklist` lists readiness evidence.
- `section-kinflo-client-configuration-admin-invitation-blocked` keeps blocked invite, membership, provider, publish, campaign, and sharing actions visible.
- `section-kinflo-client-configuration-admin-invitation-functions` maps the packet back to provider-light Convex function names.
- `button-client-configuration-admin-invitation-gated` keeps invitation creation, email send, membership grant, config save, and publish disabled.
- The panel uses the existing `selectedClientWebsiteAdminInvitationReadinessPacket` derived from `clientWebsiteStudio.adminInvitationReadinessPackets`, so switching the configuration profile also switches the invitation evidence.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No invitation creation, invitation email, membership grant, permission write, public publish, lead write, campaign send, provider call, domain operation, production import, adapter switch, client sharing, or live handoff is performed.

No secret values are read or printed.

## Why This Matters

The shared-software model needs client administrators to enter through clear, scoped invitations. This card keeps invitation readiness attached to the selected configuration profile, so super admin can tell whether a site is still founding-owner only, tenant-admin ready but not sent, or site-editor blocked before any hosted auth or provider path is approved.
