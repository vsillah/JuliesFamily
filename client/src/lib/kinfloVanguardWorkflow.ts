import vanguardLogo from "@assets/vanguard-enterprises-logo.jpg";

export const VANGUARD_SITE_KEY = "vanguard-enterprises";

export type VanguardFulfillmentStage = {
  key: string;
  label: string;
  owner: string;
  status: "ready" | "active" | "blocked" | "pending";
  evidence: string;
  artifact: string;
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
      dimensions: "356 x 138 pixels",
      sha256: "30d17af6df43c14e6510e6cd0abc40d04064c74c8e0d6e167821b6bdf485eb02",
    },
  },
  requestTypes: [
    "Engineering / CAD / CAM",
    "IT infrastructure",
    "Project management",
    "Technical professional services",
  ],
  intakeStages: [
    { key: "source-package", label: "Available materials", summary: "List what already exists" },
    { key: "request-goal", label: "Request goal", summary: "Name the result the build must produce" },
    { key: "discipline", label: "Discipline", summary: "Route the first technical review" },
    { key: "constraints", label: "Constraints", summary: "Record what the build cannot ignore" },
    { key: "readiness", label: "Readiness", summary: "Check missing inputs and prepare a receipt" },
  ],
  sourcePackageOptions: [
    { label: "CAD or 3D model", description: "A model, assembly, mesh, or other digital geometry is available." },
    { label: "Drawing or specification", description: "A dimensioned drawing, PDF, standard, or written requirement exists." },
    { label: "Measurements or photos", description: "Field measurements, reference photos, or an existing physical part can guide review." },
    { label: "System or process notes", description: "Requirements, diagrams, environment details, or operating notes are available." },
    { label: "Sample or failed part", description: "A physical example could be inspected after a safe handoff is arranged." },
    { label: "Concept only", description: "The outcome is known, but supporting materials still need to be created." },
  ],
  disciplines: [
    { label: "Rebuild engineering", description: "Reverse engineering, part reconstruction, fit, tolerances, and manufacturing handoff." },
    { label: "CAD / CAM", description: "3D modeling, drawings, toolpaths, prototypes, and series-zero preparation." },
    { label: "IT infrastructure", description: "Systems, networks, environments, integrations, resilience, and operating requirements." },
    { label: "Project delivery", description: "Scope, schedule, vendor coordination, risk, acceptance, and delivery ownership." },
  ],
  constraintOptions: [
    "Material or manufacturing process",
    "Fit, tolerance, or critical dimensions",
    "Budget or quote threshold",
    "Target date or operating window",
    "Security, access, or data handling",
    "Acceptance or quality standard",
  ],
  clientOrderStages: [
    { key: "draft", label: "Draft", detail: "Describe the build, available materials, and constraints.", access: "Available on this site" },
    { key: "associate-review", label: "Associate review", detail: "Choose what to share and get help closing request gaps.", access: "Account required" },
    { key: "quote-scope", label: "Quote & scope", detail: "Review assumptions, cost, timing, and acceptance criteria.", access: "Saved order required" },
    { key: "build", label: "Build", detail: "Follow ownership, milestones, blockers, and approved changes.", access: "Saved order required" },
    { key: "quality", label: "Quality", detail: "See inspection results, version checks, and open exceptions.", access: "Saved order required" },
    { key: "delivery", label: "Delivery", detail: "Receive the approved files and supporting evidence.", access: "Saved order required" },
    { key: "acceptance", label: "Acceptance", detail: "Confirm receipt or return a specific issue for resolution.", access: "Saved order required" },
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
      description: "Give the request an owner, milestones, decision points, and a clear delivery record.",
    },
    {
      title: "Professional services",
      description: "Match the work with subject matter expertise for projects large or small.",
    },
  ],
  sourceSite: {
    auditedAt: "2026-10-12",
    provenance: "Public pages fetched from http://www.vanguardenterprises.com/ and adapted into local fixture content.",
    inventory: [
      { label: "Home", path: "/" },
      { label: "About Us", path: "/about-us.html" },
      { label: "Management", path: "/management.html" },
      { label: "Customers", path: "/customers.html" },
      { label: "Careers", path: "/careers.html" },
      { label: "Services & Solutions", path: "/services---solutions.html" },
      { label: "Project Management", path: "/project-managment.html" },
      { label: "IT Infrastructure", path: "/it-infrastructure.html" },
      { label: "Engineering/CAD/CAM", path: "/engineering-cad-cam.html" },
      { label: "Contact Us", path: "/contact-us.html" },
      { label: "Location", path: "/location.html" },
    ],
    coverage: [
      "Company overview and locations",
      "Leadership",
      "Commercial and government experience",
      "Service detail and project method",
      "Career listings",
      "Contact information",
    ],
    about: {
      summary: "Vanguard provides information technology and engineering professional services through engineers, designers, and IT specialists. The company emphasizes technically strong, cost-conscious work and a distributed network of vendors and contractors.",
      experience: "Vanguard's principals bring more than 100 years of combined experience.",
      operatingModel: "Virtual workspace and telecommuting tools connect Vanguard's team with vendors and contractors across projects.",
      locations: [
        { label: "Headquarters", city: "Fort Lee, New Jersey" },
        { label: "Branch office", city: "Boston, Massachusetts" },
        { label: "Branch office", city: "Washington, DC" },
      ],
    },
    serviceDetails: [
      {
        key: "project-management",
        title: "Project management",
        summary: "Experienced project managers structure work across different domains, technologies, team sizes, and budgets, with delivery time and budget kept visible.",
        highlights: ["Measurable requirements", "Budget and stakeholder analysis", "Risk and resource planning", "Formal acceptance and lessons learned"],
      },
      {
        key: "it-infrastructure",
        title: "IT infrastructure",
        summary: "Infrastructure planning centers on resilience, redundancy, scale, security, manageability, and total cost.",
        highlights: ["Continuity and disaster recovery", "LAN/WAN support", "Datacenter operations", "Systems integration and consolidation", "ERP and CRM support", "Desktop, email, intranet, and web support"],
      },
      {
        key: "engineering-cad-cam",
        title: "Engineering, CAD, and CAM",
        summary: "Vanguard supports the product cycle from concept modeling and analysis through prototyping, pilot runs, and series-zero manufacturing.",
        highlights: ["3D models and detailed drawings", "Finite element and computational fluid analysis", "Design for manufacturability", "CNC specimens and pilot runs", "Vendor coordination and quality control"],
      },
    ],
    projectPhases: [
      { label: "Initiation", summary: "Define the need, goals, stakeholders, budget, charter, deliverables, and schedule." },
      { label: "Planning", summary: "Estimate time, cost, resources, work, and risk at the right level of detail." },
      { label: "Execution", summary: "Coordinate people and resources to produce the agreed deliverables." },
      { label: "Monitoring & controlling", summary: "Measure performance, spot variance early, and take corrective action." },
      { label: "Closing", summary: "Confirm acceptance, close the work, and capture lessons for the next project." },
    ],
    leadership: [
      { name: "Stanley Foster", role: "President", focus: "IT infrastructure practice building, with Unix, Linux, systems, network, and database administration experience." },
      { name: "Bruce Kenney Jr.", role: "VP Operations", focus: "Datacenter, facility, enterprise storage, cloud services, and IT advisory operations." },
      { name: "Mark Meadows", role: "VP Engineering", focus: "Research, manufacturing engineering, product evaluation, fabrication, prototyping, and process control." },
      { name: "Andrew Watt", role: "VP Marketing", focus: "Business finance, marketing, electrical engineering, and the technical side of the IT market." },
      { name: "Gary Foster", role: "Director of Systems and Network Services", focus: "Project and program management, analytics, application delivery, systems, and network services." },
    ],
    proof: {
      customerPosture: "Vanguard serves commercial and government sectors.",
      customerExamples: [
        "American Software Resources", "Cambrex", "Center for Social Innovation", "Elementis", "Gillette", "JDC Global", "Kumon", "Lonza", "MissBrenner", "Motorola", "National Center on Family Homelessness", "Procter & Gamble", "Rutherford Chemicals", "Safer Textiles", "SipCOMM", "Vantage Systems",
      ],
      gsa: "GSA Contract Schedule 70, Special Item Number 132-51",
      gsaLinks: ["GSA Advantage", "GSA eLibrary"],
      naics: [
        { code: "541513", label: "Computer Facilities Management Services" },
        { code: "541512", label: "Computer Systems Design Services" },
        { code: "541511", label: "Custom Computer Programming Services" },
        { code: "541340", label: "Drafting Services" },
        { code: "541330", label: "Engineering Services" },
        { code: "333515", label: "Cutting Tool and Machine Tool Accessory Manufacturing" },
        { code: "333514", label: "Special Die and Tool, Die Set, Jig and Fixture Manufacturing" },
        { code: "333511", label: "Industrial Mold Manufacturing" },
        { code: "332710", label: "Machine Shops" },
      ],
    },
    careers: {
      values: ["Integrity", "Respect", "Diversity", "Excellence", "Innovation"],
      equalOpportunity: "Vanguard is an equal opportunity employer.",
      roles: [
        {
          title: "Datacenter Engineer",
          summary: "Resolve datacenter, network, system, server, storage, virtualization, and support-queue issues.",
          experience: "Experience: 10 years; BS in Computer Science or Engineering.",
        },
        {
          title: "Network & Systems Engineer",
          summary: "Design, deploy, monitor, maintain, and support Windows, Unix/Linux, VMware, security, asset, and performance systems.",
          experience: "Experience: 10 years; BS in Computer Science or Engineering.",
        },
        {
          title: "CAD Technician",
          summary: "Create and revise 3D models, drawings, engineering-change documents, layouts, bills of materials, and tolerance work.",
          experience: "Experience: 5 years with AutoCAD and/or SolidWorks; associate degree or accredited CAD certificate path.",
        },
      ],
    },
    contact: {
      summary: "Use the email or phone below to ask about services or career opportunities. Online contact and resume submission are not available here.",
      locationPosture: "Vanguard is located near major freeways and metro areas. An interactive map is not available here.",
    },
  },
  intakeChecklist: [
    "Describe the outcome and current constraint",
    "Inventory available drawings, files, measurements, and system details",
    "Name the target environment, material, process, or platform",
    "Record timeline, acceptance criteria, and delivery contact",
  ],
  stages: [
    {
      key: "reversr-intake",
      label: "Enter the ReversR Rebuild intake",
      owner: "Requester",
      status: "ready",
      evidence: "The requester lists the available materials, goal, discipline, and constraints in the request form.",
      artifact: "Request summary",
    },
    {
      key: "source-readiness",
      label: "Check materials and readiness",
      owner: "Request readiness",
      status: "active",
      evidence: "The form identifies missing inputs and prepares a request receipt when the minimum fields are complete.",
      artifact: "Readiness result and missing-input list",
    },
    {
      key: "associate-review",
      label: "Vanguard associate review",
      owner: "Vanguard intake associate",
      status: "pending",
      evidence: "An associate verifies the available materials, chooses the technical owner, and records risks and questions.",
      artifact: "Associate review record",
    },
    {
      key: "quote-scope",
      label: "Quote and scope decision",
      owner: "Engagement lead and requester",
      status: "blocked",
      evidence: "Scope, assumptions, cost, acceptance criteria, and open inputs must be agreed before work begins.",
      artifact: "Quote and accepted scope",
    },
    {
      key: "fulfillment",
      label: "Track associate fulfillment",
      owner: "Assigned associate",
      status: "blocked",
      evidence: "Milestones, decisions, progress notes, and change requests continue in the Vanguard workspace.",
      artifact: "Milestone progress record",
    },
    {
      key: "quality-delivery",
      label: "Record quality and delivery evidence",
      owner: "Vanguard quality owner",
      status: "blocked",
      evidence: "Version checks, inspection results, delivered files, and unresolved exceptions form the handoff record.",
      artifact: "Quality and delivery evidence manifest",
    },
    {
      key: "delivery-receipt",
      label: "Receive and acknowledge delivery",
      owner: "Requester and delivery owner",
      status: "blocked",
      evidence: "The requester receives the delivery record, acknowledges receipt, and records any follow-up action.",
      artifact: "Versioned delivery receipt",
    },
  ] satisfies VanguardFulfillmentStage[],
  sampleOrder: {
    id: "VE-BUILD-001",
    requestType: "Engineering / CAD / CAM",
    summary: "Convert the available materials into a reviewable engineering build with a clear manufacturing handoff.",
    assignedAssociate: "Unassigned pending scope review",
    progress: 24,
    missingInputs: ["Available file list", "Critical measurements", "Target process and material", "Acceptance criteria"],
    deliveryEvidence: ["Versioned deliverables", "Readiness decisions", "Quality checks", "Client receipt"],
  },
  providerBoundary: "This workflow is a local provider-light fixture. It does not submit a live lead, upload private files, create a tenant, run Convex, send email, publish a site, or call a provider.",
  toolingGap: "KinFlo Site Studio can configure a public site, starter content, preview, and gated launch packet. A future configuration-driven release still needs schema-backed build-request fields, attachment manifests, associate assignment, milestone updates, and delivery-receipt records.",
} as const;
