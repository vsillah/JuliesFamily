import { sendSMS } from './twilioService';
import sgMail from '@sendgrid/mail';
import type { ChatbotIssue } from '@shared/schema';

const ADMIN_PHONE = '+16179677448';
const ADMIN_EMAIL = 'vsillah@gmail.com';
const FROM_EMAIL = 'vsillah@gmail.com';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface NotificationResult {
  sms: { success: boolean; error?: string };
  email: { success: boolean; error?: string };
}

async function sendEmail(issue: ChatbotIssue): Promise<{ success: boolean; error?: string }> {
  if (!SENDGRID_API_KEY) {
    return { 
      success: false, 
      error: 'SendGrid API key not configured' 
    };
  }

  try {
    const severityLabel = `[${issue.severity.toUpperCase()}]`;
    
    const msg = {
      to: ADMIN_EMAIL,
      from: FROM_EMAIL,
      subject: `JFLP Issue Escalated ${severityLabel}: ${issue.title}`,
      html: `
        <h2>Issue Escalated ${severityLabel}</h2>
        <p><strong>Title:</strong> ${issue.title}</p>
        <p><strong>Category:</strong> ${issue.category || 'Not specified'}</p>
        <p><strong>Severity:</strong> ${issue.severity}</p>
        <p><strong>Description:</strong></p>
        <p>${issue.description.replace(/\n/g, '<br>')}</p>
        ${issue.diagnosticData ? `<p><strong>Diagnostic Data:</strong></p><pre>${JSON.stringify(issue.diagnosticData, null, 2)}</pre>` : ''}
        <p><strong>Issue ID:</strong> ${issue.id}</p>
        <p><strong>Time:</strong> ${new Date(issue.createdAt).toLocaleString()}</p>
      `,
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error: any) {
    console.error('SendGrid error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}

export async function notifyIssue(issue: ChatbotIssue): Promise<NotificationResult> {
  const severityLabel = `[${issue.severity.toUpperCase()}]`;
  
  const smsBody = `JFLP Alert ${severityLabel}: ${issue.title}\n\nCategory: ${issue.category || 'N/A'}\n\n${issue.description.substring(0, 100)}${issue.description.length > 100 ? '...' : ''}\n\nCheck admin dashboard for details.`;

  const [smsResult, emailResult] = await Promise.all([
    sendSMS(ADMIN_PHONE, smsBody),
    sendEmail(issue)
  ]);

  return {
    sms: smsResult,
    email: emailResult
  };
}
