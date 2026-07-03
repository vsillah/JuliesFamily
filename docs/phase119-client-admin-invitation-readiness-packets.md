# Phase 119: Client Admin Invitation Readiness Packets

Phase 119 adds provider-light client admin invitation readiness packets to Site Studio Configure.

Command:

```bash
npm run kinflo:validate-client-admin-invitation-readiness-packets
```

## Added Surface

- Convex query: `siteFactory.listClientWebsiteAdminInvitationReadinessPackets`
- Shell type: `ShellClientWebsiteAdminInvitationReadinessPacket`
- Shell fixture: `snapshot.clientWebsiteStudio.adminInvitationReadinessPackets`
- Configure tab: `tab-kinflo-client-admin-invitation-readiness-packet`
- Configure panel: `section-kinflo-client-admin-invitation-readiness-packet`
- Generated API runtime key: `siteFactoryListClientWebsiteAdminInvitationReadinessPackets`
- Adapter-switch evidence: `client website admin invitation readiness read`

## What Changed

Each selected client site now has a compact invitation packet that records invite role, invite scope, recipient label, delivery posture, evidence checklist, copy blocks, rollback plan, blocked live actions, and the next human gate.

This keeps client-admin invitation readiness next to Domain and Experience configuration without sending email, writing memberships, or enabling live invitation mutations.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No invitation creation, email send, membership grant, configuration save, public publish, lead write, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

Kinflo needs to let a super admin prepare many client websites with different admin permissions. Invitation readiness should be reviewable per site before hosted auth, owner approval, invite delivery, and rollback evidence are approved.
