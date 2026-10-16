export const MAX_AUDIENCE_DEFINITIONS = 100;
export const MAX_PASSION_TAGS = 20;
export const MAX_PRESENTATION_PROFILES = 100;

export type AudienceDefinitionLike = {
  _id: unknown;
  tenantId: unknown;
  siteId: unknown;
  key: string;
  status: string;
};

export type AudienceRequest = {
  persona?: string;
  journeyStage?: string;
};

function sameId(left: unknown, right: unknown) {
  return String(left) === String(right);
}

export function normalizeAudienceKey(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!normalized || normalized.length > 64) {
    throw new Error("Audience keys must contain 1 to 64 letters, numbers, or separators");
  }
  return normalized;
}

export function normalizePassionTags(values: string[]) {
  const tags = Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)));
  if (tags.length > MAX_PASSION_TAGS) {
    throw new Error(`Audience context supports at most ${MAX_PASSION_TAGS} passion tags`);
  }
  if (tags.some((tag) => tag.length > 64)) {
    throw new Error("Passion tags must be 64 characters or fewer");
  }
  return tags;
}

export function definitionMatchesSite(
  definition: AudienceDefinitionLike | null | undefined,
  tenantId: unknown,
  siteId: unknown,
  options: { requireActive?: boolean } = {},
) {
  return Boolean(
    definition &&
      sameId(definition.tenantId, tenantId) &&
      sameId(definition.siteId, siteId) &&
      (!options.requireActive || definition.status === "active"),
  );
}

export function resolveConfiguredAudience(
  request: AudienceRequest,
  personas: AudienceDefinitionLike[],
  journeyStages: AudienceDefinitionLike[],
) {
  const persona = request.persona ? normalizeAudienceKey(request.persona) : undefined;
  const journeyStage = request.journeyStage
    ? normalizeAudienceKey(request.journeyStage)
    : undefined;
  const activePersonas = personas.filter((definition) => definition.status === "active");
  const activeJourneyStages = journeyStages.filter((definition) => definition.status === "active");
  const configured = personas.length > 0 || journeyStages.length > 0;

  if (!configured) {
    return {
      persona,
      journeyStage,
      mode: persona || journeyStage ? "legacy" as const : "explorer" as const,
    };
  }

  return {
    persona: activePersonas.some((definition) => definition.key === persona) ? persona : undefined,
    journeyStage: activeJourneyStages.some((definition) => definition.key === journeyStage)
      ? journeyStage
      : undefined,
    mode: "configured" as const,
  };
}

export function assertPreviewReferences(input: {
  tenantId: unknown;
  siteId: unknown;
  persona?: AudienceDefinitionLike | null;
  journeyStage?: AudienceDefinitionLike | null;
}) {
  if (input.persona && !definitionMatchesSite(
    input.persona,
    input.tenantId,
    input.siteId,
    { requireActive: true },
  )) {
    throw new Error("Audience definition is unavailable");
  }
  if (input.journeyStage && !definitionMatchesSite(
    input.journeyStage,
    input.tenantId,
    input.siteId,
    { requireActive: true },
  )) {
    throw new Error("Audience definition is unavailable");
  }
}

export function assertPresentationComposition(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Presentation composition must be an object");
  }
  const serialized = JSON.stringify(value);
  if (serialized.length > 100_000) {
    throw new Error("Presentation composition exceeds the bounded preview limit");
  }
  return value as Record<string, unknown>;
}

export function assertContentMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Content block metadata must be an object");
  }
  const serialized = JSON.stringify(value);
  if (serialized.length > 100_000) {
    throw new Error("Content block metadata exceeds the bounded content limit");
  }
  return value as Record<string, unknown>;
}
