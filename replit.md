# Julie's Family Learning Program Website

## Overview

This is a non-profit website for Julie's Family Learning Program, a family support, wellness, and education center that has been serving families for over 50 years. The website showcases their educational programs, impact statistics, testimonials, upcoming events, and provides ways for visitors to donate or volunteer.

The application is built as a full-stack web application with a React frontend using shadcn/ui components and an Express backend. The design follows a warm, approachable aesthetic inspired by non-profit templates, featuring elegant serif typography (Playfair Display) for headlines and clean sans-serif fonts (Inter) for body text.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: wouter library for client-side routing (lightweight React Router alternative).

**UI Component Library**: shadcn/ui components built on Radix UI primitives, providing accessible, customizable components following the "New York" style variant.

**Styling**: 
- Tailwind CSS for utility-first styling
- Custom CSS variables for theming (light/dark mode support)
- Design system based on warm, approachable non-profit aesthetic
- Typography: Playfair Display (serif) for headlines, Inter (sans-serif) for body text
- Color scheme: 
  - **Primary**: Warm orange/golden (hsl 28° 75% 35%) - matches Julie's sunflower logo
  - **Secondary**: Olive/khaki green (hsl 75° 35% 45%) - from logo subtitle
  - **Base**: Warm beige/cream backgrounds for approachable feel
  - All colors meet WCAG AA accessibility standards (minimum 4.5:1 contrast ratio)

**State Management**: 
- TanStack Query (React Query) for server state management
- React hooks for local component state

**Component Structure**:
- Page components in `client/src/pages/`
- Reusable UI components in `client/src/components/`
- shadcn/ui primitives in `client/src/components/ui/`
- Context providers in `client/src/contexts/` (PersonaContext for personalization)
- Example components for development in `client/src/components/examples/`

**Persona-Aware Components**:
- `PersonaContext.tsx`: Core personalization provider with 5 persona types
- `PersonaSelectionModal.tsx`: Initial persona selection UI with Lucide icons
- `PersonalizedHero.tsx`: 5 distinct hero variations per persona
- `Navigation.tsx`: Persona badge and switcher in nav bar
- `Services.tsx`: Dynamic service ordering based on persona priorities
- `Events.tsx`: Persona-specific headlines and descriptions
- `DonationCTA.tsx`: Tailored call-to-action messaging per persona

**Key Features**:
- Single-page application with smooth scrolling navigation
- Responsive design (mobile-first approach)
- **Persona-Based Personalization System** (November 2025):
  - 5 distinct persona types: Adult Education Student, Service Provider, Parent, Donor, Volunteer
  - Privacy-friendly implementation using session storage (no cookies, GDPR-compliant)
  - Personalized hero experiences with unique headlines, messaging, CTAs, and imagery for each persona
  - Dynamic content reordering: Services section prioritizes most relevant programs per persona
  - Adaptive messaging across all sections: Events headlines and Donation CTA tailored to persona
  - Modal-based persona selection on first visit (2-second delay, skippable)
  - Persona badge in navigation allows easy switching between experiences
  - Session persistence maintains persona choice within browser session
  - Implemented with PersonaContext provider, Lucide React icons, and shadcn/ui components
- **Image assets**: 8 unique authentic photos from Julie's Family Learning Program stored in `attached_assets/`
  - **Hero**: Volunteer/student math tutoring session
  - **Children's Services**: PreK class group photo with diverse children
  - **Family Development**: Mother and child engaged in art activity
  - **Adult Education**: Full adult classroom with engaged learners
  - **50th Anniversary Event**: Graduation celebration with cake cutting
  - **Spring Graduation Event**: Outdoor graduation ceremony
  - **Fall Family Fair Event**: Children doing hands-on dinosaur egg activity
  - **Donation CTA**: Graduate with child celebrating achievement
  - Each image used exactly once, strategically matched to content
- **Parallax System**:
  - Hero background: Zoom effect (1.0 to 1.1 scale) based on scroll position
  - Service card images: ParallaxImage component with intensity 0.8
  - Event card images: ParallaxImage component with intensity 0.8
  - Donation CTA background: Custom parallax with intensity 0.04 (subtle)
  - Each image animates independently based on viewport position
  - Uses requestAnimationFrame for smooth 60fps performance
- **Hero Section Enhancements**:
  - Text fade-in animation (1 second smooth transition after 200ms delay)
  - Horizontal semi-transparent shade (30% black) between image and text layers
  - Shade height: 400px mobile, 500px desktop (covers mission text to buttons)
  - Enhanced text readability over photography
- Accessibility-first design with WCAG AA compliant colors

### Backend Architecture

**Framework**: Express.js running on Node.js with TypeScript.

**Server Structure**:
- Main entry point: `server/index.ts`
- Route registration: `server/routes.ts`
- Storage abstraction: `server/storage.ts`

**Storage Pattern**: 
- Interface-based storage abstraction (`IStorage`)
- PostgreSQL database storage (`DatabaseStorage`) using Drizzle ORM
- Active database integration with Neon serverless PostgreSQL

**Development Features**:
- Request/response logging middleware
- Raw body capture for webhook processing
- Vite integration for hot module replacement in development
- Replit-specific development tools (error overlay, cartographer, dev banner)

**API Design**: 
- RESTful API endpoints prefixed with `/api`
- JSON request/response format
- Session support prepared (express-session configured)

### Data Storage

**ORM**: Drizzle ORM configured for PostgreSQL via Neon serverless driver.

**Schema Location**: `shared/schema.ts` (shared between client and server).

**Current Schema**:
- `users` table: Stores authenticated users from Replit Auth
  - id (varchar, primary key): OAuth sub claim (unique identifier)
  - email (varchar): User's email address
  - firstName (varchar): User's first name
  - lastName (varchar): User's last name
  - profileImageUrl (varchar, nullable): User's profile image URL
  - createdAt (timestamp): Account creation time
  - updatedAt (timestamp): Last update time
- `sessions` table: Express session storage for authenticated sessions
  - sid (varchar, primary key): Session ID
  - sess (json): Session data including OAuth tokens
  - expire (timestamp, indexed): Session expiration for automatic cleanup
- Zod schemas for validation using drizzle-zod

**Migration Strategy**: 
- Drizzle Kit configured for schema management
- Migrations output to `./migrations` directory
- Push-based deployment (`db:push` script)

### Authentication & Authorization

**Implementation**: Replit Auth with OpenID Connect (November 2025)

**Architecture**:
- **OpenID Connect Provider**: Replit's OIDC service (`ISSUER_URL` env variable)
- **Strategy**: Passport.js with per-domain OIDC strategies
- **Session Storage**: PostgreSQL via connect-pg-simple (secure, persistent sessions)
- **Token Management**: Automatic access token refresh using refresh tokens
- **Security**: Secure cookies (HTTPS-only), session expiry (7 days), protected routes via `isAuthenticated` middleware

**Authentication Flow**:
1. User clicks "Sign In" → redirects to `/api/login`
2. Passport initiates OAuth flow with Replit OIDC provider
3. User authenticates via Replit (supports Google, GitHub, X, Apple, email/password)
4. OAuth callback at `/api/callback` creates session and upserts user in database
5. User redirected to homepage with authenticated session
6. Client-side `useAuth` hook queries `/api/auth/user` to get current user state
7. "Sign Out" → `/api/logout` clears session and redirects to Replit logout

**Key Files**:
- `server/replitAuth.ts`: OIDC configuration, Passport strategies, session middleware
- `server/routes.ts`: Authentication routes (`/api/login`, `/api/callback`, `/api/logout`, `/api/auth/user`)
- `server/storage.ts`: Database operations for user upsert
- `client/src/hooks/useAuth.ts`: Client-side authentication state hook
- `client/src/components/Navigation.tsx`: Sign In/Sign Out UI in navigation bar

**Required Environment Variables**:
- `REPL_ID`: Replit application ID (auto-provided in Replit environment)
- `SESSION_SECRET`: Secret key for session encryption (auto-generated)
- `DATABASE_URL`: PostgreSQL connection string (auto-provided)
- `ISSUER_URL`: OIDC issuer URL (defaults to `https://replit.com/oidc`)

**Public Access**: The website maintains public accessibility—all content (services, events, testimonials, etc.) is viewable without authentication. Authentication is optional and designed for future features like donation management, volunteer coordination, or admin panels.

**Supported OAuth Providers** (via Replit Auth):
- Google
- GitHub
- X (formerly Twitter)
- Apple
- Email/password

## External Dependencies

### UI Framework & Components

- **Radix UI**: Comprehensive suite of accessible UI primitives (@radix-ui/react-*)
- **shadcn/ui**: Pre-built component patterns using Radix UI and Tailwind CSS
- **Lucide React**: Icon library for consistent iconography
- **class-variance-authority**: Type-safe variant-based component styling
- **tailwind-merge & clsx**: Utility for merging Tailwind classes

### Data Fetching & State Management

- **TanStack Query**: Server state management and data fetching
- **React Hook Form**: Form state management (@hookform/resolvers for validation)

### Database & ORM

- **Drizzle ORM**: TypeScript ORM for PostgreSQL
- **@neondatabase/serverless**: Neon serverless PostgreSQL driver
- **connect-pg-simple**: PostgreSQL session store for Express

### Development Tools

- **Vite**: Frontend build tool and development server
- **esbuild**: Backend bundling for production
- **tsx**: TypeScript execution for development server
- **TypeScript**: Type safety across the stack

### Replit-Specific Tools

- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code navigation tool
- **@replit/vite-plugin-dev-banner**: Development environment indicator

### Fonts & Typography

- **Google Fonts**: Playfair Display (serif headlines) and Inter (sans-serif body text)

### Utility Libraries

- **date-fns**: Date manipulation and formatting
- **nanoid**: Unique ID generation
- **zod**: Schema validation (via drizzle-zod)

### Build & Deployment

- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer
- **Autoprefixer**: Automatic vendor prefix management