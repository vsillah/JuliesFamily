# Phase 100: Site Studio Launch Dossier Deep Links

Phase 100 makes the Launch dossier inside Site Studio addressable by URL so the workbench stays compact and review links can open the exact dossier view.

Command:

```bash
npm run kinflo:validate-site-studio-launch-dossier-deep-links
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=site-studio&studioLane=workbench&studioStage=launch`
- Launch dossier query param: `studioDossier`
- Supported dossier views: `provisioning`, `packets`, `qa`, `decision`
- Route reader: `readInitialClientWebsiteLaunchDossier`
- Route-aware selector: `selectClientWebsiteLaunchDossier`
- Controlled dossier tabs: `tabs-kinflo-client-launch-dossier`

## What Changed

The Launch dossier tabs are now controlled by React state seeded from the URL. A direct link such as `/admin/kinflo-os?tab=site-studio&studioLane=workbench&studioStage=launch&studioDossier=qa` opens the QA dossier without forcing a super admin through the provisioning view first.

When a super admin clicks Provision, Packets, QA, or Decision, the shell writes `studioDossier` into the URL and keeps `tab=site-studio`, `studioLane=workbench`, and `studioStage=launch` aligned. Browser back/forward navigation also resyncs the selected dossier view from the current URL.

This reinforces the Phase 86 compact workbench and Phase 99 deep links by making the final dense launch surface navigable as focused views instead of one long vertical review stack.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The super admin shell needs to behave like an operating console for many client websites. Deep-linkable launch dossier views make evidence review, QA, packet handoff, and launch decisions direct without reopening every detail on the same page.
