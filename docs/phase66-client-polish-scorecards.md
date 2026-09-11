# Phase 66: Client Polish Scorecards

Phase 66 starts the Phase 7 polish lane with a repeatable scorecard for client public sites and Site Studio handoff quality.

## Added Contract

- Convex query: `siteFactory.listClientWebsitePolishScorecards`
- Manifest: `docs/convex-client-polish-scorecard-manifest.json`
- Status: `provider-light-polish-review`
- Admin shell section: `section-kinflo-client-polish-scorecard`
- Review gate button: `button-client-polish-review-gated`

## Scorecard Coverage

- Polish scorecards: 3
- Criteria: 12
- Viewport checks: 9
- Passing criteria: 6
- Review criteria: 5
- Blocked criteria: 1
- Average overall score: 81
- Average mobile score: 81

## Provider Boundary

The scorecards are read-only fixtures and query contracts. No content write, asset replacement, public publish, lead write, campaign send, provider call, generated API import, hosted deployment, or live Convex execution is performed.

## Validation

- `npm run kinflo:validate-client-polish-scorecards`
- `npm run kinflo:dry-run-client-polish-scorecards`
- `npm run kinflo:validate-generated-api`
- `npm run convex:check`
- `npm run kinflo:validate-phases`
- `npm run kinflo:check-baseline`
- `npm run build`

## Launch Impact

The 15-minute launch simulation now leads into a quality gate. A client website can be prepared quickly, but it cannot be treated as presentation-ready until typography, mobile fit, proof clarity, accessibility posture, viewport checks, and provider boundaries pass review.
