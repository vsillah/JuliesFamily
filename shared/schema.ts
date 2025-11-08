import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, boolean, integer, uniqueIndex } from "drizzle-orm/pg-core";
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
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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

// CRM Leads table
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  persona: varchar("persona").notNull(), // student, provider, parent, donor, volunteer
  funnelStage: varchar("funnel_stage").notNull(), // awareness, consideration, decision, retention
  pipelineStage: varchar("pipeline_stage").default('new_lead'), // References pipeline stages: new_lead, contacted, qualified, etc.
  leadSource: varchar("lead_source"), // organic, referral, ad, etc
  engagementScore: integer("engagement_score").default(0),
  lastInteractionDate: timestamp("last_interaction_date"),
  convertedAt: timestamp("converted_at"),
  notes: text("notes"),
  metadata: jsonb("metadata"), // Additional data like quiz answers, form submissions
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
  type: varchar("type").notNull(), // 'service', 'event', 'testimonial', 'sponsor', 'lead_magnet', 'impact_stat', 'hero', 'cta', 'socialMedia', 'video', 'review'
  title: text("title").notNull(),
  description: text("description"),
  imageName: varchar("image_name"), // Cloudinary image name
  order: integer("order").notNull().default(0), // Display order
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"), // Additional data: location, date, rating, icon, videoId, category, platform, etc
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContentItemSchema = createInsertSchema(contentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;
export type ContentItem = typeof contentItems.$inferSelect;

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
export const abTestVariants = pgTable("ab_test_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => abTests.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // 'Control', 'Variant A', 'Variant B', etc
  description: text("description"),
  trafficWeight: integer("traffic_weight").default(50), // Percentage of test traffic (weights sum to 100)
  configuration: jsonb("configuration").notNull(), // Variant-specific config (card order, layout changes, etc)
  contentItemId: varchar("content_item_id").references(() => contentItems.id, { onDelete: "set null" }), // Optional link to Content Manager item
  isControl: boolean("is_control").default(false), // Is this the control/baseline variant?
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAbTestVariantSchema = createInsertSchema(abTestVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAbTestVariant = z.infer<typeof insertAbTestVariantSchema>;
export type AbTestVariant = typeof abTestVariants.$inferSelect;

// Track which variant each session/user sees (ensures consistency)
export const abTestAssignments = pgTable("ab_test_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => abTests.id, { onDelete: "cascade" }),
  variantId: varchar("variant_id").notNull().references(() => abTestVariants.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull(), // Session-based tracking (from sessionStorage)
  userId: varchar("user_id").references(() => users.id), // Optional - for authenticated users
  persona: varchar("persona"), // Persona at time of assignment
  funnelStage: varchar("funnel_stage"), // Funnel stage at time of assignment
  assignedAt: timestamp("assigned_at").defaultNow(),
});

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
  stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(), // Stripe payment ID
  stripeCustomerId: varchar("stripe_customer_id"), // Stripe customer ID for recurring
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency").default('usd'),
  donationType: varchar("donation_type").notNull(), // 'one-time', 'recurring', 'wishlist'
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
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // 'donation_thank_you', 'donation_receipt', 'lead_confirmation'
  subject: varchar("subject").notNull(),
  htmlBody: text("html_body").notNull(), // HTML template with {{placeholders}}
  textBody: text("text_body"), // Plain text version
  variables: jsonb("variables"), // List of available variables: ['donorName', 'amount', etc]
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
]);

export const insertEmailCampaignEnrollmentSchema = createInsertSchema(emailCampaignEnrollments).omit({
  id: true,
  createdAt: true,
});
export type InsertEmailCampaignEnrollment = z.infer<typeof insertEmailCampaignEnrollmentSchema>;
export type EmailCampaignEnrollment = typeof emailCampaignEnrollments.$inferSelect;

// SMS Templates table for reusable SMS messages
export const smsTemplates = pgTable("sms_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  messageContent: text("message_content").notNull(), // SMS body with {{variables}}
  category: varchar("category"), // 'reminder', 'confirmation', 'notification', 'marketing'
  persona: varchar("persona"), // Target persona or null for all
  variables: jsonb("variables"), // Available variables: ['firstName', 'appointmentTime', etc]
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
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
  status: varchar("status").notNull().default('pending'), // 'pending', 'sent', 'failed', 'bounced'
  emailProvider: varchar("email_provider"), // 'sendgrid', 'resend', etc
  providerMessageId: varchar("provider_message_id"), // ID from email service
  errorMessage: text("error_message"), // If failed
  metadata: jsonb("metadata"), // Variables used, related donation ID, etc
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;
