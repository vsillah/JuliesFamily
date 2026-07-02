# Phase 106: Client Public Preview Context Links

Phase 106 makes the Site Studio `Open preview` action carry the selected client website review context into the public preview renderer.

Command:

```bash
npm run kinflo:validate-client-public-preview-context-links
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=site-studio&studioLane=workbench&studioStage=preview`
- Public preview routes:
  - `/kinflo-sites/julies-family`
  - `/kinflo-sites/advisor-client-site`
  - `/kinflo-sites/campaign-microsite`
- Preview href builder: `buildClientWebsiteStudioPreviewHref`
- Context query params:
  - `route`
  - `device`
  - `source`
  - `studioSite`
  - `persona`
  - `journeyStage`
- Site Studio context panel: `section-kinflo-client-preview-link-context`
- Public preview context badge: `public-preview-context`

## What Changed

The Site Studio preview button now opens the selected client site's public preview URL with explicit review context from the starter content pack. For example, the Advisor Client Site preview carries:

```text
/kinflo-sites/advisor-client-site?route=%2F&device=desktop&source=site-studio-preview&studioSite=advisor-client-site&persona=service+client+evaluating+fit+and+proof&journeyStage=consideration-to-decision
```

The public preview renderer now reads `studioSite` and `source` from the URL. The technical renderer source remains `fixture-public-renderer`; the URL source is stored separately as `reviewSource` so review provenance does not blur the provider boundary.

The mobile inspection card receives the mobile version of the same review URL, including `device=mobile`, `studioSite`, `persona`, `journeyStage`, and `source=site-studio-preview`.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.
