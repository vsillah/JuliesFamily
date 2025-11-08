# Julie's Family Learning Program Website (Powered by Kinflo)

## Overview
Julie's Family Learning Program website is a non-profit, full-stack web application showcasing educational programs, impact, testimonials, and events. It facilitates donations and volunteering. The platform also serves as a demonstration of **Kinflo**, a relationship-first CRM powering persona-based personalization, lead management, and communication automation. The project aims to provide a warm, approachable online presence while demonstrating advanced CRM functionalities for nonprofits.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
**November 8, 2025**: Fixed screenshot confirmation dialog in AdminContentManager
- Implemented proper controlled dialog pattern for screenshot upload confirmation
- Dialog now stays open when user tries to close with pending screenshot
- AlertDialog shows "Use Screenshot as Image?" confirmation
- Visibility assignments now properly cleared between edit/create sessions
- Pattern: Return early from `onOpenChange` without changing state when screenshot exists

## System Architecture

### UI/UX Decisions
The frontend uses React 18 with TypeScript and Vite, styled with Tailwind CSS, custom CSS variables, and shadcn/ui (New York style). It supports light/dark modes and WCAG AA compliant colors (orange/golden primary, olive/khaki secondary, warm beige backgrounds). Typography uses Playfair Display (serif) for headlines and Inter (sans-serif) for body text. Responsive design is paramount, ensuring optimal display across mobile, tablet, and desktop, with dynamic and data-driven navigation.

### Technical Implementations
The frontend is a single-page application using `wouter` for routing, TanStack Query for server state, and React hooks for local state. Key features include:
- **Persona-Based Personalization**: Delivers tailored content based on 5 distinct user personas.
- **Admin Preview Mode**: Allows administrators to view the site from different persona and funnel stage perspectives.
- **Universal Multi-Select Visibility System**: A responsive interface in the admin panel for assigning all content types to multiple persona and journey stage combinations.
- **CRM Components**: Lead capture forms, an Admin Dashboard for lead management, and a unified Communication Timeline.
- **Content Management System (CMS)**: Full-featured CMS with image management via Cloudinary and universal content visibility controls.
- **Persona×Journey Matrix Grid**: Visual interface for configuring content visibility across 120 permutations.
- **A/B Testing System**: Comprehensive platform for testing content, layouts, and messaging with weighted variant assignment and session-based tracking.
- **User Management System**: Admin interface for managing user accounts and privileges, including creation, deletion, and access control.
- **Google Reviews & Social Media Integration**: Automated display of Google reviews and a carousel for curated social media posts.
- **AI-Powered Social Media Analysis**: Uses Google Gemini AI to extract metadata from social media screenshots for CMS pre-population.
- **YouTube Video Integration**: Zero-cost video hosting via YouTube embeds, integrated with content visibility.
- **Expandable Program Detail Dialogs**: Full-screen modals for detailed program information.
- **Stripe Donation System**: Secure payment processing for one-time donations.
- **Email Automation System**: Transactional email delivery via SendGrid with template management, webhooks, and AI-powered copywriting.
- **SMS Notification System**: Twilio-based template SMS messaging with CRUD capabilities, persona targeting, delivery tracking, and AI-powered copywriting.
- **Task Management System**: Comprehensive task tracking and assignment integrated into the CRM, with a global dashboard and lead-specific views.
- **Pipeline Management & Analytics**: Kanban board for lead management with drag-and-drop, optimistic updates, and an analytics dashboard for conversion rates and bottlenecks.
- **AI-Powered Copy Generation System**: Assists in creating high-converting copy using Alex Hormozi's Value Equation framework and Google Gemini AI, with persona-specific templates and A/B testing integration.
- **Bulk Lead Import System**: Excel-based import for lead data with validation, error reporting, and automated task creation.
- **Google Calendar Integration**: OAuth-authenticated integration for appointment scheduling, event registration, and task synchronization, with real-time availability and timezone awareness.
- **Kinflo Product Landing Page**: Marketing page showcasing Kinflo's features as a modular CRM solution for nonprofits.

### System Design Choices
The backend uses Express.js on Node.js with TypeScript, providing RESTful API endpoints. Data is stored in PostgreSQL (Neon serverless) via Drizzle ORM. Authentication and authorization are managed by Replit Auth with OpenID Connect (Passport.js), using PostgreSQL for session storage.

## External Dependencies

### UI Framework & Components
- Radix UI
- shadcn/ui
- Lucide React
- class-variance-authority
- tailwind-merge & clsx

### Data Fetching & State Management
- TanStack Query
- React Hook Form

### Database & ORM
- Drizzle ORM
- @neondatabase/serverless
- connect-pg-simple

### Replit-Specific Tools
- @replit/vite-plugin-runtime-error-modal
- @replit/vite-plugin-cartographer
- @replit/vite-plugin-dev-banner

### Fonts & Typography
- Google Fonts (Playfair Display, Inter)

### Utility Libraries & Services
- date-fns
- nanoid
- zod
- Uppy
- Cloudinary
- Google Places API
- react-lite-youtube-embed
- Google Gemini AI API
- Stripe
- SendGrid