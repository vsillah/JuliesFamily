export type KinfloAudienceDefinitionStatus = "active" | "inactive";

export type KinfloAudienceDefinition = {
  key: string;
  label: string;
  description: string;
  status: KinfloAudienceDefinitionStatus;
  order: number;
};

export type KinfloAudienceContract = {
  tenantSlug: string;
  siteSlug: string;
  personas: KinfloAudienceDefinition[];
  journeyStages: KinfloAudienceDefinition[];
  defaultPersona?: string;
  defaultJourneyStage?: string;
  previewOnly: true;
};

export type KinfloAudiencePreviewContext = {
  tenantSlug: string;
  siteSlug: string;
  persona?: string;
  journeyStage?: string;
  mode: "read_only_preview";
};

export type KinfloAudiencePreviewResolution =
  | {
      status: "ready";
      contract: KinfloAudienceContract;
      context: KinfloAudiencePreviewContext;
    }
  | {
      status: "invalid";
      reason: string;
      contract?: KinfloAudienceContract;
    };

export type KinfloVisibilityRule = {
  tenantSlug: string;
  siteSlug: string;
  persona?: string;
  journeyStage?: string;
  isVisible: boolean;
};

const active = (key: string, label: string, description: string, order: number): KinfloAudienceDefinition => ({
  key,
  label,
  description,
  status: "active",
  order,
});

const contracts: Record<string, KinfloAudienceContract> = {
  "julies-family": {
    tenantSlug: "julies-family",
    siteSlug: "julies-family",
    personas: [
      active("parent", "Parent", "Families looking for a practical next step.", 10),
      active("student", "Student", "Learners exploring a program or support path.", 20),
      active("provider", "Service provider", "Partners coordinating support around a learner.", 30),
      active("donor", "Donor", "Supporters reviewing impact and ways to contribute.", 40),
      active("volunteer", "Volunteer", "People exploring a direct way to help.", 50),
    ],
    journeyStages: [
      active("awareness", "Awareness", "The visitor is learning what is possible.", 10),
      active("consideration", "Consideration", "The visitor is comparing paths and fit.", 20),
      active("decision", "Decision", "The visitor is ready to choose a next step.", 30),
      active("retention", "Retention", "The visitor is already participating.", 40),
    ],
    defaultPersona: "parent",
    defaultJourneyStage: "awareness",
    previewOnly: true,
  },
  "advisor-client-site": {
    tenantSlug: "advisor-client-starter",
    siteSlug: "advisor-client-site",
    personas: [
      active("provider", "Service provider", "A client comparing advisory and implementation support.", 10),
      active("client-prospect", "Client prospect", "A prospective client evaluating fit and proof.", 20),
      active("referral-partner", "Referral partner", "A partner assessing whether to refer a client.", 30),
    ],
    journeyStages: [
      active("awareness", "Awareness", "The visitor is learning what is possible.", 10),
      active("consideration", "Consideration", "The visitor is comparing paths and fit.", 20),
      active("decision", "Decision", "The visitor is ready to choose a next step.", 30),
      active("retention", "Retention", "The visitor is already participating.", 40),
    ],
    defaultPersona: "provider",
    defaultJourneyStage: "consideration",
    previewOnly: true,
  },
  "vanguard-enterprises": {
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    personas: [
      active("provider", "Service provider", "A technical or delivery partner reviewing the request path.", 10),
      active("client-prospect", "Engineering client", "An organization evaluating delivery fit and capability.", 20),
      active("procurement-lead", "Procurement lead", "A buyer reviewing scope, risk, and acceptance evidence.", 30),
    ],
    journeyStages: [
      active("awareness", "Awareness", "The visitor is learning what Vanguard can deliver.", 10),
      active("consideration", "Consideration", "The visitor is comparing capability and process.", 20),
      active("decision", "Decision", "The visitor is preparing a request or review.", 30),
      active("retention", "Retention", "The visitor is tracking an active engagement.", 40),
    ],
    defaultPersona: "provider",
    defaultJourneyStage: "consideration",
    previewOnly: true,
  },
  "campaign-microsite": {
    tenantSlug: "campaign-microsite-lab",
    siteSlug: "campaign-microsite",
    personas: [
      active("supporter", "Supporter", "A visitor considering the campaign promise.", 10),
      active("partner", "Community partner", "A partner reviewing the campaign and its proof.", 20),
      active("donor", "Donor", "A supporter evaluating how to contribute.", 30),
    ],
    journeyStages: [
      active("awareness", "Awareness", "The visitor is learning what is possible.", 10),
      active("consideration", "Consideration", "The visitor is comparing paths and fit.", 20),
      active("decision", "Decision", "The visitor is ready to choose a next step.", 30),
      active("retention", "Retention", "The visitor is already participating.", 40),
    ],
    defaultPersona: "supporter",
    defaultJourneyStage: "awareness",
    previewOnly: true,
  },
};

function normalizeKey(value: string | undefined) {
  return value?.trim().toLowerCase() || undefined;
}

export function resolveKinfloAudienceContract(siteSlug: string | undefined, tenantSlug?: string) {
  const normalizedSite = normalizeKey(siteSlug);
  const contract = normalizedSite ? contracts[normalizedSite] : undefined;
  if (!contract) {
    return {
      status: "invalid" as const,
      reason: "The requested site has no registered KinFlo audience contract.",
    };
  }
  if (tenantSlug && normalizeKey(tenantSlug) !== contract.tenantSlug) {
    return {
      status: "invalid" as const,
      reason: "The requested tenant and site scopes do not match.",
      contract,
    };
  }
  return { status: "ready" as const, contract };
}

function activeDefinition(definitions: KinfloAudienceDefinition[], requested: string | undefined) {
  const key = normalizeKey(requested);
  if (!key || key === "anonymous" || key === "default" || key === "none") return undefined;
  return definitions.find((definition) => definition.status === "active" && definition.key === key);
}

export function resolveKinfloAudiencePreview(
  siteSlug: string | undefined,
  selection: { tenantSlug?: string; persona?: string; journeyStage?: string } = {},
): KinfloAudiencePreviewResolution {
  const contractResolution = resolveKinfloAudienceContract(siteSlug, selection.tenantSlug);
  if (contractResolution.status === "invalid") return contractResolution;
  const { contract } = contractResolution;
  const requestedPersona = normalizeKey(selection.persona);
  const requestedJourneyStage = normalizeKey(selection.journeyStage);
  const persona = activeDefinition(contract.personas, requestedPersona);
  const journeyStage = activeDefinition(contract.journeyStages, requestedJourneyStage);

  if (requestedPersona && !["anonymous", "default", "none"].includes(requestedPersona) && !persona) {
    return { status: "invalid", reason: "The selected persona is not active for this site.", contract };
  }
  if (requestedJourneyStage && !["anonymous", "default", "none"].includes(requestedJourneyStage) && !journeyStage) {
    return { status: "invalid", reason: "The selected journey stage is not active for this site.", contract };
  }

  return {
    status: "ready",
    contract,
    context: {
      tenantSlug: contract.tenantSlug,
      siteSlug: contract.siteSlug,
      persona: persona?.key,
      journeyStage: journeyStage?.key,
      mode: "read_only_preview",
    },
  };
}

export function buildKinfloAudiencePreviewHref(input: {
  previewPath: string;
  route?: string;
  tenantSlug: string;
  siteSlug: string;
  persona?: string;
  journeyStage?: string;
  experimentKey?: string;
  variantKey?: string;
  device?: "desktop" | "tablet" | "mobile";
}) {
  const params = new URLSearchParams({
    previewMode: "read_only",
    audienceMode: "preview_only",
    studioTenant: input.tenantSlug,
    studioSite: input.siteSlug,
    route: input.route?.trim() || "/",
    source: "admin-persona-journey-preview",
  });
  if (input.persona && !["anonymous", "default", "none"].includes(input.persona)) params.set("persona", input.persona);
  if (input.journeyStage && !["anonymous", "default", "none"].includes(input.journeyStage)) params.set("journeyStage", input.journeyStage);
  if (input.experimentKey && input.experimentKey !== "none") {
    params.set("experimentMode", "preview_only");
    params.set("allocation", "deterministic_preview_only");
    params.set("experiment", input.experimentKey);
  }
  if (input.variantKey && input.variantKey !== "auto") params.set("experimentVariant", input.variantKey);
  if (input.device) params.set("device", input.device);
  return `${input.previewPath}?${params.toString()}`;
}

export function evaluateKinfloVisibility(rule: KinfloVisibilityRule, context: KinfloAudiencePreviewContext) {
  if (!rule.isVisible || rule.tenantSlug !== context.tenantSlug || rule.siteSlug !== context.siteSlug) return false;
  if (rule.persona && rule.persona !== context.persona) return false;
  if (rule.journeyStage && rule.journeyStage !== context.journeyStage) return false;
  return true;
}

export function filterKinfloPreviewBlocks<T extends { metadata?: Record<string, unknown> }>(
  blocks: T[],
  resolution: KinfloAudiencePreviewResolution,
) {
  if (resolution.status !== "ready") return [];
  return blocks.filter((block) => {
    const persona = typeof block.metadata?.persona === "string" ? block.metadata.persona : undefined;
    const journeyStage = typeof block.metadata?.journeyStage === "string" ? block.metadata.journeyStage : undefined;
    return evaluateKinfloVisibility({
      tenantSlug: resolution.context.tenantSlug,
      siteSlug: resolution.context.siteSlug,
      persona,
      journeyStage,
      isVisible: true,
    }, resolution.context);
  });
}

export function isKinfloAudiencePreviewOnly(resolution: KinfloAudiencePreviewResolution) {
  return resolution.status === "ready" && resolution.contract.previewOnly && resolution.context.mode === "read_only_preview";
}
