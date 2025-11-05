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

// CRM Leads table
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  persona: varchar("persona").notNull(), // student, provider, parent, donor, volunteer
  funnelStage: varchar("funnel_stage").notNull(), // awareness, consideration, decision, retention
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
  data: jsonb("data"), // Quiz answers, form data, etc
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true,
});
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactions.$inferSelect;

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
});

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
  type: varchar("type").notNull(), // 'service', 'event', 'testimonial', 'sponsor', 'lead_magnet', 'impact_stat', 'hero', 'cta'
  title: text("title").notNull(),
  description: text("description"),
  imageName: varchar("image_name"), // Cloudinary image name
  order: integer("order").notNull().default(0), // Display order
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"), // Additional data: location, date, rating, icon, etc
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
  targetPersona: varchar("target_persona"), // null = all personas
  targetFunnelStage: varchar("target_funnel_stage"), // null = all stages
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
  createdAt: true,
  updatedAt: true,
});
export type InsertAbTest = z.infer<typeof insertAbTestSchema>;
export type AbTest = typeof abTests.$inferSelect;

// Test variants - different configurations being tested
export const abTestVariants = pgTable("ab_test_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => abTests.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // 'Control', 'Variant A', 'Variant B', etc
  description: text("description"),
  trafficWeight: integer("traffic_weight").default(50), // Percentage of test traffic (weights sum to 100)
  configuration: jsonb("configuration").notNull(), // Variant-specific config (card order, layout changes, etc)
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
