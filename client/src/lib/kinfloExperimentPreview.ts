export type KinfloExperimentStatus = "draft" | "review" | "active" | "paused" | "archived";

export type KinfloExperimentVariant = {
  key: string;
  label: string;
  description: string;
  weight: number;
  status: "active" | "inactive";
};

export type KinfloExperimentDefinition = {
  key: string;
  label: string;
  description: string;
  status: KinfloExperimentStatus;
  tenantSlug: string;
  siteSlug: string;
  personaKeys: string[];
  journeyStageKeys: string[];
  variants: KinfloExperimentVariant[];
};

export type KinfloExperimentContract = {
  tenantSlug: string;
  siteSlug: string;
  experiments: KinfloExperimentDefinition[];
  previewOnly: true;
  allocationPersistence: "disabled";
};

export type KinfloExperimentPreviewContext = {
  tenantSlug: string;
  siteSlug: string;
  persona: string;
  journeyStage: string;
  experimentKey?: string;
  variantKey?: string;
  mode: "read_only_preview";
  allocation: "deterministic_preview_only";
  previewOnly: true;
};

export type KinfloExperimentPreviewResolution =
  | {
      status: "ready";
      contract: KinfloExperimentContract;
      context: KinfloExperimentPreviewContext;
      experiment?: KinfloExperimentDefinition;
      variant?: KinfloExperimentVariant;
    }
  | {
      status: "invalid";
      reason: string;
      contract?: KinfloExperimentContract;
    };

const experiment = (
  tenantSlug: string,
  siteSlug: string,
  definition: Omit<KinfloExperimentDefinition, "tenantSlug" | "siteSlug">,
): KinfloExperimentDefinition => ({ tenantSlug, siteSlug, ...definition });

const contracts: Record<string, KinfloExperimentContract> = {
  "julies-family": {
    tenantSlug: "julies-family",
    siteSlug: "julies-family",
    experiments: [
      experiment("julies-family", "julies-family", {
        key: "julie-program-path",
        label: "Program path framing",
        description: "Fixture-only comparison of program discovery language.",
        status: "review",
        personaKeys: ["parent", "student"],
        journeyStageKeys: ["awareness", "consideration"],
        variants: [
          { key: "programs-first", label: "Programs first", description: "Lead with program choices.", weight: 50, status: "active" },
          { key: "story-first", label: "Story first", description: "Lead with family stories.", weight: 50, status: "active" },
        ],
      }),
    ],
    previewOnly: true,
    allocationPersistence: "disabled",
  },
  "advisor-client-site": {
    tenantSlug: "advisor-client-starter",
    siteSlug: "advisor-client-site",
    experiments: [
      experiment("advisor-client-starter", "advisor-client-site", {
        key: "advisor-proof-order",
        label: "Proof order",
        description: "Compare proof-led and conversation-led advisor pages.",
        status: "draft",
        personaKeys: ["provider", "client-prospect"],
        journeyStageKeys: ["consideration", "decision"],
        variants: [
          { key: "proof-led", label: "Proof led", description: "Show evidence before the CTA.", weight: 50, status: "active" },
          { key: "conversation-led", label: "Conversation led", description: "Lead with an invitation to talk.", weight: 50, status: "active" },
        ],
      }),
    ],
    previewOnly: true,
    allocationPersistence: "disabled",
  },
  "vanguard-enterprises": {
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    experiments: [
      experiment("vanguard-enterprises", "vanguard-enterprises", {
        key: "vanguard-request-framing",
        label: "Request framing",
        description: "Compare capability-first and ReversR-first request framing.",
        status: "review",
        personaKeys: ["provider", "client-prospect", "procurement-lead"],
        journeyStageKeys: ["awareness", "consideration", "decision"],
        variants: [
          { key: "capability-first", label: "Capability first", description: "Lead with Vanguard capabilities.", weight: 50, status: "active" },
          { key: "reversr-first", label: "ReversR first", description: "Lead with the ReversR request path.", weight: 50, status: "active" },
        ],
      }),
      experiment("vanguard-enterprises", "vanguard-enterprises", {
        key: "vanguard-proof-depth",
        label: "Proof depth",
        description: "Compare concise and detailed delivery proof.",
        status: "draft",
        personaKeys: ["client-prospect", "procurement-lead"],
        journeyStageKeys: ["consideration", "decision"],
        variants: [
          { key: "concise-proof", label: "Concise proof", description: "Keep evidence compact.", weight: 60, status: "active" },
          { key: "detailed-proof", label: "Detailed proof", description: "Show more delivery evidence.", weight: 40, status: "active" },
        ],
      }),
    ],
    previewOnly: true,
    allocationPersistence: "disabled",
  },
};

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase() || undefined;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function selectDeterministicVariant(
  definition: KinfloExperimentDefinition,
  context: Pick<KinfloExperimentPreviewContext, "tenantSlug" | "siteSlug" | "persona" | "journeyStage">,
) {
  const activeVariants = definition.variants.filter((variant) => variant.status === "active" && variant.weight > 0);
  if (activeVariants.length === 0) return undefined;
  const totalWeight = activeVariants.reduce((total, variant) => total + variant.weight, 0);
  let cursor = stableHash(`${context.tenantSlug}/${context.siteSlug}/${definition.key}/${context.persona}/${context.journeyStage}`) % totalWeight;
  for (const variant of activeVariants) {
    if (cursor < variant.weight) return variant;
    cursor -= variant.weight;
  }
  return activeVariants.at(-1);
}

export function resolveKinfloExperimentContract(siteSlug: string | undefined, tenantSlug?: string) {
  const normalizedSite = normalize(siteSlug);
  const contract = normalizedSite ? contracts[normalizedSite] : undefined;
  if (!contract) {
    return { status: "invalid" as const, reason: "The requested site has no registered experiment contract." };
  }
  if (tenantSlug && normalize(tenantSlug) !== contract.tenantSlug) {
    return { status: "invalid" as const, reason: "The requested tenant and experiment site scopes do not match.", contract };
  }
  return { status: "ready" as const, contract };
}

export function resolveKinfloExperimentPreview(
  siteSlug: string | undefined,
  selection: {
    tenantSlug?: string;
    persona?: string;
    journeyStage?: string;
    experimentKey?: string;
    variantKey?: string;
  } = {},
): KinfloExperimentPreviewResolution {
  const contractResolution = resolveKinfloExperimentContract(siteSlug, selection.tenantSlug);
  if (contractResolution.status === "invalid") return contractResolution;
  const { contract } = contractResolution;
  const experimentKey = normalize(selection.experimentKey);
  const variantKey = normalize(selection.variantKey);
  const persona = normalize(selection.persona);
  const journeyStage = normalize(selection.journeyStage);
  if (!experimentKey || experimentKey === "none") {
    if (variantKey && variantKey !== "auto") {
      return { status: "invalid", reason: "An experiment variant cannot be selected without an experiment.", contract };
    }
    return {
      status: "ready",
      contract,
      context: {
        tenantSlug: contract.tenantSlug,
        siteSlug: contract.siteSlug,
        persona: persona ?? "anonymous",
        journeyStage: journeyStage ?? "default",
        mode: "read_only_preview",
        allocation: "deterministic_preview_only",
        previewOnly: true,
      },
    };
  }
  if (!persona || !journeyStage) {
    return { status: "invalid", reason: "Experiment preview requires an explicit persona and journey stage.", contract };
  }
  const baseContext = {
    tenantSlug: contract.tenantSlug,
    siteSlug: contract.siteSlug,
    persona,
    journeyStage,
    mode: "read_only_preview" as const,
    allocation: "deterministic_preview_only" as const,
    previewOnly: true as const,
  };
  const definition = contract.experiments.find((item) => item.key === experimentKey);
  if (!definition || definition.status === "archived") {
    return { status: "invalid", reason: "The selected experiment is unknown or archived for this site.", contract };
  }
  if (!definition.personaKeys.includes(persona) || !definition.journeyStageKeys.includes(journeyStage)) {
    return { status: "invalid", reason: "The selected persona and journey stage are outside this experiment scope.", contract };
  }
  const selectedVariant = variantKey
    ? definition.variants.find((item) => item.key === variantKey && item.status === "active")
    : selectDeterministicVariant(definition, baseContext);
  if (!selectedVariant) {
    return { status: "invalid", reason: "The selected experiment variant is unknown or inactive.", contract };
  }
  return {
    status: "ready",
    contract,
    context: { ...baseContext, experimentKey: definition.key, variantKey: selectedVariant.key },
    experiment: definition,
    variant: selectedVariant,
  };
}

export function buildKinfloExperimentPreviewHref(input: {
  previewPath: string;
  route?: string;
  tenantSlug: string;
  siteSlug: string;
  persona: string;
  journeyStage: string;
  experimentKey?: string;
  variantKey?: string;
  device?: "desktop" | "tablet" | "mobile";
}) {
  const params = new URLSearchParams({
    previewMode: "read_only",
    audienceMode: "preview_only",
    experimentMode: "preview_only",
    allocation: "deterministic_preview_only",
    studioTenant: input.tenantSlug,
    studioSite: input.siteSlug,
    route: input.route?.trim() || "/",
    persona: input.persona,
    journeyStage: input.journeyStage,
    source: "admin-experiment-preview",
  });
  if (input.experimentKey && input.experimentKey !== "none") params.set("experiment", input.experimentKey);
  if (input.variantKey && input.variantKey !== "auto") params.set("experimentVariant", input.variantKey);
  if (input.device) params.set("device", input.device);
  return `${input.previewPath}?${params.toString()}`;
}

export function isKinfloExperimentPreviewOnly(resolution: KinfloExperimentPreviewResolution) {
  return resolution.status === "ready"
    && resolution.contract.previewOnly
    && resolution.contract.allocationPersistence === "disabled"
    && resolution.context.mode === "read_only_preview"
    && resolution.context.allocation === "deterministic_preview_only";
}
