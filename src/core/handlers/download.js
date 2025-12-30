import { buildCorsHeaders } from '../utils/helpers.js';

export async function handleDownload(request, env, driveAPI, path, options = {}) {
  try {
    const corsHeaders = buildCorsHeaders(request, env);
    const fileId = path.substring(3);

    if (env.REQUIRE_SHARE_TOKEN === 'true' && !options.bypassShareCheck) {
      return new Response('下载需要分享链接授权', { status: 403, headers: corsHeaders });
    }
    
    if (!fileId) {
      return new Response('无效的文件ID', { status: 400, headers: corsHeaders });
    }

    // 获取文件信息
    const fileInfo = await driveAPI.getFileInfo(fileId);
    
    // 检查是否支持范围请求
    const rangeHeader = request.headers.get('Range');
    
    if (rangeHeader) {
      // 处理范围请求（用于大文件分段下载）
      return handleRangeDownload(request, env, driveAPI, fileId, fileInfo, rangeHeader);
    } else {
      // 普通下载
      return handleNormalDownload(request, env, driveAPI, fileId, fileInfo);
    }

  } catch (error) {
    console.error('Download error:', error);
    if (error.message.includes('404') || error.message.includes('not found')) {
      return new Response('文件不存在', { status: 404, headers: corsHeaders });
    }
    return new Response('下载失败', { status: 500, headers: corsHeaders });
  }
}

async function handleNormalDownload(request, env, driveAPI, fileId, fileInfo) {
  const corsHeaders = buildCorsHeaders(request, env);
  const fileResponse = await driveAPI.downloadFile(fileId);
  
  if (fileResponse.ok) {
    const headers = {
      'Content-Type': fileInfo.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileInfo.name)}"`,
      'Cache-Control': 'public, max-age=31536000',
      'Content-Length': fileInfo.size || '',
      'Accept-Ranges': 'bytes',
      ...corsHeaders
    };
    
    return new Response(fileResponse.body, { headers });
  } else {
    return new Response('文件不存在或已被删除', { status: 404, headers: corsHeaders });
  }
}

async function handleRangeDownload(request, env, driveAPI, fileId, fileInfo, rangeHeader) {
  const corsHeaders = buildCorsHeaders(request, env);
  // 解析范围请求 Range: bytes=start-end
  const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!rangeMatch) {
    return new Response('无效的范围请求', { status: 400, headers: corsHeaders });
  }

  const start = parseInt(rangeMatch[1]);
  const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : parseInt(fileInfo.size) - 1;
  const totalSize = parseInt(fileInfo.size);

  if (start >= totalSize || end >= totalSize || start > end) {
    return new Response('请求范围无效', { 
      status: 416, 
      headers: {
        'Content-Range': `bytes */${totalSize}`,
        ...corsHeaders
      }
    });
  }

  try {
    // 使用 Google Drive API 的范围下载
    const rangeResponse = await driveAPI.downloadFileRange(fileId, start, end);
    
    if (rangeResponse.ok) {
      const headers = {
        'Content-Type': fileInfo.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileInfo.name)}"`,
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Content-Length': (end - start + 1).toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
        ...corsHeaders
      };
      
      return new Response(rangeResponse.body, { status: 206, headers });
    } else {
      return new Response('范围下载失败', { status: 500, headers: corsHeaders });
    }
  } catch (error) {
    console.error('Range download error:', error);
    return new Response('范围下载失败', { status: 500, headers: corsHeaders });
  }
}
