import sgMail from '@sendgrid/mail';
import type { IStorage } from './storage';
import { nanoid } from 'nanoid';
import * as cheerio from 'cheerio';

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
 */
export function prepareTrackedEmailContent(
  baseUrl: string,
  html: string,
  trackingToken: string
): string {
  try {
    // Load HTML with cheerio
    const $ = cheerio.load(html);
    
    // Inject tracking pixel at the end of body
    const trackingPixel = `<img src="${baseUrl}/track/open/${trackingToken}" width="1" height="1" style="display:none" alt="" />`;
    
    // Try to append to body, fallback to end of HTML if no body tag
    if ($('body').length > 0) {
      $('body').append(trackingPixel);
    } else {
      // If no body tag, append to root
      $.root().append(trackingPixel);
    }
    
    // Rewrite all <a> href links to use click tracking
    $('a[href]').each((_, element) => {
      const $link = $(element);
      const originalHref = $link.attr('href');
      
      if (!originalHref) return;
      
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
      
      // Build tracking URL with encoded original URL
      const encodedUrl = encodeURIComponent(originalHref);
      const trackingUrl = `${baseUrl}/track/click/${trackingToken}?url=${encodedUrl}`;
      
      $link.attr('href', trackingUrl);
    });
    
    return $.html();
    
  } catch (error) {
    console.error('[Email Tracking] Failed to prepare tracked content:', error);
    // Fail gracefully - return original HTML if parsing fails
    return html;
  }
}

/**
 * Send an email using SendGrid and log to database
 */
export async function sendEmail(
  storage: IStorage,
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    // Generate tracking token
    const trackingToken = nanoid();
    
    // Get base URL for tracking links
    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';
    
    // Prepare HTML with tracking if not disabled
    let finalHtml = options.html;
    if (!options.disableTracking) {
      finalHtml = prepareTrackedEmailContent(baseUrl, options.html, trackingToken);
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
      text: options.text || stripHtml(options.html),
    };

    // Send via SendGrid
    const [response] = await sgMail.send(msg);
    const messageId = response.headers['x-message-id'] as string;

    // Log success to database
    await storage.createEmailLog({
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
