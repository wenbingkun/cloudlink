import { handleUpload } from './core/handlers/upload.js';
import { handleDownload } from './core/handlers/download.js';
import { handleAdmin } from './core/handlers/admin.js';
import { handleChunkedUpload } from './core/handlers/chunked-upload.js';
import { RateLimiter } from './core/utils/rate-limiter.js';
import { buildCorsHeaders, resolveCorsOrigin } from './core/utils/helpers.js';
import { handleShare } from './core/handlers/share.js';
import { getStorageProvider } from './storage/factory.js';
import { getConfig } from './config.js';

// --- Optimizations & Security Enhancements ---

// 1. Cached Storage provider instance
let storageProvider;

// 2. Global RateLimiter instance
const rateLimiter = new RateLimiter();

// 3. Default password check flag
let passwordWarningLogged = false;

function logDefaultPasswordWarning(env) {
  if (passwordWarningLogged) return;
  if (env.UPLOAD_PASSWORD === 'CloudLink_Upload_2024!@#' || env.ADMIN_PASSWORD === 'CloudLink_Admin_2024!@#') {
    console.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.warn('!!! SECURITY WARNING: You are using default passwords. !!!');
    console.warn('!!! Please change UPLOAD_PASSWORD and ADMIN_PASSWORD   !!!');
    console.warn('!!! in your wrangler.toml file before deployment.      !!!');
    console.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    passwordWarningLogged = true;
  }
}

// --- Main Fetch Handler ---

export default {
  async fetch(request, env, ctx) {
    // Log password warning on first request
    logDefaultPasswordWarning(env);

    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = buildCorsHeaders(request, env);
    const { allowedOrigin } = resolveCorsOrigin(request, env);

    if (request.method === 'OPTIONS') {
      if (request.headers.get('Origin') && !allowedOrigin) {
        return new Response('CORS origin not allowed', { status: 403 });
      }
      return new Response(null, { headers: corsHeaders });
    }

    // --- Static Asset Serving ---
    if (path === '/' || path === '/index.html') {
        return env.ASSETS.fetch(new Request(url.origin + '/index.html', request));
    }
    if (path.startsWith('/css/') || path.startsWith('/js/') || path.startsWith('/assets/')) {
        return env.ASSETS.fetch(request);
    }
    if (path === '/favicon.svg') {
        return env.ASSETS.fetch(new Request(url.origin + '/assets/favicon.svg', request));
    }

    const config = getConfig(env);
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const isChunkedUpload = path.startsWith('/chunked-upload/chunk/');
    const isNormalUpload = path === '/upload';
    const isAdminOperation = path.startsWith('/admin');

    const rateWindowMs = config.rateLimitWindowMs;
    const uploadLimit = config.maxUploadRequestsPerMin;
    const adminLimit = config.maxAdminRequestsPerMin;
    const chunkLimit = config.maxChunkRequestsPerMin;

    if (isNormalUpload) {
      if (!rateLimiter.isAllowed(clientIP, uploadLimit, rateWindowMs)) {
        return new Response(JSON.stringify({ error: '请求过于频繁，请稍后再试' }), { 
          status: 429, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } else if (isAdminOperation) {
      if (!rateLimiter.isAllowed(clientIP, adminLimit, rateWindowMs)) {
        return new Response(JSON.stringify({ error: '请求过于频繁，请稍后再试' }), { 
          status: 429, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } else if (isChunkedUpload) {
      if (!rateLimiter.isAllowed(clientIP, chunkLimit, rateWindowMs)) {
        return new Response(JSON.stringify({ error: '分块上传请求过于频繁，请稍后再试' }), { 
          status: 429, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    try {
      if (!storageProvider) {
        storageProvider = await getStorageProvider(env);
      }

      if (path === '/upload' && request.method === 'POST') {
        return handleUpload(request, env, storageProvider, url);
      }

      if (path.startsWith('/chunked-upload/')) {
        return handleChunkedUpload(request, env, storageProvider, path, url);
      }

      if (path.startsWith('/d/') && request.method === 'GET') {
        return handleDownload(request, env, storageProvider, path);
      }

      if (path.startsWith('/share') || path.startsWith('/s/')) {
        return handleShare(request, env, storageProvider, path, url);
      }

      if (path.startsWith('/admin')) {
        return handleAdmin(request, env, storageProvider, path, url);
      }

      if (path === '/speed-test' && request.method === 'POST') {
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return new Response('页面不存在', { status: 404, headers: corsHeaders });

    } catch (error) {
      console.error('Worker Error:', error, error.stack);
      return new Response('服务器内部错误', { status: 500, headers: corsHeaders });
    }
  },
};
