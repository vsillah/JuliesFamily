# Running Julie's Family Learning Program Locally

This guide explains how to migrate this application from Replit to GitHub and run it on your local machine or deploy it to other platforms.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Critical Changes Needed](#critical-changes-needed)
- [Deployment Options](#deployment-options)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

**Required Software:**
- Node.js 20.x or higher
- npm or yarn
- PostgreSQL database (or Neon account)
- Git

**Required Accounts:**
- Cloudinary account (for image optimization)
- PostgreSQL database provider (Neon, Railway, Supabase, etc.)
- OAuth provider account (if replacing Replit Auth)

---

## Environment Variables

### Required Environment Variables

Create a `.env` file in the root directory with these variables:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database

# Session Management
SESSION_SECRET=your-long-random-secret-key-here

# Cloudinary (Image CDN)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Authentication (REQUIRES REPLACEMENT - see below)
REPL_ID=your-oauth-client-id
ISSUER_URL=https://replit.com/oidc

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Optional Environment Variables

```env
# Object Storage (Replit-specific - may need replacement)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-bucket-id
PUBLIC_OBJECT_SEARCH_PATHS=/public
PRIVATE_OBJECT_DIR=/.private
```

### Creating `.env.example` Template

Copy this template for version control:

```bash
# Create environment template
cat > .env.example << 'EOF'
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=generate-a-random-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_ISSUER_URL=your-oauth-issuer
PORT=5000
NODE_ENV=development
EOF
```

---

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd julies-family-learning

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your actual credentials
nano .env  # or use your preferred editor
```

### 3. Set Up Database

```bash
# Run database migrations
npm run db:push
```

### 4. Start Development Server

```bash
# Start the application
npm run dev
```

The application will be available at `http://localhost:5000`

---

## Detailed Setup

### Database Setup

**Option 1: Use Neon (Recommended)**
1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

**Option 2: Local PostgreSQL**
```bash
# Create database
createdb julies_family_learning

# Set DATABASE_URL
DATABASE_URL=postgresql://localhost:5432/julies_family_learning
```

**Option 3: Other Providers**
- Railway: [railway.app](https://railway.app)
- Supabase: [supabase.com](https://supabase.com)
- Amazon RDS
- Google Cloud SQL

### Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → Account Details
3. Copy Cloud Name, API Key, and API Secret
4. Add to `.env` file

### Session Secret Generation

Generate a secure random session secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 64
```

---

## Critical Changes Needed

### 🔴 1. Authentication System Replacement (CRITICAL)

**Current Issue:** The app uses Replit Auth which only works on Replit.

**Files to Modify:**
- `server/replitAuth.ts` - Main authentication configuration
- Environment variables (`REPL_ID`, `ISSUER_URL`)

**Replacement Options:**

#### Option A: Standard OAuth Providers (Google, GitHub)

```javascript
// Example: Replace Replit OIDC with Google OAuth
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    // User upsert logic
  }
));
```

#### Option B: Auth Services (Easiest)

- **Auth0**: Full-featured, drop-in replacement
- **Clerk**: Modern auth with great DX
- **Supabase Auth**: If already using Supabase for database

#### Option C: Email/Password Auth

Use the existing `passport-local` dependency:

```javascript
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';

passport.use(new LocalStrategy(
  async (username, password, done) => {
    // Verify credentials
  }
));
```

### 🟡 2. Object Storage Replacement (Optional)

**Current:** Uses Replit App Storage via Google Cloud Storage SDK

**Options:**

#### Option A: Migrate to Cloudinary (Recommended)
- Already partially implemented
- Move profile photos to Cloudinary
- Update `server/objectStorage.ts`

#### Option B: Use AWS S3
```bash
npm install @aws-sdk/client-s3
```

#### Option C: Use Cloudflare R2 (S3-compatible)
- More affordable than S3
- Same API as S3

### 🟢 3. Remove Replit-Specific Dependencies

**Update `package.json`:**

Remove these dev dependencies:
```json
{
  "devDependencies": {
    "@replit/vite-plugin-cartographer": "^0.4.1",  // REMOVE
    "@replit/vite-plugin-dev-banner": "^0.1.1",    // REMOVE
    "@replit/vite-plugin-runtime-error-modal": "^0.0.3"  // REMOVE
  }
}
```

**Update `vite.config.ts`:**

```typescript
// BEFORE (lines 10-20)
...(process.env.NODE_ENV !== "production" &&
process.env.REPL_ID !== undefined
  ? [
      await import("@replit/vite-plugin-cartographer").then((m) =>
        m.cartographer(),
      ),
      await import("@replit/vite-plugin-dev-banner").then((m) =>
        m.devBanner(),
      ),
    ]
  : []),

// AFTER
// Remove the entire conditional block above
```

**Update `.gitignore`:**

```gitignore
# Dependencies
node_modules

# Build output
dist
server/public

# Environment variables
.env
.env.local
.env.*.local

# OS files
.DS_Store

# Generated files
vite.config.ts.*
*.tar.gz

# Replit-specific (if migrating)
.replit
repl.nix
```

---

## Build & Deployment

### Build Commands

```bash
# Development
npm run dev          # Start dev server with hot reload

# Type checking
npm run check        # TypeScript type checking

# Production build
npm run build        # Build frontend + backend
npm start            # Run production server

# Database
npm run db:push      # Sync database schema
```

### Build Output

```
dist/
  ├── public/        # Frontend build (Vite)
  └── index.js       # Backend build (esbuild)
```

---

## Deployment Options

### Option 1: Vercel (Recommended for Full-Stack)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

**`vercel.json` configuration:**
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ]
}
```

### Option 2: Railway

1. Create account at [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Add PostgreSQL database
4. Set environment variables
5. Deploy automatically on push

### Option 3: Render

1. Create account at [render.com](https://render.com)
2. Create "Web Service" from GitHub repo
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables

### Option 4: Traditional VPS (DigitalOcean, AWS, etc.)

```bash
# Install Node.js and PostgreSQL on server
# Clone repo
git clone <your-repo>
cd julies-family-learning

# Install dependencies
npm install --production

# Build
npm run build

# Run with PM2 (process manager)
npm install -g pm2
pm2 start dist/index.js --name julies-family
pm2 save
pm2 startup
```

---

## GitHub Setup

### 1. Create Repository

```bash
# Initialize git (if not already)
git init

# Add remote
git remote add origin https://github.com/yourusername/julies-family-learning.git

# Commit and push
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 2. GitHub Actions (CI/CD)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run check
      
      - name: Build
        run: npm run build
```

### 3. Repository Secrets

Add these in GitHub Settings → Secrets and variables → Actions:

- `DATABASE_URL`
- `SESSION_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

---

## Migration Checklist

### Before Migration

- [ ] Export any data from Replit database
- [ ] Download all uploaded assets (profile photos, images)
- [ ] Document current user accounts and admin users
- [ ] Save all environment variable values

### During Migration

- [ ] Create GitHub repository
- [ ] Update `.gitignore` to exclude `.env` files
- [ ] Remove Replit-specific dependencies
- [ ] Update `vite.config.ts` (remove Replit plugins)
- [ ] Create `.env.example` template
- [ ] Set up new database (Neon, Railway, etc.)
- [ ] Configure Cloudinary account
- [ ] **Replace authentication system** (critical!)
- [ ] Update object storage (if needed)

### After Migration

- [ ] Test local development: `npm run dev`
- [ ] Test production build: `npm run build && npm start`
- [ ] Run database migrations: `npm run db:push`
- [ ] Upload images to Cloudinary
- [ ] Test authentication flow
- [ ] Deploy to hosting platform
- [ ] Update DNS settings (if using custom domain)
- [ ] Monitor for errors in production

---

## Troubleshooting

### Database Connection Issues

**Error:** `DATABASE_URL, ensure the database is provisioned`
```bash
# Check if DATABASE_URL is set
echo $DATABASE_URL

# Verify database connection
psql $DATABASE_URL -c "SELECT version();"
```

### Build Failures

**Error:** Module not found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Authentication Not Working

**Issue:** Sessions not persisting

1. Check `SESSION_SECRET` is set
2. Verify cookie settings in `server/replitAuth.ts`
3. Ensure `trust proxy` is enabled for production
4. Check browser console for CORS errors

### Port Already in Use

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=3000 npm run dev
```

### TypeScript Errors

```bash
# Check for type errors
npm run check

# Clean TypeScript cache
rm -rf node_modules/typescript/tsbuildinfo
```

---

## Project Structure

```
julies-family-learning/
├── client/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utilities
│   │   └── contexts/    # React contexts
│   └── index.html
├── server/              # Backend (Express)
│   ├── index.ts         # Entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   ├── replitAuth.ts    # Authentication (NEEDS REPLACEMENT)
│   ├── cloudinary.ts    # Image optimization
│   └── db.ts            # Database connection
├── shared/              # Shared types
│   └── schema.ts        # Database schema + types
├── attached_assets/     # Static assets
├── scripts/             # Utility scripts
├── .env                 # Environment variables (create this)
├── .env.example         # Environment template (create this)
├── package.json         # Dependencies
├── vite.config.ts       # Vite configuration
├── drizzle.config.ts    # Database ORM config
└── tsconfig.json        # TypeScript config
```

---

## Development Tips

### Hot Reload

The development server supports hot module replacement (HMR):
- Frontend changes reload instantly
- Backend changes require server restart (automatic with tsx)

### Database Schema Changes

After modifying `shared/schema.ts`:
```bash
npm run db:push  # Sync changes to database
```

### Adding New Routes

1. Add route handler in `server/routes.ts`
2. Create frontend page in `client/src/pages/`
3. Register route in `client/src/App.tsx`

### Environment-Specific Configuration

```typescript
// Check current environment
if (process.env.NODE_ENV === 'production') {
  // Production-only code
}
```

---

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Vite Documentation](https://vitejs.dev/)
- [Express Documentation](https://expressjs.com/)
- [Passport.js Documentation](http://www.passportjs.org/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---

## Support

For issues specific to this application:
1. Check this documentation
2. Review the `replit.md` file for architecture details
3. Check GitHub Issues (if repository is public)

For general development questions:
- Stack Overflow
- Node.js Discord
- React Discord

---

## Summary of Critical Changes

| Component | Current Status | Action Required |
|-----------|---------------|-----------------|
| **Dependencies** | ✅ Mostly OK | Remove 3 Replit plugins from `package.json` and `vite.config.ts` |
| **Database** | ✅ Good | Set `DATABASE_URL` environment variable |
| **Cloudinary** | ✅ Works | Set API credentials in environment |
| **Authentication** | ❌ **CRITICAL** | Replace Replit Auth completely with OAuth/Auth0/Clerk |
| **Object Storage** | ⚠️ Partial | Migrate profile photos to Cloudinary or S3 |
| **Build Scripts** | ✅ Good | Works as-is, no changes needed |
| **Environment** | ⚠️ Required | Set up all environment variables |

**The biggest challenge is replacing the authentication system.** Everything else is straightforward configuration and environment setup.

---

**Last Updated:** November 2025  
**Application Version:** 1.0.0  
**Node.js Version Required:** 20.x or higher
