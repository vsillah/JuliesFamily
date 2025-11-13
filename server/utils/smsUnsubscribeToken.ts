import crypto from 'crypto';

/**
 * Get the unsubscribe secret key with lazy validation
 * Reuses the same secret as email unsubscribe for consistency
 */
function getSecretKey(): string {
  const SECRET_KEY = process.env.UNSUBSCRIBE_SECRET;
  
  if (!SECRET_KEY) {
    throw new Error(
      'UNSUBSCRIBE_SECRET environment variable is required for secure token generation. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  
  return SECRET_KEY;
}

/**
 * Generate a secure unsubscribe token for a phone number
 * Token contains: phone:timestamp:signature
 * Valid for 60 days (exceeds TCPA requirements)
 */
export function generateSmsUnsubscribeToken(phone: string): string {
  const SECRET_KEY = getSecretKey();
  
  const normalizedPhone = phone.trim();
  const timestamp = Date.now().toString();
  const message = `${normalizedPhone}:${timestamp}`;
  
  // Generate HMAC signature
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(message)
    .digest('hex');
  
  // Encode as URL-safe base64
  const tokenData = `${message}:${signature}`;
  return Buffer.from(tokenData).toString('base64url');
}

/**
 * Verify and decode an SMS unsubscribe token
 * Returns phone number if valid, null if invalid or expired
 */
export function verifySmsUnsubscribeToken(token: string): string | null {
  try {
    const SECRET_KEY = getSecretKey();
    
    // Decode from base64url
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    
    if (parts.length !== 3) {
      return null;
    }
    
    const [phone, timestamp, receivedSignature] = parts;
    
    // Check expiry (60 days)
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds
    
    if (tokenAge > maxAge) {
      console.warn('[SMS Unsubscribe] Token expired:', { phone, age: Math.floor(tokenAge / (24 * 60 * 60 * 1000)) + ' days' });
      return null;
    }
    
    // Verify signature
    const message = `${phone}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(message)
      .digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    const receivedBuffer = Buffer.from(receivedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);
    
    if (receivedBuffer.length !== expectedBuffer.length) {
      return null;
    }
    
    if (!crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
      console.warn('[SMS Unsubscribe] Invalid signature for phone:', phone);
      return null;
    }
    
    return phone.trim();
  } catch (error) {
    console.error('[SMS Unsubscribe] Token verification failed:', error);
    return null;
  }
}

/**
 * Generate SMS unsubscribe URL
 */
export function generateSmsUnsubscribeUrl(phone: string, baseUrl?: string): string {
  const token = generateSmsUnsubscribeToken(phone);
  const base = baseUrl || process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000';
  return `${base.startsWith('http') ? base : 'https://' + base}/sms-unsubscribe?token=${token}`;
}
