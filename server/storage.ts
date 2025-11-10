// Database storage implementation for Replit Auth and CRM
// Reference: blueprint:javascript_log_in_with_replit and blueprint:javascript_database
import { 
  users, leads, interactions, leadMagnets, imageAssets,
  contentItems, contentVisibility,
  abTests, abTestTargets, abTestVariants, abTestAssignments, abTestEvents,
  googleReviews, donations, wishlistItems, donationCampaigns,
  campaignMembers, campaignTestimonials,
  emailTemplates, emailLogs, smsTemplates, smsSends, communicationLogs,
  emailCampaigns, emailSequenceSteps, emailCampaignEnrollments,
  pipelineStages, leadAssignments, tasks, pipelineHistory,
  adminPreferences, auditLogs,
  outreachEmails, icpCriteria,
  chatbotConversations, chatbotIssues,
  backupSnapshots, backupSchedules,
  type User, type UpsertUser, 
  type Lead, type InsertLead,
  type Interaction, type InsertInteraction,
  type LeadMagnet, type InsertLeadMagnet,
  type ImageAsset, type InsertImageAsset,
  type ContentItem, type InsertContentItem, type ContentItemWithResolvedImage,
  type ContentVisibility, type InsertContentVisibility,
  type AbTest, type InsertAbTest,
  type AbTestTarget, type InsertAbTestTarget,
  type AbTestVariant, type InsertAbTestVariant,
  type AbTestAssignment, type InsertAbTestAssignment,
  type AbTestEvent, type InsertAbTestEvent,
  type GoogleReview, type InsertGoogleReview,
  type Donation, type InsertDonation,
  type DonationCampaign, type InsertDonationCampaign,
  type CampaignMember, type InsertCampaignMember,
  type CampaignTestimonial, type InsertCampaignTestimonial,
  type WishlistItem, type InsertWishlistItem,
  type EmailTemplate, type InsertEmailTemplate,
  type EmailLog, type InsertEmailLog,
  type SmsTemplate, type InsertSmsTemplate,
  type SmsSend, type InsertSmsSend,
  type CommunicationLog, type InsertCommunicationLog,
  type EmailCampaign, type InsertEmailCampaign,
  type EmailSequenceStep, type InsertEmailSequenceStep,
  type EmailCampaignEnrollment, type InsertEmailCampaignEnrollment,
  type PipelineStage, type InsertPipelineStage,
  type LeadAssignment, type InsertLeadAssignment,
  type Task, type InsertTask,
  type PipelineHistory, type InsertPipelineHistory,
  type AdminPreferences, type InsertAdminPreferences,
  type AuditLog, type InsertAuditLog,
  type OutreachEmail, type InsertOutreachEmail,
  type IcpCriteria, type InsertIcpCriteria,
  type ChatbotConversation, type InsertChatbotConversation,
  type ChatbotIssue, type InsertChatbotIssue,
  type BackupSnapshot, type InsertBackupSnapshot,
  type BackupSchedule, type InsertBackupSchedule
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { createCacLtgpStorage, type ICacLtgpStorage } from "./storage/cacLtgpStorage";
import { createTechGoesHomeStorage, type ITechGoesHomeStorage } from "./storage/tghStorage";

export interface IStorage extends ICacLtgpStorage, ITechGoesHomeStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByOidcSub(oidcSub: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>, actorId?: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Admin Preferences operations
  getAdminPreferences(userId: string): Promise<AdminPreferences | undefined>;
  upsertAdminPreferences(userId: string, preferences: Partial<InsertAdminPreferences>): Promise<AdminPreferences>;
  updateAdminPreferences(userId: string, updates: Partial<InsertAdminPreferences>): Promise<AdminPreferences | undefined>;
  deleteAdminPreferences(userId: string): Promise<void>;
  
  // Audit Log operations
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { userId?: string; actorId?: string; action?: string; limit?: number }): Promise<AuditLog[]>;
  
  // CRM Lead operations
  createLead(lead: InsertLead): Promise<Lead>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadByEmail(email: string): Promise<Lead | undefined>;
  getAllLeads(): Promise<Lead[]>;
  getLeadsByPersona(persona: string): Promise<Lead[]>;
  getLeadsByFunnelStage(funnelStage: string): Promise<Lead[]>;
  updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<void>;
  
  // Interaction operations
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  getLeadInteractions(leadId: string, limit?: number): Promise<Interaction[]>;
  
  // Lead Magnet operations
  createLeadMagnet(magnet: InsertLeadMagnet): Promise<LeadMagnet>;
  getAllLeadMagnets(): Promise<LeadMagnet[]>;
  getLeadMagnetsByPersona(persona: string): Promise<LeadMagnet[]>;
  updateLeadMagnet(id: string, updates: Partial<InsertLeadMagnet>): Promise<LeadMagnet | undefined>;
  deleteLeadMagnet(id: string): Promise<void>;
  
  // Image Asset operations
  createImageAsset(asset: InsertImageAsset): Promise<ImageAsset>;
  getImageAsset(id: string): Promise<ImageAsset | undefined>;
  getImageAssetByPublicId(publicId: string): Promise<ImageAsset | undefined>;
  getAllImageAssets(): Promise<ImageAsset[]>;
  getImageAssetsByUsage(usage: string): Promise<ImageAsset[]>;
  updateImageAsset(id: string, updates: Partial<InsertImageAsset>): Promise<ImageAsset | undefined>;
  deleteImageAsset(id: string): Promise<void>;
  
  // Content Item operations
  createContentItem(item: InsertContentItem): Promise<ContentItem>;
  getContentItem(id: string): Promise<ContentItem | undefined>;
  getAllContentItems(): Promise<ContentItemWithResolvedImage[]>;
  getContentItemsByType(type: string): Promise<ContentItemWithResolvedImage[]>;
  updateContentItem(id: string, updates: Partial<InsertContentItem>): Promise<ContentItem | undefined>;
  deleteContentItem(id: string): Promise<void>;
  updateContentItemOrder(id: string, newOrder: number): Promise<ContentItem | undefined>;
  getContentItemUsage(id: string): Promise<{
    visibilityAssignments: { persona: string | null; funnelStage: string | null; }[];
    abTests: { testId: string; testName: string; variantName: string; status: string; }[];
  }>;
  
  // Content Visibility operations
  createContentVisibility(visibility: InsertContentVisibility): Promise<ContentVisibility>;
  getAllContentVisibility(): Promise<ContentVisibility[]>;
  getContentVisibility(contentItemId: string, persona?: string | null, funnelStage?: string | null): Promise<ContentVisibility[]>;
  updateContentVisibility(id: string, updates: Partial<InsertContentVisibility>): Promise<ContentVisibility | undefined>;
  deleteContentVisibility(id: string): Promise<void>;
  getVisibleContentItems(type: string, persona?: string | null, funnelStage?: string | null): Promise<ContentItem[]>;
  getAvailablePersonaStageCombinations(): Promise<{ persona: string; funnelStage: string; }[]>;
  
  // A/B Test operations
  createAbTest(test: InsertAbTest): Promise<AbTest>;
  getAbTest(id: string): Promise<AbTest | undefined>;
  getAllAbTests(): Promise<AbTest[]>;
  getActiveAbTests(persona?: string | null, funnelStage?: string | null): Promise<AbTest[]>;
  updateAbTest(id: string, updates: Partial<InsertAbTest>): Promise<AbTest | undefined>;
  deleteAbTest(id: string): Promise<void>;
  createAbTestTargets(testId: string, combinations: string[]): Promise<void>;
  getAbTestTargets(testId: string): Promise<{ persona: string; funnelStage: string; }[]>;
  deleteAbTestTargets(testId: string): Promise<void>;
  
  // A/B Test Variant operations
  createAbTestVariant(variant: InsertAbTestVariant): Promise<AbTestVariant>;
  getAbTestVariants(testId: string): Promise<AbTestVariant[]>;
  updateAbTestVariant(id: string, updates: Partial<InsertAbTestVariant>): Promise<AbTestVariant | undefined>;
  deleteAbTestVariant(id: string): Promise<void>;
  
  // A/B Test Assignment operations
  createAbTestAssignment(assignment: InsertAbTestAssignment): Promise<AbTestAssignment>;
  getAssignment(testId: string, sessionId: string): Promise<AbTestAssignment | undefined>; // Legacy
  getAssignmentPersistent(testId: string, userId?: string, visitorId?: string, sessionId?: string): Promise<AbTestAssignment | undefined>;
  updateAbTestAssignment(id: string, updates: Partial<InsertAbTestAssignment>): Promise<AbTestAssignment | undefined>;
  getSessionAssignments(sessionId: string): Promise<AbTestAssignment[]>;
  
  // A/B Test Event operations
  trackEvent(event: InsertAbTestEvent): Promise<AbTestEvent>;
  getTestEvents(testId: string): Promise<AbTestEvent[]>;
  getVariantEvents(variantId: string): Promise<AbTestEvent[]>;
  getTestAnalytics(testId: string): Promise<{
    variantId: string;
    variantName: string;
    totalViews: number;
    uniqueViews: number;
    totalEvents: number;
    conversionRate: number;
  }[]>;
  
  // Performance Metrics operations
  getPerformanceMetrics(): Promise<{
    personaMetrics: {
      persona: string;
      leadCount: number;
      avgEngagementScore: number;
      conversionRate: number;
    }[];
    funnelStageMetrics: {
      funnelStage: string;
      leadCount: number;
      avgEngagementScore: number;
    }[];
    contentPerformance: {
      type: string;
      totalItems: number;
      activeItems: number;
      avgViews: number;
    }[];
    recommendations: {
      type: string;
      reason: string;
      suggestedTest: string;
      priority: "high" | "medium" | "low";
    }[];
  }>;
  
  // Google Reviews operations
  upsertGoogleReview(review: InsertGoogleReview): Promise<GoogleReview>;
  getGoogleReviews(): Promise<GoogleReview[]>;
  getActiveGoogleReviews(): Promise<GoogleReview[]>;
  updateGoogleReviewVisibility(id: string, isActive: boolean): Promise<GoogleReview | undefined>;
  
  // Donation operations
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonationById(id: string): Promise<Donation | undefined>;
  getDonationByStripeId(stripePaymentIntentId: string): Promise<Donation | undefined>;
  updateDonationByStripeId(stripePaymentIntentId: string, updates: Partial<InsertDonation>): Promise<Donation | undefined>;
  getAllDonations(): Promise<Donation[]>;
  getDonationsByLeadId(leadId: string): Promise<Donation[]>;
  getCampaignDonations(campaignId: string): Promise<Donation[]>;
  
  // Donation Campaign operations
  createDonationCampaign(campaign: InsertDonationCampaign): Promise<DonationCampaign>;
  getDonationCampaign(id: string): Promise<DonationCampaign | undefined>;
  getDonationCampaignBySlug(slug: string): Promise<DonationCampaign | undefined>;
  getAllDonationCampaigns(): Promise<DonationCampaign[]>;
  getActiveDonationCampaigns(): Promise<DonationCampaign[]>;
  updateDonationCampaign(id: string, updates: Partial<InsertDonationCampaign>): Promise<DonationCampaign | undefined>;
  
  // Campaign Member operations
  createCampaignMember(member: InsertCampaignMember): Promise<CampaignMember>;
  getCampaignMember(id: string): Promise<CampaignMember | undefined>;
  getCampaignMembers(campaignId: string): Promise<CampaignMember[]>;
  getUserCampaigns(userId: string): Promise<(CampaignMember & { campaign: DonationCampaign })[]>;
  updateCampaignMember(id: string, updates: Partial<InsertCampaignMember>): Promise<CampaignMember | undefined>;
  deleteCampaignMember(id: string): Promise<void>;
  isCampaignMember(campaignId: string, userId: string): Promise<boolean>;
  
  // Campaign Testimonial operations
  createCampaignTestimonial(testimonial: InsertCampaignTestimonial): Promise<CampaignTestimonial>;
  getCampaignTestimonial(id: string): Promise<CampaignTestimonial | undefined>;
  getCampaignTestimonials(campaignId: string, status?: string): Promise<CampaignTestimonial[]>;
  getMemberTestimonials(memberId: string): Promise<CampaignTestimonial[]>;
  updateCampaignTestimonial(id: string, updates: Partial<InsertCampaignTestimonial>): Promise<CampaignTestimonial | undefined>;
  deleteCampaignTestimonial(id: string): Promise<void>;
  
  // Wishlist Item operations
  createWishlistItem(item: InsertWishlistItem): Promise<WishlistItem>;
  getActiveWishlistItems(): Promise<WishlistItem[]>;
  getAllWishlistItems(): Promise<WishlistItem[]>;
  updateWishlistItem(id: string, updates: Partial<InsertWishlistItem>): Promise<WishlistItem | undefined>;
  deleteWishlistItem(id: string): Promise<boolean>;
  
  // Email Template operations
  getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined>;
  getAllEmailTemplates(): Promise<EmailTemplate[]>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  
  // Hormozi Email Template operations (Alex Hormozi's $100M Leads Framework)
  getHormoziEmailTemplates(filters?: {
    persona?: string;
    funnelStage?: string;
    outreachType?: string;
    templateCategory?: string;
  }): Promise<EmailTemplate[]>;
  getHormoziEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  
  // Email Log operations
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  getEmailLogsByRecipient(recipientEmail: string): Promise<EmailLog[]>;
  getRecentEmailLogs(limit?: number): Promise<EmailLog[]>;
  
  // SMS Template operations
  createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate>;
  getAllSmsTemplates(): Promise<SmsTemplate[]>;
  getSmsTemplateById(id: string): Promise<SmsTemplate | undefined>;
  getSmsTemplatesByPersona(persona: string): Promise<SmsTemplate[]>;
  updateSmsTemplate(id: string, updates: Partial<InsertSmsTemplate>): Promise<SmsTemplate | undefined>;
  deleteSmsTemplate(id: string): Promise<void>;
  
  // Hormozi SMS Template operations
  getHormoziSmsTemplates(filters?: {
    persona?: string;
    funnelStage?: string;
    outreachType?: string;
    templateCategory?: string;
  }): Promise<SmsTemplate[]>;
  getHormoziSmsTemplate(id: string): Promise<SmsTemplate | undefined>;
  
  // SMS Send operations
  createSmsSend(send: InsertSmsSend): Promise<SmsSend>;
  getSmsSendsByLead(leadId: string): Promise<SmsSend[]>;
  getRecentSmsSends(limit?: number): Promise<SmsSend[]>;
  updateSmsSendStatus(id: string, status: string, deliveredAt?: Date): Promise<SmsSend | undefined>;
  
  // Communication Log operations
  createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog>;
  getLeadCommunications(leadId: string): Promise<CommunicationLog[]>;
  
  // Email Campaign operations
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  getAllEmailCampaigns(): Promise<EmailCampaign[]>;
  getEmailCampaign(id: string): Promise<EmailCampaign | undefined>;
  getActiveCampaigns(): Promise<EmailCampaign[]>;
  updateEmailCampaign(id: string, updates: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined>;
  deleteEmailCampaign(id: string): Promise<void>;
  
  // Email Sequence Step operations
  createEmailSequenceStep(step: InsertEmailSequenceStep): Promise<EmailSequenceStep>;
  getCampaignSteps(campaignId: string): Promise<EmailSequenceStep[]>;
  updateEmailSequenceStep(id: string, updates: Partial<InsertEmailSequenceStep>): Promise<EmailSequenceStep | undefined>;
  deleteEmailSequenceStep(id: string): Promise<void>;
  
  // Email Campaign Enrollment operations
  createEnrollment(enrollment: InsertEmailCampaignEnrollment): Promise<EmailCampaignEnrollment>;
  getLeadEnrollments(leadId: string): Promise<EmailCampaignEnrollment[]>;
  getCampaignEnrollments(campaignId: string): Promise<EmailCampaignEnrollment[]>;
  getEnrollment(campaignId: string, leadId: string): Promise<EmailCampaignEnrollment | undefined>;
  updateEnrollment(id: string, updates: Partial<InsertEmailCampaignEnrollment>): Promise<EmailCampaignEnrollment | undefined>;
  
  // Pipeline Stage operations
  getPipelineStages(): Promise<PipelineStage[]>;
  getPipelineStage(id: string): Promise<PipelineStage | undefined>;
  
  // Lead Assignment operations
  createLeadAssignment(assignment: InsertLeadAssignment): Promise<LeadAssignment>;
  getLeadAssignment(leadId: string): Promise<LeadAssignment | undefined>;
  getLeadAssignments(filters: { assignedTo?: string; leadId?: string }): Promise<LeadAssignment[]>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTasks(filters: { leadId?: string; assignedTo?: string; status?: string }): Promise<Task[]>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
  
  // Pipeline History operations
  createPipelineHistory(history: InsertPipelineHistory): Promise<PipelineHistory>;
  getPipelineHistory(leadId: string): Promise<PipelineHistory[]>;
  
  // Outreach Email operations
  createOutreachEmail(email: InsertOutreachEmail): Promise<OutreachEmail>;
  getOutreachEmail(id: string): Promise<OutreachEmail | undefined>;
  getLeadOutreachEmails(leadId: string): Promise<OutreachEmail[]>;
  getAllOutreachEmails(filters?: { status?: string; limit?: number }): Promise<OutreachEmail[]>;
  updateOutreachEmail(id: string, updates: Partial<InsertOutreachEmail>): Promise<OutreachEmail | undefined>;
  deleteOutreachEmail(id: string): Promise<void>;
  markOutreachEmailOpened(id: string): Promise<OutreachEmail | undefined>;
  markOutreachEmailClicked(id: string): Promise<OutreachEmail | undefined>;
  markOutreachEmailReplied(id: string): Promise<OutreachEmail | undefined>;
  
  // ICP Criteria operations
  createIcpCriteria(criteria: InsertIcpCriteria): Promise<IcpCriteria>;
  getIcpCriteria(id: string): Promise<IcpCriteria | undefined>;
  getAllIcpCriteria(): Promise<IcpCriteria[]>;
  getActiveIcpCriteria(): Promise<IcpCriteria[]>;
  getDefaultIcpCriteria(): Promise<IcpCriteria | undefined>;
  updateIcpCriteria(id: string, updates: Partial<InsertIcpCriteria>): Promise<IcpCriteria | undefined>;
  deleteIcpCriteria(id: string): Promise<void>;
  
  // Lead Sourcing operations
  getLeadsForQualification(limit?: number): Promise<Lead[]>; // Get leads with qualificationStatus='pending'
  getQualifiedLeads(minScore?: number): Promise<Lead[]>; // Get qualified leads above score threshold
  getLeadsForOutreach(limit?: number): Promise<Lead[]>; // Get qualified leads with outreachStatus='pending' or 'draft_ready'
  bulkCreateLeads(leads: InsertLead[]): Promise<Lead[]>; // For CSV import
  
  // Helper method used by routes
  getLeadById(id: string): Promise<Lead | undefined>;
  
  // Chatbot Conversation operations
  createChatbotConversation(conversation: InsertChatbotConversation): Promise<ChatbotConversation>;
  getChatbotConversationsBySession(sessionId: string, limit?: number): Promise<ChatbotConversation[]>;
  deleteChatbotSession(sessionId: string): Promise<void>;
  
  // Chatbot Issue operations
  createChatbotIssue(issue: InsertChatbotIssue): Promise<ChatbotIssue>;
  getChatbotIssues(filters?: { status?: string; severity?: string; reportedBy?: string; limit?: number }): Promise<ChatbotIssue[]>;
  updateChatbotIssue(id: string, updates: Partial<InsertChatbotIssue>): Promise<ChatbotIssue | undefined>;
  
  // Analytics operations for chatbot
  getPlatformStats(): Promise<{
    generatedAt: string;
    totals: {
      leads: number;
      users: number;
      donations: number;
      activeContent: number;
    };
    recentActivity: {
      leadsThisWeek: number;
      donationsThisWeek: number;
      tasksThisWeek: number;
    };
  }>;
  
  getLeadAnalytics(filters?: {
    persona?: string;
    funnelStage?: string;
    pipelineStage?: string;
    daysBack?: number;
  }): Promise<{
    generatedAt: string;
    appliedFilters: {
      persona: string | null;
      funnelStage: string | null;
      pipelineStage: string | null;
      daysBack: number;
    };
    totals: {
      total: number;
      byPersona: { persona: string; count: number }[];
      byFunnelStage: { stage: string; count: number }[];
      byPipelineStage: { stage: string; count: number }[];
    };
    recentLeads: { count: number; period: 'last7Days' | 'last30Days' | 'custom' };
    avgEngagementScore: number; // Rounded to 1 decimal place
  }>;
  
  getContentSummary(filters?: { type?: string }): Promise<{
    generatedAt: string;
    appliedFilters: {
      type: string | null;
    };
    totals: {
      total: number;
      active: number;
      inactive: number;
      byType: { type: string; count: number; active: number }[];
    };
    abTests: {
      total: number;
      active: number;
      paused: number;
      completed: number;
    };
  }>;
  
  getDonationStats(filters?: { daysBack?: number }): Promise<{
    generatedAt: string;
    appliedFilters: {
      daysBack: number;
    };
    totals: {
      totalDonations: number;
      totalAmount: number; // In cents
      avgDonation: number; // In cents, rounded to nearest cent
      byType: { type: string; count: number; amount: number }[];
      byStatus: { status: string; count: number }[];
    };
    recentDonations: { count: number; amount: number; period: 'last7Days' | 'last30Days' | 'custom' };
    campaigns: {
      total: number;
      active: number;
    };
  }>;
  
  // Database Backup operations
  createTableBackup(tableName: string, userId: string, backupName?: string, description?: string): Promise<{
    backupTableName: string;
    rowCount: number;
    snapshotId: string;
  }>;
  getAllBackupSnapshots(): Promise<any[]>;
  getBackupSnapshotsByTable(tableName: string): Promise<any[]>;
  getBackupSnapshot(id: string): Promise<any | undefined>;
  restoreFromBackup(backupId: string, mode: 'replace' | 'merge'): Promise<{
    tableName: string;
    rowsRestored: number;
  }>;
  deleteBackup(backupId: string): Promise<void>;
  getAvailableTables(): Promise<string[]>;
  
  // Backup Schedule operations
  createBackupSchedule(schedule: InsertBackupSchedule): Promise<BackupSchedule>;
  getAllBackupSchedules(): Promise<BackupSchedule[]>;
  getBackupSchedule(id: string): Promise<BackupSchedule | undefined>;
  updateBackupSchedule(id: string, updates: Partial<InsertBackupSchedule>): Promise<BackupSchedule | undefined>;
  deleteBackupSchedule(id: string): Promise<void>;
  getDueBackupSchedules(now: Date, lookaheadMinutes?: number): Promise<BackupSchedule[]>;
  markScheduleRunning(id: string, lockedUntil: Date): Promise<boolean>;
  releaseStuckSchedule(id: string): Promise<void>;
  completeSchedule(id: string, runInfo: {
    success: boolean;
    error?: string;
    nextRun: Date;
  }): Promise<void>;
  cleanupOldBackupsBySchedule(tableName: string, retentionCount: number): Promise<number>;
  getDatabaseStorageMetrics(): Promise<{
    currentUsageBytes: number;
    projectedBackupBytes: number;
    totalProjectedBytes: number;
    limitBytes: number;
    currentUsagePercent: number;
    projectedUsagePercent: number;
    tableBreakdown: Array<{
      tableName: string;
      sizeBytes: number;
      scheduledBackupCount: number;
      estimatedBackupBytes: number;
    }>;
  }>;
  
  // CAC:LTGP Tracking operations (Alex Hormozi's $100M Leads Framework)
  
  // Acquisition Channels
  createAcquisitionChannel(channel: InsertAcquisitionChannel): Promise<AcquisitionChannel>;
  getAcquisitionChannel(id: string): Promise<AcquisitionChannel | undefined>;
  getAllAcquisitionChannels(): Promise<AcquisitionChannel[]>;
  getActiveAcquisitionChannels(): Promise<AcquisitionChannel[]>;
  updateAcquisitionChannel(id: string, updates: Partial<InsertAcquisitionChannel>): Promise<AcquisitionChannel | undefined>;
  deleteAcquisitionChannel(id: string): Promise<void>;
  
  // Marketing Campaigns
  createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign>;
  getMarketingCampaign(id: string): Promise<MarketingCampaign | undefined>;
  getAllMarketingCampaigns(): Promise<MarketingCampaign[]>;
  getActiveMarketingCampaigns(): Promise<MarketingCampaign[]>;
  getCampaignsByChannel(channelId: string): Promise<MarketingCampaign[]>;
  updateMarketingCampaign(id: string, updates: Partial<InsertMarketingCampaign>): Promise<MarketingCampaign | undefined>;
  deleteMarketingCampaign(id: string): Promise<void>;
  
  // Channel Spend Ledger
  createSpendEntry(entry: InsertChannelSpendLedger): Promise<ChannelSpendLedger>;
  getSpendEntriesByChannel(channelId: string): Promise<ChannelSpendLedger[]>;
  getSpendEntriesByCampaign(campaignId: string): Promise<ChannelSpendLedger[]>;
  getSpendEntriesByPeriod(periodKey: string): Promise<ChannelSpendLedger[]>;
  updateSpendEntry(id: string, updates: Partial<InsertChannelSpendLedger>): Promise<ChannelSpendLedger | undefined>;
  deleteSpendEntry(id: string): Promise<void>;
  
  // Lead Attribution
  createLeadAttribution(attribution: InsertLeadAttribution): Promise<LeadAttribution>;
  getLeadAttribution(leadId: string): Promise<LeadAttribution | undefined>;
  getAttributionsByChannel(channelId: string): Promise<LeadAttribution[]>;
  getAttributionsByCampaign(campaignId: string): Promise<LeadAttribution[]>;
  updateLeadAttribution(leadId: string, updates: Partial<InsertLeadAttribution>): Promise<LeadAttribution | undefined>;
  
  // Donor Lifecycle Stages
  createDonorLifecycleStage(stage: InsertDonorLifecycleStage): Promise<DonorLifecycleStage>;
  getDonorLifecycleStage(leadId: string): Promise<DonorLifecycleStage | undefined>;
  getAllDonorLifecycleStages(): Promise<DonorLifecycleStage[]>;
  getDonorsByStage(stage: string): Promise<DonorLifecycleStage[]>;
  updateDonorLifecycleStage(leadId: string, updates: Partial<InsertDonorLifecycleStage>): Promise<DonorLifecycleStage | undefined>;
  
  // Donor Economics
  createDonorEconomics(economics: InsertDonorEconomics): Promise<DonorEconomics>;
  getDonorEconomics(leadId: string): Promise<DonorEconomics | undefined>;
  updateDonorEconomics(leadId: string, updates: Partial<InsertDonorEconomics>): Promise<DonorEconomics | undefined>;
  calculateDonorLTGP(leadId: string): Promise<number>;
  
  // Economics Settings
  getEconomicsSettings(): Promise<EconomicsSettings | undefined>;
  updateEconomicsSettings(updates: Partial<InsertEconomicsSettings>): Promise<EconomicsSettings>;
}

export class DatabaseStorage implements IStorage {
  // CAC/LTGP storage module composition
  private cacLtgpStorage: ICacLtgpStorage;
  
  // Tech Goes Home storage module composition
  private tghStorage: ITechGoesHomeStorage;
  
  // CAC/LTGP method delegation (initialized in constructor)
  createAcquisitionChannel!: ICacLtgpStorage['createAcquisitionChannel'];
  getAcquisitionChannel!: ICacLtgpStorage['getAcquisitionChannel'];
  getAllAcquisitionChannels!: ICacLtgpStorage['getAllAcquisitionChannels'];
  getActiveAcquisitionChannels!: ICacLtgpStorage['getActiveAcquisitionChannels'];
  updateAcquisitionChannel!: ICacLtgpStorage['updateAcquisitionChannel'];
  deleteAcquisitionChannel!: ICacLtgpStorage['deleteAcquisitionChannel'];
  createMarketingCampaign!: ICacLtgpStorage['createMarketingCampaign'];
  getMarketingCampaign!: ICacLtgpStorage['getMarketingCampaign'];
  getAllMarketingCampaigns!: ICacLtgpStorage['getAllMarketingCampaigns'];
  getActiveMarketingCampaigns!: ICacLtgpStorage['getActiveMarketingCampaigns'];
  getCampaignsByChannel!: ICacLtgpStorage['getCampaignsByChannel'];
  updateMarketingCampaign!: ICacLtgpStorage['updateMarketingCampaign'];
  deleteMarketingCampaign!: ICacLtgpStorage['deleteMarketingCampaign'];
  createSpendEntry!: ICacLtgpStorage['createSpendEntry'];
  getSpendEntriesByChannel!: ICacLtgpStorage['getSpendEntriesByChannel'];
  getSpendEntriesByCampaign!: ICacLtgpStorage['getSpendEntriesByCampaign'];
  getSpendEntriesByPeriod!: ICacLtgpStorage['getSpendEntriesByPeriod'];
  updateSpendEntry!: ICacLtgpStorage['updateSpendEntry'];
  deleteSpendEntry!: ICacLtgpStorage['deleteSpendEntry'];
  createLeadAttribution!: ICacLtgpStorage['createLeadAttribution'];
  getLeadAttribution!: ICacLtgpStorage['getLeadAttribution'];
  getAttributionsByChannel!: ICacLtgpStorage['getAttributionsByChannel'];
  getAttributionsByCampaign!: ICacLtgpStorage['getAttributionsByCampaign'];
  updateLeadAttribution!: ICacLtgpStorage['updateLeadAttribution'];
  createDonorLifecycleStage!: ICacLtgpStorage['createDonorLifecycleStage'];
  getDonorLifecycleStage!: ICacLtgpStorage['getDonorLifecycleStage'];
  getAllDonorLifecycleStages!: ICacLtgpStorage['getAllDonorLifecycleStages'];
  getDonorsByStage!: ICacLtgpStorage['getDonorsByStage'];
  updateDonorLifecycleStage!: ICacLtgpStorage['updateDonorLifecycleStage'];
  createDonorEconomics!: ICacLtgpStorage['createDonorEconomics'];
  getDonorEconomics!: ICacLtgpStorage['getDonorEconomics'];
  updateDonorEconomics!: ICacLtgpStorage['updateDonorEconomics'];
  getEconomicsSettings!: ICacLtgpStorage['getEconomicsSettings'];
  updateEconomicsSettings!: ICacLtgpStorage['updateEconomicsSettings'];
  
  // Tech Goes Home method delegation (initialized in constructor)
  createTechGoesHomeEnrollment!: ITechGoesHomeStorage['createTechGoesHomeEnrollment'];
  getTechGoesHomeEnrollment!: ITechGoesHomeStorage['getTechGoesHomeEnrollment'];
  getTechGoesHomeEnrollmentByUserId!: ITechGoesHomeStorage['getTechGoesHomeEnrollmentByUserId'];
  getAllTechGoesHomeEnrollments!: ITechGoesHomeStorage['getAllTechGoesHomeEnrollments'];
  getActiveTechGoesHomeEnrollments!: ITechGoesHomeStorage['getActiveTechGoesHomeEnrollments'];
  updateTechGoesHomeEnrollment!: ITechGoesHomeStorage['updateTechGoesHomeEnrollment'];
  createTechGoesHomeAttendance!: ITechGoesHomeStorage['createTechGoesHomeAttendance'];
  getTechGoesHomeAttendance!: ITechGoesHomeStorage['getTechGoesHomeAttendance'];
  updateTechGoesHomeAttendance!: ITechGoesHomeStorage['updateTechGoesHomeAttendance'];
  deleteTechGoesHomeAttendance!: ITechGoesHomeStorage['deleteTechGoesHomeAttendance'];
  getStudentProgress!: ITechGoesHomeStorage['getStudentProgress'];
  
  constructor() {
    // Initialize CAC/LTGP storage module
    this.cacLtgpStorage = createCacLtgpStorage();
    
    // Initialize Tech Goes Home storage module
    this.tghStorage = createTechGoesHomeStorage();
    
    // Bind all CAC/LTGP methods
    this.createAcquisitionChannel = this.cacLtgpStorage.createAcquisitionChannel.bind(this.cacLtgpStorage);
    this.getAcquisitionChannel = this.cacLtgpStorage.getAcquisitionChannel.bind(this.cacLtgpStorage);
    this.getAllAcquisitionChannels = this.cacLtgpStorage.getAllAcquisitionChannels.bind(this.cacLtgpStorage);
    this.getActiveAcquisitionChannels = this.cacLtgpStorage.getActiveAcquisitionChannels.bind(this.cacLtgpStorage);
    this.updateAcquisitionChannel = this.cacLtgpStorage.updateAcquisitionChannel.bind(this.cacLtgpStorage);
    this.deleteAcquisitionChannel = this.cacLtgpStorage.deleteAcquisitionChannel.bind(this.cacLtgpStorage);
    this.createMarketingCampaign = this.cacLtgpStorage.createMarketingCampaign.bind(this.cacLtgpStorage);
    this.getMarketingCampaign = this.cacLtgpStorage.getMarketingCampaign.bind(this.cacLtgpStorage);
    this.getAllMarketingCampaigns = this.cacLtgpStorage.getAllMarketingCampaigns.bind(this.cacLtgpStorage);
    this.getActiveMarketingCampaigns = this.cacLtgpStorage.getActiveMarketingCampaigns.bind(this.cacLtgpStorage);
    this.getCampaignsByChannel = this.cacLtgpStorage.getCampaignsByChannel.bind(this.cacLtgpStorage);
    this.updateMarketingCampaign = this.cacLtgpStorage.updateMarketingCampaign.bind(this.cacLtgpStorage);
    this.deleteMarketingCampaign = this.cacLtgpStorage.deleteMarketingCampaign.bind(this.cacLtgpStorage);
    this.createSpendEntry = this.cacLtgpStorage.createSpendEntry.bind(this.cacLtgpStorage);
    this.getSpendEntriesByChannel = this.cacLtgpStorage.getSpendEntriesByChannel.bind(this.cacLtgpStorage);
    this.getSpendEntriesByCampaign = this.cacLtgpStorage.getSpendEntriesByCampaign.bind(this.cacLtgpStorage);
    this.getSpendEntriesByPeriod = this.cacLtgpStorage.getSpendEntriesByPeriod.bind(this.cacLtgpStorage);
    this.updateSpendEntry = this.cacLtgpStorage.updateSpendEntry.bind(this.cacLtgpStorage);
    this.deleteSpendEntry = this.cacLtgpStorage.deleteSpendEntry.bind(this.cacLtgpStorage);
    this.createLeadAttribution = this.cacLtgpStorage.createLeadAttribution.bind(this.cacLtgpStorage);
    this.getLeadAttribution = this.cacLtgpStorage.getLeadAttribution.bind(this.cacLtgpStorage);
    this.getAttributionsByChannel = this.cacLtgpStorage.getAttributionsByChannel.bind(this.cacLtgpStorage);
    this.getAttributionsByCampaign = this.cacLtgpStorage.getAttributionsByCampaign.bind(this.cacLtgpStorage);
    this.updateLeadAttribution = this.cacLtgpStorage.updateLeadAttribution.bind(this.cacLtgpStorage);
    this.createDonorLifecycleStage = this.cacLtgpStorage.createDonorLifecycleStage.bind(this.cacLtgpStorage);
    this.getDonorLifecycleStage = this.cacLtgpStorage.getDonorLifecycleStage.bind(this.cacLtgpStorage);
    this.getAllDonorLifecycleStages = this.cacLtgpStorage.getAllDonorLifecycleStages.bind(this.cacLtgpStorage);
    this.getDonorsByStage = this.cacLtgpStorage.getDonorsByStage.bind(this.cacLtgpStorage);
    this.updateDonorLifecycleStage = this.cacLtgpStorage.updateDonorLifecycleStage.bind(this.cacLtgpStorage);
    this.createDonorEconomics = this.cacLtgpStorage.createDonorEconomics.bind(this.cacLtgpStorage);
    this.getDonorEconomics = this.cacLtgpStorage.getDonorEconomics.bind(this.cacLtgpStorage);
    this.updateDonorEconomics = this.cacLtgpStorage.updateDonorEconomics.bind(this.cacLtgpStorage);
    this.getEconomicsSettings = this.cacLtgpStorage.getEconomicsSettings.bind(this.cacLtgpStorage);
    this.updateEconomicsSettings = this.cacLtgpStorage.updateEconomicsSettings.bind(this.cacLtgpStorage);
    
    // Bind all Tech Goes Home methods
    this.createTechGoesHomeEnrollment = this.tghStorage.createTechGoesHomeEnrollment.bind(this.tghStorage);
    this.getTechGoesHomeEnrollment = this.tghStorage.getTechGoesHomeEnrollment.bind(this.tghStorage);
    this.getTechGoesHomeEnrollmentByUserId = this.tghStorage.getTechGoesHomeEnrollmentByUserId.bind(this.tghStorage);
    this.getAllTechGoesHomeEnrollments = this.tghStorage.getAllTechGoesHomeEnrollments.bind(this.tghStorage);
    this.getActiveTechGoesHomeEnrollments = this.tghStorage.getActiveTechGoesHomeEnrollments.bind(this.tghStorage);
    this.updateTechGoesHomeEnrollment = this.tghStorage.updateTechGoesHomeEnrollment.bind(this.tghStorage);
    this.createTechGoesHomeAttendance = this.tghStorage.createTechGoesHomeAttendance.bind(this.tghStorage);
    this.getTechGoesHomeAttendance = this.tghStorage.getTechGoesHomeAttendance.bind(this.tghStorage);
    this.updateTechGoesHomeAttendance = this.tghStorage.updateTechGoesHomeAttendance.bind(this.tghStorage);
    this.deleteTechGoesHomeAttendance = this.tghStorage.deleteTechGoesHomeAttendance.bind(this.tghStorage);
    this.getStudentProgress = this.tghStorage.getStudentProgress.bind(this.tghStorage);
  }
  
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByOidcSub(oidcSub: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.oidcSub, oidcSub));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Try to find existing user by oidcSub first, then by email
    let existingUser: User | undefined;
    
    if (userData.oidcSub) {
      [existingUser] = await db.select().from(users).where(eq(users.oidcSub, userData.oidcSub));
    }
    
    if (!existingUser && userData.email) {
      [existingUser] = await db.select().from(users).where(eq(users.email, userData.email));
    }

    if (existingUser) {
      // Update existing user - ID never changes, preserving FK relationships
      const updateData: any = {
        oidcSub: userData.oidcSub,
        email: userData.email,
        updatedAt: new Date(),
      };
      
      // DATA INTEGRITY: Only update firstName/lastName if:
      // 1. They're explicitly being set (not undefined/null)
      // 2. AND the existing user doesn't have them set (empty fields only)
      // This prevents OIDC login from overwriting user-set names
      if (userData.firstName && !existingUser.firstName) {
        updateData.firstName = userData.firstName;
      }
      if (userData.lastName && !existingUser.lastName) {
        updateData.lastName = userData.lastName;
      }
      
      // Always update profile image if provided
      if (userData.profileImageUrl !== undefined) {
        updateData.profileImageUrl = userData.profileImageUrl;
      }
      
      // Only update role if explicitly provided (used by super_admin via API, not from OIDC)
      if (userData.role !== undefined) {
        updateData.role = userData.role;
      }
      // SECURITY: Never accept role from untrusted sources - preserve existing user's role
      
      const [user] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, existingUser.id))
        .returning();
      return user;
    } else {
      // Create new user with default 'client' role
      // SECURITY: Only super_admins can create users with elevated roles via API
      const insertData: any = {
        ...userData,
        role: userData.role || "client",  // Default to safe 'client' role
      };
      
      try {
        const [user] = await db
          .insert(users)
          .values(insertData)
          .returning();
        return user;
      } catch (error: any) {
        // Handle race condition: if unique constraint fails, retry by finding and updating existing user
        if (error?.code === '23505' || error?.message?.includes('duplicate key') || error?.message?.includes('unique constraint')) {
          console.log('[upsertUser] Caught unique constraint violation, retrying with update...', error.message);
          
          // Retry finding the user by email or oidcSub
          if (userData.email) {
            [existingUser] = await db.select().from(users).where(eq(users.email, userData.email));
          }
          if (!existingUser && userData.oidcSub) {
            [existingUser] = await db.select().from(users).where(eq(users.oidcSub, userData.oidcSub));
          }
          
          if (existingUser) {
            // Update the existing user
            const updateData: any = {
              oidcSub: userData.oidcSub,
              email: userData.email,
              updatedAt: new Date(),
            };
            
            if (userData.firstName && !existingUser.firstName) {
              updateData.firstName = userData.firstName;
            }
            if (userData.lastName && !existingUser.lastName) {
              updateData.lastName = userData.lastName;
            }
            if (userData.profileImageUrl !== undefined) {
              updateData.profileImageUrl = userData.profileImageUrl;
            }
            if (userData.role !== undefined) {
              updateData.role = userData.role;
            }
            
            const [user] = await db
              .update(users)
              .set(updateData)
              .where(eq(users.id, existingUser.id))
              .returning();
            return user;
          }
        }
        
        // If it's not a unique constraint error or retry failed, rethrow
        throw error;
      }
    }
  }

  async updateUser(id: string, updates: Partial<UpsertUser>, actorId?: string): Promise<User | undefined> {
    // Get current user for audit logging
    const currentUser = await this.getUser(id);
    if (!currentUser) {
      return undefined;
    }

    // Build update data with allowed fields only
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Allow these fields to be updated via profile updates
    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.profileImageUrl !== undefined) updateData.profileImageUrl = updates.profileImageUrl;
    if (updates.persona !== undefined) updateData.persona = updates.persona;
    if (updates.passions !== undefined) updateData.passions = updates.passions;
    
    // Sensitive fields - only allow if explicitly set (admin operations)
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.oidcSub !== undefined) updateData.oidcSub = updates.oidcSub;
    
    // System-managed fields (payment integration)
    if (updates.stripeCustomerId !== undefined) updateData.stripeCustomerId = updates.stripeCustomerId;

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    // Create audit log for profile updates
    if (user && actorId) {
      const changedFields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== currentUser[key as keyof typeof currentUser]);
      if (changedFields.length > 0) {
        await this.createAuditLog({
          userId: id,
          actorId: actorId,
          action: 'profile_updated',
          metadata: {
            changedFields,
            previousValues: Object.fromEntries(changedFields.map(key => [key, currentUser[key as keyof typeof currentUser]])),
            newValues: Object.fromEntries(changedFields.map(key => [key, updates[key as keyof typeof updates]])),
          },
        });
      }
    }

    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Admin Preferences operations
  async getAdminPreferences(userId: string): Promise<AdminPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(adminPreferences)
      .where(eq(adminPreferences.userId, userId));
    return preferences;
  }

  async upsertAdminPreferences(userId: string, preferencesData: Partial<InsertAdminPreferences>): Promise<AdminPreferences> {
    const existing = await this.getAdminPreferences(userId);
    
    if (existing) {
      // Update existing preferences
      const [updated] = await db
        .update(adminPreferences)
        .set({ ...preferencesData, updatedAt: new Date() })
        .where(eq(adminPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new preferences with defaults
      const [created] = await db
        .insert(adminPreferences)
        .values({ userId, ...preferencesData })
        .returning();
      return created;
    }
  }

  async updateAdminPreferences(userId: string, updates: Partial<InsertAdminPreferences>): Promise<AdminPreferences | undefined> {
    const [preferences] = await db
      .update(adminPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminPreferences.userId, userId))
      .returning();
    return preferences;
  }

  async deleteAdminPreferences(userId: string): Promise<void> {
    await db.delete(adminPreferences).where(eq(adminPreferences.userId, userId));
  }

  // Audit Log operations
  async createAuditLog(auditLogData: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(auditLogData).returning();
    return auditLog;
  }

  async getAuditLogs(filters?: { userId?: string; actorId?: string; action?: string; limit?: number }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.actorId) {
      conditions.push(eq(auditLogs.actorId, filters.actorId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(auditLogs.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return await query;
  }

  // Lead operations
  async createLead(leadData: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(leadData).returning();
    return lead;
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeadByEmail(email: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.email, email));
    return lead;
  }

  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLeadsByPersona(persona: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.persona, persona)).orderBy(desc(leads.createdAt));
  }

  async getLeadsByFunnelStage(funnelStage: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.funnelStage, funnelStage)).orderBy(desc(leads.createdAt));
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  // Interaction operations
  async createInteraction(interactionData: InsertInteraction): Promise<Interaction> {
    const [interaction] = await db.insert(interactions).values(interactionData).returning();
    
    // Update lead's last interaction date and engagement score
    await db
      .update(leads)
      .set({ 
        lastInteractionDate: new Date(),
        engagementScore: sql`${leads.engagementScore} + 10`
      })
      .where(eq(leads.id, interactionData.leadId));
    
    return interaction;
  }

  async getLeadInteractions(leadId: string, limit?: number): Promise<Interaction[]> {
    const query = db
      .select()
      .from(interactions)
      .where(eq(interactions.leadId, leadId))
      .orderBy(desc(interactions.createdAt));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  // Lead Magnet operations
  async createLeadMagnet(magnetData: InsertLeadMagnet): Promise<LeadMagnet> {
    const [magnet] = await db.insert(leadMagnets).values(magnetData).returning();
    return magnet;
  }

  async getAllLeadMagnets(): Promise<LeadMagnet[]> {
    return await db.select().from(leadMagnets).orderBy(desc(leadMagnets.createdAt));
  }

  async getLeadMagnetsByPersona(persona: string): Promise<LeadMagnet[]> {
    return await db
      .select()
      .from(leadMagnets)
      .where(and(eq(leadMagnets.persona, persona), eq(leadMagnets.isActive, true)))
      .orderBy(desc(leadMagnets.createdAt));
  }

  async updateLeadMagnet(id: string, updates: Partial<InsertLeadMagnet>): Promise<LeadMagnet | undefined> {
    const [magnet] = await db
      .update(leadMagnets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leadMagnets.id, id))
      .returning();
    return magnet;
  }

  async deleteLeadMagnet(id: string): Promise<void> {
    await db.delete(leadMagnets).where(eq(leadMagnets.id, id));
  }

  // Image Asset operations
  async createImageAsset(assetData: InsertImageAsset): Promise<ImageAsset> {
    const [asset] = await db.insert(imageAssets).values(assetData).returning();
    return asset;
  }

  async getImageAsset(id: string): Promise<ImageAsset | undefined> {
    const [asset] = await db.select().from(imageAssets).where(eq(imageAssets.id, id));
    return asset;
  }

  async getImageAssetByPublicId(publicId: string): Promise<ImageAsset | undefined> {
    const [asset] = await db.select().from(imageAssets).where(eq(imageAssets.cloudinaryPublicId, publicId));
    return asset;
  }

  async getAllImageAssets(): Promise<ImageAsset[]> {
    return await db.select().from(imageAssets).orderBy(desc(imageAssets.createdAt));
  }

  async getImageAssetsByUsage(usage: string): Promise<ImageAsset[]> {
    return await db
      .select()
      .from(imageAssets)
      .where(and(eq(imageAssets.usage, usage), eq(imageAssets.isActive, true)))
      .orderBy(desc(imageAssets.createdAt));
  }

  async updateImageAsset(id: string, updates: Partial<InsertImageAsset>): Promise<ImageAsset | undefined> {
    const [asset] = await db
      .update(imageAssets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(imageAssets.id, id))
      .returning();
    return asset;
  }

  async deleteImageAsset(id: string): Promise<void> {
    await db.delete(imageAssets).where(eq(imageAssets.id, id));
  }

  // Content Item operations
  async createContentItem(itemData: InsertContentItem): Promise<ContentItem> {
    const [item] = await db.insert(contentItems).values(itemData).returning();
    return item;
  }

  async getContentItem(id: string): Promise<ContentItem | undefined> {
    const [item] = await db.select().from(contentItems).where(eq(contentItems.id, id));
    return item;
  }

  async getAllContentItems(): Promise<ContentItemWithResolvedImage[]> {
    const results = await db
      .select({
        id: contentItems.id,
        type: contentItems.type,
        title: contentItems.title,
        description: contentItems.description,
        imageName: contentItems.imageName,
        order: contentItems.order,
        isActive: contentItems.isActive,
        metadata: contentItems.metadata,
        createdAt: contentItems.createdAt,
        updatedAt: contentItems.updatedAt,
        resolvedImageUrl: imageAssets.cloudinarySecureUrl,
      })
      .from(contentItems)
      .leftJoin(imageAssets, eq(contentItems.imageName, imageAssets.name))
      .orderBy(contentItems.order);
    
    return results as unknown as ContentItemWithResolvedImage[];
  }

  async getContentItemsByType(type: string): Promise<ContentItemWithResolvedImage[]> {
    const results = await db
      .select({
        id: contentItems.id,
        type: contentItems.type,
        title: contentItems.title,
        description: contentItems.description,
        imageName: contentItems.imageName,
        order: contentItems.order,
        isActive: contentItems.isActive,
        metadata: contentItems.metadata,
        createdAt: contentItems.createdAt,
        updatedAt: contentItems.updatedAt,
        resolvedImageUrl: imageAssets.cloudinarySecureUrl,
      })
      .from(contentItems)
      .leftJoin(imageAssets, eq(contentItems.imageName, imageAssets.name))
      .where(eq(contentItems.type, type))
      .orderBy(contentItems.order);
    
    return results as unknown as ContentItemWithResolvedImage[];
  }

  async updateContentItem(id: string, updates: Partial<InsertContentItem>): Promise<ContentItem | undefined> {
    const [item] = await db
      .update(contentItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentItems.id, id))
      .returning();
    return item;
  }

  async deleteContentItem(id: string): Promise<void> {
    await db.delete(contentItems).where(eq(contentItems.id, id));
  }

  async updateContentItemOrder(id: string, newOrder: number): Promise<ContentItem | undefined> {
    const [item] = await db
      .update(contentItems)
      .set({ order: newOrder, updatedAt: new Date() })
      .where(eq(contentItems.id, id))
      .returning();
    return item;
  }

  async getContentItemUsage(id: string): Promise<{
    visibilityAssignments: { persona: string | null; funnelStage: string | null; }[];
    abTests: { testId: string; testName: string; variantName: string; status: string; }[];
  }> {
    // Get visibility assignments
    const visibilityAssignments = await db
      .select({
        persona: contentVisibility.persona,
        funnelStage: contentVisibility.funnelStage,
      })
      .from(contentVisibility)
      .where(eq(contentVisibility.contentItemId, id));

    // Get A/B test usage
    const abTestUsage = await db
      .select({
        testId: abTests.id,
        testName: abTests.name,
        variantName: abTestVariants.name,
        status: abTests.status,
      })
      .from(abTestVariants)
      .innerJoin(abTests, eq(abTestVariants.testId, abTests.id))
      .where(eq(abTestVariants.contentItemId, id));

    return {
      visibilityAssignments,
      abTests: abTestUsage,
    };
  }

  // Content Visibility operations
  async createContentVisibility(visibilityData: InsertContentVisibility): Promise<ContentVisibility> {
    const [visibility] = await db.insert(contentVisibility).values(visibilityData).returning();
    return visibility;
  }

  async getAllContentVisibility(): Promise<ContentVisibility[]> {
    return await db
      .select()
      .from(contentVisibility)
      .orderBy(contentVisibility.contentItemId, contentVisibility.order);
  }

  async getContentVisibility(
    contentItemId: string,
    persona?: string | null,
    funnelStage?: string | null
  ): Promise<ContentVisibility[]> {
    const conditions = [eq(contentVisibility.contentItemId, contentItemId)];
    
    if (persona !== undefined) {
      conditions.push(persona === null ? sql`${contentVisibility.persona} IS NULL` : eq(contentVisibility.persona, persona));
    }
    
    if (funnelStage !== undefined) {
      conditions.push(funnelStage === null ? sql`${contentVisibility.funnelStage} IS NULL` : eq(contentVisibility.funnelStage, funnelStage));
    }
    
    return await db
      .select()
      .from(contentVisibility)
      .where(and(...conditions))
      .orderBy(contentVisibility.order);
  }

  async updateContentVisibility(id: string, updates: Partial<InsertContentVisibility>): Promise<ContentVisibility | undefined> {
    const [visibility] = await db
      .update(contentVisibility)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentVisibility.id, id))
      .returning();
    return visibility;
  }

  async deleteContentVisibility(id: string): Promise<void> {
    await db.delete(contentVisibility).where(eq(contentVisibility.id, id));
  }

  async getVisibleContentItems(
    type: string,
    persona?: string | null,
    funnelStage?: string | null,
    userPassions?: string[] | null
  ): Promise<ContentItem[]> {
    // Build base query
    let query = db
      .select({
        id: contentItems.id,
        type: contentItems.type,
        title: contentItems.title,
        description: contentItems.description,
        imageName: contentItems.imageName,
        imageUrl: contentItems.imageUrl,
        passionTags: contentItems.passionTags,
        order: sql<number>`COALESCE(${contentVisibility.order}, ${contentItems.order})`.as('order'),
        isActive: contentItems.isActive,
        metadata: contentItems.metadata,
        createdAt: contentItems.createdAt,
        updatedAt: contentItems.updatedAt,
      })
      .from(contentItems)
      .leftJoin(
        contentVisibility,
        and(
          eq(contentVisibility.contentItemId, contentItems.id),
          persona === null || persona === undefined
            ? sql`${contentVisibility.persona} IS NULL`
            : or(
                sql`${contentVisibility.persona} IS NULL`,
                eq(contentVisibility.persona, persona)
              ),
          funnelStage === null || funnelStage === undefined
            ? sql`${contentVisibility.funnelStage} IS NULL`
            : or(
                sql`${contentVisibility.funnelStage} IS NULL`,
                eq(contentVisibility.funnelStage, funnelStage)
              )
        )
      )
      .where(
        and(
          eq(contentItems.type, type),
          eq(contentItems.isActive, true),
          or(
            sql`${contentVisibility.isVisible} IS NULL`,
            eq(contentVisibility.isVisible, true)
          )
        )
      );

    // Apply ordering based on whether we have user passions
    if (userPassions && userPassions.length > 0) {
      // With passions: prioritize content matching user's interests
      query = query.orderBy(
        sql`(
          SELECT COUNT(*)
          FROM jsonb_array_elements_text(COALESCE(${contentItems.passionTags}, '[]'::jsonb)) AS tag
          WHERE tag = ANY(${userPassions}::text[])
        ) DESC`, // Passion matches first
        sql`COALESCE(${contentVisibility.order}, ${contentItems.order})`, // Then by configured order
        contentItems.createdAt // Finally by creation date for stable ordering
      );
    } else {
      // Without passions: use standard ordering
      query = query.orderBy(
        sql`COALESCE(${contentVisibility.order}, ${contentItems.order})`,
        contentItems.createdAt
      );
    }

    return await query;
  }

  async getAvailablePersonaStageCombinations(): Promise<{ persona: string; funnelStage: string; }[]> {
    const combinations = await db
      .selectDistinct({
        persona: contentVisibility.persona,
        funnelStage: contentVisibility.funnelStage,
      })
      .from(contentVisibility)
      .innerJoin(contentItems, eq(contentVisibility.contentItemId, contentItems.id))
      .where(
        and(
          eq(contentVisibility.isVisible, true),
          eq(contentItems.isActive, true),
          sql`${contentVisibility.persona} IS NOT NULL`,
          sql`${contentVisibility.funnelStage} IS NOT NULL`
        )
      );
    
    return combinations.filter((c): c is { persona: string; funnelStage: string } => 
      c.persona !== null && c.funnelStage !== null
    );
  }
  
  // A/B Test operations
  async createAbTest(testData: InsertAbTest): Promise<AbTest> {
    const [test] = await db.insert(abTests).values(testData).returning();
    return test;
  }

  async getAbTest(id: string): Promise<AbTest | undefined> {
    const [test] = await db.select().from(abTests).where(eq(abTests.id, id));
    return test;
  }

  async getAllAbTests(): Promise<AbTest[]> {
    return await db.select().from(abTests).orderBy(desc(abTests.createdAt));
  }

  async getActiveAbTests(persona?: string | null, funnelStage?: string | null): Promise<AbTest[]> {
    const now = new Date();
    
    // Build base active test filters
    const baseFilters = [
      eq(abTests.status, 'active'),
      or(
        sql`${abTests.startDate} IS NULL`,
        sql`${abTests.startDate} <= ${now}`
      ),
      or(
        sql`${abTests.endDate} IS NULL`,
        sql`${abTests.endDate} >= ${now}`
      )
    ];
    
    // If no persona or funnelStage provided, return all active tests
    if (!persona || !funnelStage) {
      return await db
        .select()
        .from(abTests)
        .where(and(...baseFilters));
    }
    
    // Return tests that target the specific persona:funnelStage combination
    const tests = await db
      .selectDistinct({
        id: abTests.id,
        name: abTests.name,
        description: abTests.description,
        type: abTests.type,
        status: abTests.status,
        targetPersona: abTests.targetPersona,
        targetFunnelStage: abTests.targetFunnelStage,
        trafficAllocation: abTests.trafficAllocation,
        startDate: abTests.startDate,
        endDate: abTests.endDate,
        winnerVariantId: abTests.winnerVariantId,
        createdBy: abTests.createdBy,
        createdAt: abTests.createdAt,
        updatedAt: abTests.updatedAt,
      })
      .from(abTests)
      .innerJoin(abTestTargets, eq(abTestTargets.testId, abTests.id))
      .where(
        and(
          ...baseFilters,
          eq(abTestTargets.persona, persona),
          eq(abTestTargets.funnelStage, funnelStage)
        )
      );
    
    return tests;
  }

  async updateAbTest(id: string, updates: Partial<InsertAbTest>): Promise<AbTest | undefined> {
    const [test] = await db
      .update(abTests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(abTests.id, id))
      .returning();
    return test;
  }

  async deleteAbTest(id: string): Promise<void> {
    await db.delete(abTests).where(eq(abTests.id, id));
  }

  async createAbTestTargets(testId: string, combinations: string[]): Promise<void> {
    const targets = combinations.map(combo => {
      const [persona, funnelStage] = combo.split(':');
      return {
        testId,
        persona,
        funnelStage,
      };
    });
    
    if (targets.length > 0) {
      await db.insert(abTestTargets).values(targets);
    }
  }

  async getAbTestTargets(testId: string): Promise<{ persona: string; funnelStage: string; }[]> {
    const targets = await db
      .select({
        persona: abTestTargets.persona,
        funnelStage: abTestTargets.funnelStage,
      })
      .from(abTestTargets)
      .where(eq(abTestTargets.testId, testId));
    
    return targets as { persona: string; funnelStage: string; }[];
  }

  async deleteAbTestTargets(testId: string): Promise<void> {
    await db.delete(abTestTargets).where(eq(abTestTargets.testId, testId));
  }

  // A/B Test Variant operations
  async createAbTestVariant(variantData: InsertAbTestVariant): Promise<AbTestVariant> {
    const [variant] = await db.insert(abTestVariants).values(variantData).returning();
    return variant;
  }

  async getAbTestVariants(testId: string): Promise<AbTestVariant[]> {
    return await db
      .select()
      .from(abTestVariants)
      .where(eq(abTestVariants.testId, testId))
      .orderBy(desc(abTestVariants.isControl));
  }

  async updateAbTestVariant(id: string, updates: Partial<InsertAbTestVariant>): Promise<AbTestVariant | undefined> {
    const [variant] = await db
      .update(abTestVariants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(abTestVariants.id, id))
      .returning();
    return variant;
  }

  async deleteAbTestVariant(id: string): Promise<void> {
    await db.delete(abTestVariants).where(eq(abTestVariants.id, id));
  }

  // A/B Test Assignment operations
  async createAbTestAssignment(assignmentData: InsertAbTestAssignment): Promise<AbTestAssignment> {
    const [assignment] = await db.insert(abTestAssignments).values(assignmentData).returning();
    return assignment;
  }

  async getAssignment(testId: string, sessionId: string): Promise<AbTestAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(abTestAssignments)
      .where(
        and(
          eq(abTestAssignments.testId, testId),
          eq(abTestAssignments.sessionId, sessionId)
        )
      );
    return assignment;
  }

  // Persistent assignment lookup with priority: userId > visitorId > sessionId
  async getAssignmentPersistent(
    testId: string,
    userId?: string,
    visitorId?: string,
    sessionId?: string
  ): Promise<AbTestAssignment | undefined> {
    // Priority 1: Look up by userId (authenticated user)
    if (userId) {
      const [assignment] = await db
        .select()
        .from(abTestAssignments)
        .where(
          and(
            eq(abTestAssignments.testId, testId),
            eq(abTestAssignments.userId, userId)
          )
        );
      if (assignment) return assignment;
    }

    // Priority 2: Look up by visitorId (persistent anonymous)
    if (visitorId) {
      const [assignment] = await db
        .select()
        .from(abTestAssignments)
        .where(
          and(
            eq(abTestAssignments.testId, testId),
            eq(abTestAssignments.visitorId, visitorId)
          )
        );
      if (assignment) return assignment;
    }

    // Priority 3: Look up by sessionId (legacy fallback)
    if (sessionId) {
      const [assignment] = await db
        .select()
        .from(abTestAssignments)
        .where(
          and(
            eq(abTestAssignments.testId, testId),
            eq(abTestAssignments.sessionId, sessionId)
          )
        );
      if (assignment) return assignment;
    }

    return undefined;
  }

  async updateAbTestAssignment(id: string, updates: Partial<InsertAbTestAssignment>): Promise<AbTestAssignment | undefined> {
    const [assignment] = await db
      .update(abTestAssignments)
      .set(updates)
      .where(eq(abTestAssignments.id, id))
      .returning();
    return assignment;
  }

  async getSessionAssignments(sessionId: string): Promise<AbTestAssignment[]> {
    return await db
      .select()
      .from(abTestAssignments)
      .where(eq(abTestAssignments.sessionId, sessionId));
  }

  // A/B Test Event operations
  async trackEvent(eventData: InsertAbTestEvent): Promise<AbTestEvent> {
    const [event] = await db.insert(abTestEvents).values(eventData).returning();
    return event;
  }

  async getTestEvents(testId: string): Promise<AbTestEvent[]> {
    return await db
      .select()
      .from(abTestEvents)
      .where(eq(abTestEvents.testId, testId))
      .orderBy(desc(abTestEvents.createdAt));
  }

  async getVariantEvents(variantId: string): Promise<AbTestEvent[]> {
    return await db
      .select()
      .from(abTestEvents)
      .where(eq(abTestEvents.variantId, variantId))
      .orderBy(desc(abTestEvents.createdAt));
  }

  async getTestAnalytics(testId: string): Promise<{
    variantId: string;
    variantName: string;
    totalViews: number;
    uniqueViews: number;
    totalEvents: number;
    conversionRate: number;
  }[]> {
    const analytics = await db
      .select({
        variantId: abTestVariants.id,
        variantName: abTestVariants.name,
        totalViews: sql<number>`COUNT(DISTINCT ${abTestEvents.id}) FILTER (WHERE ${abTestEvents.eventType} = 'page_view')`.as('totalViews'),
        uniqueViews: sql<number>`COUNT(DISTINCT ${abTestEvents.sessionId}) FILTER (WHERE ${abTestEvents.eventType} = 'page_view')`.as('uniqueViews'),
        totalEvents: sql<number>`COUNT(DISTINCT ${abTestEvents.id}) FILTER (WHERE ${abTestEvents.eventType} != 'page_view')`.as('totalEvents'),
      })
      .from(abTestVariants)
      .leftJoin(abTestEvents, eq(abTestEvents.variantId, abTestVariants.id))
      .where(eq(abTestVariants.testId, testId))
      .groupBy(abTestVariants.id, abTestVariants.name);

    return analytics.map(row => ({
      variantId: row.variantId,
      variantName: row.variantName,
      totalViews: Number(row.totalViews) || 0,
      uniqueViews: Number(row.uniqueViews) || 0,
      totalEvents: Number(row.totalEvents) || 0,
      conversionRate: row.uniqueViews > 0 
        ? (Number(row.totalEvents) / Number(row.uniqueViews)) * 100 
        : 0,
    }));
  }

  // Performance Metrics operations
  async getPerformanceMetrics(): Promise<{
    personaMetrics: {
      persona: string;
      leadCount: number;
      avgEngagementScore: number;
      conversionRate: number;
    }[];
    funnelStageMetrics: {
      funnelStage: string;
      leadCount: number;
      avgEngagementScore: number;
    }[];
    contentPerformance: {
      type: string;
      totalItems: number;
      activeItems: number;
      avgViews: number;
    }[];
    recommendations: {
      type: string;
      reason: string;
      suggestedTest: string;
      priority: "high" | "medium" | "low";
    }[];
  }> {
    // Get persona metrics
    const personaMetricsData = await db
      .select({
        persona: leads.persona,
        leadCount: sql<number>`COUNT(*)`.as('leadCount'),
        avgEngagementScore: sql<number>`AVG(${leads.engagementScore})`.as('avgEngagementScore'),
        conversionRate: sql<number>`(COUNT(*) FILTER (WHERE ${leads.convertedAt} IS NOT NULL)::float / NULLIF(COUNT(*), 0) * 100)`.as('conversionRate'),
      })
      .from(leads)
      .where(sql`${leads.persona} IS NOT NULL`)
      .groupBy(leads.persona);

    // Get funnel stage metrics
    const funnelStageMetricsData = await db
      .select({
        funnelStage: leads.funnelStage,
        leadCount: sql<number>`COUNT(*)`.as('leadCount'),
        avgEngagementScore: sql<number>`AVG(${leads.engagementScore})`.as('avgEngagementScore'),
      })
      .from(leads)
      .where(sql`${leads.funnelStage} IS NOT NULL`)
      .groupBy(leads.funnelStage);

    // Get content performance metrics
    const contentTypes = ['hero', 'cta', 'service', 'event', 'testimonial', 'lead_magnet'];
    const contentPerformanceData = await Promise.all(
      contentTypes.map(async (type) => {
        const [stats] = await db
          .select({
            totalItems: sql<number>`COUNT(*)`.as('totalItems'),
            activeItems: sql<number>`COUNT(*) FILTER (WHERE ${contentItems.isActive} = true)`.as('activeItems'),
          })
          .from(contentItems)
          .where(eq(contentItems.type, type));

        return {
          type,
          totalItems: Number(stats?.totalItems) || 0,
          activeItems: Number(stats?.activeItems) || 0,
          avgViews: 0, // Placeholder for now - would need view tracking
        };
      })
    );

    // Generate recommendations based on metrics
    const recommendations: {
      type: string;
      reason: string;
      suggestedTest: string;
      priority: "high" | "medium" | "low";
    }[] = [];

    // Recommend tests for personas with low engagement
    personaMetricsData.forEach((metric) => {
      const avgScore = Number(metric.avgEngagementScore) || 0;
      if (avgScore < 50 && Number(metric.leadCount) > 5) {
        recommendations.push({
          type: "hero",
          reason: `${metric.persona} persona has ${avgScore.toFixed(0)}% engagement (below 50%)`,
          suggestedTest: `Test different hero messaging for ${metric.persona}s`,
          priority: "high",
        });
      }
    });

    // Recommend CTA tests for low conversion rates
    personaMetricsData.forEach((metric) => {
      const convRate = Number(metric.conversionRate) || 0;
      if (convRate < 10 && Number(metric.leadCount) > 5) {
        recommendations.push({
          type: "cta",
          reason: `${metric.persona} persona has ${convRate.toFixed(1)}% conversion rate`,
          suggestedTest: `A/B test CTA buttons for ${metric.persona}s`,
          priority: "medium",
        });
      }
    });

    // If no specific recommendations, suggest general improvements
    if (recommendations.length === 0) {
      recommendations.push({
        type: "hero",
        reason: "Optimize visitor engagement with different hero messages",
        suggestedTest: "Test hero headlines and imagery",
        priority: "low",
      });
    }

    return {
      personaMetrics: personaMetricsData.map(row => ({
        persona: row.persona || 'unknown',
        leadCount: Number(row.leadCount) || 0,
        avgEngagementScore: Number(row.avgEngagementScore) || 0,
        conversionRate: Number(row.conversionRate) || 0,
      })),
      funnelStageMetrics: funnelStageMetricsData.map(row => ({
        funnelStage: row.funnelStage || 'unknown',
        leadCount: Number(row.leadCount) || 0,
        avgEngagementScore: Number(row.avgEngagementScore) || 0,
      })),
      contentPerformance: contentPerformanceData,
      recommendations,
    };
  }

  // Google Reviews operations
  async upsertGoogleReview(reviewData: InsertGoogleReview): Promise<GoogleReview> {
    const existingReview = await db
      .select()
      .from(googleReviews)
      .where(eq(googleReviews.googleReviewId, reviewData.googleReviewId));

    if (existingReview.length > 0) {
      const [updated] = await db
        .update(googleReviews)
        .set({ ...reviewData, updatedAt: new Date() })
        .where(eq(googleReviews.googleReviewId, reviewData.googleReviewId))
        .returning();
      return updated;
    }

    const [created] = await db.insert(googleReviews).values(reviewData).returning();
    return created;
  }

  async getGoogleReviews(): Promise<GoogleReview[]> {
    return await db.select().from(googleReviews).orderBy(desc(googleReviews.time));
  }

  async getActiveGoogleReviews(): Promise<GoogleReview[]> {
    return await db
      .select()
      .from(googleReviews)
      .where(eq(googleReviews.isActive, true))
      .orderBy(desc(googleReviews.time));
  }

  async updateGoogleReviewVisibility(id: string, isActive: boolean): Promise<GoogleReview | undefined> {
    const [updated] = await db
      .update(googleReviews)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(googleReviews.id, id))
      .returning();
    return updated;
  }

  // Donation operations
  async createDonation(donationData: InsertDonation): Promise<Donation> {
    const [donation] = await db.insert(donations).values(donationData).returning();
    return donation;
  }

  async getDonationById(id: string): Promise<Donation | undefined> {
    const [donation] = await db.select().from(donations).where(eq(donations.id, id));
    return donation;
  }

  async getDonationByStripeId(stripePaymentIntentId: string): Promise<Donation | undefined> {
    const [donation] = await db.select().from(donations).where(eq(donations.stripePaymentIntentId, stripePaymentIntentId));
    return donation;
  }

  async updateDonationByStripeId(stripePaymentIntentId: string, updates: Partial<InsertDonation>): Promise<Donation | undefined> {
    const [updated] = await db
      .update(donations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(donations.stripePaymentIntentId, stripePaymentIntentId))
      .returning();
    return updated;
  }

  async getAllDonations(): Promise<Donation[]> {
    return await db.select().from(donations).orderBy(desc(donations.createdAt));
  }

  async getDonationsByLeadId(leadId: string): Promise<Donation[]> {
    return await db.select().from(donations).where(eq(donations.leadId, leadId)).orderBy(desc(donations.createdAt));
  }

  async getCampaignDonations(campaignId: string): Promise<Donation[]> {
    return await db.select().from(donations).where(eq(donations.campaignId, campaignId)).orderBy(desc(donations.createdAt));
  }

  // Donation Campaign operations
  async createDonationCampaign(campaignData: InsertDonationCampaign): Promise<DonationCampaign> {
    const [campaign] = await db.insert(donationCampaigns).values(campaignData).returning();
    return campaign;
  }

  async getDonationCampaign(id: string): Promise<DonationCampaign | undefined> {
    const [campaign] = await db.select().from(donationCampaigns).where(eq(donationCampaigns.id, id));
    return campaign;
  }

  async getDonationCampaignBySlug(slug: string): Promise<DonationCampaign | undefined> {
    const [campaign] = await db.select().from(donationCampaigns).where(eq(donationCampaigns.slug, slug));
    return campaign;
  }

  async getAllDonationCampaigns(): Promise<DonationCampaign[]> {
    return await db.select().from(donationCampaigns).orderBy(desc(donationCampaigns.createdAt));
  }

  async getActiveDonationCampaigns(): Promise<DonationCampaign[]> {
    return await db.select().from(donationCampaigns).where(eq(donationCampaigns.status, 'active')).orderBy(desc(donationCampaigns.createdAt));
  }

  async updateDonationCampaign(id: string, updates: Partial<InsertDonationCampaign>): Promise<DonationCampaign | undefined> {
    const [updated] = await db
      .update(donationCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(donationCampaigns.id, id))
      .returning();
    return updated;
  }

  // Campaign Member operations
  async createCampaignMember(memberData: InsertCampaignMember): Promise<CampaignMember> {
    const [member] = await db.insert(campaignMembers).values(memberData).returning();
    return member;
  }

  async getCampaignMember(id: string): Promise<CampaignMember | undefined> {
    const [member] = await db.select().from(campaignMembers).where(eq(campaignMembers.id, id));
    return member;
  }

  async getCampaignMembers(campaignId: string): Promise<CampaignMember[]> {
    return await db.select().from(campaignMembers).where(eq(campaignMembers.campaignId, campaignId));
  }

  async getUserCampaigns(userId: string): Promise<(CampaignMember & { campaign: DonationCampaign })[]> {
    const result = await db
      .select({
        id: campaignMembers.id,
        campaignId: campaignMembers.campaignId,
        userId: campaignMembers.userId,
        role: campaignMembers.role,
        notifyOnDonation: campaignMembers.notifyOnDonation,
        notificationChannels: campaignMembers.notificationChannels,
        isActive: campaignMembers.isActive,
        metadata: campaignMembers.metadata,
        joinedAt: campaignMembers.joinedAt,
        createdAt: campaignMembers.createdAt,
        updatedAt: campaignMembers.updatedAt,
        campaign: donationCampaigns,
      })
      .from(campaignMembers)
      .innerJoin(donationCampaigns, eq(campaignMembers.campaignId, donationCampaigns.id))
      .where(and(
        eq(campaignMembers.userId, userId),
        eq(campaignMembers.isActive, true)
      ));
    
    return result as (CampaignMember & { campaign: DonationCampaign })[];
  }

  async updateCampaignMember(id: string, updates: Partial<InsertCampaignMember>): Promise<CampaignMember | undefined> {
    const [updated] = await db
      .update(campaignMembers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaignMembers.id, id))
      .returning();
    return updated;
  }

  async deleteCampaignMember(id: string): Promise<void> {
    await db.delete(campaignMembers).where(eq(campaignMembers.id, id));
  }

  async isCampaignMember(campaignId: string, userId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(campaignMembers)
      .where(and(
        eq(campaignMembers.campaignId, campaignId),
        eq(campaignMembers.userId, userId),
        eq(campaignMembers.isActive, true)
      ));
    return !!result;
  }

  // Campaign Testimonial operations
  async createCampaignTestimonial(testimonialData: InsertCampaignTestimonial): Promise<CampaignTestimonial> {
    const [testimonial] = await db.insert(campaignTestimonials).values(testimonialData).returning();
    return testimonial;
  }

  async getCampaignTestimonial(id: string): Promise<CampaignTestimonial | undefined> {
    const [testimonial] = await db.select().from(campaignTestimonials).where(eq(campaignTestimonials.id, id));
    return testimonial;
  }

  async getCampaignTestimonials(campaignId: string, status?: string): Promise<CampaignTestimonial[]> {
    if (status) {
      return await db
        .select()
        .from(campaignTestimonials)
        .where(and(
          eq(campaignTestimonials.campaignId, campaignId),
          eq(campaignTestimonials.status, status)
        ))
        .orderBy(desc(campaignTestimonials.createdAt));
    }
    return await db
      .select()
      .from(campaignTestimonials)
      .where(eq(campaignTestimonials.campaignId, campaignId))
      .orderBy(desc(campaignTestimonials.createdAt));
  }

  async getMemberTestimonials(memberId: string): Promise<CampaignTestimonial[]> {
    return await db
      .select()
      .from(campaignTestimonials)
      .where(eq(campaignTestimonials.memberId, memberId))
      .orderBy(desc(campaignTestimonials.createdAt));
  }

  async updateCampaignTestimonial(id: string, updates: Partial<InsertCampaignTestimonial>): Promise<CampaignTestimonial | undefined> {
    const [updated] = await db
      .update(campaignTestimonials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaignTestimonials.id, id))
      .returning();
    return updated;
  }

  async deleteCampaignTestimonial(id: string): Promise<void> {
    await db.delete(campaignTestimonials).where(eq(campaignTestimonials.id, id));
  }

  // Wishlist Item operations
  async createWishlistItem(itemData: InsertWishlistItem): Promise<WishlistItem> {
    const [item] = await db.insert(wishlistItems).values(itemData).returning();
    return item;
  }

  async getActiveWishlistItems(): Promise<WishlistItem[]> {
    return await db
      .select()
      .from(wishlistItems)
      .where(and(
        eq(wishlistItems.isActive, true),
        eq(wishlistItems.isFulfilled, false)
      ))
      .orderBy(desc(wishlistItems.priority), desc(wishlistItems.createdAt));
  }

  async getAllWishlistItems(): Promise<WishlistItem[]> {
    return await db.select().from(wishlistItems).orderBy(desc(wishlistItems.createdAt));
  }

  async updateWishlistItem(id: string, updates: Partial<InsertWishlistItem>): Promise<WishlistItem | undefined> {
    const [updated] = await db
      .update(wishlistItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(wishlistItems.id, id))
      .returning();
    return updated;
  }

  async deleteWishlistItem(id: string): Promise<boolean> {
    const result = await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Email Template operations
  async getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, name));
    return template;
  }

  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
  }

  async createEmailTemplate(templateData: InsertEmailTemplate): Promise<EmailTemplate> {
    const [template] = await db.insert(emailTemplates).values(templateData).returning();
    return template;
  }

  async updateEmailTemplate(id: string, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated;
  }

  // Hormozi Email Template operations (Alex Hormozi's $100M Leads Framework)
  async getHormoziEmailTemplates(filters?: {
    persona?: string;
    funnelStage?: string;
    outreachType?: string;
    templateCategory?: string;
  }): Promise<EmailTemplate[]> {
    const conditions = [eq(emailTemplates.isActive, true)];
    
    if (filters?.persona) {
      conditions.push(or(
        eq(emailTemplates.persona, filters.persona),
        sql`${emailTemplates.persona} IS NULL`
      )!);
    }
    
    if (filters?.funnelStage) {
      conditions.push(or(
        eq(emailTemplates.funnelStage, filters.funnelStage),
        sql`${emailTemplates.funnelStage} IS NULL`
      )!);
    }
    
    if (filters?.outreachType) {
      conditions.push(eq(emailTemplates.outreachType, filters.outreachType));
    }
    
    if (filters?.templateCategory) {
      conditions.push(eq(emailTemplates.templateCategory, filters.templateCategory));
    }
    
    return await db
      .select()
      .from(emailTemplates)
      .where(and(...conditions))
      .orderBy(emailTemplates.persona, emailTemplates.funnelStage, emailTemplates.name);
  }

  async getHormoziEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return template;
  }

  // Email Log operations
  async createEmailLog(logData: InsertEmailLog): Promise<EmailLog> {
    const [log] = await db.insert(emailLogs).values(logData).returning();
    return log;
  }

  async getEmailLogsByRecipient(recipientEmail: string): Promise<EmailLog[]> {
    return await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.recipientEmail, recipientEmail))
      .orderBy(desc(emailLogs.createdAt));
  }

  async getRecentEmailLogs(limit: number = 50): Promise<EmailLog[]> {
    return await db
      .select()
      .from(emailLogs)
      .orderBy(desc(emailLogs.createdAt))
      .limit(limit);
  }

  // SMS Template operations
  async createSmsTemplate(templateData: InsertSmsTemplate): Promise<SmsTemplate> {
    const [template] = await db.insert(smsTemplates).values(templateData).returning();
    return template;
  }

  async getAllSmsTemplates(): Promise<SmsTemplate[]> {
    return await db.select().from(smsTemplates).orderBy(desc(smsTemplates.createdAt));
  }

  async getSmsTemplateById(id: string): Promise<SmsTemplate | undefined> {
    const [template] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, id));
    return template;
  }

  async getSmsTemplatesByPersona(persona: string): Promise<SmsTemplate[]> {
    return await db
      .select()
      .from(smsTemplates)
      .where(or(eq(smsTemplates.persona, persona), sql`${smsTemplates.persona} IS NULL`))
      .orderBy(desc(smsTemplates.createdAt));
  }

  async updateSmsTemplate(id: string, updates: Partial<InsertSmsTemplate>): Promise<SmsTemplate | undefined> {
    const [updated] = await db
      .update(smsTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteSmsTemplate(id: string): Promise<void> {
    await db.delete(smsTemplates).where(eq(smsTemplates.id, id));
  }

  // Hormozi SMS Template operations
  async getHormoziSmsTemplates(filters?: {
    persona?: string;
    funnelStage?: string;
    outreachType?: string;
    templateCategory?: string;
  }): Promise<SmsTemplate[]> {
    const conditions = [eq(smsTemplates.isActive, true)];
    
    if (filters?.persona) {
      conditions.push(or(
        eq(smsTemplates.persona, filters.persona),
        sql`${smsTemplates.persona} IS NULL`
      )!);
    }
    
    if (filters?.funnelStage) {
      conditions.push(or(
        eq(smsTemplates.funnelStage, filters.funnelStage),
        sql`${smsTemplates.funnelStage} IS NULL`
      )!);
    }
    
    if (filters?.outreachType) {
      conditions.push(eq(smsTemplates.outreachType, filters.outreachType));
    }
    
    if (filters?.templateCategory) {
      conditions.push(eq(smsTemplates.templateCategory, filters.templateCategory));
    }
    
    return await db
      .select()
      .from(smsTemplates)
      .where(and(...conditions))
      .orderBy(smsTemplates.persona, smsTemplates.funnelStage, smsTemplates.name);
  }

  async getHormoziSmsTemplate(id: string): Promise<SmsTemplate | undefined> {
    const [template] = await db
      .select()
      .from(smsTemplates)
      .where(eq(smsTemplates.id, id));
    return template;
  }

  // SMS Send operations
  async createSmsSend(sendData: InsertSmsSend): Promise<SmsSend> {
    const [send] = await db.insert(smsSends).values(sendData).returning();
    return send;
  }

  async getSmsSendsByLead(leadId: string): Promise<SmsSend[]> {
    return await db
      .select()
      .from(smsSends)
      .where(eq(smsSends.leadId, leadId))
      .orderBy(desc(smsSends.createdAt));
  }

  async getRecentSmsSends(limit: number = 50): Promise<SmsSend[]> {
    return await db
      .select()
      .from(smsSends)
      .orderBy(desc(smsSends.createdAt))
      .limit(limit);
  }

  async updateSmsSendStatus(id: string, status: string, deliveredAt?: Date): Promise<SmsSend | undefined> {
    const [updated] = await db
      .update(smsSends)
      .set({ status, deliveredAt })
      .where(eq(smsSends.id, id))
      .returning();
    return updated;
  }

  // Communication Log operations
  async createCommunicationLog(logData: InsertCommunicationLog): Promise<CommunicationLog> {
    const [log] = await db.insert(communicationLogs).values(logData).returning();
    return log;
  }

  async getLeadCommunications(leadId: string): Promise<CommunicationLog[]> {
    return await db
      .select()
      .from(communicationLogs)
      .where(eq(communicationLogs.leadId, leadId))
      .orderBy(desc(communicationLogs.createdAt));
  }

  // Email Campaign operations
  async createEmailCampaign(campaignData: InsertEmailCampaign): Promise<EmailCampaign> {
    const [campaign] = await db.insert(emailCampaigns).values(campaignData).returning();
    return campaign;
  }

  async getAllEmailCampaigns(): Promise<EmailCampaign[]> {
    return await db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaign(id: string): Promise<EmailCampaign | undefined> {
    const [campaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
    return campaign;
  }

  async getActiveCampaigns(): Promise<EmailCampaign[]> {
    return await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.isActive, true))
      .orderBy(desc(emailCampaigns.createdAt));
  }

  async updateEmailCampaign(id: string, updates: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined> {
    const [updated] = await db
      .update(emailCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updated;
  }

  async deleteEmailCampaign(id: string): Promise<void> {
    await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
  }

  // Email Sequence Step operations
  async createEmailSequenceStep(stepData: InsertEmailSequenceStep): Promise<EmailSequenceStep> {
    const [step] = await db.insert(emailSequenceSteps).values(stepData).returning();
    return step;
  }

  async getCampaignSteps(campaignId: string): Promise<EmailSequenceStep[]> {
    return await db
      .select()
      .from(emailSequenceSteps)
      .where(eq(emailSequenceSteps.campaignId, campaignId))
      .orderBy(emailSequenceSteps.stepNumber);
  }

  async updateEmailSequenceStep(id: string, updates: Partial<InsertEmailSequenceStep>): Promise<EmailSequenceStep | undefined> {
    const [updated] = await db
      .update(emailSequenceSteps)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailSequenceSteps.id, id))
      .returning();
    return updated;
  }

  async deleteEmailSequenceStep(id: string): Promise<void> {
    await db.delete(emailSequenceSteps).where(eq(emailSequenceSteps.id, id));
  }

  // Email Campaign Enrollment operations
  async createEnrollment(enrollmentData: InsertEmailCampaignEnrollment): Promise<EmailCampaignEnrollment> {
    const [enrollment] = await db.insert(emailCampaignEnrollments).values(enrollmentData).returning();
    return enrollment;
  }

  async getLeadEnrollments(leadId: string): Promise<EmailCampaignEnrollment[]> {
    return await db
      .select()
      .from(emailCampaignEnrollments)
      .where(eq(emailCampaignEnrollments.leadId, leadId))
      .orderBy(desc(emailCampaignEnrollments.enrolledAt));
  }

  async getCampaignEnrollments(campaignId: string): Promise<EmailCampaignEnrollment[]> {
    return await db
      .select()
      .from(emailCampaignEnrollments)
      .where(eq(emailCampaignEnrollments.campaignId, campaignId))
      .orderBy(desc(emailCampaignEnrollments.enrolledAt));
  }

  async getEnrollment(campaignId: string, leadId: string): Promise<EmailCampaignEnrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(emailCampaignEnrollments)
      .where(and(
        eq(emailCampaignEnrollments.campaignId, campaignId),
        eq(emailCampaignEnrollments.leadId, leadId)
      ));
    return enrollment;
  }

  async updateEnrollment(id: string, updates: Partial<InsertEmailCampaignEnrollment>): Promise<EmailCampaignEnrollment | undefined> {
    const [updated] = await db
      .update(emailCampaignEnrollments)
      .set(updates)
      .where(eq(emailCampaignEnrollments.id, id))
      .returning();
    return updated;
  }

  // Pipeline Stage operations
  async getPipelineStages(): Promise<PipelineStage[]> {
    return await db.select().from(pipelineStages).where(eq(pipelineStages.isActive, true)).orderBy(pipelineStages.position);
  }

  async getPipelineStage(id: string): Promise<PipelineStage | undefined> {
    const [stage] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, id));
    return stage;
  }

  // Lead Assignment operations
  async createLeadAssignment(assignmentData: InsertLeadAssignment): Promise<LeadAssignment> {
    const [assignment] = await db.insert(leadAssignments).values(assignmentData).returning();
    return assignment;
  }

  async getLeadAssignment(leadId: string): Promise<LeadAssignment | undefined> {
    const [assignment] = await db.select().from(leadAssignments)
      .where(eq(leadAssignments.leadId, leadId))
      .orderBy(desc(leadAssignments.createdAt))
      .limit(1);
    return assignment;
  }

  async getLeadAssignments(filters: { assignedTo?: string; leadId?: string }): Promise<LeadAssignment[]> {
    let query = db.select().from(leadAssignments);
    
    if (filters.assignedTo) {
      query = query.where(eq(leadAssignments.assignedTo, filters.assignedTo)) as any;
    }
    
    if (filters.leadId) {
      query = query.where(eq(leadAssignments.leadId, filters.leadId)) as any;
    }
    
    return await query.orderBy(desc(leadAssignments.createdAt));
  }

  // Task operations
  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async getTasks(filters: { leadId?: string; assignedTo?: string; status?: string }): Promise<Task[]> {
    const conditions = [];
    
    if (filters.leadId) {
      conditions.push(eq(tasks.leadId, filters.leadId));
    }
    
    if (filters.assignedTo) {
      conditions.push(eq(tasks.assignedTo, filters.assignedTo));
    }
    
    if (filters.status) {
      conditions.push(eq(tasks.status, filters.status));
    }
    
    if (conditions.length === 0) {
      return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    }
    
    return await db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Pipeline History operations
  async createPipelineHistory(historyData: InsertPipelineHistory): Promise<PipelineHistory> {
    const [history] = await db.insert(pipelineHistory).values(historyData).returning();
    return history;
  }

  async getPipelineHistory(leadId: string): Promise<PipelineHistory[]> {
    return await db.select().from(pipelineHistory)
      .where(eq(pipelineHistory.leadId, leadId))
      .orderBy(desc(pipelineHistory.createdAt));
  }

  // Outreach Email operations
  async createOutreachEmail(emailData: InsertOutreachEmail): Promise<OutreachEmail> {
    const [email] = await db.insert(outreachEmails).values(emailData).returning();
    return email;
  }

  async getOutreachEmail(id: string): Promise<OutreachEmail | undefined> {
    const [email] = await db.select().from(outreachEmails).where(eq(outreachEmails.id, id));
    return email;
  }

  async getLeadOutreachEmails(leadId: string): Promise<OutreachEmail[]> {
    return await db.select().from(outreachEmails)
      .where(eq(outreachEmails.leadId, leadId))
      .orderBy(desc(outreachEmails.createdAt));
  }

  async getAllOutreachEmails(filters?: { status?: string; limit?: number }): Promise<OutreachEmail[]> {
    let query = db.select().from(outreachEmails);
    
    if (filters?.status) {
      query = query.where(eq(outreachEmails.status, filters.status)) as any;
    }
    
    query = query.orderBy(desc(outreachEmails.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return await query;
  }

  async updateOutreachEmail(id: string, updates: Partial<InsertOutreachEmail>): Promise<OutreachEmail | undefined> {
    const [email] = await db
      .update(outreachEmails)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(outreachEmails.id, id))
      .returning();
    return email;
  }

  async deleteOutreachEmail(id: string): Promise<void> {
    await db.delete(outreachEmails).where(eq(outreachEmails.id, id));
  }

  async markOutreachEmailOpened(id: string): Promise<OutreachEmail | undefined> {
    const [email] = await db
      .update(outreachEmails)
      .set({ 
        wasOpened: true, 
        openedAt: new Date(),
        openCount: sql`${outreachEmails.openCount} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(outreachEmails.id, id))
      .returning();
    return email;
  }

  async markOutreachEmailClicked(id: string): Promise<OutreachEmail | undefined> {
    const [email] = await db
      .update(outreachEmails)
      .set({ 
        wasClicked: true, 
        clickedAt: new Date(),
        clickCount: sql`${outreachEmails.clickCount} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(outreachEmails.id, id))
      .returning();
    return email;
  }

  async markOutreachEmailReplied(id: string): Promise<OutreachEmail | undefined> {
    const [email] = await db
      .update(outreachEmails)
      .set({ 
        wasReplied: true, 
        repliedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(outreachEmails.id, id))
      .returning();
    return email;
  }

  // ICP Criteria operations
  async createIcpCriteria(criteriaData: InsertIcpCriteria): Promise<IcpCriteria> {
    const [criteria] = await db.insert(icpCriteria).values(criteriaData).returning();
    return criteria;
  }

  async getIcpCriteria(id: string): Promise<IcpCriteria | undefined> {
    const [criteria] = await db.select().from(icpCriteria).where(eq(icpCriteria.id, id));
    return criteria;
  }

  async getAllIcpCriteria(): Promise<IcpCriteria[]> {
    return await db.select().from(icpCriteria).orderBy(desc(icpCriteria.createdAt));
  }

  async getActiveIcpCriteria(): Promise<IcpCriteria[]> {
    return await db.select().from(icpCriteria)
      .where(eq(icpCriteria.isActive, true))
      .orderBy(desc(icpCriteria.createdAt));
  }

  async getDefaultIcpCriteria(): Promise<IcpCriteria | undefined> {
    const [criteria] = await db.select().from(icpCriteria)
      .where(and(eq(icpCriteria.isDefault, true), eq(icpCriteria.isActive, true)))
      .limit(1);
    return criteria;
  }

  async updateIcpCriteria(id: string, updates: Partial<InsertIcpCriteria>): Promise<IcpCriteria | undefined> {
    const [criteria] = await db
      .update(icpCriteria)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(icpCriteria.id, id))
      .returning();
    return criteria;
  }

  async deleteIcpCriteria(id: string): Promise<void> {
    await db.delete(icpCriteria).where(eq(icpCriteria.id, id));
  }

  // Lead Sourcing operations
  async getLeadsForQualification(limit: number = 50): Promise<Lead[]> {
    return await db.select().from(leads)
      .where(eq(leads.qualificationStatus, 'pending'))
      .orderBy(desc(leads.createdAt))
      .limit(limit);
  }

  async getQualifiedLeads(minScore: number = 70): Promise<Lead[]> {
    return await db.select().from(leads)
      .where(
        and(
          eq(leads.qualificationStatus, 'qualified'),
          sql`${leads.qualificationScore} >= ${minScore}`
        )
      )
      .orderBy(desc(leads.qualificationScore));
  }

  async getLeadsForOutreach(limit: number = 50): Promise<Lead[]> {
    return await db.select().from(leads)
      .where(
        and(
          eq(leads.qualificationStatus, 'qualified'),
          or(
            eq(leads.outreachStatus, 'pending'),
            eq(leads.outreachStatus, 'draft_ready')
          )
        )
      )
      .orderBy(desc(leads.qualificationScore))
      .limit(limit);
  }

  async bulkCreateLeads(leadsData: InsertLead[]): Promise<Lead[]> {
    if (leadsData.length === 0) {
      return [];
    }
    
    const createdLeads = await db.insert(leads).values(leadsData).returning();
    return createdLeads;
  }

  // Helper method used by routes
  async getLeadById(id: string): Promise<Lead | undefined> {
    return this.getLead(id);
  }
  
  // Chatbot Conversation operations
  async createChatbotConversation(conversation: InsertChatbotConversation): Promise<ChatbotConversation> {
    const [created] = await db.insert(chatbotConversations).values(conversation).returning();
    return created!;
  }

  async getChatbotConversationsBySession(sessionId: string, limit: number = 50): Promise<ChatbotConversation[]> {
    return await db.select().from(chatbotConversations)
      .where(eq(chatbotConversations.sessionId, sessionId))
      .orderBy(chatbotConversations.createdAt)
      .limit(limit);
  }

  async deleteChatbotSession(sessionId: string): Promise<void> {
    await db.delete(chatbotConversations)
      .where(eq(chatbotConversations.sessionId, sessionId));
  }
  
  // Chatbot Issue operations
  async createChatbotIssue(issue: InsertChatbotIssue): Promise<ChatbotIssue> {
    const [created] = await db.insert(chatbotIssues).values(issue).returning();
    return created!;
  }

  async getChatbotIssues(filters?: { status?: string; severity?: string; reportedBy?: string; limit?: number }): Promise<ChatbotIssue[]> {
    let query = db.select().from(chatbotIssues);
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(chatbotIssues.status, filters.status));
    }
    if (filters?.severity) {
      conditions.push(eq(chatbotIssues.severity, filters.severity));
    }
    if (filters?.reportedBy) {
      conditions.push(eq(chatbotIssues.reportedBy, filters.reportedBy));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(chatbotIssues.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return await query;
  }

  async updateChatbotIssue(id: string, updates: Partial<InsertChatbotIssue>): Promise<ChatbotIssue | undefined> {
    const [updated] = await db.update(chatbotIssues)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatbotIssues.id, id))
      .returning();
    return updated;
  }

  // Analytics operations for chatbot
  async getPlatformStats() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalLeads,
      totalUsers,
      totalDonations,
      activeContent,
      leadsThisWeek,
      donationsThisWeek,
      tasksThisWeek
    ] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(leads).then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(users).then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(donations).then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(contentItems).where(eq(contentItems.isActive, true)).then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(leads).where(sql`${leads.createdAt} >= ${weekAgo}`).then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(donations).where(sql`${donations.createdAt} >= ${weekAgo}`).then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(tasks).where(sql`${tasks.createdAt} >= ${weekAgo}`).then(r => r[0]?.count || 0)
    ]);

    return {
      generatedAt: now.toISOString(),
      totals: {
        leads: totalLeads,
        users: totalUsers,
        donations: totalDonations,
        activeContent
      },
      recentActivity: {
        leadsThisWeek,
        donationsThisWeek,
        tasksThisWeek
      }
    };
  }

  async getLeadAnalytics(filters?: {
    persona?: string;
    funnelStage?: string;
    pipelineStage?: string;
    daysBack?: number;
  }) {
    const now = new Date();
    const daysBack = filters?.daysBack || 30;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Build conditions
    const conditions = [];
    if (filters?.persona) {
      conditions.push(eq(leads.persona, filters.persona));
    }
    if (filters?.funnelStage) {
      conditions.push(eq(leads.funnelStage, filters.funnelStage));
    }
    if (filters?.pipelineStage) {
      conditions.push(eq(leads.pipelineStage, filters.pipelineStage));
    }

    // Get total count with filters
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const totalCount = await db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(leads)
      .where(whereClause)
      .then(r => r[0]?.count || 0);

    // Get breakdown by persona
    const byPersona = await db.select({
      persona: leads.persona,
      count: sql<number>`cast(count(*) as int)`
    })
      .from(leads)
      .where(whereClause)
      .groupBy(leads.persona);

    // Get breakdown by funnel stage
    const byFunnelStage = await db.select({
      stage: leads.funnelStage,
      count: sql<number>`cast(count(*) as int)`
    })
      .from(leads)
      .where(whereClause)
      .groupBy(leads.funnelStage);

    // Get breakdown by pipeline stage
    const byPipelineStage = await db.select({
      stage: leads.pipelineStage,
      count: sql<number>`cast(count(*) as int)`
    })
      .from(leads)
      .where(whereClause)
      .groupBy(leads.pipelineStage);

    // Get recent leads count
    const recentCount = await db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(leads)
      .where(and(whereClause, sql`${leads.createdAt} >= ${cutoffDate}`))
      .then(r => r[0]?.count || 0);

    // Get average engagement score
    const avgScore = await db.select({ avg: sql<number>`cast(avg(${leads.engagementScore}) as float)` })
      .from(leads)
      .where(whereClause)
      .then(r => Math.round((r[0]?.avg || 0) * 10) / 10);

    return {
      generatedAt: now.toISOString(),
      appliedFilters: {
        persona: filters?.persona || null,
        funnelStage: filters?.funnelStage || null,
        pipelineStage: filters?.pipelineStage || null,
        daysBack
      },
      totals: {
        total: totalCount,
        byPersona: byPersona.map(p => ({ persona: p.persona || 'unknown', count: p.count })),
        byFunnelStage: byFunnelStage.map(f => ({ stage: f.stage || 'unknown', count: f.count })),
        byPipelineStage: byPipelineStage.map(p => ({ stage: p.stage || 'unknown', count: p.count }))
      },
      recentLeads: {
        count: recentCount,
        period: (daysBack === 7 ? 'last7Days' : daysBack === 30 ? 'last30Days' : 'custom') as 'last7Days' | 'last30Days' | 'custom'
      },
      avgEngagementScore: avgScore
    };
  }

  async getContentSummary(filters?: { type?: string }) {
    const now = new Date();

    const whereClause = filters?.type ? eq(contentItems.type, filters.type) : undefined;

    // Get total counts
    const [totalCount, activeCount, inactiveCount] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(contentItems)
        .where(whereClause)
        .then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(contentItems)
        .where(and(whereClause, eq(contentItems.isActive, true)))
        .then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(contentItems)
        .where(and(whereClause, eq(contentItems.isActive, false)))
        .then(r => r[0]?.count || 0)
    ]);

    // Get breakdown by type
    const byType = await db.select({
      type: contentItems.type,
      count: sql<number>`cast(count(*) as int)`,
      active: sql<number>`cast(sum(case when ${contentItems.isActive} then 1 else 0 end) as int)`
    })
      .from(contentItems)
      .where(whereClause)
      .groupBy(contentItems.type);

    // Get A/B test stats
    const [totalTests, activeTests, pausedTests, completedTests] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(abTests).then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(abTests).where(eq(abTests.status, 'active')).then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(abTests).where(eq(abTests.status, 'paused')).then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(abTests).where(eq(abTests.status, 'completed')).then(r => r[0]?.count || 0)
    ]);

    return {
      generatedAt: now.toISOString(),
      appliedFilters: {
        type: filters?.type || null
      },
      totals: {
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount,
        byType: byType.map(t => ({ type: t.type, count: t.count, active: t.active }))
      },
      abTests: {
        total: totalTests,
        active: activeTests,
        paused: pausedTests,
        completed: completedTests
      }
    };
  }

  async getDonationStats(filters?: { daysBack?: number }) {
    const now = new Date();
    const daysBack = filters?.daysBack || 30;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Get total donation stats
    const totals = await db.select({
      count: sql<number>`cast(count(*) as int)`,
      sum: sql<number>`cast(sum(${donations.amount}) as int)`,
      avg: sql<number>`cast(avg(${donations.amount}) as int)`
    })
      .from(donations)
      .then(r => r[0] || { count: 0, sum: 0, avg: 0 });

    // Get breakdown by type
    const byType = await db.select({
      type: donations.donationType,
      count: sql<number>`cast(count(*) as int)`,
      amount: sql<number>`cast(sum(${donations.amount}) as int)`
    })
      .from(donations)
      .groupBy(donations.donationType);

    // Get breakdown by status
    const byStatus = await db.select({
      status: donations.status,
      count: sql<number>`cast(count(*) as int)`
    })
      .from(donations)
      .groupBy(donations.status);

    // Get recent donations
    const recentDonations = await db.select({
      count: sql<number>`cast(count(*) as int)`,
      amount: sql<number>`cast(sum(${donations.amount}) as int)`
    })
      .from(donations)
      .where(sql`${donations.createdAt} >= ${cutoffDate}`)
      .then(r => r[0] || { count: 0, amount: 0 });

    // Get campaign stats
    const [totalCampaigns, activeCampaigns] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(donationCampaigns).then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(donationCampaigns).where(eq(donationCampaigns.status, 'active')).then(r => r[0]?.count || 0)
    ]);

    return {
      generatedAt: now.toISOString(),
      appliedFilters: {
        daysBack
      },
      totals: {
        totalDonations: totals.count,
        totalAmount: totals.sum,
        avgDonation: Math.round(totals.avg),
        byType: byType.map(t => ({ type: t.type, count: t.count, amount: t.amount })),
        byStatus: byStatus.map(s => ({ status: s.status, count: s.count }))
      },
      recentDonations: {
        count: recentDonations.count,
        amount: recentDonations.amount,
        period: (daysBack === 7 ? 'last7Days' : daysBack === 30 ? 'last30Days' : 'custom') as 'last7Days' | 'last30Days' | 'custom'
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns
      }
    };
  }

  // Database Backup operations
  
  // Helper method to validate table names against allow-list
  private validateTableName(tableName: string): void {
    // Allow-list of valid table names that can be backed up
    const VALID_TABLES = [
      'users', 'leads', 'interactions', 'lead_magnets', 'image_assets',
      'content_items', 'content_visibility', 'ab_tests', 'ab_test_targets',
      'ab_test_variants', 'ab_test_assignments', 'ab_test_events',
      'google_reviews', 'donations', 'wishlist_items', 'donation_campaigns',
      'campaign_members', 'campaign_testimonials', 'email_templates',
      'email_logs', 'sms_templates', 'sms_sends', 'communication_logs',
      'email_campaigns', 'email_sequence_steps', 'email_campaign_enrollments',
      'pipeline_stages', 'lead_assignments', 'tasks', 'pipeline_history',
      'admin_preferences', 'audit_logs', 'outreach_emails', 'icp_criteria',
      'chatbot_conversations', 'chatbot_issues'
    ];

    if (!VALID_TABLES.includes(tableName)) {
      throw new Error(`Invalid table name: ${tableName}. Table not eligible for backup.`);
    }
  }

  // Helper method to safely quote SQL identifiers
  private quoteIdentifier(identifier: string): string {
    // PostgreSQL identifier quoting: double quotes and escape internal quotes
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  async createTableBackup(tableName: string, userId: string, backupName?: string, description?: string): Promise<{
    backupTableName: string;
    rowCount: number;
    snapshotId: string;
  }> {
    // Validate table name against allow-list
    this.validateTableName(tableName);

    // Generate unique backup table name with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
    const backupTableName = `backup_${tableName}_${timestamp}`;

    try {
      // Use properly quoted identifiers to prevent SQL injection
      const quotedBackupTable = this.quoteIdentifier(backupTableName);
      const quotedOriginalTable = this.quoteIdentifier(tableName);

      // Create backup table using CREATE TABLE AS SELECT
      await db.execute(sql.raw(`CREATE TABLE ${quotedBackupTable} AS SELECT * FROM ${quotedOriginalTable}`));

      // Get row count from backup table
      const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${quotedBackupTable}`));
      const rowCount = parseInt(countResult.rows[0]?.count || '0');

      // Create snapshot metadata record
      const [snapshot] = await db.insert(backupSnapshots).values({
        tableName,
        backupTableName,
        backupName: backupName || `${tableName} backup ${timestamp}`,
        rowCount,
        createdBy: userId,
        description
      }).returning();

      return {
        backupTableName: snapshot.backupTableName,
        rowCount: snapshot.rowCount,
        snapshotId: snapshot.id
      };
    } catch (error) {
      // Clean up backup table if metadata insert failed
      try {
        await db.execute(sql.raw(`DROP TABLE IF EXISTS ${this.quoteIdentifier(backupTableName)}`));
      } catch (cleanupError) {
        console.error('Failed to cleanup backup table after error:', cleanupError);
      }
      
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllBackupSnapshots(): Promise<BackupSnapshot[]> {
    return await db
      .select()
      .from(backupSnapshots)
      .orderBy(desc(backupSnapshots.createdAt));
  }

  async getBackupSnapshotsByTable(tableName: string): Promise<BackupSnapshot[]> {
    return await db
      .select()
      .from(backupSnapshots)
      .where(eq(backupSnapshots.tableName, tableName))
      .orderBy(desc(backupSnapshots.createdAt));
  }

  async getBackupSnapshot(id: string): Promise<BackupSnapshot | undefined> {
    const [snapshot] = await db
      .select()
      .from(backupSnapshots)
      .where(eq(backupSnapshots.id, id));
    return snapshot;
  }

  async restoreFromBackup(backupId: string, mode: 'replace' | 'merge'): Promise<{
    tableName: string;
    rowsRestored: number;
  }> {
    // Get backup snapshot metadata
    const snapshot = await this.getBackupSnapshot(backupId);
    if (!snapshot) {
      throw new Error('Backup snapshot not found');
    }

    const { tableName, backupTableName } = snapshot;

    // Validate table name against allow-list
    this.validateTableName(tableName);

    const quotedTable = this.quoteIdentifier(tableName);
    const quotedBackupTable = this.quoteIdentifier(backupTableName);

    try {
      // Use transaction for atomicity - rollback on failure
      await db.execute(sql.raw(`BEGIN`));

      if (mode === 'replace') {
        // Replace mode: Delete all rows from original table, then insert from backup
        await db.execute(sql.raw(`DELETE FROM ${quotedTable}`));
        await db.execute(sql.raw(`INSERT INTO ${quotedTable} SELECT * FROM ${quotedBackupTable}`));
      } else {
        // Merge mode: Insert rows from backup that don't exist in original table
        // This assumes the table has an 'id' column as primary key
        await db.execute(sql.raw(`
          INSERT INTO ${quotedTable} 
          SELECT * FROM ${quotedBackupTable} 
          WHERE id NOT IN (SELECT id FROM ${quotedTable})
          ON CONFLICT (id) DO NOTHING
        `));
      }

      // Get count of rows in restored table
      const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${quotedTable}`));
      const rowsRestored = parseInt(countResult.rows[0]?.count || '0');

      // Commit transaction
      await db.execute(sql.raw(`COMMIT`));

      return {
        tableName,
        rowsRestored
      };
    } catch (error) {
      // Rollback transaction on error
      try {
        await db.execute(sql.raw(`ROLLBACK`));
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError);
      }

      throw new Error(`Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    // Get backup snapshot metadata
    const snapshot = await this.getBackupSnapshot(backupId);
    if (!snapshot) {
      throw new Error('Backup snapshot not found');
    }

    const quotedBackupTable = this.quoteIdentifier(snapshot.backupTableName);

    try {
      // Use transaction for atomicity
      await db.execute(sql.raw(`BEGIN`));

      // Drop the backup table
      await db.execute(sql.raw(`DROP TABLE IF EXISTS ${quotedBackupTable}`));

      // Delete snapshot metadata
      await db.delete(backupSnapshots).where(eq(backupSnapshots.id, backupId));

      // Commit transaction
      await db.execute(sql.raw(`COMMIT`));
    } catch (error) {
      // Rollback transaction on error
      try {
        await db.execute(sql.raw(`ROLLBACK`));
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError);
      }

      throw new Error(`Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAvailableTables(): Promise<string[]> {
    // Return the allow-list of valid tables (same list used for validation)
    // This ensures consistency and prevents information disclosure
    return [
      'users', 'leads', 'interactions', 'lead_magnets', 'image_assets',
      'content_items', 'content_visibility', 'ab_tests', 'ab_test_targets',
      'ab_test_variants', 'ab_test_assignments', 'ab_test_events',
      'google_reviews', 'donations', 'wishlist_items', 'donation_campaigns',
      'campaign_members', 'campaign_testimonials', 'email_templates',
      'email_logs', 'sms_templates', 'sms_sends', 'communication_logs',
      'email_campaigns', 'email_sequence_steps', 'email_campaign_enrollments',
      'pipeline_stages', 'lead_assignments', 'tasks', 'pipeline_history',
      'admin_preferences', 'audit_logs', 'outreach_emails', 'icp_criteria',
      'chatbot_conversations', 'chatbot_issues'
    ].sort();
  }

  async createBackupSchedule(schedule: InsertBackupSchedule): Promise<BackupSchedule> {
    const [created] = await db
      .insert(backupSchedules)
      .values(schedule)
      .returning();
    return created;
  }

  async getAllBackupSchedules(): Promise<BackupSchedule[]> {
    return await db
      .select()
      .from(backupSchedules)
      .orderBy(desc(backupSchedules.createdAt));
  }

  async getBackupSchedule(id: string): Promise<BackupSchedule | undefined> {
    const [schedule] = await db
      .select()
      .from(backupSchedules)
      .where(eq(backupSchedules.id, id));
    return schedule;
  }

  async updateBackupSchedule(id: string, updates: Partial<InsertBackupSchedule>): Promise<BackupSchedule | undefined> {
    const [updated] = await db
      .update(backupSchedules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(backupSchedules.id, id))
      .returning();
    return updated;
  }

  async deleteBackupSchedule(id: string): Promise<void> {
    await db.delete(backupSchedules).where(eq(backupSchedules.id, id));
  }

  async getDueBackupSchedules(now: Date, lookaheadMinutes: number = 1): Promise<BackupSchedule[]> {
    const lookahead = new Date(now.getTime() + lookaheadMinutes * 60 * 1000);
    
    return await db
      .select()
      .from(backupSchedules)
      .where(
        and(
          eq(backupSchedules.isActive, true),
          eq(backupSchedules.isRunning, false),
          sql`${backupSchedules.nextRun} <= ${lookahead}`
        )
      )
      .orderBy(backupSchedules.nextRun);
  }

  async markScheduleRunning(id: string, lockedUntil: Date): Promise<boolean> {
    try {
      const [updated] = await db
        .update(backupSchedules)
        .set({
          isRunning: true,
          startedAt: new Date(),
          lockedUntil,
        })
        .where(
          and(
            eq(backupSchedules.id, id),
            eq(backupSchedules.isRunning, false)
          )
        )
        .returning();
      
      return !!updated;
    } catch (error) {
      console.error(`Failed to mark schedule ${id} as running:`, error);
      return false;
    }
  }

  async releaseStuckSchedule(id: string): Promise<void> {
    await db
      .update(backupSchedules)
      .set({
        isRunning: false,
        startedAt: null,
        lockedUntil: null,
      })
      .where(eq(backupSchedules.id, id));
  }

  async completeSchedule(id: string, runInfo: {
    success: boolean;
    error?: string;
    nextRun: Date;
  }): Promise<void> {
    // Get current schedule to access consecutiveFailures
    const schedule = await this.getBackupSchedule(id);
    if (!schedule) return;

    const consecutiveFailures = runInfo.success 
      ? 0 
      : (schedule.consecutiveFailures || 0) + 1;

    await db
      .update(backupSchedules)
      .set({
        isRunning: false,
        startedAt: null,
        lockedUntil: null,
        lastRun: new Date(),
        lastRunStatus: runInfo.success ? 'success' : 'error',
        lastRunError: runInfo.error || null,
        nextRun: runInfo.nextRun,
        consecutiveFailures,
        updatedAt: new Date(),
      })
      .where(eq(backupSchedules.id, id));
  }

  async cleanupOldBackupsBySchedule(tableName: string, retentionCount: number): Promise<number> {
    // Get all backups for this table, ordered by creation date (newest first)
    const allBackups = await db
      .select()
      .from(backupSnapshots)
      .where(eq(backupSnapshots.tableName, tableName))
      .orderBy(desc(backupSnapshots.createdAt));

    // If we have more backups than retention allows, delete the oldest ones
    if (allBackups.length <= retentionCount) {
      return 0;
    }

    const backupsToDelete = allBackups.slice(retentionCount);
    let deletedCount = 0;

    for (const backup of backupsToDelete) {
      try {
        await this.deleteBackup(backup.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete old backup ${backup.id}:`, error);
      }
    }

    return deletedCount;
  }

  async getDatabaseStorageMetrics(): Promise<{
    currentUsageBytes: number;
    projectedBackupBytes: number;
    totalProjectedBytes: number;
    limitBytes: number;
    currentUsagePercent: number;
    projectedUsagePercent: number;
    tableBreakdown: Array<{
      tableName: string;
      sizeBytes: number;
      scheduledBackupCount: number;
      estimatedBackupBytes: number;
    }>;
  }> {
    const LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10 GiB

    // Query PostgreSQL system catalogs to get table sizes
    // pg_total_relation_size includes table data, indexes, and TOAST data
    const tableSizesResult = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        pg_total_relation_size(schemaname || '.' || tablename) as size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
    `);

    // Calculate total current database size
    const currentUsageBytes = tableSizesResult.rows.reduce(
      (sum, row: any) => sum + parseInt(row.size_bytes || '0', 10),
      0
    );

    // Get all active backup schedules
    const activeSchedules = await db
      .select()
      .from(backupSchedules)
      .where(eq(backupSchedules.isActive, true));

    // Create a map of table names to their sizes
    const tableSizeMap = new Map<string, number>();
    for (const row of tableSizesResult.rows) {
      const record = row as any;
      tableSizeMap.set(record.tablename, parseInt(record.size_bytes || '0', 10));
    }

    // Count schedules per table
    const scheduleCountMap = new Map<string, number>();
    for (const schedule of activeSchedules) {
      const count = scheduleCountMap.get(schedule.tableName) || 0;
      scheduleCountMap.set(schedule.tableName, count + 1);
    }

    // Calculate projected backup storage
    const tableBreakdown: Array<{
      tableName: string;
      sizeBytes: number;
      scheduledBackupCount: number;
      estimatedBackupBytes: number;
    }> = [];

    let projectedBackupBytes = 0;

    for (const schedule of activeSchedules) {
      const tableSize = tableSizeMap.get(schedule.tableName) || 0;
      const retentionCount = schedule.retentionCount || 7;
      
      // Each schedule will create retentionCount backups of the table
      const estimatedBytes = tableSize * retentionCount;
      projectedBackupBytes += estimatedBytes;

      // Check if we already have this table in breakdown
      const existing = tableBreakdown.find(t => t.tableName === schedule.tableName);
      if (existing) {
        existing.scheduledBackupCount++;
        existing.estimatedBackupBytes += estimatedBytes;
      } else {
        tableBreakdown.push({
          tableName: schedule.tableName,
          sizeBytes: tableSize,
          scheduledBackupCount: 1,
          estimatedBackupBytes: estimatedBytes,
        });
      }
    }

    const totalProjectedBytes = currentUsageBytes + projectedBackupBytes;
    const currentUsagePercent = (currentUsageBytes / LIMIT_BYTES) * 100;
    const projectedUsagePercent = (totalProjectedBytes / LIMIT_BYTES) * 100;

    return {
      currentUsageBytes,
      projectedBackupBytes,
      totalProjectedBytes,
      limitBytes: LIMIT_BYTES,
      currentUsagePercent,
      projectedUsagePercent,
      tableBreakdown: tableBreakdown.sort((a, b) => b.estimatedBackupBytes - a.estimatedBackupBytes),
    };
  }
}

export const storage = new DatabaseStorage();
