import { db } from '../db';
import { leads, smsBulkCampaigns, smsSends, emailUnsubscribes, smsTemplates, communicationLogs } from '../db/schema';
import { eq, and, or, sql, inArray } from 'drizzle-orm';
import type { SmsBulkCampaign, Lead, SmsTemplate } from '@db/schema';

interface ProcessingResult {
  success: boolean;
  sentCount: number;
  blockedCount: number;
  failedCount: number;
  errors: string[];
}

export async function processBulkSmsCampaign(campaignId: string): Promise<ProcessingResult> {
  console.log(`[BulkSmsSender] Starting campaign ${campaignId}`);
  
  const result: ProcessingResult = {
    success: false,
    sentCount: 0,
    blockedCount: 0,
    failedCount: 0,
    errors: []
  };
  
  try {
    // Get campaign details
    const [campaign] = await db
      .select()
      .from(smsBulkCampaigns)
      .where(eq(smsBulkCampaigns.id, campaignId));
    
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    
    // Update status to processing
    await db
      .update(smsBulkCampaigns)
      .set({ status: 'processing' })
      .where(eq(smsBulkCampaigns.id, campaignId));
    
    // Get message content (template or custom)
    let messageContent: string;
    let template: SmsTemplate | undefined;
    
    if (campaign.templateId) {
      const [tmpl] = await db
        .select()
        .from(smsTemplates)
        .where(eq(smsTemplates.id, campaign.templateId));
      
      if (!tmpl) {
        throw new Error(`Template ${campaign.templateId} not found`);
      }
      template = tmpl;
      messageContent = template.messageTemplate;
    } else if (campaign.customMessage) {
      messageContent = campaign.customMessage;
    } else {
      throw new Error('Campaign has no template or custom message');
    }
    
    // Build query conditions for eligible leads
    const conditions = [];
    conditions.push(sql`${leads.phone} IS NOT NULL`);
    
    if (campaign.personaFilter) {
      conditions.push(eq(leads.persona, campaign.personaFilter));
    }
    
    if (campaign.funnelStageFilter) {
      conditions.push(eq(leads.funnelStage, campaign.funnelStageFilter));
    }
    
    // Fetch eligible leads (exact query, same as preview)
    const eligibleLeads = await db
      .select()
      .from(leads)
      .where(
        and(
          ...conditions,
          sql`NOT EXISTS (
            SELECT 1 FROM ${emailUnsubscribes}
            WHERE ${emailUnsubscribes.phone} = ${leads.phone}
            AND ${emailUnsubscribes.isActive} = true
            AND (${emailUnsubscribes.channel} = 'sms' OR ${emailUnsubscribes.channel} = 'all')
          )`
        )
      );
    
    console.log(`[BulkSmsSender] Found ${eligibleLeads.length} eligible leads`);
    
    // Process leads in batches to respect rate limits
    const BATCH_SIZE = 50; // Twilio default is 1 msg/sec, batch for efficiency
    const BATCH_DELAY_MS = 60000; // 1 minute delay between batches
    
    for (let i = 0; i < eligibleLeads.length; i += BATCH_SIZE) {
      const batch = eligibleLeads.slice(i, i + BATCH_SIZE);
      console.log(`[BulkSmsSender] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(eligibleLeads.length / BATCH_SIZE)}`);
      
      // Process batch sequentially with rate limiting
      for (const lead of batch) {
        try {
          const sendResult = await sendSmsToLead(lead, messageContent, campaign, template);
          
          if (sendResult.blocked) {
            result.blockedCount++;
          } else if (sendResult.success) {
            result.sentCount++;
          } else {
            result.failedCount++;
            result.errors.push(`${lead.phone}: ${sendResult.error || 'Unknown error'}`);
          }
          
          // Rate limit: 1 msg/sec (Twilio default)
          await delay(1000);
        } catch (error: any) {
          console.error(`[BulkSmsSender] Failed to send to ${lead.phone}:`, error.message);
          result.failedCount++;
          result.errors.push(`${lead.phone}: ${error.message}`);
          
          // Persist failure audit trail even when exceptions occur
          try {
            const errorMessage = error.message || 'Unknown error';
            await db.insert(smsSends).values({
              templateId: template?.id || null,
              leadId: lead.id,
              campaignId: campaign.id,
              recipientPhone: lead.phone || '',
              recipientName: lead.firstName ? `${lead.firstName} ${lead.lastName || ''}`.trim() : null,
              messageContent: messageContent,
              status: 'failed',
              smsProvider: 'twilio',
              errorMessage,
              metadata: { campaignId: campaign.id, exception: errorMessage },
              sentAt: null
            });
            
            await db.insert(communicationLogs).values({
              leadId: lead.id,
              type: 'sms',
              direction: 'outbound',
              subject: 'Bulk SMS Campaign',
              body: messageContent,
              sentAt: null,
              status: 'failed',
              metadata: {
                campaignId: campaign.id,
                templateId: template?.id,
                error: errorMessage,
                exception: true
              }
            });
          } catch (auditError: any) {
            console.error(`[BulkSmsSender] Failed to persist audit trail:`, auditError.message);
          }
        }
      }
      
      // Update campaign metrics after each batch
      // Merge progress with existing metadata to preserve operational data
      const [currentCampaign] = await db
        .select({ metadata: smsBulkCampaigns.metadata })
        .from(smsBulkCampaigns)
        .where(eq(smsBulkCampaigns.id, campaignId));
      
      const existingMetadata = (currentCampaign?.metadata as Record<string, any>) || {};
      const updatedMetadata = {
        ...existingMetadata,
        progress: {
          processed: i + batch.length,
          total: eligibleLeads.length,
          sentCount: result.sentCount,
          blockedCount: result.blockedCount,
          failedCount: result.failedCount
        }
      };
      
      await db
        .update(smsBulkCampaigns)
        .set({
          sentCount: result.sentCount,
          blockedCount: result.blockedCount,
          failedCount: result.failedCount,
          metadata: updatedMetadata
        })
        .where(eq(smsBulkCampaigns.id, campaignId));
      
      // Delay between batches (except after last batch)
      if (i + BATCH_SIZE < eligibleLeads.length) {
        console.log(`[BulkSmsSender] Waiting ${BATCH_DELAY_MS}ms before next batch...`);
        await delay(BATCH_DELAY_MS);
      }
    }
    
    // Mark campaign as completed
    await db
      .update(smsBulkCampaigns)
      .set({
        status: 'completed',
        sentCount: result.sentCount,
        blockedCount: result.blockedCount,
        failedCount: result.failedCount,
        errorSummary: result.errors.length > 0 ? result.errors.join('; ').slice(0, 500) : null
      })
      .where(eq(smsBulkCampaigns.id, campaignId));
    
    result.success = true;
    console.log(`[BulkSmsSender] Campaign completed: ${result.sentCount} sent, ${result.blockedCount} blocked, ${result.failedCount} failed`);
    
  } catch (error: any) {
    console.error(`[BulkSmsSender] Campaign failed:`, error);
    
    // Mark campaign as failed
    await db
      .update(smsBulkCampaigns)
      .set({
        status: 'failed',
        errorSummary: error.message.slice(0, 500)
      })
      .where(eq(smsBulkCampaigns.id, campaignId));
    
    result.errors.push(error.message);
  }
  
  return result;
}

async function sendSmsToLead(
  lead: Lead,
  messageTemplate: string,
  campaign: SmsBulkCampaign,
  template?: SmsTemplate
): Promise<{ success: boolean; blocked: boolean; error?: string }> {
  const { sendSMS, replaceVariables } = await import('./twilio');
  
  if (!lead.phone) {
    return { success: false, blocked: false, error: 'Lead has no phone number' };
  }
  
  // Replace variables in message
  const variables = {
    firstName: lead.firstName || 'there',
    lastName: lead.lastName || '',
    email: lead.email || '',
    phone: lead.phone,
    cityName: '', // No location field in leads schema
    link: 'https://example.com', // TODO: Replace with actual link
    amount: '$50' // TODO: Replace with actual amount
  };
  
  const finalMessage = replaceVariables(messageTemplate, variables);
  
  // Send via Twilio (includes TCPA check)
  const twilioResult = await sendSMS(lead.phone, finalMessage, {
    leadId: lead.id,
    templateId: template?.id,
    campaignId: campaign.id
  });
  
  // Determine status based on Twilio response
  const status = twilioResult.blocked ? 'blocked' : 
                 twilioResult.success ? 'sent' : 
                 'failed';
  
  // Create SMS send record
  await db.insert(smsSends).values({
    templateId: template?.id || null,
    leadId: lead.id,
    campaignId: campaign.id,
    recipientPhone: lead.phone,
    recipientName: lead.firstName ? `${lead.firstName} ${lead.lastName || ''}`.trim() : null,
    messageContent: finalMessage,
    status,
    smsProvider: 'twilio',
    providerMessageId: twilioResult.messageId || null,
    errorMessage: twilioResult.error || null,
    metadata: { variables, campaignId: campaign.id },
    sentAt: twilioResult.success ? new Date() : null
  });
  
  // Create communication log entry
  await db.insert(communicationLogs).values({
    leadId: lead.id,
    type: 'sms',
    direction: 'outbound',
    subject: 'Bulk SMS Campaign',
    body: finalMessage,
    sentAt: twilioResult.success ? new Date() : null,
    status: twilioResult.success ? 'sent' : (twilioResult.blocked ? 'blocked' : 'failed'),
    metadata: {
      campaignId: campaign.id,
      templateId: template?.id,
      messageId: twilioResult.messageId,
      blocked: twilioResult.blocked,
      error: twilioResult.error
    }
  });
  
  return {
    success: twilioResult.success,
    blocked: twilioResult.blocked || false,
    error: twilioResult.error
  };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
