const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function handleDownload(request, env, driveAPI, path) {
  try {
    const fileId = path.substring(3);
    
    if (!fileId) {
      return new Response('无效的文件ID', { status: 400, headers: corsHeaders });
    }

    const [fileInfo, fileResponse] = await Promise.all([
      driveAPI.getFileInfo(fileId),
      driveAPI.downloadFile(fileId)
    ]);
    
    if (fileResponse.ok) {
      const headers = {
        'Content-Type': fileInfo.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileInfo.name)}"`,
        'Cache-Control': 'public, max-age=31536000',
        'Content-Length': fileInfo.size || '',
        ...corsHeaders
      };
      
      return new Response(fileResponse.body, { headers });
    } else {
      return new Response('文件不存在或已被删除', { status: 404, headers: corsHeaders });
    }

  } catch (error) {
    console.error('Download error:', error);
    if (error.message.includes('404') || error.message.includes('not found')) {
      return new Response('文件不存在', { status: 404, headers: corsHeaders });
    }
    return new Response('下载失败', { status: 500, headers: corsHeaders });
  }
}