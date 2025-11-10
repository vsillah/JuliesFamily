# Database Migrations

## Running Migrations

### Automatic Migration (Recommended)
The preferred method is using Drizzle's push command:

```bash
npm run db:push --force
```

**Note:** If this command encounters an interactive prompt about the `icp_criteria` table, select the "create table" option (press `+` or Enter).

### Manual Migration (If Automatic Fails)
If the automatic migration gets stuck on prompts, run the SQL migration manually:

#### Development Database
```bash
# Using psql
psql $DATABASE_URL -f migrations/001_ab_test_configuration_support.sql

# Or using npm script (if you create one)
npm run db:migrate
```

#### Production Database
**IMPORTANT:** Always test migrations in a staging environment first!

1. Create a database backup
2. Apply migration to staging:
   ```bash
   psql $PRODUCTION_DATABASE_URL -f migrations/001_ab_test_configuration_support.sql
   ```
3. Verify application works correctly
4. Apply to production only after successful staging validation

## Current Migrations

### 001_ab_test_configuration_support.sql
**Purpose:** Add configuration-based A/B testing support

**Changes:**
- Creates `icp_criteria` table for lead management
- Adds `content_type` column to `ab_test_variants` (default: 'hero')
- Adds `configuration` JSONB column to `ab_test_variants` (nullable)

**Impact:** Enables universal A/B testing across all content types with presentation overrides

**Rollback:** Not recommended - both old (contentItemId) and new (configuration) approaches are supported during migration period

## Architecture Notes

### New A/B Testing Flow
1. **Content Selection:** Filtered by persona + journey stage + passion tags
2. **A/B Overrides:** Variant configuration applied to selected content
3. **Rendering:** Final content with overrides displayed to user

This ensures personalization is respected while testing different messaging/CTA variations.

### Migration Period
- Both `contentItemId` and `configuration` fields are supported
- Legacy A/B tests using `contentItemId` continue to work
- New A/B tests should use `configuration` approach
- Plan to deprecate `contentItemId` in v2.0
