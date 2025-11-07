# Julie's Family Learning Program Website

## Overview
Julie's Family Learning Program website is a non-profit, full-stack web application designed to showcase educational programs, impact, testimonials, and events. It facilitates donations and volunteering efforts. The platform features a React frontend with shadcn/ui and an Express backend, aiming for a warm and approachable aesthetic. The project seeks to enhance user engagement and streamline administrative tasks, with future ambitions including a persona-based personalization system, a CRM for lead capture, and a secure user profile system with photo uploads.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The website uses a React 18 frontend with TypeScript and Vite. Styling is handled by Tailwind CSS with custom CSS variables for theming, supporting light/dark modes. WCAG AA compliant colors are used, featuring a warm orange/golden primary, olive/khaki green secondary, and warm beige backgrounds. Typography includes Playfair Display (serif) for headlines and Inter (sans-serif) for body text. The UI component library is shadcn/ui on Radix UI, utilizing the "New York" style. Responsive design is a critical aspect, ensuring proper display across mobile, tablet, and desktop viewports, with a strong emphasis on preventing horizontal overflow. Dynamic and data-driven navigation is implemented.

### Technical Implementations
The frontend is a single-page application using `wouter` for client-side routing. State management relies on TanStack Query for server state and React hooks for local state. Key features include:
- **Persona-Based Personalization System**: Delivers personalized content based on 5 distinct personas.
- **Admin Preview Mode**: Allows administrators to preview the site from different persona and funnel stage perspectives.
- **Universal Multi-Select Visibility System**: ALL content types (services, events, testimonials, CTAs, heroes, videos, social media, program details, and lead magnets) support assignment to multiple persona×journey stage combinations simultaneously via a responsive multi-select checkbox grid interface in the admin panel, with bulk contentVisibility record creation. The grid uses mobile-first responsive design (1 column mobile, 2 columns tablet/desktop).
- **CRM Components**: Lead capture forms with tracking and an Admin Dashboard for lead management.
- **Profile Photo Upload System**: Authenticated users can upload profile photos via Uppy, stored in Replit App Storage.
- **Content Management System (CMS)**: A full-featured CMS for managing all website content, including images, universal multi-select visibility controls across all content types, and integration with Cloudinary for image optimization. JSON metadata fields have been removed from dialogs to prevent conflicts with UI-based visibility controls.
- **Persona×Journey Matrix Grid**: A visual interface for configuring content visibility across 120 permutations, enabling inline editing and content creation.
- **A/B Testing System**: A comprehensive platform for testing content, layouts, messaging, and CTAs, supporting weighted variant assignment, session-based tracking, and analytics. Uses the same responsive multi-select checkbox grid interface as content management for targeting multiple persona×journey stage combinations simultaneously. Tests persist combinations via abTestTargets junction table and serve variants only to matching visitor profiles.
- **Breadcrumb Navigation**: Hierarchical navigation across all admin pages.
- **User Management System**: An admin-only interface for managing user accounts and privileges.
- **User Guide System**: Provides public and protected documentation.
- **Google Reviews Integration**: Automated fetching and display of authentic Google business reviews with admin visibility controls.
- **Social Media Feed**: Carousel-based display of curated social media posts supporting Instagram, Facebook, and LinkedIn.
- **AI-Powered Screenshot Analysis for Social Media**: Uses Google's Gemini AI API to automatically extract post metadata from social media screenshots to pre-populate CMS fields.
- **YouTube Video Integration**: Zero-cost video hosting using YouTube embeds for student stories, virtual tours, and program highlights, integrated with the content visibility system.
- **Expandable Program Detail Dialogs**: Full-screen dialog modals providing comprehensive information about Julie's three core programs (Adult Education, Children's Services, Workforce Development) without separate pages.
- **Stripe Donation System**: Secure payment processing for one-time donations using Stripe Payment Intents with Elements UI, including preset and custom amounts, donor information capture, and anonymous donation options.
- **Email Automation System**: Automated transactional email delivery using SendGrid with template management, variable substitution, and an email audit trail. Includes webhook integration for thank-you and tax receipt emails on successful Stripe payments. Supports AI-powered copywriting for subject lines and body content.
- **SMS Notification System**: Template-based SMS messaging using Twilio with full CRUD capabilities for template management, variable substitution ({{firstName}}, {{lastName}}), persona targeting, and delivery tracking. Supports both template-based and custom one-off messages with AI-powered SMS copywriting integration. Features include E.164 phone number validation, character count warnings, and comprehensive send history.
- **Communication Timeline**: Unified chronological view of all lead interactions in a single timeline component, integrated into the Lead Details dialog. Aggregates data from interactions (notes, calls, meetings), SMS sends, email campaign enrollments, and individual email logs. Features type-specific icons and color coding (email: blue, SMS: green, campaigns: purple, interactions: orange), status badges for delivery/read/failed states, content previews, and robust error handling with retry functionality. Uses contentEngaged field as primary content source to ensure all interaction types display meaningful information.
- **Task Management System**: Comprehensive task tracking and assignment system integrated into the CRM. Features a global Admin Tasks page (/admin/tasks) with stats dashboard showing total, pending, completed, and overdue tasks. Supports task creation with full metadata (title, type, assignee, due date, priority, description), task completion toggling, and comprehensive filtering by lead, assignee, and status. Lead-specific task views are integrated into LeadDetailsDialog for contextual task management. Uses URL-based query keys with predicate-based cache invalidation for real-time UI updates across all views. Task types include follow-up, call, email, meeting, and document tasks with priority levels (low, medium, high).
- **AI-Powered Copy Generation System**: Assists non-technical users in creating high-converting copy using Alex Hormozi's Value Equation framework (Dream Outcome × Perceived Likelihood / Time Delay × Effort & Sacrifice). Features persona-specific templates for all 5 personas, generates 3 variants per request with different framework focuses (balanced, dream outcome, trust/proof, speed, ease), supports both guided wizard mode and advanced custom prompt editing, costs ~$0.000017 per generation using Google Gemini AI, and integrates with A/B testing for data-driven copy optimization. Works across email campaigns, SMS notifications, and content management. Admin-only access with generation tracking via aiCopyGenerations table.

### System Design Choices
The backend is built with Express.js on Node.js with TypeScript, providing RESTful API endpoints. Data storage uses PostgreSQL (Neon serverless) via Drizzle ORM. Authentication and authorization are handled by Replit Auth with OpenID Connect (Passport.js), using PostgreSQL for session storage, secure cookies, and protected routes. User IDs are immutable, and an `isAdmin` flag controls access to administrative features.

## External Dependencies

### UI Framework & Components
- **Radix UI**: Accessible UI primitives.
- **shadcn/ui**: Pre-built components.
- **Lucide React**: Icon library.
- **class-variance-authority**: Type-safe styling.
- **tailwind-merge & clsx**: Tailwind class utilities.

### Data Fetching & State Management
- **TanStack Query**: Server state management.
- **React Hook Form**: Form state management with resolvers.

### Database & ORM
- **Drizzle ORM**: TypeScript ORM.
- **@neondatabase/serverless**: Neon PostgreSQL driver.
- **connect-pg-simple**: PostgreSQL session store.

### Replit-Specific Tools
- **@replit/vite-plugin-runtime-error-modal**: Error overlay.
- **@replit/vite-plugin-cartographer**: Code navigation.
- **@replit/vite-plugin-dev-banner**: Development indicator.

### Fonts & Typography
- **Google Fonts**: Playfair Display and Inter.

### Utility Libraries
- **date-fns**: Date manipulation.
- **nanoid**: Unique ID generation.
- **zod**: Schema validation.
- **Uppy**: Profile photo upload system.
- **Cloudinary**: Image upscaling and optimization.
- **Google Places API**: For fetching business reviews.
- **react-lite-youtube-embed**: Lightweight YouTube embed component.
- **Google Gemini AI API**: For social media screenshot analysis.
- **Stripe**: Payment processing for donations.
- **SendGrid**: Email delivery service.