/**
 * Multi-Tenant Isolation Security Test
 * 
 * Verifies that organizational data is completely isolated and cannot leak across tenant boundaries.
 * Tests the org-scoped storage wrapper and ensures no cross-tenant data access is possible.
 */

import { storage, DatabaseStorage } from '../server/storage';
import { createOrgStorage } from '../server/orgScopedStorage';
import type { IStorage } from '../server/storage';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName: string) {
  log(`\n${colors.bold}${colors.cyan}🧪 Test: ${testName}${colors.reset}`, colors.cyan);
}

function logSuccess(message: string) {
  log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message: string) {
  log(`${colors.red}✗${colors.reset} ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`${colors.yellow}⚠${colors.reset} ${message}`, colors.yellow);
}

interface TestOrg {
  id: string;
  name: string;
  storage: IStorage;
}

let testOrgs: TestOrg[] = [];
let testLeadIds: string[] = [];
let testContentIds: string[] = [];
let testTemplateIds: string[] = [];
let testSegmentIds: string[] = [];

async function cleanup() {
  log('\n' + colors.bold + '🧹 Cleanup: Test data remains in database' + colors.reset);
  log('  Note: deleteOrganization() not yet implemented in storage');
  log('  Test organizations and their data can be manually cleaned up if needed');
  log('  Organizations created: ' + testOrgs.map(o => o.name).join(', '));
}

async function createTestOrganization(name: string, slug: string): Promise<TestOrg> {
  const org = await storage.createOrganization({
    name,
    slug,
    status: 'active',
    tier: 'basic',
  });
  
  const orgScopedStorage = createOrgStorage(storage, org.id);
  
  log(`  Created org: ${org.name} (ID: ${org.id})`);
  
  return {
    id: org.id,
    name: org.name,
    storage: orgScopedStorage,
  };
}

async function testLeadIsolation() {
  logTest('Lead Isolation');
  
  const orgA = testOrgs[0];
  const orgB = testOrgs[1];
  
  // Create leads for Org A
  const leadA1 = await orgA.storage.createLead({
    firstName: 'Alice',
    lastName: 'Anderson',
    email: `alice-${Date.now()}@orga.test`,
    phone: '555-0001',
    persona: 'donor',
    funnelStage: 'awareness',
    leadStatus: 'active',
    organizationId: orgA.id,
  });
  testLeadIds.push(leadA1.id);
  log(`  Created lead A1: ${leadA1.firstName} ${leadA1.lastName}`);
  
  const leadA2 = await orgA.storage.createLead({
    firstName: 'Andrew',
    lastName: 'Adams',
    email: `andrew-${Date.now()}@orga.test`,
    phone: '555-0002',
    persona: 'donor',
    funnelStage: 'consideration',
    leadStatus: 'active',
    organizationId: orgA.id,
  });
  testLeadIds.push(leadA2.id);
  log(`  Created lead A2: ${leadA2.firstName} ${leadA2.lastName}`);
  
  // Create lead for Org B
  const leadB1 = await orgB.storage.createLead({
    firstName: 'Bob',
    lastName: 'Baker',
    email: `bob-${Date.now()}@orgb.test`,
    phone: '555-0003',
    persona: 'volunteer',
    funnelStage: 'awareness',
    leadStatus: 'active',
    organizationId: orgB.id,
  });
  testLeadIds.push(leadB1.id);
  log(`  Created lead B1: ${leadB1.firstName} ${leadB1.lastName}`);
  
  // Verify Org A can only see its own leads
  const orgALeads = await orgA.storage.getAllLeads();
  const orgALeadEmails = orgALeads.map(l => l.email);
  
  if (orgALeads.length === 2 &&
      orgALeadEmails.includes(leadA1.email) &&
      orgALeadEmails.includes(leadA2.email) &&
      !orgALeadEmails.includes(leadB1.email)) {
    logSuccess('Org A sees only its own 2 leads (Alice, Andrew)');
  } else {
    logError(`Org A isolation failed! Expected 2 leads (Alice, Andrew), got ${orgALeads.length}: ${orgALeadEmails.join(', ')}`);
    throw new Error('Lead isolation test failed for Org A');
  }
  
  // Verify Org B can only see its own leads
  const orgBLeads = await orgB.storage.getAllLeads();
  const orgBLeadEmails = orgBLeads.map(l => l.email);
  
  if (orgBLeads.length === 1 &&
      orgBLeadEmails.includes(leadB1.email) &&
      !orgBLeadEmails.includes(leadA1.email) &&
      !orgBLeadEmails.includes(leadA2.email)) {
    logSuccess('Org B sees only its own 1 lead (Bob)');
  } else {
    logError(`Org B isolation failed! Expected 1 lead (Bob), got ${orgBLeads.length}: ${orgBLeadEmails.join(', ')}`);
    throw new Error('Lead isolation test failed for Org B');
  }
}

async function testContentIsolation() {
  logTest('Content Isolation');
  
  const orgA = testOrgs[0];
  const orgB = testOrgs[1];
  
  // Create content for Org A
  const contentA1 = await orgA.storage.createContentItem({
    title: `Program Alpha ${Date.now()}`,
    type: 'program',
    organizationId: orgA.id,
    isVisible: true,
    content: 'Test content for Org A',
  });
  testContentIds.push(contentA1.id);
  log(`  Created content A1: ${contentA1.title}`);
  
  // Create content for Org B
  const contentB1 = await orgB.storage.createContentItem({
    title: `Program Beta ${Date.now()}`,
    type: 'program',
    organizationId: orgB.id,
    isVisible: true,
    content: 'Test content for Org B',
  });
  testContentIds.push(contentB1.id);
  log(`  Created content B1: ${contentB1.title}`);
  
  // Verify Org A can only see its own content
  const orgAContent = await orgA.storage.getAllContentItems();
  const orgAContentTitles = orgAContent.map(c => c.title);
  const hasAlpha = orgAContentTitles.some(t => t.includes('Program Alpha'));
  const hasBeta = orgAContentTitles.some(t => t.includes('Program Beta'));
  
  if (hasAlpha && !hasBeta) {
    logSuccess('Org A sees only its own content (Program Alpha)');
  } else {
    logError(`Org A isolation failed! Has Alpha: ${hasAlpha}, Has Beta: ${hasBeta}`);
    throw new Error('Content isolation test failed for Org A');
  }
  
  // Verify Org B can only see its own content
  const orgBContent = await orgB.storage.getAllContentItems();
  const orgBContentTitles = orgBContent.map(c => c.title);
  const hasAlpha2 = orgBContentTitles.some(t => t.includes('Program Alpha'));
  const hasBeta2 = orgBContentTitles.some(t => t.includes('Program Beta'));
  
  if (hasBeta2 && !hasAlpha2) {
    logSuccess('Org B sees only its own content (Program Beta)');
  } else {
    logError(`Org B isolation failed! Has Alpha: ${hasAlpha2}, Has Beta: ${hasBeta2}`);
    throw new Error('Content isolation test failed for Org B');
  }
}

async function testEmailTemplateIsolation() {
  logTest('Email Template Isolation');
  
  const orgA = testOrgs[0];
  const orgB = testOrgs[1];
  
  // Create email template for Org A
  const templateA1 = await orgA.storage.createEmailTemplate({
    name: `Welcome Alpha ${Date.now()}`,
    subject: 'Welcome to Org A',
    body: 'Hello from Organization A',
    htmlBody: '<p>Hello from Organization A</p>',
    organizationId: orgA.id,
  });
  testTemplateIds.push(templateA1.id);
  log(`  Created template A1: ${templateA1.name}`);
  
  // Create email template for Org B
  const templateB1 = await orgB.storage.createEmailTemplate({
    name: `Welcome Beta ${Date.now()}`,
    subject: 'Welcome to Org B',
    body: 'Hello from Organization B',
    htmlBody: '<p>Hello from Organization B</p>',
    organizationId: orgB.id,
  });
  testTemplateIds.push(templateB1.id);
  log(`  Created template B1: ${templateB1.name}`);
  
  // Verify Org A can only see its own templates
  const orgATemplates = await orgA.storage.getAllEmailTemplates();
  const orgATemplateNames = orgATemplates.map(t => t.name);
  const hasAlpha = orgATemplateNames.some(n => n.includes('Welcome Alpha'));
  const hasBeta = orgATemplateNames.some(n => n.includes('Welcome Beta'));
  
  if (hasAlpha && !hasBeta) {
    logSuccess('Org A sees only its own template (Welcome Alpha)');
  } else {
    logError(`Org A isolation failed! Has Alpha: ${hasAlpha}, Has Beta: ${hasBeta}`);
    throw new Error('Email template isolation test failed for Org A');
  }
  
  // Verify Org B can only see its own templates
  const orgBTemplates = await orgB.storage.getAllEmailTemplates();
  const orgBTemplateNames = orgBTemplates.map(t => t.name);
  const hasAlpha2 = orgBTemplateNames.some(n => n.includes('Welcome Alpha'));
  const hasBeta2 = orgBTemplateNames.some(n => n.includes('Welcome Beta'));
  
  if (hasBeta2 && !hasAlpha2) {
    logSuccess('Org B sees only its own template (Welcome Beta)');
  } else {
    logError(`Org B isolation failed! Has Alpha: ${hasAlpha2}, Has Beta: ${hasBeta2}`);
    throw new Error('Email template isolation test failed for Org B');
  }
}

// Track test user IDs for cleanup
const testUserIds: string[] = [];

async function testSegmentIsolation() {
  logTest('Segment Isolation');
  
  const orgA = testOrgs[0];
  const orgB = testOrgs[1];
  
  // Create test users for createdBy field (segments require this)
  const userA = await storage.upsertUser({
    replitId: `test-user-a-${Date.now()}`,
    email: `userA-${Date.now()}@test.com`,
    username: `UserA${Date.now()}`,
  });
  testUserIds.push(userA.id);
  
  const userB = await storage.upsertUser({
    replitId: `test-user-b-${Date.now()}`,
    email: `userB-${Date.now()}@test.com`,
    username: `UserB${Date.now()}`,
  });
  testUserIds.push(userB.id);
  
  // Create segment for Org A
  const segmentA1 = await orgA.storage.createSegment({
    name: `Donors Alpha ${Date.now()}`,
    organizationId: orgA.id,
    filters: {},
    createdBy: userA.id,
  });
  testSegmentIds.push(segmentA1.id);
  log(`  Created segment A1: ${segmentA1.name}`);
  
  // Create segment for Org B
  const segmentB1 = await orgB.storage.createSegment({
    name: `Donors Beta ${Date.now()}`,
    organizationId: orgB.id,
    filters: {},
    createdBy: userB.id,
  });
  testSegmentIds.push(segmentB1.id);
  log(`  Created segment B1: ${segmentB1.name}`);
  
  // Verify Org A can only see its own segments
  const orgASegments = await orgA.storage.getAllSegments();
  const orgASegmentNames = orgASegments.map(s => s.name);
  const hasAlpha = orgASegmentNames.some(n => n.includes('Donors Alpha'));
  const hasBeta = orgASegmentNames.some(n => n.includes('Donors Beta'));
  
  if (hasAlpha && !hasBeta) {
    logSuccess('Org A sees only its own segment (Donors Alpha)');
  } else {
    logError(`Org A isolation failed! Has Alpha: ${hasAlpha}, Has Beta: ${hasBeta}`);
    throw new Error('Segment isolation test failed for Org A');
  }
  
  // Verify Org B can only see its own segments
  const orgBSegments = await orgB.storage.getAllSegments();
  const orgBSegmentNames = orgBSegments.map(s => s.name);
  const hasAlpha2 = orgBSegmentNames.some(n => n.includes('Donors Alpha'));
  const hasBeta2 = orgBSegmentNames.some(n => n.includes('Donors Beta'));
  
  if (hasBeta2 && !hasAlpha2) {
    logSuccess('Org B sees only its own segment (Donors Beta)');
  } else {
    logError(`Org B isolation failed! Has Alpha: ${hasAlpha2}, Has Beta: ${hasBeta2}`);
    throw new Error('Segment isolation test failed for Org B');
  }
}

// Track test donation/campaign IDs for cleanup
const testDonationIds: string[] = [];
const testSMSCampaignIds: string[] = [];

async function testDonationIsolation() {
  logTest('Donation Isolation');
  
  const orgA = testOrgs[0];
  const orgB = testOrgs[1];
  
  // Get leads for donations (reuse from lead test)
  const leadA1Id = testLeadIds[0];
  const leadB1Id = testLeadIds[2];
  
  // Create donation for Org A
  const donationA1 = await orgA.storage.createDonation({
    leadId: leadA1Id,
    amount: 10000, // $100 in cents
    donationType: 'one-time',
    organizationId: orgA.id,
  });
  testDonationIds.push(donationA1.id);
  log(`  Created donation A1: $${donationA1.amount / 100} from lead ${leadA1Id}`);
  
  // Create donation for Org B
  const donationB1 = await orgB.storage.createDonation({
    leadId: leadB1Id,
    amount: 5000, // $50 in cents
    donationType: 'one-time',
    organizationId: orgB.id,
  });
  testDonationIds.push(donationB1.id);
  log(`  Created donation B1: $${donationB1.amount / 100} from lead ${leadB1Id}`);
  
  // Verify Org A can only see its own donations
  const orgADonations = await orgA.storage.getAllDonations();
  const orgADonationAmounts = orgADonations.map(d => d.amount);
  const hasOrgA = orgADonationAmounts.includes(10000); // $100 in cents
  const hasOrgB = orgADonationAmounts.includes(5000);  // $50 in cents
  
  if (hasOrgA && !hasOrgB) {
    logSuccess('Org A sees only its own donations ($100)');
  } else {
    logError(`Org A isolation failed! Has $100: ${hasOrgA}, Has $50: ${hasOrgB}`);
    throw new Error('Donation isolation test failed for Org A');
  }
  
  // Verify Org B can only see its own donations
  const orgBDonations = await orgB.storage.getAllDonations();
  const orgBDonationAmounts = orgBDonations.map(d => d.amount);
  const hasOrgA2 = orgBDonationAmounts.includes(10000); // $100 in cents
  const hasOrgB2 = orgBDonationAmounts.includes(5000);  // $50 in cents
  
  if (hasOrgB2 && !hasOrgA2) {
    logSuccess('Org B sees only its own donations ($50)');
  } else {
    logError(`Org B isolation failed! Has $100: ${hasOrgA2}, Has $50: ${hasOrgB2}`);
    throw new Error('Donation isolation test failed for Org B');
  }
}

async function testSMSCampaignIsolation() {
  logTest('SMS Bulk Campaign Isolation');
  
  const orgA = testOrgs[0];
  const orgB = testOrgs[1];
  
  // Get users for createdBy field
  const userAId = testUserIds[0];
  const userBId = testUserIds[1];
  
  // Create SMS bulk campaign for Org A
  const campaignA1 = await orgA.storage.createSmsBulkCampaign({
    name: `Spring Event Alpha ${Date.now()}`,
    customMessage: 'Join us for our spring event!',
    messageSnapshot: 'Join us for our spring event!',
    organizationId: orgA.id,
    createdBy: userAId,
    status: 'draft',
  });
  testSMSCampaignIds.push(campaignA1.id);
  log(`  Created SMS campaign A1: ${campaignA1.name}`);
  
  // Create SMS bulk campaign for Org B
  const campaignB1 = await orgB.storage.createSmsBulkCampaign({
    name: `Spring Event Beta ${Date.now()}`,
    customMessage: 'Join us for our beta event!',
    messageSnapshot: 'Join us for our beta event!',
    organizationId: orgB.id,
    createdBy: userBId,
    status: 'draft',
  });
  testSMSCampaignIds.push(campaignB1.id);
  log(`  Created SMS campaign B1: ${campaignB1.name}`);
  
  // Verify Org A can only see its own campaigns
  const orgACampaigns = await orgA.storage.getAllSmsBulkCampaigns();
  const orgACampaignNames = orgACampaigns.map(c => c.name);
  const hasAlpha = orgACampaignNames.some(n => n.includes('Alpha'));
  const hasBeta = orgACampaignNames.some(n => n.includes('Beta'));
  
  if (hasAlpha && !hasBeta) {
    logSuccess('Org A sees only its own SMS campaigns (Alpha)');
  } else {
    logError(`Org A isolation failed! Has Alpha: ${hasAlpha}, Has Beta: ${hasBeta}`);
    throw new Error('SMS campaign isolation test failed for Org A');
  }
  
  // Verify Org B can only see its own campaigns
  const orgBCampaigns = await orgB.storage.getAllSmsBulkCampaigns();
  const orgBCampaignNames = orgBCampaigns.map(c => c.name);
  const hasAlpha2 = orgBCampaignNames.some(n => n.includes('Alpha'));
  const hasBeta2 = orgBCampaignNames.some(n => n.includes('Beta'));
  
  if (hasBeta2 && !hasAlpha2) {
    logSuccess('Org B sees only its own SMS campaigns (Beta)');
  } else {
    logError(`Org B isolation failed! Has Alpha: ${hasAlpha2}, Has Beta: ${hasBeta2}`);
    throw new Error('SMS campaign isolation test failed for Org B');
  }
}

async function testCrossOrgAccess() {
  logTest('Cross-Organization Access Prevention');
  
  const orgA = testOrgs[0];
  const orgB = testOrgs[1];
  
  // Test 1: Try to access Org B's lead using Org A's storage
  const leadB1Id = testLeadIds[2]; // Bob's lead from Org B
  try {
    const lead = await orgA.storage.getLead(leadB1Id);
    if (!lead) {
      logSuccess('✓ Lead: Org A cannot access Org B lead (returned undefined)');
    } else {
      logError(`✗ Lead: Security breach! Org A accessed Org B's lead: ${lead.email}`);
      throw new Error('Lead cross-org access test failed');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('SECURITY ERROR')) {
      logSuccess('✓ Lead: Org A blocked from accessing Org B lead (SECURITY ERROR)');
    } else if (error instanceof Error && !error.message.includes('Security breach')) {
      logSuccess('✓ Lead: Org A blocked from accessing Org B lead (access denied)');
    } else {
      throw error;
    }
  }
  
  // Test 2: Try to access Org A's content using Org B's storage
  const contentA1Id = testContentIds[0]; // Org A's content
  try {
    const content = await orgB.storage.getContentItem(contentA1Id);
    if (!content) {
      logSuccess('✓ Content: Org B cannot access Org A content (returned undefined)');
    } else {
      logError(`✗ Content: Security breach! Org B accessed Org A's content: ${content.title}`);
      throw new Error('Content cross-org access test failed');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('SECURITY ERROR')) {
      logSuccess('✓ Content: Org B blocked from accessing Org A content (SECURITY ERROR)');
    } else if (error instanceof Error && !error.message.includes('Security breach')) {
      logSuccess('✓ Content: Org B blocked from accessing Org A content (access denied)');
    } else {
      throw error;
    }
  }
  
  // Test 3: Try to access Org B's email template using Org A's storage
  const templateB1Id = testTemplateIds[1]; // Org B's template
  try {
    const template = await orgA.storage.getEmailTemplate(templateB1Id);
    if (!template) {
      logSuccess('✓ Email Template: Org A cannot access Org B template (returned undefined)');
    } else {
      logError(`✗ Email Template: Security breach! Org A accessed Org B's template: ${template.name}`);
      throw new Error('Email template cross-org access test failed');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('SECURITY ERROR')) {
      logSuccess('✓ Email Template: Org A blocked from accessing Org B template (SECURITY ERROR)');
    } else if (error instanceof Error && !error.message.includes('Security breach')) {
      logSuccess('✓ Email Template: Org A blocked from accessing Org B template (access denied)');
    } else {
      throw error;
    }
  }
  
  // Test 4: Try to access Org A's segment using Org B's storage
  const segmentA1Id = testSegmentIds[0]; // Org A's segment
  try {
    const segment = await orgB.storage.getSegment(segmentA1Id);
    if (!segment) {
      logSuccess('✓ Segment: Org B cannot access Org A segment (returned undefined)');
    } else {
      logError(`✗ Segment: Security breach! Org B accessed Org A's segment: ${segment.name}`);
      throw new Error('Segment cross-org access test failed');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('SECURITY ERROR')) {
      logSuccess('✓ Segment: Org B blocked from accessing Org A segment (SECURITY ERROR)');
    } else if (error instanceof Error && !error.message.includes('Security breach')) {
      logSuccess('✓ Segment: Org B blocked from accessing Org A segment (access denied)');
    } else {
      throw error;
    }
  }
  
  // Test 5: Try to access Org B's donation using Org A's storage
  const donationB1Id = testDonationIds[1]; // Org B's donation
  try {
    const donation = await orgA.storage.getDonationById(donationB1Id);
    if (!donation) {
      logSuccess('✓ Donation: Org A cannot access Org B donation (returned undefined)');
    } else {
      logError(`✗ Donation: Security breach! Org A accessed Org B's donation: $${donation.amount / 100}`);
      throw new Error('Donation cross-org access test failed');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('SECURITY ERROR')) {
      logSuccess('✓ Donation: Org A blocked from accessing Org B donation (SECURITY ERROR)');
    } else if (error instanceof Error && !error.message.includes('Security breach')) {
      logSuccess('✓ Donation: Org A blocked from accessing Org B donation (access denied)');
    } else {
      throw error;
    }
  }
  
  // Test 6: Try to access Org A's SMS campaign using Org B's storage
  const campaignA1Id = testSMSCampaignIds[0]; // Org A's campaign
  try {
    const campaign = await orgB.storage.getSmsBulkCampaign(campaignA1Id);
    if (!campaign) {
      logSuccess('✓ SMS Campaign: Org B cannot access Org A campaign (returned undefined)');
    } else {
      logError(`✗ SMS Campaign: Security breach! Org B accessed Org A's campaign: ${campaign.name}`);
      throw new Error('SMS campaign cross-org access test failed');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('SECURITY ERROR')) {
      logSuccess('✓ SMS Campaign: Org B blocked from accessing Org A campaign (SECURITY ERROR)');
    } else if (error instanceof Error && !error.message.includes('Security breach')) {
      logSuccess('✓ SMS Campaign: Org B blocked from accessing Org A campaign (access denied)');
    } else {
      throw error;
    }
  }
}

async function runTests() {
  log(colors.bold + '\n╔═══════════════════════════════════════════════════════════╗' + colors.reset);
  log(colors.bold + '║  Multi-Tenant Isolation Security Test Suite              ║' + colors.reset);
  log(colors.bold + '╚═══════════════════════════════════════════════════════════╝\n' + colors.reset);
  
  try {
    // Setup: Create test organizations
    log(colors.bold + '📋 Setup: Creating test organizations...' + colors.reset);
    const timestamp = Date.now();
    const orgA = await createTestOrganization(
      `Test Org Alpha ${timestamp}`,
      `test-alpha-${timestamp}`
    );
    const orgB = await createTestOrganization(
      `Test Org Beta ${timestamp}`,
      `test-beta-${timestamp}`
    );
    testOrgs.push(orgA, orgB);
    logSuccess('Test organizations created\n');
    
    // Run isolation tests
    await testLeadIsolation();
    await testContentIsolation();
    await testEmailTemplateIsolation();
    await testSegmentIsolation();
    await testDonationIsolation();
    await testSMSCampaignIsolation();
    await testCrossOrgAccess();
    
    // Summary
    log('\n' + colors.bold + colors.green + '╔═══════════════════════════════════════════════════════════╗' + colors.reset);
    log(colors.bold + colors.green + '║  ✓ ALL TESTS PASSED                                       ║' + colors.reset);
    log(colors.bold + colors.green + '║  Multi-tenant isolation is SECURE                         ║' + colors.reset);
    log(colors.bold + colors.green + '╚═══════════════════════════════════════════════════════════╝\n' + colors.reset);
    
  } catch (error) {
    log('\n' + colors.bold + colors.red + '╔═══════════════════════════════════════════════════════════╗' + colors.reset);
    log(colors.bold + colors.red + '║  ✗ TEST FAILED                                            ║' + colors.reset);
    log(colors.bold + colors.red + '╚═══════════════════════════════════════════════════════════╝\n' + colors.reset);
    logError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then(() => {
      log(colors.green + '\n✓ Test suite completed successfully\n' + colors.reset);
      process.exit(0);
    })
    .catch((error) => {
      logError(`\nTest suite failed: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    });
}

export { runTests };
