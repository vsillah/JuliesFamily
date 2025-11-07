import sgMail from '@sendgrid/mail';
import type { IStorage } from './storage';

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
      html: options.html,
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
      metadata: options.metadata,
      sentAt: new Date(),
    });

    console.log('Email sent successfully:', messageId);
    return { success: true, messageId };
    
  } catch (error: any) {
    console.error('Failed to send email:', error);
    
    // Log failure to database
    await storage.createEmailLog({
      templateId: options.templateId,
      recipientEmail: options.to,
      recipientName: options.toName,
      subject: options.subject,
      status: 'failed',
      emailProvider: 'sendgrid',
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
  additionalMetadata?: Record<string, any>
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
