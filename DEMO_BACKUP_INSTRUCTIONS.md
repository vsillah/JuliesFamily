# Demo State Backup Instructions

## Overview
To preserve the current demo state with all the realistic data created (18 leads, donation campaigns, student enrollments, email/SMS tracking, etc.), you should create backups of the key database tables.

## Using the Admin Backup UI

### Access the Backup Manager
1. Log in as an administrator
2. Navigate to `/admin/backup` or click "Backup Manager" in the admin menu
3. The backup system allows surgical, table-level backups

### Tables to Backup for Complete Demo State

#### Essential Tables (Backup These First)
1. **leads** - Contains all 18 demo leads with engagement scores
2. **donation_campaigns** - Active campaigns with goals and progress
3. **donations** - Individual donation records
4. **tech_goes_home_enrollments** - Student enrollment data
5. **email_logs** - Sent email tracking
6. **email_opens** - Email open events
7. **email_clicks** - Link click tracking
8. **sms_sends** - SMS delivery records
9. **segments** - Audience segmentation filters
10. **users** - Demo user accounts (Maria, James, Sarah, Admin)

#### Supporting Tables (Backup If Time Permits)
11. **volunteer_events** - Volunteer opportunities
12. **volunteer_shifts** - Shift scheduling
13. **volunteer_enrollments** - Volunteer registrations
14. **volunteer_session_logs** - Volunteer activity logs
15. **email_unsubscribes** - Opt-out tracking
16. **ab_tests** - Active A/B tests

### Creating Each Backup

For each table:
1. Click "Create Backup" button
2. Select the table from dropdown
3. Enter backup name: `DEMO_[TableName]_[Date]`
   - Example: `DEMO_leads_2025-11-13`
4. Enter description: "Demo state backup for JFLP unveiling - [table purpose]"
   - Example: "Demo state backup for JFLP unveiling - 18 realistic leads across all funnel stages"
5. Click "Create Backup"
6. Wait for confirmation

### Estimated Time
- Each table backup: 10-30 seconds
- Total for 10 essential tables: ~5 minutes
- Complete backup (all 16 tables): ~10 minutes

## Quick Backup (Minimum Required)

If time is limited, backup only these 5 tables to preserve the most important demo data:

1. **leads** - All CRM data and engagement history
2. **email_logs** - Email campaign tracking
3. **donation_campaigns** - Active fundraising campaigns
4. **tech_goes_home_enrollments** - Student program data
5. **segments** - Audience targeting configurations

## Restoring Demo State

### To Restore from Backup:
1. Navigate to `/admin/backup`
2. Find the backup you want to restore
3. Click "Restore" button
4. Confirm the restoration
5. Wait for completion

**Important:** Restoration will replace current table data with backed-up data. Any changes made after the backup was created will be lost.

## Alternative: SQL Export

If you prefer a complete database export:

```bash
# Connect to the database and export all data
pg_dump $DATABASE_URL > demo_state_$(date +%Y%m%d).sql

# To restore later:
psql $DATABASE_URL < demo_state_YYYYMMDD.sql
```

## Verification After Backup

After creating backups, verify they were successful:

1. Navigate to `/admin/backup`
2. Check "Backups" list
3. Confirm you see entries for each backed-up table
4. Check the "Row Count" column to ensure data was captured
5. Note the "Created At" timestamp for reference

## Demo Data Summary (For Reference)

### What's Included in Demo State:
- ✅ **18 Realistic Leads** - Varied personas, funnel stages, engagement scores
- ✅ **7 Active Donation Campaigns** - With realistic goals and progress
- ✅ **15 Student Enrollments** - Different progress stages
- ✅ **5 Email Campaigns** - With open/click tracking
- ✅ **3 SMS Sends** - All delivered successfully
- ✅ **5 Audience Segments** - Demonstrating filter capabilities
- ✅ **6 Active A/B Tests** - Various optimization experiments
- ✅ **4 Demo Users** - Maria (parent), James (student), Sarah (volunteer), Admin
- ✅ **Volunteer Events** - With shifts and session logs

### Critical Data Relationships:
- Leads → Email Logs → Email Opens/Clicks (engagement tracking chain)
- Donation Campaigns → Donations (fundraising tracking)
- Users → Tech Goes Home Enrollments (student progress)
- Users → Volunteer Enrollments → Session Logs (volunteer tracking)
- Segments → Filter Criteria (audience targeting)

## Backup Naming Convention

Recommended naming format:
```
DEMO_[TableName]_[YYYY-MM-DD]_[Purpose]

Examples:
- DEMO_leads_2025-11-13_JFLP_Unveiling
- DEMO_donation_campaigns_2025-11-13_Active_Campaigns
- DEMO_email_logs_2025-11-13_Engagement_Tracking
```

## Scheduled Backups (Optional)

To preserve demo state automatically:

1. Navigate to `/admin/backup`
2. Click "Create Schedule" button
3. Configure:
   - **Frequency:** Daily
   - **Time:** 2:00 AM
   - **Tables:** Select all demo-critical tables
   - **Retention:** Keep last 7 backups
   - **Backup Name Pattern:** `AUTO_DEMO_[TableName]_[Date]`

This ensures you always have recent backups of the demo state.

## Restoration Scenarios

### Scenario 1: Demo Data Corrupted
If demo data gets modified or corrupted during testing:
1. Go to `/admin/backup`
2. Find most recent backup of affected table
3. Click "Restore"
4. Verify data is back to demo state

### Scenario 2: Need Fresh Demo State
To reset everything back to pristine demo condition:
1. Restore all 10 essential table backups
2. Verify in CRM that leads are correct
3. Check donation campaigns are showing proper progress
4. Confirm email tracking data is intact

### Scenario 3: Preparing for Another Demo
Before your next demo presentation:
1. Check if any demo data was modified
2. Restore from backups if needed
3. Verify all key numbers match the demo script
4. Test one or two key features to ensure everything works

## Support Contact

If you encounter issues with backups:
- Check the browser console for error messages
- Verify you're logged in as admin/super_admin
- Ensure database connection is stable
- Contact technical support if problems persist

---

**Created:** November 13, 2025  
**Purpose:** Preserve demo state for JFLP platform unveiling  
**Related:** See DEMO_SCRIPT.md for complete demo walkthrough
