# Julie's Family Learning Program Website (Powered by Kinflo)

## Overview
Julie's Family Learning Program website is a non-profit, full-stack web application showcasing educational programs, impact, testimonials, and events. It facilitates donations and volunteering. The project serves as a demonstration platform for **Kinflo**, a relationship-first CRM for nonprofits, highlighting its capabilities in persona-based personalization, lead management, and communication automation. 

**Multi-Tenant SaaS Platform**: The system has been transformed into a multi-tenant SaaS platform enabling rapid deployment of customized demo sites for multiple nonprofits. Each organization operates in complete isolation with:
- **Custom Domain Support**: Organizations can use their own domains (e.g., donate.redcross.org) verified through DNS
- **Cross-Organization Access**: Consultants can access multiple organizations with different role permissions
- **Shared Template Library**: Common templates available across all organizations
- **Secure Domain Detection**: Host header validation prevents tenant spoofing attacks
- **Dual Provisioning Workflows**: Supports both self-service signup and manual admin provisioning

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend uses React 18, TypeScript, and Vite, styled with Tailwind CSS, custom CSS variables, and shadcn/ui (New York style). It supports light/dark modes and WCAG AA compliant colors. Typography uses Playfair Display for headlines and Inter for body text. The design is responsive, with dynamic, data-driven navigation.

### Technical Implementations
The frontend is a single-page application using `wouter` for routing and TanStack Query for server state management. Features a reusable `ContentCarousel` component (Embla Carousel) for consistent carousel UX across content types. Key features include:
-   **Persona-Based Personalization**: Tailors content for 6 user personas.
-   **Passion-Based Content Personalization**: Filters and ranks content based on user interests.
-   **Admin Preview Mode**: Allows administrators to preview the site from different persona and funnel stage perspectives, including A/B test variants, with consolidated admin controls.
-   **Content Management System (CMS)**: Features hybrid image management (Cloudinary, object storage with AI naming) and universal content visibility controls.
-   **Persona×Journey Matrix Grid**: A visual interface for configuring content visibility across 120 permutations.
-   **A/B Testing System**: A production-ready, configuration-based platform for testing presentation overrides, with auto-derived baseline reference from target audience selections.
-   **Automated A/B Testing System**: AI-driven automation framework for content optimization using Google Gemini, including metric weight profiles, automation rules, and Bayesian statistical significance.
-   **User Management System**: Admin interface for user accounts, roles (two-tier RBAC), audit logging, and program entitlements management. Features mobile-friendly user search with keyboard navigation and fuzzy search for impersonation flows.
-   **Admin Impersonation System**: Production-ready user impersonation with full context-switching middleware, session tracking, and visual indicators. Allows admins to preview the site as any user for troubleshooting while maintaining admin permissions.
-   **Authenticated Donation System with Saved Payment Methods**: Secure payment processing via Stripe.
-   **Email Automation System**: Transactional email delivery via SendGrid with AI-powered copywriting.
-   **SMS Notification System**: Twilio-based template messaging with persona targeting and AI-powered copywriting.
-   **CRM Components**: Lead capture, Admin Dashboard for lead management (with status filtering), communication timeline, task management, pipeline management, AI copy generation, and bulk lead import.
-   **Google Calendar Integration**: OAuth-authenticated integration for scheduling and event registration.
-   **Volunteer Enrollment Tracking System**: Comprehensive system for managing volunteer activities.
-   **Lead-Level Email Engagement Tracking**: Displays email analytics per lead.
-   **Scheduled Email Reports**: Automated recurring email reporting system with full CRUD management via an admin UI.
-   **Advanced Segmentation System**: Dynamic audience targeting with flexible JSONB filter criteria, visual filter builder, and live preview with lead counts.
-   **Email Unsubscribe Management**: CAN-SPAM compliant unsubscribe tracking with HMAC-secured tokens.
-   **SMS Unsubscribe Management (TCPA Compliance)**: Multi-channel opt-out system supporting SMS, email, and cross-channel unsubscribes, including Twilio webhook handling.
-   **Hormozi Template Library ($100M Leads Integration)**: Production-ready template library incorporating Alex Hormozi's cold outreach frameworks adapted for nonprofit context, including 36 templates with comprehensive variable support and built-in compliance.
-   **Lead Status Filtering System**: Four-status engagement tracking system (Active, Nurture, Disqualified, Unresponsive) with inline editing, color-coded badges, and type-safe schema validation.
-   **Bulk SMS Campaign System**: Comprehensive bulk messaging platform with persona×funnel stage targeting, recipient preview with exact counts (NOT EXISTS optimization), async campaign processing with 1 msg/sec rate limiting (50 msgs/min), snapshot-based race condition protection, and campaign history tracking with real-time metrics (total, sent, pending, failed).
-   **Hybrid Card Reordering System**: Three-method content reordering interface providing drag-and-drop (keyboard-accessible DnD), arrow buttons (mobile-friendly single-position moves), and jump-to-position dropdown (power user direct positioning). Features transactional batch updates with CASE-based SQL, optimistic UI updates with automatic rollback, and loading states to prevent concurrent mutations.
-   **Student Projects Carousel with Passion Badges**: Passion-filtered carousel showcasing student work to donors via complete passion-based personalization. Features OIDC passions persistence (`server/storage.ts` upsertUser), PersonaContext integration (transforms `user.passions` string[] to PassionOption[]), and visual passion badges on project cards displaying readable labels (e.g., "Nutrition", "Literacy"). Backend persists passions from OIDC claims; frontend normalizes and filters matching badges for display via `StudentProjectsCarousel` component.

### System Design Choices
The backend uses Express.js on Node.js with TypeScript, exposing RESTful API endpoints. Data is stored in PostgreSQL (Neon serverless) via Drizzle ORM. Authentication and authorization are managed by Replit Auth with OpenID Connect (Passport.js) and PostgreSQL for session storage, implementing a **two-tier RBAC system** with audit logging:

**Two-Tier Role-Based Access Control (RBAC)**:
- **Platform-Level Roles** (`users.role` column): Controls access across the entire KinFlo platform
  - `client`: Regular user with no platform-level privileges
  - `admin`: DEPRECATED - use organization-level roles instead
  - `kinflo_admin`: **KinFlo Platform Super Admin** - Can manage all organizations, switch between organizations via session override, access platform-wide features
- **Organization-Level Roles** (`organization_users.role` column): Controls access within a specific organization (e.g., Julie's Family Learning Program)
  - `viewer`: Read-only access to organization data
  - `editor`: Can create and edit content within the organization
  - `org_admin`: **Organization Super Admin** - Full control within their organization (manages leads, campaigns, users, content, settings)
  - `owner`: Primary owner of the organization

**Organization Switching for KinFlo Admins**: Users with `kinflo_admin` role can override the detected organization via session (`req.session.organizationIdOverride`). The `detectOrganization` middleware checks for this override FIRST before hostname-based detection, enabling platform admins to preview and manage any organization. Session override persists across requests until explicitly cleared.

The application incorporates Helmet Security Headers, a five-tier rate limiting system, centralized audit logging, Zod schema-based field validation, error sanitization, and secure session management.

**Multi-Tenant Architecture**: 
- **Database Schema**: Added nullable `organizationId` column to existing tables for tenant isolation. Created 4 new multi-tenant tables: `organizations`, `organization_users` (many-to-many with role support), `custom_domains` (DNS-verified custom domains), and `shared_templates` (cross-organization template sharing).
- **Domain Detection Middleware** (`server/orgMiddleware.ts`): Detects organization from custom verified domains or defaults to org ID 1 for trusted Replit domains. Host header validation prevents tenant spoofing.
- **Organization-Scoped Storage** (`server/orgScopedStorage.ts`): JavaScript Proxy-based wrapper that intercepts IStorage method calls and enforces tenant isolation. Methods are classified as: global (user/org operations), implemented org-scoped (tenant-isolated), or unimplemented (throw security errors). Startup validation logs coverage statistics. Middleware (`server/orgStorageMiddleware.ts`) attaches org-scoped storage instance to each request via `req.storage`.
  - **Implemented Org-Scoped Resources**: Leads, Content Items, Email Templates & Campaigns, SMS Templates & Campaigns, Segments, Donations, Image Assets, Volunteer Events/Enrollments/Shifts/Sessions, Lead Assignments, Outreach Emails, Campaign Members, Scheduled Reports, Communication Logs, Email Tracking, Interactions.
  - **Complete Route Migration (Nov 15, 2024)**: Migrated all 509 storage references in `server/routes.ts` from global `storage` to request-scoped `req.storage`. All helper functions and services now require injected `IStorage` parameter. Architect-approved: tenant isolation secure for all user-facing HTTP routes.
- **Background Scheduler Security (Phase 2 - Nov 15, 2024)**: All 4 background schedulers refactored to process each organization independently with org-scoped storage:
  - **emailReportScheduler**: Loops through all orgs, creates org-scoped storage per iteration, generates and sends reports with org-specific data
  - **donorLifecycleScheduler**: Loops through all orgs, processes donor lifecycle transitions independently, errors in one org don't affect others
  - **emailCampaignProcessor**: Loops through all orgs, processes email sequences with comprehensive organizationId validation on all database queries (enrollments, sequence steps, leads, campaigns). Methods `enrollLead` and `unenrollLead` validate lead, campaign, and enrollment organizationId before any mutations
  - **backupScheduler**: Loops through all orgs, creates isolated backups using org-scoped storage per iteration
  - **Security Pattern**: Each scheduler uses `createOrgStorage(storage, org.id)` to create isolated storage instance. All database queries include explicit organizationId validation to prevent cross-tenant access
- **Tenant Isolation Testing**: 
  - Manual HTTP route test (`tests/tenant-isolation.test.ts`): Verifies isolation across 6 critical resource types via user-facing routes
  - Multi-tenant scheduler test (`tests/scheduler-multi-tenant.test.ts`): Verifies all 4 schedulers process orgs independently with NO cross-tenant enrollments, NO cross-tenant donations, reports scoped per org, backups scoped per org
- **Documentation**: Comprehensive multi-tenant architecture guide (`docs/multi-tenant-architecture.md`) covering implementation patterns, high-risk areas (schedulers, webhooks, impersonation), data migration strategy, testing approach, and troubleshooting. Future refinement planned using verification-first methodology with traceability matrix.
- **Security Approach**: Hostname normalization, trusted domain validation, DNS verification for custom domains, request-scoped storage enforcement, Proxy-based hard enforcement prevents cross-tenant data leakage through HTTP routes and background schedulers.
- **Critical Bug Fixes (Nov 17, 2024)**:
  - **Drizzle ORM Multi-Where Bug**: Fixed severe tenant isolation breach where multiple `.where()` calls caused the second call to replace the first, removing organizationId filters. Solution: Combined all WHERE conditions into a single `and()` call in all org-scoped queries.
  - **Content Visibility Data Migration**: Migrated 382 `content_visibility` rows to set organization_id='1' (previously NULL), fixing hero content not appearing after tenant isolation fix.
  - **A/B Testing Data Migration**: Migrated all A/B testing tables to set organization_id from parent tables:
    - `ab_test_targets`: 7 rows migrated (inherit from ab_tests)
    - `ab_test_variants`: 6 rows migrated (inherit from ab_tests)
    - `ab_test_events`: 964 rows migrated (inherit from ab_tests)
    - `ab_test_automation_runs`: 0 rows migrated (inherit from automation_rules)
    - Result: A/B testing functionality fully restored in Admin Preview Mode

**Content Visibility Architecture**: The system uses a persona×funnel stage matrix (6 personas × 4 stages = 24 combinations) for granular content control. The `buildVisibilityQuery` method in `server/storage.ts` conditionally applies persona/funnelStage filters only when explicitly provided, returning all active visible content without restrictions when undefined.

## External Dependencies

-   **UI Framework & Components**: Radix UI, shadcn/ui, Lucide React
-   **Data Fetching & State Management**: TanStack Query
-   **Database & ORM**: Drizzle ORM, @neondatabase/serverless, connect-pg-simple
-   **Replit-Specific Tools**: @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner
-   **Fonts & Typography**: Google Fonts (Playfair Display, Inter)
-   **Utility Libraries & Services**: date-fns, nanoid, zod, Uppy, Cloudinary, Google Places API, react-lite-youtube-embed, Google Gemini AI API, Stripe, SendGrid, Twilio