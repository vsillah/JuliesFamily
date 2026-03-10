# Running Julie's Family Learning Program Locally

This guide explains how to migrate this application from Replit to GitHub and run it on your local machine or deploy it to other platforms.

**Quick summary of what to change when leaving Replit:** see **[MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)** for a one-page checklist (authentication, database, object storage, Twilio, etc.).

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

The server loads **`.env`** and **`.env.local`** at startup (via `dotenv` in `server/index.ts`). Copy **`.env.example`** to **`.env`** and fill in values.

### Required to start the app

- **`DATABASE_URL`** – PostgreSQL connection string.
- **`SESSION_SECRET`** – Long random secret for sessions.
- **`STRIPE_SECRET_KEY`** – Stripe secret key (required at startup).

### Authentication (OIDC)

Set for any OIDC provider (Auth0, Keycloak, Google, etc.):

- **`OIDC_ISSUER_URL`** – Issuer URL (e.g. `https://your-tenant.auth0.com`).
- **`OIDC_CLIENT_ID`** – Client ID.
- **`OIDC_CLIENT_SECRET`** – Client secret.
- **`BASE_URL`** – Base URL for callback and links (e.g. `http://localhost:5000`).

If these are not set, the app still starts but `/api/login` returns 503.

### Optional

- **`BASE_URL`** – Used for email links, unsubscribe links, and auth callback.
- **Cloudinary:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- **Twilio:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
- **Object storage (S3/R2):** `OBJECT_STORAGE_PROVIDER=s3`, `S3_BUCKET` or `R2_*` vars (see `.env.example`).
- **Google Sheets/Calendar:** `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`.

Use the project’s **`.env.example`** as the template; it lists all supported variables and short notes.

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

### 5. Get admin access (first time only)

The **Admin Dashboard** link in the nav appears only for users with the **admin** or **super_admin** role. New logins are created as **client** by default. To make your account an admin:

1. Log in once at `http://localhost:5000` so your user exists in the database.
2. From the project root, run (use the same email you used to log in):

   ```bash
   npx tsx scripts/promote-admin.ts your@email.com
   ```

3. Refresh the app (or log out and log in again). You should see the **Admin Dashboard** link and can use **User Management** to change other users’ roles.

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

## Critical Changes Needed (implemented)

### 1. Authentication (OIDC – implemented)

The app supports **any OIDC provider** (e.g. Auth0). Set **`OIDC_ISSUER_URL`**, **`OIDC_CLIENT_ID`**, and **`OIDC_CLIENT_SECRET`** in `.env`. Callback URL is **`BASE_URL`** + `/api/callback`. Legacy **`REPL_ID`** / **`ISSUER_URL`** still work. See **`server/auth0.ts`**.

### 2. Object Storage (implemented)

Set **`OBJECT_STORAGE_PROVIDER=s3`** and configure **S3** or **R2** env vars (see `.env.example`). The app uses **`server/objectStorageS3.ts`** when provider is `s3`; otherwise Replit GCS when on Replit.

### 3. Replit Vite plugins (removed)

Replit plugins have been removed from **`package.json`** and **`vite.config.ts`**. No action needed.

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
- [ ] Update `.gitignore` to exclude `.env` files (e.g. `.env`, `.env.local`)
- [x] Remove Replit-specific dependencies (Replit Vite plugins removed)
- [x] Update `vite.config.ts` (Replit plugins removed)
- [x] Create `.env.example` template
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
2. Verify cookie settings in `server/auth0.ts`
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
│   ├── auth0.ts         # Auth0 (OIDC) authentication
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

| Component | Status | Action |
|-----------|--------|--------|
| **Dependencies** | ✅ Done | Replit Vite plugins removed |
| **Database** | ✅ Good | Set `DATABASE_URL`; run `npm run db:push` |
| **Cloudinary** | ✅ Works | Set API credentials in `.env` |
| **Authentication** | ✅ Implemented | Set `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `BASE_URL` for any OIDC provider |
| **Object Storage** | ✅ Implemented | Set `OBJECT_STORAGE_PROVIDER=s3` and S3/R2 env vars when not on Replit |
| **Twilio / Google** | ✅ Implemented | Set `TWILIO_*` and `GOOGLE_SERVICE_ACCOUNT_*` for direct credentials |
| **Build Scripts** | ✅ Good | Works as-is |
| **Environment** | Required | Copy `.env.example` to `.env`; server loads `.env` and `.env.local` via dotenv |
| **First admin** | One-time | Log in once, then run `npx tsx scripts/promote-admin.ts your@email.com`; refresh to see Admin Dashboard |

---

**Last Updated:** November 2025  
**Application Version:** 1.0.0  
**Node.js Version Required:** 20.x or higher
