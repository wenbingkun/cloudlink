import { generateId } from './utils.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
  'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm',
  'mp3', 'wav', 'aac', 'flac', 'ogg',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'md', 'rtf',
  'zip', 'rar', '7z', 'tar', 'gz',
  'exe', 'msi', 'dmg', 'pkg',
  'json', 'xml', 'csv', 'sql'
];

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

    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: '文件大小超过限制（100MB）' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return new Response(JSON.stringify({ error: '不支持的文件类型' }), { 
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