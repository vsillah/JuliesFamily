# Phase 60 Client Provisioning Orders

## Validation

```bash
npm run kinflo:validate-client-provisioning-orders
```

## Scope

Phase 60 turns the Client Website Studio into a concrete provisioning queue without executing live writes.

- Admin route: `/admin/kinflo-os?tab=site-studio`.
- Convex query contract: `siteFactory.listClientWebsiteProvisioningOrders`.
- Shell data mirror: `clientWebsiteStudio.provisioningOrders`.
- Provisioning orders: 3.
- Sites covered: Julie Family public site, Advisor Client Site, Campaign Microsite.
- Live provisioning action: gated.

Each order assembles:

- target tenant slug,
- launch blueprint,
- admin permission preset,
- requested plan,
- template key,
- owner and invite roles,
- setup steps,
- approval evidence,
- blocked live actions,
- and mapped Convex functions.

## Provider Boundary

- Read-only query: yes.
- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.
- Provider APIs touched: no.
- Secrets read or printed: no.
- No tenant, site, membership, invitation, email, billing, domain, publish, lead, campaign, AI, or storage write is executed.

## Next Activation Gate

The provisioning queue can become real execution only after Vambah approves hosted Convex activation, generated API import/codegen, read-only hosted smokes, mutation smoke order, invitation delivery policy, domain/storage/provider configuration, and rollback gates.
