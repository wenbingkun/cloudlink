import { GoogleDriveAPI } from './google-drive-api.js';
import { handleUpload } from './upload-handler.js';
import { handleDownload } from './download-handler.js';
import { handleAdmin } from './admin-handler.js';
import { handleChunkedUpload } from './chunked-upload-handler.js';
import { RateLimiter } from './rate-limiter.js';

// --- Optimizations & Security Enhancements ---

// 1. Cached GoogleDriveAPI instance to reuse access tokens
let driveAPI;

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

    // 4. Stricter CORS policy for API routes
    const allowedOrigin = url.origin;
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Range',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // --- Static Asset Serving ---
    if (path === '/' || path === '/index.html') {
        return env.ASSETS.fetch(new Request(url.origin + '/index.html', request));
    }
    if (path === '/styles.css' || path === '/client.js') {
        return env.ASSETS.fetch(request);
    }

    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const isChunkedUpload = path.startsWith('/chunked-upload/chunk/');
    const isNormalUpload = path === '/upload';
    const isAdminOperation = path.startsWith('/admin');

    if (isNormalUpload || isAdminOperation) {
      if (!rateLimiter.isAllowed(clientIP, 10, 60000)) {
        return new Response(JSON.stringify({ error: '请求过于频繁，请稍后再试' }), { 
          status: 429, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } else if (isChunkedUpload) {
      if (!rateLimiter.isAllowed(clientIP, 100, 60000)) {
        return new Response(JSON.stringify({ error: '分块上传请求过于频繁，请稍后再试' }), { 
          status: 429, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    try {
      // Initialize GoogleDriveAPI instance on first request
      if (!driveAPI) {
        // 检查Google Drive API配置
        if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
          console.warn('Google Drive API not configured. Upload/download features will not work.');
          console.warn('Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.');
        } else {
          driveAPI = new GoogleDriveAPI(
            env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            env.GOOGLE_PRIVATE_KEY
          );
        }
      }

      if (path === '/upload' && request.method === 'POST') {
        if (!driveAPI) {
          return new Response(JSON.stringify({ error: 'Google Drive API未配置，无法上传文件' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        return handleUpload(request, env, driveAPI, url);
      }

      if (path.startsWith('/chunked-upload/')) {
        if (!driveAPI) {
          return new Response(JSON.stringify({ error: 'Google Drive API未配置，无法上传文件' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        return handleChunkedUpload(request, env, driveAPI, path, url);
      }

      if (path.startsWith('/d/') && request.method === 'GET') {
        if (!driveAPI) {
          return new Response('Google Drive API未配置，无法下载文件', {
            status: 503,
            headers: corsHeaders
          });
        }
        return handleDownload(request, env, driveAPI, path);
      }

      if (path.startsWith('/admin')) {
        if (!driveAPI) {
          return new Response(JSON.stringify({ error: 'Google Drive API未配置，无法访问管理功能' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        return handleAdmin(request, env, driveAPI, path, url);
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
