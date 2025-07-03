import { GoogleDriveAPI } from './google-drive-api.js';
import { handleUpload } from './upload-handler.js';
import { handleDownload } from './download-handler.js';
import { handleAdmin } from './admin-handler.js';
import { handleChunkedUpload } from './chunked-upload-handler.js';
import { getUnifiedPageHTML } from './pages/unified-page.js';
import { RateLimiter } from './rate-limiter.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Range',
};

const rateLimiter = new RateLimiter();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 获取客户端IP
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For') || 
                     'unknown';

    // 对上传和管理操作进行限流
    const isChunkedUpload = path.startsWith('/chunked-upload/chunk/');
    const isNormalUpload = path === '/upload';
    const isAdminOperation = path.startsWith('/admin');

    if (isNormalUpload || isAdminOperation) {
      // 普通上传和管理操作：每分钟10次
      if (!rateLimiter.isAllowed(clientIP, 10, 60000)) {
        return new Response(JSON.stringify({ 
          error: '请求过于频繁，请稍后再试',
          remaining: rateLimiter.getRemainingRequests(clientIP, 10, 60000)
        }), { 
          status: 429, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } else if (isChunkedUpload) {
      // 分块上传：每分钟100次（大文件需要多个块）
      if (!rateLimiter.isAllowed(clientIP, 100, 60000)) {
        return new Response(JSON.stringify({ 
          error: '分块上传请求过于频繁，请稍后再试',
          remaining: rateLimiter.getRemainingRequests(clientIP, 100, 60000)
        }), { 
          status: 429, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    try {
      const driveAPI = new GoogleDriveAPI(
        env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        env.GOOGLE_PRIVATE_KEY
      );

      if (path === '/' && request.method === 'GET') {
        return new Response(getUnifiedPageHTML(), {
          headers: { 'Content-Type': 'text/html', ...corsHeaders },
        });
      }

      if (path === '/upload' && request.method === 'POST') {
        return handleUpload(request, env, driveAPI, url);
      }

      if (path.startsWith('/chunked-upload/')) {
        return handleChunkedUpload(request, env, driveAPI, path, url);
      }

      if (path.startsWith('/d/') && request.method === 'GET') {
        return handleDownload(request, env, driveAPI, path);
      }

      if (path.startsWith('/admin')) {
        return handleAdmin(request, env, driveAPI, path, url);
      }

      return new Response('页面不存在', { status: 404, headers: corsHeaders });

    } catch (error) {
      console.error('Worker 错误:', error);
      return new Response('服务器内部错误', { status: 500, headers: corsHeaders });
    }
  },
};