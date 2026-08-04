import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'campusconnect-secret-key-spec-auth-991';

/**
 * Encodes a key-value payload into an HS256 JWT Token
 */
export function signToken(payload: { userId: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days expiry
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Decodes and verifies an HS256 JWT Token
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    // Check expiration
    if (decoded.exp && Math.floor(Date.now() / 1000) > decoded.exp) {
      return null;
    }

    return { userId: decoded.userId };
  } catch (err) {
    return null;
  }
}
