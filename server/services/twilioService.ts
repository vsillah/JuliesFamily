// Reference: connection:conn_twilio_01K916K1G3ZHE399HKRGGSD4SZ
import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
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

export async function sendSMS(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string; blocked?: boolean }> {
  try {
    // TCPA Compliance: Check if recipient has opted out of SMS
    const { storage } = await import('../storage');
    
    // Format phone to E.164 for consistent lookup
    const { formatPhoneNumber } = await import('../twilio');
    let formattedPhone: string;
    try {
      formattedPhone = formatPhoneNumber(to);
    } catch (e: any) {
      return { success: false, error: `Invalid phone number: ${e.message}` };
    }
    
    const isUnsubscribed = await storage.isSmsUnsubscribed(formattedPhone);
    
    if (isUnsubscribed) {
      console.log(`[SMS Blocked] Recipient ${formattedPhone} has opted out via STOP keyword - TCPA compliance`);
      return {
        success: false,
        blocked: true,
        error: `Recipient has opted out of SMS messages. Send blocked for TCPA compliance.`
      };
    }
    
    const client = await getTwilioClient();
    const from = await getTwilioFromPhoneNumber();
    
    const message = await client.messages.create({
      body,
      from,
      to: formattedPhone
    });
    
    return { success: true, messageId: message.sid };
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}
