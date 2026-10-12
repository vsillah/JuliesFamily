# Vanguard source-site parity

## Objective

Keep `/kinflo-sites/vanguard-enterprises` centered on the KinFlo request-to-build workflow while representing the useful public content from Vanguard Enterprises' source website. The source material is adapted into concise cards, proof sections, and operating summaries; the old page structure and long-form HTML are not copied.

## Public-source inventory

Audit date: October 12, 2026

Canonical source: http://www.vanguardenterprises.com/

| Source page | KinFlo representation |
| --- | --- |
| Home `/` | Company promise, public tagline, contact facts, large/small project posture, and service overview |
| About Us `/about-us.html` | Company summary, distributed operating model, 100+ years combined principal experience, and three-city location card |
| Management `/management.html` | Concise public leadership cards for Stanley Foster, Bruce Kenney Jr., Mark Meadows, Andrew Watt, and Gary Foster |
| Customers `/customers.html` | Clearly labeled published customer list, commercial/government posture, GSA record, and NAICS capability codes |
| Careers `/careers.html` | Values, equal-opportunity statement, and summarized cards for Datacenter Engineer, Network & Systems Engineer, and CAD Technician |
| Services & Solutions `/services---solutions.html` | Modern service overview for project management, IT infrastructure, and engineering/CAD/CAM |
| Project Management `/project-managment.html` | Five compact phase cards: Initiation, Planning, Execution, Monitoring & Controlling, and Closing |
| IT Infrastructure `/it-infrastructure.html` | Resilience, continuity, LAN/WAN, datacenter, integration, ERP/CRM, desktop/email, and intranet/web competencies |
| Engineering/CAD/CAM `/engineering-cad-cam.html` | Product-cycle, 3D model, drawing, FEA/CFD, DfM, prototyping, pilot-run, series-zero, and vendor-coordination capabilities |
| Contact Us `/contact-us.html` | Published email and phone with an explicit local-preview/no-submission boundary |
| Location `/location.html` | Headquarters and branch-office posture without loading a live map provider |

The browser fetcher could not access the source because it upgraded the request to HTTPS and timed out. A bounded read-only HTTP fetch returned `200 OK` and confirmed the page content above. No authenticated, private, customer-account, or uploaded material was used.

## Information architecture

The build request remains the primary journey:

1. Hero calls the visitor into `#build-request` or the gated build process.
2. Four high-level services establish fit.
3. The request-to-delivery workflow explains readiness and evidence gates.
4. The local form prepares a receipt without transmitting data.
5. Source-parity sections provide deeper capabilities, company/leadership context, customer and government proof, careers, contact facts, and location posture.

Mobile visitors receive a horizontal in-page navigation strip so the longer source-parity experience stays usable at narrow widths.

## Shared fixture and admin evidence

`client/src/lib/kinfloVanguardWorkflow.ts` is the shared source for public and Site Studio views. Its `sourceSite` object records the source-page inventory, coverage groups, service detail, project phases, leadership summaries, customer/GSA/NAICS evidence, career listings, contact boundary, and locations.

The existing Vanguard associate workspace now includes a source-site parity readiness card with the audit date, page count, coverage groups, fixture status, and live-submission gate. This is evidence only; it does not enable a provider or backend write.

## Intentional omissions

- No legacy layout, copied source HTML, source map image, or live map embed.
- No claim that a published customer name, GSA record, role opening, office, qualification, or public fact has been independently re-certified beyond the source-site audit.
- No live contact form, career application, resume upload, private file upload, CRM submission, associate assignment, quote, or delivery update.
- No GSA Advantage or eLibrary deep link was invented where the source audit did not preserve the exact target URL.
- No private customer, employee, applicant, account, or production data.

## Validation

Run:

```sh
npm run check
npm run kinflo:validate-shell-routes
npm run kinflo:validate-client-website-studio
npm run kinflo:validate-client-public-preview-context-links
npm run kinflo:validate-vanguard-source-parity
```

Visual QA must cover the public route at desktop and mobile widths plus the Vanguard Site Studio evidence surface.

Use `npm run kinflo:capture-vanguard-source-parity-qa` while the fixture server is running to regenerate the privacy-safe PNG set and MP4 walkthrough under `docs/qa/vanguard-source-parity/`.

## Provider boundary

- External writes: 0
- `.env.local` created or read: no
- Convex codegen run: no
- Hosted or live Convex smoke run: no
- Provider API called: no
- Production admin or associate action: no
- Production activation: no

