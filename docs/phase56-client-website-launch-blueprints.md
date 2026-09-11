# Phase 56 Client Website Launch Blueprints

## Validation

```bash
npm run kinflo:validate-client-website-blueprints
```

## Scope

Phase 56 connects the `Client Website Design Studio` to the super-admin site factory workflow without enabling hosted writes.

- Admin route: `/admin/kinflo-os`.
- Shell data: `clientWebsiteStudio.launchBlueprints`.
- Launch blueprints: 3.
- Factory packet bridges: 2.
- First surface: `Launch Blueprint`.
- Provider posture: local fixture review only.

## Blueprint Coverage

- `julies-family-public`: seeded tenant retrofit blueprint, no new factory packet.
- `advisor-client-site`: bridges to `advisor-client-starter`.
- `campaign-microsite`: bridges to `campaign-microsite-lab`.

## Super Admin Spin-Up Contract

Each blueprint names:

- template key,
- owner role,
- default pages,
- admin permission gates,
- launch sequence,
- blocked provider actions,
- mapped Convex functions.

## Provider Boundary

- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.
- Provider APIs touched: no.
- Secrets read or printed: no.
- No generated API is imported.
- No live Convex query, mutation, or action is executed.

## Next Activation Gate

The blueprint bridge can become a real site spin-up action only after hosted Convex activation is approved, generated API bindings are reviewed, role/invite smoke passes, public preview smoke passes, and provider-specific publish gates are approved.
