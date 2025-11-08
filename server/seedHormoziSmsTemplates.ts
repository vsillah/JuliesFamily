import type { InsertSmsTemplate } from "@shared/schema";

/**
 * Hormozi SMS Templates - Optimized for SMS brevity and immediacy
 * Based on Alex Hormozi's "$100M Leads" communication strategies
 * 
 * SMS Constraints:
 * - 160 characters for single segment
 * - 306 characters for 2-segment messages (160 + 146)
 * - Plain text only, no HTML
 * - Ultra-concise, action-oriented
 * - Include opt-out where needed
 * 
 * Outreach Types:
 * - cold: Initial contact with new prospects
 * - warm: Follow-up with engaged leads
 * - warm_broadcast: General updates/announcements
 * - re_engagement: Win-back inactive contacts
 * 
 * Template Categories (Hormozi frameworks):
 * - aca_framework: Acknowledge-Context-Action
 * - social_proof: Testimonials and success stories
 * - urgency_scarcity: Time/quantity limited offers
 * - dream_outcome: Paint the vision
 * - pain_points: Address specific problems
 * - objection_handling: Overcome hesitations
 * - value_stacking: Multiple benefits
 * - clear_cta: Single, clear action
 */

export const hormoziSmsTemplates: InsertSmsTemplate[] = [
  // COLD OUTREACH - A-C-A Framework
  {
    name: "Cold: A-C-A Introduction",
    description: "Initial contact using Acknowledge-Context-Action framework",
    messageContent: "Hi {firstName}, noticed you're a {cityName} parent. We help kids build literacy skills for free. 3 spots left this week. Interested? Reply YES or STOP to opt out",
    category: "reminder",
    outreachType: "cold",
    templateCategory: "aca_framework",
    persona: "parent",
    funnelStage: "awareness",
    variables: ["firstName", "cityName"],
    exampleContext: "Parent who visited website but didn't sign up",
    characterCount: 158,
    isActive: true,
  },
  {
    name: "Cold: Donor Dream Outcome",
    description: "Paint the vision for potential donors",
    messageContent: "{firstName}, your $50 = 10 kids reading at grade level this year. 100% goes to programs, not overhead. Donate: {link} or STOP",
    category: "marketing",
    outreachType: "cold",
    templateCategory: "dream_outcome",
    persona: "donor",
    funnelStage: "awareness",
    variables: ["firstName", "link"],
    exampleContext: "Donor prospect from community event",
    characterCount: 131,
    isActive: true,
  },
  {
    name: "Cold: Volunteer Pain Point",
    description: "Address volunteer prospect's desire to make impact",
    messageContent: "Want to impact kids' futures but short on time? 2hrs/week = life-changing literacy mentoring. Next session Saturday. Join: {link} or STOP",
    category: "marketing",
    outreachType: "cold",
    templateCategory: "pain_points",
    persona: "volunteer",
    funnelStage: "awareness",
    variables: ["link"],
    exampleContext: "Community member who inquired about volunteering",
    characterCount: 152,
    isActive: true,
  },

  // WARM OUTREACH - Social Proof
  {
    name: "Warm: Social Proof Parent",
    description: "Testimonial-driven follow-up",
    messageContent: "{firstName}, \"My son went from struggling to top of his class!\" - Sarah M. Your child could be next. Enroll now: {link} or STOP",
    category: "marketing",
    outreachType: "warm",
    templateCategory: "social_proof",
    persona: "parent",
    funnelStage: "consideration",
    variables: ["firstName", "link"],
    exampleContext: "Parent who attended info session",
    characterCount: 144,
    isActive: true,
  },
  {
    name: "Warm: Urgency Reminder",
    description: "Time-sensitive follow-up with scarcity",
    messageContent: "{firstName}, LAST DAY: Summer program registration closes tonight. Only 2 spots left. Don't miss out: {link} or STOP",
    category: "reminder",
    outreachType: "warm",
    templateCategory: "urgency_scarcity",
    persona: "parent",
    funnelStage: "decision",
    variables: ["firstName", "link"],
    exampleContext: "Parent who showed interest but hasn't registered",
    characterCount: 127,
    isActive: true,
  },
  {
    name: "Warm: Value Stack Donor",
    description: "Multiple benefits for donor consideration",
    messageContent: "Your {amount} donation = 20 kids reading + tax deduction + impact updates + invitation to showcase event. Give today: {link} or STOP",
    category: "marketing",
    outreachType: "warm",
    templateCategory: "value_stacking",
    persona: "donor",
    funnelStage: "consideration",
    variables: ["amount", "link"],
    exampleContext: "Donor who visited donation page but didn't complete",
    characterCount: 147,
    isActive: true,
  },

  // WARM OUTREACH - Clear CTA
  {
    name: "Warm: Simple CTA",
    description: "One clear action for engaged leads",
    messageContent: "{firstName}, ready to start? Click here to book your child's FREE assessment: {link} Takes 2 min. Reply STOP to opt out",
    category: "confirmation",
    outreachType: "warm",
    templateCategory: "clear_cta",
    persona: "parent",
    funnelStage: "decision",
    variables: ["firstName", "link"],
    exampleContext: "Parent ready to enroll after multiple touchpoints",
    characterCount: 137,
    isActive: true,
  },
  {
    name: "Warm: Volunteer Objection Handler",
    description: "Address common hesitation",
    messageContent: "\"I'm not a teacher\" - Neither were 90% of our volunteers! We train you, provide materials, match you with kids. Start: {link} or STOP",
    category: "marketing",
    outreachType: "warm",
    templateCategory: "objection_handling",
    persona: "volunteer",
    funnelStage: "consideration",
    variables: ["link"],
    exampleContext: "Volunteer prospect who expressed interest but hesitated",
    characterCount: 144,
    isActive: true,
  },

  // WARM BROADCAST - Updates & Announcements
  {
    name: "Broadcast: Impact Update",
    description: "Share success metrics with community",
    messageContent: "THIS MONTH: 47 kids improved reading by 2+ grade levels! Thanks to donors & volunteers like you. See their progress: {link} or STOP",
    category: "notification",
    outreachType: "warm_broadcast",
    templateCategory: "social_proof",
    persona: null,
    funnelStage: "retention",
    variables: ["link"],
    exampleContext: "Monthly update to all engaged contacts",
    characterCount: 144,
    isActive: true,
  },
  {
    name: "Broadcast: New Program Launch",
    description: "Announce new offering with urgency",
    messageContent: "NEW: Teen literacy mentoring starting next week! Limited to 15 teens. Priority for current families. Register: {link} or STOP",
    category: "notification",
    outreachType: "warm_broadcast",
    templateCategory: "urgency_scarcity",
    persona: null,
    funnelStage: "awareness",
    variables: ["link"],
    exampleContext: "Announcing new program to existing community",
    characterCount: 137,
    isActive: true,
  },
  {
    name: "Broadcast: Event Invitation",
    description: "Value-packed event invitation",
    messageContent: "{firstName}, you're invited! Literacy Showcase: meet the kids, see their work, celebrate growth. Free food! {date} RSVP: {link} or STOP",
    category: "reminder",
    outreachType: "warm_broadcast",
    templateCategory: "value_stacking",
    persona: null,
    funnelStage: "retention",
    variables: ["firstName", "date", "link"],
    exampleContext: "Annual showcase event for all stakeholders",
    characterCount: 145,
    isActive: true,
  },

  // RE-ENGAGEMENT - Win-back strategies
  {
    name: "Re-engage: We Miss You (Parent)",
    description: "Warm, personal re-engagement",
    messageContent: "{firstName}, we miss {childName}! Kids who return catch up 40% faster. Come back this week? {link} or STOP if not interested",
    category: "marketing",
    outreachType: "re_engagement",
    templateCategory: "social_proof",
    persona: "parent",
    funnelStage: "retention",
    variables: ["firstName", "childName", "link"],
    exampleContext: "Parent whose child stopped attending 2+ months ago",
    characterCount: 139,
    isActive: true,
  },
  {
    name: "Re-engage: Previous Donor",
    description: "Win back lapsed donors with impact",
    messageContent: "{firstName}, your last gift helped 8 kids read! This year: 12 kids still need sponsors. Your {lastAmount}+ changes lives. Give: {link} or STOP",
    category: "marketing",
    outreachType: "re_engagement",
    templateCategory: "dream_outcome",
    persona: "donor",
    funnelStage: "retention",
    variables: ["firstName", "lastAmount", "link"],
    exampleContext: "Donor who gave last year but not this year",
    characterCount: 150,
    isActive: true,
  },
  {
    name: "Re-engage: Inactive Volunteer",
    description: "Bring back former volunteers",
    messageContent: "Hi {firstName}, we could really use your help again! New kids need mentors. Even 1 session/month makes a difference. Return: {link} or STOP",
    category: "marketing",
    outreachType: "re_engagement",
    templateCategory: "pain_points",
    persona: "volunteer",
    funnelStage: "retention",
    variables: ["firstName", "link"],
    exampleContext: "Volunteer who hasn't shown up in 3+ months",
    characterCount: 146,
    isActive: true,
  },

  // DECISION STAGE - High-intent prospects
  {
    name: "Decision: Deadline Reminder",
    description: "Final push for almost-converted leads",
    messageContent: "{firstName}, registration closes TOMORROW. {childName}'s spot is reserved for 24hrs. Confirm now: {link} or we'll offer to waitlist. STOP to opt out",
    category: "reminder",
    outreachType: "warm",
    templateCategory: "urgency_scarcity",
    persona: "parent",
    funnelStage: "decision",
    variables: ["firstName", "childName", "link"],
    exampleContext: "Parent in final stage before enrollment deadline",
    characterCount: 159,
    isActive: true,
  },
  {
    name: "Decision: Donation Match",
    description: "Double-impact urgency for donors",
    messageContent: "BREAKING: {firstName}, every $ you give is DOUBLED today only! Your $100 = $200 of impact. Limited funds. Give now: {link} or STOP",
    category: "marketing",
    outreachType: "warm",
    templateCategory: "urgency_scarcity",
    persona: "donor",
    funnelStage: "decision",
    variables: ["firstName", "link"],
    exampleContext: "During matching gift campaign",
    characterCount: 143,
    isActive: true,
  },

  // RETENTION - Keep engaged stakeholders active
  {
    name: "Retention: Progress Report",
    description: "Show impact to retain donors/parents",
    messageContent: "{firstName}, {childName} jumped 2 reading levels this month! See their latest work: {link} Keep up the great support! Reply STOP to opt out",
    category: "notification",
    outreachType: "warm_broadcast",
    templateCategory: "social_proof",
    persona: "parent",
    funnelStage: "retention",
    variables: ["firstName", "childName", "link"],
    exampleContext: "Monthly progress update for active families",
    characterCount: 154,
    isActive: true,
  },
  {
    name: "Retention: Volunteer Appreciation",
    description: "Recognize and motivate volunteers",
    messageContent: "{firstName}, your 8hrs this month = 4 kids reading better! You're making real impact. See their progress: {link} Thank you! STOP to opt out",
    category: "notification",
    outreachType: "warm_broadcast",
    templateCategory: "dream_outcome",
    persona: "volunteer",
    funnelStage: "retention",
    variables: ["firstName", "link"],
    exampleContext: "Monthly volunteer impact report",
    characterCount: 145,
    isActive: true,
  },

  // REFERRAL REQUESTS
  {
    name: "Referral: Happy Parent",
    description: "Ask satisfied parents for referrals",
    messageContent: "{firstName}, glad {childName} loves the program! Know other parents who'd benefit? Share this link: {link} We have 5 spots open. STOP to opt out",
    category: "marketing",
    outreachType: "warm",
    templateCategory: "clear_cta",
    persona: "parent",
    funnelStage: "retention",
    variables: ["firstName", "childName", "link"],
    exampleContext: "Parent whose child is thriving in program",
    characterCount: 150,
    isActive: true,
  },
  {
    name: "Referral: Donor Advocate",
    description: "Turn donors into advocates",
    messageContent: "Thanks for your gift, {firstName}! Want to double your impact? Share our story with 3 friends: {link} Every share = more kids reading. STOP to opt out",
    category: "marketing",
    outreachType: "warm",
    templateCategory: "value_stacking",
    persona: "donor",
    funnelStage: "retention",
    variables: ["firstName", "link"],
    exampleContext: "Recent donor with high engagement",
    characterCount: 155,
    isActive: true,
  },

  // EVENT-BASED
  {
    name: "Event: Pre-Appointment Reminder",
    description: "Reduce no-shows with friendly reminder",
    messageContent: "{firstName}, reminder: {childName}'s assessment is {dayOfWeek} at {time}. Location: {address} Questions? Reply or call. STOP to cancel",
    category: "reminder",
    outreachType: "warm",
    templateCategory: "clear_cta",
    persona: "parent",
    funnelStage: "decision",
    variables: ["firstName", "childName", "dayOfWeek", "time", "address"],
    exampleContext: "Day before scheduled assessment",
    characterCount: 148,
    isActive: true,
  },
  {
    name: "Event: Post-Event Follow-up",
    description: "Convert event attendees to participants",
    messageContent: "Great meeting you yesterday, {firstName}! Ready to get {childName} started? Enroll here: {link} or reply with questions. STOP to opt out",
    category: "confirmation",
    outreachType: "warm",
    templateCategory: "clear_cta",
    persona: "parent",
    funnelStage: "decision",
    variables: ["firstName", "childName", "link"],
    exampleContext: "Follow-up within 24hrs of open house/event",
    characterCount: 142,
    isActive: true,
  },
];
