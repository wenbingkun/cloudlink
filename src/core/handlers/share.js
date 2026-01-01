import { buildCorsHeaders } from '../utils/helpers.js';
import { generateShareToken, hashPasscode, verifyPasscode } from '../utils/share-utils.js';
import { handleDownload } from './download.js';
import { ServerAuthManager } from '../auth/auth-manager.js';

function parsePositiveInt(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildShareHtml(url, token, error) {
  const errorBlock = error
    ? `<p style="color:#b91c1c;margin-top:12px;">${error}</p>`
    : '';
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CloudLink 分享验证</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8fafc;margin:0;padding:24px;color:#0f172a;}
    .card{max-width:420px;margin:10vh auto;background:#fff;padding:24px;border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.08);}
    h1{font-size:20px;margin:0 0 12px;}
    p{margin:0 0 16px;color:#475569;}
    input{width:100%;padding:12px 14px;border:1px solid #cbd5f5;border-radius:10px;font-size:16px;}
    button{margin-top:12px;width:100%;padding:12px;border:0;border-radius:10px;background:#4f46e5;color:#fff;font-weight:600;font-size:16px;cursor:pointer;}
  </style>
</head>
<body>
  <div class="card">
    <h1>请输入分享验证码</h1>
    <p>此链接需要验证码才能下载。</p>
    <form method="GET" action="${url}/s/${token}">
      <input type="password" name="code" placeholder="验证码" required>
      <button type="submit">验证并下载</button>
    </form>
    ${errorBlock}
  </div>
</body>
</html>`;
}

export async function handleShare(request, env, storageProvider, path, url) {
  const corsHeaders = buildCorsHeaders(request, env);
  if (!env.SHARE_LINKS) {
    return new Response(JSON.stringify({ error: '分享功能未配置KV存储' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (path === '/share/create' && request.method === 'POST') {
    return handleShareCreate(request, env, url, corsHeaders);
  }

  if (path.startsWith('/s/') && request.method === 'GET') {
    const token = path.substring('/s/'.length);
    return handleShareAccess(request, env, storageProvider, token, url, corsHeaders);
  }

  return new Response('Not found', { status: 404, headers: corsHeaders });
}

async function handleShareCreate(request, env, url, corsHeaders) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '未授权访问' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const authToken = authHeader.substring(7);
    const authManager = new ServerAuthManager();
    const verification = await authManager.verifyAuthToken(
      authToken,
      env.ADMIN_PASSWORD,
      env.AUTH_TOKEN_SECRET
    );
    if (!verification.valid) {
      return new Response(JSON.stringify({ error: '未授权访问' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const payload = await request.json();
    const fileId = payload.fileId?.trim();
    if (!fileId) {
      return new Response(JSON.stringify({ error: '缺少fileId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const maxTtlHours = parsePositiveInt(env.MAX_SHARE_TTL_HOURS, 168);
    const expiresInSeconds = maxTtlHours * 3600;
    if (!expiresInSeconds || expiresInSeconds <= 0) {
      return new Response(JSON.stringify({ error: '无效的过期时间' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const passcode = payload.passcode ? String(payload.passcode).trim() : '';
    const maxDownloads = parsePositiveInt(payload.maxDownloads, 0);

    const token = generateShareToken();
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    const shareRecord = {
      fileId,
      createdAt: Date.now(),
      expiresAt,
      maxDownloads,
      downloads: 0,
      passcodeRequired: Boolean(passcode),
      passcodeHash: passcode
        ? await hashPasscode(passcode, env.AUTH_TOKEN_SECRET || 'cloudlink-share')
        : null,
    };

    await env.SHARE_LINKS.put(token, JSON.stringify(shareRecord), {
      expirationTtl: expiresInSeconds,
    });

    const shareUrl = `${url.origin}/s/${token}`;

    return new Response(JSON.stringify({
      token,
      shareUrl,
      expiresAt,
      passcodeRequired: shareRecord.passcodeRequired,
      maxDownloads: shareRecord.maxDownloads
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Share create error:', error);
    return new Response(JSON.stringify({ error: '创建分享失败：' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

async function handleShareAccess(request, env, storageProvider, token, url, corsHeaders) {
  if (!token) {
    return new Response('无效的分享链接', { status: 400, headers: corsHeaders });
  }

  const shareData = await env.SHARE_LINKS.get(token);
  if (!shareData) {
    return new Response('分享链接不存在或已过期', { status: 404, headers: corsHeaders });
  }

  const shareRecord = JSON.parse(shareData);
  if (Date.now() > shareRecord.expiresAt) {
    return new Response('分享链接已过期', { status: 410, headers: corsHeaders });
  }

  if (shareRecord.maxDownloads && shareRecord.downloads >= shareRecord.maxDownloads) {
    return new Response('分享链接已达到下载上限', { status: 429, headers: corsHeaders });
  }

  const passcode = request.url ? new URL(request.url).searchParams.get('code') || '' : '';
  if (shareRecord.passcodeRequired) {
    if (!passcode) {
      return new Response(buildShareHtml(url.origin, token, ''), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
      });
    }

    const valid = await verifyPasscode(
      passcode,
      shareRecord.passcodeHash,
      env.AUTH_TOKEN_SECRET || 'cloudlink-share'
    );
    if (!valid) {
      return new Response(buildShareHtml(url.origin, token, '验证码错误'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
      });
    }
  }

  shareRecord.downloads += 1;
  await env.SHARE_LINKS.put(token, JSON.stringify(shareRecord), {
    expirationTtl: Math.max(1, Math.floor((shareRecord.expiresAt - Date.now()) / 1000)),
  });

  const downloadPath = `/d/${shareRecord.fileId}`;
  const downloadRequest = new Request(new URL(downloadPath, url.origin), request);
  return handleDownload(downloadRequest, env, storageProvider, downloadPath, { bypassShareCheck: true });
}
