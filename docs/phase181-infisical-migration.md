# Phase 181: Infisical Migration

## Purpose

This source-only lane adds an Infisical runtime path for KinFlo development,
preflight, and Convex codegen. It removes the routine dependency on the
interactive 1Password desktop/CLI session without changing the existing
1Password path. The 1Password runner remains the rollback path until a later
environment migration is separately approved and verified.

## Source contract

The new wrapper is `scripts/run-kinflo-with-infisical-env.mjs`. It invokes
`infisical run` and injects secrets into the child process at runtime. It does
not write `.env.local`, print secret values, create an Infisical project, or
modify any external configuration.

Non-secret pointers are supplied through:

- `INFISICAL_PROJECT_ID` — optional when a committed `.infisical.json` pointer exists;
- `INFISICAL_ENV` — defaults to `dev`;
- `INFISICAL_PATH` — defaults to `/`;
- `INFISICAL_API_URL` — optional HTTPS API URL for non-US Cloud or self-hosted use.

The wrapper never stores or prints `INFISICAL_TOKEN`, machine identity client
secrets, or any fetched secret. Values remain in the child process environment
only. Infisical documents this `infisical run -- <command>` runtime-injection
pattern and the safe, non-secret project pointer created by `infisical init`.

## Package commands

```text
npm run kinflo:infisical-env-check
npm run kinflo:dev:infisical
npm run kinflo:activation-preflight:infisical
npm run kinflo:convex-codegen:infisical
```

The check command validates only the local CLI and pointer contract. It does
not fetch secrets. The other commands require the user or a separately
approved machine identity to have access to the selected Infisical project,
environment, and path.

## Environment layout

Use one Infisical project with distinct `dev`, `preview`, and `prod`
environments. Keep application paths separate from deployment credentials:

```text
/web
/convex
/auth
/ci
```

The production environment must never be used by a local development command.
Convex deploy keys remain environment-scoped and must be injected only into a
bounded deployment workflow. They must not be placed in the repository,
`.env.local`, a browser bundle, or chat.

## Migration sequence

1. Create or select the KinFlo Infisical project and confirm the non-secret
   project ID and environment names.
2. Add Dev values in Infisical without deleting or rotating the 1Password
   values.
3. Authenticate locally with `infisical login` and run the contract check.
4. Run the Dev wrapper against a non-production command and capture only
   sanitized presence/status evidence.
5. Add dedicated machine identities for remote agents and CI, each limited to
   one environment/path. Prefer short-lived access tokens or OIDC where the
   platform supports it.
6. Add Preview values and verify the Preview deployment path separately.
7. Configure Vercel environment sync and GitHub Actions only under separate
   approvals; verify each binding before changing production.
8. Migrate Production last, retain the 1Password rollback path during a
   holdback period, then revoke old automation access in a separate gate.

## Explicit exclusions

This source-only lane performs **no Infisical secret creation or modification**,
machine identity creation, token issuance, Vercel change, GitHub secret change,
Convex change, Auth0 change, deployment, hosted smoke, provider write, data
mutation, production change, or 1Password record deletion. No Infisical login
or remote fetch is run by the validator.

## Validation

```bash
npm run kinflo:validate-infisical-migration
npm run kinflo:infisical-env-check
git diff --check
```

The first command is source-only. The second command reports pointer/CLI
presence and does not print secret values. A later environment-backed run is a
separate approval gate.
