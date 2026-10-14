# KinFlo tenant palette system

KinFlo public sites and the Brand Theme Studio now read from one approved palette registry in `client/src/lib/kinfloPaletteRegistry.ts`.

## Current palette assignments

| Tenant | Palette |
| --- | --- |
| Julie's Family | KinFlo Grounded |
| Advisor Client Starter | Professional Neutral |
| Vanguard Enterprises | ReversR Industrial |
| Campaign Microsite Lab | Professional Neutral |

Every palette defines light and dark tokens for page background, foreground, surfaces, borders, accents, secondary actions, and muted copy. Unknown palette ids fall back to KinFlo Grounded. System mode follows the operating-system preference and retains the existing Vanguard local-storage key for compatibility.

## Admin boundary

The existing Brand Theme Studio is the configuration surface. Selecting a site loads its assigned palette, and an administrator can stage a different approved palette locally. Live persistence remains disabled until hosted Convex authentication, generated bindings, visual QA, and public-renderer smoke are approved.

Follow-on admin work should persist the selected palette id through the existing `controlPlane.updateThemeTokens` contract, record the prior palette id for rollback, and re-run light/dark visual smoke before publish. This source-only lane does not invoke provider writes, Convex code generation, or deployment.
