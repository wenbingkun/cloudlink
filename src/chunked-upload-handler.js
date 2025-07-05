import { generateId } from './utils.js';
import { ServerAuthManager } from './auth-manager.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Range, X-Auth-Token',
};

const authManager = new ServerAuthManager();

const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks (增加默认大小)
const MIN_CHUNK_SIZE = 1 * 1024 * 1024; // 1MB minimum
const MAX_CHUNK_SIZE = 64 * 1024 * 1024; // 64MB maximum (增加最大分块)
// 使用KV存储替代内存Map，实现持久化会话管理

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

    // 将会话存储到KV，设置24小时过期
    await env.UPLOAD_SESSIONS.put(sessionId, JSON.stringify(session), {
      expirationTtl: 86400 // 24小时过期
    });

    console.log('Upload session created and stored in KV:', sessionId);

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
  const startTime = Date.now();
  try {
    const contentRange = request.headers.get('Content-Range');
    const contentLength = request.headers.get('Content-Length');
    const userAgent = request.headers.get('User-Agent')?.substring(0, 100);
    
    console.log('🔄 Processing chunk upload:', {
      sessionId,
      contentRange,
      contentLength,
      userAgent,
      timestamp: new Date().toISOString()
    });
    
    // 从KV存储读取会话
    const sessionData = await env.UPLOAD_SESSIONS.get(sessionId);
    if (!sessionData) {
      console.error('❌ Session not found in KV:', sessionId);
      return new Response(JSON.stringify({ error: '上传会话不存在或已过期' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const session = JSON.parse(sessionData);
    console.log('✅ Session loaded:', {
      sessionId,
      bytesUploaded: session.bytesUploaded,
      fileSize: session.fileSize,
      progress: Math.round((session.bytesUploaded / session.fileSize) * 100) + '%'
    });

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

    console.log('Chunk details:', { start, end, total, sessionId });
    const chunkData = await request.arrayBuffer();
    console.log('Chunk data size:', chunkData.byteLength);

    // 上传块到 Google Drive
    console.log('Uploading chunk to Google Drive...');
    const result = await driveAPI.uploadChunk(
      session.uploadUrl,
      chunkData,
      start,
      total
    );
    console.log('Google Drive upload result:', result);

    // 更新会话状态
    session.bytesUploaded = end + 1;
    session.lastActivity = Date.now();

    if (result.completed) {
      // 上传完成，删除KV会话
      console.log('Upload completed for session:', sessionId);
      await env.UPLOAD_SESSIONS.delete(sessionId);
      
      const downloadUrl = `${url.origin}/d/${result.result.id}`;
      
      return new Response(JSON.stringify({
        completed: true,
        downloadUrl,
        fileName: session.fileName,
        fileId: result.result.id,
        fileSize: session.fileSize,
        serverLog: 'Upload completed successfully'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else {
      // 继续上传，更新KV中的会话
      await env.UPLOAD_SESSIONS.put(sessionId, JSON.stringify(session), {
        expirationTtl: 86400 // 24小时过期
      });
      
      console.log('Chunk uploaded, continuing session:', sessionId, 'Progress:', session.bytesUploaded, '/', session.fileSize);
      return new Response(JSON.stringify({
        completed: false,
        bytesUploaded: session.bytesUploaded,
        nextStart: result.nextStart || session.bytesUploaded,
        serverLog: `Chunk processed, ${session.bytesUploaded}/${session.fileSize} bytes uploaded`
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('💥 Chunk upload failed:', {
      sessionId,
      error: error.message,
      stack: error.stack?.substring(0, 300),
      processingTime: processingTime + 'ms',
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ 
      error: '分块上传失败：' + error.message,
      sessionId,
      processingTime
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleUploadStatus(request, env, driveAPI, sessionId, url) {
  try {
    // 从KV存储读取会话
    const sessionData = await env.UPLOAD_SESSIONS.get(sessionId);
    if (!sessionData) {
      return new Response(JSON.stringify({ error: '上传会话不存在或已过期' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const session = JSON.parse(sessionData);

    // 检查 Google Drive 上传状态
    const status = await driveAPI.checkUploadStatus(session.uploadUrl, session.fileSize);

    if (status.completed) {
      // 上传完成，删除KV会话
      await env.UPLOAD_SESSIONS.delete(sessionId);
      
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
      // 更新会话状态并保存到KV
      session.bytesUploaded = status.bytesUploaded || session.bytesUploaded;
      session.lastActivity = Date.now();
      
      await env.UPLOAD_SESSIONS.put(sessionId, JSON.stringify(session), {
        expirationTtl: 86400 // 24小时过期
      });

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

// KV存储自动处理过期，无需手动清理会话