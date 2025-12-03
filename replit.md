# Julie's Family Learning Program Website (Powered by Kinflo)

## Overview
Julie's Family Learning Program website is a non-profit, full-stack web application demonstrating educational programs, impact, testimonials, events, and facilitating donations and volunteering. It serves as a showcase for **Kinflo**, a relationship-first CRM for nonprofits, emphasizing persona-based personalization, lead management, and communication automation. The project has evolved into a multi-tenant SaaS platform for rapid deployment of customized demo sites, supporting custom domains, cross-organization consultant access, and a shared template library. The business vision is to provide a comprehensive, adaptable platform for nonprofits to manage their online presence and constituent relationships effectively. **Personas provided in the provisioning wizard generate the persona × journey matrix structure and represent different pages on the organization's website.**

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend utilizes React 18, TypeScript, and Vite, styled with Tailwind CSS, custom CSS variables, and shadcn/ui (New York style). It supports light/dark modes and WCAG AA compliant colors, featuring Playfair Display for headlines and Inter for body text. The design is responsive, incorporates dynamic, data-driven navigation, and displays organization names instead of IDs for improved user experience.

### Technical Implementations
The frontend is a single-page application using `wouter` for routing and TanStack Query for server state. Key features include:
-   **Persona-Based Personalization**: Content tailoring for 6 user personas and interest-based filtering.
-   **Admin Preview Mode**: Allows administrators to preview the site from various persona and funnel stage perspectives, including A/B test variants.
-   **Content Management System (CMS)**: Hybrid image management, universal content visibility controls via a Persona×Journey Matrix Grid, and automated content extraction/persona detection during organization provisioning.
-   **A/B Testing System**: Configuration-based platform for presentation overrides, with AI-driven content optimization via Google Gemini.
-   **User Management & Impersonation**: Admin interface for user accounts, two-tier RBAC, audit logging, program entitlements, and user impersonation with full context-switching.
-   **Donation System**: Authenticated donation processing with saved payment methods via Stripe.
-   **Communication Systems**: Email automation via SendGrid and SMS notifications via Twilio, both with AI-powered copywriting.
-   **CRM Components**: Lead capture, an Admin Dashboard for lead management, communication timelines, task/pipeline management, AI copy generation, bulk lead import, and lead-level email engagement tracking.
-   **Integrations**: Google Calendar for scheduling and event registration.
-   **Volunteer Management**: Comprehensive enrollment tracking system.
-   **Reporting & Segmentation**: Scheduled email reports and an advanced segmentation system with dynamic audience targeting.
-   **Unsubscribe Management**: CAN-SPAM and TCPA compliant multi-channel opt-out system.
-   **Hormozi Template Library**: Adapts Alex Hormozi's cold outreach frameworks for nonprofits.
-   **Bulk SMS Campaign System**: Comprehensive platform with persona×funnel stage targeting and async processing.
-   **Content Reordering**: Hybrid system (drag-and-drop, arrow buttons, jump-to) with transactional batch updates.
-   **Student Projects Carousel**: Passion-filtered display of student work with OIDC passions persistence.
-   **Feature Toggle System**: Multi-tenant feature flag platform with an admin UI and client-side hooks.
-   **Organization Management System**: Full CRUD operations for organizations, including a comprehensive provisioning wizard with automated website content extraction, persona detection, content seeding, tier-based feature enablement, and transaction-based rollback. Captures contact person name and email during provisioning for display in website footer.
-   **Multi-URL Mapping & Branding Extraction**: Enhanced provisioning with multi-URL scraping, automatic logo, and theme color extraction.
-   **Manual Branding Override System**: Allows manual overriding of logos, theme colors, and personas with a strict priority hierarchy.
-   **Layout/Theme System with AI Recommendations**: Fixed template system with 4 visual layout options (Classic, Nature, Modern, Community) selected during provisioning. LayoutProvider dynamically applies theme-specific CSS classes and organization-specific brand colors. An AI-powered engine (Google Gemini) recommends layouts based on organization characteristics.
-   **Organization Branding**: Organization logos are automatically displayed in the navigation header, and contact person information (name and email) captured during provisioning is displayed in the website footer.

### System Design Choices
The backend uses Express.js on Node.js with TypeScript, providing RESTful API endpoints. Data is stored in PostgreSQL (Neon serverless) via Drizzle ORM. Authentication and authorization are handled by Replit Auth with OpenID Connect (Passport.js) and PostgreSQL for session storage, implementing a two-tier RBAC system (platform-level `kinflo_admin` and organization-level roles like `viewer`, `editor`, `org_admin`, `owner`). Security features include Helmet Security Headers, five-tier rate limiting, centralized audit logging, Zod schema validation, error sanitization, and secure session management.

**Subscription Tiers**: A three-tier model (Standard, Pro, Premium) rationalizes feature access, implemented with a clear hierarchy and feature gating utilities.

**Multi-Tenant Architecture**: Achieved through a nullable `organizationId` column for tenant isolation, dedicated tables for `organizations`, `organization_users`, `custom_domains`, and `shared_templates`. A domain detection middleware identifies organizations, and a JavaScript Proxy-based wrapper enforces organization-scoped storage. Robust security measures (hostname normalization, trusted domain validation, DNS verification, request-scoped storage enforcement) prevent cross-tenant data leakage. Unique organization names are enforced with a database-level unique constraint and graceful error handling.

**CRITICAL Query Key Pattern**: For TanStack Query queries that rely on the default `queryFn` in `queryClient.ts`, the **URL must come first** in the queryKey array. The `getQueryFn` concatenates string parts with `/`, so `[orgId, "/api/path"]` creates invalid URL `"orgId//api/path"`. Correct patterns:
- `["/api/path"]` - Simple URL only
- `["/api/path", { orgId: currentOrg?.organizationId || 'default' }]` - URL first, params as object for cache isolation
- Queries with custom `queryFn` can use any queryKey format since they build their own URL.

## External Dependencies

-   **UI Framework & Components**: Radix UI, shadcn/ui, Lucide React
-   **Data Fetching & State Management**: TanStack Query
-   **Database & ORM**: Drizzle ORM, @neondatabase/serverless, connect-pg-simple
-   **Replit-Specific Tools**: @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner
-   **Fonts & Typography**: Google Fonts (Playfair Display, Inter)
-   **Utility Libraries & Services**: date-fns, nanoid, zod, Uppy, Cloudinary, Google Places API, react-lite-youtube-embed, Google Gemini AI API, Stripe, SendGrid, Twilio