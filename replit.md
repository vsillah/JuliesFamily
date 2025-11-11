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