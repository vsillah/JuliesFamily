-- Migration: Funnel Progression System
-- Version: 2.0
-- Date: 2025-11-12
-- Description: Add intelligent funnel progression with persona-specific rules and audit logging

-- Create funnel_progression_rules table
CREATE TABLE IF NOT EXISTS "funnel_progression_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona" varchar NOT NULL,
	"from_stage" varchar NOT NULL,
	"to_stage" varchar NOT NULL,
	"engagement_score_threshold" integer NOT NULL,
	"minimum_days_in_stage" integer DEFAULT 0,
	"auto_progress_events" jsonb,
	"inactivity_days_threshold" integer,
	"decay_to_stage" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Create funnel_progression_history table
CREATE TABLE IF NOT EXISTS "funnel_progression_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"from_stage" varchar,
	"to_stage" varchar NOT NULL,
	"reason" varchar NOT NULL,
	"triggered_by" varchar,
	"engagement_score_at_change" integer,
	"trigger_event" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Add lastFunnelUpdateAt column to leads table
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "last_funnel_update_at" timestamp;
--> statement-breakpoint

-- Add foreign key constraints
ALTER TABLE "funnel_progression_history" ADD CONSTRAINT "funnel_progression_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "funnel_progression_history" ADD CONSTRAINT "funnel_progression_history_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "funnel_rules_persona_idx" ON "funnel_progression_rules" USING btree ("persona");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funnel_rules_transition_idx" ON "funnel_progression_rules" USING btree ("from_stage","to_stage");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "funnel_rules_unique_transition" ON "funnel_progression_rules" USING btree ("persona","from_stage","to_stage");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funnel_history_lead_id_idx" ON "funnel_progression_history" USING btree ("lead_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funnel_history_created_at_idx" ON "funnel_progression_history" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funnel_history_reason_idx" ON "funnel_progression_history" USING btree ("reason");
