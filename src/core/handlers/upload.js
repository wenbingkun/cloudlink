import { ServerAuthManager } from '../auth/auth-manager.js';
import { buildCorsHeaders } from '../utils/helpers.js';

const authManager = new ServerAuthManager();

export async function handleUpload(request, env, storageProvider, url) {
  const corsHeaders = buildCorsHeaders(request, env);
  try {
    const formData = await request.formData();
    const password = formData.get('password');
    const file = formData.get('file');
    const authHeader = request.headers.get('Authorization');
    
    // 认证检查
    let authenticated = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const authToken = authHeader.substring(7);
      const verification = await authManager.verifyAuthToken(
        authToken,
        env.ADMIN_PASSWORD,
        env.AUTH_TOKEN_SECRET
      );
      authenticated = verification.valid;
    } else if (password) {
      authenticated = password === env.UPLOAD_PASSWORD;
    }

    if (!authenticated) {
      return new Response(JSON.stringify({ error: '认证失败' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!file) {
      return new Response(JSON.stringify({ error: '未选择文件' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 统一配置校验
    const maxFileSize = parseInt(env.MAX_FILE_SIZE || '2147483648');
    const allowedExtensions = env.ALLOWED_EXTENSIONS ? 
      env.ALLOWED_EXTENSIONS.toLowerCase().split(',') : [];

    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / 1024 / 1024);
      return new Response(JSON.stringify({ error: `文件大小超过限制（${maxSizeMB}MB）` }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (allowedExtensions.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        return new Response(JSON.stringify({ error: `不支持的文件类型` }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 安全文件名处理
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_\u4e00-\u9fa5]/g, '_');

    const fileBuffer = await file.arrayBuffer();
    const uploadResult = await storageProvider.uploadFile(
      safeFileName,
      fileBuffer,
      env.DRIVE_FOLDER_ID
    );

    return new Response(JSON.stringify({
      success: true,
      downloadUrl: `${url.origin}/d/${uploadResult.id}`
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: '上传失败：' + error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
