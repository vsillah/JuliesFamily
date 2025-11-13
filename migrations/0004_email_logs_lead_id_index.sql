-- Add index on email_logs.lead_id for lead-level engagement queries
CREATE INDEX IF NOT EXISTS "email_logs_lead_id_idx" ON "email_logs" ("lead_id");
