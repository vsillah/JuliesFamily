# Julie's Family Learning Program Website (Powered by Kinflo)

## Overview
Julie's Family Learning Program website is a non-profit, full-stack web application designed to showcase educational programs, impact, testimonials, and events, and facilitate donations and volunteering. It also serves as a demonstration platform for **Kinflo**, a relationship-first CRM for nonprofits, highlighting its persona-based personalization, lead management, and communication automation capabilities. The project aims to create a welcoming online presence and demonstrate Kinflo's advanced features to drive engagement and support for family learning initiatives.

## User Preferences
Preferred communication style: Simple, everyday language.

## Agent Workflow Guidelines

### Escalation Protocol
After **one failed attempt** at either of the following, escalate to the architect tool for expert guidance:

1. **Resolving a Technical Issue/Bug**: If initial troubleshooting or debugging does not resolve the problem, call the architect tool with:
   - Detailed description of the issue
   - What was attempted and why it failed
   - Relevant error messages and logs
   - Files involved in the investigation
   - `responsibility: "debug"`

2. **Designing an Actionable Build Plan**: If initial planning does not produce a clear, implementable task list, call the architect tool with:
   - Description of the feature/requirement
   - Challenges or ambiguities encountered
   - Proposed approaches that were considered
   - Files that would be affected
   - `responsibility: "plan"`

**Rationale**: This ensures we get expert architectural guidance early rather than spending excessive time on difficult problems. The architect agent has specialized analytical capabilities and can provide strategic direction when standard approaches don't work.

### Testing Protocol
Before finalizing any build or marking work as complete, the agent must perform end-to-end automation and regression testing to ensure:
- New features work as expected across different user flows
- Existing functionality remains intact (no regressions)
- UI interactions are responsive and accessible
- Critical user journeys complete successfully

Use the `run_test` tool with comprehensive test plans that cover the implemented changes and related functionality.

### Continuous Documentation Improvement
When a chat interaction reveals patterns, preferences, or technical decisions that could make future interactions more efficient, the agent should proactively suggest adding those insights to this replit.md file. This includes:
- Recurring troubleshooting solutions or workarounds
- User preferences discovered during implementation
- Architectural decisions and their rationale
- Common patterns or conventions established in the codebase
- Workflow optimizations that proved effective
- Development standards that emerged (technical implementation patterns, responsive design rules, performance optimizations)

By capturing these learnings, we create a knowledge base that helps future agents work more efficiently and maintain consistency with past decisions.

### Development Testing Utilities

**Developer Grant Admin Button** - A development-only feature that bypasses OIDC authentication constraints when testing admin features.

**Location & Identification:**
- Component: `DevAdminButton` in `client/src/components/DevAdminButton.tsx`
- Displayed in: Navigation component (`client/src/components/Navigation.tsx`)
- Test ID: `data-testid="button-grant-admin-dev"`
- Label: "DEV: Grant Admin" (desktop) / "Admin" (mobile)

**When It Appears:**
- Only visible in development mode (`NODE_ENV=development` on server, `!import.meta.env.PROD` on client)
- Only shown when user is authenticated via OIDC but does NOT have admin/super_admin role
- Automatically hidden in production builds for security

**How It Works:**
- Clicking the button calls `POST /api/test/set-user-role` with `{ role: 'super_admin' }`
- Server endpoint validates the request and updates the user's role in the database
- Page automatically reloads to apply new permissions
- User gains full super_admin access to all admin features

**Testing Workflow:**
1. Start test with OIDC claims configured (use OIDC test helper)
2. Navigate to homepage or any public page
3. Complete OIDC login flow
4. Look for "DEV: Grant Admin" button in navigation
5. Click the button and wait for page reload (~1.5 seconds)
6. Navigate to admin pages (/admin, /admin/content, etc.)
7. User now has super_admin privileges for testing

**Common Testing Issues:**
- **401 Unauthorized errors**: If you see these after OIDC login, you likely need to click the Grant Admin button first
- **Missing button**: Button only appears for authenticated non-admin users; if already admin, button won't show
- **Production testing**: This feature is completely disabled in production; use proper OIDC flows for production testing

**Alternative for Automated Tests:**
For Playwright tests that encounter OIDC authentication issues:
1. Set OIDC claims with test user data
2. Navigate to a public page to complete initial auth
3. Look for and click `button-grant-admin-dev`
4. Wait for reload
5. Proceed with admin feature testing

## Development Standards

### Mobile Responsiveness
**Breakpoint Standard**: Use 768px as the consistent mobile breakpoint across all responsive implementations.

**Touch Target Accessibility**: All interactive elements (buttons, inputs, links, toggles) must meet WCAG's 44px minimum touch target height on mobile devices.

**Mobile/Desktop Component Variants**: When creating components with different mobile and desktop versions, use runtime conditional rendering (`{isMobile ? <MobileComponent /> : <DesktopComponent />}`) rather than CSS-only hiding (e.g., `md:hidden`). This prevents React hook order violations by ensuring only one component exists in the DOM at any given time.

**Mobile Safari Optimization**: Prefer React Query cache invalidation (`queryClient.invalidateQueries()`) over full page reloads (`window.location.reload()`) to prevent blank screen flashes during state transitions on mobile Safari.

**Example Pattern**:
```tsx
const isMobile = useIsMobile(768);
return isMobile ? <MobileOverlay /> : <DesktopDropdown />;
```

## System Architecture

### UI/UX Decisions
The frontend uses React 18, TypeScript, and Vite, styled with Tailwind CSS, custom CSS variables, and shadcn/ui (New York style). It supports light/dark modes and WCAG AA compliant colors. Typography includes Playfair Display for headlines and Inter for body text. The design is responsive across all devices, with dynamic, data-driven navigation matching page sections.

### Technical Implementations
The frontend is a single-page application using `wouter` for routing and TanStack Query for server state management. Key features include:
-   **Persona-Based Personalization**: Tailors content for 6 user personas (Default, Adult Education Student, Service Provider, Parent, Donor, Volunteer).
-   **Passion-Based Content Personalization**: Filters and ranks content based on user-selected interests (literacy, STEM, arts, nutrition, community) with SQL-based scoring.
-   **Uniform Conditional Rendering System**: Manages content visibility across sections using a `useContentAvailability` hook.
-   **Admin Preview Mode**: Allows administrators to preview the site from different persona and funnel stage perspectives, including A/B test variants, with consolidated admin controls. A single A/B test variant can be selected at a time, and mobile implementation uses runtime conditional rendering.
-   **Content Management System (CMS)**: Features hybrid image management (Cloudinary, object storage with AI naming) and universal content visibility controls.
-   **Persona×Journey Matrix Grid**: A visual interface for configuring content visibility across 120 permutations.
-   **A/B Testing System**: A production-ready, configuration-based platform for testing presentation overrides (headlines, CTAs, images). It ensures consistent variant assignment, provides an admin interface for managing tests, and includes control variant auto-population and historical test results display.
-   **User Management System**: Admin interface for user accounts, roles (three-tier RBAC), and audit logging.
-   **User Profile Management**: Self-service profile updates.
-   **Authenticated Donation System with Saved Payment Methods**: Secure payment processing via Stripe.
-   **Email Automation System**: Transactional email delivery via SendGrid with AI-powered copywriting.
-   **SMS Notification System**: Twilio-based template messaging with persona targeting and AI-powered copywriting.
-   **Passion-Based Donation Campaigns**: AI-powered campaign system for donor targeting and real-time goal tracking.
-   **Admin Chatbot Assistant**: AI-powered assistant for troubleshooting and analytics.
-   **Database Backup Manager**: Admin-only system for surgical, scheduled table-level backup and restore.
-   **Storage Monitoring Dashboard**: Real-time database storage monitoring.
-   **CRM Components**: Lead capture, Admin Dashboard for lead management, communication timeline, task management, pipeline management, AI copy generation, and bulk lead import.
-   **Google Calendar Integration**: OAuth-authenticated integration for scheduling and event registration.
-   **Bulk Lead Import System**: Supports Excel, CSV, and Google Sheets.
-   **Accurate Program Content**: Detailed representation of JFLP's Adult Basic Education, Family Development, and Tech Goes Home programs.
-   **Hero Section Rendering**: Layered z-index architecture for background images, overlays, and text.
-   **Student Dashboard Card Content Type**: Managed content system for Tech Goes Home progress cards, enabling persona×journey matrix personalization.
-   **Volunteer Enrollment Tracking System**: Comprehensive system for managing volunteer activities with four-table relational schema, including student dashboard integration, volunteer engagement page, and admin management interface for tracking hours and roles.

### System Design Choices
The backend uses Express.js on Node.js with TypeScript, exposing RESTful API endpoints. Data is stored in PostgreSQL (Neon serverless) via Drizzle ORM. Authentication and authorization are managed by Replit Auth with OpenID Connect (Passport.js) and PostgreSQL for session storage. A three-tier RBAC system (client, admin, super_admin) is implemented with comprehensive audit logging.

### Enterprise Security
The application incorporates Helmet Security Headers, a five-tier rate limiting system, centralized audit logging, Zod schema-based field validation and whitelisting, error sanitization, and secure session management.

## External Dependencies

### UI Framework & Components
-   Radix UI
-   shadcn/ui
-   Lucide React

### Data Fetching & State Management
-   TanStack Query

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