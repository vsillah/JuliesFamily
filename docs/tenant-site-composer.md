# Tenant Site Composer

The tenant site composer is a provider-light presentation layer for KinFlo public sites. It composes the existing admin surfaces into one tenant-scoped draft model:

- ordered page sections mapped to existing `contentBlocks`
- ordered header and footer links mapped to existing `navigationItems`
- hero media direction, alt text, position, overlay, parallax, and reduced-motion behavior
- selectable palette, typography, button, radius, and navigation contrast defaults
- explicit Vanguard/ReversR behavior guards for the order journey, desktop workspace, IGES review, and account-required tracking

Julie’s Family patterns remain the reference for the smallest reusable control set: content block editing, navigation ordering, theme tokens, assets, and preview QA. The new composer is a local draft composition over those controls and does not replace them.

## Smallest missing control surface

The Convex schema already has tenant/site ownership on `pages`, `contentBlocks`, `navigationItems`, `assets`, and `themeTokens`. The missing persisted surface is a tenant-scoped presentation profile that stores the combined section order, navigation order, hero/media options, and motion/contrast preferences as one revision-aware draft.

This lane intentionally does not add that mutation or run codegen. The current composer keeps edits in local React state, exposes the existing Content, Navigation, Brand, and Preview controls, and leaves Save gated until hosted auth, generated API bindings, persistence review, and live smoke are separately approved.

## Vanguard acceptance order

The local acceptance fixture preserves this order:

1. Vanguard introduction
2. Capabilities
3. About Vanguard
4. ReversR order journey
5. Fulfillment method
6. ReversR desktop workspace and embedded request behavior

Tracking stays a separate account-required order-portal link. IGES review remains inside the embedded request workflow and is not promoted into a standalone public site section.

