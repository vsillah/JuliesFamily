# Phase 68: Client Visual QA Evidence Packets

Phase 68 turns the visual QA budget into an evidence intake contract. The Site Studio can now show which screenshot, accessibility, performance, and approval artifacts are required before a client website is treated as Apple-grade.

## Added Contract

- Convex query: `siteFactory.listClientWebsiteVisualQaEvidencePackets`
- Manifest: `docs/convex-client-visual-qa-evidence-manifest.json`
- Status: `provider-light-qa-evidence-packet`
- Admin shell section: `section-kinflo-client-visual-qa-evidence-packet`
- Review gate button: `button-client-visual-qa-evidence-gated`

## Evidence Coverage

- Evidence packets: 3
- Evidence items: 12
- Accepted evidence items: 4
- Pending evidence items: 6
- Blocked evidence items: 2
- Approval checklist items: 9
- Blocked approval items: 6
- Open risks: 9

## Provider Boundary

The packets are read-only artifact slots and approval gates. No screenshot capture, accessibility crawl, Lighthouse run, provider call, evidence artifact write, content write, asset replacement, public publish, lead write, campaign send, generated API import, hosted deployment, or live Convex execution is performed.

## Validation

- `npm run kinflo:validate-client-visual-qa-evidence`
- `npm run kinflo:dry-run-client-visual-qa-evidence`
- `npm run kinflo:validate-generated-api`
- `npm run convex:check`
- `npm run kinflo:validate-phases`
- `npm run kinflo:check-baseline`
- `npm run build`

## Launch Impact

The polish lane now has a place to record required proof without accepting proof prematurely. A client website can move from QA budget to evidence packet, but it cannot pass the Apple-grade gate until hosted screenshots, accessibility, performance, approval, rollback, and provider boundaries are actually satisfied.
