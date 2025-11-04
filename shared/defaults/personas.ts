export const PERSONAS = ['student', 'provider', 'parent', 'donor', 'volunteer'] as const;
export type Persona = typeof PERSONAS[number];

export const FUNNEL_STAGES = ['awareness', 'consideration', 'decision', 'retention'] as const;
export type FunnelStage = typeof FUNNEL_STAGES[number];

export const PERSONA_LABELS: Record<Persona, string> = {
  student: 'Adult Education Student',
  provider: 'Service Provider',
  parent: 'Parent',
  donor: 'Donor',
  volunteer: 'Volunteer'
};

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  awareness: 'Awareness',
  consideration: 'Consideration',
  decision: 'Decision',
  retention: 'Retention'
};
