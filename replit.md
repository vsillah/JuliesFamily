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
- Example components for development in `client/src/components/examples/`

**Key Features**:
- Single-page application with smooth scrolling navigation
- Responsive design (mobile-first approach)
- Image assets stored in `attached_assets/` directory
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
- Currently using in-memory storage (`MemStorage`) for development
- Designed to be swapped for database-backed storage (Drizzle ORM configured)

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
- `users` table with id, username, and password fields
- Zod schemas for validation using drizzle-zod

**Migration Strategy**: 
- Drizzle Kit configured for schema management
- Migrations output to `./migrations` directory
- Push-based deployment (`db:push` script)

**Note**: The application is configured for PostgreSQL but currently uses in-memory storage. Database integration is prepared but not yet active.

### Authentication & Authorization

**Prepared Infrastructure**:
- User schema defined with username/password fields
- Session management configured (connect-pg-simple for PostgreSQL session store)
- No active authentication implementation currently

**Future Implementation**: System is prepared for adding authentication middleware and protected routes.

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