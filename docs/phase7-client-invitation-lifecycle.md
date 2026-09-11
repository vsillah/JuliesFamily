# Phase 7 Client Invitation Lifecycle

This phase adds provider-light Convex functions for inviting client admins and editors into tenant or site scopes.

## Added Scope

Convex control-plane functions:

- `controlPlane.createInvitation`
- `controlPlane.listInvitations`
- `controlPlane.revokeInvitation`
- `controlPlane.acceptInvitation`

The lifecycle supports:

- tenant-scoped invitations,
- site-scoped invitations,
- owner/admin/editor/viewer roles,
- pending/accepted/revoked/expired states,
- hashed-token acceptance,
- email matching against the signed-in user,
- membership creation or update,
- audit events for create/update/revoke/accept actions.

## Current Boundary

The functions do not send email and do not generate raw invite tokens.

The caller must generate the raw invite token, store only a hash through `createInvitation`, and deliver the invite through an approved email/provider workflow later. This keeps secrets out of Convex documents and keeps hosted provider setup outside the current local scaffold.

`listInvitations` intentionally omits `tokenHash` from returned rows.

## First Hosted Smoke

After Convex auth/deployment setup is approved:

1. Bootstrap Vambah as platform admin.
2. Create or seed a tenant/site.
3. Call `createInvitation` for a client admin email using a pre-hashed token.
4. Sign in as that invited email.
5. Call `acceptInvitation` with the same token hash.
6. Confirm a membership exists with the invited role and scope.
7. Confirm `listInvitations` shows accepted status without returning the token hash.
8. Confirm audit events exist for invitation creation and acceptance.

## Validation

Current validation:

- `npm run convex:check`: passes.
- `npm run kinflo:validate-phases`: passes.
- `npm run kinflo:validate-map`: passes.
- `npm run build`: passes.

Known not run:

- Email delivery smoke: blocked until provider setup is approved.
- Live Convex invitation smoke: blocked until Convex auth/deployment setup is approved.
