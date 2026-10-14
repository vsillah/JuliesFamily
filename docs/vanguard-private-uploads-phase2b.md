# Vanguard private uploads and order persistence Phase 2B

Status: source implementation for captain review

Date: October 14, 2026

## Delivered source path

Phase 2B adds the authenticated order workspace path without activating it in an environment. A signed-in client can promote the existing browser receipt into an owned Vanguard draft, prepare one bounded private IGES upload, attach the returned Convex Storage reference to that draft, and request an ephemeral download URL through an ownership-checked query.

The browser-local receipt remains the recovery path. It is not deleted after promotion or upload. Unauthenticated and unconfigured sessions retain the current browser-only IGES review and cannot prepare an upload URL or call an order mutation.

## Authorization and isolation

- Every order and storage function resolves the authenticated user from the server identity.
- The Vanguard tenant and site IDs are resolved server-side from fixed slugs.
- Order ownership, tenant ID, site ID, and declaring user are checked before metadata attachment, deletion, or download.
- Supplying an order ID, source-item ID, storage ID, tenant ID, or site ID is never authorization.
- Detail reads return storage state and private metadata without persisting a download URL. Download URLs are generated only after the same ownership checks.

## Bounded private source contract

- `.igs` and `.iges` filenames only, using the same safe filename pattern as the browser-local review.
- Maximum source size: 256 KiB.
- Allowed declared media types: `application/iges`, `model/iges`, and `application/octet-stream`.
- A 64-character SHA-256 digest is required and the portal rechecks the selected source on-device before upload.
- Stored size, content type, and storage-computed SHA-256 are checked against the declaration before the storage ID is attached.
- A size, type, or checksum mismatch deletes the rejected storage object and removes the pending manifest item in the same mutation.
- A failed storage request cancels its prepared manifest item before the client reports failure; attachment transport errors retry the idempotent attach once with the same storage reference.
- Removing an attached draft source deletes both the private object and its manifest item. Submitted orders cannot use this draft cleanup path.

## Client activation gate

The client adapter is default-off. Live preview use requires all of the following to be supplied through the approved environment path:

1. KinFlo identity mode `convex_auth` with a configured public URL;
2. `VITE_KINFLO_VANGUARD_ORDER_ADAPTER_MODE=preview_verified`;
3. reviewed bindings;
4. successful authenticated draft mutation smoke;
5. successful bounded private upload smoke.

Development visual review can use the existing development-only local identity mode. That path keeps the order and selected file on the device and is visually labeled as a device-only review.

## Source-only evidence boundary

- Convex codegen was not run.
- Hosted read-only and mutation smoke were not run.
- No private source was uploaded to a hosted deployment.
- No environment value, membership, role, tenant, site, or deployment setting changed.
- Provider writes remain disabled.
- Manufacturing fulfillment, associate co-editing, production activation, merge, and deployment remain separate gates.

## Validation

The focused policy tests cover accepted metadata, unsafe filenames, non-IGES extensions, byte-size limits, media types, checksums, and stored metadata drift. The Phase 2B source validator checks authenticated entry points, tenant/site/owner comparisons, storage-reference handling, mismatch cleanup, removal cleanup, default-off activation, route isolation from the legacy session provider, and absence of generated API imports or `.env.local`.
