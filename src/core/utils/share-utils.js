const textEncoder = new TextEncoder();

function base64UrlEncodeBytes(bytes) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function hashPasscode(passcode, secret) {
  const input = textEncoder.encode(`${passcode}:${secret}`);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return base64UrlEncodeBytes(new Uint8Array(digest));
}

export async function verifyPasscode(passcode, expectedHash, secret) {
  const actualHash = await hashPasscode(passcode, secret);
  if (actualHash.length !== expectedHash.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < actualHash.length; i++) {
    result |= actualHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return result === 0;
}

export function generateShareToken(byteLength = 16) {
  const randomBytes = new Uint8Array(byteLength);
  crypto.getRandomValues(randomBytes);
  return base64UrlEncodeBytes(randomBytes);
}
