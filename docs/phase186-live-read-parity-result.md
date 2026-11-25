# Phase 5: Supabase Live Read Parity Result

Status: blocked by source parity mismatch. This is a sanitized read-only evidence record; it is not a migration or cutover approval.

## Approved Binding

- Project: Supabase `pohqfbabengnvfeampgu`
- Infisical environment: `dev`, path `/`
- Connection: approved Supabase session pooler
- Allowed access: schema metadata and aggregate counts only
- Raw PII printed: none
- Writes, migrations, imports, codegen, deployment, and Convex cutover: none

## Observed Metadata

The inspected legacy CRM tables have no explicit `tenant_id` or `site_id`
ownership columns. The only organization relationship in the inspected set is
`users.organization_id`.

The inspected CRM tables are present, but the live aggregate counts are zero:

| Table | Count |
| --- | ---: |
| `leads` | 0 |
| `interactions` | 0 |
| `pipeline_stages` | 0 |
| `lead_assignments` | 0 |
| `tasks` | 0 |
| `pipeline_history` | 0 |
| `funnel_progression_rules` | 0 |
| `funnel_progression_history` | 0 |

The source contains 1 organization and 6 users. Aggregate scope checks found:

| Scope | Organization matches | User matches |
| --- | ---: | ---: |
| Vanguard | 0 | 0 |
| Julie | 1 | 0 |
| Unscoped users | n/a | 6 |

## Parity Decision

Parity is **blocked**. The live source cannot currently support the approved
tenant/site-scoped adapter contract:

1. Vanguard is absent from the source organization scope.
2. Julie has an organization match, but no users or CRM records are scoped to
   it.
3. CRM records have no tenant/site ownership fields to validate.
4. The live CRM tables contain no records to compare with the deterministic
   fixture contract.

Per the approved stop condition, no live adapter implementation, data repair,
schema change, import, migration, or cutover was attempted.

## Required Decision Before Continuing

The next phase needs a new, explicit decision about the source of truth and
scope model. Options include repairing or mapping the legacy organization
relationships, selecting a different approved source, or treating the live
database as an empty legacy shell and proceeding from approved Convex fixtures.
