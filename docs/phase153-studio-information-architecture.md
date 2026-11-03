# Phase 153: Studio Information Architecture

Command:

```bash
npm run kinflo:validate-studio-information-architecture
```

## Change

Build is the persistent operator sidebar parent for site construction. Its primary Site setup destination contains two lifecycle sections:

- Configuration: profiles and approvals
- Handoff: permissions and delivery

Launch is the next top-level operator parent for the release path. Its sections are Preview, Readiness, and Domains; this keeps public review and release gates out of the Build lifecycle.

The existing `studioLane`, `studioStage`, and related deep-link parameters remain the routing contract. The prior horizontal lane rail is now a non-interactive context summary. `site-studio` remains a supported route, but it is presented as **Build a site** under the Build parent so site construction does not compete with its own top-level navigation lane.

## Boundaries

- Vanguard tenant and site scope remain unchanged.
- Existing Site Studio deep links remain supported.
- Read-only and disabled live-action behavior remains unchanged.
- No hosted Convex deployment, codegen, provider call, configuration change, mutation, upload, communication, or data change is performed.

## Validation

Run `npm run kinflo:validate-studio-information-architecture` plus the repository's local type and rendered checks. Review the Studio route at desktop, mid-width, and 390px mobile widths for one sidebar hierarchy, no duplicate horizontal navigation, preserved scope, and no horizontal overflow.
