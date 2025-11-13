import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected');
  }
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
  accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

/**
 * Send an SMS message via Twilio
 * Now includes TCPA compliance check for SMS opt-outs
 */
export async function sendSMS(
  to: string,
  message: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; messageId?: string; error?: string; blocked?: boolean }> {
  try {
    // Format and validate phone number
    const formattedNumber = formatPhoneNumber(to);
    if (!formattedNumber || formattedNumber === '+' || formattedNumber.length < 10) {
      throw new Error(`Invalid phone number: ${to}. Must be a valid phone number with area code.`);
    }

    // TCPA Compliance: Check if recipient has opted out of SMS
    const { storage } = await import('./storage');
    const isUnsubscribed = await storage.isSmsUnsubscribed(formattedNumber);
    
    if (isUnsubscribed) {
      console.log(`[SMS Blocked] Recipient ${formattedNumber} has opted out via STOP keyword - TCPA compliance`);
      return {
        success: false,
        blocked: true,
        error: `Recipient has opted out of SMS messages. Send blocked for TCPA compliance.`
      };
    }

    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedNumber
    });

    return {
      success: true,
      messageId: result.sid
    };
  } catch (error: any) {
    console.error('Failed to send SMS:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    };
  }
}

/**
 * Replace template variables in SMS content
 * Supports {{variableName}} syntax
 */
export function replaceVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }
  
  return result;
}

/**
 * Format phone number to E.164 format (required by Twilio)
 * Assumes US phone numbers (10 digits) if no country code provided
 * Preserves international numbers that already have + or 00 prefix
 * Throws error for invalid input
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Phone number is required and must be a string');
  }

  const trimmed = phone.trim();
  
  // If already starts with +, validate and return as E.164
  if (trimmed.startsWith('+')) {
    const cleaned = trimmed.replace(/\D/g, '');
    if (cleaned.length >= 8 && cleaned.length <= 15) {
      return `+${cleaned}`;
    }
    throw new Error(`Invalid E.164 number: ${phone}. Expected 8-15 digits after country code.`);
  }
  
  // Handle international access code prefix (00)
  if (trimmed.startsWith('00')) {
    const cleaned = trimmed.replace(/\D/g, '').substring(2); // Remove '00' prefix
    if (cleaned.length >= 8 && cleaned.length <= 15) {
      return `+${cleaned}`;
    }
    throw new Error(`Invalid international number: ${phone}. Expected 8-15 digits after 00 prefix.`);
  }
  
  // For numbers without explicit country code, extract digits
  const cleaned = trimmed.replace(/\D/g, '');
  
  // Must have at least 10 digits
  if (cleaned.length < 10) {
    throw new Error(`Invalid phone number: ${phone}. Must have at least 10 digits.`);
  }
  
  // If exactly 10 digits, assume US number and add +1 country code
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If 11 digits starting with 1, it's a US number with country code
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // For 11+ digits not starting with 1, assume it's international with country code
  if (cleaned.length >= 11 && cleaned.length <= 15) {
    return `+${cleaned}`;
  }
  
  throw new Error(`Cannot format phone number: ${phone}. Must be 10-15 digits (got ${cleaned.length}).`);
}
