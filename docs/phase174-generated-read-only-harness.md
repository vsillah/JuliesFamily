# Phase 174: Generated Read-Only Harness

This development-only harness imports `convex/_generated/api` through the `@kinflo-phase174-generated-api` Vite development alias and runs the exact 20 Phase 174 read-only queries through the current authenticated Convex Auth session. It is a smoke tool, not a product adapter.

## Safety Contract

- The harness is available only when `import.meta.env.DEV` is true and the exact query parameter `devHarness=phase174-generated-read-only` is present.
- It mounts only after Convex Auth resolves an authenticated `super_admin` viewer.
- The 20 references are explicit generated `api.<module>.<query>` bindings and are checked against `KINFLO_GENERATED_API_BINDINGS` as `query` entries.
- Clean production builds resolve the alias to a committed query-only shape, so ignored codegen output is never a CI, Vercel, or production build dependency. Only `vite serve` resolves the alias to `convex/_generated/api`.
- Queries run sequentially in Phase 174 order. The harness stops after the first rejected or unavailable query.
- Evidence contains function path, batch, status, duration, result kind/count, and a provider-boundary boolean only.
- Evidence excludes tenant IDs, site IDs, raw results, raw errors, deployment identifiers, provider identifiers, tokens, and local paths.
- Generated files remain ignored and untracked.
- `generatedApiAvailable` remains `false`; the product fixture/read-only adapter selection is unchanged.
- No mutation, action, provider write, deployment, adapter switch, or production change is authorized.

## Focused Validation

```bash
npm run kinflo:validate-phase174-generated-read-only-harness
npm run kinflo:validate-generated-api
npm run kinflo:validate-hosted-read-only-smoke-qa-plan
npm run check
git diff --check
```

The harness validator proves the exact 20-query order, generated-reference coverage, query classification, dev/auth route gate, sanitized evidence flags, unchanged `generatedApiAvailable = false`, and untracked generated files.

## Exact Run Instructions

Use the approved development deployment and 1Password-backed environment path. Do not create `.env.local`.

1. Unlock 1Password and approve CLI access in the terminal.
2. Confirm the approved KinFlo item has `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`, `CONVEX_AUTH_ISSUER`, and `CONVEX_AUTH_CLIENT_ID` fields:

   ```bash
   OP_KINFLO_CONVEX_ITEM="KinFlo Convex" npm run kinflo:1password-env-check
   ```

3. Generate the local ignored bindings, then review that `git status --short` does not list anything under `convex/_generated/`:

   ```bash
   OP_KINFLO_CONVEX_ITEM="KinFlo Convex" npm run kinflo:convex-codegen:1password
   git status --short
   ```

4. Start the development server through the same no-file environment injection path:

   ```bash
   VITE_KINFLO_IDENTITY_MODE=convex_auth \
   OP_KINFLO_CONVEX_ITEM="KinFlo Convex" \
   node scripts/run-kinflo-with-1password-env.mjs -- npm run dev
   ```

5. Open:

   ```text
   http://127.0.0.1:5000/admin/kinflo-os?tab=hosted-activation&devHarness=phase174-generated-read-only
   ```

6. Complete Auth0 sign-in if prompted. The harness will remain unavailable unless the current Convex user resolves as `super_admin`.
7. Paste the separately approved smoke tenant ID and site ID into the local form. Confirm the scope checkbox. The values remain in component memory and are never added to the URL or evidence.
8. Select **Run 20 read-only queries**. Use **Stop after current query** to halt before the next query. A query failure automatically skips the remaining sequence.
9. Copy the sanitized evidence block only. Do not copy browser network payloads, console output, raw query results, IDs, provider identifiers, tokens, or stack traces into a PR or chat.
10. Stop the development server. Confirm `.env.local` is absent and generated files remain untracked:

   ```bash
   test ! -e .env.local
   git status --short
   git ls-files convex/_generated
   ```

## Stop Conditions

Stop immediately if the authenticated viewer is not the approved admin, the tenant/site scope is uncertain, binding validation fails, any query is rejected, any result suggests cross-tenant data, a provider control appears enabled, or a raw value would need to be captured to continue. Do not retry by running mutations or changing adapters.
