import { generateId } from './utils.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

    if (password !== env.UPLOAD_PASSWORD) {
      return new Response(JSON.stringify({ error: '密码错误' }), { 
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

    const timestamp = Date.now();
    const randomId = generateId();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueFileName = `${timestamp}_${randomId}_${safeFileName}`;

    const fileBuffer = await file.arrayBuffer();
    const uploadResult = await driveAPI.uploadFile(
      uniqueFileName,
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