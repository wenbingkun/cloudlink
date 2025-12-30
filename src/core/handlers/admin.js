import { ServerAuthManager } from '../auth/auth-manager.js';
import { buildCorsHeaders } from '../utils/helpers.js';

const authManager = new ServerAuthManager();

export async function handleAdmin(request, env, driveAPI, path, url) {
  try {
    const corsHeaders = buildCorsHeaders(request, env);
    // 移除独立的admin页面路由，现在使用统一界面

    if (path === '/admin/login' && request.method === 'POST') {
      const data = await request.json();
      
      if (data.password === env.ADMIN_PASSWORD) {
        if (!env.AUTH_TOKEN_SECRET) {
          return new Response(JSON.stringify({ error: '缺少AUTH_TOKEN_SECRET配置' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        // 生成新token
        const token = await authManager.generateToken(data.password, env.AUTH_TOKEN_SECRET);
        return new Response(JSON.stringify({ 
          success: true, 
          token: token,
          expiresIn: 24 * 60 * 60 * 1000 // 24小时
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } else {
        return new Response(JSON.stringify({ error: '管理员密码错误' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }
    
    // Token验证接口
    if (path === '/admin/verify-token' && request.method === 'POST') {
      const data = await request.json();
      
      if (!data.token) {
        return new Response(JSON.stringify({ error: '缺少token' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      const verification = await authManager.verifyAuthToken(
        data.token,
        env.ADMIN_PASSWORD,
        env.AUTH_TOKEN_SECRET
      );
      
      if (verification.valid) {
        return new Response(JSON.stringify({ 
          valid: true,
          timestamp: verification.timestamp
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } else {
        return new Response(JSON.stringify({ 
          valid: false, 
          reason: verification.reason 
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    if (path === '/admin/files' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      let authenticated = false;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const authToken = authHeader.substring(7);
        const verification = await authManager.verifyAuthToken(
          authToken,
          env.ADMIN_PASSWORD,
          env.AUTH_TOKEN_SECRET
        );
        authenticated = verification.valid;
      }
      
      if (!authenticated) {
        return new Response(JSON.stringify({ error: '未授权访问' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const pageToken = url.searchParams.get('pageToken');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

      const result = await driveAPI.listFiles(env.DRIVE_FOLDER_ID, pageSize, pageToken);
      
      const files = result.files.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size ? parseInt(file.size) : 0,
        mimeType: file.mimeType || 'application/octet-stream',
        createdTime: file.createdTime,
        downloadUrl: `${url.origin}/d/${file.id}`
      }));

      return new Response(JSON.stringify({
        files,
        nextPageToken: result.nextPageToken,
        totalFiles: files.length
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (path.startsWith('/admin/delete/') && request.method === 'DELETE') {
      const fileId = path.substring('/admin/delete/'.length);
      const authHeader = request.headers.get('Authorization');
      
      let authenticated = false;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const authToken = authHeader.substring(7);
        const verification = await authManager.verifyAuthToken(
          authToken,
          env.ADMIN_PASSWORD,
          env.AUTH_TOKEN_SECRET
        );
        authenticated = verification.valid;
      }
      
      if (!authenticated) {
        return new Response(JSON.stringify({ error: '管理员密码错误' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const success = await driveAPI.deleteFile(fileId);
      
      if (success) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } else {
        return new Response(JSON.stringify({ error: '删除失败' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    return new Response('页面不存在', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Admin error:', error);
    return new Response(JSON.stringify({ error: '管理功能错误：' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
