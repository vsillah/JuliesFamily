# Julie's Family Learning Program Website

## Overview

Julie's Family Learning Program website is a non-profit, full-stack web application designed to showcase educational programs, impact, testimonials, and events. It facilitates donations and volunteering efforts. The platform features a React frontend with shadcn/ui and an Express backend, aiming for a warm and approachable aesthetic. Key ambitions include a persona-based personalization system, a CRM for lead capture, and a secure user profile system with photo uploads. The project seeks to enhance user engagement and streamline administrative tasks.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The website uses a React 18 frontend with TypeScript and Vite. Styling is handled by Tailwind CSS with custom CSS variables for theming, supporting light/dark modes. WCAG AA compliant colors are used, featuring a warm orange/golden primary, olive/khaki green secondary, and warm beige backgrounds. Typography includes Playfair Display (serif) for headlines and Inter (sans-serif) for body text. The UI component library is shadcn/ui on Radix UI, utilizing the "New York" style. Responsive design is a critical aspect, ensuring proper display across mobile, tablet, and desktop viewports, with a strong emphasis on preventing horizontal overflow. Dynamic and data-driven navigation is implemented, querying `contentVisibility` settings for persona and funnel stage-based routing.

### Technical Implementations
The frontend is a single-page application using `wouter` for client-side routing. State management relies on TanStack Query for server state and React hooks for local state. Key features include:
- **Persona-Based Personalization System**: Delivers personalized content, hero sections, and messaging based on 5 distinct personas, with preferences stored in the database for authenticated users and session storage for unauthenticated users.
- **Admin Preview Mode**: Allows administrators to preview the site from different persona and funnel stage perspectives.
- **Personalized Lead Magnets**: A fully database-driven system delivering 20 unique offers tailored to persona and funnel stage, integrated with the CRM. Lead magnets query visibility settings from the database via `/api/content/visible/lead_magnet` endpoint, with fallback UI for critical persona/stage combinations (StudentReadinessQuiz, VolunteerMatchQuiz, SchoolReadinessChecklist). Admins can manage lead magnet visibility through the Matrix Grid, and create new lead magnets via Content Manager. Each lead magnet has one primary target persona×funnel stage combination stored as visibility records. Seeding script `seedLeadMagnetVisibility.ts` reads metadata from content items to populate visibility records.
- **Parallax System**: Smooth parallax effects on various page elements.
- **CRM Components**: Lead capture forms with tracking and an Admin Dashboard for lead management.
- **Profile Photo Upload System**: Authenticated users can upload profile photos via Uppy, stored in Replit App Storage with secure, time-limited URLs.
- **Content Management System (CMS)**: A full-featured CMS for managing all website content, including images, visibility controls, drag-and-drop reordering, and integration with Cloudinary for image optimization. The Content Manager uses a line-item visibility pattern where all items (active and inactive) are always displayed in the list. Hidden items feature distinctive visual styling including dashed borders, muted backgrounds, and prominent status badges. Each item displays its visibility status ("Visible on website" or "Hidden from website") with clear icon indicators. Line-item toggle buttons allow administrators to show/hide individual items with text labels ("Show"/"Hide") and comprehensive accessibility attributes (aria-label, aria-pressed, data-testid).
- **Persona×Journey Matrix Grid**: A visual interface for configuring content visibility across 120 permutations, enabling inline editing and A/B test variant management.
- **A/B Testing System**: A comprehensive platform for testing content, layouts, messaging, and CTAs, supporting weighted variant assignment, session-based tracking, and detailed analytics with statistical significance calculations. It supports dual-mode variant creation (existing CM items or custom inline variants) and enhanced content selection with real-time duplicate title validation.
- **Breadcrumb Navigation**: Hierarchical navigation across all admin pages for improved accessibility and usability.
- **Lead Details Dialog with Outreach**: A comprehensive dialog for lead management, displaying contact information, engagement scores, notes, interaction history, and outreach suggestions.
- **User Management System**: An admin-only interface for managing user accounts and privileges, including searchable tables and secure access controls.
- **User Guide System**: Provides public documentation for visitors ("How It Works" page) and protected documentation for administrators ("Admin Guide") covering various system functionalities.
- **Google Reviews Integration**: Automated fetching and display of authentic Google business reviews with responsive carousel (1/2/3 reviews per viewport), admin visibility controls via Content Manager tab, and SEO-optimized JSON-LD schema markup.
- **Social Media Feed**: Carousel-based display of curated social media posts supporting both Instagram and Facebook platforms. Features responsive layout (1/2/3 posts per viewport), platform badges on each post, icon-only social links with "Follow us" label, self-contained data fetching, graceful handling of posts without images, and full Content Manager integration for visibility controls, platform selection, and content editing.
- **AI-Powered Screenshot Analysis for Social Media**: A streamlined content entry workflow that uses Google's Gemini AI API (free tier: 250 requests/day) to automatically extract post metadata from screenshots. Admins upload a screenshot of a social media post, and the system analyzes it to extract caption text, detect platform (Instagram/Facebook), identify username, generate a suggested title, and construct profile links. The extracted data auto-populates form fields in the Content Manager, which admins can review and edit before saving. Features include: automatic MIME type detection (supports JPEG, PNG, WebP), base64 image encoding for API transmission, graceful error handling with toast notifications, screenshot preview display, manual editing capabilities, and integration with both create and edit dialogs in the Social Media content tab. Backend endpoint `/api/analyze-social-post` processes uploads and returns structured JSON data. Uses Google GenAI SDK with `GOOGLE_API_KEY` from Replit Secrets.

### System Design Choices
The backend is built with Express.js on Node.js with TypeScript, providing RESTful API endpoints. Data storage uses PostgreSQL (Neon serverless) via Drizzle ORM, with a defined schema for various entities including users, sessions, leads, content, and A/B tests. Authentication and authorization are handled by Replit Auth with OpenID Connect (Passport.js), using PostgreSQL for session storage, secure cookies, and protected routes. User IDs are immutable, and an `isAdmin` flag controls access to administrative features. Content is publicly accessible, with authentication optional for future features.

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
- **Cloudinary**: Image upscaling and optimization (integrated with CMS).
- **Google Places API**: For fetching business reviews.