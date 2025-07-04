import { generateId } from './utils.js';
import { ServerAuthManager } from './auth-manager.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Range, X-Auth-Token',
};

const authManager = new ServerAuthManager();

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const MIN_CHUNK_SIZE = 1 * 1024 * 1024; // 1MB minimum
const MAX_CHUNK_SIZE = 16 * 1024 * 1024; // 16MB maximum
const uploadSessions = new Map(); // 在生产环境中应使用持久化存储

export async function handleChunkedUpload(request, env, driveAPI, path, url) {
  const segments = path.split('/');
  
  if (segments[2] === 'start' && request.method === 'POST') {
    return handleUploadStart(request, env, driveAPI, url);
  }
  
  if (segments[2] === 'chunk' && request.method === 'PUT') {
    const sessionId = segments[3];
    return handleChunkUpload(request, env, driveAPI, sessionId, url);
  }
  
  if (segments[2] === 'status' && request.method === 'GET') {
    const sessionId = segments[3];
    return handleUploadStatus(request, env, driveAPI, sessionId, url);
  }
  
  return new Response('Invalid chunked upload endpoint', { 
    status: 404, 
    headers: corsHeaders 
  });
}

async function handleUploadStart(request, env, driveAPI, url) {
  try {
    const data = await request.json();
    const { fileName, fileSize, password, chunkSize: requestedChunkSize } = data;
    const authToken = request.headers.get('X-Auth-Token');

    // 认证检查：支持管理员token或上传密码
    let authenticated = false;
    
    if (authToken) {
      // Token认证（管理员模式）
      const verification = authManager.verifyAuthToken(authToken, env.ADMIN_PASSWORD);
      authenticated = verification.valid;
    } else if (password) {
      // 密码认证（游客模式）
      authenticated = password === env.UPLOAD_PASSWORD;
    }

    if (!authenticated) {
      return new Response(JSON.stringify({ error: '认证失败' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 验证文件大小
    const maxFileSize = parseInt(env.MAX_FILE_SIZE || '2147483648');
    if (fileSize > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / 1024 / 1024);
      return new Response(JSON.stringify({ 
        error: `文件大小超过限制（${maxSizeMB}MB）` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 验证文件类型
    const allowedExtensions = env.ALLOWED_EXTENSIONS ? 
      env.ALLOWED_EXTENSIONS.toLowerCase().split(',') : 
      ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip', 'mp4', 'mp3'];
    
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    if (fileExtension && !allowedExtensions.includes(fileExtension)) {
      return new Response(JSON.stringify({ 
        error: `不支持的文件类型。支持的类型：${allowedExtensions.join(', ')}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 保留原始文件名，只进行安全化处理
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, '_');

    // 启动 Google Drive resumable upload
    const uploadUrl = await driveAPI.startResumableUpload(
      safeFileName, 
      fileSize, 
      env.DRIVE_FOLDER_ID
    );

    // 创建上传会话
    const sessionId = generateId(16);
    const session = {
      sessionId,
      fileName,
      safeFileName,
      fileSize,
      uploadUrl,
      bytesUploaded: 0,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    uploadSessions.set(sessionId, session);

    // 清理过期会话（超过1小时）
    cleanupExpiredSessions();

    // 动态选择最优分块大小
    let optimalChunkSize = requestedChunkSize || DEFAULT_CHUNK_SIZE;
    
    // 确保分块大小在合理范围内
    optimalChunkSize = Math.max(MIN_CHUNK_SIZE, Math.min(MAX_CHUNK_SIZE, optimalChunkSize));
    
    // 根据文件大小调整分块大小
    if (fileSize < 50 * 1024 * 1024) { // 小于50MB
      optimalChunkSize = Math.min(optimalChunkSize, 2 * 1024 * 1024); // 最大2MB
    } else if (fileSize > 500 * 1024 * 1024) { // 大于500MB
      optimalChunkSize = Math.max(optimalChunkSize, 8 * 1024 * 1024); // 最小8MB
    }

    return new Response(JSON.stringify({
      sessionId,
      chunkSize: optimalChunkSize,
      totalChunks: Math.ceil(fileSize / optimalChunkSize)
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Chunked upload start error:', error);
    return new Response(JSON.stringify({ 
      error: '启动分块上传失败：' + error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleChunkUpload(request, env, driveAPI, sessionId, url) {
  try {
    const session = uploadSessions.get(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: '上传会话不存在或已过期' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const contentRange = request.headers.get('Content-Range');
    if (!contentRange) {
      return new Response(JSON.stringify({ error: '缺少 Content-Range 头' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 解析 Content-Range: bytes start-end/total
    const rangeMatch = contentRange.match(/bytes (\d+)-(\d+)\/(\d+)/);
    if (!rangeMatch) {
      return new Response(JSON.stringify({ error: '无效的 Content-Range 格式' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    const total = parseInt(rangeMatch[3]);

    const chunkData = await request.arrayBuffer();

    // 上传块到 Google Drive
    const result = await driveAPI.uploadChunk(
      session.uploadUrl,
      chunkData,
      start,
      total
    );

    // 更新会话状态
    session.bytesUploaded = end + 1;
    session.lastActivity = Date.now();

    if (result.completed) {
      // 上传完成
      uploadSessions.delete(sessionId);
      
      const downloadUrl = `${url.origin}/d/${result.result.id}`;
      
      return new Response(JSON.stringify({
        completed: true,
        downloadUrl,
        fileName: session.fileName,
        fileId: result.result.id,
        fileSize: session.fileSize
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else {
      // 继续上传
      return new Response(JSON.stringify({
        completed: false,
        bytesUploaded: session.bytesUploaded,
        nextStart: result.nextStart || session.bytesUploaded
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

  } catch (error) {
    console.error('Chunk upload error:', error);
    return new Response(JSON.stringify({ 
      error: '分块上传失败：' + error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleUploadStatus(request, env, driveAPI, sessionId, url) {
  try {
    const session = uploadSessions.get(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: '上传会话不存在或已过期' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 检查 Google Drive 上传状态
    const status = await driveAPI.checkUploadStatus(session.uploadUrl, session.fileSize);

    if (status.completed) {
      // 上传完成
      uploadSessions.delete(sessionId);
      
      const downloadUrl = `${url.origin}/d/${status.result.id}`;
      
      return new Response(JSON.stringify({
        completed: true,
        downloadUrl,
        fileName: session.fileName,
        fileId: status.result.id
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else {
      // 更新会话状态
      session.bytesUploaded = status.bytesUploaded || session.bytesUploaded;
      session.lastActivity = Date.now();

      return new Response(JSON.stringify({
        completed: false,
        bytesUploaded: session.bytesUploaded,
        totalSize: session.fileSize,
        progress: Math.round((session.bytesUploaded / session.fileSize) * 100)
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

  } catch (error) {
    console.error('Upload status check error:', error);
    return new Response(JSON.stringify({ 
      error: '检查上传状态失败：' + error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

function cleanupExpiredSessions() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  for (const [sessionId, session] of uploadSessions.entries()) {
    if (now - session.lastActivity > oneHour) {
      uploadSessions.delete(sessionId);
    }
  }
}