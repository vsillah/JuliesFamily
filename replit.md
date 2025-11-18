# Julie's Family Learning Program Website (Powered by Kinflo)

## Overview
Julie's Family Learning Program website is a non-profit, full-stack web application showcasing educational programs, impact, testimonials, and events, while facilitating donations and volunteering. It acts as a demonstration platform for **Kinflo**, a relationship-first CRM for nonprofits, focusing on persona-based personalization, lead management, and communication automation. The project has evolved into a multi-tenant SaaS platform for rapid deployment of customized demo sites, supporting custom domains, cross-organization consultant access, and a shared template library.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend uses React 18, TypeScript, and Vite, with Tailwind CSS, custom CSS variables, and shadcn/ui (New York style) for styling. It supports light/dark modes and WCAG AA compliant colors. Typography includes Playfair Display for headlines and Inter for body text. The design is responsive and features dynamic, data-driven navigation.

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
-   **Organization Management System**: Full CRUD operations for organizations with drag-and-drop reordering, search functionality, bulk status updates (activate/suspend), and bulk deletion. Includes comprehensive organization provisioning wizard with automated website content extraction, persona detection, content seeding, tier-based feature enablement, SendGrid welcome emails, and transaction-based rollback on failure.

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