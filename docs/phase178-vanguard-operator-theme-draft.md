# Phase 178 Vanguard operator theme draft

This source-only slice adds a scoped Brand Theme Studio entry point to the Vanguard operator portal. It lets an operator stage one of the approved KinFlo palette packets and inspect paired light/dark tokens without persisting anything.

## Boundary

- The selected palette starts from the existing `vanguard-enterprises` tenant assignment.
- Local state only: yes. Palette changes remain in React state for the current fixture preview only.
- The portal does not import Convex generated bindings, call `useMutation`, call `fetch`, or write a tenant/site record.
- `Live theme save gated` remains disabled until the existing Phase 178 activation contract is satisfied independently: reviewed bindings, hosted mutation smoke, read-back proof, visual QA approval, and explicit adapter selection.
- Non-Vanguard scope continues to render the existing denial state.

## Validation

```bash
npm run kinflo:validate-vanguard-operator-theme-draft
npm run kinflo:test-vanguard-operator-portal
npm run kinflo:validate-theme-write-contract
```

Local responsive review covers desktop, mid-width, and mobile widths. No deploy, Convex codegen, hosted smoke, Infisical/Vercel/Auth0 change, provider write, upload, communication, or data mutation is part of this phase.

## Next gate

Captain review should confirm the Vanguard scope, palette staging behavior, disabled save explanation, cross-scope denial, and no horizontal page overflow at desktop, mid-width, and mobile widths. Human QA and any later merge/deploy authorization remain separate decisions.
