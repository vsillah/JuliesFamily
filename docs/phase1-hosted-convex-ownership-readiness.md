# Phase 1 hosted Convex ownership readiness

Prepared 2026-09-11. Status: prepare-only; no owner acceptance recorded.

This is a Phase 1 supporting packet under the [program roadmap](kinflo-program-roadmap.md), preparing the later hosted activation gate. It does not advance the activation checkpoint. Vambah is the decision owner; operational owners below must be explicitly named and accept their roles. Repository fixtures and historical execution ledgers are planning evidence, not a current provider inventory or proof that an account is ready.

## Owner evidence checklist

Store the completed evidence in an owner-controlled private location outside Git. Return only a sanitized reference, reviewer, review date, decision status, and scope to the captain. Keep project URLs, account identifiers, billing details, credentials, tokens, and personal profiles out of committed evidence.

| Criterion | Decision required | Exact evidence needed before acceptance |
| --- | --- | --- |
| `project-owner` | Name the Convex team/account owner, dashboard operator, and backup administrator. Decide whether an existing project is suitable. | Private record identifying the intended project/environment and team, owner acceptance, access-review date, and account recovery contact/process. Existing access must be human-confirmed; a project name in old notes is insufficient. No project creation or selection is authorized here. |
| `billing-plan` | Name the billing owner and escalation contact. Agree on budget, alerts, and upgrade approval threshold. | Dated owner acceptance, currency and total cap, alert recipient/threshold, and a reviewed plan/backup capability record. Mark unknown costs unresolved; do not infer free backup or approve a recurring plan. Payment/account details remain private. |
| `backup-retention` | Name the backup operator and restore/rollback decision owner, including a substitute. | Agreed cadence, retention, maximum tolerable data loss and recovery time, private export storage/access policy, and planned restore drill with success criteria. Distinguish planned recovery from a restore actually tested. No exports or restores run in this lane. |
| `auth-provider` | Name the identity/session owner and the KinFlo authorization owner. Choose current Convex Auth posture or a bounded WorkOS staging proof. | Accepted ADR option and scope; owner for sign-in, session revocation, organization membership, invitation recovery, tenant/site denial checks, and rollback. WorkOS remains a candidate; provider proof is unrun. No auth migration is implied. |
| `env-policy` | Name the approved secret-store custodian, window operator, generated-diff reviewer, and abort owner. | Written child-process injection policy and a bounded window specifying environment, exact permitted commands, start/expiry, expected outputs, reviewer, stop conditions, and cleanup verification. `.env.local` remains absent. Secret values are never part of the evidence packet. |

## Gate order and bounded windows

1. Resolve [credential rotation](phase121-hosted-activation-credential-rotation-review.md) and [repository sharing posture](phase122-hosted-activation-repo-sharing-risk-review.md). The [decision checkpoint](phase120-hosted-activation-decision-checkpoint.md) still names `credential-rotation-review` as the next decision. Human confirmation should record status without displaying or reading credentials.
2. Review all five rows above against the [ownership review](phase123-hosted-activation-ownership-review.md). Missing owners, evidence, or prior approvals keep hosted ownership blocked. The captain reviews the private evidence reference before proposing any later execution authority.
3. Separately approve an env/preflight/codegen window using the [env/codegen review](phase124-hosted-activation-env-codegen-review.md). Its historical `local-env-entry-window` identifier means approved child-process injection, never permission to write `.env.local`. Use the existing 1Password runner only in a later expressly approved lane; even checking secret presence is outside this lane.
4. The later window must name the reviewed preflight invocation and, if authorized, `npm run convex:codegen`, target environment, generated output scope, and reviewer. Stop for wrong environment, missing injection, unexpected network/write requirements, generated diff mismatch, secret leakage, or expired authority. A validator pass cannot open this window.
5. Review generated bindings before any import or adapter switch. On failure, stop the child process, restore only scoped generated changes, retain fixture mode, and verify `.env.local` is absent without reading secrets. Hosted read-only smoke, mutation smoke, cutover, production deployment, and client launch each retain their own later approval.

## WorkOS decision boundary

The [identity ADR](adr-001-workos-identity-plane.md) and [spike plan](phase174-workos-identity-plane-spike.md) recommend WorkOS identity with Convex product data. WorkOS would own authentication/session and organization context; Convex/KinFlo retains tenant/site permissions, CRM, approval evidence, and rollback. Identity claims alone confer no product authority.

Vambah can defer WorkOS and retain current auth, or authorize a separate synthetic staging proof naming application configuration, callback changes, organizations, memberships, and any invitations. Those are provider writes. Hosted Convex projection writes need their own authorization. Production WorkOS, billing, SSO/Directory Sync, and auth cutover remain blocked. The identity owner must approve a return-to-Convex-Auth drill and tenant/site denial evidence before adoption.

## Human review steps

1. Open the existing admin shell at `/admin/kinflo-os?tab=hosted-activation`. Read the decision checkpoint, then the Hosted Activation Ownership Review and its five criteria. The disabled ownership action is expected.
2. In the private evidence location, complete each checklist row with an accepting owner, date, and evidence reference; label unanswered items pending. Resolve the two preceding reviews first. Do not paste secrets or private dashboard screenshots into Git or this task.
3. Send the captain sanitized completion/pending status per criterion, the private reference, and the WorkOS choice. Success means owners and evidence are reviewable, not that hosted execution is enabled.
4. The captain reconciles the evidence with the [approval packet](convex-hosted-activation-approval-packet.json) and [execution ledger](kinflo-saas-execution-ledger.json), then presents the exact next bounded window for approval. This packet records no approvals and changes no shell readiness counts.

## Blocked actions and validation

This lane cannot create/select/activate a hosted Convex project, read/create secrets, write `.env.local`, run real-env preflight, run codegen, create/import generated bindings, run live smoke, switch adapters, perform provider writes, import production data, deploy production, or launch/share a client site.

Run `npm run kinflo:validate-hosted-activation-ownership-review` for the packet and its local source links. Also run the decision-checkpoint, env-codegen-review, saas-execution-ledger, and workos-identity-spike validators. These are static checks; they provide no provider ownership, cost, access, backup, or restore proof.
