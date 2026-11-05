# Phase 180: Convex CLI Configuration-Write Diagnostic

## Status

The development deployment workflow is blocked from another run. Run `39033697728` on commit `f18710e38854889ccc0cb7c5b2254001d3b5d955` passed the fixed-target binding check, dependency installation, and credential-free local Convex typecheck. The single `convex dev --once` step then failed only because the post-command policy check found `.env.local`.

The sanitized GitHub annotation was `Environment-file policy failed: The Convex CLI created .env.local unexpectedly; the run is not valid evidence.` Raw action logs and secret values were not inspected.

Because that policy check runs only after the Convex command returns successfully, the CLI process exited successfully before the job was marked failed. A remote push may therefore have completed. This source review does not prove the hosted result, and another run is not authorized.

## Source diagnosis

The repository pins Convex CLI `1.42.1` in `package-lock.json`.

Installed CLI source establishes the following contract:

1. `npx convex dev` reads a deployment-scoped `CONVEX_DEPLOY_KEY` and resolves it directly to an existing deployment. No additional selector is required.
2. The hidden `--deployment` option is explicitly rejected by `convex dev`; the CLI instructs interactive users to select a deployment first instead.
3. Deployment-key selection takes precedence over `CONVEX_DEPLOYMENT`, so adding that variable is not a supported fix.
4. After resolving the deployment, `deploymentCredentialsOrConfigure` calls `updateEnvAndConfigForDeploymentSelection` for non-production deployments.
5. That configuration path writes the selected deployment and detected frontend URLs to the repository's development environment file, normally `.env.local`, before `devAgainstDeployment` performs the push.
6. No supported `convex dev` flag in this pinned version disables those local configuration writes.

The relevant installed sources are `src/cli/dev.ts`, `src/cli/lib/deploymentSelection.ts`, `src/cli/configure.ts`, and `src/cli/lib/envvars.ts` inside the pinned `convex` package.

The current command is therefore valid for deployment-key selection but incompatible with the repository's stricter rule that `.env.local` must remain absent throughout the workflow.

## Rejected changes

- Adding `CONVEX_DEPLOYMENT` does not prevent the write and weakens the fixed deploy-key binding model.
- Adding `--deployment hallowed-manatee-765` is rejected by `convex dev` in this CLI version.
- Passing the deploy key through `--admin-key`, command arguments, or a generated env file would expand secret exposure.
- Replacing `convex dev` with `convex deploy` changes the documented development-deployment contract and introduces production-selection risk.
- Removing the `.env.local` guard or deleting the file after creation would relax an approved safety boundary and needs explicit authorization.
- Patching installed Convex package source during CI is not a reviewable or supportable deployment mechanism.

## Exact next gate

Choose one of these paths before any new run:

1. Preserve the no-file rule. Provide an official Convex-supported command, flag, or pinned CLI version that can push to a development deployment with `CONVEX_DEPLOY_KEY` without writing local configuration. Source review must confirm the behavior before changing this workflow.
2. Authorize a transient-file exception. Explicitly authorize a source-only workflow change that permits Convex CLI `1.42.1` to create an ignored `.env.local` during the one bounded development push, validates only an allowlist of non-secret key names, verifies that `CONVEX_DEPLOY_KEY` is absent from the file, prints no values, and deletes the file through an `EXIT` trap. Any unexpected key, cleanup failure, CLI failure, or unknown state must stop with no retry. This authorization would cover source preparation only; one later live run would still require separate approval.

Until one path is selected and reviewed, do not dispatch the workflow again. Do not rotate or broaden the deployment key, add production selectors, add `CONVEX_DEPLOYMENT`, inspect raw logs, or infer hosted success from the failed job status.

## Validation boundary

This diagnostic is based on repository source, Convex CLI `1.42.1` source and tests installed from the lockfile, and sanitized GitHub run metadata and annotations. It does not verify the remote deployment state, hosted functions, generated bindings, environment values, or provider behavior.
