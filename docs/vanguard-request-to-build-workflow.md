# Vanguard request-to-build workflow

## Purpose

Vanguard Enterprises is available as a provider-light client site in KinFlo Site Studio. The public site embeds a five-step ReversR Rebuild intake instead of sending people to a brochure form. The KinFlo OS view continues the same request on the associate side through source review, quote and scope, fulfillment progress, quality evidence, and delivery receipt.

## Routes

- Public preview: `/kinflo-sites/vanguard-enterprises`
- Site Studio workflow: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`
- Site Studio queue: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=queue`
- Site Studio configuration: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=configuration`

## Public-source provenance

Source: http://www.vanguardenterprises.com/

The local fixture uses public company facts and service descriptions: Vanguard Enterprises and Associates Inc., Fort Lee, New Jersey, the tagline "Pioneering Innovative Collaboration for Excellence," public contact information, and the public service categories for project management, IT infrastructure, and engineering/CAD/CAM.

The October 12, 2026 source-site parity audit and the page-to-section map are recorded in `docs/vanguard-source-site-parity.md`. The richer public site keeps the request-to-build path first, then adds concise source-derived capabilities, project phases, leadership, customer/GSA/NAICS proof, careers, contact facts, and location posture.

The company-header logo is preserved as `attached_assets/vanguard-enterprises-logo.jpg` from `http://www.vanguardenterprises.com/image/80076569.jpg`. The source JPEG is 356 x 138 pixels with SHA-256 `30d17af6df43c14e6510e6cd0abc40d04064c74c8e0d6e167821b6bdf485eb02`. The public header and Site Studio evidence view render the local copy with its natural aspect ratio and accessible alt text.

The public hero uses `attached_assets/generated_images/Vanguard_industrial_welding_fabrication_hero.png`, a 1672 x 941 PNG generated with the built-in OpenAI image-generation tool for this local fixture. The prompt requested a photorealistic fabrication shop, protected welders and structural-steel work on the right, and darker negative space on the left for the existing headline and calls to action. It contains no client or customer material, readable text, logo, or watermark. SHA-256: `e519b4eb29d01ed13fd4ca38e7ba7cc9508abbad23ba907e29bc602ebabd2002`.

No private source, account data, customer record, uploaded file, or secret was read or copied.

## ReversR pattern adapted for Vanguard

The public intake path is:

1. Select the source-package categories without uploading private files.
2. Describe the build goal and target environment.
3. Choose the starting discipline or request type.
4. Record material, tolerance, budget, date, security, or quality constraints.
5. Review missing inputs and prepare a local receipt.

The associate-side continuation is:

1. Vanguard associate source review
2. Quote and scope decision
3. Assigned-associate fulfillment
4. Milestone progress record
5. Quality and delivery evidence
6. Requester delivery receipt

Build readiness stays locked until the source inventory, missing inputs, scope, acceptance criteria, and owner decision are recorded.

## Existing KinFlo controls used

- `clientWebsiteStudio.sites` for the selectable Vanguard site
- `clientWebsiteStudio.portfolioRegistry` for client-site status and blocked actions
- `clientWebsiteStudio.spinUpQueue` for the ordered provider-light launch request
- `clientWebsiteStudio.configurationProfiles` for the site, template, navigation, CRM pipeline, editable surfaces, and locked surfaces
- `/kinflo-sites/:siteSlug` for the public preview renderer
- Site Studio preview URL context for the selected site and review source

## Small provider-light extension

`client/src/lib/kinfloVanguardWorkflow.ts` carries the intake stages, source-package categories, disciplines, constraints, associate fulfillment stages, missing-input register, sample order, delivery evidence, public-source provenance, and provider boundary. The public preview and Site Studio associate workspace read the same contract.

`client/src/components/VanguardReversRIntake.tsx` is the embedded local app. It provides a responsive step rail, readiness logic, and receipt generation entirely in browser state. The receipt ID `VE-RRB-PREVIEW` is a fixture label, not a server record.

The same module now carries `sourceSite`, an 11-page public-source inventory and the adapted content used by the source-parity renderer and the Site Studio readiness card.

The public app prepares a local request receipt. It does not transmit entries, upload files, or call a provider.

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

A future implementation should add those records to the configuration schema and read contracts before connecting a live CRM or private file store. Site Studio also needs a configuration control that maps intake steps and discipline options to an associate fulfillment pipeline. This lane records that gap instead of adding backend writes or schema changes.

## Provider boundary

- External writes: 0
- Hosted deployment touched: no
- `.env.local` created or read: no
- Convex codegen run: no
- Generated Convex API imported: no
- Live Convex execution: no
- Provider API called: no
- Production activation: no
