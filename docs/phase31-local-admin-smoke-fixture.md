# Phase 31 Local Admin Smoke Fixture

This phase adds a development-only auth fixture so the KinFlo OS admin shell can be browser-smoked before hosted OIDC, Convex Auth, or generated Convex API bindings are activated.

Command:

```bash
npm run kinflo:validate-local-admin-fixture
```

Optional browser smoke server:

```bash
npm run kinflo:serve-local-admin-smoke
```

## What It Adds

When the local server runs with both:

```bash
NODE_ENV=development
KINFLO_ENABLE_LOCAL_ADMIN_FIXTURE=true
```

`/api/auth/user` returns a synthetic super-admin identity with `source: "kinflo-local-admin-fixture"` and response header `X-KinFlo-Local-Admin-Fixture: true`.

That lets `/admin/kinflo-os` render the provider-light shell in a repeatable browser smoke without requiring a real OIDC login, a seeded database admin, a hosted Convex deployment, or generated Convex API bindings.

For database-free browser QA, `npm run kinflo:serve-local-admin-smoke` starts a Vite-only smoke server that serves the real client app and mocks only `GET /api/auth/user` with the same fixture identity.

## Safety Boundary

The fixture is disabled by default.

It is guarded by `NODE_ENV=development`.

It still requires the explicit `KINFLO_ENABLE_LOCAL_ADMIN_FIXTURE=true` flag.

No production auth bypass is introduced.

No database user is created or updated by the fixture.

No hosted Convex deployment is created.

No generated Convex API files are committed.

No live Convex query, mutation, or action is executed.

No browser, provider, payment, email, SMS, storage, DNS, or production data write is performed.

## Next Browser Gate

Run either a local app server with the fixture enabled or the database-free smoke server, then smoke:

- `http://127.0.0.1:<port>/admin/kinflo-os`
- `http://127.0.0.1:<port>/kinflo-sites/julies-family`

The admin smoke should verify:

- `KinFlo OS` renders.
- data mode and live adapter readiness render.
- `New Tenant` and `New Site` controls are visible.
- the site creation wizard controls are present.
- no framework error overlay appears.
- console warnings/errors are absent or explained.

This is still provider-light. It proves the shell can render locally with an explicit test identity; it does not prove hosted auth or live Convex execution.

## Current Browser Result

Latest smoke server result on `http://127.0.0.1:5177`:

- `/admin/kinflo-os` rendered `KinFlo OS`, data mode, live adapter readiness, and `Convex gated`.
- `New Tenant` and `New Site` controls were visible.
- Clicking `New Site` rendered `Site Factory Launch Packets` and `Site Creation Wizard`.
- Site creation wizard controls for template, site name, and subdomain were present.
- `/kinflo-sites/julies-family` rendered the public preview hero, services, intake, and `/api/leads` fallback copy.
- Console warnings/errors: 0.
- External writes: 0.
- Hosted deployment touched: no.
- Live Convex execution: no.
