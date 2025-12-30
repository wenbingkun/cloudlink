import { buildCorsHeaders } from '../utils/helpers.js';
import { ServerAuthManager } from '../auth/auth-manager.js';

const authManager = new ServerAuthManager();

const DEFAULT_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks (保守策略)
const MIN_CHUNK_SIZE = 1 * 1024 * 1024; // 1MB minimum
const MAX_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB maximum

export async function handleChunkedUpload(request, env, driveAPI, path, url) {
  const corsHeaders = buildCorsHeaders(request, env);
  const segments = path.split('/');
  
  if (segments[2] === 'start' && request.method === 'POST') {
    return handleUploadStart(request, env, driveAPI, url, corsHeaders);
  }
  
  if (segments[2] === 'chunk' && request.method === 'PUT') {
    const sessionId = segments[3];
    return handleChunkUpload(request, env, driveAPI, sessionId, url, corsHeaders);
  }
  
  if (segments[2] === 'status' && request.method === 'GET') {
    const sessionId = segments[3];
    return handleUploadStatus(request, env, driveAPI, sessionId, url, corsHeaders);
  }
  
  return new Response('Invalid chunked upload endpoint', { 
    status: 404, 
    headers: corsHeaders 
  });
}

// 辅助函数：校验请求权限
async function verifyRequestAuth(request, env, password) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const authToken = authHeader.substring(7);
    const verification = await authManager.verifyAuthToken(
      authToken,
      env.ADMIN_PASSWORD,
      env.AUTH_TOKEN_SECRET
    );
    if (verification.valid) return true;
  }
  if (password && password === env.UPLOAD_PASSWORD) {
    return true;
  }
  return false;
}

async function hashSessionToken(token, secret) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${token}:${secret}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function verifySessionToken(request, session, env) {
  const headerToken = request.headers.get('X-Upload-Token');
  if (!headerToken || !session.sessionTokenHash) return false;
  const secret = env.AUTH_TOKEN_SECRET || 'cloudlink-session';
  const headerHash = await hashSessionToken(headerToken, secret);
  if (headerHash.length !== session.sessionTokenHash.length) return false;
  let result = 0;
  for (let i = 0; i < headerHash.length; i++) {
    result |= headerHash.charCodeAt(i) ^ session.sessionTokenHash.charCodeAt(i);
  }
  return result === 0;
}

async function handleUploadStart(request, env, driveAPI, url, corsHeaders) {
  try {
    const data = await request.json();
    const { fileName, fileSize, password, chunkSize: requestedChunkSize } = data;

    // 1. 认证检查
    const authenticated = await verifyRequestAuth(request, env, password);
    if (!authenticated) {
      return new Response(JSON.stringify({ error: '认证失败' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 2. 验证文件大小 (优先使用环境变量)
    const maxFileSize = parseInt(env.MAX_FILE_SIZE || '2147483648');
    if (fileSize > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / 1024 / 1024);
      return new Response(JSON.stringify({ 
        error: `文件大小超过限制（最大支持 ${maxSizeMB}MB）` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 3. 验证文件类型
    const allowedExtensions = env.ALLOWED_EXTENSIONS ? 
      env.ALLOWED_EXTENSIONS.toLowerCase().split(',') : [];
    
    if (allowedExtensions.length > 0) {
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        return new Response(JSON.stringify({ 
          error: `不支持的文件类型。` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 4. 生成安全文件名
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_\u4e00-\u9fa5]/g, '_');

    // 5. 启动 Google Drive resumable upload
    const uploadUrl = await driveAPI.startResumableUpload(
      safeFileName, 
      fileSize, 
      env.DRIVE_FOLDER_ID
    );

    // 6. 创建上传会话 (使用强随机 UUID)
    const sessionId = crypto.randomUUID();
    const sessionToken = crypto.randomUUID();
    const session = {
      sessionId,
      fileName,
      fileSize,
      uploadUrl,
      bytesUploaded: 0,
      createdAt: Date.now(),
      // 记录认证方式，以便后续 chunk 校验
      authMode: (request.headers.get('Authorization')) ? 'admin' : 'password',
      sessionTokenHash: await hashSessionToken(
        sessionToken,
        env.AUTH_TOKEN_SECRET || 'cloudlink-session'
      )
    };

    await env.UPLOAD_SESSIONS.put(sessionId, JSON.stringify(session), {
      expirationTtl: 86400 
    });

    // 7. 确定分块大小
    let optimalChunkSize = requestedChunkSize || DEFAULT_CHUNK_SIZE;
    optimalChunkSize = Math.max(MIN_CHUNK_SIZE, Math.min(MAX_CHUNK_SIZE, optimalChunkSize));

    return new Response(JSON.stringify({
      sessionId: session.sessionId,
      sessionToken,
      chunkSize: optimalChunkSize,
      totalChunks: Math.ceil(fileSize / optimalChunkSize)
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleChunkUpload(request, env, driveAPI, sessionId, url, corsHeaders) {
  let chunkData = null;
  try {
    const sessionData = await env.UPLOAD_SESSIONS.get(sessionId);
    if (!sessionData) {
      return new Response(JSON.stringify({ error: '上传会话不存在或已过期' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    const session = JSON.parse(sessionData);

    const tokenValid = await verifySessionToken(request, session, env);
    if (!tokenValid) {
      return new Response(JSON.stringify({ error: '缺少或无效的上传令牌' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 安全增强：校验后续 chunk 请求的认证
    // 如果是管理员模式启动的，则 PUT 必须带有效 Token
    if (session.authMode === 'admin') {
      const authenticated = await verifyRequestAuth(request, env);
      if (!authenticated) {
        return new Response(JSON.stringify({ error: '认证失效，请重新登录' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    const contentRange = request.headers.get('Content-Range');
    if (!contentRange) {
      return new Response(JSON.stringify({ error: 'Missing Content-Range' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const rangeMatch = contentRange.match(/bytes (\d+)-(\d+)\/(\d+)/);
    if (!rangeMatch) throw new Error('Invalid Content-Range');

    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    const total = parseInt(rangeMatch[3]);

    chunkData = await request.arrayBuffer();
    
    // 超时控制
    const uploadPromise = driveAPI.uploadChunk(session.uploadUrl, chunkData, start, total);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Upload Timeout')), 60000));
    
    const result = await Promise.race([uploadPromise, timeoutPromise]);

    session.bytesUploaded = end + 1;
    if (result.completed) {
      await env.UPLOAD_SESSIONS.delete(sessionId);
      return new Response(JSON.stringify({
        completed: true,
        downloadUrl: `${url.origin}/d/${result.result.id}`
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else {
      await env.UPLOAD_SESSIONS.put(sessionId, JSON.stringify(session), { expirationTtl: 86400 });
      return new Response(JSON.stringify({
        completed: false,
        bytesUploaded: session.bytesUploaded
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } finally {
    chunkData = null;
  }
}

async function handleUploadStatus(request, env, driveAPI, sessionId, url, corsHeaders) {
  const sessionData = await env.UPLOAD_SESSIONS.get(sessionId);
  if (!sessionData) return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: corsHeaders });
  
  const session = JSON.parse(sessionData);
  const tokenValid = await verifySessionToken(request, session, env);
  if (!tokenValid) {
    return new Response(JSON.stringify({ error: '缺少或无效的上传令牌' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  const status = await driveAPI.checkUploadStatus(session.uploadUrl, session.fileSize);

  if (status.completed) {
    await env.UPLOAD_SESSIONS.delete(sessionId);
    return new Response(JSON.stringify({ completed: true, downloadUrl: `${url.origin}/d/${status.result.id}` }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } else {
    return new Response(JSON.stringify({ completed: false, bytesUploaded: status.bytesUploaded }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
