# Julie's Family Learning Program Website (Powered by Kinflo)

## Overview
Julie's Family Learning Program website is a non-profit, full-stack web application showcasing educational programs, impact, testimonials, and events, while facilitating donations and volunteering. It serves as a demonstration platform for **Kinflo**, a relationship-first CRM designed for nonprofits, featuring persona-based personalization, lead management, and communication automation. The project aims to establish a warm online presence and highlight Kinflo's advanced CRM capabilities, driving engagement and support for family learning initiatives.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, TypeScript, and Vite, styled using Tailwind CSS, custom CSS variables, and shadcn/ui (New York style). It supports light/dark modes and WCAG AA compliant colors. Typography features Playfair Display for headlines and Inter for body text. The design is responsive, ensuring optimal display across devices. Navigation is dynamic, data-driven, and matches page section order, with adaptable layouts for mobile.

### Technical Implementations
The frontend is a single-page application utilizing `wouter` for routing and TanStack Query for server state management. Key features include:
-   **Persona-Based Personalization**: Delivers tailored content based on 5 predefined user personas.
-   **Passion-Based Content Personalization**: Filters and ranks content based on user-selected interests (literacy, STEM, arts, nutrition, community) with SQL-based scoring and a three-tier fallback hierarchy.
-   **Uniform Conditional Rendering System**: Manages content visibility across various sections (services, lead-magnet, impact, testimonials, events, donation) using a consistent `useContentAvailability` hook, ensuring data-driven content display.
-   **Admin Preview Mode**: Allows administrators to preview the site from different persona and funnel stage perspectives, including A/B test variants, with analytics suppression. Consolidated admin controls offer a streamlined interface for preview settings.
-   **Content Management System (CMS)**: Features hybrid image management (Cloudinary, object storage with AI naming) and universal content visibility controls.
-   **Persona×Journey Matrix Grid**: A visual interface for configuring content visibility across 120 permutations.
-   **A/B Testing System**: A production-ready, configuration-based platform for testing presentation overrides (headlines, CTAs, images) that respects persona×journey matrix personalization. It ensures consistent variant assignment across sessions and provides an admin interface for managing test variants, traffic allocation, and AI-powered variant naming.
-   **User Management System**: Admin interface for user accounts, roles (three-tier RBAC), and audit logging.
-   **User Profile Management**: Self-service profile updates with data integrity and audit logging.
-   **Authenticated Donation System with Saved Payment Methods**: Secure payment processing via Stripe, allowing users to save payment methods and prefill donation forms.
-   **Email Automation System**: Transactional email delivery via SendGrid with AI-powered copywriting.
-   **SMS Notification System**: Twilio-based template messaging with persona targeting and AI-powered copywriting.
-   **Passion-Based Donation Campaigns**: AI-powered campaign system for donor targeting, multi-channel distribution, and real-time goal tracking.
-   **Admin Chatbot Assistant**: AI-powered assistant for troubleshooting, analytics, and issue escalation for authenticated admins.
-   **Database Backup Manager**: Admin-only system for surgical, scheduled table-level backup and restore.
-   **Storage Monitoring Dashboard**: Real-time database storage monitoring with future consumption projections.
-   **CRM Components**: Includes lead capture, Admin Dashboard for lead management, communication timeline, task management, pipeline management, AI copy generation, and bulk lead import.
-   **Google Calendar Integration**: OAuth-authenticated integration for scheduling and event registration.
-   **Bulk Lead Import System**: Supports Excel, CSV, and Google Sheets with validation and duplicate detection.
-   **Accurate Program Content**: Detailed and accurate representation of JFLP's Adult Basic Education, Family Development, and Tech Goes Home programs, with specific UI emphasis for Tech Goes Home's completion metrics.
-   **Hero Section Rendering**: Layered z-index architecture for background images, overlays, and text content, ensuring smooth loading and readability.

### System Design Choices
The backend uses Express.js on Node.js with TypeScript, exposing RESTful API endpoints. Data is stored in PostgreSQL (Neon serverless) via Drizzle ORM. Authentication and authorization are managed by Replit Auth with OpenID Connect (Passport.js) and PostgreSQL for session storage. A three-tier RBAC system (client, admin, super_admin) is implemented with comprehensive audit logging.

### Enterprise Security
The application incorporates:
-   **Helmet Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options.
-   **Rate Limiting**: Five-tier system for various endpoints.
-   **Centralized Audit Logging**: Tracking critical data mutations.
-   **Field Validation & Whitelisting**: Zod schemas prevent mass assignment.
-   **Error Sanitization**: Production errors are logged fully server-side but sanitized for clients.
-   **Session Security**: HttpOnly, SameSite=lax, secure flags, PostgreSQL persistence, and OIDC token refresh.

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

## Development Checklists

### New Card/Content Section Checklist
When developing a new card or content section for the website, ensure all of the following requirements are met:

#### 1. Mobile Responsiveness
- [ ] **Responsive Grid Layout**: Use Tailwind responsive classes (`sm:`, `md:`, `lg:`, `xl:`) for grid columns and spacing
- [ ] **Touch Interactions**: Ensure touch targets are minimum 44×44px for mobile accessibility
- [ ] **Viewport Testing**: Test on mobile viewports (375px, 768px) and desktop (1024px+)
- [ ] **Image Optimization**: Use responsive images with appropriate sizes for different breakpoints
- [ ] **Text Readability**: Verify font sizes are readable on mobile (minimum 16px for body text)
- [ ] **Horizontal Scroll**: Prevent horizontal scrolling on small viewports

#### 2. Content Manager Integration
- [ ] **Database Schema**: Add/update table in `shared/schema.ts` with Drizzle ORM
  - Define insert schema using `createInsertSchema` from `drizzle-zod`
  - Define insert type using `z.infer<typeof insertSchema>`
  - Define select type using `typeof table.$inferSelect`
- [ ] **API Routes**: Create endpoints in `server/routes.ts`
  - GET for fetching content
  - POST for creating new content
  - PATCH for updating existing content
  - DELETE for removing content (if applicable)
  - Validate request bodies with Zod schemas
- [ ] **Storage Interface**: Update `server/storage.ts` with CRUD methods
- [ ] **Admin UI Form**: Add form to Content Manager (`client/src/pages/AdminContentManager.tsx`)
  - Use `react-hook-form` with `zodResolver`
  - Include persona×journey matrix visibility controls
  - Add image upload capability (Cloudinary/Object Storage)
- [ ] **Frontend Display Component**: Create component to render the card on the public-facing site
- [ ] **TanStack Query Integration**: Set up queries/mutations with proper cache invalidation

#### 3. Navigation Integration
- [ ] **Dynamic Navigation**: Ensure section appears in main navigation automatically when content exists
- [ ] **Section Visibility Logic**: Implement `useContentAvailability` hook integration
- [ ] **Mobile Menu**: Verify section appears in mobile hamburger menu
- [ ] **URL Routing**: Add route to `client/src/App.tsx` if creating a dedicated page
- [ ] **Scroll Behavior**: Configure smooth scroll-to-section for anchor links
- [ ] **Active Link Highlighting**: Update navigation to highlight active section

#### 4. AI Helper Integration
- [ ] **Copywriter Integration**: Import `generateCopy` function from `server/copywriter.ts`
- [ ] **Free-form Text Fields**: For every textarea or long-text input field:
  - Add "Generate with AI" button next to the field
  - Implement onClick handler calling appropriate copywriter function
  - Show loading state during AI generation
  - Replace field content with AI-generated text
  - Provide undo/revert option after AI generation
- [ ] **AI Prompt Engineering**: Configure appropriate context and instructions for the content type
- [ ] **Error Handling**: Display user-friendly messages if AI generation fails
- [ ] **Rate Limiting**: Respect API rate limits for Gemini integration

#### 5. Testing & Quality Assurance
- [ ] **Data Validation**: Test form validation with invalid inputs
- [ ] **Empty States**: Verify appropriate messaging when no content exists
- [ ] **Loading States**: Show skeletons or spinners during data fetching
- [ ] **Error States**: Handle and display API errors gracefully
- [ ] **Accessibility**: Ensure `data-testid` attributes on interactive elements
- [ ] **Dark Mode**: Verify component renders correctly in both light and dark themes
- [ ] **Cross-browser**: Test in Chrome, Firefox, and Safari

#### 6. Content Personalization (if applicable)
- [ ] **Persona Targeting**: Configure which personas can see this content
- [ ] **Journey Stage Targeting**: Configure which funnel stages see this content
- [ ] **Passion Tag Filtering**: Add passion tag support if content is passion-specific
- [ ] **A/B Test Compatibility**: Ensure content can be targeted by A/B tests if needed