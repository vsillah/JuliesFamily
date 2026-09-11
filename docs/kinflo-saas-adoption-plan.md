# KinFlo SaaS Adoption Plan

## Current Source Assessment

Inspected source: `vsillah/JuliesFamily`, cloned read-only to `/tmp/juliesfamily-inspect` on June 30, 2026.

Local workspace status: `/Users/vambahsillah/Documents/KinFlo CRM` now contains the Julie's Family source on branch `codex/kinflo-phase-0-convex-plan`. `excalidraw.log` remains an unrelated untracked local file.

The Julie's Family repository is already a feature-rich React/Vite + Express app, not a simple website. It includes:

- Public website pages for programs, donations, campaigns, volunteer/student flows, and persona-driven content.
- Admin pages for CRM, content management, image library, A/B testing, automations, analytics, email/SMS campaigns, segments, roles, entitlements, backups, and impersonation.
- A Drizzle/Postgres schema with roughly 60 tables across users, organizations, leads, campaigns, communications, content, A/B tests, donations, programs, volunteers, Tech Goes Home, entitlements, and audit/backup records.
- Auth0/OIDC auth with session storage, RBAC roles, admin/super admin gates, and impersonation.
- Stripe donation/payment routes, SendGrid, Twilio, Google Sheets/Calendar, Cloudinary, and object storage adapters.
- Existing KinFlo generated assets under `attached_assets/generated_images`.

Important risk: `.env.local` is tracked in the source repository. Before production work, treat it as potentially compromised, avoid opening or echoing it, purge it from git history if needed, and rotate any real credentials it may contain.

## Product Direction

KinFlo should become a multi-tenant website and client operations system, not a Julie-specific fork.

The product should have five layers:

1. **Platform control plane**
   Super admin creates clients, sites, domains, templates, billing plans, integrations, and permission policies.

2. **Tenant admin shell**
   Client admins manage their own content, leads, campaigns, media, team members, and automations inside the boundaries Vambah grants.

3. **Public site renderer**
   Each client gets one or more polished public websites generated from the same underlying content, theme, navigation, and page/block model.

4. **Shared CRM and growth engine**
   Leads, personas, journeys, campaign tracking, email/SMS, A/B testing, forms, attribution, and AI copy become reusable modules instead of Julie-specific pages.

5. **Design system and template library**
   The Apple-grade quality bar lives here: typography, spacing, motion, imagery, accessibility, conversion patterns, and domain-specific templates.

## Recommended Stack

### Backend

Use **Convex** as the canonical application data layer for tenants, sites, content, leads, permissions, audit events, and workflow state.

Keep the first migration provider-light: define Convex schemas, guards, indexes, and seed scripts before moving every feature. Convex function guards should replace Postgres/RLS-style assumptions. Every document that is client-scoped needs `tenantId`; every website-scoped record needs `siteId`.

### Auth

Recommendation: start with **Convex Auth** if cost control and owned simplicity matter most.

Use Clerk only if the first commercial customers require richer B2B org management, SSO, enterprise identity controls, or polished invite flows faster than we can build them. Clerk is a speed tool, but it can become another SaaS cost surface.

### Payments

Use **Stripe Billing** for KinFlo subscription plans.

Use **Stripe Connect** only when client sites need to collect their own payments, donations, deposits, or event fees under client-owned accounts. Keep this separate from Vambah's KinFlo subscription billing.

### Storage

Use a hybrid model:

- Convex stores metadata, permissions, generated content state, version history, and small/private app assets where appropriate.
- Cloudflare R2 or S3-compatible storage holds large public media, PDFs, videos, exports, and client asset libraries.
- Cloudinary can remain in phase 1 for image optimization until the media pipeline is stabilized.

Convex should be the source of truth for what an asset is, who can use it, where it appears, and whether it is approved. Object storage should hold the binary files.

### Frontend

Fastest path: keep React/Vite for the first control-plane shell because the current app is already built around it.

Best long-term path: split public website rendering into a Next.js app once the site/page model stabilizes, so client sites get better metadata, routing, SEO, previews, and custom-domain behavior. Avoid a Next.js rewrite before the tenancy model is clear.

## Core Data Model For The First Shell

These are the minimum concepts to make the product configurable:

- `tenants`: client organizations.
- `sites`: individual public websites under a tenant.
- `domains`: custom domains, subdomains, verification state, SSL status.
- `memberships`: user to tenant/site membership.
- `roles`: platform, tenant, and site-level permissions.
- `invitations`: pending team invites and onboarding state.
- `themeTokens`: colors, typography, radius, spacing, button style, image treatment.
- `navigationItems`: per-site nav and footer structure.
- `pages`: route, title, SEO metadata, visibility, publish state.
- `contentBlocks`: hero, services, events, testimonials, lead magnets, forms, dashboards, campaign sections.
- `personas`: audience segments per site.
- `journeyStages`: awareness, consideration, decision, retention, or client-specific equivalents.
- `assets`: media metadata, source path, approved usage, alt text, license/provenance.
- `leads`: site-scoped CRM contacts.
- `campaigns`: site-scoped email/SMS/donation/growth campaigns.
- `featureFlags`: module access by tenant/site/tier.
- `auditEvents`: every permission, publish, billing, and destructive admin action.

## Phase Plan

### Phase 0: Intake, Safety, And Source Freeze

Goal: make the source usable outside Replit without carrying hidden risk.

Work:

- Clone `vsillah/JuliesFamily` into a real KinFlo working tree.
- Confirm current branch, remotes, and dirty state.
- Run dependency install, typecheck, and build.
- Inventory all env vars without printing secrets.
- Remove or quarantine tracked `.env.local`; rotate any real exposed credentials.
- Create a migration map from Drizzle tables to Convex collections.
- Mark Julie-specific content, reusable KinFlo product modules, and dead/demo code.

Gate:

- Local build status known.
- Secret exposure risk documented.
- Migration inventory committed as docs only.
- Local phase readiness can be checked with `npm run kinflo:validate-phases`.
- Migration-map coverage can be checked with `npm run kinflo:validate-map`.

### Phase 1: Multi-Tenant Control Plane Shell

Goal: get Vambah the core shell as soon as possible.

Work:

- Add Convex project scaffold and schema for tenants, sites, memberships, roles, theme tokens, pages, content blocks, assets, and audit events.
- Add auth and user identity mapping.
- Build a super admin console with:
  - create tenant,
  - create site,
  - assign owner/admin/editor,
  - switch active site,
  - edit theme basics,
  - manage publish status,
  - view audit trail.
- Add permission guard helpers for platform, tenant, and site access.
- Keep Julie content as one seeded tenant/site, not as hardcoded global content.

Gate:

- Super admin can create a second site locally.
- Client admin can only see assigned site data.
- No public renderer needed yet beyond a preview stub.

### Phase 2: Configurable Public Site Renderer

Goal: turn site configuration into a live website experience.

Work:

- Convert existing content manager concepts into reusable `pages` and `contentBlocks`.
- Build draft, preview, publish, and rollback states.
- Add a public route resolver by subdomain/path first, custom domains later.
- Build template families:
  - nonprofit learning center,
  - advisor/consultant,
  - local service provider,
  - cohort/program landing page,
  - donation/campaign microsite.
- Add theme editor for brand, type, buttons, media style, and section rhythm.
- Create one Apple-grade design concept pass before implementation of the public renderer.

Gate:

- A seeded Julie site and a seeded KinFlo demo site render from the same data model.
- Site admin can update homepage copy, nav, theme, and one program page without code.

### Phase 3: CRM And Content Migration

Goal: move the most reusable business value from the existing app into Convex.

Work:

- Migrate leads, interactions, pipeline stages, tasks, assignments, content items, visibility matrix, lead magnets, images, programs, and admin preferences.
- Replace REST endpoints with Convex queries/mutations module by module.
- Keep data access scoped by `tenantId` and `siteId`.
- Add import/export scripts for the current Postgres/Drizzle data.
- Add focused tests for guards, visibility resolution, and content publish behavior.

Gate:

- Admin can capture a lead from a public form and see it in the tenant CRM.
- Persona/journey content selection works per site.
- Cross-tenant reads fail in tests.

### Phase 4: Communications, Automation, And AI

Goal: bring the growth engine back after the shell is stable.

Work:

- Rebuild email/SMS templates, campaign enrollments, logs, unsubscribes, and tracking around site-scoped campaigns.
- Reconnect SendGrid/Twilio through explicit per-tenant integration settings.
- Move AI copy generation behind review and approval gates.
- Reintroduce A/B tests, automation safety limits, metric profiles, and winner promotion after analytics events are tenant-safe.
- Add provenance for generated content: prompt, source inputs, reviewer, approval state, and publish target.

Gate:

- A tenant can draft and approve a campaign without leaking another tenant's leads, templates, assets, or analytics.

### Phase 5: Billing, Plans, And Entitlements

Goal: make KinFlo commercially manageable.

Work:

- Add Stripe Billing for KinFlo subscriptions.
- Map plans to feature gates: number of sites, admins, contacts, campaigns, AI credits, custom domains, and automations.
- Add platform billing dashboard.
- Keep Stripe Connect as a later module for client-owned payments/donations.
- Preserve manual override entitlements for early customers and pilots.

Gate:

- Vambah can create a client on a plan, override features manually, and see billing/entitlement state in the super admin console.

### Phase 6: Site Factory And Client Onboarding

Goal: make new client sites repeatable.

Work:

- Build site creation wizard:
  - select template,
  - upload logo/assets,
  - set brand tokens,
  - choose pages,
  - create admin invite,
  - configure domain later.
- Add starter content packs per client type.
- Add domain verification and deployment checklist.
- Add onboarding tasks and client readiness scoring.
- Add exportable client launch packet.

Gate:

- A new client site can be created from scratch in under 15 minutes with a preview link and admin invite.

### Phase 7: Apple-Grade Polish And Scale

Goal: make the product feel worthy of serious public presentation.

Work:

- Run a design-system pass across public sites and admin shell.
- Replace Replit-era busy pages with compact operational layouts.
- Add responsive QA, accessibility checks, visual regression screenshots, and performance budgets.
- Move public rendering to Next.js if SEO, metadata, previews, or custom domains require it.
- Add template-specific image direction and content quality checks.

Gate:

- Public demo site passes mobile/desktop visual QA.
- Admin shell feels calm, clear, and operational.
- New site launch workflow is repeatable without developer intervention.

## What To Keep Versus Rebuild

Keep:

- Persona and journey-stage personalization model.
- Content visibility matrix.
- CRM lead capture and pipeline concepts.
- Role provisioning, admin impersonation, audit trail concepts.
- A/B test and automation concepts.
- Existing shadcn/Radix component base, after design cleanup.
- Cloudinary image library in the early migration.

Rebuild:

- Data layer from Drizzle/Postgres to Convex.
- Auth/session model.
- Tenant/site scoping.
- Payment ownership model.
- Object storage and upload permissions.
- Public site renderer and page/block model.
- Permission checks as Convex function guards.

Pause:

- Full email/SMS automation.
- Advanced analytics and A/B winner automation.
- Stripe Connect for client-owned collections.
- Custom-domain automation.
- Next.js rewrite of the full app.

## First Two-Week Execution Plan

Week 1:

- Create real KinFlo source checkout.
- Harden secrets and environment handling.
- Create Convex schema draft.
- Build site/tenant/membership shell.
- Add super admin site registry.
- Seed Julie as the first tenant/site.

Week 2:

- Build theme editor v1.
- Build public preview route from Convex data.
- Convert hero, services, events, testimonials, and lead magnet blocks.
- Add client admin role and invite flow.
- Smoke test: create second site, customize theme/content, preview public site, submit lead.

## Decision Gates For Vambah

1. Auth: lowest-cost owned path with Convex Auth, or faster B2B polish with Clerk.
2. Public rendering: start with Vite preview and defer Next.js, or pay the rewrite cost earlier for SEO/custom-domain polish.
3. Payments: KinFlo subscriptions only first, or include client donation/payment collection in the first commercial release.
4. Storage: R2/S3 plus Cloudinary optimization, or Convex storage for more asset types.
5. First commercial template: nonprofit/program site, advisor/consultant site, or local service CRM site.

## Recommendation

Start with Phase 1, not a full rewrite.

The shortest path to value is the super admin shell: create clients, create sites, assign permissions, configure theme/content, and preview a public site. That gives KinFlo its product spine. Once the spine exists, Julie's feature-rich app can be pulled into the system module by module instead of becoming a brittle migration.

The first product milestone should be:

> Vambah can create a client website from the admin shell, assign a client admin, configure the look and core content, preview it, and capture a lead into that site's CRM.

That is the smallest version of the real SaaS.
