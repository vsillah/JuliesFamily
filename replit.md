# Julie's Family Learning Program Website (Powered by Kinflo)

## Overview
Julie's Family Learning Program website is a non-profit, full-stack web application designed to showcase educational programs, impact, testimonials, and events. It facilitates donations and volunteering, serving as a demonstration platform for **Kinflo**, a relationship-first CRM for nonprofits. The project highlights Kinflo's capabilities in persona-based personalization, lead management, and communication automation, aiming to create a welcoming online presence and drive engagement and support for family learning initiatives.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend uses React 18, TypeScript, and Vite, styled with Tailwind CSS, custom CSS variables, and shadcn/ui (New York style). It supports light/dark modes and WCAG AA compliant colors. Typography includes Playfair Display for headlines and Inter for body text. The design is responsive across all devices, with dynamic, data-driven navigation.

### Technical Implementations
The frontend is a single-page application using `wouter` for routing and TanStack Query for server state management. Key features include:
-   **Persona-Based Personalization**: Tailors content for 6 user personas.
-   **Passion-Based Content Personalization**: Filters and ranks content based on user-selected interests.
-   **Admin Preview Mode**: Allows administrators to preview the site from different persona and funnel stage perspectives, including A/B test variants, with consolidated admin controls.
-   **Content Management System (CMS)**: Features hybrid image management (Cloudinary, object storage with AI naming) and universal content visibility controls.
-   **Persona×Journey Matrix Grid**: A visual interface for configuring content visibility across 120 permutations.
-   **A/B Testing System**: A production-ready, configuration-based platform for testing presentation overrides, ensuring consistent variant assignment and providing an admin interface. Features auto-derived baseline reference from target audience selections for simplified UX.
-   **Automated A/B Testing System**: AI-driven automation framework for content optimization with zero manual intervention, including metric weight profiles, automation rules, performance baselines, AI content generation via Google Gemini, automation run tracking, safety limits, and Bayesian statistical significance.
-   **User Management System**: Admin interface for user accounts, roles (three-tier RBAC), audit logging, and program entitlements management (allowing admins to grant users access to specific student programs or volunteer opportunities for testing). Features mobile-friendly user search component using CommandDialog with keyboard navigation and fuzzy search for impersonation flows.
-   **Admin Impersonation System**: Production-ready user impersonation with full context-switching middleware, session tracking, and visual indicators. Allows admins to preview the site as any user for troubleshooting while maintaining admin permissions. Features:
    - **Middleware Integration**: `applyImpersonation` middleware (in `server/impersonationMiddleware.ts`) applied to all authenticated routes via `authWithImpersonation` array, except impersonation control endpoints themselves
    - **Context Swapping**: When impersonating, middleware swaps `req.user` to impersonated user while preserving admin as `req.adminUser`, allowing permission checks via `requireRole` to check admin context
    - **Visual Indicators**: Yellow `ImpersonationBanner` component rendered inside fixed Navigation component, displaying impersonated user name/email with "End Impersonation" button
    - **Admin Controls**: Mobile-friendly user search (UserSearchCommand with fuzzy search), consolidated admin preview dropdown with impersonation status display
    - **Session Management**: Database-persisted sessions with RESTful endpoints (POST /api/admin/impersonation/start, DELETE /api/admin/impersonation/end/:sessionId, GET /api/admin/impersonation/session)
    - **Automatic Context Application**: Page reloads after impersonation start/end to immediately apply context changes across all queries and components
-   **Authenticated Donation System with Saved Payment Methods**: Secure payment processing via Stripe.
-   **Email Automation System**: Transactional email delivery via SendGrid with AI-powered copywriting.
-   **SMS Notification System**: Twilio-based template messaging with persona targeting and AI-powered copywriting.
-   **CRM Components**: Lead capture, Admin Dashboard for lead management (with lead status filtering system), communication timeline, task management, pipeline management, AI copy generation, and bulk lead import.
-   **Google Calendar Integration**: OAuth-authenticated integration for scheduling and event registration.
-   **Volunteer Enrollment Tracking System**: Comprehensive system for managing volunteer activities.
-   **Lead-Level Email Engagement Tracking**: Displays email analytics per lead, including summary metrics, opens, and clicks.
-   **Scheduled Email Reports**: Automated recurring email reporting system with full CRUD management via an admin UI.
-   **Advanced Segmentation System**: Dynamic audience targeting with flexible JSONB filter criteria, visual filter builder, and live preview with lead counts.
-   **Email Unsubscribe Management**: CAN-SPAM compliant unsubscribe tracking with HMAC-secured tokens and integration with email sending.
-   **SMS Unsubscribe Management (TCPA Compliance)**: Multi-channel opt-out system supporting SMS, email, and cross-channel unsubscribes, including Twilio webhook handling.
-   **Hormozi Template Library ($100M Leads Integration)**: Production-ready template library incorporating Alex Hormozi's cold outreach frameworks adapted for nonprofit context, including 36 templates with comprehensive variable support and built-in compliance.
-   **Lead Status Filtering System**: Four-status engagement tracking system (Active, Nurture, Disqualified, Unresponsive) with inline editing in LeadDetailsDialog, color-coded badges on lead cards, filter dropdown in AdminDashboard, analytics exclusion of disqualified/unresponsive leads, and type-safe schema validation using shared LeadStatus enum with .strict().partial() for security.

### System Design Choices
The backend uses Express.js on Node.js with TypeScript, exposing RESTful API endpoints. Data is stored in PostgreSQL (Neon serverless) via Drizzle ORM. Authentication and authorization are managed by Replit Auth with OpenID Connect (Passport.js) and PostgreSQL for session storage, implementing a three-tier RBAC system with audit logging. The application incorporates Helmet Security Headers, a five-tier rate limiting system, centralized audit logging, Zod schema-based field validation, error sanitization, and secure session management.

**Content Visibility Architecture**: The system uses a persona×funnel stage matrix (6 personas × 4 stages = 24 combinations) for granular content control. The `buildVisibilityQuery` method in `server/storage.ts` conditionally applies persona/funnelStage filters only when explicitly provided—when undefined, it returns all active visible content without persona/stage restrictions. This enables public pages (e.g., Virtual Tour) to display all relevant content while supporting targeted personalization when user context is available. Uses `selectDistinctOn` to prevent duplicate results from multi-row visibility assignments.

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

## Technical Patterns & Known Issues

### Radix UI Select Empty String Value Error

**Issue Identification**: When using Radix UI's `<SelectItem>` component (from shadcn/ui Select), you'll encounter this runtime error if any SelectItem has an empty string value:
```
Error: A <Select.Item /> must have a value prop that is not an empty string.
```

**When This Occurs**:
- Forms with optional select fields where "All" or "Any" options need to be represented
- Dropdowns where the user can choose "no filter" or "all items"
- Any Select component where you need to represent "empty" or "unselected" state

**Resolution Pattern** (5-step conversion):
1. **Change SelectItem value**: Replace `<SelectItem value="">` with `<SelectItem value="all">` (or another placeholder like "none", "any", etc.)
2. **Initialize form state**: Set default values to `"all"` instead of `""` in useState/useForm
3. **Submit conversion**: Convert `"all"` → `""` in form submit handlers before sending to backend
4. **Load conversion**: Convert `""` → `"all"` when populating form from backend data
5. **Reset function**: Update form reset logic to use `"all"` instead of `""`

**Example Implementation**:
```typescript
// 1. SelectItem with placeholder value
<SelectItem value="all">All Options</SelectItem>
<SelectItem value="option1">Option 1</SelectItem>

// 2. Form initialization
const [formData, setFormData] = useState({
  myField: "all"  // Not ""
});

// 3. Submit conversion
const handleSubmit = () => {
  const payload = {
    ...formData,
    myField: formData.myField === "all" ? "" : formData.myField
  };
  api.post("/endpoint", payload);
};

// 4. Load conversion
const handleEdit = (data) => {
  setFormData({
    ...data,
    myField: data.myField || "all"  // Convert empty to "all"
  });
};

// 5. Reset function
const resetForm = () => {
  setFormData({
    myField: "all"  // Not ""
  });
};
```

**Files Affected in This Project**:
- `client/src/pages/AdminAutomationRules.tsx` - Target Persona, Target Funnel Stage, Content Type selects

**Key Principle**: Radix UI Select requires non-empty string values. Use placeholder values in the UI layer and convert to/from empty strings at the data layer boundary.