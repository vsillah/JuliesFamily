# Phase 182: production read-only adapter cutover preparation

This source-only packet binds the reviewed Phase 176 read-only adapter to the exact production source and deployment that passed the Vanguard Human QA gate. It prepares the next operational review. It does not change runtime configuration or open a new hosted action.

## Binding

- Source commit: `750685bd8d40ea948a4cf031a9de8428861fba52`
- Production deployment: `dpl_56TLt1jB6RvRtsNQettFmBSzgn2b`
- Convex deployment: `clever-viper-68`
- Route: `/admin/kinflo-os`
- Tenant/site scope: `vanguard-enterprises` / `vanguard-enterprises`

## Read-only batch

The bounded live batch contains nine queries:

- `controlPlane:listTenants`
- `controlPlane:listSitesForTenant`
- `controlPlane:listAuditEvents`
- `controlPlane:listPlanCatalog`
- `entitlements:entitlementUsageSnapshot`
- `entitlements:checkEntitlementLimit`
- `publicSite:resolvePublishedSite`
- `launchReadiness:getSiteLaunchReadiness`
- `activation:readiness`

The provider keeps the fixture snapshot until every required query resolves for the selected tenant/site pair. The full adapter remains fail-closed with `canUseLiveData: false`.

## Safety boundary

- This packet is preparation only; it does not change Vercel, Infisical, Auth0, or Convex configuration.
- No deployment, codegen, hosted smoke, mutation, provider write, publish, upload, or communication is run by the validator.
- Mutation hooks remain unmounted in the read-only snapshot provider.
- The fixture provider remains the rollback path for incomplete, mismatched, or unknown state.
- Generated Convex files remain ignored and no secret values are read or printed.
- Human QA approval is external to committed source and is not persisted as a runtime enablement flag.

## Validation

```bash
npm run kinflo:validate-production-read-only-adapter-cutover
npm run kinflo:validate-read-only-live-adapter
npm run kinflo:validate-adapter-switch-cutover-checklist
npm run check
```

These are local source checks. They do not open a hosted execution window.

## Next gate

A separate approval is required before changing runtime configuration, deploying a new source commit, running hosted smoke, or enabling any mutation/provider surface.
