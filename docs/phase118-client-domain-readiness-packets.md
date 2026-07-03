# Phase 118: Client Domain Readiness Packets

Phase 118 adds provider-light client domain readiness packets to the compact Site Studio configuration lane.

Command:

```bash
npm run kinflo:validate-client-domain-readiness-packets
```

## Added Contract

- Convex function: `siteFactory.listClientWebsiteDomainReadinessPackets`
- Shell type: `ShellClientWebsiteDomainReadinessPacket`
- Shell fixture path: `snapshot.clientWebsiteStudio.domainReadinessPackets`
- Runtime key: `siteFactoryListClientWebsiteDomainReadinessPackets`
- Generated API surface: `site factory`
- UI tab: `tab-kinflo-client-domain-readiness-packet`
- UI panel: `section-kinflo-client-domain-readiness-packet`

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No domain attach, DNS verification, SSL provisioning, configuration save, public publish, lead write, invite send, campaign send, provider call, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

Client websites cannot become a reusable SaaS product if domain posture lives outside the selected site review flow. Each site now carries hostname posture, DNS checklist, SSL posture, provider state, rollback plan, and blocked live actions inside the same compact configuration panel used for save, publish, rollback, and experience review.
