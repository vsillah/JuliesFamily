# Phase 159: Client Website Portfolio Registry

Phase 159 adds a compact super-admin registry for managing many client websites from the same KinFlo OS shell. It maps each client site to its tenant, plan, template, admin permission preset, readiness, launch posture, next gate, and blocked live actions before any provider or hosted Convex work is allowed.

Command:

```bash
npm run kinflo:validate-client-website-portfolio-registry
```

## Admin Surface

- Route: `/admin/kinflo-os?tab=site-studio`
- Data object: `clientWebsiteStudio.portfolioRegistry`
- Component: `ClientWebsitePortfolioRegistry`
- Panel: `section-kinflo-client-website-portfolio-registry`
- Summary: `section-kinflo-client-website-portfolio-summary`
- Table: `section-kinflo-client-website-portfolio-table`
- Selected blocked actions: `section-kinflo-client-website-portfolio-blocked`
- Disabled action: `button-client-website-portfolio-gated`

## Registry Rows

- Total sites: 3
- Ready for review: 1
- Blocked sites: 1
- Draft sites: 1
- Site keys:
  - `julies-family-public`
  - `advisor-client-site`
  - `campaign-microsite`

The registry covers platform, tenant, and site-scoped permission models:

- `platform.super_admin` / `platform`
- `tenant.admin` / `tenant`
- `site.editor` / `site`

## Provider Boundary

No tenant is created.

No site is created.

No admin invitation is created or sent.

No public page is published.

No lead is written.

No domain is attached.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider APIs are touched.

No secret values are read or printed.

## Next Gate

Use the registry to select and review a client website, then continue through spin-up queue, configuration profile, handoff readiness, hosted activation, generated API review, and smoke evidence before any live action is approved.
