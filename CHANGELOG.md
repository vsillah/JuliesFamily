# Changelog

All notable changes to Julie's Family Learning Program website will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Email/SMS automation for lead outreach via SendGrid or Twilio
- Advanced analytics dashboard with conversion funnels
- Mobile app for on-the-go access

---

## [1.1.0] - 2025-11-05

### Added
- **A/B Testing Wizard**: Complete 4-step wizard interface for creating experiments
  - **Discover Step**: Performance metrics with visual indicators and smart recommendations based on actual engagement data
  - **Configure Step**: Variant management with Content Manager integration, preventing data duplication
  - **Target Step**: Persona and funnel stage targeting with traffic allocation controls
  - **Review Step**: Comprehensive launch validation with visual preview
- **Launch Validation**: Backend and frontend enforcement preventing invalid test configurations
  - Requires minimum 2 variants
  - Enforces exactly one control variant
  - Validates traffic weights sum to 100%
- **Content Manager Integration**: A/B test variants now reference existing content items as single source of truth

### Changed
- A/B test creation flow migrated from technical JSON forms to intuitive visual wizard
- Variant configuration simplified with content item selection instead of manual data entry

### Fixed
- Critical validation bug allowing tests to launch without control variants
- Launch button now properly disabled until all validation checks pass

---

## [1.0.0] - 2025-11-01

### Added

#### **Personalization & User Experience**
- **Persona-Based Personalization System**: Dynamic content adaptation for 5 distinct user types
  - Adult Education Student
  - Service Provider
  - Parent
  - Donor
  - Volunteer
- **Persona Selection Modal**: First-visit modal for unauthenticated users with session persistence
- **Dynamic Content Reordering**: Automatically prioritizes relevant content based on persona
- **Adaptive Messaging**: Hero sections and CTAs tailored to each persona's motivations
- **Funnel Stage Tracking**: TOFU/MOFU/BOFU journey stages with stage-specific content
- **Admin Preview Mode**: Switch between personas and stages to preview site from different perspectives
  - Visual indicator showing current preview state
  - One-click reset to default view
  - Session-based storage with admin-specific override keys

#### **Lead Generation & CRM**
- **Personalized Lead Magnets**: 10 unique offers based on persona and funnel stage
  - Interactive quizzes for self-assessment
  - Downloadable checklists and guides
  - Stage-appropriate content (Awareness vs. Consideration)
- **Lead Capture Form**: Integrated with persona and funnel stage tracking
- **Admin Dashboard for Leads**: Comprehensive lead management interface
  - Searchable lead table with filtering by persona, stage, and engagement
  - Lead analytics and conversion metrics
  - Interaction history timeline
- **Lead Details Dialog**: Full contact management with outreach capabilities
  - Complete contact information display
  - Editable notes with auto-save
  - Engagement score calculation
  - Interaction history with timestamps
  - Funnel-stage-specific outreach action suggestions
  - Placeholder integration points for future email/SMS automation
- **Engagement Scoring**: Automatic calculation based on lead interactions and conversions

#### **Content Management**
- **Full-Featured CMS**: Admin interface for managing all website content
  - Services management with visibility controls
  - Events calendar with date/location tracking
  - Testimonials with author attribution
  - Lead magnets with persona/stage targeting
- **Image Management**: Integration with Cloudinary for AI-powered optimization
  - Automatic image upscaling
  - Format optimization (WebP, AVIF)
  - Responsive image delivery
- **Visibility Settings**: Control which content appears on public site
- **Content Ordering**: Drag-and-drop or manual ordering for display priority
- **Persona×Journey Matrix Grid**: Visual content configuration interface
  - 120 permutations (5 personas × 4 stages × 6 content types)
  - Always-visible 5×4 grid layout with mini-cards
  - Thumbnails showing customization status
  - Inline editing panel with image upload/selection
  - Title/description overrides per persona-stage combination
  - A/B test variant management per cell

#### **A/B Testing & Experimentation**
- **Comprehensive Testing Platform**: Test different configurations, layouts, and messaging
  - Weighted variant assignment
  - Session-based tracking preventing double-counting
  - Conversion metrics and event tracking
  - Statistical significance calculation (two-tailed z-test with 95% confidence)
- **Test Types Supported**:
  - Hero section variations
  - CTA button variations
  - Service card ordering
  - Messaging tests
- **Detailed Analytics Dashboard**:
  - Conversion rates per variant
  - Statistical significance indicators
  - Engagement metrics
  - Winner recommendations
- **Persona & Funnel Stage Targeting**: Run tests for specific audience segments

#### **User Management & Authentication**
- **Replit Auth Integration**: OpenID Connect authentication
  - Google Login
  - GitHub Login
  - X (Twitter) Login
  - Apple Login
  - Email/password authentication
- **User Management System**: Admin-only interface for account management
  - Searchable user table with name, email, and admin status
  - One-click admin privilege granting/revocation
  - Confirmation dialogs for privilege changes
  - Safety feature preventing self-privilege removal
  - Real-time updates using TanStack Query
- **Profile Photo Upload**: Secure photo uploads for authenticated users
  - Uppy integration for drag-and-drop uploads
  - Replit App Storage for secure file hosting
  - Time-limited upload URLs with ACL protection
  - Token-based authentication for upload validation
- **Session Management**: PostgreSQL-backed sessions with automatic refresh
  - Secure cookie handling with HTTPS proxy support
  - Automatic access token refresh
  - 'trust proxy' configuration for Replit infrastructure

#### **Navigation & UX**
- **Breadcrumb Navigation**: Hierarchical navigation across all admin pages
  - Current location indicator
  - Quick access to parent pages
  - Proper ARIA labels for accessibility
  - Hover states and semantic markup
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode Support**: Full light/dark theme toggle with localStorage persistence
- **Parallax Effects**: Smooth scrolling animations on hero and card images
- **Text Fade-In Animations**: Elegant hero section entrance effects

#### **Visual Design & Branding**
- **Custom Color Palette**: WCAG AA compliant colors
  - Primary: Warm orange/golden tones
  - Secondary: Olive/khaki green accents
  - Backgrounds: Warm beige tones
- **Typography System**:
  - Headlines: Playfair Display (elegant serif)
  - Body: Inter (clean sans-serif)
- **Image Library**: 8 unique, authentic images strategically matched to content
- **shadcn/ui Components**: Accessible, customizable UI library using Radix primitives

#### **Technical Infrastructure**
- **Database Schema**: PostgreSQL with Drizzle ORM
  - Users and sessions
  - Leads and interactions
  - Content items with visibility settings
  - A/B tests, variants, and events
  - Lead magnets
  - Image assets
- **API Architecture**: RESTful endpoints with JSON responses
  - Session-based authentication
  - Admin-only route protection
  - Zod validation for all inputs
- **Object Storage**: Replit App Storage integration
  - Public directory for website assets
  - Private directory for user uploads
  - Signed upload URLs
  - ACL-based access control

### Security
- **Admin Authorization**: Middleware protecting sensitive routes
- **OIDC Authentication**: Industry-standard OAuth flow
- **Immutable User IDs**: OIDC sub as canonical identifier preventing foreign key violations
- **Secure File Uploads**: Token-based validation and ACL enforcement
- **CSP Headers**: Configured to allow legitimate external resources (Google Fonts, Cloudinary CDN)
- **Cookie Security**: Auto-detection for HTTPS environments
- **Input Validation**: Zod schemas on all API endpoints

### Technical Notes
- React 18 with TypeScript and Vite
- Express.js backend with Node.js
- Wouter for client-side routing
- TanStack Query for server state management
- Drizzle ORM with Neon PostgreSQL
- Passport.js for authentication
- Uppy for file uploads
- Cloudinary for image optimization

---

## Project Information

**Project**: Julie's Family Learning Program Website  
**Organization**: Non-profit family support, wellness, and education center  
**Purpose**: Showcase educational programs, impact, testimonials, events, and facilitate donations/volunteering  
**Design Philosophy**: Warm, approachable aesthetic with elegant typography and user-centric personalization

**Key Stakeholders**: Students, Service Providers, Parents, Donors, Volunteers

For questions or contributions, please contact the development team.
