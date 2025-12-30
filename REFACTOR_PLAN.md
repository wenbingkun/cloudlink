# CloudLink Architecture Refactoring Plan

## 🎯 Objective
Transition the project from a monolithic "Google Drive Wrapper" to a modular, extensible **Storage Provider Architecture**.
The goal is to decouple the core business logic (Upload/Download/Auth) from the specific storage implementation (Google Drive), enabling future support for OneDrive, S3, WebDAV, etc., with minimal friction.

## 🏗 Proposed Directory Structure

```text
src/
├── index.js                     # Entry point (Router & Dependency Injection)
├── config.js                    # Centralized configuration (Env vars parsing)
├── core/                        # Business Logic Layer (Storage Agnostic)
│   ├── auth/
│   │   └── auth-manager.js      # JWT & Password logic
│   ├── handlers/                # Request Handlers
│   │   ├── upload.js            # Standard upload handler
│   │   ├── chunked-upload.js    # Chunked upload session logic
│   │   ├── download.js          # Download redirect/proxy logic
│   │   └── admin.js             # Admin API logic
│   └── utils/
│       ├── rate-limiter.js
│       └── helpers.js
└── storage/                     # Storage Layer (The Interface)
    ├── provider-interface.js    # JSDoc definition of the Abstract Interface
    ├── factory.js               # StorageProviderFactory (Selects provider based on config)
    └── providers/               # Concrete Implementations
        └── google-drive/
            ├── index.js         # The Provider Class (Implements Interface)
            └── api-client.js    # Raw Google API calls (The old google-drive-api.js)
```

## 🧩 Interface Definition (`IStorageProvider`)

Every storage provider must implement the following methods. This contract ensures the `core/handlers` never need to know *which* cloud is being used.

```javascript
/**
 * @interface IStorageProvider
 */
class IStorageProvider {
  /**
   * Initialize the provider (e.g., fetch access tokens).
   * @returns {Promise<void>}
   */
  async init() {}

  /**
   * List files in the storage.
   * @param {object} options - { limit, pageToken, search, type }
   * @returns {Promise<{ files: Array, nextPageToken: string }>}
   */
  async listFiles(options) {}

  /**
   * Upload a small file directly.
   * @param {File|Blob} file 
   * @param {string} fileName 
   * @returns {Promise<{ id: string, name: string, size: number }>}
   */
  async uploadFile(file, fileName) {}

  /**
   * Start a resumable upload session (for large files).
   * @param {string} fileName 
   * @param {number} fileSize 
   * @returns {Promise<string>} - The upload URL (or session identifier)
   */
  async createUploadSession(fileName, fileSize) {}

  /**
   * Upload a single chunk to the session.
   * @param {string} sessionUrl - The URL returned by createUploadSession
   * @param {ArrayBuffer} chunkData 
   * @param {number} startByte 
   * @param {number} totalSize 
   * @returns {Promise<{ completed: boolean, id?: string, nextStart?: number }>}
   */
  async uploadChunk(sessionUrl, chunkData, startByte, totalSize) {}

  /**
   * Check the status of an upload session.
   * @param {string} sessionUrl 
   * @param {number} totalSize 
   * @returns {Promise<{ completed: boolean, bytesUploaded: number }>}
   */
  async checkUploadStatus(sessionUrl, totalSize) {}

  /**
   * Get a downloadable stream/response.
   * @param {string} fileId 
   * @returns {Promise<Response>}
   */
  async downloadFile(fileId) {}

  /**
   * Delete a file.
   * @param {string} fileId 
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileId) {}
}
```

## 🚀 Execution Steps

### Phase 1: Preparation
1.  **Backup**: Ensure the current working version is committed to Git.
2.  **Create Directories**: Set up the new folder structure.

### Phase 2: Migration (The "Lift and Shift")
1.  **Move Utils**: Move `utils.js` -> `src/core/utils/helpers.js` and `rate-limiter.js` -> `src/core/utils/rate-limiter.js`.
2.  **Move Auth**: Move `auth-manager.js` -> `src/core/auth/auth-manager.js`.
3.  **Refactor Google Drive API**:
    *   Rename `src/google-drive-api.js` to `src/storage/providers/google-drive/api-client.js`.
    *   Create `src/storage/providers/google-drive/index.js` which imports `api-client.js` and maps its methods to the `IStorageProvider` interface names.

### Phase 3: Handler Updates
1.  **Refactor Handlers**: Update `upload-handler.js`, `chunked-upload-handler.js`, etc. to import from `../storage/factory.js` (or accept the provider as an argument) instead of importing `GoogleDriveAPI` directly.
2.  **Dependency Injection**: In `src/index.js`, initialize the provider once:
    ```javascript
    const storageProvider = StorageFactory.create(env);
    await storageProvider.init(); // cache instance across requests when possible
    // Pass storageProvider to handlers
    return handleUpload(request, env, storageProvider);
    ```

### Phase 4: Verification
1.  **Run Tests**: Verify that file uploads (small & large), downloads, and listing still work exactly as before.
2.  **Linting**: Ensure no circular dependencies or missing imports.

## 🔮 Future Benefits
-   **Add OneDrive**: Create `src/storage/providers/onedrive/index.js`.
-   **Add S3**: Create `src/storage/providers/s3/index.js`.
-   **Local Dev**: Create `src/storage/providers/mock/index.js` to develop without needing internet or API keys.
