import { db } from '../server/db';
import { organizations } from '../shared/schema';
import { sql } from 'drizzle-orm';

const DEFAULT_ORG_ID = '1';
const DEFAULT_ORG_NAME = 'Julie\'s Family Learning Program';
const DEFAULT_ORG_SLUG = 'julies-family-learning';

// List of all tables that now have organization_id column
const TABLES_WITH_ORG_ID = [
  'leads', 'content', 'programs', 'events', 'donations', 'volunteers', 
  'users', 'communications', 'tasks', 'personas', 'funnel_stages', 
  'persona_journey_content', 'image_assets', 'testimonials', 'impact_stories',
  'volunteer_roles', 'event_registrations', 'subscription_plans', 'transactions',
  'donor_tiers', 'donor_lifecycle_stages', 'donor_lifecycle_history', 
  'google_reviews', 'payment_methods', 'saved_payment_methods', 'segments',
  'segment_members', 'email_campaigns', 'sms_campaigns', 'email_opens',
  'email_clicks', 'communication_preferences', 'passions', 'lead_passions',
  'program_passions', 'content_passions', 'ab_tests', 'ab_test_configurations',
  'ab_test_assignments', 'ab_test_metrics', 'backup_schedules', 'student_projects',
  'hormozi_templates', 'template_variables', 'template_variable_options',
  'lead_status_history', 'sms_campaign_sends', 'email_reports', 'scheduled_reports',
  'report_executions', 'email_unsubscribes', 'sms_unsubscribes', 'calendar_events',
  'volunteer_activities', 'volunteer_hours', 'volunteer_enrollments', 'media_library',
  'object_storage_files', 'object_storage_folders', 'cloudinary_assets',
  'ai_automation_rules', 'automation_executions', 'metric_weight_profiles',
  'audit_logs', 'sessions', 'program_entitlements', 'bulk_imports'
];

async function migrateToMultiTenant() {
  console.log('🚀 Starting multi-tenant migration...\n');
  
  try {
    // Step 1: Create default organization
    console.log(`📦 Creating default organization: "${DEFAULT_ORG_NAME}"...`);
    
    await db.insert(organizations).values({
      id: DEFAULT_ORG_ID,
      name: DEFAULT_ORG_NAME,
      slug: DEFAULT_ORG_SLUG,
      tier: 'enterprise', // Julie's gets full access
      status: 'active',
      primaryColor: '#3b82f6',
      subscriptionStatus: 'active'
    }).onConflictDoUpdate({
      target: organizations.id,
      set: {
        name: DEFAULT_ORG_NAME,
        slug: DEFAULT_ORG_SLUG,
        tier: 'enterprise'
      }
    });
    
    console.log('✅ Default organization created\n');
    
    // Step 2: Migrate all existing data to organizationId = 1
    console.log('🔄 Migrating existing data to default organization...\n');
    
    let totalUpdated = 0;
    
    for (const tableName of TABLES_WITH_ORG_ID) {
      try {
        // Update all rows where organization_id is NULL
        const result = await db.execute(
          sql.raw(`
            UPDATE ${tableName} 
            SET organization_id = '${DEFAULT_ORG_ID}' 
            WHERE organization_id IS NULL
          `)
        );
        
        const rowsUpdated = result.rowCount || 0;
        if (rowsUpdated > 0) {
          console.log(`  ✓ ${tableName}: ${rowsUpdated} rows`);
          totalUpdated += rowsUpdated;
        }
      } catch (error: any) {
        // Table might not exist or have no rows - that's okay
        console.log(`  ⚠ ${tableName}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Migration complete! ${totalUpdated} total rows updated.\n`);
    
    // Step 3: Verify migration
    console.log('🔍 Verifying migration...\n');
    
    const orgResult = await db.execute(
      sql`SELECT id, name, slug, tier FROM organizations WHERE id = ${DEFAULT_ORG_ID}`
    );
    
    if (orgResult.rows.length > 0) {
      console.log('Organization details:');
      console.log(orgResult.rows[0]);
    }
    
    // Count records for a few key tables
    const keyTables = ['leads', 'content', 'events', 'donations'];
    console.log('\nRecord counts by organization:');
    
    for (const tableName of keyTables) {
      try {
        const countResult = await db.execute(
          sql.raw(`SELECT COUNT(*) as count FROM ${tableName} WHERE organization_id = '${DEFAULT_ORG_ID}'`)
        );
        console.log(`  ${tableName}: ${countResult.rows[0].count}`);
      } catch (error) {
        // Table might not exist - skip
      }
    }
    
    console.log('\n✅ Multi-tenant migration successful!\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateToMultiTenant()
  .then(() => {
    console.log('Migration script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
