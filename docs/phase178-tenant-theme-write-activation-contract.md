# Phase 178 tenant theme write activation contract

## Scope

This source-only slice prepares Brand Theme Studio to persist an approved palette packet through `controlPlane.updateThemeTokens` and verify the saved values through `siteBuilder.getSiteDraft`.

The contract is tenant-agnostic. The selected site ID comes from the verified read-only tenant/site adapter, while palette values come from the shared KinFlo palette registry. No Vanguard-only write path exists.

## Persisted packet

Each save carries:

- the selected site ID;
- `paletteId`, registry version, and complete light/dark semantic tokens;
- typography key, families, and scale;
- button key, style, and radius;
- media key, treatment, and ratio.

The adapter performs a site-draft read-back after the mutation. A mismatch is an error and the UI does not report the save as verified.

## Fail-closed activation gate

The save button remains gated unless all of these conditions are true in the approved runtime environment:

1. The read-only KinFlo adapter is already verified and selected.
2. `VITE_KINFLO_THEME_WRITE_GENERATED_API_AVAILABLE=true` records reviewed generated bindings.
3. `VITE_KINFLO_THEME_WRITE_SMOKE_VERIFIED=true` records hosted mutation smoke evidence.
4. `VITE_KINFLO_THEME_WRITE_READBACK_VERIFIED=true` records successful site-draft read-back evidence.
5. `VITE_KINFLO_THEME_WRITE_VISUAL_QA_APPROVED=true` records desktop/mobile public-renderer review.
6. `VITE_KINFLO_THEME_WRITE_ADAPTER_MODE=live_verified` explicitly selects the adapter.

Source presence alone does not satisfy any gate. This branch does not set environment values, run codegen, execute a Convex mutation, deploy, or activate persistence.

## Validation

```bash
npm run kinflo:validate-theme-write-contract
npm run kinflo:validate-brand-shell
npm run kinflo:validate-tenant-palettes
npm run check
```

Remaining captain gates are generated-binding review, hosted authenticated mutation/read-back smoke, visual QA against the exact hosted renderer, environment selection, deployment, and production-equivalent smoke.
