# Phase 67: Client Visual QA Budgets

Phase 67 makes the Phase 7 polish gate operational by defining responsive screenshot, accessibility, regression, and performance budgets before hosted public/demo QA is treated as launch evidence.

## Added Contract

- Convex query: `siteFactory.listClientWebsiteVisualQaBudgets`
- Manifest: `docs/convex-client-visual-qa-budget-manifest.json`
- Status: `provider-light-visual-qa-budget`
- Admin shell section: `section-kinflo-client-visual-qa-budget`
- Review gate button: `button-client-visual-qa-gated`

## Budget Coverage

- Visual QA budgets: 3
- Screenshot checks: 9
- Passing screenshot checks: 5
- Accessibility checks: 9
- Blocked accessibility checks: 1
- Performance budgets: 9
- Performance risks: 7
- Regression targets: 9

## Provider Boundary

The budgets are read-only fixtures and query contracts. No screenshot capture, accessibility crawl, Lighthouse run, provider call, content write, asset replacement, public publish, lead write, campaign send, generated API import, hosted deployment, or live Convex execution is performed.

## Validation

- `npm run kinflo:validate-client-visual-qa-budgets`
- `npm run kinflo:dry-run-client-visual-qa-budgets`
- `npm run kinflo:validate-generated-api`
- `npm run convex:check`
- `npm run kinflo:validate-phases`
- `npm run kinflo:check-baseline`
- `npm run build`

## Launch Impact

The polish scorecard now has a follow-on QA budget. A client website can move through preview and launch simulation, but it cannot be presented as Apple-grade until the defined desktop, tablet, mobile, accessibility, regression, and performance gates are captured against the hosted surface.
