# Vanguard request-to-build workflow

## Purpose

Vanguard Enterprises is available as a provider-light client site in KinFlo Site Studio. The public experience begins with a build request instead of a brochure contact form. The KinFlo OS view gives Vanguard associates a local workflow for source inventory, technical review, quote readiness, fulfillment progress, and delivery evidence.

## Routes

- Public preview: `/kinflo-sites/vanguard-enterprises`
- Site Studio workflow: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`
- Site Studio queue: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=queue`
- Site Studio configuration: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=configuration`

## Public-source provenance

Source: http://www.vanguardenterprises.com/

The local fixture uses public company facts and service descriptions: Vanguard Enterprises and Associates Inc., Fort Lee, New Jersey, the tagline "Pioneering Innovative Collaboration for Excellence," public contact information, and the public service categories for project management, IT infrastructure, and engineering/CAD/CAM.

No private source, account data, customer record, uploaded file, or secret was read or copied.

## ReversR pattern adapted for Vanguard

The request-to-build path is:

1. Build request
2. Source package inventory
3. Scope and requirements inventory
4. Engineering/CAD/CAM or IT infrastructure review
5. Quote and readiness gate
6. Assigned-associate fulfillment
7. Progress record
8. Delivery receipt and evidence

Build readiness stays locked until the source inventory, missing inputs, scope, acceptance criteria, and owner decision are recorded.

## Existing KinFlo controls used

- `clientWebsiteStudio.sites` for the selectable Vanguard site
- `clientWebsiteStudio.portfolioRegistry` for client-site status and blocked actions
- `clientWebsiteStudio.spinUpQueue` for the ordered provider-light launch request
- `clientWebsiteStudio.configurationProfiles` for the site, template, navigation, CRM pipeline, editable surfaces, and locked surfaces
- `/kinflo-sites/:siteSlug` for the public preview renderer
- Site Studio preview URL context for the selected site and review source

## Small provider-light extension

`client/src/lib/kinfloVanguardWorkflow.ts` carries the request fields, intake checklist, associate fulfillment stages, missing-input register, sample order, delivery evidence, public-source provenance, and provider boundary. The public preview and Site Studio associate workspace read the same contract.

The public form prepares a local request receipt. It does not transmit entries, upload files, or call a provider.

## Configuration tooling gap

The current Site Studio model can configure sites, public content, previews, launch packets, and generic lead routing. It does not yet have configuration-driven records for:

- discipline-specific build-request fields
- private attachment manifests and retention rules
- source-package inventory
- associate assignment
- quote and readiness decisions
- milestone and progress updates
- versioned delivery receipts
- client acceptance evidence

A future implementation should add those records to the configuration schema and read contracts before connecting a live CRM or private file store. That work remains separate from this local fixture.

## Provider boundary

- External writes: 0
- Hosted deployment touched: no
- `.env.local` created or read: no
- Convex codegen run: no
- Generated Convex API imported: no
- Live Convex execution: no
- Provider API called: no
- Production activation: no
