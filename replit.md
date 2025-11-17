# Julie's Family Learning Program Website (Powered by Kinflo)

## Overview
Julie's Family Learning Program website is a non-profit, full-stack web application designed to showcase educational programs, impact, testimonials, and events, while facilitating donations and volunteering. It serves as a demonstration platform for **Kinflo**, a relationship-first CRM for nonprofits, emphasizing persona-based personalization, lead management, and communication automation. The project has evolved into a multi-tenant SaaS platform, enabling rapid deployment of customized demo sites for various nonprofits with custom domain support, cross-organization access for consultants, and a shared template library.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

### Multi-Tenant Migration & Impersonation Feature Complete (November 17, 2025)
**Critical Achievements**: Multi-tenant data migration complete, A/B testing operational, impersonation feature fully tenant-isolated and accessible from user management.

**Final Migration Statistics**:
- **74/75 tables passing (98.7% pass rate)** - MIGRATION COMPLETE ✓
- Fixed 22 tables with NULL organization_id values totaling 465+ rows
- **A/B Testing System Fully Operational**: 
  - 6 active tests with all related tables migrated
  - Fixed org-scoped methods: `getAbTest`, `createAbTestAssignment`, `updateAbTestAssignment`, `getAssignmentPersistent`, `getAbTestVariants`, `trackEvent`
  - React Query URL construction bug fixed (removed organizationId concatenation with absolute paths)
- **Impersonation System Tenant-Isolated**: 
  - Added `organization_id` column to `admin_impersonation_sessions` table
  - Implemented org-scoped methods: `createImpersonationSession`, `getImpersonationSessions`, `endImpersonationSession`, `getCurrentlyImpersonatedUser`, `hasActiveImpersonation`
  - Added impersonation button to user management table for one-click impersonation
  - Org-scoped storage coverage: **103 methods (34%)**
- **Content Visibility Fix**: Added 28 visibility records for 'default' persona (7 testimonials × 4 funnel stages) to ensure testimonials display when users click "I'll explore on my own"
- **Intentional NULL values** (by design for platform-level entities):
  - users: 24 platform administrators with `kinflo_admin` role who manage multiple organizations

## System Architecture

### UI/UX Decisions
The frontend utilizes React 18, TypeScript, and Vite, styled with Tailwind CSS, custom CSS variables, and shadcn/ui (New York style). It supports light/dark modes and WCAG AA compliant colors. Typography features Playfair Display for headlines and Inter for body text. The design is responsive and includes dynamic, data-driven navigation.

### Technical Implementations
The frontend is a single-page application using `wouter` for routing and TanStack Query for server state management. Key features include:
-   **Persona-Based Personalization**: Tailors content for 6 user personas and filters based on user interests.
-   **Admin Preview Mode**: Allows administrators to preview the site from different persona and funnel stage perspectives, including A/B test variants.
-   **Content Management System (CMS)**: Hybrid image management (Cloudinary, object storage) and universal content visibility controls, including a Persona×Journey Matrix Grid for configuring content visibility across 120 permutations.
-   **A/B Testing System**: Production-ready, configuration-based platform for presentation overrides, with an AI-driven automation framework using Google Gemini for content optimization.
-   **User Management System**: Admin interface for user accounts, two-tier RBAC roles, audit logging, and program entitlements. Features mobile-friendly user search and fuzzy search for impersonation.
-   **Admin Impersonation System**: Production-ready user impersonation with full context-switching middleware and visual indicators.
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
-   **Hormozi Template Library ($100M Leads Integration)**: Production-ready template library adapting Alex Hormozi's cold outreach frameworks for nonprofit context (36 templates).
-   **Lead Status Filtering System**: Four-status engagement tracking system with inline editing and type-safe schema validation.
-   **Bulk SMS Campaign System**: Comprehensive bulk messaging platform with persona×funnel stage targeting, recipient preview, async processing, and campaign history tracking.
-   **Hybrid Card Reordering System**: Three-method content reordering interface (drag-and-drop, arrow buttons, jump-to-position dropdown) with transactional batch updates and optimistic UI.
-   **Student Projects Carousel with Passion Badges**: Passion-filtered carousel showcasing student work to donors, with OIDC passions persistence and visual passion badges.

### System Design Choices
The backend uses Express.js on Node.js with TypeScript, providing RESTful API endpoints. Data is stored in PostgreSQL (Neon serverless) via Drizzle ORM. Authentication and authorization are handled by Replit Auth with OpenID Connect (Passport.js) and PostgreSQL for session storage, implementing a **two-tier RBAC system**:
-   **Platform-Level Roles**: `kinflo_admin` for platform-wide management.
-   **Organization-Level Roles**: `viewer`, `editor`, `org_admin`, `owner` for access within specific organizations.
KinFlo Admins can switch between organizations using a session override for management and preview.

The application incorporates Helmet Security Headers, a five-tier rate limiting system, centralized audit logging, Zod schema-based field validation, error sanitization, and secure session management.

**Multi-Tenant Architecture**:
-   **Database Schema**: Nullable `organizationId` column for tenant isolation in existing tables; new tables for `organizations`, `organization_users`, `custom_domains`, and `shared_templates`.
-   **Domain Detection Middleware**: Detects organization from custom verified domains or defaults based on Replit domains. Host header validation prevents tenant spoofing.
-   **Organization-Scoped Storage**: JavaScript Proxy-based wrapper enforcing tenant isolation on storage method calls. A middleware attaches an org-scoped storage instance to each request. All 509 storage references in `server/routes.ts` have been migrated for tenant isolation.
-   **Background Scheduler Security**: All 4 background schedulers (email reports, donor lifecycle, email campaigns, backups) process each organization independently with org-scoped storage, ensuring no cross-tenant data access.
-   **Security Approach**: Hostname normalization, trusted domain validation, DNS verification, request-scoped storage enforcement, and Proxy-based hard enforcement prevent cross-tenant data leakage.

## External Dependencies

-   **UI Framework & Components**: Radix UI, shadcn/ui, Lucide React
-   **Data Fetching & State Management**: TanStack Query
-   **Database & ORM**: Drizzle ORM, @neondatabase/serverless, connect-pg-simple
-   **Replit-Specific Tools**: @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner
-   **Fonts & Typography**: Google Fonts (Playfair Display, Inter)
-   **Utility Libraries & Services**: date-fns, nanoid, zod, Uppy, Cloudinary, Google Places API, react-lite-youtube-embed, Google Gemini AI API, Stripe, SendGrid, Twilio