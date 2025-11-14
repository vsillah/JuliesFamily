import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, boolean, integer, uniqueIndex, numeric, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
// Reference: blueprint:javascript_log_in_with_replit
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User role enum for RBAC
export const userRoleEnum = z.enum(['client', 'admin', 'super_admin']);
export type UserRole = z.infer<typeof userRoleEnum>;

// User storage table for Replit Auth
// Reference: blueprint:javascript_log_in_with_replit
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  oidcSub: varchar("oidc_sub").unique(), // OIDC subject identifier
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  persona: varchar("persona"), // Stored persona preference: student, provider, parent, donor, volunteer
  passions: jsonb("passions"), // Array of passion tags: ['literacy', 'stem', 'arts', 'nutrition', 'community']
  role: varchar("role").notNull().default('client'), // client, admin, super_admin
  isAdmin: boolean("is_admin").default(false), // DEPRECATED: Use role instead. Kept for backward compatibility during migration.
  stripeCustomerId: varchar("stripe_customer_id").unique(), // Stripe Customer ID for saved payment methods
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Profile update schema - for authenticated users updating their own profile
// Restricted to safe fields only (no role, email, or id changes)
export const updateUserProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  profileImageUrl: z.union([
    z.string().url(), // Full URLs like https://...
    z.string().regex(/^\/objects\/[a-zA-Z0-9/_-]+(\.[a-zA-Z0-9]+)?$/, "Invalid storage path"), // Safe storage paths only: /objects/...
    z.literal("") // Empty string
  ]).optional().nullable(),
  persona: z.enum(['student', 'provider', 'parent', 'donor', 'volunteer']).optional().nullable(),
  passions: z.array(z.enum(['literacy', 'stem', 'arts', 'nutrition', 'community'])).optional().nullable(),
}).strict(); // Reject unknown fields

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

// Admin Preferences - stores admin user preferences for notifications, workflow, interface, and communication
export const adminPreferences = pgTable("admin_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // Notification Preferences
  newLeadAlerts: boolean("new_lead_alerts").default(true),
  taskAssignmentAlerts: boolean("task_assignment_alerts").default(true),
  taskCompletionAlerts: boolean("task_completion_alerts").default(true),
  donationAlerts: boolean("donation_alerts").default(true),
  emailCampaignAlerts: boolean("email_campaign_alerts").default(false),
  calendarEventReminders: boolean("calendar_event_reminders").default(true),
  notificationChannels: jsonb("notification_channels").default(['email']), // email, sms, in-app
  
  // Workflow Preferences
  autoAssignNewLeads: boolean("auto_assign_new_leads").default(false),
  defaultTaskDueDateOffset: integer("default_task_due_date_offset").default(3), // days
  defaultLeadSource: varchar("default_lead_source"),
  defaultLeadStatus: varchar("default_lead_status").default('new_lead'),
  preferredPipelineView: varchar("preferred_pipeline_view").default('kanban'), // kanban, list, table
  
  // Interface Preferences
  defaultLandingPage: varchar("default_landing_page").default('/admin'),
  theme: varchar("theme").default('system'), // light, dark, system
  itemsPerPage: integer("items_per_page").default(25),
  dataDensity: varchar("data_density").default('comfortable'), // compact, comfortable, spacious
  defaultContentFilter: varchar("default_content_filter").default('all'), // all, or specific persona
  
  // Communication Preferences
  dailyDigestEnabled: boolean("daily_digest_enabled").default(false),
  weeklyReportEnabled: boolean("weekly_report_enabled").default(true),
  criticalAlertsOnly: boolean("critical_alerts_only").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminPreferencesSchema = createInsertSchema(adminPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAdminPreferences = z.infer<typeof insertAdminPreferencesSchema>;
export type AdminPreferences = typeof adminPreferences.$inferSelect;

// Audit Logs - tracks role changes and permission modifications
// IMPORTANT: Foreign keys use SET NULL to preserve audit trail even after user deletion
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // User who was affected (nullable to preserve audit trail)
  actorId: varchar("actor_id").references(() => users.id, { onDelete: "set null" }), // User who performed the action (nullable to preserve audit trail)
  action: varchar("action").notNull(), // role_changed, user_created, user_deleted
  previousRole: varchar("previous_role"), // For role changes
  newRole: varchar("new_role"), // For role changes
  metadata: jsonb("metadata"), // Additional context (emails, names, timestamps - preserved even after user deletion)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("audit_logs_user_id_idx").on(table.userId),
  index("audit_logs_actor_id_idx").on(table.actorId),
  index("audit_logs_created_at_idx").on(table.createdAt),
]);

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// CRM Leads table
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  persona: varchar("persona").notNull(), // student, provider, parent, donor, volunteer
  funnelStage: varchar("funnel_stage").notNull(), // awareness, consideration, decision, retention
  leadStatus: varchar("lead_status").notNull().default('active'), // active, nurture, disqualified, unresponsive - tracks engagement level
  pipelineStage: varchar("pipeline_stage").default('new_lead'), // References pipeline stages: new_lead, contacted, qualified, etc.
  leadSource: varchar("lead_source"), // organic, referral, ad, etc
  engagementScore: integer("engagement_score").default(0),
  lastInteractionDate: timestamp("last_interaction_date"),
  lastFunnelUpdateAt: timestamp("last_funnel_update_at"), // Tracks when funnel stage was last evaluated/changed
  convertedAt: timestamp("converted_at"),
  notes: text("notes"),
  passions: jsonb("passions"), // Array of passion tags for donor targeting: ['literacy', 'stem', 'arts', 'nutrition', 'community']
  metadata: jsonb("metadata"), // Additional data like quiz answers, form submissions
  
  // Lead Sourcing & Qualification Fields
  company: varchar("company"), // Company/organization name
  jobTitle: varchar("job_title"), // Job title/role
  linkedinUrl: varchar("linkedin_url"), // LinkedIn profile URL
  qualificationScore: integer("qualification_score"), // AI-generated score 0-100
  qualificationStatus: varchar("qualification_status").default('pending'), // pending, qualified, disqualified, review_needed
  qualificationInsights: text("qualification_insights"), // AI-generated analysis of ICP fit
  enrichmentData: jsonb("enrichment_data"), // Company info, news, context, about, website, etc.
  outreachStatus: varchar("outreach_status").default('pending'), // pending, draft_ready, sent, opened, replied, bounced, unsubscribed
  lastOutreachAt: timestamp("last_outreach_at"), // Last time outreach was sent
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Lead status enum for type safety
export const leadStatusEnum = z.enum(['active', 'nurture', 'disqualified', 'unresponsive']);
export type LeadStatus = z.infer<typeof leadStatusEnum>;

// Update schema for leads - strict field whitelisting with partial updates allowed
export const updateLeadSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  phone: z.string(),
  persona: z.enum(['student', 'provider', 'parent', 'donor', 'volunteer']),
  funnelStage: z.enum(['awareness', 'consideration', 'decision', 'retention']),
  leadStatus: leadStatusEnum,
  pipelineStage: z.string(),
  leadSource: z.string(),
  engagementScore: z.number().int().min(0),
  lastInteractionDate: z.union([z.date(), z.string().transform((val) => new Date(val))]),
  lastFunnelUpdateAt: z.union([z.date(), z.string().transform((val) => new Date(val))]),
  convertedAt: z.union([z.date(), z.string().transform((val) => new Date(val))]),
  notes: z.string(),
  passions: z.any(), // JSONB
  metadata: z.any(), // JSONB
  company: z.string(),
  jobTitle: z.string(),
  linkedinUrl: z.string().url(),
  qualificationScore: z.number().int().min(0).max(100),
  qualificationStatus: z.enum(['pending', 'qualified', 'disqualified', 'review_needed']),
  qualificationInsights: z.string(),
  enrichmentData: z.any(), // JSONB
  outreachStatus: z.enum(['pending', 'draft_ready', 'sent', 'opened', 'replied', 'bounced', 'unsubscribed']),
  lastOutreachAt: z.union([z.date(), z.string().transform((val) => new Date(val))]),
}).strict().partial();
export type UpdateLead = z.infer<typeof updateLeadSchema>;

// Interactions table for tracking all lead activities
export const interactions = pgTable("interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  interactionType: varchar("interaction_type").notNull(), // quiz, download, form_submit, call_scheduled, etc
  contentEngaged: varchar("content_engaged"), // Name of the lead magnet or content
  notes: text("notes"), // Optional notes about the interaction
  data: jsonb("data"), // Quiz answers, form data, etc
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true,
});
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactions.$inferSelect;

// Pipeline Stages - defines the stages leads move through in the sales pipeline
export const pipelineStages = pgTable("pipeline_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // New Lead, Contacted, Qualified, Nurturing, Converted, Lost
  slug: varchar("slug").notNull().unique(), // new_lead, contacted, qualified, etc. - canonical identifier for pipelineStage field
  description: text("description"),
  position: integer("position").notNull(), // Order of stages (1, 2, 3, etc.)
  color: varchar("color"), // UI color for kanban board
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPipelineStageSchema = createInsertSchema(pipelineStages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;
export type PipelineStage = typeof pipelineStages.$inferSelect;

// Lead Assignments - tracks which team member is assigned to each lead
export const leadAssignments = pgTable("lead_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  assignedTo: varchar("assigned_to").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedBy: varchar("assigned_by").references(() => users.id), // Who made the assignment
  assignmentType: varchar("assignment_type").notNull(), // 'manual', 'auto_persona', 'auto_geography', 'auto_round_robin'
  notes: text("notes"), // Reason for assignment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeadAssignmentSchema = createInsertSchema(leadAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLeadAssignment = z.infer<typeof insertLeadAssignmentSchema>;
export type LeadAssignment = typeof leadAssignments.$inferSelect;

// Tasks - follow-up tasks for leads
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  assignedTo: varchar("assigned_to").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdBy: varchar("created_by").references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  taskType: varchar("task_type").notNull(), // 'call', 'email', 'meeting', 'follow_up', 'send_materials', 'other'
  priority: varchar("priority").notNull().default('medium'), // 'low', 'medium', 'high', 'urgent'
  status: varchar("status").notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'cancelled'
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  isAutomated: boolean("is_automated").default(false), // True if auto-created by trigger
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("tasks_assigned_to_idx").on(table.assignedTo),
  index("tasks_lead_id_idx").on(table.leadId),
  index("tasks_status_idx").on(table.status),
]);

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Pipeline History - tracks when leads move between pipeline stages
export const pipelineHistory = pgTable("pipeline_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  fromStage: varchar("from_stage"), // Null for first entry
  toStage: varchar("to_stage").notNull(),
  changedBy: varchar("changed_by").references(() => users.id), // Null if automated
  reason: text("reason"), // Optional reason for stage change
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("pipeline_history_lead_id_idx").on(table.leadId),
]);

export const insertPipelineHistorySchema = createInsertSchema(pipelineHistory).omit({
  id: true,
  createdAt: true,
});
export type InsertPipelineHistory = z.infer<typeof insertPipelineHistorySchema>;
export type PipelineHistory = typeof pipelineHistory.$inferSelect;

// Funnel Progression Rules - defines thresholds for automatic funnel stage advancement
export const funnelProgressionRules = pgTable("funnel_progression_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  persona: varchar("persona").notNull(), // student, provider, parent, donor, volunteer
  fromStage: varchar("from_stage").notNull(), // awareness, consideration, decision
  toStage: varchar("to_stage").notNull(), // consideration, decision, retention
  
  // Threshold settings for progression
  engagementScoreThreshold: integer("engagement_score_threshold").notNull(), // Min engagement points to advance
  minimumDaysInStage: integer("minimum_days_in_stage").default(0), // Prevent premature advancement
  
  // Optional: High-value events that trigger instant progression (bypassing threshold)
  autoProgressEvents: jsonb("auto_progress_events"), // Array like ['donation_completed', 'enrollment_submitted']
  
  // Decay/regression rules for inactive leads
  inactivityDaysThreshold: integer("inactivity_days_threshold"), // Days without interaction before regression
  decayToStage: varchar("decay_to_stage"), // Stage to regress to on inactivity (null = no decay)
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("funnel_rules_persona_idx").on(table.persona),
  index("funnel_rules_transition_idx").on(table.fromStage, table.toStage),
  // Prevent duplicate rules for same persona+transition
  uniqueIndex("funnel_rules_unique_transition").on(table.persona, table.fromStage, table.toStage),
]);

export const insertFunnelProgressionRuleSchema = createInsertSchema(funnelProgressionRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFunnelProgressionRule = z.infer<typeof insertFunnelProgressionRuleSchema>;
export type FunnelProgressionRule = typeof funnelProgressionRules.$inferSelect;

// Funnel Progression History - audit log of funnel stage changes
export const funnelProgressionHistory = pgTable("funnel_progression_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  fromStage: varchar("from_stage"), // Null for initial stage assignment
  toStage: varchar("to_stage").notNull(),
  
  // Context about the progression
  reason: varchar("reason").notNull(), // 'threshold_met', 'manual_override', 'high_value_event', 'inactivity_decay'
  triggeredBy: varchar("triggered_by").references(() => users.id), // User ID if manual override, null if automated
  engagementScoreAtChange: integer("engagement_score_at_change"), // Engagement score when change occurred
  triggerEvent: varchar("trigger_event"), // Specific interaction/event that caused progression
  
  metadata: jsonb("metadata"), // Additional context (rule applied, threshold details, etc.)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("funnel_history_lead_id_idx").on(table.leadId),
  index("funnel_history_created_at_idx").on(table.createdAt),
  index("funnel_history_reason_idx").on(table.reason),
]);

export const insertFunnelProgressionHistorySchema = createInsertSchema(funnelProgressionHistory).omit({
  id: true,
  createdAt: true,
});
export type InsertFunnelProgressionHistory = z.infer<typeof insertFunnelProgressionHistorySchema>;
export type FunnelProgressionHistory = typeof funnelProgressionHistory.$inferSelect;

// Lead Magnets table for managing content offers
export const leadMagnets = pgTable("lead_magnets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // quiz, calculator, pdf, webinar, assessment
  persona: varchar("persona").notNull(), // Which persona this is for
  funnelStage: varchar("funnel_stage").notNull(), // Which stage of funnel
  description: text("description"),
  config: jsonb("config"), // Quiz questions, calculator fields, etc
  conversionRate: integer("conversion_rate").default(0), // Percentage
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeadMagnetSchema = createInsertSchema(leadMagnets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLeadMagnet = z.infer<typeof insertLeadMagnetSchema>;
export type LeadMagnet = typeof leadMagnets.$inferSelect;

// Image Assets table for managing Cloudinary uploads
export const imageAssets = pgTable("image_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // Descriptive name (e.g., "Hero Background - Students")
  originalFilename: varchar("original_filename"), // Original file name from upload
  localPath: varchar("local_path"), // Original local path (e.g., @assets/...)
  cloudinaryPublicId: varchar("cloudinary_public_id").notNull().unique(), // Cloudinary identifier
  cloudinaryUrl: varchar("cloudinary_url").notNull(), // Full Cloudinary URL
  cloudinarySecureUrl: varchar("cloudinary_secure_url").notNull(), // HTTPS URL
  width: integer("width"), // Original width
  height: integer("height"), // Original height
  format: varchar("format"), // Image format (jpg, png, webp, etc)
  fileSize: integer("file_size"), // File size in bytes
  usage: varchar("usage"), // Where it's used (hero, service, event, testimonial, logo, etc)
  isActive: boolean("is_active").default(true),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("image_assets_name_idx").on(table.name), // Index for content_items join performance
]);

export const insertImageAssetSchema = createInsertSchema(imageAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertImageAsset = z.infer<typeof insertImageAssetSchema>;
export type ImageAsset = typeof imageAssets.$inferSelect;

// Content Items table for managing editable cards across the site
export const contentItems = pgTable("content_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // 'service', 'event', 'testimonial', 'sponsor', 'lead_magnet', 'impact_stat', 'hero', 'cta', 'socialMedia', 'video', 'review', 'program_detail', 'student_project', 'student_testimonial', 'student_dashboard_card', 'volunteer_dashboard_card'
  title: text("title").notNull(),
  description: text("description"),
  imageName: varchar("image_name"), // Cloudinary image name (legacy)
  imageUrl: varchar("image_url"), // Object Storage path (new AI-powered naming)
  order: integer("order").notNull().default(0), // Display order
  isActive: boolean("is_active").default(true),
  passionTags: text("passion_tags").array(), // Array of passion tags for targeting (e.g., ['literacy', 'stem', 'arts'])
  metadata: jsonb("metadata"), // Additional data: For service: number, priority, linkedProgramDetailId. For program_detail: programId, overview, ageRange, schedule, location, cost, features, enrollmentSteps, faqs, defaultPersona. For event/testimonial: location, date, rating, icon. For socialMedia/video: videoId, category, platform. For student_project/student_testimonial: submittingUserId, submittingUserEmail, submittingUserName, programId, classId, files: [{url, alt, uploadedAt}], status: 'pending'|'approved'|'rejected', reviewedBy, reviewedAt, rejectionReason. For student_dashboard_card: buttonText, buttonLink, goalText, motivationalText. For volunteer_dashboard_card: buttonText, buttonLink, goalText, motivationalText
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  passionTagsIdx: index("content_items_passion_tags_idx").using("gin", table.passionTags),
}));

export const insertContentItemSchema = createInsertSchema(contentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;
export type ContentItem = typeof contentItems.$inferSelect;

// Update schema for content items - whitelisted fields only
export const updateContentItemSchema = z.object({
  type: z.enum(['service', 'event', 'testimonial', 'sponsor', 'lead_magnet', 'impact_stat', 'hero', 'cta', 'socialMedia', 'video', 'review', 'program_detail', 'student_project', 'student_testimonial', 'student_dashboard_card', 'volunteer_dashboard_card']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  imageName: z.string().optional(),
  imageUrl: z.string().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  passionTags: z.array(z.string()).optional(),
  metadata: z.any().optional(), // JSONB
}).strict();
export type UpdateContentItem = z.infer<typeof updateContentItemSchema>;

// Student submission schema - for students to submit projects and testimonials
export const insertStudentSubmissionSchema = z.object({
  type: z.enum(['student_project', 'student_testimonial']),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  passionTags: z.array(z.enum(['literacy', 'stem', 'arts', 'nutrition', 'community'])).min(1, "Select at least one passion"),
  files: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
    uploadedAt: z.string().optional(),
  })).optional(),
});
export type InsertStudentSubmission = z.infer<typeof insertStudentSubmissionSchema>;

// Student dashboard card metadata schema
export const studentDashboardCardMetadataSchema = z.object({
  buttonText: z.string().min(1, "Button text is required").default("View My Dashboard"),
  buttonLink: z.string().min(1, "Button link is required").default("/dashboard"),
  goalText: z.string().optional(), // Optional override for "Goal: 15+ hours"
  motivationalText: z.string().optional(), // Optional override for motivational messages
}).strict();
export type StudentDashboardCardMetadata = z.infer<typeof studentDashboardCardMetadataSchema>;

// Volunteer dashboard card metadata schema
export const volunteerDashboardCardMetadataSchema = z.object({
  buttonText: z.string().min(1, "Button text is required").default("View My Volunteer Dashboard"),
  buttonLink: z.string().min(1, "Button link is required").default("/volunteer"),
  goalText: z.string().optional(), // Optional override for "Goal: 20+ hours this quarter"
  motivationalText: z.string().optional(), // Optional override for motivational messages
}).strict();
export type VolunteerDashboardCardMetadata = z.infer<typeof volunteerDashboardCardMetadataSchema>;

// Service metadata schema
export const serviceMetadataSchema = z.object({
  number: z.string().optional(),
  priority: z.record(z.number()).optional(), // { parent: 1, student: 2, ... }
  linkedProgramDetailId: z.string().optional(), // Reference to a program_detail content item
}).passthrough(); // Allow additional fields
export type ServiceMetadata = z.infer<typeof serviceMetadataSchema>;

// Program detail metadata schema
export const programDetailMetadataSchema = z.object({
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
    answer: z.string(),
  })).optional(),
  defaultPersona: z.enum(['student', 'provider', 'parent', 'donor', 'volunteer']).optional(),
}).passthrough(); // Allow additional fields
export type ProgramDetailMetadata = z.infer<typeof programDetailMetadataSchema>;

// Extended ContentItem type with resolved image URL from image_assets join
export type ContentItemWithResolvedImage = ContentItem & {
  resolvedImageUrl?: string | null;
};

// Persona-specific visibility and ordering for content items
export const contentVisibility = pgTable("content_visibility", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentItemId: varchar("content_item_id").notNull().references(() => contentItems.id, { onDelete: "cascade" }),
  persona: varchar("persona"), // null = applies to all personas
  funnelStage: varchar("funnel_stage"), // null = applies to all funnel stages
  isVisible: boolean("is_visible").default(true),
  order: integer("order").notNull().default(0), // Persona-specific ordering
  titleOverride: text("title_override"), // Custom title for this persona×stage combo
  descriptionOverride: text("description_override"), // Custom description for this persona×stage combo
  imageNameOverride: varchar("image_name_override"), // Custom image for this persona×stage combo
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("content_visibility_unique_idx").on(table.contentItemId, table.persona, table.funnelStage),
]);

export const insertContentVisibilitySchema = createInsertSchema(contentVisibility).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertContentVisibility = z.infer<typeof insertContentVisibilitySchema>;
export type ContentVisibility = typeof contentVisibility.$inferSelect;

// ==================== AUTOMATED A/B TESTING SYSTEM (FOUNDATION TABLES) ====================
// NOTE: These must be defined BEFORE ab_tests and ab_test_variants which reference them

// Metric Weight Profiles - Define how different metrics contribute to overall performance score
export const metricWeightProfiles = pgTable("metric_weight_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // 'hero_default', 'cta_donor_focused', 'card_engagement'
  contentType: varchar("content_type"), // Optional: 'hero', 'cta', 'card_order', 'layout', 'messaging' (null = general-purpose)
  persona: varchar("persona"), // Optional: specific persona optimization (null = all personas)
  description: text("description"),
  clickThroughWeight: integer("click_through_weight").notNull().default(30), // Percentage: 0-100
  engagementWeight: integer("engagement_weight").notNull().default(40), // Percentage: 0-100
  conversionWeight: integer("conversion_weight").notNull().default(30), // Percentage: 0-100
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("metric_profiles_content_type_idx").on(table.contentType),
  index("metric_profiles_persona_idx").on(table.persona),
]);

export const insertMetricWeightProfileSchema = createInsertSchema(metricWeightProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMetricWeightProfile = z.infer<typeof insertMetricWeightProfileSchema>;
export type MetricWeightProfile = typeof metricWeightProfiles.$inferSelect;

// Metric Weight Profile Metrics - Individual metric configurations within a profile
export const metricWeightProfileMetrics = pgTable("metric_weight_profile_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => metricWeightProfiles.id, { onDelete: "cascade" }),
  metricKey: varchar("metric_key").notNull(), // 'page_view', 'cta_click', 'dwell_time', 'scroll_depth', 'conversion'
  weight: integer("weight").notNull().default(100), // 0-1000 (multiply by 0.001 for percentage)
  direction: varchar("direction").notNull().default('maximize'), // 'maximize' or 'minimize'
  minimumSample: integer("minimum_sample").default(30), // Minimum events before metric is considered
  maximumCap: integer("maximum_cap"), // Optional ceiling for outlier protection
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("metric_weight_profile_metrics_unique_idx").on(table.profileId, table.metricKey),
]);

export const insertMetricWeightProfileMetricSchema = createInsertSchema(metricWeightProfileMetrics).omit({
  id: true,
  createdAt: true,
});
export type InsertMetricWeightProfileMetric = z.infer<typeof insertMetricWeightProfileMetricSchema>;
export type MetricWeightProfileMetric = typeof metricWeightProfileMetrics.$inferSelect;

// A/B Test Automation Rules - Define when and how to automatically create tests
export const abTestAutomationRules = pgTable("ab_test_automation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  
  // Scope configuration
  contentType: varchar("content_type").notNull(), // Which content type to optimize
  targetPersona: varchar("target_persona"), // Optional: null = all personas
  targetFunnelStage: varchar("target_funnel_stage"), // Optional: null = all stages
  
  // Trigger strategy
  triggerType: varchar("trigger_type").notNull().default('threshold'), // 'threshold', 'scheduled', 'manual'
  evaluationCadence: varchar("evaluation_cadence").default('daily'), // 'hourly', 'daily', 'weekly'
  
  // Performance thresholds for triggering new tests
  minimumBaselineSample: integer("minimum_baseline_sample").default(100), // Min views before evaluation
  performanceThresholdType: varchar("performance_threshold_type").default('percentile'), // 'percentile', 'absolute'
  performanceThresholdValue: integer("performance_threshold_value").default(25), // Bottom 25th percentile triggers test
  
  // AI generation settings
  aiProvider: varchar("ai_provider").default('gemini'), // 'gemini', 'openai' (future)
  aiModel: varchar("ai_model").default('gemini-2.0-flash-exp'),
  aiTemperature: integer("ai_temperature").default(70), // 0-100 (multiply by 0.01)
  variantsToGenerate: integer("variants_to_generate").default(2), // How many AI variants per test
  requiresManualApproval: boolean("requires_manual_approval").default(false), // Queue for review before launching
  
  // Safety limits
  maxConcurrentTests: integer("max_concurrent_tests").default(3), // Max simultaneous tests per rule
  cooldownPeriod: integer("cooldown_period").default(7), // Days between tests for same content
  
  // Statistical configuration
  minimumTestSample: integer("minimum_test_sample").default(100), // Min samples per variant for promotion
  confidenceThreshold: integer("confidence_threshold").default(95), // 95% confidence for winner
  minimumTestDuration: integer("minimum_test_duration").default(3), // Min days before promotion allowed
  
  // Status
  isActive: boolean("is_active").default(true),
  lastRunAt: timestamp("last_run_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ab_automation_rules_content_type_idx").on(table.contentType),
  index("ab_automation_rules_active_idx").on(table.isActive),
  index("ab_automation_rules_next_run_idx").on(table.lastRunAt),
]);

export const insertAbTestAutomationRuleSchema = createInsertSchema(abTestAutomationRules).omit({
  id: true,
  lastRunAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAbTestAutomationRule = z.infer<typeof insertAbTestAutomationRuleSchema>;
export type AbTestAutomationRule = typeof abTestAutomationRules.$inferSelect;

// A/B Test Automation Rule Metrics - Metric-specific configuration for automation rules
export const abTestAutomationRuleMetrics = pgTable("ab_test_automation_rule_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleId: varchar("rule_id").notNull().references(() => abTestAutomationRules.id, { onDelete: "cascade" }),
  metricKey: varchar("metric_key").notNull(), // 'cta_click', 'conversion', 'dwell_time', etc
  weight: integer("weight").notNull(), // Override default profile weight if needed
  direction: varchar("direction").notNull().default('maximize'),
  thresholdType: varchar("threshold_type").notNull(), // 'percentile', 'absolute', 'change_rate'
  thresholdValue: numeric("threshold_value").notNull(), // Supports decimals: 25.5 for 25.5th percentile, 0.15 for 15% uplift
  minimumSample: integer("minimum_sample").default(30),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("ab_automation_rule_metrics_unique_idx").on(table.ruleId, table.metricKey),
]);

export const insertAbTestAutomationRuleMetricSchema = createInsertSchema(abTestAutomationRuleMetrics).omit({
  id: true,
  createdAt: true,
});
export type InsertAbTestAutomationRuleMetric = z.infer<typeof insertAbTestAutomationRuleMetricSchema>;
export type AbTestAutomationRuleMetric = typeof abTestAutomationRuleMetrics.$inferSelect;

// A/B Test Performance Baselines - Rolling performance data for content
export const abTestPerformanceBaselines = pgTable("ab_test_performance_baselines", {
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
  compositeScore: integer("composite_score"), // Weighted score (0-10000)
  
  // Metric breakdown (JSONB for flexibility)
  metricBreakdown: jsonb("metric_breakdown"), // { "cta_click": 50.5, "dwell_time": 120.3, "scroll_depth": 75.2 }
  
  // Statistical data
  sampleSize: integer("sample_size").notNull(),
  variance: doublePrecision("variance"), // Statistical variance for significance testing
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("baselines_content_window_unique_idx").on(table.contentType, table.contentItemId, table.persona, table.funnelStage, table.windowStart),
  index("baselines_content_item_idx").on(table.contentItemId),
  index("baselines_persona_funnel_idx").on(table.persona, table.funnelStage),
  index("baselines_window_idx").on(table.windowStart, table.windowEnd),
  index("baselines_content_type_idx").on(table.contentType),
]);

export const insertAbTestPerformanceBaselineSchema = createInsertSchema(abTestPerformanceBaselines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAbTestPerformanceBaseline = z.infer<typeof insertAbTestPerformanceBaselineSchema>;
export type AbTestPerformanceBaseline = typeof abTestPerformanceBaselines.$inferSelect;

// A/B Test Variant AI Generations - Track AI-generated content metadata
export const abTestVariantAiGenerations = pgTable("ab_test_variant_ai_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  variantId: varchar("variant_id").notNull().unique(), // One generation record per variant
  
  // AI generation metadata
  aiProvider: varchar("ai_provider").notNull(), // 'gemini', 'openai'
  aiModel: varchar("ai_model").notNull(),
  temperature: integer("temperature"), // 0-100 (multiply by 0.01)
  
  // Prompt and response
  systemPrompt: text("system_prompt"),
  userPrompt: text("user_prompt").notNull(),
  aiResponse: text("ai_response").notNull(),
  
  // Source inputs for generation
  sourceContentItemId: varchar("source_content_item_id").references(() => contentItems.id),
  baselineData: jsonb("baseline_data"), // Performance data used to inform generation
  personaContext: text("persona_context"), // Persona-specific context provided to AI
  
  // Generation results
  tokensUsed: integer("tokens_used"),
  generationTimeMs: integer("generation_time_ms"),
  generationStatus: varchar("generation_status").notNull().default('success'), // 'success', 'failed', 'retry'
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("ai_generations_variant_idx").on(table.variantId),
  index("ai_generations_provider_idx").on(table.aiProvider),
  index("ai_generations_status_idx").on(table.generationStatus),
]);

export const insertAbTestVariantAiGenerationSchema = createInsertSchema(abTestVariantAiGenerations).omit({
  id: true,
  createdAt: true,
});
export type InsertAbTestVariantAiGeneration = z.infer<typeof insertAbTestVariantAiGenerationSchema>;
export type AbTestVariantAiGeneration = typeof abTestVariantAiGenerations.$inferSelect;

// A/B Test Automation Runs - Audit trail of automation execution
export const abTestAutomationRuns = pgTable("ab_test_automation_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleId: varchar("rule_id").notNull().references(() => abTestAutomationRules.id, { onDelete: "cascade" }),
  
  // Run status
  status: varchar("status").notNull().default('running'), // 'running', 'completed', 'failed', 'cancelled'
  triggerType: varchar("trigger_type").notNull(), // 'scheduled', 'manual', 'threshold'
  triggeredBy: varchar("triggered_by").references(() => users.id), // User if manual trigger
  
  // Execution details
  evaluationStart: timestamp("evaluation_start").notNull().defaultNow(),
  evaluationEnd: timestamp("evaluation_end"),
  
  // Results
  opportunitiesDetected: integer("opportunities_detected").default(0),
  testsCreated: integer("tests_created").default(0),
  variantsGenerated: integer("variants_generated").default(0),
  
  // Created test IDs for tracking
  createdTestIds: jsonb("created_test_ids"), // Array of test IDs created during this run
  
  // Errors and logs
  errorMessage: text("error_message"),
  executionLog: jsonb("execution_log"), // Detailed step-by-step log
  
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("automation_runs_rule_idx").on(table.ruleId),
  index("automation_runs_status_idx").on(table.status),
  index("automation_runs_created_at_idx").on(table.createdAt),
  index("automation_runs_evaluation_start_idx").on(table.evaluationStart),
]);

export const insertAbTestAutomationRunSchema = createInsertSchema(abTestAutomationRuns).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export type InsertAbTestAutomationRun = z.infer<typeof insertAbTestAutomationRunSchema>;
export type AbTestAutomationRun = typeof abTestAutomationRuns.$inferSelect;

// A/B Test Safety Limits - Global safety guardrails for automation
export const abTestSafetyLimits = pgTable("ab_test_safety_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scope: varchar("scope").notNull().unique().default('global'), // 'global' (singleton pattern)
  
  // Global limits
  maxConcurrentAutomatedTests: integer("max_concurrent_automated_tests").default(10),
  maxTestsPerDay: integer("max_tests_per_day").default(5),
  maxTestsPerPersona: integer("max_tests_per_persona").default(3),
  maxTrafficAllocation: integer("max_traffic_allocation").default(50), // Max % of traffic in automated tests
  
  // Performance degradation detection
  degradationThreshold: integer("degradation_threshold").default(20), // % drop triggers rollback
  degradationCheckWindowMinutes: integer("degradation_check_window_minutes").default(60),
  
  // Cooldown periods
  globalCooldownHours: integer("global_cooldown_hours").default(24), // Between any automated actions
  perContentCooldownDays: integer("per_content_cooldown_days").default(7),
  
  // Emergency controls
  automationEnabled: boolean("automation_enabled").default(true), // Master kill switch
  requireAdminApproval: boolean("require_admin_approval").default(false), // Require approval for all
  
  // Notification thresholds
  notifyOnTestCreation: boolean("notify_on_test_creation").default(true),
  notifyOnWinnerPromotion: boolean("notify_on_winner_promotion").default(true),
  notifyOnFailure: boolean("notify_on_failure").default(true),
  
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
}, (table) => [
  uniqueIndex("safety_limits_scope_unique_idx").on(table.scope),
]);

export const insertAbTestSafetyLimitSchema = createInsertSchema(abTestSafetyLimits).omit({
  id: true,
  updatedAt: true,
});
export type InsertAbTestSafetyLimit = z.infer<typeof insertAbTestSafetyLimitSchema>;
export type AbTestSafetyLimit = typeof abTestSafetyLimits.$inferSelect;

// ==================== END FOUNDATION TABLES ====================

// A/B Test source enum for priority handling
export const abTestSourceEnum = z.enum(['manual', 'automated']);
export type AbTestSource = z.infer<typeof abTestSourceEnum>;

// A/B Testing tables for experimentation and optimization
export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // 'card_order', 'layout', 'messaging', 'cta', 'hero'
  status: varchar("status").notNull().default('draft'), // 'draft', 'active', 'paused', 'completed'
  targetPersona: varchar("target_persona"), // DEPRECATED: Legacy field for migration - use abTestTargets junction table
  targetFunnelStage: varchar("target_funnel_stage"), // DEPRECATED: Legacy field for migration - use abTestTargets junction table
  trafficAllocation: integer("traffic_allocation").default(100), // Percentage of traffic to include (0-100)
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  winnerVariantId: varchar("winner_variant_id"), // ID of winning variant once determined
  
  // Automation fields
  source: varchar("source").notNull().default('manual'), // 'manual' | 'automated' - explicit source for priority handling
  isAutomated: boolean("is_automated").default(false), // DEPRECATED: Use 'source' field instead. Kept for backwards compatibility
  automationRuleId: varchar("automation_rule_id").references(() => abTestAutomationRules.id, { onDelete: "set null" }), // Link to automation rule if automated
  autoPromotedAt: timestamp("auto_promoted_at"), // When winner was automatically promoted
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAbTestSchema = createInsertSchema(abTests).omit({
  id: true,
  targetPersona: true, // Deprecated - use abTestTargets junction table
  targetFunnelStage: true, // Deprecated - use abTestTargets junction table
  createdAt: true,
  updatedAt: true,
}).extend({
  source: abTestSourceEnum.default('manual'), // Validate source field with enum
});
export type InsertAbTest = z.infer<typeof insertAbTestSchema>;
export type AbTest = typeof abTests.$inferSelect;

// Junction table for A/B test targeting - links tests to multiple persona×stage combinations
export const abTestTargets = pgTable("ab_test_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => abTests.id, { onDelete: "cascade" }),
  persona: varchar("persona").notNull(), // Specific persona this test targets
  funnelStage: varchar("funnel_stage").notNull(), // Specific funnel stage this test targets
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("ab_test_targets_unique_idx").on(table.testId, table.persona, table.funnelStage),
]);

export const insertAbTestTargetSchema = createInsertSchema(abTestTargets).omit({
  id: true,
  createdAt: true,
});
export type InsertAbTestTarget = z.infer<typeof insertAbTestTargetSchema>;
export type AbTestTarget = typeof abTestTargets.$inferSelect;

// Test variants - different configurations being tested
// A/B tests apply presentation overrides to content selected via persona×journey matrix
// This allows testing different messaging/CTAs while maintaining personalization
export const abTestVariants = pgTable("ab_test_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => abTests.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // 'Control', 'Variant A', 'Variant B', etc
  description: text("description"),
  contentType: varchar("content_type").notNull().default('hero'), // 'hero', 'cta', 'service', 'testimonial', 'event', 'video', 'social_media', 'lead_magnet'
  trafficWeight: integer("traffic_weight").default(50), // Percentage of test traffic (weights sum to 100)
  // Configuration contains presentation overrides applied AFTER content selection
  // Example: { title: "New Headline", description: "Test copy", ctaText: "Join Now", imageName: "hero-alt" }
  // Content is first selected by persona + journey stage + passion tags, then overrides are applied
  configuration: jsonb("configuration"), // Optional during migration period - will be required in v2.0
  contentItemId: varchar("content_item_id").references(() => contentItems.id, { onDelete: "set null" }), // DEPRECATED v1.5: Will be removed in v2.0. Use configuration overrides instead. Existing tests using this field will continue to work but new tests should use configuration-only approach.
  isControl: boolean("is_control").default(false), // Is this the control/baseline variant?
  
  // AI generation fields
  generationSource: varchar("generation_source").default('manual'), // 'manual', 'ai_generated', 'ai_assisted'
  primaryMetric: varchar("primary_metric"), // The key metric this variant optimizes for
  weightingProfileId: varchar("weighting_profile_id").references(() => metricWeightProfiles.id, { onDelete: "set null" }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAbTestVariantSchema = createInsertSchema(abTestVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).superRefine((data, ctx) => {
  // During migration: at least one of configuration or contentItemId must be provided
  if (!data.configuration && !data.contentItemId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either configuration or contentItemId must be provided",
      path: [],
    });
    return;
  }
  
  // If configuration is provided, validate it and apply defaults/transforms
  if (data.configuration) {
    let configToValidate = data.configuration;
    
    // Backward compatibility: if 'kind' field is missing, assume 'presentation' type
    if (typeof configToValidate === 'object' && configToValidate !== null && !('kind' in configToValidate)) {
      configToValidate = { kind: 'presentation', ...configToValidate };
    }
    
    const result = abTestVariantConfigurationSchema.safeParse(configToValidate);
    if (!result.success) {
      // Add detailed validation errors for configuration field
      result.error.errors.forEach((error) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Configuration validation failed: ${error.message}`,
          path: ['configuration', ...error.path],
        });
      });
      return;
    }
    // Apply parsed configuration with defaults/transforms
    (data as any).configuration = result.data;
  }
});
export type InsertAbTestVariant = z.infer<typeof insertAbTestVariantSchema>;
export type AbTestVariant = typeof abTestVariants.$inferSelect;

// A/B Test with its variants for admin display
export type AbTestWithVariants = AbTest & {
  variants: AbTestVariant[];
};

// Zod schemas for A/B test variant configurations - type-specific with discriminated union

// Presentation Override Configuration (hero, cta, messaging tests)
// Contains presentation overrides applied to content after selection
export const presentationOverrideConfigSchema = z.object({
  kind: z.literal('presentation'),
  
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
  buttonVariant: z.enum(['default', 'secondary', 'outline', 'ghost', 'link', 'destructive']).optional(),
  
  // Metadata overrides (for content-type specific fields)
  metadata: z.record(z.any()).optional(),
}).strict();

export type PresentationOverrideConfig = z.infer<typeof presentationOverrideConfigSchema>;

// Card Order Configuration (card_order tests)
// Defines the order of content items to display
export const cardOrderConfigSchema = z.object({
  kind: z.literal('card_order'),
  
  // Type of content being reordered
  contentType: z.enum(['service', 'testimonial', 'event', 'program_detail', 'sponsor', 'impact_stat']),
  
  // Ordered array of content item IDs
  itemIds: z.array(z.string()).min(1, "At least one item must be selected"),
}).strict();

export type CardOrderConfig = z.infer<typeof cardOrderConfigSchema>;

// Layout Configuration (layout tests)
// Defines visual layout and styling options
export const layoutConfigSchema = z.object({
  kind: z.literal('layout'),
  
  // Layout template identifier
  template: z.enum(['grid-2col', 'grid-3col', 'grid-4col', 'sidebar-left', 'sidebar-right', 'single-column', 'masonry']),
  
  // Layout-specific options
  options: z.object({
    cardStyle: z.enum(['elevated', 'flat', 'bordered']).optional(),
    spacing: z.enum(['compact', 'comfortable', 'spacious']).optional(),
    imagePosition: z.enum(['top', 'left', 'right', 'background']).optional(),
    showImages: z.boolean().optional(),
    columnsOnMobile: z.enum(['1', '2']).optional(),
  }).optional(),
}).strict();

export type LayoutConfig = z.infer<typeof layoutConfigSchema>;

// Discriminated union of all configuration types
export const abTestVariantConfigurationSchema = z.discriminatedUnion('kind', [
  presentationOverrideConfigSchema,
  cardOrderConfigSchema,
  layoutConfigSchema,
]);

export type AbTestVariantConfiguration = z.infer<typeof abTestVariantConfigurationSchema>;

// Track which variant each session/user sees (ensures consistency)
export const abTestAssignments = pgTable("ab_test_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => abTests.id, { onDelete: "cascade" }),
  variantId: varchar("variant_id").notNull().references(() => abTestVariants.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id"), // Legacy session ID (from sessionStorage) - now nullable
  visitorId: varchar("visitor_id"), // Persistent visitor ID (from localStorage) - for anonymous users
  userId: varchar("user_id").references(() => users.id), // For authenticated users
  persona: varchar("persona"), // Persona at time of assignment
  funnelStage: varchar("funnel_stage"), // Funnel stage at time of assignment
  assignedAt: timestamp("assigned_at").defaultNow(),
}, (table) => ({
  // Unique constraint: one assignment per user per test
  userTestUnique: uniqueIndex("ab_assignments_user_test_unique").on(table.userId, table.testId),
  // Unique constraint: one assignment per visitor per test
  visitorTestUnique: uniqueIndex("ab_assignments_visitor_test_unique").on(table.visitorId, table.testId),
  // Index on visitorId for fast lookups
  visitorIdIdx: index("ab_assignments_visitor_id_idx").on(table.visitorId),
}));

export const insertAbTestAssignmentSchema = createInsertSchema(abTestAssignments).omit({
  id: true,
  assignedAt: true,
});
export type InsertAbTestAssignment = z.infer<typeof insertAbTestAssignmentSchema>;
export type AbTestAssignment = typeof abTestAssignments.$inferSelect;

// Track events for A/B test analytics
export const abTestEvents = pgTable("ab_test_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => abTests.id, { onDelete: "cascade" }),
  variantId: varchar("variant_id").notNull().references(() => abTestVariants.id, { onDelete: "cascade" }),
  assignmentId: varchar("assignment_id").references(() => abTestAssignments.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull(),
  eventType: varchar("event_type").notNull(), // 'page_view', 'cta_click', 'lead_magnet_download', 'donation', 'volunteer_signup'
  eventTarget: varchar("event_target"), // What was clicked/interacted with
  eventValue: integer("event_value"), // Optional numeric value (e.g., donation amount)
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAbTestEventSchema = createInsertSchema(abTestEvents).omit({
  id: true,
  createdAt: true,
});
export type InsertAbTestEvent = z.infer<typeof insertAbTestEventSchema>;
export type AbTestEvent = typeof abTestEvents.$inferSelect;

// Google Reviews table for caching reviews from Google Places API
export const googleReviews = pgTable("google_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  googleReviewId: varchar("google_review_id").unique().notNull(), // Unique ID from Google
  authorName: varchar("author_name").notNull(),
  authorPhotoUrl: varchar("author_photo_url"),
  rating: integer("rating").notNull(),
  text: text("text"),
  relativeTimeDescription: varchar("relative_time_description"), // "7 months ago"
  time: integer("time").notNull(), // Unix timestamp
  isActive: boolean("is_active").default(true), // Allow hiding specific reviews
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGoogleReviewSchema = createInsertSchema(googleReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGoogleReview = z.infer<typeof insertGoogleReviewSchema>;
export type GoogleReview = typeof googleReviews.$inferSelect;

// Donations table for tracking all donations
// Reference: blueprint:javascript_stripe
export const donations = pgTable("donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id), // Link to lead/donor
  userId: varchar("user_id").references(() => users.id), // Link to authenticated user (optional)
  campaignId: varchar("campaign_id").references(() => donationCampaigns.id), // Link to donation campaign (if from campaign)
  stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(), // Stripe payment ID
  stripeCustomerId: varchar("stripe_customer_id"), // Stripe customer ID for recurring
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency").default('usd'),
  donationType: varchar("donation_type").notNull(), // 'one-time', 'recurring', 'wishlist', 'campaign'
  frequency: varchar("frequency"), // For recurring: 'monthly', 'quarterly', 'annual'
  status: varchar("status").notNull().default('pending'), // 'pending', 'succeeded', 'failed', 'refunded'
  donorEmail: varchar("donor_email"),
  donorName: varchar("donor_name"),
  donorPhone: varchar("phone"),
  isAnonymous: boolean("is_anonymous").default(false),
  wishlistItemId: varchar("wishlist_item_id").references(() => wishlistItems.id), // For wishlist donations
  receiptUrl: varchar("receipt_url"), // Stripe receipt URL
  thankYouEmailSent: boolean("thank_you_email_sent").default(false),
  metadata: jsonb("metadata"), // Additional data: dedication, tribute, etc
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;

// Wishlist Items table for specific donation needs
export const wishlistItems = pgTable("wishlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(), // "School Supplies for 10 Students"
  description: text("description"), // Detailed description
  category: varchar("category").notNull(), // 'food', 'clothes', 'equipment', 'supplies', 'other'
  targetAmount: integer("target_amount").notNull(), // Target amount in cents
  raisedAmount: integer("raised_amount").default(0), // Amount raised so far in cents
  quantity: integer("quantity"), // Number of items needed (optional)
  quantityFulfilled: integer("quantity_fulfilled").default(0), // Number fulfilled
  imageUrl: varchar("image_url"), // Optional image
  priority: varchar("priority").default('medium'), // 'low', 'medium', 'high', 'urgent'
  isActive: boolean("is_active").default(true),
  isFulfilled: boolean("is_fulfilled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;

// Email Templates table for managing automated email content
// Extended to support Alex Hormozi's $100M Leads communication strategies
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // 'donation_thank_you', 'warm_reconnect_parent_awareness', etc
  subject: varchar("subject").notNull(),
  htmlBody: text("html_body").notNull(), // HTML template with {{placeholders}}
  textBody: text("text_body"), // Plain text version
  variables: jsonb("variables"), // List of available variables: ['firstName', 'lastName', 'lastInteraction', etc]
  
  // Hormozi $100M Leads Framework Fields
  outreachType: varchar("outreach_type"), // 'warm_outreach', 'cold_outreach', 'warm_broadcast', 'cold_broadcast'
  templateCategory: varchar("template_category"), // 'a_c_a', 'value_first', 'social_proof', 'problem_solution', 'lead_magnet_offer', 'reengagement', 'follow_up'
  persona: varchar("persona"), // Target persona: student, provider, parent, donor, volunteer, or null for all
  funnelStage: varchar("funnel_stage"), // Target funnel stage: awareness, consideration, decision, retention, or null for all
  description: text("description"), // Admin-facing description of when to use this template
  exampleContext: text("example_context"), // Example scenario for using this template
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// Email Logs table moved to after campaign tables for proper foreign key references

// AI Copy Generations table for tracking Value Equation-based copy generation
export const aiCopyGenerations = pgTable("ai_copy_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  originalContent: text("original_content").notNull(),
  contentType: varchar("content_type").notNull(), // hero, cta, service, event, testimonial, lead_magnet
  persona: varchar("persona"), // student, provider, parent, donor, volunteer, or null for general
  funnelStage: varchar("funnel_stage"), // awareness, consideration, decision, retention
  generatedVariants: jsonb("generated_variants").notNull(), // Array of {text, focus, explanation}
  dreamOutcome: text("dream_outcome"),
  perceivedLikelihood: text("perceived_likelihood"),
  timeDelay: text("time_delay"),
  effortSacrifice: text("effort_sacrifice"),
  selectedVariantIndex: integer("selected_variant_index"), // Which variant the user chose (0-2)
  wasCustomPrompt: boolean("was_custom_prompt").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiCopyGenerationSchema = createInsertSchema(aiCopyGenerations).omit({
  id: true,
  createdAt: true,
});
export type InsertAiCopyGeneration = z.infer<typeof insertAiCopyGenerationSchema>;
export type AiCopyGeneration = typeof aiCopyGenerations.$inferSelect;

// Email Campaigns table for drip campaign definitions
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  persona: varchar("persona"), // Target persona or null for all
  funnelStage: varchar("funnel_stage"), // Target funnel stage or null for all
  triggerType: varchar("trigger_type").notNull(), // 'manual', 'lead_created', 'quiz_completed', 'download', 'funnel_stage_change'
  triggerConditions: jsonb("trigger_conditions"), // Additional conditions like specific quiz, download, etc
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;

// Email Sequence Steps table for individual emails in a campaign
export const emailSequenceSteps = pgTable("email_sequence_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => emailCampaigns.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(), // Order in sequence (1, 2, 3...)
  delayDays: integer("delay_days").notNull().default(0), // Days after trigger or previous email
  delayHours: integer("delay_hours").notNull().default(0), // Additional hours
  templateId: varchar("template_id").references(() => emailTemplates.id),
  subject: varchar("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  variables: jsonb("variables"), // Available variables for this email
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailSequenceStepSchema = createInsertSchema(emailSequenceSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmailSequenceStep = z.infer<typeof insertEmailSequenceStepSchema>;
export type EmailSequenceStep = typeof emailSequenceSteps.$inferSelect;

// Email Campaign Enrollments table for tracking which leads are in which campaigns
export const emailCampaignEnrollments = pgTable("email_campaign_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => emailCampaigns.id, { onDelete: "cascade" }),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  status: varchar("status").notNull().default('active'), // 'active', 'completed', 'unsubscribed', 'bounced'
  currentStepNumber: integer("current_step_number").default(0), // Which step they're on
  lastEmailSentAt: timestamp("last_email_sent_at"),
  completedAt: timestamp("completed_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("enrollment_unique_idx").on(table.campaignId, table.leadId),
  index("enrollments_enrolled_at_idx").on(table.enrolledAt),
  index("enrollments_campaign_enrolled_idx").on(table.campaignId, table.enrolledAt),
]);

export const insertEmailCampaignEnrollmentSchema = createInsertSchema(emailCampaignEnrollments).omit({
  id: true,
  createdAt: true,
});
export type InsertEmailCampaignEnrollment = z.infer<typeof insertEmailCampaignEnrollmentSchema>;
export type EmailCampaignEnrollment = typeof emailCampaignEnrollments.$inferSelect;

// SMS Templates table for Hormozi-style SMS messages
export const smsTemplates = pgTable("sms_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  messageTemplate: text("message_template").notNull(), // SMS template with {variable} placeholders (≤160 chars)
  exampleContext: text("example_context"), // Example scenario for this template
  persona: varchar("persona"), // Target persona or null for all
  funnelStage: varchar("funnel_stage"), // awareness, consideration, decision, retention (null = all)
  outreachType: varchar("outreach_type"), // cold_outreach, warm_outreach, cold_broadcast, warm_broadcast
  templateCategory: varchar("template_category"), // a_c_a, value_first, social_proof, problem_solution, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;
export type SmsTemplate = typeof smsTemplates.$inferSelect;

// SMS Sends table for tracking sent SMS messages
export const smsSends = pgTable("sms_sends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => smsTemplates.id),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
  campaignId: varchar("campaign_id").references(() => emailCampaigns.id, { onDelete: "set null" }), // Links SMS to campaign
  sequenceStepId: varchar("sequence_step_id").references(() => emailSequenceSteps.id, { onDelete: "set null" }), // Links to specific step
  enrollmentId: varchar("enrollment_id").references(() => emailCampaignEnrollments.id, { onDelete: "set null" }), // Links to enrollment
  recipientPhone: varchar("recipient_phone").notNull(),
  recipientName: varchar("recipient_name"),
  messageContent: text("message_content").notNull(),
  status: varchar("status").notNull().default('pending'), // 'pending', 'sent', 'delivered', 'failed', 'undelivered'
  smsProvider: varchar("sms_provider"), // 'twilio', etc
  providerMessageId: varchar("provider_message_id"), // SID from Twilio
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // Variables used, campaign ID, etc
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSmsSendSchema = createInsertSchema(smsSends).omit({
  id: true,
  createdAt: true,
});
export type InsertSmsSend = z.infer<typeof insertSmsSendSchema>;
export type SmsSend = typeof smsSends.$inferSelect;

// SMS Bulk Campaigns table for tracking bulk SMS sends
export const smsBulkCampaigns = pgTable("sms_bulk_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  
  // Targeting filters (nullable = match all)
  personaFilter: varchar("persona_filter"), // 'parent', 'student', 'donor', 'volunteer', 'job_seeker' or null for all
  funnelStageFilter: varchar("funnel_stage_filter"), // 'awareness', 'consideration', 'retention', 'advocacy' or null for all
  
  // Future-proof filter storage (passion tags, custom segments, etc.)
  filterConfig: jsonb("filter_config"), // Extended filter criteria for future use
  
  // Message content
  templateId: varchar("template_id").references(() => smsTemplates.id, { onDelete: "set null" }),
  customMessage: text("custom_message"), // If not using template
  messageSnapshot: text("message_snapshot").notNull(), // Final message sent (for audit)
  
  // Metrics
  targetCount: integer("target_count").notNull().default(0), // How many leads matched filters
  sentCount: integer("sent_count").notNull().default(0), // Successfully sent
  blockedCount: integer("blocked_count").notNull().default(0), // Skipped due to unsubscribe
  failedCount: integer("failed_count").notNull().default(0), // Failed to send
  
  // Status tracking
  status: varchar("status").notNull().default('draft'), // 'draft', 'processing', 'completed', 'failed', 'cancelled'
  
  // Error tracking
  errorSummary: text("error_summary"), // Summary of errors if any
  metadata: jsonb("metadata"), // Additional data (rate limit info, restart points, etc.)
  
  // Audit fields
  createdBy: varchar("created_by").notNull().references(() => users.id),
  cancelledBy: varchar("cancelled_by").references(() => users.id),
  
  // Timestamps
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("sms_bulk_campaigns_created_by_idx").on(table.createdBy),
  index("sms_bulk_campaigns_status_idx").on(table.status),
  index("sms_bulk_campaigns_created_at_idx").on(table.createdAt),
]);

export const insertSmsBulkCampaignSchema = createInsertSchema(smsBulkCampaigns).omit({
  id: true,
  createdAt: true,
});
export type InsertSmsBulkCampaign = z.infer<typeof insertSmsBulkCampaignSchema>;
export type SmsBulkCampaign = typeof smsBulkCampaigns.$inferSelect;

// Communication Logs table for unified timeline of all communications with leads
export const communicationLogs = pgTable("communication_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id), // Admin who initiated, if manual
  communicationType: varchar("communication_type").notNull(), // 'email', 'sms', 'call', 'note', 'meeting'
  direction: varchar("direction"), // 'inbound', 'outbound'
  subject: varchar("subject"),
  content: text("content"),
  emailLogId: varchar("email_log_id").references(() => emailLogs.id),
  smsSendId: varchar("sms_send_id").references(() => smsSends.id),
  metadata: jsonb("metadata"), // Call duration, meeting attendees, campaign ID, etc
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunicationLogSchema = createInsertSchema(communicationLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;
export type CommunicationLog = typeof communicationLogs.$inferSelect;

// Email Logs table for tracking sent emails (moved here to reference campaign tables)
export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => emailTemplates.id),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
  campaignId: varchar("campaign_id").references(() => emailCampaigns.id, { onDelete: "set null" }),
  sequenceStepId: varchar("sequence_step_id").references(() => emailSequenceSteps.id, { onDelete: "set null" }),
  enrollmentId: varchar("enrollment_id").references(() => emailCampaignEnrollments.id, { onDelete: "set null" }),
  recipientEmail: varchar("recipient_email").notNull(),
  recipientName: varchar("recipient_name"),
  subject: varchar("subject").notNull(),
  trackingToken: varchar("tracking_token").notNull().unique(), // Unique token for tracking opens/clicks
  status: varchar("status").notNull().default('pending'), // 'pending', 'sent', 'failed', 'bounced'
  emailProvider: varchar("email_provider"), // 'sendgrid', 'resend', etc
  providerMessageId: varchar("provider_message_id"), // ID from email service
  errorMessage: text("error_message"), // If failed
  metadata: jsonb("metadata"), // Variables used, related donation ID, etc
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  trackingTokenIdx: index("email_logs_tracking_token_idx").on(table.trackingToken),
  leadIdIdx: index("email_logs_lead_id_idx").on(table.leadId),
  sentAtIdx: index("email_logs_sent_at_idx").on(table.sentAt),
  campaignSentAtIdx: index("email_logs_campaign_sent_at_idx").on(table.campaignId, table.sentAt),
  createdAtIdx: index("email_logs_created_at_idx").on(table.createdAt),
}));

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;

// Email Opens table for tracking when emails are opened
export const emailOpens = pgTable("email_opens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailLogId: varchar("email_log_id").notNull().references(() => emailLogs.id, { onDelete: "cascade" }),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
  campaignId: varchar("campaign_id").references(() => emailCampaigns.id, { onDelete: "set null" }),
  trackingToken: varchar("tracking_token").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  openedAt: timestamp("opened_at").defaultNow(),
}, (table) => ({
  trackingTokenIdx: index("email_opens_tracking_token_idx").on(table.trackingToken),
  campaignAnalyticsIdx: index("email_opens_campaign_analytics_idx").on(table.campaignId, table.openedAt),
  emailLogIdx: index("email_opens_email_log_idx").on(table.emailLogId),
  leadEngagementIdx: index("email_opens_lead_engagement_idx").on(table.leadId, table.openedAt),
}));

export const insertEmailOpenSchema = createInsertSchema(emailOpens).omit({
  id: true,
  openedAt: true,
});
export type InsertEmailOpen = z.infer<typeof insertEmailOpenSchema>;
export type EmailOpen = typeof emailOpens.$inferSelect;

// Email Links table - stores link tokens and target URLs server-side for security
export const emailLinks = pgTable("email_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailLogId: varchar("email_log_id").notNull().references(() => emailLogs.id, { onDelete: "cascade" }),
  linkToken: varchar("link_token").notNull().unique(),
  targetUrl: text("target_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  linkTokenIdx: index("email_links_link_token_idx").on(table.linkToken),
  emailLogIdIdx: index("email_links_email_log_id_idx").on(table.emailLogId),
}));

export const insertEmailLinkSchema = createInsertSchema(emailLinks).omit({
  id: true,
  createdAt: true,
});
export type InsertEmailLink = z.infer<typeof insertEmailLinkSchema>;
export type EmailLink = typeof emailLinks.$inferSelect;

// Email Clicks table for tracking link clicks in emails
export const emailClicks = pgTable("email_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailLogId: varchar("email_log_id").notNull().references(() => emailLogs.id, { onDelete: "cascade" }),
  emailLinkId: varchar("email_link_id").references(() => emailLinks.id, { onDelete: "set null" }),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
  campaignId: varchar("campaign_id").references(() => emailCampaigns.id, { onDelete: "set null" }),
  trackingToken: varchar("tracking_token").notNull(),
  targetUrl: text("target_url").notNull(), // Original URL being linked to  
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  clickedAt: timestamp("clicked_at").defaultNow(),
}, (table) => ({
  trackingTokenIdx: index("email_clicks_tracking_token_idx").on(table.trackingToken),
  emailLinkIdIdx: index("email_clicks_email_link_id_idx").on(table.emailLinkId),
  campaignAnalyticsIdx: index("email_clicks_campaign_analytics_idx").on(table.campaignId, table.clickedAt),
  emailLogIdx: index("email_clicks_email_log_idx").on(table.emailLogId),
  leadEngagementIdx: index("email_clicks_lead_engagement_idx").on(table.leadId, table.clickedAt),
}));

export const insertEmailClickSchema = createInsertSchema(emailClicks).omit({
  id: true,
  clickedAt: true,
});
export type InsertEmailClick = z.infer<typeof insertEmailClickSchema>;
export type EmailClick = typeof emailClicks.$inferSelect;

// Email Send Time Insights table for storing best send time analytics
// Stores pre-computed engagement metrics by day-of-week and hour-of-day
export const emailSendTimeInsights = pgTable("email_send_time_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scope: varchar("scope").notNull(), // 'global', 'campaign', 'persona'
  scopeId: varchar("scope_id"), // Campaign ID or persona value (null for global)
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 where 0=Sunday
  hourOfDay: integer("hour_of_day").notNull(), // 0-23 in America/New_York timezone
  sendCount: integer("send_count").notNull().default(0), // Total emails sent in this bucket
  openCount: integer("open_count").notNull().default(0), // Total opens in this bucket
  uniqueOpens: integer("unique_opens").notNull().default(0), // Unique leads who opened
  clickCount: integer("click_count").notNull().default(0), // Total clicks in this bucket
  openRate: integer("open_rate").notNull().default(0), // Percentage * 100 (e.g., 2543 = 25.43%)
  clickRate: integer("click_rate").notNull().default(0), // Percentage * 100
  medianTimeToOpen: integer("median_time_to_open"), // Median minutes from send to open
  confidenceScore: integer("confidence_score").notNull().default(0), // 0-100 based on sample size
  sampleSize: integer("sample_size").notNull().default(0), // Min(sendCount, 50) for confidence calculation
  metadata: jsonb("metadata"), // Additional stats, quartiles, etc
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(), // When this analysis was computed
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  scopeAnalyzedIdx: index("email_send_time_insights_scope_analyzed_idx").on(table.scope, table.analyzedAt),
  scopeIdIdx: index("email_send_time_insights_scope_id_idx").on(table.scopeId),
  dayHourIdx: index("email_send_time_insights_day_hour_idx").on(table.dayOfWeek, table.hourOfDay),
}));

export const insertEmailSendTimeInsightSchema = createInsertSchema(emailSendTimeInsights).omit({
  id: true,
  createdAt: true,
});
export type InsertEmailSendTimeInsight = z.infer<typeof insertEmailSendTimeInsightSchema>;
export type EmailSendTimeInsight = typeof emailSendTimeInsights.$inferSelect;

// Email Report Schedules table for automated email analytics reports
// Allows admins to schedule recurring reports (daily/weekly/monthly) to be sent via email
export const emailReportSchedules = pgTable("email_report_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // Unique name for the report schedule
  description: text("description"), // Optional description
  frequency: varchar("frequency").notNull(), // 'daily', 'weekly', 'monthly'
  recipients: jsonb("recipients").notNull(), // Array of email addresses: ['admin@example.com', 'manager@example.com']
  reportType: varchar("report_type").notNull(), // 'campaign_summary', 'engagement_summary', 'full_analytics'
  isActive: boolean("is_active").default(true).notNull(), // Whether the schedule is active
  nextRunAt: timestamp("next_run_at"), // When the next report should run
  lastRunAt: timestamp("last_run_at"), // When the last report was sent
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }), // Admin who created the schedule
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nextRunIdx: index("email_report_schedules_next_run_idx").on(table.nextRunAt),
  activeIdx: index("email_report_schedules_active_idx").on(table.isActive),
}));

// Email Report Schedule validation helpers
export const emailArraySchema = z.array(z.string().email()).min(1, "At least one recipient email is required");
export const frequencyEnumSchema = z.enum(['daily', 'weekly', 'monthly']);
export const reportTypeEnumSchema = z.enum(['campaign_summary', 'engagement_summary', 'full_analytics']);

export const insertEmailReportScheduleSchema = createInsertSchema(emailReportSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRunAt: true,
}).extend({
  recipients: emailArraySchema,
  frequency: frequencyEnumSchema,
  reportType: reportTypeEnumSchema,
  nextRunAt: z.string().datetime().transform(str => new Date(str)).optional(),
});

export const updateEmailReportScheduleSchema = insertEmailReportScheduleSchema.partial();

export type InsertEmailReportSchedule = z.infer<typeof insertEmailReportScheduleSchema>;
export type UpdateEmailReportSchedule = z.infer<typeof updateEmailReportScheduleSchema>;
export type EmailReportSchedule = typeof emailReportSchedules.$inferSelect;

// Lead-level email engagement DTOs (with joined campaign/link metadata)
export type LeadEmailOpen = EmailOpen & {
  campaignName: string | null;
};

export type LeadEmailClick = EmailClick & {
  campaignName: string | null;
  linkUrl: string | null;
};

// SMS Logs table for tracking sent SMS messages
export const smsLogs = pgTable("sms_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => smsTemplates.id),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
  campaignId: varchar("campaign_id").references(() => donationCampaigns.id, { onDelete: "set null" }),
  recipientPhone: varchar("recipient_phone").notNull(),
  recipientName: varchar("recipient_name"),
  messageContent: text("message_content").notNull(), // The actual SMS sent
  status: varchar("status").notNull().default('pending'), // 'pending', 'sent', 'failed', 'delivered'
  smsProvider: varchar("sms_provider").default('twilio'), // 'twilio', etc
  providerMessageId: varchar("provider_message_id"), // SID from Twilio
  errorMessage: text("error_message"), // If failed
  metadata: jsonb("metadata"), // Variables used, related donation/campaign ID, etc
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSmsLogSchema = createInsertSchema(smsLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertSmsLog = z.infer<typeof insertSmsLogSchema>;
export type SmsLog = typeof smsLogs.$inferSelect;

// Donation Campaigns table for passion-based fundraising campaigns
export const donationCampaigns = pgTable("donation_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(), // URL-friendly identifier
  description: text("description").notNull(),
  story: text("story"), // Long-form storytelling content
  goalAmount: integer("goal_amount").notNull(), // Target amount in cents
  raisedAmount: integer("raised_amount").default(0), // Amount raised so far in cents
  costPerPerson: integer("cost_per_person"), // Cost to help one person in cents (e.g., 50000 = $500/student)
  
  // Passion-based targeting
  passionTags: jsonb("passion_tags").notNull(), // Array of passion tags: ['literacy', 'stem', 'arts', 'nutrition', 'community']
  
  // Multi-channel communication settings
  sendEmail: boolean("send_email").default(true),
  sendSms: boolean("send_sms").default(false),
  emailTemplateId: varchar("email_template_id").references(() => emailTemplates.id),
  smsTemplateId: varchar("sms_template_id").references(() => smsTemplates.id),
  
  // Campaign timing
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  // Campaign status
  status: varchar("status").notNull().default('draft'), // 'draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'
  
  // Visual assets
  imageUrl: varchar("image_url"), // Campaign hero image
  thumbnailUrl: varchar("thumbnail_url"), // Smaller image for cards
  
  // Related content
  relatedTestimonialIds: jsonb("related_testimonial_ids"), // Array of content_items IDs to promote
  
  // Tracking
  totalDonations: integer("total_donations").default(0), // Count of donations
  uniqueDonors: integer("unique_donors").default(0), // Count of unique donors
  emailsSent: integer("emails_sent").default(0),
  smsSent: integer("sms_sent").default(0),
  clickThroughRate: integer("click_through_rate").default(0), // Percentage
  conversionRate: integer("conversion_rate").default(0), // Percentage
  
  // Metadata
  metadata: jsonb("metadata"), // Additional data: impact metrics, milestone updates, etc
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("donation_campaigns_status_idx").on(table.status),
  index("donation_campaigns_passion_tags_idx").on(table.passionTags),
]);

export const insertDonationCampaignSchema = createInsertSchema(donationCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Accept ISO strings and coerce to Date objects for timestamp fields
  startDate: z.union([z.date(), z.string().transform((val) => new Date(val))]),
  endDate: z.union([z.date(), z.string().transform((val) => new Date(val))]),
});

// Update schema for donation campaigns - whitelisted fields only
export const updateDonationCampaignSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  passion: z.string().optional(),
  goalAmount: z.number().positive().optional(),
  startDate: z.union([z.date(), z.string().transform((val) => new Date(val))]).optional(),
  endDate: z.union([z.date(), z.string().transform((val) => new Date(val))]).optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
  visibility: z.enum(['public', 'donors_only', 'internal']).optional(),
  metadata: z.any().optional(), // JSONB
}).strict();
export type UpdateDonationCampaign = z.infer<typeof updateDonationCampaignSchema>;
export type InsertDonationCampaign = z.infer<typeof insertDonationCampaignSchema>;
export type DonationCampaign = typeof donationCampaigns.$inferSelect;

// Campaign Communications - tracks what was sent for each campaign
export const campaignCommunications = pgTable("campaign_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => donationCampaigns.id, { onDelete: "cascade" }),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  
  // What was sent
  channel: varchar("channel").notNull(), // 'email', 'sms'
  emailLogId: varchar("email_log_id").references(() => emailLogs.id),
  smsLogId: varchar("sms_log_id").references(() => smsLogs.id),
  
  // Engagement tracking
  wasSent: boolean("was_sent").default(false),
  wasOpened: boolean("was_opened").default(false),
  wasClicked: boolean("was_clicked").default(false),
  wasDonated: boolean("was_donated").default(false), // Did they donate after this communication?
  
  // Matching info
  matchedPassions: jsonb("matched_passions"), // Which passions matched for this send
  
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  donatedAt: timestamp("donated_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("campaign_comms_campaign_idx").on(table.campaignId),
  index("campaign_comms_lead_idx").on(table.leadId),
  uniqueIndex("campaign_comms_unique_idx").on(table.campaignId, table.leadId, table.channel),
]);

export const insertCampaignCommunicationSchema = createInsertSchema(campaignCommunications).omit({
  id: true,
  createdAt: true,
});
export type InsertCampaignCommunication = z.infer<typeof insertCampaignCommunicationSchema>;
export type CampaignCommunication = typeof campaignCommunications.$inferSelect;

// Campaign Members - links users (parents, students, etc) to campaigns they can view/manage
export const campaignMembers = pgTable("campaign_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => donationCampaigns.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Member role: 'beneficiary' (student/parent receiving funds), 'supporter' (helping promote), 'organizer' (can edit campaign)
  role: varchar("role").notNull().default('beneficiary'), 
  
  // Notification preferences
  notifyOnDonation: boolean("notify_on_donation").default(true), // Get notified when someone donates
  notificationChannels: jsonb("notification_channels").default(['email']), // 'email', 'sms'
  
  // Member status
  isActive: boolean("is_active").default(true),
  
  // Metadata
  metadata: jsonb("metadata"), // Additional context: student info, parent relationship, etc
  
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("campaign_members_campaign_idx").on(table.campaignId),
  index("campaign_members_user_idx").on(table.userId),
  uniqueIndex("campaign_members_unique_idx").on(table.campaignId, table.userId),
]);

export const insertCampaignMemberSchema = createInsertSchema(campaignMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCampaignMember = z.infer<typeof insertCampaignMemberSchema>;
export type CampaignMember = typeof campaignMembers.$inferSelect;

// Campaign Testimonials - testimonials submitted by campaign members to thank donors
export const campaignTestimonials = pgTable("campaign_testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => donationCampaigns.id, { onDelete: "cascade" }),
  memberId: varchar("member_id").notNull().references(() => campaignMembers.id, { onDelete: "cascade" }),
  
  // Testimonial content
  title: varchar("title"), // Optional headline
  message: text("message").notNull(), // The testimonial message
  authorName: varchar("author_name").notNull(), // Display name (can be different from user name)
  authorRole: varchar("author_role"), // "Student", "Parent", "Participant"
  
  // Status tracking
  status: varchar("status").notNull().default('pending'), // 'pending', 'approved', 'sent', 'rejected'
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Distribution tracking
  wasSentToDonors: boolean("was_sent_to_donors").default(false),
  sentToDonorsAt: timestamp("sent_to_donors_at"),
  recipientCount: integer("recipient_count").default(0), // How many donors received this
  
  // AI enhancement
  wasAiEnhanced: boolean("was_ai_enhanced").default(false), // Was it enhanced by AI?
  originalMessage: text("original_message"), // Store original if AI-enhanced
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("campaign_testimonials_campaign_idx").on(table.campaignId),
  index("campaign_testimonials_member_idx").on(table.memberId),
  index("campaign_testimonials_status_idx").on(table.status),
]);

export const insertCampaignTestimonialSchema = createInsertSchema(campaignTestimonials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCampaignTestimonial = z.infer<typeof insertCampaignTestimonialSchema>;
export type CampaignTestimonial = typeof campaignTestimonials.$inferSelect;

// Outreach Emails - tracks all outbound prospecting emails sent to leads
export const outreachEmails = pgTable("outreach_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  
  // Email content
  subject: varchar("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  
  // Generation metadata
  wasAiGenerated: boolean("was_ai_generated").default(false),
  aiPrompt: text("ai_prompt"), // The prompt used to generate the email
  generatedBy: varchar("generated_by").references(() => users.id), // Admin who triggered generation
  
  // Sending metadata
  status: varchar("status").notNull().default('draft'), // draft, queued, sent, failed, bounced
  sentBy: varchar("sent_by").references(() => users.id), // Admin who sent it
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
  emailProvider: varchar("email_provider").default('sendgrid'), // sendgrid, mailgun, etc
  providerMessageId: varchar("provider_message_id"), // External provider's message ID
  
  // Error handling
  errorMessage: text("error_message"), // If sending failed
  retryCount: integer("retry_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("outreach_emails_lead_idx").on(table.leadId),
  index("outreach_emails_status_idx").on(table.status),
  index("outreach_emails_sent_at_idx").on(table.sentAt),
]);

export const insertOutreachEmailSchema = createInsertSchema(outreachEmails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOutreachEmail = z.infer<typeof insertOutreachEmailSchema>;
export type OutreachEmail = typeof outreachEmails.$inferSelect;

// ICP Criteria - stores the Ideal Customer Profile criteria for AI qualification
export const icpCriteria = pgTable("icp_criteria", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "MRI Decision Maker", "Education Director", etc
  description: text("description"), // Human-readable description of this ICP
  
  // Qualification criteria
  criteria: jsonb("criteria").notNull(), // Structured criteria: job titles, company types, signals, red flags, etc
  
  // Scoring weights
  scoringWeights: jsonb("scoring_weights"), // How to weight different factors in qualification score
  
  // AI prompt template
  qualificationPrompt: text("qualification_prompt").notNull(), // Template for Gemini to use when qualifying
  
  // Active status
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // Default ICP to use if none specified
  
  // Usage stats
  leadsQualified: integer("leads_qualified").default(0),
  averageScore: integer("average_score"), // Average qualification score for this ICP
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIcpCriteriaSchema = createInsertSchema(icpCriteria).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIcpCriteria = z.infer<typeof insertIcpCriteriaSchema>;
export type IcpCriteria = typeof icpCriteria.$inferSelect;

// Admin Chatbot Conversations - stores chat message history for AI assistant
export const chatbotConversations = pgTable("chatbot_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Message content
  role: varchar("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  
  // Tool calls (if assistant made function calls)
  toolCalls: jsonb("tool_calls"), // Array of tool calls made by assistant
  toolResults: jsonb("tool_results"), // Results from tool executions
  
  // Session tracking
  sessionId: varchar("session_id").notNull(), // Groups messages in same chat session
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("chatbot_conversations_user_idx").on(table.userId),
  index("chatbot_conversations_session_idx").on(table.sessionId),
]);

export const insertChatbotConversationSchema = createInsertSchema(chatbotConversations).omit({
  id: true,
  createdAt: true,
});
export type InsertChatbotConversation = z.infer<typeof insertChatbotConversationSchema>;
export type ChatbotConversation = typeof chatbotConversations.$inferSelect;

// Admin Chatbot Issues - tracks escalated issues that need manual attention
export const chatbotIssues = pgTable("chatbot_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Issue details
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  severity: varchar("severity").notNull().default('medium'), // 'low', 'medium', 'high', 'critical'
  status: varchar("status").notNull().default('open'), // 'open', 'in_progress', 'resolved', 'closed'
  category: varchar("category"), // 'content', 'technical', 'user_account', 'performance', 'other'
  
  // Context
  conversationContext: jsonb("conversation_context"), // Last few messages from chat
  diagnosticData: jsonb("diagnostic_data"), // Query results, log snippets, etc.
  
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
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("chatbot_issues_status_idx").on(table.status),
  index("chatbot_issues_severity_idx").on(table.severity),
  index("chatbot_issues_reported_by_idx").on(table.reportedBy),
]);

export const insertChatbotIssueSchema = createInsertSchema(chatbotIssues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChatbotIssue = z.infer<typeof insertChatbotIssueSchema>;
export type ChatbotIssue = typeof chatbotIssues.$inferSelect;

// Database Backup Snapshots - tracks table-level backups for surgical restore capability
export const backupSnapshots = pgTable("backup_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Backup metadata
  tableName: varchar("table_name").notNull(), // Original table name (e.g., 'users', 'leads')
  backupTableName: varchar("backup_table_name").notNull().unique(), // Actual backup table name (e.g., 'backup_users_20250109_143022')
  backupName: varchar("backup_name"), // Optional user-friendly name
  rowCount: integer("row_count").notNull(), // Number of rows backed up
  sizeBytes: integer("size_bytes"), // Approximate backup size
  
  // Creation tracking
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Optional metadata
  description: text("description"), // Purpose or notes about this backup
  tags: jsonb("tags"), // Optional tags for organization
}, (table) => [
  index("backup_snapshots_table_name_idx").on(table.tableName),
  index("backup_snapshots_created_by_idx").on(table.createdBy),
  index("backup_snapshots_created_at_idx").on(table.createdAt),
]);

export const insertBackupSnapshotSchema = createInsertSchema(backupSnapshots).omit({
  id: true,
  createdAt: true,
});
export type InsertBackupSnapshot = z.infer<typeof insertBackupSnapshotSchema>;
export type BackupSnapshot = typeof backupSnapshots.$inferSelect;

// Database Backup Schedules - automatic scheduled table backups with retention
export const backupSchedules = pgTable("backup_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Schedule target
  tableName: varchar("table_name").notNull(), // Table to backup (e.g., 'users', 'leads')
  scheduleName: varchar("schedule_name"), // Optional user-friendly name
  
  // Schedule configuration
  scheduleType: varchar("schedule_type").notNull(), // 'daily', 'weekly', 'monthly', 'custom'
  scheduleConfig: jsonb("schedule_config").notNull(), // { hour: 2, minute: 0, dayOfWeek: 0, dayOfMonth: 1, timezone: 'America/New_York', cron?: '0 2 * * *' }
  
  // Retention policy
  retentionCount: integer("retention_count").default(7), // Keep last N backups, null = keep all
  
  // Status and execution tracking
  isActive: boolean("is_active").default(true),
  isRunning: boolean("is_running").default(false), // Concurrency guard
  startedAt: timestamp("started_at"), // When current execution started (for stuck job detection)
  lockedUntil: timestamp("locked_until"), // Execution timeout - if current time > lockedUntil, job is stuck
  nextRun: timestamp("next_run").notNull(), // Next scheduled execution (UTC)
  lastRun: timestamp("last_run"), // Last successful execution
  lastRunStatus: varchar("last_run_status"), // 'success', 'error'
  lastRunError: text("last_run_error"), // Error message if failed
  consecutiveFailures: integer("consecutive_failures").default(0), // Track repeated failures
  
  // Creation tracking
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("backup_schedules_table_name_idx").on(table.tableName),
  index("backup_schedules_next_run_idx").on(table.nextRun),
  index("backup_schedules_is_active_idx").on(table.isActive),
  index("backup_schedules_created_by_idx").on(table.createdBy),
]);

export const insertBackupScheduleSchema = createInsertSchema(backupSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isRunning: true,
  startedAt: true,
  lockedUntil: true,
  lastRun: true,
  lastRunStatus: true,
  lastRunError: true,
  consecutiveFailures: true,
});
export type InsertBackupSchedule = z.infer<typeof insertBackupScheduleSchema>;
export type BackupSchedule = typeof backupSchedules.$inferSelect;

// CAC:LTGP Tracking System
// Based on Alex Hormozi's $100M Leads framework for maximizing donor acquisition efficiency

// Acquisition Channels - tracks sources of donor/lead acquisition
export const acquisitionChannels = pgTable("acquisition_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // 'Google Ads', 'Facebook Ads', 'Organic Search', 'Referral', 'Event: Spring Gala', etc
  slug: varchar("slug").notNull().unique(), // 'google_ads', 'facebook_ads', 'organic_search', 'referral', etc
  channelType: varchar("channel_type").notNull(), // 'paid_ads', 'organic', 'referral', 'event', 'email', 'social', 'direct', 'partnership'
  description: text("description"),
  
  // Cost tracking
  monthlyBudget: integer("monthly_budget"), // Budget in cents (if applicable)
  totalSpent: integer("total_spent").default(0), // Total amount spent in cents
  
  // Performance metrics (calculated from leads/donations)
  totalLeads: integer("total_leads").default(0),
  totalDonors: integer("total_donors").default(0),
  totalDonationAmount: integer("total_donation_amount").default(0), // In cents
  
  // Status
  isActive: boolean("is_active").default(true),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("acquisition_channels_type_idx").on(table.channelType),
  index("acquisition_channels_active_idx").on(table.isActive),
]);

export const insertAcquisitionChannelSchema = createInsertSchema(acquisitionChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAcquisitionChannel = z.infer<typeof insertAcquisitionChannelSchema>;
export type AcquisitionChannel = typeof acquisitionChannels.$inferSelect;

// Marketing Campaigns - specific marketing initiatives with budgets
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // 'Q1 2024 Parent Outreach', 'Back to School Drive', etc
  channelId: varchar("channel_id").references(() => acquisitionChannels.id, { onDelete: "set null" }),
  description: text("description"),
  
  // Budget and spend tracking
  budget: integer("budget").notNull(), // Total budget in cents
  spent: integer("spent").default(0), // Amount spent so far in cents
  
  // Date range
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  
  // Performance metrics (calculated)
  leadsGenerated: integer("leads_generated").default(0),
  donorsAcquired: integer("donors_acquired").default(0),
  totalDonations: integer("total_donations").default(0), // In cents
  
  // Status
  status: varchar("status").notNull().default('draft'), // 'draft', 'active', 'paused', 'completed'
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("marketing_campaigns_channel_idx").on(table.channelId),
  index("marketing_campaigns_status_idx").on(table.status),
  index("marketing_campaigns_dates_idx").on(table.startDate, table.endDate),
]);

export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Accept ISO strings and coerce to Date objects for timestamp fields
  startDate: z.union([z.date(), z.string().transform((val) => new Date(val))]),
  endDate: z.union([z.date(), z.string().transform((val) => new Date(val))]).optional(),
});
export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;

// Lead Attribution - links leads to their acquisition source with costs
export const leadAttribution = pgTable("lead_attribution", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }).unique(), // One attribution per lead
  
  // Attribution details
  channelId: varchar("channel_id").references(() => acquisitionChannels.id, { onDelete: "set null" }),
  campaignId: varchar("campaign_id").references(() => marketingCampaigns.id, { onDelete: "set null" }),
  
  // Cost tracking
  acquisitionCost: integer("acquisition_cost").default(0), // CAC in cents for this specific lead
  
  // Attribution metadata
  utmSource: varchar("utm_source"), // UTM tracking parameters
  utmMedium: varchar("utm_medium"),
  utmCampaign: varchar("utm_campaign"),
  utmContent: varchar("utm_content"),
  utmTerm: varchar("utm_term"),
  referrerUrl: text("referrer_url"),
  landingPage: varchar("landing_page"),
  
  // Conversion tracking
  becameDonor: boolean("became_donor").default(false),
  firstDonationDate: timestamp("first_donation_date"),
  firstDonationAmount: integer("first_donation_amount"), // In cents
  
  // Lifetime value tracking (calculated from donations)
  lifetimeDonationValue: integer("lifetime_donation_value").default(0), // Total donated in cents
  donationCount: integer("donation_count").default(0),
  lastDonationDate: timestamp("last_donation_date"),
  
  // Cohort tracking
  acquisitionMonth: varchar("acquisition_month"), // 'YYYY-MM' for cohort analysis
  acquisitionQuarter: varchar("acquisition_quarter"), // 'YYYY-Q#' for cohort analysis
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("lead_attribution_channel_idx").on(table.channelId),
  index("lead_attribution_campaign_idx").on(table.campaignId),
  index("lead_attribution_month_idx").on(table.acquisitionMonth),
  index("lead_attribution_quarter_idx").on(table.acquisitionQuarter),
  index("lead_attribution_became_donor_idx").on(table.becameDonor),
]);

export const insertLeadAttributionSchema = createInsertSchema(leadAttribution).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLeadAttribution = z.infer<typeof insertLeadAttributionSchema>;
export type LeadAttribution = typeof leadAttribution.$inferSelect;

// Donor Lifecycle Stages - tracks donor progression through giving stages
export const donorLifecycleStages = pgTable("donor_lifecycle_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }).unique(), // One lifecycle per lead
  
  // Link to acquisition source for per-channel lifecycle analysis
  acquisitionChannelId: varchar("acquisition_channel_id").references(() => acquisitionChannels.id, { onDelete: "set null" }),
  acquisitionCampaignId: varchar("acquisition_campaign_id").references(() => marketingCampaigns.id, { onDelete: "set null" }),
  
  // Current stage
  currentStage: varchar("current_stage").notNull().default('prospect'), // 'prospect', 'first_time', 'recurring', 'major_donor', 'legacy', 'lapsed'
  
  // Stage history with timestamps
  becameFirstTimeDonor: timestamp("became_first_time_donor"),
  becameRecurringDonor: timestamp("became_recurring_donor"),
  becameMajorDonor: timestamp("became_major_donor"), // Crossed major donor threshold
  becameLegacyDonor: timestamp("became_legacy_donor"), // Joined legacy/planned giving
  becameLapsed: timestamp("became_lapsed"), // No donation in X months
  
  // Economics at each lifecycle stage (for stage-specific CAC:LTGP analysis)
  prospectCAC: integer("prospect_cac").default(0), // CAC when acquired as prospect
  firstDonorLTGP: integer("first_donor_ltgp"), // LTGP when became first-time donor
  recurringDonorLTGP: integer("recurring_donor_ltgp"), // LTGP when became recurring
  majorDonorLTGP: integer("major_donor_ltgp"), // LTGP when became major donor
  currentLTGP: integer("current_ltgp").default(0), // Current LTGP
  currentLTGPtoCAC: integer("current_ltgp_to_cac"), // Current ratio * 100
  
  // Thresholds and metrics
  majorDonorThreshold: integer("major_donor_threshold").default(100000), // $1,000 in cents (configurable)
  monthsSinceLastDonation: integer("months_since_last_donation"),
  consecutiveMonthsDonating: integer("consecutive_months_donating").default(0),
  
  // Engagement metrics
  totalLifetimeDonations: integer("total_lifetime_donations").default(0), // In cents
  averageDonationAmount: integer("average_donation_amount").default(0), // In cents
  donationFrequency: varchar("donation_frequency"), // 'one_time', 'monthly', 'quarterly', 'annual', 'sporadic'
  
  // Retention risk
  retentionRiskScore: integer("retention_risk_score"), // 0-100, higher = more at risk of lapsing
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("donor_lifecycle_current_stage_idx").on(table.currentStage),
  index("donor_lifecycle_risk_idx").on(table.retentionRiskScore),
  index("donor_lifecycle_channel_idx").on(table.acquisitionChannelId),
  index("donor_lifecycle_campaign_idx").on(table.acquisitionCampaignId),
]);

export const insertDonorLifecycleStageSchema = createInsertSchema(donorLifecycleStages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDonorLifecycleStage = z.infer<typeof insertDonorLifecycleStageSchema>;
export type DonorLifecycleStage = typeof donorLifecycleStages.$inferSelect;

// Channel Spend Ledger - time-series tracking of marketing spend by channel/campaign
// Critical for calculating CAC over time and cohort analysis
export const channelSpendLedger = pgTable("channel_spend_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").references(() => acquisitionChannels.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id").references(() => marketingCampaigns.id, { onDelete: "cascade" }),
  
  // Time period (week or month)
  periodType: varchar("period_type").notNull(), // 'week', 'month'
  periodStart: timestamp("period_start").notNull(), // Start of period
  periodEnd: timestamp("period_end").notNull(), // End of period
  periodKey: varchar("period_key").notNull(), // 'YYYY-MM' or 'YYYY-WW' for easy grouping
  
  // Spend tracking
  amountSpent: integer("amount_spent").notNull().default(0), // Amount spent in cents
  
  // Attribution metrics for this period
  leadsAcquired: integer("leads_acquired").default(0),
  donorsAcquired: integer("donors_acquired").default(0),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("channel_spend_ledger_channel_idx").on(table.channelId),
  index("channel_spend_ledger_campaign_idx").on(table.campaignId),
  index("channel_spend_ledger_period_idx").on(table.periodKey),
  index("channel_spend_ledger_period_range_idx").on(table.periodStart, table.periodEnd),
]);

export const insertChannelSpendLedgerSchema = createInsertSchema(channelSpendLedger).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Accept ISO strings and coerce to Date objects for timestamp fields
  periodStart: z.union([z.date(), z.string().transform((val) => new Date(val))]),
  periodEnd: z.union([z.date(), z.string().transform((val) => new Date(val))]),
});
export type InsertChannelSpendLedger = z.infer<typeof insertChannelSpendLedgerSchema>;
export type ChannelSpendLedger = typeof channelSpendLedger.$inferSelect;

// Donor Economics - tracks gross profit and delivery costs per donor
// Essential for calculating true LTGP (not just revenue)
export const donorEconomics = pgTable("donor_economics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }).unique(),
  
  // Lifetime value tracking
  lifetimeRevenue: integer("lifetime_revenue").default(0), // Total donations in cents
  
  // Gross profit calculation
  // Delivery costs = cost to steward this donor (mailings, events, staff time, etc.)
  estimatedDeliveryCosts: integer("estimated_delivery_costs").default(0), // In cents
  actualDeliveryCosts: integer("actual_delivery_costs").default(0), // In cents (if tracked)
  
  // LTGP = Lifetime Revenue - Delivery Costs
  lifetimeGrossProfit: integer("lifetime_gross_profit").default(0), // In cents (calculated)
  
  // Margins
  grossMarginPercent: integer("gross_margin_percent"), // Percentage (0-100)
  
  // CAC for this donor (from lead_attribution)
  customerAcquisitionCost: integer("customer_acquisition_cost").default(0), // In cents
  
  // LTGP:CAC ratio for this donor
  ltgpToCacRatio: integer("ltgp_to_cac_ratio"), // Ratio * 100 (e.g., 500 = 5:1 ratio)
  
  // Payback period (days to recover CAC)
  paybackPeriodDays: integer("payback_period_days"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("donor_economics_lead_idx").on(table.leadId),
  index("donor_economics_ratio_idx").on(table.ltgpToCacRatio),
]);

export const insertDonorEconomicsSchema = createInsertSchema(donorEconomics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDonorEconomics = z.infer<typeof insertDonorEconomicsSchema>;
export type DonorEconomics = typeof donorEconomics.$inferSelect;

// Organization-wide economics settings for calculating gross profit
export const economicsSettings = pgTable("economics_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Default delivery cost as percentage of donation (if not tracked per-donor)
  defaultDeliveryCostPercent: integer("default_delivery_cost_percent").default(20), // Default 20% of donation goes to stewardship
  
  // Fixed costs per donor per year (mailings, events, etc.)
  annualDonorStewardshipCost: integer("annual_donor_stewardship_cost").default(5000), // $50 in cents
  
  // Major donor threshold (when a donor becomes "major")
  majorDonorThreshold: integer("major_donor_threshold").default(100000), // $1,000 in cents
  
  // Lapsed donor definition (months without donation)
  lapsedMonthsThreshold: integer("lapsed_months_threshold").default(12), // 12 months
  
  // Target ratios
  targetLtgpToCacRatio: integer("target_ltgp_to_cac_ratio").default(500), // 5:1 ratio (500 = 5.0x)
  minimumLtgpToCacRatio: integer("minimum_ltgp_to_cac_ratio").default(300), // 3:1 minimum (300 = 3.0x)
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEconomicsSettingsSchema = createInsertSchema(economicsSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEconomicsSettings = z.infer<typeof insertEconomicsSettingsSchema>;
export type EconomicsSettings = typeof economicsSettings.$inferSelect;

// Tech Goes Home Program Enrollments
export const techGoesHomeEnrollments = pgTable("tech_goes_home_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  programName: varchar("program_name").notNull().default("Tech Goes Home"),
  enrollmentDate: timestamp("enrollment_date").notNull().defaultNow(),
  programStartDate: timestamp("program_start_date"),
  programEndDate: timestamp("program_end_date"),
  status: varchar("status").notNull().default("active"), // active, completed, withdrawn
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
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("tgh_enrollments_user_idx").on(table.userId),
  index("tgh_enrollments_status_idx").on(table.status),
  index("tgh_enrollments_test_data_idx").on(table.isTestData),
  // Compound index for common query pattern: filtering real data by status
  index("tgh_enrollments_real_data_status_idx").on(table.isTestData, table.status),
]);

export const insertTechGoesHomeEnrollmentSchema = createInsertSchema(techGoesHomeEnrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTechGoesHomeEnrollment = z.infer<typeof insertTechGoesHomeEnrollmentSchema>;
export type TechGoesHomeEnrollment = typeof techGoesHomeEnrollments.$inferSelect;

// Tech Goes Home Class Attendance
export const techGoesHomeAttendance = pgTable("tech_goes_home_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enrollmentId: varchar("enrollment_id").notNull().references(() => techGoesHomeEnrollments.id, { onDelete: "cascade" }),
  classDate: timestamp("class_date").notNull(),
  classNumber: integer("class_number").notNull(), // 1-15 (or more if including make-ups)
  attended: boolean("attended").notNull().default(true),
  isMakeup: boolean("is_makeup").default(false),
  hoursCredits: integer("hours_credits").notNull().default(2), // Usually 2 hours per class
  notes: text("notes"),
  markedByAdminId: varchar("marked_by_admin_id").references(() => users.id, { onDelete: "set null" }),
  
  // Admin testing support
  isTestData: boolean("is_test_data").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("tgh_attendance_enrollment_idx").on(table.enrollmentId),
  index("tgh_attendance_date_idx").on(table.classDate),
  index("tgh_attendance_test_data_idx").on(table.isTestData),
  uniqueIndex("tgh_attendance_unique_idx").on(table.enrollmentId, table.classDate),
]);

export const insertTechGoesHomeAttendanceSchema = createInsertSchema(techGoesHomeAttendance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTechGoesHomeAttendance = z.infer<typeof insertTechGoesHomeAttendanceSchema>;
export type TechGoesHomeAttendance = typeof techGoesHomeAttendance.$inferSelect;

// Volunteer Events - organization-created volunteer opportunities
export const volunteerEvents = pgTable("volunteer_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Event details
  name: varchar("name").notNull(), // "Adult Tutoring Program", "Community Event Support", etc.
  description: text("description").notNull(),
  roleDescription: text("role_description"), // Specific responsibilities and requirements
  
  // Coordinator contact
  coordinatorName: varchar("coordinator_name"),
  coordinatorEmail: varchar("coordinator_email"),
  coordinatorPhone: varchar("coordinator_phone"),
  
  // Location and modality
  location: varchar("location"), // Physical address or "Remote"
  modalityOptions: jsonb("modality_options").default(['on_site']), // ['on_site', 'remote', 'hybrid']
  
  // Hours and commitment
  estimatedHoursPerSession: integer("estimated_hours_per_session").default(2), // Default 2 hours
  typicalWeeklyCommitment: varchar("typical_weekly_commitment"), // "1-2 hours per week"
  
  // Requirements
  requiresApplication: boolean("requires_application").default(false),
  applicationUrl: varchar("application_url"),
  requiresBackground: boolean("requires_background_check").default(false),
  
  // Program classification
  programType: varchar("program_type"), // "Adult Education", "Family Development", "Tech Goes Home", "Community Event"
  passionTags: jsonb("passion_tags"), // Array: ['literacy', 'stem', 'arts', 'nutrition', 'community']
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Metadata
  metadata: jsonb("metadata"), // Additional details
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("volunteer_events_active_idx").on(table.isActive),
  index("volunteer_events_program_idx").on(table.programType),
]);

export const insertVolunteerEventSchema = createInsertSchema(volunteerEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVolunteerEvent = z.infer<typeof insertVolunteerEventSchema>;
export type VolunteerEvent = typeof volunteerEvents.$inferSelect;

// Volunteer Shifts - specific date/time slots for volunteer events
export const volunteerShifts = pgTable("volunteer_shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => volunteerEvents.id, { onDelete: "cascade" }),
  
  // Shift timing
  shiftDate: timestamp("shift_date").notNull(),
  startTime: varchar("start_time").notNull(), // "09:30 AM", "6:00 PM"
  endTime: varchar("end_time").notNull(), // "2:00 PM", "8:00 PM"
  
  // Capacity
  maxVolunteers: integer("max_volunteers"), // Null = unlimited
  currentEnrollments: integer("current_enrollments").default(0),
  
  // Shift details
  location: varchar("location"), // Override event location if different
  modality: varchar("modality"), // 'on_site', 'remote', 'hybrid'
  notes: text("notes"), // Specific instructions for this shift
  
  // Google Calendar integration (optional)
  calendarEventId: varchar("calendar_event_id"),
  
  // Status
  status: varchar("status").notNull().default('scheduled'), // 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("volunteer_shifts_event_idx").on(table.eventId),
  index("volunteer_shifts_date_idx").on(table.shiftDate),
  index("volunteer_shifts_status_idx").on(table.status),
]);

export const insertVolunteerShiftSchema = createInsertSchema(volunteerShifts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVolunteerShift = z.infer<typeof insertVolunteerShiftSchema>;
export type VolunteerShift = typeof volunteerShifts.$inferSelect;

// Volunteer Enrollments - links volunteers to specific shifts
export const volunteerEnrollments = pgTable("volunteer_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shiftId: varchar("shift_id").notNull().references(() => volunteerShifts.id, { onDelete: "cascade" }),
  
  // Volunteer (can be authenticated user or lead from CRM)
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  
  // Role details
  volunteerRole: varchar("volunteer_role"), // "Tutor", "Event Assistant", "Coordinator"
  
  // Preferences
  preferredModality: varchar("preferred_modality"), // 'on_site', 'remote'
  
  // Application tracking
  applicationStatus: varchar("application_status").default('pending'), // 'pending', 'approved', 'rejected', 'waitlisted'
  applicationSubmittedAt: timestamp("application_submitted_at"),
  applicationNotes: text("application_notes"),
  
  // Enrollment status
  enrollmentStatus: varchar("enrollment_status").notNull().default('registered'), // 'registered', 'confirmed', 'checked_in', 'completed', 'no_show', 'cancelled'
  
  // Communication
  confirmationSent: boolean("confirmation_sent").default(false),
  reminderSent: boolean("reminder_sent").default(false),
  
  // Metadata
  metadata: jsonb("metadata"), // Emergency contact, special requirements, etc.
  
  // Admin testing support
  isTestData: boolean("is_test_data").default(false),
  createdByAdminId: varchar("created_by_admin_id").references(() => users.id, { onDelete: "set null" }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("volunteer_enrollments_shift_idx").on(table.shiftId),
  index("volunteer_enrollments_user_idx").on(table.userId),
  index("volunteer_enrollments_lead_idx").on(table.leadId),
  index("volunteer_enrollments_status_idx").on(table.enrollmentStatus),
  index("volunteer_enrollments_test_data_idx").on(table.isTestData),
  // Compound index for common query pattern: filtering real data by status
  index("volunteer_enrollments_real_data_status_idx").on(table.isTestData, table.enrollmentStatus),
]);

export const insertVolunteerEnrollmentSchema = createInsertSchema(volunteerEnrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVolunteerEnrollment = z.infer<typeof insertVolunteerEnrollmentSchema>;
export type VolunteerEnrollment = typeof volunteerEnrollments.$inferSelect;

// Volunteer Session Logs - tracks actual attendance and hours served
export const volunteerSessionLogs = pgTable("volunteer_session_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enrollmentId: varchar("enrollment_id").notNull().references(() => volunteerEnrollments.id, { onDelete: "cascade" }),
  
  // Attendance tracking
  attended: boolean("attended").notNull().default(true),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  
  // Hours served
  minutesServed: integer("minutes_served").notNull(), // Actual minutes volunteered
  
  // Session details
  sessionNotes: text("session_notes"), // What was accomplished, feedback, etc.
  impact: text("impact"), // Optional: impact description (students helped, tasks completed)
  
  // Admin tracking
  loggedBy: varchar("logged_by").references(() => users.id), // Admin who logged this session
  
  // Admin testing support
  isTestData: boolean("is_test_data").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("volunteer_session_logs_enrollment_idx").on(table.enrollmentId),
  index("volunteer_session_logs_created_at_idx").on(table.createdAt),
  index("volunteer_session_logs_test_data_idx").on(table.isTestData),
]);

export const insertVolunteerSessionLogSchema = createInsertSchema(volunteerSessionLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVolunteerSessionLog = z.infer<typeof insertVolunteerSessionLogSchema>;
export type VolunteerSessionLog = typeof volunteerSessionLogs.$inferSelect;

// Segments table for dynamic audience targeting
export const segments = pgTable("segments", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("segments_created_by_idx").on(table.createdBy),
  index("segments_is_active_idx").on(table.isActive),
]);

// Segment filter schema for validation (camelCase for consistency with frontend)
export const segmentFiltersSchema = z.object({
  personas: z.array(z.string()).optional(),
  funnelStages: z.array(z.string()).optional(),
  passions: z.array(z.string()).optional(),
  engagementMin: z.number().min(0).max(100).optional(),
  engagementMax: z.number().min(0).max(100).optional(),
  lastActivityDays: z.number().min(0).optional(),
  excludeUnsubscribed: z.boolean().optional(),
  excludeSmsUnsubscribed: z.boolean().optional(), // TCPA compliance: filter SMS opt-outs
}).strict(); // Strict to prevent unknown fields

export type SegmentFilters = z.infer<typeof segmentFiltersSchema>;

export const insertSegmentSchema = createInsertSchema(segments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  filters: segmentFiltersSchema, // Add proper validation for filters JSONB field
});

export const updateSegmentSchema = createInsertSchema(segments).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  filters: segmentFiltersSchema.partial(), // Partial for updates
}).partial();

export type InsertSegment = z.infer<typeof insertSegmentSchema>;
export type UpdateSegment = z.infer<typeof updateSegmentSchema>;
export type Segment = typeof segments.$inferSelect;

// Communication Unsubscribes table for tracking opt-outs (CAN-SPAM & TCPA compliance)
export const emailUnsubscribes = pgTable("email_unsubscribes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Lead reference (nullable for non-lead contacts)
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
  
  // Channel: 'email', 'sms', or 'all'
  channel: varchar("channel").notNull().default('email'),
  
  // Contact info (at least one required)
  email: varchar("email"), // For email unsubscribes
  phone: varchar("phone"), // For SMS unsubscribes
  
  // Soft delete support (for resubscribe via START keyword)
  isActive: boolean("is_active").notNull().default(true), // false = resubscribed
  resubscribedAt: timestamp("resubscribed_at"), // When they resubscribed via START
  
  // Unsubscribe details
  reason: varchar("reason"), // 'too_frequent', 'not_interested', 'irrelevant', 'other'
  feedback: text("feedback"), // Optional detailed feedback
  
  // Source tracking
  source: varchar("source").default('user_request'), // 'user_request', 'bounce', 'spam_complaint', 'admin', 'keyword' (for SMS STOP)
  campaignId: varchar("campaign_id").references(() => emailCampaigns.id, { onDelete: "set null" }), // Campaign that triggered unsubscribe (if any)
  
  // Timestamps
  unsubscribedAt: timestamp("unsubscribed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
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
  channelEmailUnique: uniqueIndex("email_unsubscribes_channel_email_unique")
    .on(table.channel, table.email)
    .where(sql`${table.email} IS NOT NULL AND ${table.isActive} = true`),
  
  // Unique for (channel, phone) where phone is not null and is_active=true
  channelPhoneUnique: uniqueIndex("email_unsubscribes_channel_phone_unique")
    .on(table.channel, table.phone)
    .where(sql`${table.phone} IS NOT NULL AND ${table.isActive} = true`),
}));

export const insertEmailUnsubscribeSchema = createInsertSchema(emailUnsubscribes).omit({
  id: true,
  unsubscribedAt: true,
  createdAt: true,
  resubscribedAt: true,
}).refine(
  (data) => {
    // Channel defaults to 'email' in DB, so treat undefined as 'email'
    const channel = data.channel || 'email';
    
    // For email channel (or default), email must be provided
    if (channel === 'email' && !data.email) return false;
    // For sms channel, phone must be provided
    if (channel === 'sms' && !data.phone) return false;
    // For 'all' channel, BOTH email and phone must be provided for cross-channel suppression
    if (channel === 'all' && (!data.email || !data.phone)) return false;
    // Must have at least one identifier (belt and suspenders)
    if (!data.email && !data.phone) return false;
    return true;
  },
  { message: 'Email required for email channel (default), phone required for SMS channel, both required for all channel' }
);

export type InsertEmailUnsubscribe = z.infer<typeof insertEmailUnsubscribeSchema>;
export type EmailUnsubscribe = typeof emailUnsubscribes.$inferSelect;

// Channel type for type safety
export type CommunicationChannel = 'email' | 'sms' | 'all';

// ====================
// Admin Role Provisioning & Impersonation
// ====================

// Program Types for admin testing
export type ProgramType = 'student_program' | 'volunteer_opportunity';

// Generic Programs Catalog - lists all testable programs/opportunities
export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Program identification
  name: varchar("name").notNull(), // "Tech Goes Home Spring 2024", "Adult Tutoring - Saturday Morning"
  programType: varchar("program_type").notNull().$type<ProgramType>(), // "student_program" | "volunteer_opportunity"
  description: text("description"),
  
  // Type-safe foreign keys (one will be populated based on programType)
  techGoesHomeEnrollmentTemplate: varchar("tgh_enrollment_template"), // For student programs: template settings
  volunteerShiftId: varchar("volunteer_shift_id").references(() => volunteerShifts.id, { onDelete: "set null" }),
  volunteerEventId: varchar("volunteer_event_id").references(() => volunteerEvents.id, { onDelete: "set null" }),
  
  // Test data generation configuration
  autoPopulateConfig: jsonb("auto_populate_config").$type<{
    progressPercent?: number;
    attendanceCount?: number;
    completedClasses?: number;
    hoursServed?: number;
    metadata?: Record<string, any>;
  }>(),
  
  // Status
  isActive: boolean("is_active").default(true),
  isAvailableForTesting: boolean("is_available_for_testing").default(true),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("programs_type_idx").on(table.programType),
  index("programs_active_idx").on(table.isActive),
]);

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

// Admin Entitlements - tracks which test enrollments each admin has activated
export const adminEntitlements = pgTable("admin_entitlements", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("admin_entitlements_admin_idx").on(table.adminId),
  index("admin_entitlements_program_idx").on(table.programId),
  index("admin_entitlements_admin_active_idx").on(table.adminId, table.isActive),
  
  // Partial unique: prevent duplicate active entitlements for same admin+program
  // Only enforced when is_active = true, allows historical inactive rows
  uniqueIndex("admin_entitlements_unique_active_idx")
    .on(table.adminId, table.programId)
    .where(sql`${table.isActive} = true`),
]);

export const insertAdminEntitlementSchema = createInsertSchema(adminEntitlements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAdminEntitlement = z.infer<typeof insertAdminEntitlementSchema>;
export type AdminEntitlement = typeof adminEntitlements.$inferSelect;

// Admin Impersonation Sessions - audit trail for user impersonation
export const adminImpersonationSessions = pgTable("admin_impersonation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Who is impersonating whom
  adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  impersonatedUserId: varchar("impersonated_user_id").references(() => users.id, { onDelete: "set null" }),
  
  // Session tracking
  isActive: boolean("is_active").default(true),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  
  // Audit details (captured at session start)
  reason: text("reason"), // Optional: why admin is impersonating
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("impersonation_sessions_admin_idx").on(table.adminId),
  index("impersonation_sessions_user_idx").on(table.impersonatedUserId),
  
  // Compound index for active session lookups
  index("impersonation_sessions_admin_active_idx").on(table.adminId).where(sql`${table.isActive} = true`),
  
  // Partial unique: only one active impersonation per admin at a time
  // Prevents concurrent impersonations, enforced only when is_active = true
  uniqueIndex("impersonation_sessions_unique_active_idx")
    .on(table.adminId)
    .where(sql`${table.isActive} = true`),
]);

export const insertAdminImpersonationSessionSchema = createInsertSchema(adminImpersonationSessions).omit({
  id: true,
  createdAt: true,
});
export type InsertAdminImpersonationSession = z.infer<typeof insertAdminImpersonationSessionSchema>;
export type AdminImpersonationSession = typeof adminImpersonationSessions.$inferSelect;
