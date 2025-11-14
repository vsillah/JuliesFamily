# Julie's Family Learning Program Website (Powered by Kinflo)

## Overview
Julie's Family Learning Program website is a non-profit, full-stack web application showcasing educational programs, impact, testimonials, and events. It facilitates donations and volunteering. The project serves as a demonstration platform for **Kinflo**, a relationship-first CRM for nonprofits, highlighting its capabilities in persona-based personalization, lead management, and communication automation. The goal is to create a welcoming online presence and drive engagement and support for family learning initiatives.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend uses React 18, TypeScript, and Vite, styled with Tailwind CSS, custom CSS variables, and shadcn/ui (New York style). It supports light/dark modes and WCAG AA compliant colors. Typography uses Playfair Display for headlines and Inter for body text. The design is responsive, with dynamic, data-driven navigation.

### Technical Implementations
The frontend is a single-page application using `wouter` for routing and TanStack Query for server state management. Key features include:
-   **Persona-Based Personalization**: Tailors content for 6 user personas.
-   **Passion-Based Content Personalization**: Filters and ranks content based on user interests.
-   **Admin Preview Mode**: Allows administrators to preview the site from different persona and funnel stage perspectives, including A/B test variants, with consolidated admin controls.
-   **Content Management System (CMS)**: Features hybrid image management (Cloudinary, object storage with AI naming) and universal content visibility controls.
-   **Persona×Journey Matrix Grid**: A visual interface for configuring content visibility across 120 permutations.
-   **A/B Testing System**: A production-ready, configuration-based platform for testing presentation overrides, with auto-derived baseline reference from target audience selections.
-   **Automated A/B Testing System**: AI-driven automation framework for content optimization using Google Gemini, including metric weight profiles, automation rules, and Bayesian statistical significance.
-   **User Management System**: Admin interface for user accounts, roles (three-tier RBAC), audit logging, and program entitlements management. Features mobile-friendly user search with keyboard navigation and fuzzy search for impersonation flows.
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

### System Design Choices
The backend uses Express.js on Node.js with TypeScript, exposing RESTful API endpoints. Data is stored in PostgreSQL (Neon serverless) via Drizzle ORM. Authentication and authorization are managed by Replit Auth with OpenID Connect (Passport.js) and PostgreSQL for session storage, implementing a three-tier RBAC system with audit logging. The application incorporates Helmet Security Headers, a five-tier rate limiting system, centralized audit logging, Zod schema-based field validation, error sanitization, and secure session management.
**Content Visibility Architecture**: The system uses a persona×funnel stage matrix (6 personas × 4 stages = 24 combinations) for granular content control. The `buildVisibilityQuery` method in `server/storage.ts` conditionally applies persona/funnelStage filters only when explicitly provided, returning all active visible content without restrictions when undefined.

## External Dependencies

-   **UI Framework & Components**: Radix UI, shadcn/ui, Lucide React
-   **Data Fetching & State Management**: TanStack Query
-   **Database & ORM**: Drizzle ORM, @neondatabase/serverless, connect-pg-simple
-   **Replit-Specific Tools**: @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner
-   **Fonts & Typography**: Google Fonts (Playfair Display, Inter)
-   **Utility Libraries & Services**: date-fns, nanoid, zod, Uppy, Cloudinary, Google Places API, react-lite-youtube-embed, Google Gemini AI API, Stripe, SendGrid, Twilio