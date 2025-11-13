import crypto from 'crypto';

/**
 * Get the unsubscribe secret key with lazy validation
 * Only throws when actually needed (not at import time)
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
 * Generate a secure unsubscribe token for an email address
 * Token contains: email:timestamp:signature
 * Valid for 60 days (exceeds CAN-SPAM 30-day requirement)
 */
export function generateUnsubscribeToken(email: string): string {
  const SECRET_KEY = getSecretKey(); // Lazy check - only throws when called
  
  const normalizedEmail = email.toLowerCase().trim();
  const timestamp = Date.now().toString();
  const message = `${normalizedEmail}:${timestamp}`;
  
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
 * Verify and decode an unsubscribe token
 * Returns email if valid, null if invalid or expired
 */
export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const SECRET_KEY = getSecretKey(); // Lazy check - only throws when called
    
    // Decode from base64url
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    
    if (parts.length !== 3) {
      return null;
    }
    
    const [email, timestamp, receivedSignature] = parts;
    
    // Check expiry (60 days)
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds
    
    if (tokenAge > maxAge) {
      console.warn('[Unsubscribe] Token expired:', { email, age: Math.floor(tokenAge / (24 * 60 * 60 * 1000)) + ' days' });
      return null;
    }
    
    // Verify signature
    const message = `${email}:${timestamp}`;
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
      console.warn('[Unsubscribe] Invalid signature for email:', email);
      return null;
    }
    
    return email.toLowerCase().trim();
  } catch (error) {
    console.error('[Unsubscribe] Token verification failed:', error);
    return null;
  }
}

/**
 * Generate unsubscribe URL for emails
 */
export function generateUnsubscribeUrl(email: string, baseUrl?: string): string {
  const token = generateUnsubscribeToken(email);
  const base = baseUrl || process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000';
  return `${base.startsWith('http') ? base : 'https://' + base}/unsubscribe?token=${token}`;
}
