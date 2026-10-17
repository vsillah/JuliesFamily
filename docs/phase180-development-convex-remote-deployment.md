# Phase 180: Development Convex Remote Deployment

## Purpose

This lane prepares one manual GitHub Actions path for deploying the repository's Convex functions to the existing KinFlo development deployment `hallowed-manatee-765`. It replaces the interactive 1Password desktop/CLI dependency for this narrow remote operation with a protected GitHub environment secret.

The workflow is source-only until the credential gate below is completed. Creating the workflow does not create a deploy key, configure GitHub, run Convex, or authorize any production change.

## Fixed safety contract

- Trigger: manual `workflow_dispatch` only.
- Required typed confirmation: `deploy hallowed-manatee-765`.
- GitHub environment: `kinflo-convex-development`.
- Environment secret name: `CONVEX_DEPLOY_KEY`.
- Accepted key binding: exactly `dev:hallowed-manatee-765` before the secret delimiter.
- Non-deploying preflight: one credential-free `npm run convex:check` attempt using the repository's focused TypeScript command. Its output is captured only in an ephemeral runner file and deleted when the step exits.
- Generated bindings: source-controlled artifacts only. The workflow never generates or modifies them and never invokes `convex codegen`.
- Convex deployment command: one `npx convex dev --once` attempt with typecheck and codegen disabled, and hosted log tailing disabled.
- Repository permission: read-only contents.
- Concurrency: one KinFlo development deployment at a time; an active run is never cancelled by a newer run.
- Target selection: there is no deployment input, no `CONVEX_DEPLOYMENT`, no `--prod`, and no `convex deploy` command.
- Evidence: commit SHA, workflow run link, fixed development binding, success/failure status, preflight status, deployment-attempt count, and one coarse allowlisted failure classification.
- Secret values, raw compiler or Convex deployment output, deployment URLs, environment values, and `.env.local` contents are never emitted.

The preflight removes both `CONVEX_DEPLOY_KEY` and `CONVEX_DEPLOYMENT` from its subprocess before running the repository's focused strict TypeScript check over the Convex source list. It does not invoke the Convex CLI, contact a deployment, regenerate bindings, or require credentials.

If the local preflight fails, the workflow reports only `preflight_local_typecheck_failure`. If the later deployment attempt fails, it reports only `push_authentication_or_authorization`, `push_network_or_service_availability`, `push_configuration_or_deployment_binding`, or `bundle_or_push_failure`. An earlier failure reports `not_available_before_preflight`; any unexpected `.env.local` creation reports `environment_file_policy_failure`. These categories are routing hints, not root-cause proof, and they never authorize a retry. Raw compiler and deployment output remains withheld and is deleted from the runner.

Convex documents that `CONVEX_DEPLOY_KEY` binds CLI commands to the deployment represented by the key. For a development backend, its supported push command is `npx convex dev --once`. A deploy key used only by this workflow should allow only `deployment:deploy`.

Official references:

- <https://docs.convex.dev/cli/deploy-key-types>
- <https://docs.convex.dev/platform-apis/overview#pushing-code-to-a-deployment>
- <https://docs.convex.dev/cli/reference/dev>

## Credential gate

Stop before this gate unless the captain separately authorizes credential provisioning. The workflow and validator can be reviewed without creating or revealing any key.

When authorized, a Convex administrator should:

1. Open the Convex dashboard and select the KinFlo development deployment named `hallowed-manatee-765`.
2. Open **Settings**, then **Deploy Keys**.
3. Select **Generate a deploy key**.
4. Name it `github-actions-kinflo-development-functions`.
5. Grant only `deployment:deploy`. Do not grant data, function execution, environment, log, metrics, backup, integration, pause, or usage-limit permissions.
6. Generate the key and confirm its visible binding begins with `dev:hallowed-manatee-765|`. Do not paste the key into chat, terminal history, documentation, screenshots, or a local file.
7. In GitHub, open **Settings → Environments** for `vsillah/JuliesFamily` and create or open `kinflo-convex-development`.
8. Add an environment secret named `CONVEX_DEPLOY_KEY` and paste the complete key value there.
9. Add required reviewers to the environment if the repository plan supports them. This is an additional human gate; the fixed target and key-binding check remain mandatory either way.
10. Confirm `.env.local` is absent in the repository. No 1Password item or CLI session is needed by the workflow.

The CLI can also create a deployment-scoped token, but that path requires an already authenticated personal Convex session and prints or saves token material. This lane does not invoke it. The dashboard path makes the `deployment:deploy` permission selection explicit and keeps provisioning outside repository automation.

## First authorized run

After this branch is reviewed and merged to the default branch, an authorized maintainer can:

1. Open **Actions → Deploy KinFlo Convex development functions**.
2. Select **Run workflow** on the exact approved commit or default branch.
3. Enter `deploy hallowed-manatee-765`.
4. Select **Run workflow** once.
5. If an environment review is configured, approve only after verifying the commit and fixed target.
6. Copy only the sanitized job summary: commit, workflow run, `dev:hallowed-manatee-765`, status, credential-free local preflight status, deployment-attempt count, and coarse failure classification when present.
7. If the run fails or its result is unknown, stop. Treat the classification only as a review-routing hint. Do not retry until the failure is reviewed and a new run is explicitly authorized.

## Hard exclusions

This lane does not authorize or perform:

- production deployment or production environment changes,
- hosted smoke or function execution,
- adapter switching,
- provider calls or writes,
- data imports, mutations, or deletions,
- site creation,
- order writes or uploads,
- environment-variable changes,
- 1Password item access or modification,
- `.env.local` creation or use,
- a second attempt after a failed or unknown workflow run.

## Validation

```bash
npm run kinflo:validate-development-convex-remote-deployment
npm run convex:check
npm run check
git diff --check
```

The source validation proves the fixed manual trigger, fixed deployment name, dev-key prefix check, least-privilege workflow permissions, one credential-free local typecheck preflight, no workflow codegen, one actual deployment attempt, stage-specific allowlisted coarse failure classification, sanitized evidence fields, absent production selectors, absent secret-output patterns, and `.env.local` prohibition. It is not proof that the protected secret exists, that a classification identifies the root cause, or that a deployment ran.
