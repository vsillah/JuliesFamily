# Phase 62 Client Launch Packet

## Validation

```bash
npm run kinflo:validate-client-launch-packet
npm run kinflo:dry-run-client-launch-packet
```

## Scope

Phase 62 turns the Site Factory and Client Website Studio work into an export-preview launch packet.

- Manifest: `docs/convex-client-launch-packet-manifest.json`.
- Status: `provider-light-export-preview`.
- Client launch packets: 3.
- Packet sections: 15.
- Live export action: gated.

The packet preview gives Vambah one place to review:

- preview URL,
- client/admin invite posture,
- readiness score,
- handoff checklist,
- blocked provider actions,
- and the Convex function contract that will eventually power the packet.

## Provider Boundary

- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.
- File export written: no.
- Provider APIs touched: no.
- Secrets read or printed: no.

No packet file, tenant, site, membership, invitation, email, billing, domain, storage, publish, lead, campaign, AI, SMS, or provider write is executed by this phase.

## Next Activation Gate

The packet can become a real export only after hosted Convex activation, generated API review, selected-site preview smoke, invitation policy approval, privacy/source-safety review, and provider-specific gates are complete.
