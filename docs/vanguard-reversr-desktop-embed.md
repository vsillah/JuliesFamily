# Vanguard ReversR desktop embed

## Scope

The Vanguard order entry at `/kinflo-sites/vanguard-enterprises#build-request` now opens as a desktop-class ReversR workspace. The shell gives the request a dedicated header, phase rail, navigation rail, working canvas, request inspector, and order-handoff sequence. Desktop is the primary working surface; the same controls reflow for mobile without horizontal page overflow.

The five existing request stages remain intact: available materials, build requirement, work routing, constraints, and request review. The final receipt continues into the existing Vanguard order portal. The visual change therefore strengthens the same order record rather than creating a separate intake product.

## Integrated order entry

ReversR is now the primary action in the Vanguard hero and the first product journey after the hero. A shared order-lifecycle rail stays visible across the public site and order portal, with direct paths for preparing a request, reviewing its receipt, tracking the eventual order, and understanding associate support.

The page order puts the ReversR journey and workspace ahead of the longer company-capability material. Vanguard's services, people, and proof remain available below the order experience.

When a client completes the five input items, the portal opens with the prepared receipt expanded. The client can edit the request, confirm each field, see the account-save boundary, inspect the future tracking path, or review the associate-help model without losing the browser draft.

## Capability boundary

- External writes: 0
- Live persistence: disabled
- Private file transfer: disabled
- Provider calls: 0
- Convex mutations and generated bindings: unchanged and unused
- `.env.local`: absent

Request state stays in React memory while the workspace is open. Only the explicit continue action places the existing receipt shape into browser session storage for the order portal. The interface identifies current capabilities and account-gated capabilities in customer language.

## Website integration slice

The Vanguard website now carries the same desktop wayfinding used by ReversR:
Home, Projects, New Reconstruction, Tour, and More. The embedded workspace also
shows the product's four phases: Input, Inventory, Design, and Build. The public
request stays inside Input. Later product phases remain locked until account
access and an approved saved-order path exist.

The five request fields are an Input checklist rather than a second set of
ReversR phases. A compact status panel names the current owner, the next
decision, and the point where a Vanguard associate can join after the client
chooses what to share. The public hero now opens the embedded request directly.

The order portal carries the same ownership language into its tracking view.
This is a presentation and browser-session continuity slice. It does not create
an order, upload a file, assign an associate, send a notification, or enable a
provider write.

## ReversR brand rule

The full Vanguard public page and embedded ReversR surfaces must use a shared,
ReversR-compatible palette. The dark palette follows the product's near-black
and navy panels with blue primary actions and green/teal active or success
states. The light palette uses those same blue and green roles on white and
cool-gray panels. Amber, burnt-orange, burgundy, and rose accents must not be
used across the Vanguard public shell, theme control, or ReversR workspace.

Vanguard keeps its identity through its logo, industrial photography, company
copy, and fulfillment role. ReversR supplies the interaction color system so
the order journey reads as one coherent product. In light mode, page sections
remain white or cool gray; the embedded ReversR workspace is the intentional
exception where its product framing may use a darker app surface.

The embedded header uses a web-sized derivative of the existing ReversR asset:

- Source: `/Users/vambahsillah/Documents/ReversR-Workspace/ReversR-Rebuild/assets/logo-transparent.png`
- Source dimensions: 1024 x 1024 with transparency
- Source SHA-256: `d9a590604f8f4000ea9dd2149de633425cc6e9c019079de81fbce339e61d270d`
- Bundled derivative: `client/src/assets/reversrLogo.ts`

The derivative keeps the current workspace self-contained and avoids a new
network dependency. Replace it only when ReversR publishes a shared web asset
package or canonical hosted brand bundle.

## Shared-package extraction boundary

The implementation borrows the verified desktop information architecture from ReversR Rebuild: a bounded navigation rail, horizontal phase rail, flexible canvas, and context inspector. Direct component reuse was intentionally deferred because the ReversR implementation is React Native/Expo while KinFlo is a Vite web application with its own UI primitives and Tailwind system.

A future shared package should extract product-neutral contracts before visual components:

1. request-stage and completion-state types;
2. materials, requirement, discipline, and constraint field contracts;
3. responsive shell tokens for rail, canvas, and inspector bounds;
4. accessibility and keyboard behavior for workspace navigation;
5. capability declarations that distinguish local work from authenticated saving, file transfer, and live orders.

That extraction should remain presentation-only until the authenticated order and private attachment authorities are separately approved.

## QA contract

The capture script records the exact Vanguard route at 1440 x 1000 and 390 x 844, exercises the request stages, separates application traffic from existing passive page dependencies, and renders a privacy-safe H.264 walkthrough. Media is written under `docs/qa/vanguard-reversr-desktop-embed/`.
