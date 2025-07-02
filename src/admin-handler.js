import { getAdminPageHTML } from './pages/admin-page.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function handleAdmin(request, env, driveAPI, path, url) {
  try {
    if (path === '/admin' && request.method === 'GET') {
      return new Response(getAdminPageHTML(), {
        headers: { 'Content-Type': 'text/html', ...corsHeaders },
      });
    }

    if (path === '/admin/login' && request.method === 'POST') {
      const data = await request.json();
      
      if (data.password === env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } else {
        return new Response(JSON.stringify({ error: '管理员密码错误' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    if (path === '/admin/files' && request.method === 'GET') {
      const adminPassword = url.searchParams.get('password');
      
      if (adminPassword !== env.ADMIN_PASSWORD) {
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
        mimeType: file.mimeType,
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
      const data = await request.json();
      
      if (data.password !== env.ADMIN_PASSWORD) {
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