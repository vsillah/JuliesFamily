# Phase 148: Configuration Domain Readiness

Phase 148 brings the selected client site's domain readiness packet into the Configure lane so super admin can review hostname posture, DNS evidence, SSL/provider status, rollback, blocked actions, and function mapping without leaving configuration review.

Command:

```bash
npm run kinflo:validate-configuration-domain-readiness
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

- `section-kinflo-client-configuration-domain-readiness` adds the selected site's domain readiness packet to Configure.
- `text-kinflo-client-configuration-domain-readiness` names the active packet.
- `section-kinflo-client-configuration-domain-status` shows verified fixture, pending DNS, or blocked plan gate status.
- `section-kinflo-client-configuration-domain-hostname` exposes the selected hostname.
- `section-kinflo-client-configuration-domain-checklist` keeps DNS readiness evidence visible.
- `section-kinflo-client-configuration-domain-blocked` keeps blocked domain attach, DNS verification, SSL provisioning, publish, lead, campaign, invite, and provider actions visible.
- `section-kinflo-client-configuration-domain-functions` maps the packet back to provider-light Convex function names.
- `button-client-configuration-domain-gated` keeps domain attach, DNS verification, SSL provisioning, config save, and publish disabled.
- The panel uses the existing `selectedClientWebsiteDomainReadinessPacket` derived from `clientWebsiteStudio.domainReadinessPackets`, so switching the configuration profile also switches the domain evidence.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No domain attach, DNS verification, SSL provisioning, invitation creation, membership grant, permission write, public publish, lead write, campaign send, provider call, production import, adapter switch, client sharing, or live handoff is performed.

No secret values are read or printed.

## Why This Matters

Client subwebsites need a clear domain posture before launch. This card keeps domain review attached to the selected configuration profile, so super admin can tell whether a site is fixture-verified, ready for DNS review, or blocked by plan and provider gates before any hosted domain path is approved.
