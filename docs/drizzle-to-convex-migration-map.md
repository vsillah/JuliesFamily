# Drizzle To Convex Migration Map

Source of truth inspected: `shared/schema.ts`, `server/storage.ts`, `server/routes.ts`, and the existing Drizzle migrations.

Target architecture: Convex becomes the canonical application data layer for the KinFlo SaaS control plane, tenant/site configuration, CRM, content, permissions, audit events, and workflow state. Public media binaries should remain in object storage or Cloudinary/R2/S3, with Convex holding metadata, permissions, provenance, and publish state.

## Migration Rules

Every migrated collection needs an explicit scope:

- `platform`: visible only to Vambah/super admins.
- `tenant`: scoped to a client organization.
- `site`: scoped to one public website/microsite.
- `user`: scoped to one authenticated user.
- `public`: readable through published site queries only.

Every tenant-scoped document should include:

- `tenantId`
- `createdAt`
- `updatedAt`
- `createdBy`
- optional `archivedAt`

Every site-scoped document should also include:

- `siteId`
- `status`: `draft`, `published`, `archived`, or module-specific equivalent.

Convex function guards should enforce access. Do not assume client-side filtering is sufficient.

## New Control Plane Collections

These collections do not exist cleanly in the Drizzle model and should be created first.

| Convex collection | Scope | Purpose | Phase |
| --- | --- | --- | --- |
| `tenants` | platform | Client organizations/accounts. Replaces and expands `organizations`. | 1 |
| `sites` | tenant | Individual websites or subwebsites under a tenant. | 1 |
| `domains` | site | Custom domains, subdomains, verification, SSL state. | 2 or 6 |
| `memberships` | tenant/site | User membership, role, invitation state, and active site access. | 1 |
| `roles` | platform | Role definitions and permission bundles. | 1 |
| `invitations` | tenant/site | Invite tokens, invited email, invited role, expiry, accepted state. | 1 |
| `themeTokens` | site | Brand colors, typography, radius, spacing, media style, button style. | 1 |
| `navigationItems` | site | Header/footer nav tree and ordering. | 2 |
| `featureFlags` | tenant/site | Entitlements and module access. | 1 and 5 |
| `publishEvents` | site | Publish history, rollback pointers, actor, diff summary. | 2 |
| `integrationSettings` | tenant/site | SendGrid, Twilio, Stripe, Cloudinary/R2, Google config metadata. Secrets stay in provider env/secret stores. | 4 and 5 |

## Existing Table Mapping

### Identity, Access, And Platform Control

| Drizzle table | Target Convex collection | Scope | Phase | Notes |
| --- | --- | --- | --- | --- |
| `sessions` | none or auth-managed | user | 1 | Replace Postgres session table with Convex Auth/Auth provider session model. |
| `users` | `users` | user/platform | 1 | Keep identity profile, OIDC/Auth subject, persona preference, and platform role. Move tenant/site access to `memberships`. |
| `organizations` | `tenants` | platform | 1 | Expand from tier-only organization to full client account record. |
| `adminPreferences` | `adminPreferences` | user + tenant/site | 3 | Add `tenantId` and optional `siteId`; keep UI density/default landing choices. |
| `auditLogs` | `auditEvents` | tenant/site/platform | 1 | Expand to include resource type/id, before/after summary, IP/user-agent when available, and tenant/site scope. |
| `adminEntitlements` | `featureFlags` or `manualEntitlements` | tenant/user/site | 1 and 5 | Keep manual override ability for pilots and early customers. |
| `adminImpersonationSessions` | `impersonationSessions` | platform/tenant | 3 | Preserve audit trail and active-session guard. |

### Site, Content, Personalization, And Public Rendering

| Drizzle table | Target Convex collection | Scope | Phase | Notes |
| --- | --- | --- | --- | --- |
| `contentItems` | `contentBlocks` | site | 2 | Add `siteId`, page placement, block type, draft/published versions, and provenance. |
| `contentVisibility` | `contentVisibilityRules` | site | 2 | Preserve persona x journey-stage visibility and overrides. Add `siteId`. |
| `leadMagnets` | `leadMagnets` or `contentBlocks` | site | 2 | Could be a block subtype if download/form behavior is simple. |
| `imageAssets` | `assets` | tenant/site | 2 | Convex stores metadata, alt text, provenance, usage, and approval state; binary remains Cloudinary/R2/S3. |
| `googleReviews` | `reviews` | site | 3 | Keep source, rating, visibility, sync status, and display rules. |
| `programs` | `programs` | site | 2 | Generalize from Julie-specific program provisioning to site-specific offerings. |
| `wishlistItems` | `wishlistItems` or campaign block metadata | site | 5 | Keep if donation/campaign templates need wishlist support. |

New page model:

| New collection | Scope | Phase | Notes |
| --- | --- | --- | --- |
| `pages` | site | 2 | Route, title, SEO, status, template, and ordered block refs. |
| `pageRevisions` | site | 2 | Versioned page snapshots for preview, rollback, and approval. |
| `siteTemplates` | platform | 2 and 6 | Reusable template packages: nonprofit, advisor, local service, cohort/program, campaign microsite. |
| `starterContentPacks` | platform | 6 | Seed content for client onboarding. |

### CRM, Leads, Pipeline, And Tasks

| Drizzle table | Target Convex collection | Scope | Phase | Notes |
| --- | --- | --- | --- | --- |
| `leads` | `leads` | site | 3 | Add `tenantId`, `siteId`, source form/page, consent, and owner assignment. |
| `interactions` | `leadEvents` | site | 3 | Generalize to timeline events across forms, downloads, calls, emails, SMS, donations, and page activity. |
| `pipelineStages` | `pipelineStages` | tenant/site | 3 | Allow tenant defaults with site overrides. |
| `leadAssignments` | `leadAssignments` | site | 3 | Keep assigned user and assignment reason. |
| `tasks` | `tasks` | tenant/site/user | 3 | Add site scope and due-date/status indexes. |
| `pipelineHistory` | `pipelineEvents` | site | 3 | Convert to append-only timeline events. |
| `funnelProgressionRules` | `journeyProgressionRules` | site | 3 or 4 | Rename around journey stages, not only funnel. |
| `funnelProgressionHistory` | `journeyProgressionEvents` | site | 3 or 4 | Append-only progression trail. |
| `segments` | `segments` | tenant/site | 4 | Store segment definitions and evaluation snapshots. |

### A/B Testing, Analytics, And Automation

| Drizzle table | Target Convex collection | Scope | Phase | Notes |
| --- | --- | --- | --- | --- |
| `abTests` | `experiments` | site | 4 | Keep status, type, allocation, priority, winner. |
| `abTestTargets` | `experimentTargets` | site | 4 | Persona/journey targeting. |
| `abTestVariants` | `experimentVariants` | site | 4 | Store presentation overrides and linked block/page refs. |
| `abTestAssignments` | `experimentAssignments` | site/public visitor | 4 | Use visitor id or user id; index by test + visitor. |
| `abTestEvents` | `experimentEvents` | site/public visitor | 4 | Consider event retention/rollup strategy to control Convex cost. |
| `metricWeightProfiles` | `metricProfiles` | tenant/site | 4 | Keep profile-level config. |
| `metricWeightProfileMetrics` | embedded in `metricProfiles` | tenant/site | 4 | Embed unless independent querying is needed. |
| `abTestAutomationRules` | `automationRules` | site | 4 | Add review/approval gate before promotion. |
| `abTestAutomationRuleMetrics` | embedded in `automationRules` | site | 4 | Embed metric configs. |
| `abTestPerformanceBaselines` | `performanceBaselines` | site | 4 | Keep rollups; avoid high-cardinality raw event reads. |
| `abTestVariantAiGenerations` | `aiGenerationRecords` | site | 4 | Preserve prompt, source, model, reviewer, approval state. |
| `abTestAutomationRuns` | `automationRuns` | site | 4 | Append-only run state and logs. |
| `abTestSafetyLimits` | `automationSafetyLimits` | tenant/site | 4 | Required before automated winner promotion. |

### Communications

| Drizzle table | Target Convex collection | Scope | Phase | Notes |
| --- | --- | --- | --- | --- |
| `emailTemplates` | `emailTemplates` | tenant/site | 4 | Add approval state, owner, source, persona/journey targeting. |
| `aiCopyGenerations` | `aiGenerationRecords` | tenant/site | 4 | Unify with experiment AI generations where possible. |
| `emailCampaigns` | `emailCampaigns` | site | 4 | Site-scoped campaign state. |
| `emailSequenceSteps` | `emailSequenceSteps` | site | 4 | Could be embedded under campaign for simple sequences. |
| `emailCampaignEnrollments` | `emailEnrollments` | site | 4 | Lead-to-campaign state. |
| `emailLogs` | `emailLogs` | site | 4 | Delivery log. Consider rollup indexes for campaign analytics. |
| `emailOpens` | `emailOpenEvents` | site | 4 | High-volume; define retention/rollups before launch. |
| `emailLinks` | `emailLinks` | site | 4 | Token to destination mapping. |
| `emailClicks` | `emailClickEvents` | site | 4 | High-volume; define retention/rollups before launch. |
| `emailSendTimeInsights` | `emailSendTimeInsights` | tenant/site | 4 | Derived analytics. |
| `emailReportSchedules` | `reportSchedules` | tenant/site | 4 | Generalize report schedules. |
| `smsTemplates` | `smsTemplates` | tenant/site | 4 | Same approval and targeting model as email. |
| `smsSends` | `smsLogs` | site | 4 | Delivery log. |
| `smsBulkCampaigns` | `smsCampaigns` | site | 4 | Align with `emailCampaigns` if possible. |
| `smsLogs` | `smsLogs` | site | 4 | Merge or de-duplicate with `smsSends`. |
| `communicationLogs` | `communicationEvents` | site | 4 | General timeline event model. |
| `emailUnsubscribes` | `unsubscribes` | tenant/site/global | 4 | Preserve global unsubscribe and channel-specific consent. |

### Donations, Campaigns, And Payments

| Drizzle table | Target Convex collection | Scope | Phase | Notes |
| --- | --- | --- | --- | --- |
| `donations` | `donations` | site | 5 | Only migrate after Stripe ownership model is decided. |
| `donationCampaigns` | `fundraisingCampaigns` | site | 5 | Public campaign pages can be site templates. |
| `campaignCommunications` | `campaignCommunications` | site | 5 | Could merge into communication events. |
| `campaignMembers` | `campaignMembers` | site | 5 | Keep for ambassador/member campaign flows. |
| `campaignTestimonials` | `campaignTestimonials` | site | 5 | Could become content blocks/reviews. |

New billing collections:

| New collection | Scope | Phase | Notes |
| --- | --- | --- | --- |
| `billingPlans` | platform | 5 | Provider-light KinFlo plan catalog; Stripe price IDs attach only after billing setup. |
| `tenantEntitlements` | tenant | 5 | Manual override entitlement state for founding customers and pilots before Stripe subscription sync. |
| `billingCustomers` | tenant | 5 | Stripe customer/subscription references for KinFlo plans. |
| `subscriptions` | tenant | 5 | Plan, status, renewal, entitlement snapshot. |
| `usageCounters` | tenant/site | 5 | Contacts, sites, admins, campaigns, AI credits, storage. |
| `connectedAccounts` | tenant/site | 5+ | Stripe Connect accounts only if clients collect money. |

### Lead Sourcing, Attribution, And Economics

| Drizzle table | Target Convex collection | Scope | Phase | Notes |
| --- | --- | --- | --- | --- |
| `outreachEmails` | `outreachDrafts` | site | 4 | Keep review state before sending. |
| `icpCriteria` | `icpProfiles` | tenant/site | 4 | Criteria per template/client. |
| `acquisitionChannels` | `acquisitionChannels` | tenant/site | 4 | Reusable marketing channel catalog. |
| `marketingCampaigns` | `marketingCampaigns` | site | 4 | Align with email/SMS/fundraising campaigns where possible. |
| `leadAttribution` | `leadAttribution` | site | 4 | Attach to leads and campaigns. |
| `donorLifecycleStages` | `lifecycleStages` | site | 4 | Generalize beyond donors. |
| `channelSpendLedger` | `spendLedger` | tenant/site | 4 | Keep append-only. |
| `donorEconomics` | `economicsSnapshots` | site | 4 | Derived metrics. |
| `economicsSettings` | `economicsSettings` | tenant/site | 4 | Config for CAC/LTGP calculations. |

### Program-Specific Julie Modules

| Drizzle table | Target Convex collection | Scope | Phase | Notes |
| --- | --- | --- | --- | --- |
| `techGoesHomeEnrollments` | `programEnrollments` | site | 3 or client template | Convert to generic enrollment with template-specific fields. |
| `techGoesHomeAttendance` | `programAttendance` | site | 3 or client template | Tie to generic program sessions. |
| `volunteerEvents` | `volunteerOpportunities` | site | 3 or client template | Keep as optional module. |
| `volunteerShifts` | `volunteerShifts` | site | 3 or client template | Optional module. |
| `volunteerEnrollments` | `volunteerEnrollments` | site | 3 or client template | Optional module. |
| `volunteerSessionLogs` | `volunteerSessionLogs` | site | 3 or client template | Optional module. |

### Backups, Chatbot, And Operational Tools

| Drizzle table | Target Convex collection | Scope | Phase | Notes |
| --- | --- | --- | --- | --- |
| `backupSnapshots` | `backupSnapshots` | tenant/site/platform | later | Convex backup/export model differs; revisit after core data moves. |
| `backupSchedules` | `backupSchedules` | tenant/site/platform | later | Defer until Convex export/restore lane is designed. |
| `chatbotConversations` | `assistantConversations` | tenant/site/user | 4+ | Keep only if admin assistant remains in product. |
| `chatbotIssues` | `assistantIssues` | tenant/site | 4+ | Convert to support/issues workflow if useful. |

## Phase 1 Minimum Schema

Phase 1 should add only the minimum Convex spine needed for the super admin shell.

Required:

- `users`
- `tenants`
- `sites`
- `memberships`
- `roles`
- `invitations`
- `themeTokens`
- `featureFlags`
- `auditEvents`

Optional in Phase 1:

- `assets`, if the first shell includes logo upload.
- `pages`, if the preview stub needs route metadata.
- `contentBlocks`, if homepage copy editing is included in the first shell.

Explicitly out of Phase 1:

- Full CRM lead migration.
- Email/SMS delivery.
- A/B testing.
- Stripe billing.
- Stripe Connect.
- Custom domains.
- Backup/restore.
- Full Next.js renderer.

## Phase 2 Minimum Public Renderer

Required:

- `pages`
- `pageRevisions`
- `contentBlocks`
- `contentVisibilityRules`
- `navigationItems`
- `assets`
- `publishEvents`

The first public renderer should prove two seeded sites from the same model:

- Julie's Family Learning Program as a nonprofit/program template.
- KinFlo demo as a SaaS/advisor template.

## Phase 3 Minimum CRM Migration

Required:

- `leads`
- `leadEvents`
- `pipelineStages`
- `leadAssignments`
- `tasks`
- `pipelineEvents`
- `journeyProgressionRules`
- `journeyProgressionEvents`

First smoke test:

1. Publish a public lead form on a site.
2. Submit a lead as an anonymous visitor.
3. Confirm only that site's admin can see the lead.
4. Confirm another tenant admin cannot query it.

## Guard And Index Requirements

Minimum guards:

- `requirePlatformAdmin`
- `requireTenantMember`
- `requireTenantAdmin`
- `requireSiteMember`
- `requireSiteAdmin`
- `requireFeature`
- `requirePublishedSiteRead`

Minimum indexes:

- `tenants.by_slug`
- `sites.by_tenant`
- `sites.by_slug`
- `sites.by_subdomain`
- `memberships.by_user`
- `memberships.by_tenant_user`
- `memberships.by_site_user`
- `pages.by_site_route`
- `contentBlocks.by_site_type_status`
- `contentVisibilityRules.by_site_persona_stage`
- `leads.by_site_createdAt`
- `leads.by_site_email`
- `leadEvents.by_lead_createdAt`
- `auditEvents.by_scope_createdAt`

## Migration Order

1. Create Convex shell schema, auth identity mapping, and guards.
2. Seed one platform admin, one tenant, and one Julie site.
3. Seed theme, nav, and minimal homepage blocks.
4. Build super admin site registry and active-site switcher.
5. Build site admin theme/content basics.
6. Build public preview route from Convex data.
7. Move CRM lead capture.
8. Move persona/journey content visibility.
9. Move campaigns, communication, analytics, and automation.
10. Add billing and site factory.

## Open Decisions

1. Use Convex Auth first, or use Clerk for faster organization/invite UX.
2. Keep React/Vite public preview initially, or split public renderer to Next.js immediately.
3. Use R2/S3 plus Cloudinary for media, or move more binaries to Convex storage.
4. Make donations/client payments a first commercial feature, or defer to KinFlo subscriptions only.
5. Choose first client template family: nonprofit/program, advisor/consultant, or local service CRM.

## Recommendation

Build the Convex control-plane shell first and keep it independent from the broken Postgres storage layer.

The existing app has valuable product concepts, but it is too type-drifted to make the old storage interface the foundation of the new SaaS. The safest path is to use the old code as a feature library and migration source, while the new Convex modules establish the tenant/site spine cleanly.
