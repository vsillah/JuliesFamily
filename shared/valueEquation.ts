import type { Persona, FunnelStage } from './defaults/personas';

export interface ValueEquationInputs {
  dreamOutcome: string;
  perceivedLikelihood: string;
  timeDelay: string;
  effortSacrifice: string;
}

export interface GeneratedVariant {
  text: string;
  focus: 'dream_outcome' | 'perceived_likelihood' | 'time_delay' | 'effort_sacrifice' | 'balanced';
  explanation: string;
}

export type ContentType = 'hero' | 'cta' | 'service' | 'event' | 'testimonial' | 'lead_magnet' | 'email_subject' | 'email_body';

export interface CopyGenerationRequest {
  originalContent: string;
  contentType: ContentType;
  persona?: Persona;
  funnelStage?: FunnelStage; // Used to tailor messaging to visitor's journey stage
  valueEquation: ValueEquationInputs;
  allowCustomPrompt?: boolean;
  customPrompt?: string;
}

export interface CopyGenerationResponse {
  variants: GeneratedVariant[];
  generationId?: number;
}

// Persona-specific Value Equation templates
export const VALUE_EQUATION_TEMPLATES: Record<Persona, {
  label: string;
  description: string;
  dreamOutcome: {
    label: string;
    placeholder: string;
    examples: string[];
  };
  perceivedLikelihood: {
    label: string;
    placeholder: string;
    examples: string[];
  };
  timeDelay: {
    label: string;
    placeholder: string;
    examples: string[];
  };
  effortSacrifice: {
    label: string;
    placeholder: string;
    examples: string[];
  };
}> = {
  student: {
    label: 'Adult Education Student',
    description: 'Someone seeking to improve their education and skills for better opportunities',
    dreamOutcome: {
      label: 'What transformation will they experience?',
      placeholder: 'e.g., Speak English confidently at work and home',
      examples: [
        'Speak English confidently in professional settings',
        'Earn a GED and unlock better career opportunities',
        'Master computer skills for modern workplaces',
        'Build literacy skills to help children with homework'
      ]
    },
    perceivedLikelihood: {
      label: 'Why should they trust this works for them?',
      placeholder: 'e.g., 500+ graduates, 95% completion rate, certified teachers',
      examples: [
        '500+ successful graduates in the past 5 years',
        'Certified ESL instructors with 10+ years experience',
        '95% of students complete the program',
        'Small class sizes ensure personalized attention',
        'Free tutoring and flexible schedules for working adults'
      ]
    },
    timeDelay: {
      label: 'How quickly will they see results?',
      placeholder: 'e.g., Conversational in 12 weeks, confident in 3 weeks',
      examples: [
        'Conversational English in just 12 weeks',
        'See confidence grow within the first 3 weeks',
        'Earn your GED in 6 months or less',
        'Immediate progress with our proven method'
      ]
    },
    effortSacrifice: {
      label: 'How easy is this for them?',
      placeholder: 'e.g., Just 2 hours/week, free childcare, flexible evening times',
      examples: [
        'Only 2 hours per week commitment',
        'Free childcare provided during classes',
        'Flexible evening and weekend schedules',
        'Classes held at convenient neighborhood locations',
        'No homework or outside study required'
      ]
    }
  },
  provider: {
    label: 'Service Provider',
    description: 'Organizations or professionals who refer clients or collaborate with Julie\'s programs',
    dreamOutcome: {
      label: 'What transformation will they experience?',
      placeholder: 'e.g., Better serve your clients with trusted education partner',
      examples: [
        'Provide comprehensive support to your clients',
        'Partner with a trusted community organization',
        'Strengthen your service network',
        'Enhance client outcomes through education'
      ]
    },
    perceivedLikelihood: {
      label: 'Why should they trust this partnership works?',
      placeholder: 'e.g., 20+ years serving the community, established referral network',
      examples: [
        '20+ years of proven community impact',
        'Partnership with 50+ local organizations',
        'Dedicated liaison for your agency',
        'Shared client success tracking',
        'Streamlined referral process'
      ]
    },
    timeDelay: {
      label: 'How quickly can they start collaborating?',
      placeholder: 'e.g., Same-day enrollment for your referrals',
      examples: [
        'Same-day enrollment for client referrals',
        'Immediate partnership onboarding',
        'Quick response to your inquiries',
        'Fast-track intake for urgent cases'
      ]
    },
    effortSacrifice: {
      label: 'How simple is the partnership process?',
      placeholder: 'e.g., Simple online referral form, dedicated support contact',
      examples: [
        'One simple online referral form',
        'Dedicated partnership liaison',
        'We handle all client follow-up',
        'Regular progress updates on your referrals',
        'No paperwork or administrative burden'
      ]
    }
  },
  parent: {
    label: 'Parent',
    description: 'Parents seeking educational support and enrichment for their children',
    dreamOutcome: {
      label: 'What transformation will their child experience?',
      placeholder: 'e.g., Watch your child excel in reading and math',
      examples: [
        'See your child reading at grade level',
        'Watch confidence grow in school',
        'Prepare your child for academic success',
        'Give your child a strong educational foundation',
        'Help your child develop a love for learning'
      ]
    },
    perceivedLikelihood: {
      label: 'Why should they trust you with their child?',
      placeholder: 'e.g., Certified teachers, safe environment, proven curriculum',
      examples: [
        'Certified teachers who care about your child',
        'Safe, nurturing learning environment',
        'Proven curriculum with measurable results',
        '1000+ children served successfully',
        'Small group sizes for individual attention',
        'Background-checked, experienced staff'
      ]
    },
    timeDelay: {
      label: 'How quickly will they see their child improve?',
      placeholder: 'e.g., Visible progress within 4 weeks',
      examples: [
        'See reading improvement in just 4 weeks',
        'Noticeable confidence boost within days',
        'Rapid skill development with our proven approach',
        'Progress reports every 2 weeks'
      ]
    },
    effortSacrifice: {
      label: 'How easy is it for busy parents?',
      placeholder: 'e.g., Free after-school program, transportation provided',
      examples: [
        'Completely free after-school program',
        'Free transportation to and from school',
        'Healthy snacks provided daily',
        'Drop-off and pick-up at your child\'s school',
        'No homework for parents to manage',
        'Fits into your family\'s busy schedule'
      ]
    }
  },
  donor: {
    label: 'Donor',
    description: 'Individuals or organizations considering supporting Julie\'s programs financially',
    dreamOutcome: {
      label: 'What impact will their donation create?',
      placeholder: 'e.g., Transform lives in your community through education',
      examples: [
        'Transform families through the power of education',
        'Break the cycle of poverty in your community',
        'Create lasting change for local children',
        'Invest in your community\'s future',
        'Make education accessible for all'
      ]
    },
    perceivedLikelihood: {
      label: 'Why should they trust their donation makes a difference?',
      placeholder: 'e.g., 90% of funds go directly to programs, transparent reporting',
      examples: [
        '90% of every dollar goes directly to programs',
        'Transparent financial reporting and impact metrics',
        '20+ years of proven community impact',
        'Regular donor updates with real success stories',
        'Independently audited financials',
        'See exactly where your money goes'
      ]
    },
    timeDelay: {
      label: 'How quickly does their donation create impact?',
      placeholder: 'e.g., Your gift puts students in class this week',
      examples: [
        'Your donation helps students starting this week',
        'Immediate impact on families waiting for services',
        'See results in our quarterly impact reports',
        'Monthly updates on how your gift is making a difference'
      ]
    },
    effortSacrifice: {
      label: 'How simple is the giving process?',
      placeholder: 'e.g., Secure one-click donation, tax-deductible receipt instantly',
      examples: [
        'Secure one-click donation process',
        'Instant tax-deductible receipt',
        'Set up recurring giving in 2 minutes',
        'Multiple payment options available',
        'No follow-up calls or pressure',
        'Unsubscribe from updates anytime'
      ]
    }
  },
  volunteer: {
    label: 'Volunteer',
    description: 'Community members interested in donating their time and skills',
    dreamOutcome: {
      label: 'What fulfillment will they experience?',
      placeholder: 'e.g., Make a real difference tutoring adult learners',
      examples: [
        'Make a tangible difference in someone\'s life',
        'Use your skills to empower others',
        'Be part of a transformative community',
        'See the direct impact of your time',
        'Build meaningful connections while giving back'
      ]
    },
    perceivedLikelihood: {
      label: 'Why should they believe volunteering here is rewarding?',
      placeholder: 'e.g., Comprehensive training, supportive community, flexible roles',
      examples: [
        'Comprehensive training and ongoing support',
        'Join a welcoming community of 200+ volunteers',
        'Flexible opportunities that fit your schedule',
        'See the impact through student success stories',
        'Recognition and appreciation for your service',
        'Build valuable skills while helping others'
      ]
    },
    timeDelay: {
      label: 'How quickly can they start making an impact?',
      placeholder: 'e.g., Start volunteering this week after quick orientation',
      examples: [
        'Start volunteering after one simple orientation',
        'Make an impact in your first session',
        'Quick onboarding process gets you started fast',
        'See student progress within weeks'
      ]
    },
    effortSacrifice: {
      label: 'How manageable is the commitment?',
      placeholder: 'e.g., Just 2 hours/month, choose your own schedule',
      examples: [
        'Commit just 2 hours per month',
        'Choose times that work for your schedule',
        'No long-term commitment required',
        'Virtual and in-person options available',
        'We provide all materials and training',
        'Cancel or reschedule anytime'
      ]
    }
  }
};

// Default/fallback template when persona is not specified
export const DEFAULT_VALUE_EQUATION_TEMPLATE = {
  label: 'General Audience',
  description: 'Broad appeal for all community members',
  dreamOutcome: {
    label: 'What transformation will they experience?',
    placeholder: 'e.g., Transform your life through education',
    examples: [
      'Unlock new opportunities through learning',
      'Build a brighter future for your family',
      'Achieve your educational goals',
      'Gain skills that open doors'
    ]
  },
  perceivedLikelihood: {
    label: 'Why should they trust you?',
    placeholder: 'e.g., 20+ years serving families, proven results',
    examples: [
      '20+ years of proven community impact',
      'Trusted by thousands of local families',
      'Free, high-quality programs',
      'Experienced, caring staff'
    ]
  },
  timeDelay: {
    label: 'How quickly will they see results?',
    placeholder: 'e.g., See progress within weeks',
    examples: [
      'Start seeing results quickly',
      'Immediate access to services',
      'Progress you can measure',
      'Fast-track your goals'
    ]
  },
  effortSacrifice: {
    label: 'How easy is it for them?',
    placeholder: 'e.g., Flexible schedules, free programs, welcoming environment',
    examples: [
      'Completely free programs',
      'Flexible scheduling options',
      'Convenient locations',
      'Welcoming, supportive environment',
      'No complex registration process'
    ]
  }
};

// Content type-specific guidance for copy generation
export const CONTENT_TYPE_GUIDANCE: Record<ContentType, {
  tone: string;
  length: string;
  focus: string;
}> = {
  hero: {
    tone: 'Inspiring and action-oriented',
    length: '15-25 words for headline, 30-50 words for subheadline',
    focus: 'Lead with dream outcome, include clear call-to-action'
  },
  cta: {
    tone: 'Action-driven and low-friction',
    length: '2-5 words',
    focus: 'Emphasize ease and immediate benefit'
  },
  service: {
    tone: 'Informative yet warm',
    length: '50-100 words',
    focus: 'Balance all four value equation elements'
  },
  event: {
    tone: 'Inviting and community-focused',
    length: '30-60 words',
    focus: 'Highlight community benefit and easy participation'
  },
  testimonial: {
    tone: 'Authentic and heartfelt',
    length: 'Match original length',
    focus: 'Personal transformation story'
  },
  lead_magnet: {
    tone: 'Value-forward and enticing',
    length: '20-40 words',
    focus: 'Quick win and minimal commitment'
  },
  email_subject: {
    tone: 'Compelling and curiosity-driven',
    length: '6-10 words, max 50 characters',
    focus: 'Hook with dream outcome or urgency, avoid spam triggers'
  },
  email_body: {
    tone: 'Personal and conversational',
    length: '150-300 words',
    focus: 'Lead with value, build trust, clear single call-to-action'
  }
};
