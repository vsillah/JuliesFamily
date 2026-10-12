import vanguardLogo from "@assets/vanguard-enterprises-logo.jpg";

export const VANGUARD_SITE_KEY = "vanguard-enterprises";

export type VanguardFulfillmentStage = {
  key: string;
  label: string;
  owner: string;
  status: "ready" | "active" | "blocked" | "pending";
  evidence: string;
};

export const vanguardWorkflow = {
  company: {
    name: "Vanguard Enterprises and Associates Inc.",
    shortName: "Vanguard Enterprises",
    tagline: "Pioneering Innovative Collaboration for Excellence",
    location: "Fort Lee, New Jersey",
    email: "info@vanguardenterprises.com",
    phone: "(732) 238-2824",
    sourceUrl: "http://www.vanguardenterprises.com/",
    sourcePosture: "Public website facts and service descriptions, adapted into a local KinFlo fixture.",
    logo: {
      image: vanguardLogo,
      alt: "Vanguard Enterprises",
      sourceUrl: "http://www.vanguardenterprises.com/image/80076569.jpg",
      repositoryPath: "attached_assets/vanguard-enterprises-logo.jpg",
      dimensions: "356 × 138 pixels",
      sha256: "30d17af6df43c14e6510e6cd0abc40d04064c74c8e0d6e167821b6bdf485eb02",
    },
  },
  requestTypes: [
    "Engineering / CAD / CAM",
    "IT infrastructure",
    "Project management",
    "Technical professional services",
  ],
  services: [
    {
      title: "Engineering, CAD, and CAM",
      description: "Turn drawings, models, measurements, and manufacturing constraints into a scoped engineering package.",
    },
    {
      title: "IT infrastructure",
      description: "Define the systems, environments, access needs, and operating requirements behind the build.",
    },
    {
      title: "Project management",
      description: "Give the request an owner, milestones, decision gates, and a clear delivery record.",
    },
    {
      title: "Professional services",
      description: "Match the work with subject matter expertise for projects large or small.",
    },
  ],
  intakeChecklist: [
    "Describe the outcome and current constraint",
    "Inventory available drawings, files, measurements, and system details",
    "Name the target environment, material, process, or platform",
    "Record timeline, acceptance criteria, and delivery contact",
  ],
  stages: [
    {
      key: "request-received",
      label: "Request received",
      owner: "Vanguard intake",
      status: "ready",
      evidence: "Request summary and contact path are visible in the local fixture.",
    },
    {
      key: "source-inventory",
      label: "Source package inventory",
      owner: "Assigned associate",
      status: "active",
      evidence: "Drawings, models, measurements, requirements, and missing inputs are reviewed together.",
    },
    {
      key: "technical-review",
      label: "Technical review",
      owner: "Engineering or IT lead",
      status: "pending",
      evidence: "Discipline-specific review records risks, assumptions, and feasibility notes.",
    },
    {
      key: "quote-readiness",
      label: "Quote and readiness gate",
      owner: "Vanguard engagement lead",
      status: "blocked",
      evidence: "Scope, missing inputs, acceptance criteria, and owner approval must pass before build starts.",
    },
    {
      key: "fulfillment",
      label: "Associate fulfillment",
      owner: "Assigned associate",
      status: "blocked",
      evidence: "Milestones, progress notes, and review decisions remain locked until readiness passes.",
    },
    {
      key: "delivery-receipt",
      label: "Delivery receipt",
      owner: "Vanguard delivery owner",
      status: "blocked",
      evidence: "Delivered files, checks, client acceptance, and follow-up actions form the final receipt.",
    },
  ] satisfies VanguardFulfillmentStage[],
  sampleOrder: {
    id: "VE-BUILD-001",
    requestType: "Engineering / CAD / CAM",
    summary: "Convert a source package into a reviewable engineering build with manufacturing handoff evidence.",
    assignedAssociate: "Unassigned pending scope review",
    progress: 24,
    missingInputs: ["Source file inventory", "Critical measurements", "Target process and material", "Acceptance criteria"],
    deliveryEvidence: ["Versioned deliverables", "Readiness decisions", "Quality checks", "Client receipt"],
  },
  providerBoundary: "This workflow is a local provider-light fixture. It does not submit a live lead, upload private files, create a tenant, run Convex, send email, publish a site, or call a provider.",
  toolingGap: "KinFlo Site Studio can configure a public site, starter content, preview, and gated launch packet. A future configuration-driven release still needs schema-backed build-request fields, attachment manifests, associate assignment, milestone updates, and delivery-receipt records.",
} as const;
