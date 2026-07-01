# Phase 0 Environment Inventory

This artifact makes the Phase 0 environment inventory repeatable without reading or printing secrets.

Command:

```bash
npm run kinflo:inventory-env
```

## Current Result

Latest result:

- Source env keys referenced: 58.
- Documented in `.env.example`: 58.
- Referenced but missing from `.env.example`: 0.
- Listed in `.env.example` but not directly referenced in scanned source: 2.
- Tracked secret-like files: 0.
- Tracked generated Convex files: 0.
- Reads local secret files: no.
- Prints secret values: no.
- External writes: 0.
- Hosted deployment touched: no.
- Live Convex execution: no.

The two `.env.example` keys not directly referenced in scanned source are `CONVEX_AUTH_CLIENT_ID` and `CONVEX_AUTH_ISSUER`. They remain in the template because they are part of the approved hosted Convex activation gate.

## What The Script Checks

The inventory script scans source references to:

- `process.env.KEY`
- `process.env["KEY"]`
- `import.meta.env.KEY`
- `import.meta.env["KEY"]`

It compares those references against placeholder names in `.env.example`, including commented optional placeholders. It does not read `.env`, `.env.local`, `.env.*.local`, shell environment values, provider secrets, or deployment state.

The script fails if:

- a source-referenced env key is missing from `.env.example`,
- `.env`, `.env.local`, or another `.local` secret-like file is tracked,
- generated Convex API files under `convex/_generated/` are tracked.

## Provider Boundary

This is a local inventory and safety gate only.

No hosted Convex deployment is created.

No generated Convex API files are committed.

No live Convex query, mutation, or action is executed.

No provider, payment, email, SMS, storage, DNS, or production data write is performed.

## Activation Use

Before hosted Convex activation or client onboarding:

1. Run `npm run kinflo:inventory-env`.
2. Confirm every referenced key is documented in `.env.example`.
3. Confirm tracked secret-like files remain at 0.
4. Enter real values only into local secret stores, Vercel env vars, Convex env vars, 1Password, or `.env.local`.
5. Do not paste real values into PRs, docs, chat, or committed source.
