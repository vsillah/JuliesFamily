# Phase 174: Browser-Safe Auth Aliases

Command:

```bash
npm run kinflo:validate-browser-safe-auth-aliases
```

## Purpose

Some embedded or extension-protected browsers can block direct navigation to `/api/login` or `/api/callback` before the request reaches the deployed server. Phase 174 keeps the existing `/api/login` and `/api/callback` routes intact, while adding browser-safe aliases that avoid the blocked path names:

- `/auth/login`
- `/auth/callback`

## Provider Boundary

The alias routes do not create users, send invitations, grant roles, run Convex codegen, import generated Convex APIs, or execute hosted Convex functions.

The OIDC provider must allow the browser-safe callback URL before the alias can complete a real sign-in:

```text
BASE_URL + /auth/callback
```

For production, that means:

```text
https://kinflo-website.vercel.app/auth/callback
```

## Validation

- `vercel.json` routes `/auth/*` to the serverless API bundle before the SPA fallback.
- `server/auth0.ts` registers a separate browser-safe OIDC strategy with callback URL `/auth/callback`.
- The legacy `/api/login` and `/api/callback` routes remain present.
- No `.env.local` file is written.
- No secret values are read or printed.
