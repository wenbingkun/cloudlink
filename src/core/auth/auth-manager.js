const textEncoder = new TextEncoder();

// --- Base64 Helpers ---
function base64UrlEncodeBytes(bytes) {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(input) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 ? '='.repeat(4 - (padded.length % 4)) : '';
  return atob(padded + padding);
}

// --- Cryptography Helpers ---
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(data));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

async function createJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSign(signingInput, secret);
  return `${signingInput}.${signature}`;
}

async function verifyJwt(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, reason: 'malformed' };

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = await hmacSign(signingInput, secret);

  if (!timingSafeEqual(signature, expectedSignature)) {
    return { valid: false, reason: 'invalid_signature' };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, reason: 'invalid_payload' };
  }
}

async function hashPassword(password, secret) {
  const input = textEncoder.encode(`${password}:${secret}`);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return base64UrlEncodeBytes(new Uint8Array(digest));
}

// 后端认证管理器 (精简版)
export class ServerAuthManager {
  constructor() {
    this.sessionDuration = 24 * 60 * 60 * 1000; // 24小时
  }

  async verifyAuthToken(token, expectedPassword, secret, now = Date.now()) {
    if (!token || !secret) return { valid: false, reason: 'missing_data' };

    const verification = await verifyJwt(token, secret);
    if (!verification.valid) return { valid: false, reason: verification.reason };

    if (now - verification.payload.timestamp > this.sessionDuration) {
      return { valid: false, reason: 'expired' };
    }

    const expectedHash = await hashPassword(expectedPassword, secret);
    if (verification.payload.pwd !== expectedHash) {
      return { valid: false, reason: 'invalid_password' };
    }

    return { valid: true, payload: verification.payload };
  }

  async generateToken(password, secret) {
    if (!secret) throw new Error('Missing Secret');
    const timestamp = Date.now();
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const randomString = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

    const payload = {
      pwd: await hashPassword(password, secret),
      timestamp,
      random: randomString
    };

    return createJwt(payload, secret);
  }
}