import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ServerAuthManager } from '../src/core/auth/auth-manager.js';
import { buildCorsHeaders } from '../src/core/utils/helpers.js';
import { generateShareToken, hashPasscode, verifyPasscode } from '../src/core/utils/share-utils.js';

function base64UrlEncode(input) {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 ? '='.repeat(4 - (padded.length % 4)) : '';
  return Buffer.from(padded + padding, 'base64').toString('utf8');
}

async function testAuthTokens() {
  const auth = new ServerAuthManager();
  const secret = 'test-secret-1234567890';
  const password = 'AdminPass!123';

  const token = await auth.generateToken(password, secret);
  const verify = await auth.verifyAuthToken(token, password, secret);
  assert.equal(verify.valid, true, 'valid token should verify');

  const [header, payload, signature] = token.split('.');
  const parsedPayload = JSON.parse(base64UrlDecode(payload));
  const tamperedPayload = { ...parsedPayload, timestamp: parsedPayload.timestamp - 10000 };
  const tamperedToken = `${header}.${base64UrlEncode(JSON.stringify(tamperedPayload))}.${signature}`;
  const tamperedVerify = await auth.verifyAuthToken(tamperedToken, password, secret);
  assert.equal(tamperedVerify.valid, false, 'tampered token should fail');

  const expiredNow = parsedPayload.timestamp + (24 * 60 * 60 * 1000) + 1;
  const expiredVerify = await auth.verifyAuthToken(token, password, secret, expiredNow);
  assert.equal(expiredVerify.valid, false, 'expired token should fail');
  assert.equal(expiredVerify.reason, 'expired', 'expired token should return expired reason');
}

async function testCorsAllowlist() {
  const env = { ALLOWED_ORIGINS: 'https://allowed.com,https://other.com' };
  const allowedRequest = new Request('https://api.example.com/upload', {
    headers: { Origin: 'https://allowed.com' },
  });
  const allowedHeaders = buildCorsHeaders(allowedRequest, env);
  assert.equal(
    allowedHeaders['Access-Control-Allow-Origin'],
    'https://allowed.com',
    'allowed origin should be echoed'
  );

  const blockedRequest = new Request('https://api.example.com/upload', {
    headers: { Origin: 'https://blocked.com' },
  });
  const blockedHeaders = buildCorsHeaders(blockedRequest, env);
  assert.ok(
    !('Access-Control-Allow-Origin' in blockedHeaders),
    'blocked origin should not be echoed'
  );

  const defaultEnv = {};
  const sameOriginRequest = new Request('https://api.example.com/upload');
  const sameOriginHeaders = buildCorsHeaders(sameOriginRequest, defaultEnv);
  assert.equal(
    sameOriginHeaders['Access-Control-Allow-Origin'],
    'https://api.example.com',
    'default allowlist should allow same origin'
  );
}

async function testUiAssets() {
  const html = fs.readFileSync(path.resolve('public/index.html'), 'utf8');
  const css = fs.readFileSync(path.resolve('public/css/styles.css'), 'utf8');
  const client = fs.readFileSync(path.resolve('public/js/app.js'), 'utf8');
  const drag = fs.readFileSync(path.resolve('public/js/ui/drag.js'), 'utf8');

  assert.ok(html.includes('liquid-dock'), 'liquid dock should exist in HTML');
  assert.ok(html.includes('upload-panel'), 'upload panel should exist in HTML');
  assert.ok(html.includes('login-modal'), 'login modal should exist in HTML');
  assert.ok(html.includes('drop-zone'), 'drop zone should exist in HTML');
  assert.ok(html.includes('file-grid'), 'file grid should exist in HTML');
  assert.ok(html.includes('toast-container'), 'toast container should exist in HTML');
  assert.ok(css.includes('.liquid-btn'), 'liquid button styles should exist');
  assert.ok(css.includes('.glass-panel'), 'glass panel styles should exist');
  assert.ok(css.includes('.file-grid'), 'file grid styles should exist');
  assert.ok(css.includes('.drop-zone'), 'drop zone styles should exist');
  assert.ok(client.includes('toggleUploadPanel'), 'upload panel toggle should exist');
  assert.ok(client.includes('toggleLoginModal'), 'login modal toggle should exist');
  assert.ok(drag.includes('dragenter'), 'global drag should handle dragenter');
  assert.ok(drag.includes('drop'), 'global drag should handle drop');
}

async function testUiInteractionsStatic() {
  const drag = fs.readFileSync(path.resolve('public/js/ui/drag.js'), 'utf8');

  assert.ok(
    /dragenter[\s\S]*classList\.add\('drag-active'\)/.test(drag),
    'dragenter should activate drag-active state'
  );
  assert.ok(
    /dragleave[\s\S]*classList\.remove\('drag-active'\)/.test(drag),
    'dragleave should clear drag-active state'
  );
  assert.ok(
    /drop[\s\S]*addFilesToQueue/.test(drag),
    'drop should queue files'
  );
}

async function testServerConfigReferences() {
  const index = fs.readFileSync(path.resolve('src/index.js'), 'utf8');
  const config = fs.readFileSync(path.resolve('src/config.js'), 'utf8');
  const download = fs.readFileSync(path.resolve('src/core/handlers/download.js'), 'utf8');

  assert.ok(index.includes('getConfig'), 'index should use config helper');
  assert.ok(config.includes('MAX_UPLOAD_REQUESTS_PER_MIN'), 'config should read upload rate limit config');
  assert.ok(config.includes('MAX_ADMIN_REQUESTS_PER_MIN'), 'config should read admin rate limit config');
  assert.ok(config.includes('MAX_CHUNK_REQUESTS_PER_MIN'), 'config should read chunk rate limit config');
  assert.ok(download.includes('REQUIRE_SHARE_TOKEN'), 'download handler should honor share token requirement');
}

async function testShareUtils() {
  const secret = 'share-secret-123';
  const passcode = 'TestCode!2024';
  const hash = await hashPasscode(passcode, secret);
  const valid = await verifyPasscode(passcode, hash, secret);
  const invalid = await verifyPasscode('wrong', hash, secret);

  assert.equal(valid, true, 'share passcode should verify');
  assert.equal(invalid, false, 'invalid share passcode should fail');

  const token = generateShareToken();
  assert.ok(/^[A-Za-z0-9_-]+$/.test(token), 'share token should be url-safe');
}

async function run() {
  await testAuthTokens();
  await testCorsAllowlist();
  await testUiAssets();
  await testUiInteractionsStatic();
  await testShareUtils();
  await testServerConfigReferences();
  console.log('All tests passed.');
}

run().catch((error) => {
  console.error('Tests failed:', error);
  process.exitCode = 1;
});
