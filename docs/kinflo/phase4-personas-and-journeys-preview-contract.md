# KinFlo Phase 4: Personas and Journeys Preview Contract

This source-only slice makes audience context tenant/site-scoped at the admin and public-preview boundary. It does not activate live audience persistence, allocation, publishing, provider calls, or generated Convex bindings.

## Contract

- Each registered site has its own persona and journey-stage definitions.
- A preview request must carry the tenant slug, site slug, and `previewMode=read_only`.
- A tenant/site mismatch, unknown definition, or inactive definition fails closed.
- Audience context changes presentation only. It never grants access or changes authorization.
- Visibility rules require the same tenant and site. Targeted rules require matching preview context; untargeted rules remain eligible for a valid site preview.
- Julie's definitions remain under the Julie fixture site and are not universal defaults.

## Surfaces

- The KinFlo admin Preview Workbench derives persona and journey selectors from the selected site contract.
- Preview deep links include `studioTenant`, `studioSite`, `persona`, `journeyStage`, `previewMode=read_only`, and `audienceMode=preview_only`.
- The public preview resolves the context against the site contract before evaluating block visibility.
- Invalid context renders a blocked preview state instead of falling back to another tenant's content.

## Validation

```sh
npm run kinflo:test-phase4-personas-journeys
npm run kinflo:validate-phase4-personas-journeys
npm run kinflo:validate-phase2-audience-foundation
npm run kinflo:validate-public-visibility
npm run check
git diff --check
```

Live persistence, audience allocation, experiment activation, publish, Convex codegen, hosted smoke, provider actions, and production configuration remain separate gates.
