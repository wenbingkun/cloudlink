import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ServerAuthManager } from '../src/core/auth/auth-manager.js';
import { buildCorsHeaders } from '../src/core/utils/helpers.js';
import { generateShareToken, hashPasscode, verifyPasscode } from '../src/core/utils/share-utils.js';
import { handleDownload } from '../src/core/handlers/download.js';
import { handleShare } from '../src/core/handlers/share.js';
import { handleAdmin } from '../src/core/handlers/admin.js';
import { handleUpload } from '../src/core/handlers/upload.js';

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

  assert.ok(
    sameOriginHeaders['Access-Control-Allow-Headers'].includes('X-Upload-Token'),
    'chunk upload token header should be allowed'
  );
}

async function testUiAssets() {
  const html = fs.readFileSync(path.resolve('public/index.html'), 'utf8');
  const css = fs.readFileSync(path.resolve('public/css/styles.css'), 'utf8');
  const client = fs.readFileSync(path.resolve('public/js/app.js'), 'utf8');
  const drag = fs.readFileSync(path.resolve('public/js/ui/drag.js'), 'utf8');
  const render = fs.readFileSync(path.resolve('public/js/ui/render.js'), 'utf8');

  assert.ok(html.includes('liquid-dock'), 'liquid dock should exist in HTML');
  assert.ok(html.includes('dynamic-island-container'), 'dynamic island container should exist in HTML');
  assert.ok(html.includes('upload-queue'), 'upload queue container should exist in HTML');
  assert.ok(html.includes('login-modal'), 'login modal should exist in HTML');
  assert.ok(html.includes('loginCloseBtn'), 'login close button should exist in HTML');
  assert.ok(html.includes('file-input'), 'file input should exist in HTML');
  assert.ok(html.includes('file-grid'), 'file grid should exist in HTML');
  assert.ok(html.includes('toast-container'), 'toast container should exist in HTML');
  assert.ok(css.includes('.liquid-btn'), 'liquid button styles should exist');
  assert.ok(css.includes('.glass-panel'), 'glass panel styles should exist');
  assert.ok(css.includes('.file-grid'), 'file grid styles should exist');
  assert.ok(css.includes('.dynamic-island'), 'dynamic island styles should exist');
  assert.ok(css.includes('calc(max(24px, env(safe-area-inset-top)) + 84px)'), 'toast offset should avoid overlapping the dynamic island');
  assert.ok(css.includes('@keyframes toastSlideOut'), 'toast exit animation should exist');
  assert.ok(client.includes('initReactiveUI'), 'reactive ui should be initialized');
  assert.ok(client.includes('toggleLoginModal'), 'login modal toggle should exist');
  assert.ok(client.includes('scheduleQueueItemRemoval'), 'upload queue items should be cleaned up after completion');
  assert.ok(drag.includes('dragenter'), 'global drag should handle dragenter');
  assert.ok(drag.includes('drop'), 'global drag should handle drop');
  assert.ok(render.includes('document.createElement'), 'render layer should use DOM APIs');
  assert.ok(!render.includes('onerror="'), 'render layer should avoid inline event handlers');
  assert.ok(render.includes("label: 'Download'"), 'context menu should include a download action');
  assert.ok(!html.includes('onclick="toggleLoginModal()"'), 'login modal should not rely on inline onclick handlers');
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
  assert.ok(config.includes('MAX_SHARE_REQUESTS_PER_MIN'), 'config should read share rate limit config');
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

async function testDownloadMissingFileReturns404() {
  const request = new Request('https://example.com/d/missing');
  const response = await handleDownload(request, {}, {
    getFileInfo: async () => {
      throw new Error('not found');
    }
  }, '/d/missing');

  assert.equal(response.status, 404, 'missing files should return 404');
}

async function testShareDownloadUsesPrivateCachingAndCookie() {
  const token = 'share-token-1';
  const kv = new Map();
  kv.set(token, JSON.stringify({
    fileId: 'file-1',
    createdAt: Date.now(),
    expiresAt: Date.now() + 60_000,
    maxDownloads: 1,
    downloads: 0,
    passcodeRequired: false,
    passcodeHash: null
  }));

  const env = {
    SHARE_LINKS: {
      get: async (key) => kv.get(key),
      put: async (key, value) => kv.set(key, value)
    },
    REQUIRE_SHARE_TOKEN: 'true',
    AUTH_TOKEN_SECRET: 'share-secret'
  };

  const storage = {
    getFileInfo: async () => ({ name: 'demo.txt', size: '5', mimeType: 'text/plain' }),
    downloadFile: async () => new Response('hello', { status: 200 })
  };

  const request = new Request(`https://example.com/s/${token}`);
  const response = await handleShare(request, env, storage, `/s/${token}`, new URL(request.url));

  assert.equal(response.status, 200, 'share downloads should succeed');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store', 'share downloads should disable public caching');
  assert.ok(response.headers.get('Set-Cookie')?.includes('cloudlink_share_access='), 'share downloads should issue access cookie');
  assert.equal(JSON.parse(kv.get(token)).downloads, 1, 'successful share download should increment counter');

  const rangeRequest = new Request(`https://example.com/s/${token}`, {
    headers: {
      Cookie: response.headers.get('Set-Cookie'),
      Range: 'bytes=0-1'
    }
  });
  const rangeStorage = {
    getFileInfo: async () => ({ name: 'demo.txt', size: '5', mimeType: 'text/plain' }),
    downloadFileRange: async () => new Response('he', { status: 206 })
  };

  const rangeResponse = await handleShare(rangeRequest, env, rangeStorage, `/s/${token}`, new URL(rangeRequest.url));
  assert.equal(rangeResponse.status, 206, 'range downloads should succeed with cookie');
  assert.equal(JSON.parse(kv.get(token)).downloads, 1, 'range retries with access cookie should not re-count downloads');
}

async function testShareDoesNotCountFailedDownloads() {
  const token = 'share-token-2';
  const kv = new Map();
  kv.set(token, JSON.stringify({
    fileId: 'file-2',
    createdAt: Date.now(),
    expiresAt: Date.now() + 60_000,
    maxDownloads: 1,
    downloads: 0,
    passcodeRequired: false,
    passcodeHash: null
  }));

  const env = {
    SHARE_LINKS: {
      get: async (key) => kv.get(key),
      put: async (key, value) => kv.set(key, value)
    },
    REQUIRE_SHARE_TOKEN: 'true'
  };

  const storage = {
    getFileInfo: async () => {
      throw new Error('not found');
    }
  };

  const request = new Request(`https://example.com/s/${token}`);
  const response = await handleShare(request, env, storage, `/s/${token}`, new URL(request.url));

  assert.equal(response.status, 404, 'failed share downloads should bubble original error');
  assert.equal(JSON.parse(kv.get(token)).downloads, 0, 'failed downloads should not increment counter');
}

async function testAdminVerifyTokenReturnsTimestamp() {
  const auth = new ServerAuthManager();
  const secret = 'verify-secret';
  const password = 'admin-pass';
  const token = await auth.generateToken(password, secret);
  const request = new Request('https://example.com/admin/verify-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });

  const response = await handleAdmin(
    request,
    { ADMIN_PASSWORD: password, AUTH_TOKEN_SECRET: secret },
    {},
    '/admin/verify-token',
    new URL(request.url)
  );
  const payload = await response.json();

  assert.equal(response.status, 200, 'verify-token should succeed for valid token');
  assert.equal(payload.valid, true, 'verify-token should mark token as valid');
  assert.equal(typeof payload.timestamp, 'number', 'verify-token should expose token timestamp');
}

async function testDirectUploadRejectsFilesAboveDirectThreshold() {
  let uploadCalled = false;
  const formData = new FormData();
  formData.append('password', 'upload-pass');
  formData.append('file', new File(['123456'], 'demo.txt', { type: 'text/plain' }));
  const request = new Request('https://example.com/upload', {
    method: 'POST',
    body: formData
  });

  const response = await handleUpload(request, {
    UPLOAD_PASSWORD: 'upload-pass',
    DIRECT_UPLOAD_MAX_SIZE: '5',
    MAX_FILE_SIZE: '100',
    ALLOWED_EXTENSIONS: 'txt'
  }, {
    uploadFile: async () => {
      uploadCalled = true;
      return { id: 'file-1' };
    }
  }, new URL('https://example.com/upload'));

  const payload = await response.json();
  assert.equal(response.status, 413, 'direct upload should reject files above the direct upload ceiling');
  assert.equal(payload.requireChunkedUpload, true, 'response should instruct the client to switch to chunked upload');
  assert.equal(uploadCalled, false, 'storage provider should not be called for oversized direct uploads');
}

async function run() {
  await testAuthTokens();
  await testCorsAllowlist();
  await testUiAssets();
  await testUiInteractionsStatic();
  await testShareUtils();
  await testServerConfigReferences();
  await testDownloadMissingFileReturns404();
  await testShareDownloadUsesPrivateCachingAndCookie();
  await testShareDoesNotCountFailedDownloads();
  await testAdminVerifyTokenReturnsTimestamp();
  await testDirectUploadRejectsFilesAboveDirectThreshold();
  console.log('All tests passed.');
}

run().catch((error) => {
  console.error('Tests failed:', error);
  process.exitCode = 1;
});
