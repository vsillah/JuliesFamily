import sgMail from '@sendgrid/mail';
import type { IStorage } from './storage';
import { nanoid } from 'nanoid';
import * as cheerio from 'cheerio';
import { generateUnsubscribeUrl } from './utils/unsubscribeToken';

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY not configured - email sending will fail');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Default sender email (should be a verified sender in SendGrid)
const DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@juliesfamilylearning.org';
const DEFAULT_FROM_NAME = 'Julie\'s Family Learning Program';

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  metadata?: Record<string, any>;
  disableTracking?: boolean;
  leadId?: string | null;
}

/**
 * Renders an email template by replacing {{variables}} with actual values
 */
export function renderTemplate(template: string, variables: Record<string, any>): string {
  let rendered = template;
  
  // Replace all {{variable}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, String(value ?? ''));
  }
  
  return rendered;
}

/**
 * Prepare email content with tracking pixel and link rewriting
 * Returns modified HTML and link tracking data to be stored in database
 */
export function prepareTrackedEmailContent(
  baseUrl: string,
  html: string,
  trackingToken: string
): { html: string; links: Array<{ linkToken: string; targetUrl: string }> } {
  try {
    // Check if HTML has a body tag - if not, wrap it to ensure pixel placement
    const hasBody = /<body[^>]*>/i.test(html);
    const wrappedHtml = hasBody ? html : `<body>${html}</body>`;
    
    // Load HTML with cheerio (decodeEntities: true normalizes HTML entities)
    const $ = cheerio.load(wrappedHtml, { decodeEntities: true });
    
    // Inject tracking pixel at the end of body
    const trackingPixel = `<img src="${baseUrl}/track/open/${trackingToken}" width="1" height="1" style="display:none" alt="" />`;
    $('body').append(trackingPixel);
    
    // Track links that need to be stored in database
    const linksToTrack: Array<{ linkToken: string; targetUrl: string }> = [];
    
    // Rewrite all <a> href links to use click tracking
    $('a[href]').each((_, element) => {
      const $link = $(element);
      let originalHref = $link.attr('href');
      
      if (!originalHref) return;
      
      // Cheerio decodes entities, so we get the actual URL here
      // Trim whitespace that might have been added
      originalHref = originalHref.trim();
      
      // Skip mailto:, tel:, and anchor links
      if (
        originalHref.startsWith('mailto:') ||
        originalHref.startsWith('tel:') ||
        originalHref.startsWith('#')
      ) {
        return;
      }
      
      // Skip if already wrapped (defensive)
      if (originalHref.includes('/track/click/')) {
        return;
      }
      
      // Validate URL before encoding
      try {
        new URL(originalHref);
      } catch {
        // Invalid URL - skip tracking
        console.warn('[Email Tracking] Skipping invalid URL:', originalHref);
        return;
      }
      
      // Generate unique link token for this specific link
      const linkToken = nanoid();
      
      // Store link tracking data
      linksToTrack.push({
        linkToken,
        targetUrl: originalHref,
      });
      
      // Build tracking URL using link token (no URL in query string)
      const trackingUrl = `${baseUrl}/track/click/${linkToken}`;
      
      $link.attr('href', trackingUrl);
    });
    
    // Return HTML - if we added body wrapper, extract just the body content
    let finalHtml: string;
    if (!hasBody) {
      // Return inner HTML of body to avoid adding wrapper that SendGrid might strip
      finalHtml = $('body').html() || html;
    } else {
      finalHtml = $.html();
    }
    
    return {
      html: finalHtml,
      links: linksToTrack,
    };
    
  } catch (error) {
    console.error('[Email Tracking] Failed to prepare tracked content:', error);
    // Fail gracefully - return original HTML if parsing fails
    return {
      html,
      links: [],
    };
  }
}

/**
 * Send an email using SendGrid and log to database
 */
export async function sendEmail(
  storage: IStorage,
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string; skipped?: boolean }> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    // Check if email is unsubscribed
    const isUnsubscribed = await storage.isEmailUnsubscribed(options.to);
    if (isUnsubscribed) {
      console.log(`[Email] Skipping email to ${options.to} - unsubscribed`);
      
      // Log as skipped
      await storage.createEmailLog({
        templateId: options.templateId,
        recipientEmail: options.to,
        recipientName: options.toName,
        subject: options.subject,
        status: 'failed',
        emailProvider: 'sendgrid',
        errorMessage: 'Recipient has unsubscribed',
        leadId: options.leadId,
        metadata: { ...options.metadata, skippedReason: 'unsubscribed' },
      });
      
      return { success: false, error: 'Recipient has unsubscribed', skipped: true };
    }

    // Generate tracking token
    const trackingToken = nanoid();
    
    // Get base URL for tracking links
    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';
    
    // Generate unsubscribe URL for this email
    const unsubscribeUrl = generateUnsubscribeUrl(options.to, baseUrl);
    
    // Add unsubscribe link to HTML
    let htmlWithUnsubscribe = addUnsubscribeToHtml(options.html, unsubscribeUrl);
    
    // Add unsubscribe link to text
    let textWithUnsubscribe = options.text 
      ? addUnsubscribeToText(options.text, unsubscribeUrl)
      : addUnsubscribeToText(stripHtml(options.html), unsubscribeUrl);
    
    // Prepare HTML with tracking if not disabled
    let finalHtml = htmlWithUnsubscribe;
    let trackedLinks: Array<{ linkToken: string; targetUrl: string }> = [];
    
    if (!options.disableTracking) {
      const result = prepareTrackedEmailContent(baseUrl, htmlWithUnsubscribe, trackingToken);
      finalHtml = result.html;
      trackedLinks = result.links;
    }

    // Prepare message
    const msg = {
      to: {
        email: options.to,
        name: options.toName,
      },
      from: {
        email: DEFAULT_FROM_EMAIL,
        name: DEFAULT_FROM_NAME,
      },
      subject: options.subject,
      html: finalHtml,
      text: textWithUnsubscribe,
    };

    // Send via SendGrid
    const [response] = await sgMail.send(msg);
    const messageId = response.headers['x-message-id'] as string;

    // Log success to database
    const emailLog = await storage.createEmailLog({
      templateId: options.templateId,
      recipientEmail: options.to,
      recipientName: options.toName,
      subject: options.subject,
      status: 'sent',
      emailProvider: 'sendgrid',
      providerMessageId: messageId,
      trackingToken,
      leadId: options.leadId,
      metadata: options.metadata,
      sentAt: new Date(),
    });

    // Store tracked links in database for secure server-side lookup
    if (trackedLinks.length > 0) {
      for (const link of trackedLinks) {
        await storage.createEmailLink({
          emailLogId: emailLog.id,
          linkToken: link.linkToken,
          targetUrl: link.targetUrl,
        });
      }
      console.log(`[Email Tracking] Stored ${trackedLinks.length} tracked links for email ${emailLog.id}`);
    }

    console.log('Email sent successfully:', messageId, 'tracking:', trackingToken);
    return { success: true, messageId };
    
  } catch (error: any) {
    console.error('Failed to send email:', error);
    
    // Log failure to database (with tracking token for potential retry)
    await storage.createEmailLog({
      templateId: options.templateId,
      recipientEmail: options.to,
      recipientName: options.toName,
      subject: options.subject,
      status: 'failed',
      emailProvider: 'sendgrid',
      trackingToken: nanoid(), // Generate token even for failed emails
      leadId: options.leadId,
      errorMessage: error.message || 'Unknown error',
      metadata: options.metadata,
    });

    return { success: false, error: error.message };
  }
}

/**
 * Send an email using a template from the database
 */
export async function sendTemplatedEmail(
  storage: IStorage,
  templateName: string,
  recipientEmail: string,
  recipientName: string | undefined,
  variables: Record<string, any>,
  additionalMetadata?: Record<string, any>,
  options?: { disableTracking?: boolean; leadId?: string | null }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Get template from database
    const template = await storage.getEmailTemplateByName(templateName);
    
    if (!template) {
      const error = `Email template not found: ${templateName}`;
      // Log template lookup failure
      await storage.createEmailLog({
        recipientEmail,
        recipientName,
        subject: `Template Error: ${templateName}`,
        status: 'failed',
        emailProvider: 'sendgrid',
        errorMessage: error,
        metadata: { templateName, variables, ...additionalMetadata },
      });
      throw new Error(error);
    }

    if (!template.isActive) {
      const error = `Email template is inactive: ${templateName}`;
      // Log inactive template attempt
      await storage.createEmailLog({
        templateId: template.id,
        recipientEmail,
        recipientName,
        subject: template.subject,
        status: 'failed',
        emailProvider: 'sendgrid',
        errorMessage: error,
        metadata: { templateName, variables, ...additionalMetadata },
      });
      throw new Error(error);
    }

    // Render template with variables
    const htmlBody = renderTemplate(template.htmlBody, variables);
    const textBody = template.textBody 
      ? renderTemplate(template.textBody, variables)
      : undefined;
    const subject = renderTemplate(template.subject, variables);

    // Send email with merged metadata
    return await sendEmail(storage, {
      to: recipientEmail,
      toName: recipientName,
      subject,
      html: htmlBody,
      text: textBody,
      templateId: template.id,
      metadata: { templateName, variables, ...additionalMetadata },
      disableTracking: options?.disableTracking,
      leadId: options?.leadId,
    });
    
  } catch (error: any) {
    console.error('Failed to send templated email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Basic HTML stripper for plain text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s\s+/g, ' ')
    .trim();
}

/**
 * Add unsubscribe link to HTML email
 * Injects a footer with unsubscribe link before closing body tag
 */
function addUnsubscribeToHtml(html: string, unsubscribeUrl: string): string {
  const unsubscribeFooter = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; text-align: center;">
      <p style="margin: 0 0 8px 0;">
        You are receiving this email because you are part of Julie's Family Learning Program community.
      </p>
      <p style="margin: 0;">
        <a href="${unsubscribeUrl}" style="color: #6B7280; text-decoration: underline;">Unsubscribe from all emails</a>
      </p>
    </div>
  `;
  
  // Try to inject before closing body tag, or append to end
  if (html.includes('</body>')) {
    return html.replace('</body>', `${unsubscribeFooter}</body>`);
  } else {
    return html + unsubscribeFooter;
  }
}

/**
 * Add unsubscribe link to plain text email
 */
function addUnsubscribeToText(text: string, unsubscribeUrl: string): string {
  return `${text}\n\n---\n\nYou are receiving this email because you are part of Julie's Family Learning Program community.\n\nTo unsubscribe from all emails, visit:\n${unsubscribeUrl}`;
}
