import { GoogleDriveAPI } from './api-client.js';

export class GoogleDriveProvider {
  constructor(env) {
    this.env = env;
    this.client = null;
  }

  async init() {
    if (!this.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !this.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Google Drive credentials not configured');
    }
    if (!this.client) {
      this.client = new GoogleDriveAPI(
        this.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        this.env.GOOGLE_PRIVATE_KEY
      );
    }
  }

  ensureClient() {
    if (!this.client) {
      throw new Error('Storage provider not initialized');
    }
    return this.client;
  }

  async uploadFile(fileName, fileContent, folderId) {
    return this.ensureClient().uploadFile(fileName, fileContent, folderId);
  }

  async startResumableUpload(fileName, fileSize, folderId) {
    return this.ensureClient().startResumableUpload(fileName, fileSize, folderId);
  }

  async uploadChunk(uploadUrl, chunk, start, totalSize) {
    return this.ensureClient().uploadChunk(uploadUrl, chunk, start, totalSize);
  }

  async checkUploadStatus(uploadUrl, totalSize) {
    return this.ensureClient().checkUploadStatus(uploadUrl, totalSize);
  }

  async downloadFile(fileId) {
    return this.ensureClient().downloadFile(fileId);
  }

  async downloadFileRange(fileId, start, end) {
    return this.ensureClient().downloadFileRange(fileId, start, end);
  }

  async getFileInfo(fileId) {
    return this.ensureClient().getFileInfo(fileId);
  }

  async listFiles(folderId, pageSize, pageToken) {
    return this.ensureClient().listFiles(folderId, pageSize, pageToken);
  }

  async deleteFile(fileId) {
    return this.ensureClient().deleteFile(fileId);
  }
}
