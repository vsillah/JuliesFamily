# Phase 105: Site Studio Site Deep Links

Phase 105 makes the selected client website addressable by URL inside Site Studio.

Command:

```bash
npm run kinflo:validate-site-studio-site-deep-links
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=site-studio`
- Site query param: `studioSite`
- Supported fixture site keys:
  - `julies-family-public`
  - `advisor-client-site`
  - `campaign-microsite`
- Route reader: `readInitialClientWebsiteStudioSiteKey`
- Route-aware selector: `selectClientWebsiteStudioSite`
- Site rail selector: `section-kinflo-client-site-rail`
- Desktop site selector: `select-kinflo-client-website-site`

## What Changed

Site Studio now seeds the selected client site from `studioSite` when the URL contains a known fixture key. A link such as `/admin/kinflo-os?tab=site-studio&studioSite=campaign-microsite&studioLane=workbench&studioStage=launch&studioDossier=qa` opens directly to the campaign microsite launch QA dossier.

Selecting a site from the site rail or desktop client-site select now writes `studioSite` into the URL while preserving the current Site Studio lane, workbench stage, and launch dossier. Browser back and forward navigation also resync the selected site from the URL.

This gives the super-admin workflow a stable review link for each client website without touching hosted Convex, generated API bindings, live queries, provider writes, invites, leads, domains, campaigns, or public publish.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.
