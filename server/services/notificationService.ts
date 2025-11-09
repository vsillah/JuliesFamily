import { sendSMS } from './twilioService';
import type { ChatbotIssue } from '@shared/schema';

const ADMIN_PHONE = '+16179677448'; // 617-967-7448
const ADMIN_EMAIL = 'vsillah@gmail.com';

export interface NotificationResult {
  sms: { success: boolean; error?: string };
  email: { success: boolean; error?: string };
}

export async function notifyIssue(issue: ChatbotIssue): Promise<NotificationResult> {
  const severityLabel = `[${issue.severity.toUpperCase()}]`;
  
  const smsBody = `JFLP Alert ${severityLabel}: ${issue.title}\n\nCategory: ${issue.category || 'N/A'}\n\n${issue.description.substring(0, 100)}${issue.description.length > 100 ? '...' : ''}\n\nCheck admin dashboard for details.`;

  const smsResult = await sendSMS(ADMIN_PHONE, smsBody);

  const emailResult = { 
    success: false, 
    error: 'SendGrid not configured. Please set up SendGrid integration to enable email notifications.' 
  };

  return {
    sms: smsResult,
    email: emailResult
  };
}
