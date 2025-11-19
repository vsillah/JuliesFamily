# Julie's Family Learning Program Website (Powered by Kinflo)

## Overview
Julie's Family Learning Program website is a non-profit, full-stack web application showcasing educational programs, impact, testimonials, and events, while facilitating donations and volunteering. It acts as a demonstration platform for **Kinflo**, a relationship-first CRM for nonprofits, focusing on persona-based personalization, lead management, and communication automation. The project has evolved into a multi-tenant SaaS platform for rapid deployment of customized demo sites, supporting custom domains, cross-organization consultant access, and a shared template library.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend uses React 18, TypeScript, and Vite, with Tailwind CSS, custom CSS variables, and shadcn/ui (New York style) for styling. It supports light/dark modes and WCAG AA compliant colors. Typography includes Playfair Display for headlines and Inter for body text. The design is responsive and features dynamic, data-driven navigation.

**Navigation Enhancements**:
-   **Direct Organization Access**: KinFlo admins can access the Organizations management page directly from both desktop (user dropdown menu) and mobile (drawer menu) navigation, eliminating the need to navigate through the admin dashboard and breadcrumbs.
-   **Organization Name Display**: All UI components display organization names instead of IDs. OrganizationSwitcher and AdminOrganizations pages show "Unknown Organization" as a fallback when names are unavailable, improving user experience and readability.

### Technical Implementations
The frontend is a single-page application using `wouter` for routing and TanStack Query for server state management. Key features include:
-   **Persona-Based Personalization**: Tailors content for 6 user personas and filters based on user interests.
-   **Admin Preview Mode**: Allows administrators to preview the site from different persona and funnel stage perspectives, including A/B test variants.
-   **Content Management System (CMS)**: Hybrid image management (Cloudinary, object storage) and universal content visibility controls, including a Persona×Journey Matrix Grid for configuring content visibility across 120 permutations. Includes an automated content extraction and persona detection from existing nonprofit websites during organization provisioning.
-   **A/B Testing System**: Configuration-based platform for presentation overrides, with an AI-driven automation framework using Google Gemini for content optimization.
-   **User Management System**: Admin interface for user accounts, two-tier RBAC roles, audit logging, and program entitlements.
-   **Admin Impersonation System**: User impersonation with full context-switching middleware and visual indicators.
-   **Authenticated Donation System with Saved Payment Methods**: Secure payment processing via Stripe.
-   **Email Automation System**: Transactional email delivery via SendGrid with AI-powered copywriting.
-   **SMS Notification System**: Twilio-based template messaging with persona targeting and AI-powered copywriting.
-   **CRM Components**: Lead capture, Admin Dashboard for lead management, communication timeline, task/pipeline management, AI copy generation, and bulk lead import.
-   **Google Calendar Integration**: OAuth-authenticated integration for scheduling and event registration.
-   **Volunteer Enrollment Tracking System**: Comprehensive system for managing volunteer activities.
-   **Lead-Level Email Engagement Tracking**: Displays email analytics per lead.
-   **Scheduled Email Reports**: Automated recurring email reporting system with full CRUD management via an admin UI.
-   **Advanced Segmentation System**: Dynamic audience targeting with flexible JSONB filter criteria, visual builder, and live preview.
-   **Email and SMS Unsubscribe Management**: CAN-SPAM and TCPA compliant multi-channel opt-out system.
-   **Hormozi Template Library ($100M Leads Integration)**: Adapts Alex Hormozi's cold outreach frameworks for nonprofit context (36 templates).
-   **Lead Status Filtering System**: Four-status engagement tracking system with inline editing and type-safe schema validation.
-   **Bulk SMS Campaign System**: Comprehensive bulk messaging platform with persona×funnel stage targeting, recipient preview, async processing, and campaign history tracking.
-   **Hybrid Card Reordering System**: Three-method content reordering interface (drag-and-drop, arrow buttons, jump-to-position dropdown) with transactional batch updates and optimistic UI.
-   **Student Projects Carousel with Passion Badges**: Passion-filtered carousel showcasing student work to donors, with OIDC passions persistence and visual passion badges.
-   **Feature Toggle System**: Multi-tenant feature flag platform with super admin UI for organization-specific feature control, `useFeatureEnabled` hook, and `FeatureGate` component.
-   **Organization Management System**: Full CRUD operations for organizations with drag-and-drop reordering, search functionality, bulk status updates (activate/suspend), and bulk deletion. Includes comprehensive organization provisioning wizard with automated website content extraction, persona detection, content seeding (programs, events, testimonials, hero/CTA variants, and 4 required content sections: impact_section, story_section, sponsors_section, footer_section), tier-based feature enablement, SendGrid welcome emails, and transaction-based rollback on failure. All provisioning strategies (default_templates, import_from_website, start_blank) automatically create the 4 required content sections with organization-scoped metadata.
-   **Multi-URL Mapping & Branding Extraction**: Enhanced provisioning wizard with optional URL mapping fields supporting up to 5 URLs per section (programsUrls, eventsUrls, testimonialsUrls arrays) for comprehensive content scraping from multi-page nonprofit websites. Dynamic UI with add/remove buttons for managing multiple URLs per category. Automatic logo extraction (favicon, og:image, header logos) and theme color detection (primary, accent, background, text) from CSS/stylesheets during organization provisioning. Content aggregation from multiple pages with dedicated scraping logic per URL. Extracted branding data stored in organizations table (logo, themeColors JSONB) and displayed in provisioning wizard preview UI.
-   **Manual Branding Override System**: Comprehensive manual override system for logo, theme colors, and personas available across all provisioning strategies (default_templates, import_from_website, start_blank). Implements strict Manual > Scraped > Defaults priority hierarchy: (1) Logo: manual URL (trimmed, empty strings treated as undefined) > scraped logo > none; (2) Personas: manual array (filtered, empty/whitespace removed) > scraped personas > defaults (student, parent, donor, volunteer, community_member, educator); (3) Theme Colors: default base palette (#3B82F6 primary, #10B981 accent, #FFFFFF background, #000000 text) + scraped overlays + manual field-level overrides. Frontend strips empty values before submission; backend normalizes and logs override sources. Logo download/upload to Cloudinary occurs outside transaction with 15s timeout and 5MB limit.

### System Design Choices
The backend uses Express.js on Node.js with TypeScript, providing RESTful API endpoints. Data is stored in PostgreSQL (Neon serverless) via Drizzle ORM. Authentication and authorization are handled by Replit Auth with OpenID Connect (Passport.js) and PostgreSQL for session storage, implementing a **two-tier RBAC system**:
-   **Platform-Level Roles**: `kinflo_admin` for platform-wide management.
-   **Organization-Level Roles**: `viewer`, `editor`, `org_admin`, `owner` for access within specific organizations.
KinFlo Admins can switch between organizations using a session override.

The application incorporates Helmet Security Headers, a five-tier rate limiting system, centralized audit logging, Zod schema-based field validation, error sanitization, and secure session management.

**Subscription Tiers**:
-   **Three-Tier Model**: Standard, Pro, and Premium (rationalized from previous Basic/Pro/Premium/Enterprise)
-   **Tier Hierarchy**: Standard (0) < Pro (1) < Premium (2) for feature gating
-   **Feature Gating**: Implemented via `shared/tiers.ts` with `TIERS` constants, `hasTierAccess()` function, and `getTierFeatures()` utilities
-   **Frontend Components**: `TierGate` component with upgrade prompts, `useTierAccess()` hook for conditional rendering, and `useFeatureEnabled()` for feature flags
-   **Default Tier**: Organizations default to Standard tier if no tier is specified

**Multi-Tenant Architecture**:
-   **Database Schema**: Nullable `organizationId` column for tenant isolation in existing tables; new tables for `organizations`, `organization_users`, `custom_domains`, and `shared_templates`. Organization names have a unique constraint to prevent data collisions.
-   **Domain Detection Middleware**: Detects organization from custom verified domains or defaults. Host header validation prevents tenant spoofing.
-   **Organization-Scoped Storage**: JavaScript Proxy-based wrapper enforcing tenant isolation on storage method calls.
-   **Background Scheduler Security**: All 4 background schedulers process each organization independently with org-scoped storage, ensuring no cross-tenant data access.
-   **Security Approach**: Hostname normalization, trusted domain validation, DNS verification, request-scoped storage enforcement, and Proxy-based hard enforcement prevent cross-tenant data leakage.
-   **Unique Organization Names**: Database-level unique constraint on organization names with graceful error handling. Backend catches PostgreSQL duplicate key violations (error 23505) and returns HTTP 409 with clear messages. Frontend displays errors both inline on form fields and via toast notifications, keeping dialogs open for user correction.

## External Dependencies

-   **UI Framework & Components**: Radix UI, shadcn/ui, Lucide React
-   **Data Fetching & State Management**: TanStack Query
-   **Database & ORM**: Drizzle ORM, @neondatabase/serverless, connect-pg-simple
-   **Replit-Specific Tools**: @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner
-   **Fonts & Typography**: Google Fonts (Playfair Display, Inter)
-   **Utility Libraries & Services**: date-fns, nanoid, zod, Uppy, Cloudinary, Google Places API, react-lite-youtube-embed, Google Gemini AI API, Stripe, SendGrid, Twilio