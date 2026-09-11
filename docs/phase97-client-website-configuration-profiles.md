# Phase 97: Client Website Configuration Profiles

Phase 97 adds a provider-light configuration profile surface to Site Studio so the super admin can compare each client site's template, brand, navigation, starter content, admin preset, CRM pipeline, editable review surfaces, locked live surfaces, and next gate before any save, publish, provider, or live Convex action is enabled.

Command:

```bash
npm run kinflo:validate-client-website-configuration-profiles
```

## Added Surface

- Data type: `ShellClientWebsiteConfigurationProfiles`
- Fixture source: `clientWebsiteStudio.configurationProfiles`
- Convex read contract: `siteFactory.listClientWebsiteConfigurationProfiles`
- Admin route: `/admin/kinflo-os?tab=site-studio`
- Site Studio panel: `section-kinflo-client-website-configuration-profiles`
- Summary row: `section-kinflo-client-website-configuration-summary`
- Profile scroll: `section-kinflo-client-website-configuration-scroll`
- Disabled action: `button-client-website-configuration-gated`

## Profile Coverage

- Total profiles: 3
- Ready profiles: 1
- Blocked profiles: 2
- Site keys: `julies-family-public`, `advisor-client-site`, `campaign-microsite`
- Live configuration saves: 0
- Live publishes: 0
- Provider writes: 0
- Live Convex execution: 0

## Why This Matters

The spin-up queue shows the order of work. The configuration profiles show what the site will become before that work is allowed to mutate anything: which template, brand system, navigation pattern, content pack, permission preset, and CRM pipeline are paired with each client website.

This supports the shared-software model Vambah wants: many client websites, different admin permissions, different site experiences, one underlying KinFlo OS.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No brand, navigation, content, CRM, invite, publish, storage, billing, domain, provider, or client-sharing write is performed.

No secret values are read or printed.
