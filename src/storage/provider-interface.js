/**
 * @interface IStorageProvider
 * @property {function(): Promise<void>} init
 * @property {function(string, ArrayBuffer, string): Promise<object>} uploadFile
 * @property {function(string, number, string): Promise<string>} startResumableUpload
 * @property {function(string, ArrayBuffer, number, number): Promise<object>} uploadChunk
 * @property {function(string, number): Promise<object>} checkUploadStatus
 * @property {function(string): Promise<Response>} downloadFile
 * @property {function(string, number, number): Promise<Response>} downloadFileRange
 * @property {function(string): Promise<object>} getFileInfo
 * @property {function(string, number, string|null): Promise<object>} listFiles
 * @property {function(string): Promise<boolean>} deleteFile
 * @property {function(string, string): Promise<boolean>} renameFile
 */
export const IStorageProvider = {};
