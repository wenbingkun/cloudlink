export function getConfig(env) {
  return {
    storageProvider: (env.STORAGE_PROVIDER || 'google-drive').toLowerCase(),
    uploadPassword: env.UPLOAD_PASSWORD,
    adminPassword: env.ADMIN_PASSWORD,
    driveFolderId: env.DRIVE_FOLDER_ID,
    authTokenSecret: env.AUTH_TOKEN_SECRET,
    allowedOrigins: env.ALLOWED_ORIGINS,
    requireShareToken: env.REQUIRE_SHARE_TOKEN === 'true',
    maxShareTtlSeconds: parseInt(env.MAX_SHARE_TTL_SECONDS || '604800'),
    maxFileSize: parseInt(env.MAX_FILE_SIZE || '2147483648'),
    allowedExtensions: env.ALLOWED_EXTENSIONS,
    rateLimitWindowMs: parseInt(env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxUploadRequestsPerMin: parseInt(env.MAX_UPLOAD_REQUESTS_PER_MIN || '10'),
    maxAdminRequestsPerMin: parseInt(env.MAX_ADMIN_REQUESTS_PER_MIN || '10'),
    maxChunkRequestsPerMin: parseInt(env.MAX_CHUNK_REQUESTS_PER_MIN || '100'),
  };
}
