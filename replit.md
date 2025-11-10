# Julie's Family Learning Program Website (Powered by Kinflo)

## Overview
Julie's Family Learning Program website is a non-profit, full-stack web application demonstrating educational programs, impact, testimonials, and events. It facilitates donations and volunteering. The platform also showcases **Kinflo**, a relationship-first CRM providing persona-based personalization, lead management, and communication automation for nonprofits. The project aims to create a warm online presence and highlight advanced CRM functionalities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend uses React 18 with TypeScript and Vite, styled with Tailwind CSS, custom CSS variables, and shadcn/ui (New York style). It supports light/dark modes and WCAG AA compliant colors (orange/golden primary, olive/khaki secondary, warm beige backgrounds). Typography uses Playfair Display (serif) for headlines and Inter (sans-serif) for body text. Responsive design ensures optimal display across devices, with dynamic and data-driven navigation.

### Technical Implementations
The frontend is a single-page application using `wouter` for routing and TanStack Query for server state. Key features include:
-   **Persona-Based Personalization**: Tailored content delivery based on 5 user personas.
-   **Passion-Based Content Personalization**: Users can select their interests (literacy, stem, arts, nutrition, community) in their profile, and content is automatically filtered and ranked to match their passions. Features SQL-based passion matching with COUNT() scoring, three-tier fallback hierarchy (user profile → query string → standard ordering), NULL-safe handling with COALESCE, and multi-select passion checkboxes in the Profile UI with form persistence.
-   **Admin Preview Mode**: Comprehensive preview system allowing administrators to view the site from different persona and funnel stage perspectives. When a persona×journey combination has active A/B tests, admins can select specific variants (Control or Treatment) to preview, or use random assignment for realistic testing. Features analytics suppression to prevent admin interactions from polluting test results. **Consolidated Admin Controls**: Streamlined dropdown interface in the navigation bar combining persona switcher, funnel stage selector, A/B variant overrides, and admin dashboard link into a single, accessible control. The dropdown trigger displays the currently applied persona and journey stage at a glance, with an Eye icon badge indicating when preview mode is active. Non-admin users do not see persona controls as persona assignment is system-managed based on user profile and behavior.
-   **Content Management System (CMS)**: Hybrid image management (Cloudinary and Object Storage with AI-powered file naming) and universal content visibility controls.
-   **Persona×Journey Matrix Grid**: Visual interface for configuring content visibility across 120 permutations.
-   **A/B Testing System**: Production-ready configuration-based testing platform that respects persona×journey matrix personalization. A/B tests apply presentation overrides (headlines, CTAs, images, button styles) AFTER content is selected via persona + journey stage + passion tags. This ensures all users receive personalized content while testing different messaging variations. System supports universal content type testing (hero, cta, service, testimonial, event, video) with detailed analytics and conversion tracking. Implementation includes query param sanitization to handle TanStack Query undefined serialization, loading state guards to prevent fallback content rendering, and diagnostic logging for development debugging. Architecture ensures 100% reliable variant assignment (control or treatment) with no edge case fallbacks. **Persistent Variant Assignment** ensures consistent user experience across browser sessions using a hybrid identification strategy: authenticated users via userId, anonymous users via localStorage-persisted visitorId (crypto.randomUUID), with sessionId as legacy fallback. The system implements intelligent identifier promotion, automatically upgrading visitor assignments to user assignments when users log in, maintaining variant consistency throughout the customer journey.
-   **User Management System**: Admin interface for managing user accounts, roles, and privileges with a three-tier RBAC system and audit logging.
-   **User Profile Management**: Self-service profile updates with data integrity protection, validation, and audit logging.
-   **AI-Powered Analysis**: Google Gemini AI for social media screenshot and YouTube video thumbnail analysis with metadata extraction.
-   **AI-Powered File Naming**: Intelligent file naming system using Google Gemini AI for uploaded images, generating descriptive, SEO-friendly filenames.
-   **Authenticated Donation System with Saved Payment Methods**: Secure payment processing requiring authentication, with Stripe Customer integration for saving payment methods. Features include automatic profile prefilling (name/email), smart opt-in checkbox (optional for one-time, required for recurring donations), and saved payment method selection for repeat donors.
-   **Email Automation System**: Transactional email delivery via SendGrid with template management and AI-powered copywriting.
-   **SMS Notification System**: Twilio-based template SMS messaging with persona targeting and AI-powered copywriting.
-   **Passion-Based Donation Campaigns**: AI-powered campaign system using frameworks from Alex Hormozi's "$100M Leads" for donor targeting, multi-channel distribution, real-time goal tracking, and filtered testimonial promotion.
-   **Admin Chatbot Assistant**: AI-powered troubleshooting and analytics assistant for authenticated admin users, offering platform logs, issue escalation, and various analytics (platform stats, lead analytics, content summary, donation stats).
-   **Database Backup Manager**: Admin-only system for surgical table-level backup and restore, including automated scheduling with configurable retention policies and timezone awareness.
-   **Storage Monitoring Dashboard**: Real-time database storage monitoring, projecting future consumption based on backup schedules to prevent exceeding storage limits.
-   **CRM Components**: Lead capture forms, Admin Dashboard for lead management, Communication Timeline, Task Management, Pipeline Management & Analytics, AI-Powered Copy Generation, and Bulk Lead Import (supporting Excel, CSV, and Google Sheets).
-   **Google Calendar Integration**: OAuth-authenticated integration for scheduling, event registration, and task synchronization.
-   **Bulk Lead Import System**: Multi-format import supporting Excel (.xlsx, .xls), CSV files, and Google Sheets via OAuth connection with comprehensive validation, duplicate detection, and gid-based sheet selection for multi-tab spreadsheets.

### System Design Choices
The backend uses Express.js on Node.js with TypeScript, providing RESTful API endpoints. Data is stored in PostgreSQL (Neon serverless) via Drizzle ORM. Authentication and authorization are managed by Replit Auth with OpenID Connect (Passport.js), using PostgreSQL for session storage. Role-based access control is implemented with a three-tier system (client, admin, super_admin) and comprehensive audit logging.

### Enterprise Security
The application implements comprehensive security measures:
-   **Helmet Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options.
-   **Rate Limiting**: Five-tier system for global, authentication, admin, payment, and lead submission endpoints.
-   **Centralized Audit Logging**: Tracking critical data mutations with actorId, action, tableName, recordId, changes, and metadata.
-   **Field Validation & Whitelisting**: Zod update schemas enforce strict field whitelisting to prevent mass assignment vulnerabilities.
-   **Error Sanitization**: Production error handler logs full details server-side while returning sanitized messages to clients.
-   **Session Security**: 7-day TTL, HttpOnly cookies, SameSite=lax, secure flag in production, PostgreSQL-backed persistence, automatic OIDC token refresh.

## External Dependencies

### UI Framework & Components
-   Radix UI
-   shadcn/ui
-   Lucide React

### Data Fetching & State Management
-   TanStack Query
-   React Hook Form

### Database & ORM
-   Drizzle ORM
-   @neondatabase/serverless
-   connect-pg-simple

### Replit-Specific Tools
-   @replit/vite-plugin-runtime-error-modal
-   @replit/vite-plugin-cartographer
-   @replit/vite-plugin-dev-banner

### Fonts & Typography
-   Google Fonts (Playfair Display, Inter)

### Utility Libraries & Services
-   date-fns
-   nanoid
-   zod
-   Uppy
-   Cloudinary
-   Google Places API
-   react-lite-youtube-embed
-   Google Gemini AI API
-   Stripe
-   SendGrid
-   Twilio