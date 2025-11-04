# Julies Family Learning Program Website

## Overview
This non-profit website for Julie's Family Learning Program, a family support, wellness, and education center, showcases educational programs, impact, testimonials, events, and facilitates donations/volunteering. It's a full-stack web application with a React frontend (shadcn/ui) and an Express backend, designed with a warm, approachable aesthetic, elegant serif typography (Playfair Display) for headlines, and clean sans-serif fonts (Inter) for body text. Key ambitions include a persona-based personalization system, a CRM for lead capture and tracking, and a secure user profile system with photo uploads.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
Frontend Architecture
### Framework: React 18 with TypeScript and Vite. Routing: wouter for client-side routing. UI ### Component Library: shadcn/ui on Radix UI, using "New York" style. Styling: Tailwind CSS, custom CSS variables for theming (light/dark mode), WCAG AA compliant colors (primary warm orange/golden, secondary olive/khaki green, warm beige backgrounds). Typography uses Playfair Display (serif) for headlines and Inter (sans-serif) for body text. State Management: TanStack Query for server state, React hooks for local state. Key Features:

## Single-page application, responsive design.
### Persona-Based Personalization System (November 2025): 5 distinct personas (Adult Education Student, Service Provider, Parent, Donor, Volunteer) with privacy-friendly session storage. Delivers personalized hero sections, dynamic content reordering, adaptive messaging, and a persona selection modal.
### Admin Preview Mode (November 2025): Administrators can switch between personas and funnel stages to preview the site from different user perspectives. Uses session storage with admin-specific override keys. Includes visual indicator showing current preview state and one-click reset to default view.
### Personalized Lead Magnets (November 2025): Dynamic lead magnet system delivering 10 unique offers based on persona and funnel stage (TOFU/MOFU). Each persona receives tailored content at Awareness and Consideration stages, including interactive quizzes, checklists, and downloadable guides. All lead magnets integrate with the CRM for lead tracking.
### Image Assets: 8 unique, authentic images strategically matched to content sections.
### Parallax System: Smooth parallax effects on hero background, service/event card images, and Donation CTA using requestAnimationFrame.
### Hero Section Enhancements: Text fade-in animation, semi-transparent shade for readability over images.

## CRM Components (November 2025): Lead capture form with persona and funnel stage tracking, and an Admin Dashboard for lead management and analytics.
Profile Photo Upload System (November 2025): Authenticated users can upload profile photos via Uppy, stored in Replit App Storage with secure, time-limited upload URLs and ACLs. Uses token-based authentication for secure upload validation.

## Backend Architecture
Framework: Express.js on Node.js with TypeScript. Storage Pattern: Interface-based abstraction with PostgreSQL (Neon serverless) via Drizzle ORM. API Design: RESTful API endpoints (/api), JSON format, with session support. Includes object storage endpoints for signed upload URLs and private object serving with ACL checks.

## Data Storage
ORM: Drizzle ORM for PostgreSQL (Neon serverless). Schema: shared/schema.ts includes users, sessions, leads, interactions, and lead_magnets tables with Zod validation. Migration Strategy: Drizzle Kit for schema management and push-based deployment.

## Authentication & Authorization
Implementation: Replit Auth with OpenID Connect (November 2025). Architecture: Passport.js with per-domain OIDC strategies, PostgreSQL session storage (connect-pg-simple), automatic access token refresh, secure cookies, and protected routes. Authentication Flow: Standard OAuth flow with user upsert (using email as conflict target) into the database and session creation. Session Persistence: Cookie security set to 'auto' to work with Replit's HTTPS proxy, with 'trust proxy' enabled. CSP headers from infrastructure are removed to allow legitimate external resources (Google Fonts, Cloudinary CDN). User IDs: User IDs are immutable once created and always use the OIDC sub (subject) as the canonical identifier. The upsertUser function updates name and profile data but never changes the ID to avoid foreign key constraint violations. Admin Features: Admin users (identified by isAdmin flag) can access additional features including the Admin Dashboard and Preview Mode for testing personalized content. Public Access: Website content is publicly accessible; authentication is optional for future features. Supported OAuth Providers: Google, GitHub, X, Apple, Email/password (via Replit Auth).

## External Dependencies
UI Framework & Components
Radix UI: Accessible UI primitives.
shadcn/ui: Pre-built components.
Lucide React: Icon library.
class-variance-authority: Type-safe styling.
tailwind-merge & clsx: Tailwind class utilities.
Data Fetching & State Management
TanStack Query: Server state management.
React Hook Form: Form state management with resolvers.
Database & ORM
Drizzle ORM: TypeScript ORM.
@neondatabase/serverless: Neon PostgreSQL driver.
connect-pg-simple: PostgreSQL session store.
Development Tools
Vite: Frontend build tool.
esbuild: Backend bundling.
tsx: TypeScript execution.
TypeScript: Type safety.
Replit-Specific Tools
@replit/vite-plugin-runtime-error-modal: Error overlay.
@replit/vite-plugin-cartographer: Code navigation.
@replit/vite-plugin-dev-banner: Development indicator.
Fonts & Typography
Google Fonts: Playfair Display and Inter.
Utility Libraries
date-fns: Date manipulation.
nanoid: Unique ID generation.
zod: Schema validation.
