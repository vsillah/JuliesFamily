# Phase 117: Client Experience Configuration Presets

Phase 117 adds provider-light client experience presets to the compact Site Studio configuration lane.

Command:

```bash
npm run kinflo:validate-client-experience-configuration-presets
```

## What Changed

- `siteFactory.listClientWebsiteExperienceConfigurationPresets` exposes the read-only Convex query contract.
- `ShellClientWebsiteExperienceConfigurationPreset` records audience, journey stage, layout density, content tone, navigation mode, admin preset, personalization rules, locked controls, and provider gates.
- `snapshot.clientWebsiteStudio.experienceConfigurationPresets` stores local preset packets for Julie Family, the advisor client site, and the campaign microsite.
- `tab-kinflo-client-experience-configuration-preset` adds a compact Experience tab to the configuration detail without extending the page.
- `section-kinflo-client-experience-configuration-preset` keeps personalization rules bounded inside the existing configuration card.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No experience preset apply, configuration save, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The client website shell needs to support more than one visual skin. Each client site should be able to carry a distinct audience, journey, layout density, content tone, navigation mode, and admin permission model while the platform keeps every live operation gated until hosted evidence is approved.
