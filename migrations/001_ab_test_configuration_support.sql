-- Migration: Add configuration-based A/B testing support
-- Version: 1.5
-- Date: 2025-11-10
-- Description: Add contentType and configuration fields to ab_test_variants table
--              and create icp_criteria table for lead management

-- ============================================================================
-- Part 1: Create icp_criteria table (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS icp_criteria (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL,
  criteria JSONB NOT NULL,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Part 2: Update ab_test_variants table
-- ============================================================================

-- Add contentType column (default 'hero' for existing records)
ALTER TABLE ab_test_variants 
ADD COLUMN IF NOT EXISTS content_type VARCHAR NOT NULL DEFAULT 'hero';

-- Add configuration column (nullable during migration period)
ALTER TABLE ab_test_variants 
ADD COLUMN IF NOT EXISTS configuration JSONB;

-- ============================================================================
-- Migration Notes
-- ============================================================================
-- 
-- This migration supports the transition from contentItemId-based A/B tests
-- to configuration-based A/B tests that apply presentation overrides.
--
-- New A/B Testing Architecture:
-- 1. Content is first selected by persona + journey stage + passion tags
-- 2. A/B variant configuration overrides are then applied
-- 3. This ensures personalization is respected while testing messaging variations
--
-- Fields:
-- - content_type: Identifies which type of content the variant applies to
--                 (hero, cta, service, testimonial, event, video, etc.)
-- - configuration: JSONB object containing presentation overrides
--                  Example: { "title": "New Headline", "ctaText": "Join Now" }
--
-- Migration Period:
-- - Both contentItemId and configuration are supported during transition
-- - Legacy tests with contentItemId will continue to work
-- - New tests should use configuration approach
-- - Plan to remove contentItemId column in v2.0
--
-- ============================================================================

-- Verify migration
DO $$
BEGIN
    -- Check if columns were added successfully
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ab_test_variants' AND column_name = 'content_type'
    ) THEN
        RAISE EXCEPTION 'Migration failed: content_type column not added';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ab_test_variants' AND column_name = 'configuration'
    ) THEN
        RAISE EXCEPTION 'Migration failed: configuration column not added';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;
