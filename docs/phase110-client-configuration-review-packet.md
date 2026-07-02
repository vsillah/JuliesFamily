# Phase 110: Client Configuration Review Packet

Phase 110 adds a selected-site configuration review packet to Site Studio's Configure lane.

Command:

```bash
npm run kinflo:validate-client-configuration-review-packet
```

## What Changed

The configuration lane now has a compact selected-site review packet before the full profile list:

- `siteFactory.listClientWebsiteConfigurationReviewPackets` exposes the provider-light Convex query contract.
- `ShellClientWebsiteConfigurationReviewPacket` records selected-site surfaces, save blockers, required evidence, blocked live actions, and provider boundaries.
- `snapshot.clientWebsiteStudio.configurationReviewPackets` stores local review packets for Julie Family, the advisor client site, and the campaign microsite.
- `selectedClientWebsiteConfigurationReviewPacket` follows the currently selected Site Studio site.
- `section-kinflo-client-configuration-review-packet` keeps the chosen site's review posture visible.
- `section-kinflo-client-configuration-review-surfaces` bounds editable and locked surface evidence.
- `section-kinflo-client-configuration-save-blockers`, `section-kinflo-client-configuration-required-evidence`, and `section-kinflo-client-configuration-functions` keep blockers, evidence, and generated API functions in tabs instead of one long vertical scroll.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No configuration save, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The Site Studio shell is becoming the operating cockpit for spinning up configurable client websites. This phase makes the selected site's configuration posture scannable: what can be edited, what remains locked, what evidence is required, and what live action stays blocked until hosted activation is approved.
