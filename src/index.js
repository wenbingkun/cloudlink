import { GoogleDriveAPI } from './google-drive-api.js';
import { handleUpload } from './upload-handler.js';
import { handleDownload } from './download-handler.js';
import { handleAdmin } from './admin-handler.js';
import { getUploadPageHTML } from './pages/upload-page.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const driveAPI = new GoogleDriveAPI(
        env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        env.GOOGLE_PRIVATE_KEY
      );

      if (path === '/' && request.method === 'GET') {
        return new Response(getUploadPageHTML(), {
          headers: { 'Content-Type': 'text/html', ...corsHeaders },
        });
      }

      if (path === '/upload' && request.method === 'POST') {
        return handleUpload(request, env, driveAPI, url);
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