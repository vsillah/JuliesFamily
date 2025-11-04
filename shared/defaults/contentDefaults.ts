import type { Persona, FunnelStage } from './personas';

export interface ContentVisibilityDefaults {
  isVisible: boolean;
  order: number;
  titleOverride?: string;
  descriptionOverride?: string;
  imageNameOverride?: string;
}

// Services defaults - base content exists in database, these define persona×stage visibility/ordering
export const SERVICE_DEFAULTS: Record<string, Record<Persona, Record<FunnelStage, ContentVisibilityDefaults>>> = {
  "Children's Services": {
    student: {
      awareness: { isVisible: true, order: 3 },
      consideration: { isVisible: true, order: 2 },
      decision: { isVisible: true, order: 1 },
      retention: { isVisible: true, order: 3 }
    },
    provider: {
      awareness: { isVisible: true, order: 2 },
      consideration: { isVisible: true, order: 2 },
      decision: { isVisible: true, order: 2 },
      retention: { isVisible: true, order: 2 }
    },
    parent: {
      awareness: { isVisible: true, order: 1 },
      consideration: { isVisible: true, order: 1 },
      decision: { isVisible: true, order: 1 },
      retention: { isVisible: true, order: 1 }
    },
    donor: {
      awareness: { isVisible: true, order: 2 },
      consideration: { isVisible: true, order: 2 },
      decision: { isVisible: true, order: 2 },
      retention: { isVisible: true, order: 2 }
    },
    volunteer: {
      awareness: { isVisible: true, order: 2 },
      consideration: { isVisible: true, order: 2 },
      decision: { isVisible: true, order: 2 },
      retention: { isVisible: true, order: 1 }
    }
  },
  "Family Development": {
    student: {
      awareness: { isVisible: true, order: 2 },
      consideration: { isVisible: true, order: 1 },
      decision: { isVisible: true, order: 2 },
      retention: { isVisible: true, order: 1 }
    },
    provider: {
      awareness: { isVisible: true, order: 1 },
      consideration: { isVisible: true, order: 1 },
      decision: { isVisible: true, order: 1 },
      retention: { isVisible: true, order: 1 }
    },
    parent: {
      awareness: { isVisible: true, order: 3 },
      consideration: { isVisible: true, order: 3 },
      decision: { isVisible: true, order: 3 },
      retention: { isVisible: true, order: 3 }
    },
    donor: {
      awareness: { isVisible: true, order: 1 },
      consideration: { isVisible: true, order: 1 },
      decision: { isVisible: true, order: 1 },
      retention: { isVisible: true, order: 1 }
    },
    volunteer: {
      awareness: { isVisible: true, order: 3 },
      consideration: { isVisible: true, order: 3 },
      decision: { isVisible: true, order: 3 },
      retention: { isVisible: true, order: 3 }
    }
  },
  "Adult Basic Education": {
    student: {
      awareness: { isVisible: true, order: 1 },
      consideration: { isVisible: true, order: 3 },
      decision: { isVisible: true, order: 3 },
      retention: { isVisible: true, order: 2 }
    },
    provider: {
      awareness: { isVisible: true, order: 3 },
      consideration: { isVisible: true, order: 3 },
      decision: { isVisible: true, order: 3 },
      retention: { isVisible: true, order: 3 }
    },
    parent: {
      awareness: { isVisible: true, order: 2 },
      consideration: { isVisible: true, order: 2 },
      decision: { isVisible: true, order: 2 },
      retention: { isVisible: true, order: 2 }
    },
    donor: {
      awareness: { isVisible: true, order: 3 },
      consideration: { isVisible: true, order: 3 },
      decision: { isVisible: true, order: 3 },
      retention: { isVisible: true, order: 3 }
    },
    volunteer: {
      awareness: { isVisible: true, order: 1 },
      consideration: { isVisible: true, order: 1 },
      decision: { isVisible: true, order: 1 },
      retention: { isVisible: true, order: 2 }
    }
  }
};

// Events are visible to all personas/stages by default with consistent ordering
export const EVENT_DEFAULTS: Record<Persona, Record<FunnelStage, ContentVisibilityDefaults>> = {
  student: {
    awareness: { isVisible: true, order: 0 },
    consideration: { isVisible: true, order: 0 },
    decision: { isVisible: true, order: 0 },
    retention: { isVisible: true, order: 0 }
  },
  provider: {
    awareness: { isVisible: true, order: 0 },
    consideration: { isVisible: true, order: 0 },
    decision: { isVisible: true, order: 0 },
    retention: { isVisible: true, order: 0 }
  },
  parent: {
    awareness: { isVisible: true, order: 0 },
    consideration: { isVisible: true, order: 0 },
    decision: { isVisible: true, order: 0 },
    retention: { isVisible: true, order: 0 }
  },
  donor: {
    awareness: { isVisible: true, order: 0 },
    consideration: { isVisible: true, order: 0 },
    decision: { isVisible: true, order: 0 },
    retention: { isVisible: true, order: 0 }
  },
  volunteer: {
    awareness: { isVisible: true, order: 0 },
    consideration: { isVisible: true, order: 0 },
    decision: { isVisible: true, order: 0 },
    retention: { isVisible: true, order: 0 }
  }
};

// Testimonials are visible to all personas/stages by default with consistent ordering
export const TESTIMONIAL_DEFAULTS: Record<Persona, Record<FunnelStage, ContentVisibilityDefaults>> = {
  student: {
    awareness: { isVisible: true, order: 0 },
    consideration: { isVisible: true, order: 0 },
    decision: { isVisible: true, order: 0 },
    retention: { isVisible: true, order: 0 }
  },
  provider: {
    awareness: { isVisible: true, order: 0 },
    consideration: { isVisible: true, order: 0 },
    decision: { isVisible: true, order: 0 },
    retention: { isVisible: true, order: 0 }
  },
  parent: {
    awareness: { isVisible: true, order: 0 },
    consideration: { isVisible: true, order: 0 },
    decision: { isVisible: true, order: 0 },
    retention: { isVisible: true, order: 0 }
  },
  donor: {
    awareness: { isVisible: true, order: 0 },
    consideration: { isVisible: true, order: 0 },
    decision: { isVisible: true, order: 0 },
    retention: { isVisible: true, order: 0 }
  },
  volunteer: {
    awareness: { isVisible: true, order: 0 },
    consideration: { isVisible: true, order: 0 },
    decision: { isVisible: true, order: 0 },
    retention: { isVisible: true, order: 0 }
  }
};

// Lead magnets have specific persona×stage targeting by design
export const LEAD_MAGNET_VISIBILITY_DEFAULTS: Record<string, Record<Persona, Record<FunnelStage, ContentVisibilityDefaults>>> = {
  "Find Your Perfect Program": {
    student: {
      awareness: { isVisible: true, order: 1 },
      consideration: { isVisible: false, order: 0 },
      decision: { isVisible: false, order: 0 },
      retention: { isVisible: false, order: 0 }
    },
    provider: {
      awareness: { isVisible: false, order: 0 },
      consideration: { isVisible: false, order: 0 },
      decision: { isVisible: false, order: 0 },
      retention: { isVisible: false, order: 0 }
    },
    parent: {
      awareness: { isVisible: false, order: 0 },
      consideration: { isVisible: false, order: 0 },
      decision: { isVisible: false, order: 0 },
      retention: { isVisible: false, order: 0 }
    },
    donor: {
      awareness: { isVisible: false, order: 0 },
      consideration: { isVisible: false, order: 0 },
      decision: { isVisible: false, order: 0 },
      retention: { isVisible: false, order: 0 }
    },
    volunteer: {
      awareness: { isVisible: false, order: 0 },
      consideration: { isVisible: false, order: 0 },
      decision: { isVisible: false, order: 0 },
      retention: { isVisible: false, order: 0 }
    }
  },
  "Success Stories Guide": {
    student: {
      awareness: { isVisible: false, order: 0 },
      consideration: { isVisible: true, order: 1 },
      decision: { isVisible: false, order: 0 },
      retention: { isVisible: false, order: 0 }
    },
    provider: {
      awareness: { isVisible: false, order: 0 },
      consideration: { isVisible: false, order: 0 },
      decision: { isVisible: false, order: 0 },
      retention: { isVisible: false, order: 0 }
    },
    parent: {
      awareness: { isVisible: false, order: 0 },
      consideration: { isVisible: false, order: 0 },
      decision: { isVisible: false, order: 0 },
      retention: { isVisible: false, order: 0 }
    },
    donor: {
      awareness: { isVisible: false, order: 0 },
      consideration: { isVisible: false, order: 0 },
      decision: { isVisible: false, order: 0 },
      retention: { isVisible: false, order: 0 }
    },
    volunteer: {
      awareness: { isVisible: false, order: 0 },
      consideration: { isVisible: false, order: 0 },
      decision: { isVisible: false, order: 0 },
      retention: { isVisible: false, order: 0 }
    }
  }
  // Additional lead magnets would be added here following the same pattern
};
