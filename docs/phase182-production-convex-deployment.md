# Phase 182: Production Convex deployment path

This runbook fixes the production Convex deployment failure where a clean checkout
used an unpinned `npx convex` fallback before dependencies were installed. The
repository now pins the Convex CLI to `1.42.1` and exposes a package script that
resolves the checked-in local binary.

## Bounded deployment path

From a clean checkout of the exact approved commit:

```bash
npm ci --ignore-scripts --no-audit --no-fund
infisical run --silent --env=prod --path=/convex \
  --projectId="$INFISICAL_PROJECT_ID" -- \
  npm run kinflo:convex-deploy:production
```

The Infisical project, `prod` environment, `/convex` path, and concealed
`CONVEX_DEPLOY_KEY` must be verified before the command. The key must bind to
`clever-viper-68`; values must never be printed or written to `.env.local`.

The deploy command performs Convex typecheck, code generation, bundling, and
function/schema push for the selected deployment. It must be one bounded attempt.
Do not substitute `npx convex deploy`, which can silently install a different
CLI version when `node_modules` is absent.

## Provisioning boundary

Deployment success is separate from the one-time production mutation. Only after
the exact Vercel and Convex deployment is READY may the authenticated platform
administrator invoke `controlPlane:provisionTenantAndSite` once for the approved
`vanguard-enterprises` tenant/site. Provisioning is not part of the deploy script.

No hosted smoke, provider write, communication, upload, or unrelated mutation is
part of this repair.
