# Phase 175: KinFlo Convex Identity Cutover

Command:

```bash
npm run kinflo:validate-convex-identity-cutover
```

## Decision

The first safe slice is a KinFlo-only Convex Auth boundary with Auth0 as its provider.

This reuses the provider already present in KinFlo's deployed identity metadata and avoids creating a new identity provider or organization model during the database cutover. The WorkOS identity-plane recommendation remains a separate future staging proof; it is not activated or displaced by this slice.

KinFlo product data remains in Convex. Supabase and Postgres are not KinFlo data targets. Julie's public and legacy routes keep the existing Express OIDC session and Drizzle/Postgres path until a separately scoped migration is approved.

The `/admin/kinflo-os` route now chooses one of three explicit states:

- `convex_auth`: use `VITE_CONVEX_URL`, Convex Auth, the Auth0 provider, `controlPlane.viewer`, and `controlPlane.upsertCurrentUser`.
- `local_fixture`: development-only fixture identity for the privacy-safe local visual QA server.
- `disabled`: fail closed without calling `/api/auth/user` or falling back to the Postgres session.

The default is `disabled`. A production build cannot enable `local_fixture`.

The global Julie persona modal and chatbot are not mounted on the KinFlo admin route. This prevents those legacy consumers from issuing `/api/auth/user` requests above the isolated KinFlo boundary.

## Authorization Boundary

An Auth0 sign-in is identity proof, not KinFlo admin authority. After authentication, the route resolves the Convex user projection. Only a user whose Convex `platformRole` is `super_admin` may render the KinFlo admin shell. Missing configuration, missing projection, sync failure, and non-admin users remain blocked.

The client uses manually typed Convex function references for this narrow identity boundary. It does not import or commit `convex/_generated` files, and it does not change `generatedApiAvailable` for KinFlo business-data adapters.

## Required Environment Before Merge Or Deployment

The Vercel KinFlo deployment needs:

- `VITE_KINFLO_IDENTITY_MODE=convex_auth`
- `VITE_CONVEX_URL=<approved KinFlo Convex deployment URL>`

The matching Convex deployment needs its existing Convex Auth keys plus:

- `AUTH_AUTH0_ID`
- `AUTH_AUTH0_SECRET`
- `AUTH_AUTH0_ISSUER`

Auth0 must allow the Convex Auth callback URL:

```text
https://<convex-site-host>/api/auth/callback/auth0
```

These values must be configured through the approved secret-management path. Do not write `.env.local`, print secret values, or expose provider secrets through `VITE_*` variables.

## Scope And Residual Gate

This source slice does not configure Auth0, change provider resources, read secrets, run hosted Convex, run codegen, import generated bindings, switch KinFlo business-data adapters, merge, or deploy.

The draft PR is source-ready only. Captain merge remains blocked until the environment metadata, Auth0 callback, Convex Auth deployment, and a bounded authenticated KinFlo smoke are separately approved and verified.

## Rollback

Before deployment, rollback is simply declining the PR. After an approved deployment, remove `VITE_KINFLO_IDENTITY_MODE=convex_auth` to fail the KinFlo route closed. Julie's existing routes remain available because this slice does not edit `server/auth0.ts`, `/api/login`, `/api/callback`, `/auth/login`, or `/auth/callback`.
