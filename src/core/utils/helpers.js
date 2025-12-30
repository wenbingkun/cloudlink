export function generateId(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export function getFileExtension(fileName) {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function isValidFileType(fileName, allowedExtensions) {
  const extension = getFileExtension(fileName);
  return allowedExtensions.includes(extension);
}

export function resolveCorsOrigin(request, env) {
  const requestOrigin = request.headers.get('Origin');
  const urlOrigin = new URL(request.url).origin;
  const allowedOrigins = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [urlOrigin];

  if (!requestOrigin) {
    return { allowedOrigin: urlOrigin, allowedOrigins };
  }

  const allowedOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : null;
  return { allowedOrigin, allowedOrigins };
}

export function buildCorsHeaders(request, env) {
  const { allowedOrigin } = resolveCorsOrigin(request, env);
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Range, X-Auth-Token',
  };

  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    headers['Vary'] = 'Origin';
  }

  return headers;
}
