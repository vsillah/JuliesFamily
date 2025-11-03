import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, boolean, integer } from "drizzle-orm/pg-core";
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
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
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
