import { ServerAuthManager } from './auth-manager.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token',
};

const authManager = new ServerAuthManager();

// 从环境变量获取配置，如果不存在则使用默认值
const getMaxFileSize = (env) => parseInt(env.MAX_FILE_SIZE || '104857600'); // 默认100MB
const getAllowedExtensions = (env) => env.ALLOWED_EXTENSIONS ? 
  env.ALLOWED_EXTENSIONS.toLowerCase().split(',') : 
  ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip', 'mp4', 'mp3'];

export async function handleUpload(request, env, driveAPI, url) {
  try {
    const formData = await request.formData();
    const password = formData.get('password');
    const file = formData.get('file');
    const authToken = request.headers.get('X-Auth-Token');

    // 认证检查：支持管理员token或上传密码
    let authenticated = false;
    
    if (authToken) {
      // Token认证（管理员模式）
      const verification = authManager.verifyAuthToken(authToken, env.ADMIN_PASSWORD);
      authenticated = verification.valid;
    } else if (password) {
      // 密码认证（游客模式）
      if (password === 'admin_authenticated') {
        // 前端标识的管理员模式，需要进一步验证
        return new Response(JSON.stringify({ error: '认证失败，请刷新页面重试' }), { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
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

    const maxFileSize = getMaxFileSize(env);
    const allowedExtensions = getAllowedExtensions(env);

    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / 1024 / 1024);
      return new Response(JSON.stringify({ error: `文件大小超过限制（${maxSizeMB}MB）` }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension && !allowedExtensions.includes(fileExtension)) {
      return new Response(JSON.stringify({ 
        error: `不支持的文件类型。支持的类型：${allowedExtensions.join(', ')}` 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 保留原始文件名，只进行安全化处理
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, '_');

    const fileBuffer = await file.arrayBuffer();
    const uploadResult = await driveAPI.uploadFile(
      safeFileName,
      fileBuffer,
      env.DRIVE_FOLDER_ID
    );

    if (uploadResult.id) {
      const downloadUrl = `${url.origin}/d/${uploadResult.id}`;
      return new Response(JSON.stringify({
        success: true,
        downloadUrl,
        fileName: file.name,
        fileId: uploadResult.id,
        fileSize: file.size
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } else {
      throw new Error('Upload result missing file ID');
    }

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: '上传失败：' + error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}