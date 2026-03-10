import { createRequire } from 'module';
import { fileURLToPath as _fileURLToPath } from 'url';
import { dirname as _dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = _fileURLToPath(import.meta.url);
const __dirname = _dirname(__filename);
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/security.ts
import rateLimit from "express-rate-limit";
var globalMax, globalLimiter, authLimiter, adminLimiter, paymentLimiter, leadLimiter, unsubscribeVerifyLimiter, unsubscribeProcessLimiter, helmetConfig;
var init_security = __esm({
  "server/security.ts"() {
    "use strict";
    globalMax = process.env.NODE_ENV === "development" ? 1e4 : 1e3;
    globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1e3,
      // 15 minutes
      max: globalMax,
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false
    });
    authLimiter = rateLimit({
      windowMs: 15 * 60 * 1e3,
      // 15 minutes
      max: 10,
      // Limit each IP to 10 login attempts per window
      message: "Too many login attempts, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true
      // Don't count successful requests
    });
    adminLimiter = rateLimit({
      windowMs: 15 * 60 * 1e3,
      // 15 minutes  
      max: 100,
      // Limit admin operations
      message: "Too many requests to admin endpoints, please try again later.",
      standardHeaders: true,
      legacyHeaders: false
    });
    paymentLimiter = rateLimit({
      windowMs: 60 * 60 * 1e3,
      // 1 hour
      max: 20,
      // Limit payment attempts
      message: "Too many payment attempts, please try again later.",
      standardHeaders: true,
      legacyHeaders: false
    });
    leadLimiter = rateLimit({
      windowMs: 60 * 60 * 1e3,
      // 1 hour
      max: 10,
      // Limit lead submissions per hour
      message: "Too many submissions, please try again later.",
      standardHeaders: true,
      legacyHeaders: false
    });
    unsubscribeVerifyLimiter = rateLimit({
      windowMs: 5 * 60 * 1e3,
      // 5 minutes
      max: 60,
      // Accommodate shared-IP bursts (corporate networks, NAT)
      message: "Too many verification requests, please try again in a few minutes.",
      standardHeaders: true,
      legacyHeaders: false
    });
    unsubscribeProcessLimiter = rateLimit({
      windowMs: 5 * 60 * 1e3,
      // 5 minutes
      max: 10,
      // Protect write path from abuse while allowing legitimate retries
      message: "Too many unsubscribe attempts, please try again in a few minutes.",
      standardHeaders: true,
      legacyHeaders: false
    });
    helmetConfig = {
      contentSecurityPolicy: false,
      // Disabled for Replit infrastructure + 3rd party resources
      crossOriginEmbedderPolicy: false,
      // Allow embedding third-party resources (YouTube, Cloudinary, Google Fonts)
      hsts: {
        maxAge: 31536e3,
        // 1 year
        includeSubDomains: true,
        preload: true
      }
    };
  }
});

// server/app.ts
var app_exports = {};
__export(app_exports, {
  app: () => app
});
import express from "express";
import helmet from "helmet";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app;
var init_app = __esm({
  "server/app.ts"() {
    "use strict";
    init_security();
    app = express();
    app.use(helmet(helmetConfig));
    app.use(globalLimiter);
    app.use(express.json({
      limit: "50mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    }));
    app.use(express.urlencoded({ extended: false, limit: "50mb" }));
    app.use((req, res, next) => {
      const start = Date.now();
      const reqPath = req.path;
      let capturedJsonResponse = void 0;
      const originalResJson = res.json;
      res.json = function(bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };
      res.on("finish", () => {
        const duration = Date.now() - start;
        if (reqPath.startsWith("/api")) {
          let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }
          if (logLine.length > 80) {
            logLine = logLine.slice(0, 79) + "\u2026";
          }
          log(logLine);
        }
      });
      next();
    });
  }
});

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  abTestAssignments: () => abTestAssignments,
  abTestAutomationRuleMetrics: () => abTestAutomationRuleMetrics,
  abTestAutomationRules: () => abTestAutomationRules,
  abTestAutomationRuns: () => abTestAutomationRuns,
  abTestEvents: () => abTestEvents,
  abTestPerformanceBaselines: () => abTestPerformanceBaselines,
  abTestSafetyLimits: () => abTestSafetyLimits,
  abTestSourceEnum: () => abTestSourceEnum,
  abTestTargets: () => abTestTargets,
  abTestVariantAiGenerations: () => abTestVariantAiGenerations,
  abTestVariantConfigurationSchema: () => abTestVariantConfigurationSchema,
  abTestVariants: () => abTestVariants,
  abTests: () => abTests,
  acquisitionChannels: () => acquisitionChannels,
  adminEntitlements: () => adminEntitlements,
  adminImpersonationSessions: () => adminImpersonationSessions,
  adminPreferences: () => adminPreferences,
  aiCopyGenerations: () => aiCopyGenerations,
  auditLogs: () => auditLogs,
  backupSchedules: () => backupSchedules,
  backupSnapshots: () => backupSnapshots,
  batchContentReorderSchema: () => batchContentReorderSchema,
  campaignCommunications: () => campaignCommunications,
  campaignMembers: () => campaignMembers,
  campaignTestimonials: () => campaignTestimonials,
  cardOrderConfigSchema: () => cardOrderConfigSchema,
  channelSpendLedger: () => channelSpendLedger,
  chatbotConversations: () => chatbotConversations,
  chatbotIssues: () => chatbotIssues,
  communicationLogs: () => communicationLogs,
  contentItems: () => contentItems,
  contentOrderUpdateSchema: () => contentOrderUpdateSchema,
  contentVisibility: () => contentVisibility,
  donationCampaigns: () => donationCampaigns,
  donations: () => donations2,
  donorEconomics: () => donorEconomics,
  donorLifecycleStages: () => donorLifecycleStages,
  economicsSettings: () => economicsSettings,
  emailArraySchema: () => emailArraySchema,
  emailCampaignEnrollments: () => emailCampaignEnrollments,
  emailCampaigns: () => emailCampaigns,
  emailClicks: () => emailClicks,
  emailLinks: () => emailLinks,
  emailLogs: () => emailLogs,
  emailOpens: () => emailOpens,
  emailReportSchedules: () => emailReportSchedules,
  emailSendTimeInsights: () => emailSendTimeInsights,
  emailSequenceSteps: () => emailSequenceSteps,
  emailTemplates: () => emailTemplates,
  emailUnsubscribes: () => emailUnsubscribes,
  frequencyEnumSchema: () => frequencyEnumSchema,
  funnelProgressionHistory: () => funnelProgressionHistory,
  funnelProgressionRules: () => funnelProgressionRules,
  googleReviews: () => googleReviews,
  icpCriteria: () => icpCriteria,
  imageAssets: () => imageAssets,
  insertAbTestAssignmentSchema: () => insertAbTestAssignmentSchema,
  insertAbTestAutomationRuleMetricSchema: () => insertAbTestAutomationRuleMetricSchema,
  insertAbTestAutomationRuleSchema: () => insertAbTestAutomationRuleSchema,
  insertAbTestAutomationRunSchema: () => insertAbTestAutomationRunSchema,
  insertAbTestEventSchema: () => insertAbTestEventSchema,
  insertAbTestPerformanceBaselineSchema: () => insertAbTestPerformanceBaselineSchema,
  insertAbTestSafetyLimitSchema: () => insertAbTestSafetyLimitSchema,
  insertAbTestSchema: () => insertAbTestSchema,
  insertAbTestTargetSchema: () => insertAbTestTargetSchema,
  insertAbTestVariantAiGenerationSchema: () => insertAbTestVariantAiGenerationSchema,
  insertAbTestVariantSchema: () => insertAbTestVariantSchema,
  insertAcquisitionChannelSchema: () => insertAcquisitionChannelSchema,
  insertAdminEntitlementSchema: () => insertAdminEntitlementSchema,
  insertAdminImpersonationSessionSchema: () => insertAdminImpersonationSessionSchema,
  insertAdminPreferencesSchema: () => insertAdminPreferencesSchema,
  insertAiCopyGenerationSchema: () => insertAiCopyGenerationSchema,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertBackupScheduleSchema: () => insertBackupScheduleSchema,
  insertBackupSnapshotSchema: () => insertBackupSnapshotSchema,
  insertCampaignCommunicationSchema: () => insertCampaignCommunicationSchema,
  insertCampaignMemberSchema: () => insertCampaignMemberSchema,
  insertCampaignTestimonialSchema: () => insertCampaignTestimonialSchema,
  insertChannelSpendLedgerSchema: () => insertChannelSpendLedgerSchema,
  insertChatbotConversationSchema: () => insertChatbotConversationSchema,
  insertChatbotIssueSchema: () => insertChatbotIssueSchema,
  insertCommunicationLogSchema: () => insertCommunicationLogSchema,
  insertContentItemSchema: () => insertContentItemSchema,
  insertContentVisibilitySchema: () => insertContentVisibilitySchema,
  insertDonationCampaignSchema: () => insertDonationCampaignSchema,
  insertDonationSchema: () => insertDonationSchema,
  insertDonorEconomicsSchema: () => insertDonorEconomicsSchema,
  insertDonorLifecycleStageSchema: () => insertDonorLifecycleStageSchema,
  insertEconomicsSettingsSchema: () => insertEconomicsSettingsSchema,
  insertEmailCampaignEnrollmentSchema: () => insertEmailCampaignEnrollmentSchema,
  insertEmailCampaignSchema: () => insertEmailCampaignSchema,
  insertEmailClickSchema: () => insertEmailClickSchema,
  insertEmailLinkSchema: () => insertEmailLinkSchema,
  insertEmailLogSchema: () => insertEmailLogSchema,
  insertEmailOpenSchema: () => insertEmailOpenSchema,
  insertEmailReportScheduleSchema: () => insertEmailReportScheduleSchema,
  insertEmailSendTimeInsightSchema: () => insertEmailSendTimeInsightSchema,
  insertEmailSequenceStepSchema: () => insertEmailSequenceStepSchema,
  insertEmailTemplateSchema: () => insertEmailTemplateSchema,
  insertEmailUnsubscribeSchema: () => insertEmailUnsubscribeSchema,
  insertFunnelProgressionHistorySchema: () => insertFunnelProgressionHistorySchema,
  insertFunnelProgressionRuleSchema: () => insertFunnelProgressionRuleSchema,
  insertGoogleReviewSchema: () => insertGoogleReviewSchema,
  insertIcpCriteriaSchema: () => insertIcpCriteriaSchema,
  insertImageAssetSchema: () => insertImageAssetSchema,
  insertInteractionSchema: () => insertInteractionSchema,
  insertLeadAssignmentSchema: () => insertLeadAssignmentSchema,
  insertLeadAttributionSchema: () => insertLeadAttributionSchema,
  insertLeadMagnetSchema: () => insertLeadMagnetSchema,
  insertLeadSchema: () => insertLeadSchema,
  insertMarketingCampaignSchema: () => insertMarketingCampaignSchema,
  insertMetricWeightProfileMetricSchema: () => insertMetricWeightProfileMetricSchema,
  insertMetricWeightProfileSchema: () => insertMetricWeightProfileSchema,
  insertOrganizationSchema: () => insertOrganizationSchema,
  insertOutreachEmailSchema: () => insertOutreachEmailSchema,
  insertPipelineHistorySchema: () => insertPipelineHistorySchema,
  insertPipelineStageSchema: () => insertPipelineStageSchema,
  insertProgramSchema: () => insertProgramSchema,
  insertSegmentSchema: () => insertSegmentSchema,
  insertSmsBulkCampaignSchema: () => insertSmsBulkCampaignSchema,
  insertSmsLogSchema: () => insertSmsLogSchema,
  insertSmsSendSchema: () => insertSmsSendSchema,
  insertSmsTemplateSchema: () => insertSmsTemplateSchema,
  insertStudentSubmissionSchema: () => insertStudentSubmissionSchema,
  insertTaskSchema: () => insertTaskSchema,
  insertTechGoesHomeAttendanceSchema: () => insertTechGoesHomeAttendanceSchema,
  insertTechGoesHomeEnrollmentSchema: () => insertTechGoesHomeEnrollmentSchema,
  insertVolunteerEnrollmentSchema: () => insertVolunteerEnrollmentSchema,
  insertVolunteerEventSchema: () => insertVolunteerEventSchema,
  insertVolunteerSessionLogSchema: () => insertVolunteerSessionLogSchema,
  insertVolunteerShiftSchema: () => insertVolunteerShiftSchema,
  insertWishlistItemSchema: () => insertWishlistItemSchema,
  interactions: () => interactions,
  layoutConfigSchema: () => layoutConfigSchema,
  leadAssignments: () => leadAssignments,
  leadAttribution: () => leadAttribution,
  leadMagnets: () => leadMagnets,
  leadStatusEnum: () => leadStatusEnum,
  leads: () => leads,
  marketingCampaigns: () => marketingCampaigns,
  metricWeightProfileMetrics: () => metricWeightProfileMetrics,
  metricWeightProfiles: () => metricWeightProfiles,
  organizationTierEnum: () => organizationTierEnum,
  organizations: () => organizations,
  outreachEmails: () => outreachEmails,
  pipelineHistory: () => pipelineHistory,
  pipelineStages: () => pipelineStages,
  presentationOverrideConfigSchema: () => presentationOverrideConfigSchema,
  programDetailMetadataSchema: () => programDetailMetadataSchema,
  programs: () => programs,
  reportTypeEnumSchema: () => reportTypeEnumSchema,
  segmentFiltersSchema: () => segmentFiltersSchema,
  segments: () => segments,
  serviceMetadataSchema: () => serviceMetadataSchema,
  sessions: () => sessions,
  smsBulkCampaigns: () => smsBulkCampaigns2,
  smsLogs: () => smsLogs,
  smsSends: () => smsSends,
  smsTemplates: () => smsTemplates,
  studentDashboardCardMetadataSchema: () => studentDashboardCardMetadataSchema,
  tasks: () => tasks,
  techGoesHomeAttendance: () => techGoesHomeAttendance,
  techGoesHomeEnrollments: () => techGoesHomeEnrollments,
  updateContentItemSchema: () => updateContentItemSchema,
  updateDonationCampaignSchema: () => updateDonationCampaignSchema,
  updateEmailReportScheduleSchema: () => updateEmailReportScheduleSchema,
  updateLeadSchema: () => updateLeadSchema,
  updateSegmentSchema: () => updateSegmentSchema,
  updateUserProfileSchema: () => updateUserProfileSchema,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  volunteerDashboardCardMetadataSchema: () => volunteerDashboardCardMetadataSchema,
  volunteerEnrollments: () => volunteerEnrollments,
  volunteerEvents: () => volunteerEvents,
  volunteerSessionLogs: () => volunteerSessionLogs,
  volunteerShifts: () => volunteerShifts,
  wishlistItems: () => wishlistItems
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, boolean, integer, uniqueIndex, numeric, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions, userRoleEnum, organizationTierEnum, organizations, insertOrganizationSchema, users, updateUserProfileSchema, adminPreferences, insertAdminPreferencesSchema, auditLogs, insertAuditLogSchema, leads, insertLeadSchema, leadStatusEnum, updateLeadSchema, interactions, insertInteractionSchema, pipelineStages, insertPipelineStageSchema, leadAssignments, insertLeadAssignmentSchema, tasks, insertTaskSchema, pipelineHistory, insertPipelineHistorySchema, funnelProgressionRules, insertFunnelProgressionRuleSchema, funnelProgressionHistory, insertFunnelProgressionHistorySchema, leadMagnets, insertLeadMagnetSchema, imageAssets, insertImageAssetSchema, contentItems, insertContentItemSchema, updateContentItemSchema, contentOrderUpdateSchema, batchContentReorderSchema, insertStudentSubmissionSchema, studentDashboardCardMetadataSchema, volunteerDashboardCardMetadataSchema, serviceMetadataSchema, programDetailMetadataSchema, contentVisibility, insertContentVisibilitySchema, metricWeightProfiles, insertMetricWeightProfileSchema, metricWeightProfileMetrics, insertMetricWeightProfileMetricSchema, abTestAutomationRules, insertAbTestAutomationRuleSchema, abTestAutomationRuleMetrics, insertAbTestAutomationRuleMetricSchema, abTestPerformanceBaselines, insertAbTestPerformanceBaselineSchema, abTestVariantAiGenerations, insertAbTestVariantAiGenerationSchema, abTestAutomationRuns, insertAbTestAutomationRunSchema, abTestSafetyLimits, insertAbTestSafetyLimitSchema, abTestSourceEnum, abTests, insertAbTestSchema, abTestTargets, insertAbTestTargetSchema, abTestVariants, insertAbTestVariantSchema, presentationOverrideConfigSchema, cardOrderConfigSchema, layoutConfigSchema, abTestVariantConfigurationSchema, abTestAssignments, insertAbTestAssignmentSchema, abTestEvents, insertAbTestEventSchema, googleReviews, insertGoogleReviewSchema, donations2, insertDonationSchema, wishlistItems, insertWishlistItemSchema, emailTemplates, insertEmailTemplateSchema, aiCopyGenerations, insertAiCopyGenerationSchema, emailCampaigns, insertEmailCampaignSchema, emailSequenceSteps, insertEmailSequenceStepSchema, emailCampaignEnrollments, insertEmailCampaignEnrollmentSchema, smsTemplates, insertSmsTemplateSchema, smsSends, insertSmsSendSchema, smsBulkCampaigns2, insertSmsBulkCampaignSchema, communicationLogs, insertCommunicationLogSchema, emailLogs, insertEmailLogSchema, emailOpens, insertEmailOpenSchema, emailLinks, insertEmailLinkSchema, emailClicks, insertEmailClickSchema, emailSendTimeInsights, insertEmailSendTimeInsightSchema, emailReportSchedules, emailArraySchema, frequencyEnumSchema, reportTypeEnumSchema, insertEmailReportScheduleSchema, updateEmailReportScheduleSchema, smsLogs, insertSmsLogSchema, donationCampaigns, insertDonationCampaignSchema, updateDonationCampaignSchema, campaignCommunications, insertCampaignCommunicationSchema, campaignMembers, insertCampaignMemberSchema, campaignTestimonials, insertCampaignTestimonialSchema, outreachEmails, insertOutreachEmailSchema, icpCriteria, insertIcpCriteriaSchema, chatbotConversations, insertChatbotConversationSchema, chatbotIssues, insertChatbotIssueSchema, backupSnapshots, insertBackupSnapshotSchema, backupSchedules, insertBackupScheduleSchema, acquisitionChannels, insertAcquisitionChannelSchema, marketingCampaigns, insertMarketingCampaignSchema, leadAttribution, insertLeadAttributionSchema, donorLifecycleStages, insertDonorLifecycleStageSchema, channelSpendLedger, insertChannelSpendLedgerSchema, donorEconomics, insertDonorEconomicsSchema, economicsSettings, insertEconomicsSettingsSchema, techGoesHomeEnrollments, insertTechGoesHomeEnrollmentSchema, techGoesHomeAttendance, insertTechGoesHomeAttendanceSchema, volunteerEvents, insertVolunteerEventSchema, volunteerShifts, insertVolunteerShiftSchema, volunteerEnrollments, insertVolunteerEnrollmentSchema, volunteerSessionLogs, insertVolunteerSessionLogSchema, segments, segmentFiltersSchema, insertSegmentSchema, updateSegmentSchema, emailUnsubscribes, insertEmailUnsubscribeSchema, programs, insertProgramSchema, adminEntitlements, insertAdminEntitlementSchema, adminImpersonationSessions, insertAdminImpersonationSessionSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    userRoleEnum = z.enum(["client", "admin", "super_admin"]);
    organizationTierEnum = z.enum(["basic", "pro", "premium"]);
    organizations = pgTable("organizations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      tier: varchar("tier").notNull().default("basic"),
      // basic, pro, premium
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertOrganizationSchema = createInsertSchema(organizations).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      oidcSub: varchar("oidc_sub").unique(),
      // OIDC subject identifier
      email: varchar("email").unique(),
      firstName: varchar("first_name"),
      lastName: varchar("last_name"),
      profileImageUrl: varchar("profile_image_url"),
      persona: varchar("persona"),
      // Stored persona preference: student, provider, parent, donor, volunteer
      passions: jsonb("passions"),
      // Array of passion tags: ['literacy', 'stem', 'arts', 'nutrition', 'community']
      role: varchar("role").notNull().default("client"),
      // client, admin, super_admin
      isAdmin: boolean("is_admin").default(false),
      // DEPRECATED: Use role instead. Kept for backward compatibility during migration.
      stripeCustomerId: varchar("stripe_customer_id").unique(),
      // Stripe Customer ID for saved payment methods
      organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "set null" }),
      // Organization membership for tier-based access
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    updateUserProfileSchema = z.object({
      firstName: z.string().trim().min(1, "First name is required").max(100),
      lastName: z.string().trim().min(1, "Last name is required").max(100),
      profileImageUrl: z.union([
        z.string().url(),
        // Full URLs like https://...
        z.string().regex(/^\/objects\/[a-zA-Z0-9/_-]+(\.[a-zA-Z0-9]+)?$/, "Invalid storage path"),
        // Safe storage paths only: /objects/...
        z.literal("")
        // Empty string
      ]).optional().nullable(),
      persona: z.enum(["student", "provider", "parent", "donor", "volunteer"]).optional().nullable(),
      passions: z.array(z.enum(["literacy", "stem", "arts", "nutrition", "community"])).optional().nullable()
    }).strict();
    adminPreferences = pgTable("admin_preferences", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
      // Notification Preferences
      newLeadAlerts: boolean("new_lead_alerts").default(true),
      taskAssignmentAlerts: boolean("task_assignment_alerts").default(true),
      taskCompletionAlerts: boolean("task_completion_alerts").default(true),
      donationAlerts: boolean("donation_alerts").default(true),
      emailCampaignAlerts: boolean("email_campaign_alerts").default(false),
      calendarEventReminders: boolean("calendar_event_reminders").default(true),
      notificationChannels: jsonb("notification_channels").default(["email"]),
      // email, sms, in-app
      // Workflow Preferences
      autoAssignNewLeads: boolean("auto_assign_new_leads").default(false),
      defaultTaskDueDateOffset: integer("default_task_due_date_offset").default(3),
      // days
      defaultLeadSource: varchar("default_lead_source"),
      defaultLeadStatus: varchar("default_lead_status").default("new_lead"),
      preferredPipelineView: varchar("preferred_pipeline_view").default("kanban"),
      // kanban, list, table
      // Interface Preferences
      defaultLandingPage: varchar("default_landing_page").default("/admin"),
      theme: varchar("theme").default("system"),
      // light, dark, system
      itemsPerPage: integer("items_per_page").default(25),
      dataDensity: varchar("data_density").default("comfortable"),
      // compact, comfortable, spacious
      defaultContentFilter: varchar("default_content_filter").default("all"),
      // all, or specific persona
      // Communication Preferences
      dailyDigestEnabled: boolean("daily_digest_enabled").default(false),
      weeklyReportEnabled: boolean("weekly_report_enabled").default(true),
      criticalAlertsOnly: boolean("critical_alerts_only").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertAdminPreferencesSchema = createInsertSchema(adminPreferences).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    auditLogs = pgTable("audit_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
      // User who was affected (nullable to preserve audit trail)
      actorId: varchar("actor_id").references(() => users.id, { onDelete: "set null" }),
      // User who performed the action (nullable to preserve audit trail)
      action: varchar("action").notNull(),
      // role_changed, user_created, user_deleted
      previousRole: varchar("previous_role"),
      // For role changes
      newRole: varchar("new_role"),
      // For role changes
      metadata: jsonb("metadata"),
      // Additional context (emails, names, timestamps - preserved even after user deletion)
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("audit_logs_user_id_idx").on(table.userId),
      index("audit_logs_actor_id_idx").on(table.actorId),
      index("audit_logs_created_at_idx").on(table.createdAt)
    ]);
    insertAuditLogSchema = createInsertSchema(auditLogs).omit({
      id: true,
      createdAt: true
    });
    leads = pgTable("leads", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: varchar("email").notNull(),
      firstName: varchar("first_name"),
      lastName: varchar("last_name"),
      phone: varchar("phone"),
      persona: varchar("persona").notNull(),
      // student, provider, parent, donor, volunteer
      funnelStage: varchar("funnel_stage").notNull(),
      // awareness, consideration, decision, retention
      leadStatus: varchar("lead_status").notNull().default("active"),
      // active, nurture, disqualified, unresponsive - tracks engagement level
      pipelineStage: varchar("pipeline_stage").default("new_lead"),
      // References pipeline stages: new_lead, contacted, qualified, etc.
      leadSource: varchar("lead_source"),
      // organic, referral, ad, etc
      engagementScore: integer("engagement_score").default(0),
      lastInteractionDate: timestamp("last_interaction_date"),
      lastFunnelUpdateAt: timestamp("last_funnel_update_at"),
      // Tracks when funnel stage was last evaluated/changed
      convertedAt: timestamp("converted_at"),
      notes: text("notes"),
      passions: jsonb("passions"),
      // Array of passion tags for donor targeting: ['literacy', 'stem', 'arts', 'nutrition', 'community']
      metadata: jsonb("metadata"),
      // Additional data like quiz answers, form submissions
      // Lead Sourcing & Qualification Fields
      company: varchar("company"),
      // Company/organization name
      jobTitle: varchar("job_title"),
      // Job title/role
      linkedinUrl: varchar("linkedin_url"),
      // LinkedIn profile URL
      qualificationScore: integer("qualification_score"),
      // AI-generated score 0-100
      qualificationStatus: varchar("qualification_status").default("pending"),
      // pending, qualified, disqualified, review_needed
      qualificationInsights: text("qualification_insights"),
      // AI-generated analysis of ICP fit
      enrichmentData: jsonb("enrichment_data"),
      // Company info, news, context, about, website, etc.
      outreachStatus: varchar("outreach_status").default("pending"),
      // pending, draft_ready, sent, opened, replied, bounced, unsubscribed
      lastOutreachAt: timestamp("last_outreach_at"),
      // Last time outreach was sent
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertLeadSchema = createInsertSchema(leads).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    leadStatusEnum = z.enum(["active", "nurture", "disqualified", "unresponsive"]);
    updateLeadSchema = z.object({
      email: z.string().email(),
      firstName: z.string().trim(),
      lastName: z.string().trim(),
      phone: z.string(),
      persona: z.enum(["student", "provider", "parent", "donor", "volunteer"]),
      funnelStage: z.enum(["awareness", "consideration", "decision", "retention"]),
      leadStatus: leadStatusEnum,
      pipelineStage: z.string(),
      leadSource: z.string(),
      engagementScore: z.number().int().min(0),
      lastInteractionDate: z.union([z.date(), z.string().transform((val) => new Date(val))]),
      lastFunnelUpdateAt: z.union([z.date(), z.string().transform((val) => new Date(val))]),
      convertedAt: z.union([z.date(), z.string().transform((val) => new Date(val))]),
      notes: z.string(),
      passions: z.any(),
      // JSONB
      metadata: z.any(),
      // JSONB
      company: z.string(),
      jobTitle: z.string(),
      linkedinUrl: z.string().url(),
      qualificationScore: z.number().int().min(0).max(100),
      qualificationStatus: z.enum(["pending", "qualified", "disqualified", "review_needed"]),
      qualificationInsights: z.string(),
      enrichmentData: z.any(),
      // JSONB
      outreachStatus: z.enum(["pending", "draft_ready", "sent", "opened", "replied", "bounced", "unsubscribed"]),
      lastOutreachAt: z.union([z.date(), z.string().transform((val) => new Date(val))])
    }).strict().partial();
    interactions = pgTable("interactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
      interactionType: varchar("interaction_type").notNull(),
      // quiz, download, form_submit, call_scheduled, etc
      contentEngaged: varchar("content_engaged"),
      // Name of the lead magnet or content
      notes: text("notes"),
      // Optional notes about the interaction
      data: jsonb("data"),
      // Quiz answers, form data, etc
      createdAt: timestamp("created_at").defaultNow()
    });
    insertInteractionSchema = createInsertSchema(interactions).omit({
      id: true,
      createdAt: true
    });
    pipelineStages = pgTable("pipeline_stages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      // New Lead, Contacted, Qualified, Nurturing, Converted, Lost
      slug: varchar("slug").notNull().unique(),
      // new_lead, contacted, qualified, etc. - canonical identifier for pipelineStage field
      description: text("description"),
      position: integer("position").notNull(),
      // Order of stages (1, 2, 3, etc.)
      color: varchar("color"),
      // UI color for kanban board
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertPipelineStageSchema = createInsertSchema(pipelineStages).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    leadAssignments = pgTable("lead_assignments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
      assignedTo: varchar("assigned_to").notNull().references(() => users.id, { onDelete: "cascade" }),
      assignedBy: varchar("assigned_by").references(() => users.id),
      // Who made the assignment
      assignmentType: varchar("assignment_type").notNull(),
      // 'manual', 'auto_persona', 'auto_geography', 'auto_round_robin'
      notes: text("notes"),
      // Reason for assignment
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertLeadAssignmentSchema = createInsertSchema(leadAssignments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    tasks = pgTable("tasks", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
      assignedTo: varchar("assigned_to").notNull().references(() => users.id, { onDelete: "cascade" }),
      createdBy: varchar("created_by").references(() => users.id),
      title: varchar("title").notNull(),
      description: text("description"),
      taskType: varchar("task_type").notNull(),
      // 'call', 'email', 'meeting', 'follow_up', 'send_materials', 'other'
      priority: varchar("priority").notNull().default("medium"),
      // 'low', 'medium', 'high', 'urgent'
      status: varchar("status").notNull().default("pending"),
      // 'pending', 'in_progress', 'completed', 'cancelled'
      dueDate: timestamp("due_date"),
      completedAt: timestamp("completed_at"),
      isAutomated: boolean("is_automated").default(false),
      // True if auto-created by trigger
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("tasks_assigned_to_idx").on(table.assignedTo),
      index("tasks_lead_id_idx").on(table.leadId),
      index("tasks_status_idx").on(table.status)
    ]);
    insertTaskSchema = createInsertSchema(tasks).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    pipelineHistory = pgTable("pipeline_history", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
      fromStage: varchar("from_stage"),
      // Null for first entry
      toStage: varchar("to_stage").notNull(),
      changedBy: varchar("changed_by").references(() => users.id),
      // Null if automated
      reason: text("reason"),
      // Optional reason for stage change
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("pipeline_history_lead_id_idx").on(table.leadId)
    ]);
    insertPipelineHistorySchema = createInsertSchema(pipelineHistory).omit({
      id: true,
      createdAt: true
    });
    funnelProgressionRules = pgTable("funnel_progression_rules", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      persona: varchar("persona").notNull(),
      // student, provider, parent, donor, volunteer
      fromStage: varchar("from_stage").notNull(),
      // awareness, consideration, decision
      toStage: varchar("to_stage").notNull(),
      // consideration, decision, retention
      // Threshold settings for progression
      engagementScoreThreshold: integer("engagement_score_threshold").notNull(),
      // Min engagement points to advance
      minimumDaysInStage: integer("minimum_days_in_stage").default(0),
      // Prevent premature advancement
      // Optional: High-value events that trigger instant progression (bypassing threshold)
      autoProgressEvents: jsonb("auto_progress_events"),
      // Array like ['donation_completed', 'enrollment_submitted']
      // Decay/regression rules for inactive leads
      inactivityDaysThreshold: integer("inactivity_days_threshold"),
      // Days without interaction before regression
      decayToStage: varchar("decay_to_stage"),
      // Stage to regress to on inactivity (null = no decay)
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("funnel_rules_persona_idx").on(table.persona),
      index("funnel_rules_transition_idx").on(table.fromStage, table.toStage),
      // Prevent duplicate rules for same persona+transition
      uniqueIndex("funnel_rules_unique_transition").on(table.persona, table.fromStage, table.toStage)
    ]);
    insertFunnelProgressionRuleSchema = createInsertSchema(funnelProgressionRules).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    funnelProgressionHistory = pgTable("funnel_progression_history", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
      fromStage: varchar("from_stage"),
      // Null for initial stage assignment
      toStage: varchar("to_stage").notNull(),
      // Context about the progression
      reason: varchar("reason").notNull(),
      // 'threshold_met', 'manual_override', 'high_value_event', 'inactivity_decay'
      triggeredBy: varchar("triggered_by").references(() => users.id),
      // User ID if manual override, null if automated
      engagementScoreAtChange: integer("engagement_score_at_change"),
      // Engagement score when change occurred
      triggerEvent: varchar("trigger_event"),
      // Specific interaction/event that caused progression
      metadata: jsonb("metadata"),
      // Additional context (rule applied, threshold details, etc.)
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("funnel_history_lead_id_idx").on(table.leadId),
      index("funnel_history_created_at_idx").on(table.createdAt),
      index("funnel_history_reason_idx").on(table.reason)
    ]);
    insertFunnelProgressionHistorySchema = createInsertSchema(funnelProgressionHistory).omit({
      id: true,
      createdAt: true
    });
    leadMagnets = pgTable("lead_magnets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      type: varchar("type").notNull(),
      // quiz, calculator, pdf, webinar, assessment
      persona: varchar("persona").notNull(),
      // Which persona this is for
      funnelStage: varchar("funnel_stage").notNull(),
      // Which stage of funnel
      description: text("description"),
      config: jsonb("config"),
      // Quiz questions, calculator fields, etc
      conversionRate: integer("conversion_rate").default(0),
      // Percentage
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertLeadMagnetSchema = createInsertSchema(leadMagnets).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    imageAssets = pgTable("image_assets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      // Descriptive name (e.g., "Hero Background - Students")
      originalFilename: varchar("original_filename"),
      // Original file name from upload
      localPath: varchar("local_path"),
      // Original local path (e.g., @assets/...)
      cloudinaryPublicId: varchar("cloudinary_public_id").notNull().unique(),
      // Cloudinary identifier
      cloudinaryUrl: varchar("cloudinary_url").notNull(),
      // Full Cloudinary URL
      cloudinarySecureUrl: varchar("cloudinary_secure_url").notNull(),
      // HTTPS URL
      width: integer("width"),
      // Original width
      height: integer("height"),
      // Original height
      format: varchar("format"),
      // Image format (jpg, png, webp, etc)
      fileSize: integer("file_size"),
      // File size in bytes
      usage: varchar("usage"),
      // Where it's used (hero, service, event, testimonial, logo, etc)
      isActive: boolean("is_active").default(true),
      uploadedBy: varchar("uploaded_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("image_assets_name_idx").on(table.name)
      // Index for content_items join performance
    ]);
    insertImageAssetSchema = createInsertSchema(imageAssets).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    contentItems = pgTable("content_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      type: varchar("type").notNull(),
      // 'service', 'event', 'testimonial', 'sponsor', 'lead_magnet', 'impact_stat', 'hero', 'cta', 'socialMedia', 'video', 'review', 'program_detail', 'student_project', 'student_testimonial', 'student_dashboard_card', 'volunteer_dashboard_card'
      title: text("title").notNull(),
      description: text("description"),
      imageName: varchar("image_name"),
      // Cloudinary image name (legacy)
      imageUrl: varchar("image_url"),
      // Object Storage path (new AI-powered naming)
      order: integer("order").notNull().default(0),
      // Display order
      isActive: boolean("is_active").default(true),
      passionTags: text("passion_tags").array(),
      // Array of passion tags for targeting (e.g., ['literacy', 'stem', 'arts'])
      metadata: jsonb("metadata"),
      // Additional data: For service: number, priority, linkedProgramDetailId. For program_detail: programId, overview, ageRange, schedule, location, cost, features, enrollmentSteps, faqs, defaultPersona. For event/testimonial: location, date, rating, icon. For socialMedia/video: videoId, category, platform. For student_project/student_testimonial: submittingUserId, submittingUserEmail, submittingUserName, programId, classId, files: [{url, alt, uploadedAt}], status: 'pending'|'approved'|'rejected', reviewedBy, reviewedAt, rejectionReason. For student_dashboard_card: buttonText, buttonLink, goalText, motivationalText. For volunteer_dashboard_card: buttonText, buttonLink, goalText, motivationalText
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      passionTagsIdx: index("content_items_passion_tags_idx").using("gin", table.passionTags)
    }));
    insertContentItemSchema = createInsertSchema(contentItems).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateContentItemSchema = z.object({
      type: z.enum(["service", "event", "testimonial", "sponsor", "lead_magnet", "impact_stat", "hero", "cta", "socialMedia", "video", "review", "program_detail", "student_project", "student_testimonial", "student_dashboard_card", "volunteer_dashboard_card"]).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      imageName: z.string().optional(),
      imageUrl: z.string().optional(),
      order: z.number().int().optional(),
      isActive: z.boolean().optional(),
      passionTags: z.array(z.string()).optional(),
      metadata: z.any().optional()
      // JSONB
    }).strict();
    contentOrderUpdateSchema = z.object({
      id: z.string(),
      order: z.number().int().finite()
    });
    batchContentReorderSchema = z.object({
      updates: z.array(contentOrderUpdateSchema).min(1, "Must provide at least one item to reorder"),
      contentType: z.string().optional()
      // Optional type hint for validation
    });
    insertStudentSubmissionSchema = z.object({
      type: z.enum(["student_project", "student_testimonial"]),
      title: z.string().min(1, "Title is required").max(200),
      description: z.string().min(1, "Description is required"),
      passionTags: z.array(z.enum(["literacy", "stem", "arts", "nutrition", "community"])).min(1, "Select at least one passion"),
      files: z.array(z.object({
        url: z.string(),
        alt: z.string().optional(),
        uploadedAt: z.string().optional()
      })).optional()
    });
    studentDashboardCardMetadataSchema = z.object({
      buttonText: z.string().min(1, "Button text is required").default("View My Dashboard"),
      buttonLink: z.string().min(1, "Button link is required").default("/dashboard"),
      goalText: z.string().optional(),
      // Optional override for "Goal: 15+ hours"
      motivationalText: z.string().optional()
      // Optional override for motivational messages
    }).strict();
    volunteerDashboardCardMetadataSchema = z.object({
      buttonText: z.string().min(1, "Button text is required").default("View My Volunteer Dashboard"),
      buttonLink: z.string().min(1, "Button link is required").default("/volunteer"),
      goalText: z.string().optional(),
      // Optional override for "Goal: 20+ hours this quarter"
      motivationalText: z.string().optional()
      // Optional override for motivational messages
    }).strict();
    serviceMetadataSchema = z.object({
      number: z.string().optional(),
      priority: z.record(z.number()).optional(),
      // { parent: 1, student: 2, ... }
      linkedProgramDetailId: z.string().optional()
      // Reference to a program_detail content item
    }).passthrough();
    programDetailMetadataSchema = z.object({
      programId: z.string().optional(),
      overview: z.string().optional(),
      ageRange: z.string().optional(),
      schedule: z.string().optional(),
      location: z.string().optional(),
      cost: z.string().optional(),
      features: z.array(z.string()).optional(),
      enrollmentSteps: z.array(z.string()).optional(),
      faqs: z.array(z.object({
        question: z.string(),
        answer: z.string()
      })).optional(),
      defaultPersona: z.enum(["student", "provider", "parent", "donor", "volunteer"]).optional()
    }).passthrough();
    contentVisibility = pgTable("content_visibility", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      contentItemId: varchar("content_item_id").notNull().references(() => contentItems.id, { onDelete: "cascade" }),
      persona: varchar("persona"),
      // null = applies to all personas
      funnelStage: varchar("funnel_stage"),
      // null = applies to all funnel stages
      isVisible: boolean("is_visible").default(true),
      order: integer("order").notNull().default(0),
      // Persona-specific ordering
      titleOverride: text("title_override"),
      // Custom title for this persona×stage combo
      descriptionOverride: text("description_override"),
      // Custom description for this persona×stage combo
      imageNameOverride: varchar("image_name_override"),
      // Custom image for this persona×stage combo
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      uniqueIndex("content_visibility_unique_idx").on(table.contentItemId, table.persona, table.funnelStage)
    ]);
    insertContentVisibilitySchema = createInsertSchema(contentVisibility).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    metricWeightProfiles = pgTable("metric_weight_profiles", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull().unique(),
      // 'hero_default', 'cta_donor_focused', 'card_engagement'
      contentType: varchar("content_type"),
      // Optional: 'hero', 'cta', 'card_order', 'layout', 'messaging' (null = general-purpose)
      persona: varchar("persona"),
      // Optional: specific persona optimization (null = all personas)
      description: text("description"),
      clickThroughWeight: integer("click_through_weight").notNull().default(30),
      // Percentage: 0-100
      engagementWeight: integer("engagement_weight").notNull().default(40),
      // Percentage: 0-100
      conversionWeight: integer("conversion_weight").notNull().default(30),
      // Percentage: 0-100
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("metric_profiles_content_type_idx").on(table.contentType),
      index("metric_profiles_persona_idx").on(table.persona)
    ]);
    insertMetricWeightProfileSchema = createInsertSchema(metricWeightProfiles).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    metricWeightProfileMetrics = pgTable("metric_weight_profile_metrics", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      profileId: varchar("profile_id").notNull().references(() => metricWeightProfiles.id, { onDelete: "cascade" }),
      metricKey: varchar("metric_key").notNull(),
      // 'page_view', 'cta_click', 'dwell_time', 'scroll_depth', 'conversion'
      weight: integer("weight").notNull().default(100),
      // 0-1000 (multiply by 0.001 for percentage)
      direction: varchar("direction").notNull().default("maximize"),
      // 'maximize' or 'minimize'
      minimumSample: integer("minimum_sample").default(30),
      // Minimum events before metric is considered
      maximumCap: integer("maximum_cap"),
      // Optional ceiling for outlier protection
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      uniqueIndex("metric_weight_profile_metrics_unique_idx").on(table.profileId, table.metricKey)
    ]);
    insertMetricWeightProfileMetricSchema = createInsertSchema(metricWeightProfileMetrics).omit({
      id: true,
      createdAt: true
    });
    abTestAutomationRules = pgTable("ab_test_automation_rules", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull().unique(),
      description: text("description"),
      // Scope configuration
      contentType: varchar("content_type").notNull(),
      // Which content type to optimize
      targetPersona: varchar("target_persona"),
      // Optional: null = all personas
      targetFunnelStage: varchar("target_funnel_stage"),
      // Optional: null = all stages
      // Trigger strategy
      triggerType: varchar("trigger_type").notNull().default("threshold"),
      // 'threshold', 'scheduled', 'manual'
      evaluationCadence: varchar("evaluation_cadence").default("daily"),
      // 'hourly', 'daily', 'weekly'
      // Performance thresholds for triggering new tests
      minimumBaselineSample: integer("minimum_baseline_sample").default(100),
      // Min views before evaluation
      performanceThresholdType: varchar("performance_threshold_type").default("percentile"),
      // 'percentile', 'absolute'
      performanceThresholdValue: integer("performance_threshold_value").default(25),
      // Bottom 25th percentile triggers test
      // AI generation settings
      aiProvider: varchar("ai_provider").default("gemini"),
      // 'gemini', 'openai' (future)
      aiModel: varchar("ai_model").default("gemini-2.0-flash-exp"),
      aiTemperature: integer("ai_temperature").default(70),
      // 0-100 (multiply by 0.01)
      variantsToGenerate: integer("variants_to_generate").default(2),
      // How many AI variants per test
      requiresManualApproval: boolean("requires_manual_approval").default(false),
      // Queue for review before launching
      // Safety limits
      maxConcurrentTests: integer("max_concurrent_tests").default(3),
      // Max simultaneous tests per rule
      cooldownPeriod: integer("cooldown_period").default(7),
      // Days between tests for same content
      // Statistical configuration
      minimumTestSample: integer("minimum_test_sample").default(100),
      // Min samples per variant for promotion
      confidenceThreshold: integer("confidence_threshold").default(95),
      // 95% confidence for winner
      minimumTestDuration: integer("minimum_test_duration").default(3),
      // Min days before promotion allowed
      // Status
      isActive: boolean("is_active").default(true),
      lastRunAt: timestamp("last_run_at"),
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("ab_automation_rules_content_type_idx").on(table.contentType),
      index("ab_automation_rules_active_idx").on(table.isActive),
      index("ab_automation_rules_next_run_idx").on(table.lastRunAt)
    ]);
    insertAbTestAutomationRuleSchema = createInsertSchema(abTestAutomationRules).omit({
      id: true,
      lastRunAt: true,
      createdAt: true,
      updatedAt: true
    });
    abTestAutomationRuleMetrics = pgTable("ab_test_automation_rule_metrics", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      ruleId: varchar("rule_id").notNull().references(() => abTestAutomationRules.id, { onDelete: "cascade" }),
      metricKey: varchar("metric_key").notNull(),
      // 'cta_click', 'conversion', 'dwell_time', etc
      weight: integer("weight").notNull(),
      // Override default profile weight if needed
      direction: varchar("direction").notNull().default("maximize"),
      thresholdType: varchar("threshold_type").notNull(),
      // 'percentile', 'absolute', 'change_rate'
      thresholdValue: numeric("threshold_value").notNull(),
      // Supports decimals: 25.5 for 25.5th percentile, 0.15 for 15% uplift
      minimumSample: integer("minimum_sample").default(30),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      uniqueIndex("ab_automation_rule_metrics_unique_idx").on(table.ruleId, table.metricKey)
    ]);
    insertAbTestAutomationRuleMetricSchema = createInsertSchema(abTestAutomationRuleMetrics).omit({
      id: true,
      createdAt: true
    });
    abTestPerformanceBaselines = pgTable("ab_test_performance_baselines", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      contentType: varchar("content_type").notNull(),
      contentItemId: varchar("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }),
      persona: varchar("persona"),
      funnelStage: varchar("funnel_stage"),
      // Time window for baseline
      windowStart: timestamp("window_start").notNull(),
      windowEnd: timestamp("window_end").notNull(),
      // Aggregate metrics
      totalViews: integer("total_views").default(0),
      uniqueViews: integer("unique_views").default(0),
      totalEvents: integer("total_events").default(0),
      compositeScore: integer("composite_score"),
      // Weighted score (0-10000)
      // Metric breakdown (JSONB for flexibility)
      metricBreakdown: jsonb("metric_breakdown"),
      // { "cta_click": 50.5, "dwell_time": 120.3, "scroll_depth": 75.2 }
      // Statistical data
      sampleSize: integer("sample_size").notNull(),
      variance: doublePrecision("variance"),
      // Statistical variance for significance testing
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      uniqueIndex("baselines_content_window_unique_idx").on(table.contentType, table.contentItemId, table.persona, table.funnelStage, table.windowStart),
      index("baselines_content_item_idx").on(table.contentItemId),
      index("baselines_persona_funnel_idx").on(table.persona, table.funnelStage),
      index("baselines_window_idx").on(table.windowStart, table.windowEnd),
      index("baselines_content_type_idx").on(table.contentType)
    ]);
    insertAbTestPerformanceBaselineSchema = createInsertSchema(abTestPerformanceBaselines).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    abTestVariantAiGenerations = pgTable("ab_test_variant_ai_generations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      variantId: varchar("variant_id").notNull().unique(),
      // One generation record per variant
      // AI generation metadata
      aiProvider: varchar("ai_provider").notNull(),
      // 'gemini', 'openai'
      aiModel: varchar("ai_model").notNull(),
      temperature: integer("temperature"),
      // 0-100 (multiply by 0.01)
      // Prompt and response
      systemPrompt: text("system_prompt"),
      userPrompt: text("user_prompt").notNull(),
      aiResponse: text("ai_response").notNull(),
      // Source inputs for generation
      sourceContentItemId: varchar("source_content_item_id").references(() => contentItems.id),
      baselineData: jsonb("baseline_data"),
      // Performance data used to inform generation
      personaContext: text("persona_context"),
      // Persona-specific context provided to AI
      // Generation results
      tokensUsed: integer("tokens_used"),
      generationTimeMs: integer("generation_time_ms"),
      generationStatus: varchar("generation_status").notNull().default("success"),
      // 'success', 'failed', 'retry'
      errorMessage: text("error_message"),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("ai_generations_variant_idx").on(table.variantId),
      index("ai_generations_provider_idx").on(table.aiProvider),
      index("ai_generations_status_idx").on(table.generationStatus)
    ]);
    insertAbTestVariantAiGenerationSchema = createInsertSchema(abTestVariantAiGenerations).omit({
      id: true,
      createdAt: true
    });
    abTestAutomationRuns = pgTable("ab_test_automation_runs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      ruleId: varchar("rule_id").notNull().references(() => abTestAutomationRules.id, { onDelete: "cascade" }),
      // Run status
      status: varchar("status").notNull().default("running"),
      // 'running', 'completed', 'failed', 'cancelled'
      triggerType: varchar("trigger_type").notNull(),
      // 'scheduled', 'manual', 'threshold'
      triggeredBy: varchar("triggered_by").references(() => users.id),
      // User if manual trigger
      // Execution details
      evaluationStart: timestamp("evaluation_start").notNull().defaultNow(),
      evaluationEnd: timestamp("evaluation_end"),
      // Results
      opportunitiesDetected: integer("opportunities_detected").default(0),
      testsCreated: integer("tests_created").default(0),
      variantsGenerated: integer("variants_generated").default(0),
      // Created test IDs for tracking
      createdTestIds: jsonb("created_test_ids"),
      // Array of test IDs created during this run
      // Errors and logs
      errorMessage: text("error_message"),
      executionLog: jsonb("execution_log"),
      // Detailed step-by-step log
      createdAt: timestamp("created_at").defaultNow(),
      completedAt: timestamp("completed_at")
    }, (table) => [
      index("automation_runs_rule_idx").on(table.ruleId),
      index("automation_runs_status_idx").on(table.status),
      index("automation_runs_created_at_idx").on(table.createdAt),
      index("automation_runs_evaluation_start_idx").on(table.evaluationStart)
    ]);
    insertAbTestAutomationRunSchema = createInsertSchema(abTestAutomationRuns).omit({
      id: true,
      createdAt: true,
      completedAt: true
    });
    abTestSafetyLimits = pgTable("ab_test_safety_limits", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      scope: varchar("scope").notNull().unique().default("global"),
      // 'global' (singleton pattern)
      // Global limits
      maxConcurrentAutomatedTests: integer("max_concurrent_automated_tests").default(10),
      maxTestsPerDay: integer("max_tests_per_day").default(5),
      maxTestsPerPersona: integer("max_tests_per_persona").default(3),
      maxTrafficAllocation: integer("max_traffic_allocation").default(50),
      // Max % of traffic in automated tests
      // Performance degradation detection
      degradationThreshold: integer("degradation_threshold").default(20),
      // % drop triggers rollback
      degradationCheckWindowMinutes: integer("degradation_check_window_minutes").default(60),
      // Cooldown periods
      globalCooldownHours: integer("global_cooldown_hours").default(24),
      // Between any automated actions
      perContentCooldownDays: integer("per_content_cooldown_days").default(7),
      // Emergency controls
      automationEnabled: boolean("automation_enabled").default(true),
      // Master kill switch
      requireAdminApproval: boolean("require_admin_approval").default(false),
      // Require approval for all
      // Notification thresholds
      notifyOnTestCreation: boolean("notify_on_test_creation").default(true),
      notifyOnWinnerPromotion: boolean("notify_on_winner_promotion").default(true),
      notifyOnFailure: boolean("notify_on_failure").default(true),
      updatedAt: timestamp("updated_at").defaultNow(),
      updatedBy: varchar("updated_by").references(() => users.id)
    }, (table) => [
      uniqueIndex("safety_limits_scope_unique_idx").on(table.scope)
    ]);
    insertAbTestSafetyLimitSchema = createInsertSchema(abTestSafetyLimits).omit({
      id: true,
      updatedAt: true
    });
    abTestSourceEnum = z.enum(["manual", "automated"]);
    abTests = pgTable("ab_tests", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      description: text("description"),
      type: varchar("type").notNull(),
      // 'card_order', 'layout', 'messaging', 'cta', 'hero'
      status: varchar("status").notNull().default("draft"),
      // 'draft', 'active', 'paused', 'completed'
      targetPersona: varchar("target_persona"),
      // DEPRECATED: Legacy field for migration - use abTestTargets junction table
      targetFunnelStage: varchar("target_funnel_stage"),
      // DEPRECATED: Legacy field for migration - use abTestTargets junction table
      trafficAllocation: integer("traffic_allocation").default(100),
      // Percentage of traffic to include (0-100)
      startDate: timestamp("start_date"),
      endDate: timestamp("end_date"),
      winnerVariantId: varchar("winner_variant_id"),
      // ID of winning variant once determined
      // Automation fields
      source: varchar("source").notNull().default("manual"),
      // 'manual' | 'automated' - explicit source for priority handling
      isAutomated: boolean("is_automated").default(false),
      // DEPRECATED: Use 'source' field instead. Kept for backwards compatibility
      automationRuleId: varchar("automation_rule_id").references(() => abTestAutomationRules.id, { onDelete: "set null" }),
      // Link to automation rule if automated
      autoPromotedAt: timestamp("auto_promoted_at"),
      // When winner was automatically promoted
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertAbTestSchema = createInsertSchema(abTests).omit({
      id: true,
      targetPersona: true,
      // Deprecated - use abTestTargets junction table
      targetFunnelStage: true,
      // Deprecated - use abTestTargets junction table
      createdAt: true,
      updatedAt: true
    }).extend({
      source: abTestSourceEnum.default("manual")
      // Validate source field with enum
    });
    abTestTargets = pgTable("ab_test_targets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      testId: varchar("test_id").notNull().references(() => abTests.id, { onDelete: "cascade" }),
      persona: varchar("persona").notNull(),
      // Specific persona this test targets
      funnelStage: varchar("funnel_stage").notNull(),
      // Specific funnel stage this test targets
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      uniqueIndex("ab_test_targets_unique_idx").on(table.testId, table.persona, table.funnelStage)
    ]);
    insertAbTestTargetSchema = createInsertSchema(abTestTargets).omit({
      id: true,
      createdAt: true
    });
    abTestVariants = pgTable("ab_test_variants", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      testId: varchar("test_id").notNull().references(() => abTests.id, { onDelete: "cascade" }),
      name: varchar("name").notNull(),
      // 'Control', 'Variant A', 'Variant B', etc
      description: text("description"),
      contentType: varchar("content_type").notNull().default("hero"),
      // 'hero', 'cta', 'service', 'testimonial', 'event', 'video', 'social_media', 'lead_magnet'
      trafficWeight: integer("traffic_weight").default(50),
      // Percentage of test traffic (weights sum to 100)
      // Configuration contains presentation overrides applied AFTER content selection
      // Example: { title: "New Headline", description: "Test copy", ctaText: "Join Now", imageName: "hero-alt" }
      // Content is first selected by persona + journey stage + passion tags, then overrides are applied
      configuration: jsonb("configuration"),
      // Optional during migration period - will be required in v2.0
      contentItemId: varchar("content_item_id").references(() => contentItems.id, { onDelete: "set null" }),
      // DEPRECATED v1.5: Will be removed in v2.0. Use configuration overrides instead. Existing tests using this field will continue to work but new tests should use configuration-only approach.
      isControl: boolean("is_control").default(false),
      // Is this the control/baseline variant?
      // AI generation fields
      generationSource: varchar("generation_source").default("manual"),
      // 'manual', 'ai_generated', 'ai_assisted'
      primaryMetric: varchar("primary_metric"),
      // The key metric this variant optimizes for
      weightingProfileId: varchar("weighting_profile_id").references(() => metricWeightProfiles.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertAbTestVariantSchema = createInsertSchema(abTestVariants).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).superRefine((data, ctx) => {
      if (!data.configuration && !data.contentItemId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Either configuration or contentItemId must be provided",
          path: []
        });
        return;
      }
      if (data.configuration) {
        let configToValidate = data.configuration;
        if (typeof configToValidate === "object" && configToValidate !== null && !("kind" in configToValidate)) {
          configToValidate = { kind: "presentation", ...configToValidate };
        }
        const result = abTestVariantConfigurationSchema.safeParse(configToValidate);
        if (!result.success) {
          result.error.errors.forEach((error) => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Configuration validation failed: ${error.message}`,
              path: ["configuration", ...error.path]
            });
          });
          return;
        }
        data.configuration = result.data;
      }
    });
    presentationOverrideConfigSchema = z.object({
      kind: z.literal("presentation"),
      // Text content overrides
      title: z.string().optional(),
      description: z.string().optional(),
      // CTA overrides
      ctaText: z.string().optional(),
      ctaLink: z.string().optional(),
      secondaryCtaText: z.string().optional(),
      secondaryCtaLink: z.string().optional(),
      // Visual overrides
      imageName: z.string().optional(),
      imageUrl: z.string().optional(),
      // Style overrides
      buttonVariant: z.enum(["default", "secondary", "outline", "ghost", "link", "destructive"]).optional(),
      // Metadata overrides (for content-type specific fields)
      metadata: z.record(z.any()).optional()
    }).strict();
    cardOrderConfigSchema = z.object({
      kind: z.literal("card_order"),
      // Type of content being reordered
      contentType: z.enum(["service", "testimonial", "event", "program_detail", "sponsor", "impact_stat"]),
      // Ordered array of content item IDs
      itemIds: z.array(z.string()).min(1, "At least one item must be selected")
    }).strict();
    layoutConfigSchema = z.object({
      kind: z.literal("layout"),
      // Layout template identifier
      template: z.enum(["grid-2col", "grid-3col", "grid-4col", "sidebar-left", "sidebar-right", "single-column", "masonry"]),
      // Layout-specific options
      options: z.object({
        cardStyle: z.enum(["elevated", "flat", "bordered"]).optional(),
        spacing: z.enum(["compact", "comfortable", "spacious"]).optional(),
        imagePosition: z.enum(["top", "left", "right", "background"]).optional(),
        showImages: z.boolean().optional(),
        columnsOnMobile: z.enum(["1", "2"]).optional()
      }).optional()
    }).strict();
    abTestVariantConfigurationSchema = z.discriminatedUnion("kind", [
      presentationOverrideConfigSchema,
      cardOrderConfigSchema,
      layoutConfigSchema
    ]);
    abTestAssignments = pgTable("ab_test_assignments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      testId: varchar("test_id").notNull().references(() => abTests.id, { onDelete: "cascade" }),
      variantId: varchar("variant_id").notNull().references(() => abTestVariants.id, { onDelete: "cascade" }),
      sessionId: varchar("session_id"),
      // Legacy session ID (from sessionStorage) - now nullable
      visitorId: varchar("visitor_id"),
      // Persistent visitor ID (from localStorage) - for anonymous users
      userId: varchar("user_id").references(() => users.id),
      // For authenticated users
      persona: varchar("persona"),
      // Persona at time of assignment
      funnelStage: varchar("funnel_stage"),
      // Funnel stage at time of assignment
      assignedAt: timestamp("assigned_at").defaultNow()
    }, (table) => ({
      // Unique constraint: one assignment per user per test
      userTestUnique: uniqueIndex("ab_assignments_user_test_unique").on(table.userId, table.testId),
      // Unique constraint: one assignment per visitor per test
      visitorTestUnique: uniqueIndex("ab_assignments_visitor_test_unique").on(table.visitorId, table.testId),
      // Index on visitorId for fast lookups
      visitorIdIdx: index("ab_assignments_visitor_id_idx").on(table.visitorId)
    }));
    insertAbTestAssignmentSchema = createInsertSchema(abTestAssignments).omit({
      id: true,
      assignedAt: true
    });
    abTestEvents = pgTable("ab_test_events", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      testId: varchar("test_id").notNull().references(() => abTests.id, { onDelete: "cascade" }),
      variantId: varchar("variant_id").notNull().references(() => abTestVariants.id, { onDelete: "cascade" }),
      assignmentId: varchar("assignment_id").references(() => abTestAssignments.id, { onDelete: "cascade" }),
      sessionId: varchar("session_id").notNull(),
      eventType: varchar("event_type").notNull(),
      // 'page_view', 'cta_click', 'lead_magnet_download', 'donation', 'volunteer_signup'
      eventTarget: varchar("event_target"),
      // What was clicked/interacted with
      eventValue: integer("event_value"),
      // Optional numeric value (e.g., donation amount)
      metadata: jsonb("metadata"),
      // Additional context
      createdAt: timestamp("created_at").defaultNow()
    });
    insertAbTestEventSchema = createInsertSchema(abTestEvents).omit({
      id: true,
      createdAt: true
    });
    googleReviews = pgTable("google_reviews", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      googleReviewId: varchar("google_review_id").unique().notNull(),
      // Unique ID from Google
      authorName: varchar("author_name").notNull(),
      authorPhotoUrl: varchar("author_photo_url"),
      rating: integer("rating").notNull(),
      text: text("text"),
      relativeTimeDescription: varchar("relative_time_description"),
      // "7 months ago"
      time: integer("time").notNull(),
      // Unix timestamp
      isActive: boolean("is_active").default(true),
      // Allow hiding specific reviews
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertGoogleReviewSchema = createInsertSchema(googleReviews).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    donations2 = pgTable("donations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      leadId: varchar("lead_id").references(() => leads.id),
      // Link to lead/donor
      userId: varchar("user_id").references(() => users.id),
      // Link to authenticated user (optional)
      campaignId: varchar("campaign_id").references(() => donationCampaigns.id),
      // Link to donation campaign (if from campaign)
      stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(),
      // Stripe payment ID
      stripeCustomerId: varchar("stripe_customer_id"),
      // Stripe customer ID for recurring
      amount: integer("amount").notNull(),
      // Amount in cents
      currency: varchar("currency").default("usd"),
      donationType: varchar("donation_type").notNull(),
      // 'one-time', 'recurring', 'wishlist', 'campaign'
      frequency: varchar("frequency"),
      // For recurring: 'monthly', 'quarterly', 'annual'
      status: varchar("status").notNull().default("pending"),
      // 'pending', 'succeeded', 'failed', 'refunded'
      donorEmail: varchar("donor_email"),
      donorName: varchar("donor_name"),
      donorPhone: varchar("phone"),
      isAnonymous: boolean("is_anonymous").default(false),
      wishlistItemId: varchar("wishlist_item_id").references(() => wishlistItems.id),
      // For wishlist donations
      receiptUrl: varchar("receipt_url"),
      // Stripe receipt URL
      thankYouEmailSent: boolean("thank_you_email_sent").default(false),
      metadata: jsonb("metadata"),
      // Additional data: dedication, tribute, etc
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertDonationSchema = createInsertSchema(donations2).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    wishlistItems = pgTable("wishlist_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      title: varchar("title").notNull(),
      // "School Supplies for 10 Students"
      description: text("description"),
      // Detailed description
      category: varchar("category").notNull(),
      // 'food', 'clothes', 'equipment', 'supplies', 'other'
      targetAmount: integer("target_amount").notNull(),
      // Target amount in cents
      raisedAmount: integer("raised_amount").default(0),
      // Amount raised so far in cents
      quantity: integer("quantity"),
      // Number of items needed (optional)
      quantityFulfilled: integer("quantity_fulfilled").default(0),
      // Number fulfilled
      imageUrl: varchar("image_url"),
      // Optional image
      priority: varchar("priority").default("medium"),
      // 'low', 'medium', 'high', 'urgent'
      isActive: boolean("is_active").default(true),
      isFulfilled: boolean("is_fulfilled").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    emailTemplates = pgTable("email_templates", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull().unique(),
      // 'donation_thank_you', 'warm_reconnect_parent_awareness', etc
      subject: varchar("subject").notNull(),
      htmlBody: text("html_body").notNull(),
      // HTML template with {{placeholders}}
      textBody: text("text_body"),
      // Plain text version
      variables: jsonb("variables"),
      // List of available variables: ['firstName', 'lastName', 'lastInteraction', etc]
      // Hormozi $100M Leads Framework Fields
      outreachType: varchar("outreach_type"),
      // 'warm_outreach', 'cold_outreach', 'warm_broadcast', 'cold_broadcast'
      templateCategory: varchar("template_category"),
      // 'a_c_a', 'value_first', 'social_proof', 'problem_solution', 'lead_magnet_offer', 'reengagement', 'follow_up'
      persona: varchar("persona"),
      // Target persona: student, provider, parent, donor, volunteer, or null for all
      funnelStage: varchar("funnel_stage"),
      // Target funnel stage: awareness, consideration, decision, retention, or null for all
      description: text("description"),
      // Admin-facing description of when to use this template
      exampleContext: text("example_context"),
      // Example scenario for using this template
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    aiCopyGenerations = pgTable("ai_copy_generations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      originalContent: text("original_content").notNull(),
      contentType: varchar("content_type").notNull(),
      // hero, cta, service, event, testimonial, lead_magnet
      persona: varchar("persona"),
      // student, provider, parent, donor, volunteer, or null for general
      funnelStage: varchar("funnel_stage"),
      // awareness, consideration, decision, retention
      generatedVariants: jsonb("generated_variants").notNull(),
      // Array of {text, focus, explanation}
      dreamOutcome: text("dream_outcome"),
      perceivedLikelihood: text("perceived_likelihood"),
      timeDelay: text("time_delay"),
      effortSacrifice: text("effort_sacrifice"),
      selectedVariantIndex: integer("selected_variant_index"),
      // Which variant the user chose (0-2)
      wasCustomPrompt: boolean("was_custom_prompt").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertAiCopyGenerationSchema = createInsertSchema(aiCopyGenerations).omit({
      id: true,
      createdAt: true
    });
    emailCampaigns = pgTable("email_campaigns", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      description: text("description"),
      persona: varchar("persona"),
      // Target persona or null for all
      funnelStage: varchar("funnel_stage"),
      // Target funnel stage or null for all
      triggerType: varchar("trigger_type").notNull(),
      // 'manual', 'lead_created', 'quiz_completed', 'download', 'funnel_stage_change'
      triggerConditions: jsonb("trigger_conditions"),
      // Additional conditions like specific quiz, download, etc
      isActive: boolean("is_active").default(true),
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    emailSequenceSteps = pgTable("email_sequence_steps", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      campaignId: varchar("campaign_id").notNull().references(() => emailCampaigns.id, { onDelete: "cascade" }),
      stepNumber: integer("step_number").notNull(),
      // Order in sequence (1, 2, 3...)
      delayDays: integer("delay_days").notNull().default(0),
      // Days after trigger or previous email
      delayHours: integer("delay_hours").notNull().default(0),
      // Additional hours
      templateId: varchar("template_id").references(() => emailTemplates.id),
      subject: varchar("subject").notNull(),
      htmlContent: text("html_content").notNull(),
      textContent: text("text_content"),
      variables: jsonb("variables"),
      // Available variables for this email
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertEmailSequenceStepSchema = createInsertSchema(emailSequenceSteps).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    emailCampaignEnrollments = pgTable("email_campaign_enrollments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      campaignId: varchar("campaign_id").notNull().references(() => emailCampaigns.id, { onDelete: "cascade" }),
      leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
      status: varchar("status").notNull().default("active"),
      // 'active', 'completed', 'unsubscribed', 'bounced'
      currentStepNumber: integer("current_step_number").default(0),
      // Which step they're on
      lastEmailSentAt: timestamp("last_email_sent_at"),
      completedAt: timestamp("completed_at"),
      unsubscribedAt: timestamp("unsubscribed_at"),
      enrolledAt: timestamp("enrolled_at").defaultNow(),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      uniqueIndex("enrollment_unique_idx").on(table.campaignId, table.leadId),
      index("enrollments_enrolled_at_idx").on(table.enrolledAt),
      index("enrollments_campaign_enrolled_idx").on(table.campaignId, table.enrolledAt)
    ]);
    insertEmailCampaignEnrollmentSchema = createInsertSchema(emailCampaignEnrollments).omit({
      id: true,
      createdAt: true
    });
    smsTemplates = pgTable("sms_templates", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      description: text("description"),
      messageTemplate: text("message_template").notNull(),
      // SMS template with {variable} placeholders (≤160 chars)
      exampleContext: text("example_context"),
      // Example scenario for this template
      persona: varchar("persona"),
      // Target persona or null for all
      funnelStage: varchar("funnel_stage"),
      // awareness, consideration, decision, retention (null = all)
      outreachType: varchar("outreach_type"),
      // cold_outreach, warm_outreach, cold_broadcast, warm_broadcast
      templateCategory: varchar("template_category"),
      // a_c_a, value_first, social_proof, problem_solution, etc.
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    smsSends = pgTable("sms_sends", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      templateId: varchar("template_id").references(() => smsTemplates.id),
      leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
      campaignId: varchar("campaign_id").references(() => emailCampaigns.id, { onDelete: "set null" }),
      // Links SMS to campaign
      sequenceStepId: varchar("sequence_step_id").references(() => emailSequenceSteps.id, { onDelete: "set null" }),
      // Links to specific step
      enrollmentId: varchar("enrollment_id").references(() => emailCampaignEnrollments.id, { onDelete: "set null" }),
      // Links to enrollment
      recipientPhone: varchar("recipient_phone").notNull(),
      recipientName: varchar("recipient_name"),
      messageContent: text("message_content").notNull(),
      status: varchar("status").notNull().default("pending"),
      // 'pending', 'sent', 'delivered', 'failed', 'undelivered'
      smsProvider: varchar("sms_provider"),
      // 'twilio', etc
      providerMessageId: varchar("provider_message_id"),
      // SID from Twilio
      errorMessage: text("error_message"),
      metadata: jsonb("metadata"),
      // Variables used, campaign ID, etc
      sentAt: timestamp("sent_at"),
      deliveredAt: timestamp("delivered_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertSmsSendSchema = createInsertSchema(smsSends).omit({
      id: true,
      createdAt: true
    });
    smsBulkCampaigns2 = pgTable("sms_bulk_campaigns", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      description: text("description"),
      // Targeting filters (nullable = match all)
      personaFilter: varchar("persona_filter"),
      // 'parent', 'student', 'donor', 'volunteer', 'job_seeker' or null for all
      funnelStageFilter: varchar("funnel_stage_filter"),
      // 'awareness', 'consideration', 'retention', 'advocacy' or null for all
      // Future-proof filter storage (passion tags, custom segments, etc.)
      filterConfig: jsonb("filter_config"),
      // Extended filter criteria for future use
      // Message content
      templateId: varchar("template_id").references(() => smsTemplates.id, { onDelete: "set null" }),
      customMessage: text("custom_message"),
      // If not using template
      messageSnapshot: text("message_snapshot").notNull(),
      // Final message sent (for audit)
      // Metrics
      targetCount: integer("target_count").notNull().default(0),
      // How many leads matched filters
      sentCount: integer("sent_count").notNull().default(0),
      // Successfully sent
      blockedCount: integer("blocked_count").notNull().default(0),
      // Skipped due to unsubscribe
      failedCount: integer("failed_count").notNull().default(0),
      // Failed to send
      // Status tracking
      status: varchar("status").notNull().default("draft"),
      // 'draft', 'processing', 'completed', 'failed', 'cancelled'
      // Error tracking
      errorSummary: text("error_summary"),
      // Summary of errors if any
      metadata: jsonb("metadata"),
      // Additional data (rate limit info, restart points, etc.)
      // Audit fields
      createdBy: varchar("created_by").notNull().references(() => users.id),
      cancelledBy: varchar("cancelled_by").references(() => users.id),
      // Timestamps
      startedAt: timestamp("started_at"),
      completedAt: timestamp("completed_at"),
      cancelledAt: timestamp("cancelled_at"),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("sms_bulk_campaigns_created_by_idx").on(table.createdBy),
      index("sms_bulk_campaigns_status_idx").on(table.status),
      index("sms_bulk_campaigns_created_at_idx").on(table.createdAt)
    ]);
    insertSmsBulkCampaignSchema = createInsertSchema(smsBulkCampaigns2).omit({
      id: true,
      createdAt: true
    });
    communicationLogs = pgTable("communication_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
      userId: varchar("user_id").references(() => users.id),
      // Admin who initiated, if manual
      communicationType: varchar("communication_type").notNull(),
      // 'email', 'sms', 'call', 'note', 'meeting'
      direction: varchar("direction"),
      // 'inbound', 'outbound'
      subject: varchar("subject"),
      content: text("content"),
      emailLogId: varchar("email_log_id").references(() => emailLogs.id),
      smsSendId: varchar("sms_send_id").references(() => smsSends.id),
      metadata: jsonb("metadata"),
      // Call duration, meeting attendees, campaign ID, etc
      createdAt: timestamp("created_at").defaultNow()
    });
    insertCommunicationLogSchema = createInsertSchema(communicationLogs).omit({
      id: true,
      createdAt: true
    });
    emailLogs = pgTable("email_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      templateId: varchar("template_id").references(() => emailTemplates.id),
      leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
      campaignId: varchar("campaign_id").references(() => emailCampaigns.id, { onDelete: "set null" }),
      sequenceStepId: varchar("sequence_step_id").references(() => emailSequenceSteps.id, { onDelete: "set null" }),
      enrollmentId: varchar("enrollment_id").references(() => emailCampaignEnrollments.id, { onDelete: "set null" }),
      recipientEmail: varchar("recipient_email").notNull(),
      recipientName: varchar("recipient_name"),
      subject: varchar("subject").notNull(),
      trackingToken: varchar("tracking_token").notNull().unique(),
      // Unique token for tracking opens/clicks
      status: varchar("status").notNull().default("pending"),
      // 'pending', 'sent', 'failed', 'bounced'
      emailProvider: varchar("email_provider"),
      // 'sendgrid', 'resend', etc
      providerMessageId: varchar("provider_message_id"),
      // ID from email service
      errorMessage: text("error_message"),
      // If failed
      metadata: jsonb("metadata"),
      // Variables used, related donation ID, etc
      sentAt: timestamp("sent_at"),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => ({
      trackingTokenIdx: index("email_logs_tracking_token_idx").on(table.trackingToken),
      leadIdIdx: index("email_logs_lead_id_idx").on(table.leadId),
      sentAtIdx: index("email_logs_sent_at_idx").on(table.sentAt),
      campaignSentAtIdx: index("email_logs_campaign_sent_at_idx").on(table.campaignId, table.sentAt),
      createdAtIdx: index("email_logs_created_at_idx").on(table.createdAt)
    }));
    insertEmailLogSchema = createInsertSchema(emailLogs).omit({
      id: true,
      createdAt: true
    });
    emailOpens = pgTable("email_opens", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      emailLogId: varchar("email_log_id").notNull().references(() => emailLogs.id, { onDelete: "cascade" }),
      leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
      campaignId: varchar("campaign_id").references(() => emailCampaigns.id, { onDelete: "set null" }),
      trackingToken: varchar("tracking_token").notNull(),
      ipAddress: varchar("ip_address"),
      userAgent: text("user_agent"),
      metadata: jsonb("metadata"),
      openedAt: timestamp("opened_at").defaultNow()
    }, (table) => ({
      trackingTokenIdx: index("email_opens_tracking_token_idx").on(table.trackingToken),
      campaignAnalyticsIdx: index("email_opens_campaign_analytics_idx").on(table.campaignId, table.openedAt),
      emailLogIdx: index("email_opens_email_log_idx").on(table.emailLogId),
      leadEngagementIdx: index("email_opens_lead_engagement_idx").on(table.leadId, table.openedAt)
    }));
    insertEmailOpenSchema = createInsertSchema(emailOpens).omit({
      id: true,
      openedAt: true
    });
    emailLinks = pgTable("email_links", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      emailLogId: varchar("email_log_id").notNull().references(() => emailLogs.id, { onDelete: "cascade" }),
      linkToken: varchar("link_token").notNull().unique(),
      targetUrl: text("target_url").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    }, (table) => ({
      linkTokenIdx: index("email_links_link_token_idx").on(table.linkToken),
      emailLogIdIdx: index("email_links_email_log_id_idx").on(table.emailLogId)
    }));
    insertEmailLinkSchema = createInsertSchema(emailLinks).omit({
      id: true,
      createdAt: true
    });
    emailClicks = pgTable("email_clicks", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      emailLogId: varchar("email_log_id").notNull().references(() => emailLogs.id, { onDelete: "cascade" }),
      emailLinkId: varchar("email_link_id").references(() => emailLinks.id, { onDelete: "set null" }),
      leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
      campaignId: varchar("campaign_id").references(() => emailCampaigns.id, { onDelete: "set null" }),
      trackingToken: varchar("tracking_token").notNull(),
      targetUrl: text("target_url").notNull(),
      // Original URL being linked to  
      ipAddress: varchar("ip_address"),
      userAgent: text("user_agent"),
      metadata: jsonb("metadata"),
      clickedAt: timestamp("clicked_at").defaultNow()
    }, (table) => ({
      trackingTokenIdx: index("email_clicks_tracking_token_idx").on(table.trackingToken),
      emailLinkIdIdx: index("email_clicks_email_link_id_idx").on(table.emailLinkId),
      campaignAnalyticsIdx: index("email_clicks_campaign_analytics_idx").on(table.campaignId, table.clickedAt),
      emailLogIdx: index("email_clicks_email_log_idx").on(table.emailLogId),
      leadEngagementIdx: index("email_clicks_lead_engagement_idx").on(table.leadId, table.clickedAt)
    }));
    insertEmailClickSchema = createInsertSchema(emailClicks).omit({
      id: true,
      clickedAt: true
    });
    emailSendTimeInsights = pgTable("email_send_time_insights", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      scope: varchar("scope").notNull(),
      // 'global', 'campaign', 'persona'
      scopeId: varchar("scope_id"),
      // Campaign ID or persona value (null for global)
      dayOfWeek: integer("day_of_week").notNull(),
      // 0-6 where 0=Sunday
      hourOfDay: integer("hour_of_day").notNull(),
      // 0-23 in America/New_York timezone
      sendCount: integer("send_count").notNull().default(0),
      // Total emails sent in this bucket
      openCount: integer("open_count").notNull().default(0),
      // Total opens in this bucket
      uniqueOpens: integer("unique_opens").notNull().default(0),
      // Unique leads who opened
      clickCount: integer("click_count").notNull().default(0),
      // Total clicks in this bucket
      openRate: integer("open_rate").notNull().default(0),
      // Percentage * 100 (e.g., 2543 = 25.43%)
      clickRate: integer("click_rate").notNull().default(0),
      // Percentage * 100
      medianTimeToOpen: integer("median_time_to_open"),
      // Median minutes from send to open
      confidenceScore: integer("confidence_score").notNull().default(0),
      // 0-100 based on sample size
      sampleSize: integer("sample_size").notNull().default(0),
      // Min(sendCount, 50) for confidence calculation
      metadata: jsonb("metadata"),
      // Additional stats, quartiles, etc
      analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
      // When this analysis was computed
      createdAt: timestamp("created_at").defaultNow().notNull()
    }, (table) => ({
      scopeAnalyzedIdx: index("email_send_time_insights_scope_analyzed_idx").on(table.scope, table.analyzedAt),
      scopeIdIdx: index("email_send_time_insights_scope_id_idx").on(table.scopeId),
      dayHourIdx: index("email_send_time_insights_day_hour_idx").on(table.dayOfWeek, table.hourOfDay)
    }));
    insertEmailSendTimeInsightSchema = createInsertSchema(emailSendTimeInsights).omit({
      id: true,
      createdAt: true
    });
    emailReportSchedules = pgTable("email_report_schedules", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull().unique(),
      // Unique name for the report schedule
      description: text("description"),
      // Optional description
      frequency: varchar("frequency").notNull(),
      // 'daily', 'weekly', 'monthly'
      recipients: jsonb("recipients").notNull(),
      // Array of email addresses: ['admin@example.com', 'manager@example.com']
      reportType: varchar("report_type").notNull(),
      // 'campaign_summary', 'engagement_summary', 'full_analytics'
      isActive: boolean("is_active").default(true).notNull(),
      // Whether the schedule is active
      nextRunAt: timestamp("next_run_at"),
      // When the next report should run
      lastRunAt: timestamp("last_run_at"),
      // When the last report was sent
      createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
      // Admin who created the schedule
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    }, (table) => ({
      nextRunIdx: index("email_report_schedules_next_run_idx").on(table.nextRunAt),
      activeIdx: index("email_report_schedules_active_idx").on(table.isActive)
    }));
    emailArraySchema = z.array(z.string().email()).min(1, "At least one recipient email is required");
    frequencyEnumSchema = z.enum(["daily", "weekly", "monthly"]);
    reportTypeEnumSchema = z.enum(["campaign_summary", "engagement_summary", "full_analytics"]);
    insertEmailReportScheduleSchema = createInsertSchema(emailReportSchedules).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      lastRunAt: true
    }).extend({
      recipients: emailArraySchema,
      frequency: frequencyEnumSchema,
      reportType: reportTypeEnumSchema,
      nextRunAt: z.string().datetime().transform((str) => new Date(str)).optional()
    });
    updateEmailReportScheduleSchema = insertEmailReportScheduleSchema.partial();
    smsLogs = pgTable("sms_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      templateId: varchar("template_id").references(() => smsTemplates.id),
      leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
      campaignId: varchar("campaign_id").references(() => donationCampaigns.id, { onDelete: "set null" }),
      recipientPhone: varchar("recipient_phone").notNull(),
      recipientName: varchar("recipient_name"),
      messageContent: text("message_content").notNull(),
      // The actual SMS sent
      status: varchar("status").notNull().default("pending"),
      // 'pending', 'sent', 'failed', 'delivered'
      smsProvider: varchar("sms_provider").default("twilio"),
      // 'twilio', etc
      providerMessageId: varchar("provider_message_id"),
      // SID from Twilio
      errorMessage: text("error_message"),
      // If failed
      metadata: jsonb("metadata"),
      // Variables used, related donation/campaign ID, etc
      sentAt: timestamp("sent_at"),
      deliveredAt: timestamp("delivered_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertSmsLogSchema = createInsertSchema(smsLogs).omit({
      id: true,
      createdAt: true
    });
    donationCampaigns = pgTable("donation_campaigns", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      slug: varchar("slug").notNull().unique(),
      // URL-friendly identifier
      description: text("description").notNull(),
      story: text("story"),
      // Long-form storytelling content
      goalAmount: integer("goal_amount").notNull(),
      // Target amount in cents
      raisedAmount: integer("raised_amount").default(0),
      // Amount raised so far in cents
      costPerPerson: integer("cost_per_person"),
      // Cost to help one person in cents (e.g., 50000 = $500/student)
      // Passion-based targeting
      passionTags: jsonb("passion_tags").notNull(),
      // Array of passion tags: ['literacy', 'stem', 'arts', 'nutrition', 'community']
      // Multi-channel communication settings
      sendEmail: boolean("send_email").default(true),
      sendSms: boolean("send_sms").default(false),
      emailTemplateId: varchar("email_template_id").references(() => emailTemplates.id),
      smsTemplateId: varchar("sms_template_id").references(() => smsTemplates.id),
      // Campaign timing
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date").notNull(),
      // Campaign status
      status: varchar("status").notNull().default("draft"),
      // 'draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'
      // Visual assets
      imageUrl: varchar("image_url"),
      // Campaign hero image
      thumbnailUrl: varchar("thumbnail_url"),
      // Smaller image for cards
      // Related content
      relatedTestimonialIds: jsonb("related_testimonial_ids"),
      // Array of content_items IDs to promote
      // Tracking
      totalDonations: integer("total_donations").default(0),
      // Count of donations
      uniqueDonors: integer("unique_donors").default(0),
      // Count of unique donors
      emailsSent: integer("emails_sent").default(0),
      smsSent: integer("sms_sent").default(0),
      clickThroughRate: integer("click_through_rate").default(0),
      // Percentage
      conversionRate: integer("conversion_rate").default(0),
      // Percentage
      // Metadata
      metadata: jsonb("metadata"),
      // Additional data: impact metrics, milestone updates, etc
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("donation_campaigns_status_idx").on(table.status),
      index("donation_campaigns_passion_tags_idx").on(table.passionTags)
    ]);
    insertDonationCampaignSchema = createInsertSchema(donationCampaigns).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      // Accept ISO strings and coerce to Date objects for timestamp fields
      startDate: z.union([z.date(), z.string().transform((val) => new Date(val))]),
      endDate: z.union([z.date(), z.string().transform((val) => new Date(val))])
    });
    updateDonationCampaignSchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      passion: z.string().optional(),
      goalAmount: z.number().positive().optional(),
      startDate: z.union([z.date(), z.string().transform((val) => new Date(val))]).optional(),
      endDate: z.union([z.date(), z.string().transform((val) => new Date(val))]).optional(),
      status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
      visibility: z.enum(["public", "donors_only", "internal"]).optional(),
      metadata: z.any().optional()
      // JSONB
    }).strict();
    campaignCommunications = pgTable("campaign_communications", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      campaignId: varchar("campaign_id").notNull().references(() => donationCampaigns.id, { onDelete: "cascade" }),
      leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
      // What was sent
      channel: varchar("channel").notNull(),
      // 'email', 'sms'
      emailLogId: varchar("email_log_id").references(() => emailLogs.id),
      smsLogId: varchar("sms_log_id").references(() => smsLogs.id),
      // Engagement tracking
      wasSent: boolean("was_sent").default(false),
      wasOpened: boolean("was_opened").default(false),
      wasClicked: boolean("was_clicked").default(false),
      wasDonated: boolean("was_donated").default(false),
      // Did they donate after this communication?
      // Matching info
      matchedPassions: jsonb("matched_passions"),
      // Which passions matched for this send
      sentAt: timestamp("sent_at"),
      openedAt: timestamp("opened_at"),
      clickedAt: timestamp("clicked_at"),
      donatedAt: timestamp("donated_at"),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("campaign_comms_campaign_idx").on(table.campaignId),
      index("campaign_comms_lead_idx").on(table.leadId),
      uniqueIndex("campaign_comms_unique_idx").on(table.campaignId, table.leadId, table.channel)
    ]);
    insertCampaignCommunicationSchema = createInsertSchema(campaignCommunications).omit({
      id: true,
      createdAt: true
    });
    campaignMembers = pgTable("campaign_members", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      campaignId: varchar("campaign_id").notNull().references(() => donationCampaigns.id, { onDelete: "cascade" }),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      // Member role: 'beneficiary' (student/parent receiving funds), 'supporter' (helping promote), 'organizer' (can edit campaign)
      role: varchar("role").notNull().default("beneficiary"),
      // Notification preferences
      notifyOnDonation: boolean("notify_on_donation").default(true),
      // Get notified when someone donates
      notificationChannels: jsonb("notification_channels").default(["email"]),
      // 'email', 'sms'
      // Member status
      isActive: boolean("is_active").default(true),
      // Metadata
      metadata: jsonb("metadata"),
      // Additional context: student info, parent relationship, etc
      joinedAt: timestamp("joined_at").defaultNow(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("campaign_members_campaign_idx").on(table.campaignId),
      index("campaign_members_user_idx").on(table.userId),
      uniqueIndex("campaign_members_unique_idx").on(table.campaignId, table.userId)
    ]);
    insertCampaignMemberSchema = createInsertSchema(campaignMembers).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    campaignTestimonials = pgTable("campaign_testimonials", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      campaignId: varchar("campaign_id").notNull().references(() => donationCampaigns.id, { onDelete: "cascade" }),
      memberId: varchar("member_id").notNull().references(() => campaignMembers.id, { onDelete: "cascade" }),
      // Testimonial content
      title: varchar("title"),
      // Optional headline
      message: text("message").notNull(),
      // The testimonial message
      authorName: varchar("author_name").notNull(),
      // Display name (can be different from user name)
      authorRole: varchar("author_role"),
      // "Student", "Parent", "Participant"
      // Status tracking
      status: varchar("status").notNull().default("pending"),
      // 'pending', 'approved', 'sent', 'rejected'
      approvedBy: varchar("approved_by").references(() => users.id),
      approvedAt: timestamp("approved_at"),
      // Distribution tracking
      wasSentToDonors: boolean("was_sent_to_donors").default(false),
      sentToDonorsAt: timestamp("sent_to_donors_at"),
      recipientCount: integer("recipient_count").default(0),
      // How many donors received this
      // AI enhancement
      wasAiEnhanced: boolean("was_ai_enhanced").default(false),
      // Was it enhanced by AI?
      originalMessage: text("original_message"),
      // Store original if AI-enhanced
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("campaign_testimonials_campaign_idx").on(table.campaignId),
      index("campaign_testimonials_member_idx").on(table.memberId),
      index("campaign_testimonials_status_idx").on(table.status)
    ]);
    insertCampaignTestimonialSchema = createInsertSchema(campaignTestimonials).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    outreachEmails = pgTable("outreach_emails", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
      // Email content
      subject: varchar("subject").notNull(),
      bodyHtml: text("body_html").notNull(),
      bodyText: text("body_text"),
      // Generation metadata
      wasAiGenerated: boolean("was_ai_generated").default(false),
      aiPrompt: text("ai_prompt"),
      // The prompt used to generate the email
      generatedBy: varchar("generated_by").references(() => users.id),
      // Admin who triggered generation
      // Sending metadata
      status: varchar("status").notNull().default("draft"),
      // draft, queued, sent, failed, bounced
      sentBy: varchar("sent_by").references(() => users.id),
      // Admin who sent it
      sentAt: timestamp("sent_at"),
      // Engagement tracking
      wasOpened: boolean("was_opened").default(false),
      openedAt: timestamp("opened_at"),
      openCount: integer("open_count").default(0),
      wasClicked: boolean("was_clicked").default(false),
      clickedAt: timestamp("clicked_at"),
      clickCount: integer("click_count").default(0),
      wasReplied: boolean("was_replied").default(false),
      repliedAt: timestamp("replied_at"),
      // Provider tracking
      emailProvider: varchar("email_provider").default("sendgrid"),
      // sendgrid, mailgun, etc
      providerMessageId: varchar("provider_message_id"),
      // External provider's message ID
      // Error handling
      errorMessage: text("error_message"),
      // If sending failed
      retryCount: integer("retry_count").default(0),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("outreach_emails_lead_idx").on(table.leadId),
      index("outreach_emails_status_idx").on(table.status),
      index("outreach_emails_sent_at_idx").on(table.sentAt)
    ]);
    insertOutreachEmailSchema = createInsertSchema(outreachEmails).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    icpCriteria = pgTable("icp_criteria", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      // "MRI Decision Maker", "Education Director", etc
      description: text("description"),
      // Human-readable description of this ICP
      // Qualification criteria
      criteria: jsonb("criteria").notNull(),
      // Structured criteria: job titles, company types, signals, red flags, etc
      // Scoring weights
      scoringWeights: jsonb("scoring_weights"),
      // How to weight different factors in qualification score
      // AI prompt template
      qualificationPrompt: text("qualification_prompt").notNull(),
      // Template for Gemini to use when qualifying
      // Active status
      isActive: boolean("is_active").default(true),
      isDefault: boolean("is_default").default(false),
      // Default ICP to use if none specified
      // Usage stats
      leadsQualified: integer("leads_qualified").default(0),
      averageScore: integer("average_score"),
      // Average qualification score for this ICP
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertIcpCriteriaSchema = createInsertSchema(icpCriteria).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    chatbotConversations = pgTable("chatbot_conversations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      // Message content
      role: varchar("role").notNull(),
      // 'user' or 'assistant'
      content: text("content").notNull(),
      // Tool calls (if assistant made function calls)
      toolCalls: jsonb("tool_calls"),
      // Array of tool calls made by assistant
      toolResults: jsonb("tool_results"),
      // Results from tool executions
      // Session tracking
      sessionId: varchar("session_id").notNull(),
      // Groups messages in same chat session
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("chatbot_conversations_user_idx").on(table.userId),
      index("chatbot_conversations_session_idx").on(table.sessionId)
    ]);
    insertChatbotConversationSchema = createInsertSchema(chatbotConversations).omit({
      id: true,
      createdAt: true
    });
    chatbotIssues = pgTable("chatbot_issues", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      // Issue details
      title: varchar("title").notNull(),
      description: text("description").notNull(),
      severity: varchar("severity").notNull().default("medium"),
      // 'low', 'medium', 'high', 'critical'
      status: varchar("status").notNull().default("open"),
      // 'open', 'in_progress', 'resolved', 'closed'
      category: varchar("category"),
      // 'content', 'technical', 'user_account', 'performance', 'other'
      // Context
      conversationContext: jsonb("conversation_context"),
      // Last few messages from chat
      diagnosticData: jsonb("diagnostic_data"),
      // Query results, log snippets, etc.
      // Resolution tracking
      resolvedBy: varchar("resolved_by").references(() => users.id),
      resolvedAt: timestamp("resolved_at"),
      resolutionNotes: text("resolution_notes"),
      // Notification tracking
      notificationSent: boolean("notification_sent").default(false),
      notificationSentAt: timestamp("notification_sent_at"),
      // Created by
      reportedBy: varchar("reported_by").notNull().references(() => users.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("chatbot_issues_status_idx").on(table.status),
      index("chatbot_issues_severity_idx").on(table.severity),
      index("chatbot_issues_reported_by_idx").on(table.reportedBy)
    ]);
    insertChatbotIssueSchema = createInsertSchema(chatbotIssues).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    backupSnapshots = pgTable("backup_snapshots", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      // Backup metadata
      tableName: varchar("table_name").notNull(),
      // Original table name (e.g., 'users', 'leads')
      backupTableName: varchar("backup_table_name").notNull().unique(),
      // Actual backup table name (e.g., 'backup_users_20250109_143022')
      backupName: varchar("backup_name"),
      // Optional user-friendly name
      rowCount: integer("row_count").notNull(),
      // Number of rows backed up
      sizeBytes: integer("size_bytes"),
      // Approximate backup size
      // Creation tracking
      createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").defaultNow(),
      // Optional metadata
      description: text("description"),
      // Purpose or notes about this backup
      tags: jsonb("tags")
      // Optional tags for organization
    }, (table) => [
      index("backup_snapshots_table_name_idx").on(table.tableName),
      index("backup_snapshots_created_by_idx").on(table.createdBy),
      index("backup_snapshots_created_at_idx").on(table.createdAt)
    ]);
    insertBackupSnapshotSchema = createInsertSchema(backupSnapshots).omit({
      id: true,
      createdAt: true
    });
    backupSchedules = pgTable("backup_schedules", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      // Schedule target
      tableName: varchar("table_name").notNull(),
      // Table to backup (e.g., 'users', 'leads')
      scheduleName: varchar("schedule_name"),
      // Optional user-friendly name
      // Schedule configuration
      scheduleType: varchar("schedule_type").notNull(),
      // 'daily', 'weekly', 'monthly', 'custom'
      scheduleConfig: jsonb("schedule_config").notNull(),
      // { hour: 2, minute: 0, dayOfWeek: 0, dayOfMonth: 1, timezone: 'America/New_York', cron?: '0 2 * * *' }
      // Retention policy
      retentionCount: integer("retention_count").default(7),
      // Keep last N backups, null = keep all
      // Status and execution tracking
      isActive: boolean("is_active").default(true),
      isRunning: boolean("is_running").default(false),
      // Concurrency guard
      startedAt: timestamp("started_at"),
      // When current execution started (for stuck job detection)
      lockedUntil: timestamp("locked_until"),
      // Execution timeout - if current time > lockedUntil, job is stuck
      nextRun: timestamp("next_run").notNull(),
      // Next scheduled execution (UTC)
      lastRun: timestamp("last_run"),
      // Last successful execution
      lastRunStatus: varchar("last_run_status"),
      // 'success', 'error'
      lastRunError: text("last_run_error"),
      // Error message if failed
      consecutiveFailures: integer("consecutive_failures").default(0),
      // Track repeated failures
      // Creation tracking
      createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("backup_schedules_table_name_idx").on(table.tableName),
      index("backup_schedules_next_run_idx").on(table.nextRun),
      index("backup_schedules_is_active_idx").on(table.isActive),
      index("backup_schedules_created_by_idx").on(table.createdBy)
    ]);
    insertBackupScheduleSchema = createInsertSchema(backupSchedules).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      isRunning: true,
      startedAt: true,
      lockedUntil: true,
      lastRun: true,
      lastRunStatus: true,
      lastRunError: true,
      consecutiveFailures: true
    });
    acquisitionChannels = pgTable("acquisition_channels", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull().unique(),
      // 'Google Ads', 'Facebook Ads', 'Organic Search', 'Referral', 'Event: Spring Gala', etc
      slug: varchar("slug").notNull().unique(),
      // 'google_ads', 'facebook_ads', 'organic_search', 'referral', etc
      channelType: varchar("channel_type").notNull(),
      // 'paid_ads', 'organic', 'referral', 'event', 'email', 'social', 'direct', 'partnership'
      description: text("description"),
      // Cost tracking
      monthlyBudget: integer("monthly_budget"),
      // Budget in cents (if applicable)
      totalSpent: integer("total_spent").default(0),
      // Total amount spent in cents
      // Performance metrics (calculated from leads/donations)
      totalLeads: integer("total_leads").default(0),
      totalDonors: integer("total_donors").default(0),
      totalDonationAmount: integer("total_donation_amount").default(0),
      // In cents
      // Status
      isActive: boolean("is_active").default(true),
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("acquisition_channels_type_idx").on(table.channelType),
      index("acquisition_channels_active_idx").on(table.isActive)
    ]);
    insertAcquisitionChannelSchema = createInsertSchema(acquisitionChannels).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    marketingCampaigns = pgTable("marketing_campaigns", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      // 'Q1 2024 Parent Outreach', 'Back to School Drive', etc
      channelId: varchar("channel_id").references(() => acquisitionChannels.id, { onDelete: "set null" }),
      description: text("description"),
      // Budget and spend tracking
      budget: integer("budget").notNull(),
      // Total budget in cents
      spent: integer("spent").default(0),
      // Amount spent so far in cents
      // Date range
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date"),
      // Performance metrics (calculated)
      leadsGenerated: integer("leads_generated").default(0),
      donorsAcquired: integer("donors_acquired").default(0),
      totalDonations: integer("total_donations").default(0),
      // In cents
      // Status
      status: varchar("status").notNull().default("draft"),
      // 'draft', 'active', 'paused', 'completed'
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("marketing_campaigns_channel_idx").on(table.channelId),
      index("marketing_campaigns_status_idx").on(table.status),
      index("marketing_campaigns_dates_idx").on(table.startDate, table.endDate)
    ]);
    insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      // Accept ISO strings and coerce to Date objects for timestamp fields
      startDate: z.union([z.date(), z.string().transform((val) => new Date(val))]),
      endDate: z.union([z.date(), z.string().transform((val) => new Date(val))]).optional()
    });
    leadAttribution = pgTable("lead_attribution", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }).unique(),
      // One attribution per lead
      // Attribution details
      channelId: varchar("channel_id").references(() => acquisitionChannels.id, { onDelete: "set null" }),
      campaignId: varchar("campaign_id").references(() => marketingCampaigns.id, { onDelete: "set null" }),
      // Cost tracking
      acquisitionCost: integer("acquisition_cost").default(0),
      // CAC in cents for this specific lead
      // Attribution metadata
      utmSource: varchar("utm_source"),
      // UTM tracking parameters
      utmMedium: varchar("utm_medium"),
      utmCampaign: varchar("utm_campaign"),
      utmContent: varchar("utm_content"),
      utmTerm: varchar("utm_term"),
      referrerUrl: text("referrer_url"),
      landingPage: varchar("landing_page"),
      // Conversion tracking
      becameDonor: boolean("became_donor").default(false),
      firstDonationDate: timestamp("first_donation_date"),
      firstDonationAmount: integer("first_donation_amount"),
      // In cents
      // Lifetime value tracking (calculated from donations)
      lifetimeDonationValue: integer("lifetime_donation_value").default(0),
      // Total donated in cents
      donationCount: integer("donation_count").default(0),
      lastDonationDate: timestamp("last_donation_date"),
      // Cohort tracking
      acquisitionMonth: varchar("acquisition_month"),
      // 'YYYY-MM' for cohort analysis
      acquisitionQuarter: varchar("acquisition_quarter"),
      // 'YYYY-Q#' for cohort analysis
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("lead_attribution_channel_idx").on(table.channelId),
      index("lead_attribution_campaign_idx").on(table.campaignId),
      index("lead_attribution_month_idx").on(table.acquisitionMonth),
      index("lead_attribution_quarter_idx").on(table.acquisitionQuarter),
      index("lead_attribution_became_donor_idx").on(table.becameDonor)
    ]);
    insertLeadAttributionSchema = createInsertSchema(leadAttribution).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    donorLifecycleStages = pgTable("donor_lifecycle_stages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }).unique(),
      // One lifecycle per lead
      // Link to acquisition source for per-channel lifecycle analysis
      acquisitionChannelId: varchar("acquisition_channel_id").references(() => acquisitionChannels.id, { onDelete: "set null" }),
      acquisitionCampaignId: varchar("acquisition_campaign_id").references(() => marketingCampaigns.id, { onDelete: "set null" }),
      // Current stage
      currentStage: varchar("current_stage").notNull().default("prospect"),
      // 'prospect', 'first_time', 'recurring', 'major_donor', 'legacy', 'lapsed'
      // Stage history with timestamps
      becameFirstTimeDonor: timestamp("became_first_time_donor"),
      becameRecurringDonor: timestamp("became_recurring_donor"),
      becameMajorDonor: timestamp("became_major_donor"),
      // Crossed major donor threshold
      becameLegacyDonor: timestamp("became_legacy_donor"),
      // Joined legacy/planned giving
      becameLapsed: timestamp("became_lapsed"),
      // No donation in X months
      // Economics at each lifecycle stage (for stage-specific CAC:LTGP analysis)
      prospectCAC: integer("prospect_cac").default(0),
      // CAC when acquired as prospect
      firstDonorLTGP: integer("first_donor_ltgp"),
      // LTGP when became first-time donor
      recurringDonorLTGP: integer("recurring_donor_ltgp"),
      // LTGP when became recurring
      majorDonorLTGP: integer("major_donor_ltgp"),
      // LTGP when became major donor
      currentLTGP: integer("current_ltgp").default(0),
      // Current LTGP
      currentLTGPtoCAC: integer("current_ltgp_to_cac"),
      // Current ratio * 100
      // Thresholds and metrics
      majorDonorThreshold: integer("major_donor_threshold").default(1e5),
      // $1,000 in cents (configurable)
      monthsSinceLastDonation: integer("months_since_last_donation"),
      consecutiveMonthsDonating: integer("consecutive_months_donating").default(0),
      // Engagement metrics
      totalLifetimeDonations: integer("total_lifetime_donations").default(0),
      // In cents
      averageDonationAmount: integer("average_donation_amount").default(0),
      // In cents
      donationFrequency: varchar("donation_frequency"),
      // 'one_time', 'monthly', 'quarterly', 'annual', 'sporadic'
      // Retention risk
      retentionRiskScore: integer("retention_risk_score"),
      // 0-100, higher = more at risk of lapsing
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("donor_lifecycle_current_stage_idx").on(table.currentStage),
      index("donor_lifecycle_risk_idx").on(table.retentionRiskScore),
      index("donor_lifecycle_channel_idx").on(table.acquisitionChannelId),
      index("donor_lifecycle_campaign_idx").on(table.acquisitionCampaignId)
    ]);
    insertDonorLifecycleStageSchema = createInsertSchema(donorLifecycleStages).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    channelSpendLedger = pgTable("channel_spend_ledger", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      channelId: varchar("channel_id").references(() => acquisitionChannels.id, { onDelete: "cascade" }),
      campaignId: varchar("campaign_id").references(() => marketingCampaigns.id, { onDelete: "cascade" }),
      // Time period (week or month)
      periodType: varchar("period_type").notNull(),
      // 'week', 'month'
      periodStart: timestamp("period_start").notNull(),
      // Start of period
      periodEnd: timestamp("period_end").notNull(),
      // End of period
      periodKey: varchar("period_key").notNull(),
      // 'YYYY-MM' or 'YYYY-WW' for easy grouping
      // Spend tracking
      amountSpent: integer("amount_spent").notNull().default(0),
      // Amount spent in cents
      // Attribution metrics for this period
      leadsAcquired: integer("leads_acquired").default(0),
      donorsAcquired: integer("donors_acquired").default(0),
      // Notes
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("channel_spend_ledger_channel_idx").on(table.channelId),
      index("channel_spend_ledger_campaign_idx").on(table.campaignId),
      index("channel_spend_ledger_period_idx").on(table.periodKey),
      index("channel_spend_ledger_period_range_idx").on(table.periodStart, table.periodEnd)
    ]);
    insertChannelSpendLedgerSchema = createInsertSchema(channelSpendLedger).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      // Accept ISO strings and coerce to Date objects for timestamp fields
      periodStart: z.union([z.date(), z.string().transform((val) => new Date(val))]),
      periodEnd: z.union([z.date(), z.string().transform((val) => new Date(val))])
    });
    donorEconomics = pgTable("donor_economics", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }).unique(),
      // Lifetime value tracking
      lifetimeRevenue: integer("lifetime_revenue").default(0),
      // Total donations in cents
      // Gross profit calculation
      // Delivery costs = cost to steward this donor (mailings, events, staff time, etc.)
      estimatedDeliveryCosts: integer("estimated_delivery_costs").default(0),
      // In cents
      actualDeliveryCosts: integer("actual_delivery_costs").default(0),
      // In cents (if tracked)
      // LTGP = Lifetime Revenue - Delivery Costs
      lifetimeGrossProfit: integer("lifetime_gross_profit").default(0),
      // In cents (calculated)
      // Margins
      grossMarginPercent: integer("gross_margin_percent"),
      // Percentage (0-100)
      // CAC for this donor (from lead_attribution)
      customerAcquisitionCost: integer("customer_acquisition_cost").default(0),
      // In cents
      // LTGP:CAC ratio for this donor
      ltgpToCacRatio: integer("ltgp_to_cac_ratio"),
      // Ratio * 100 (e.g., 500 = 5:1 ratio)
      // Payback period (days to recover CAC)
      paybackPeriodDays: integer("payback_period_days"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("donor_economics_lead_idx").on(table.leadId),
      index("donor_economics_ratio_idx").on(table.ltgpToCacRatio)
    ]);
    insertDonorEconomicsSchema = createInsertSchema(donorEconomics).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    economicsSettings = pgTable("economics_settings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      // Default delivery cost as percentage of donation (if not tracked per-donor)
      defaultDeliveryCostPercent: integer("default_delivery_cost_percent").default(20),
      // Default 20% of donation goes to stewardship
      // Fixed costs per donor per year (mailings, events, etc.)
      annualDonorStewardshipCost: integer("annual_donor_stewardship_cost").default(5e3),
      // $50 in cents
      // Major donor threshold (when a donor becomes "major")
      majorDonorThreshold: integer("major_donor_threshold").default(1e5),
      // $1,000 in cents
      // Lapsed donor definition (months without donation)
      lapsedMonthsThreshold: integer("lapsed_months_threshold").default(12),
      // 12 months
      // Target ratios
      targetLtgpToCacRatio: integer("target_ltgp_to_cac_ratio").default(500),
      // 5:1 ratio (500 = 5.0x)
      minimumLtgpToCacRatio: integer("minimum_ltgp_to_cac_ratio").default(300),
      // 3:1 minimum (300 = 3.0x)
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertEconomicsSettingsSchema = createInsertSchema(economicsSettings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    techGoesHomeEnrollments = pgTable("tech_goes_home_enrollments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      programName: varchar("program_name").notNull().default("Tech Goes Home"),
      enrollmentDate: timestamp("enrollment_date").notNull().defaultNow(),
      programStartDate: timestamp("program_start_date"),
      programEndDate: timestamp("program_end_date"),
      status: varchar("status").notNull().default("active"),
      // active, completed, withdrawn
      totalClassesRequired: integer("total_classes_required").notNull().default(15),
      completionDate: timestamp("completion_date"),
      certificateIssued: boolean("certificate_issued").default(false),
      chromebookReceived: boolean("chromebook_received").default(false),
      internetActivated: boolean("internet_activated").default(false),
      notes: text("notes"),
      // Admin testing support
      isTestData: boolean("is_test_data").default(false),
      createdByAdminId: varchar("created_by_admin_id").references(() => users.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("tgh_enrollments_user_idx").on(table.userId),
      index("tgh_enrollments_status_idx").on(table.status),
      index("tgh_enrollments_test_data_idx").on(table.isTestData),
      // Compound index for common query pattern: filtering real data by status
      index("tgh_enrollments_real_data_status_idx").on(table.isTestData, table.status)
    ]);
    insertTechGoesHomeEnrollmentSchema = createInsertSchema(techGoesHomeEnrollments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    techGoesHomeAttendance = pgTable("tech_goes_home_attendance", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      enrollmentId: varchar("enrollment_id").notNull().references(() => techGoesHomeEnrollments.id, { onDelete: "cascade" }),
      classDate: timestamp("class_date").notNull(),
      classNumber: integer("class_number").notNull(),
      // 1-15 (or more if including make-ups)
      attended: boolean("attended").notNull().default(true),
      isMakeup: boolean("is_makeup").default(false),
      hoursCredits: integer("hours_credits").notNull().default(2),
      // Usually 2 hours per class
      notes: text("notes"),
      markedByAdminId: varchar("marked_by_admin_id").references(() => users.id, { onDelete: "set null" }),
      // Admin testing support
      isTestData: boolean("is_test_data").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("tgh_attendance_enrollment_idx").on(table.enrollmentId),
      index("tgh_attendance_date_idx").on(table.classDate),
      index("tgh_attendance_test_data_idx").on(table.isTestData),
      uniqueIndex("tgh_attendance_unique_idx").on(table.enrollmentId, table.classDate)
    ]);
    insertTechGoesHomeAttendanceSchema = createInsertSchema(techGoesHomeAttendance).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    volunteerEvents = pgTable("volunteer_events", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      // Event details
      name: varchar("name").notNull(),
      // "Adult Tutoring Program", "Community Event Support", etc.
      description: text("description").notNull(),
      roleDescription: text("role_description"),
      // Specific responsibilities and requirements
      // Coordinator contact
      coordinatorName: varchar("coordinator_name"),
      coordinatorEmail: varchar("coordinator_email"),
      coordinatorPhone: varchar("coordinator_phone"),
      // Location and modality
      location: varchar("location"),
      // Physical address or "Remote"
      modalityOptions: jsonb("modality_options").default(["on_site"]),
      // ['on_site', 'remote', 'hybrid']
      // Hours and commitment
      estimatedHoursPerSession: integer("estimated_hours_per_session").default(2),
      // Default 2 hours
      typicalWeeklyCommitment: varchar("typical_weekly_commitment"),
      // "1-2 hours per week"
      // Requirements
      requiresApplication: boolean("requires_application").default(false),
      applicationUrl: varchar("application_url"),
      requiresBackground: boolean("requires_background_check").default(false),
      // Program classification
      programType: varchar("program_type"),
      // "Adult Education", "Family Development", "Tech Goes Home", "Community Event"
      passionTags: jsonb("passion_tags"),
      // Array: ['literacy', 'stem', 'arts', 'nutrition', 'community']
      // Status
      isActive: boolean("is_active").default(true),
      // Metadata
      metadata: jsonb("metadata"),
      // Additional details
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("volunteer_events_active_idx").on(table.isActive),
      index("volunteer_events_program_idx").on(table.programType)
    ]);
    insertVolunteerEventSchema = createInsertSchema(volunteerEvents).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    volunteerShifts = pgTable("volunteer_shifts", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      eventId: varchar("event_id").notNull().references(() => volunteerEvents.id, { onDelete: "cascade" }),
      // Shift timing
      shiftDate: timestamp("shift_date").notNull(),
      startTime: varchar("start_time").notNull(),
      // "09:30 AM", "6:00 PM"
      endTime: varchar("end_time").notNull(),
      // "2:00 PM", "8:00 PM"
      // Capacity
      maxVolunteers: integer("max_volunteers"),
      // Null = unlimited
      currentEnrollments: integer("current_enrollments").default(0),
      // Shift details
      location: varchar("location"),
      // Override event location if different
      modality: varchar("modality"),
      // 'on_site', 'remote', 'hybrid'
      notes: text("notes"),
      // Specific instructions for this shift
      // Google Calendar integration (optional)
      calendarEventId: varchar("calendar_event_id"),
      // Status
      status: varchar("status").notNull().default("scheduled"),
      // 'scheduled', 'in_progress', 'completed', 'cancelled'
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("volunteer_shifts_event_idx").on(table.eventId),
      index("volunteer_shifts_date_idx").on(table.shiftDate),
      index("volunteer_shifts_status_idx").on(table.status)
    ]);
    insertVolunteerShiftSchema = createInsertSchema(volunteerShifts).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    volunteerEnrollments = pgTable("volunteer_enrollments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      shiftId: varchar("shift_id").notNull().references(() => volunteerShifts.id, { onDelete: "cascade" }),
      // Volunteer (can be authenticated user or lead from CRM)
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
      leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }),
      // Role details
      volunteerRole: varchar("volunteer_role"),
      // "Tutor", "Event Assistant", "Coordinator"
      // Preferences
      preferredModality: varchar("preferred_modality"),
      // 'on_site', 'remote'
      // Application tracking
      applicationStatus: varchar("application_status").default("pending"),
      // 'pending', 'approved', 'rejected', 'waitlisted'
      applicationSubmittedAt: timestamp("application_submitted_at"),
      applicationNotes: text("application_notes"),
      // Enrollment status
      enrollmentStatus: varchar("enrollment_status").notNull().default("registered"),
      // 'registered', 'confirmed', 'checked_in', 'completed', 'no_show', 'cancelled'
      // Communication
      confirmationSent: boolean("confirmation_sent").default(false),
      reminderSent: boolean("reminder_sent").default(false),
      // Metadata
      metadata: jsonb("metadata"),
      // Emergency contact, special requirements, etc.
      // Admin testing support
      isTestData: boolean("is_test_data").default(false),
      createdByAdminId: varchar("created_by_admin_id").references(() => users.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("volunteer_enrollments_shift_idx").on(table.shiftId),
      index("volunteer_enrollments_user_idx").on(table.userId),
      index("volunteer_enrollments_lead_idx").on(table.leadId),
      index("volunteer_enrollments_status_idx").on(table.enrollmentStatus),
      index("volunteer_enrollments_test_data_idx").on(table.isTestData),
      // Compound index for common query pattern: filtering real data by status
      index("volunteer_enrollments_real_data_status_idx").on(table.isTestData, table.enrollmentStatus)
    ]);
    insertVolunteerEnrollmentSchema = createInsertSchema(volunteerEnrollments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    volunteerSessionLogs = pgTable("volunteer_session_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      enrollmentId: varchar("enrollment_id").notNull().references(() => volunteerEnrollments.id, { onDelete: "cascade" }),
      // Attendance tracking
      attended: boolean("attended").notNull().default(true),
      checkInTime: timestamp("check_in_time"),
      checkOutTime: timestamp("check_out_time"),
      // Hours served
      minutesServed: integer("minutes_served").notNull(),
      // Actual minutes volunteered
      // Session details
      sessionNotes: text("session_notes"),
      // What was accomplished, feedback, etc.
      impact: text("impact"),
      // Optional: impact description (students helped, tasks completed)
      // Admin tracking
      loggedBy: varchar("logged_by").references(() => users.id),
      // Admin who logged this session
      // Admin testing support
      isTestData: boolean("is_test_data").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("volunteer_session_logs_enrollment_idx").on(table.enrollmentId),
      index("volunteer_session_logs_created_at_idx").on(table.createdAt),
      index("volunteer_session_logs_test_data_idx").on(table.isTestData)
    ]);
    insertVolunteerSessionLogSchema = createInsertSchema(volunteerSessionLogs).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    segments = pgTable("segments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      description: text("description"),
      // Filter criteria (stored as JSON)
      // Example: { personas: ['donor', 'volunteer'], funnelStages: ['consideration', 'decision'], passions: ['literacy', 'stem'], engagementMin: 50, lastActivityDays: 30, excludeUnsubscribed: true, excludeSmsUnsubscribed: true }
      filters: jsonb("filters").notNull(),
      // Metadata
      isActive: boolean("is_active").default(true),
      createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("segments_created_by_idx").on(table.createdBy),
      index("segments_is_active_idx").on(table.isActive)
    ]);
    segmentFiltersSchema = z.object({
      personas: z.array(z.string()).optional(),
      funnelStages: z.array(z.string()).optional(),
      passions: z.array(z.string()).optional(),
      engagementMin: z.number().min(0).max(100).optional(),
      engagementMax: z.number().min(0).max(100).optional(),
      lastActivityDays: z.number().min(0).optional(),
      excludeUnsubscribed: z.boolean().optional(),
      excludeSmsUnsubscribed: z.boolean().optional()
      // TCPA compliance: filter SMS opt-outs
    }).strict();
    insertSegmentSchema = createInsertSchema(segments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      filters: segmentFiltersSchema
      // Add proper validation for filters JSONB field
    });
    updateSegmentSchema = createInsertSchema(segments).omit({
      id: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      filters: segmentFiltersSchema.partial()
      // Partial for updates
    }).partial();
    emailUnsubscribes = pgTable("email_unsubscribes", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      // Lead reference (nullable for non-lead contacts)
      leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
      // Channel: 'email', 'sms', or 'all'
      channel: varchar("channel").notNull().default("email"),
      // Contact info (at least one required)
      email: varchar("email"),
      // For email unsubscribes
      phone: varchar("phone"),
      // For SMS unsubscribes
      // Soft delete support (for resubscribe via START keyword)
      isActive: boolean("is_active").notNull().default(true),
      // false = resubscribed
      resubscribedAt: timestamp("resubscribed_at"),
      // When they resubscribed via START
      // Unsubscribe details
      reason: varchar("reason"),
      // 'too_frequent', 'not_interested', 'irrelevant', 'other'
      feedback: text("feedback"),
      // Optional detailed feedback
      // Source tracking
      source: varchar("source").default("user_request"),
      // 'user_request', 'bounce', 'spam_complaint', 'admin', 'keyword' (for SMS STOP)
      campaignId: varchar("campaign_id").references(() => emailCampaigns.id, { onDelete: "set null" }),
      // Campaign that triggered unsubscribe (if any)
      // Timestamps
      unsubscribedAt: timestamp("unsubscribed_at").defaultNow(),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => ({
      // Regular indexes
      emailIdx: index("email_unsubscribes_email_idx").on(table.email),
      phoneIdx: index("email_unsubscribes_phone_idx").on(table.phone),
      channelIdx: index("email_unsubscribes_channel_idx").on(table.channel),
      isActiveIdx: index("email_unsubscribes_is_active_idx").on(table.isActive),
      leadIdIdx: index("email_unsubscribes_lead_id_idx").on(table.leadId),
      unsubscribedAtIdx: index("email_unsubscribes_unsubscribed_at_idx").on(table.unsubscribedAt),
      // Partial unique indexes - prevent duplicate active unsubscribes per channel
      // Unique for (channel, email) where email is not null and is_active=true
      channelEmailUnique: uniqueIndex("email_unsubscribes_channel_email_unique").on(table.channel, table.email).where(sql`${table.email} IS NOT NULL AND ${table.isActive} = true`),
      // Unique for (channel, phone) where phone is not null and is_active=true
      channelPhoneUnique: uniqueIndex("email_unsubscribes_channel_phone_unique").on(table.channel, table.phone).where(sql`${table.phone} IS NOT NULL AND ${table.isActive} = true`)
    }));
    insertEmailUnsubscribeSchema = createInsertSchema(emailUnsubscribes).omit({
      id: true,
      unsubscribedAt: true,
      createdAt: true,
      resubscribedAt: true
    }).refine(
      (data) => {
        const channel = data.channel || "email";
        if (channel === "email" && !data.email) return false;
        if (channel === "sms" && !data.phone) return false;
        if (channel === "all" && (!data.email || !data.phone)) return false;
        if (!data.email && !data.phone) return false;
        return true;
      },
      { message: "Email required for email channel (default), phone required for SMS channel, both required for all channel" }
    );
    programs = pgTable("programs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      // Program identification
      name: varchar("name").notNull(),
      // "Tech Goes Home Spring 2024", "Adult Tutoring - Saturday Morning"
      programType: varchar("program_type").notNull().$type(),
      // "student_program" | "volunteer_opportunity"
      description: text("description"),
      // Type-safe foreign keys (one will be populated based on programType)
      techGoesHomeEnrollmentTemplate: varchar("tgh_enrollment_template"),
      // For student programs: template settings
      volunteerShiftId: varchar("volunteer_shift_id").references(() => volunteerShifts.id, { onDelete: "set null" }),
      volunteerEventId: varchar("volunteer_event_id").references(() => volunteerEvents.id, { onDelete: "set null" }),
      // Test data generation configuration
      autoPopulateConfig: jsonb("auto_populate_config").$type(),
      // Status
      isActive: boolean("is_active").default(true),
      isAvailableForTesting: boolean("is_available_for_testing").default(true),
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("programs_type_idx").on(table.programType),
      index("programs_active_idx").on(table.isActive)
    ]);
    insertProgramSchema = createInsertSchema(programs).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    adminEntitlements = pgTable("admin_entitlements", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      // Which admin is testing
      adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      // Which program they're testing
      programId: varchar("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
      // The actual enrollment record created (polymorphic based on program type)
      tghEnrollmentId: varchar("tgh_enrollment_id").references(() => techGoesHomeEnrollments.id, { onDelete: "set null" }),
      volunteerEnrollmentId: varchar("volunteer_enrollment_id").references(() => volunteerEnrollments.id, { onDelete: "set null" }),
      // Metadata for context
      metadata: jsonb("metadata"),
      // Status (soft delete for history)
      isActive: boolean("is_active").default(true),
      deactivatedAt: timestamp("deactivated_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("admin_entitlements_admin_idx").on(table.adminId),
      index("admin_entitlements_program_idx").on(table.programId),
      index("admin_entitlements_admin_active_idx").on(table.adminId, table.isActive),
      // Partial unique: prevent duplicate active entitlements for same admin+program
      // Only enforced when is_active = true, allows historical inactive rows
      uniqueIndex("admin_entitlements_unique_active_idx").on(table.adminId, table.programId).where(sql`${table.isActive} = true`)
    ]);
    insertAdminEntitlementSchema = createInsertSchema(adminEntitlements).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    adminImpersonationSessions = pgTable("admin_impersonation_sessions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      // Who is impersonating whom
      adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      impersonatedUserId: varchar("impersonated_user_id").references(() => users.id, { onDelete: "set null" }),
      // Session tracking
      isActive: boolean("is_active").default(true),
      startedAt: timestamp("started_at").defaultNow(),
      endedAt: timestamp("ended_at"),
      // Audit details (captured at session start)
      reason: text("reason"),
      // Optional: why admin is impersonating
      ipAddress: varchar("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("impersonation_sessions_admin_idx").on(table.adminId),
      index("impersonation_sessions_user_idx").on(table.impersonatedUserId),
      // Compound index for active session lookups
      index("impersonation_sessions_admin_active_idx").on(table.adminId).where(sql`${table.isActive} = true`),
      // Partial unique: only one active impersonation per admin at a time
      // Prevents concurrent impersonations, enforced only when is_active = true
      uniqueIndex("impersonation_sessions_unique_active_idx").on(table.adminId).where(sql`${table.isActive} = true`)
    ]);
    insertAdminImpersonationSessionSchema = createInsertSchema(adminImpersonationSessions).omit({
      id: true,
      createdAt: true
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool
});
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 1e4,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
    });
    db = drizzle(pool, { schema: schema_exports });
  }
});

// server/storage/cacLtgpStorage.ts
import { eq, desc, count } from "drizzle-orm";
function createCacLtgpStorage() {
  return {
    // Acquisition Channels
    async createAcquisitionChannel(channel) {
      const [created] = await db.insert(acquisitionChannels).values(channel).returning();
      return created;
    },
    async getAcquisitionChannel(id) {
      const [channel] = await db.select().from(acquisitionChannels).where(eq(acquisitionChannels.id, id));
      return channel;
    },
    async getAllAcquisitionChannels() {
      return await db.select().from(acquisitionChannels).orderBy(desc(acquisitionChannels.createdAt));
    },
    async getActiveAcquisitionChannels() {
      return await db.select().from(acquisitionChannels).where(eq(acquisitionChannels.isActive, true)).orderBy(desc(acquisitionChannels.createdAt));
    },
    async updateAcquisitionChannel(id, updates) {
      const [updated] = await db.update(acquisitionChannels).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(acquisitionChannels.id, id)).returning();
      return updated;
    },
    async deleteAcquisitionChannel(id) {
      await db.delete(acquisitionChannels).where(eq(acquisitionChannels.id, id));
    },
    // Marketing Campaigns
    async createMarketingCampaign(campaign) {
      const [created] = await db.insert(marketingCampaigns).values(campaign).returning();
      return created;
    },
    async getMarketingCampaign(id) {
      const [campaign] = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.id, id));
      return campaign;
    },
    async getAllMarketingCampaigns() {
      return await db.select().from(marketingCampaigns).orderBy(desc(marketingCampaigns.createdAt));
    },
    async getActiveMarketingCampaigns() {
      return await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.status, "active")).orderBy(desc(marketingCampaigns.startDate));
    },
    async getCampaignsByChannel(channelId) {
      return await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.channelId, channelId)).orderBy(desc(marketingCampaigns.startDate));
    },
    async updateMarketingCampaign(id, updates) {
      const [updated] = await db.update(marketingCampaigns).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(marketingCampaigns.id, id)).returning();
      return updated;
    },
    async deleteMarketingCampaign(id) {
      await db.delete(marketingCampaigns).where(eq(marketingCampaigns.id, id));
    },
    // Channel Spend Ledger
    async createSpendEntry(entry) {
      const [created] = await db.insert(channelSpendLedger).values(entry).returning();
      return created;
    },
    async getAllSpendEntries() {
      return await db.select().from(channelSpendLedger).orderBy(desc(channelSpendLedger.periodStart));
    },
    async getSpendEntriesByChannel(channelId) {
      return await db.select().from(channelSpendLedger).where(eq(channelSpendLedger.channelId, channelId)).orderBy(desc(channelSpendLedger.periodStart));
    },
    async getSpendEntriesByCampaign(campaignId) {
      return await db.select().from(channelSpendLedger).where(eq(channelSpendLedger.campaignId, campaignId)).orderBy(desc(channelSpendLedger.periodStart));
    },
    async getSpendEntriesByPeriod(periodKey) {
      return await db.select().from(channelSpendLedger).where(eq(channelSpendLedger.periodKey, periodKey)).orderBy(desc(channelSpendLedger.periodStart));
    },
    async updateSpendEntry(id, updates) {
      const [updated] = await db.update(channelSpendLedger).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(channelSpendLedger.id, id)).returning();
      return updated;
    },
    async deleteSpendEntry(id) {
      await db.delete(channelSpendLedger).where(eq(channelSpendLedger.id, id));
    },
    // Lead Attribution
    async createLeadAttribution(attribution) {
      const [created] = await db.insert(leadAttribution).values(attribution).returning();
      return created;
    },
    async getLeadAttribution(leadId) {
      const [attribution] = await db.select().from(leadAttribution).where(eq(leadAttribution.leadId, leadId));
      return attribution;
    },
    async getAttributionsByChannel(channelId) {
      return await db.select().from(leadAttribution).where(eq(leadAttribution.channelId, channelId)).orderBy(desc(leadAttribution.attributedAt));
    },
    async getAttributionsByCampaign(campaignId) {
      return await db.select().from(leadAttribution).where(eq(leadAttribution.campaignId, campaignId)).orderBy(desc(leadAttribution.attributedAt));
    },
    async updateLeadAttribution(leadId, updates) {
      const [updated] = await db.update(leadAttribution).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(leadAttribution.leadId, leadId)).returning();
      return updated;
    },
    // Donor Lifecycle Stages
    async createDonorLifecycleStage(stage) {
      const [created] = await db.insert(donorLifecycleStages).values(stage).returning();
      return created;
    },
    async getDonorLifecycleStage(leadId) {
      const [stage] = await db.select().from(donorLifecycleStages).where(eq(donorLifecycleStages.leadId, leadId));
      return stage;
    },
    async getAllDonorLifecycleStages() {
      return await db.select().from(donorLifecycleStages).orderBy(desc(donorLifecycleStages.createdAt));
    },
    async getDonorsByStage(stage) {
      return await db.select().from(donorLifecycleStages).where(eq(donorLifecycleStages.currentStage, stage)).orderBy(desc(donorLifecycleStages.updatedAt));
    },
    async updateDonorLifecycleStage(leadId, updates) {
      const [updated] = await db.update(donorLifecycleStages).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(donorLifecycleStages.leadId, leadId)).returning();
      return updated;
    },
    // Donor Economics
    async createDonorEconomics(economics) {
      const [created] = await db.insert(donorEconomics).values(economics).returning();
      return created;
    },
    async getDonorEconomics(leadId) {
      const [economics] = await db.select().from(donorEconomics).where(eq(donorEconomics.leadId, leadId));
      return economics;
    },
    async updateDonorEconomics(leadId, updates) {
      const [updated] = await db.update(donorEconomics).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(donorEconomics.leadId, leadId)).returning();
      return updated;
    },
    // Economics Settings
    async getEconomicsSettings() {
      const [settings] = await db.select().from(economicsSettings).limit(1);
      return settings;
    },
    async updateEconomicsSettings(updates) {
      const existing = await db.select().from(economicsSettings).limit(1);
      if (existing.length > 0) {
        const [updated] = await db.update(economicsSettings).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(economicsSettings.id, existing[0].id)).returning();
        return updated;
      } else {
        const [created] = await db.insert(economicsSettings).values(updates).returning();
        return created;
      }
    },
    // Donor Lifecycle Queries (with JOINs)
    async listLifecycleWithLeads(params) {
      const { stage, page, limit } = params;
      const offset = (page - 1) * limit;
      const whereClause = stage ? eq(donorLifecycleStages.currentStage, stage) : void 0;
      const [donorsResult, totalResult] = await Promise.all([
        // Fetch paginated donors with JOIN
        db.select({
          // Lead fields
          leadId: leads.id,
          email: leads.email,
          firstName: leads.firstName,
          lastName: leads.lastName,
          phone: leads.phone,
          leadStatus: leads.status,
          // Lifecycle fields
          currentStage: donorLifecycleStages.currentStage,
          totalLifetimeDonations: donorLifecycleStages.totalLifetimeDonations,
          averageDonationAmount: donorLifecycleStages.averageDonationAmount,
          donationFrequency: donorLifecycleStages.donationFrequency,
          monthsSinceLastDonation: donorLifecycleStages.monthsSinceLastDonation,
          consecutiveMonthsDonating: donorLifecycleStages.consecutiveMonthsDonating,
          // Stage timestamps
          becameFirstTimeDonor: donorLifecycleStages.becameFirstTimeDonor,
          becameRecurringDonor: donorLifecycleStages.becameRecurringDonor,
          becameMajorDonor: donorLifecycleStages.becameMajorDonor,
          becameLapsed: donorLifecycleStages.becameLapsed,
          // Economics
          currentLTGP: donorLifecycleStages.currentLTGP,
          currentLTGPtoCAC: donorLifecycleStages.currentLTGPtoCAC,
          // Metadata
          lifecycleUpdatedAt: donorLifecycleStages.updatedAt
        }).from(donorLifecycleStages).leftJoin(leads, eq(donorLifecycleStages.leadId, leads.id)).where(whereClause).orderBy(desc(donorLifecycleStages.updatedAt)).limit(limit).offset(offset),
        // Count total matching records
        db.select({ total: count() }).from(donorLifecycleStages).where(whereClause).then((result) => result[0]?.total || 0)
      ]);
      return {
        donors: donorsResult,
        total: Number(totalResult)
      };
    },
    async countLifecycleByStage() {
      const results = await db.select({
        stage: donorLifecycleStages.currentStage,
        count: count()
      }).from(donorLifecycleStages).groupBy(donorLifecycleStages.currentStage);
      const stageCounts = {
        prospect: 0,
        first_time: 0,
        recurring: 0,
        major_donor: 0,
        lapsed: 0
      };
      for (const row of results) {
        if (row.stage) {
          stageCounts[row.stage] = Number(row.count);
        }
      }
      return stageCounts;
    }
  };
}
var init_cacLtgpStorage = __esm({
  "server/storage/cacLtgpStorage.ts"() {
    "use strict";
    init_schema();
    init_db();
  }
});

// server/storage/tghStorage.ts
import { eq as eq2, desc as desc2, and as and2 } from "drizzle-orm";
function createTechGoesHomeStorage() {
  return {
    // Enrollment operations
    async createTechGoesHomeEnrollment(enrollment) {
      const [created] = await db.insert(techGoesHomeEnrollments).values(enrollment).returning();
      return created;
    },
    async getTechGoesHomeEnrollment(id) {
      const [enrollment] = await db.select().from(techGoesHomeEnrollments).where(eq2(techGoesHomeEnrollments.id, id));
      return enrollment;
    },
    async getTechGoesHomeEnrollmentByUserId(userId) {
      const [enrollment] = await db.select().from(techGoesHomeEnrollments).where(
        and2(
          eq2(techGoesHomeEnrollments.userId, userId),
          eq2(techGoesHomeEnrollments.status, "active")
        )
      ).orderBy(desc2(techGoesHomeEnrollments.createdAt)).limit(1);
      return enrollment;
    },
    async getAllTechGoesHomeEnrollments() {
      return await db.select().from(techGoesHomeEnrollments).orderBy(desc2(techGoesHomeEnrollments.enrollmentDate));
    },
    async getActiveTechGoesHomeEnrollments() {
      return await db.select().from(techGoesHomeEnrollments).where(eq2(techGoesHomeEnrollments.status, "active")).orderBy(desc2(techGoesHomeEnrollments.enrollmentDate));
    },
    async updateTechGoesHomeEnrollment(id, updates) {
      const [updated] = await db.update(techGoesHomeEnrollments).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(techGoesHomeEnrollments.id, id)).returning();
      return updated;
    },
    // Attendance operations
    async createTechGoesHomeAttendance(attendance) {
      const [created] = await db.insert(techGoesHomeAttendance).values(attendance).returning();
      return created;
    },
    async getTechGoesHomeAttendance(enrollmentId) {
      return await db.select().from(techGoesHomeAttendance).where(eq2(techGoesHomeAttendance.enrollmentId, enrollmentId)).orderBy(techGoesHomeAttendance.classDate);
    },
    async updateTechGoesHomeAttendance(id, updates) {
      const [updated] = await db.update(techGoesHomeAttendance).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(techGoesHomeAttendance.id, id)).returning();
      return updated;
    },
    async deleteTechGoesHomeAttendance(id) {
      await db.delete(techGoesHomeAttendance).where(eq2(techGoesHomeAttendance.id, id));
    },
    // Progress tracking with aggregation
    async getStudentProgress(userId) {
      const enrollment = await this.getTechGoesHomeEnrollmentByUserId(userId);
      if (!enrollment) {
        return null;
      }
      const totalRequired = enrollment.totalClassesRequired || 15;
      if (totalRequired <= 0) {
        return {
          enrollment,
          attendance: [],
          classesCompleted: 0,
          classesRemaining: totalRequired,
          hoursCompleted: 0,
          percentComplete: 0,
          isEligibleForRewards: false
        };
      }
      const attendance = await this.getTechGoesHomeAttendance(enrollment.id);
      const attendedClasses = attendance.filter((a) => a.attended);
      const classesCompleted = attendedClasses.length;
      const hoursCompleted = attendedClasses.reduce((total, a) => total + (a.hoursCredits || 0), 0);
      const classesRemaining = Math.max(0, totalRequired - classesCompleted);
      const percentComplete = Math.min(100, Math.round(classesCompleted / totalRequired * 100));
      const isEligibleForRewards = classesCompleted >= totalRequired;
      return {
        enrollment,
        attendance,
        classesCompleted,
        classesRemaining,
        hoursCompleted,
        percentComplete,
        isEligibleForRewards
      };
    }
  };
}
var init_tghStorage = __esm({
  "server/storage/tghStorage.ts"() {
    "use strict";
    init_schema();
    init_db();
  }
});

// server/storage/adminProvisioningStorage.ts
import { eq as eq3, and as and3, sql as sql4, desc as desc3 } from "drizzle-orm";
function createAdminProvisioningStorage(db2) {
  return {
    // ====================
    // Program CRUD
    // ====================
    async createProgram(program) {
      const [created] = await db2.insert(programs).values(program).returning();
      return created;
    },
    async getAllPrograms(filters) {
      const conditions = [];
      if (filters?.programType) {
        conditions.push(eq3(programs.programType, filters.programType));
      }
      if (filters?.isActive !== void 0) {
        conditions.push(eq3(programs.isActive, filters.isActive));
      }
      if (filters?.isAvailableForTesting !== void 0) {
        conditions.push(eq3(programs.isAvailableForTesting, filters.isAvailableForTesting));
      }
      if (conditions.length === 0) {
        return await db2.select().from(programs).orderBy(programs.name);
      }
      return await db2.select().from(programs).where(and3(...conditions)).orderBy(programs.name);
    },
    async getProgram(id) {
      const [program] = await db2.select().from(programs).where(eq3(programs.id, id)).limit(1);
      return program;
    },
    async updateProgram(id, updates) {
      const [updated] = await db2.update(programs).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(programs.id, id)).returning();
      return updated;
    },
    async deleteProgram(id) {
      await db2.update(programs).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(programs.id, id));
    },
    // ====================
    // Admin Entitlements
    // ====================
    async createAdminEntitlement(params) {
      return await db2.transaction(async (tx) => {
        const [program] = await tx.select().from(programs).where(eq3(programs.id, params.programId)).limit(1);
        if (!program) {
          throw new Error(`Program ${params.programId} not found`);
        }
        let enrollmentId;
        let tghEnrollmentId = null;
        let volunteerEnrollmentId = null;
        if (program.programType === "student_program" || program.programType === "student_tgh") {
          const autoConfig = program.autoPopulateConfig || {};
          const progressPercent = autoConfig.progressPercent || 50;
          const attendanceCount = autoConfig.attendanceCount || 8;
          const [enrollment] = await tx.insert(techGoesHomeEnrollments).values({
            userId: params.adminId,
            programName: program.name,
            status: "active",
            totalClassesRequired: 15,
            isTestData: true,
            createdByAdminId: params.adminId
          }).returning();
          enrollmentId = enrollment.id;
          tghEnrollmentId = enrollment.id;
          for (let i = 0; i < attendanceCount; i++) {
            const classDate = /* @__PURE__ */ new Date();
            classDate.setDate(classDate.getDate() - (attendanceCount - i) * 7);
            await tx.insert(techGoesHomeAttendance).values({
              enrollmentId: enrollment.id,
              classDate,
              classNumber: i + 1,
              attended: true,
              hoursCredits: 2,
              isTestData: true
            });
          }
        } else if (program.programType === "volunteer_opportunity") {
          if (!program.volunteerShiftId) {
            throw new Error(`Program ${program.name} has no volunteer shift configured`);
          }
          const [enrollment] = await tx.insert(volunteerEnrollments).values({
            shiftId: program.volunteerShiftId,
            userId: params.adminId,
            enrollmentStatus: "confirmed",
            applicationStatus: "approved",
            isTestData: true,
            createdByAdminId: params.adminId
          }).returning();
          enrollmentId = enrollment.id;
          volunteerEnrollmentId = enrollment.id;
          const autoConfig = program.autoPopulateConfig || {};
          const hoursServed = autoConfig.hoursServed || 2;
          const minutesServed = hoursServed * 60;
          const sessionDate = /* @__PURE__ */ new Date();
          sessionDate.setDate(sessionDate.getDate() - 7);
          await tx.insert(volunteerSessionLogs).values({
            enrollmentId: enrollment.id,
            attended: true,
            checkInTime: sessionDate,
            checkOutTime: new Date(sessionDate.getTime() + minutesServed * 60 * 1e3),
            minutesServed,
            isTestData: true
          });
        } else {
          throw new Error(`Unknown program type: ${program.programType}`);
        }
        const [entitlement] = await tx.insert(adminEntitlements).values({
          adminId: params.adminId,
          programId: params.programId,
          tghEnrollmentId,
          volunteerEnrollmentId,
          metadata: params.metadata,
          isActive: true
        }).returning();
        return { entitlement, enrollmentId };
      });
    },
    async getActiveAdminEntitlements(adminId) {
      return await db2.select().from(adminEntitlements).where(and3(
        eq3(adminEntitlements.adminId, adminId),
        eq3(adminEntitlements.isActive, true)
      )).orderBy(desc3(adminEntitlements.createdAt));
    },
    async getAdminEntitlements(adminId) {
      return await db2.select().from(adminEntitlements).where(eq3(adminEntitlements.adminId, adminId)).orderBy(desc3(adminEntitlements.createdAt));
    },
    async getAdminEntitlement(id) {
      const [entitlement] = await db2.select().from(adminEntitlements).where(eq3(adminEntitlements.id, id)).limit(1);
      return entitlement;
    },
    async updateAdminEntitlementStatus(id, isActive) {
      const updateData = {
        isActive,
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (!isActive) {
        updateData.deactivatedAt = /* @__PURE__ */ new Date();
      }
      const [updated] = await db2.update(adminEntitlements).set(updateData).where(eq3(adminEntitlements.id, id)).returning();
      return updated;
    },
    async hasActiveEntitlement(adminId, programId) {
      const [result] = await db2.select({ count: sql4`count(*)` }).from(adminEntitlements).where(and3(
        eq3(adminEntitlements.adminId, adminId),
        eq3(adminEntitlements.programId, programId),
        eq3(adminEntitlements.isActive, true)
      ));
      return (result?.count ?? 0) > 0;
    },
    async getActiveAdminEntitlementsWithPrograms(adminId) {
      const results = await db2.select().from(adminEntitlements).innerJoin(programs, eq3(adminEntitlements.programId, programs.id)).where(and3(
        eq3(adminEntitlements.adminId, adminId),
        eq3(adminEntitlements.isActive, true)
      )).orderBy(desc3(adminEntitlements.createdAt));
      return results.map((row) => ({
        ...row.admin_entitlements,
        program: row.programs
      }));
    },
    async getAllAdminEntitlementsWithPrograms() {
      const results = await db2.select().from(adminEntitlements).innerJoin(programs, eq3(adminEntitlements.programId, programs.id)).where(eq3(adminEntitlements.isActive, true)).orderBy(desc3(adminEntitlements.createdAt));
      return results.map((row) => ({
        ...row.admin_entitlements,
        program: row.programs
      }));
    },
    // ====================
    // Impersonation Sessions
    // ====================
    async createImpersonationSession(session2) {
      return await db2.transaction(async (tx) => {
        await tx.update(adminImpersonationSessions).set({
          isActive: false,
          endedAt: /* @__PURE__ */ new Date()
        }).where(and3(
          eq3(adminImpersonationSessions.adminId, session2.adminId),
          eq3(adminImpersonationSessions.isActive, true)
        ));
        const [created] = await tx.insert(adminImpersonationSessions).values({
          ...session2,
          isActive: true,
          startedAt: /* @__PURE__ */ new Date()
        }).returning();
        return created;
      });
    },
    async getActiveImpersonationSession(adminId) {
      const [session2] = await db2.select().from(adminImpersonationSessions).where(and3(
        eq3(adminImpersonationSessions.adminId, adminId),
        eq3(adminImpersonationSessions.isActive, true)
      )).limit(1);
      return session2;
    },
    async getImpersonationSessions(adminId) {
      return await db2.select().from(adminImpersonationSessions).where(eq3(adminImpersonationSessions.adminId, adminId)).orderBy(desc3(adminImpersonationSessions.createdAt));
    },
    async endImpersonationSession(sessionId) {
      const [updated] = await db2.update(adminImpersonationSessions).set({
        isActive: false,
        endedAt: /* @__PURE__ */ new Date()
      }).where(eq3(adminImpersonationSessions.id, sessionId)).returning();
      return updated;
    },
    async getCurrentlyImpersonatedUser(adminId) {
      const results = await db2.select().from(adminImpersonationSessions).innerJoin(users, eq3(adminImpersonationSessions.impersonatedUserId, users.id)).where(and3(
        eq3(adminImpersonationSessions.adminId, adminId),
        eq3(adminImpersonationSessions.isActive, true)
      )).limit(1);
      return results[0]?.users;
    },
    async hasActiveImpersonation(adminId) {
      const [result] = await db2.select({ count: sql4`count(*)` }).from(adminImpersonationSessions).where(and3(
        eq3(adminImpersonationSessions.adminId, adminId),
        eq3(adminImpersonationSessions.isActive, true)
      ));
      return (result?.count ?? 0) > 0;
    }
  };
}
var init_adminProvisioningStorage = __esm({
  "server/storage/adminProvisioningStorage.ts"() {
    "use strict";
    init_schema();
  }
});

// server/statsUtils.ts
function calculateStatisticalConfidence(controlConversions, controlSample, treatmentConversions, treatmentSample) {
  if (controlSample === 0 || treatmentSample === 0) {
    return 0;
  }
  const p1 = controlConversions / controlSample;
  const p2 = treatmentConversions / treatmentSample;
  const pooledP = (controlConversions + treatmentConversions) / (controlSample + treatmentSample);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / controlSample + 1 / treatmentSample));
  if (se === 0) {
    return 0;
  }
  const z3 = Math.abs(p2 - p1) / se;
  const confidence = (1 - 2 * (1 - normalCDF(z3))) * 100;
  return Math.max(0, Math.min(100, confidence));
}
function normalCDF(z3) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z3));
  const d = 0.3989423 * Math.exp(-z3 * z3 / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z3 > 0 ? 1 - prob : prob;
}
var init_statsUtils = __esm({
  "server/statsUtils.ts"() {
    "use strict";
  }
});

// server/services/segmentEvaluation.ts
var segmentEvaluation_exports = {};
__export(segmentEvaluation_exports, {
  SegmentEvaluationService: () => SegmentEvaluationService,
  segmentEvaluationService: () => segmentEvaluationService
});
import { and as and4, sql as sql5 } from "drizzle-orm";
var SegmentEvaluationService, segmentEvaluationService;
var init_segmentEvaluation = __esm({
  "server/services/segmentEvaluation.ts"() {
    "use strict";
    init_db();
    init_schema();
    SegmentEvaluationService = class {
      /**
       * Build SQL condition to exclude SMS unsubscribes
       * TCPA compliance: filters leads who opted out via STOP keyword or manual unsubscribe
       * Note: Leads without phone numbers pass the filter (can't opt out of SMS without a phone)
       */
      buildSmsUnsubscribeCondition() {
        return sql5`(
      ${leads.phone} IS NULL OR NOT EXISTS (
        SELECT 1 FROM ${emailUnsubscribes}
        WHERE ${emailUnsubscribes.phone} = ${leads.phone}
          AND ${emailUnsubscribes.channel} IN ('sms', 'all')
          AND ${emailUnsubscribes.isActive} = true
      )
    )`;
      }
      /**
       * Build common filter conditions (DRY helper)
       */
      buildFilterConditions(filters) {
        const conditions = [];
        if (filters.personas && filters.personas.length > 0) {
          conditions.push(sql5`(${leads.persona} = ANY(array[${sql5.join(filters.personas.map((p) => sql5`${p}`), sql5`, `)}]::text[]))`);
        }
        if (filters.funnelStages && filters.funnelStages.length > 0) {
          conditions.push(sql5`(${leads.funnelStage} = ANY(array[${sql5.join(filters.funnelStages.map((fs) => sql5`${fs}`), sql5`, `)}]::text[]))`);
        }
        if (filters.passions && filters.passions.length > 0) {
          conditions.push(sql5`(${leads.passions} ?| array[${sql5.join(filters.passions.map((p) => sql5`${p}`), sql5`, `)}]::text[])`);
        }
        if (filters.engagementMin !== void 0) {
          conditions.push(sql5`(${leads.engagementScore} IS NOT NULL AND ${leads.engagementScore} >= ${filters.engagementMin})`);
        }
        if (filters.engagementMax !== void 0) {
          conditions.push(sql5`(${leads.engagementScore} IS NOT NULL AND ${leads.engagementScore} <= ${filters.engagementMax})`);
        }
        if (filters.lastActivityDays !== void 0) {
          const cutoffDate = /* @__PURE__ */ new Date();
          cutoffDate.setDate(cutoffDate.getDate() - filters.lastActivityDays);
          conditions.push(sql5`(${leads.lastInteractionDate} IS NOT NULL AND ${leads.lastInteractionDate} >= ${cutoffDate.toISOString()})`);
        }
        if (filters.excludeUnsubscribed) {
          conditions.push(sql5`(
        NOT EXISTS (
          SELECT 1 FROM ${emailUnsubscribes}
          WHERE ${emailUnsubscribes.email} = ${leads.email}
            AND ${emailUnsubscribes.channel} IN ('email', 'all')
            AND ${emailUnsubscribes.isActive} = true
        )
      )`);
        }
        if (filters.excludeSmsUnsubscribed) {
          conditions.push(this.buildSmsUnsubscribeCondition());
        }
        return conditions;
      }
      /**
       * Evaluate segment filters and return matching leads
       */
      async evaluateFilters(filters, options) {
        const conditions = this.buildFilterConditions(filters);
        let query = db.select().from(leads);
        if (conditions.length > 0) {
          query = query.where(and4(...conditions));
        }
        if (options?.limit) {
          query = query.limit(options.limit);
        }
        return await query;
      }
      /**
       * Get count of leads matching segment criteria
       */
      async getSegmentSize(filters) {
        const conditions = this.buildFilterConditions(filters);
        const whereClause = conditions.length > 0 ? and4(...conditions) : void 0;
        let query = db.select({ count: sql5`count(*)` }).from(leads);
        if (whereClause) {
          query = query.where(whereClause);
        }
        const result = await query;
        return result[0]?.count || 0;
      }
      /**
       * Get detailed segment statistics including unsubscribe counts
       * Used by admin preview to show filtering impact
       */
      async getSegmentStats(filters) {
        const baseFilters = { ...filters };
        delete baseFilters.excludeUnsubscribed;
        delete baseFilters.excludeSmsUnsubscribed;
        const baseConditions = this.buildFilterConditions(baseFilters);
        const baseWhereClause = baseConditions.length > 0 ? and4(...baseConditions) : void 0;
        let totalQuery = db.select({ count: sql5`count(*)` }).from(leads);
        if (baseWhereClause) {
          totalQuery = totalQuery.where(baseWhereClause);
        }
        const totalResult = await totalQuery;
        const totalMatched = totalResult[0]?.count || 0;
        let emailUnsubscribedCount;
        if (filters.excludeUnsubscribed) {
          const emailUnsubConditions = [...baseConditions];
          emailUnsubConditions.push(sql5`(
        EXISTS (
          SELECT 1 FROM ${emailUnsubscribes}
          WHERE ${emailUnsubscribes.email} = ${leads.email}
            AND ${emailUnsubscribes.channel} IN ('email', 'all')
            AND ${emailUnsubscribes.isActive} = true
        )
      )`);
          let emailUnsubQuery = db.select({ count: sql5`count(*)` }).from(leads);
          if (emailUnsubConditions.length > 0) {
            emailUnsubQuery = emailUnsubQuery.where(and4(...emailUnsubConditions));
          }
          const emailResult = await emailUnsubQuery;
          emailUnsubscribedCount = emailResult[0]?.count || 0;
        }
        let smsUnsubscribedCount;
        if (filters.excludeSmsUnsubscribed) {
          const smsUnsubConditions = [...baseConditions];
          smsUnsubConditions.push(sql5`(
        ${leads.phone} IS NOT NULL AND EXISTS (
          SELECT 1 FROM ${emailUnsubscribes}
          WHERE ${emailUnsubscribes.phone} = ${leads.phone}
            AND ${emailUnsubscribes.channel} IN ('sms', 'all')
            AND ${emailUnsubscribes.isActive} = true
        )
      )`);
          let smsUnsubQuery = db.select({ count: sql5`count(*)` }).from(leads);
          if (smsUnsubConditions.length > 0) {
            smsUnsubQuery = smsUnsubQuery.where(and4(...smsUnsubConditions));
          }
          const smsResult = await smsUnsubQuery;
          smsUnsubscribedCount = smsResult[0]?.count || 0;
        }
        const effectiveCount = await this.getSegmentSize(filters);
        return {
          totalMatched,
          emailUnsubscribedCount,
          smsUnsubscribedCount,
          effectiveCount
        };
      }
      /**
       * Preview segment with limited results
       */
      async previewSegment(filters, limit = 10) {
        return await this.evaluateFilters(filters, { limit });
      }
    };
    segmentEvaluationService = new SegmentEvaluationService();
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  DatabaseStorage: () => DatabaseStorage,
  storage: () => storage
});
import { eq as eq4, desc as desc4, and as and5, or, sql as sql6, inArray } from "drizzle-orm";
var DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    init_cacLtgpStorage();
    init_tghStorage();
    init_adminProvisioningStorage();
    init_statsUtils();
    DatabaseStorage = class {
      // CAC/LTGP storage module composition
      cacLtgpStorage;
      // Tech Goes Home storage module composition
      tghStorage;
      // Admin Provisioning storage module composition
      adminProvisioningStorage;
      // CAC/LTGP method delegation (initialized in constructor)
      createAcquisitionChannel;
      getAcquisitionChannel;
      getAllAcquisitionChannels;
      getActiveAcquisitionChannels;
      updateAcquisitionChannel;
      deleteAcquisitionChannel;
      createMarketingCampaign;
      getMarketingCampaign;
      getAllMarketingCampaigns;
      getActiveMarketingCampaigns;
      getCampaignsByChannel;
      updateMarketingCampaign;
      deleteMarketingCampaign;
      createSpendEntry;
      getSpendEntriesByChannel;
      getSpendEntriesByCampaign;
      getSpendEntriesByPeriod;
      updateSpendEntry;
      deleteSpendEntry;
      createLeadAttribution;
      getLeadAttribution;
      getAttributionsByChannel;
      getAttributionsByCampaign;
      updateLeadAttribution;
      createDonorLifecycleStage;
      getDonorLifecycleStage;
      getAllDonorLifecycleStages;
      getDonorsByStage;
      updateDonorLifecycleStage;
      createDonorEconomics;
      getDonorEconomics;
      updateDonorEconomics;
      getEconomicsSettings;
      updateEconomicsSettings;
      // Tech Goes Home method delegation (initialized in constructor)
      createTechGoesHomeEnrollment;
      getTechGoesHomeEnrollment;
      getTechGoesHomeEnrollmentByUserId;
      getAllTechGoesHomeEnrollments;
      getActiveTechGoesHomeEnrollments;
      updateTechGoesHomeEnrollment;
      createTechGoesHomeAttendance;
      getTechGoesHomeAttendance;
      updateTechGoesHomeAttendance;
      deleteTechGoesHomeAttendance;
      getStudentProgress;
      // Admin Provisioning method delegation (initialized in constructor)
      createProgram;
      getAllPrograms;
      getProgram;
      updateProgram;
      deleteProgram;
      createAdminEntitlement;
      getActiveAdminEntitlements;
      getAdminEntitlements;
      getAdminEntitlement;
      updateAdminEntitlementStatus;
      hasActiveEntitlement;
      getActiveAdminEntitlementsWithPrograms;
      getAllAdminEntitlementsWithPrograms;
      createImpersonationSession;
      getActiveImpersonationSession;
      getImpersonationSessions;
      endImpersonationSession;
      getCurrentlyImpersonatedUser;
      hasActiveImpersonation;
      constructor() {
        this.cacLtgpStorage = createCacLtgpStorage();
        this.tghStorage = createTechGoesHomeStorage();
        this.adminProvisioningStorage = createAdminProvisioningStorage(db);
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
        this.createProgram = this.adminProvisioningStorage.createProgram.bind(this.adminProvisioningStorage);
        this.getAllPrograms = this.adminProvisioningStorage.getAllPrograms.bind(this.adminProvisioningStorage);
        this.getProgram = this.adminProvisioningStorage.getProgram.bind(this.adminProvisioningStorage);
        this.updateProgram = this.adminProvisioningStorage.updateProgram.bind(this.adminProvisioningStorage);
        this.deleteProgram = this.adminProvisioningStorage.deleteProgram.bind(this.adminProvisioningStorage);
        this.createAdminEntitlement = this.adminProvisioningStorage.createAdminEntitlement.bind(this.adminProvisioningStorage);
        this.getActiveAdminEntitlements = this.adminProvisioningStorage.getActiveAdminEntitlements.bind(this.adminProvisioningStorage);
        this.getAdminEntitlements = this.adminProvisioningStorage.getAdminEntitlements.bind(this.adminProvisioningStorage);
        this.getAdminEntitlement = this.adminProvisioningStorage.getAdminEntitlement.bind(this.adminProvisioningStorage);
        this.updateAdminEntitlementStatus = this.adminProvisioningStorage.updateAdminEntitlementStatus.bind(this.adminProvisioningStorage);
        this.hasActiveEntitlement = this.adminProvisioningStorage.hasActiveEntitlement.bind(this.adminProvisioningStorage);
        this.getActiveAdminEntitlementsWithPrograms = this.adminProvisioningStorage.getActiveAdminEntitlementsWithPrograms.bind(this.adminProvisioningStorage);
        this.getAllAdminEntitlementsWithPrograms = this.adminProvisioningStorage.getAllAdminEntitlementsWithPrograms.bind(this.adminProvisioningStorage);
        this.createImpersonationSession = this.adminProvisioningStorage.createImpersonationSession.bind(this.adminProvisioningStorage);
        this.getActiveImpersonationSession = this.adminProvisioningStorage.getActiveImpersonationSession.bind(this.adminProvisioningStorage);
        this.getImpersonationSessions = this.adminProvisioningStorage.getImpersonationSessions.bind(this.adminProvisioningStorage);
        this.endImpersonationSession = this.adminProvisioningStorage.endImpersonationSession.bind(this.adminProvisioningStorage);
        this.getCurrentlyImpersonatedUser = this.adminProvisioningStorage.getCurrentlyImpersonatedUser.bind(this.adminProvisioningStorage);
        this.hasActiveImpersonation = this.adminProvisioningStorage.hasActiveImpersonation.bind(this.adminProvisioningStorage);
      }
      // User operations
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq4(users.id, id));
        return user;
      }
      async getUserByOidcSub(oidcSub) {
        const [user] = await db.select().from(users).where(eq4(users.oidcSub, oidcSub));
        return user;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq4(users.email, email));
        return user;
      }
      async getAllUsers() {
        const usersWithFunnelStage = await db.select({
          ...users,
          funnelStage: leads.funnelStage
        }).from(users).leftJoin(leads, eq4(users.email, leads.email)).orderBy(desc4(users.createdAt));
        return usersWithFunnelStage;
      }
      async upsertUser(userData) {
        let existingUser;
        if (userData.oidcSub) {
          [existingUser] = await db.select().from(users).where(eq4(users.oidcSub, userData.oidcSub));
        }
        if (!existingUser && userData.email) {
          [existingUser] = await db.select().from(users).where(eq4(users.email, userData.email));
        }
        if (existingUser) {
          const updateData = {
            oidcSub: userData.oidcSub,
            email: userData.email,
            updatedAt: /* @__PURE__ */ new Date()
          };
          if (userData.firstName && !existingUser.firstName) {
            updateData.firstName = userData.firstName;
          }
          if (userData.lastName && !existingUser.lastName) {
            updateData.lastName = userData.lastName;
          }
          if (userData.profileImageUrl !== void 0) {
            updateData.profileImageUrl = userData.profileImageUrl;
          }
          if (userData.role !== void 0) {
            updateData.role = userData.role;
          }
          if (userData.persona !== void 0) {
            updateData.persona = userData.persona;
          }
          if (userData.passions !== void 0) {
            updateData.passions = userData.passions;
          }
          if (userData.funnelStage !== void 0) {
            updateData.funnelStage = userData.funnelStage;
          }
          try {
            const [user] = await db.update(users).set(updateData).where(eq4(users.id, existingUser.id)).returning();
            return user;
          } catch (updateError) {
            console.error("[upsertUser] Update failed:", updateError.message);
            return existingUser;
          }
        } else {
          const insertData = {
            ...userData,
            role: userData.role || "client"
            // Default to safe 'client' role
          };
          try {
            const [user] = await db.insert(users).values(insertData).returning();
            return user;
          } catch (error) {
            if (error?.code === "23505" || error?.message?.includes("duplicate key") || error?.message?.includes("unique constraint")) {
              console.log("[upsertUser] Caught unique constraint violation, retrying with update...", error.message);
              if (userData.email) {
                [existingUser] = await db.select().from(users).where(eq4(users.email, userData.email));
              }
              if (!existingUser && userData.oidcSub) {
                [existingUser] = await db.select().from(users).where(eq4(users.oidcSub, userData.oidcSub));
              }
              if (existingUser) {
                const updateData = {
                  oidcSub: userData.oidcSub,
                  email: userData.email,
                  updatedAt: /* @__PURE__ */ new Date()
                };
                if (userData.firstName && !existingUser.firstName) {
                  updateData.firstName = userData.firstName;
                }
                if (userData.lastName && !existingUser.lastName) {
                  updateData.lastName = userData.lastName;
                }
                if (userData.profileImageUrl !== void 0) {
                  updateData.profileImageUrl = userData.profileImageUrl;
                }
                if (userData.role !== void 0) {
                  updateData.role = userData.role;
                }
                if (userData.persona !== void 0) {
                  updateData.persona = userData.persona;
                }
                if (userData.passions !== void 0) {
                  updateData.passions = userData.passions;
                }
                if (userData.funnelStage !== void 0) {
                  updateData.funnelStage = userData.funnelStage;
                }
                try {
                  const [user] = await db.update(users).set(updateData).where(eq4(users.id, existingUser.id)).returning();
                  return user;
                } catch (updateError) {
                  console.error("[upsertUser] Update failed after retry:", updateError.message);
                  return existingUser;
                }
              }
            }
            console.error("[upsertUser] Unhandled error:", error.message);
            throw error;
          }
        }
      }
      async updateUser(id, updates, actorId) {
        const currentUser = await this.getUser(id);
        if (!currentUser) {
          return void 0;
        }
        const updateData = {
          updatedAt: /* @__PURE__ */ new Date()
        };
        if (updates.firstName !== void 0) updateData.firstName = updates.firstName;
        if (updates.lastName !== void 0) updateData.lastName = updates.lastName;
        if (updates.profileImageUrl !== void 0) updateData.profileImageUrl = updates.profileImageUrl;
        if (updates.persona !== void 0) updateData.persona = updates.persona;
        if (updates.passions !== void 0) updateData.passions = updates.passions;
        if (updates.role !== void 0) updateData.role = updates.role;
        if (updates.email !== void 0) updateData.email = updates.email;
        if (updates.oidcSub !== void 0) updateData.oidcSub = updates.oidcSub;
        if (updates.stripeCustomerId !== void 0) updateData.stripeCustomerId = updates.stripeCustomerId;
        const [user] = await db.update(users).set(updateData).where(eq4(users.id, id)).returning();
        if (user && actorId) {
          const changedFields = Object.keys(updates).filter((key) => updates[key] !== currentUser[key]);
          if (changedFields.length > 0) {
            await this.createAuditLog({
              userId: id,
              actorId,
              action: "profile_updated",
              metadata: {
                changedFields,
                previousValues: Object.fromEntries(changedFields.map((key) => [key, currentUser[key]])),
                newValues: Object.fromEntries(changedFields.map((key) => [key, updates[key]]))
              }
            });
          }
        }
        return user;
      }
      async createUser(userData) {
        const [user] = await db.insert(users).values(userData).returning();
        return user;
      }
      async deleteUser(id) {
        await db.delete(users).where(eq4(users.id, id));
      }
      // Organization operations for tier-based access control
      async createOrganization(orgData) {
        const [org] = await db.insert(organizations).values(orgData).returning();
        return org;
      }
      async getOrganization(id) {
        const [org] = await db.select().from(organizations).where(eq4(organizations.id, id));
        return org;
      }
      async getOrganizationByUserId(userId) {
        const user = await this.getUser(userId);
        if (!user?.organizationId) {
          return void 0;
        }
        return this.getOrganization(user.organizationId);
      }
      async getAllOrganizations() {
        return await db.select().from(organizations).orderBy(desc4(organizations.createdAt));
      }
      async updateOrganization(id, updates) {
        const [org] = await db.update(organizations).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(organizations.id, id)).returning();
        return org;
      }
      // Admin Preferences operations
      async getAdminPreferences(userId) {
        const [preferences] = await db.select().from(adminPreferences).where(eq4(adminPreferences.userId, userId));
        return preferences;
      }
      async upsertAdminPreferences(userId, preferencesData) {
        const existing = await this.getAdminPreferences(userId);
        if (existing) {
          const [updated] = await db.update(adminPreferences).set({ ...preferencesData, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(adminPreferences.userId, userId)).returning();
          return updated;
        } else {
          const [created] = await db.insert(adminPreferences).values({ userId, ...preferencesData }).returning();
          return created;
        }
      }
      async updateAdminPreferences(userId, updates) {
        const [preferences] = await db.update(adminPreferences).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(adminPreferences.userId, userId)).returning();
        return preferences;
      }
      async deleteAdminPreferences(userId) {
        await db.delete(adminPreferences).where(eq4(adminPreferences.userId, userId));
      }
      // Audit Log operations
      async createAuditLog(auditLogData) {
        const [auditLog] = await db.insert(auditLogs).values(auditLogData).returning();
        return auditLog;
      }
      async getAuditLogs(filters) {
        let query = db.select().from(auditLogs);
        const conditions = [];
        if (filters?.userId) {
          conditions.push(eq4(auditLogs.userId, filters.userId));
        }
        if (filters?.actorId) {
          conditions.push(eq4(auditLogs.actorId, filters.actorId));
        }
        if (filters?.action) {
          conditions.push(eq4(auditLogs.action, filters.action));
        }
        if (conditions.length > 0) {
          query = query.where(and5(...conditions));
        }
        query = query.orderBy(desc4(auditLogs.createdAt));
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }
        return await query;
      }
      // Lead operations
      async createLead(leadData) {
        const [lead] = await db.insert(leads).values(leadData).returning();
        return lead;
      }
      async getLead(id) {
        const [lead] = await db.select().from(leads).where(eq4(leads.id, id));
        return lead;
      }
      async getLeadByEmail(email) {
        const [lead] = await db.select().from(leads).where(eq4(leads.email, email));
        return lead;
      }
      async getAllLeads() {
        return await db.select().from(leads).orderBy(desc4(leads.createdAt));
      }
      async getLeadsByPersona(persona) {
        return await db.select().from(leads).where(eq4(leads.persona, persona)).orderBy(desc4(leads.createdAt));
      }
      async getLeadsByFunnelStage(funnelStage) {
        return await db.select().from(leads).where(eq4(leads.funnelStage, funnelStage)).orderBy(desc4(leads.createdAt));
      }
      async updateLead(id, updates) {
        const [lead] = await db.update(leads).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(leads.id, id)).returning();
        return lead;
      }
      async deleteLead(id) {
        await db.delete(leads).where(eq4(leads.id, id));
      }
      // Interaction operations
      async createInteraction(interactionData) {
        const [interaction] = await db.insert(interactions).values(interactionData).returning();
        await db.update(leads).set({
          lastInteractionDate: /* @__PURE__ */ new Date(),
          engagementScore: sql6`${leads.engagementScore} + 10`
        }).where(eq4(leads.id, interactionData.leadId));
        return interaction;
      }
      async getLeadInteractions(leadId, limit) {
        const query = db.select().from(interactions).where(eq4(interactions.leadId, leadId)).orderBy(desc4(interactions.createdAt));
        if (limit) {
          return await query.limit(limit);
        }
        return await query;
      }
      // Lead Magnet operations
      async createLeadMagnet(magnetData) {
        const [magnet] = await db.insert(leadMagnets).values(magnetData).returning();
        return magnet;
      }
      async getAllLeadMagnets() {
        return await db.select().from(leadMagnets).orderBy(desc4(leadMagnets.createdAt));
      }
      async getLeadMagnetsByPersona(persona) {
        return await db.select().from(leadMagnets).where(and5(eq4(leadMagnets.persona, persona), eq4(leadMagnets.isActive, true))).orderBy(desc4(leadMagnets.createdAt));
      }
      async updateLeadMagnet(id, updates) {
        const [magnet] = await db.update(leadMagnets).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(leadMagnets.id, id)).returning();
        return magnet;
      }
      async deleteLeadMagnet(id) {
        await db.delete(leadMagnets).where(eq4(leadMagnets.id, id));
      }
      // Image Asset operations
      async createImageAsset(assetData) {
        const [asset] = await db.insert(imageAssets).values(assetData).returning();
        return asset;
      }
      async getImageAsset(id) {
        const [asset] = await db.select().from(imageAssets).where(eq4(imageAssets.id, id));
        return asset;
      }
      async getImageAssetByPublicId(publicId) {
        const [asset] = await db.select().from(imageAssets).where(eq4(imageAssets.cloudinaryPublicId, publicId));
        return asset;
      }
      async getAllImageAssets() {
        return await db.select().from(imageAssets).orderBy(desc4(imageAssets.createdAt));
      }
      async getImageAssetsByUsage(usage) {
        return await db.select().from(imageAssets).where(and5(eq4(imageAssets.usage, usage), eq4(imageAssets.isActive, true))).orderBy(desc4(imageAssets.createdAt));
      }
      async updateImageAsset(id, updates) {
        const [asset] = await db.update(imageAssets).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(imageAssets.id, id)).returning();
        return asset;
      }
      async deleteImageAsset(id) {
        await db.delete(imageAssets).where(eq4(imageAssets.id, id));
      }
      // Content Item operations
      async createContentItem(itemData) {
        const [item] = await db.insert(contentItems).values(itemData).returning();
        return item;
      }
      async getContentItem(id) {
        const [item] = await db.select().from(contentItems).where(eq4(contentItems.id, id));
        return item;
      }
      async getAllContentItems() {
        const results = await db.select({
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
          resolvedImageUrl: imageAssets.cloudinarySecureUrl
        }).from(contentItems).leftJoin(imageAssets, eq4(contentItems.imageName, imageAssets.name)).orderBy(contentItems.order);
        return results;
      }
      async getContentItemsByType(type) {
        const results = await db.select({
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
          resolvedImageUrl: imageAssets.cloudinarySecureUrl
        }).from(contentItems).leftJoin(imageAssets, eq4(contentItems.imageName, imageAssets.name)).where(eq4(contentItems.type, type)).orderBy(contentItems.order);
        return results;
      }
      async getStudentProjectByUserId(userId) {
        const results = await db.select({
          id: contentItems.id,
          type: contentItems.type,
          title: contentItems.title,
          description: contentItems.description,
          imageName: contentItems.imageName,
          imageUrl: contentItems.imageUrl,
          passionTags: contentItems.passionTags,
          order: contentItems.order,
          isActive: contentItems.isActive,
          metadata: contentItems.metadata,
          createdAt: contentItems.createdAt,
          updatedAt: contentItems.updatedAt,
          resolvedImageUrl: imageAssets.cloudinarySecureUrl
        }).from(contentItems).leftJoin(imageAssets, eq4(contentItems.imageName, imageAssets.name)).where(
          and5(
            eq4(contentItems.type, "student_project"),
            sql6`${contentItems.metadata}->>'submittingUserId' = ${userId}`
          )
        ).limit(1);
        return results.length > 0 ? results[0] : void 0;
      }
      async updateContentItem(id, updates) {
        const [item] = await db.update(contentItems).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(contentItems.id, id)).returning();
        return item;
      }
      async deleteContentItem(id) {
        await db.delete(contentItems).where(eq4(contentItems.id, id));
      }
      async updateContentItemOrder(id, newOrder) {
        const [item] = await db.update(contentItems).set({ order: newOrder, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(contentItems.id, id)).returning();
        return item;
      }
      async updateContentOrders(updates, contentType) {
        return await db.transaction(async (tx) => {
          const itemIds = updates.map((u) => u.id);
          const items = await tx.select().from(contentItems).where(inArray(contentItems.id, itemIds));
          if (items.length !== updates.length) {
            const foundIds = new Set(items.map((i) => i.id));
            const missingIds = itemIds.filter((id) => !foundIds.has(id));
            throw new Error(`items_not_found: ${missingIds.join(", ")}`);
          }
          const types = new Set(items.map((i) => i.type));
          if (types.size > 1) {
            throw new Error(`mixed_content_type: Found types ${Array.from(types).join(", ")}`);
          }
          if (contentType && items[0].type !== contentType) {
            throw new Error(`content_type_mismatch: Expected ${contentType}, found ${items[0].type}`);
          }
          const orderValues = updates.map((u) => u.order);
          if (new Set(orderValues).size !== orderValues.length) {
            throw new Error("duplicate_order: Order values must be unique");
          }
          const now = /* @__PURE__ */ new Date();
          const caseStmt = sql6`(CASE ${contentItems.id} ${sql6.join(
            updates.map((u) => sql6`WHEN ${u.id} THEN ${u.order}`),
            sql6` `
          )} END)`;
          const updatedItems = await tx.update(contentItems).set({
            order: caseStmt,
            updatedAt: now
          }).where(inArray(contentItems.id, itemIds)).returning();
          return updatedItems;
        });
      }
      async getContentItemUsage(id) {
        const visibilityAssignments = await db.select({
          persona: contentVisibility.persona,
          funnelStage: contentVisibility.funnelStage
        }).from(contentVisibility).where(eq4(contentVisibility.contentItemId, id));
        const abTestUsage = await db.select({
          testId: abTests.id,
          testName: abTests.name,
          variantName: abTestVariants.name,
          status: abTests.status
        }).from(abTestVariants).innerJoin(abTests, eq4(abTestVariants.testId, abTests.id)).where(eq4(abTestVariants.contentItemId, id));
        return {
          visibilityAssignments,
          abTests: abTestUsage
        };
      }
      // Content Visibility operations
      async createContentVisibility(visibilityData) {
        const [visibility] = await db.insert(contentVisibility).values(visibilityData).returning();
        return visibility;
      }
      async getAllContentVisibility() {
        return await db.select().from(contentVisibility).orderBy(contentVisibility.contentItemId, contentVisibility.order);
      }
      async getContentVisibility(contentItemId, persona, funnelStage) {
        const conditions = [eq4(contentVisibility.contentItemId, contentItemId)];
        if (persona !== void 0) {
          conditions.push(persona === null ? sql6`${contentVisibility.persona} IS NULL` : eq4(contentVisibility.persona, persona));
        }
        if (funnelStage !== void 0) {
          conditions.push(funnelStage === null ? sql6`${contentVisibility.funnelStage} IS NULL` : eq4(contentVisibility.funnelStage, funnelStage));
        }
        return await db.select().from(contentVisibility).where(and5(...conditions)).orderBy(contentVisibility.order);
      }
      async updateContentVisibility(id, updates) {
        const [visibility] = await db.update(contentVisibility).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(contentVisibility.id, id)).returning();
        return visibility;
      }
      async deleteContentVisibility(id) {
        await db.delete(contentVisibility).where(eq4(contentVisibility.id, id));
      }
      // Private helper to build visibility query with specific persona/funnelStage filters
      buildVisibilityQuery(type, persona, funnelStage, userPassions) {
        const joinConditions = [eq4(contentVisibility.contentItemId, contentItems.id)];
        if (persona !== void 0) {
          joinConditions.push(
            persona === null ? sql6`${contentVisibility.persona} IS NULL` : or(
              sql6`${contentVisibility.persona} IS NULL`,
              eq4(contentVisibility.persona, persona)
            )
          );
        }
        if (funnelStage !== void 0) {
          joinConditions.push(
            funnelStage === null ? sql6`${contentVisibility.funnelStage} IS NULL` : or(
              sql6`${contentVisibility.funnelStage} IS NULL`,
              eq4(contentVisibility.funnelStage, funnelStage)
            )
          );
        }
        let query = db.selectDistinctOn([contentItems.id], {
          id: contentItems.id,
          type: contentItems.type,
          title: contentItems.title,
          description: contentItems.description,
          imageName: contentItems.imageName,
          imageUrl: contentItems.imageUrl,
          passionTags: contentItems.passionTags,
          order: sql6`COALESCE(${contentVisibility.order}, ${contentItems.order})`.as("order"),
          isActive: contentItems.isActive,
          metadata: contentItems.metadata,
          createdAt: contentItems.createdAt,
          updatedAt: contentItems.updatedAt
        }).from(contentItems).innerJoin(
          contentVisibility,
          and5(...joinConditions)
        ).where(
          and5(
            eq4(contentItems.type, type),
            eq4(contentItems.isActive, true),
            eq4(contentVisibility.isVisible, true)
          )
        );
        query = query.orderBy(
          contentItems.id,
          // For DISTINCT ON
          sql6`COALESCE(${contentVisibility.order}, ${contentItems.order})`,
          contentItems.createdAt
        );
        return query;
      }
      async getVisibleContentItems(type, persona, funnelStage, userPassions) {
        const results = await this.buildVisibilityQuery(type, persona, funnelStage, userPassions);
        if (type === "hero" && results.length === 0 && persona && persona !== "default") {
          const defaultResults = await this.buildVisibilityQuery(type, "default", funnelStage, userPassions);
          return defaultResults;
        }
        return results;
      }
      async getAvailablePersonaStageCombinations() {
        const combinations = await db.selectDistinct({
          persona: contentVisibility.persona,
          funnelStage: contentVisibility.funnelStage
        }).from(contentVisibility).innerJoin(contentItems, eq4(contentVisibility.contentItemId, contentItems.id)).where(
          and5(
            eq4(contentVisibility.isVisible, true),
            eq4(contentItems.isActive, true),
            sql6`${contentVisibility.persona} IS NOT NULL`,
            sql6`${contentVisibility.funnelStage} IS NOT NULL`
          )
        );
        return combinations.filter(
          (c) => c.persona !== null && c.funnelStage !== null
        );
      }
      // A/B Test operations
      async createAbTest(testData) {
        const [test] = await db.insert(abTests).values(testData).returning();
        return test;
      }
      async getAbTest(id) {
        const [test] = await db.select().from(abTests).where(eq4(abTests.id, id));
        return test;
      }
      async getAllAbTests() {
        return await db.select().from(abTests).orderBy(desc4(abTests.createdAt));
      }
      async getAllAbTestsWithVariants() {
        const tests = await db.select().from(abTests).orderBy(desc4(abTests.createdAt));
        const testsWithVariants = await Promise.all(
          tests.map(async (test) => {
            const variants = await db.select().from(abTestVariants).where(eq4(abTestVariants.testId, test.id)).orderBy(desc4(abTestVariants.isControl), abTestVariants.name);
            return {
              ...test,
              variants
            };
          })
        );
        return testsWithVariants;
      }
      async getActiveAbTests(persona, funnelStage) {
        const now = /* @__PURE__ */ new Date();
        const baseFilters = [
          eq4(abTests.status, "active"),
          or(
            sql6`${abTests.startDate} IS NULL`,
            sql6`${abTests.startDate} <= ${now}`
          ),
          or(
            sql6`${abTests.endDate} IS NULL`,
            sql6`${abTests.endDate} >= ${now}`
          )
        ];
        if (!persona && !funnelStage) {
          return await db.select().from(abTests).where(and5(...baseFilters));
        }
        const targetFilters = [];
        if (persona) {
          targetFilters.push(eq4(abTestTargets.persona, persona));
        }
        if (funnelStage) {
          targetFilters.push(eq4(abTestTargets.funnelStage, funnelStage));
        }
        if (targetFilters.length === 0) {
          return await db.select().from(abTests).where(and5(...baseFilters));
        }
        const matchingTargets = await db.select({
          testId: abTestTargets.testId,
          persona: abTestTargets.persona,
          funnelStage: abTestTargets.funnelStage
        }).from(abTestTargets).where(and5(...targetFilters));
        if (matchingTargets.length === 0) {
          return [];
        }
        const testIds = Array.from(new Set(matchingTargets.map((t) => t.testId)));
        const tests = await db.select().from(abTests).where(
          and5(
            ...baseFilters,
            inArray(abTests.id, testIds)
          )
        );
        const testsByTarget = /* @__PURE__ */ new Map();
        for (const target of matchingTargets) {
          const key = `${target.persona}:${target.funnelStage}`;
          const test = tests.find((t) => t.id === target.testId);
          if (test) {
            if (!testsByTarget.has(key)) {
              testsByTarget.set(key, []);
            }
            testsByTarget.get(key).push(test);
          }
        }
        const prioritizedTests = /* @__PURE__ */ new Set();
        for (const [key, testsForTarget] of testsByTarget.entries()) {
          const manualTests = testsForTarget.filter((t) => {
            if (t.source === "manual") return true;
            if (t.source === "automated") return false;
            return t.isAutomated === false;
          });
          const automatedTests = testsForTarget.filter((t) => {
            if (t.source === "automated") return true;
            if (t.source === "manual") return false;
            return t.isAutomated === true || t.isAutomated === null;
          });
          let selectedTest = null;
          if (manualTests.length > 0) {
            selectedTest = manualTests.sort((a, b) => {
              const dateA = a.startDate || a.createdAt;
              const dateB = b.startDate || b.createdAt;
              return dateB.getTime() - dateA.getTime();
            })[0];
          } else if (automatedTests.length > 0) {
            selectedTest = automatedTests.sort((a, b) => {
              const dateA = a.startDate || a.createdAt;
              const dateB = b.startDate || b.createdAt;
              return dateB.getTime() - dateA.getTime();
            })[0];
          }
          if (selectedTest) {
            prioritizedTests.add(selectedTest.id);
          }
        }
        return tests.filter((t) => prioritizedTests.has(t.id));
      }
      async updateAbTest(id, updates) {
        const [test] = await db.update(abTests).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(abTests.id, id)).returning();
        return test;
      }
      async deleteAbTest(id) {
        await db.delete(abTests).where(eq4(abTests.id, id));
      }
      async createAbTestTargets(testId, combinations) {
        const targets = combinations.map((combo) => {
          const [persona, funnelStage] = combo.split(":");
          return {
            testId,
            persona,
            funnelStage
          };
        });
        if (targets.length > 0) {
          await db.insert(abTestTargets).values(targets);
        }
      }
      async getAbTestTargets(testId) {
        const targets = await db.select({
          persona: abTestTargets.persona,
          funnelStage: abTestTargets.funnelStage
        }).from(abTestTargets).where(eq4(abTestTargets.testId, testId));
        return targets;
      }
      async deleteAbTestTargets(testId) {
        await db.delete(abTestTargets).where(eq4(abTestTargets.testId, testId));
      }
      // A/B Test Variant operations
      async createAbTestVariant(variantData) {
        const [variant] = await db.insert(abTestVariants).values(variantData).returning();
        return variant;
      }
      async getAbTestVariants(testId) {
        return await db.select().from(abTestVariants).where(eq4(abTestVariants.testId, testId)).orderBy(desc4(abTestVariants.isControl));
      }
      async updateAbTestVariant(id, updates) {
        const [variant] = await db.update(abTestVariants).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(abTestVariants.id, id)).returning();
        return variant;
      }
      async deleteAbTestVariant(id) {
        await db.delete(abTestVariants).where(eq4(abTestVariants.id, id));
      }
      // A/B Test Assignment operations
      async createAbTestAssignment(assignmentData) {
        const [assignment] = await db.insert(abTestAssignments).values(assignmentData).returning();
        return assignment;
      }
      async getAssignment(testId, sessionId) {
        const [assignment] = await db.select().from(abTestAssignments).where(
          and5(
            eq4(abTestAssignments.testId, testId),
            eq4(abTestAssignments.sessionId, sessionId)
          )
        );
        return assignment;
      }
      // Persistent assignment lookup with priority: userId > visitorId > sessionId
      async getAssignmentPersistent(testId, userId, visitorId, sessionId) {
        if (userId) {
          const [assignment] = await db.select().from(abTestAssignments).where(
            and5(
              eq4(abTestAssignments.testId, testId),
              eq4(abTestAssignments.userId, userId)
            )
          );
          if (assignment) return assignment;
        }
        if (visitorId) {
          const [assignment] = await db.select().from(abTestAssignments).where(
            and5(
              eq4(abTestAssignments.testId, testId),
              eq4(abTestAssignments.visitorId, visitorId)
            )
          );
          if (assignment) return assignment;
        }
        if (sessionId) {
          const [assignment] = await db.select().from(abTestAssignments).where(
            and5(
              eq4(abTestAssignments.testId, testId),
              eq4(abTestAssignments.sessionId, sessionId)
            )
          );
          if (assignment) return assignment;
        }
        return void 0;
      }
      async updateAbTestAssignment(id, updates) {
        const [assignment] = await db.update(abTestAssignments).set(updates).where(eq4(abTestAssignments.id, id)).returning();
        return assignment;
      }
      async getSessionAssignments(sessionId) {
        return await db.select().from(abTestAssignments).where(eq4(abTestAssignments.sessionId, sessionId));
      }
      // A/B Test Event operations
      async trackEvent(eventData) {
        const [event] = await db.insert(abTestEvents).values(eventData).returning();
        return event;
      }
      async getTestEvents(testId) {
        return await db.select().from(abTestEvents).where(eq4(abTestEvents.testId, testId)).orderBy(desc4(abTestEvents.createdAt));
      }
      async getVariantEvents(variantId) {
        return await db.select().from(abTestEvents).where(eq4(abTestEvents.variantId, variantId)).orderBy(desc4(abTestEvents.createdAt));
      }
      async getTestAnalytics(testId) {
        const analytics = await db.select({
          variantId: abTestVariants.id,
          variantName: abTestVariants.name,
          totalViews: sql6`COUNT(DISTINCT ${abTestEvents.id}) FILTER (WHERE ${abTestEvents.eventType} = 'page_view')`.as("totalViews"),
          uniqueViews: sql6`COUNT(DISTINCT ${abTestEvents.sessionId}) FILTER (WHERE ${abTestEvents.eventType} = 'page_view')`.as("uniqueViews"),
          totalEvents: sql6`COUNT(DISTINCT ${abTestEvents.id}) FILTER (WHERE ${abTestEvents.eventType} != 'page_view')`.as("totalEvents")
        }).from(abTestVariants).leftJoin(abTestEvents, eq4(abTestEvents.variantId, abTestVariants.id)).where(eq4(abTestVariants.testId, testId)).groupBy(abTestVariants.id, abTestVariants.name);
        return analytics.map((row) => ({
          variantId: row.variantId,
          variantName: row.variantName,
          totalViews: Number(row.totalViews) || 0,
          uniqueViews: Number(row.uniqueViews) || 0,
          totalEvents: Number(row.totalEvents) || 0,
          conversionRate: row.uniqueViews > 0 ? Number(row.totalEvents) / Number(row.uniqueViews) * 100 : 0
        }));
      }
      async getCurrentBaselineConfiguration(persona, funnelStage, testType) {
        const activeTests = await db.select({
          testId: abTests.id,
          status: abTests.status
        }).from(abTests).innerJoin(abTestTargets, eq4(abTestTargets.testId, abTests.id)).where(
          and5(
            eq4(abTests.type, testType),
            eq4(abTests.status, "active"),
            eq4(abTestTargets.persona, persona),
            eq4(abTestTargets.funnelStage, funnelStage)
          )
        ).limit(1);
        if (activeTests.length > 0) {
          const variants = await this.getAbTestVariants(activeTests[0].testId);
          const controlVariant = variants.find((v) => v.isControl);
          if (controlVariant && controlVariant.configuration) {
            return controlVariant.configuration;
          }
        }
        const contentTypeMap = {
          "hero_variation": "hero",
          "cta_variation": "cta",
          "service_card_order": "service",
          "event_card_order": "event",
          "testimonial_card_order": "testimonial",
          "messaging_test": "hero",
          // Use hero content for messaging tests
          "layout_test": null
          // Layout is structural, not content-specific
        };
        const contentType = contentTypeMap[testType];
        if (contentType === "hero" || contentType === "cta") {
          const items = await this.getVisibleContentItems(contentType, persona, funnelStage);
          const firstItem = items[0];
          if (!firstItem) {
            return null;
          }
          return {
            kind: "presentation",
            title: firstItem.title || void 0,
            description: firstItem.description || void 0,
            imageName: firstItem.imageName || void 0,
            imageUrl: firstItem.imageUrl || void 0,
            // Extract CTA text from metadata if available
            ctaText: firstItem.metadata?.primaryButton || void 0,
            secondaryCtaText: firstItem.metadata?.secondaryButton || void 0
          };
        }
        if (contentType === "service" || contentType === "event" || contentType === "testimonial") {
          const items = await this.getVisibleContentItems(contentType, persona, funnelStage);
          return {
            kind: "card_order",
            contentType,
            itemIds: items.map((item) => item.id)
          };
        }
        if (testType === "layout_test") {
          return {
            kind: "layout",
            template: "grid-3col",
            // Most common/balanced default
            options: {
              cardStyle: "elevated",
              spacing: "comfortable",
              imagePosition: "top",
              showImages: true,
              columnsOnMobile: "1"
            }
          };
        }
        return {
          kind: "presentation"
        };
      }
      async getHistoricalTestResults(persona, funnelStage, testType) {
        const completedTests = await db.select({
          testId: abTests.id,
          testName: abTests.name,
          testType: abTests.type,
          status: abTests.status,
          endDate: abTests.endDate,
          winnerVariantId: abTests.winnerVariantId
        }).from(abTests).innerJoin(abTestTargets, eq4(abTestTargets.testId, abTests.id)).where(
          and5(
            eq4(abTests.type, testType),
            eq4(abTests.status, "completed"),
            eq4(abTestTargets.persona, persona),
            eq4(abTestTargets.funnelStage, funnelStage)
          )
        ).orderBy(desc4(abTests.endDate)).limit(1);
        if (completedTests.length === 0) {
          return null;
        }
        const test = completedTests[0];
        const analytics = await this.getTestAnalytics(test.testId);
        if (analytics.length === 0) {
          return null;
        }
        const variants = await this.getAbTestVariants(test.testId);
        const controlVariant = variants.find((v) => v.isControl);
        const winnerVariant = variants.find((v) => v.id === test.winnerVariantId);
        const controlAnalytics = controlVariant ? analytics.find((a) => a.variantId === controlVariant.id) : analytics[0];
        const winnerAnalytics = winnerVariant ? analytics.find((a) => a.variantId === winnerVariant.id) : analytics[0];
        const controlConversionRate = controlAnalytics?.conversionRate || 0;
        const winnerConversionRate = winnerAnalytics?.conversionRate || 0;
        const improvementPercent = controlConversionRate > 0 ? (winnerConversionRate - controlConversionRate) / controlConversionRate * 100 : 0;
        const sampleSize = analytics.reduce((sum2, a) => sum2 + a.uniqueViews, 0);
        const confidence = calculateStatisticalConfidence(
          controlAnalytics?.totalEvents || 0,
          controlAnalytics?.uniqueViews || 0,
          winnerAnalytics?.totalEvents || 0,
          winnerAnalytics?.uniqueViews || 0
        );
        return {
          testId: test.testId,
          testName: test.testName,
          endDate: test.endDate,
          winnerVariantId: test.winnerVariantId,
          controlVariantId: controlVariant?.id || null,
          controlConversionRate,
          winnerConversionRate,
          improvementPercent,
          confidence,
          sampleSize
        };
      }
      // ==================== AUTOMATED A/B TESTING METHODS ====================
      // Metric Weight Profiles operations (6 methods)
      async createMetricWeightProfile(profile) {
        const [created] = await db.insert(metricWeightProfiles).values(profile).returning();
        return created;
      }
      async getMetricWeightProfile(id) {
        const [profile] = await db.select().from(metricWeightProfiles).where(eq4(metricWeightProfiles.id, id));
        return profile;
      }
      async getAllMetricWeightProfiles() {
        return await db.select().from(metricWeightProfiles).orderBy(desc4(metricWeightProfiles.createdAt));
      }
      async getMetricWeightProfilesByContentType(contentType) {
        return await db.select().from(metricWeightProfiles).where(eq4(metricWeightProfiles.contentType, contentType)).orderBy(desc4(metricWeightProfiles.createdAt));
      }
      async updateMetricWeightProfile(id, updates) {
        const [profile] = await db.update(metricWeightProfiles).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(metricWeightProfiles.id, id)).returning();
        return profile;
      }
      async deleteMetricWeightProfile(id) {
        await db.delete(metricWeightProfiles).where(eq4(metricWeightProfiles.id, id));
      }
      // Metric Weight Profile Metrics operations (4 methods)
      async createMetricWeightProfileMetric(metric) {
        const [created] = await db.insert(metricWeightProfileMetrics).values(metric).returning();
        return created;
      }
      async getMetricWeightProfileMetrics(profileId) {
        return await db.select().from(metricWeightProfileMetrics).where(eq4(metricWeightProfileMetrics.profileId, profileId));
      }
      async deleteMetricWeightProfileMetric(id) {
        await db.delete(metricWeightProfileMetrics).where(eq4(metricWeightProfileMetrics.id, id));
      }
      async deleteMetricWeightProfileMetricsByProfileId(profileId) {
        await db.delete(metricWeightProfileMetrics).where(eq4(metricWeightProfileMetrics.profileId, profileId));
      }
      // Automation Rules operations (6 methods)
      async createAbTestAutomationRule(rule) {
        const [created] = await db.insert(abTestAutomationRules).values(rule).returning();
        return created;
      }
      async getAbTestAutomationRule(id) {
        const [rule] = await db.select().from(abTestAutomationRules).where(eq4(abTestAutomationRules.id, id));
        return rule;
      }
      async getAllAbTestAutomationRules() {
        return await db.select().from(abTestAutomationRules).orderBy(desc4(abTestAutomationRules.createdAt));
      }
      async getActiveAbTestAutomationRules() {
        return await db.select().from(abTestAutomationRules).where(eq4(abTestAutomationRules.isActive, true)).orderBy(desc4(abTestAutomationRules.createdAt));
      }
      async updateAbTestAutomationRule(id, updates) {
        const [rule] = await db.update(abTestAutomationRules).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(abTestAutomationRules.id, id)).returning();
        return rule;
      }
      async deleteAbTestAutomationRule(id) {
        await db.delete(abTestAutomationRules).where(eq4(abTestAutomationRules.id, id));
      }
      // Automation Rule Metrics operations (4 methods)
      async createAbTestAutomationRuleMetric(metric) {
        const [created] = await db.insert(abTestAutomationRuleMetrics).values(metric).returning();
        return created;
      }
      async getAbTestAutomationRuleMetrics(ruleId) {
        return await db.select().from(abTestAutomationRuleMetrics).where(eq4(abTestAutomationRuleMetrics.ruleId, ruleId));
      }
      async updateAbTestAutomationRuleMetric(id, updates) {
        const [metric] = await db.update(abTestAutomationRuleMetrics).set(updates).where(eq4(abTestAutomationRuleMetrics.id, id)).returning();
        return metric;
      }
      async deleteAbTestAutomationRuleMetric(id) {
        await db.delete(abTestAutomationRuleMetrics).where(eq4(abTestAutomationRuleMetrics.id, id));
      }
      // Performance Baselines operations (3 methods)
      async upsertAbTestPerformanceBaseline(baseline) {
        const [result] = await db.insert(abTestPerformanceBaselines).values(baseline).onConflictDoUpdate({
          target: [
            abTestPerformanceBaselines.contentType,
            abTestPerformanceBaselines.contentItemId,
            abTestPerformanceBaselines.persona,
            abTestPerformanceBaselines.funnelStage,
            abTestPerformanceBaselines.windowStart
          ],
          set: {
            windowEnd: baseline.windowEnd,
            totalViews: baseline.totalViews,
            uniqueViews: baseline.uniqueViews,
            totalEvents: baseline.totalEvents,
            compositeScore: baseline.compositeScore,
            metricBreakdown: baseline.metricBreakdown,
            sampleSize: baseline.sampleSize,
            variance: baseline.variance,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return result;
      }
      async getAbTestPerformanceBaselines(filters) {
        const conditions = [];
        if (filters.contentType) {
          conditions.push(eq4(abTestPerformanceBaselines.contentType, filters.contentType));
        }
        if (filters.contentItemId) {
          conditions.push(eq4(abTestPerformanceBaselines.contentItemId, filters.contentItemId));
        }
        if (filters.persona) {
          conditions.push(eq4(abTestPerformanceBaselines.persona, filters.persona));
        }
        if (filters.funnelStage) {
          conditions.push(eq4(abTestPerformanceBaselines.funnelStage, filters.funnelStage));
        }
        if (filters.windowStart) {
          conditions.push(eq4(abTestPerformanceBaselines.windowStart, filters.windowStart));
        }
        return await db.select().from(abTestPerformanceBaselines).where(conditions.length > 0 ? and5(...conditions) : void 0).orderBy(desc4(abTestPerformanceBaselines.windowStart));
      }
      async getLatestBaseline(contentItemId, persona, funnelStage) {
        const conditions = [eq4(abTestPerformanceBaselines.contentItemId, contentItemId)];
        if (persona) {
          conditions.push(eq4(abTestPerformanceBaselines.persona, persona));
        }
        if (funnelStage) {
          conditions.push(eq4(abTestPerformanceBaselines.funnelStage, funnelStage));
        }
        const [baseline] = await db.select().from(abTestPerformanceBaselines).where(and5(...conditions)).orderBy(desc4(abTestPerformanceBaselines.windowStart)).limit(1);
        return baseline;
      }
      // AI Generations operations (3 methods)
      async createAbTestVariantAiGeneration(generation) {
        const [created] = await db.insert(abTestVariantAiGenerations).values(generation).returning();
        return created;
      }
      async getAbTestVariantAiGeneration(variantId) {
        const [generation] = await db.select().from(abTestVariantAiGenerations).where(eq4(abTestVariantAiGenerations.variantId, variantId));
        return generation;
      }
      async getAllAbTestVariantAiGenerations(filters) {
        const conditions = [];
        if (filters?.status) {
          conditions.push(eq4(abTestVariantAiGenerations.generationStatus, filters.status));
        }
        if (filters?.provider) {
          conditions.push(eq4(abTestVariantAiGenerations.aiProvider, filters.provider));
        }
        return await db.select().from(abTestVariantAiGenerations).where(conditions.length > 0 ? and5(...conditions) : void 0).orderBy(desc4(abTestVariantAiGenerations.createdAt));
      }
      // Automation Runs operations (4 methods)
      async createAbTestAutomationRun(run) {
        const [created] = await db.insert(abTestAutomationRuns).values(run).returning();
        return created;
      }
      async getAbTestAutomationRun(id) {
        const [run] = await db.select().from(abTestAutomationRuns).where(eq4(abTestAutomationRuns.id, id));
        return run;
      }
      async getAbTestAutomationRuns(filters) {
        const conditions = [];
        if (filters.ruleId) {
          conditions.push(eq4(abTestAutomationRuns.ruleId, filters.ruleId));
        }
        if (filters.status) {
          conditions.push(eq4(abTestAutomationRuns.status, filters.status));
        }
        const limit = filters.limit ?? 50;
        return await db.select().from(abTestAutomationRuns).where(conditions.length > 0 ? and5(...conditions) : void 0).orderBy(desc4(abTestAutomationRuns.createdAt)).limit(limit);
      }
      async updateAbTestAutomationRun(id, updates) {
        const [run] = await db.update(abTestAutomationRuns).set(updates).where(eq4(abTestAutomationRuns.id, id)).returning();
        return run;
      }
      // Safety Limits operations (2 methods)
      async getAbTestSafetyLimits() {
        const [limits] = await db.select().from(abTestSafetyLimits).where(eq4(abTestSafetyLimits.scope, "global"));
        return limits;
      }
      async upsertAbTestSafetyLimits(limits) {
        const [result] = await db.insert(abTestSafetyLimits).values({ ...limits, scope: "global" }).onConflictDoUpdate({
          target: abTestSafetyLimits.scope,
          set: {
            ...limits,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return result;
      }
      // Query Helper for Automation Workflows (1 method)
      async getAutomationReadyTests(filters) {
        const testConditions = [eq4(abTests.status, "active")];
        let tests = await db.select().from(abTests).where(and5(...testConditions));
        if (filters.persona || filters.funnelStage) {
          const targetConditions = [];
          if (filters.persona) {
            targetConditions.push(eq4(abTestTargets.persona, filters.persona));
          }
          if (filters.funnelStage) {
            targetConditions.push(eq4(abTestTargets.funnelStage, filters.funnelStage));
          }
          const validTestIds = await db.selectDistinct({ testId: abTestTargets.testId }).from(abTestTargets).where(and5(...targetConditions));
          const validIds = validTestIds.map((t) => t.testId);
          tests = tests.filter((test) => validIds.includes(test.id));
        }
        if (filters.contentType) {
          tests = tests.filter((test) => test.type === filters.contentType);
        }
        const results = await Promise.all(
          tests.map(async (test) => {
            const variants = await this.getAbTestVariants(test.id);
            let rule = null;
            if (test.automationRuleId) {
              rule = await this.getAbTestAutomationRule(test.automationRuleId) || null;
            }
            let weightProfile = null;
            let weightProfileMetrics = [];
            const controlVariant = variants.find((v) => v.isControl);
            if (controlVariant?.weightingProfileId) {
              weightProfile = await this.getMetricWeightProfile(controlVariant.weightingProfileId) || null;
              if (weightProfile) {
                weightProfileMetrics = await this.getMetricWeightProfileMetrics(weightProfile.id);
              }
            }
            let ruleMetricOverrides = [];
            if (rule) {
              ruleMetricOverrides = await this.getAbTestAutomationRuleMetrics(rule.id);
            }
            let baseline = null;
            if (controlVariant?.contentItemId) {
              const targets = await this.getAbTestTargets(test.id);
              if (targets.length > 0) {
                const target = targets[0];
                baseline = await this.getLatestBaseline(
                  controlVariant.contentItemId,
                  target.persona,
                  target.funnelStage
                ) || null;
              }
            }
            return {
              test,
              variants,
              baseline,
              rule,
              weightProfile,
              weightProfileMetrics,
              ruleMetricOverrides
            };
          })
        );
        return results;
      }
      // ==================== END AUTOMATED A/B TESTING METHODS ====================
      // Performance Metrics operations
      async getPerformanceMetrics() {
        const personaMetricsData = await db.select({
          persona: leads.persona,
          leadCount: sql6`COUNT(*)`.as("leadCount"),
          avgEngagementScore: sql6`AVG(${leads.engagementScore})`.as("avgEngagementScore"),
          conversionRate: sql6`(COUNT(*) FILTER (WHERE ${leads.convertedAt} IS NOT NULL)::float / NULLIF(COUNT(*), 0) * 100)`.as("conversionRate")
        }).from(leads).where(sql6`${leads.persona} IS NOT NULL`).groupBy(leads.persona);
        const funnelStageMetricsData = await db.select({
          funnelStage: leads.funnelStage,
          leadCount: sql6`COUNT(*)`.as("leadCount"),
          avgEngagementScore: sql6`AVG(${leads.engagementScore})`.as("avgEngagementScore")
        }).from(leads).where(sql6`${leads.funnelStage} IS NOT NULL`).groupBy(leads.funnelStage);
        const contentTypes = ["hero", "cta", "service", "event", "testimonial", "lead_magnet"];
        const contentPerformanceData = await Promise.all(
          contentTypes.map(async (type) => {
            const [stats] = await db.select({
              totalItems: sql6`COUNT(*)`.as("totalItems"),
              activeItems: sql6`COUNT(*) FILTER (WHERE ${contentItems.isActive} = true)`.as("activeItems")
            }).from(contentItems).where(eq4(contentItems.type, type));
            return {
              type,
              totalItems: Number(stats?.totalItems) || 0,
              activeItems: Number(stats?.activeItems) || 0,
              avgViews: 0
              // Placeholder for now - would need view tracking
            };
          })
        );
        const recommendations = [];
        personaMetricsData.forEach((metric) => {
          const avgScore = Number(metric.avgEngagementScore) || 0;
          if (avgScore < 50 && Number(metric.leadCount) > 5) {
            recommendations.push({
              type: "hero",
              reason: `${metric.persona} persona has ${avgScore.toFixed(0)}% engagement (below 50%)`,
              suggestedTest: `Test different hero messaging for ${metric.persona}s`,
              priority: "high"
            });
          }
        });
        personaMetricsData.forEach((metric) => {
          const convRate = Number(metric.conversionRate) || 0;
          if (convRate < 10 && Number(metric.leadCount) > 5) {
            recommendations.push({
              type: "cta",
              reason: `${metric.persona} persona has ${convRate.toFixed(1)}% conversion rate`,
              suggestedTest: `A/B test CTA buttons for ${metric.persona}s`,
              priority: "medium"
            });
          }
        });
        if (recommendations.length === 0) {
          recommendations.push({
            type: "hero",
            reason: "Optimize visitor engagement with different hero messages",
            suggestedTest: "Test hero headlines and imagery",
            priority: "low"
          });
        }
        return {
          personaMetrics: personaMetricsData.map((row) => ({
            persona: row.persona || "unknown",
            leadCount: Number(row.leadCount) || 0,
            avgEngagementScore: Number(row.avgEngagementScore) || 0,
            conversionRate: Number(row.conversionRate) || 0
          })),
          funnelStageMetrics: funnelStageMetricsData.map((row) => ({
            funnelStage: row.funnelStage || "unknown",
            leadCount: Number(row.leadCount) || 0,
            avgEngagementScore: Number(row.avgEngagementScore) || 0
          })),
          contentPerformance: contentPerformanceData,
          recommendations
        };
      }
      // Google Reviews operations
      async upsertGoogleReview(reviewData) {
        const existingReview = await db.select().from(googleReviews).where(eq4(googleReviews.googleReviewId, reviewData.googleReviewId));
        if (existingReview.length > 0) {
          const [updated] = await db.update(googleReviews).set({ ...reviewData, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(googleReviews.googleReviewId, reviewData.googleReviewId)).returning();
          return updated;
        }
        const [created] = await db.insert(googleReviews).values(reviewData).returning();
        return created;
      }
      async getGoogleReviews() {
        return await db.select().from(googleReviews).orderBy(desc4(googleReviews.time));
      }
      async getActiveGoogleReviews() {
        return await db.select().from(googleReviews).where(eq4(googleReviews.isActive, true)).orderBy(desc4(googleReviews.time));
      }
      async updateGoogleReviewVisibility(id, isActive) {
        const [updated] = await db.update(googleReviews).set({ isActive, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(googleReviews.id, id)).returning();
        return updated;
      }
      // Donation operations
      async createDonation(donationData) {
        const [donation] = await db.insert(donations2).values(donationData).returning();
        return donation;
      }
      async getDonationById(id) {
        const [donation] = await db.select().from(donations2).where(eq4(donations2.id, id));
        return donation;
      }
      async getDonationByStripeId(stripePaymentIntentId) {
        const [donation] = await db.select().from(donations2).where(eq4(donations2.stripePaymentIntentId, stripePaymentIntentId));
        return donation;
      }
      async updateDonationByStripeId(stripePaymentIntentId, updates) {
        const [updated] = await db.update(donations2).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(donations2.stripePaymentIntentId, stripePaymentIntentId)).returning();
        return updated;
      }
      async getAllDonations() {
        return await db.select().from(donations2).orderBy(desc4(donations2.createdAt));
      }
      async getDonationsByLeadId(leadId) {
        return await db.select().from(donations2).where(eq4(donations2.leadId, leadId)).orderBy(desc4(donations2.createdAt));
      }
      async getCampaignDonations(campaignId) {
        return await db.select().from(donations2).where(eq4(donations2.campaignId, campaignId)).orderBy(desc4(donations2.createdAt));
      }
      // Donation Campaign operations
      async createDonationCampaign(campaignData) {
        const [campaign] = await db.insert(donationCampaigns).values(campaignData).returning();
        return campaign;
      }
      async getDonationCampaign(id) {
        const [campaign] = await db.select().from(donationCampaigns).where(eq4(donationCampaigns.id, id));
        return campaign;
      }
      async getDonationCampaignBySlug(slug) {
        const [campaign] = await db.select().from(donationCampaigns).where(eq4(donationCampaigns.slug, slug));
        return campaign;
      }
      async getAllDonationCampaigns() {
        return await db.select().from(donationCampaigns).orderBy(desc4(donationCampaigns.createdAt));
      }
      async getActiveDonationCampaigns() {
        return await db.select().from(donationCampaigns).where(eq4(donationCampaigns.status, "active")).orderBy(desc4(donationCampaigns.createdAt));
      }
      async updateDonationCampaign(id, updates) {
        const [updated] = await db.update(donationCampaigns).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(donationCampaigns.id, id)).returning();
        return updated;
      }
      // Campaign Member operations
      async createCampaignMember(memberData) {
        const [member] = await db.insert(campaignMembers).values(memberData).returning();
        return member;
      }
      async getCampaignMember(id) {
        const [member] = await db.select().from(campaignMembers).where(eq4(campaignMembers.id, id));
        return member;
      }
      async getCampaignMembers(campaignId) {
        return await db.select().from(campaignMembers).where(eq4(campaignMembers.campaignId, campaignId));
      }
      async getUserCampaigns(userId) {
        const result = await db.select({
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
          campaign: donationCampaigns
        }).from(campaignMembers).innerJoin(donationCampaigns, eq4(campaignMembers.campaignId, donationCampaigns.id)).where(and5(
          eq4(campaignMembers.userId, userId),
          eq4(campaignMembers.isActive, true)
        ));
        return result;
      }
      async updateCampaignMember(id, updates) {
        const [updated] = await db.update(campaignMembers).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(campaignMembers.id, id)).returning();
        return updated;
      }
      async deleteCampaignMember(id) {
        await db.delete(campaignMembers).where(eq4(campaignMembers.id, id));
      }
      async isCampaignMember(campaignId, userId) {
        const [result] = await db.select().from(campaignMembers).where(and5(
          eq4(campaignMembers.campaignId, campaignId),
          eq4(campaignMembers.userId, userId),
          eq4(campaignMembers.isActive, true)
        ));
        return !!result;
      }
      // Campaign Testimonial operations
      async createCampaignTestimonial(testimonialData) {
        const [testimonial] = await db.insert(campaignTestimonials).values(testimonialData).returning();
        return testimonial;
      }
      async getCampaignTestimonial(id) {
        const [testimonial] = await db.select().from(campaignTestimonials).where(eq4(campaignTestimonials.id, id));
        return testimonial;
      }
      async getCampaignTestimonials(campaignId, status) {
        if (status) {
          return await db.select().from(campaignTestimonials).where(and5(
            eq4(campaignTestimonials.campaignId, campaignId),
            eq4(campaignTestimonials.status, status)
          )).orderBy(desc4(campaignTestimonials.createdAt));
        }
        return await db.select().from(campaignTestimonials).where(eq4(campaignTestimonials.campaignId, campaignId)).orderBy(desc4(campaignTestimonials.createdAt));
      }
      async getMemberTestimonials(memberId) {
        return await db.select().from(campaignTestimonials).where(eq4(campaignTestimonials.memberId, memberId)).orderBy(desc4(campaignTestimonials.createdAt));
      }
      async updateCampaignTestimonial(id, updates) {
        const [updated] = await db.update(campaignTestimonials).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(campaignTestimonials.id, id)).returning();
        return updated;
      }
      async deleteCampaignTestimonial(id) {
        await db.delete(campaignTestimonials).where(eq4(campaignTestimonials.id, id));
      }
      // Wishlist Item operations
      async createWishlistItem(itemData) {
        const [item] = await db.insert(wishlistItems).values(itemData).returning();
        return item;
      }
      async getActiveWishlistItems() {
        return await db.select().from(wishlistItems).where(and5(
          eq4(wishlistItems.isActive, true),
          eq4(wishlistItems.isFulfilled, false)
        )).orderBy(desc4(wishlistItems.priority), desc4(wishlistItems.createdAt));
      }
      async getAllWishlistItems() {
        return await db.select().from(wishlistItems).orderBy(desc4(wishlistItems.createdAt));
      }
      async updateWishlistItem(id, updates) {
        const [updated] = await db.update(wishlistItems).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(wishlistItems.id, id)).returning();
        return updated;
      }
      async deleteWishlistItem(id) {
        const result = await db.delete(wishlistItems).where(eq4(wishlistItems.id, id));
        return result.rowCount !== null && result.rowCount > 0;
      }
      // Email Template operations
      async getEmailTemplateByName(name) {
        const [template] = await db.select().from(emailTemplates).where(eq4(emailTemplates.name, name));
        return template;
      }
      async getAllEmailTemplates() {
        return await db.select().from(emailTemplates).orderBy(desc4(emailTemplates.createdAt));
      }
      async createEmailTemplate(templateData) {
        const [template] = await db.insert(emailTemplates).values(templateData).returning();
        return template;
      }
      async updateEmailTemplate(id, updates) {
        const [updated] = await db.update(emailTemplates).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(emailTemplates.id, id)).returning();
        return updated;
      }
      // Hormozi Email Template operations (Alex Hormozi's $100M Leads Framework)
      async getHormoziEmailTemplates(filters) {
        const conditions = [eq4(emailTemplates.isActive, true)];
        if (filters?.persona) {
          conditions.push(or(
            eq4(emailTemplates.persona, filters.persona),
            sql6`${emailTemplates.persona} IS NULL`
          ));
        }
        if (filters?.funnelStage) {
          conditions.push(or(
            eq4(emailTemplates.funnelStage, filters.funnelStage),
            sql6`${emailTemplates.funnelStage} IS NULL`
          ));
        }
        if (filters?.outreachType) {
          conditions.push(eq4(emailTemplates.outreachType, filters.outreachType));
        }
        if (filters?.templateCategory) {
          conditions.push(eq4(emailTemplates.templateCategory, filters.templateCategory));
        }
        return await db.select().from(emailTemplates).where(and5(...conditions)).orderBy(emailTemplates.persona, emailTemplates.funnelStage, emailTemplates.name);
      }
      async getHormoziEmailTemplate(id) {
        const [template] = await db.select().from(emailTemplates).where(eq4(emailTemplates.id, id));
        return template;
      }
      // Email Log operations
      async createEmailLog(logData) {
        const [log2] = await db.insert(emailLogs).values(logData).returning();
        return log2;
      }
      async getEmailLogsByRecipient(recipientEmail) {
        return await db.select().from(emailLogs).where(eq4(emailLogs.recipientEmail, recipientEmail)).orderBy(desc4(emailLogs.createdAt));
      }
      async getRecentEmailLogs(limit = 50) {
        return await db.select().from(emailLogs).orderBy(desc4(emailLogs.createdAt)).limit(limit);
      }
      async getEmailLog(id) {
        const [log2] = await db.select().from(emailLogs).where(eq4(emailLogs.id, id));
        return log2;
      }
      async getEmailLogByTrackingToken(trackingToken) {
        const [log2] = await db.select().from(emailLogs).where(eq4(emailLogs.trackingToken, trackingToken));
        return log2;
      }
      async getEmailLogsByCampaign(campaignId) {
        return await db.select().from(emailLogs).where(eq4(emailLogs.campaignId, campaignId)).orderBy(desc4(emailLogs.createdAt));
      }
      // Email Tracking operations (Opens & Clicks)
      async createEmailOpen(openData) {
        const [open] = await db.insert(emailOpens).values(openData).returning();
        return open;
      }
      async getEmailOpensByToken(trackingToken) {
        return await db.select().from(emailOpens).where(eq4(emailOpens.trackingToken, trackingToken)).orderBy(desc4(emailOpens.openedAt));
      }
      async getEmailOpensByCampaign(campaignId) {
        return await db.select().from(emailOpens).where(eq4(emailOpens.campaignId, campaignId)).orderBy(desc4(emailOpens.openedAt));
      }
      // Email Link operations (for secure server-side URL storage)
      async createEmailLink(linkData) {
        const [link] = await db.insert(emailLinks).values(linkData).returning();
        return link;
      }
      async getEmailLinkByToken(linkToken) {
        const [link] = await db.select().from(emailLinks).where(eq4(emailLinks.linkToken, linkToken));
        return link;
      }
      async getEmailLinksByEmailLog(emailLogId) {
        return await db.select().from(emailLinks).where(eq4(emailLinks.emailLogId, emailLogId)).orderBy(desc4(emailLinks.createdAt));
      }
      async createEmailClick(clickData) {
        const [click] = await db.insert(emailClicks).values(clickData).returning();
        return click;
      }
      async getEmailClicksByToken(trackingToken) {
        return await db.select().from(emailClicks).where(eq4(emailClicks.trackingToken, trackingToken)).orderBy(desc4(emailClicks.clickedAt));
      }
      async getEmailClicksByCampaign(campaignId) {
        return await db.select().from(emailClicks).where(eq4(emailClicks.campaignId, campaignId)).orderBy(desc4(emailClicks.clickedAt));
      }
      // Lead-level Email Engagement operations
      async getLeadEmailOpens(leadId, limit) {
        const results = await db.execute(sql6`
      SELECT 
        eo.id,
        eo.email_log_id as "emailLogId",
        eo.lead_id as "leadId",
        eo.campaign_id as "campaignId",
        eo.tracking_token as "trackingToken",
        eo.ip_address as "ipAddress",
        eo.user_agent as "userAgent",
        eo.metadata,
        eo.opened_at as "openedAt",
        ec.name as "campaignName"
      FROM email_opens eo
      LEFT JOIN email_campaigns ec ON eo.campaign_id = ec.id
      WHERE eo.lead_id = ${leadId}
      ORDER BY eo.opened_at DESC
      ${limit ? sql6`LIMIT ${limit}` : sql6``}
    `);
        return results.rows;
      }
      async getLeadEmailClicks(leadId, limit) {
        const results = await db.execute(sql6`
      SELECT 
        ec.id,
        ec.email_log_id as "emailLogId",
        ec.email_link_id as "emailLinkId",
        ec.lead_id as "leadId",
        ec.campaign_id as "campaignId",
        ec.tracking_token as "trackingToken",
        ec.target_url as "targetUrl",
        ec.ip_address as "ipAddress",
        ec.user_agent as "userAgent",
        ec.metadata,
        ec.clicked_at as "clickedAt",
        ecamp.name as "campaignName",
        ec.target_url as "linkUrl"
      FROM email_clicks ec
      LEFT JOIN email_campaigns ecamp ON ec.campaign_id = ecamp.id
      WHERE ec.lead_id = ${leadId}
      ORDER BY ec.clicked_at DESC
      ${limit ? sql6`LIMIT ${limit}` : sql6``}
    `);
        return results.rows;
      }
      async getFilteredLeads(options) {
        const { persona, funnelStage, engagement, leadStatus } = options;
        const baseConditions = [];
        if (persona) {
          baseConditions.push(sql6`persona = ${persona}`);
        }
        if (funnelStage) {
          baseConditions.push(sql6`funnel_stage = ${funnelStage}`);
        }
        if (leadStatus) {
          baseConditions.push(sql6`lead_status = ${leadStatus}`);
        }
        const baseFilterClause = baseConditions.length > 0 ? sql6`WHERE ${sql6.join(baseConditions, sql6` AND `)}` : sql6``;
        if (!engagement || engagement === "all") {
          const results = await db.execute(sql6`
        SELECT * FROM leads ${baseFilterClause}
        ORDER BY created_at DESC
      `);
          return results.rows;
        }
        switch (engagement) {
          case "high_engagers":
            const highEngagers = await db.execute(sql6`
          WITH filtered_leads AS (
            SELECT * FROM leads ${baseFilterClause}
          ),
          engagement_stats AS (
            SELECT 
              fl.id,
              COUNT(DISTINCT eo.id) as open_count,
              COUNT(DISTINCT ec.id) as click_count
            FROM filtered_leads fl
            LEFT JOIN email_opens eo ON fl.id = eo.lead_id
            LEFT JOIN email_clicks ec ON fl.id = ec.lead_id
            GROUP BY fl.id
          )
          SELECT fl.*
          FROM filtered_leads fl
          INNER JOIN engagement_stats es ON fl.id = es.id
          WHERE es.open_count >= 5 OR es.click_count >= 2
          ORDER BY fl.created_at DESC
        `);
            return highEngagers.rows;
          case "active":
            const active = await db.execute(sql6`
          WITH filtered_leads AS (
            SELECT * FROM leads ${baseFilterClause}
          )
          SELECT DISTINCT fl.*
          FROM filtered_leads fl
          INNER JOIN email_opens eo ON fl.id = eo.lead_id
          WHERE eo.opened_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
          ORDER BY fl.created_at DESC
        `);
            return active.rows;
          case "non_openers":
            const nonOpeners = await db.execute(sql6`
          WITH filtered_leads AS (
            SELECT * FROM leads ${baseFilterClause}
          ),
          leads_with_sends AS (
            SELECT DISTINCT fl.id
            FROM filtered_leads fl
            INNER JOIN email_logs el ON el.lead_id = fl.id
            WHERE el.status = 'sent'
          )
          SELECT fl.*
          FROM filtered_leads fl
          INNER JOIN leads_with_sends lws ON fl.id = lws.id
          WHERE NOT EXISTS (
            SELECT 1 FROM email_opens eo WHERE eo.lead_id = fl.id
          )
          ORDER BY fl.created_at DESC
        `);
            return nonOpeners.rows;
          case "clickers":
            const clickers = await db.execute(sql6`
          WITH filtered_leads AS (
            SELECT * FROM leads ${baseFilterClause}
          )
          SELECT DISTINCT fl.*
          FROM filtered_leads fl
          INNER JOIN email_clicks ec ON fl.id = ec.lead_id
          ORDER BY fl.created_at DESC
        `);
            return clickers.rows;
          case "inactive":
            const inactive = await db.execute(sql6`
          WITH filtered_leads AS (
            SELECT * FROM leads ${baseFilterClause}
          ),
          recent_sends AS (
            SELECT DISTINCT fl.id
            FROM filtered_leads fl
            INNER JOIN email_logs el ON el.lead_id = fl.id
            WHERE el.status = 'sent'
              AND el.sent_at >= CURRENT_TIMESTAMP - INTERVAL '60 days'
          )
          SELECT fl.*
          FROM filtered_leads fl
          INNER JOIN recent_sends rs ON fl.id = rs.id
          WHERE NOT EXISTS (
            SELECT 1 FROM email_opens eo 
            WHERE eo.lead_id = fl.id 
              AND eo.opened_at >= CURRENT_TIMESTAMP - INTERVAL '60 days'
          )
          AND NOT EXISTS (
            SELECT 1 FROM email_clicks ec 
            WHERE ec.lead_id = fl.id 
              AND ec.clicked_at >= CURRENT_TIMESTAMP - INTERVAL '60 days'
          )
          ORDER BY fl.created_at DESC
        `);
            return inactive.rows;
          default:
            const results = await db.execute(sql6`
          SELECT * FROM leads ${baseFilterClause}
          ORDER BY created_at DESC
        `);
            return results.rows;
        }
      }
      // Email Campaign Link Performance Analytics
      async getCampaignLinkPerformance(campaignId) {
        const sendCountResult = await db.execute(sql6`
      SELECT COUNT(DISTINCT id) as count
      FROM email_logs
      WHERE campaign_id = ${campaignId}
        AND status IN ('sent', 'delivered', 'queued')
    `);
        const totalSends = Number(sendCountResult.rows[0]?.count || 0);
        const results = await db.execute(sql6`
      SELECT 
        target_url as url,
        COUNT(*) as total_clicks,
        COUNT(DISTINCT email_log_id) as unique_clicks
      FROM email_clicks
      WHERE campaign_id = ${campaignId}
      GROUP BY target_url
      ORDER BY total_clicks DESC
    `);
        return results.rows.map((row) => ({
          url: row.url,
          totalClicks: Number(row.total_clicks),
          uniqueClicks: Number(row.unique_clicks),
          ctr: totalSends > 0 ? Number(row.unique_clicks) / totalSends * 100 : 0
        }));
      }
      async getCampaignTimeSeries(campaignId, metric, interval, startDate, endDate) {
        const tableConfig = {
          opens: { table: "email_opens", timestampCol: "opened_at" },
          clicks: { table: "email_clicks", timestampCol: "clicked_at" },
          sends: { table: "email_logs", timestampCol: "sent_at" }
        };
        const { table, timestampCol } = tableConfig[metric];
        let dateFilter = "";
        if (startDate && endDate) {
          dateFilter = `AND ${timestampCol} >= '${startDate.toISOString()}' AND ${timestampCol} <= '${endDate.toISOString()}'`;
        } else if (startDate) {
          dateFilter = `AND ${timestampCol} >= '${startDate.toISOString()}'`;
        } else if (endDate) {
          dateFilter = `AND ${timestampCol} <= '${endDate.toISOString()}'`;
        }
        const statusFilter = metric === "sends" ? `AND status IN ('sent', 'delivered', 'queued')` : "";
        const results = await db.execute(sql6.raw(`
      SELECT 
        date_trunc('${interval}', ${timestampCol}) as bucket,
        COUNT(*) as count
      FROM ${table}
      WHERE campaign_id = $1
        ${statusFilter}
        ${dateFilter}
      GROUP BY bucket
      ORDER BY bucket ASC
    `, [campaignId]));
        return results.rows.map((row) => ({
          timestamp: row.bucket,
          count: Number(row.count)
        }));
      }
      // Send Time Insights - Best Send Time Analytics
      async computeSendTimeInsights(scope, scopeId, options) {
        const minSampleSize = options?.minSampleSize || 10;
        try {
          let scopeFilter = "";
          const params = [];
          if (scope === "campaign" && scopeId) {
            scopeFilter = "AND el.campaign_id = $1";
            params.push(scopeId);
          } else if (scope === "persona" && scopeId) {
            scopeFilter = "AND COALESCE(el.persona, l.persona) = $1";
            params.push(scopeId);
          }
          const results = await db.execute(sql6.raw(`
        WITH sends AS (
          SELECT 
            el.id as log_id,
            el.sent_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York' as sent_at_ny,
            el.lead_id
          FROM email_logs el
          LEFT JOIN leads l ON l.id = el.lead_id
          WHERE el.sent_at IS NOT NULL
            AND el.status IN ('sent', 'delivered')
            ${scopeFilter}
        ),
        open_stats AS (
          SELECT 
            eo.email_log_id,
            COUNT(*) as open_count_per_send,
            COUNT(DISTINCT eo.lead_id) as unique_openers,
            MIN(eo.opened_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York') as first_opened_at_ny
          FROM email_opens eo
          WHERE EXISTS (SELECT 1 FROM sends s WHERE s.log_id = eo.email_log_id)
          GROUP BY eo.email_log_id
        ),
        click_stats AS (
          SELECT 
            ec.email_log_id,
            COUNT(*) as click_count_per_send
          FROM email_clicks ec
          WHERE EXISTS (SELECT 1 FROM sends s WHERE s.log_id = ec.email_log_id)
          GROUP BY ec.email_log_id
        ),
        baseline AS (
          SELECT
            COUNT(DISTINCT s.log_id) as total_sends,
            COUNT(DISTINCT CASE WHEN o.email_log_id IS NOT NULL THEN s.lead_id END) as total_unique_opens
          FROM sends s
          LEFT JOIN open_stats o ON o.email_log_id = s.log_id
        ),
        aggregated AS (
          SELECT
            EXTRACT(DOW FROM s.sent_at_ny)::integer as day_of_week,
            EXTRACT(HOUR FROM s.sent_at_ny)::integer as hour_of_day,
            COUNT(*) as send_count,
            SUM(COALESCE(o.open_count_per_send, 0)) as open_count,
            SUM(COALESCE(o.unique_openers, 0)) as unique_opens,
            SUM(COALESCE(c.click_count_per_send, 0)) as click_count,
            percentile_cont(0.5) WITHIN GROUP (
              ORDER BY EXTRACT(EPOCH FROM (o.first_opened_at_ny - s.sent_at_ny))
            ) FILTER (WHERE o.first_opened_at_ny IS NOT NULL) as median_seconds_to_open,
            MAX(s.sent_at_ny) as max_sent_at_ny
          FROM sends s
          LEFT JOIN open_stats o ON o.email_log_id = s.log_id
          LEFT JOIN click_stats c ON c.email_log_id = s.log_id
          GROUP BY day_of_week, hour_of_day
          HAVING COUNT(*) >= ${minSampleSize}
        )
        SELECT 
          a.*,
          CASE 
            WHEN b.total_sends > 0 
            THEN ROUND((b.total_unique_opens::numeric / b.total_sends::numeric) * 10000)
            ELSE 0 
          END as baseline_open_rate,
          b.total_sends as baseline_send_count
        FROM aggregated a
        CROSS JOIN baseline b
        ORDER BY a.day_of_week, a.hour_of_day
      `, params));
          const now = /* @__PURE__ */ new Date();
          const insights = results.rows.map((row) => {
            const sendCount = Number(row.send_count);
            const openCount = Number(row.open_count);
            const uniqueOpens = Number(row.unique_opens);
            const clickCount = Number(row.click_count);
            const baselineOpenRate = Number(row.baseline_open_rate);
            const baselineSendCount = Number(row.baseline_send_count);
            const openRate = sendCount > 0 ? Math.round(uniqueOpens / sendCount * 1e4) : 0;
            const clickRate = sendCount > 0 ? Math.round(clickCount / sendCount * 1e4) : 0;
            let baseConfidence = 0;
            if (sendCount <= 20) baseConfidence = 25;
            else if (sendCount <= 50) baseConfidence = 50;
            else if (sendCount <= 100) baseConfidence = 70;
            else baseConfidence = 90;
            const maxSentAt = new Date(row.max_sent_at_ny);
            const daysStale = Math.floor((now.getTime() - maxSentAt.getTime()) / (1e3 * 60 * 60 * 24));
            const decayFactor = Math.max(0.4, 1 - daysStale / 14);
            const confidenceScore = Math.round(Math.max(0, Math.min(100, baseConfidence * decayFactor)));
            const medianTimeToOpen = row.median_seconds_to_open ? Math.round(Number(row.median_seconds_to_open) / 60) : null;
            const isLowVolume = sendCount < minSampleSize * 2;
            return {
              scope,
              scopeId: scopeId || null,
              dayOfWeek: Number(row.day_of_week),
              hourOfDay: Number(row.hour_of_day),
              sendCount,
              openCount,
              uniqueOpens,
              clickCount,
              openRate,
              clickRate,
              medianTimeToOpen,
              confidenceScore,
              sampleSize: sendCount,
              // Store actual count, no cap
              metadata: {
                baselineOpenRate,
                baselineSendCount,
                daysStale,
                isLowVolume
              },
              analyzedAt: now
            };
          });
          await db.transaction(async (tx) => {
            if (scope === "global") {
              await tx.delete(emailSendTimeInsights).where(
                and5(
                  eq4(emailSendTimeInsights.scope, scope),
                  sql6`${emailSendTimeInsights.scopeId} IS NULL`
                )
              );
            } else {
              await tx.delete(emailSendTimeInsights).where(
                and5(
                  eq4(emailSendTimeInsights.scope, scope),
                  eq4(emailSendTimeInsights.scopeId, scopeId)
                )
              );
            }
            if (insights.length > 0) {
              await tx.insert(emailSendTimeInsights).values(insights);
            }
          });
          const inserted = await db.select().from(emailSendTimeInsights).where(
            scope === "global" ? and5(
              eq4(emailSendTimeInsights.scope, scope),
              sql6`${emailSendTimeInsights.scopeId} IS NULL`
            ) : and5(
              eq4(emailSendTimeInsights.scope, scope),
              eq4(emailSendTimeInsights.scopeId, scopeId)
            )
          ).orderBy(emailSendTimeInsights.dayOfWeek, emailSendTimeInsights.hourOfDay);
          return inserted;
        } catch (error) {
          console.error("Error computing send time insights:", error);
          throw new Error(`Failed to compute send time insights: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      async getSendTimeInsights(scope, scopeId, options) {
        const minConfidence = options?.minConfidence || 0;
        try {
          const cached = await db.select().from(emailSendTimeInsights).where(
            scope === "global" ? and5(
              eq4(emailSendTimeInsights.scope, scope),
              sql6`${emailSendTimeInsights.scopeId} IS NULL`
            ) : and5(
              eq4(emailSendTimeInsights.scope, scope),
              eq4(emailSendTimeInsights.scopeId, scopeId)
            )
          ).orderBy(desc4(emailSendTimeInsights.analyzedAt));
          const cacheAge = cached[0] ? Math.floor((Date.now() - cached[0].analyzedAt.getTime()) / (1e3 * 60 * 60)) : null;
          const needsRecompute = !cached.length || options?.forceRecompute || cacheAge !== null && cacheAge > 24;
          let insights = cached;
          if (needsRecompute) {
            insights = await this.computeSendTimeInsights(scope, scopeId);
          }
          const filtered = insights.filter((i) => i.confidenceScore >= minConfidence);
          const baselineOpenRate = filtered[0]?.metadata?.baselineOpenRate || 0;
          const topWindows = filtered.sort((a, b) => {
            if (b.confidenceScore !== a.confidenceScore) {
              return b.confidenceScore - a.confidenceScore;
            }
            return b.openRate - a.openRate;
          }).slice(0, 3).map((insight) => {
            const liftPercent = baselineOpenRate > 0 ? (insight.openRate - baselineOpenRate) / baselineOpenRate * 100 : 0;
            return {
              dayOfWeek: insight.dayOfWeek,
              hourOfDay: insight.hourOfDay,
              openRate: insight.openRate / 100,
              // Convert back to percentage (2543 -> 25.43)
              confidenceScore: insight.confidenceScore,
              sendCount: insight.sendCount,
              liftPercent: Math.round(liftPercent * 100) / 100
              // Round to 2 decimals
            };
          });
          return {
            insights: filtered,
            topWindows,
            cacheAge
          };
        } catch (error) {
          console.error("Error getting send time insights:", error);
          throw new Error(`Failed to get send time insights: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      // SMS Template operations
      async createSmsTemplate(templateData) {
        const [template] = await db.insert(smsTemplates).values(templateData).returning();
        return template;
      }
      async getAllSmsTemplates() {
        return await db.select().from(smsTemplates).orderBy(desc4(smsTemplates.createdAt));
      }
      async getSmsTemplateById(id) {
        const [template] = await db.select().from(smsTemplates).where(eq4(smsTemplates.id, id));
        return template;
      }
      async getSmsTemplatesByPersona(persona) {
        return await db.select().from(smsTemplates).where(or(eq4(smsTemplates.persona, persona), sql6`${smsTemplates.persona} IS NULL`)).orderBy(desc4(smsTemplates.createdAt));
      }
      async updateSmsTemplate(id, updates) {
        const [updated] = await db.update(smsTemplates).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(smsTemplates.id, id)).returning();
        return updated;
      }
      async deleteSmsTemplate(id) {
        await db.delete(smsTemplates).where(eq4(smsTemplates.id, id));
      }
      // Hormozi SMS Template operations
      async getHormoziSmsTemplates(filters) {
        const conditions = [eq4(smsTemplates.isActive, true)];
        if (filters?.persona) {
          conditions.push(or(
            eq4(smsTemplates.persona, filters.persona),
            sql6`${smsTemplates.persona} IS NULL`
          ));
        }
        if (filters?.funnelStage) {
          conditions.push(or(
            eq4(smsTemplates.funnelStage, filters.funnelStage),
            sql6`${smsTemplates.funnelStage} IS NULL`
          ));
        }
        if (filters?.outreachType) {
          conditions.push(eq4(smsTemplates.outreachType, filters.outreachType));
        }
        if (filters?.templateCategory) {
          conditions.push(eq4(smsTemplates.templateCategory, filters.templateCategory));
        }
        return await db.select().from(smsTemplates).where(and5(...conditions)).orderBy(smsTemplates.persona, smsTemplates.funnelStage, smsTemplates.name);
      }
      async getHormoziSmsTemplate(id) {
        const [template] = await db.select().from(smsTemplates).where(eq4(smsTemplates.id, id));
        return template;
      }
      // SMS Send operations
      async createSmsSend(sendData) {
        const [send] = await db.insert(smsSends).values(sendData).returning();
        return send;
      }
      async getSmsSendsByLead(leadId) {
        return await db.select().from(smsSends).where(eq4(smsSends.leadId, leadId)).orderBy(desc4(smsSends.createdAt));
      }
      async getRecentSmsSends(limit = 50) {
        return await db.select().from(smsSends).orderBy(desc4(smsSends.createdAt)).limit(limit);
      }
      async updateSmsSendStatus(id, status, deliveredAt) {
        const [updated] = await db.update(smsSends).set({ status, deliveredAt }).where(eq4(smsSends.id, id)).returning();
        return updated;
      }
      // SMS Bulk Campaign operations
      async createSmsBulkCampaign(campaignData) {
        const [campaign] = await db.insert(smsBulkCampaigns).values(campaignData).returning();
        return campaign;
      }
      async getSmsBulkCampaign(id) {
        const [campaign] = await db.select().from(smsBulkCampaigns).where(eq4(smsBulkCampaigns.id, id));
        return campaign;
      }
      async getAllSmsBulkCampaigns(limit = 50) {
        return await db.select().from(smsBulkCampaigns).orderBy(desc4(smsBulkCampaigns.createdAt)).limit(limit);
      }
      async updateSmsBulkCampaign(id, updates) {
        const [updated] = await db.update(smsBulkCampaigns).set(updates).where(eq4(smsBulkCampaigns.id, id)).returning();
        return updated;
      }
      async previewSmsBulkCampaignRecipients(personaFilter, funnelStageFilter) {
        const conditions = [];
        conditions.push(sql6`${leads.phone} IS NOT NULL`);
        if (personaFilter) {
          conditions.push(eq4(leads.persona, personaFilter));
        }
        if (funnelStageFilter) {
          conditions.push(eq4(leads.funnelStage, funnelStageFilter));
        }
        const [countResult] = await db.select({ count: sql6`count(*)::int` }).from(leads).where(
          and5(
            ...conditions,
            sql6`NOT EXISTS (
            SELECT 1 FROM ${emailUnsubscribes}
            WHERE ${emailUnsubscribes.phone} = ${leads.phone}
            AND ${emailUnsubscribes.isActive} = true
            AND (${emailUnsubscribes.channel} = 'sms' OR ${emailUnsubscribes.channel} = 'all')
          )`
          )
        );
        const eligibleCount = countResult?.count || 0;
        if (eligibleCount === 0) {
          return { count: 0, sampleLeads: [] };
        }
        const sampleLeads = await db.select().from(leads).where(
          and5(
            ...conditions,
            sql6`NOT EXISTS (
            SELECT 1 FROM ${emailUnsubscribes}
            WHERE ${emailUnsubscribes.phone} = ${leads.phone}
            AND ${emailUnsubscribes.isActive} = true
            AND (${emailUnsubscribes.channel} = 'sms' OR ${emailUnsubscribes.channel} = 'all')
          )`
          )
        ).limit(10);
        return {
          count: eligibleCount,
          sampleLeads
        };
      }
      // Communication Log operations
      async createCommunicationLog(logData) {
        const [log2] = await db.insert(communicationLogs).values(logData).returning();
        return log2;
      }
      async getLeadCommunications(leadId) {
        return await db.select().from(communicationLogs).where(eq4(communicationLogs.leadId, leadId)).orderBy(desc4(communicationLogs.createdAt));
      }
      // Email Campaign operations
      async createEmailCampaign(campaignData) {
        const [campaign] = await db.insert(emailCampaigns).values(campaignData).returning();
        return campaign;
      }
      async getAllEmailCampaigns() {
        return await db.select().from(emailCampaigns).orderBy(desc4(emailCampaigns.createdAt));
      }
      async getEmailCampaign(id) {
        const [campaign] = await db.select().from(emailCampaigns).where(eq4(emailCampaigns.id, id));
        return campaign;
      }
      async getActiveCampaigns() {
        return await db.select().from(emailCampaigns).where(eq4(emailCampaigns.isActive, true)).orderBy(desc4(emailCampaigns.createdAt));
      }
      async updateEmailCampaign(id, updates) {
        const [updated] = await db.update(emailCampaigns).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(emailCampaigns.id, id)).returning();
        return updated;
      }
      async deleteEmailCampaign(id) {
        await db.delete(emailCampaigns).where(eq4(emailCampaigns.id, id));
      }
      // Email Report Schedule operations
      async createEmailReportSchedule(scheduleData) {
        const [schedule] = await db.insert(emailReportSchedules).values(scheduleData).returning();
        return schedule;
      }
      async getAllEmailReportSchedules() {
        return await db.select().from(emailReportSchedules).orderBy(desc4(emailReportSchedules.createdAt));
      }
      async getEmailReportSchedule(id) {
        const [schedule] = await db.select().from(emailReportSchedules).where(eq4(emailReportSchedules.id, id));
        return schedule;
      }
      async getActiveEmailReportSchedules() {
        return await db.select().from(emailReportSchedules).where(eq4(emailReportSchedules.isActive, true)).orderBy(desc4(emailReportSchedules.createdAt));
      }
      async getSchedulesDueForExecution() {
        const now = /* @__PURE__ */ new Date();
        return await db.select().from(emailReportSchedules).where(
          and5(
            eq4(emailReportSchedules.isActive, true),
            or(
              sql6`${emailReportSchedules.nextRunAt} IS NULL`,
              sql6`${emailReportSchedules.nextRunAt} <= ${now}`
            )
          )
        ).orderBy(emailReportSchedules.nextRunAt);
      }
      async updateEmailReportSchedule(id, updates) {
        const [updated] = await db.update(emailReportSchedules).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(emailReportSchedules.id, id)).returning();
        return updated;
      }
      async deleteEmailReportSchedule(id) {
        await db.delete(emailReportSchedules).where(eq4(emailReportSchedules.id, id));
      }
      // Segment operations
      async createSegment(segmentData) {
        const [segment] = await db.insert(segments).values(segmentData).returning();
        return segment;
      }
      async getAllSegments() {
        return await db.select().from(segments).orderBy(desc4(segments.createdAt));
      }
      async getSegment(id) {
        const [segment] = await db.select().from(segments).where(eq4(segments.id, id));
        return segment;
      }
      async getActiveSegments() {
        return await db.select().from(segments).where(eq4(segments.isActive, true)).orderBy(desc4(segments.createdAt));
      }
      async updateSegment(id, updates) {
        const [updated] = await db.update(segments).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(segments.id, id)).returning();
        return updated;
      }
      async deleteSegment(id) {
        await db.delete(segments).where(eq4(segments.id, id));
      }
      async evaluateSegment(segmentId) {
        const segment = await this.getSegment(segmentId);
        if (!segment) {
          throw new Error("Segment not found");
        }
        const { segmentEvaluationService: segmentEvaluationService2 } = await Promise.resolve().then(() => (init_segmentEvaluation(), segmentEvaluation_exports));
        return await segmentEvaluationService2.evaluateFilters(segment.filters);
      }
      // Communication Unsubscribe operations
      async createEmailUnsubscribe(unsubscribeData) {
        if (!unsubscribeData.email && !unsubscribeData.phone) {
          throw new Error("At least one contact identifier (email or phone) is required");
        }
        const channel = unsubscribeData.channel || "email";
        if (channel === "email" && !unsubscribeData.email) {
          throw new Error("Email is required for email channel unsubscribes");
        }
        if (channel === "sms" && !unsubscribeData.phone) {
          throw new Error("Phone is required for SMS channel unsubscribes");
        }
        if (channel === "all" && (!unsubscribeData.email || !unsubscribeData.phone)) {
          throw new Error("Both email and phone are required for all-channel unsubscribes");
        }
        const [unsubscribe] = await db.insert(emailUnsubscribes).values(unsubscribeData).returning();
        return unsubscribe;
      }
      async getEmailUnsubscribe(email) {
        const [unsubscribe] = await db.select().from(emailUnsubscribes).where(
          and5(
            eq4(emailUnsubscribes.email, email),
            eq4(emailUnsubscribes.isActive, true),
            or(
              eq4(emailUnsubscribes.channel, "email"),
              eq4(emailUnsubscribes.channel, "all")
            )
          )
        );
        return unsubscribe;
      }
      async getSmsUnsubscribe(phone) {
        const [unsubscribe] = await db.select().from(emailUnsubscribes).where(
          and5(
            eq4(emailUnsubscribes.phone, phone),
            eq4(emailUnsubscribes.isActive, true),
            or(
              eq4(emailUnsubscribes.channel, "sms"),
              eq4(emailUnsubscribes.channel, "all")
            )
          )
        );
        return unsubscribe;
      }
      async getAllEmailUnsubscribes(includeInactive = false) {
        const query = db.select().from(emailUnsubscribes);
        if (!includeInactive) {
          return await query.where(eq4(emailUnsubscribes.isActive, true)).orderBy(desc4(emailUnsubscribes.unsubscribedAt));
        }
        return await query.orderBy(desc4(emailUnsubscribes.unsubscribedAt));
      }
      async isEmailUnsubscribed(email) {
        const unsubscribe = await this.getEmailUnsubscribe(email);
        return !!unsubscribe;
      }
      async isSmsUnsubscribed(phone) {
        const unsubscribe = await this.getSmsUnsubscribe(phone);
        return !!unsubscribe;
      }
      async removeUnsubscribe(id) {
        const [result] = await db.update(emailUnsubscribes).set({
          isActive: false,
          resubscribedAt: /* @__PURE__ */ new Date()
        }).where(
          and5(
            eq4(emailUnsubscribes.id, id),
            eq4(emailUnsubscribes.isActive, true)
          )
        ).returning();
        if (!result) {
          throw new Error("Unsubscribe record not found or already inactive");
        }
      }
      // Email Sequence Step operations
      async createEmailSequenceStep(stepData) {
        const [step] = await db.insert(emailSequenceSteps).values(stepData).returning();
        return step;
      }
      async getCampaignSteps(campaignId) {
        return await db.select().from(emailSequenceSteps).where(eq4(emailSequenceSteps.campaignId, campaignId)).orderBy(emailSequenceSteps.stepNumber);
      }
      async updateEmailSequenceStep(id, updates) {
        const [updated] = await db.update(emailSequenceSteps).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(emailSequenceSteps.id, id)).returning();
        return updated;
      }
      async deleteEmailSequenceStep(id) {
        await db.delete(emailSequenceSteps).where(eq4(emailSequenceSteps.id, id));
      }
      // Email Campaign Enrollment operations
      async createEnrollment(enrollmentData) {
        const [enrollment] = await db.insert(emailCampaignEnrollments).values(enrollmentData).returning();
        return enrollment;
      }
      async getLeadEnrollments(leadId) {
        return await db.select().from(emailCampaignEnrollments).where(eq4(emailCampaignEnrollments.leadId, leadId)).orderBy(desc4(emailCampaignEnrollments.enrolledAt));
      }
      async getCampaignEnrollments(campaignId) {
        return await db.select().from(emailCampaignEnrollments).where(eq4(emailCampaignEnrollments.campaignId, campaignId)).orderBy(desc4(emailCampaignEnrollments.enrolledAt));
      }
      async getEnrollment(campaignId, leadId) {
        const [enrollment] = await db.select().from(emailCampaignEnrollments).where(and5(
          eq4(emailCampaignEnrollments.campaignId, campaignId),
          eq4(emailCampaignEnrollments.leadId, leadId)
        ));
        return enrollment;
      }
      async updateEnrollment(id, updates) {
        const [updated] = await db.update(emailCampaignEnrollments).set(updates).where(eq4(emailCampaignEnrollments.id, id)).returning();
        return updated;
      }
      // Pipeline Stage operations
      async getPipelineStages() {
        return await db.select().from(pipelineStages).where(eq4(pipelineStages.isActive, true)).orderBy(pipelineStages.position);
      }
      async getPipelineStage(id) {
        const [stage] = await db.select().from(pipelineStages).where(eq4(pipelineStages.id, id));
        return stage;
      }
      // Lead Assignment operations
      async createLeadAssignment(assignmentData) {
        const [assignment] = await db.insert(leadAssignments).values(assignmentData).returning();
        return assignment;
      }
      async getLeadAssignment(leadId) {
        const [assignment] = await db.select().from(leadAssignments).where(eq4(leadAssignments.leadId, leadId)).orderBy(desc4(leadAssignments.createdAt)).limit(1);
        return assignment;
      }
      async getLeadAssignments(filters) {
        let query = db.select().from(leadAssignments);
        if (filters.assignedTo) {
          query = query.where(eq4(leadAssignments.assignedTo, filters.assignedTo));
        }
        if (filters.leadId) {
          query = query.where(eq4(leadAssignments.leadId, filters.leadId));
        }
        return await query.orderBy(desc4(leadAssignments.createdAt));
      }
      // Task operations
      async createTask(taskData) {
        const [task] = await db.insert(tasks).values(taskData).returning();
        return task;
      }
      async getTasks(filters) {
        const conditions = [];
        if (filters.leadId) {
          conditions.push(eq4(tasks.leadId, filters.leadId));
        }
        if (filters.assignedTo) {
          conditions.push(eq4(tasks.assignedTo, filters.assignedTo));
        }
        if (filters.status) {
          conditions.push(eq4(tasks.status, filters.status));
        }
        if (conditions.length === 0) {
          return await db.select().from(tasks).orderBy(desc4(tasks.createdAt));
        }
        return await db.select().from(tasks).where(and5(...conditions)).orderBy(desc4(tasks.createdAt));
      }
      async updateTask(id, updates) {
        const [task] = await db.update(tasks).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(tasks.id, id)).returning();
        return task;
      }
      async deleteTask(id) {
        await db.delete(tasks).where(eq4(tasks.id, id));
      }
      // Pipeline History operations
      async createPipelineHistory(historyData) {
        const [history] = await db.insert(pipelineHistory).values(historyData).returning();
        return history;
      }
      async getPipelineHistory(leadId) {
        return await db.select().from(pipelineHistory).where(eq4(pipelineHistory.leadId, leadId)).orderBy(desc4(pipelineHistory.createdAt));
      }
      // Outreach Email operations
      async createOutreachEmail(emailData) {
        const [email] = await db.insert(outreachEmails).values(emailData).returning();
        return email;
      }
      async getOutreachEmail(id) {
        const [email] = await db.select().from(outreachEmails).where(eq4(outreachEmails.id, id));
        return email;
      }
      async getLeadOutreachEmails(leadId) {
        return await db.select().from(outreachEmails).where(eq4(outreachEmails.leadId, leadId)).orderBy(desc4(outreachEmails.createdAt));
      }
      async getAllOutreachEmails(filters) {
        let query = db.select().from(outreachEmails);
        if (filters?.status) {
          query = query.where(eq4(outreachEmails.status, filters.status));
        }
        query = query.orderBy(desc4(outreachEmails.createdAt));
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }
        return await query;
      }
      async updateOutreachEmail(id, updates) {
        const [email] = await db.update(outreachEmails).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(outreachEmails.id, id)).returning();
        return email;
      }
      async deleteOutreachEmail(id) {
        await db.delete(outreachEmails).where(eq4(outreachEmails.id, id));
      }
      async markOutreachEmailOpened(id) {
        const [email] = await db.update(outreachEmails).set({
          wasOpened: true,
          openedAt: /* @__PURE__ */ new Date(),
          openCount: sql6`${outreachEmails.openCount} + 1`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq4(outreachEmails.id, id)).returning();
        return email;
      }
      async markOutreachEmailClicked(id) {
        const [email] = await db.update(outreachEmails).set({
          wasClicked: true,
          clickedAt: /* @__PURE__ */ new Date(),
          clickCount: sql6`${outreachEmails.clickCount} + 1`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq4(outreachEmails.id, id)).returning();
        return email;
      }
      async markOutreachEmailReplied(id) {
        const [email] = await db.update(outreachEmails).set({
          wasReplied: true,
          repliedAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq4(outreachEmails.id, id)).returning();
        return email;
      }
      // ICP Criteria operations
      async createIcpCriteria(criteriaData) {
        const [criteria] = await db.insert(icpCriteria).values(criteriaData).returning();
        return criteria;
      }
      async getIcpCriteria(id) {
        const [criteria] = await db.select().from(icpCriteria).where(eq4(icpCriteria.id, id));
        return criteria;
      }
      async getAllIcpCriteria() {
        return await db.select().from(icpCriteria).orderBy(desc4(icpCriteria.createdAt));
      }
      async getActiveIcpCriteria() {
        return await db.select().from(icpCriteria).where(eq4(icpCriteria.isActive, true)).orderBy(desc4(icpCriteria.createdAt));
      }
      async getDefaultIcpCriteria() {
        const [criteria] = await db.select().from(icpCriteria).where(and5(eq4(icpCriteria.isDefault, true), eq4(icpCriteria.isActive, true))).limit(1);
        return criteria;
      }
      async updateIcpCriteria(id, updates) {
        const [criteria] = await db.update(icpCriteria).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(icpCriteria.id, id)).returning();
        return criteria;
      }
      async deleteIcpCriteria(id) {
        await db.delete(icpCriteria).where(eq4(icpCriteria.id, id));
      }
      // Lead Sourcing operations
      async getLeadsForQualification(limit = 50) {
        return await db.select().from(leads).where(eq4(leads.qualificationStatus, "pending")).orderBy(desc4(leads.createdAt)).limit(limit);
      }
      async getQualifiedLeads(minScore = 70) {
        return await db.select().from(leads).where(
          and5(
            eq4(leads.qualificationStatus, "qualified"),
            sql6`${leads.qualificationScore} >= ${minScore}`
          )
        ).orderBy(desc4(leads.qualificationScore));
      }
      async getLeadsForOutreach(limit = 50) {
        return await db.select().from(leads).where(
          and5(
            eq4(leads.qualificationStatus, "qualified"),
            or(
              eq4(leads.outreachStatus, "pending"),
              eq4(leads.outreachStatus, "draft_ready")
            )
          )
        ).orderBy(desc4(leads.qualificationScore)).limit(limit);
      }
      async bulkCreateLeads(leadsData) {
        if (leadsData.length === 0) {
          return [];
        }
        const createdLeads = await db.insert(leads).values(leadsData).returning();
        return createdLeads;
      }
      // Helper method used by routes
      async getLeadById(id) {
        return this.getLead(id);
      }
      // Chatbot Conversation operations
      async createChatbotConversation(conversation) {
        const [created] = await db.insert(chatbotConversations).values(conversation).returning();
        return created;
      }
      async getChatbotConversationsBySession(sessionId, limit = 50) {
        return await db.select().from(chatbotConversations).where(eq4(chatbotConversations.sessionId, sessionId)).orderBy(chatbotConversations.createdAt).limit(limit);
      }
      async deleteChatbotSession(sessionId) {
        await db.delete(chatbotConversations).where(eq4(chatbotConversations.sessionId, sessionId));
      }
      // Chatbot Issue operations
      async createChatbotIssue(issue) {
        const [created] = await db.insert(chatbotIssues).values(issue).returning();
        return created;
      }
      async getChatbotIssues(filters) {
        let query = db.select().from(chatbotIssues);
        const conditions = [];
        if (filters?.status) {
          conditions.push(eq4(chatbotIssues.status, filters.status));
        }
        if (filters?.severity) {
          conditions.push(eq4(chatbotIssues.severity, filters.severity));
        }
        if (filters?.reportedBy) {
          conditions.push(eq4(chatbotIssues.reportedBy, filters.reportedBy));
        }
        if (conditions.length > 0) {
          query = query.where(and5(...conditions));
        }
        query = query.orderBy(desc4(chatbotIssues.createdAt));
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }
        return await query;
      }
      async updateChatbotIssue(id, updates) {
        const [updated] = await db.update(chatbotIssues).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(chatbotIssues.id, id)).returning();
        return updated;
      }
      // Analytics operations for chatbot
      async getPlatformStats() {
        const now = /* @__PURE__ */ new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
        const [
          totalLeads,
          totalUsers,
          totalDonations,
          activeContent,
          leadsThisWeek,
          donationsThisWeek,
          tasksThisWeek
        ] = await Promise.all([
          db.select({ count: sql6`cast(count(*) as int)` }).from(leads).then((r) => r[0]?.count || 0),
          db.select({ count: sql6`cast(count(*) as int)` }).from(users).then((r) => r[0]?.count || 0),
          db.select({ count: sql6`cast(count(*) as int)` }).from(donations2).then((r) => r[0]?.count || 0),
          db.select({ count: sql6`cast(count(*) as int)` }).from(contentItems).where(eq4(contentItems.isActive, true)).then((r) => r[0]?.count || 0),
          db.select({ count: sql6`cast(count(*) as int)` }).from(leads).where(sql6`${leads.createdAt} >= ${weekAgo}`).then((r) => r[0]?.count || 0),
          db.select({ count: sql6`cast(count(*) as int)` }).from(donations2).where(sql6`${donations2.createdAt} >= ${weekAgo}`).then((r) => r[0]?.count || 0),
          db.select({ count: sql6`cast(count(*) as int)` }).from(tasks).where(sql6`${tasks.createdAt} >= ${weekAgo}`).then((r) => r[0]?.count || 0)
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
      async getLeadAnalytics(filters) {
        const now = /* @__PURE__ */ new Date();
        const daysBack = filters?.daysBack || 30;
        const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1e3);
        const conditions = [];
        if (filters?.persona) {
          conditions.push(eq4(leads.persona, filters.persona));
        }
        if (filters?.funnelStage) {
          conditions.push(eq4(leads.funnelStage, filters.funnelStage));
        }
        if (filters?.pipelineStage) {
          conditions.push(eq4(leads.pipelineStage, filters.pipelineStage));
        }
        const whereClause = conditions.length > 0 ? and5(...conditions) : void 0;
        const totalCount = await db.select({ count: sql6`cast(count(*) as int)` }).from(leads).where(whereClause).then((r) => r[0]?.count || 0);
        const byPersona = await db.select({
          persona: leads.persona,
          count: sql6`cast(count(*) as int)`
        }).from(leads).where(whereClause).groupBy(leads.persona);
        const byFunnelStage = await db.select({
          stage: leads.funnelStage,
          count: sql6`cast(count(*) as int)`
        }).from(leads).where(whereClause).groupBy(leads.funnelStage);
        const byPipelineStage = await db.select({
          stage: leads.pipelineStage,
          count: sql6`cast(count(*) as int)`
        }).from(leads).where(whereClause).groupBy(leads.pipelineStage);
        const recentCount = await db.select({ count: sql6`cast(count(*) as int)` }).from(leads).where(and5(whereClause, sql6`${leads.createdAt} >= ${cutoffDate}`)).then((r) => r[0]?.count || 0);
        const avgScore = await db.select({ avg: sql6`cast(avg(${leads.engagementScore}) as float)` }).from(leads).where(whereClause).then((r) => Math.round((r[0]?.avg || 0) * 10) / 10);
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
            byPersona: byPersona.map((p) => ({ persona: p.persona || "unknown", count: p.count })),
            byFunnelStage: byFunnelStage.map((f) => ({ stage: f.stage || "unknown", count: f.count })),
            byPipelineStage: byPipelineStage.map((p) => ({ stage: p.stage || "unknown", count: p.count }))
          },
          recentLeads: {
            count: recentCount,
            period: daysBack === 7 ? "last7Days" : daysBack === 30 ? "last30Days" : "custom"
          },
          avgEngagementScore: avgScore
        };
      }
      async getContentSummary(filters) {
        const now = /* @__PURE__ */ new Date();
        const whereClause = filters?.type ? eq4(contentItems.type, filters.type) : void 0;
        const [totalCount, activeCount, inactiveCount] = await Promise.all([
          db.select({ count: sql6`cast(count(*) as int)` }).from(contentItems).where(whereClause).then((r) => r[0]?.count || 0),
          db.select({ count: sql6`cast(count(*) as int)` }).from(contentItems).where(and5(whereClause, eq4(contentItems.isActive, true))).then((r) => r[0]?.count || 0),
          db.select({ count: sql6`cast(count(*) as int)` }).from(contentItems).where(and5(whereClause, eq4(contentItems.isActive, false))).then((r) => r[0]?.count || 0)
        ]);
        const byType = await db.select({
          type: contentItems.type,
          count: sql6`cast(count(*) as int)`,
          active: sql6`cast(sum(case when ${contentItems.isActive} then 1 else 0 end) as int)`
        }).from(contentItems).where(whereClause).groupBy(contentItems.type);
        const [totalTests, activeTests, pausedTests, completedTests] = await Promise.all([
          db.select({ count: sql6`cast(count(*) as int)` }).from(abTests).then((r) => r[0]?.count || 0),
          db.select({ count: sql6`cast(count(*) as int)` }).from(abTests).where(eq4(abTests.status, "active")).then((r) => r[0]?.count || 0),
          db.select({ count: sql6`cast(count(*) as int)` }).from(abTests).where(eq4(abTests.status, "paused")).then((r) => r[0]?.count || 0),
          db.select({ count: sql6`cast(count(*) as int)` }).from(abTests).where(eq4(abTests.status, "completed")).then((r) => r[0]?.count || 0)
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
            byType: byType.map((t) => ({ type: t.type, count: t.count, active: t.active }))
          },
          abTests: {
            total: totalTests,
            active: activeTests,
            paused: pausedTests,
            completed: completedTests
          }
        };
      }
      async getDonationStats(filters) {
        const now = /* @__PURE__ */ new Date();
        const daysBack = filters?.daysBack || 30;
        const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1e3);
        const totals = await db.select({
          count: sql6`cast(count(*) as int)`,
          sum: sql6`cast(sum(${donations2.amount}) as int)`,
          avg: sql6`cast(avg(${donations2.amount}) as int)`
        }).from(donations2).then((r) => r[0] || { count: 0, sum: 0, avg: 0 });
        const byType = await db.select({
          type: donations2.donationType,
          count: sql6`cast(count(*) as int)`,
          amount: sql6`cast(sum(${donations2.amount}) as int)`
        }).from(donations2).groupBy(donations2.donationType);
        const byStatus = await db.select({
          status: donations2.status,
          count: sql6`cast(count(*) as int)`
        }).from(donations2).groupBy(donations2.status);
        const recentDonations = await db.select({
          count: sql6`cast(count(*) as int)`,
          amount: sql6`cast(sum(${donations2.amount}) as int)`
        }).from(donations2).where(sql6`${donations2.createdAt} >= ${cutoffDate}`).then((r) => r[0] || { count: 0, amount: 0 });
        const [totalCampaigns, activeCampaigns] = await Promise.all([
          db.select({ count: sql6`cast(count(*) as int)` }).from(donationCampaigns).then((r) => r[0]?.count || 0),
          db.select({ count: sql6`cast(count(*) as int)` }).from(donationCampaigns).where(eq4(donationCampaigns.status, "active")).then((r) => r[0]?.count || 0)
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
            byType: byType.map((t) => ({ type: t.type, count: t.count, amount: t.amount })),
            byStatus: byStatus.map((s) => ({ status: s.status, count: s.count }))
          },
          recentDonations: {
            count: recentDonations.count,
            amount: recentDonations.amount,
            period: daysBack === 7 ? "last7Days" : daysBack === 30 ? "last30Days" : "custom"
          },
          campaigns: {
            total: totalCampaigns,
            active: activeCampaigns
          }
        };
      }
      // Database Backup operations
      // Helper method to validate table names against allow-list
      validateTableName(tableName) {
        const VALID_TABLES = [
          "users",
          "leads",
          "interactions",
          "lead_magnets",
          "image_assets",
          "content_items",
          "content_visibility",
          "ab_tests",
          "ab_test_targets",
          "ab_test_variants",
          "ab_test_assignments",
          "ab_test_events",
          "google_reviews",
          "donations",
          "wishlist_items",
          "donation_campaigns",
          "campaign_members",
          "campaign_testimonials",
          "email_templates",
          "email_logs",
          "sms_templates",
          "sms_sends",
          "communication_logs",
          "email_campaigns",
          "email_sequence_steps",
          "email_campaign_enrollments",
          "pipeline_stages",
          "lead_assignments",
          "tasks",
          "pipeline_history",
          "admin_preferences",
          "audit_logs",
          "outreach_emails",
          "icp_criteria",
          "chatbot_conversations",
          "chatbot_issues"
        ];
        if (!VALID_TABLES.includes(tableName)) {
          throw new Error(`Invalid table name: ${tableName}. Table not eligible for backup.`);
        }
      }
      // Helper method to safely quote SQL identifiers
      quoteIdentifier(identifier) {
        return `"${identifier.replace(/"/g, '""')}"`;
      }
      async createTableBackup(tableName, userId, backupName, description) {
        this.validateTableName(tableName);
        const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").replace("T", "_").split("Z")[0];
        const backupTableName = `backup_${tableName}_${timestamp2}`;
        try {
          const quotedBackupTable = this.quoteIdentifier(backupTableName);
          const quotedOriginalTable = this.quoteIdentifier(tableName);
          await db.execute(sql6.raw(`CREATE TABLE ${quotedBackupTable} AS SELECT * FROM ${quotedOriginalTable}`));
          const countResult = await db.execute(sql6.raw(`SELECT COUNT(*) as count FROM ${quotedBackupTable}`));
          const rowCount = parseInt(countResult.rows[0]?.count || "0");
          const [snapshot] = await db.insert(backupSnapshots).values({
            tableName,
            backupTableName,
            backupName: backupName || `${tableName} backup ${timestamp2}`,
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
          try {
            await db.execute(sql6.raw(`DROP TABLE IF EXISTS ${this.quoteIdentifier(backupTableName)}`));
          } catch (cleanupError) {
            console.error("Failed to cleanup backup table after error:", cleanupError);
          }
          throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      async getAllBackupSnapshots() {
        return await db.select().from(backupSnapshots).orderBy(desc4(backupSnapshots.createdAt));
      }
      async getBackupSnapshotsByTable(tableName) {
        return await db.select().from(backupSnapshots).where(eq4(backupSnapshots.tableName, tableName)).orderBy(desc4(backupSnapshots.createdAt));
      }
      async getBackupSnapshot(id) {
        const [snapshot] = await db.select().from(backupSnapshots).where(eq4(backupSnapshots.id, id));
        return snapshot;
      }
      async restoreFromBackup(backupId, mode) {
        const snapshot = await this.getBackupSnapshot(backupId);
        if (!snapshot) {
          throw new Error("Backup snapshot not found");
        }
        const { tableName, backupTableName } = snapshot;
        this.validateTableName(tableName);
        const quotedTable = this.quoteIdentifier(tableName);
        const quotedBackupTable = this.quoteIdentifier(backupTableName);
        try {
          await db.execute(sql6.raw(`BEGIN`));
          if (mode === "replace") {
            await db.execute(sql6.raw(`DELETE FROM ${quotedTable}`));
            await db.execute(sql6.raw(`INSERT INTO ${quotedTable} SELECT * FROM ${quotedBackupTable}`));
          } else {
            await db.execute(sql6.raw(`
          INSERT INTO ${quotedTable} 
          SELECT * FROM ${quotedBackupTable} 
          WHERE id NOT IN (SELECT id FROM ${quotedTable})
          ON CONFLICT (id) DO NOTHING
        `));
          }
          const countResult = await db.execute(sql6.raw(`SELECT COUNT(*) as count FROM ${quotedTable}`));
          const rowsRestored = parseInt(countResult.rows[0]?.count || "0");
          await db.execute(sql6.raw(`COMMIT`));
          return {
            tableName,
            rowsRestored
          };
        } catch (error) {
          try {
            await db.execute(sql6.raw(`ROLLBACK`));
          } catch (rollbackError) {
            console.error("Failed to rollback transaction:", rollbackError);
          }
          throw new Error(`Failed to restore from backup: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      async deleteBackup(backupId) {
        const snapshot = await this.getBackupSnapshot(backupId);
        if (!snapshot) {
          throw new Error("Backup snapshot not found");
        }
        const quotedBackupTable = this.quoteIdentifier(snapshot.backupTableName);
        try {
          await db.execute(sql6.raw(`BEGIN`));
          await db.execute(sql6.raw(`DROP TABLE IF EXISTS ${quotedBackupTable}`));
          await db.delete(backupSnapshots).where(eq4(backupSnapshots.id, backupId));
          await db.execute(sql6.raw(`COMMIT`));
        } catch (error) {
          try {
            await db.execute(sql6.raw(`ROLLBACK`));
          } catch (rollbackError) {
            console.error("Failed to rollback transaction:", rollbackError);
          }
          throw new Error(`Failed to delete backup: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      async getAvailableTables() {
        return [
          "users",
          "leads",
          "interactions",
          "lead_magnets",
          "image_assets",
          "content_items",
          "content_visibility",
          "ab_tests",
          "ab_test_targets",
          "ab_test_variants",
          "ab_test_assignments",
          "ab_test_events",
          "google_reviews",
          "donations",
          "wishlist_items",
          "donation_campaigns",
          "campaign_members",
          "campaign_testimonials",
          "email_templates",
          "email_logs",
          "sms_templates",
          "sms_sends",
          "communication_logs",
          "email_campaigns",
          "email_sequence_steps",
          "email_campaign_enrollments",
          "pipeline_stages",
          "lead_assignments",
          "tasks",
          "pipeline_history",
          "admin_preferences",
          "audit_logs",
          "outreach_emails",
          "icp_criteria",
          "chatbot_conversations",
          "chatbot_issues"
        ].sort();
      }
      async createBackupSchedule(schedule) {
        const [created] = await db.insert(backupSchedules).values(schedule).returning();
        return created;
      }
      async getAllBackupSchedules() {
        return await db.select().from(backupSchedules).orderBy(desc4(backupSchedules.createdAt));
      }
      async getBackupSchedule(id) {
        const [schedule] = await db.select().from(backupSchedules).where(eq4(backupSchedules.id, id));
        return schedule;
      }
      async updateBackupSchedule(id, updates) {
        const [updated] = await db.update(backupSchedules).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(backupSchedules.id, id)).returning();
        return updated;
      }
      async deleteBackupSchedule(id) {
        await db.delete(backupSchedules).where(eq4(backupSchedules.id, id));
      }
      async getDueBackupSchedules(now, lookaheadMinutes = 1) {
        const lookahead = new Date(now.getTime() + lookaheadMinutes * 60 * 1e3);
        return await db.select().from(backupSchedules).where(
          and5(
            eq4(backupSchedules.isActive, true),
            eq4(backupSchedules.isRunning, false),
            sql6`${backupSchedules.nextRun} <= ${lookahead}`
          )
        ).orderBy(backupSchedules.nextRun);
      }
      async markScheduleRunning(id, lockedUntil) {
        try {
          const [updated] = await db.update(backupSchedules).set({
            isRunning: true,
            startedAt: /* @__PURE__ */ new Date(),
            lockedUntil
          }).where(
            and5(
              eq4(backupSchedules.id, id),
              eq4(backupSchedules.isRunning, false)
            )
          ).returning();
          return !!updated;
        } catch (error) {
          console.error(`Failed to mark schedule ${id} as running:`, error);
          return false;
        }
      }
      async releaseStuckSchedule(id) {
        await db.update(backupSchedules).set({
          isRunning: false,
          startedAt: null,
          lockedUntil: null
        }).where(eq4(backupSchedules.id, id));
      }
      async completeSchedule(id, runInfo) {
        const schedule = await this.getBackupSchedule(id);
        if (!schedule) return;
        const consecutiveFailures = runInfo.success ? 0 : (schedule.consecutiveFailures || 0) + 1;
        await db.update(backupSchedules).set({
          isRunning: false,
          startedAt: null,
          lockedUntil: null,
          lastRun: /* @__PURE__ */ new Date(),
          lastRunStatus: runInfo.success ? "success" : "error",
          lastRunError: runInfo.error || null,
          nextRun: runInfo.nextRun,
          consecutiveFailures,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq4(backupSchedules.id, id));
      }
      async cleanupOldBackupsBySchedule(tableName, retentionCount) {
        const allBackups = await db.select().from(backupSnapshots).where(eq4(backupSnapshots.tableName, tableName)).orderBy(desc4(backupSnapshots.createdAt));
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
      async getDatabaseStorageMetrics() {
        const LIMIT_BYTES = 10 * 1024 * 1024 * 1024;
        const tableSizesResult = await db.execute(sql6`
      SELECT 
        schemaname,
        tablename,
        pg_total_relation_size(schemaname || '.' || tablename) as size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
    `);
        const currentUsageBytes = tableSizesResult.rows.reduce(
          (sum2, row) => sum2 + parseInt(row.size_bytes || "0", 10),
          0
        );
        const activeSchedules = await db.select().from(backupSchedules).where(eq4(backupSchedules.isActive, true));
        const tableSizeMap = /* @__PURE__ */ new Map();
        for (const row of tableSizesResult.rows) {
          const record = row;
          tableSizeMap.set(record.tablename, parseInt(record.size_bytes || "0", 10));
        }
        const scheduleCountMap = /* @__PURE__ */ new Map();
        for (const schedule of activeSchedules) {
          const count3 = scheduleCountMap.get(schedule.tableName) || 0;
          scheduleCountMap.set(schedule.tableName, count3 + 1);
        }
        const tableBreakdown = [];
        let projectedBackupBytes = 0;
        for (const schedule of activeSchedules) {
          const tableSize = tableSizeMap.get(schedule.tableName) || 0;
          const retentionCount = schedule.retentionCount || 7;
          const estimatedBytes = tableSize * retentionCount;
          projectedBackupBytes += estimatedBytes;
          const existing = tableBreakdown.find((t) => t.tableName === schedule.tableName);
          if (existing) {
            existing.scheduledBackupCount++;
            existing.estimatedBackupBytes += estimatedBytes;
          } else {
            tableBreakdown.push({
              tableName: schedule.tableName,
              sizeBytes: tableSize,
              scheduledBackupCount: 1,
              estimatedBackupBytes: estimatedBytes
            });
          }
        }
        const totalProjectedBytes = currentUsageBytes + projectedBackupBytes;
        const currentUsagePercent = currentUsageBytes / LIMIT_BYTES * 100;
        const projectedUsagePercent = totalProjectedBytes / LIMIT_BYTES * 100;
        return {
          currentUsageBytes,
          projectedBackupBytes,
          totalProjectedBytes,
          limitBytes: LIMIT_BYTES,
          currentUsagePercent,
          projectedUsagePercent,
          tableBreakdown: tableBreakdown.sort((a, b) => b.estimatedBackupBytes - a.estimatedBackupBytes)
        };
      }
      // Volunteer Event operations
      async createVolunteerEvent(event) {
        const [result] = await db.insert(volunteerEvents).values(event).returning();
        return result;
      }
      async getVolunteerEvent(id) {
        const [result] = await db.select().from(volunteerEvents).where(eq4(volunteerEvents.id, id));
        return result;
      }
      async getAllVolunteerEvents() {
        return await db.select().from(volunteerEvents).orderBy(desc4(volunteerEvents.createdAt));
      }
      async getActiveVolunteerEvents() {
        return await db.select().from(volunteerEvents).where(eq4(volunteerEvents.isActive, true)).orderBy(volunteerEvents.name);
      }
      async updateVolunteerEvent(id, updates) {
        const [result] = await db.update(volunteerEvents).set(updates).where(eq4(volunteerEvents.id, id)).returning();
        return result;
      }
      async deleteVolunteerEvent(id) {
        await db.delete(volunteerEvents).where(eq4(volunteerEvents.id, id));
      }
      // Volunteer Shift operations
      async createVolunteerShift(shift) {
        const [result] = await db.insert(volunteerShifts).values(shift).returning();
        return result;
      }
      async getVolunteerShift(id) {
        const [result] = await db.select().from(volunteerShifts).where(eq4(volunteerShifts.id, id));
        return result;
      }
      async getEventShifts(eventId) {
        return await db.select().from(volunteerShifts).where(eq4(volunteerShifts.eventId, eventId)).orderBy(volunteerShifts.shiftDate);
      }
      async getUpcomingShifts(eventId, limit = 10) {
        const now = /* @__PURE__ */ new Date();
        let query = db.select().from(volunteerShifts).where(sql6`${volunteerShifts.shiftDate} >= ${now}`);
        if (eventId) {
          query = query.where(and5(
            eq4(volunteerShifts.eventId, eventId),
            sql6`${volunteerShifts.shiftDate} >= ${now}`
          ));
        }
        return await query.orderBy(volunteerShifts.shiftDate).limit(limit);
      }
      async updateVolunteerShift(id, updates) {
        const [result] = await db.update(volunteerShifts).set(updates).where(eq4(volunteerShifts.id, id)).returning();
        return result;
      }
      async deleteVolunteerShift(id) {
        await db.delete(volunteerShifts).where(eq4(volunteerShifts.id, id));
      }
      // Volunteer Enrollment operations
      async createVolunteerEnrollment(enrollment) {
        const [result] = await db.insert(volunteerEnrollments).values(enrollment).returning();
        const shift = await this.getVolunteerShift(enrollment.shiftId);
        if (shift) {
          await this.updateVolunteerShift(enrollment.shiftId, {
            currentEnrollments: (shift.currentEnrollments || 0) + 1
          });
        }
        return result;
      }
      async getVolunteerEnrollment(id) {
        const [result] = await db.select().from(volunteerEnrollments).where(eq4(volunteerEnrollments.id, id));
        return result;
      }
      async getShiftEnrollments(shiftId) {
        return await db.select().from(volunteerEnrollments).where(eq4(volunteerEnrollments.shiftId, shiftId));
      }
      async getUserEnrollments(userId) {
        const results = await db.select({
          enrollment: volunteerEnrollments,
          shift: volunteerShifts,
          event: volunteerEvents
        }).from(volunteerEnrollments).leftJoin(volunteerShifts, eq4(volunteerEnrollments.shiftId, volunteerShifts.id)).leftJoin(volunteerEvents, eq4(volunteerShifts.eventId, volunteerEvents.id)).where(eq4(volunteerEnrollments.userId, userId)).orderBy(desc4(volunteerShifts.shiftDate));
        return results;
      }
      async getActiveVolunteerEnrollmentsByUserId(userId) {
        const activeStatuses = ["registered", "confirmed", "checked_in"];
        return await db.select().from(volunteerEnrollments).where(
          and5(
            eq4(volunteerEnrollments.userId, userId),
            inArray(volunteerEnrollments.enrollmentStatus, activeStatuses)
          )
        );
      }
      async getLeadEnrollmentsVolunteer(leadId) {
        const results = await db.select({
          enrollment: volunteerEnrollments,
          shift: volunteerShifts,
          event: volunteerEvents
        }).from(volunteerEnrollments).leftJoin(volunteerShifts, eq4(volunteerEnrollments.shiftId, volunteerShifts.id)).leftJoin(volunteerEvents, eq4(volunteerShifts.eventId, volunteerEvents.id)).where(eq4(volunteerEnrollments.leadId, leadId)).orderBy(desc4(volunteerShifts.shiftDate));
        return results;
      }
      async updateVolunteerEnrollment(id, updates) {
        const [result] = await db.update(volunteerEnrollments).set(updates).where(eq4(volunteerEnrollments.id, id)).returning();
        return result;
      }
      async deleteVolunteerEnrollment(id) {
        const enrollment = await this.getVolunteerEnrollment(id);
        if (enrollment) {
          await db.delete(volunteerEnrollments).where(eq4(volunteerEnrollments.id, id));
          const shift = await this.getVolunteerShift(enrollment.shiftId);
          if (shift && shift.currentEnrollments && shift.currentEnrollments > 0) {
            await this.updateVolunteerShift(enrollment.shiftId, {
              currentEnrollments: shift.currentEnrollments - 1
            });
          }
        }
      }
      // Volunteer Session Log operations
      async createVolunteerSessionLog(log2) {
        const [result] = await db.insert(volunteerSessionLogs).values(log2).returning();
        return result;
      }
      async getEnrollmentSessions(enrollmentId) {
        return await db.select().from(volunteerSessionLogs).where(eq4(volunteerSessionLogs.enrollmentId, enrollmentId)).orderBy(desc4(volunteerSessionLogs.createdAt));
      }
      async getUserVolunteerHours(userId, year) {
        const currentYear = year || (/* @__PURE__ */ new Date()).getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
        const enrollments = await db.select({ id: volunteerEnrollments.id }).from(volunteerEnrollments).where(eq4(volunteerEnrollments.userId, userId));
        const enrollmentIds = enrollments.map((e) => e.id);
        if (enrollmentIds.length === 0) {
          return { totalMinutes: 0, sessionCount: 0, yearToDate: 0 };
        }
        const allSessions = await db.select().from(volunteerSessionLogs).where(inArray(volunteerSessionLogs.enrollmentId, enrollmentIds));
        const ytdSessions = allSessions.filter((session2) => {
          const createdAt = new Date(session2.createdAt);
          return createdAt >= yearStart && createdAt <= yearEnd;
        });
        const totalMinutes = allSessions.reduce((sum2, session2) => sum2 + (session2.minutesServed || 0), 0);
        const yearToDate = ytdSessions.reduce((sum2, session2) => sum2 + (session2.minutesServed || 0), 0);
        return {
          totalMinutes,
          sessionCount: allSessions.length,
          yearToDate
        };
      }
      async getLeadVolunteerHours(leadId, year) {
        const currentYear = year || (/* @__PURE__ */ new Date()).getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
        const enrollments = await db.select({ id: volunteerEnrollments.id }).from(volunteerEnrollments).where(eq4(volunteerEnrollments.leadId, leadId));
        const enrollmentIds = enrollments.map((e) => e.id);
        if (enrollmentIds.length === 0) {
          return { totalMinutes: 0, sessionCount: 0, yearToDate: 0 };
        }
        const allSessions = await db.select().from(volunteerSessionLogs).where(inArray(volunteerSessionLogs.enrollmentId, enrollmentIds));
        const ytdSessions = allSessions.filter((session2) => {
          const createdAt = new Date(session2.createdAt);
          return createdAt >= yearStart && createdAt <= yearEnd;
        });
        const totalMinutes = allSessions.reduce((sum2, session2) => sum2 + (session2.minutesServed || 0), 0);
        const yearToDate = ytdSessions.reduce((sum2, session2) => sum2 + (session2.minutesServed || 0), 0);
        return {
          totalMinutes,
          sessionCount: allSessions.length,
          yearToDate
        };
      }
      async updateVolunteerSessionLog(id, updates) {
        const [result] = await db.update(volunteerSessionLogs).set(updates).where(eq4(volunteerSessionLogs.id, id)).returning();
        return result;
      }
      async deleteVolunteerSessionLog(id) {
        await db.delete(volunteerSessionLogs).where(eq4(volunteerSessionLogs.id, id));
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
function getCallbackUrl() {
  const base = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, "") : process.env.REPLIT_DOMAINS ? `https://${(process.env.REPLIT_DOMAINS || "").split(",")[0]?.trim() || "localhost"}` : "http://localhost:5000";
  const path = process.env.OIDC_CALLBACK_PATH || "/api/callback";
  return `${base}${path.startsWith("/") ? path : "/" + path}`;
}
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  const isProduction = process.env.NODE_ENV === "production";
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction ? "auto" : false,
      // Auto-detect HTTPS in production
      sameSite: "lax",
      domain: void 0,
      // Let browser handle domain automatically
      path: "/",
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  console.log("[OIDC Claims] Received claims:", JSON.stringify(claims, null, 2));
  const email = claims["email"] || claims["preferred_username"];
  const firstName = claims["first_name"] || claims["given_name"] || claims["name"]?.split(" ")[0];
  const lastName = claims["last_name"] || claims["family_name"] || claims["name"]?.split(" ")[1];
  const persona = claims["persona"];
  const passions = claims["passions"];
  const funnelStage = claims["funnelStage"];
  const role = claims["role"] || (Array.isArray(claims["roles"]) ? claims["roles"][0] : claims["roles"]);
  console.log("[OIDC Claims] Extracted data:", {
    sub: claims["sub"],
    email,
    firstName,
    lastName,
    profileImageUrl: claims["profile_image_url"] || claims["picture"],
    persona,
    passions,
    funnelStage,
    role: role || "(not provided - will use default/existing)"
  });
  const upsertData = {
    oidcSub: claims["sub"],
    email,
    firstName,
    lastName,
    profileImageUrl: claims["profile_image_url"] || claims["picture"],
    persona,
    // Include persona from claims if provided
    passions,
    // Include passions from claims if provided (for testing)
    funnelStage
    // Include funnelStage from claims if provided (for testing)
  };
  if (process.env.NODE_ENV === "development" && role) {
    console.log("[OIDC Claims] Development mode: accepting role from claims:", role);
    upsertData.role = role;
  } else {
    console.log("[OIDC Claims] Role NOT added to upsertData. NODE_ENV:", process.env.NODE_ENV, "role:", role);
  }
  console.log("[OIDC Claims] Calling upsertUser with:", JSON.stringify(upsertData, null, 2));
  const result = await storage.upsertUser(upsertData);
  console.log("[OIDC Claims] upsertUser returned user with role:", result.role);
  return result;
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const issuerUrl = process.env.OIDC_ISSUER_URL || process.env.ISSUER_URL;
  const clientId = process.env.OIDC_CLIENT_ID || process.env.REPL_ID;
  if (!issuerUrl || !clientId) {
    app2.get("/api/login", (_req, res) => {
      res.redirect("/?login=unconfigured");
    });
    app2.get("/api/callback", (_req, res) => res.redirect("/"));
    app2.get("/api/logout", (_req, res) => res.redirect("/"));
    return;
  }
  const config = await getOidcConfig();
  const callbackUrl = getCallbackUrl();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    const dbUser = await upsertUser(tokens.claims());
    user.id = dbUser.id;
    verified(null, user);
  };
  const strategy = new Strategy(
    {
      name: STRATEGY_NAME,
      config,
      scope: "openid email profile offline_access",
      callbackURL: callbackUrl
    },
    verify
  );
  passport.use(strategy);
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", authLimiter, (req, res, next) => {
    const returnTo = req.query.returnTo;
    if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.includes("://")) {
      req.session.returnTo = returnTo;
    }
    passport.authenticate(STRATEGY_NAME, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", authLimiter, (req, res, next) => {
    passport.authenticate(STRATEGY_NAME, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  const logoutRedirectUri = process.env.BASE_URL?.replace(/\/$/, "") || (process.env.REPLIT_DOMAINS ? `https://${(process.env.REPLIT_DOMAINS || "").split(",")[0]?.trim()}` : null) || "/";
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      try {
        const url = client.buildEndSessionUrl(config, {
          client_id: process.env.OIDC_CLIENT_ID || process.env.REPL_ID,
          post_logout_redirect_uri: logoutRedirectUri
        }).href;
        res.redirect(url);
      } catch {
        res.redirect(logoutRedirectUri);
      }
    });
  });
}
var STRATEGY_NAME, getOidcConfig, isAuthenticated;
var init_replitAuth = __esm({
  "server/replitAuth.ts"() {
    "use strict";
    init_storage();
    init_security();
    STRATEGY_NAME = "oidc";
    getOidcConfig = memoize(
      async () => {
        let issuerUrl = (process.env.OIDC_ISSUER_URL || process.env.ISSUER_URL || "").trim();
        const clientId = process.env.OIDC_CLIENT_ID || process.env.REPL_ID;
        if (!issuerUrl || !clientId) {
          throw new Error(
            "OIDC auth requires OIDC_ISSUER_URL and OIDC_CLIENT_ID (or legacy ISSUER_URL and REPL_ID). Set them in .env or disable auth."
          );
        }
        if (!issuerUrl.startsWith("http://") && !issuerUrl.startsWith("https://")) {
          issuerUrl = "https://" + issuerUrl;
        }
        const callbackUrl = getCallbackUrl();
        const metadata = { redirect_uris: [callbackUrl] };
        const clientAuth = process.env.OIDC_CLIENT_SECRET ? client.ClientSecretPost(process.env.OIDC_CLIENT_SECRET) : void 0;
        return await client.discovery(
          new URL(issuerUrl),
          clientId,
          metadata,
          clientAuth
        );
      },
      { maxAge: 3600 * 1e3 }
    );
    isAuthenticated = async (req, res, next) => {
      const user = req.user;
      if (!req.isAuthenticated() || !user.expires_at) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const now = Math.floor(Date.now() / 1e3);
      if (now <= user.expires_at) {
        return next();
      }
      const refreshToken = user.refresh_token;
      if (!refreshToken) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      try {
        const config = await getOidcConfig();
        const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
        updateUserSession(user, tokenResponse);
        return next();
      } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
    };
  }
});

// server/impersonationMiddleware.ts
import { eq as eq5, and as and6 } from "drizzle-orm";
async function applyImpersonation(req, res, next) {
  try {
    if (!req.user) {
      return next();
    }
    const currentOidcSub = req.user.claims?.sub;
    if (!currentOidcSub) {
      return next();
    }
    const [currentUser] = await db.select().from(users).where(eq5(users.oidcSub, currentOidcSub)).limit(1);
    if (!currentUser) {
      return next();
    }
    if (currentUser.role !== "admin" && currentUser.role !== "super_admin") {
      return next();
    }
    const [session2] = await db.select().from(adminImpersonationSessions).where(and6(
      eq5(adminImpersonationSessions.adminId, currentUser.id),
      eq5(adminImpersonationSessions.isActive, true)
    )).limit(1);
    if (!session2) {
      return next();
    }
    const [impersonatedUser] = await db.select().from(users).where(eq5(users.id, session2.impersonatedUserId)).limit(1);
    if (!impersonatedUser) {
      console.warn(`[Impersonation] Session ${session2.id} references non-existent user ${session2.impersonatedUserId}`);
      return next();
    }
    req.adminUser = req.user;
    req.isImpersonating = true;
    req.user = {
      ...req.user,
      claims: {
        ...req.user.claims,
        sub: impersonatedUser.oidcSub
      }
    };
    console.log(`[Impersonation] Admin ${currentUser.email} is viewing as ${impersonatedUser.email}`);
    next();
  } catch (error) {
    console.error("[Impersonation] Error applying impersonation:", error);
    next();
  }
}
function requireActualAdmin(req, res, next) {
  const userToCheck = req.isImpersonating ? req.adminUser : req.user;
  if (!userToCheck) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const checkAdmin = async () => {
    try {
      const oidcSub = userToCheck.claims?.sub;
      if (!oidcSub) {
        return res.status(401).json({ message: "Invalid authentication" });
      }
      const [user] = await db.select().from(users).where(eq5(users.oidcSub, oidcSub)).limit(1);
      if (!user || user.role !== "admin" && user.role !== "super_admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      console.error("[requireActualAdmin] Error checking admin status:", error);
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };
  checkAdmin();
}
var init_impersonationMiddleware = __esm({
  "server/impersonationMiddleware.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// shared/tiers.ts
function hasTierAccess(userTier, requiredTier) {
  const tierOrder = [TIERS.BASIC, TIERS.PRO, TIERS.PREMIUM];
  const userIndex = tierOrder.indexOf(userTier);
  const requiredIndex = tierOrder.indexOf(requiredTier);
  return userIndex >= requiredIndex;
}
var TIERS, TIER_CONFIG;
var init_tiers = __esm({
  "shared/tiers.ts"() {
    "use strict";
    TIERS = {
      BASIC: "basic",
      PRO: "pro",
      PREMIUM: "premium"
    };
    TIER_CONFIG = {
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
        maxLeads: 1e3,
        maxEmailsPerMonth: 5e3,
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
        maxLeads: -1,
        // Unlimited
        maxEmailsPerMonth: -1,
        // Unlimited
        maxSmsPerMonth: 1e4,
        maxAdmins: -1
        // Unlimited
      }
    };
  }
});

// server/tierMiddleware.ts
function requireTier(requiredTier) {
  return async (req, res, next) => {
    try {
      const sessionUser = req.user;
      const userId = sessionUser?.id || req.session?.userId || req.session?.passport?.user;
      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required"
        });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User not found"
        });
      }
      let userTier = TIERS.BASIC;
      let organizationId = null;
      if (user.organizationId) {
        const organization = await storage.getOrganization(user.organizationId);
        if (organization) {
          userTier = organization.tier;
          organizationId = organization.id;
        }
      }
      if (!hasTierAccess(userTier, requiredTier)) {
        return res.status(403).json({
          error: "Forbidden",
          message: `This feature requires ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} tier`,
          currentTier: userTier,
          requiredTier
        });
      }
      req.userTier = userTier;
      req.organizationId = organizationId;
      next();
    } catch (error) {
      console.error("[requireTier] Error checking tier access:", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to verify tier access"
      });
    }
  };
}
var init_tierMiddleware = __esm({
  "server/tierMiddleware.ts"() {
    "use strict";
    init_storage();
    init_tiers();
  }
});

// server/services/cacLtgpAnalytics.ts
import { sql as sql7 } from "drizzle-orm";
function createCacLtgpAnalyticsService(storage2) {
  return new CacLtgpAnalyticsService(storage2);
}
var CacLtgpAnalyticsService;
var init_cacLtgpAnalytics = __esm({
  "server/services/cacLtgpAnalytics.ts"() {
    "use strict";
    init_db();
    CacLtgpAnalyticsService = class {
      constructor(storage2) {
        this.storage = storage2;
      }
      /**
       * Get overview of all CAC:LTGP metrics across all channels and campaigns
       */
      async getCACLTGPOverview() {
        const channels = await this.storage.getAllAcquisitionChannels();
        const campaigns = await this.storage.getAllMarketingCampaigns();
        const spendResult = await db.execute(sql7`
      SELECT 
        COALESCE(SUM(amount_spent), 0) as total_spend,
        COALESCE(SUM(leads_acquired), 0) as total_leads,
        COALESCE(SUM(donors_acquired), 0) as total_donors
      FROM channel_spend_ledger
    `);
        const totalSpend = Number(spendResult.rows[0]?.total_spend || 0);
        const totalLeads = Number(spendResult.rows[0]?.total_leads || 0);
        const totalDonors = Number(spendResult.rows[0]?.total_donors || 0);
        const ltgpResult = await db.execute(sql7`
      SELECT 
        COALESCE(AVG(lifetime_gross_profit), 0) as avg_ltgp,
        COALESCE(AVG(customer_acquisition_cost), 0) as avg_cac,
        COALESCE(AVG(ltgp_to_cac_ratio), 0) as avg_ratio
      FROM donor_economics
      WHERE lifetime_gross_profit > 0
    `);
        const avgLTGP = Number(ltgpResult.rows[0]?.avg_ltgp || 0);
        const avgCAC = Number(ltgpResult.rows[0]?.avg_cac || 0);
        const avgRatio = Number(ltgpResult.rows[0]?.avg_ratio || 0) / 100;
        const topChannelsResult = await db.execute(sql7`
      WITH channel_spend AS (
        SELECT 
          channel_id,
          SUM(amount_spent) as spend,
          SUM(leads_acquired) as leads,
          SUM(donors_acquired) as donors
        FROM channel_spend_ledger
        GROUP BY channel_id
      ),
      channel_economics AS (
        SELECT 
          la.channel_id,
          AVG(de.lifetime_gross_profit) as ltgp,
          AVG(de.ltgp_to_cac_ratio) as ratio
        FROM lead_attribution la
        INNER JOIN donor_economics de ON la.lead_id = de.lead_id
        WHERE de.lifetime_gross_profit > 0
        GROUP BY la.channel_id
      )
      SELECT 
        c.id as channel_id,
        c.name as channel_name,
        COALESCE(cs.spend, 0) as spend,
        COALESCE(cs.leads, 0) as leads,
        COALESCE(cs.donors, 0) as donors,
        CASE 
          WHEN COALESCE(cs.donors, 0) > 0 
          THEN COALESCE(cs.spend, 0) / cs.donors
          ELSE 0 
        END as cac,
        COALESCE(ce.ltgp, 0) as ltgp,
        COALESCE(ce.ratio, 0) as ratio
      FROM acquisition_channels c
      LEFT JOIN channel_spend cs ON c.id = cs.channel_id
      LEFT JOIN channel_economics ce ON c.id = ce.channel_id
      WHERE c.is_active = true
      ORDER BY ratio DESC
      LIMIT 5
    `);
        const topChannels = topChannelsResult.rows.map((row) => ({
          channelId: String(row.channel_id),
          channelName: String(row.channel_name),
          spend: Number(row.spend),
          leads: Number(row.leads),
          donors: Number(row.donors),
          cac: Number(row.cac),
          ltgp: Number(row.ltgp),
          ratio: Number(row.ratio) / 100
          // Convert from stored format (consistent with other endpoints)
        }));
        return {
          totalChannels: channels.length,
          totalCampaigns: campaigns.length,
          totalSpend,
          totalLeads,
          totalDonors,
          avgCAC,
          avgLTGP,
          avgRatio,
          topChannels
        };
      }
      /**
       * Get performance metrics for all acquisition channels
       */
      async getChannelPerformance() {
        const result = await db.execute(sql7`
      WITH channel_spend AS (
        SELECT 
          channel_id,
          SUM(amount_spent) as total_spend,
          SUM(leads_acquired) as total_leads,
          SUM(donors_acquired) as total_donors
        FROM channel_spend_ledger
        GROUP BY channel_id
      ),
      channel_economics AS (
        SELECT 
          la.channel_id,
          AVG(de.lifetime_gross_profit) as avg_donor_ltgp,
          AVG(de.ltgp_to_cac_ratio) as ltgp_to_cac_ratio
        FROM lead_attribution la
        INNER JOIN donor_economics de ON la.lead_id = de.lead_id
        WHERE de.lifetime_gross_profit > 0
        GROUP BY la.channel_id
      ),
      channel_campaigns AS (
        SELECT channel_id, COUNT(*) as campaigns
        FROM marketing_campaigns
        GROUP BY channel_id
      )
      SELECT 
        c.id as channel_id,
        c.name as channel_name,
        COALESCE(cs.total_spend, 0) as total_spend,
        COALESCE(cs.total_leads, 0) as total_leads,
        COALESCE(cs.total_donors, 0) as total_donors,
        CASE 
          WHEN COALESCE(cs.total_leads, 0) > 0 
          THEN COALESCE(cs.total_spend, 0) / cs.total_leads
          ELSE 0 
        END as avg_cost_per_lead,
        CASE 
          WHEN COALESCE(cs.total_donors, 0) > 0 
          THEN COALESCE(cs.total_spend, 0) / cs.total_donors
          ELSE 0 
        END as avg_cost_per_donor,
        COALESCE(ce.avg_donor_ltgp, 0) as avg_donor_ltgp,
        COALESCE(ce.ltgp_to_cac_ratio, 0) as ltgp_to_cac_ratio,
        COALESCE(cc.campaigns, 0) as campaigns
      FROM acquisition_channels c
      LEFT JOIN channel_spend cs ON c.id = cs.channel_id
      LEFT JOIN channel_economics ce ON c.id = ce.channel_id
      LEFT JOIN channel_campaigns cc ON c.id = cc.channel_id
      ORDER BY ltgp_to_cac_ratio DESC
    `);
        return result.rows.map((row) => ({
          channelId: String(row.channel_id),
          channelName: String(row.channel_name),
          totalSpend: Number(row.total_spend),
          totalLeads: Number(row.total_leads),
          totalDonors: Number(row.total_donors),
          avgCostPerLead: Number(row.avg_cost_per_lead),
          avgCostPerDonor: Number(row.avg_cost_per_donor),
          avgDonorLTGP: Number(row.avg_donor_ltgp),
          ltgpToCacRatio: Number(row.ltgp_to_cac_ratio) / 100,
          // Convert from stored format
          campaigns: Number(row.campaigns)
        }));
      }
      /**
       * Get performance metrics for all marketing campaigns
       */
      async getCampaignPerformance() {
        const result = await db.execute(sql7`
      WITH campaign_spend AS (
        SELECT 
          campaign_id,
          SUM(amount_spent) as spent,
          SUM(leads_acquired) as leads,
          SUM(donors_acquired) as donors
        FROM channel_spend_ledger
        WHERE campaign_id IS NOT NULL
        GROUP BY campaign_id
      ),
      campaign_economics AS (
        SELECT 
          la.campaign_id,
          AVG(de.lifetime_gross_profit) as avg_ltgp,
          AVG(de.ltgp_to_cac_ratio) as avg_ratio
        FROM lead_attribution la
        INNER JOIN donor_economics de ON la.lead_id = de.lead_id
        WHERE la.campaign_id IS NOT NULL AND de.lifetime_gross_profit > 0
        GROUP BY la.campaign_id
      )
      SELECT 
        mc.id as campaign_id,
        mc.name as campaign_name,
        c.name as channel_name,
        COALESCE(mc.budget, 0) as budget,
        COALESCE(cs.spent, 0) as spent,
        COALESCE(cs.leads, 0) as leads,
        COALESCE(cs.donors, 0) as donors,
        CASE 
          WHEN COALESCE(cs.donors, 0) > 0 
          THEN COALESCE(cs.spent, 0) / cs.donors
          ELSE 0 
        END as cac,
        COALESCE(ce.avg_ltgp, 0) as ltgp,
        COALESCE(ce.avg_ratio, 0) as ratio,
        CASE 
          WHEN COALESCE(cs.spent, 0) > 0 
          THEN ((COALESCE(ce.avg_ltgp, 0) * COALESCE(cs.donors, 0)) - COALESCE(cs.spent, 0)) / cs.spent * 100
          ELSE 0 
        END as roi
      FROM marketing_campaigns mc
      LEFT JOIN acquisition_channels c ON mc.channel_id = c.id
      LEFT JOIN campaign_spend cs ON mc.id = cs.campaign_id
      LEFT JOIN campaign_economics ce ON mc.id = ce.campaign_id
      ORDER BY ratio DESC
    `);
        return result.rows.map((row) => ({
          campaignId: String(row.campaign_id),
          campaignName: String(row.campaign_name),
          channelName: String(row.channel_name || "Unknown"),
          budget: Number(row.budget),
          spent: Number(row.spent),
          leads: Number(row.leads),
          donors: Number(row.donors),
          cac: Number(row.cac),
          ltgp: Number(row.ltgp),
          ratio: Number(row.ratio) / 100,
          // Convert from stored format
          roi: Number(row.roi)
        }));
      }
      /**
       * Get cohort analysis grouped by time period (week or month)
       */
      async getCohortAnalysis(periodType = "month") {
        const result = await db.execute(sql7`
      WITH period_spend AS (
        SELECT 
          period_key,
          period_start,
          period_end,
          SUM(amount_spent) as spend,
          SUM(leads_acquired) as leads_acquired,
          SUM(donors_acquired) as donors_acquired
        FROM channel_spend_ledger
        WHERE period_type = ${periodType}
        GROUP BY period_key, period_start, period_end
      ),
      period_economics AS (
        SELECT 
          ps.period_key,
          AVG(de.lifetime_gross_profit) as current_ltgp,
          AVG(de.ltgp_to_cac_ratio) as current_ratio
        FROM period_spend ps
        LEFT JOIN lead_attribution la ON la.created_at >= ps.period_start AND la.created_at < ps.period_end
        LEFT JOIN donor_economics de ON la.lead_id = de.lead_id
        WHERE de.lifetime_gross_profit > 0
        GROUP BY ps.period_key
      )
      SELECT 
        ps.period_key,
        ps.period_start::text,
        ps.period_end::text,
        COALESCE(ps.spend, 0) as spend,
        COALESCE(ps.leads_acquired, 0) as leads_acquired,
        COALESCE(ps.donors_acquired, 0) as donors_acquired,
        CASE 
          WHEN COALESCE(ps.donors_acquired, 0) > 0 
          THEN COALESCE(ps.spend, 0) / ps.donors_acquired
          ELSE 0 
        END as cac,
        COALESCE(pe.current_ltgp, 0) as current_ltgp,
        COALESCE(pe.current_ratio, 0) as current_ratio,
        EXTRACT(MONTH FROM AGE(NOW(), ps.period_start))::integer as months_active
      FROM period_spend ps
      LEFT JOIN period_economics pe ON ps.period_key = pe.period_key
      ORDER BY ps.period_start DESC
      LIMIT 12
    `);
        return result.rows.map((row) => ({
          periodKey: String(row.period_key),
          periodStart: String(row.period_start),
          periodEnd: String(row.period_end),
          spend: Number(row.spend),
          leadsAcquired: Number(row.leads_acquired),
          donorsAcquired: Number(row.donors_acquired),
          cac: Number(row.cac),
          currentLTGP: Number(row.current_ltgp),
          currentRatio: Number(row.current_ratio) / 100,
          // Convert from stored format
          monthsActive: Number(row.months_active)
        }));
      }
      /**
       * Calculate lifetime gross profit for a specific donor
       */
      async calculateDonorLTGP(leadId) {
        const economics = await this.storage.getDonorEconomics(leadId);
        if (!economics) {
          return 0;
        }
        const lifetimeRevenue = economics.lifetimeRevenue || 0;
        const deliveryCosts = economics.actualDeliveryCosts || economics.estimatedDeliveryCosts || 0;
        const ltgp = lifetimeRevenue - deliveryCosts;
        await this.storage.updateDonorEconomics(leadId, {
          lifetimeGrossProfit: ltgp,
          grossMarginPercent: lifetimeRevenue > 0 ? Math.round(ltgp / lifetimeRevenue * 100) : 0,
          ltgpToCacRatio: economics.customerAcquisitionCost > 0 ? Math.round(ltgp / economics.customerAcquisitionCost * 100) : 0
        });
        return ltgp;
      }
    };
  }
});

// server/services/adminEntitlementService.ts
import { eq as eq6, and as and7 } from "drizzle-orm";
var AdminEntitlementService;
var init_adminEntitlementService = __esm({
  "server/services/adminEntitlementService.ts"() {
    "use strict";
    init_db();
    init_schema();
    AdminEntitlementService = class {
      constructor(storage2) {
        this.storage = storage2;
      }
      /**
       * Deactivates an admin entitlement and cleans up all associated test data
       * Transactional: soft-deletes entitlement + hard-deletes test enrollments/logs
       * 
       * @throws Error if entitlement not found or cleanup fails
       */
      async deactivateEntitlement(entitlementId) {
        const entitlement = await this.storage.getAdminEntitlement(entitlementId);
        if (!entitlement) {
          throw new Error(`Entitlement ${entitlementId} not found`);
        }
        await db.transaction(async (tx) => {
          await tx.update(adminEntitlements).set({
            isActive: false,
            deactivatedAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq6(adminEntitlements.id, entitlementId));
          if (entitlement.tghEnrollmentId) {
            await tx.delete(techGoesHomeAttendance).where(and7(
              eq6(techGoesHomeAttendance.enrollmentId, entitlement.tghEnrollmentId),
              eq6(techGoesHomeAttendance.isTestData, true)
            ));
            await tx.delete(techGoesHomeEnrollments).where(and7(
              eq6(techGoesHomeEnrollments.id, entitlement.tghEnrollmentId),
              eq6(techGoesHomeEnrollments.isTestData, true)
            ));
          }
          if (entitlement.volunteerEnrollmentId) {
            await tx.delete(volunteerSessionLogs).where(and7(
              eq6(volunteerSessionLogs.enrollmentId, entitlement.volunteerEnrollmentId),
              eq6(volunteerSessionLogs.isTestData, true)
            ));
            await tx.delete(volunteerEnrollments).where(and7(
              eq6(volunteerEnrollments.id, entitlement.volunteerEnrollmentId),
              eq6(volunteerEnrollments.isTestData, true)
            ));
          }
        });
      }
      /**
       * Bulk deactivate all entitlements for an admin
       * Used when admin wants to "reset" all test enrollments
       */
      async deactivateAllEntitlements(adminId) {
        const entitlements = await this.storage.getActiveAdminEntitlements(adminId);
        for (const entitlement of entitlements) {
          await this.deactivateEntitlement(entitlement.id);
        }
      }
    };
  }
});

// server/services/funnelProgressionService.ts
import { eq as eq7, and as and8, sql as sql8, desc as desc5 } from "drizzle-orm";
async function evaluateLeadProgression(leadId, triggerEvent, triggeredBy) {
  const [lead] = await db.select().from(leads).where(eq7(leads.id, leadId)).limit(1);
  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }
  const { funnelStage, persona, engagementScore = 0, lastFunnelUpdateAt } = lead;
  if (triggerEvent && AUTO_PROGRESS_EVENTS[persona]?.includes(triggerEvent)) {
    const autoProgressRule = await db.select().from(funnelProgressionRules).where(
      and8(
        eq7(funnelProgressionRules.persona, persona),
        eq7(funnelProgressionRules.fromStage, funnelStage),
        eq7(funnelProgressionRules.isActive, true),
        sql8`${funnelProgressionRules.autoProgressEvents} @> ${JSON.stringify([triggerEvent])}`
      )
    ).limit(1);
    if (autoProgressRule.length > 0) {
      return await progressLeadToStage({
        lead,
        toStage: autoProgressRule[0].toStage,
        reason: "high_value_event",
        triggerEvent,
        triggeredBy,
        engagementScoreAtChange: engagementScore,
        ruleId: autoProgressRule[0].id
      });
    }
  }
  if (funnelStage === "retention") {
    return { advanced: false };
  }
  const applicableRules = await db.select().from(funnelProgressionRules).where(
    and8(
      eq7(funnelProgressionRules.persona, persona),
      eq7(funnelProgressionRules.fromStage, funnelStage),
      eq7(funnelProgressionRules.isActive, true)
    )
  );
  if (applicableRules.length === 0) {
    return { advanced: false };
  }
  for (const rule of applicableRules) {
    const shouldProgress = await evaluateRule(lead, rule);
    if (shouldProgress) {
      return await progressLeadToStage({
        lead,
        toStage: rule.toStage,
        reason: "threshold_met",
        triggerEvent,
        triggeredBy,
        engagementScoreAtChange: engagementScore,
        ruleId: rule.id
      });
    }
  }
  const decayResult = await checkInactivityDecay(lead);
  if (decayResult.decayed) {
    return decayResult;
  }
  return { advanced: false };
}
async function evaluateRule(lead, rule) {
  const { engagementScore = 0, lastFunnelUpdateAt } = lead;
  if (engagementScore < rule.engagementScoreThreshold) {
    return false;
  }
  if (rule.minimumDaysInStage && rule.minimumDaysInStage > 0 && lastFunnelUpdateAt) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(lastFunnelUpdateAt).getTime()) / (1e3 * 60 * 60 * 24)
    );
    if (daysSinceUpdate < rule.minimumDaysInStage) {
      return false;
    }
  }
  return true;
}
async function checkInactivityDecay(lead) {
  const { lastInteractionDate, funnelStage, persona } = lead;
  if (!lastInteractionDate) {
    return { advanced: false };
  }
  const [decayRule] = await db.select().from(funnelProgressionRules).where(
    and8(
      eq7(funnelProgressionRules.persona, persona),
      eq7(funnelProgressionRules.fromStage, funnelStage),
      eq7(funnelProgressionRules.isActive, true),
      sql8`${funnelProgressionRules.inactivityDaysThreshold} IS NOT NULL`,
      sql8`${funnelProgressionRules.decayToStage} IS NOT NULL`
    )
  ).limit(1);
  if (!decayRule) {
    return { advanced: false };
  }
  const daysSinceInteraction = Math.floor(
    (Date.now() - new Date(lastInteractionDate).getTime()) / (1e3 * 60 * 60 * 24)
  );
  if (daysSinceInteraction >= decayRule.inactivityDaysThreshold) {
    return await progressLeadToStage({
      lead,
      toStage: decayRule.decayToStage,
      reason: "inactivity_decay",
      engagementScoreAtChange: lead.engagementScore || 0
    });
  }
  return { advanced: false };
}
async function progressLeadToStage(params) {
  const { lead, toStage, reason, triggerEvent, triggeredBy, engagementScoreAtChange, ruleId } = params;
  const fromStage = lead.funnelStage;
  if (reason === "threshold_met") {
    const fromIndex = FUNNEL_STAGES.indexOf(fromStage);
    const toIndex = FUNNEL_STAGES.indexOf(toStage);
    if (toIndex !== fromIndex + 1) {
      throw new Error(`Invalid threshold-based transition: ${fromStage} -> ${toStage}. Use auto-progress events or manual override for stage skipping.`);
    }
  }
  await db.update(leads).set({
    funnelStage: toStage,
    lastFunnelUpdateAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq7(leads.id, lead.id));
  const historyEntry = {
    leadId: lead.id,
    fromStage,
    toStage,
    reason,
    triggeredBy: triggeredBy || null,
    engagementScoreAtChange,
    triggerEvent: triggerEvent || null,
    metadata: {
      ruleId,
      personaAtChange: lead.persona,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
  await db.insert(funnelProgressionHistory).values(historyEntry);
  return { advanced: true, fromStage, toStage };
}
async function getLeadProgressionHistory(leadId) {
  return await db.select({
    id: funnelProgressionHistory.id,
    leadId: funnelProgressionHistory.leadId,
    fromStage: funnelProgressionHistory.fromStage,
    toStage: funnelProgressionHistory.toStage,
    reason: funnelProgressionHistory.reason,
    engagementScore: funnelProgressionHistory.engagementScore,
    triggeredBy: funnelProgressionHistory.triggeredBy,
    createdAt: funnelProgressionHistory.createdAt,
    lead: {
      firstName: leads.firstName,
      lastName: leads.lastName,
      email: leads.email,
      persona: leads.persona
    }
  }).from(funnelProgressionHistory).innerJoin(leads, eq7(funnelProgressionHistory.leadId, leads.id)).where(and8(
    eq7(funnelProgressionHistory.leadId, leadId),
    sql8`${leads.persona} IS NOT NULL`
  )).orderBy(desc5(funnelProgressionHistory.createdAt));
}
function calculateEngagementDelta(eventType) {
  return EVENT_SCORES[eventType] || 0;
}
async function manuallyProgressLead(leadId, toStage, triggeredBy, reason) {
  const [lead] = await db.select().from(leads).where(eq7(leads.id, leadId)).limit(1);
  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }
  return await progressLeadToStage({
    lead,
    toStage,
    reason: "manual_override",
    triggeredBy,
    engagementScoreAtChange: lead.engagementScore || 0
  });
}
var EVENT_SCORES, AUTO_PROGRESS_EVENTS, FUNNEL_STAGES;
var init_funnelProgressionService = __esm({
  "server/services/funnelProgressionService.ts"() {
    "use strict";
    init_db();
    init_schema();
    EVENT_SCORES = {
      // Low-value exploration events (5-10 points)
      page_view: 5,
      section_scroll: 5,
      video_start: 8,
      resource_download: 10,
      // Medium-value interest events (20-30 points)
      quiz_start: 20,
      quiz_complete: 30,
      testimonial_video_watch: 25,
      newsletter_signup: 30,
      impact_calculator_use: 25,
      // High-value intent events (50-100 points)
      contact_form_submit: 100,
      volunteer_inquiry: 80,
      program_inquiry: 90,
      enrollment_form_start: 50,
      donation_page_view: 60,
      // Conversion events (auto-progress to retention, no points needed)
      donation_completed: 0,
      enrollment_submitted: 0,
      volunteer_enrolled: 0
    };
    AUTO_PROGRESS_EVENTS = {
      donor: ["donation_completed"],
      student: ["enrollment_submitted"],
      volunteer: ["volunteer_enrolled"],
      parent: ["enrollment_submitted"],
      // Parent enrolling child
      provider: ["contact_form_submit"]
      // Partnership inquiry
    };
    FUNNEL_STAGES = ["awareness", "consideration", "decision", "retention"];
  }
});

// server/objectAcl.ts
function isPermissionAllowed(requested, granted) {
  if (requested === "read" /* READ */) {
    return ["read" /* READ */, "write" /* WRITE */].includes(granted);
  }
  return granted === "write" /* WRITE */;
}
function createObjectAccessGroup(group) {
  switch (group.type) {
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name ?? "unknown"}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (await accessGroup.hasMember(userId) && isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }
  return false;
}
var ACL_POLICY_METADATA_KEY;
var init_objectAcl = __esm({
  "server/objectAcl.ts"() {
    "use strict";
    ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
  }
});

// server/objectStorageReplit.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
function getClient() {
  if (!replitStorageInstance) {
    replitStorageInstance = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: {
            type: "json",
            subject_token_field_name: "access_token"
          }
        },
        universe_domain: "googleapis.com"
      },
      projectId: ""
    });
  }
  return replitStorageInstance;
}
function parseObjectPath(path) {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
var REPLIT_SIDECAR_ENDPOINT, replitStorageInstance, objectStorageClient, ObjectNotFoundError, ObjectStorageService;
var init_objectStorageReplit = __esm({
  "server/objectStorageReplit.ts"() {
    "use strict";
    init_objectAcl();
    REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
    replitStorageInstance = null;
    objectStorageClient = new Proxy({}, {
      get(_, prop) {
        return getClient()[prop];
      }
    });
    ObjectNotFoundError = class _ObjectNotFoundError extends Error {
      constructor() {
        super("Object not found");
        this.name = "ObjectNotFoundError";
        Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
      }
    };
    ObjectStorageService = class {
      constructor() {
      }
      getDefaultBucketId() {
        const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";
        if (!bucketId) {
          throw new Error(
            "DEFAULT_OBJECT_STORAGE_BUCKET_ID not set. Create a bucket in 'Object Storage' tool."
          );
        }
        return bucketId;
      }
      normalizePath(path) {
        if (path.startsWith("/")) {
          return path;
        }
        return `/${this.getDefaultBucketId()}/${path}`;
      }
      getPublicObjectSearchPaths() {
        const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
        const paths = Array.from(
          new Set(
            pathsStr.split(",").map((path) => path.trim()).filter((path) => path.length > 0).map((path) => this.normalizePath(path))
          )
        );
        if (paths.length === 0) {
          throw new Error(
            "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
          );
        }
        return paths;
      }
      getPrivateObjectDir() {
        const dir = process.env.PRIVATE_OBJECT_DIR || "";
        if (!dir) {
          throw new Error(
            "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
          );
        }
        return this.normalizePath(dir);
      }
      async searchPublicObject(filePath) {
        const client2 = getClient();
        for (const searchPath of this.getPublicObjectSearchPaths()) {
          const fullPath = `${searchPath}/${filePath}`;
          const { bucketName, objectName } = parseObjectPath(fullPath);
          const bucket = client2.bucket(bucketName);
          const file = bucket.file(objectName);
          const [exists] = await file.exists();
          if (exists) {
            return file;
          }
        }
        return null;
      }
      async downloadObject(file, res, cacheTtlSec = 3600) {
        try {
          const [metadata] = await file.getMetadata();
          const aclPolicy = await getObjectAclPolicy(file);
          const isPublic = aclPolicy?.visibility === "public";
          res.set({
            "Content-Type": metadata.contentType || "application/octet-stream",
            "Content-Length": String(metadata.size ?? 0),
            "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
          });
          const stream = file.createReadStream();
          stream.on("error", (err) => {
            console.error("Stream error:", err);
            if (!res.headersSent) {
              res.status(500).json({ error: "Error streaming file" });
            }
          });
          stream.pipe(res);
        } catch (error) {
          console.error("Error downloading file:", error);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error downloading file" });
          }
        }
      }
      async getObjectEntityUploadURL() {
        const privateObjectDir = this.getPrivateObjectDir();
        if (!privateObjectDir) {
          throw new Error(
            "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
          );
        }
        const objectId = randomUUID();
        const fullPath = `${privateObjectDir}/uploads/${objectId}`;
        const { bucketName, objectName } = parseObjectPath(fullPath);
        const uploadURL = await signObjectURL({
          bucketName,
          objectName,
          method: "PUT",
          ttlSec: 900
        });
        const objectPath = `/objects/uploads/${objectId}`;
        return { uploadURL, objectPath };
      }
      async getObjectEntityFile(objectPath) {
        const client2 = getClient();
        if (!objectPath.startsWith("/objects/")) {
          throw new ObjectNotFoundError();
        }
        const parts = objectPath.slice(1).split("/");
        if (parts.length < 2) {
          throw new ObjectNotFoundError();
        }
        const entityId = parts.slice(1).join("/");
        let entityDir = this.getPrivateObjectDir();
        if (!entityDir.endsWith("/")) {
          entityDir = `${entityDir}/`;
        }
        const objectEntityPath = `${entityDir}${entityId}`;
        const { bucketName, objectName } = parseObjectPath(objectEntityPath);
        const bucket = client2.bucket(bucketName);
        const objectFile = bucket.file(objectName);
        const [exists] = await objectFile.exists();
        if (!exists) {
          throw new ObjectNotFoundError();
        }
        return objectFile;
      }
      normalizeObjectEntityPath(rawPath) {
        if (!rawPath.startsWith("https://storage.googleapis.com/")) {
          return rawPath;
        }
        const url = new URL(rawPath);
        const rawObjectPath = url.pathname;
        let objectEntityDir = this.getPrivateObjectDir();
        if (!objectEntityDir.endsWith("/")) {
          objectEntityDir = `${objectEntityDir}/`;
        }
        if (!rawObjectPath.startsWith(objectEntityDir)) {
          return rawObjectPath;
        }
        const entityId = rawObjectPath.slice(objectEntityDir.length);
        return `/objects/${entityId}`;
      }
      async setObjectEntityAclPolicy(objectPath, aclPolicy) {
        const objectFile = await this.getObjectEntityFile(objectPath);
        await setObjectAclPolicy(objectFile, aclPolicy);
        return objectPath;
      }
      async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
        const normalizedPath = this.normalizeObjectEntityPath(rawPath);
        if (!normalizedPath.startsWith("/")) {
          return normalizedPath;
        }
        const objectFile = await this.getObjectEntityFile(normalizedPath);
        await setObjectAclPolicy(objectFile, aclPolicy);
        return normalizedPath;
      }
      async canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission
      }) {
        return canAccessObject({
          userId,
          objectFile,
          requestedPermission: requestedPermission ?? "read" /* READ */
        });
      }
      async renameObjectEntity(originalPath, newFilename) {
        const client2 = getClient();
        const originalFile = await this.getObjectEntityFile(originalPath);
        const parts = originalPath.slice(1).split("/");
        const entityId = parts.slice(1).join("/");
        const directory = entityId.substring(0, entityId.lastIndexOf("/") + 1);
        let entityDir = this.getPrivateObjectDir();
        if (!entityDir.endsWith("/")) {
          entityDir = `${entityDir}/`;
        }
        const newObjectPath = `${entityDir}${directory}${newFilename}`;
        const { bucketName, objectName } = parseObjectPath(newObjectPath);
        const bucket = client2.bucket(bucketName);
        const newFile = bucket.file(objectName);
        await originalFile.copy(newFile);
        const aclPolicy = await getObjectAclPolicy(originalFile);
        if (aclPolicy) {
          await setObjectAclPolicy(newFile, aclPolicy);
        }
        await originalFile.delete();
        return `/objects/${directory}${newFilename}`;
      }
    };
  }
});

// server/objectStorageS3.ts
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID as randomUUID2 } from "crypto";
import { Readable } from "stream";
function getS3Config() {
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET || process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucket) {
    throw new Error(
      "S3_BUCKET or R2_BUCKET or DEFAULT_OBJECT_STORAGE_BUCKET_ID must be set when OBJECT_STORAGE_PROVIDER=s3"
    );
  }
  const region = process.env.AWS_REGION || process.env.R2_REGION || "auto";
  const endpoint = process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : void 0;
  const credentials = process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  } : void 0;
  return { bucket, region, endpoint, credentials };
}
function getClient2() {
  if (!s3Client) {
    const { region, endpoint, credentials } = getS3Config();
    s3Client = new S3Client({
      region,
      endpoint: endpoint || void 0,
      credentials: credentials || void 0
    });
  }
  return s3Client;
}
function parsePath(path) {
  const bucket = getS3Config().bucket;
  const p = path.startsWith("/") ? path.slice(1) : path;
  const key = p.startsWith(bucket + "/") ? p.slice(bucket.length + 1) : p;
  return { bucket, key };
}
var s3Client, ObjectNotFoundError2, S3StorageFile, ObjectStorageService2;
var init_objectStorageS3 = __esm({
  "server/objectStorageS3.ts"() {
    "use strict";
    init_objectAcl();
    s3Client = null;
    ObjectNotFoundError2 = class _ObjectNotFoundError extends Error {
      constructor() {
        super("Object not found");
        this.name = "ObjectNotFoundError";
        Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
      }
    };
    S3StorageFile = class {
      constructor(client2, bucket, key) {
        this.client = client2;
        this.bucket = bucket;
        this.key = key;
      }
      get name() {
        return `${this.bucket}/${this.key}`;
      }
      async getMetadata() {
        const cmd = new HeadObjectCommand({ Bucket: this.bucket, Key: this.key });
        const meta = await this.client.send(cmd);
        return [
          {
            metadata: meta.Metadata || {},
            contentType: meta.ContentType,
            size: meta.ContentLength
          }
        ];
      }
      async setMetadata(arg) {
        const getCmd = new GetObjectCommand({ Bucket: this.bucket, Key: this.key });
        const obj = await this.client.send(getCmd);
        const body = obj.Body;
        const metadata = arg.metadata;
        const putCmd = new PutObjectCommand({
          Bucket: this.bucket,
          Key: this.key,
          Body: body,
          ContentType: obj.ContentType,
          Metadata: metadata
        });
        return this.client.send(putCmd);
      }
      async exists() {
        try {
          await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: this.key }));
          return [true];
        } catch {
          return [false];
        }
      }
      createReadStream() {
        const client2 = this.client;
        const bucket = this.bucket;
        const key = this.key;
        const readable = new Readable({ read: () => {
        } });
        (async () => {
          try {
            const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
            const res = await client2.send(cmd);
            const stream = res.Body;
            stream.on("data", (chunk) => readable.push(chunk));
            stream.on("end", () => readable.push(null));
            stream.on("error", (err) => readable.destroy(err));
          } catch (err) {
            readable.destroy(err);
          }
        })();
        return readable;
      }
      getBucket() {
        return this.bucket;
      }
      getKey() {
        return this.key;
      }
      async copy(dest) {
        await this.client.send(
          new CopyObjectCommand({
            CopySource: `${this.bucket}/${this.key}`,
            Bucket: dest.getBucket(),
            Key: dest.getKey()
          })
        );
      }
      async delete() {
        await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.key }));
      }
    };
    ObjectStorageService2 = class {
      getBucket() {
        return getS3Config().bucket;
      }
      normalizePath(path) {
        if (path.startsWith("/")) return path;
        return `/${this.getBucket()}/${path}`;
      }
      getPublicObjectSearchPaths() {
        const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || process.env.S3_PUBLIC_PREFIXES || "";
        const paths = pathsStr.split(",").map((p) => p.trim()).filter(Boolean).map((p) => this.normalizePath(p));
        if (paths.length === 0) {
          throw new Error("PUBLIC_OBJECT_SEARCH_PATHS or S3_PUBLIC_PREFIXES must be set (comma-separated prefixes)");
        }
        return [...new Set(paths)];
      }
      getPrivateObjectDir() {
        const dir = process.env.PRIVATE_OBJECT_DIR || process.env.S3_PRIVATE_PREFIX || "";
        if (!dir) {
          throw new Error("PRIVATE_OBJECT_DIR or S3_PRIVATE_PREFIX must be set");
        }
        return this.normalizePath(dir);
      }
      async searchPublicObject(filePath) {
        const client2 = getClient2();
        const bucket = this.getBucket();
        for (const searchPath of this.getPublicObjectSearchPaths()) {
          const { key } = parsePath(`${searchPath}/${filePath}`);
          const file = new S3StorageFile(client2, bucket, key);
          const [exists] = await file.exists();
          if (exists) return file;
        }
        return null;
      }
      async downloadObject(file, res, cacheTtlSec = 3600) {
        try {
          const [metadata] = await file.getMetadata();
          const aclPolicy = await getObjectAclPolicy(file);
          const isPublic = aclPolicy?.visibility === "public";
          res.set({
            "Content-Type": metadata.contentType || "application/octet-stream",
            "Content-Length": String(metadata.size ?? 0),
            "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
          });
          const stream = file.createReadStream();
          stream.on("error", (err) => {
            console.error("Stream error:", err);
            if (!res.headersSent) res.status(500).json({ error: "Error streaming file" });
          });
          stream.pipe(res);
        } catch (err) {
          console.error("Error downloading file:", err);
          if (!res.headersSent) res.status(500).json({ error: "Error downloading file" });
        }
      }
      async getObjectEntityUploadURL() {
        const client2 = getClient2();
        const bucket = this.getBucket();
        const prefix = this.getPrivateObjectDir().replace(/^\//, "").replace(/^[^/]+\//, "") || "uploads";
        const objectId = randomUUID2();
        const key = `${prefix}/uploads/${objectId}`;
        const uploadURL = await getSignedUrl(
          client2,
          new PutObjectCommand({ Bucket: bucket, Key: key }),
          { expiresIn: 900 }
        );
        return { uploadURL, objectPath: `/objects/uploads/${objectId}` };
      }
      async getObjectEntityFile(objectPath) {
        if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError2();
        const parts = objectPath.slice(1).split("/");
        if (parts.length < 2) throw new ObjectNotFoundError2();
        const entityId = parts.slice(1).join("/");
        const bucket = this.getBucket();
        const dirPrefix = this.getPrivateObjectDir().replace(/^\//, "").replace(/^[^/]+\//, "") || "";
        const key = dirPrefix ? `${dirPrefix}/${entityId}` : entityId;
        const client2 = getClient2();
        const file = new S3StorageFile(client2, bucket, key);
        const [exists] = await file.exists();
        if (!exists) throw new ObjectNotFoundError2();
        return file;
      }
      normalizeObjectEntityPath(rawPath) {
        if (!rawPath.includes(".r2.cloudflarestorage.com") && !rawPath.includes("s3.")) {
          return rawPath;
        }
        try {
          const url = new URL(rawPath);
          const pathname = url.pathname.replace(/^\//, "");
          const entityDir = this.getPrivateObjectDir().replace(/^\//, "").split("/").slice(1).join("/");
          if (!pathname.startsWith(entityDir + "/")) return rawPath;
          const entityId = pathname.slice(entityDir.length + 1);
          return `/objects/${entityId}`;
        } catch {
          return rawPath;
        }
      }
      async setObjectEntityAclPolicy(objectPath, aclPolicy) {
        const file = await this.getObjectEntityFile(objectPath);
        await setObjectAclPolicy(file, aclPolicy);
        return objectPath;
      }
      async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
        const normalizedPath = this.normalizeObjectEntityPath(rawPath);
        if (!normalizedPath.startsWith("/")) return normalizedPath;
        const file = await this.getObjectEntityFile(normalizedPath);
        await setObjectAclPolicy(file, aclPolicy);
        return normalizedPath;
      }
      async canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission
      }) {
        return canAccessObject({
          userId,
          objectFile,
          requestedPermission: requestedPermission ?? "read" /* READ */
        });
      }
      async renameObjectEntity(originalPath, newFilename) {
        const originalFile = await this.getObjectEntityFile(originalPath);
        const parts = originalPath.slice(1).split("/");
        const entityId = parts.slice(1).join("/");
        const directory = entityId.substring(0, entityId.lastIndexOf("/") + 1);
        const bucket = this.getBucket();
        const prefix = this.getPrivateObjectDir().replace(/^\//, "").replace(/^[^/]+\//, "") || "";
        const newKey = prefix ? `${prefix}/${directory}${newFilename}` : `${directory}${newFilename}`;
        const client2 = getClient2();
        const newFile = new S3StorageFile(client2, bucket, newKey);
        await originalFile.copy(newFile);
        const aclPolicy = await getObjectAclPolicy(originalFile);
        if (aclPolicy) await setObjectAclPolicy(newFile, aclPolicy);
        await originalFile.delete();
        return `/objects/${directory}${newFilename}`;
      }
    };
  }
});

// server/objectStorage.ts
var provider, ObjectStorageService3, ObjectNotFoundError3;
var init_objectStorage = __esm({
  "server/objectStorage.ts"() {
    "use strict";
    init_objectStorageReplit();
    init_objectStorageS3();
    provider = process.env.OBJECT_STORAGE_PROVIDER || "replit";
    ObjectStorageService3 = provider === "s3" ? ObjectStorageService2 : ObjectStorageService;
    ObjectNotFoundError3 = provider === "s3" ? ObjectNotFoundError2 : ObjectNotFoundError;
  }
});

// server/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
async function uploadToCloudinary(imageBuffer, options = {}) {
  const {
    folder = "julies-family-learning",
    publicId,
    transformation = [],
    upscale = true,
    quality = "auto:best"
  } = options;
  const transformations = [...transformation];
  if (upscale) {
    transformations.push({
      quality,
      fetch_format: "auto",
      flags: "progressive:steep"
    });
  }
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        transformation: transformations.length > 0 ? transformations : void 0,
        eager: [
          {
            width: 1920,
            height: 1080,
            crop: "limit",
            quality: "auto:best",
            fetch_format: "auto"
          },
          {
            width: 3840,
            height: 2160,
            crop: "limit",
            quality: "auto:best",
            fetch_format: "auto"
          }
        ],
        eager_async: true,
        resource_type: "image",
        allowed_formats: ["jpg", "png", "webp", "gif", "svg"]
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary upload failed: No result returned"));
          return;
        }
        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes
        });
      }
    );
    uploadStream.end(imageBuffer);
  });
}
function getOptimizedImageUrl(publicId, options = {}) {
  const {
    width,
    height,
    quality = "auto:best",
    format: format2 = "auto"
  } = options;
  return cloudinary.url(publicId, {
    width,
    height,
    crop: "limit",
    quality,
    fetch_format: format2,
    secure: true
  });
}
async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw new Error(`Failed to delete image: ${publicId}`);
  }
}
var init_cloudinary = __esm({
  "server/cloudinary.ts"() {
    "use strict";
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }
});

// server/gemini.ts
import { GoogleGenAI } from "@google/genai";
async function analyzeSocialPostScreenshot(imageBase64, mimeType = "image/jpeg") {
  const prompt = `You are analyzing a screenshot of a social media post. Extract the following information:

1. **Caption/Description**: The full text content of the post
2. **Platform**: Whether this is from Instagram, Facebook, or LinkedIn (look for visual indicators like interface design, icons, colors, layout, etc.)
3. **Username**: The account name/handle or company name that posted this
4. **Suggested Title**: Create a short, descriptive title (max 60 characters) that summarizes what this post is about
5. **Link**: If visible, extract any links mentioned in the post. If the username/company name is visible, construct a profile link.

For Instagram: https://instagram.com/{username}
For Facebook: https://www.facebook.com/{username}
For LinkedIn: https://linkedin.com/company/{company-name}

Visual platform indicators:
- Instagram: Camera icon, colorful gradient theme, square/portrait photos
- Facebook: Blue theme, "f" logo, reactions icons (Like, Love, etc.)
- LinkedIn: Blue and white professional theme, "in" logo, corporate/professional content

Return ONLY valid JSON in this exact format, with no markdown formatting or code blocks:
{
  "caption": "the full post text here",
  "platform": "instagram",
  "username": "accountname",
  "suggestedTitle": "Brief description of post",
  "suggestedLink": "https://instagram.com/accountname"
}

If you cannot determine a field with confidence, use these defaults:
- caption: ""
- platform: "instagram"
- username: ""
- suggestedTitle: "Social Media Post"
- suggestedLink: ""`;
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: imageBase64
            }
          }
        ]
      }
    ]
  });
  const responseText = result.response?.text() || result.text || "";
  let cleanedResponse = responseText.trim();
  cleanedResponse = cleanedResponse.replace(/```json\n?/g, "");
  cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
  cleanedResponse = cleanedResponse.trim();
  try {
    const parsed = JSON.parse(cleanedResponse);
    let platform = "instagram";
    if (parsed.platform === "facebook") {
      platform = "facebook";
    } else if (parsed.platform === "linkedin") {
      platform = "linkedin";
    }
    return {
      caption: parsed.caption || "",
      platform,
      username: parsed.username || "",
      suggestedTitle: parsed.suggestedTitle || "Social Media Post",
      suggestedLink: parsed.suggestedLink || ""
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", cleanedResponse);
    throw new Error("Failed to analyze screenshot - invalid response format");
  }
}
async function analyzeImageForNaming(imageBase64, mimeType = "image/jpeg", originalFilename) {
  const prompt = `You are analyzing an image to generate a descriptive, SEO-friendly filename for a nonprofit educational program's media library.

${originalFilename ? `Original filename: "${originalFilename}"` : ""}

Analyze the image and provide:

1. **Category**: Classify this image into ONE of these categories:
   - program: Program activities (children learning, reading circles, classroom activities)
   - event: Special events (fundraisers, family fun days, community gatherings)
   - facility: Building/space photos (classrooms, library, playground, empty rooms)
   - testimonial: People-focused photos (parents, staff, volunteers, close-ups for quotes)
   - marketing: Promotional materials (banners, flyers, graphics, hero images)
   - general: Everything else that doesn't fit above

2. **Description**: Create a brief, descriptive phrase (2-5 words, lowercase, underscore-separated) that captures the main visual elements. Focus on:
   - Key subjects (children, families, staff)
   - Primary activity (reading, playing, learning, speaking)
   - Setting/location if relevant (outdoor, library, classroom)
   - Visual composition (closeup, wide_angle, group)
   
   Examples:
   - "children_reading_circle"
   - "outdoor_playground_activities"
   - "parent_testimonial_closeup"
   - "library_wide_angle_empty"
   - "staff_volunteer_group_photo"

3. **Suggested Filename**: Combine category and description in format: {category}_{description}
   - Use only lowercase letters, numbers, and underscores
   - Keep it concise but descriptive (max 50 characters)
   - Do NOT include file extension
   - Do NOT include dates/timestamps (we'll add those)

Visual analysis tips:
- Look for people, their age groups, and what they're doing
- Identify the setting (indoor/outdoor, specific rooms)
- Note the composition (wide shot, close-up, group photo)
- Determine the purpose (documentation, marketing, testimonial)

Return ONLY valid JSON in this exact format, with no markdown formatting or code blocks:
{
  "category": "program",
  "description": "children_reading_circle",
  "suggestedFilename": "program_children_reading_circle"
}

If you cannot determine with confidence, use these defaults:
- category: "general"
- description: "image"
- suggestedFilename: "general_image"`;
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: imageBase64
            }
          }
        ]
      }
    ]
  });
  const responseText = result.response?.text() || result.text || "";
  let cleanedResponse = responseText.trim();
  cleanedResponse = cleanedResponse.replace(/```json\n?/g, "");
  cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
  cleanedResponse = cleanedResponse.trim();
  try {
    const parsed = JSON.parse(cleanedResponse);
    const validCategories = ["program", "event", "facility", "testimonial", "marketing", "general"];
    let category = "general";
    if (validCategories.includes(parsed.category)) {
      category = parsed.category;
    }
    const sanitize = (str) => str.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").substring(0, 50);
    const description = sanitize(parsed.description || "image");
    const suggestedFilename = sanitize(parsed.suggestedFilename || `${category}_${description}`);
    return {
      category,
      description,
      suggestedFilename
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", cleanedResponse);
    throw new Error("Failed to analyze image for naming - invalid response format");
  }
}
async function analyzeYouTubeVideoThumbnail(thumbnailUrl, videoTitle, videoDescription) {
  const response = await fetch(thumbnailUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = buffer.toString("base64");
  const prompt = `You are analyzing a thumbnail from a YouTube video${videoTitle ? ` titled "${videoTitle}"` : ""}${videoDescription ? ` with description: "${videoDescription}"` : ""}. 

Based on the thumbnail image${videoTitle ? ", title," : ""}${videoDescription ? " and description," : ""} extract or suggest the following:

1. **Suggested Title**: ${videoTitle ? `Refine or improve the existing title "${videoTitle}" to be more engaging and descriptive (max 80 characters)` : "Create a compelling, descriptive title (max 80 characters) that captures what this video is about"}
2. **Suggested Description**: Create a detailed description (2-3 sentences) that would work well for a nonprofit educational program website, highlighting the value and content
3. **Category**: Classify this video into ONE of these categories: virtual_tour, program_overview, testimonial, educational_content, event_coverage, community_impact
4. **Tags**: Suggest 3-5 relevant tags/keywords that describe this video's content (e.g., "early learning", "family programs", "community", "education")

Visual analysis cues:
- Look for people (staff, families, children) to identify testimonials or program activities
- Identify facilities, classrooms, or spaces to categorize as virtual_tour
- Look for text overlays, graphics, or presentation elements to identify educational_content
- Identify group activities or gatherings to categorize as event_coverage or community_impact

Return ONLY valid JSON in this exact format, with no markdown formatting or code blocks:
{
  "suggestedTitle": "Engaging video title here",
  "suggestedDescription": "Detailed 2-3 sentence description highlighting educational value and impact for families",
  "category": "virtual_tour",
  "tags": ["tag1", "tag2", "tag3"]
}

If you cannot determine a field with confidence, use these defaults:
- suggestedTitle: "${videoTitle || "Educational Video"}"
- suggestedDescription: "Discover more about our programs and community impact"
- category: "program_overview"
- tags: ["education", "community", "families"]`;
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }
    ]
  });
  const responseText = result.response?.text() || result.text || "";
  let cleanedResponse = responseText.trim();
  cleanedResponse = cleanedResponse.replace(/```json\n?/g, "");
  cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
  cleanedResponse = cleanedResponse.trim();
  try {
    const parsed = JSON.parse(cleanedResponse);
    const validCategories = ["virtual_tour", "program_overview", "testimonial", "educational_content", "event_coverage", "community_impact"];
    let category = "program_overview";
    if (validCategories.includes(parsed.category)) {
      category = parsed.category;
    }
    return {
      suggestedTitle: parsed.suggestedTitle || videoTitle || "Educational Video",
      suggestedDescription: parsed.suggestedDescription || "Discover more about our programs and community impact",
      category,
      tags: Array.isArray(parsed.tags) ? parsed.tags : ["education", "community", "families"]
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", cleanedResponse);
    throw new Error("Failed to analyze video thumbnail - invalid response format");
  }
}
var genAI;
var init_gemini = __esm({
  "server/gemini.ts"() {
    "use strict";
    genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY
    });
  }
});

// server/utils/unsubscribeToken.ts
var unsubscribeToken_exports = {};
__export(unsubscribeToken_exports, {
  generateUnsubscribeToken: () => generateUnsubscribeToken,
  generateUnsubscribeUrl: () => generateUnsubscribeUrl,
  verifyUnsubscribeToken: () => verifyUnsubscribeToken
});
import crypto from "crypto";
function getSecretKey() {
  const SECRET_KEY = process.env.UNSUBSCRIBE_SECRET;
  if (!SECRET_KEY) {
    throw new Error(
      "UNSUBSCRIBE_SECRET environment variable is required for secure token generation. Generate one with: openssl rand -base64 32"
    );
  }
  return SECRET_KEY;
}
function generateUnsubscribeToken(email) {
  const SECRET_KEY = getSecretKey();
  const normalizedEmail = email.toLowerCase().trim();
  const timestamp2 = Date.now().toString();
  const message = `${normalizedEmail}:${timestamp2}`;
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("hex");
  const tokenData = `${message}:${signature}`;
  return Buffer.from(tokenData).toString("base64url");
}
function verifyUnsubscribeToken(token) {
  try {
    const SECRET_KEY = getSecretKey();
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) {
      return null;
    }
    const [email, timestamp2, receivedSignature] = parts;
    const tokenAge = Date.now() - parseInt(timestamp2, 10);
    const maxAge = 60 * 24 * 60 * 60 * 1e3;
    if (tokenAge > maxAge) {
      console.warn("[Unsubscribe] Token expired:", { email, age: Math.floor(tokenAge / (24 * 60 * 60 * 1e3)) + " days" });
      return null;
    }
    const message = `${email}:${timestamp2}`;
    const expectedSignature = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("hex");
    const receivedBuffer = Buffer.from(receivedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (receivedBuffer.length !== expectedBuffer.length) {
      return null;
    }
    if (!crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
      console.warn("[Unsubscribe] Invalid signature for email:", email);
      return null;
    }
    return email.toLowerCase().trim();
  } catch (error) {
    console.error("[Unsubscribe] Token verification failed:", error);
    return null;
  }
}
function generateUnsubscribeUrl(email, baseUrl) {
  const token = generateUnsubscribeToken(email);
  const base = baseUrl || process.env.BASE_URL || process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000";
  return `${base.startsWith("http") ? base : "https://" + base}/unsubscribe?token=${token}`;
}
var init_unsubscribeToken = __esm({
  "server/utils/unsubscribeToken.ts"() {
    "use strict";
  }
});

// server/email.ts
var email_exports = {};
__export(email_exports, {
  prepareTrackedEmailContent: () => prepareTrackedEmailContent,
  renderTemplate: () => renderTemplate,
  sendEmail: () => sendEmail,
  sendTemplatedEmail: () => sendTemplatedEmail
});
import sgMail from "@sendgrid/mail";
import { nanoid } from "nanoid";
import * as cheerio from "cheerio";
function renderTemplate(template, variables) {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    rendered = rendered.replace(regex, String(value ?? ""));
  }
  return rendered;
}
function prepareTrackedEmailContent(baseUrl, html, trackingToken) {
  try {
    const hasBody = /<body[^>]*>/i.test(html);
    const wrappedHtml = hasBody ? html : `<body>${html}</body>`;
    const $ = cheerio.load(wrappedHtml, { decodeEntities: true });
    const trackingPixel = `<img src="${baseUrl}/track/open/${trackingToken}" width="1" height="1" style="display:none" alt="" />`;
    $("body").append(trackingPixel);
    const linksToTrack = [];
    $("a[href]").each((_, element) => {
      const $link = $(element);
      let originalHref = $link.attr("href");
      if (!originalHref) return;
      originalHref = originalHref.trim();
      if (originalHref.startsWith("mailto:") || originalHref.startsWith("tel:") || originalHref.startsWith("#")) {
        return;
      }
      if (originalHref.includes("/track/click/")) {
        return;
      }
      try {
        new URL(originalHref);
      } catch {
        console.warn("[Email Tracking] Skipping invalid URL:", originalHref);
        return;
      }
      const linkToken = nanoid();
      linksToTrack.push({
        linkToken,
        targetUrl: originalHref
      });
      const trackingUrl = `${baseUrl}/track/click/${linkToken}`;
      $link.attr("href", trackingUrl);
    });
    let finalHtml;
    if (!hasBody) {
      finalHtml = $("body").html() || html;
    } else {
      finalHtml = $.html();
    }
    return {
      html: finalHtml,
      links: linksToTrack
    };
  } catch (error) {
    console.error("[Email Tracking] Failed to prepare tracked content:", error);
    return {
      html,
      links: []
    };
  }
}
async function sendEmail(storage2, options) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY not configured");
    }
    const isUnsubscribed = await storage2.isEmailUnsubscribed(options.to);
    if (isUnsubscribed) {
      console.log(`[Email] Skipping email to ${options.to} - unsubscribed`);
      await storage2.createEmailLog({
        templateId: options.templateId,
        recipientEmail: options.to,
        recipientName: options.toName,
        subject: options.subject,
        status: "failed",
        emailProvider: "sendgrid",
        errorMessage: "Recipient has unsubscribed",
        leadId: options.leadId,
        metadata: { ...options.metadata, skippedReason: "unsubscribed" }
      });
      return { success: false, error: "Recipient has unsubscribed", skipped: true };
    }
    const trackingToken = nanoid();
    const baseUrl = process.env.BASE_URL || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : null) || "http://localhost:5000";
    const unsubscribeUrl = generateUnsubscribeUrl(options.to, baseUrl);
    let htmlWithUnsubscribe = addUnsubscribeToHtml(options.html, unsubscribeUrl);
    let textWithUnsubscribe = options.text ? addUnsubscribeToText(options.text, unsubscribeUrl) : addUnsubscribeToText(stripHtml(options.html), unsubscribeUrl);
    let finalHtml = htmlWithUnsubscribe;
    let trackedLinks = [];
    if (!options.disableTracking) {
      const result = prepareTrackedEmailContent(baseUrl, htmlWithUnsubscribe, trackingToken);
      finalHtml = result.html;
      trackedLinks = result.links;
    }
    const msg = {
      to: {
        email: options.to,
        name: options.toName
      },
      from: {
        email: DEFAULT_FROM_EMAIL,
        name: DEFAULT_FROM_NAME
      },
      subject: options.subject,
      html: finalHtml,
      text: textWithUnsubscribe
    };
    const [response] = await sgMail.send(msg);
    const messageId = response.headers["x-message-id"];
    const emailLog = await storage2.createEmailLog({
      templateId: options.templateId,
      recipientEmail: options.to,
      recipientName: options.toName,
      subject: options.subject,
      status: "sent",
      emailProvider: "sendgrid",
      providerMessageId: messageId,
      trackingToken,
      leadId: options.leadId,
      metadata: options.metadata,
      sentAt: /* @__PURE__ */ new Date()
    });
    if (trackedLinks.length > 0) {
      for (const link of trackedLinks) {
        await storage2.createEmailLink({
          emailLogId: emailLog.id,
          linkToken: link.linkToken,
          targetUrl: link.targetUrl
        });
      }
      console.log(`[Email Tracking] Stored ${trackedLinks.length} tracked links for email ${emailLog.id}`);
    }
    console.log("Email sent successfully:", messageId, "tracking:", trackingToken);
    return { success: true, messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    await storage2.createEmailLog({
      templateId: options.templateId,
      recipientEmail: options.to,
      recipientName: options.toName,
      subject: options.subject,
      status: "failed",
      emailProvider: "sendgrid",
      trackingToken: nanoid(),
      // Generate token even for failed emails
      leadId: options.leadId,
      errorMessage: error.message || "Unknown error",
      metadata: options.metadata
    });
    return { success: false, error: error.message };
  }
}
async function sendTemplatedEmail(storage2, templateName, recipientEmail, recipientName, variables, additionalMetadata, options) {
  try {
    const template = await storage2.getEmailTemplateByName(templateName);
    if (!template) {
      const error = `Email template not found: ${templateName}`;
      await storage2.createEmailLog({
        recipientEmail,
        recipientName,
        subject: `Template Error: ${templateName}`,
        status: "failed",
        emailProvider: "sendgrid",
        errorMessage: error,
        metadata: { templateName, variables, ...additionalMetadata }
      });
      throw new Error(error);
    }
    if (!template.isActive) {
      const error = `Email template is inactive: ${templateName}`;
      await storage2.createEmailLog({
        templateId: template.id,
        recipientEmail,
        recipientName,
        subject: template.subject,
        status: "failed",
        emailProvider: "sendgrid",
        errorMessage: error,
        metadata: { templateName, variables, ...additionalMetadata }
      });
      throw new Error(error);
    }
    const htmlBody = renderTemplate(template.htmlBody, variables);
    const textBody = template.textBody ? renderTemplate(template.textBody, variables) : void 0;
    const subject = renderTemplate(template.subject, variables);
    return await sendEmail(storage2, {
      to: recipientEmail,
      toName: recipientName,
      subject,
      html: htmlBody,
      text: textBody,
      templateId: template.id,
      metadata: { templateName, variables, ...additionalMetadata },
      disableTracking: options?.disableTracking,
      leadId: options?.leadId
    });
  } catch (error) {
    console.error("Failed to send templated email:", error);
    return { success: false, error: error.message };
  }
}
function stripHtml(html) {
  return html.replace(/<style[^>]*>.*?<\/style>/gi, "").replace(/<script[^>]*>.*?<\/script>/gi, "").replace(/<[^>]+>/g, "").replace(/\s\s+/g, " ").trim();
}
function addUnsubscribeToHtml(html, unsubscribeUrl) {
  const unsubscribeFooter = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; text-align: center;">
      <p style="margin: 0 0 8px 0;">
        You are receiving this email because you are part of Julie's Family Learning Program community.
      </p>
      <p style="margin: 0;">
        <a href="${unsubscribeUrl}" style="color: #6B7280; text-decoration: underline;">Unsubscribe from all emails</a>
      </p>
    </div>
  `;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${unsubscribeFooter}</body>`);
  } else {
    return html + unsubscribeFooter;
  }
}
function addUnsubscribeToText(text2, unsubscribeUrl) {
  return `${text2}

---

You are receiving this email because you are part of Julie's Family Learning Program community.

To unsubscribe from all emails, visit:
${unsubscribeUrl}`;
}
var DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME;
var init_email = __esm({
  "server/email.ts"() {
    "use strict";
    init_unsubscribeToken();
    if (!process.env.SENDGRID_API_KEY) {
      console.warn("SENDGRID_API_KEY not configured - email sending will fail");
    } else {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
    DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@juliesfamilylearning.org";
    DEFAULT_FROM_NAME = "Julie's Family Learning Program";
  }
});

// shared/valueEquation.ts
var VALUE_EQUATION_TEMPLATES, DEFAULT_VALUE_EQUATION_TEMPLATE, CONTENT_TYPE_GUIDANCE;
var init_valueEquation = __esm({
  "shared/valueEquation.ts"() {
    "use strict";
    VALUE_EQUATION_TEMPLATES = {
      student: {
        label: "Adult Education Student",
        description: "Someone seeking to improve their education and skills for better opportunities",
        dreamOutcome: {
          label: "What transformation will they experience?",
          placeholder: "e.g., Speak English confidently at work and home",
          examples: [
            "Speak English confidently in professional settings",
            "Earn a GED and unlock better career opportunities",
            "Master computer skills for modern workplaces",
            "Build literacy skills to help children with homework"
          ]
        },
        perceivedLikelihood: {
          label: "Why should they trust this works for them?",
          placeholder: "e.g., 500+ graduates, 95% completion rate, certified teachers",
          examples: [
            "500+ successful graduates in the past 5 years",
            "Certified ESL instructors with 10+ years experience",
            "95% of students complete the program",
            "Small class sizes ensure personalized attention",
            "Free tutoring and flexible schedules for working adults"
          ]
        },
        timeDelay: {
          label: "How quickly will they see results?",
          placeholder: "e.g., Conversational in 12 weeks, confident in 3 weeks",
          examples: [
            "Conversational English in just 12 weeks",
            "See confidence grow within the first 3 weeks",
            "Earn your GED in 6 months or less",
            "Immediate progress with our proven method"
          ]
        },
        effortSacrifice: {
          label: "How easy is this for them?",
          placeholder: "e.g., Just 2 hours/week, free childcare, flexible evening times",
          examples: [
            "Only 2 hours per week commitment",
            "Free childcare provided during classes",
            "Flexible evening and weekend schedules",
            "Classes held at convenient neighborhood locations",
            "No homework or outside study required"
          ]
        }
      },
      provider: {
        label: "Service Provider",
        description: "Organizations or professionals who refer clients or collaborate with Julie's programs",
        dreamOutcome: {
          label: "What transformation will they experience?",
          placeholder: "e.g., Better serve your clients with trusted education partner",
          examples: [
            "Provide comprehensive support to your clients",
            "Partner with a trusted community organization",
            "Strengthen your service network",
            "Enhance client outcomes through education"
          ]
        },
        perceivedLikelihood: {
          label: "Why should they trust this partnership works?",
          placeholder: "e.g., 20+ years serving the community, established referral network",
          examples: [
            "20+ years of proven community impact",
            "Partnership with 50+ local organizations",
            "Dedicated liaison for your agency",
            "Shared client success tracking",
            "Streamlined referral process"
          ]
        },
        timeDelay: {
          label: "How quickly can they start collaborating?",
          placeholder: "e.g., Same-day enrollment for your referrals",
          examples: [
            "Same-day enrollment for client referrals",
            "Immediate partnership onboarding",
            "Quick response to your inquiries",
            "Fast-track intake for urgent cases"
          ]
        },
        effortSacrifice: {
          label: "How simple is the partnership process?",
          placeholder: "e.g., Simple online referral form, dedicated support contact",
          examples: [
            "One simple online referral form",
            "Dedicated partnership liaison",
            "We handle all client follow-up",
            "Regular progress updates on your referrals",
            "No paperwork or administrative burden"
          ]
        }
      },
      parent: {
        label: "Parent",
        description: "Parents seeking educational support and enrichment for their children",
        dreamOutcome: {
          label: "What transformation will their child experience?",
          placeholder: "e.g., Watch your child excel in reading and math",
          examples: [
            "See your child reading at grade level",
            "Watch confidence grow in school",
            "Prepare your child for academic success",
            "Give your child a strong educational foundation",
            "Help your child develop a love for learning"
          ]
        },
        perceivedLikelihood: {
          label: "Why should they trust you with their child?",
          placeholder: "e.g., Certified teachers, safe environment, proven curriculum",
          examples: [
            "Certified teachers who care about your child",
            "Safe, nurturing learning environment",
            "Proven curriculum with measurable results",
            "1000+ children served successfully",
            "Small group sizes for individual attention",
            "Background-checked, experienced staff"
          ]
        },
        timeDelay: {
          label: "How quickly will they see their child improve?",
          placeholder: "e.g., Visible progress within 4 weeks",
          examples: [
            "See reading improvement in just 4 weeks",
            "Noticeable confidence boost within days",
            "Rapid skill development with our proven approach",
            "Progress reports every 2 weeks"
          ]
        },
        effortSacrifice: {
          label: "How easy is it for busy parents?",
          placeholder: "e.g., Free after-school program, transportation provided",
          examples: [
            "Completely free after-school program",
            "Free transportation to and from school",
            "Healthy snacks provided daily",
            "Drop-off and pick-up at your child's school",
            "No homework for parents to manage",
            "Fits into your family's busy schedule"
          ]
        }
      },
      donor: {
        label: "Donor",
        description: "Individuals or organizations considering supporting Julie's programs financially",
        dreamOutcome: {
          label: "What impact will their donation create?",
          placeholder: "e.g., Transform lives in your community through education",
          examples: [
            "Transform families through the power of education",
            "Break the cycle of poverty in your community",
            "Create lasting change for local children",
            "Invest in your community's future",
            "Make education accessible for all"
          ]
        },
        perceivedLikelihood: {
          label: "Why should they trust their donation makes a difference?",
          placeholder: "e.g., 90% of funds go directly to programs, transparent reporting",
          examples: [
            "90% of every dollar goes directly to programs",
            "Transparent financial reporting and impact metrics",
            "20+ years of proven community impact",
            "Regular donor updates with real success stories",
            "Independently audited financials",
            "See exactly where your money goes"
          ]
        },
        timeDelay: {
          label: "How quickly does their donation create impact?",
          placeholder: "e.g., Your gift puts students in class this week",
          examples: [
            "Your donation helps students starting this week",
            "Immediate impact on families waiting for services",
            "See results in our quarterly impact reports",
            "Monthly updates on how your gift is making a difference"
          ]
        },
        effortSacrifice: {
          label: "How simple is the giving process?",
          placeholder: "e.g., Secure one-click donation, tax-deductible receipt instantly",
          examples: [
            "Secure one-click donation process",
            "Instant tax-deductible receipt",
            "Set up recurring giving in 2 minutes",
            "Multiple payment options available",
            "No follow-up calls or pressure",
            "Unsubscribe from updates anytime"
          ]
        }
      },
      volunteer: {
        label: "Volunteer",
        description: "Community members interested in donating their time and skills",
        dreamOutcome: {
          label: "What fulfillment will they experience?",
          placeholder: "e.g., Make a real difference tutoring adult learners",
          examples: [
            "Make a tangible difference in someone's life",
            "Use your skills to empower others",
            "Be part of a transformative community",
            "See the direct impact of your time",
            "Build meaningful connections while giving back"
          ]
        },
        perceivedLikelihood: {
          label: "Why should they believe volunteering here is rewarding?",
          placeholder: "e.g., Comprehensive training, supportive community, flexible roles",
          examples: [
            "Comprehensive training and ongoing support",
            "Join a welcoming community of 200+ volunteers",
            "Flexible opportunities that fit your schedule",
            "See the impact through student success stories",
            "Recognition and appreciation for your service",
            "Build valuable skills while helping others"
          ]
        },
        timeDelay: {
          label: "How quickly can they start making an impact?",
          placeholder: "e.g., Start volunteering this week after quick orientation",
          examples: [
            "Start volunteering after one simple orientation",
            "Make an impact in your first session",
            "Quick onboarding process gets you started fast",
            "See student progress within weeks"
          ]
        },
        effortSacrifice: {
          label: "How manageable is the commitment?",
          placeholder: "e.g., Just 2 hours/month, choose your own schedule",
          examples: [
            "Commit just 2 hours per month",
            "Choose times that work for your schedule",
            "No long-term commitment required",
            "Virtual and in-person options available",
            "We provide all materials and training",
            "Cancel or reschedule anytime"
          ]
        }
      }
    };
    DEFAULT_VALUE_EQUATION_TEMPLATE = {
      label: "General Audience",
      description: "Broad appeal for all community members",
      dreamOutcome: {
        label: "What transformation will they experience?",
        placeholder: "e.g., Transform your life through education",
        examples: [
          "Unlock new opportunities through learning",
          "Build a brighter future for your family",
          "Achieve your educational goals",
          "Gain skills that open doors"
        ]
      },
      perceivedLikelihood: {
        label: "Why should they trust you?",
        placeholder: "e.g., 20+ years serving families, proven results",
        examples: [
          "20+ years of proven community impact",
          "Trusted by thousands of local families",
          "Free, high-quality programs",
          "Experienced, caring staff"
        ]
      },
      timeDelay: {
        label: "How quickly will they see results?",
        placeholder: "e.g., See progress within weeks",
        examples: [
          "Start seeing results quickly",
          "Immediate access to services",
          "Progress you can measure",
          "Fast-track your goals"
        ]
      },
      effortSacrifice: {
        label: "How easy is it for them?",
        placeholder: "e.g., Flexible schedules, free programs, welcoming environment",
        examples: [
          "Completely free programs",
          "Flexible scheduling options",
          "Convenient locations",
          "Welcoming, supportive environment",
          "No complex registration process"
        ]
      }
    };
    CONTENT_TYPE_GUIDANCE = {
      hero: {
        tone: "Inspiring and action-oriented",
        length: "15-25 words for headline, 30-50 words for subheadline",
        focus: "Lead with dream outcome, include clear call-to-action"
      },
      cta: {
        tone: "Action-driven and low-friction",
        length: "2-5 words",
        focus: "Emphasize ease and immediate benefit"
      },
      service: {
        tone: "Informative yet warm",
        length: "50-100 words",
        focus: "Balance all four value equation elements"
      },
      event: {
        tone: "Inviting and community-focused",
        length: "30-60 words",
        focus: "Highlight community benefit and easy participation"
      },
      testimonial: {
        tone: "Authentic and heartfelt",
        length: "Match original length",
        focus: "Personal transformation story"
      },
      lead_magnet: {
        tone: "Value-forward and enticing",
        length: "20-40 words",
        focus: "Quick win and minimal commitment"
      },
      email_subject: {
        tone: "Compelling and curiosity-driven",
        length: "6-10 words, max 50 characters",
        focus: "Hook with dream outcome or urgency, avoid spam triggers"
      },
      email_body: {
        tone: "Personal and conversational",
        length: "150-300 words",
        focus: "Lead with value, build trust, clear single call-to-action"
      }
    };
  }
});

// shared/defaults/personas.ts
var PERSONA_LABELS, FUNNEL_STAGE_LABELS;
var init_personas = __esm({
  "shared/defaults/personas.ts"() {
    "use strict";
    PERSONA_LABELS = {
      default: "Default (No Persona)",
      student: "Adult Education Student",
      provider: "Service Provider",
      parent: "Parent",
      donor: "Donor",
      volunteer: "Volunteer"
    };
    FUNNEL_STAGE_LABELS = {
      awareness: "Awareness",
      consideration: "Consideration",
      decision: "Decision",
      retention: "Retention"
    };
  }
});

// server/copywriter.ts
var copywriter_exports = {};
__export(copywriter_exports, {
  generateAbTestVariants: () => generateAbTestVariants,
  generateFieldText: () => generateFieldText,
  generateValueEquationCopy: () => generateValueEquationCopy,
  generateVariantNameAndDescription: () => generateVariantNameAndDescription
});
import { GoogleGenAI as GoogleGenAI2 } from "@google/genai";
async function generateValueEquationCopy(request) {
  const {
    originalContent,
    contentType,
    persona,
    funnelStage,
    valueEquation,
    customPrompt
  } = request;
  const template = persona ? VALUE_EQUATION_TEMPLATES[persona] : DEFAULT_VALUE_EQUATION_TEMPLATE;
  const guidance = CONTENT_TYPE_GUIDANCE[contentType];
  const prompt = customPrompt || buildValueEquationPrompt(
    originalContent,
    contentType,
    valueEquation,
    template,
    guidance,
    persona,
    funnelStage
  );
  try {
    const result = await genAI2.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });
    const responseText = result.response?.text() || result.text || "";
    const variants = parseVariantResponse(responseText);
    return {
      variants
    };
  } catch (error) {
    console.error("Failed to generate copy with Gemini:", error);
    throw new Error("Failed to generate copy variants. Please try again.");
  }
}
function buildValueEquationPrompt(originalContent, contentType, valueEquation, template, guidance, persona, funnelStage) {
  const wordCount = originalContent ? originalContent.split(/\s+/).length : 0;
  const personaLabel = persona ? PERSONA_LABELS[persona] : "General Audience";
  const stageLabel = funnelStage ? FUNNEL_STAGE_LABELS[funnelStage] : "";
  const stagContext = funnelStage ? ` They are in the ${stageLabel} stage of their journey.` : "";
  return `You are an expert copywriter trained in Alex Hormozi's Value Equation framework from "$100M Offers".

**Framework**: Value = (Dream Outcome \xD7 Perceived Likelihood) / (Time Delay \xD7 Effort & Sacrifice)

**Context**: Julie's Family Learning Program - A warm, community-focused non-profit helping families through education and support services.

**Target Audience**: ${personaLabel}${stagContext}

${originalContent ? `**Original Content for Reference**: "${originalContent}"
` : ""}**Content Type**: ${contentType}
- Tone: ${guidance.tone}
- Length: ${guidance.length} (original is ~${wordCount} words)
- Focus: ${guidance.focus}

**Value Equation Inputs**:

1. **Dream Outcome** (What transformation will they experience?):
   ${valueEquation.dreamOutcome}

2. **Perceived Likelihood** (Why should they trust this works?):
   ${valueEquation.perceivedLikelihood}

3. **Time Delay** (How quickly will they see results?):
   ${valueEquation.timeDelay}

4. **Effort & Sacrifice** (How easy is this for them?):
   ${valueEquation.effortSacrifice}

**Your Task**:
Generate exactly 3 compelling copy variants that maximize the Value Equation. Each variant should emphasize a different element while maintaining a warm, community-focused tone.

**Variant Strategy**:
- **Variant 1 (Speed + Outcome Focus)**: Lead with the dream outcome and emphasize how quickly they'll see results
- **Variant 2 (Trust + Ease Focus)**: Highlight proof/credibility and minimize perceived effort
- **Variant 3 (Balanced)**: Artfully weave all four elements together in a cohesive message

**Critical Guidelines**:
- Use warm, approachable language (not corporate or salesy)
- Be specific and concrete (avoid vague promises)
- Show don't tell (use details that build trust)
- Emphasize community and support
- Match or slightly improve upon the original length
- Include a clear, low-friction call-to-action where appropriate
- Use "you/your" language to make it personal

**Output Format**:
Return ONLY valid JSON in this exact format, with no markdown formatting or code blocks:
{
  "variants": [
    {
      "text": "The actual copy variant here",
      "focus": "dream_outcome",
      "explanation": "Brief explanation of the strategic emphasis"
    },
    {
      "text": "Second variant here",
      "focus": "perceived_likelihood",
      "explanation": "Brief explanation"
    },
    {
      "text": "Third variant here",
      "focus": "balanced",
      "explanation": "Brief explanation"
    }
  ]
}

Valid focus values: "dream_outcome", "perceived_likelihood", "time_delay", "effort_sacrifice", "balanced"`;
}
function parseVariantResponse(responseText) {
  let cleanedResponse = responseText.trim();
  cleanedResponse = cleanedResponse.replace(/```json\s*/gi, "");
  cleanedResponse = cleanedResponse.replace(/```\s*/g, "");
  cleanedResponse = cleanedResponse.trim();
  try {
    const parsed = JSON.parse(cleanedResponse);
    if (!parsed.variants || !Array.isArray(parsed.variants)) {
      throw new Error("Invalid response structure");
    }
    const variants = parsed.variants.map((v) => {
      if (!v.text || !v.focus || !v.explanation) {
        throw new Error("Missing required variant fields");
      }
      return {
        text: v.text,
        focus: v.focus,
        explanation: v.explanation
      };
    });
    if (variants.length !== 3) {
      console.warn(`Expected 3 variants, got ${variants.length}`);
    }
    return variants;
  } catch (error) {
    console.error("Failed to parse Gemini response:", cleanedResponse);
    throw new Error("Failed to parse AI response - invalid format");
  }
}
async function generateVariantNameAndDescription(testType, configuration, persona, funnelStage) {
  const personaLabel = persona ? PERSONA_LABELS[persona] : "General Audience";
  const stageLabel = funnelStage ? FUNNEL_STAGE_LABELS[funnelStage] : "";
  const stageContext = funnelStage ? ` targeting ${personaLabel} in the ${stageLabel} stage` : ` targeting ${personaLabel}`;
  const configSummary = Object.entries(configuration).filter(([_, value]) => value !== void 0 && value !== null && value !== "").map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(", ");
  const prompt = `You are an expert A/B testing analyst helping name test variants.

**Test Type**: ${testType}
**Target**: ${personaLabel}${stageContext}
**Variant Configuration**: ${configSummary || "Custom configuration"}

**Your Task**:
Generate a clear, descriptive name and description for this test variant.

**Guidelines**:
- Name: 3-6 words, descriptive of what's being tested (e.g., "Trust-First Hero with Video")
- Description: 1-2 sentences explaining what makes this variant unique and what hypothesis it tests
- Be specific about the key differences (e.g., button style, messaging focus, visual approach)
- Use professional but friendly language

**Output Format**:
Return ONLY valid JSON:
{
  "name": "Descriptive variant name",
  "description": "Clear explanation of what this variant tests and why it's different"
}`;
  try {
    const result = await genAI2.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });
    const responseText = result.response?.text() || result.text || "";
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.slice(7);
    }
    if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();
    const parsed = JSON.parse(cleanedResponse);
    if (!parsed.name || !parsed.description) {
      throw new Error("Invalid response structure");
    }
    return {
      name: parsed.name,
      description: parsed.description
    };
  } catch (error) {
    console.error("Failed to generate variant name/description:", error);
    throw new Error("Failed to generate variant naming suggestions. Please try again.");
  }
}
async function generateAbTestVariants(controlContent, contentType, persona, funnelStage) {
  const personaLabel = persona ? PERSONA_LABELS[persona] : "General Audience";
  const stageLabel = funnelStage ? FUNNEL_STAGE_LABELS[funnelStage] : "";
  const stageContext = funnelStage ? ` in the ${stageLabel} stage` : "";
  const guidance = CONTENT_TYPE_GUIDANCE[contentType];
  const prompt = `You are an expert A/B testing copywriter using the Value Equation framework.

**Framework**: Value = (Dream Outcome \xD7 Perceived Likelihood) / (Time Delay \xD7 Effort & Sacrifice)

**Context**: Julie's Family Learning Program - A warm, community-focused non-profit.

**Target Audience**: ${personaLabel}${stageContext}

**Control Variant (Current Copy)**: "${controlContent}"

**Content Type**: ${contentType}
- Tone: ${guidance.tone}
- Length: ${guidance.length}

**Your Task**:
Generate 3 alternative variants for A/B testing. Each should test a different value equation hypothesis:

1. **Speed Hypothesis**: What if we emphasize how quickly they see results?
2. **Trust Hypothesis**: What if we lead with proof and credibility?
3. **Ease Hypothesis**: What if we make the effort seem even simpler?

**Guidelines**:
- Keep the same general message and offer
- Maintain warm, community-focused tone
- Make meaningful (not trivial) changes worth testing
- Each variant should be noticeably different but not radically so
- Match the control's length approximately

**Output Format**:
Return ONLY valid JSON with exactly 3 variants:
{
  "variants": [
    {
      "text": "First test variant (speed focus)",
      "focus": "time_delay",
      "explanation": "Tests faster results messaging"
    },
    {
      "text": "Second test variant (trust focus)",
      "focus": "perceived_likelihood",
      "explanation": "Tests proof-first approach"
    },
    {
      "text": "Third test variant (ease focus)",
      "focus": "effort_sacrifice",
      "explanation": "Tests simplicity messaging"
    }
  ]
}`;
  try {
    const result = await genAI2.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });
    const responseText = result.response?.text() || result.text || "";
    const variants = parseVariantResponse(responseText);
    return { variants };
  } catch (error) {
    console.error("Failed to generate A/B test variants:", error);
    throw new Error("Failed to generate test variants. Please try again.");
  }
}
async function generateFieldText(fieldType, contentTypeName, currentValue, title, persona) {
  const personaLabel = persona ? PERSONA_LABELS[persona] : "General Audience";
  const fieldGuidance = {
    description: {
      purpose: "Engaging description that explains what this content offers",
      length: "2-4 sentences (40-80 words)",
      tone: "Warm, welcoming, and community-focused"
    },
    overview: {
      purpose: "Comprehensive program overview explaining benefits and what participants will experience",
      length: "3-5 sentences (60-100 words)",
      tone: "Professional yet warm, emphasizing transformation and community"
    },
    subtitle: {
      purpose: "Brief tagline or supporting text that reinforces the main message",
      length: "1 short sentence or phrase (5-10 words)",
      tone: "Inspiring and concise"
    },
    faqAnswer: {
      purpose: "Clear, helpful answer that addresses the specific question with actionable information",
      length: "2-3 sentences (30-60 words)",
      tone: "Friendly, informative, and reassuring"
    }
  };
  const guidance = fieldGuidance[fieldType] || fieldGuidance.description;
  const titleContext = title ? `
**Content Title**: "${title}"` : "";
  const currentContext = currentValue ? `
**Current Text** (for reference/improvement): "${currentValue}"` : "";
  const prompt = `You are a copywriter for Julie's Family Learning Program - a warm, community-focused non-profit helping families through education.

**Content Type**: ${contentTypeName}
**Field**: ${fieldType}${titleContext}${currentContext}
**Target Audience**: ${personaLabel}

**Your Task**:
Generate compelling ${fieldType} text that:
- ${guidance.purpose}
- Length: ${guidance.length}
- Tone: ${guidance.tone}

**Guidelines**:
- Use warm, approachable language (not corporate or salesy)
- Be specific and concrete (avoid vague promises)
- Emphasize community, support, and transformation
- Use "you/your" language to make it personal
- Sound human and authentic

**Output**:
Return ONLY the text itself, with no JSON formatting, no quotes, no markdown, and no explanations. Just the raw text that will go directly into the form field.`;
  try {
    const result = await genAI2.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });
    const responseText = (result.response?.text() || result.text || "").trim();
    let cleaned = responseText;
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    if (cleaned.startsWith("```") || cleaned.includes("```")) {
      cleaned = cleaned.replace(/```[a-z]*\n?/g, "").trim();
    }
    return cleaned;
  } catch (error) {
    console.error("Failed to generate field text:", error);
    throw new Error("Failed to generate text. Please try again.");
  }
}
var genAI2;
var init_copywriter = __esm({
  "server/copywriter.ts"() {
    "use strict";
    init_valueEquation();
    init_personas();
    genAI2 = new GoogleGenAI2({
      apiKey: process.env.GOOGLE_API_KEY
    });
  }
});

// server/calendarService.ts
import { google } from "googleapis";
function getGoogleAuthClient() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const path = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (json && json.trim().startsWith("{")) {
    try {
      const credentials = JSON.parse(json);
      return new google.auth.GoogleAuth({ credentials });
    } catch {
      return null;
    }
  }
  if (path || json && !json.trim().startsWith("{")) {
    const keyPath = path || json.trim();
    return new google.auth.GoogleAuth({ keyFile: keyPath });
  }
  return null;
}
async function getAccessToken() {
  const auth = getGoogleAuthClient();
  if (auth) {
    const client2 = await auth.getClient();
    const token = await client2.getAccessToken();
    if (token.token) return token.token;
  }
  if (connectionSettings?.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken || !hostname) {
    throw new Error(
      "Google Calendar not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_KEY_PATH, or use Replit Connectors."
    );
  }
  connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=google-calendar",
    { headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken } }
  ).then((res) => res.json()).then((data) => data.items?.[0]);
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
  if (!connectionSettings || !accessToken) {
    throw new Error("Google Calendar not connected via Replit Connectors");
  }
  return accessToken;
}
async function getUncachableGoogleCalendarClient() {
  const auth = getGoogleAuthClient();
  if (auth) {
    return google.calendar({ version: "v3", auth });
  }
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}
var connectionSettings, CalendarService;
var init_calendarService = __esm({
  "server/calendarService.ts"() {
    "use strict";
    CalendarService = class {
      static CALENDAR_ID = "primary";
      static DEFAULT_TIMEZONE = "America/New_York";
      static async createEvent(event) {
        try {
          const calendar = await getUncachableGoogleCalendarClient();
          const response = await calendar.events.insert({
            calendarId: this.CALENDAR_ID,
            requestBody: {
              summary: event.summary,
              description: event.description,
              location: event.location,
              start: event.start,
              end: event.end,
              attendees: event.attendees,
              sendUpdates: "all"
            }
          });
          return {
            id: response.data.id,
            htmlLink: response.data.htmlLink,
            summary: response.data.summary,
            start: response.data.start?.dateTime || response.data.start?.date || "",
            end: response.data.end?.dateTime || response.data.end?.date || ""
          };
        } catch (error) {
          console.error("Error creating calendar event:", error);
          throw new Error("Failed to create calendar event");
        }
      }
      static async getEvent(eventId) {
        try {
          const calendar = await getUncachableGoogleCalendarClient();
          const response = await calendar.events.get({
            calendarId: this.CALENDAR_ID,
            eventId
          });
          return response.data;
        } catch (error) {
          console.error("Error fetching calendar event:", error);
          throw new Error("Failed to fetch calendar event");
        }
      }
      static async updateEvent(eventId, updates) {
        try {
          const calendar = await getUncachableGoogleCalendarClient();
          const response = await calendar.events.patch({
            calendarId: this.CALENDAR_ID,
            eventId,
            requestBody: updates
          });
          return response.data;
        } catch (error) {
          console.error("Error updating calendar event:", error);
          throw new Error("Failed to update calendar event");
        }
      }
      static async deleteEvent(eventId) {
        try {
          const calendar = await getUncachableGoogleCalendarClient();
          await calendar.events.delete({
            calendarId: this.CALENDAR_ID,
            eventId
          });
          return { success: true };
        } catch (error) {
          console.error("Error deleting calendar event:", error);
          throw new Error("Failed to delete calendar event");
        }
      }
      static async listEvents(timeMin, timeMax, maxResults = 50) {
        try {
          const calendar = await getUncachableGoogleCalendarClient();
          const response = await calendar.events.list({
            calendarId: this.CALENDAR_ID,
            timeMin: timeMin || (/* @__PURE__ */ new Date()).toISOString(),
            timeMax,
            maxResults,
            singleEvents: true,
            orderBy: "startTime"
          });
          return response.data.items || [];
        } catch (error) {
          console.error("Error listing calendar events:", error);
          throw new Error("Failed to list calendar events");
        }
      }
      static async checkAvailability(startDateTime, endDateTime) {
        try {
          const calendar = await getUncachableGoogleCalendarClient();
          const response = await calendar.freebusy.query({
            requestBody: {
              timeMin: startDateTime,
              timeMax: endDateTime,
              items: [{ id: this.CALENDAR_ID }]
            }
          });
          const busySlots = response.data.calendars?.[this.CALENDAR_ID]?.busy || [];
          return {
            available: busySlots.length === 0,
            busySlots
          };
        } catch (error) {
          console.error("Error checking availability:", error);
          throw new Error("Failed to check availability");
        }
      }
      static formatDateTime(date, time, timezone = this.DEFAULT_TIMEZONE) {
        const dateTimeString = `${date}T${time}:00`;
        return new Date(dateTimeString).toISOString();
      }
    };
  }
});

// server/taskAutomation.ts
async function createTaskForNewLead(storage2, lead, assignedTo) {
  try {
    const template = NEW_LEAD_TEMPLATES[lead.persona] || NEW_LEAD_TEMPLATES.student;
    let taskAssignee = assignedTo;
    if (!taskAssignee) {
      const assignments = await storage2.getLeadAssignments({ leadId: lead.id });
      if (assignments.length > 0) {
        taskAssignee = assignments[0].assignedTo;
      }
    }
    if (!taskAssignee) {
      const allUsers = await storage2.getAllUsers();
      const admin = allUsers.find((u) => u.isAdmin);
      if (!admin) {
        console.warn("No admin users found to assign automated task");
        return;
      }
      taskAssignee = admin.id;
    }
    const dueDate = /* @__PURE__ */ new Date();
    dueDate.setDate(dueDate.getDate() + template.daysUntilDue);
    const taskData = {
      leadId: lead.id,
      assignedTo: taskAssignee,
      createdBy: null,
      // Null for automated tasks
      title: template.title,
      description: template.description,
      taskType: template.taskType,
      priority: template.priority,
      status: "pending",
      dueDate,
      completedAt: null,
      isAutomated: true
    };
    await storage2.createTask(taskData);
    console.log(`Automated task created for new lead: ${lead.id} (${lead.persona})`);
  } catch (error) {
    console.error("Error creating automated task for new lead:", error);
  }
}
async function createTaskForStageChange(storage2, lead, newStage, assignedTo) {
  try {
    if (newStage === "converted" || newStage === "lost") {
      return;
    }
    const template = STAGE_CHANGE_TEMPLATES[newStage];
    if (!template) {
      console.log(`No task template for stage: ${newStage}`);
      return;
    }
    let taskAssignee = assignedTo;
    if (!taskAssignee) {
      const assignments = await storage2.getLeadAssignments({ leadId: lead.id });
      if (assignments.length > 0) {
        taskAssignee = assignments[0].assignedTo;
      }
    }
    if (!taskAssignee) {
      const allUsers = await storage2.getAllUsers();
      const admin = allUsers.find((u) => u.isAdmin);
      if (!admin) {
        console.warn("No admin users found to assign automated task");
        return;
      }
      taskAssignee = admin.id;
    }
    const dueDate = /* @__PURE__ */ new Date();
    dueDate.setDate(dueDate.getDate() + template.daysUntilDue);
    const taskData = {
      leadId: lead.id,
      assignedTo: taskAssignee,
      createdBy: null,
      title: template.title,
      description: template.description,
      taskType: template.taskType,
      priority: template.priority,
      status: "pending",
      dueDate,
      completedAt: null,
      isAutomated: true
    };
    await storage2.createTask(taskData);
    console.log(`Automated task created for stage change: ${lead.id} \u2192 ${newStage}`);
  } catch (error) {
    console.error("Error creating automated task for stage change:", error);
  }
}
async function createTasksForMissedFollowUps(storage2) {
  try {
    const now = /* @__PURE__ */ new Date();
    const allTasks = await storage2.getTasks({ status: "pending" });
    const overdueTasks = allTasks.filter((task) => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < now;
    });
    console.log(`Found ${overdueTasks.length} overdue tasks`);
    for (const overdueTask of overdueTasks) {
      const leadTasks = await storage2.getTasks({
        leadId: overdueTask.leadId,
        status: "pending"
      });
      const hasRecentFollowUp = leadTasks.some((task) => {
        if (task.id === overdueTask.id) return false;
        if (task.taskType !== "follow_up") return false;
        const taskAge = now.getTime() - new Date(task.createdAt).getTime();
        return taskAge < 24 * 60 * 60 * 1e3;
      });
      if (hasRecentFollowUp) {
        continue;
      }
      const followUpDueDate = /* @__PURE__ */ new Date();
      followUpDueDate.setDate(followUpDueDate.getDate() + 1);
      const taskData = {
        leadId: overdueTask.leadId,
        assignedTo: overdueTask.assignedTo,
        createdBy: null,
        title: `Follow up on overdue: ${overdueTask.title}`,
        description: `Original task "${overdueTask.title}" was due on ${new Date(overdueTask.dueDate).toLocaleDateString()}. Please follow up urgently.`,
        taskType: "follow_up",
        priority: "urgent",
        status: "pending",
        dueDate: followUpDueDate,
        completedAt: null,
        isAutomated: true
      };
      await storage2.createTask(taskData);
      console.log(`Created follow-up task for overdue task: ${overdueTask.id}`);
    }
  } catch (error) {
    console.error("Error creating tasks for missed follow-ups:", error);
  }
}
async function syncTaskToCalendar(storage2, task) {
  try {
    if (!task.dueDate) {
      console.log(`Task ${task.id} has no due date, skipping calendar sync`);
      return null;
    }
    let leadInfo = "";
    if (task.leadId) {
      const lead = await storage2.getLeadById(task.leadId);
      if (lead) {
        leadInfo = `

Lead: ${lead.firstName} ${lead.lastName}
Email: ${lead.email}
Persona: ${lead.persona}`;
      }
    }
    const assignee = await storage2.getUserById(task.assignedTo);
    if (!assignee || !assignee.email) {
      console.log(`Task ${task.id} assignee has no email, cannot send calendar invite`);
      return null;
    }
    const dueDate = new Date(task.dueDate);
    const startDateTime = new Date(dueDate);
    startDateTime.setHours(9, 0, 0, 0);
    const endDateTime = new Date(dueDate);
    endDateTime.setHours(10, 0, 0, 0);
    const calendarEvent = await CalendarService.createEvent({
      summary: `Task: ${task.title}`,
      description: `${task.description || "No description"}${leadInfo}

Priority: ${task.priority}
Type: ${task.taskType}`,
      location: "",
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "America/New_York"
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "America/New_York"
      },
      attendees: [
        {
          email: assignee.email,
          displayName: `${assignee.firstName} ${assignee.lastName}`
        }
      ]
    });
    console.log(`Task ${task.id} synced to calendar: ${calendarEvent.id}`);
    return calendarEvent.id;
  } catch (error) {
    console.error(`Error syncing task ${task.id} to calendar:`, error);
    return null;
  }
}
var NEW_LEAD_TEMPLATES, STAGE_CHANGE_TEMPLATES;
var init_taskAutomation = __esm({
  "server/taskAutomation.ts"() {
    "use strict";
    init_calendarService();
    NEW_LEAD_TEMPLATES = {
      student: {
        title: "Initial outreach to prospective student",
        description: "Reach out to introduce programs, answer questions, and understand their educational goals.",
        taskType: "call",
        priority: "high",
        daysUntilDue: 1
      },
      parent: {
        title: "Follow up with parent inquiry",
        description: "Contact parent to discuss children's services, answer questions about enrollment, and schedule a visit.",
        taskType: "call",
        priority: "high",
        daysUntilDue: 1
      },
      provider: {
        title: "Connect with service provider",
        description: "Reach out to discuss partnership opportunities and referral process.",
        taskType: "email",
        priority: "medium",
        daysUntilDue: 2
      },
      donor: {
        title: "Thank donor and provide impact info",
        description: "Send thank you message and share how their support makes a difference.",
        taskType: "email",
        priority: "medium",
        daysUntilDue: 1
      },
      volunteer: {
        title: "Follow up on volunteer interest",
        description: "Contact volunteer to discuss opportunities, availability, and next steps for onboarding.",
        taskType: "call",
        priority: "medium",
        daysUntilDue: 2
      }
    };
    STAGE_CHANGE_TEMPLATES = {
      new_lead: {
        title: "Make first contact with new lead",
        description: "Introduce yourself, understand their needs, and schedule follow-up.",
        taskType: "call",
        priority: "high",
        daysUntilDue: 1
      },
      contacted: {
        title: "Send follow-up materials",
        description: "Send program information, enrollment forms, or requested materials.",
        taskType: "email",
        priority: "medium",
        daysUntilDue: 2
      },
      qualified: {
        title: "Schedule enrollment meeting",
        description: "Set up meeting to discuss program details, answer questions, and begin enrollment process.",
        taskType: "meeting",
        priority: "high",
        daysUntilDue: 3
      },
      nurturing: {
        title: "Check in with prospect",
        description: "Reach out to answer any questions and see if they're ready to move forward.",
        taskType: "call",
        priority: "medium",
        daysUntilDue: 7
      },
      enrolled: {
        title: "Welcome and onboard new participant",
        description: "Provide orientation information, schedule first session, and ensure smooth start.",
        taskType: "email",
        priority: "high",
        daysUntilDue: 1
      }
    };
  }
});

// server/demo-data.ts
import { sql as sql9 } from "drizzle-orm";
async function seedDemoData(clearExisting = false) {
  console.log("\u{1F331} Starting demo data seeding...");
  try {
    if (clearExisting) {
      console.log("\u{1F5D1}\uFE0F Clearing existing demo data...");
      await db.delete(campaignMembers);
      await db.delete(donationCampaigns).where(sql9`slug LIKE 'demo-%'`);
      await db.delete(leads).where(sql9`email LIKE '%@example.com'`);
      await db.delete(contentItems).where(sql9`type IN ('event', 'testimonial') AND metadata IS NOT NULL`);
      console.log("\u2705 Existing demo data cleared");
    }
    console.log("\u{1F4DD} Creating sample leads...");
    const sampleLeads = [
      {
        email: "parent1@example.com",
        firstName: "Sarah",
        lastName: "Johnson",
        phone: "+1-555-0101",
        persona: "parent",
        funnelStage: "retention",
        leadSource: "website",
        passions: ["literacy", "stem"]
      },
      {
        email: "parent2@example.com",
        firstName: "Michael",
        lastName: "Chen",
        phone: "+1-555-0102",
        persona: "parent",
        funnelStage: "retention",
        leadSource: "referral",
        passions: ["arts", "community"]
      },
      {
        email: "donor1@example.com",
        firstName: "Emily",
        lastName: "Rodriguez",
        phone: "+1-555-0201",
        persona: "donor",
        funnelStage: "decision",
        leadSource: "campaign",
        passions: ["literacy", "nutrition"]
      },
      {
        email: "donor2@example.com",
        firstName: "David",
        lastName: "Thompson",
        phone: "+1-555-0202",
        persona: "donor",
        funnelStage: "consideration",
        leadSource: "ad",
        passions: ["stem", "community"]
      },
      {
        email: "donor3@example.com",
        firstName: "Lisa",
        lastName: "Martinez",
        phone: "+1-555-0203",
        persona: "donor",
        funnelStage: "awareness",
        leadSource: "organic",
        passions: ["arts", "literacy"]
      },
      {
        email: "volunteer1@example.com",
        firstName: "James",
        lastName: "Wilson",
        phone: "+1-555-0301",
        persona: "volunteer",
        funnelStage: "consideration",
        leadSource: "website",
        passions: ["community", "nutrition"]
      },
      {
        email: "student1@example.com",
        firstName: "Alex",
        lastName: "Kim",
        persona: "student",
        funnelStage: "retention",
        leadSource: "in_person",
        passions: ["stem", "arts"]
      }
    ];
    await db.insert(leads).values(sampleLeads).onConflictDoNothing();
    console.log(`\u2705 Created ${sampleLeads.length} sample leads`);
    console.log("\u{1F4B0} Creating donation campaigns...");
    const now = /* @__PURE__ */ new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1e3);
    const sampleCampaigns = [
      {
        name: "STEM Summer Program 2025",
        slug: "demo-stem-summer-2025",
        description: "Fund hands-on science, technology, engineering, and math activities for 50 students this summer",
        story: "Our STEM Summer Program provides underserved youth with access to cutting-edge technology, robotics workshops, and mentorship from local engineers. Last year, 92% of participants reported increased interest in STEM careers. Your donation directly funds lab materials, field trips to tech companies, and expert instructors.",
        goalAmount: 15e5,
        // $15,000
        raisedAmount: 875e3,
        // $8,750 (58% funded)
        passionTags: ["stem", "community"],
        startDate: now,
        endDate: sixtyDaysFromNow,
        status: "active",
        totalDonations: 42,
        uniqueDonors: 38
      },
      {
        name: "Literacy Champions Fund",
        slug: "demo-literacy-champions",
        description: "Provide books and reading tutors to help 100 children improve their reading skills",
        story: "Every child deserves the gift of literacy. Our Literacy Champions program pairs struggling readers with trained tutors and provides age-appropriate books to take home. We've helped 200+ children increase reading proficiency by an average of 2 grade levels in just 6 months.",
        goalAmount: 1e6,
        // $10,000
        raisedAmount: 725e3,
        // $7,250 (72.5% funded)
        passionTags: ["literacy", "community"],
        startDate: now,
        endDate: thirtyDaysFromNow,
        status: "active",
        totalDonations: 35,
        uniqueDonors: 32
      },
      {
        name: "Arts & Creativity Workshop",
        slug: "demo-arts-creativity-2025",
        description: "Bring professional artists to lead painting, music, and theater workshops for our students",
        story: "Art transforms lives. Our Arts & Creativity Workshop introduces children to painting, sculpture, music composition, and theater performance. Many students discover hidden talents and build confidence through creative expression. Professional artists donate their time - we need your help covering materials and space rental.",
        goalAmount: 8e5,
        // $8,000
        raisedAmount: 28e4,
        // $2,800 (35% funded)
        passionTags: ["arts"],
        startDate: now,
        endDate: sixtyDaysFromNow,
        status: "active",
        totalDonations: 18,
        uniqueDonors: 16
      },
      {
        name: "Healthy Meals Initiative",
        slug: "demo-healthy-meals-2025",
        description: "Ensure every child receives nutritious breakfast and lunch during our programs",
        story: "No child should learn on an empty stomach. Our Healthy Meals Initiative provides fresh, nutritious breakfast and lunch to program participants. We work with local farms and nutritionists to create balanced menus that fuel growing bodies and minds. 100% of donations go directly to food costs.",
        goalAmount: 12e5,
        // $12,000
        raisedAmount: 95e4,
        // $9,500 (79% funded)
        passionTags: ["nutrition", "community"],
        startDate: now,
        endDate: thirtyDaysFromNow,
        status: "active",
        totalDonations: 48,
        uniqueDonors: 43
      }
    ];
    const insertedCampaigns = await db.insert(donationCampaigns).values(sampleCampaigns).returning();
    console.log(`\u2705 Created ${insertedCampaigns.length} donation campaigns`);
    console.log("\u{1F4C4} Creating content items...");
    const sampleContent = [
      {
        type: "event",
        title: "Annual Charity Gala",
        description: "Join us for an evening of inspiration, entertainment, and impact. Meet the students and families whose lives have been transformed by your support.",
        order: 1,
        isActive: true,
        passionTags: ["community"],
        metadata: {
          date: "2025-12-15",
          location: "Grand Ballroom, Downtown Convention Center",
          ticketPrice: "Free for donors, $75 for general admission"
        }
      },
      {
        type: "event",
        title: "STEM Fair & Showcase",
        description: "Students demonstrate their robotics projects, science experiments, and engineering designs. Open to the community!",
        order: 2,
        isActive: true,
        passionTags: ["stem"],
        metadata: {
          date: "2025-08-20",
          location: "Julie's Family Learning Center",
          ticketPrice: "Free admission"
        }
      },
      {
        type: "testimonial",
        title: "My Daughter Discovered Her Love of Reading",
        description: "Before joining the Literacy Champions program, my daughter struggled with reading and avoided books. Now she reads every night and her comprehension has improved dramatically. Thank you for believing in our children!",
        order: 1,
        isActive: true,
        passionTags: ["literacy"],
        metadata: {
          author: "Sarah Johnson",
          role: "Parent",
          rating: 5
        }
      },
      {
        type: "testimonial",
        title: "STEM Camp Changed My Career Path",
        description: "The robotics workshop opened my eyes to engineering. I'm now studying computer science in college and I credit this program for showing me what's possible. It gave me hands-on experience I couldn't get anywhere else.",
        order: 2,
        isActive: true,
        passionTags: ["stem"],
        metadata: {
          author: "Marcus Thompson",
          role: "Former Student",
          rating: 5
        }
      },
      {
        type: "testimonial",
        title: "The Arts Program Built My Confidence",
        description: "I was always shy and afraid to express myself. Through the Arts & Creativity Workshop, I found my voice in theater and painting. Now I perform in school plays and my artwork was featured in a gallery!",
        order: 3,
        isActive: true,
        passionTags: ["arts"],
        metadata: {
          author: "Emma Rodriguez",
          role: "Current Student",
          rating: 5
        }
      }
    ];
    await db.insert(contentItems).values(sampleContent).onConflictDoNothing();
    console.log(`\u2705 Created ${sampleContent.length} content items`);
    console.log("\u{1F465} Creating users and campaign members...");
    const parentLeads = await db.select().from(leads).where(sql9`persona = 'parent'`);
    const demoUsers = [];
    for (const parent of parentLeads) {
      const existingUsers = await db.select().from(users).where(sql9`email = ${parent.email}`);
      if (existingUsers.length > 0) {
        demoUsers.push(existingUsers[0]);
      } else {
        try {
          const [newUser] = await db.insert(users).values({
            email: parent.email,
            firstName: parent.firstName || "Member",
            lastName: parent.lastName || "",
            persona: "parent",
            role: "client"
          }).returning();
          demoUsers.push(newUser);
        } catch (error) {
          const retryUsers = await db.select().from(users).where(sql9`email = ${parent.email}`);
          if (retryUsers.length > 0) {
            demoUsers.push(retryUsers[0]);
          }
        }
      }
    }
    const campaignMembers_data = [];
    for (const campaign of insertedCampaigns) {
      const membersToAdd = demoUsers.slice(0, Math.floor(Math.random() * 2) + 1);
      for (const user of membersToAdd) {
        campaignMembers_data.push({
          campaignId: campaign.id,
          userId: user.id,
          role: "beneficiary",
          // Parents are beneficiaries whose children benefit from the campaign
          notifyOnDonation: true,
          notificationChannels: ["email"],
          metadata: {
            relationship: "parent",
            childName: "Demo Student"
          }
        });
      }
    }
    if (campaignMembers_data.length > 0) {
      await db.insert(campaignMembers).values(campaignMembers_data).onConflictDoNothing();
      console.log(`\u2705 Created ${demoUsers.length} users and ${campaignMembers_data.length} campaign member relationships`);
    }
    console.log("\u2728 Demo data seeding complete!");
    return {
      success: true,
      summary: {
        leads: sampleLeads.length,
        campaigns: insertedCampaigns.length,
        contentItems: sampleContent.length,
        users: demoUsers.length,
        campaignMembers: campaignMembers_data.length
      }
    };
  } catch (error) {
    console.error("\u274C Error seeding demo data:", error);
    throw error;
  }
}
async function seedFunnelProgressionRules(clearExisting = false) {
  console.log("\u{1F3AF} Starting funnel progression rules seeding...");
  try {
    if (clearExisting) {
      console.log("\u{1F5D1}\uFE0F Clearing existing funnel progression rules...");
      await db.delete(funnelProgressionRules);
      console.log("\u2705 Existing rules cleared");
    }
    const defaultRules = [
      // DONOR PERSONA
      {
        persona: "donor",
        fromStage: "awareness",
        toStage: "consideration",
        engagementScoreThreshold: 100,
        // ~10 page views or 3-4 resource downloads
        minimumDaysInStage: 1,
        // At least 1 day before advancing
        autoProgressEvents: [],
        inactivityDaysThreshold: 90,
        // 3 months of inactivity
        decayToStage: "awareness",
        isActive: true
      },
      {
        persona: "donor",
        fromStage: "consideration",
        toStage: "decision",
        engagementScoreThreshold: 150,
        // Donation page view (60pts) + calculator use (25pts) + more
        minimumDaysInStage: 2,
        autoProgressEvents: [],
        inactivityDaysThreshold: 60,
        // 2 months
        decayToStage: "awareness",
        isActive: true
      },
      {
        persona: "donor",
        fromStage: "decision",
        toStage: "retention",
        engagementScoreThreshold: 9999,
        // Auto-progress only via donation_completed event
        minimumDaysInStage: 0,
        autoProgressEvents: ["donation_completed"],
        inactivityDaysThreshold: 45,
        // 1.5 months
        decayToStage: "consideration",
        isActive: true
      },
      // STUDENT PERSONA
      {
        persona: "student",
        fromStage: "awareness",
        toStage: "consideration",
        engagementScoreThreshold: 80,
        // Quiz start (20pts) + video watch (25pts) + engagement
        minimumDaysInStage: 1,
        autoProgressEvents: [],
        inactivityDaysThreshold: 60,
        decayToStage: "awareness",
        isActive: true
      },
      {
        persona: "student",
        fromStage: "consideration",
        toStage: "decision",
        engagementScoreThreshold: 120,
        // Program inquiry (90pts) + other engagement
        minimumDaysInStage: 3,
        // Students take time to decide
        autoProgressEvents: [],
        inactivityDaysThreshold: 45,
        decayToStage: "awareness",
        isActive: true
      },
      {
        persona: "student",
        fromStage: "decision",
        toStage: "retention",
        engagementScoreThreshold: 9999,
        minimumDaysInStage: 0,
        autoProgressEvents: ["enrollment_submitted"],
        inactivityDaysThreshold: 30,
        decayToStage: "consideration",
        isActive: true
      },
      // PARENT PERSONA
      {
        persona: "parent",
        fromStage: "awareness",
        toStage: "consideration",
        engagementScoreThreshold: 90,
        // Testimonials (25pts) + impact calculator (25pts) + more
        minimumDaysInStage: 1,
        autoProgressEvents: [],
        inactivityDaysThreshold: 75,
        decayToStage: "awareness",
        isActive: true
      },
      {
        persona: "parent",
        fromStage: "consideration",
        toStage: "decision",
        engagementScoreThreshold: 140,
        // Program inquiry (90pts) + engagement
        minimumDaysInStage: 2,
        autoProgressEvents: [],
        inactivityDaysThreshold: 60,
        decayToStage: "awareness",
        isActive: true
      },
      {
        persona: "parent",
        fromStage: "decision",
        toStage: "retention",
        engagementScoreThreshold: 9999,
        minimumDaysInStage: 0,
        autoProgressEvents: ["enrollment_submitted"],
        // Enrolling child
        inactivityDaysThreshold: 30,
        decayToStage: "consideration",
        isActive: true
      },
      // VOLUNTEER PERSONA
      {
        persona: "volunteer",
        fromStage: "awareness",
        toStage: "consideration",
        engagementScoreThreshold: 70,
        // Resource downloads + video engagement
        minimumDaysInStage: 1,
        autoProgressEvents: [],
        inactivityDaysThreshold: 90,
        decayToStage: "awareness",
        isActive: true
      },
      {
        persona: "volunteer",
        fromStage: "consideration",
        toStage: "decision",
        engagementScoreThreshold: 110,
        // Volunteer inquiry (80pts) + engagement
        minimumDaysInStage: 2,
        autoProgressEvents: [],
        inactivityDaysThreshold: 60,
        decayToStage: "awareness",
        isActive: true
      },
      {
        persona: "volunteer",
        fromStage: "decision",
        toStage: "retention",
        engagementScoreThreshold: 9999,
        minimumDaysInStage: 0,
        autoProgressEvents: ["volunteer_enrolled"],
        inactivityDaysThreshold: 45,
        decayToStage: "consideration",
        isActive: true
      },
      // PROVIDER PERSONA (Service providers/partners)
      {
        persona: "provider",
        fromStage: "awareness",
        toStage: "consideration",
        engagementScoreThreshold: 100,
        // Resource downloads + testimonial engagement
        minimumDaysInStage: 1,
        autoProgressEvents: [],
        inactivityDaysThreshold: 90,
        decayToStage: "awareness",
        isActive: true
      },
      {
        persona: "provider",
        fromStage: "consideration",
        toStage: "decision",
        engagementScoreThreshold: 200,
        // Multiple high-value engagements before partnership
        minimumDaysInStage: 5,
        // Partnerships take time
        autoProgressEvents: [],
        inactivityDaysThreshold: 60,
        decayToStage: "awareness",
        isActive: true
      },
      {
        persona: "provider",
        fromStage: "decision",
        toStage: "retention",
        engagementScoreThreshold: 9999,
        minimumDaysInStage: 0,
        autoProgressEvents: ["contact_form_submit"],
        // Partnership inquiry
        inactivityDaysThreshold: 45,
        decayToStage: "consideration",
        isActive: true
      }
    ];
    const inserted = await db.insert(funnelProgressionRules).values(defaultRules).returning();
    console.log(`\u2705 Created ${inserted.length} funnel progression rules`);
    console.log("\u2728 Funnel progression rules seeding complete!");
    return {
      success: true,
      rulesCreated: inserted.length,
      rules: inserted
    };
  } catch (error) {
    console.error("\u274C Error seeding funnel progression rules:", error);
    throw error;
  }
}
var init_demo_data = __esm({
  "server/demo-data.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/googleSheets.ts
import { google as google2 } from "googleapis";
function getGoogleAuthClient2() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const path = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (json && json.trim().startsWith("{")) {
    try {
      const credentials = JSON.parse(json);
      return new google2.auth.GoogleAuth({ credentials });
    } catch {
      return null;
    }
  }
  if (path || json && !json.trim().startsWith("{")) {
    const keyPath = path || json.trim();
    return new google2.auth.GoogleAuth({ keyFile: keyPath });
  }
  return null;
}
async function getAccessToken2() {
  const auth = getGoogleAuthClient2();
  if (auth) {
    const client2 = await auth.getClient();
    const token = await client2.getAccessToken();
    if (token.token) return token.token;
  }
  if (connectionSettings2?.settings?.expires_at && new Date(connectionSettings2.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings2.settings.access_token;
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken || !hostname) {
    throw new Error(
      "Google Sheets not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_KEY_PATH, or use Replit Connectors (REPLIT_CONNECTORS_HOSTNAME + REPL_IDENTITY or WEB_REPL_RENEWAL)."
    );
  }
  connectionSettings2 = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=google-sheet",
    { headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken } }
  ).then((res) => res.json()).then((data) => data.items?.[0]);
  const accessToken = connectionSettings2?.settings?.access_token || connectionSettings2?.settings?.oauth?.credentials?.access_token;
  if (!connectionSettings2 || !accessToken) {
    throw new Error("Google Sheet not connected via Replit Connectors");
  }
  return accessToken;
}
async function getUncachableGoogleSheetClient() {
  const auth = getGoogleAuthClient2();
  if (auth) {
    return google2.sheets({ version: "v4", auth });
  }
  const accessToken = await getAccessToken2();
  const oauth2Client = new google2.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google2.sheets({ version: "v4", auth: oauth2Client });
}
function parseGoogleSheetUrl(url) {
  try {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return null;
    const spreadsheetId = match[1];
    const gidMatch = url.match(/[#&]gid=(\d+)/);
    return {
      spreadsheetId,
      gid: gidMatch ? gidMatch[1] : void 0,
      range: void 0
      // Will read all data by default
    };
  } catch (error) {
    console.error("Error parsing Google Sheets URL:", error);
    return null;
  }
}
async function fetchSheetData(spreadsheetId, gid, range) {
  const sheets = await getUncachableGoogleSheetClient();
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId
  });
  let sheetName;
  if (gid) {
    const targetSheet = metadata.data.sheets?.find(
      (sheet) => sheet.properties?.sheetId?.toString() === gid
    );
    sheetName = targetSheet?.properties?.title || metadata.data.sheets?.[0]?.properties?.title || "Sheet1";
  } else {
    sheetName = metadata.data.sheets?.[0]?.properties?.title || "Sheet1";
  }
  const fullRange = range || sheetName;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: fullRange
  });
  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return [];
  }
  const headers = rows[0];
  const data = rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, index2) => {
      obj[header] = row[index2] || "";
    });
    return obj;
  });
  return data;
}
var connectionSettings2;
var init_googleSheets = __esm({
  "server/googleSheets.ts"() {
    "use strict";
  }
});

// server/services/chatbotService.ts
var chatbotService_exports = {};
__export(chatbotService_exports, {
  processChatMessage: () => processChatMessage
});
import OpenAI from "openai";
async function getRecentLogs() {
  return `[Note: Log access would integrate with Replit's logging system. For now, check the workflow logs in the Replit interface.]`;
}
async function escalateIssue(args) {
  return JSON.stringify({
    action: "escalate",
    ...args,
    note: "Issue will be logged and notifications sent"
  });
}
async function executeTool(toolCall) {
  const { name, arguments: argsStr } = toolCall.function;
  const args = JSON.parse(argsStr);
  switch (name) {
    case "get_recent_logs":
      return await getRecentLogs();
    case "escalate_issue":
      return await escalateIssue(args);
    case "get_platform_stats":
      const platformStats = await storage.getPlatformStats();
      return JSON.stringify(platformStats, null, 2);
    case "get_lead_analytics":
      const leadAnalytics = await storage.getLeadAnalytics(args);
      return JSON.stringify(leadAnalytics, null, 2);
    case "get_content_summary":
      const contentSummary = await storage.getContentSummary(args);
      return JSON.stringify(contentSummary, null, 2);
    case "get_donation_stats":
      const donationStats = await storage.getDonationStats(args);
      return JSON.stringify(donationStats, null, 2);
    default:
      return `Unknown tool: ${name}`;
  }
}
async function processChatMessage(userId, sessionId, userMessage, conversationHistory) {
  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: userMessage }
    ];
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      tools: TOOLS,
      max_completion_tokens: 8192
    });
    const assistantMessage = response.choices[0]?.message;
    if (!assistantMessage) {
      throw new Error("No response from AI");
    }
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (toolCall) => {
          const result = await executeTool(toolCall);
          return {
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            result
          };
        })
      );
      const escalationCall = assistantMessage.tool_calls.find(
        (tc) => tc.function.name === "escalate_issue"
      );
      let shouldEscalate = false;
      let escalationData = null;
      if (escalationCall) {
        shouldEscalate = true;
        escalationData = JSON.parse(escalationCall.function.arguments);
      }
      const followUpMessages = [
        ...messages,
        assistantMessage,
        ...toolResults.map((tr) => ({
          role: "tool",
          tool_call_id: tr.tool_call_id,
          content: tr.result
        }))
      ];
      const followUpResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: followUpMessages,
        max_completion_tokens: 8192
      });
      const finalResponse = followUpResponse.choices[0]?.message?.content || "I encountered an issue processing your request.";
      return {
        response: finalResponse,
        toolCalls: assistantMessage.tool_calls,
        toolResults,
        shouldEscalate,
        escalationData
      };
    }
    return {
      response: assistantMessage.content || "I apologize, but I couldn't generate a response."
    };
  } catch (error) {
    console.error("Error in chatbot service:", error);
    return {
      response: `I encountered an error: ${error.message}. Please try again or contact support if the issue persists.`
    };
  }
}
var openai, SYSTEM_PROMPT, TOOLS;
var init_chatbotService = __esm({
  "server/services/chatbotService.ts"() {
    "use strict";
    init_storage();
    openai = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
    });
    SYSTEM_PROMPT = `You are an intelligent admin assistant for Julie's Family Learning Program (JFLP), a nonprofit CRM and content management platform.

# Your Role
You help admins understand platform data, troubleshoot issues, and answer questions about leads, content, donations, and system performance.

# Platform Overview
JFLP is a persona-based CRM for nonprofits featuring:
- **5 Personas**: student, parent, provider, donor, volunteer
- **4 Funnel Stages**: awareness, consideration, decision, retention
- **Pipeline Stages**: new_lead, contacted, qualified, nurturing, converted, lost
- **Content Types**: service, event, testimonial, hero, cta, socialMedia, video, program_detail, student_dashboard_card
- **Features**: Lead management, donation tracking, email/SMS campaigns, A/B testing, content visibility rules

# Available Tools

## Platform Analytics (Use these to answer data questions)
1. **get_platform_stats**: Get overall platform metrics
   - Returns: Total leads, users, donations, active content
   - Recent activity: Leads/donations/tasks this week
   - Use for: "Show me platform overview", "How's the platform doing?"

2. **get_lead_analytics**: Get detailed lead statistics
   - Accepts filters: persona, funnelStage, pipelineStage, daysBack
   - Returns: Lead counts by persona/funnel/pipeline, recent leads, avg engagement
   - Use for: "How many leads?", "Show donor leads", "Lead breakdown by stage"

3. **get_content_summary**: Get content and A/B test stats
   - Accepts filter: type (service, event, etc.)
   - Returns: Content counts (total/active/inactive), breakdown by type, A/B test status
   - Use for: "What content is published?", "How many programs?", "A/B test status"

4. **get_donation_stats**: Get donation metrics
   - Accepts filter: daysBack
   - Returns: Total donations/amount/average, breakdown by type/status, recent donations, campaign stats
   - Use for: "Show donation stats", "How much donated?", "Recent donations"

## Troubleshooting Tools
5. **get_recent_logs**: Fetch application logs for debugging
   - Use for investigating errors or system behavior

6. **escalate_issue**: Create tracked issue with SMS/email notifications
   - Use when you can't resolve the problem
   - Sends alerts to 617-967-7448 and vsillah@gmail.com

# Important Data Handling Rules
- **NO PII**: Never share individual email addresses, phone numbers, or personal details
- **Aggregate only**: Provide counts, averages, and breakdowns - not raw records
- **Trust the data**: The tools return accurate, real-time data - don't make up numbers
- **Be precise**: Use exact numbers from tool results, don't round unless specified
- **Include context**: Always mention when data was generated and what filters were applied

# CRM Schema Reference
- **Leads**: Email, name, phone, persona, funnelStage, pipelineStage, engagementScore, passions, notes
- **Donations**: Amount (in cents!), type (one-time/recurring/campaign), status, donor info, Stripe IDs
- **Content**: Type, title, description, isActive, order, passionTags, persona visibility
- **Users**: Email, name, role (client/admin/super_admin), persona preference
- **Tasks**: Lead assignment, due date, priority, status, notes

# How to Help
1. **Answer data questions**: Use analytics tools to get accurate, real-time stats
2. **Explain findings**: Present data clearly with context and insights
3. **Troubleshoot issues**: Use logs and analytics to diagnose problems
4. **Guide actions**: Suggest next steps based on data (e.g., "Contact the 15 nurturing-stage donors")
5. **Escalate when stuck**: Create issue if you can't resolve the problem

Always be helpful, data-driven, and proactive!`;
    TOOLS = [
      {
        type: "function",
        function: {
          name: "get_recent_logs",
          description: "Retrieve recent application logs to investigate errors or system behavior",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "escalate_issue",
          description: "Create a tracked issue when you cannot resolve the problem. This sends notifications to admin via SMS and email.",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Brief title summarizing the issue"
              },
              description: {
                type: "string",
                description: "Detailed description of the issue and what was tried"
              },
              severity: {
                type: "string",
                enum: ["low", "medium", "high", "critical"],
                description: "How urgent the issue is"
              },
              category: {
                type: "string",
                description: "Category: content, technical, user_account, performance, or other"
              },
              diagnosticData: {
                type: "object",
                description: "Any relevant data gathered during diagnosis"
              }
            },
            required: ["title", "description", "severity"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_platform_stats",
          description: "Get overall platform metrics including total leads, users, donations, active content, and recent activity (this week)",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_lead_analytics",
          description: "Get detailed lead statistics with optional filtering by persona, funnel stage, pipeline stage, or time period",
          parameters: {
            type: "object",
            properties: {
              persona: {
                type: "string",
                enum: ["student", "parent", "provider", "donor", "volunteer"],
                description: "Filter by specific persona"
              },
              funnelStage: {
                type: "string",
                enum: ["awareness", "consideration", "decision", "retention"],
                description: "Filter by funnel stage"
              },
              pipelineStage: {
                type: "string",
                enum: ["new_lead", "contacted", "qualified", "nurturing", "converted", "lost"],
                description: "Filter by pipeline stage"
              },
              daysBack: {
                type: "number",
                description: "Number of days to look back for recent leads (default: 30)"
              }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_content_summary",
          description: "Get content statistics including total, active, inactive counts, breakdown by type, and A/B test status",
          parameters: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["service", "event", "testimonial", "sponsor", "lead_magnet", "impact_stat", "hero", "cta", "socialMedia", "video", "review", "program_detail", "student_project", "student_testimonial", "student_dashboard_card"],
                description: "Filter by content type"
              }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_donation_stats",
          description: "Get donation metrics including total count, amount, average, breakdown by type/status, recent donations, and campaign stats",
          parameters: {
            type: "object",
            properties: {
              daysBack: {
                type: "number",
                description: "Number of days to look back for recent donations (default: 30)"
              }
            },
            required: []
          }
        }
      }
    ];
  }
});

// server/twilio.ts
var twilio_exports = {};
__export(twilio_exports, {
  formatPhoneNumber: () => formatPhoneNumber,
  getTwilioAuthToken: () => getTwilioAuthToken,
  getTwilioClient: () => getTwilioClient,
  getTwilioFromPhoneNumber: () => getTwilioFromPhoneNumber,
  replaceVariables: () => replaceVariables,
  sendSMS: () => sendSMS
});
import twilio from "twilio";
async function getCredentials() {
  if (cachedCreds) return cachedCreds;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (accountSid && phoneNumber && (authToken || apiKey && apiKeySecret)) {
    cachedCreds = {
      accountSid,
      apiKey: apiKey || accountSid,
      apiKeySecret: apiKeySecret || authToken,
      phoneNumber
    };
    return cachedCreds;
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken || !hostname) {
    throw new Error(
      "Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN (or TWILIO_API_KEY + TWILIO_API_KEY_SECRET), and TWILIO_PHONE_NUMBER, or use Replit Connectors."
    );
  }
  const connectionSettings4 = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=twilio",
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: xReplitToken
      }
    }
  ).then((res) => res.json()).then((data) => data.items?.[0]);
  if (!connectionSettings4 || !connectionSettings4.settings?.account_sid || !connectionSettings4.settings?.api_key || !connectionSettings4.settings?.api_key_secret) {
    throw new Error("Twilio not connected via Replit Connectors");
  }
  cachedCreds = {
    accountSid: connectionSettings4.settings.account_sid,
    apiKey: connectionSettings4.settings.api_key,
    apiKeySecret: connectionSettings4.settings.api_key_secret,
    phoneNumber: connectionSettings4.settings.phone_number
  };
  return cachedCreds;
}
function getTwilioAuthToken() {
  return process.env.TWILIO_AUTH_TOKEN ?? process.env.TWILIO_API_KEY_SECRET ?? null;
}
async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
    accountSid
  });
}
async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}
async function sendSMS(to, message, metadata) {
  try {
    const formattedNumber = formatPhoneNumber(to);
    if (!formattedNumber || formattedNumber === "+" || formattedNumber.length < 10) {
      throw new Error(`Invalid phone number: ${to}. Must be a valid phone number with area code.`);
    }
    const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const isUnsubscribed = await storage2.isSmsUnsubscribed(formattedNumber);
    if (isUnsubscribed) {
      console.log(`[SMS Blocked] Recipient ${formattedNumber} has opted out via STOP keyword - TCPA compliance`);
      return {
        success: false,
        blocked: true,
        error: `Recipient has opted out of SMS messages. Send blocked for TCPA compliance.`
      };
    }
    const client2 = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    const result = await client2.messages.create({
      body: message,
      from: fromNumber,
      to: formattedNumber
    });
    return {
      success: true,
      messageId: result.sid
    };
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return {
      success: false,
      error: error.message || "Failed to send SMS"
    };
  }
}
function replaceVariables(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, String(value));
  }
  return result;
}
function formatPhoneNumber(phone) {
  if (!phone || typeof phone !== "string") {
    throw new Error("Phone number is required and must be a string");
  }
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    const cleaned2 = trimmed.replace(/\D/g, "");
    if (cleaned2.length >= 8 && cleaned2.length <= 15) {
      return `+${cleaned2}`;
    }
    throw new Error(`Invalid E.164 number: ${phone}. Expected 8-15 digits after country code.`);
  }
  if (trimmed.startsWith("00")) {
    const cleaned2 = trimmed.replace(/\D/g, "").substring(2);
    if (cleaned2.length >= 8 && cleaned2.length <= 15) {
      return `+${cleaned2}`;
    }
    throw new Error(`Invalid international number: ${phone}. Expected 8-15 digits after 00 prefix.`);
  }
  const cleaned = trimmed.replace(/\D/g, "");
  if (cleaned.length < 10) {
    throw new Error(`Invalid phone number: ${phone}. Must have at least 10 digits.`);
  }
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }
  if (cleaned.length >= 11 && cleaned.length <= 15) {
    return `+${cleaned}`;
  }
  throw new Error(`Cannot format phone number: ${phone}. Must be 10-15 digits (got ${cleaned.length}).`);
}
var cachedCreds;
var init_twilio = __esm({
  "server/twilio.ts"() {
    "use strict";
    cachedCreds = null;
  }
});

// server/services/twilioService.ts
import twilio2 from "twilio";
async function getCredentials2() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }
  connectionSettings3 = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=twilio",
    {
      headers: {
        "Accept": "application/json",
        "X_REPLIT_TOKEN": xReplitToken
      }
    }
  ).then((res) => res.json()).then((data) => data.items?.[0]);
  if (!connectionSettings3 || (!connectionSettings3.settings.account_sid || !connectionSettings3.settings.api_key || !connectionSettings3.settings.api_key_secret)) {
    throw new Error("Twilio not connected");
  }
  return {
    accountSid: connectionSettings3.settings.account_sid,
    apiKey: connectionSettings3.settings.api_key,
    apiKeySecret: connectionSettings3.settings.api_key_secret,
    phoneNumber: connectionSettings3.settings.phone_number
  };
}
async function getTwilioClient2() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials2();
  return twilio2(apiKey, apiKeySecret, {
    accountSid
  });
}
async function getTwilioFromPhoneNumber2() {
  const { phoneNumber } = await getCredentials2();
  return phoneNumber;
}
async function sendSMS2(to, body) {
  try {
    const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const { formatPhoneNumber: formatPhoneNumber2 } = await Promise.resolve().then(() => (init_twilio(), twilio_exports));
    let formattedPhone;
    try {
      formattedPhone = formatPhoneNumber2(to);
    } catch (e) {
      return { success: false, error: `Invalid phone number: ${e.message}` };
    }
    const isUnsubscribed = await storage2.isSmsUnsubscribed(formattedPhone);
    if (isUnsubscribed) {
      console.log(`[SMS Blocked] Recipient ${formattedPhone} has opted out via STOP keyword - TCPA compliance`);
      return {
        success: false,
        blocked: true,
        error: `Recipient has opted out of SMS messages. Send blocked for TCPA compliance.`
      };
    }
    const client2 = await getTwilioClient2();
    const from = await getTwilioFromPhoneNumber2();
    const message = await client2.messages.create({
      body,
      from,
      to: formattedPhone
    });
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}
var connectionSettings3;
var init_twilioService = __esm({
  "server/services/twilioService.ts"() {
    "use strict";
  }
});

// server/services/notificationService.ts
var notificationService_exports = {};
__export(notificationService_exports, {
  notifyIssue: () => notifyIssue
});
import sgMail2 from "@sendgrid/mail";
async function sendEmail2(issue) {
  if (!SENDGRID_API_KEY) {
    return {
      success: false,
      error: "SendGrid API key not configured"
    };
  }
  try {
    const severityLabel = `[${issue.severity.toUpperCase()}]`;
    const msg = {
      to: ADMIN_EMAIL,
      from: FROM_EMAIL,
      subject: `JFLP Issue Escalated ${severityLabel}: ${issue.title}`,
      html: `
        <h2>Issue Escalated ${severityLabel}</h2>
        <p><strong>Title:</strong> ${issue.title}</p>
        <p><strong>Category:</strong> ${issue.category || "Not specified"}</p>
        <p><strong>Severity:</strong> ${issue.severity}</p>
        <p><strong>Description:</strong></p>
        <p>${issue.description.replace(/\n/g, "<br>")}</p>
        ${issue.diagnosticData ? `<p><strong>Diagnostic Data:</strong></p><pre>${JSON.stringify(issue.diagnosticData, null, 2)}</pre>` : ""}
        <p><strong>Issue ID:</strong> ${issue.id}</p>
        <p><strong>Time:</strong> ${new Date(issue.createdAt).toLocaleString()}</p>
      `
    };
    await sgMail2.send(msg);
    return { success: true };
  } catch (error) {
    console.error("SendGrid error:", error);
    return {
      success: false,
      error: error.message || "Failed to send email"
    };
  }
}
async function notifyIssue(issue) {
  const severityLabel = `[${issue.severity.toUpperCase()}]`;
  const smsBody = `JFLP Alert ${severityLabel}: ${issue.title}

Category: ${issue.category || "N/A"}

${issue.description.substring(0, 100)}${issue.description.length > 100 ? "..." : ""}

Check admin dashboard for details.`;
  const [smsResult, emailResult] = await Promise.all([
    sendSMS2(ADMIN_PHONE, smsBody),
    sendEmail2(issue)
  ]);
  return {
    sms: smsResult,
    email: emailResult
  };
}
var ADMIN_PHONE, ADMIN_EMAIL, FROM_EMAIL, SENDGRID_API_KEY;
var init_notificationService = __esm({
  "server/services/notificationService.ts"() {
    "use strict";
    init_twilioService();
    ADMIN_PHONE = "+16179677448";
    ADMIN_EMAIL = "vsillah@gmail.com";
    FROM_EMAIL = "vsillah@gmail.com";
    SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (SENDGRID_API_KEY) {
      sgMail2.setApiKey(SENDGRID_API_KEY);
    }
  }
});

// server/leadQualifier.ts
var leadQualifier_exports = {};
__export(leadQualifier_exports, {
  batchQualifyLeads: () => batchQualifyLeads,
  generateOutreachEmail: () => generateOutreachEmail,
  qualifyLead: () => qualifyLead
});
import { GoogleGenAI as GoogleGenAI3 } from "@google/genai";
async function qualifyLead(lead, icpCriteria2) {
  const prompt = `${icpCriteria2.qualificationPrompt}

LEAD DATA TO EVALUATE:
- Name: ${lead.firstName} ${lead.lastName}
- Email: ${lead.email}
- Company: ${lead.company || "Unknown"}
- Job Title: ${lead.jobTitle || "Unknown"}
- LinkedIn: ${lead.linkedinUrl || "Not provided"}
- Persona: ${lead.persona}
- Lead Source: ${lead.leadSource || "Unknown"}
- Notes: ${lead.notes || "None"}
${lead.enrichmentData ? `
ENRICHMENT DATA:
${JSON.stringify(lead.enrichmentData, null, 2)}
` : ""}

ICP CRITERIA:
${JSON.stringify(icpCriteria2.criteria, null, 2)}

${icpCriteria2.scoringWeights ? `SCORING WEIGHTS:
${JSON.stringify(icpCriteria2.scoringWeights, null, 2)}` : ""}

ANALYSIS INSTRUCTIONS:
1. Evaluate this lead against the ICP criteria
2. Assign a qualification score from 0-100
   - 80-100: Strong fit (qualified)
   - 50-79: Moderate fit (review_needed)
   - 0-49: Poor fit (disqualified)
3. Identify which ICP criteria they match
4. Note any red flags or concerns
5. Provide actionable recommendations

Return ONLY valid JSON in this exact format, with no markdown formatting or code blocks:
{
  "score": 85,
  "status": "qualified",
  "insights": "Detailed analysis of why this lead fits or doesn't fit the ICP. Include specific details about their role, company, and relevance.",
  "matchedCriteria": ["Has decision-making authority", "Works in education sector", "Company size 50-500 employees"],
  "redFlags": ["Recent job change", "Company in financial distress"],
  "recommendations": "High priority outreach. Focus on education program ROI. Schedule demo within 48 hours."
}`;
  try {
    const result = await genAI3.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });
    const responseText = result.response?.text() || result.text || "";
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, "");
    cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
    cleanedResponse = cleanedResponse.trim();
    const parsed = JSON.parse(cleanedResponse);
    const score = Math.max(0, Math.min(100, parseInt(parsed.score) || 0));
    let status;
    if (score >= 80) {
      status = "qualified";
    } else if (score >= 50) {
      status = "review_needed";
    } else {
      status = "disqualified";
    }
    return {
      score,
      status,
      insights: parsed.insights || "No analysis provided",
      matchedCriteria: Array.isArray(parsed.matchedCriteria) ? parsed.matchedCriteria : [],
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
      recommendations: parsed.recommendations || "No recommendations provided"
    };
  } catch (error) {
    console.error("Failed to qualify lead:", error);
    throw new Error("Failed to qualify lead - AI analysis error");
  }
}
async function batchQualifyLeads(leads2, icpCriteria2) {
  const results = /* @__PURE__ */ new Map();
  for (const lead of leads2) {
    try {
      const result = await qualifyLead(lead, icpCriteria2);
      results.set(lead.id, result);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to qualify lead ${lead.id}:`, error);
    }
  }
  return results;
}
async function generateOutreachEmail(lead, qualificationResult) {
  const prompt = `You are an expert outreach email writer for Mentor Rhode Island (MRI), a nonprofit that connects children with caring adult mentors.

LEAD INFORMATION:
- Name: ${lead.firstName} ${lead.lastName}
- Company: ${lead.company || "Unknown"}
- Job Title: ${lead.jobTitle || "Unknown"}
- Persona: ${lead.persona}

${qualificationResult ? `
QUALIFICATION INSIGHTS:
${qualificationResult.insights}

MATCHED CRITERIA:
${qualificationResult.matchedCriteria.join(", ")}

RECOMMENDATIONS:
${qualificationResult.recommendations}
` : ""}

${lead.enrichmentData ? `
ENRICHMENT DATA (use this for personalization):
${JSON.stringify(lead.enrichmentData, null, 2)}
` : ""}

TASK:
Write a personalized cold outreach email that:
1. Opens with a relevant hook based on their role/company
2. Clearly states MRI's mission and value proposition
3. Includes a specific call-to-action
4. Keeps it under 150 words (brief and respectful of their time)
5. Professional, warm, and authentic tone
6. NEVER use emojis

MRI VALUE PROPOSITION:
- Connects children with caring adult mentors
- Research-proven impact on educational outcomes
- Flexible mentoring models (site-based, community-based)
- Comprehensive training and support for mentors
- Strong community partnerships

Return ONLY valid JSON in this exact format, with no markdown formatting or code blocks:
{
  "subject": "Brief, personalized subject line (max 60 characters)",
  "bodyHtml": "<p>HTML formatted email body</p>",
  "bodyText": "Plain text version of the email"
}`;
  try {
    const result = await genAI3.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });
    const responseText = result.response?.text() || result.text || "";
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, "");
    cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
    cleanedResponse = cleanedResponse.trim();
    const parsed = JSON.parse(cleanedResponse);
    return {
      subject: parsed.subject || "Partnership Opportunity with MRI",
      bodyHtml: parsed.bodyHtml || parsed.bodyText || "Email content not generated",
      bodyText: parsed.bodyText || stripHtml2(parsed.bodyHtml) || "Email content not generated"
    };
  } catch (error) {
    console.error("Failed to generate outreach email:", error);
    throw new Error("Failed to generate outreach email");
  }
}
function stripHtml2(html) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}
var genAI3;
var init_leadQualifier = __esm({
  "server/leadQualifier.ts"() {
    "use strict";
    genAI3 = new GoogleGenAI3({
      apiKey: process.env.GOOGLE_API_KEY
    });
  }
});

// server/services/automationScheduler.ts
var automationScheduler_exports = {};
__export(automationScheduler_exports, {
  AutomationSchedulerService: () => AutomationSchedulerService
});
var AutomationSchedulerService;
var init_automationScheduler = __esm({
  "server/services/automationScheduler.ts"() {
    "use strict";
    AutomationSchedulerService = class {
      constructor(storage2, automationEngine, testLifecycle, winnerPromotion, baselineAggregator) {
        this.storage = storage2;
        this.automationEngine = automationEngine;
        this.testLifecycle = testLifecycle;
        this.winnerPromotion = winnerPromotion;
        this.baselineAggregator = baselineAggregator;
      }
      isRunning = false;
      intervalId;
      /**
       * Start the automation scheduler
       */
      start(intervalHours = 24) {
        if (this.intervalId) {
          console.log("[AutomationScheduler] Already running");
          return;
        }
        console.log(`[AutomationScheduler] Starting scheduler (runs every ${intervalHours} hours)`);
        this.runAutomationCycle().catch((error) => {
          console.error("[AutomationScheduler] Initial run failed:", error);
        });
        const intervalMs = intervalHours * 60 * 60 * 1e3;
        this.intervalId = setInterval(() => {
          this.runAutomationCycle().catch((error) => {
            console.error("[AutomationScheduler] Scheduled run failed:", error);
          });
        }, intervalMs);
      }
      /**
       * Stop the automation scheduler
       */
      stop() {
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = void 0;
          console.log("[AutomationScheduler] Stopped");
        }
      }
      /**
       * Run a complete automation cycle
       */
      async runAutomationCycle() {
        if (this.isRunning) {
          console.log("[AutomationScheduler] Cycle already running, skipping");
          throw new Error("Automation cycle already running");
        }
        this.isRunning = true;
        const startedAt = /* @__PURE__ */ new Date();
        const errors = [];
        console.log("[AutomationScheduler] Starting automation cycle");
        try {
          const safetyLimits = await this.storage.getAbTestSafetyLimits();
          if (!safetyLimits) {
            await this.initializeSafetyLimits();
          }
          console.log("[AutomationScheduler] Step 1: Updating baselines");
          const baselinesUpdated = await this.updateBaselines();
          console.log("[AutomationScheduler] Step 2: Evaluating automation rules");
          const evaluationResult = await this.automationEngine.evaluateAutomationRules();
          console.log("[AutomationScheduler] Step 3: Creating automated tests");
          const testsCreated = await this.createTestsFromCandidates(
            evaluationResult.candidates
          );
          console.log("[AutomationScheduler] Step 4: Evaluating running tests");
          const winnerEvaluations = await this.winnerPromotion.evaluateAllTests();
          console.log("[AutomationScheduler] Step 5: Promoting winners");
          const promotionResults = await this.winnerPromotion.autoPromoteWinners(
            winnerEvaluations
          );
          const winnersPromoted = promotionResults.filter((r) => r.promoted).length;
          const completedAt = /* @__PURE__ */ new Date();
          const duration = completedAt.getTime() - startedAt.getTime();
          console.log(`[AutomationScheduler] Cycle completed in ${duration}ms`);
          console.log(`  - Baselines updated: ${baselinesUpdated}`);
          console.log(`  - Candidates found: ${evaluationResult.candidates.length}`);
          console.log(`  - Tests created: ${testsCreated}`);
          console.log(`  - Tests evaluated: ${winnerEvaluations.length}`);
          console.log(`  - Winners promoted: ${winnersPromoted}`);
          return {
            runId: evaluationResult.runId || "unknown",
            startedAt,
            completedAt,
            status: "completed",
            candidatesFound: evaluationResult.candidates.length,
            testsCreated,
            testsEvaluated: winnerEvaluations.length,
            winnersPromoted,
            baselinesUpdated,
            errors,
            duration
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          errors.push(errorMessage);
          console.error("[AutomationScheduler] Cycle failed:", error);
          return {
            runId: "failed",
            startedAt,
            status: "failed",
            candidatesFound: 0,
            testsCreated: 0,
            testsEvaluated: 0,
            winnersPromoted: 0,
            baselinesUpdated: 0,
            errors
          };
        } finally {
          this.isRunning = false;
        }
      }
      /**
       * Update baselines for all content types
       */
      async updateBaselines() {
        let updatedCount = 0;
        try {
          const tests = await this.storage.getAllAbTests();
          const contentTypes = new Set(tests.map((t) => t.contentType));
          for (const contentType of contentTypes) {
            const contentItems2 = new Set(
              tests.filter((t) => t.contentType === contentType).map((t) => t.contentItemId)
            );
            const count3 = await this.baselineAggregator.batchUpdateBaselines(
              contentType,
              Array.from(contentItems2),
              30
              // 30-day window
            );
            updatedCount += count3;
          }
        } catch (error) {
          console.error("[AutomationScheduler] Baseline update failed:", error);
        }
        return updatedCount;
      }
      /**
       * Create tests from automation candidates
       */
      async createTestsFromCandidates(candidates) {
        if (candidates.length === 0) {
          return 0;
        }
        const safetyLimits = await this.storage.getAbTestSafetyLimits();
        if (!safetyLimits) {
          console.warn("[AutomationScheduler] Safety limits not configured, skipping test creation");
          return 0;
        }
        const maxConcurrentTests = safetyLimits.maxConcurrentTests || 10;
        const maxDailyGenerations = safetyLimits.maxDailyGenerations || 20;
        const allTests = await this.storage.getAllAbTests();
        const activeAutomatedTests = allTests.filter((t) => t.status === "active" && t.isAutomated).length;
        if (activeAutomatedTests >= maxConcurrentTests) {
          console.log(`[AutomationScheduler] Max concurrent tests limit reached (${activeAutomatedTests}/${maxConcurrentTests})`);
          return 0;
        }
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const todayGenerations = await this.storage.getAllAbTestVariantAiGenerations({
          // Filter by today would go here if storage method supported it
        });
        const generationsToday = todayGenerations.filter((g) => {
          const genDate = g.createdAt;
          return genDate && genDate >= today;
        }).length;
        if (generationsToday >= maxDailyGenerations) {
          console.log(`[AutomationScheduler] Daily AI generation limit reached (${generationsToday}/${maxDailyGenerations})`);
          return 0;
        }
        const variantsPerTest = 2;
        const remainingTestSlots = maxConcurrentTests - activeAutomatedTests;
        const maxTestsByGenerations = Math.floor((maxDailyGenerations - generationsToday) / variantsPerTest);
        const maxTests = Math.min(remainingTestSlots, maxTestsByGenerations);
        const candidatesToProcess = candidates.slice(0, maxTests);
        console.log(`[AutomationScheduler] Creating ${candidatesToProcess.length} tests (${generationsToday}/${maxDailyGenerations} generations used today)`);
        const results = await this.testLifecycle.createBatchTests(
          candidatesToProcess,
          variantsPerTest
        );
        const successCount = results.filter((r) => r.result !== null).length;
        return successCount;
      }
      /**
       * Initialize default safety limits if not configured
       */
      async initializeSafetyLimits() {
        console.log("[AutomationScheduler] Initializing default safety limits");
        await this.storage.upsertAbTestSafetyLimits({
          scope: "global",
          maxConcurrentTests: 10,
          maxDailyGenerations: 20,
          maxVariantsPerTest: 3
        });
      }
      /**
       * Get automation run history
       */
      async getRunHistory(limit = 10) {
        return await this.storage.getAbTestAutomationRuns({ limit });
      }
      /**
       * Get current automation status
       */
      async getStatus() {
        const runs = await this.storage.getAbTestAutomationRuns({ limit: 1 });
        const lastRun = runs[0];
        const safetyLimits = await this.storage.getAbTestSafetyLimits();
        const allTests = await this.storage.getAllAbTests();
        const activeTests = allTests.filter((t) => t.status === "active" && t.isAutomated).length;
        return {
          isRunning: this.isRunning,
          schedulerActive: !!this.intervalId,
          lastRun,
          safetyLimits,
          activeTests,
          pendingCandidates: 0
          // Would calculate based on evaluation
        };
      }
      /**
       * Manually trigger an automation cycle
       */
      async triggerManualRun() {
        console.log("[AutomationScheduler] Manual trigger requested");
        return await this.runAutomationCycle();
      }
    };
  }
});

// server/services/graduationPathCampaign.ts
var graduationPathCampaign_exports = {};
__export(graduationPathCampaign_exports, {
  backfillGraduationPathEnrollments: () => backfillGraduationPathEnrollments,
  createGraduationPathCampaign: () => createGraduationPathCampaign,
  enrollInGraduationPath: () => enrollInGraduationPath
});
import { eq as eq8, and as and9 } from "drizzle-orm";
async function createGraduationPathCampaign() {
  console.log("[GraduationPath] Setting up graduation path email campaign...");
  const existing = await db.select().from(emailCampaigns).where(eq8(emailCampaigns.name, "Graduation Path - New Donor Journey"));
  if (existing.length > 0) {
    console.log("[GraduationPath] Campaign already exists, skipping setup");
    return existing[0];
  }
  const campaign = {
    name: "Graduation Path - New Donor Journey",
    description: "Automated 6-month nurture sequence for first-time donors. Moves donors from first gift through recurring giving milestones.",
    persona: null,
    // All personas
    funnelStage: "decision",
    // Post-decision nurturing
    triggerType: "lead_created",
    // Trigger when a donor makes their first donation
    triggerConditions: {
      requiresFirstDonation: true,
      minDonationAmount: 0
      // Any amount
    },
    isActive: true
  };
  const [createdCampaign] = await db.insert(emailCampaigns).values(campaign).returning();
  console.log(`[GraduationPath] Created campaign: ${createdCampaign.id}`);
  const steps = [
    {
      campaignId: createdCampaign.id,
      stepNumber: 1,
      delayDays: 0,
      // Immediately after first donation
      delayHours: 1,
      // 1 hour delay
      templateId: null,
      subject: "Welcome to Julie's Family Learning Program! \u{1F393}",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for your gift, {{firstName}}!</h2>
          
          <p>Your generous donation just made a real difference for families in our community.</p>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Your gift will directly support families gaining literacy skills</li>
            <li>You'll receive updates on the impact you're making</li>
            <li>We'll share stories from families you're helping</li>
          </ul>
          
          <p>Watch your inbox over the next few months - I'll be sharing exclusive updates about the families you're empowering.</p>
          
          <p>With gratitude,<br/>
          Julie & The Family Learning Team</p>
        </div>
      `,
      textContent: "Thank you for your gift, {{firstName}}! Your generous donation just made a real difference for families in our community...",
      variables: null,
      isActive: true
    },
    {
      campaignId: createdCampaign.id,
      stepNumber: 2,
      delayDays: 7,
      // 7 days after first donation
      delayHours: 0,
      templateId: null,
      subject: "You helped Maria's family learn to read together",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your impact in action, {{firstName}}</h2>
          
          <p>Last week, your gift helped Maria and her 6-year-old daughter attend our family literacy program.</p>
          
          <p><strong>Maria's Story:</strong></p>
          <p>"I came to this country with big dreams but couldn't read English. Now my daughter and I are learning together. She reads me bedtime stories in English!"</p>
          
          <p>This is the kind of transformation your gift makes possible.</p>
          
          <p><strong>Coming up:</strong> Next month, I'll share how our program is expanding to serve even more families.</p>
          
          <p>Thank you for being part of this,<br/>
          Julie</p>
        </div>
      `,
      textContent: "Last week, your gift helped Maria and her 6-year-old daughter attend our family literacy program...",
      variables: null,
      isActive: true
    },
    {
      campaignId: createdCampaign.id,
      stepNumber: 3,
      delayDays: 30,
      // 30 days after first donation
      delayHours: 0,
      templateId: null,
      subject: "30 days of impact: Here's what you've made possible",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>One month of transformation, {{firstName}}</h2>
          
          <p>It's been 30 days since you joined our mission. Here's the impact donors like you made this month:</p>
          
          <ul>
            <li><strong>47 families</strong> participated in our literacy programs</li>
            <li><strong>89 children</strong> improved their reading levels</li>
            <li><strong>23 parents</strong> gained job-ready English skills</li>
          </ul>
          
          <p><strong>Would you consider joining our monthly giving community?</strong></p>
          <p>For just $25/month, you can ensure families receive consistent support throughout their learning journey.</p>
          
          <a href="{{donationUrl}}" style="display: inline-block; background: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Become a Monthly Partner</a>
          
          <p>With gratitude,<br/>
          Julie</p>
        </div>
      `,
      textContent: "It's been 30 days since you joined our mission...",
      variables: null,
      isActive: true
    },
    {
      campaignId: createdCampaign.id,
      stepNumber: 4,
      delayDays: 60,
      // 60 days after first donation
      delayHours: 0,
      templateId: null,
      subject: "The ripple effect: Your gift is still making waves",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Two months later, {{firstName}}</h2>
          
          <p>Remember Maria from my last email? Her daughter just won a reading competition at her school.</p>
          
          <p>That's the ripple effect of your generosity.</p>
          
          <p><strong>Your 2-month impact report:</strong></p>
          <ul>
            <li>Your gift has touched <strong>6 families</strong> directly</li>
            <li>Those families have shared their new skills with <strong>24 neighbors</strong></li>
            <li>The community is seeing <strong>measurable improvements</strong> in family engagement</li>
          </ul>
          
          <p><strong>What's next?</strong> We're planning a special community celebration in 4 months. I'd love for you to attend and meet the families you're helping.</p>
          
          <p>I'll send you an invitation as we get closer.</p>
          
          <p>With deep appreciation,<br/>
          Julie</p>
        </div>
      `,
      textContent: "Remember Maria from my last email? Her daughter just won a reading competition...",
      variables: null,
      isActive: true
    },
    {
      campaignId: createdCampaign.id,
      stepNumber: 5,
      delayDays: 180,
      // 180 days (6 months) after first donation
      delayHours: 0,
      templateId: null,
      subject: "6 months of transformation - Invitation inside \u2728",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Six months of changing lives, {{firstName}}</h2>
          
          <p>Half a year ago, you made your first gift to our family literacy program.</p>
          
          <p><strong>Since then:</strong></p>
          <ul>
            <li>94 families graduated from our program</li>
            <li>67% of participants got better jobs or promotions</li>
            <li>Children's reading levels improved by an average of 2.3 grade levels</li>
          </ul>
          
          <p>You helped make this happen.</p>
          
          <p><strong>SPECIAL INVITATION:</strong> Join us for our "Celebrating Families" graduation ceremony. Meet Maria, hear success stories, and see the impact of your generosity firsthand.</p>
          
          <a href="{{donationUrl}}" style="display: inline-block; background: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">RSVP for Celebration</a>
          
          <p><strong>Looking forward:</strong> Would you consider a year-end gift to help us serve even more families in 2025?</p>
          
          <p>Your partnership means the world to us.</p>
          
          <p>With immense gratitude,<br/>
          Julie & The Entire Family Learning Team</p>
        </div>
      `,
      textContent: "Six months ago, you made your first gift to our family literacy program...",
      variables: null,
      isActive: true
    }
  ];
  await db.insert(emailSequenceSteps).values(steps);
  console.log(`[GraduationPath] Created ${steps.length} sequence steps`);
  console.log("[GraduationPath] Setup complete!");
  return createdCampaign;
}
async function enrollInGraduationPath(leadId) {
  const [campaign] = await db.select().from(emailCampaigns).where(eq8(emailCampaigns.name, "Graduation Path - New Donor Journey"));
  if (!campaign) {
    console.error("[GraduationPath] Campaign not found! Run createGraduationPathCampaign() first.");
    return;
  }
  const [existing] = await db.select().from(emailCampaignEnrollments).where(
    and9(
      eq8(emailCampaignEnrollments.leadId, leadId),
      eq8(emailCampaignEnrollments.campaignId, campaign.id)
    )
  );
  if (existing) {
    console.log(`[GraduationPath] Lead ${leadId} already enrolled, skipping`);
    return;
  }
  await db.insert(emailCampaignEnrollments).values({
    campaignId: campaign.id,
    leadId,
    status: "active",
    currentStepNumber: 0,
    enrolledAt: /* @__PURE__ */ new Date()
  });
  console.log(`[GraduationPath] Successfully enrolled lead ${leadId} in graduation path`);
}
async function backfillGraduationPathEnrollments() {
  console.log("[GraduationPath] Starting backfill of graduation path enrollments...");
  const leadsWithDonations = await db.select({ id: leads.id }).from(leads).innerJoin(
    donations2,
    eq8(leads.id, donations2.leadId)
  ).groupBy(leads.id);
  let enrolled = 0;
  for (const lead of leadsWithDonations) {
    try {
      await enrollInGraduationPath(lead.id);
      enrolled++;
    } catch (error) {
      console.error(`[GraduationPath] Failed to enroll lead ${lead.id}:`, error);
    }
  }
  console.log(`[GraduationPath] Backfill complete: ${enrolled} leads enrolled`);
  return enrolled;
}
var init_graduationPathCampaign = __esm({
  "server/services/graduationPathCampaign.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/services/emailReportScheduler.ts
var emailReportScheduler_exports = {};
__export(emailReportScheduler_exports, {
  computeInitialNextRun: () => computeInitialNextRun,
  executeScheduleNow: () => executeScheduleNow,
  initEmailReportScheduler: () => initEmailReportScheduler,
  poll: () => poll,
  shutdownEmailReportScheduler: () => shutdownEmailReportScheduler
});
import { add, set, subDays, format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import sgMail3 from "@sendgrid/mail";
function initEmailReportScheduler() {
  console.log("[EmailReportScheduler] Initializing email report scheduler...");
  poll().catch((error) => {
    console.error("[EmailReportScheduler] Initial poll failed:", error);
  });
  intervalHandle = setInterval(() => {
    poll().catch((error) => {
      console.error("[EmailReportScheduler] Poll failed:", error);
    });
  }, POLL_INTERVAL_MS);
  console.log("[EmailReportScheduler] Scheduler initialized (polling every 5 minutes)");
}
async function shutdownEmailReportScheduler() {
  console.log("[EmailReportScheduler] Shutting down email report scheduler...");
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  const shutdownTimeout = setTimeout(() => {
    console.warn("[EmailReportScheduler] Shutdown timeout - force closing");
  }, 3e4);
  while (isRunning) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  clearTimeout(shutdownTimeout);
  console.log("[EmailReportScheduler] Scheduler shutdown complete");
}
async function poll() {
  if (isRunning) {
    console.log("[EmailReportScheduler] Poll already running, skipping...");
    return;
  }
  isRunning = true;
  try {
    const schedules = await storage.getSchedulesDueForExecution();
    if (schedules.length === 0) {
      return;
    }
    console.log(`[EmailReportScheduler] Found ${schedules.length} due schedule(s)`);
    for (const schedule of schedules) {
      await executeSchedule(schedule);
    }
  } catch (error) {
    console.error("[EmailReportScheduler] Poll error:", error);
  } finally {
    isRunning = false;
  }
}
async function executeSchedule(schedule) {
  console.log(`[EmailReportScheduler] Executing schedule ${schedule.id} (${schedule.name})`);
  const now = /* @__PURE__ */ new Date();
  try {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.warn(`[EmailReportScheduler] Schedule ${schedule.id} skipped: SendGrid not configured (will retry on next poll)`);
      return;
    }
    const reportData = await generateReportData(schedule.reportType, schedule.frequency);
    const { subject, html } = formatReportEmail(schedule, reportData);
    const recipients = schedule.recipients;
    await sgMail3.send({
      to: recipients,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html
    });
    console.log(`[EmailReportScheduler] Report sent to ${recipients.length} recipient(s)`);
    const nextRun = computeNextRun(schedule, now);
    await storage.updateEmailReportSchedule(schedule.id, {
      lastRunAt: now,
      nextRunAt: nextRun
    });
    console.log(`[EmailReportScheduler] Schedule ${schedule.id} completed. Next run: ${nextRun.toISOString()}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[EmailReportScheduler] Schedule ${schedule.id} failed:`, errorMessage);
    const nextRun = computeNextRun(schedule, now);
    await storage.updateEmailReportSchedule(schedule.id, {
      lastRunAt: now,
      nextRunAt: nextRun
    });
  }
}
async function generateReportData(reportType, frequency) {
  const now = /* @__PURE__ */ new Date();
  let dateFrom;
  switch (frequency) {
    case "daily":
      dateFrom = subDays(now, 1);
      break;
    case "weekly":
      dateFrom = subDays(now, 7);
      break;
    case "monthly":
      dateFrom = subDays(now, 30);
      break;
    default:
      dateFrom = subDays(now, 7);
  }
  const dateTo = now;
  const campaigns = await storage.getAllEmailCampaigns();
  const campaignStats = await Promise.all(
    campaigns.map(async (campaign) => {
      const performance = await storage.getEmailCampaignPerformance(campaign.id);
      return {
        name: campaign.name,
        ...performance
      };
    })
  );
  const activeCampaigns = campaignStats.filter(
    (stat) => stat.totalSent > 0 && stat.lastSentAt && new Date(stat.lastSentAt) >= dateFrom
  );
  switch (reportType) {
    case "campaign_summary":
      return {
        type: "campaign_summary",
        dateRange: { from: dateFrom, to: dateTo },
        campaigns: activeCampaigns,
        summary: {
          totalCampaigns: activeCampaigns.length,
          totalSent: activeCampaigns.reduce((sum2, c) => sum2 + c.totalSent, 0),
          totalOpens: activeCampaigns.reduce((sum2, c) => sum2 + c.totalOpens, 0),
          totalClicks: activeCampaigns.reduce((sum2, c) => sum2 + c.totalClicks, 0),
          avgOpenRate: activeCampaigns.length > 0 ? activeCampaigns.reduce((sum2, c) => sum2 + c.openRate, 0) / activeCampaigns.length : 0,
          avgClickRate: activeCampaigns.length > 0 ? activeCampaigns.reduce((sum2, c) => sum2 + c.clickRate, 0) / activeCampaigns.length : 0
        }
      };
    case "engagement_summary":
      const recentLogs = await storage.getRecentEmailLogs(100);
      const uniqueLeads = new Set(recentLogs.map((log2) => log2.leadId).filter(Boolean));
      return {
        type: "engagement_summary",
        dateRange: { from: dateFrom, to: dateTo },
        summary: {
          totalLeadsEmailed: uniqueLeads.size,
          totalEmailsSent: recentLogs.length,
          engagedLeads: recentLogs.filter((log2) => log2.openedAt || log2.clickedAt).length
        }
      };
    case "full_analytics":
      const recentEmailLogs = await storage.getRecentEmailLogs(100);
      const uniqueLeadsEmailed = new Set(recentEmailLogs.map((log2) => log2.leadId).filter(Boolean));
      return {
        type: "full_analytics",
        dateRange: { from: dateFrom, to: dateTo },
        campaigns: activeCampaigns,
        summary: {
          // Campaign metrics
          totalCampaigns: activeCampaigns.length,
          totalSent: activeCampaigns.reduce((sum2, c) => sum2 + c.totalSent, 0),
          totalOpens: activeCampaigns.reduce((sum2, c) => sum2 + c.totalOpens, 0),
          totalClicks: activeCampaigns.reduce((sum2, c) => sum2 + c.totalClicks, 0),
          avgOpenRate: activeCampaigns.length > 0 ? activeCampaigns.reduce((sum2, c) => sum2 + c.openRate, 0) / activeCampaigns.length : 0,
          avgClickRate: activeCampaigns.length > 0 ? activeCampaigns.reduce((sum2, c) => sum2 + c.clickRate, 0) / activeCampaigns.length : 0,
          // Engagement metrics
          totalLeadsEmailed: uniqueLeadsEmailed.size,
          totalEmailsSent: recentEmailLogs.length
        }
      };
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}
function formatReportEmail(schedule, reportData) {
  const { type, dateRange, campaigns, summary } = reportData;
  const dateStr = `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`;
  let subject = `${schedule.name} - ${dateStr}`;
  let html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; font-size: 24px; margin-bottom: 10px; }
          h2 { color: #1e40af; font-size: 20px; margin-top: 30px; margin-bottom: 15px; }
          .metric { background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 8px; }
          .metric-label { font-size: 14px; color: #6b7280; margin-bottom: 5px; }
          .metric-value { font-size: 28px; font-weight: bold; color: #1f2937; }
          .campaign { background: #fff; border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 8px; }
          .campaign-name { font-weight: bold; color: #1f2937; margin-bottom: 8px; }
          .campaign-stats { font-size: 14px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; color: #374151; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${schedule.name}</h1>
          <p style="color: #6b7280; margin-bottom: 30px;">${dateStr}</p>
  `;
  if (type === "campaign_summary" || type === "full_analytics") {
    html += `
          <h2>Campaign Performance Summary</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="metric">
              <div class="metric-label">Total Campaigns</div>
              <div class="metric-value">${summary.totalCampaigns}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Total Sent</div>
              <div class="metric-value">${summary.totalSent.toLocaleString()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Total Opens</div>
              <div class="metric-value">${summary.totalOpens.toLocaleString()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Total Clicks</div>
              <div class="metric-value">${summary.totalClicks.toLocaleString()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Avg Open Rate</div>
              <div class="metric-value">${(summary.avgOpenRate * 100).toFixed(1)}%</div>
            </div>
            <div class="metric">
              <div class="metric-label">Avg Click Rate</div>
              <div class="metric-value">${(summary.avgClickRate * 100).toFixed(1)}%</div>
            </div>
          </div>
    `;
    if (campaigns && campaigns.length > 0) {
      html += `
          <h2>Campaign Details</h2>
      `;
      campaigns.slice(0, 10).forEach((campaign) => {
        html += `
          <div class="campaign">
            <div class="campaign-name">${campaign.name}</div>
            <div class="campaign-stats">
              ${campaign.totalSent} sent \u2022 
              ${campaign.totalOpens} opens (${(campaign.openRate * 100).toFixed(1)}%) \u2022 
              ${campaign.totalClicks} clicks (${(campaign.clickRate * 100).toFixed(1)}%)
            </div>
          </div>
        `;
      });
      if (campaigns.length > 10) {
        html += `<p style="color: #6b7280; font-size: 14px; margin-top: 10px;">+ ${campaigns.length - 10} more campaigns</p>`;
      }
    }
  }
  if (type === "engagement_summary" || type === "full_analytics") {
    html += `
          <h2>Engagement Summary</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="metric">
              <div class="metric-label">Leads Emailed</div>
              <div class="metric-value">${summary.totalLeadsEmailed?.toLocaleString() || 0}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Emails Sent</div>
              <div class="metric-value">${summary.totalEmailsSent?.toLocaleString() || 0}</div>
            </div>
          </div>
    `;
  }
  html += `
          <div class="footer">
            <p>This is an automated email report from Julie's Family Learning Program.</p>
            <p>Report Schedule: ${schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)}</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return { subject, html };
}
function computeNextRun(schedule, currentTime) {
  try {
    const zonedNow = toZonedTime(currentTime, TIMEZONE);
    let configuredHour = 8;
    let configuredMinute = 0;
    let configuredDayOfWeek = 1;
    let configuredDayOfMonth = 1;
    if (schedule.nextRunAt) {
      const zonedNextRun = toZonedTime(new Date(schedule.nextRunAt), TIMEZONE);
      configuredHour = zonedNextRun.getHours();
      configuredMinute = zonedNextRun.getMinutes();
      configuredDayOfWeek = zonedNextRun.getDay();
      configuredDayOfMonth = zonedNextRun.getDate();
    }
    let nextZonedRun;
    switch (schedule.frequency) {
      case "daily":
        nextZonedRun = set(zonedNow, {
          hours: configuredHour,
          minutes: configuredMinute,
          seconds: 0,
          milliseconds: 0
        });
        if (nextZonedRun <= zonedNow) {
          nextZonedRun = add(nextZonedRun, { days: 1 });
        }
        break;
      case "weekly":
        const currentDay = zonedNow.getDay();
        nextZonedRun = set(zonedNow, {
          hours: configuredHour,
          minutes: configuredMinute,
          seconds: 0,
          milliseconds: 0
        });
        let daysUntilTarget = configuredDayOfWeek - currentDay;
        if (daysUntilTarget < 0 || daysUntilTarget === 0 && nextZonedRun <= zonedNow) {
          daysUntilTarget += 7;
        }
        nextZonedRun = add(nextZonedRun, { days: daysUntilTarget });
        break;
      case "monthly":
        nextZonedRun = set(zonedNow, {
          date: 1,
          // Start at first of month
          hours: configuredHour,
          minutes: configuredMinute,
          seconds: 0,
          milliseconds: 0
        });
        const lastDayOfMonth = new Date(
          nextZonedRun.getFullYear(),
          nextZonedRun.getMonth() + 1,
          0
        ).getDate();
        const actualDay = Math.min(configuredDayOfMonth, lastDayOfMonth);
        nextZonedRun.setDate(actualDay);
        if (nextZonedRun <= zonedNow) {
          nextZonedRun = add(nextZonedRun, { months: 1 });
          const newLastDay = new Date(
            nextZonedRun.getFullYear(),
            nextZonedRun.getMonth() + 1,
            0
          ).getDate();
          const newActualDay = Math.min(configuredDayOfMonth, newLastDay);
          nextZonedRun.setDate(newActualDay);
        }
        break;
      default:
        console.warn(`[EmailReportScheduler] Unknown frequency: ${schedule.frequency}, using daily fallback`);
        nextZonedRun = add(zonedNow, { days: 1 });
    }
    const nextRunUtc = fromZonedTime(nextZonedRun, TIMEZONE);
    return nextRunUtc;
  } catch (error) {
    console.error("[EmailReportScheduler] Error computing next run:", error);
    return add(currentTime, { days: 1 });
  }
}
function computeInitialNextRun(frequency, referenceDate = /* @__PURE__ */ new Date()) {
  try {
    const zonedNow = toZonedTime(referenceDate, TIMEZONE);
    let nextZonedRun;
    switch (frequency) {
      case "daily":
        nextZonedRun = set(zonedNow, {
          hours: 8,
          minutes: 0,
          seconds: 0,
          milliseconds: 0
        });
        if (nextZonedRun <= zonedNow) {
          nextZonedRun = add(nextZonedRun, { days: 1 });
        }
        break;
      case "weekly":
        const targetDay = 1;
        const currentDay = zonedNow.getDay();
        nextZonedRun = set(zonedNow, {
          hours: 8,
          minutes: 0,
          seconds: 0,
          milliseconds: 0
        });
        let daysUntilMonday = targetDay - currentDay;
        if (daysUntilMonday <= 0) {
          daysUntilMonday += 7;
        }
        nextZonedRun = add(nextZonedRun, { days: daysUntilMonday });
        break;
      case "monthly":
        nextZonedRun = set(zonedNow, {
          date: 1,
          hours: 8,
          minutes: 0,
          seconds: 0,
          milliseconds: 0
        });
        nextZonedRun = add(nextZonedRun, { months: 1 });
        break;
      default:
        console.warn(`[EmailReportScheduler] Unknown frequency: ${frequency}, using daily fallback`);
        nextZonedRun = add(set(zonedNow, { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 }), { days: 1 });
    }
    const nextRunUtc = fromZonedTime(nextZonedRun, TIMEZONE);
    return nextRunUtc;
  } catch (error) {
    console.error("[EmailReportScheduler] Error computing initial next run:", error);
    return add(set(referenceDate, { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 }), { days: 1 });
  }
}
async function executeScheduleNow(scheduleId, actorId) {
  console.log(`[EmailReportScheduler] Manual execution requested for schedule ${scheduleId} by actor ${actorId || "unknown"}`);
  const schedule = await storage.getEmailReportSchedule(scheduleId);
  if (!schedule) {
    throw new Error(`Schedule ${scheduleId} not found`);
  }
  await executeSchedule(schedule);
  console.log(`[EmailReportScheduler] Manual execution completed for schedule ${scheduleId}`);
}
var POLL_INTERVAL_MS, MAX_EXECUTION_TIME_MS, TIMEZONE, intervalHandle, isRunning;
var init_emailReportScheduler = __esm({
  "server/services/emailReportScheduler.ts"() {
    "use strict";
    init_storage();
    POLL_INTERVAL_MS = 5 * 60 * 1e3;
    MAX_EXECUTION_TIME_MS = 30 * 60 * 1e3;
    TIMEZONE = "America/New_York";
    intervalHandle = null;
    isRunning = false;
    if (process.env.SENDGRID_API_KEY) {
      sgMail3.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }
});

// server/utils/smsUnsubscribeToken.ts
var smsUnsubscribeToken_exports = {};
__export(smsUnsubscribeToken_exports, {
  generateSmsUnsubscribeToken: () => generateSmsUnsubscribeToken,
  generateSmsUnsubscribeUrl: () => generateSmsUnsubscribeUrl,
  verifySmsUnsubscribeToken: () => verifySmsUnsubscribeToken
});
import crypto2 from "crypto";
function getSecretKey2() {
  const SECRET_KEY = process.env.UNSUBSCRIBE_SECRET;
  if (!SECRET_KEY) {
    throw new Error(
      "UNSUBSCRIBE_SECRET environment variable is required for secure token generation. Generate one with: openssl rand -base64 32"
    );
  }
  return SECRET_KEY;
}
function generateSmsUnsubscribeToken(phone) {
  const SECRET_KEY = getSecretKey2();
  const normalizedPhone = phone.trim();
  const timestamp2 = Date.now().toString();
  const message = `${normalizedPhone}:${timestamp2}`;
  const signature = crypto2.createHmac("sha256", SECRET_KEY).update(message).digest("hex");
  const tokenData = `${message}:${signature}`;
  return Buffer.from(tokenData).toString("base64url");
}
function verifySmsUnsubscribeToken(token) {
  try {
    const SECRET_KEY = getSecretKey2();
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) {
      return null;
    }
    const [phone, timestamp2, receivedSignature] = parts;
    const tokenAge = Date.now() - parseInt(timestamp2, 10);
    const maxAge = 60 * 24 * 60 * 60 * 1e3;
    if (tokenAge > maxAge) {
      console.warn("[SMS Unsubscribe] Token expired:", { phone, age: Math.floor(tokenAge / (24 * 60 * 60 * 1e3)) + " days" });
      return null;
    }
    const message = `${phone}:${timestamp2}`;
    const expectedSignature = crypto2.createHmac("sha256", SECRET_KEY).update(message).digest("hex");
    const receivedBuffer = Buffer.from(receivedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (receivedBuffer.length !== expectedBuffer.length) {
      return null;
    }
    if (!crypto2.timingSafeEqual(receivedBuffer, expectedBuffer)) {
      console.warn("[SMS Unsubscribe] Invalid signature for phone:", phone);
      return null;
    }
    return phone.trim();
  } catch (error) {
    console.error("[SMS Unsubscribe] Token verification failed:", error);
    return null;
  }
}
function generateSmsUnsubscribeUrl(phone, baseUrl) {
  const token = generateSmsUnsubscribeToken(phone);
  const base = baseUrl || process.env.BASE_URL || process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000";
  return `${base.startsWith("http") ? base : "https://" + base}/sms-unsubscribe?token=${token}`;
}
var init_smsUnsubscribeToken = __esm({
  "server/utils/smsUnsubscribeToken.ts"() {
    "use strict";
  }
});

// server/bulkSmsSender.ts
var bulkSmsSender_exports = {};
__export(bulkSmsSender_exports, {
  processBulkSmsCampaign: () => processBulkSmsCampaign
});
import { eq as eq9, and as and10, sql as sql10 } from "drizzle-orm";
async function processBulkSmsCampaign(campaignId) {
  console.log(`[BulkSmsSender] Starting campaign ${campaignId}`);
  const result = {
    success: false,
    sentCount: 0,
    blockedCount: 0,
    failedCount: 0,
    errors: []
  };
  let eligibleLeadsTotal = 0;
  let lastProcessedIndex = 0;
  let campaignAcquired = false;
  try {
    const [campaign] = await db.select().from(smsBulkCampaigns2).where(eq9(smsBulkCampaigns2.id, campaignId));
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    if (campaign.status === "processing") {
      console.log(`[BulkSmsSender] Campaign ${campaignId} is already being processed, skipping`);
      return {
        success: false,
        sentCount: 0,
        blockedCount: 0,
        failedCount: 0,
        errors: ["Campaign is already being processed by another worker"]
      };
    }
    if (campaign.status === "completed") {
      console.log(`[BulkSmsSender] Campaign ${campaignId} is already completed, skipping`);
      return {
        success: true,
        sentCount: 0,
        blockedCount: 0,
        failedCount: 0,
        errors: []
      };
    }
    const updateResult = await db.update(smsBulkCampaigns2).set({ status: "processing" }).where(and10(
      eq9(smsBulkCampaigns2.id, campaignId),
      eq9(smsBulkCampaigns2.status, "pending")
      // Compare-and-set
    )).returning({ id: smsBulkCampaigns2.id });
    if (!updateResult || updateResult.length === 0) {
      console.log(`[BulkSmsSender] Campaign ${campaignId} claimed by another worker, skipping`);
      return {
        success: false,
        sentCount: 0,
        blockedCount: 0,
        failedCount: 0,
        errors: ["Campaign claimed by another worker"]
      };
    }
    campaignAcquired = true;
    let messageContent;
    let template;
    if (campaign.templateId) {
      const [tmpl] = await db.select().from(smsTemplates).where(eq9(smsTemplates.id, campaign.templateId));
      if (!tmpl) {
        throw new Error(`Template ${campaign.templateId} not found`);
      }
      template = tmpl;
      messageContent = template.messageTemplate;
    } else if (campaign.customMessage) {
      messageContent = campaign.customMessage;
    } else {
      throw new Error("Campaign has no template or custom message");
    }
    const conditions = [];
    conditions.push(sql10`${leads.phone} IS NOT NULL`);
    if (campaign.personaFilter) {
      conditions.push(eq9(leads.persona, campaign.personaFilter));
    }
    if (campaign.funnelStageFilter) {
      conditions.push(eq9(leads.funnelStage, campaign.funnelStageFilter));
    }
    const eligibleLeads = await db.select().from(leads).where(
      and10(
        ...conditions,
        sql10`NOT EXISTS (
            SELECT 1 FROM ${emailUnsubscribes}
            WHERE ${emailUnsubscribes.phone} = ${leads.phone}
            AND ${emailUnsubscribes.isActive} = true
            AND (${emailUnsubscribes.channel} = 'sms' OR ${emailUnsubscribes.channel} = 'all')
          )`
      )
    );
    eligibleLeadsTotal = eligibleLeads.length;
    console.log(`[BulkSmsSender] Found ${eligibleLeadsTotal} eligible leads`);
    const BATCH_SIZE = 50;
    const BATCH_DELAY_MS = 6e4;
    for (let i = 0; i < eligibleLeads.length; i += BATCH_SIZE) {
      const batch = eligibleLeads.slice(i, i + BATCH_SIZE);
      lastProcessedIndex = i + batch.length;
      console.log(`[BulkSmsSender] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(eligibleLeads.length / BATCH_SIZE)}`);
      for (const lead of batch) {
        try {
          const sendResult = await sendSmsToLead(lead, messageContent, campaign, template);
          if (sendResult.blocked) {
            result.blockedCount++;
          } else if (sendResult.success) {
            result.sentCount++;
          } else {
            result.failedCount++;
            result.errors.push(`${lead.phone}: ${sendResult.error || "Unknown error"}`);
          }
          await delay(1e3);
        } catch (error) {
          console.error(`[BulkSmsSender] Failed to send to ${lead.phone}:`, error.message);
          result.failedCount++;
          result.errors.push(`${lead.phone}: ${error.message}`);
          try {
            const errorMessage = error.message || "Unknown error";
            await db.insert(smsSends).values({
              templateId: template?.id || null,
              leadId: lead.id,
              campaignId: campaign.id,
              recipientPhone: lead.phone || "",
              recipientName: lead.firstName ? `${lead.firstName} ${lead.lastName || ""}`.trim() : null,
              messageContent,
              status: "failed",
              smsProvider: "twilio",
              errorMessage,
              metadata: { campaignId: campaign.id, exception: errorMessage },
              sentAt: null
            });
            await db.insert(communicationLogs).values({
              leadId: lead.id,
              type: "sms",
              direction: "outbound",
              subject: "Bulk SMS Campaign",
              body: messageContent,
              sentAt: null,
              status: "failed",
              metadata: {
                campaignId: campaign.id,
                templateId: template?.id,
                error: errorMessage,
                exception: true
              }
            });
          } catch (auditError) {
            console.error(`[BulkSmsSender] Failed to persist audit trail:`, auditError.message);
          }
        }
      }
      const [currentCampaign] = await db.select({ metadata: smsBulkCampaigns2.metadata }).from(smsBulkCampaigns2).where(eq9(smsBulkCampaigns2.id, campaignId));
      const existingMetadata = currentCampaign?.metadata || {};
      const updatedMetadata = {
        ...existingMetadata,
        progress: {
          processed: i + batch.length,
          total: eligibleLeads.length,
          nextIndex: i + batch.length,
          // Resume pointer for retries
          sentCount: result.sentCount,
          blockedCount: result.blockedCount,
          failedCount: result.failedCount
        }
      };
      await db.update(smsBulkCampaigns2).set({
        sentCount: result.sentCount,
        blockedCount: result.blockedCount,
        failedCount: result.failedCount,
        metadata: updatedMetadata
      }).where(eq9(smsBulkCampaigns2.id, campaignId));
      if (i + BATCH_SIZE < eligibleLeads.length) {
        console.log(`[BulkSmsSender] Waiting ${BATCH_DELAY_MS}ms before next batch...`);
        await delay(BATCH_DELAY_MS);
      }
    }
    await db.update(smsBulkCampaigns2).set({
      status: "completed",
      sentCount: result.sentCount,
      blockedCount: result.blockedCount,
      failedCount: result.failedCount,
      errorSummary: result.errors.length > 0 ? result.errors.join("; ").slice(0, 500) : null
    }).where(eq9(smsBulkCampaigns2.id, campaignId));
    result.success = true;
    console.log(`[BulkSmsSender] Campaign completed: ${result.sentCount} sent, ${result.blockedCount} blocked, ${result.failedCount} failed`);
  } catch (error) {
    console.error(`[BulkSmsSender] Campaign failed:`, error);
    if (campaignAcquired) {
      const [currentCampaign] = await db.select({ metadata: smsBulkCampaigns2.metadata }).from(smsBulkCampaigns2).where(eq9(smsBulkCampaigns2.id, campaignId));
      const existingMetadata = currentCampaign?.metadata || {};
      const failureMetadata = {
        ...existingMetadata,
        progress: {
          processed: result.sentCount + result.blockedCount + result.failedCount,
          total: eligibleLeadsTotal,
          nextIndex: lastProcessedIndex,
          // Resume pointer for retries
          sentCount: result.sentCount,
          blockedCount: result.blockedCount,
          failedCount: result.failedCount
        },
        failure: {
          error: error.message,
          failedAt: (/* @__PURE__ */ new Date()).toISOString(),
          resumable: true
        }
      };
      await db.update(smsBulkCampaigns2).set({
        status: "failed",
        sentCount: result.sentCount,
        blockedCount: result.blockedCount,
        failedCount: result.failedCount,
        errorSummary: error.message.slice(0, 500),
        metadata: failureMetadata
      }).where(eq9(smsBulkCampaigns2.id, campaignId));
    } else {
      console.log(`[BulkSmsSender] Campaign ${campaignId} not acquired by this worker, skipping error update`);
    }
    result.errors.push(error.message);
  }
  return result;
}
async function sendSmsToLead(lead, messageTemplate, campaign, template) {
  const { sendSMS: sendSMS3, replaceVariables: replaceVariables2 } = await Promise.resolve().then(() => (init_twilio(), twilio_exports));
  if (!lead.phone) {
    return { success: false, blocked: false, error: "Lead has no phone number" };
  }
  const variables = {
    firstName: lead.firstName || "there",
    lastName: lead.lastName || "",
    email: lead.email || "",
    phone: lead.phone,
    cityName: "",
    // No location field in leads schema
    link: "https://example.com",
    // TODO: Replace with actual link
    amount: "$50"
    // TODO: Replace with actual amount
  };
  const finalMessage = replaceVariables2(messageTemplate, variables);
  const twilioResult = await sendSMS3(lead.phone, finalMessage, {
    leadId: lead.id,
    templateId: template?.id,
    campaignId: campaign.id
  });
  const status = twilioResult.blocked ? "blocked" : twilioResult.success ? "sent" : "failed";
  await db.insert(smsSends).values({
    templateId: template?.id || null,
    leadId: lead.id,
    campaignId: campaign.id,
    recipientPhone: lead.phone,
    recipientName: lead.firstName ? `${lead.firstName} ${lead.lastName || ""}`.trim() : null,
    messageContent: finalMessage,
    status,
    smsProvider: "twilio",
    providerMessageId: twilioResult.messageId || null,
    errorMessage: twilioResult.error || null,
    metadata: { variables, campaignId: campaign.id },
    sentAt: twilioResult.success ? /* @__PURE__ */ new Date() : null
  });
  await db.insert(communicationLogs).values({
    leadId: lead.id,
    type: "sms",
    direction: "outbound",
    subject: "Bulk SMS Campaign",
    body: finalMessage,
    sentAt: twilioResult.success ? /* @__PURE__ */ new Date() : null,
    status: twilioResult.success ? "sent" : twilioResult.blocked ? "blocked" : "failed",
    metadata: {
      campaignId: campaign.id,
      templateId: template?.id,
      messageId: twilioResult.messageId,
      blocked: twilioResult.blocked,
      error: twilioResult.error
    }
  });
  return {
    success: twilioResult.success,
    blocked: twilioResult.blocked || false,
    error: twilioResult.error
  };
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
var init_bulkSmsSender = __esm({
  "server/bulkSmsSender.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/emailPersonalizer.ts
var emailPersonalizer_exports = {};
__export(emailPersonalizer_exports, {
  generateVariablesSuggestions: () => generateVariablesSuggestions,
  personalizeEmailTemplate: () => personalizeEmailTemplate
});
import { GoogleGenAI as GoogleGenAI4 } from "@google/genai";
async function personalizeEmailTemplate(context) {
  const { lead, recentInteractions, template } = context;
  if (!genAI4) {
    console.warn("GOOGLE_API_KEY not available, using basic variable replacement");
    return basicPersonalization(lead, template);
  }
  const prompt = buildPersonalizationPrompt(lead, recentInteractions, template);
  try {
    const result = await genAI4.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });
    const responseText = result.response?.text() || result.text || "";
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, "");
    cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
    cleanedResponse = cleanedResponse.trim();
    if (!cleanedResponse) {
      console.error("Empty response from Gemini AI");
      return basicPersonalization(lead, template);
    }
    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.error("Response was:", cleanedResponse.substring(0, 200));
      return basicPersonalization(lead, template);
    }
    if (!parsed.subject || !parsed.htmlBody || !parsed.textBody) {
      console.error("Gemini response missing required fields");
      return basicPersonalization(lead, template);
    }
    return {
      subject: parsed.subject,
      htmlBody: parsed.htmlBody,
      textBody: parsed.textBody,
      suggestedVariables: parsed.suggestedVariables || {},
      personalizationNotes: parsed.personalizationNotes || "AI personalization applied"
    };
  } catch (error) {
    console.error("Failed to personalize email with Gemini:", error);
    console.log("Falling back to basic variable replacement");
    return basicPersonalization(lead, template);
  }
}
function basicPersonalization(lead, template) {
  const variables = generateVariablesSuggestionsSync(lead, template.variables);
  let subject = template.subject;
  let htmlBody = template.htmlBody;
  let textBody = template.textBody;
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    subject = subject.replace(new RegExp(placeholder, "g"), value);
    htmlBody = htmlBody.replace(new RegExp(placeholder, "g"), value);
    textBody = textBody.replace(new RegExp(placeholder, "g"), value);
  });
  return {
    subject,
    htmlBody,
    textBody,
    suggestedVariables: variables,
    personalizationNotes: "Basic variable replacement applied (AI personalization unavailable)"
  };
}
function generateVariablesSuggestionsSync(lead, templateVariables) {
  const suggestions = {};
  if (templateVariables.includes("firstName")) {
    suggestions.firstName = lead.firstName || "there";
  }
  if (templateVariables.includes("lastName")) {
    suggestions.lastName = lead.lastName || "";
  }
  if (templateVariables.includes("email")) {
    suggestions.email = lead.email;
  }
  if (lead.persona === "parent" && templateVariables.includes("childName")) {
    const metadata = lead.metadata;
    suggestions.childName = metadata?.childName || "your child";
  }
  if (lead.persona === "student" && templateVariables.includes("careerField")) {
    const metadata = lead.metadata;
    suggestions.careerField = metadata?.careerInterest || "your field";
  }
  if (lead.persona === "donor" && templateVariables.includes("companyName")) {
    const metadata = lead.metadata;
    suggestions.companyName = metadata?.companyName || "your organization";
  }
  if (templateVariables.includes("monthsSince") && lead.lastInteractionDate) {
    const months = Math.floor((Date.now() - new Date(lead.lastInteractionDate).getTime()) / (1e3 * 60 * 60 * 24 * 30));
    suggestions.monthsSince = Math.max(1, months).toString();
  }
  if (templateVariables.includes("cityName")) {
    const metadata = lead.metadata;
    suggestions.cityName = metadata?.city || "your area";
  }
  templateVariables.forEach((varName) => {
    if (!suggestions[varName]) {
      suggestions[varName] = `[${varName}]`;
    }
  });
  return suggestions;
}
function buildPersonalizationPrompt(lead, recentInteractions, template) {
  const interactionSummary = recentInteractions && recentInteractions.length > 0 ? recentInteractions.map((i) => `- ${i.interactionType}: ${i.contentEngaged || "N/A"} (${new Date(i.createdAt).toLocaleDateString()})`).join("\n") : "No recent interactions recorded";
  const lastInteractionDate = lead.lastInteractionDate ? new Date(lead.lastInteractionDate).toLocaleDateString() : "Never";
  const daysSinceLastInteraction = lead.lastInteractionDate ? Math.floor((Date.now() - new Date(lead.lastInteractionDate).getTime()) / (1e3 * 60 * 60 * 24)) : null;
  return `You are an expert email copywriter trained in Alex Hormozi's "$100M Leads" communication strategies.

**Your Task**: Personalize this email template for a specific recipient using their CRM data.

**Template Information**:
- Template Name: ${template.name}
- Outreach Type: ${template.outreachType}
- Template Category: ${template.templateCategory}
- Description: ${template.description}
- Example Context: ${template.exampleContext}

**Recipient CRM Data**:
- Name: ${lead.firstName || "Unknown"} ${lead.lastName || ""}
- Email: ${lead.email}
- Persona: ${lead.persona} (their role/interest)
- Journey Stage: ${lead.funnelStage}
- Lead Source: ${lead.leadSource || "Unknown"}
- Engagement Score: ${lead.engagementScore || 0}/100
- Last Interaction: ${lastInteractionDate}${daysSinceLastInteraction !== null ? ` (${daysSinceLastInteraction} days ago)` : ""}
- Notes: ${lead.notes || "No notes available"}
- Metadata: ${lead.metadata ? JSON.stringify(lead.metadata) : "None"}

**Recent Interactions**:
${interactionSummary}

**Original Template Subject**:
${template.subject}

**Original Template Body (HTML)**:
${template.htmlBody}

**Available Variables**: ${template.variables.join(", ")}

**Personalization Instructions**:

1. **Analyze the CRM Data**: Look for specific details that can make this email feel personal and relevant:
   - Recent interactions (what they downloaded, forms they filled, events they attended)
   - How long since last contact
   - Their specific interests or concerns from notes/metadata
   - Their journey stage (awareness, consideration, decision, retention)
   - Their persona (student, provider, parent, donor, volunteer)

2. **Fill Template Variables Intelligently**:
   - Use real data from CRM when available
   - Make educated assumptions based on persona and context when data is missing
   - Keep the tone warm and conversational (this is Julie's nonprofit)
   - Follow Hormozi's frameworks: acknowledge, compliment, ask (A-C-A) OR lead with value

3. **Customize Beyond Variables**:
   - Reference specific interactions if relevant
   - Adjust urgency based on journey stage
   - Modify examples to match their persona
   - Add or remove sentences to better fit their specific situation

4. **Maintain Template Structure**:
   - Keep the core message and strategy of the original template
   - Don't change the fundamental outreach approach
   - Preserve the template category's intent (A-C-A, value-first, social proof, etc.)

5. **Output Requirements**:
   - Subject line should be compelling and personalized
   - Replace ALL {{variables}} with actual content
   - Make sure HTML and text versions match in content
   - Keep it conversational and genuine (Julie's voice: warm, helpful, not salesy)

**Return ONLY valid JSON in this exact format (no markdown, no code blocks)**:
{
  "subject": "Personalized subject line here",
  "htmlBody": "Complete HTML email body with all variables filled",
  "textBody": "Complete plain text email body with all variables filled",
  "suggestedVariables": {
    "firstName": "actual value used",
    "lastName": "actual value used",
    "anyOtherVariable": "actual value used"
  },
  "personalizationNotes": "Brief explanation of key personalizations made (2-3 sentences)"
}

**Important**:
- Be specific and concrete, not generic
- Use the person's actual name throughout
- Reference real data from their CRM record
- Make it feel like Julie personally wrote this email for them
- If critical data is missing for key variables, make reasonable assumptions based on context but note this in personalizationNotes`;
}
async function generateVariablesSuggestions(lead, templateVariables) {
  const suggestions = {};
  if (templateVariables.includes("firstName")) {
    suggestions.firstName = lead.firstName || "there";
  }
  if (templateVariables.includes("lastName")) {
    suggestions.lastName = lead.lastName || "";
  }
  if (templateVariables.includes("email")) {
    suggestions.email = lead.email;
  }
  if (lead.persona === "parent" && templateVariables.includes("childName")) {
    const metadata = lead.metadata;
    suggestions.childName = metadata?.childName || "your child";
  }
  if (lead.persona === "student" && templateVariables.includes("careerField")) {
    const metadata = lead.metadata;
    suggestions.careerField = metadata?.careerInterest || "your field";
  }
  if (lead.persona === "donor" && templateVariables.includes("companyName")) {
    const metadata = lead.metadata;
    suggestions.companyName = metadata?.companyName || "your organization";
  }
  if (templateVariables.includes("monthsSince") && lead.lastInteractionDate) {
    const months = Math.floor((Date.now() - new Date(lead.lastInteractionDate).getTime()) / (1e3 * 60 * 60 * 24 * 30));
    suggestions.monthsSince = Math.max(1, months).toString();
  }
  if (templateVariables.includes("cityName")) {
    const metadata = lead.metadata;
    suggestions.cityName = metadata?.city || "your area";
  }
  return suggestions;
}
var genAI4;
var init_emailPersonalizer = __esm({
  "server/emailPersonalizer.ts"() {
    "use strict";
    if (!process.env.GOOGLE_API_KEY) {
      console.warn("GOOGLE_API_KEY not configured - email personalization will fall back to basic variable replacement");
    }
    genAI4 = process.env.GOOGLE_API_KEY ? new GoogleGenAI4({ apiKey: process.env.GOOGLE_API_KEY }) : null;
  }
});

// server/smsPersonalizer.ts
var smsPersonalizer_exports = {};
__export(smsPersonalizer_exports, {
  generateVariablesSuggestions: () => generateVariablesSuggestions2,
  personalizeSmsTemplate: () => personalizeSmsTemplate
});
import { GoogleGenAI as GoogleGenAI5 } from "@google/genai";
async function personalizeSmsTemplate(context) {
  const { lead, recentInteractions, template } = context;
  if (!genAI5) {
    console.warn("GOOGLE_API_KEY not available, using basic variable replacement");
    return basicPersonalization2(lead, template);
  }
  const prompt = buildPersonalizationPrompt2(lead, recentInteractions, template);
  try {
    const result = await genAI5.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });
    const responseText = result.response?.text() || result.text || "";
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, "");
    cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
    cleanedResponse = cleanedResponse.trim();
    if (!cleanedResponse) {
      console.error("Empty response from Gemini AI");
      return basicPersonalization2(lead, template);
    }
    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.error("Response was:", cleanedResponse.substring(0, 200));
      return basicPersonalization2(lead, template);
    }
    if (!parsed.messageContent) {
      console.error("Gemini response missing required messageContent field");
      return basicPersonalization2(lead, template);
    }
    const charCount = parsed.messageContent.length;
    if (charCount > 160) {
      console.warn(`AI-generated SMS is ${charCount} characters (over 160 limit) - falling back to basic personalization`);
      return basicPersonalization2(lead, template);
    }
    return {
      messageContent: parsed.messageContent,
      characterCount: charCount,
      suggestedVariables: parsed.suggestedVariables || {},
      personalizationNotes: parsed.personalizationNotes || "AI personalization applied"
    };
  } catch (error) {
    console.error("Failed to personalize SMS with Gemini:", error);
    console.log("Falling back to basic variable replacement");
    return basicPersonalization2(lead, template);
  }
}
function basicPersonalization2(lead, template) {
  const variableMatches = template.messageTemplate.match(/\{([^}]+)\}/g) || [];
  const variables = variableMatches.map((match) => match.replace(/[{}]/g, ""));
  const variableValues = generateVariablesSuggestionsSync2(lead, variables);
  let messageContent = template.messageTemplate;
  Object.entries(variableValues).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    messageContent = messageContent.replace(new RegExp(placeholder, "g"), value);
  });
  return {
    messageContent,
    characterCount: messageContent.length,
    suggestedVariables: variableValues,
    personalizationNotes: "Basic variable replacement applied (AI personalization unavailable)"
  };
}
function generateVariablesSuggestionsSync2(lead, templateVariables) {
  const suggestions = {};
  if (templateVariables.includes("firstName")) {
    suggestions.firstName = lead.firstName || "there";
  }
  if (templateVariables.includes("lastName")) {
    suggestions.lastName = lead.lastName || "";
  }
  if (templateVariables.includes("email")) {
    suggestions.email = lead.email;
  }
  if (templateVariables.includes("phone")) {
    suggestions.phone = lead.phone || "";
  }
  if (lead.persona === "parent" && templateVariables.includes("childName")) {
    const metadata = lead.metadata;
    suggestions.childName = metadata?.childName || "your child";
  }
  if (lead.persona === "donor") {
    if (templateVariables.includes("amount")) {
      suggestions.amount = "$50";
    }
    if (templateVariables.includes("lastAmount")) {
      const metadata = lead.metadata;
      suggestions.lastAmount = metadata?.lastDonationAmount || "$50";
    }
    if (templateVariables.includes("companyName")) {
      const metadata = lead.metadata;
      suggestions.companyName = metadata?.companyName || "your org";
    }
  }
  if (templateVariables.includes("monthsSince") && lead.lastInteractionDate) {
    const months = Math.floor((Date.now() - new Date(lead.lastInteractionDate).getTime()) / (1e3 * 60 * 60 * 24 * 30));
    suggestions.monthsSince = Math.max(1, months).toString();
  }
  if (templateVariables.includes("dayOfWeek")) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = /* @__PURE__ */ new Date();
    suggestions.dayOfWeek = days[today.getDay()];
  }
  if (templateVariables.includes("time")) {
    suggestions.time = "2:00pm";
  }
  if (templateVariables.includes("date")) {
    const today = /* @__PURE__ */ new Date();
    suggestions.date = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (templateVariables.includes("cityName")) {
    const metadata = lead.metadata;
    suggestions.cityName = metadata?.city || "your area";
  }
  if (templateVariables.includes("address")) {
    suggestions.address = "123 Main St";
  }
  if (templateVariables.includes("link")) {
    suggestions.link = "jflearn.org/enroll";
  }
  templateVariables.forEach((varName) => {
    if (!suggestions[varName]) {
      suggestions[varName] = `[${varName}]`;
    }
  });
  return suggestions;
}
function buildPersonalizationPrompt2(lead, recentInteractions, template) {
  const interactionSummary = recentInteractions && recentInteractions.length > 0 ? recentInteractions.map((i) => `- ${i.interactionType}: ${i.contentEngaged || "N/A"} (${new Date(i.createdAt).toLocaleDateString()})`).join("\n") : "No recent interactions recorded";
  const lastInteractionDate = lead.lastInteractionDate ? new Date(lead.lastInteractionDate).toLocaleDateString() : "Never";
  const daysSinceLastInteraction = lead.lastInteractionDate ? Math.floor((Date.now() - new Date(lead.lastInteractionDate).getTime()) / (1e3 * 60 * 60 * 24)) : null;
  const templateVars = template.variables || [];
  return `You are an expert SMS copywriter trained in Alex Hormozi's "$100M Leads" communication strategies, optimized for SMS constraints.

**Your Task**: Personalize this SMS template for a specific recipient using their CRM data.

**CRITICAL SMS CONSTRAINTS**:
- MAXIMUM 160 characters for single-segment SMS (preferred)
- If absolutely necessary, max 306 characters (2 segments)
- Plain text only - no HTML, no formatting
- Ultra-concise, punchy, action-oriented
- Conversational tone like texting a friend
- MUST include opt-out compliance (already in template)

**Template Information**:
- Template Name: ${template.name}
- Outreach Type: ${template.outreachType || "N/A"}
- Template Category: ${template.templateCategory || "N/A"}
- Description: ${template.description || "N/A"}
- Example Context: ${template.exampleContext || "N/A"}
- Target Character Count: 160

**Recipient CRM Data**:
- Name: ${lead.firstName || "Unknown"} ${lead.lastName || ""}
- Phone: ${lead.phone || "Unknown"}
- Email: ${lead.email}
- Persona: ${lead.persona} (their role/interest)
- Journey Stage: ${lead.funnelStage}
- Lead Source: ${lead.leadSource || "Unknown"}
- Engagement Score: ${lead.engagementScore || 0}/100
- Last Interaction: ${lastInteractionDate}${daysSinceLastInteraction !== null ? ` (${daysSinceLastInteraction} days ago)` : ""}
- Notes: ${lead.notes || "No notes available"}
- Metadata: ${lead.metadata ? JSON.stringify(lead.metadata) : "None"}

**Recent Interactions**:
${interactionSummary}

**Original Template Message**:
${template.messageTemplate}

**Available Variables**: Extract from {variable} placeholders in the template

**Personalization Instructions**:

1. **Analyze CRM Data Quickly**:
   - Recent interactions (what they did, when)
   - Their persona and journey stage
   - Specific details from notes/metadata
   - Time since last contact

2. **Fill Variables Smartly**:
   - Use real CRM data when available
   - Make educated guesses based on persona/context when missing
   - Keep tone casual and friendly (like texting, not emailing)
   - First names only unless context requires formality

3. **SMS-Specific Optimization**:
   - Use abbreviations if natural ("LAST DAY" not "Last Day Available")
   - Numbers over words ("2hrs" not "two hours", "$50" not "fifty dollars")
   - Action verbs ("Click", "Reply", "Join", "Give")
   - Remove filler words ruthlessly
   - Front-load the most important info

4. **Character Count Management**:
   - PRIORITIZE staying under 160 characters
   - Every character matters - be brutal with cuts
   - Keep opt-out language (STOP) - it's required
   - If you must go over 160, explain why in personalizationNotes

5. **Maintain Hormozi Framework**:
   - Keep template's strategic approach (A-C-A, urgency, social proof, etc.)
   - Don't change the core message
   - Preserve the framework's intent

6. **Output Requirements**:
   - Replace ALL {variables} with actual content
   - NO placeholders like [childName] - fill with something specific
   - Make it feel personal but concise
   - Count every character including spaces

**Return ONLY valid JSON in this exact format (no markdown, no code blocks)**:
{
  "messageContent": "Complete SMS message with all variables filled - aim for \u2264160 chars",
  "characterCount": 142,
  "suggestedVariables": {
    "firstName": "actual value used",
    "anyOtherVariable": "actual value used"
  },
  "personalizationNotes": "Brief note on key changes made and character count management (1-2 sentences)"
}

**Important**:
- Be specific and concrete, not generic
- Use actual name/data from CRM
- Make every word count
- If missing critical data, make smart assumptions based on persona
- Remember: This is Julie's warm, helpful nonprofit - keep that voice
- Character count is CRITICAL - prioritize brevity over perfection`;
}
async function generateVariablesSuggestions2(lead, templateVariables) {
  return generateVariablesSuggestionsSync2(lead, templateVariables);
}
var genAI5;
var init_smsPersonalizer = __esm({
  "server/smsPersonalizer.ts"() {
    "use strict";
    if (!process.env.GOOGLE_API_KEY) {
      console.warn("GOOGLE_API_KEY not configured - SMS personalization will fall back to basic variable replacement");
    }
    genAI5 = process.env.GOOGLE_API_KEY ? new GoogleGenAI5({ apiKey: process.env.GOOGLE_API_KEY }) : null;
  }
});

// server/services/donorLifecycleService.ts
var donorLifecycleService_exports = {};
__export(donorLifecycleService_exports, {
  DonorLifecycleService: () => DonorLifecycleService,
  createDonorLifecycleService: () => createDonorLifecycleService
});
import { eq as eq10, desc as desc6, and as and11 } from "drizzle-orm";
function createDonorLifecycleService(storage2) {
  return new DonorLifecycleService(storage2);
}
var DonorLifecycleService;
var init_donorLifecycleService = __esm({
  "server/services/donorLifecycleService.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_funnelProgressionService();
    DonorLifecycleService = class {
      constructor(storage2) {
        this.storage = storage2;
      }
      RECURRING_DONOR_THRESHOLD = 2;
      // donations in different months
      RECURRING_DONOR_TOTAL_THRESHOLD = 3;
      // OR total donations
      DEFAULT_MAJOR_DONOR_THRESHOLD = 1e5;
      // $1,000 in cents
      LAPSED_MONTHS_THRESHOLD = 6;
      /**
       * Process a new donation and update donor lifecycle accordingly
       * Called from Stripe webhook after successful payment
       */
      async processDonation(leadId, donationAmount, donationDate = /* @__PURE__ */ new Date()) {
        let lifecycleStage = await this.storage.getDonorLifecycleStage(leadId);
        if (!lifecycleStage) {
          lifecycleStage = await this.storage.createDonorLifecycleStage({
            leadId,
            currentStage: "prospect",
            majorDonorThreshold: this.DEFAULT_MAJOR_DONOR_THRESHOLD
          });
        }
        const donorDonations = await db.select().from(donations2).where(and11(
          eq10(donations2.leadId, leadId),
          eq10(donations2.status, "succeeded")
        )).orderBy(desc6(donations2.createdAt));
        const metrics = await this.calculateEngagementMetrics(leadId, donorDonations);
        const updates = await this.determineStageUpdates(lifecycleStage, donorDonations, metrics, donationDate);
        await this.storage.updateDonorLifecycleStage(leadId, updates);
        await this.updateEconomicsAtStage(leadId, updates.currentStage || lifecycleStage.currentStage);
        try {
          await evaluateLeadProgression(leadId, "donation_completed");
        } catch (error) {
          console.error(`[DonorLifecycle] Failed to evaluate funnel progression for lead ${leadId}:`, error);
        }
      }
      /**
       * Calculate engagement metrics from donation history
       */
      async calculateEngagementMetrics(leadId, donorDonations) {
        if (donorDonations.length === 0) {
          return {
            totalLifetimeDonations: 0,
            averageDonationAmount: 0,
            donationFrequency: "none",
            consecutiveMonthsDonating: 0,
            monthsSinceLastDonation: null
          };
        }
        const totalLifetimeDonations = donorDonations.reduce((sum2, d) => sum2 + (d.amount || 0), 0);
        const averageDonationAmount = Math.round(totalLifetimeDonations / donorDonations.length);
        const lastDonation = donorDonations[0];
        const lastDonationDate = new Date(lastDonation.createdAt);
        const now = /* @__PURE__ */ new Date();
        const monthsSinceLastDonation = this.calculateMonthsDifference(lastDonationDate, now);
        const uniqueMonths = new Set(
          donorDonations.map((d) => {
            const date = new Date(d.createdAt);
            return `${date.getFullYear()}-${date.getMonth() + 1}`;
          })
        );
        const uniqueMonthCount = uniqueMonths.size;
        const consecutiveMonthsDonating = this.calculateConsecutiveMonths(donorDonations);
        const donationFrequency = this.determineDonationFrequency(donorDonations.length, uniqueMonthCount);
        return {
          totalLifetimeDonations,
          averageDonationAmount,
          donationFrequency,
          consecutiveMonthsDonating,
          monthsSinceLastDonation
        };
      }
      /**
       * Determine what stage updates are needed based on donation history
       */
      async determineStageUpdates(currentLifecycle, donorDonations, metrics, donationDate) {
        const updates = {
          ...metrics
        };
        const donationCount = donorDonations.length;
        const uniqueMonths = new Set(
          donorDonations.map((d) => {
            const date = new Date(d.createdAt);
            return `${date.getFullYear()}-${date.getMonth() + 1}`;
          })
        );
        const uniqueMonthCount = uniqueMonths.size;
        if (currentLifecycle.currentStage === "prospect" && donationCount >= 1) {
          updates.currentStage = "first_time";
          updates.becameFirstTimeDonor = donationDate;
        }
        if (currentLifecycle.currentStage === "first_time" && (uniqueMonthCount >= this.RECURRING_DONOR_THRESHOLD || donationCount >= this.RECURRING_DONOR_TOTAL_THRESHOLD)) {
          updates.currentStage = "recurring";
          updates.becameRecurringDonor = donationDate;
        }
        const majorDonorThreshold = currentLifecycle.majorDonorThreshold || this.DEFAULT_MAJOR_DONOR_THRESHOLD;
        if ((currentLifecycle.currentStage === "first_time" || currentLifecycle.currentStage === "recurring") && metrics.totalLifetimeDonations >= majorDonorThreshold) {
          updates.currentStage = "major_donor";
          updates.becameMajorDonor = donationDate;
        }
        if (currentLifecycle.currentStage === "major_donor" && !currentLifecycle.becameMajorDonor && metrics.totalLifetimeDonations >= majorDonorThreshold) {
          updates.becameMajorDonor = donationDate;
        }
        if (currentLifecycle.currentStage === "lapsed") {
          if (currentLifecycle.becameMajorDonor) {
            updates.currentStage = "major_donor";
          } else if (currentLifecycle.becameRecurringDonor) {
            updates.currentStage = "recurring";
          } else if (currentLifecycle.becameFirstTimeDonor) {
            updates.currentStage = "first_time";
          }
          updates.becameLapsed = null;
        }
        return updates;
      }
      /**
       * Update donor economics and lifecycle stage with LTGP at current stage
       */
      async updateEconomicsAtStage(leadId, currentStage) {
        const economics = await this.storage.getDonorEconomics(leadId);
        if (!economics) return;
        const ltgp = economics.lifetimeGrossProfit || 0;
        const cac = economics.customerAcquisitionCost || 0;
        const currentLTGPtoCAC = cac > 0 ? Math.round(ltgp / cac * 100) : 0;
        const lifecycle = await this.storage.getDonorLifecycleStage(leadId);
        if (!lifecycle) return;
        const stageUpdates = {
          currentLTGP: ltgp,
          currentLTGPtoCAC
        };
        switch (currentStage) {
          case "first_time":
            if (!lifecycle.firstDonorLTGP) {
              stageUpdates.firstDonorLTGP = ltgp;
            }
            break;
          case "recurring":
            if (!lifecycle.recurringDonorLTGP) {
              stageUpdates.recurringDonorLTGP = ltgp;
            }
            break;
          case "major_donor":
            if (!lifecycle.majorDonorLTGP) {
              stageUpdates.majorDonorLTGP = ltgp;
            }
            break;
        }
        await this.storage.updateDonorLifecycleStage(leadId, stageUpdates);
      }
      /**
       * Detect and mark lapsed donors (no donation in X months)
       * Should be run as a scheduled job
       */
      async detectLapsedDonors() {
        const allStages = await this.storage.getAllDonorLifecycleStages();
        let lapsedCount = 0;
        for (const stage of allStages) {
          if (stage.currentStage === "lapsed" || stage.currentStage === "prospect") {
            continue;
          }
          const lastDonation = await db.select().from(donations2).where(and11(
            eq10(donations2.leadId, stage.leadId),
            eq10(donations2.status, "succeeded")
          )).orderBy(desc6(donations2.createdAt)).limit(1);
          if (lastDonation.length === 0) {
            continue;
          }
          const lastDonationDate = new Date(lastDonation[0].createdAt);
          const monthsSince = this.calculateMonthsDifference(lastDonationDate, /* @__PURE__ */ new Date());
          if (monthsSince >= this.LAPSED_MONTHS_THRESHOLD) {
            await this.storage.updateDonorLifecycleStage(stage.leadId, {
              currentStage: "lapsed",
              becameLapsed: /* @__PURE__ */ new Date(),
              monthsSinceLastDonation: monthsSince
            });
            lapsedCount++;
          }
        }
        return lapsedCount;
      }
      /**
       * Helper: Calculate months difference between two dates (day-accurate)
       * Uses 30-day month approximation for accurate threshold comparisons
       */
      calculateMonthsDifference(startDate, endDate) {
        const millisecondsPerDay = 24 * 60 * 60 * 1e3;
        const daysPerMonth = 30;
        const diffMilliseconds = endDate.getTime() - startDate.getTime();
        const diffDays = diffMilliseconds / millisecondsPerDay;
        const diffMonths = Math.floor(diffDays / daysPerMonth);
        return diffMonths;
      }
      /**
       * Helper: Calculate consecutive months with donations (from most recent backwards)
       */
      calculateConsecutiveMonths(donorDonations) {
        if (donorDonations.length === 0) return 0;
        const monthTimestamps = /* @__PURE__ */ new Set();
        donorDonations.forEach((d) => {
          const date = new Date(d.createdAt);
          const normalizedDate = new Date(date.getFullYear(), date.getMonth(), 1);
          monthTimestamps.add(normalizedDate.getTime());
        });
        const sortedMonths = Array.from(monthTimestamps).sort((a, b) => b - a);
        if (sortedMonths.length === 0) return 0;
        let consecutive = 1;
        let expectedNextTimestamp = new Date(sortedMonths[0]);
        expectedNextTimestamp.setMonth(expectedNextTimestamp.getMonth() - 1);
        for (let i = 1; i < sortedMonths.length; i++) {
          if (sortedMonths[i] === expectedNextTimestamp.getTime()) {
            consecutive++;
            expectedNextTimestamp.setMonth(expectedNextTimestamp.getMonth() - 1);
          } else {
            break;
          }
        }
        return consecutive;
      }
      /**
       * Helper: Determine donation frequency pattern
       */
      determineDonationFrequency(totalDonations, uniqueMonths) {
        if (totalDonations === 0) return "none";
        if (totalDonations === 1) return "one_time";
        const donationsPerMonth = totalDonations / uniqueMonths;
        if (donationsPerMonth >= 0.9) {
          return "monthly";
        } else if (uniqueMonths >= 4 && totalDonations >= 4) {
          return "quarterly";
        } else if (uniqueMonths >= 2) {
          return "sporadic";
        }
        return "sporadic";
      }
      /**
       * Manually promote a donor to legacy status
       */
      async promoteDonorToLegacy(leadId) {
        const lifecycle = await this.storage.getDonorLifecycleStage(leadId);
        if (!lifecycle) {
          throw new Error("Donor lifecycle not found");
        }
        await this.storage.updateDonorLifecycleStage(leadId, {
          currentStage: "legacy",
          becameLegacyDonor: /* @__PURE__ */ new Date()
        });
      }
      /**
       * Get lifecycle summary for a donor
       */
      async getDonorLifecycleSummary(leadId) {
        const lifecycle = await this.storage.getDonorLifecycleStage(leadId);
        if (!lifecycle) return null;
        const lead = await db.select().from(leads).where(eq10(leads.id, leadId)).limit(1);
        const economics = await this.storage.getDonorEconomics(leadId);
        return {
          lifecycle,
          lead: lead[0] || null,
          economics
        };
      }
    };
  }
});

// server/services/backupScheduler.ts
var backupScheduler_exports = {};
__export(backupScheduler_exports, {
  initBackupScheduler: () => initBackupScheduler,
  poll: () => poll2,
  shutdownBackupScheduler: () => shutdownBackupScheduler
});
import { add as add2, set as set2 } from "date-fns";
import { toZonedTime as toZonedTime2, fromZonedTime as fromZonedTime2 } from "date-fns-tz";
function initBackupScheduler() {
  console.log("[BackupScheduler] Initializing backup scheduler...");
  poll2().catch((error) => {
    console.error("[BackupScheduler] Initial poll failed:", error);
  });
  intervalHandle2 = setInterval(() => {
    poll2().catch((error) => {
      console.error("[BackupScheduler] Poll failed:", error);
    });
  }, POLL_INTERVAL_MS2);
  console.log("[BackupScheduler] Scheduler initialized (polling every 60 seconds)");
}
async function shutdownBackupScheduler() {
  console.log("[BackupScheduler] Shutting down backup scheduler...");
  if (intervalHandle2) {
    clearInterval(intervalHandle2);
    intervalHandle2 = null;
  }
  const shutdownTimeout = setTimeout(() => {
    console.warn("[BackupScheduler] Shutdown timeout - force closing");
  }, 3e4);
  while (isRunning2) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  clearTimeout(shutdownTimeout);
  console.log("[BackupScheduler] Scheduler shutdown complete");
}
async function poll2() {
  if (isRunning2) {
    console.log("[BackupScheduler] Poll already running, skipping...");
    return;
  }
  isRunning2 = true;
  try {
    const now = /* @__PURE__ */ new Date();
    const schedules = await storage.getDueBackupSchedules(now, 1);
    if (schedules.length === 0) {
      return;
    }
    console.log(`[BackupScheduler] Found ${schedules.length} due schedule(s)`);
    for (const schedule of schedules) {
      await executeSchedule2(schedule, now);
    }
  } catch (error) {
    console.error("[BackupScheduler] Poll error:", error);
  } finally {
    isRunning2 = false;
  }
}
async function executeSchedule2(schedule, now) {
  const lockUntil = new Date(now.getTime() + MAX_EXECUTION_TIME_MS2);
  const locked = await storage.markScheduleRunning(schedule.id, lockUntil);
  if (!locked) {
    console.log(`[BackupScheduler] Schedule ${schedule.id} already running or locked, skipping`);
    return;
  }
  console.log(`[BackupScheduler] Executing schedule ${schedule.id} (table: ${schedule.tableName})`);
  try {
    const result = await storage.createTableBackup(
      schedule.tableName,
      schedule.createdBy,
      `Scheduled: ${schedule.scheduleName || schedule.tableName}`,
      `Automated backup from schedule "${schedule.scheduleName || "Unnamed"}"`
    );
    console.log(`[BackupScheduler] Backup created: ${result.snapshotId} (${result.rowCount} rows)`);
    if (schedule.retentionCount && schedule.retentionCount > 0) {
      const deleted = await storage.cleanupOldBackupsBySchedule(
        schedule.tableName,
        schedule.retentionCount
      );
      if (deleted > 0) {
        console.log(`[BackupScheduler] Cleaned up ${deleted} old backup(s) for ${schedule.tableName}`);
      }
    }
    const nextRun = computeNextRun2(schedule, now);
    await storage.completeSchedule(schedule.id, {
      success: true,
      nextRun
    });
    console.log(`[BackupScheduler] Schedule ${schedule.id} completed. Next run: ${nextRun.toISOString()}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[BackupScheduler] Schedule ${schedule.id} failed:`, errorMessage);
    const nextRun = computeNextRun2(schedule, now);
    await storage.completeSchedule(schedule.id, {
      success: false,
      error: errorMessage,
      nextRun
    });
    const consecutiveFailures = (schedule.consecutiveFailures || 0) + 1;
    if (consecutiveFailures >= ALERT_FAILURE_THRESHOLD) {
      console.error(`[BackupScheduler] ALERT: Schedule ${schedule.id} has failed ${consecutiveFailures} times consecutively!`);
    }
  }
}
function computeNextRun2(schedule, currentTime) {
  const config = schedule.scheduleConfig;
  const timezone = config.timezone || "UTC";
  try {
    const zonedNow = toZonedTime2(currentTime, timezone);
    let nextZonedRun;
    switch (schedule.scheduleType) {
      case "daily":
        nextZonedRun = set2(zonedNow, {
          hours: config.hour || 0,
          minutes: config.minute || 0,
          seconds: 0,
          milliseconds: 0
        });
        if (nextZonedRun <= zonedNow) {
          nextZonedRun = add2(nextZonedRun, { days: 1 });
        }
        break;
      case "weekly":
        const targetDay = config.dayOfWeek || 0;
        const currentDay = zonedNow.getDay();
        nextZonedRun = set2(zonedNow, {
          hours: config.hour || 0,
          minutes: config.minute || 0,
          seconds: 0,
          milliseconds: 0
        });
        let daysUntilTarget = targetDay - currentDay;
        if (daysUntilTarget < 0 || daysUntilTarget === 0 && nextZonedRun <= zonedNow) {
          daysUntilTarget += 7;
        }
        nextZonedRun = add2(nextZonedRun, { days: daysUntilTarget });
        break;
      case "monthly":
        const targetDayOfMonth = config.dayOfMonth || 1;
        nextZonedRun = set2(zonedNow, {
          date: 1,
          // Start at first of month
          hours: config.hour || 0,
          minutes: config.minute || 0,
          seconds: 0,
          milliseconds: 0
        });
        const lastDayOfMonth = new Date(
          nextZonedRun.getFullYear(),
          nextZonedRun.getMonth() + 1,
          0
        ).getDate();
        const actualDay = Math.min(targetDayOfMonth, lastDayOfMonth);
        nextZonedRun.setDate(actualDay);
        if (nextZonedRun <= zonedNow) {
          nextZonedRun = add2(nextZonedRun, { months: 1 });
          const newLastDay = new Date(
            nextZonedRun.getFullYear(),
            nextZonedRun.getMonth() + 1,
            0
          ).getDate();
          const newActualDay = Math.min(targetDayOfMonth, newLastDay);
          nextZonedRun.setDate(newActualDay);
        }
        break;
      case "custom":
        console.warn(`[BackupScheduler] Custom/cron schedule not fully implemented, using daily fallback`);
        nextZonedRun = add2(zonedNow, { days: 1 });
        break;
      default:
        console.warn(`[BackupScheduler] Unknown schedule type: ${schedule.scheduleType}, using daily fallback`);
        nextZonedRun = add2(zonedNow, { days: 1 });
    }
    const nextRunUtc = fromZonedTime2(nextZonedRun, timezone);
    return nextRunUtc;
  } catch (error) {
    console.error("[BackupScheduler] Error computing next run:", error);
    return add2(currentTime, { days: 1 });
  }
}
var POLL_INTERVAL_MS2, MAX_EXECUTION_TIME_MS2, ALERT_FAILURE_THRESHOLD, intervalHandle2, isRunning2;
var init_backupScheduler = __esm({
  "server/services/backupScheduler.ts"() {
    "use strict";
    init_storage();
    POLL_INTERVAL_MS2 = 6e4;
    MAX_EXECUTION_TIME_MS2 = 30 * 60 * 1e3;
    ALERT_FAILURE_THRESHOLD = 3;
    intervalHandle2 = null;
    isRunning2 = false;
  }
});

// server/services/donorLifecycleScheduler.ts
var donorLifecycleScheduler_exports = {};
__export(donorLifecycleScheduler_exports, {
  initDonorLifecycleScheduler: () => initDonorLifecycleScheduler,
  shutdownDonorLifecycleScheduler: () => shutdownDonorLifecycleScheduler,
  triggerLapsedDonorDetection: () => triggerLapsedDonorDetection
});
function initDonorLifecycleScheduler() {
  console.log("[DonorLifecycleScheduler] Initializing lifecycle scheduler...");
  setTimeout(() => {
    pollLapsedDonors().catch((error) => {
      console.error("[DonorLifecycleScheduler] Initial poll failed:", error);
    });
    intervalHandle3 = setInterval(() => {
      pollLapsedDonors().catch((error) => {
        console.error("[DonorLifecycleScheduler] Poll failed:", error);
      });
    }, POLL_INTERVAL_MS3);
    console.log("[DonorLifecycleScheduler] Scheduler initialized (polling every 24 hours)");
  }, INITIAL_DELAY_MS);
  console.log(`[DonorLifecycleScheduler] First poll will run in ${INITIAL_DELAY_MS / 1e3 / 60} minutes`);
}
async function shutdownDonorLifecycleScheduler() {
  console.log("[DonorLifecycleScheduler] Shutting down lifecycle scheduler...");
  if (intervalHandle3) {
    clearInterval(intervalHandle3);
    intervalHandle3 = null;
  }
  const shutdownTimeout = setTimeout(() => {
    console.warn("[DonorLifecycleScheduler] Shutdown timeout - force closing");
  }, 3e4);
  while (isRunning3) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  clearTimeout(shutdownTimeout);
  console.log("[DonorLifecycleScheduler] Scheduler shutdown complete");
}
async function pollLapsedDonors() {
  if (isRunning3) {
    console.log("[DonorLifecycleScheduler] Poll already running, skipping...");
    return;
  }
  isRunning3 = true;
  try {
    const now = /* @__PURE__ */ new Date();
    console.log(`[DonorLifecycleScheduler] Starting lapsed donor detection at ${now.toISOString()}`);
    const lifecycleService = createDonorLifecycleService(storage);
    const lapsedCount = await lifecycleService.detectLapsedDonors();
    if (lapsedCount > 0) {
      console.log(`[DonorLifecycleScheduler] \u2705 Marked ${lapsedCount} donor(s) as lapsed`);
    } else {
      console.log(`[DonorLifecycleScheduler] \u2705 No new lapsed donors detected`);
    }
  } catch (error) {
    console.error("[DonorLifecycleScheduler] Poll error:", error);
  } finally {
    isRunning3 = false;
  }
}
async function triggerLapsedDonorDetection() {
  console.log("[DonorLifecycleScheduler] Manual trigger for lapsed donor detection");
  const lifecycleService = createDonorLifecycleService(storage);
  const lapsedCount = await lifecycleService.detectLapsedDonors();
  console.log(`[DonorLifecycleScheduler] Manual detection complete: ${lapsedCount} donors marked as lapsed`);
  return lapsedCount;
}
var POLL_INTERVAL_MS3, INITIAL_DELAY_MS, intervalHandle3, isRunning3;
var init_donorLifecycleScheduler = __esm({
  "server/services/donorLifecycleScheduler.ts"() {
    "use strict";
    init_storage();
    init_donorLifecycleService();
    POLL_INTERVAL_MS3 = 24 * 60 * 60 * 1e3;
    INITIAL_DELAY_MS = 60 * 60 * 1e3;
    intervalHandle3 = null;
    isRunning3 = false;
  }
});

// server/routes.ts
var routes_exports = {};
__export(routes_exports, {
  registerRoutes: () => registerRoutes
});
import { createServer } from "http";
import { eq as eq11, sql as sql12, and as and12, isNotNull } from "drizzle-orm";
import { z as z2 } from "zod";
import multer from "multer";
import Stripe from "stripe";
import * as XLSX from "xlsx";
import { fromZonedTime as fromZonedTime3 } from "date-fns-tz";
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.get("/api/debug/db-test", async (_req, res) => {
    try {
      const { pool: pool2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const connStart = Date.now();
      const client2 = await pool2.connect();
      const connMs = Date.now() - connStart;
      const qStart = Date.now();
      const result = await client2.query("SELECT 1 as ok, current_database() as db");
      const qMs = Date.now() - qStart;
      client2.release();
      res.json({ ok: true, connMs, qMs, row: result.rows[0], dbUrl: (process.env.DATABASE_URL || "").substring(0, 40) + "..." });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message, code: e.code, stack: e.stack?.substring(0, 1e3) });
    }
  });
  app2.get("/track/open/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const emailLog = await storage.getEmailLogByTrackingToken(token);
      if (!emailLog) {
        console.log(`[Email Tracking] Invalid tracking token: ${token}`);
        const transparentGif2 = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
        res.set("Content-Type", "image/gif");
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.set("Expires", "0");
        return res.send(transparentGif2);
      }
      await storage.createEmailOpen({
        emailLogId: emailLog.id,
        leadId: emailLog.leadId,
        userAgent: req.get("user-agent") || null,
        ipAddress: req.ip || null
      });
      console.log(`[Email Tracking] Email opened - log: ${emailLog.id}, lead: ${emailLog.leadId || "N/A"}`);
      const transparentGif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
      res.set("Content-Type", "image/gif");
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.set("Expires", "0");
      res.send(transparentGif);
    } catch (error) {
      console.error("[Email Tracking] Error recording email open:", error);
      const transparentGif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
      res.set("Content-Type", "image/gif");
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.set("Expires", "0");
      res.send(transparentGif);
    }
  });
  app2.get("/track/click/:linkToken", async (req, res) => {
    try {
      const { linkToken } = req.params;
      const emailLink = await storage.getEmailLinkByToken(linkToken);
      if (!emailLink) {
        console.log(`[Email Tracking] Invalid link token: ${linkToken}`);
        return res.status(404).send("Link not found");
      }
      const targetUrl = emailLink.targetUrl;
      try {
        const parsedUrl = new URL(targetUrl);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          console.error(`[Email Tracking] Invalid stored URL protocol: ${parsedUrl.protocol}`);
          return res.status(400).send("Invalid link");
        }
      } catch (error) {
        console.error(`[Email Tracking] Malformed stored URL: ${targetUrl}`);
        return res.status(400).send("Invalid link");
      }
      const emailLog = await storage.getEmailLog(emailLink.emailLogId);
      storage.createEmailClick({
        emailLogId: emailLink.emailLogId,
        emailLinkId: emailLink.id,
        leadId: emailLog?.leadId || null,
        trackingToken: emailLog?.trackingToken || linkToken,
        targetUrl,
        userAgent: req.get("user-agent") || null,
        ipAddress: req.ip || null
      }).then(() => {
        console.log(`[Email Tracking] Click recorded - link: ${emailLink.id}, email: ${emailLink.emailLogId}, url: ${targetUrl}`);
      }).catch((error) => {
        console.error("[Email Tracking] Error recording click:", error);
      });
      res.redirect(302, targetUrl);
    } catch (error) {
      console.error("[Email Tracking] Error in click tracking:", error);
      res.status(500).send("Internal server error");
    }
  });
  app2.get("/api/auth/user", ...authWithImpersonation, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const user = await storage.getUserByOidcSub(oidcSub);
      const realUser = req.adminUser || req.user;
      const realUserData = realUser.claims ? await storage.getUserByOidcSub(realUser.claims.sub) : null;
      const isAdminSession = realUserData && (realUserData.role === "admin" || realUserData.role === "super_admin");
      let funnelStage = "awareness";
      let persona = user?.persona || "default";
      if (user?.email) {
        const lead = await storage.getLeadByEmail(user.email);
        if (lead) {
          if (lead.funnelStage) {
            funnelStage = lead.funnelStage;
          }
          if (lead.persona) {
            persona = lead.persona;
          }
        }
      }
      res.json({
        ...user,
        isAdminSession: isAdminSession || false,
        persona,
        funnelStage
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  if (process.env.NODE_ENV === "development") {
    app2.post("/api/test/set-user-role", ...authWithImpersonation, async (req, res) => {
      try {
        const oidcSub = req.user.claims.sub;
        const { role } = req.body;
        if (!role || !["client", "admin", "super_admin"].includes(role)) {
          return res.status(400).json({ message: "Invalid role. Must be client, admin, or super_admin" });
        }
        console.log(`[Test Helper] Setting role for oidcSub ${oidcSub} to ${role}`);
        const user = await storage.getUserByOidcSub(oidcSub);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const updated = await storage.updateUser(user.id, { role }, user.id);
        console.log(`[Test Helper] Successfully updated user role to ${updated.role}`);
        res.json({ success: true, user: updated });
      } catch (error) {
        console.error("[Test Helper] Error setting user role:", error);
        res.status(500).json({ message: "Failed to set user role" });
      }
    });
  }
  app2.patch("/api/user/profile", ...authWithImpersonation, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const user = await storage.getUserByOidcSub(oidcSub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { updateUserProfileSchema: updateUserProfileSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const validation = updateUserProfileSchema2.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid profile data",
          errors: validation.error.errors
        });
      }
      const updatedUser = await storage.updateUser(user.id, validation.data, user.id);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update profile" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.get("/api/admin/users", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      console.log("[AdminProvisioning] GET /api/admin/users");
      const users3 = await storage.getAllUsers();
      res.json(users3);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.patch("/api/admin/users/:userId/role", ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { role: newRole } = req.body;
      const validationResult = userRoleEnum.safeParse(newRole);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid role value. Must be 'client', 'admin', or 'super_admin'" });
      }
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (currentUser && userId === currentUser.id && newRole !== "super_admin") {
        return res.status(400).json({ message: "You cannot change your own role" });
      }
      const userToUpdate = await storage.getUser(userId);
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }
      if (userToUpdate.role === "super_admin" && newRole !== "super_admin") {
        const allUsers = await storage.getAllUsers();
        const superAdminCount = allUsers.filter((u) => u.role === "super_admin").length;
        if (superAdminCount <= 1) {
          return res.status(400).json({ message: "Cannot demote the last super admin" });
        }
      }
      const previousRole = userToUpdate.role;
      const updatedUser = await storage.updateUser(userId, { role: newRole }, currentUser.id);
      if (currentUser) {
        await storage.createAuditLog({
          userId,
          actorId: currentUser.id,
          action: "role_changed",
          previousRole,
          newRole,
          metadata: {
            userEmail: userToUpdate.email,
            actorEmail: currentUser.email,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app2.post("/api/admin/users", ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { email, firstName, lastName, role } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ message: "Email is required" });
      }
      if (!firstName || !firstName.trim()) {
        return res.status(400).json({ message: "First name is required" });
      }
      if (!lastName || !lastName.trim()) {
        return res.status(400).json({ message: "Last name is required" });
      }
      const userRole = role || "client";
      const validationResult = userRoleEnum.safeParse(userRole);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid role value. Must be 'client', 'admin', or 'super_admin'" });
      }
      const existingUser = await storage.getUserByEmail(email.trim());
      if (existingUser) {
        return res.status(409).json({ message: "A user with this email already exists" });
      }
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      const newUser = await storage.createUser({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: userRole
      });
      if (currentUser) {
        await storage.createAuditLog({
          userId: newUser.id,
          actorId: currentUser.id,
          action: "user_created",
          newRole: userRole,
          metadata: {
            userEmail: newUser.email,
            actorEmail: currentUser.email,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      }
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.get("/api/organization/tier", ...authWithImpersonation, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const user = await storage.getUserByOidcSub(oidcSub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let tier = "basic";
      let organizationId = null;
      let organizationName = null;
      if (user.organizationId) {
        const organization = await storage.getOrganization(user.organizationId);
        if (organization) {
          tier = organization.tier;
          organizationId = organization.id;
          organizationName = organization.name;
        }
      }
      res.json({ tier, organizationId, organizationName });
    } catch (error) {
      console.error("Error fetching organization tier:", error);
      res.status(500).json({ message: "Failed to fetch organization tier" });
    }
  });
  app2.get("/api/organizations", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const organizations2 = await storage.getAllOrganizations();
      res.json(organizations2);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });
  app2.patch("/api/organizations/:id", ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { tier, name } = req.body;
      if (tier && !["basic", "pro", "premium"].includes(tier)) {
        return res.status(400).json({ message: "Invalid tier. Must be 'basic', 'pro', or 'premium'" });
      }
      const updates = {};
      if (tier !== void 0) updates.tier = tier;
      if (name !== void 0) updates.name = name;
      const organization = await storage.updateOrganization(id, updates);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (currentUser) {
        await storage.createAuditLog({
          userId: currentUser.id,
          actorId: currentUser.id,
          action: "organization_updated",
          metadata: {
            organizationId: id,
            organizationName: organization.name,
            updates,
            actorEmail: currentUser.email,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      }
      res.json(organization);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: "Failed to update organization" });
    }
  });
  app2.delete("/api/admin/users/:userId", ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (currentUser && userId === currentUser.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }
      if (userToDelete.role === "super_admin") {
        const allUsers = await storage.getAllUsers();
        const superAdminCount = allUsers.filter((u) => u.role === "super_admin").length;
        if (superAdminCount <= 1) {
          return res.status(400).json({ message: "Cannot delete the last super admin" });
        }
      }
      if (currentUser) {
        await storage.createAuditLog({
          userId: userToDelete.id,
          actorId: currentUser.id,
          action: "user_deleted",
          previousRole: userToDelete.role,
          metadata: {
            userEmail: userToDelete.email,
            userName: `${userToDelete.firstName} ${userToDelete.lastName}`,
            actorEmail: currentUser.email,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      }
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.get("/api/admin/enrollments", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const enrollments = await storage.getActiveTechGoesHomeEnrollments();
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  app2.get("/api/admin/users/:userId/enrollment", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const enrollment = await storage.getTechGoesHomeEnrollmentByUserId(req.params.userId);
      res.json({ isEnrolled: !!enrollment, enrollment });
    } catch (error) {
      console.error("Error checking enrollment:", error);
      res.status(500).json({ message: "Failed to check enrollment status" });
    }
  });
  app2.post("/api/admin/users/:userId/enrollment", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const existingEnrollment = await storage.getTechGoesHomeEnrollmentByUserId(userId);
      if (existingEnrollment) {
        if (existingEnrollment.status === "withdrawn") {
          const reactivatedEnrollment = await storage.updateTechGoesHomeEnrollment(
            existingEnrollment.id,
            { status: "active" }
          );
          return res.json(reactivatedEnrollment);
        } else {
          return res.status(400).json({ message: "User is already enrolled" });
        }
      }
      const enrollment = await storage.createTechGoesHomeEnrollment({
        userId,
        programName: "Tech Goes Home",
        status: "active",
        totalClassesRequired: 15
      });
      res.json(enrollment);
    } catch (error) {
      console.error("Error enrolling user:", error);
      res.status(500).json({ message: "Failed to enroll user" });
    }
  });
  app2.delete("/api/admin/users/:userId/enrollment", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const enrollment = await storage.getTechGoesHomeEnrollmentByUserId(req.params.userId);
      if (!enrollment) {
        return res.status(404).json({ message: "User is not enrolled" });
      }
      await storage.updateTechGoesHomeEnrollment(enrollment.id, { status: "withdrawn" });
      res.json({ message: "User enrollment withdrawn successfully" });
    } catch (error) {
      console.error("Error removing enrollment:", error);
      res.status(500).json({ message: "Failed to remove enrollment" });
    }
  });
  app2.get("/api/admin/audit-logs", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { userId, actorId, action, limit } = req.query;
      const filters = {};
      if (userId) filters.userId = userId;
      if (actorId) filters.actorId = actorId;
      if (action) filters.action = action;
      if (limit) filters.limit = parseInt(limit, 10);
      const auditLogs2 = await storage.getAuditLogs(filters);
      res.json(auditLogs2);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });
  app2.get("/api/admin/preferences", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      let preferences = await storage.getAdminPreferences(currentUser.id);
      if (!preferences) {
        preferences = await storage.upsertAdminPreferences(currentUser.id, {});
      }
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching admin preferences:", error);
      res.status(500).json({ message: "Failed to fetch admin preferences" });
    }
  });
  app2.patch("/api/admin/preferences", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const validationResult = insertAdminPreferencesSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid preference data",
          errors: validationResult.error.errors
        });
      }
      const updates = validationResult.data;
      const updatedPreferences = await storage.upsertAdminPreferences(currentUser.id, updates);
      res.json(updatedPreferences);
    } catch (error) {
      console.error("Error updating admin preferences:", error);
      res.status(500).json({ message: "Failed to update admin preferences" });
    }
  });
  app2.get("/api/admin/preferences/defaults", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const defaults = {
        // Notification Preferences
        newLeadAlerts: true,
        taskAssignmentAlerts: true,
        taskCompletionAlerts: true,
        donationAlerts: true,
        emailCampaignAlerts: false,
        calendarEventReminders: true,
        notificationChannels: ["email"],
        // Workflow Preferences
        autoAssignNewLeads: false,
        defaultTaskDueDateOffset: 3,
        defaultLeadSource: null,
        defaultLeadStatus: "new_lead",
        preferredPipelineView: "kanban",
        // Interface Preferences
        defaultLandingPage: "/admin",
        theme: "system",
        itemsPerPage: 25,
        dataDensity: "comfortable",
        defaultContentFilter: "all",
        // Communication Preferences
        dailyDigestEnabled: false,
        weeklyReportEnabled: true,
        criticalAlertsOnly: false
      };
      res.json(defaults);
    } catch (error) {
      console.error("Error fetching default preferences:", error);
      res.status(500).json({ message: "Failed to fetch default preferences" });
    }
  });
  app2.post("/api/admin/chatbot/message", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { message, sessionId } = req.body;
      if (!message || !sessionId) {
        return res.status(400).json({ message: "Message and sessionId are required" });
      }
      const conversationHistory = await storage.getChatbotConversationsBySession(sessionId);
      const { processChatMessage: processChatMessage2 } = await Promise.resolve().then(() => (init_chatbotService(), chatbotService_exports));
      const result = await processChatMessage2(
        currentUser.id,
        sessionId,
        message,
        conversationHistory
      );
      await storage.createChatbotConversation({
        userId: currentUser.id,
        sessionId,
        role: "user",
        content: message
      });
      await storage.createChatbotConversation({
        userId: currentUser.id,
        sessionId,
        role: "assistant",
        content: result.response,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults
      });
      if (result.shouldEscalate && result.escalationData) {
        const fullContext = [
          ...conversationHistory.slice(-5),
          { role: "user", content: message },
          { role: "assistant", content: result.response }
        ];
        const issue = await storage.createChatbotIssue({
          title: result.escalationData.title,
          description: result.escalationData.description,
          severity: result.escalationData.severity,
          category: result.escalationData.category || "other",
          reportedBy: currentUser.id,
          conversationContext: fullContext,
          diagnosticData: result.escalationData.diagnosticData
        });
        const { notifyIssue: notifyIssue2 } = await Promise.resolve().then(() => (init_notificationService(), notificationService_exports));
        const notificationResult = await notifyIssue2(issue);
        await storage.updateChatbotIssue(issue.id, {
          notificationSent: notificationResult.sms.success,
          notificationSentAt: notificationResult.sms.success ? /* @__PURE__ */ new Date() : void 0
        });
      }
      res.json({
        response: result.response,
        sessionId
      });
    } catch (error) {
      console.error("Error processing chatbot message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });
  app2.get("/api/admin/chatbot/history/:sessionId", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { sessionId } = req.params;
      const history = await storage.getChatbotConversationsBySession(sessionId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chatbot history:", error);
      res.status(500).json({ message: "Failed to fetch conversation history" });
    }
  });
  app2.delete("/api/admin/chatbot/session/:sessionId", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.deleteChatbotSession(sessionId);
      res.json({ message: "Session cleared successfully" });
    } catch (error) {
      console.error("Error deleting chatbot session:", error);
      res.status(500).json({ message: "Failed to clear session" });
    }
  });
  app2.get("/api/admin/chatbot/issues", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { status, severity, limit } = req.query;
      const issues = await storage.getChatbotIssues({
        status,
        severity,
        limit: limit ? parseInt(limit) : void 0
      });
      res.json(issues);
    } catch (error) {
      console.error("Error fetching chatbot issues:", error);
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });
  app2.patch("/api/admin/chatbot/issues/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { id } = req.params;
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const updates = req.body;
      if (updates.status === "resolved" && !updates.resolvedBy) {
        updates.resolvedBy = currentUser.id;
        updates.resolvedAt = /* @__PURE__ */ new Date();
      }
      const updated = await storage.updateChatbotIssue(id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Issue not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating chatbot issue:", error);
      res.status(500).json({ message: "Failed to update issue" });
    }
  });
  app2.get("/api/admin/backups/tables", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const tables = await storage.getAvailableTables();
      res.json(tables);
    } catch (error) {
      console.error("Error fetching available tables:", error);
      res.status(500).json({ message: "Failed to fetch available tables" });
    }
  });
  app2.post("/api/admin/backups/create", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const backupCreateSchema = insertBackupSnapshotSchema.pick({
        tableName: true,
        backupName: true,
        description: true
      });
      const validationResult = backupCreateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors
        });
      }
      const { tableName, backupName, description } = validationResult.data;
      const result = await storage.createTableBackup(
        tableName,
        currentUser.id,
        backupName,
        description
      );
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({
        message: "Failed to create backup. Please try again or contact support if the problem persists."
      });
    }
  });
  app2.get("/api/admin/backups", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const backups = await storage.getAllBackupSnapshots();
      res.json(backups);
    } catch (error) {
      console.error("Error fetching backups:", error);
      res.status(500).json({ message: "Failed to fetch backups" });
    }
  });
  app2.get("/api/admin/backups/table/:tableName", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { tableName } = req.params;
      const backups = await storage.getBackupSnapshotsByTable(tableName);
      res.json(backups);
    } catch (error) {
      console.error("Error fetching backups for table:", error);
      res.status(500).json({ message: "Failed to fetch backups for table" });
    }
  });
  app2.post("/api/admin/backups/:id/restore", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const bodySchema = z2.object({
        mode: z2.enum(["replace", "merge"], {
          errorMap: () => ({ message: "Restore mode must be either 'replace' or 'merge'" })
        })
      });
      const validationResult = bodySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors
        });
      }
      const { mode } = validationResult.data;
      const result = await storage.restoreFromBackup(id, mode);
      res.json(result);
    } catch (error) {
      console.error("Error restoring from backup:", error);
      res.status(500).json({
        message: "Failed to restore from backup. Please try again or contact support if the problem persists."
      });
    }
  });
  app2.delete("/api/admin/backups/:id", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const backup = await storage.getBackupSnapshot(id);
      if (!backup) {
        return res.status(404).json({ message: "Backup not found" });
      }
      await storage.deleteBackup(id);
      res.json({ message: "Backup deleted successfully" });
    } catch (error) {
      console.error("Error deleting backup:", error);
      res.status(500).json({
        message: "Failed to delete backup. Please try again or contact support if the problem persists."
      });
    }
  });
  app2.get("/api/admin/backup-schedules", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const schedules = await storage.getAllBackupSchedules();
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching backup schedules:", error);
      res.status(500).json({ message: "Failed to fetch backup schedules" });
    }
  });
  app2.post("/api/admin/backup-schedules", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const validationResult = insertBackupScheduleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid schedule data",
          errors: validationResult.error.errors
        });
      }
      const schedule = await storage.createBackupSchedule({
        ...validationResult.data,
        createdBy: currentUser.id
      });
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating backup schedule:", error);
      res.status(500).json({ message: "Failed to create backup schedule" });
    }
  });
  app2.patch("/api/admin/backup-schedules/:id", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = insertBackupScheduleSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid update data",
          errors: validationResult.error.errors
        });
      }
      const updated = await storage.updateBackupSchedule(id, validationResult.data);
      if (!updated) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating backup schedule:", error);
      res.status(500).json({ message: "Failed to update backup schedule" });
    }
  });
  app2.delete("/api/admin/backup-schedules/:id", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const schedule = await storage.getBackupSchedule(id);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      await storage.deleteBackupSchedule(id);
      res.json({ message: "Schedule deleted successfully" });
    } catch (error) {
      console.error("Error deleting backup schedule:", error);
      res.status(500).json({ message: "Failed to delete backup schedule" });
    }
  });
  app2.get("/api/admin/backup-storage-metrics", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const metrics = await storage.getDatabaseStorageMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching storage metrics:", error);
      res.status(500).json({ message: "Failed to fetch storage metrics" });
    }
  });
  app2.get("/api/admin/programs", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      console.log("[AdminProvisioning] GET /api/admin/programs - query:", req.query);
      const { programType, isActive, isAvailableForTesting } = req.query;
      const filters = {};
      if (programType) filters.programType = programType;
      if (isActive !== void 0) filters.isActive = isActive === "true";
      if (isAvailableForTesting !== void 0) filters.isAvailableForTesting = isAvailableForTesting === "true";
      console.log("[AdminProvisioning] Filters:", filters);
      const programs3 = await storage.getAllPrograms(filters);
      console.log("[AdminProvisioning] Found programs:", programs3.length);
      res.json(programs3);
    } catch (error) {
      console.error("[AdminProvisioning] Error fetching programs:", error);
      res.status(500).json({ message: "Failed to fetch programs" });
    }
  });
  app2.post("/api/admin/programs", ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const validationResult = insertProgramSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid program data",
          errors: validationResult.error.errors
        });
      }
      const program = await storage.createProgram(validationResult.data);
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating program:", error);
      res.status(500).json({ message: "Failed to create program" });
    }
  });
  app2.patch("/api/admin/programs/:id", ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = insertProgramSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid update data",
          errors: validationResult.error.errors
        });
      }
      const updated = await storage.updateProgram(id, validationResult.data);
      if (!updated) {
        return res.status(404).json({ message: "Program not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating program:", error);
      res.status(500).json({ message: "Failed to update program" });
    }
  });
  app2.delete("/api/admin/programs/:id", ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const program = await storage.getProgram(id);
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      await storage.deleteProgram(id);
      res.json({ message: "Program deleted successfully" });
    } catch (error) {
      console.error("Error deleting program:", error);
      res.status(500).json({ message: "Failed to delete program" });
    }
  });
  app2.get("/api/admin/entitlements", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      console.log("[AdminProvisioning] GET /api/admin/entitlements");
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const entitlements = await storage.getActiveAdminEntitlementsWithPrograms(currentUser.id);
      res.json(entitlements);
    } catch (error) {
      console.error("Error fetching entitlements:", error);
      res.status(500).json({ message: "Failed to fetch entitlements" });
    }
  });
  app2.post("/api/admin/entitlements", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const bodySchema = z2.object({
        programId: z2.string(),
        metadata: z2.record(z2.any()).optional()
      });
      const validationResult = bodySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid entitlement data",
          errors: validationResult.error.errors
        });
      }
      const hasEntitlement = await storage.hasActiveEntitlement(
        currentUser.id,
        validationResult.data.programId
      );
      if (hasEntitlement) {
        return res.status(409).json({ message: "Entitlement already exists for this program" });
      }
      const result = await storage.createAdminEntitlement({
        adminId: currentUser.id,
        programId: validationResult.data.programId,
        metadata: validationResult.data.metadata
      });
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating entitlement:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to create entitlement"
      });
    }
  });
  app2.delete("/api/admin/entitlements/:id", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const entitlement = await storage.getAdminEntitlement(id);
      if (!entitlement) {
        return res.status(404).json({ message: "Entitlement not found" });
      }
      if (entitlement.adminId !== currentUser.id) {
        return res.status(403).json({ message: "Cannot delete another admin's entitlement" });
      }
      const adminEntitlementService = new AdminEntitlementService(storage);
      await adminEntitlementService.deactivateEntitlement(id);
      res.json({ message: "Entitlement deleted successfully" });
    } catch (error) {
      console.error("Error deleting entitlement:", error);
      res.status(500).json({ message: "Failed to delete entitlement" });
    }
  });
  app2.get("/api/admin/users/:userId/entitlements", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`[AdminProvisioning] GET /api/admin/users/${userId}/entitlements`);
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const entitlements = await storage.getActiveAdminEntitlementsWithPrograms(userId);
      res.json(entitlements);
    } catch (error) {
      console.error("Error fetching user entitlements:", error);
      res.status(500).json({ message: "Failed to fetch user entitlements" });
    }
  });
  app2.post("/api/admin/users/:userId/entitlements", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`[AdminProvisioning] POST /api/admin/users/${userId}/entitlements`);
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const bodySchema = z2.object({
        programId: z2.string(),
        metadata: z2.record(z2.any()).optional()
      });
      const validationResult = bodySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid entitlement data",
          errors: validationResult.error.errors
        });
      }
      const hasEntitlement = await storage.hasActiveEntitlement(
        userId,
        validationResult.data.programId
      );
      if (hasEntitlement) {
        return res.status(409).json({ message: "Entitlement already exists for this program" });
      }
      const result = await storage.createAdminEntitlement({
        adminId: userId,
        programId: validationResult.data.programId,
        metadata: validationResult.data.metadata
      });
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating user entitlement:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to create user entitlement"
      });
    }
  });
  app2.delete("/api/admin/users/:userId/entitlements/:entitlementId", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { userId, entitlementId } = req.params;
      console.log(`[AdminProvisioning] DELETE /api/admin/users/${userId}/entitlements/${entitlementId}`);
      const entitlement = await storage.getAdminEntitlement(entitlementId);
      if (!entitlement) {
        return res.status(404).json({ message: "Entitlement not found" });
      }
      if (entitlement.adminId !== userId) {
        return res.status(403).json({ message: "Entitlement does not belong to specified user" });
      }
      const adminEntitlementService = new AdminEntitlementService(storage);
      await adminEntitlementService.deactivateEntitlement(entitlementId);
      res.json({ message: "Entitlement deleted successfully" });
    } catch (error) {
      console.error("Error deleting user entitlement:", error);
      res.status(500).json({ message: "Failed to delete user entitlement" });
    }
  });
  app2.get("/api/admin/all-entitlements", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const entitlements = await storage.getAllAdminEntitlementsWithPrograms();
      res.json(entitlements);
    } catch (error) {
      console.error("Error fetching all entitlements:", error);
      res.status(500).json({ message: "Failed to fetch entitlements" });
    }
  });
  app2.get("/api/admin/impersonation/session", isAuthenticated, requireActualAdmin, async (req, res) => {
    try {
      console.log("[AdminProvisioning] GET /api/admin/impersonation/session");
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const session2 = await storage.getActiveImpersonationSession(currentUser.id);
      res.json(session2 || null);
    } catch (error) {
      console.error("Error fetching impersonation session:", error);
      res.status(500).json({ message: "Failed to fetch impersonation session" });
    }
  });
  app2.post("/api/admin/impersonation/start", isAuthenticated, requireActualAdmin, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const bodySchema = z2.object({
        impersonatedUserId: z2.string(),
        reason: z2.string().optional()
      });
      const validationResult = bodySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors
        });
      }
      const targetUser = await storage.getUser(validationResult.data.impersonatedUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }
      const session2 = await storage.createImpersonationSession({
        adminId: currentUser.id,
        impersonatedUserId: validationResult.data.impersonatedUserId,
        reason: validationResult.data.reason
      });
      res.status(201).json(session2);
    } catch (error) {
      console.error("Error starting impersonation:", error);
      res.status(500).json({ message: "Failed to start impersonation" });
    }
  });
  app2.post("/api/admin/impersonation/end", isAuthenticated, requireActualAdmin, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const session2 = await storage.getActiveImpersonationSession(currentUser.id);
      if (!session2) {
        return res.status(404).json({ message: "No active impersonation session" });
      }
      await storage.endImpersonationSession(session2.id);
      res.json({ message: "Impersonation ended successfully" });
    } catch (error) {
      console.error("Error ending impersonation:", error);
      res.status(500).json({ message: "Failed to end impersonation" });
    }
  });
  app2.delete("/api/admin/impersonation/end/:sessionId", isAuthenticated, requireActualAdmin, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      const result = await storage.endImpersonationSession(sessionId);
      if (!result) {
        return res.status(404).json({ message: "Impersonation session not found" });
      }
      res.json({ message: "Impersonation ended successfully" });
    } catch (error) {
      console.error("Error ending impersonation:", error);
      res.status(500).json({ message: "Failed to end impersonation" });
    }
  });
  app2.patch("/api/user/persona", ...authWithImpersonation, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const { persona } = req.body;
      const validPersonas = ["student", "provider", "parent", "donor", "volunteer", "default", null];
      if (!validPersonas.includes(persona)) {
        return res.status(400).json({ message: "Invalid persona value" });
      }
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.updateUser(currentUser.id, { persona }, currentUser.id);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user persona:", error);
      res.status(500).json({ message: "Failed to update persona preference" });
    }
  });
  const uploadTokenCache = /* @__PURE__ */ new Map();
  app2.get("/objects/*", ...authWithImpersonation, async (req, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService3();
    const rawPath = decodeURIComponent(req.params[0] || "");
    const sanitizedPath = `/objects/${rawPath.replace(/\.\./g, "").replace(/^\/+/, "")}`;
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(sanitizedPath);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId,
        requestedPermission: "read" /* READ */
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError3) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  app2.post("/api/objects/upload", ...authWithImpersonation, async (req, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService3();
    try {
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL();
      const uploadToken = `upload_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      uploadTokenCache.set(uploadToken, {
        userId,
        objectPath,
        expiresAt: Date.now() + 15 * 60 * 1e3
        // 15 minutes
      });
      for (const [token, data] of Array.from(uploadTokenCache.entries())) {
        if (data.expiresAt < Date.now()) {
          uploadTokenCache.delete(token);
        }
      }
      res.json({ uploadURL, uploadToken });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });
  app2.post("/api/objects/finalize-upload", ...authWithImpersonation, isAdmin, async (req, res) => {
    const { uploadToken, finalFilename } = req.body;
    if (!uploadToken || !finalFilename) {
      return res.status(400).json({ error: "uploadToken and finalFilename are required" });
    }
    const userId = req.user?.claims?.sub;
    try {
      const tokenData = uploadTokenCache.get(uploadToken);
      if (!tokenData || tokenData.userId !== userId || tokenData.expiresAt < Date.now()) {
        return res.status(403).json({ error: "Invalid or expired upload token" });
      }
      if (!/^[a-z0-9_-]+\.[a-z0-9]+$/i.test(finalFilename)) {
        return res.status(400).json({
          error: "Invalid filename format. Use only letters, numbers, hyphens, underscores, and a valid extension."
        });
      }
      uploadTokenCache.delete(uploadToken);
      const objectStorageService = new ObjectStorageService3();
      const newPath = await objectStorageService.renameObjectEntity(
        tokenData.objectPath,
        finalFilename
      );
      const finalPath = await objectStorageService.setObjectEntityAclPolicy(
        newPath,
        {
          owner: userId,
          visibility: "public"
        }
      );
      res.json({
        objectPath: finalPath,
        filename: finalFilename
      });
    } catch (error) {
      console.error("Error finalizing upload:", error);
      res.status(500).json({ error: "Failed to finalize upload" });
    }
  });
  app2.put("/api/profile-photo", ...authWithImpersonation, async (req, res) => {
    if (!req.body.uploadToken) {
      return res.status(400).json({ error: "uploadToken is required" });
    }
    const userId = req.user?.claims?.sub;
    const uploadToken = req.body.uploadToken;
    try {
      const tokenData = uploadTokenCache.get(uploadToken);
      if (!tokenData || tokenData.userId !== userId || tokenData.expiresAt < Date.now()) {
        return res.status(403).json({ error: "Invalid or expired upload token" });
      }
      uploadTokenCache.delete(uploadToken);
      const currentUser = await storage.getUserByOidcSub(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const objectStorageService = new ObjectStorageService3();
      const objectPath = await objectStorageService.setObjectEntityAclPolicy(
        tokenData.objectPath,
        {
          owner: userId,
          // ACL uses OIDC sub
          visibility: "public"
          // Profile photos are public
        }
      );
      await storage.updateUser(currentUser.id, { profileImageUrl: objectPath }, currentUser.id);
      res.status(200).json({
        objectPath
      });
    } catch (error) {
      console.error("Error setting profile photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/leads", leadLimiter, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const existingLead = await storage.getLeadByEmail(validatedData.email);
      if (existingLead) {
        const updated = await storage.updateLead(existingLead.id, validatedData);
        return res.json(updated);
      }
      const lead = await storage.createLead(validatedData);
      await createTaskForNewLead(storage, lead);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });
  app2.post("/api/interactions", async (req, res) => {
    try {
      const validatedData = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction(validatedData);
      if (validatedData.leadId && validatedData.interactionType) {
        try {
          const engagementDelta = calculateEngagementDelta(validatedData.interactionType);
          const lead = await storage.getLeadById(validatedData.leadId);
          if (lead) {
            const newScore = (lead.engagementScore || 0) + engagementDelta;
            await storage.updateLead(validatedData.leadId, {
              engagementScore: newScore,
              lastInteractionDate: /* @__PURE__ */ new Date()
            });
            await evaluateLeadProgression(
              validatedData.leadId,
              validatedData.interactionType
            );
          }
        } catch (progressionError) {
          console.error("Error updating engagement or evaluating progression:", progressionError);
        }
      }
      res.status(201).json(interaction);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid interaction data", errors: error.errors });
      }
      console.error("Error creating interaction:", error);
      res.status(500).json({ message: "Failed to create interaction" });
    }
  });
  app2.post("/api/funnel/evaluate/:leadId", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { leadId } = req.params;
      const { triggerEvent } = req.body;
      const result = await evaluateLeadProgression(
        leadId,
        triggerEvent,
        req.user.id
      );
      res.json(result);
    } catch (error) {
      console.error("Error evaluating funnel progression:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to evaluate progression" });
    }
  });
  app2.get("/api/funnel/progression-history/:leadId", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { leadId } = req.params;
      const history = await getLeadProgressionHistory(leadId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching progression history:", error);
      res.status(500).json({ message: "Failed to fetch progression history" });
    }
  });
  app2.post("/api/funnel/manual-progress/:leadId", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { leadId } = req.params;
      const { toStage, reason } = req.body;
      if (!toStage) {
        return res.status(400).json({ message: "toStage is required" });
      }
      const validStages = ["awareness", "consideration", "decision", "retention"];
      if (!validStages.includes(toStage)) {
        return res.status(400).json({
          message: "Invalid toStage. Must be one of: awareness, consideration, decision, retention"
        });
      }
      const result = await manuallyProgressLead(
        leadId,
        toStage,
        req.user.id,
        reason
      );
      res.json(result);
    } catch (error) {
      console.error("Error manually progressing lead:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to manually progress lead" });
    }
  });
  app2.get("/api/admin/funnel/rules", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const rules = await db.select().from(funnelProgressionRules);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching funnel rules:", error);
      res.status(500).json({ message: "Failed to fetch funnel rules" });
    }
  });
  app2.post("/api/admin/funnel/rules", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const validatedData = insertFunnelProgressionRuleSchema.parse(req.body);
      const [rule] = await db.insert(funnelProgressionRules).values(validatedData).returning();
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      }
      console.error("Error creating funnel rule:", error);
      res.status(500).json({ message: "Failed to create funnel rule" });
    }
  });
  app2.patch("/api/admin/funnel/rules/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertFunnelProgressionRuleSchema.partial().parse(req.body);
      const [updated] = await db.update(funnelProgressionRules).set({ ...validatedData, updatedAt: /* @__PURE__ */ new Date() }).where(eq11(funnelProgressionRules.id, id)).returning();
      if (!updated) {
        return res.status(404).json({ message: "Rule not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      }
      console.error("Error updating funnel rule:", error);
      res.status(500).json({ message: "Failed to update funnel rule" });
    }
  });
  app2.delete("/api/admin/funnel/rules/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { id } = req.params;
      const [deleted] = await db.delete(funnelProgressionRules).where(eq11(funnelProgressionRules.id, id)).returning();
      if (!deleted) {
        return res.status(404).json({ message: "Rule not found" });
      }
      res.json({ message: "Rule deleted successfully" });
    } catch (error) {
      console.error("Error deleting funnel rule:", error);
      res.status(500).json({ message: "Failed to delete funnel rule" });
    }
  });
  app2.get("/api/admin/funnel/stats", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { persona } = req.query;
      console.log("[funnel-stats] Starting query, persona filter:", persona);
      const totalWhereCondition = persona && persona !== "all" ? and12(isNotNull(leads.persona), eq11(leads.persona, persona)) : isNotNull(leads.persona);
      console.log("[funnel-stats] About to execute total count query");
      const [{ count: totalProgressions }] = await db.select({ count: sql12`count(*)` }).from(funnelProgressionHistory).innerJoin(leads, eq11(funnelProgressionHistory.leadId, leads.id)).where(totalWhereCondition);
      console.log("[funnel-stats] Total count query completed:", totalProgressions);
      const historyWhereCondition = persona && persona !== "all" ? and12(isNotNull(leads.persona), eq11(leads.persona, persona)) : isNotNull(leads.persona);
      console.log("[funnel-stats] About to execute recent history query");
      const personaSQLFilter = persona && persona !== "all" ? sql12`AND l.persona = ${persona}` : sql12``;
      const recentHistory = await db.execute(sql12`
        SELECT 
          fph.id,
          fph.lead_id as "leadId",
          fph.from_stage as "fromStage",
          fph.to_stage as "toStage",
          fph.reason,
          fph.engagement_score_at_change as "engagementScore",
          fph.triggered_by as "triggeredBy",
          fph.created_at as "createdAt",
          l.first_name as "leadFirstName",
          l.last_name as "leadLastName",
          l.email as "leadEmail",
          l.persona as "leadPersona"
        FROM funnel_progression_history fph
        INNER JOIN leads l ON fph.lead_id = l.id
        WHERE l.persona IS NOT NULL ${personaSQLFilter}
        ORDER BY fph.created_at DESC
        LIMIT 50
      `);
      console.log("[funnel-stats] Recent history query completed:", recentHistory.rows.length, "rows");
      const reshapedHistory = recentHistory.rows.map((h) => ({
        id: h.id,
        leadId: h.leadId,
        fromStage: h.fromStage,
        toStage: h.toStage,
        reason: h.reason,
        engagementScore: h.engagementScore,
        triggeredBy: h.triggeredBy,
        createdAt: h.createdAt,
        lead: {
          firstName: h.leadFirstName,
          lastName: h.leadLastName,
          email: h.leadEmail,
          persona: h.leadPersona
        }
      }));
      const stageWhereCondition = persona && persona !== "all" ? eq11(leads.persona, persona) : void 0;
      console.log("[funnel-stats] About to execute stage distribution query");
      const allLeads = stageWhereCondition ? await db.select({ funnelStage: leads.funnelStage }).from(leads).where(stageWhereCondition) : await db.select({ funnelStage: leads.funnelStage }).from(leads);
      console.log("[funnel-stats] Stage distribution query completed:", allLeads.length, "rows");
      const progressionsByStage = {};
      allLeads.forEach((lead) => {
        if (lead.funnelStage) {
          progressionsByStage[lead.funnelStage] = (progressionsByStage[lead.funnelStage] || 0) + 1;
        }
      });
      const personaHistoryWhereCondition = persona && persona !== "all" ? and12(isNotNull(leads.persona), eq11(leads.persona, persona)) : isNotNull(leads.persona);
      console.log("[funnel-stats] About to execute persona breakdown query");
      const allHistory = await db.select({
        persona: leads.persona,
        count: sql12`count(*)`
      }).from(funnelProgressionHistory).innerJoin(leads, eq11(funnelProgressionHistory.leadId, leads.id)).where(personaHistoryWhereCondition).groupBy(leads.persona);
      console.log("[funnel-stats] Persona breakdown query completed:", allHistory.length, "rows");
      const progressionsByPersona = {};
      allHistory.forEach((row) => {
        if (row.persona) {
          progressionsByPersona[row.persona] = Number(row.count);
        }
      });
      const personaFilter = persona && persona !== "all" ? sql12`AND l.persona = ${persona}` : sql12``;
      const velocityQuery = await db.execute(sql12`
        WITH stage_transitions AS (
          SELECT 
            l.persona,
            h.lead_id,
            h.to_stage,
            h.created_at,
            LAG(h.created_at) OVER (PARTITION BY h.lead_id ORDER BY h.created_at) as prev_created_at
          FROM funnel_progression_history h
          INNER JOIN leads l ON h.lead_id = l.id
          WHERE l.persona IS NOT NULL ${personaFilter}
        )
        SELECT 
          persona,
          ROUND(AVG(EXTRACT(EPOCH FROM (created_at - prev_created_at)) / 86400)::numeric, 1) as avg_days
        FROM stage_transitions
        WHERE prev_created_at IS NOT NULL AND persona IS NOT NULL
        GROUP BY persona
      `);
      const averageVelocityDays = {};
      velocityQuery.rows.forEach((row) => {
        if (row.persona && row.avg_days !== null) {
          averageVelocityDays[row.persona] = Number(row.avg_days);
        }
      });
      const stats = {
        totalProgressions: Number(totalProgressions),
        progressionsByStage,
        progressionsByPersona,
        averageVelocityDays,
        recentProgressions: reshapedHistory.slice(0, 20)
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching funnel stats:", error);
      res.status(500).json({ message: "Failed to fetch funnel statistics" });
    }
  });
  app2.get("/api/admin/leads", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { persona, funnelStage, engagement, leadStatus } = req.query;
      const leads2 = await storage.getFilteredLeads({
        persona,
        funnelStage,
        engagement,
        leadStatus
      });
      res.json(leads2);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });
  app2.get("/api/admin/leads/template", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const format2 = req.query.format === "csv" ? "csv" : "xlsx";
      const templateData = [
        {
          Email: "example@email.com",
          "First Name": "John",
          "Last Name": "Doe",
          Phone: "+1234567890",
          Persona: "student",
          "Funnel Stage": "awareness",
          "Pipeline Stage": "new_lead",
          "Lead Source": "bulk_import",
          Notes: "Sample lead notes"
        }
      ];
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
      if (format2 === "csv") {
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        res.setHeader("Content-Disposition", "attachment; filename=leads_import_template.csv");
        res.setHeader("Content-Type", "text/csv");
        res.send(csv);
      } else {
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Disposition", "attachment; filename=leads_import_template.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(buffer);
      }
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });
  app2.get("/api/admin/leads/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });
  app2.patch("/api/admin/leads/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const validatedData = updateLeadSchema.parse(req.body);
      const lead = await storage.updateLead(req.params.id, validatedData);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid lead data",
          errors: error.errors
        });
      }
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });
  app2.delete("/api/admin/leads/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });
  const fileUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedMimes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv"];
      const allowedExts = [".xlsx", ".xls", ".csv"];
      const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."));
      if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type. Only .xlsx, .xls, and .csv files are allowed."));
      }
    }
  });
  app2.post("/api/admin/leads/bulk-import", ...authWithImpersonation, isAdmin, fileUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const workbook = XLSX.read(req.file.buffer, { type: "buffer", raw: false });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      const results = {
        total: data.length,
        successful: 0,
        failed: 0,
        errors: []
      };
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const email = row.Email || row.email;
          if (!email) {
            throw new Error("Email is required");
          }
          const existingLead = await storage.getLeadByEmail(email);
          if (existingLead) {
            const updateData = { email };
            if (row["First Name"] || row.firstName) updateData.firstName = row["First Name"] || row.firstName;
            if (row["Last Name"] || row.lastName) updateData.lastName = row["Last Name"] || row.lastName;
            if (row.Phone || row.phone) updateData.phone = row.Phone || row.phone;
            if (row.Persona || row.persona) updateData.persona = row.Persona || row.persona;
            if (row["Funnel Stage"] || row.funnelStage) updateData.funnelStage = row["Funnel Stage"] || row.funnelStage;
            if (row["Pipeline Stage"] || row.pipelineStage) updateData.pipelineStage = row["Pipeline Stage"] || row.pipelineStage;
            if (row["Lead Source"] || row.leadSource) updateData.leadSource = row["Lead Source"] || row.leadSource;
            if (row.Notes || row.notes) updateData.notes = row.Notes || row.notes;
            await storage.updateLead(existingLead.id, updateData);
          } else {
            const newLeadData = {
              email,
              firstName: row["First Name"] || row.firstName || null,
              lastName: row["Last Name"] || row.lastName || null,
              phone: row.Phone || row.phone || null,
              persona: row.Persona || row.persona || "student",
              funnelStage: row["Funnel Stage"] || row.funnelStage || "awareness",
              pipelineStage: row["Pipeline Stage"] || row.pipelineStage || "new_lead",
              leadSource: row["Lead Source"] || row.leadSource || "bulk_import",
              notes: row.Notes || row.notes || null
            };
            const validatedData = insertLeadSchema.parse(newLeadData);
            const newLead = await storage.createLead(validatedData);
            await createTaskForNewLead(storage, newLead);
          }
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            email: row.Email || row.email || "Unknown",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      res.json(results);
    } catch (error) {
      console.error("Error processing bulk import:", error);
      res.status(500).json({ message: "Failed to process bulk import" });
    }
  });
  app2.use("/api/admin/leads/bulk-import", (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File too large. Maximum size is 10MB." });
      }
      return res.status(400).json({ message: error.message });
    } else if (error) {
      return res.status(400).json({ message: error.message });
    }
    next();
  });
  const googleSheetImportSchema = z2.object({
    sheetUrl: z2.string().url("Invalid Google Sheets URL")
  });
  app2.post("/api/admin/leads/google-sheets-import", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const validatedInput = googleSheetImportSchema.parse(req.body);
      const { sheetUrl } = validatedInput;
      const parsed = parseGoogleSheetUrl(sheetUrl);
      if (!parsed) {
        return res.status(400).json({ message: "Invalid Google Sheets URL" });
      }
      const data = await fetchSheetData(parsed.spreadsheetId, parsed.gid, parsed.range);
      if (!data || data.length === 0) {
        return res.status(400).json({ message: "No data found in the sheet" });
      }
      const results = {
        total: data.length,
        successful: 0,
        failed: 0,
        errors: []
      };
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const email = row.Email || row.email;
          if (!email) {
            throw new Error("Email is required");
          }
          const existingLead = await storage.getLeadByEmail(email);
          if (existingLead) {
            const updateData = { email };
            if (row["First Name"] || row.firstName) updateData.firstName = row["First Name"] || row.firstName;
            if (row["Last Name"] || row.lastName) updateData.lastName = row["Last Name"] || row.lastName;
            if (row.Phone || row.phone) updateData.phone = row.Phone || row.phone;
            if (row.Persona || row.persona) updateData.persona = row.Persona || row.persona;
            if (row["Funnel Stage"] || row.funnelStage) updateData.funnelStage = row["Funnel Stage"] || row.funnelStage;
            if (row["Pipeline Stage"] || row.pipelineStage) updateData.pipelineStage = row["Pipeline Stage"] || row.pipelineStage;
            if (row["Lead Source"] || row.leadSource) updateData.leadSource = row["Lead Source"] || row.leadSource;
            if (row.Notes || row.notes) updateData.notes = row.Notes || row.notes;
            await storage.updateLead(existingLead.id, updateData);
          } else {
            const newLeadData = {
              email,
              firstName: row["First Name"] || row.firstName || null,
              lastName: row["Last Name"] || row.lastName || null,
              phone: row.Phone || row.phone || null,
              persona: row.Persona || row.persona || "student",
              funnelStage: row["Funnel Stage"] || row.funnelStage || "awareness",
              pipelineStage: row["Pipeline Stage"] || row.pipelineStage || "new_lead",
              leadSource: row["Lead Source"] || row.leadSource || "google_sheets",
              notes: row.Notes || row.notes || null
            };
            const validatedData = insertLeadSchema.parse(newLeadData);
            const newLead = await storage.createLead(validatedData);
            await createTaskForNewLead(storage, newLead);
          }
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            email: row.Email || row.email || "Unknown",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      res.json(results);
    } catch (error) {
      console.error("Error processing Google Sheets import:", error);
      if (error.message?.includes("not connected")) {
        return res.status(503).json({ message: "Google Sheets integration not set up. Please connect your Google account." });
      }
      if (error.code === 404 || error.message?.includes("not found")) {
        return res.status(404).json({ message: "Sheet not found. Please check the URL and ensure you have access to the sheet." });
      }
      if (error.code === 403 || error.message?.includes("permission")) {
        return res.status(403).json({ message: "Access denied. Please ensure the sheet is shared with your Google account." });
      }
      res.status(500).json({ message: error.message || "Failed to import from Google Sheets" });
    }
  });
  app2.post("/api/admin/leads/webhook", async (req, res) => {
    try {
      const webhookSecret = process.env.LEAD_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("LEAD_WEBHOOK_SECRET not configured - webhook disabled");
        return res.status(503).json({ message: "Webhook not configured" });
      }
      const providedSecret = req.headers["x-webhook-secret"] || req.query.secret;
      if (providedSecret !== webhookSecret) {
        return res.status(401).json({ message: "Unauthorized: Invalid webhook secret" });
      }
      const leadData = req.body;
      if (!leadData.email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const existingLead = await storage.getLeadByEmail(leadData.email);
      if (existingLead) {
        return res.status(200).json({
          message: "Lead already exists",
          leadId: existingLead.id,
          duplicate: true
        });
      }
      const validatedData = insertLeadSchema.parse({
        email: leadData.email,
        firstName: leadData.firstName || leadData.first_name || null,
        lastName: leadData.lastName || leadData.last_name || null,
        phone: leadData.phone || null,
        company: leadData.company || leadData.organization || null,
        jobTitle: leadData.jobTitle || leadData.job_title || leadData.title || null,
        linkedinUrl: leadData.linkedinUrl || leadData.linkedin_url || leadData.linkedin || null,
        persona: leadData.persona || "donor",
        // Default persona for B2B leads
        funnelStage: leadData.funnelStage || "awareness",
        // Default stage
        leadSource: "webhook",
        qualificationStatus: "pending",
        outreachStatus: "pending",
        notes: leadData.notes || null,
        enrichmentData: leadData.enrichmentData || leadData.metadata || null
      });
      const newLead = await storage.createLead(validatedData);
      await createTaskForNewLead(storage, newLead);
      res.status(201).json({
        message: "Lead created successfully",
        leadId: newLead.id,
        duplicate: false
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      console.error("Error processing webhook lead:", error);
      res.status(500).json({ message: "Failed to process webhook lead" });
    }
  });
  app2.post("/api/admin/leads/qualify", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { leadIds, icpCriteriaId } = req.body;
      if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({ message: "leadIds array is required" });
      }
      let icp;
      if (icpCriteriaId) {
        icp = await storage.getIcpCriteria(icpCriteriaId);
      } else {
        icp = await storage.getDefaultIcpCriteria();
      }
      if (!icp) {
        return res.status(404).json({ message: "ICP criteria not found. Please create one first." });
      }
      const leadsToQualify = await Promise.all(
        leadIds.map((id) => storage.getLead(id))
      );
      const validLeads = leadsToQualify.filter((l) => l !== void 0);
      if (validLeads.length === 0) {
        return res.status(404).json({ message: "No valid leads found" });
      }
      const { batchQualifyLeads: batchQualifyLeads2 } = await Promise.resolve().then(() => (init_leadQualifier(), leadQualifier_exports));
      const results = await batchQualifyLeads2(validLeads, icp);
      const updatedLeads = [];
      for (const [leadId, result] of results.entries()) {
        const updated = await storage.updateLead(leadId, {
          qualificationScore: result.score,
          qualificationStatus: result.status,
          qualificationInsights: result.insights,
          metadata: {
            matchedCriteria: result.matchedCriteria,
            redFlags: result.redFlags,
            recommendations: result.recommendations
          }
        });
        if (updated) {
          updatedLeads.push(updated);
        }
      }
      res.json({
        message: `Qualified ${updatedLeads.length} leads`,
        results: updatedLeads.map((l) => ({
          id: l.id,
          name: `${l.firstName} ${l.lastName}`,
          email: l.email,
          score: l.qualificationScore,
          status: l.qualificationStatus
        }))
      });
    } catch (error) {
      console.error("Error qualifying leads:", error);
      res.status(500).json({ message: "Failed to qualify leads" });
    }
  });
  app2.post("/api/admin/leads/:id/generate-outreach", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      const { generateOutreachEmail: generateOutreachEmail2 } = await Promise.resolve().then(() => (init_leadQualifier(), leadQualifier_exports));
      const qualificationResult = lead.qualificationInsights ? {
        score: lead.qualificationScore || 0,
        status: lead.qualificationStatus,
        insights: lead.qualificationInsights,
        matchedCriteria: lead.metadata?.matchedCriteria || [],
        redFlags: lead.metadata?.redFlags || [],
        recommendations: lead.metadata?.recommendations || ""
      } : void 0;
      const email = await generateOutreachEmail2(lead, qualificationResult);
      const outreachEmail = await storage.createOutreachEmail({
        leadId: lead.id,
        subject: email.subject,
        bodyHtml: email.bodyHtml,
        bodyText: email.bodyText,
        wasAiGenerated: true,
        generatedBy: req.user?.id,
        status: "draft"
      });
      await storage.updateLead(lead.id, {
        outreachStatus: "draft_ready"
      });
      res.json({
        message: "Outreach email generated successfully",
        email: outreachEmail
      });
    } catch (error) {
      console.error("Error generating outreach email:", error);
      res.status(500).json({ message: "Failed to generate outreach email" });
    }
  });
  app2.patch("/api/admin/leads/:id/outreach-status", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!["pending", "draft_ready", "sent", "bounced", "replied"].includes(status)) {
        return res.status(400).json({ message: "Invalid outreach status" });
      }
      const lead = await storage.getLeadById(id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      await storage.updateLead(id, { outreachStatus: status });
      res.json({ message: "Outreach status updated successfully" });
    } catch (error) {
      console.error("Error updating outreach status:", error);
      res.status(500).json({ message: "Failed to update outreach status" });
    }
  });
  app2.patch("/api/admin/leads/bulk-outreach-status", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { leadIds, status } = req.body;
      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({ message: "leadIds must be a non-empty array" });
      }
      if (!["pending", "draft_ready", "sent", "bounced", "replied"].includes(status)) {
        return res.status(400).json({ message: "Invalid outreach status" });
      }
      for (const id of leadIds) {
        await storage.updateLead(id, { outreachStatus: status });
      }
      res.json({ message: `Updated ${leadIds.length} leads to ${status}` });
    } catch (error) {
      console.error("Error bulk updating outreach status:", error);
      res.status(500).json({ message: "Failed to bulk update outreach status" });
    }
  });
  app2.post("/api/admin/leads/:id/send-outreach", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { outreachEmailId } = req.body;
      if (!outreachEmailId) {
        return res.status(400).json({ message: "outreachEmailId is required" });
      }
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      const outreachEmail = await storage.getOutreachEmail(outreachEmailId);
      if (!outreachEmail) {
        return res.status(404).json({ message: "Outreach email not found" });
      }
      if (outreachEmail.leadId !== lead.id) {
        return res.status(400).json({ message: "Email does not belong to this lead" });
      }
      const { sendEmail: sendEmail3 } = await Promise.resolve().then(() => (init_email(), email_exports));
      const sendResult = await sendEmail3(storage, {
        to: lead.email,
        toName: `${lead.firstName} ${lead.lastName}`,
        subject: outreachEmail.subject,
        html: outreachEmail.bodyHtml,
        text: outreachEmail.bodyText,
        metadata: {
          leadId: lead.id,
          outreachEmailId: outreachEmail.id,
          type: "outreach"
        }
      });
      if (sendResult.success) {
        await storage.updateOutreachEmail(outreachEmail.id, {
          status: "sent",
          sentAt: /* @__PURE__ */ new Date(),
          sentBy: req.user?.id,
          providerMessageId: sendResult.messageId
        });
        await storage.updateLead(lead.id, {
          outreachStatus: "sent",
          lastOutreachAt: /* @__PURE__ */ new Date()
        });
        res.json({
          message: "Outreach email sent successfully",
          messageId: sendResult.messageId
        });
      } else {
        await storage.updateOutreachEmail(outreachEmail.id, {
          status: "failed",
          errorMessage: sendResult.error,
          retryCount: (outreachEmail.retryCount || 0) + 1
        });
        res.status(500).json({
          message: "Failed to send outreach email",
          error: sendResult.error
        });
      }
    } catch (error) {
      console.error("Error sending outreach email:", error);
      res.status(500).json({ message: "Failed to send outreach email" });
    }
  });
  app2.get("/api/admin/leads/:id/interactions", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const interactions2 = await storage.getLeadInteractions(req.params.id);
      res.json(interactions2);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      res.status(500).json({ message: "Failed to fetch interactions" });
    }
  });
  app2.get("/api/leads/:id/email-engagement", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { id: leadId } = req.params;
      const [opens, clicks] = await Promise.all([
        storage.getLeadEmailOpens(leadId),
        storage.getLeadEmailClicks(leadId)
      ]);
      const uniqueCampaigns = /* @__PURE__ */ new Set([
        ...opens.map((o) => o.campaignId).filter(Boolean),
        ...clicks.map((c) => c.campaignId).filter(Boolean)
      ]);
      const lastActivity = [...opens, ...clicks].map((item) => "openedAt" in item ? item.openedAt : item.clickedAt).filter(Boolean).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
      const summary = {
        totalOpens: opens.length,
        totalClicks: clicks.length,
        engagedCampaigns: uniqueCampaigns.size,
        lastActivity: lastActivity || null
      };
      res.json({ summary, opens, clicks });
    } catch (error) {
      console.error("Error fetching email engagement:", error);
      res.status(500).json({ message: "Failed to fetch email engagement" });
    }
  });
  app2.get("/api/lead-magnets", async (req, res) => {
    try {
      const { persona } = req.query;
      const magnets = persona ? await storage.getLeadMagnetsByPersona(persona) : await storage.getAllLeadMagnets();
      res.json(magnets);
    } catch (error) {
      console.error("Error fetching lead magnets:", error);
      res.status(500).json({ message: "Failed to fetch lead magnets" });
    }
  });
  app2.post("/api/admin/lead-magnets", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const validatedData = insertLeadMagnetSchema.parse(req.body);
      const magnet = await storage.createLeadMagnet(validatedData);
      res.status(201).json(magnet);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid lead magnet data", errors: error.errors });
      }
      console.error("Error creating lead magnet:", error);
      res.status(500).json({ message: "Failed to create lead magnet" });
    }
  });
  app2.patch("/api/admin/lead-magnets/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const magnet = await storage.updateLeadMagnet(req.params.id, req.body);
      if (!magnet) {
        return res.status(404).json({ message: "Lead magnet not found" });
      }
      res.json(magnet);
    } catch (error) {
      console.error("Error updating lead magnet:", error);
      res.status(500).json({ message: "Failed to update lead magnet" });
    }
  });
  app2.delete("/api/admin/lead-magnets/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      await storage.deleteLeadMagnet(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead magnet:", error);
      res.status(500).json({ message: "Failed to delete lead magnet" });
    }
  });
  app2.get("/api/admin/icp-criteria", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const criteria = await storage.getAllIcpCriteria();
      res.json(criteria);
    } catch (error) {
      console.error("Error fetching ICP criteria:", error);
      res.status(500).json({ message: "Failed to fetch ICP criteria" });
    }
  });
  app2.get("/api/admin/icp-criteria/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const criteria = await storage.getIcpCriteria(req.params.id);
      if (!criteria) {
        return res.status(404).json({ message: "ICP criteria not found" });
      }
      res.json(criteria);
    } catch (error) {
      console.error("Error fetching ICP criteria:", error);
      res.status(500).json({ message: "Failed to fetch ICP criteria" });
    }
  });
  app2.post("/api/admin/icp-criteria", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const validatedData = insertIcpCriteriaSchema.parse({
        ...req.body,
        createdBy: req.user?.id
      });
      const criteria = await storage.createIcpCriteria(validatedData);
      res.status(201).json(criteria);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid ICP criteria data", errors: error.errors });
      }
      console.error("Error creating ICP criteria:", error);
      res.status(500).json({ message: "Failed to create ICP criteria" });
    }
  });
  app2.patch("/api/admin/icp-criteria/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const criteria = await storage.updateIcpCriteria(req.params.id, req.body);
      if (!criteria) {
        return res.status(404).json({ message: "ICP criteria not found" });
      }
      res.json(criteria);
    } catch (error) {
      console.error("Error updating ICP criteria:", error);
      res.status(500).json({ message: "Failed to update ICP criteria" });
    }
  });
  app2.delete("/api/admin/icp-criteria/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      await storage.deleteIcpCriteria(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ICP criteria:", error);
      res.status(500).json({ message: "Failed to delete ICP criteria" });
    }
  });
  app2.get("/api/admin/outreach-emails", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { status, limit } = req.query;
      const emails = await storage.getAllOutreachEmails({
        status,
        limit: limit ? parseInt(limit) : void 0
      });
      res.json(emails);
    } catch (error) {
      console.error("Error fetching outreach emails:", error);
      res.status(500).json({ message: "Failed to fetch outreach emails" });
    }
  });
  app2.get("/api/admin/leads/:leadId/outreach-emails", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const emails = await storage.getLeadOutreachEmails(req.params.leadId);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching lead outreach emails:", error);
      res.status(500).json({ message: "Failed to fetch lead outreach emails" });
    }
  });
  app2.get("/api/admin/analytics", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const allLeads = await storage.getAllLeads();
      const leads2 = allLeads.filter((l) => {
        const status = l.leadStatus || "active";
        return status === "active" || status === "nurture";
      });
      const analytics = {
        totalLeads: leads2.length,
        byPersona: {
          student: leads2.filter((l) => l.persona === "student").length,
          provider: leads2.filter((l) => l.persona === "provider").length,
          parent: leads2.filter((l) => l.persona === "parent").length,
          donor: leads2.filter((l) => l.persona === "donor").length,
          volunteer: leads2.filter((l) => l.persona === "volunteer").length
        },
        byFunnelStage: {
          awareness: leads2.filter((l) => l.funnelStage === "awareness").length,
          consideration: leads2.filter((l) => l.funnelStage === "consideration").length,
          decision: leads2.filter((l) => l.funnelStage === "decision").length,
          retention: leads2.filter((l) => l.funnelStage === "retention").length
        },
        converted: leads2.filter((l) => l.funnelStage === "decision" || l.funnelStage === "retention").length,
        avgEngagementScore: leads2.reduce((sum2, l) => sum2 + (l.engagementScore || 0), 0) / leads2.length || 0
      };
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  const cacAnalytics = createCacLtgpAnalyticsService(storage);
  app2.get("/api/admin/cac-ltgp/overview", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const overview = await cacAnalytics.getCACLTGPOverview();
      res.json(overview);
    } catch (error) {
      console.error("Error fetching CAC:LTGP overview:", error);
      res.status(500).json({ message: "Failed to fetch CAC:LTGP overview" });
    }
  });
  app2.get("/api/admin/cac-ltgp/channels", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const channels = await cacAnalytics.getChannelPerformance();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching channel performance:", error);
      res.status(500).json({ message: "Failed to fetch channel performance" });
    }
  });
  app2.get("/api/admin/cac-ltgp/campaigns", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const campaigns = await cacAnalytics.getCampaignPerformance();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaign performance:", error);
      res.status(500).json({ message: "Failed to fetch campaign performance" });
    }
  });
  app2.get("/api/admin/cac-ltgp/cohorts", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const periodType = req.query.periodType || "month";
      const cohorts = await cacAnalytics.getCohortAnalysis(periodType);
      res.json(cohorts);
    } catch (error) {
      console.error("Error fetching cohort analysis:", error);
      res.status(500).json({ message: "Failed to fetch cohort analysis" });
    }
  });
  app2.get("/api/admin/donors/lifecycle", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const stage = req.query.stage;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 25;
      const result = await storage.listLifecycleWithLeads({ stage, page, limit });
      res.json({
        donors: result.donors,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching donor lifecycle data:", error);
      res.status(500).json({ message: "Failed to fetch donor lifecycle data" });
    }
  });
  app2.get("/api/admin/donors/lifecycle/stats", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const stageCounts = await storage.countLifecycleByStage();
      res.json(stageCounts);
    } catch (error) {
      console.error("Error fetching lifecycle stats:", error);
      res.status(500).json({ message: "Failed to fetch lifecycle stats" });
    }
  });
  app2.get("/api/admin/acquisition-channels", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const channels = await storage.getAllAcquisitionChannels();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching acquisition channels:", error);
      res.status(500).json({ message: "Failed to fetch acquisition channels" });
    }
  });
  app2.post("/api/admin/acquisition-channels", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const validated = insertAcquisitionChannelSchema.parse(req.body);
      const channel = await storage.createAcquisitionChannel(validated);
      res.json(channel);
    } catch (error) {
      console.error("Error creating acquisition channel:", error);
      res.status(500).json({ message: "Failed to create acquisition channel" });
    }
  });
  app2.patch("/api/admin/acquisition-channels/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const validated = insertAcquisitionChannelSchema.partial().parse(req.body);
      const channel = await storage.updateAcquisitionChannel(req.params.id, validated);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.json(channel);
    } catch (error) {
      console.error("Error updating acquisition channel:", error);
      res.status(500).json({ message: "Failed to update acquisition channel" });
    }
  });
  app2.get("/api/admin/marketing-campaigns", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const campaigns = await storage.getAllMarketingCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching marketing campaigns:", error);
      res.status(500).json({ message: "Failed to fetch marketing campaigns" });
    }
  });
  app2.post("/api/admin/marketing-campaigns", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const validated = insertMarketingCampaignSchema.parse(req.body);
      const campaign = await storage.createMarketingCampaign(validated);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating marketing campaign:", error);
      res.status(500).json({ message: "Failed to create marketing campaign" });
    }
  });
  app2.patch("/api/admin/marketing-campaigns/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const validated = insertMarketingCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateMarketingCampaign(req.params.id, validated);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error updating marketing campaign:", error);
      res.status(500).json({ message: "Failed to update marketing campaign" });
    }
  });
  app2.get("/api/admin/channel-spend", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const entries = await storage.getAllSpendEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching spend entries:", error);
      res.status(500).json({ message: "Failed to fetch spend entries" });
    }
  });
  app2.post("/api/admin/channel-spend", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const validated = insertChannelSpendLedgerSchema.parse(req.body);
      const entry = await storage.createSpendEntry(validated);
      res.json(entry);
    } catch (error) {
      console.error("Error creating spend entry:", error);
      res.status(500).json({ message: "Failed to create spend entry" });
    }
  });
  app2.get("/api/admin/economics-settings", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const settings = await storage.getEconomicsSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching economics settings:", error);
      res.status(500).json({ message: "Failed to fetch economics settings" });
    }
  });
  app2.patch("/api/admin/economics-settings", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const validated = insertEconomicsSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateEconomicsSettings(validated);
      res.json(settings);
    } catch (error) {
      console.error("Error updating economics settings:", error);
      res.status(500).json({ message: "Failed to update economics settings" });
    }
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
    // 10MB limit
  });
  app2.post("/api/admin/images/upload", ...authWithImpersonation, isAdmin, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      const { name, usage, localPath } = req.body;
      const validationResult = insertImageAssetSchema.pick({
        name: true,
        usage: true,
        localPath: true
      }).safeParse({ name, usage, localPath: localPath || null });
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid input data",
          errors: validationResult.error.errors
        });
      }
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      const createSlug = (str) => str.toLowerCase().trim().replace(/\s+/g, "-");
      let uniqueName = name.trim();
      const existingImages = await storage.getAllImageAssets();
      const existingSlugsMap = /* @__PURE__ */ new Map();
      existingImages.forEach((img) => {
        existingSlugsMap.set(createSlug(img.name), img.name);
      });
      const currentSlug = createSlug(uniqueName);
      if (existingSlugsMap.has(currentSlug)) {
        let counter = 2;
        const baseName = uniqueName;
        while (existingSlugsMap.has(createSlug(`${baseName} (${counter})`))) {
          counter++;
        }
        uniqueName = `${baseName} (${counter})`;
        console.log(`[Image Upload] Renamed duplicate image from "${name}" to "${uniqueName}"`);
      }
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
        folder: `julies-family-learning/${usage}`,
        publicId: createSlug(uniqueName),
        upscale: true,
        quality: "auto:best"
      });
      const imageAsset = await storage.createImageAsset({
        name: uniqueName,
        originalFilename: req.file.originalname,
        localPath: localPath || null,
        cloudinaryPublicId: cloudinaryResult.publicId,
        cloudinaryUrl: cloudinaryResult.url,
        cloudinarySecureUrl: cloudinaryResult.secureUrl,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
        fileSize: cloudinaryResult.bytes,
        usage,
        uploadedBy: currentUser?.id || null,
        isActive: true
      });
      res.json(imageAsset);
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });
  app2.get("/api/admin/images", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const images = await storage.getAllImageAssets();
      res.json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });
  app2.get("/api/admin/images/usage/:usage", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const images = await storage.getImageAssetsByUsage(req.params.usage);
      res.json(images);
    } catch (error) {
      console.error("Error fetching images by usage:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });
  app2.get("/api/admin/images/:id", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const image = await storage.getImageAsset(req.params.id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      console.error("Error fetching image:", error);
      res.status(500).json({ message: "Failed to fetch image" });
    }
  });
  app2.patch("/api/admin/images/:id", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validatedData = insertImageAssetSchema.partial().parse(req.body);
      const image = await storage.updateImageAsset(req.params.id, validatedData);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      console.error("Error updating image:", error);
      res.status(500).json({ message: "Failed to update image" });
    }
  });
  app2.delete("/api/admin/images/:id", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const image = await storage.getImageAsset(req.params.id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      await deleteFromCloudinary(image.cloudinaryPublicId);
      await storage.deleteImageAsset(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });
  app2.get("/api/images/optimize/:publicId", async (req, res) => {
    try {
      const { width, height, quality, format: format2 } = req.query;
      const optimizedUrl = getOptimizedImageUrl(decodeURIComponent(req.params.publicId), {
        width: width ? parseInt(width) : void 0,
        height: height ? parseInt(height) : void 0,
        quality,
        format: format2
      });
      res.json({ url: optimizedUrl });
    } catch (error) {
      console.error("Error generating optimized URL:", error);
      res.status(500).json({ message: "Failed to generate optimized URL" });
    }
  });
  app2.get("/api/images/by-name/:name", async (req, res) => {
    try {
      const images = await storage.getAllImageAssets();
      const image = images.find(
        (img) => img.name.toLowerCase() === decodeURIComponent(req.params.name).toLowerCase() && img.isActive
      );
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      console.error("Error fetching image by name:", error);
      res.status(500).json({ message: "Failed to fetch image" });
    }
  });
  app2.get("/api/content", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const items = await storage.getAllContentItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching content items:", error);
      res.status(500).json({ message: "Failed to fetch content items" });
    }
  });
  app2.get("/api/content/type/:type", async (req, res) => {
    try {
      const items = await storage.getContentItemsByType(req.params.type);
      res.json(items);
    } catch (error) {
      console.error("Error fetching content items by type:", error);
      res.status(500).json({ message: "Failed to fetch content items", _debug: { error: error?.message, code: error?.code, stack: error?.stack?.substring(0, 500) } });
    }
  });
  app2.get("/api/student/my-project", ...authWithImpersonation, async (req, res) => {
    try {
      const oidcSub = req.user?.claims?.sub;
      if (!oidcSub) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUserByOidcSub(oidcSub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      const project = await storage.getStudentProjectByUserId(user.id);
      if (!project) {
        return res.status(404).json({ message: "No project found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching student project:", error);
      res.status(500).json({ message: "Failed to fetch student project" });
    }
  });
  app2.get("/api/content/visible/:type", async (req, res) => {
    try {
      const { persona, funnelStage, passions } = req.query;
      let userPassions = null;
      const oidcSub = req.user?.claims?.sub;
      if (oidcSub) {
        const user = await storage.getUserByOidcSub(oidcSub);
        if (user?.passions) {
          userPassions = user.passions;
        }
      }
      if (!userPassions && passions) {
        userPassions = typeof passions === "string" ? passions.split(",") : passions;
      }
      const items = await storage.getVisibleContentItems(
        req.params.type,
        persona,
        funnelStage,
        userPassions
      );
      res.json(items);
    } catch (error) {
      console.error("Error fetching visible content items:", error);
      res.status(500).json({ message: "Failed to fetch content items" });
    }
  });
  app2.get("/api/content/testimonials/by-passions", async (req, res) => {
    try {
      const { passions, persona, funnelStage } = req.query;
      let userPassions = null;
      if (passions) {
        userPassions = typeof passions === "string" ? passions.split(",") : passions;
      }
      const testimonials = await storage.getVisibleContentItems(
        "testimonial",
        persona,
        funnelStage,
        userPassions
      );
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching filtered testimonials:", error);
      res.status(500).json({ message: "Failed to fetch filtered testimonials" });
    }
  });
  async function resolveDashboardVisibility(req, persona, funnelStage) {
    const result = { studentDashboard: false, volunteerDashboard: false };
    if (funnelStage !== "retention") return result;
    const oidcSub = req.user?.claims?.sub;
    if (!oidcSub) return result;
    const user = await storage.getUserByOidcSub(oidcSub);
    if (!user) return result;
    if (persona === "student") {
      const enrollment = await storage.getTechGoesHomeEnrollmentByUserId(user.id);
      result.studentDashboard = !!enrollment;
      console.log("[student-dashboard] Visibility check:", { userId: user.id, enrollmentFound: !!enrollment });
    }
    if (persona === "volunteer") {
      const enrollments = await storage.getActiveVolunteerEnrollmentsByUserId(user.id);
      result.volunteerDashboard = enrollments.length > 0;
      console.log("[volunteer-dashboard] Visibility check:", { userId: user.id, enrollmentsFound: enrollments.length });
    }
    return result;
  }
  app2.get("/api/content/visible-sections", applyImpersonation, async (req, res) => {
    try {
      const { persona, funnelStage, passions } = req.query;
      console.log("[visible-sections] Request params:", { persona, funnelStage, passions });
      let userPassions = null;
      const oidcSub = req.user?.claims?.sub;
      if (oidcSub) {
        const user = await storage.getUserByOidcSub(oidcSub);
        if (user?.passions) {
          userPassions = user.passions;
        }
      }
      if (!userPassions && passions) {
        userPassions = typeof passions === "string" ? passions.split(",") : passions;
      }
      const sectionTypes = ["service", "testimonial", "event", "lead_magnet", "cta"];
      const visibleSections = {
        // Initialize all sections to false to prevent DEFAULT_SECTIONS fallback
        "campaign-impact": false,
        "services": false,
        "lead-magnet": false,
        "impact": true,
        // Always visible
        "testimonials": false,
        "events": false,
        "donation": false,
        "student-dashboard": false,
        "volunteer-dashboard": false
      };
      for (const type of sectionTypes) {
        const items = await storage.getVisibleContentItems(
          type,
          persona,
          funnelStage,
          userPassions
        );
        if (type === "lead_magnet") {
          const campaignImpactItems = items.filter(
            (item) => item.metadata?.subtype === "campaign-impact-calculator"
          );
          const regularLeadMagnets = items.filter(
            (item) => item.metadata?.subtype !== "campaign-impact-calculator"
          );
          visibleSections["campaign-impact"] = campaignImpactItems.length > 0;
          visibleSections["lead-magnet"] = regularLeadMagnets.length > 0;
        } else {
          let sectionId = type;
          if (type === "cta") sectionId = "donation";
          if (type === "service") sectionId = "services";
          if (type === "testimonial") sectionId = "testimonials";
          if (type === "event") sectionId = "events";
          visibleSections[sectionId] = items.length > 0;
        }
      }
      visibleSections.impact = true;
      const dashboards = await resolveDashboardVisibility(req, persona, funnelStage);
      visibleSections["student-dashboard"] = dashboards.studentDashboard;
      visibleSections["volunteer-dashboard"] = dashboards.volunteerDashboard;
      console.log("[visible-sections] Returning sections:", visibleSections);
      res.json(visibleSections);
    } catch (error) {
      console.error("Error fetching visible sections:", error);
      res.status(500).json({ message: "Failed to fetch visible sections" });
    }
  });
  app2.get("/api/content/available-combinations", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const combinations = await storage.getAvailablePersonaStageCombinations();
      res.json(combinations);
    } catch (error) {
      console.error("Error fetching available combinations:", error);
      res.status(500).json({ message: "Failed to fetch available combinations" });
    }
  });
  app2.post("/api/content", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { persona, funnelStage, visibilityCombos, ...contentData } = req.body;
      const validatedData = insertContentItemSchema.parse(contentData);
      const item = await storage.createContentItem(validatedData);
      if (visibilityCombos && Array.isArray(visibilityCombos) && visibilityCombos.length > 0) {
        try {
          for (const combo of visibilityCombos) {
            if (combo.persona && combo.funnelStage) {
              await storage.createContentVisibility({
                contentItemId: item.id,
                persona: combo.persona,
                funnelStage: combo.funnelStage,
                isVisible: true
              });
            }
          }
        } catch (visError) {
          console.error("Error creating visibility records:", visError);
        }
      } else if (persona && funnelStage) {
        try {
          await storage.createContentVisibility({
            contentItemId: item.id,
            persona,
            funnelStage,
            isVisible: true
          });
        } catch (visError) {
          console.error("Error creating visibility record:", visError);
        }
      }
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating content item:", error);
      res.status(500).json({ message: "Failed to create content item" });
    }
  });
  app2.patch("/api/content/:id", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { persona, funnelStage, visibilityCombos, ...contentData } = req.body;
      const item = await storage.updateContentItem(req.params.id, contentData);
      if (!item) {
        return res.status(404).json({ message: "Content item not found" });
      }
      if (visibilityCombos && Array.isArray(visibilityCombos)) {
        try {
          const allVis = await storage.getAllContentVisibility();
          const existingVis = allVis.filter((v) => v.contentItemId === req.params.id);
          for (const vis of existingVis) {
            await storage.deleteContentVisibility(vis.id);
          }
          for (const combo of visibilityCombos) {
            if (combo.persona && combo.funnelStage) {
              await storage.createContentVisibility({
                contentItemId: req.params.id,
                persona: combo.persona,
                funnelStage: combo.funnelStage,
                isVisible: true
              });
            }
          }
        } catch (visError) {
          console.error("Error updating visibility records:", visError);
        }
      } else if (persona && funnelStage) {
        try {
          const allVis = await storage.getAllContentVisibility();
          const existingVis = allVis.find(
            (v) => v.contentItemId === req.params.id && v.persona === persona && v.funnelStage === funnelStage
          );
          if (existingVis) {
            await storage.updateContentVisibility(existingVis.id, { isVisible: true });
          } else {
            await storage.createContentVisibility({
              contentItemId: req.params.id,
              persona,
              funnelStage,
              isVisible: true
            });
          }
        } catch (visError) {
          console.error("Error updating visibility record:", visError);
        }
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating content item:", error);
      res.status(500).json({ message: "Failed to update content item" });
    }
  });
  app2.patch("/api/content/reorder", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      console.log("[BATCH REORDER] Endpoint hit with body:", JSON.stringify(req.body));
      const validatedData = batchContentReorderSchema.parse(req.body);
      const updatedItems = await storage.updateContentOrders(
        validatedData.updates,
        validatedData.contentType
      );
      console.log("[BATCH REORDER] Successfully updated", updatedItems.length, "items");
      res.json(updatedItems);
    } catch (error) {
      console.error("[BATCH REORDER] Error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Invalid request data",
          errors: error.errors
        });
      }
      if (error.message?.startsWith("items_not_found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message?.startsWith("mixed_content_type") || error.message?.startsWith("content_type_mismatch") || error.message?.startsWith("duplicate_order")) {
        return res.status(422).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to reorder content items" });
    }
  });
  app2.patch("/api/content/:id/order", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      console.log("[SINGLE ORDER] Endpoint hit for id:", req.params.id);
      const { order } = req.body;
      if (typeof order !== "number") {
        return res.status(400).json({ message: "Order must be a number" });
      }
      const item = await storage.updateContentItemOrder(req.params.id, order);
      if (!item) {
        return res.status(404).json({ message: "Content item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating content item order:", error);
      res.status(500).json({ message: "Failed to update content item order" });
    }
  });
  app2.delete("/api/content/:id", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      await storage.deleteContentItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting content item:", error);
      res.status(500).json({ message: "Failed to delete content item" });
    }
  });
  app2.get("/api/content/:id/usage", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const usage = await storage.getContentItemUsage(req.params.id);
      res.json(usage);
    } catch (error) {
      console.error("Error fetching content item usage:", error);
      res.status(500).json({ message: "Failed to fetch content item usage" });
    }
  });
  app2.get("/api/content/visibility", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const allVisibility = await storage.getAllContentVisibility();
      res.json(allVisibility);
    } catch (error) {
      console.error("Error fetching all content visibility:", error);
      res.status(500).json({ message: "Failed to fetch all content visibility" });
    }
  });
  app2.get("/api/content/:contentItemId/visibility", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { persona, funnelStage } = req.query;
      const visibility = await storage.getContentVisibility(
        req.params.contentItemId,
        persona,
        funnelStage
      );
      res.json(visibility);
    } catch (error) {
      console.error("Error fetching content visibility:", error);
      res.status(500).json({ message: "Failed to fetch content visibility" });
    }
  });
  app2.post("/api/content/visibility", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validatedData = insertContentVisibilitySchema.parse(req.body);
      const visibility = await storage.createContentVisibility(validatedData);
      res.status(201).json(visibility);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating content visibility:", error);
      res.status(500).json({ message: "Failed to create content visibility" });
    }
  });
  app2.patch("/api/content/visibility/:id", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const visibility = await storage.updateContentVisibility(req.params.id, req.body);
      if (!visibility) {
        return res.status(404).json({ message: "Content visibility setting not found" });
      }
      res.json(visibility);
    } catch (error) {
      console.error("Error updating content visibility:", error);
      res.status(500).json({ message: "Failed to update content visibility" });
    }
  });
  app2.delete("/api/content/visibility/:id", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      await storage.deleteContentVisibility(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting content visibility:", error);
      res.status(500).json({ message: "Failed to delete content visibility" });
    }
  });
  app2.get("/api/content/:contentItemId/visibility-matrix", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const visibility = await storage.getContentVisibility(req.params.contentItemId);
      res.json(visibility);
    } catch (error) {
      console.error("Error fetching content visibility matrix:", error);
      res.status(500).json({ message: "Failed to fetch content visibility matrix" });
    }
  });
  app2.post("/api/content/visibility/:id/reset", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const visibility = await storage.updateContentVisibility(req.params.id, {
        titleOverride: null,
        descriptionOverride: null,
        imageNameOverride: null
      });
      if (!visibility) {
        return res.status(404).json({ message: "Content visibility setting not found" });
      }
      res.json(visibility);
    } catch (error) {
      console.error("Error resetting content visibility overrides:", error);
      res.status(500).json({ message: "Failed to reset content visibility overrides" });
    }
  });
  app2.post("/api/student/submit", ...authWithImpersonation, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const validatedData = insertStudentSubmissionSchema.parse(req.body);
      const contentItem = await storage.createContentItem({
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        passionTags: validatedData.passionTags,
        isActive: false,
        // Require admin approval
        order: 0,
        metadata: {
          status: "pending",
          submittingUserId: currentUser.id,
          submittingUserEmail: currentUser.email || "",
          submittingUserName: `${currentUser.firstName} ${currentUser.lastName}`,
          files: validatedData.files || [],
          submittedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
      res.status(201).json(contentItem);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating student submission:", error);
      res.status(500).json({ message: "Failed to submit content" });
    }
  });
  app2.get("/api/student/submissions", ...authWithImpersonation, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const allContent = await storage.getAllContentItems();
      const userSubmissions = allContent.filter(
        (item) => (item.type === "student_project" || item.type === "student_testimonial") && item.metadata?.submittingUserId === currentUser.id
      );
      res.json(userSubmissions);
    } catch (error) {
      console.error("Error fetching student submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });
  app2.patch("/api/admin/student-submissions/:id/review", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const item = await storage.getContentItem(id);
      if (!item) {
        return res.status(404).json({ message: "Submission not found" });
      }
      const updatedItem = await storage.updateContentItem(id, {
        isActive: status === "approved",
        metadata: {
          ...item.metadata,
          status,
          reviewedBy: currentUser.id,
          reviewedAt: (/* @__PURE__ */ new Date()).toISOString(),
          rejectionReason: status === "rejected" ? rejectionReason : void 0
        }
      });
      res.json(updatedItem);
    } catch (error) {
      console.error("Error reviewing student submission:", error);
      res.status(500).json({ message: "Failed to review submission" });
    }
  });
  app2.get("/api/ab-tests/active", async (req, res) => {
    try {
      const rawPersona = req.query.persona;
      const rawFunnelStage = req.query.funnelStage;
      const persona = rawPersona && rawPersona !== "undefined" && rawPersona !== "null" && rawPersona !== "default" ? rawPersona : void 0;
      const funnelStage = rawFunnelStage && rawFunnelStage !== "undefined" && rawFunnelStage !== "null" && rawFunnelStage !== "none" ? rawFunnelStage : void 0;
      const tests = await storage.getActiveAbTests(persona, funnelStage);
      res.json(tests);
    } catch (error) {
      console.error("Error fetching active A/B tests:", error);
      res.status(500).json({ message: "Failed to fetch active A/B tests" });
    }
  });
  app2.get("/api/ab-tests", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const tests = await storage.getAllAbTestsWithVariants();
      res.json(tests);
    } catch (error) {
      console.error("Error fetching A/B tests:", error);
      res.status(500).json({ message: "Failed to fetch A/B tests" });
    }
  });
  app2.get("/api/ab-tests/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const test = await storage.getAbTest(req.params.id);
      if (!test) {
        return res.status(404).json({ message: "A/B test not found" });
      }
      res.json(test);
    } catch (error) {
      console.error("Error fetching A/B test:", error);
      res.status(500).json({ message: "Failed to fetch A/B test" });
    }
  });
  app2.post("/api/ab-tests", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      const { selectedCombinations = [], ...testData } = req.body;
      const validatedData = insertAbTestSchema.parse({
        ...testData,
        source: "manual",
        // Explicit source for priority handling
        createdBy: currentUser?.id || null
      });
      const test = await storage.createAbTest(validatedData);
      if (Array.isArray(selectedCombinations) && selectedCombinations.length > 0) {
        await storage.createAbTestTargets(test.id, selectedCombinations);
      }
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating A/B test:", error);
      res.status(500).json({ message: "Failed to create A/B test" });
    }
  });
  app2.patch("/api/ab-tests/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const test = await storage.updateAbTest(req.params.id, req.body);
      if (!test) {
        return res.status(404).json({ message: "A/B test not found" });
      }
      res.json(test);
    } catch (error) {
      console.error("Error updating A/B test:", error);
      res.status(500).json({ message: "Failed to update A/B test" });
    }
  });
  app2.delete("/api/ab-tests/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      await storage.deleteAbTest(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting A/B test:", error);
      res.status(500).json({ message: "Failed to delete A/B test" });
    }
  });
  app2.get("/api/ab-tests/:testId/variants", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const variants = await storage.getAbTestVariants(req.params.testId);
      res.json(variants);
    } catch (error) {
      console.error("Error fetching A/B test variants:", error);
      res.status(500).json({ message: "Failed to fetch A/B test variants" });
    }
  });
  app2.post("/api/ab-tests/:testId/variants", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const validatedData = insertAbTestVariantSchema.parse({
        ...req.body,
        testId: req.params.testId
      });
      const variant = await storage.createAbTestVariant(validatedData);
      res.status(201).json(variant);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating A/B test variant:", error);
      res.status(500).json({ message: "Failed to create A/B test variant" });
    }
  });
  app2.patch("/api/ab-tests/variants/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const variant = await storage.updateAbTestVariant(req.params.id, req.body);
      if (!variant) {
        return res.status(404).json({ message: "A/B test variant not found" });
      }
      res.json(variant);
    } catch (error) {
      console.error("Error updating A/B test variant:", error);
      res.status(500).json({ message: "Failed to update A/B test variant" });
    }
  });
  app2.delete("/api/ab-tests/variants/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      await storage.deleteAbTestVariant(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting A/B test variant:", error);
      res.status(500).json({ message: "Failed to delete A/B test variant" });
    }
  });
  app2.post("/api/ab-tests/assign", async (req, res) => {
    try {
      const { testId, visitorId, sessionId, persona, funnelStage } = req.body;
      if (!testId || !sessionId) {
        return res.status(400).json({ message: "testId and sessionId are required" });
      }
      let userId = null;
      if (req.user?.claims?.sub) {
        const currentUser = await storage.getUserByOidcSub(req.user.claims.sub);
        userId = currentUser?.id || null;
      }
      let assignment = await storage.getAssignmentPersistent(testId, userId, visitorId, sessionId);
      if (!assignment) {
        const test = await storage.getAbTest(testId);
        if (!test || test.status !== "active") {
          return res.status(404).json({ message: "Active test not found" });
        }
        const variants = await storage.getAbTestVariants(testId);
        if (variants.length === 0) {
          return res.status(400).json({ message: "Test has no variants" });
        }
        const totalWeight = variants.reduce((sum2, v) => sum2 + (v.trafficWeight || 50), 0);
        let random = Math.random() * totalWeight;
        let selectedVariant = variants[0];
        for (const variant of variants) {
          random -= variant.trafficWeight || 50;
          if (random <= 0) {
            selectedVariant = variant;
            break;
          }
        }
        assignment = await storage.createAbTestAssignment({
          testId,
          variantId: selectedVariant.id,
          visitorId,
          sessionId,
          userId,
          persona,
          funnelStage
        });
      } else if (userId && !assignment.userId) {
        assignment = await storage.updateAbTestAssignment(assignment.id, { userId }) || assignment;
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error assigning A/B test variant:", error);
      res.status(500).json({ message: "Failed to assign A/B test variant" });
    }
  });
  app2.post("/api/ab-tests/track", async (req, res) => {
    try {
      const validatedData = insertAbTestEventSchema.parse(req.body);
      const event = await storage.trackEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error tracking A/B test event:", error);
      res.status(500).json({ message: "Failed to track A/B test event" });
    }
  });
  app2.get("/api/ab-tests/:testId/analytics", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const analytics = await storage.getTestAnalytics(req.params.testId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching A/B test analytics:", error);
      res.status(500).json({ message: "Failed to fetch A/B test analytics" });
    }
  });
  app2.get("/api/ab-tests/baseline-config", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { persona, funnelStage, testType } = req.query;
      if (!persona || !funnelStage || !testType) {
        return res.status(400).json({
          message: "Missing required parameters: persona, funnelStage, testType"
        });
      }
      const config = await storage.getCurrentBaselineConfiguration(
        persona,
        funnelStage,
        testType
      );
      res.json(config);
    } catch (error) {
      console.error("Error fetching baseline configuration:", error);
      res.status(500).json({ message: "Failed to fetch baseline configuration" });
    }
  });
  app2.get("/api/ab-tests/historical-results", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { persona, funnelStage, testType } = req.query;
      if (!persona || !funnelStage || !testType) {
        return res.status(400).json({
          message: "Missing required parameters: persona, funnelStage, testType"
        });
      }
      const results = await storage.getHistoricalTestResults(
        persona,
        funnelStage,
        testType
      );
      res.json(results);
    } catch (error) {
      console.error("Error fetching historical test results:", error);
      res.status(500).json({ message: "Failed to fetch historical test results" });
    }
  });
  app2.get("/api/ab-tests/:testId/events", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const events = await storage.getTestEvents(req.params.testId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching A/B test events:", error);
      res.status(500).json({ message: "Failed to fetch A/B test events" });
    }
  });
  app2.get("/api/automation/rules", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const rules = await storage.getAllAbTestAutomationRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching automation rules:", error);
      res.status(500).json({ message: "Failed to fetch automation rules" });
    }
  });
  app2.post("/api/automation/rules", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const rule = await storage.createAbTestAutomationRule(req.body);
      res.json(rule);
    } catch (error) {
      console.error("Error creating automation rule:", error);
      res.status(500).json({ message: "Failed to create automation rule" });
    }
  });
  app2.patch("/api/automation/rules/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const rule = await storage.updateAbTestAutomationRule(req.params.id, req.body);
      if (!rule) {
        return res.status(404).json({ message: "Automation rule not found" });
      }
      res.json(rule);
    } catch (error) {
      console.error("Error updating automation rule:", error);
      res.status(500).json({ message: "Failed to update automation rule" });
    }
  });
  app2.delete("/api/automation/rules/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      await storage.deleteAbTestAutomationRule(req.params.id);
      res.json({ message: "Automation rule deleted successfully" });
    } catch (error) {
      console.error("Error deleting automation rule:", error);
      res.status(500).json({ message: "Failed to delete automation rule" });
    }
  });
  app2.get("/api/automation/runs", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const runs = await storage.getAllAbTestAutomationRuns(limit);
      res.json(runs);
    } catch (error) {
      console.error("Error fetching automation runs:", error);
      res.status(500).json({ message: "Failed to fetch automation runs" });
    }
  });
  app2.get("/api/automation/runs/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const run = await storage.getAbTestAutomationRun(req.params.id);
      if (!run) {
        return res.status(404).json({ message: "Automation run not found" });
      }
      res.json(run);
    } catch (error) {
      console.error("Error fetching automation run:", error);
      res.status(500).json({ message: "Failed to fetch automation run" });
    }
  });
  app2.post("/api/automation/run", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { AutomationSchedulerService: AutomationSchedulerService2 } = await Promise.resolve().then(() => (init_automationScheduler(), automationScheduler_exports));
      const scheduler = new AutomationSchedulerService2(storage);
      const result = await scheduler.runAutomationCycle();
      res.json(result);
    } catch (error) {
      console.error("Error running automation:", error);
      res.status(500).json({
        message: "Failed to run automation",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/automation/safety-limits", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const limits = await storage.getAbTestSafetyLimits();
      res.json(limits || null);
    } catch (error) {
      console.error("Error fetching safety limits:", error);
      res.status(500).json({ message: "Failed to fetch safety limits" });
    }
  });
  app2.patch("/api/automation/safety-limits", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const limits = await storage.upsertAbTestSafetyLimits(req.body);
      res.json(limits);
    } catch (error) {
      console.error("Error updating safety limits:", error);
      res.status(500).json({ message: "Failed to update safety limits" });
    }
  });
  app2.get("/api/automation/metric-weight-profiles", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const profiles = await storage.getAllMetricWeightProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching metric weight profiles:", error);
      res.status(500).json({ message: "Failed to fetch metric weight profiles" });
    }
  });
  app2.post("/api/automation/metric-weight-profiles", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const profile = await storage.createMetricWeightProfile(req.body);
      res.json(profile);
    } catch (error) {
      console.error("Error creating metric weight profile:", error);
      res.status(500).json({ message: "Failed to create metric weight profile" });
    }
  });
  app2.patch("/api/automation/metric-weight-profiles/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const profile = await storage.updateMetricWeightProfile(req.params.id, req.body);
      if (!profile) {
        return res.status(404).json({ message: "Metric weight profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error updating metric weight profile:", error);
      res.status(500).json({ message: "Failed to update metric weight profile" });
    }
  });
  app2.delete("/api/automation/metric-weight-profiles/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      await storage.deleteMetricWeightProfile(req.params.id);
      res.json({ message: "Metric weight profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting metric weight profile:", error);
      res.status(500).json({ message: "Failed to delete metric weight profile" });
    }
  });
  app2.get("/api/performance-metrics", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const metrics = await storage.getPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });
  app2.post("/api/analyze-social-post", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ message: "imageBase64 is required" });
      }
      const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const analysis = await analyzeSocialPostScreenshot(base64Data, mimeType);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing social post:", error);
      res.status(500).json({
        message: "Failed to analyze screenshot",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/analyze-youtube-video", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { youtubeUrl } = req.body;
      if (!youtubeUrl) {
        return res.status(400).json({ message: "youtubeUrl is required" });
      }
      const extractVideoId = (input) => {
        if (!/[/:?&]/.test(input)) {
          return input;
        }
        try {
          const url = new URL(input);
          if (url.hostname.includes("youtube.com") && url.searchParams.has("v")) {
            return url.searchParams.get("v") || input;
          }
          if (url.hostname === "youtu.be") {
            return url.pathname.slice(1).split("?")[0];
          }
          if (url.pathname.includes("/shorts/") || url.pathname.includes("/embed/")) {
            const parts = url.pathname.split("/");
            return parts[parts.length - 1].split("?")[0];
          }
        } catch (e) {
          console.error("Failed to parse video URL:", input, e);
        }
        return input;
      };
      const videoId = extractVideoId(youtubeUrl);
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oEmbedResponse = await fetch(oEmbedUrl);
      if (!oEmbedResponse.ok) {
        return res.status(400).json({
          message: "Invalid YouTube URL or video not found"
        });
      }
      const oEmbedData = await oEmbedResponse.json();
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      const aiAnalysis = await analyzeYouTubeVideoThumbnail(
        thumbnailUrl,
        oEmbedData.title,
        void 0
        // YouTube oEmbed doesn't return description
      );
      res.json({
        videoId,
        originalTitle: oEmbedData.title,
        suggestedTitle: aiAnalysis.suggestedTitle,
        suggestedDescription: aiAnalysis.suggestedDescription,
        category: aiAnalysis.category,
        tags: aiAnalysis.tags,
        thumbnailUrl,
        authorName: oEmbedData.author_name,
        authorUrl: oEmbedData.author_url
      });
    } catch (error) {
      console.error("Error analyzing YouTube video:", error);
      res.status(500).json({
        message: "Failed to analyze YouTube video",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/analyze-image-for-naming", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { uploadToken, originalFilename } = req.body;
      if (!uploadToken) {
        return res.status(400).json({ message: "uploadToken is required" });
      }
      const tokenData = uploadTokenCache.get(uploadToken);
      if (!tokenData) {
        return res.status(400).json({
          message: "Invalid or expired upload token"
        });
      }
      const objectStorageService = new ObjectStorageService3();
      const objectFile = await objectStorageService.getObjectEntityFile(tokenData.objectPath);
      const chunks = [];
      const stream = objectFile.createReadStream();
      await new Promise((resolve, reject) => {
        stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on("end", () => resolve());
        stream.on("error", (error) => reject(error));
      });
      const buffer = Buffer.concat(chunks);
      const base64Image = buffer.toString("base64");
      const [metadata] = await objectFile.getMetadata();
      const mimeType = metadata.contentType || "image/jpeg";
      const analysis = await analyzeImageForNaming(
        base64Image,
        mimeType,
        originalFilename
      );
      const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0].replace(/-/g, "");
      const shortHash = uploadToken.substring(uploadToken.length - 4);
      const extension = originalFilename?.split(".").pop()?.toLowerCase() || "jpg";
      const finalFilename = `${analysis.suggestedFilename}_${timestamp2}_${shortHash}.${extension}`;
      res.json({
        category: analysis.category,
        description: analysis.description,
        suggestedFilename: analysis.suggestedFilename,
        finalFilename,
        originalFilename
      });
    } catch (error) {
      console.error("Error analyzing image for naming:", error);
      res.status(500).json({
        message: "Failed to analyze image for naming",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/google-reviews/sync", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { placeId } = req.body;
      if (!placeId) {
        return res.status(400).json({ message: "placeId is required" });
      }
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Places API key not configured" });
      }
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status !== "OK") {
        return res.status(400).json({
          message: `Google Places API error: ${data.status}`,
          error: data.error_message
        });
      }
      const reviews = data.result?.reviews || [];
      const syncedReviews = [];
      for (const review of reviews) {
        const googleReviewId = `${review.author_name}_${review.time}`.replace(/\s+/g, "_");
        const reviewData = {
          googleReviewId,
          authorName: review.author_name,
          authorPhotoUrl: review.profile_photo_url || null,
          rating: review.rating,
          text: review.text || null,
          relativeTimeDescription: review.relative_time_description || null,
          time: review.time,
          isActive: true
        };
        const synced = await storage.upsertGoogleReview(reviewData);
        syncedReviews.push(synced);
      }
      res.json({
        message: `Successfully synced ${syncedReviews.length} reviews`,
        reviews: syncedReviews,
        placeRating: data.result.rating,
        totalRatings: data.result.user_ratings_total
      });
    } catch (error) {
      console.error("Error syncing Google reviews:", error);
      res.status(500).json({ message: "Failed to sync Google reviews" });
    }
  });
  app2.get("/api/google-reviews", async (req, res) => {
    try {
      const reviews = await storage.getActiveGoogleReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching Google reviews:", error);
      res.status(500).json({ message: "Failed to fetch Google reviews" });
    }
  });
  app2.get("/api/google-reviews/all", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const reviews = await storage.getGoogleReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching all Google reviews:", error);
      res.status(500).json({ message: "Failed to fetch all Google reviews" });
    }
  });
  app2.patch("/api/google-reviews/:id/visibility", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updated = await storage.updateGoogleReviewVisibility(id, isActive);
      if (!updated) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating review visibility:", error);
      res.status(500).json({ message: "Failed to update review visibility" });
    }
  });
  app2.get("/api/email-campaigns", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const campaigns = await storage.getAllEmailCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching email campaigns:", error);
      res.status(500).json({ message: "Failed to fetch email campaigns" });
    }
  });
  app2.get("/api/email-campaigns/active", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const campaigns = await storage.getActiveCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching active email campaigns:", error);
      res.status(500).json({ message: "Failed to fetch active email campaigns" });
    }
  });
  app2.get("/api/email-campaigns/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getEmailCampaign(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      const steps = await storage.getCampaignSteps(id);
      res.json({ ...campaign, steps });
    } catch (error) {
      console.error("Error fetching email campaign:", error);
      res.status(500).json({ message: "Failed to fetch email campaign" });
    }
  });
  app2.post("/api/email-campaigns", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const validatedData = insertEmailCampaignSchema.parse(req.body);
      const campaign = await storage.createEmailCampaign(validatedData);
      res.json(campaign);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      console.error("Error creating email campaign:", error);
      res.status(500).json({ message: "Failed to create email campaign" });
    }
  });
  app2.patch("/api/email-campaigns/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmailCampaignSchema.partial().parse(req.body);
      const updated = await storage.updateEmailCampaign(id, validatedData);
      if (!updated) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      console.error("Error updating email campaign:", error);
      res.status(500).json({ message: "Failed to update email campaign" });
    }
  });
  app2.delete("/api/email-campaigns/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailCampaign(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting email campaign:", error);
      res.status(500).json({ message: "Failed to delete email campaign" });
    }
  });
  app2.post("/api/email-sequence-steps", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const validatedData = insertEmailSequenceStepSchema.parse(req.body);
      if ("templateId" in validatedData && validatedData.templateId === "") {
        validatedData.templateId = null;
      }
      const step = await storage.createEmailSequenceStep(validatedData);
      res.json(step);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid sequence step data", errors: error.errors });
      }
      console.error("Error creating email sequence step:", error);
      res.status(500).json({ message: "Failed to create email sequence step" });
    }
  });
  app2.patch("/api/email-sequence-steps/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmailSequenceStepSchema.partial().parse(req.body);
      if ("templateId" in validatedData && validatedData.templateId === "") {
        validatedData.templateId = null;
      }
      const updated = await storage.updateEmailSequenceStep(id, validatedData);
      if (!updated) {
        return res.status(404).json({ message: "Sequence step not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid sequence step data", errors: error.errors });
      }
      console.error("Error updating email sequence step:", error);
      res.status(500).json({ message: "Failed to update email sequence step" });
    }
  });
  app2.delete("/api/email-sequence-steps/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailSequenceStep(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting email sequence step:", error);
      res.status(500).json({ message: "Failed to delete email sequence step" });
    }
  });
  app2.post("/api/email-enrollments", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const validatedData = insertEmailCampaignEnrollmentSchema.parse(req.body);
      const existing = await storage.getEnrollment(
        validatedData.campaignId,
        validatedData.leadId
      );
      if (existing) {
        return res.status(400).json({ message: "Lead already enrolled in this campaign" });
      }
      const enrollment = await storage.createEnrollment(validatedData);
      res.json(enrollment);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid enrollment data", errors: error.errors });
      }
      console.error("Error enrolling lead in campaign:", error);
      res.status(500).json({ message: "Failed to enroll lead in campaign" });
    }
  });
  app2.get("/api/email-enrollments/lead/:leadId", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { leadId } = req.params;
      const enrollments = await storage.getLeadEnrollments(leadId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching lead enrollments:", error);
      res.status(500).json({ message: "Failed to fetch lead enrollments" });
    }
  });
  app2.get("/api/email-enrollments/campaign/:campaignId", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { campaignId } = req.params;
      const enrollments = await storage.getCampaignEnrollments(campaignId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching campaign enrollments:", error);
      res.status(500).json({ message: "Failed to fetch campaign enrollments" });
    }
  });
  app2.patch("/api/email-enrollments/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmailCampaignEnrollmentSchema.partial().parse(req.body);
      const updated = await storage.updateEnrollment(id, validatedData);
      if (!updated) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid enrollment data", errors: error.errors });
      }
      console.error("Error updating enrollment:", error);
      res.status(500).json({ message: "Failed to update enrollment" });
    }
  });
  app2.post("/api/email-enrollments/backfill-graduation-path", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { backfillGraduationPathEnrollments: backfillGraduationPathEnrollments2 } = await Promise.resolve().then(() => (init_graduationPathCampaign(), graduationPathCampaign_exports));
      const enrolledCount = await backfillGraduationPathEnrollments2();
      res.json({
        success: true,
        message: `Successfully enrolled ${enrolledCount} leads in graduation path`,
        enrolledCount
      });
    } catch (error) {
      console.error("Error during graduation path backfill:", error);
      res.status(500).json({ message: "Failed to complete backfill" });
    }
  });
  app2.get("/api/email-enrollments/campaign/:campaignId/details", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { campaignId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      const allEnrollments = await storage.getCampaignEnrollments(campaignId);
      const stats = {
        total: allEnrollments.length,
        active: allEnrollments.filter((e) => e.status === "active").length,
        completed: allEnrollments.filter((e) => e.status === "completed").length,
        paused: allEnrollments.filter((e) => e.status === "paused").length
      };
      const paginatedEnrollments = allEnrollments.slice(offset, offset + limit);
      const leadIds = paginatedEnrollments.map((e) => e.leadId);
      const leads2 = await Promise.all(leadIds.map((id) => storage.getLead(id)));
      const leadMap = new Map(leads2.filter((l) => l !== void 0).map((l) => [l.id, l]));
      const enrichedEnrollments = paginatedEnrollments.map((enrollment) => {
        const lead = leadMap.get(enrollment.leadId);
        return {
          enrollment,
          lead: lead ? {
            id: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email
          } : null
        };
      });
      res.json({
        data: enrichedEnrollments,
        stats,
        limit,
        offset
      });
    } catch (error) {
      console.error("Error fetching campaign enrollment details:", error);
      res.status(500).json({ message: "Failed to fetch enrollment details" });
    }
  });
  app2.post("/api/email-report-schedules", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { computeInitialNextRun: computeInitialNextRun2 } = await Promise.resolve().then(() => (init_emailReportScheduler(), emailReportScheduler_exports));
      const validatedData = insertEmailReportScheduleSchema.parse(req.body);
      if (!validatedData.nextRunAt) {
        validatedData.nextRunAt = computeInitialNextRun2(validatedData.frequency);
      } else {
        if (validatedData.nextRunAt <= /* @__PURE__ */ new Date()) {
          return res.status(400).json({ message: "Next run time must be in the future" });
        }
      }
      validatedData.createdBy = req.user.id;
      const schedule = await storage.createEmailReportSchedule(validatedData);
      res.json(schedule);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      if (error.code === "23505") {
        return res.status(409).json({ message: "A schedule with this name already exists" });
      }
      console.error("Error creating email report schedule:", error);
      res.status(500).json({ message: "Failed to create email report schedule" });
    }
  });
  app2.get("/api/email-report-schedules", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const schedules = await storage.getAllEmailReportSchedules();
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching email report schedules:", error);
      res.status(500).json({ message: "Failed to fetch email report schedules" });
    }
  });
  app2.get("/api/email-report-schedules/:id", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const schedule = await storage.getEmailReportSchedule(id);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching email report schedule:", error);
      res.status(500).json({ message: "Failed to fetch email report schedule" });
    }
  });
  app2.patch("/api/email-report-schedules/:id", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const { computeInitialNextRun: computeInitialNextRun2 } = await Promise.resolve().then(() => (init_emailReportScheduler(), emailReportScheduler_exports));
      const validatedData = updateEmailReportScheduleSchema.parse(req.body);
      if (validatedData.frequency && !validatedData.nextRunAt) {
        validatedData.nextRunAt = computeInitialNextRun2(validatedData.frequency);
      }
      if (validatedData.nextRunAt && validatedData.nextRunAt <= /* @__PURE__ */ new Date()) {
        return res.status(400).json({ message: "Next run time must be in the future" });
      }
      const updated = await storage.updateEmailReportSchedule(id, validatedData);
      if (!updated) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      if (error.code === "23505") {
        return res.status(409).json({ message: "A schedule with this name already exists" });
      }
      console.error("Error updating email report schedule:", error);
      res.status(500).json({ message: "Failed to update email report schedule" });
    }
  });
  app2.delete("/api/email-report-schedules/:id", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const schedule = await storage.getEmailReportSchedule(id);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      await storage.deleteEmailReportSchedule(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting email report schedule:", error);
      res.status(500).json({ message: "Failed to delete email report schedule" });
    }
  });
  app2.post("/api/email-report-schedules/:id/send-now", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const { executeScheduleNow: executeScheduleNow2 } = await Promise.resolve().then(() => (init_emailReportScheduler(), emailReportScheduler_exports));
      await executeScheduleNow2(id, req.user.id);
      res.json({ success: true, message: "Report sent successfully" });
    } catch (error) {
      console.error("Error sending report manually:", error);
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      if (error.message?.includes("SendGrid not configured")) {
        return res.status(503).json({ message: "Email service not configured" });
      }
      res.status(500).json({ message: "Failed to send report" });
    }
  });
  app2.post("/api/segments", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const validatedData = insertSegmentSchema.parse(req.body);
      const segment = await storage.createSegment({
        ...validatedData,
        createdBy: req.user.id
      });
      res.status(201).json(segment);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid segment data", errors: error.errors });
      }
      console.error("Error creating segment:", error);
      res.status(500).json({ message: "Failed to create segment" });
    }
  });
  app2.get("/api/segments", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const segments2 = await storage.getAllSegments();
      res.json(segments2);
    } catch (error) {
      console.error("Error fetching segments:", error);
      res.status(500).json({ message: "Failed to fetch segments" });
    }
  });
  app2.get("/api/segments/:id", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const segment = await storage.getSegment(id);
      if (!segment) {
        return res.status(404).json({ message: "Segment not found" });
      }
      res.json(segment);
    } catch (error) {
      console.error("Error fetching segment:", error);
      res.status(500).json({ message: "Failed to fetch segment" });
    }
  });
  app2.get("/api/segments/:id/evaluate", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : void 0;
      const segment = await storage.getSegment(id);
      if (!segment) {
        return res.status(404).json({ message: "Segment not found" });
      }
      const { segmentEvaluationService: segmentEvaluationService2 } = await Promise.resolve().then(() => (init_segmentEvaluation(), segmentEvaluation_exports));
      const leads2 = await segmentEvaluationService2.evaluateFilters(segment.filters, { limit });
      res.json({
        segmentId: id,
        segmentName: segment.name,
        totalLeads: leads2.length,
        leads: leads2
      });
    } catch (error) {
      console.error("Error evaluating segment:", error);
      res.status(500).json({ message: "Failed to evaluate segment" });
    }
  });
  app2.get("/api/segments/:id/size", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const segment = await storage.getSegment(id);
      if (!segment) {
        return res.status(404).json({ message: "Segment not found" });
      }
      const { segmentEvaluationService: segmentEvaluationService2 } = await Promise.resolve().then(() => (init_segmentEvaluation(), segmentEvaluation_exports));
      const size = await segmentEvaluationService2.getSegmentSize(segment.filters);
      res.json({
        segmentId: id,
        segmentName: segment.name,
        size
      });
    } catch (error) {
      console.error("Error getting segment size:", error);
      res.status(500).json({ message: "Failed to get segment size" });
    }
  });
  app2.patch("/api/segments/:id", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateSegmentSchema.parse(req.body);
      const updated = await storage.updateSegment(id, validatedData);
      if (!updated) {
        return res.status(404).json({ message: "Segment not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid segment data", errors: error.errors });
      }
      console.error("Error updating segment:", error);
      res.status(500).json({ message: "Failed to update segment" });
    }
  });
  app2.delete("/api/segments/:id", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const segment = await storage.getSegment(id);
      if (!segment) {
        return res.status(404).json({ message: "Segment not found" });
      }
      await storage.deleteSegment(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting segment:", error);
      res.status(500).json({ message: "Failed to delete segment" });
    }
  });
  app2.post("/api/segments/preview", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { filters, limit } = req.body;
      if (!filters) {
        return res.status(400).json({ message: "Filters are required" });
      }
      const { segmentEvaluationService: segmentEvaluationService2 } = await Promise.resolve().then(() => (init_segmentEvaluation(), segmentEvaluation_exports));
      const leads2 = await segmentEvaluationService2.evaluateFilters(filters, { limit });
      res.json({ leads: leads2 });
    } catch (error) {
      console.error("Error previewing segment:", error);
      res.status(500).json({ message: "Failed to preview segment" });
    }
  });
  app2.post("/api/segments/preview/size", ...authWithImpersonation, requireSuperAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { filters } = req.body;
      if (!filters) {
        return res.status(400).json({ message: "Filters are required" });
      }
      const { segmentEvaluationService: segmentEvaluationService2 } = await Promise.resolve().then(() => (init_segmentEvaluation(), segmentEvaluation_exports));
      const stats = await segmentEvaluationService2.getSegmentStats(filters);
      res.json({
        size: stats.effectiveCount,
        // Legacy field for existing UI
        stats
        // Full stats for future consumption
      });
    } catch (error) {
      console.error("Error getting segment stats:", error);
      res.status(500).json({ message: "Failed to get segment stats" });
    }
  });
  app2.post("/api/email-unsubscribes", async (req, res) => {
    try {
      const validatedData = insertEmailUnsubscribeSchema.parse(req.body);
      let existing = null;
      if (validatedData.channel === "all") {
        const emailExists = validatedData.email ? await storage.getEmailUnsubscribe(validatedData.email) : null;
        const phoneExists = validatedData.phone ? await storage.getSmsUnsubscribe(validatedData.phone) : null;
        existing = emailExists || phoneExists;
      } else if (validatedData.channel === "email" && validatedData.email) {
        existing = await storage.getEmailUnsubscribe(validatedData.email);
      } else if (validatedData.channel === "sms" && validatedData.phone) {
        existing = await storage.getSmsUnsubscribe(validatedData.phone);
      }
      if (existing) {
        return res.status(409).json({ message: "Contact already unsubscribed for this channel" });
      }
      const unsubscribe = await storage.createEmailUnsubscribe(validatedData);
      res.status(201).json(unsubscribe);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid unsubscribe data", errors: error.errors });
      }
      console.error("Error creating unsubscribe:", error);
      res.status(500).json({ message: "Failed to process unsubscribe" });
    }
  });
  app2.get("/api/email-unsubscribes", ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const unsubscribes = await storage.getAllEmailUnsubscribes();
      res.json(unsubscribes);
    } catch (error) {
      console.error("Error fetching unsubscribes:", error);
      res.status(500).json({ message: "Failed to fetch unsubscribes" });
    }
  });
  app2.delete("/api/email-unsubscribes/:id", ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeUnsubscribe(id);
      res.json({ message: "Unsubscribe record removed successfully" });
    } catch (error) {
      console.error("Error deleting unsubscribe:", error);
      res.status(500).json({ message: error.message || "Failed to delete unsubscribe" });
    }
  });
  app2.get("/api/email-unsubscribes/check/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const isUnsubscribed = await storage.isEmailUnsubscribed(email);
      res.json({ email, isUnsubscribed });
    } catch (error) {
      console.error("Error checking unsubscribe status:", error);
      res.status(500).json({ message: "Failed to check unsubscribe status" });
    }
  });
  app2.post("/api/unsubscribe/verify", unsubscribeVerifyLimiter, async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({
          valid: false,
          message: "Token is required"
        });
      }
      const { verifyUnsubscribeToken: verifyUnsubscribeToken2 } = await Promise.resolve().then(() => (init_unsubscribeToken(), unsubscribeToken_exports));
      const email = verifyUnsubscribeToken2(token);
      if (!email) {
        return res.status(400).json({
          valid: false,
          message: "Invalid or expired unsubscribe link. Links are valid for 60 days."
        });
      }
      res.json({
        valid: true,
        email
      });
    } catch (error) {
      console.error("[Unsubscribe Verify] Error:", error);
      if (error.message?.includes("UNSUBSCRIBE_SECRET")) {
        return res.status(500).json({
          valid: false,
          message: "Server configuration error. Please contact support."
        });
      }
      res.status(500).json({
        valid: false,
        message: "Failed to verify unsubscribe link"
      });
    }
  });
  app2.post("/api/unsubscribe", unsubscribeProcessLimiter, async (req, res) => {
    try {
      const { token, reason, feedback } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      const { verifyUnsubscribeToken: verifyUnsubscribeToken2 } = await Promise.resolve().then(() => (init_unsubscribeToken(), unsubscribeToken_exports));
      const email = verifyUnsubscribeToken2(token);
      if (!email) {
        return res.status(400).json({
          message: "Invalid or expired unsubscribe link"
        });
      }
      const existing = await storage.getEmailUnsubscribe(email);
      if (existing) {
        return res.json({
          success: true,
          message: "Email already unsubscribed",
          email
        });
      }
      const lead = await storage.getLeadByEmail(email);
      const unsubscribeData = {
        email,
        leadId: lead?.id || null,
        reason: reason || null,
        feedback: feedback || null,
        source: "user_request"
      };
      const validatedData = insertEmailUnsubscribeSchema.parse(unsubscribeData);
      await storage.createEmailUnsubscribe(validatedData);
      console.log("[Unsubscribe] Successfully unsubscribed:", {
        email,
        reason,
        hasLead: !!lead
      });
      res.json({
        success: true,
        message: "Successfully unsubscribed",
        email
      });
    } catch (error) {
      console.error("[Unsubscribe Process] Error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Invalid unsubscribe data",
          errors: error.errors
        });
      }
      if (error.message?.includes("UNSUBSCRIBE_SECRET")) {
        return res.status(500).json({
          message: "Server configuration error. Please contact support."
        });
      }
      res.status(500).json({ message: "Failed to process unsubscribe" });
    }
  });
  app2.post("/api/sms-unsubscribe/verify", unsubscribeVerifyLimiter, async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({
          valid: false,
          message: "Token is required"
        });
      }
      const { verifySmsUnsubscribeToken: verifySmsUnsubscribeToken2 } = await Promise.resolve().then(() => (init_smsUnsubscribeToken(), smsUnsubscribeToken_exports));
      const phone = verifySmsUnsubscribeToken2(token);
      if (!phone) {
        return res.status(400).json({
          valid: false,
          message: "Invalid or expired unsubscribe link. Links are valid for 60 days."
        });
      }
      res.json({
        valid: true,
        phone
      });
    } catch (error) {
      console.error("[SMS Unsubscribe Verify] Error:", error);
      if (error.message?.includes("UNSUBSCRIBE_SECRET")) {
        return res.status(500).json({
          valid: false,
          message: "Server configuration error. Please contact support."
        });
      }
      res.status(500).json({
        valid: false,
        message: "Failed to verify unsubscribe link"
      });
    }
  });
  app2.post("/api/sms-unsubscribe", unsubscribeProcessLimiter, async (req, res) => {
    try {
      const { token, reason, feedback } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      const { verifySmsUnsubscribeToken: verifySmsUnsubscribeToken2 } = await Promise.resolve().then(() => (init_smsUnsubscribeToken(), smsUnsubscribeToken_exports));
      const phone = verifySmsUnsubscribeToken2(token);
      if (!phone || !phone.trim()) {
        return res.status(400).json({
          message: "Invalid or expired unsubscribe link. Phone number could not be verified."
        });
      }
      const existing = await storage.getSmsUnsubscribe(phone);
      if (existing) {
        return res.json({
          success: true,
          message: "Phone number already unsubscribed",
          phone
        });
      }
      const lead = await storage.getLeadByPhone(phone);
      const unsubscribeData = {
        email: void 0,
        phone,
        channel: "sms",
        leadId: lead?.id || null,
        reason: reason || null,
        feedback: feedback || null,
        source: "user_request"
      };
      const validatedData = insertEmailUnsubscribeSchema.parse(unsubscribeData);
      await storage.createEmailUnsubscribe(validatedData);
      console.log("[SMS Unsubscribe] Successfully unsubscribed:", {
        phone,
        reason,
        hasLead: !!lead
      });
      res.json({
        success: true,
        message: "Successfully unsubscribed",
        phone
      });
    } catch (error) {
      console.error("[SMS Unsubscribe Process] Error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Invalid unsubscribe data",
          errors: error.errors
        });
      }
      if (error.message?.includes("UNSUBSCRIBE_SECRET")) {
        return res.status(500).json({
          message: "Server configuration error. Please contact support."
        });
      }
      res.status(500).json({ message: "Failed to process SMS unsubscribe" });
    }
  });
  app2.get("/api/email-logs/campaign/:campaignId", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { campaignId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      const enrollments = await storage.getCampaignEnrollments(campaignId);
      const leadIds = enrollments.map((e) => e.leadId);
      const leads2 = await Promise.all(leadIds.map((id) => storage.getLead(id)));
      const leadMap = new Map(leads2.filter((l) => l !== void 0).map((l) => [l.email, l]));
      const emails = Array.from(leadMap.keys()).filter((e) => e);
      const allLogsPromises = emails.map((email) => storage.getEmailLogsByRecipient(email));
      const allLogsArrays = await Promise.all(allLogsPromises);
      const campaignLogs = allLogsArrays.flat().filter((log2) => {
        const meta = log2.metadata;
        return meta?.campaignId === campaignId || meta?.enrollment?.campaignId === campaignId;
      }).sort((a, b) => {
        const dateA = a.sentAt || a.createdAt || /* @__PURE__ */ new Date(0);
        const dateB = b.sentAt || b.createdAt || /* @__PURE__ */ new Date(0);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      const paginatedLogs = campaignLogs.slice(offset, offset + limit);
      const enrichedLogs = paginatedLogs.map((log2) => {
        const lead = leadMap.get(log2.recipientEmail);
        return {
          id: log2.id,
          subject: log2.subject,
          status: log2.status,
          sentAt: log2.sentAt,
          errorMessage: log2.errorMessage,
          lead: lead ? {
            id: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email
          } : null
        };
      });
      res.json({
        data: enrichedLogs,
        total: campaignLogs.length,
        limit,
        offset
      });
    } catch (error) {
      console.error("Error fetching email logs for campaign:", error);
      res.status(500).json({ message: "Failed to fetch email logs" });
    }
  });
  app2.get("/api/email-campaigns/:id/analytics", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id: campaignId } = req.params;
      const emailLogs2 = await storage.getEmailLogsByCampaign(campaignId);
      if (emailLogs2.length === 0) {
        return res.json({
          totalSent: 0,
          totalOpens: 0,
          uniqueOpens: 0,
          totalClicks: 0,
          uniqueClicks: 0,
          openRate: 0,
          clickRate: 0,
          clickToOpenRate: 0,
          uniqueEngagementRate: 0
        });
      }
      const emailOpens2 = await storage.getEmailOpensByCampaign(campaignId);
      const emailClicks2 = await storage.getEmailClicksByCampaign(campaignId);
      const totalSent = emailLogs2.length;
      const totalOpens = emailOpens2.length;
      const totalClicks = emailClicks2.length;
      const uniqueOpenLogIds = new Set(emailOpens2.map((open) => open.emailLogId));
      const uniqueOpens = uniqueOpenLogIds.size;
      const uniqueClickLogIds = new Set(emailClicks2.map((click) => click.emailLogId));
      const uniqueClicks = uniqueClickLogIds.size;
      const uniqueEngagedLogIds = /* @__PURE__ */ new Set([...uniqueOpenLogIds, ...uniqueClickLogIds]);
      const uniqueEngaged = uniqueEngagedLogIds.size;
      const openRate = totalSent > 0 ? uniqueOpens / totalSent * 100 : 0;
      const clickRate = totalSent > 0 ? uniqueClicks / totalSent * 100 : 0;
      const clickToOpenRate = uniqueOpens > 0 ? uniqueClicks / uniqueOpens * 100 : 0;
      const uniqueEngagementRate = totalSent > 0 ? uniqueEngaged / totalSent * 100 : 0;
      res.json({
        totalSent,
        totalOpens,
        uniqueOpens,
        totalClicks,
        uniqueClicks,
        openRate: Math.round(openRate * 10) / 10,
        // Round to 1 decimal place
        clickRate: Math.round(clickRate * 10) / 10,
        clickToOpenRate: Math.round(clickToOpenRate * 10) / 10,
        uniqueEngagementRate: Math.round(uniqueEngagementRate * 10) / 10
      });
    } catch (error) {
      console.error("Error fetching campaign analytics:", error);
      res.status(500).json({ message: "Failed to fetch campaign analytics" });
    }
  });
  app2.get("/api/email-campaigns/:id/link-performance", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id: campaignId } = req.params;
      const linkPerformance = await storage.getCampaignLinkPerformance(campaignId);
      res.json(linkPerformance);
    } catch (error) {
      console.error("Error fetching campaign link performance:", error);
      res.status(500).json({ message: "Failed to fetch link performance data" });
    }
  });
  app2.get("/api/email-campaigns/:id/time-series", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id: campaignId } = req.params;
      const { metric = "opens", interval = "day", startDate, endDate } = req.query;
      const validMetrics = ["opens", "clicks", "sends"];
      if (!validMetrics.includes(metric)) {
        return res.status(400).json({ message: "Invalid metric. Must be 'opens', 'clicks', or 'sends'" });
      }
      const validIntervals = ["hour", "day", "week"];
      if (!validIntervals.includes(interval)) {
        return res.status(400).json({ message: "Invalid interval. Must be 'hour', 'day', or 'week'" });
      }
      const parsedStartDate = startDate ? new Date(startDate) : void 0;
      const parsedEndDate = endDate ? new Date(endDate) : void 0;
      if (parsedStartDate && isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({ message: "Invalid startDate format" });
      }
      if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ message: "Invalid endDate format" });
      }
      const timeSeries = await storage.getCampaignTimeSeries(
        campaignId,
        metric,
        interval,
        parsedStartDate,
        parsedEndDate
      );
      res.json(timeSeries);
    } catch (error) {
      console.error("Error fetching campaign time-series data:", error);
      res.status(500).json({ message: "Failed to fetch time-series data" });
    }
  });
  app2.get("/api/email-campaigns/:id/export/csv", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id: campaignId } = req.params;
      const campaign = await storage.getEmailCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      const emailLogs2 = await storage.getEmailLogsByCampaign(campaignId);
      const emailOpens2 = await storage.getEmailOpensByCampaign(campaignId);
      const emailClicks2 = await storage.getEmailClicksByCampaign(campaignId);
      const totalSent = emailLogs2.length;
      const uniqueOpenLogIds = new Set(emailOpens2.map((open) => open.emailLogId));
      const uniqueOpens = uniqueOpenLogIds.size;
      const uniqueClickLogIds = new Set(emailClicks2.map((click) => click.emailLogId));
      const uniqueClicks = uniqueClickLogIds.size;
      const uniqueEngagedLogIds = /* @__PURE__ */ new Set([...uniqueOpenLogIds, ...uniqueClickLogIds]);
      const openRate = totalSent > 0 ? uniqueOpens / totalSent * 100 : 0;
      const clickRate = totalSent > 0 ? uniqueClicks / totalSent * 100 : 0;
      const clickToOpenRate = uniqueOpens > 0 ? uniqueClicks / uniqueOpens * 100 : 0;
      const uniqueEngagementRate = totalSent > 0 ? uniqueEngagedLogIds.size / totalSent * 100 : 0;
      const exportData = emailLogs2.map((log2) => {
        const logOpens = emailOpens2.filter((open) => open.emailLogId === log2.id);
        const logClicks = emailClicks2.filter((click) => click.emailLogId === log2.id);
        const firstOpen = logOpens.length > 0 ? logOpens[0].openedAt : null;
        const firstClick = logClicks.length > 0 ? logClicks[0].clickedAt : null;
        return {
          "Recipient Email": log2.leadEmail || "N/A",
          "Status": log2.status,
          "Sent At": log2.sentAt ? new Date(log2.sentAt).toISOString() : "Not sent",
          "Total Opens": logOpens.length,
          "First Opened": firstOpen ? new Date(firstOpen).toISOString() : "Never",
          "Total Clicks": logClicks.length,
          "First Clicked": firstClick ? new Date(firstClick).toISOString() : "Never",
          "Error Message": log2.errorMessage || ""
        };
      });
      const summaryRow = {
        "Recipient Email": `CAMPAIGN SUMMARY: ${campaign.name}`,
        "Status": campaign.status,
        "Sent At": `Total Sent: ${totalSent}`,
        "Total Opens": `Open Rate: ${openRate.toFixed(1)}%`,
        "First Opened": `Unique Opens: ${uniqueOpens}`,
        "Total Clicks": `Click Rate: ${clickRate.toFixed(1)}%`,
        "First Clicked": `Unique Clicks: ${uniqueClicks}`,
        "Error Message": `Engagement Rate: ${uniqueEngagementRate.toFixed(1)}%`
      };
      const fullExportData = [summaryRow, {}, ...exportData];
      const worksheet = XLSX.utils.json_to_sheet(fullExportData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const filename = `campaign_${campaignId}_analytics_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", "text/csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting campaign analytics:", error);
      res.status(500).json({ message: "Failed to export campaign analytics" });
    }
  });
  app2.get("/api/email-campaigns/:id/export/excel", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id: campaignId } = req.params;
      const campaign = await storage.getEmailCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      const emailLogs2 = await storage.getEmailLogsByCampaign(campaignId);
      const emailOpens2 = await storage.getEmailOpensByCampaign(campaignId);
      const emailClicks2 = await storage.getEmailClicksByCampaign(campaignId);
      const linkPerformance = await storage.getCampaignLinkPerformance(campaignId);
      const totalSent = emailLogs2.length;
      const uniqueOpenLogIds = new Set(emailOpens2.map((open) => open.emailLogId));
      const uniqueOpens = uniqueOpenLogIds.size;
      const uniqueClickLogIds = new Set(emailClicks2.map((click) => click.emailLogId));
      const uniqueClicks = uniqueClickLogIds.size;
      const uniqueEngagedLogIds = /* @__PURE__ */ new Set([...uniqueOpenLogIds, ...uniqueClickLogIds]);
      const openRate = totalSent > 0 ? uniqueOpens / totalSent * 100 : 0;
      const clickRate = totalSent > 0 ? uniqueClicks / totalSent * 100 : 0;
      const clickToOpenRate = uniqueOpens > 0 ? uniqueClicks / uniqueOpens * 100 : 0;
      const uniqueEngagementRate = totalSent > 0 ? uniqueEngagedLogIds.size / totalSent * 100 : 0;
      const summaryData = [
        { Metric: "Campaign Name", Value: campaign.name },
        { Metric: "Status", Value: campaign.status },
        { Metric: "Subject Line", Value: campaign.subject || "N/A" },
        { Metric: "Created At", Value: campaign.createdAt ? new Date(campaign.createdAt) : "N/A" },
        { Metric: "", Value: "" },
        // Spacer
        { Metric: "Total Sent", Value: totalSent },
        { Metric: "Total Opens", Value: emailOpens2.length },
        { Metric: "Unique Opens", Value: uniqueOpens },
        { Metric: "Total Clicks", Value: emailClicks2.length },
        { Metric: "Unique Clicks", Value: uniqueClicks },
        { Metric: "", Value: "" },
        // Spacer
        { Metric: "Open Rate", Value: openRate / 100 },
        // Store as decimal for percentage format
        { Metric: "Click Rate", Value: clickRate / 100 },
        { Metric: "Click-to-Open Rate", Value: clickToOpenRate / 100 },
        { Metric: "Engagement Rate", Value: uniqueEngagementRate / 100 }
      ];
      const leadDetailsData = emailLogs2.map((log2) => {
        const logOpens = emailOpens2.filter((open) => open.emailLogId === log2.id);
        const logClicks = emailClicks2.filter((click) => click.emailLogId === log2.id);
        const firstOpen = logOpens.length > 0 ? logOpens[0].openedAt : null;
        const firstClick = logClicks.length > 0 ? logClicks[0].clickedAt : null;
        const lastOpen = logOpens.length > 0 ? logOpens[logOpens.length - 1].openedAt : null;
        return {
          "Recipient Email": log2.leadEmail || "N/A",
          "Status": log2.status,
          "Sent At": log2.sentAt ? new Date(log2.sentAt) : "Not sent",
          "Total Opens": logOpens.length,
          "First Opened": firstOpen ? new Date(firstOpen) : "Never",
          "Last Opened": lastOpen ? new Date(lastOpen) : "Never",
          "Total Clicks": logClicks.length,
          "First Clicked": firstClick ? new Date(firstClick) : "Never",
          "Engaged": logOpens.length > 0 || logClicks.length > 0 ? "Yes" : "No",
          "Error Message": log2.errorMessage || ""
        };
      });
      const linkPerformanceData = linkPerformance.map((link) => ({
        "Link URL": link.url,
        "Total Clicks": link.totalClicks,
        "Unique Clicks": link.uniqueClicks,
        "Click-Through Rate": link.clickThroughRate / 100,
        // Store as decimal for percentage format
        "Unique Recipients": link.uniqueRecipients
      }));
      const applySheetFormatting = (sheet, config) => {
        if (!sheet["!ref"]) return;
        const range = XLSX.utils.decode_range(sheet["!ref"]);
        if (config.boldHeader) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (sheet[cellAddress]) {
              sheet[cellAddress].s = { font: { bold: true } };
            }
          }
          sheet["!rows"] = [{ hpt: 18 }];
        }
        if (config.percentageColumns) {
          for (const { col, startRow, endRow } of config.percentageColumns) {
            const lastRow = endRow ?? range.e.r;
            for (let row = startRow; row <= lastRow; row++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
              if (sheet[cellAddress] && typeof sheet[cellAddress].v === "number") {
                sheet[cellAddress].t = "n";
                sheet[cellAddress].z = "0.0%";
              }
            }
          }
        }
        if (config.dateColumns) {
          for (const { col, startRow, endRow } of config.dateColumns) {
            const lastRow = endRow ?? range.e.r;
            for (let row = startRow; row <= lastRow; row++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
              if (sheet[cellAddress] && sheet[cellAddress].v instanceof Date) {
                sheet[cellAddress].t = "d";
                sheet[cellAddress].z = "yyyy-mm-dd hh:mm:ss";
              }
            }
          }
        }
      };
      const workbook = XLSX.utils.book_new();
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet["!cols"] = [
        { wch: 25 },
        // Metric column
        { wch: 50 }
        // Value column
      ];
      summarySheet["!freeze"] = { xSplit: 0, ySplit: 1 };
      applySheetFormatting(summarySheet, {
        boldHeader: true,
        percentageColumns: [
          { col: 1, startRow: 12, endRow: 15 }
          // Value column: Open Rate, Click Rate, Click-to-Open Rate, Engagement Rate
        ],
        dateColumns: [
          { col: 1, startRow: 4, endRow: 4 }
          // Value column: Created At
        ]
      });
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Campaign Summary");
      const leadDetailsSheet = XLSX.utils.json_to_sheet(leadDetailsData);
      leadDetailsSheet["!cols"] = [
        { wch: 30 },
        // Recipient Email
        { wch: 10 },
        // Status
        { wch: 22 },
        // Sent At
        { wch: 12 },
        // Total Opens
        { wch: 22 },
        // First Opened
        { wch: 22 },
        // Last Opened
        { wch: 12 },
        // Total Clicks
        { wch: 22 },
        // First Clicked
        { wch: 10 },
        // Engaged
        { wch: 40 }
        // Error Message
      ];
      leadDetailsSheet["!freeze"] = { xSplit: 0, ySplit: 1 };
      applySheetFormatting(leadDetailsSheet, {
        boldHeader: true,
        dateColumns: [
          { col: 2, startRow: 1 },
          // Sent At column (0-indexed col 2)
          { col: 4, startRow: 1 },
          // First Opened column (0-indexed col 4)
          { col: 5, startRow: 1 },
          // Last Opened column (0-indexed col 5)
          { col: 7, startRow: 1 }
          // First Clicked column (0-indexed col 7)
        ]
      });
      XLSX.utils.book_append_sheet(workbook, leadDetailsSheet, "Lead Details");
      if (linkPerformanceData.length > 0) {
        const linkPerformanceSheet = XLSX.utils.json_to_sheet(linkPerformanceData);
        linkPerformanceSheet["!cols"] = [
          { wch: 50 },
          // Link URL
          { wch: 12 },
          // Total Clicks
          { wch: 14 },
          // Unique Clicks
          { wch: 18 },
          // Click-Through Rate
          { wch: 18 }
          // Unique Recipients
        ];
        linkPerformanceSheet["!freeze"] = { xSplit: 0, ySplit: 1 };
        applySheetFormatting(linkPerformanceSheet, {
          boldHeader: true,
          percentageColumns: [
            { col: 3, startRow: 1 }
            // Click-Through Rate column (0-indexed col 3)
          ]
        });
        XLSX.utils.book_append_sheet(workbook, linkPerformanceSheet, "Link Performance");
      }
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      const filename = `campaign_${campaignId}_analytics_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx`;
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting campaign analytics to Excel:", error);
      res.status(500).json({ message: "Failed to export campaign analytics to Excel" });
    }
  });
  app2.get("/api/email-insights/best-send-times", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { scope = "global", scopeId, forceRecalculate } = req.query;
      const validScopes = ["global", "campaign", "persona"];
      if (!validScopes.includes(scope)) {
        return res.status(400).json({
          message: "Invalid scope. Must be 'global', 'campaign', or 'persona'"
        });
      }
      if (scope !== "global" && !scopeId) {
        return res.status(400).json({
          message: "scopeId is required for campaign and persona scopes"
        });
      }
      const shouldForceRecalculate = forceRecalculate === "true" || forceRecalculate === "1";
      const insights = await storage.getSendTimeInsights(
        scope,
        scopeId,
        shouldForceRecalculate
      );
      res.json(insights);
    } catch (error) {
      console.error("Error fetching send time insights:", error);
      res.status(500).json({ message: "Failed to fetch send time insights" });
    }
  });
  app2.get("/api/sms-templates", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const templates = await storage.getAllSmsTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching SMS templates:", error);
      res.status(500).json({ message: "Failed to fetch SMS templates" });
    }
  });
  app2.get("/api/sms-templates/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getSmsTemplateById(id);
      if (!template) {
        return res.status(404).json({ message: "SMS template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching SMS template:", error);
      res.status(500).json({ message: "Failed to fetch SMS template" });
    }
  });
  app2.post("/api/sms-templates", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const validatedData = insertSmsTemplateSchema.parse(req.body);
      const template = await storage.createSmsTemplate(validatedData);
      res.json(template);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error creating SMS template:", error);
      res.status(500).json({ message: "Failed to create SMS template" });
    }
  });
  app2.patch("/api/sms-templates/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSmsTemplateSchema.partial().parse(req.body);
      const updated = await storage.updateSmsTemplate(id, validatedData);
      if (!updated) {
        return res.status(404).json({ message: "SMS template not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error updating SMS template:", error);
      res.status(500).json({ message: "Failed to update SMS template" });
    }
  });
  app2.delete("/api/sms-templates/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSmsTemplate(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting SMS template:", error);
      res.status(500).json({ message: "Failed to delete SMS template" });
    }
  });
  app2.post("/api/sms/send", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { leadId, templateId, customMessage, recipientPhone, recipientName, variables } = req.body;
      let messageContent;
      let usedTemplateId;
      if (templateId) {
        const template = await storage.getSmsTemplateById(templateId);
        if (!template) {
          return res.status(404).json({ message: "SMS template not found" });
        }
        const { replaceVariables: replaceVariables2 } = await Promise.resolve().then(() => (init_twilio(), twilio_exports));
        messageContent = replaceVariables2(template.messageTemplate, variables || {});
        usedTemplateId = templateId;
      } else if (customMessage) {
        messageContent = customMessage;
      } else {
        return res.status(400).json({ message: "Either templateId or customMessage is required" });
      }
      if (!recipientPhone) {
        return res.status(400).json({ message: "Recipient phone number is required" });
      }
      const { sendSMS: sendSMS3 } = await Promise.resolve().then(() => (init_twilio(), twilio_exports));
      const result = await sendSMS3(recipientPhone, messageContent, { leadId, templateId: usedTemplateId });
      const smsSend = await storage.createSmsSend({
        templateId: usedTemplateId,
        leadId: leadId || null,
        recipientPhone,
        recipientName: recipientName || null,
        messageContent,
        status: result.success ? "sent" : "failed",
        smsProvider: "twilio",
        providerMessageId: result.messageId || null,
        errorMessage: result.error || null,
        metadata: { variables },
        sentAt: result.success ? /* @__PURE__ */ new Date() : null
      });
      res.json({
        success: result.success,
        smsSend,
        error: result.error
      });
    } catch (error) {
      console.error("Error sending SMS:", error);
      res.status(500).json({ message: error.message || "Failed to send SMS" });
    }
  });
  app2.get("/api/sms/lead/:leadId", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { leadId } = req.params;
      const sends = await storage.getSmsSendsByLead(leadId);
      res.json(sends);
    } catch (error) {
      console.error("Error fetching SMS sends:", error);
      res.status(500).json({ message: "Failed to fetch SMS sends" });
    }
  });
  app2.get("/api/sms/recent", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const sends = await storage.getRecentSmsSends(limit);
      res.json(sends);
    } catch (error) {
      console.error("Error fetching recent SMS sends:", error);
      res.status(500).json({ message: "Failed to fetch recent SMS sends" });
    }
  });
  app2.post("/api/sms/bulk/preview", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { personaFilter, funnelStageFilter } = req.body;
      const preview = await storage.previewSmsBulkCampaignRecipients(
        personaFilter || null,
        funnelStageFilter || null
      );
      res.json(preview);
    } catch (error) {
      console.error("Error previewing bulk SMS campaign:", error);
      res.status(500).json({ message: "Failed to preview bulk SMS campaign" });
    }
  });
  app2.post("/api/sms/bulk", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const {
        name,
        description,
        personaFilter,
        funnelStageFilter,
        templateId,
        customMessage
      } = req.body;
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      let messageSnapshot;
      if (templateId) {
        const template = await storage.getSmsTemplateById(templateId);
        if (!template) {
          return res.status(404).json({ message: "SMS template not found" });
        }
        messageSnapshot = template.messageTemplate;
      } else if (customMessage) {
        messageSnapshot = customMessage;
      } else {
        return res.status(400).json({ message: "Either templateId or customMessage is required" });
      }
      const preview = await storage.previewSmsBulkCampaignRecipients(
        personaFilter || null,
        funnelStageFilter || null
      );
      if (preview.count === 0) {
        return res.status(400).json({ message: "No recipients match the selected filters" });
      }
      if (preview.count > 5e3) {
        return res.status(400).json({ message: `Recipient count (${preview.count}) exceeds maximum of 5,000 per bulk send` });
      }
      const campaign = await storage.createSmsBulkCampaign({
        name,
        description: description || null,
        personaFilter: personaFilter || null,
        funnelStageFilter: funnelStageFilter || null,
        templateId: templateId || null,
        customMessage: customMessage || null,
        messageSnapshot,
        targetCount: preview.count,
        status: "processing",
        createdBy: currentUser.id,
        startedAt: /* @__PURE__ */ new Date()
      });
      const { processBulkSmsCampaign: processBulkSmsCampaign2 } = await Promise.resolve().then(() => (init_bulkSmsSender(), bulkSmsSender_exports));
      processBulkSmsCampaign2(campaign.id).catch((error) => {
        console.error(`[Bulk SMS] Campaign ${campaign.id} failed:`, error);
      });
      res.json({
        success: true,
        campaign,
        message: `Bulk SMS campaign created. Sending to ${preview.count} recipient(s)...`
      });
    } catch (error) {
      console.error("Error creating bulk SMS campaign:", error);
      res.status(500).json({ message: error.message || "Failed to create bulk SMS campaign" });
    }
  });
  app2.get("/api/sms/bulk", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const campaigns = await storage.getAllSmsBulkCampaigns(limit);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching bulk SMS campaigns:", error);
      res.status(500).json({ message: "Failed to fetch bulk SMS campaigns" });
    }
  });
  app2.get("/api/sms/bulk/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getSmsBulkCampaign(id);
      if (!campaign) {
        return res.status(404).json({ message: "Bulk SMS campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching bulk SMS campaign:", error);
      res.status(500).json({ message: "Failed to fetch bulk SMS campaign" });
    }
  });
  app2.get("/api/hormozi-templates", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { persona, funnelStage, outreachType, templateCategory } = req.query;
      const templates = await storage.getHormoziEmailTemplates({
        persona,
        funnelStage,
        outreachType,
        templateCategory
      });
      res.json(templates);
    } catch (error) {
      console.error("Error fetching Hormozi email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });
  app2.get("/api/hormozi-templates/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getHormoziEmailTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching Hormozi email template:", error);
      res.status(500).json({ message: "Failed to fetch email template" });
    }
  });
  app2.post("/api/hormozi-templates/personalize", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { templateId, leadId } = req.body;
      if (!templateId || !leadId) {
        return res.status(400).json({ message: "templateId and leadId are required" });
      }
      const [template, lead, recentInteractions] = await Promise.all([
        storage.getHormoziEmailTemplate(templateId),
        storage.getLead(leadId),
        storage.getLeadInteractions(leadId, 5)
        // Get last 5 interactions
      ]);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      const { personalizeEmailTemplate: personalizeEmailTemplate2 } = await Promise.resolve().then(() => (init_emailPersonalizer(), emailPersonalizer_exports));
      const personalizedEmail = await personalizeEmailTemplate2({
        lead,
        recentInteractions,
        template: {
          name: template.name,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody || "",
          outreachType: template.outreachType,
          templateCategory: template.templateCategory,
          persona: template.persona,
          funnelStage: template.funnelStage,
          description: template.description || "",
          exampleContext: template.exampleContext || "",
          variables: template.variables || []
        }
      });
      res.json(personalizedEmail);
    } catch (error) {
      console.error("Error personalizing email:", error);
      res.status(500).json({ message: error.message || "Failed to personalize email" });
    }
  });
  app2.post("/api/hormozi-templates/send", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { leadId, subject, htmlBody, textBody } = req.body;
      if (!leadId || !subject || !htmlBody) {
        return res.status(400).json({ message: "leadId, subject, and htmlBody are required" });
      }
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      if (!lead.email) {
        return res.status(400).json({ message: "Lead does not have an email address" });
      }
      await sendTemplatedEmail({
        to: lead.email,
        subject,
        html: htmlBody,
        text: textBody || void 0,
        templateName: "hormozi_personalized",
        variables: {}
      });
      await storage.createInteraction({
        leadId,
        interactionType: "email_sent",
        contentEngaged: `Personalized email: ${subject}`,
        notes: `Sent Hormozi-style personalized email`,
        data: { subject, sentAt: (/* @__PURE__ */ new Date()).toISOString() }
      });
      await storage.updateLead(leadId, {
        lastInteractionDate: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending personalized email:", error);
      res.status(500).json({ message: error.message || "Failed to send email" });
    }
  });
  app2.get("/api/hormozi-sms-templates", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { persona, funnelStage, outreachType, templateCategory } = req.query;
      const templates = await storage.getHormoziSmsTemplates({
        persona,
        funnelStage,
        outreachType,
        templateCategory
      });
      res.json(templates);
    } catch (error) {
      console.error("Error fetching Hormozi SMS templates:", error);
      res.status(500).json({ message: "Failed to fetch SMS templates" });
    }
  });
  app2.get("/api/hormozi-sms-templates/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getHormoziSmsTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching Hormozi SMS template:", error);
      res.status(500).json({ message: "Failed to fetch SMS template" });
    }
  });
  app2.post("/api/hormozi-sms-templates/personalize", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { templateId, leadId } = req.body;
      if (!templateId || !leadId) {
        return res.status(400).json({ message: "templateId and leadId are required" });
      }
      const [template, lead, recentInteractions] = await Promise.all([
        storage.getHormoziSmsTemplate(templateId),
        storage.getLead(leadId),
        storage.getLeadInteractions(leadId, 5)
        // Get last 5 interactions
      ]);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      const { personalizeSmsTemplate: personalizeSmsTemplate2 } = await Promise.resolve().then(() => (init_smsPersonalizer(), smsPersonalizer_exports));
      const personalizedSms = await personalizeSmsTemplate2({
        lead,
        recentInteractions,
        template
      });
      res.json(personalizedSms);
    } catch (error) {
      console.error("Error personalizing SMS:", error);
      res.status(500).json({ message: error.message || "Failed to personalize SMS" });
    }
  });
  app2.post("/api/hormozi-sms-templates/send", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { leadId, messageContent } = req.body;
      if (!leadId || !messageContent) {
        return res.status(400).json({ message: "leadId and messageContent are required" });
      }
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      if (!lead.phone) {
        return res.status(400).json({ message: "Lead does not have a phone number" });
      }
      const { sendSMS: sendSMS3 } = await Promise.resolve().then(() => (init_twilio(), twilio_exports));
      const result = await sendSMS3(lead.phone, messageContent);
      if (!result.success) {
        return res.status(500).json({ message: result.error || "Failed to send SMS" });
      }
      await storage.createSmsSend({
        leadId,
        recipientPhone: lead.phone,
        recipientName: `${lead.firstName || ""} ${lead.lastName || ""}`.trim(),
        messageContent,
        status: "sent",
        smsProvider: "twilio",
        providerMessageId: result.messageId,
        sentAt: /* @__PURE__ */ new Date(),
        metadata: { sentBy: "hormozi_sms_system" }
      });
      await storage.createInteraction({
        leadId,
        interactionType: "sms_sent",
        contentEngaged: `Personalized SMS: ${messageContent.substring(0, 50)}...`,
        notes: `Sent Hormozi-style personalized SMS`,
        data: { messageContent, sentAt: (/* @__PURE__ */ new Date()).toISOString() }
      });
      await storage.updateLead(leadId, {
        lastInteractionDate: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, message: "SMS sent successfully" });
    } catch (error) {
      console.error("Error sending personalized SMS:", error);
      res.status(500).json({ message: error.message || "Failed to send SMS" });
    }
  });
  app2.post("/api/twilio/sms", async (req, res) => {
    try {
      const { Body, From, To } = req.body;
      const twilioSignature = req.headers["x-twilio-signature"];
      if (!twilioSignature) {
        console.error("Missing X-Twilio-Signature header");
        return res.status(401).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      }
      const twilio3 = await import("twilio");
      const { getTwilioAuthToken: getTwilioAuthToken2 } = await Promise.resolve().then(() => (init_twilio(), twilio_exports));
      let authToken = getTwilioAuthToken2();
      if (!authToken && process.env.REPLIT_CONNECTORS_HOSTNAME && (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL)) {
        const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
        const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : "depl " + process.env.WEB_REPL_RENEWAL;
        const connectionSettings4 = await fetch(
          "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=twilio",
          { headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken } }
        ).then((r) => r.json()).then((data) => data.items?.[0]);
        authToken = connectionSettings4?.settings?.api_key_secret;
      }
      if (!authToken) {
        console.error("Twilio auth token not found for webhook validation. Set TWILIO_AUTH_TOKEN or use Replit Connectors.");
        return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      }
      const protocol = req.protocol;
      const host = req.get("host");
      const url = `${protocol}://${host}${req.originalUrl}`;
      const isValid = twilio3.validateRequest(authToken, twilioSignature, url, req.body);
      if (!isValid) {
        console.error("Invalid Twilio signature - possible spoofing attempt");
        return res.status(401).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      }
      const message = (Body || "").trim().toUpperCase();
      const fromPhone = From;
      let responseMessage = "";
      if (message === "STOP" || message === "UNSUBSCRIBE" || message === "END" || message === "QUIT") {
        try {
          const existingUnsubscribe = await storage.getSmsUnsubscribe(fromPhone);
          if (existingUnsubscribe) {
            responseMessage = "You're already unsubscribed. You won't receive any more messages from us.";
          } else {
            await storage.createEmailUnsubscribe({
              phone: fromPhone,
              channel: "sms",
              source: "keyword",
              reason: "user_request",
              feedback: "STOP keyword received"
            });
            responseMessage = "You have been unsubscribed. You will not receive any more messages from us. Reply START to resubscribe.";
          }
        } catch (error) {
          console.error("Error processing STOP keyword:", error);
          responseMessage = "Your request has been received.";
        }
      } else if (message === "START" || message === "UNSTOP" || message === "SUBSCRIBE") {
        try {
          const existingUnsubscribe = await storage.getSmsUnsubscribe(fromPhone);
          if (!existingUnsubscribe) {
            responseMessage = "You're already subscribed. You will receive messages from us.";
          } else {
            await storage.removeUnsubscribe(existingUnsubscribe.id);
            responseMessage = "You have been resubscribed. You will now receive messages from Julie's Family Learning Program.";
          }
        } catch (error) {
          console.error("Error processing START keyword:", error);
          responseMessage = "Your request has been received.";
        }
      } else if (message === "HELP" || message === "INFO") {
        responseMessage = "Julie's Family Learning Program: Reply STOP to unsubscribe, START to resubscribe. For help, visit juliesfamily.org or call us at (617) 555-0100. Msg&data rates may apply.";
      } else {
        responseMessage = "Thank you for your message. Reply HELP for info, STOP to unsubscribe. For support, visit juliesfamily.org";
      }
      res.type("text/xml");
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`);
    } catch (error) {
      console.error("Error processing Twilio SMS webhook:", error);
      res.type("text/xml");
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
  });
  app2.get("/api/leads/:leadId/timeline", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { leadId } = req.params;
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      const [interactions2, smsSends2, enrollments, emailLogs2] = await Promise.all([
        storage.getLeadInteractions(leadId),
        storage.getSmsSendsByLead(leadId),
        storage.getLeadEnrollments(leadId),
        lead.email ? storage.getEmailLogsByRecipient(lead.email) : Promise.resolve([])
      ]);
      const timeline = [];
      interactions2.forEach((interaction) => {
        const content = interaction.contentEngaged || interaction.notes || "";
        timeline.push({
          id: `interaction-${interaction.id}`,
          type: "interaction",
          subType: interaction.interactionType,
          timestamp: interaction.createdAt,
          content,
          metadata: {
            id: interaction.id,
            interactionType: interaction.interactionType,
            contentEngaged: interaction.contentEngaged,
            notes: interaction.notes,
            data: interaction.data
          }
        });
      });
      smsSends2.forEach((sms) => {
        timeline.push({
          id: `sms-${sms.id}`,
          type: "sms",
          subType: sms.status,
          timestamp: sms.sentAt || sms.createdAt,
          content: sms.messageContent,
          metadata: {
            id: sms.id,
            status: sms.status,
            recipientPhone: sms.recipientPhone,
            errorMessage: sms.errorMessage
          }
        });
      });
      enrollments.forEach((enrollment) => {
        timeline.push({
          id: `enrollment-${enrollment.id}`,
          type: "email_campaign",
          subType: enrollment.status,
          timestamp: enrollment.enrolledAt,
          content: `Enrolled in email campaign`,
          metadata: {
            id: enrollment.id,
            campaignId: enrollment.campaignId,
            status: enrollment.status,
            currentStep: enrollment.currentStepNumber || 0,
            completedSteps: enrollment.currentStepNumber || 0
          }
        });
      });
      emailLogs2.forEach((email) => {
        timeline.push({
          id: `email-${email.id}`,
          type: "email",
          subType: email.status,
          timestamp: email.sentAt || email.createdAt,
          content: email.subject || "Email sent",
          metadata: {
            id: email.id,
            subject: email.subject,
            status: email.status,
            errorMessage: email.errorMessage
          }
        });
      });
      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching lead timeline:", error);
      res.status(500).json({ message: "Failed to fetch lead timeline" });
    }
  });
  app2.get("/api/pipeline/stages", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const stages = await storage.getPipelineStages();
      res.json(stages);
    } catch (error) {
      console.error("Error fetching pipeline stages:", error);
      res.status(500).json({ message: "Failed to fetch pipeline stages" });
    }
  });
  app2.get("/api/leads/:leadId/assignment", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { leadId } = req.params;
      const assignment = await storage.getLeadAssignment(leadId);
      if (!assignment) {
        return res.status(404).json({ message: "No assignment found for this lead" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching lead assignment:", error);
      res.status(500).json({ message: "Failed to fetch lead assignment" });
    }
  });
  app2.get("/api/leads/:leadId/assignments", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { leadId } = req.params;
      const assignments = await storage.getLeadAssignments({ leadId });
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching lead assignments:", error);
      res.status(500).json({ message: "Failed to fetch lead assignments" });
    }
  });
  app2.post("/api/leads/:leadId/assignment", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { leadId } = req.params;
      const { assignedTo, assignmentType, notes } = req.body;
      const userId = req.user.id;
      if (!assignedTo) {
        return res.status(400).json({ message: "assignedTo is required" });
      }
      const lead = await storage.getLeadById(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      const assignment = await storage.createLeadAssignment({
        leadId,
        assignedTo,
        assignedBy: userId,
        assignmentType: assignmentType || "manual",
        notes: notes || null
      });
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating lead assignment:", error);
      res.status(500).json({ message: "Failed to create lead assignment" });
    }
  });
  app2.get("/api/admin/assignments", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { assignedTo, leadId } = req.query;
      const assignments = await storage.getLeadAssignments({
        assignedTo,
        leadId
      });
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });
  app2.get("/api/tasks", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { leadId, assignedTo, status } = req.query;
      const tasks2 = await storage.getTasks({
        leadId,
        assignedTo,
        status
      });
      res.json(tasks2);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  app2.post("/api/tasks", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const taskData = req.body;
      const userId = req.user.id;
      taskData.createdBy = userId;
      if (!taskData.leadId || !taskData.assignedTo || !taskData.title || !taskData.taskType) {
        return res.status(400).json({ message: "Missing required fields: leadId, assignedTo, title, taskType" });
      }
      if (taskData.dueDate && typeof taskData.dueDate === "string") {
        taskData.dueDate = new Date(taskData.dueDate);
      }
      if (taskData.completedAt && typeof taskData.completedAt === "string") {
        taskData.completedAt = new Date(taskData.completedAt);
      }
      const task = await storage.createTask(taskData);
      if (task.dueDate) {
        syncTaskToCalendar(storage, task).catch((error) => {
          console.error("Background calendar sync failed:", error);
        });
      }
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });
  app2.patch("/api/tasks/:taskId", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { taskId } = req.params;
      const updates = req.body;
      if (updates.status === "completed" && !updates.completedAt) {
        updates.completedAt = /* @__PURE__ */ new Date();
      }
      if (updates.dueDate && typeof updates.dueDate === "string") {
        updates.dueDate = new Date(updates.dueDate);
      }
      if (updates.completedAt && typeof updates.completedAt === "string") {
        updates.completedAt = new Date(updates.completedAt);
      }
      const task = await storage.updateTask(taskId, updates);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });
  app2.delete("/api/tasks/:taskId", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { taskId } = req.params;
      await storage.deleteTask(taskId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });
  app2.post("/api/tasks/check-overdue", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      await createTasksForMissedFollowUps(storage);
      res.json({ message: "Checked for overdue tasks and created follow-ups where needed" });
    } catch (error) {
      console.error("Error checking overdue tasks:", error);
      res.status(500).json({ message: "Failed to check overdue tasks" });
    }
  });
  app2.patch("/api/leads/:leadId/pipeline-stage", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { leadId } = req.params;
      const { pipelineStage, reason } = req.body;
      const userId = req.user.id;
      if (!pipelineStage) {
        return res.status(400).json({ message: "pipelineStage is required" });
      }
      const lead = await storage.getLeadById(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      const updatedLead = await storage.updateLead(leadId, { pipelineStage });
      await storage.createPipelineHistory({
        leadId,
        fromStage: lead.pipelineStage || null,
        toStage: pipelineStage,
        changedBy: userId,
        reason: reason || null
      });
      if (updatedLead) {
        await createTaskForStageChange(storage, updatedLead, pipelineStage);
      }
      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating pipeline stage:", error);
      res.status(500).json({ message: "Failed to update pipeline stage" });
    }
  });
  app2.get("/api/leads/:leadId/pipeline-history", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { leadId } = req.params;
      const history = await storage.getPipelineHistory(leadId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching pipeline history:", error);
      res.status(500).json({ message: "Failed to fetch pipeline history" });
    }
  });
  app2.get("/api/pipeline/board", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const leads2 = await storage.getAllLeads();
      const stages = await storage.getPipelineStages();
      const leadsByStage = {};
      stages.forEach((stage) => {
        leadsByStage[stage.slug] = [];
      });
      leads2.forEach((lead) => {
        const stageSlug = lead.pipelineStage || "new_lead";
        if (leadsByStage[stageSlug]) {
          leadsByStage[stageSlug].push(lead);
        } else {
          if (leadsByStage["new_lead"]) {
            leadsByStage["new_lead"].push(lead);
          }
        }
      });
      res.json({ stages, leadsByStage });
    } catch (error) {
      console.error("Error fetching pipeline board:", error);
      res.status(500).json({ message: "Failed to fetch pipeline board" });
    }
  });
  app2.get("/api/pipeline/analytics", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const stages = await storage.getPipelineStages();
      const leads2 = await storage.getAllLeads();
      const allHistory = await db.select().from(pipelineHistory).orderBy(pipelineHistory.createdAt);
      const analytics = stages.map((stage, index2) => {
        const stageSlug = stage.slug;
        const nextStage = stages[index2 + 1];
        const leadsInStage = leads2.filter((l) => l.pipelineStage === stageSlug).length;
        const entriesIntoStage = allHistory.filter((h) => h.toStage === stageSlug);
        const totalEntered = entriesIntoStage.length;
        let conversionRate = null;
        if (nextStage && totalEntered > 0) {
          const exitedToNext = allHistory.filter(
            (h) => h.fromStage === stageSlug && h.toStage === nextStage.slug
          ).length;
          conversionRate = exitedToNext / totalEntered * 100;
        }
        let avgTimeInStage = null;
        const stageTimesMs = [];
        entriesIntoStage.forEach((entry) => {
          const exitEntry = allHistory.find(
            (h) => h.leadId === entry.leadId && h.fromStage === stageSlug && new Date(h.createdAt).getTime() > new Date(entry.createdAt).getTime()
          );
          if (exitEntry) {
            const timeInStage = new Date(exitEntry.createdAt).getTime() - new Date(entry.createdAt).getTime();
            stageTimesMs.push(timeInStage);
          }
        });
        if (stageTimesMs.length > 0) {
          const avgMs = stageTimesMs.reduce((sum2, t) => sum2 + t, 0) / stageTimesMs.length;
          avgTimeInStage = avgMs / (1e3 * 60 * 60 * 24);
        }
        const isBottleneck = avgTimeInStage !== null && avgTimeInStage > 7 || conversionRate !== null && conversionRate < 50;
        return {
          stage: stage.name,
          stageSlug,
          position: stage.position,
          leadsInStage,
          totalEntered,
          conversionRate: conversionRate !== null ? Math.round(conversionRate * 10) / 10 : null,
          avgTimeInDays: avgTimeInStage !== null ? Math.round(avgTimeInStage * 10) / 10 : null,
          isBottleneck
        };
      });
      res.json({ analytics });
    } catch (error) {
      console.error("Error fetching pipeline analytics:", error);
      res.status(500).json({ message: "Failed to fetch pipeline analytics" });
    }
  });
  app2.post("/api/donations/create-checkout", paymentLimiter, async (req, res) => {
    try {
      const { amount, donationType, frequency, donorEmail, donorName, donorPhone, isAnonymous, passions, wishlistItemId, metadata, savePaymentMethod } = req.body;
      if (!amount || amount < 100) {
        return res.status(400).json({ message: "Amount must be at least $1.00" });
      }
      if (!["one-time", "recurring", "wishlist"].includes(donationType)) {
        return res.status(400).json({ message: "Invalid donation type" });
      }
      const amountInCents = Math.round(amount);
      if (donationType === "recurring") {
        if (!frequency || !["monthly", "quarterly", "annual"].includes(frequency)) {
          return res.status(400).json({ message: "Invalid frequency for recurring donation" });
        }
      }
      let lead;
      if (donorEmail) {
        const existingLead = await storage.getLeadByEmail(donorEmail);
        if (existingLead) {
          const existingPassions = existingLead.passions || [];
          const newPassions = passions || [];
          const mergedPassions = Array.from(/* @__PURE__ */ new Set([...existingPassions, ...newPassions]));
          lead = await storage.updateLead(existingLead.id, {
            firstName: donorName?.split(" ")[0] || existingLead.firstName,
            lastName: donorName?.split(" ").slice(1).join(" ") || existingLead.lastName,
            phone: donorPhone || existingLead.phone,
            passions: mergedPassions,
            lastInteractionDate: /* @__PURE__ */ new Date()
          });
        } else {
          lead = await storage.createLead({
            email: donorEmail,
            firstName: donorName?.split(" ")[0] || "",
            lastName: donorName?.split(" ").slice(1).join(" ") || "",
            phone: donorPhone,
            persona: "donor",
            funnelStage: "awareness",
            pipelineStage: "new_lead",
            leadSource: "website_donation",
            passions: passions || [],
            metadata: {
              firstDonationDate: (/* @__PURE__ */ new Date()).toISOString()
            }
          });
        }
      }
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const customerId = await getOrCreateStripeCustomer(userId);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        metadata: {
          donationType,
          frequency: frequency || "",
          donorName: donorName || "",
          isAnonymous: isAnonymous ? "true" : "false",
          wishlistItemId: wishlistItemId || "",
          leadId: lead?.id || "",
          ...metadata || {}
        },
        receipt_email: donorEmail || void 0,
        // Add setup_future_usage for recurring or if savePaymentMethod is true
        ...donationType === "recurring" || savePaymentMethod ? { setup_future_usage: "off_session" } : {}
      });
      const donation = await storage.createDonation({
        leadId: lead?.id || null,
        stripePaymentIntentId: paymentIntent.id,
        amount: amountInCents,
        donationType,
        frequency,
        status: "pending",
        donorEmail,
        donorName,
        donorPhone,
        isAnonymous: isAnonymous || false,
        wishlistItemId: wishlistItemId || null,
        metadata: metadata || null
      });
      res.json({
        clientSecret: paymentIntent.client_secret,
        donationId: donation.id
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });
  app2.post("/api/donations/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      console.error("Missing stripe-signature header");
      return res.status(400).send("Webhook Error: Missing signature");
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).send("Webhook Error: Server not configured");
    }
    let event;
    try {
      const rawBody = req.rawBody;
      if (!rawBody) {
        console.error("Raw body not available - check middleware configuration");
        throw new Error("Raw body not available for signature verification");
      }
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object;
          console.log("Payment succeeded:", paymentIntent.id);
          const donation = await storage.getDonationByStripeId(paymentIntent.id);
          if (donation && donation.status === "succeeded") {
            console.log("Payment already processed:", paymentIntent.id);
            return res.json({ received: true, note: "Already processed" });
          }
          const receiptUrl = paymentIntent.charges?.data?.[0]?.receipt_url || null;
          await storage.updateDonationByStripeId(paymentIntent.id, {
            status: "succeeded",
            receiptUrl
          });
          const updatedDonation = await storage.getDonationByStripeId(paymentIntent.id);
          if (!updatedDonation) {
            console.error("Donation not found after update:", paymentIntent.id);
            break;
          }
          let alreadySentThankYou = false;
          let alreadySentReceipt = false;
          if (updatedDonation.donorEmail) {
            try {
              const existingEmails = await storage.getEmailLogsByRecipient(updatedDonation.donorEmail);
              alreadySentThankYou = existingEmails.some((log2) => {
                const meta = log2.metadata;
                return meta?.donationId === updatedDonation.id && meta?.templateName === "donation_thank_you" && log2.status === "sent";
              });
              alreadySentReceipt = existingEmails.some((log2) => {
                const meta = log2.metadata;
                return meta?.donationId === updatedDonation.id && meta?.templateName === "donation_receipt" && log2.status === "sent";
              });
              if (alreadySentThankYou && alreadySentReceipt) {
                console.log("Both emails already sent for donation:", updatedDonation.id);
                break;
              }
            } catch (error) {
              console.error("Error checking email logs for idempotency:", error);
            }
          } else {
            console.warn("No donor email for donation, cannot check for duplicate emails:", updatedDonation.id);
          }
          if (updatedDonation.donorEmail) {
            const donorName = updatedDonation.donorName || "Friend";
            const amountDollars = (updatedDonation.amount / 100).toFixed(2);
            const date = new Date(updatedDonation.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric"
            });
            if (!alreadySentThankYou) {
              console.log("Sending thank-you email to:", updatedDonation.donorEmail);
              const thankYouResult = await sendTemplatedEmail(
                storage,
                "donation_thank_you",
                updatedDonation.donorEmail,
                donorName,
                {
                  donorName,
                  amount: amountDollars,
                  date,
                  organizationName: "Julie's Family Learning Program"
                },
                { donationId: updatedDonation.id }
              );
              if (thankYouResult.success) {
                console.log("Thank-you email sent successfully:", thankYouResult.messageId);
              } else {
                console.error("Failed to send thank-you email:", thankYouResult.error);
              }
            } else {
              console.log("Thank-you email already sent for donation:", updatedDonation.id);
            }
            if (!alreadySentReceipt) {
              console.log("Sending receipt email to:", updatedDonation.donorEmail);
              const receiptResult = await sendTemplatedEmail(
                storage,
                "donation_receipt",
                updatedDonation.donorEmail,
                donorName,
                {
                  donorName,
                  donorEmail: updatedDonation.donorEmail,
                  amount: amountDollars,
                  date,
                  donationId: updatedDonation.id,
                  taxId: "12-3456789"
                  // TODO: Replace with actual EIN
                },
                { donationId: updatedDonation.id }
              );
              if (receiptResult.success) {
                console.log("Receipt email sent successfully:", receiptResult.messageId);
              } else {
                console.error("Failed to send receipt email:", receiptResult.error);
              }
            } else {
              console.log("Receipt email already sent for donation:", updatedDonation.id);
            }
          }
          if (updatedDonation.campaignId) {
            try {
              const campaignMembers2 = await storage.getCampaignMembers(updatedDonation.campaignId);
              const campaign = await storage.getDonationCampaign(updatedDonation.campaignId);
              if (campaign && campaignMembers2.length > 0) {
                const membersToNotify = campaignMembers2.filter((m) => m.notifyOnDonation && m.isActive);
                for (const member of membersToNotify) {
                  const user = await storage.getUser(member.userId);
                  if (!user || !user.email) continue;
                  const channels = member.notificationChannels || ["email"];
                  const donorDisplayName = updatedDonation.isAnonymous ? "An anonymous supporter" : updatedDonation.donorName || "A generous supporter";
                  const amountDollars = (updatedDonation.amount / 100).toFixed(2);
                  if (channels.includes("email")) {
                    const emailSubject = `New donation to ${campaign.name}!`;
                    const emailBody = `Great News!

${donorDisplayName} just donated $${amountDollars} to ${campaign.name}!

Campaign Progress: $${((campaign.raisedAmount + updatedDonation.amount) / 100).toFixed(2)} of $${(campaign.goalAmount / 100).toFixed(2)} raised

You're receiving this notification because you're a member of this campaign. You can manage your notification preferences from your campaign dashboard.`;
                    const emailHtml = `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Great News! \u{1F389}</h2>
                        <p style="color: #666; font-size: 16px;">
                          ${donorDisplayName} just donated <strong>$${amountDollars}</strong> to <strong>${campaign.name}</strong>!
                        </p>
                        <div style="margin: 20px 0; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                          <p style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">
                            Campaign Progress
                          </p>
                          <p style="margin: 10px 0 0 0; color: #666;">
                            $${((campaign.raisedAmount + updatedDonation.amount) / 100).toFixed(2)} of $${(campaign.goalAmount / 100).toFixed(2)} raised
                          </p>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                          You're receiving this notification because you're a member of this campaign. 
                          You can manage your notification preferences from your campaign dashboard.
                        </p>
                      </div>
                    `;
                    try {
                      await storage.createEmailLog({
                        recipientEmail: user.email,
                        subject: emailSubject,
                        htmlBody: emailHtml,
                        status: "pending",
                        emailProvider: "sendgrid",
                        metadata: {
                          campaignId: campaign.id,
                          donationId: updatedDonation.id,
                          memberId: member.id,
                          type: "campaign_donation_notification"
                        }
                      });
                    } catch (logError) {
                      if (logError.code === "23505" || logError.message?.includes("duplicate key")) {
                        console.log(`Campaign member ${user.email} already being notified about donation ${updatedDonation.id}, skipping`);
                        continue;
                      }
                      throw logError;
                    }
                    let emailStatus = "sent";
                    let emailError = null;
                    if (process.env.SENDGRID_API_KEY) {
                      try {
                        const sgMail4 = await import("@sendgrid/mail");
                        sgMail4.default.setApiKey(process.env.SENDGRID_API_KEY);
                        await sgMail4.default.send({
                          to: user.email,
                          from: process.env.SENDGRID_FROM_EMAIL || "notifications@example.com",
                          subject: emailSubject,
                          text: emailBody,
                          html: emailHtml
                        });
                        console.log(`Sent donation notification email to campaign member: ${user.email}`);
                      } catch (sendError) {
                        console.error(`Failed to send notification email to ${user.email}:`, sendError);
                        emailStatus = "failed";
                        emailError = sendError instanceof Error ? sendError.message : "Unknown error";
                      }
                    } else {
                      console.log(`SendGrid not configured, logging notification for ${user.email} (would send in production)`);
                    }
                    const existingLogs = await storage.getEmailLogsByRecipient(user.email);
                    const pendingLog = existingLogs.find((log2) => {
                      const meta = log2.metadata;
                      return log2.status === "pending" && meta?.donationId === updatedDonation.id && meta?.memberId === member.id && meta?.type === "campaign_donation_notification";
                    });
                    if (pendingLog) {
                      await db.update(emailLogs).set({
                        status: emailStatus,
                        errorMessage: emailError,
                        sentAt: emailStatus === "sent" ? /* @__PURE__ */ new Date() : null
                      }).where(eq11(emailLogs.id, pendingLog.id));
                    }
                  }
                }
                console.log(`Processed notifications for ${membersToNotify.length} campaign members (donation: ${updatedDonation.id})`);
              }
            } catch (error) {
              console.error("Error notifying campaign members:", error);
            }
          }
          if (updatedDonation.leadId && updatedDonation.amount) {
            try {
              console.log(`[DonorLifecycle] Processing donation for lead ${updatedDonation.leadId}`);
              const { createDonorLifecycleService: createDonorLifecycleService2 } = await Promise.resolve().then(() => (init_donorLifecycleService(), donorLifecycleService_exports));
              const lifecycleService = createDonorLifecycleService2(storage);
              await lifecycleService.processDonation(
                updatedDonation.leadId,
                updatedDonation.amount,
                new Date(updatedDonation.createdAt)
              );
              console.log(`[DonorLifecycle] Successfully updated lifecycle for lead ${updatedDonation.leadId}`);
            } catch (lifecycleError) {
              console.error(`[DonorLifecycle] Failed to update lifecycle for lead ${updatedDonation.leadId}:`, lifecycleError);
            }
          }
          if (updatedDonation.leadId) {
            try {
              const donationCount = await db.select({ count: sql12`cast(count(*) as integer)` }).from(donations).where(
                and12(
                  eq11(donations.leadId, updatedDonation.leadId),
                  eq11(donations.status, "succeeded")
                )
              );
              const isFirstDonation = donationCount[0]?.count === 1;
              if (isFirstDonation) {
                console.log(`[GraduationPath] First donation detected for lead ${updatedDonation.leadId}, enrolling...`);
                const { enrollInGraduationPath: enrollInGraduationPath2 } = await Promise.resolve().then(() => (init_graduationPathCampaign(), graduationPathCampaign_exports));
                await enrollInGraduationPath2(updatedDonation.leadId);
                console.log(`[GraduationPath] Successfully enrolled lead ${updatedDonation.leadId} in graduation path`);
              } else {
                console.log(`[GraduationPath] Lead ${updatedDonation.leadId} already has ${donationCount[0]?.count} donations, skipping enrollment`);
              }
            } catch (enrollmentError) {
              console.error(`[GraduationPath] Failed to enroll lead ${updatedDonation.leadId} in graduation path:`, enrollmentError);
            }
          } else {
            console.log("[GraduationPath] No leadId for donation, skipping graduation path enrollment");
          }
          break;
        }
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object;
          console.log("Payment failed:", paymentIntent.id);
          const donation = await storage.getDonationByStripeId(paymentIntent.id);
          if (donation && donation.status === "failed") {
            console.log("Payment failure already processed:", paymentIntent.id);
            return res.json({ received: true, note: "Already processed" });
          }
          await storage.updateDonationByStripeId(paymentIntent.id, {
            status: "failed"
          });
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });
  app2.get("/api/donations", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const donations3 = await storage.getAllDonations();
      res.json(donations3);
    } catch (error) {
      console.error("Error fetching donations:", error);
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });
  app2.get("/api/donations/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const donation = await storage.getDonationById(id);
      if (!donation) {
        return res.status(404).json({ message: "Donation not found" });
      }
      res.json(donation);
    } catch (error) {
      console.error("Error fetching donation:", error);
      res.status(500).json({ message: "Failed to fetch donation" });
    }
  });
  app2.get("/api/donation-campaigns/by-slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const campaign = await storage.getDonationCampaignBySlug(slug);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      if (campaign.status !== "active") {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching donation campaign:", error);
      res.status(500).json({ message: "Failed to fetch donation campaign" });
    }
  });
  app2.get("/api/donation-campaigns", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const campaigns = await storage.getAllDonationCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching donation campaigns:", error);
      res.status(500).json({ message: "Failed to fetch donation campaigns" });
    }
  });
  app2.get("/api/donation-campaigns/active", async (req, res) => {
    try {
      const campaigns = await storage.getActiveDonationCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching active donation campaigns:", error);
      res.status(500).json({ message: "Failed to fetch active donation campaigns" });
    }
  });
  app2.get("/api/donation-campaigns/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getDonationCampaign(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching donation campaign:", error);
      res.status(500).json({ message: "Failed to fetch donation campaign" });
    }
  });
  app2.get("/api/donation-campaigns/:id/donations", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const donations3 = await storage.getCampaignDonations(id);
      res.json(donations3);
    } catch (error) {
      console.error("Error fetching campaign donations:", error);
      res.status(500).json({ message: "Failed to fetch campaign donations" });
    }
  });
  app2.post("/api/donation-campaigns", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const parsed = insertDonationCampaignSchema.parse(req.body);
      const campaign = await storage.createDonationCampaign(parsed);
      res.json(campaign);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      console.error("Error creating donation campaign:", error);
      res.status(500).json({ message: "Failed to create donation campaign" });
    }
  });
  app2.patch("/api/donation-campaigns/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const partialSchema = insertDonationCampaignSchema.partial();
      const validated = partialSchema.parse(req.body);
      const campaign = await storage.updateDonationCampaign(id, validated);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      console.error("Error updating donation campaign:", error);
      res.status(500).json({ message: "Failed to update donation campaign" });
    }
  });
  app2.post("/api/donation-campaigns/:id/send", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getDonationCampaign(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      if (!campaign.emailTemplateId && !campaign.smsTemplateId) {
        return res.status(400).json({ message: "Campaign must have at least one communication channel" });
      }
      const allLeads = await storage.getAllLeads();
      const matchedLeads = allLeads.filter((lead) => {
        if (!lead.passions || lead.passions.length === 0) return false;
        if (!campaign.passionTags || campaign.passionTags.length === 0) return true;
        return lead.passions.some(
          (passion) => campaign.passionTags.includes(passion)
        );
      });
      if (matchedLeads.length === 0) {
        return res.status(400).json({ message: "No leads match the campaign's target passions" });
      }
      const { personalizeEmailTemplate: personalizeEmailTemplate2 } = await Promise.resolve().then(() => (init_emailPersonalizer(), emailPersonalizer_exports));
      const { personalizeSmsTemplate: personalizeSmsTemplate2 } = await Promise.resolve().then(() => (init_smsPersonalizer(), smsPersonalizer_exports));
      const { sendEmail: sendEmail3 } = await Promise.resolve().then(() => (init_email(), email_exports));
      const { sendSMS: sendSMS3 } = await Promise.resolve().then(() => (init_twilio(), twilio_exports));
      const results = {
        emailsSent: 0,
        emailsFailed: 0,
        smsSent: 0,
        smsFailed: 0,
        totalMatched: matchedLeads.length
      };
      for (const lead of matchedLeads) {
        if (campaign.emailTemplateId && lead.email) {
          try {
            const emailTemplate = await storage.getEmailTemplate(campaign.emailTemplateId);
            if (emailTemplate) {
              const personalized = await personalizeEmailTemplate2({
                lead,
                recentInteractions: [],
                template: emailTemplate,
                campaignContext: {
                  campaignName: campaign.name,
                  campaignDescription: campaign.description,
                  campaignStory: campaign.story,
                  goalAmount: campaign.goalAmount / 100
                }
              });
              const result = await sendEmail3(storage, {
                to: lead.email,
                toName: lead.name,
                subject: personalized.subject,
                html: personalized.body,
                templateId: emailTemplate.id,
                metadata: { campaignId: campaign.id, leadId: lead.id }
              });
              if (result.success) {
                results.emailsSent++;
              } else {
                results.emailsFailed++;
              }
            }
          } catch (error) {
            console.error(`Failed to send email to ${lead.email}:`, error);
            results.emailsFailed++;
          }
        }
        if (campaign.smsTemplateId && lead.phone) {
          try {
            const smsTemplate = await storage.getSmsTemplate(campaign.smsTemplateId);
            if (smsTemplate) {
              const personalized = await personalizeSmsTemplate2({
                lead,
                recentInteractions: [],
                template: smsTemplate,
                campaignContext: {
                  campaignName: campaign.name,
                  campaignDescription: campaign.description
                }
              });
              const result = await sendSMS3(
                lead.phone,
                personalized.message,
                { campaignId: campaign.id, leadId: lead.id, templateId: smsTemplate.id }
              );
              if (result.success) {
                results.smsSent++;
                await storage.createSmsSend({
                  templateId: smsTemplate.id,
                  leadId: lead.id,
                  recipientPhone: lead.phone,
                  recipientName: lead.name,
                  messageContent: personalized.message,
                  status: "sent",
                  smsProvider: "twilio",
                  providerMessageId: result.messageId,
                  sentAt: /* @__PURE__ */ new Date(),
                  metadata: { campaignId: campaign.id }
                });
              } else {
                results.smsFailed++;
                if (result.blocked) {
                  console.log(`[Campaign ${campaign.id}] SMS blocked for ${lead.phone} - recipient opted out`);
                }
              }
            }
          } catch (error) {
            console.error(`Failed to send SMS to ${lead.phone}:`, error);
            results.smsFailed++;
          }
        }
      }
      res.json({
        message: "Campaign sent successfully",
        results
      });
    } catch (error) {
      console.error("Error sending donation campaign:", error);
      res.status(500).json({ message: "Failed to send donation campaign" });
    }
  });
  async function getOrCreateStripeCustomer(oidcSubId) {
    const user = await storage.getUserByOidcSub(oidcSubId);
    if (!user) throw new Error("User not found");
    if (user.stripeCustomerId) return user.stripeCustomerId;
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    if (existing.data.length > 0) {
      const customerId = existing.data[0].id;
      await storage.updateUser(user.id, { stripeCustomerId: customerId });
      return customerId;
    }
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      metadata: { oidcSubId }
    });
    await storage.updateUser(user.id, { stripeCustomerId: customer.id });
    return customer.id;
  }
  app2.get("/api/stripe/payment-methods", ...authWithImpersonation, paymentLimiter, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const customerId = await getOrCreateStripeCustomer(userId);
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card"
      });
      const cards = paymentMethods.data.map((pm) => ({
        id: pm.id,
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year
      }));
      res.json(cards);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({
        message: "Failed to fetch payment methods",
        error: error.message
      });
    }
  });
  app2.post("/api/stripe/setup-intent", ...authWithImpersonation, paymentLimiter, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const customerId = await getOrCreateStripeCustomer(userId);
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["card"]
      });
      res.json({ clientSecret: setupIntent.client_secret });
    } catch (error) {
      console.error("Error creating setup intent:", error);
      res.status(500).json({
        message: "Failed to create setup intent",
        error: error.message
      });
    }
  });
  app2.get("/api/my-campaigns", ...authWithImpersonation, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getUserCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching user campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });
  app2.get("/api/my-campaigns/:campaignId", ...authWithImpersonation, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;
      const isMember = await storage.isCampaignMember(campaignId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view this campaign" });
      }
      const campaign = await storage.getDonationCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });
  app2.get("/api/my-campaigns/:campaignId/donations", ...authWithImpersonation, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;
      const isMember = await storage.isCampaignMember(campaignId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view this campaign" });
      }
      const donations3 = await storage.getCampaignDonations(campaignId);
      res.json(donations3);
    } catch (error) {
      console.error("Error fetching campaign donations:", error);
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });
  app2.patch("/api/campaign-members/:memberId/preferences", ...authWithImpersonation, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { memberId } = req.params;
      const member = await storage.getCampaignMember(memberId);
      if (!member || member.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update these preferences" });
      }
      const { notifyOnDonation, notificationChannels } = req.body;
      const updated = await storage.updateCampaignMember(memberId, {
        notifyOnDonation,
        notificationChannels
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating member preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });
  app2.post("/api/my-campaigns/:campaignId/testimonials", ...authWithImpersonation, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;
      const isMember = await storage.isCampaignMember(campaignId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to submit testimonial for this campaign" });
      }
      const members = await storage.getCampaignMembers(campaignId);
      const member = members.find((m) => m.userId === userId);
      if (!member) {
        return res.status(404).json({ message: "Member record not found" });
      }
      const { title, message, authorName, authorRole, wasAiEnhanced, originalMessage } = req.body;
      if (!message || !authorName) {
        return res.status(400).json({ message: "Message and author name are required" });
      }
      const testimonial = await storage.createCampaignTestimonial({
        campaignId,
        memberId: member.id,
        title,
        message,
        authorName,
        authorRole,
        wasAiEnhanced: wasAiEnhanced || false,
        originalMessage: wasAiEnhanced ? originalMessage : null,
        status: "pending"
      });
      res.json(testimonial);
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      res.status(500).json({ message: "Failed to submit testimonial" });
    }
  });
  app2.get("/api/my-testimonials", ...authWithImpersonation, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getUserCampaigns(userId);
      const memberIds = campaigns.map((c) => c.id);
      const allTestimonials = [];
      for (const memberId of memberIds) {
        const testimonials = await storage.getMemberTestimonials(memberId);
        allTestimonials.push(...testimonials);
      }
      res.json(allTestimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });
  app2.post("/api/donation-campaigns/:campaignId/members", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { userId, role, notifyOnDonation, notificationChannels, metadata } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const member = await storage.createCampaignMember({
        campaignId,
        userId,
        role: role || "beneficiary",
        notifyOnDonation: notifyOnDonation !== void 0 ? notifyOnDonation : true,
        notificationChannels: notificationChannels || ["email"],
        metadata
      });
      res.json(member);
    } catch (error) {
      console.error("Error adding campaign member:", error);
      res.status(500).json({ message: "Failed to add campaign member" });
    }
  });
  app2.get("/api/donation-campaigns/:campaignId/members", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { campaignId } = req.params;
      const members = await storage.getCampaignMembers(campaignId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching campaign members:", error);
      res.status(500).json({ message: "Failed to fetch campaign members" });
    }
  });
  app2.get("/api/donation-campaigns/:campaignId/testimonials", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { status } = req.query;
      const testimonials = await storage.getCampaignTestimonials(campaignId, status);
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });
  app2.patch("/api/campaign-testimonials/:id/approve", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.claims.sub;
      const updated = await storage.updateCampaignTestimonial(id, {
        status: "approved",
        approvedBy: adminId,
        approvedAt: /* @__PURE__ */ new Date()
      });
      if (!updated) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error approving testimonial:", error);
      res.status(500).json({ message: "Failed to approve testimonial" });
    }
  });
  app2.post("/api/campaign-testimonials/:id/send", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const testimonial = await storage.getCampaignTestimonial(id);
      if (!testimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      if (testimonial.status !== "approved") {
        return res.status(400).json({ message: "Testimonial must be approved before sending" });
      }
      const campaign = await storage.getDonationCampaign(testimonial.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      const donations3 = await storage.getCampaignDonations(testimonial.campaignId);
      const donors = donations3.filter((d) => d.status === "succeeded" && d.amount && d.amount > 0);
      const uniqueDonorEmails = /* @__PURE__ */ new Set();
      donors.forEach((d) => {
        if (d.donorEmail) uniqueDonorEmails.add(d.donorEmail);
      });
      let sentCount = 0;
      for (const donorEmail of uniqueDonorEmails) {
        try {
          const emailSubject = `Thank you from ${testimonial.authorName} - ${campaign.name}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${testimonial.title || "A Message of Thanks"}</h2>
              <p style="color: #666; font-size: 14px;">From ${testimonial.authorName}${testimonial.authorRole ? `, ${testimonial.authorRole}` : ""}</p>
              <div style="margin: 20px 0; padding: 20px; background-color: #f9f9f9; border-left: 4px solid #4CAF50;">
                <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${testimonial.message}</p>
              </div>
              <p style="color: #666; font-size: 14px;">Thank you for your generous support of <strong>${campaign.name}</strong>. Your donation has made a real difference!</p>
            </div>
          `;
          await storage.createEmailLog({
            recipientEmail: donorEmail,
            subject: emailSubject,
            htmlBody: emailHtml,
            status: "sent",
            emailProvider: "sendgrid",
            metadata: {
              campaignId: campaign.id,
              testimonialId: testimonial.id,
              type: "testimonial_to_donor"
            },
            sentAt: /* @__PURE__ */ new Date()
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send testimonial email to ${donorEmail}:`, error);
        }
      }
      await storage.updateCampaignTestimonial(id, {
        wasSentToDonors: true,
        sentToDonorsAt: /* @__PURE__ */ new Date(),
        recipientCount: sentCount,
        status: "sent"
      });
      res.json({
        success: true,
        recipientCount: sentCount,
        message: `Testimonial sent to ${sentCount} donor${sentCount !== 1 ? "s" : ""}`
      });
    } catch (error) {
      console.error("Error sending testimonial to donors:", error);
      res.status(500).json({ message: "Failed to send testimonial to donors" });
    }
  });
  app2.get("/api/wishlist", async (req, res) => {
    try {
      const items = await storage.getActiveWishlistItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching wishlist items:", error);
      res.status(500).json({ message: "Failed to fetch wishlist items" });
    }
  });
  app2.get("/api/wishlist/all", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const items = await storage.getAllWishlistItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching all wishlist items:", error);
      res.status(500).json({ message: "Failed to fetch all wishlist items" });
    }
  });
  app2.post("/api/wishlist", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const parsed = insertWishlistItemSchema.parse(req.body);
      const item = await storage.createWishlistItem(parsed);
      res.json(item);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid wishlist item data", errors: error.errors });
      }
      console.error("Error creating wishlist item:", error);
      res.status(500).json({ message: "Failed to create wishlist item" });
    }
  });
  app2.patch("/api/wishlist/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateWishlistItem(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating wishlist item:", error);
      res.status(500).json({ message: "Failed to update wishlist item" });
    }
  });
  app2.delete("/api/wishlist/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteWishlistItem(id);
      if (!deleted) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
      res.status(500).json({ message: "Failed to delete wishlist item" });
    }
  });
  app2.post("/api/ai/generate-copy", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const response = await generateValueEquationCopy(req.body);
      res.json(response);
    } catch (error) {
      console.error("Error generating copy:", error);
      res.status(500).json({
        message: error.message || "Failed to generate copy variants"
      });
    }
  });
  app2.post("/api/ai/suggest-variant-name", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { testType, configuration, persona, funnelStage } = req.body;
      if (!testType || !configuration) {
        return res.status(400).json({
          message: "Missing required fields: testType and configuration"
        });
      }
      const { generateVariantNameAndDescription: generateVariantNameAndDescription2 } = await Promise.resolve().then(() => (init_copywriter(), copywriter_exports));
      const response = await generateVariantNameAndDescription2(
        testType,
        configuration,
        persona,
        funnelStage
      );
      res.json(response);
    } catch (error) {
      console.error("Error suggesting variant name:", error);
      res.status(500).json({
        message: error.message || "Failed to suggest variant name"
      });
    }
  });
  app2.post("/api/ai/generate-ab-test-variants", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { controlContent, contentType, persona, funnelStage } = req.body;
      if (!controlContent || !contentType) {
        return res.status(400).json({
          message: "Missing required fields: controlContent and contentType"
        });
      }
      const response = await generateAbTestVariants(
        controlContent,
        contentType,
        persona,
        funnelStage
      );
      res.json(response);
    } catch (error) {
      console.error("Error generating A/B test variants:", error);
      res.status(500).json({
        message: error.message || "Failed to generate test variants"
      });
    }
  });
  app2.post("/api/ai/generate-field-text", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { fieldType, contentType, currentValue, title, persona } = req.body;
      if (!fieldType || !contentType) {
        return res.status(400).json({
          message: "Missing required fields: fieldType and contentType"
        });
      }
      const { generateFieldText: generateFieldText2 } = await Promise.resolve().then(() => (init_copywriter(), copywriter_exports));
      const text2 = await generateFieldText2(
        fieldType,
        contentType,
        currentValue,
        title,
        persona
      );
      res.json({ text: text2 });
    } catch (error) {
      console.error("Error generating field text:", error);
      res.status(500).json({
        message: error.message || "Failed to generate text"
      });
    }
  });
  app2.post("/api/calendar/events", ...authWithImpersonation, async (req, res) => {
    try {
      const { summary, description, location, start, end, attendees } = req.body;
      if (!summary || !start || !end) {
        return res.status(400).json({
          message: "Missing required fields: summary, start, end"
        });
      }
      const timezone = start.timeZone || "America/New_York";
      const startUTC = fromZonedTime3(start.dateTime, timezone);
      const endUTC = fromZonedTime3(end.dateTime, timezone);
      const event = await CalendarService.createEvent({
        summary,
        description,
        location,
        start: {
          dateTime: startUTC.toISOString(),
          timeZone: timezone
        },
        end: {
          dateTime: endUTC.toISOString(),
          timeZone: timezone
        },
        attendees
      });
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({
        message: error.message || "Failed to create calendar event"
      });
    }
  });
  app2.get("/api/calendar/events", ...authWithImpersonation, async (req, res) => {
    try {
      const { timeMin, timeMax, maxResults } = req.query;
      const events = await CalendarService.listEvents(
        timeMin,
        timeMax,
        maxResults ? parseInt(maxResults) : void 0
      );
      res.json(events);
    } catch (error) {
      console.error("Error listing calendar events:", error);
      res.status(500).json({
        message: error.message || "Failed to list calendar events"
      });
    }
  });
  app2.get("/api/calendar/events/:eventId", ...authWithImpersonation, async (req, res) => {
    try {
      const { eventId } = req.params;
      const event = await CalendarService.getEvent(eventId);
      res.json(event);
    } catch (error) {
      console.error("Error fetching calendar event:", error);
      res.status(500).json({
        message: error.message || "Failed to fetch calendar event"
      });
    }
  });
  app2.get("/api/calendar/availability", async (req, res) => {
    try {
      const { date } = req.query;
      if (!date || typeof date !== "string") {
        return res.status(400).json({
          message: "Missing required parameter: date (YYYY-MM-DD format)"
        });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          message: "Invalid date format. Expected YYYY-MM-DD"
        });
      }
      const dateString = date;
      const timezone = "America/New_York";
      const slots = [];
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startHour = hour.toString().padStart(2, "0");
          const startMinute = minute.toString().padStart(2, "0");
          const endMinute = ((minute + 30) % 60).toString().padStart(2, "0");
          const endHour = (minute === 30 ? hour + 1 : hour).toString().padStart(2, "0");
          const startTime = `${dateString}T${startHour}:${startMinute}:00`;
          const endTime = `${dateString}T${endHour}:${endMinute}:00`;
          const startUTC = fromZonedTime3(startTime, timezone);
          const endUTC = fromZonedTime3(endTime, timezone);
          const availability = await CalendarService.checkAvailability(
            startUTC.toISOString(),
            endUTC.toISOString()
          );
          slots.push({
            start: startTime,
            end: endTime,
            available: availability.available
          });
        }
      }
      res.json(slots);
    } catch (error) {
      console.error("Error getting availability:", error);
      res.status(500).json({
        message: error.message || "Failed to get availability"
      });
    }
  });
  app2.post("/api/calendar/check-availability", ...authWithImpersonation, async (req, res) => {
    try {
      const { startDateTime, endDateTime } = req.body;
      if (!startDateTime || !endDateTime) {
        return res.status(400).json({
          message: "Missing required fields: startDateTime, endDateTime"
        });
      }
      const availability = await CalendarService.checkAvailability(
        startDateTime,
        endDateTime
      );
      res.json(availability);
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({
        message: error.message || "Failed to check availability"
      });
    }
  });
  app2.patch("/api/calendar/events/:eventId", ...authWithImpersonation, async (req, res) => {
    try {
      const { eventId } = req.params;
      const updates = req.body;
      const event = await CalendarService.updateEvent(eventId, updates);
      res.json(event);
    } catch (error) {
      console.error("Error updating calendar event:", error);
      res.status(500).json({
        message: error.message || "Failed to update calendar event"
      });
    }
  });
  app2.delete("/api/calendar/events/:eventId", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { eventId } = req.params;
      const result = await CalendarService.deleteEvent(eventId);
      res.json(result);
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      res.status(500).json({
        message: error.message || "Failed to delete calendar event"
      });
    }
  });
  app2.get("/api/tgh/progress", ...authWithImpersonation, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const user = await storage.getUserByOidcSub(oidcSub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const progress = await storage.getStudentProgress(user.id);
      if (!progress) {
        return res.json({
          enrolled: false,
          message: "Not enrolled in Tech Goes Home program"
        });
      }
      res.json({
        enrolled: true,
        ...progress
      });
    } catch (error) {
      console.error("Error fetching TGH progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });
  app2.get("/api/tgh/demo-progress", async (req, res) => {
    try {
      res.json({
        enrolled: true,
        classesCompleted: 8,
        classesRemaining: 7,
        hoursCompleted: 16,
        percentComplete: 53,
        isEligibleForRewards: false,
        totalClassesRequired: 15,
        rewards: {
          chromebook: { name: "Free Chromebook", eligible: false },
          certificate: { name: "Certificate of Completion", eligible: false },
          internet: { name: "1 Year Free Internet", eligible: false }
        }
      });
    } catch (error) {
      console.error("Error fetching TGH demo progress:", error);
      res.status(500).json({ message: "Failed to fetch demo progress" });
    }
  });
  app2.post("/api/tgh/enroll", ...authWithImpersonation, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const user = await storage.getUserByOidcSub(oidcSub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const existingEnrollment = await storage.getTechGoesHomeEnrollmentByUserId(user.id);
      if (existingEnrollment) {
        return res.status(400).json({
          message: "Already enrolled in Tech Goes Home program",
          enrollment: existingEnrollment
        });
      }
      const { insertTechGoesHomeEnrollmentSchema: insertTechGoesHomeEnrollmentSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const enrollmentData = insertTechGoesHomeEnrollmentSchema2.parse({
        userId: user.id,
        programName: "Tech Goes Home",
        enrollmentDate: /* @__PURE__ */ new Date(),
        status: "active",
        totalClassesRequired: 15
      });
      const enrollment = await storage.createTechGoesHomeEnrollment(enrollmentData);
      try {
        let lead = user.email ? await storage.getLeadByEmail(user.email) : null;
        if (!lead && user.email) {
          const leadData = {
            email: user.email,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Student",
            persona: "student",
            funnelStage: "awareness",
            source: "program_enrollment"
          };
          lead = await storage.createLead(leadData);
        }
        if (lead) {
          await evaluateLeadProgression(lead.id, "enrollment_submitted", user.id);
        }
      } catch (progressionError) {
        console.error("Error triggering funnel progression for TGH enrollment:", progressionError);
      }
      res.json({
        message: "Successfully enrolled in Tech Goes Home program",
        enrollment
      });
    } catch (error) {
      console.error("Error creating TGH enrollment:", error);
      res.status(500).json({ message: "Failed to enroll in program" });
    }
  });
  app2.post("/api/admin/tgh/demo-enrollment", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const user = await storage.getUserByOidcSub(oidcSub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const existingEnrollment = await storage.getTechGoesHomeEnrollmentByUserId(user.id);
      if (existingEnrollment) {
        await storage.updateTechGoesHomeEnrollment(existingEnrollment.id, {
          status: "withdrawn"
        });
      }
      const { insertTechGoesHomeEnrollmentSchema: insertTechGoesHomeEnrollmentSchema2, insertTechGoesHomeAttendanceSchema: insertTechGoesHomeAttendanceSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const enrollmentData = insertTechGoesHomeEnrollmentSchema2.parse({
        userId: user.id,
        programName: "Tech Goes Home",
        enrollmentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1e3),
        // 60 days ago
        programStartDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1e3),
        // 55 days ago
        status: "active",
        totalClassesRequired: 15,
        chromebookReceived: false,
        internetActivated: false
      });
      const enrollment = await storage.createTechGoesHomeEnrollment(enrollmentData);
      const attendanceRecords = [
        {
          enrollmentId: enrollment.id,
          classDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1e3),
          classNumber: 1,
          attended: true,
          isMakeup: false,
          hoursCredits: 2
        },
        {
          enrollmentId: enrollment.id,
          classDate: new Date(Date.now() - 43 * 24 * 60 * 60 * 1e3),
          classNumber: 2,
          attended: true,
          isMakeup: false,
          hoursCredits: 2
        },
        {
          enrollmentId: enrollment.id,
          classDate: new Date(Date.now() - 36 * 24 * 60 * 60 * 1e3),
          classNumber: 3,
          attended: true,
          isMakeup: false,
          hoursCredits: 2
        },
        {
          enrollmentId: enrollment.id,
          classDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1e3),
          classNumber: 4,
          attended: false,
          isMakeup: false,
          hoursCredits: 0
        },
        {
          enrollmentId: enrollment.id,
          classDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1e3),
          classNumber: 5,
          attended: true,
          isMakeup: false,
          hoursCredits: 2
        },
        {
          enrollmentId: enrollment.id,
          classDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1e3),
          classNumber: 6,
          attended: true,
          isMakeup: true,
          hoursCredits: 2,
          notes: "Makeup for Class 4"
        }
      ];
      const attendance = await Promise.all(
        attendanceRecords.map(
          (record) => storage.createTechGoesHomeAttendance(insertTechGoesHomeAttendanceSchema2.parse(record))
        )
      );
      const progress = await storage.getStudentProgress(user.id);
      res.json({
        message: "Demo enrollment created successfully",
        enrollment,
        attendanceCount: attendance.length,
        progress
      });
    } catch (error) {
      console.error("Error creating demo TGH enrollment:", error);
      res.status(500).json({
        message: "Failed to create demo enrollment",
        error: error.message
      });
    }
  });
  app2.get("/api/admin/tgh/enrollments", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const enrollments = await storage.getAllTechGoesHomeEnrollments();
      const enrichedEnrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          const user = await storage.getUser(enrollment.userId);
          const progress = await storage.getStudentProgress(enrollment.userId);
          return {
            ...enrollment,
            user: user ? {
              id: user.id,
              name: user.name,
              email: user.email
            } : null,
            classesCompleted: progress?.classesCompleted || 0,
            percentComplete: progress?.percentComplete || 0
          };
        })
      );
      res.json(enrichedEnrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  app2.get("/api/admin/tgh/enrollments/:id", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const enrollment = await storage.getTechGoesHomeEnrollment(id);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      const attendance = await storage.getTechGoesHomeAttendance(id);
      const user = await storage.getUser(enrollment.userId);
      const progress = await storage.getStudentProgress(enrollment.userId);
      res.json({
        ...enrollment,
        attendance,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email
        } : null,
        progress
      });
    } catch (error) {
      console.error("Error fetching enrollment:", error);
      res.status(500).json({ message: "Failed to fetch enrollment" });
    }
  });
  app2.post("/api/admin/tgh/enrollments", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { insertTechGoesHomeEnrollmentSchema: insertTechGoesHomeEnrollmentSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const enrollmentData = insertTechGoesHomeEnrollmentSchema2.parse(req.body);
      const existingEnrollment = await storage.getTechGoesHomeEnrollmentByUserId(enrollmentData.userId);
      if (existingEnrollment && existingEnrollment.status === "active") {
        return res.status(400).json({
          message: "User already has an active enrollment. Please complete or withdraw the existing enrollment first."
        });
      }
      const enrollment = await storage.createTechGoesHomeEnrollment(enrollmentData);
      res.json(enrollment);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to create enrollment", error: error.message });
    }
  });
  app2.patch("/api/admin/tgh/enrollments/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const enrollment = await storage.updateTechGoesHomeEnrollment(id, updates);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      res.json(enrollment);
    } catch (error) {
      console.error("Error updating enrollment:", error);
      res.status(500).json({ message: "Failed to update enrollment", error: error.message });
    }
  });
  app2.delete("/api/admin/tgh/enrollments/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const enrollment = await storage.getTechGoesHomeEnrollment(id);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      await storage.updateTechGoesHomeEnrollment(id, { status: "withdrawn" });
      res.json({ message: "Enrollment withdrawn successfully" });
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      res.status(500).json({ message: "Failed to delete enrollment" });
    }
  });
  app2.post("/api/admin/tgh/attendance", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { insertTechGoesHomeAttendanceSchema: insertTechGoesHomeAttendanceSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const attendanceData = insertTechGoesHomeAttendanceSchema2.parse({
        ...req.body,
        markedByAdminId: req.user.id
      });
      const attendance = await storage.createTechGoesHomeAttendance(attendanceData);
      res.json(attendance);
    } catch (error) {
      console.error("Error creating attendance:", error);
      res.status(500).json({ message: "Failed to create attendance", error: error.message });
    }
  });
  app2.patch("/api/admin/tgh/attendance/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const attendance = await storage.updateTechGoesHomeAttendance(id, updates);
      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      res.json(attendance);
    } catch (error) {
      console.error("Error updating attendance:", error);
      res.status(500).json({ message: "Failed to update attendance", error: error.message });
    }
  });
  app2.delete("/api/admin/tgh/attendance/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTechGoesHomeAttendance(id);
      res.json({ message: "Attendance record deleted successfully" });
    } catch (error) {
      console.error("Error deleting attendance:", error);
      res.status(500).json({ message: "Failed to delete attendance" });
    }
  });
  app2.get("/api/volunteer/events", async (req, res) => {
    try {
      const events = await storage.getActiveVolunteerEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching volunteer events:", error);
      res.status(500).json({ message: "Failed to fetch volunteer events" });
    }
  });
  app2.get("/api/volunteer/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const event = await storage.getVolunteerEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      const shifts = await storage.getEventShifts(id);
      res.json({ event, shifts });
    } catch (error) {
      console.error("Error fetching volunteer event:", error);
      res.status(500).json({ message: "Failed to fetch volunteer event" });
    }
  });
  app2.get("/api/volunteer/my-enrollments", ...authWithImpersonation, async (req, res) => {
    try {
      const oidcSub = req.user?.claims?.sub;
      if (!oidcSub) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUserByOidcSub(oidcSub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const enrollments = await storage.getUserEnrollments(user.id);
      const hours = await storage.getUserVolunteerHours(user.id);
      res.json({ enrollments, hours });
    } catch (error) {
      console.error("Error fetching user enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  app2.post("/api/volunteer/enroll", ...authWithImpersonation, async (req, res) => {
    try {
      const oidcSub = req.user?.claims?.sub;
      if (!oidcSub) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUserByOidcSub(oidcSub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { insertVolunteerEnrollmentSchema: insertVolunteerEnrollmentSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const enrollmentData = insertVolunteerEnrollmentSchema2.parse({
        ...req.body,
        userId: user.id
      });
      const enrollment = await storage.createVolunteerEnrollment(enrollmentData);
      try {
        let lead = user.email ? await storage.getLeadByEmail(user.email) : null;
        if (!lead && user.email) {
          const leadData = {
            email: user.email,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Volunteer",
            persona: "volunteer",
            funnelStage: "awareness",
            source: "volunteer_enrollment"
          };
          lead = await storage.createLead(leadData);
        }
        if (lead) {
          await evaluateLeadProgression(lead.id, "volunteer_enrolled", user.id);
        }
      } catch (progressionError) {
        console.error("Error triggering funnel progression for volunteer enrollment:", progressionError);
      }
      res.json(enrollment);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to create enrollment", error: error.message });
    }
  });
  app2.get("/api/admin/volunteer/events", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const events = await storage.getAllVolunteerEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  app2.post("/api/admin/volunteer/events", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { insertVolunteerEventSchema: insertVolunteerEventSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const eventData = insertVolunteerEventSchema2.parse({
        ...req.body,
        createdBy: req.user.id
      });
      const event = await storage.createVolunteerEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event", error: error.message });
    }
  });
  app2.patch("/api/admin/volunteer/events/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const event = await storage.updateVolunteerEvent(id, updates);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event", error: error.message });
    }
  });
  app2.delete("/api/admin/volunteer/events/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteVolunteerEvent(id);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });
  app2.post("/api/admin/volunteer/shifts", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { insertVolunteerShiftSchema: insertVolunteerShiftSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const shiftData = insertVolunteerShiftSchema2.parse(req.body);
      const shift = await storage.createVolunteerShift(shiftData);
      res.json(shift);
    } catch (error) {
      console.error("Error creating shift:", error);
      res.status(500).json({ message: "Failed to create shift", error: error.message });
    }
  });
  app2.patch("/api/admin/volunteer/shifts/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const shift = await storage.updateVolunteerShift(id, updates);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      res.json(shift);
    } catch (error) {
      console.error("Error updating shift:", error);
      res.status(500).json({ message: "Failed to update shift", error: error.message });
    }
  });
  app2.delete("/api/admin/volunteer/shifts/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteVolunteerShift(id);
      res.json({ message: "Shift deleted successfully" });
    } catch (error) {
      console.error("Error deleting shift:", error);
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });
  app2.get("/api/admin/volunteer/enrollments", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { shiftId } = req.query;
      let enrollments;
      if (shiftId) {
        enrollments = await storage.getShiftEnrollments(shiftId);
      } else {
        enrollments = [];
      }
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  app2.patch("/api/admin/volunteer/enrollments/:id", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const enrollment = await storage.updateVolunteerEnrollment(id, updates);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      res.json(enrollment);
    } catch (error) {
      console.error("Error updating enrollment:", error);
      res.status(500).json({ message: "Failed to update enrollment", error: error.message });
    }
  });
  app2.post("/api/admin/volunteer/sessions", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { insertVolunteerSessionLogSchema: insertVolunteerSessionLogSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const sessionData = insertVolunteerSessionLogSchema2.parse({
        ...req.body,
        loggedBy: req.user.id
      });
      const session2 = await storage.createVolunteerSessionLog(sessionData);
      res.json(session2);
    } catch (error) {
      console.error("Error creating session log:", error);
      res.status(500).json({ message: "Failed to create session log", error: error.message });
    }
  });
  app2.get("/api/admin/volunteer/sessions/:enrollmentId", ...authWithImpersonation, isAdmin, requireTier(TIERS.PRO), async (req, res) => {
    try {
      const { enrollmentId } = req.params;
      const sessions2 = await storage.getEnrollmentSessions(enrollmentId);
      res.json(sessions2);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });
  app2.post("/api/demo/seed", async (req, res) => {
    try {
      const { clearExisting = true } = req.body;
      const result = await seedDemoData(clearExisting);
      res.json(result);
    } catch (error) {
      console.error("Error seeding demo data:", error);
      res.status(500).json({
        message: error.message || "Failed to seed demo data",
        error: error.toString()
      });
    }
  });
  app2.post("/api/admin/funnel/seed-rules", ...authWithImpersonation, isAdmin, requireTier(TIERS.PREMIUM), async (req, res) => {
    try {
      const { clearExisting = false } = req.body;
      const result = await seedFunnelProgressionRules(clearExisting);
      res.json(result);
    } catch (error) {
      console.error("Error seeding funnel progression rules:", error);
      res.status(500).json({
        message: error.message || "Failed to seed funnel progression rules",
        error: error.toString()
      });
    }
  });
  const verifyCronSecret = (req, res, next) => {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      res.status(500).json({ message: "CRON_SECRET not configured" });
      return;
    }
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${secret}`) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    next();
  };
  app2.post("/api/cron/backup", verifyCronSecret, async (_req, res) => {
    try {
      const { poll: backupPoll } = await Promise.resolve().then(() => (init_backupScheduler(), backupScheduler_exports));
      await backupPoll();
      res.json({ ok: true });
    } catch (error) {
      console.error("[Cron] backup error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/cron/donor-lifecycle", verifyCronSecret, async (_req, res) => {
    try {
      const { triggerLapsedDonorDetection: triggerLapsedDonorDetection2 } = await Promise.resolve().then(() => (init_donorLifecycleScheduler(), donorLifecycleScheduler_exports));
      const count3 = await triggerLapsedDonorDetection2();
      res.json({ ok: true, lapsedCount: count3 });
    } catch (error) {
      console.error("[Cron] donor-lifecycle error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/cron/email-reports", verifyCronSecret, async (_req, res) => {
    try {
      const { poll: emailPoll } = await Promise.resolve().then(() => (init_emailReportScheduler(), emailReportScheduler_exports));
      await emailPoll();
      res.json({ ok: true });
    } catch (error) {
      console.error("[Cron] email-reports error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
var stripe, requireRole, requireAdmin, requireSuperAdmin, isAdmin, authWithImpersonation;
var init_routes = __esm({
  "server/routes.ts"() {
    "use strict";
    init_storage();
    init_db();
    init_replitAuth();
    init_impersonationMiddleware();
    init_tierMiddleware();
    init_tiers();
    init_schema();
    init_cacLtgpAnalytics();
    init_adminEntitlementService();
    init_security();
    init_funnelProgressionService();
    init_schema();
    init_objectStorage();
    init_objectAcl();
    init_cloudinary();
    init_gemini();
    init_email();
    init_copywriter();
    init_taskAutomation();
    init_calendarService();
    init_demo_data();
    init_googleSheets();
    stripe = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_...") ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-10-29.clover" }) : null;
    requireRole = (...allowedRoles) => {
      return async (req, res, next) => {
        try {
          const userToCheck = req.isImpersonating ? req.adminUser : req.user;
          const oidcSub = userToCheck?.claims?.sub;
          console.log("[requireRole] Checking role access for oidcSub:", oidcSub, "allowed roles:", allowedRoles, "impersonating:", req.isImpersonating);
          if (!oidcSub) {
            console.log("[requireRole] No oidcSub found - returning 401");
            return res.status(401).json({ message: "Unauthorized" });
          }
          const user = await storage.getUserByOidcSub(oidcSub);
          console.log("[requireRole] Found user:", user ? { id: user.id, email: user.email, role: user.role } : null);
          if (!user) {
            console.log("[requireRole] User not found - returning 401");
            return res.status(401).json({ message: "Unauthorized" });
          }
          if (!allowedRoles.includes(user.role)) {
            console.log("[requireRole] User role not allowed - returning 403");
            return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
          }
          console.log("[requireRole] Role check passed");
          next();
        } catch (error) {
          console.error("Role auth error:", error);
          res.status(500).json({ message: "Authorization check failed" });
        }
      };
    };
    requireAdmin = requireRole("admin", "super_admin");
    requireSuperAdmin = requireRole("super_admin");
    isAdmin = requireAdmin;
    authWithImpersonation = [isAuthenticated, applyImpersonation];
  }
});

// server/vercel-entry.ts
var ready = null;
var initError = null;
function ensureReady() {
  if (!ready) {
    ready = (async () => {
      try {
        const { app: appInstance } = await Promise.resolve().then(() => (init_app(), app_exports));
        const { registerRoutes: registerRoutes2 } = await Promise.resolve().then(() => (init_routes(), routes_exports));
        await registerRoutes2(appInstance);
        appInstance.use((err, req, res, _next) => {
          const status = err.status || err.statusCode || 500;
          const message = err.message || "Internal Server Error";
          const clientMessage = status === 500 ? "Internal Server Error" : message;
          res.status(status).json({ message: clientMessage });
        });
        globalThis.__vercelApp = appInstance;
      } catch (e) {
        initError = e;
        console.error("[vercel-entry] INIT FAILED:", e?.message, e?.stack);
        throw e;
      }
    })();
  }
  return ready;
}
async function handler(req, res) {
  try {
    await ensureReady();
    const appInstance = globalThis.__vercelApp;
    appInstance(req, res);
  } catch (e) {
    console.error("[vercel-entry] HANDLER ERROR:", e?.message, e?.stack);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Function initialization failed",
      message: e?.message,
      stack: e?.stack?.substring(0, 2e3)
    }));
  }
}
export {
  handler as default
};
