-- Email tracking tables for campaign analytics
-- Phase 1: Opens and Clicks tracking

-- Email Opens table
CREATE TABLE IF NOT EXISTS "email_opens" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "email_log_id" varchar NOT NULL,
  "lead_id" varchar,
  "campaign_id" varchar,
  "tracking_token" varchar NOT NULL,
  "ip_address" varchar,
  "user_agent" text,
  "metadata" jsonb,
  "opened_at" timestamp DEFAULT now()
);

-- Email Clicks table
CREATE TABLE IF NOT EXISTS "email_clicks" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "email_log_id" varchar NOT NULL,
  "lead_id" varchar,
  "campaign_id" varchar,
  "tracking_token" varchar NOT NULL,
  "target_url" text NOT NULL,
  "ip_address" varchar,
  "user_agent" text,
  "metadata" jsonb,
  "clicked_at" timestamp DEFAULT now()
);

-- Foreign key constraints
ALTER TABLE "email_opens" ADD CONSTRAINT "email_opens_email_log_id_fkey" 
  FOREIGN KEY ("email_log_id") REFERENCES "email_logs"("id") ON DELETE CASCADE;

ALTER TABLE "email_opens" ADD CONSTRAINT "email_opens_lead_id_fkey" 
  FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL;

ALTER TABLE "email_opens" ADD CONSTRAINT "email_opens_campaign_id_fkey" 
  FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE SET NULL;

ALTER TABLE "email_clicks" ADD CONSTRAINT "email_clicks_email_log_id_fkey" 
  FOREIGN KEY ("email_log_id") REFERENCES "email_logs"("id") ON DELETE CASCADE;

ALTER TABLE "email_clicks" ADD CONSTRAINT "email_clicks_lead_id_fkey" 
  FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL;

ALTER TABLE "email_clicks" ADD CONSTRAINT "email_clicks_campaign_id_fkey" 
  FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE SET NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS "email_opens_tracking_token_idx" ON "email_opens"("tracking_token");
CREATE INDEX IF NOT EXISTS "email_opens_campaign_analytics_idx" ON "email_opens"("campaign_id", "opened_at");
CREATE INDEX IF NOT EXISTS "email_opens_email_log_idx" ON "email_opens"("email_log_id");

CREATE INDEX IF NOT EXISTS "email_clicks_tracking_token_idx" ON "email_clicks"("tracking_token");
CREATE INDEX IF NOT EXISTS "email_clicks_campaign_analytics_idx" ON "email_clicks"("campaign_id", "clicked_at");
CREATE INDEX IF NOT EXISTS "email_clicks_email_log_idx" ON "email_clicks"("email_log_id");
