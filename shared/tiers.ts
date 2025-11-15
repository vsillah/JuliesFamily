export const TIERS = {
  BASIC: 'basic',
  PRO: 'pro',
  PREMIUM: 'premium'
} as const;

export type Tier = typeof TIERS[keyof typeof TIERS];

export interface TierFeatures {
  // Core CRM features
  leadManagement: boolean;
  basicSegmentation: boolean;
  communicationTimeline: boolean;
  taskManagement: boolean;
  
  // Content & Engagement
  contentManagement: boolean;
  passionBasedPersonalization: boolean;
  donationSystem: boolean;
  volunteerTracking: boolean;
  
  // Pro Features
  advancedSegmentation: boolean;
  emailCampaigns: boolean;
  scheduledReports: boolean;
  googleCalendarIntegration: boolean;
  bulkLeadImport: boolean;
  
  // Premium Features
  abTesting: boolean;
  automatedAbTesting: boolean;
  smsCampaigns: boolean;
  bulkSmsCampaigns: boolean;
  aiCopyGeneration: boolean;
  automationRules: boolean;
  
  // Limits
  maxLeads: number;
  maxEmailsPerMonth: number;
  maxSmsPerMonth: number;
  maxAdmins: number;
}

export const TIER_CONFIG: Record<Tier, TierFeatures> = {
  [TIERS.BASIC]: {
    // Core CRM - All tiers
    leadManagement: true,
    basicSegmentation: true,
    communicationTimeline: true,
    taskManagement: true,
    
    // Content & Engagement - All tiers
    contentManagement: true,
    passionBasedPersonalization: true,
    donationSystem: true,
    volunteerTracking: true,
    
    // Pro Features - Locked
    advancedSegmentation: false,
    emailCampaigns: false,
    scheduledReports: false,
    googleCalendarIntegration: false,
    bulkLeadImport: false,
    
    // Premium Features - Locked
    abTesting: false,
    automatedAbTesting: false,
    smsCampaigns: false,
    bulkSmsCampaigns: false,
    aiCopyGeneration: false,
    automationRules: false,
    
    // Limits
    maxLeads: 100,
    maxEmailsPerMonth: 500,
    maxSmsPerMonth: 0,
    maxAdmins: 2
  },
  
  [TIERS.PRO]: {
    // Core CRM - All tiers
    leadManagement: true,
    basicSegmentation: true,
    communicationTimeline: true,
    taskManagement: true,
    
    // Content & Engagement - All tiers
    contentManagement: true,
    passionBasedPersonalization: true,
    donationSystem: true,
    volunteerTracking: true,
    
    // Pro Features - Unlocked
    advancedSegmentation: true,
    emailCampaigns: true,
    scheduledReports: true,
    googleCalendarIntegration: true,
    bulkLeadImport: true,
    
    // Premium Features - Locked
    abTesting: false,
    automatedAbTesting: false,
    smsCampaigns: false,
    bulkSmsCampaigns: false,
    aiCopyGeneration: false,
    automationRules: false,
    
    // Limits
    maxLeads: 1000,
    maxEmailsPerMonth: 5000,
    maxSmsPerMonth: 0,
    maxAdmins: 5
  },
  
  [TIERS.PREMIUM]: {
    // Core CRM - All tiers
    leadManagement: true,
    basicSegmentation: true,
    communicationTimeline: true,
    taskManagement: true,
    
    // Content & Engagement - All tiers
    contentManagement: true,
    passionBasedPersonalization: true,
    donationSystem: true,
    volunteerTracking: true,
    
    // Pro Features - Unlocked
    advancedSegmentation: true,
    emailCampaigns: true,
    scheduledReports: true,
    googleCalendarIntegration: true,
    bulkLeadImport: true,
    
    // Premium Features - Unlocked
    abTesting: true,
    automatedAbTesting: true,
    smsCampaigns: true,
    bulkSmsCampaigns: true,
    aiCopyGeneration: true,
    automationRules: true,
    
    // Limits
    maxLeads: -1, // Unlimited
    maxEmailsPerMonth: -1, // Unlimited
    maxSmsPerMonth: 10000,
    maxAdmins: -1 // Unlimited
  }
};

export function getTierFeatures(tier: Tier): TierFeatures {
  return TIER_CONFIG[tier];
}

export function hasTierAccess(userTier: Tier, requiredTier: Tier): boolean {
  const tierOrder = [TIERS.BASIC, TIERS.PRO, TIERS.PREMIUM];
  const userIndex = tierOrder.indexOf(userTier);
  const requiredIndex = tierOrder.indexOf(requiredTier);
  return userIndex >= requiredIndex;
}

export function getTierDisplayName(tier: Tier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
