# CloudLink Project Context

## Project Overview
CloudLink is a lightweight, enterprise-grade file sharing service built on **Cloudflare Workers** and **Google Drive**. It leverages Cloudflare's global network for speed and Google Drive for storage, offering features like large file uploads (up to 2GB), resumable uploads, token-based authentication, and a responsive admin interface.

## Tech Stack
- **Runtime:** Node.js (v18+ recommended)
- **Platform:** Cloudflare Workers
- **Storage:** Google Drive API (v3)
- **Database:** Cloudflare KV (for session management)
- **Frontend:** Native HTML/CSS/JavaScript (Single Page Application)
- **Package Manager:** npm

## Key Features
- **Global CDN:** Fast access via Cloudflare.
- **Large File Support:** Chunked upload strategy supports files up to 2GB.
- **Resumable Uploads:** Intelligent retry mechanism and session persistence via KV.
- **Security:** Token-based auth (24h validity), default password warnings, rate limiting.
- **Admin Interface:** File management (search, filter, delete), dashboard.
- **Format Support:** 39+ file types (images, videos, docs, etc.).

## Project Structure

```text
cloudlink/
├── src/
│   ├── index.js                  # Main Worker entry point (router & config)
│   ├── config.js                 # Environment config parsing
│   ├── core/
│   │   ├── auth/
│   │   │   └── auth-manager.js   # Authentication & Token management
│   │   ├── handlers/
│   │   │   ├── upload.js         # Standard file upload logic
│   │   │   ├── chunked-upload.js # Logic for large file chunked uploads
│   │   │   ├── download.js       # File download logic
│   │   │   ├── admin.js          # Admin API endpoints
│   │   │   └── share.js          # Share link handling
│   │   └── utils/
│   │       ├── helpers.js        # Utility functions
│   │       ├── rate-limiter.js   # Rate limiting implementation
│   │       └── share-utils.js    # Share helpers
│   └── storage/
│       ├── factory.js            # Storage provider factory
│       ├── provider-interface.js # Provider interface definition
│       └── providers/
│           └── google-drive/
│               ├── api-client.js # Google Drive API wrapper
│               └── index.js      # Google Drive provider
├── public/                       # Static assets (served via Worker)
│   ├── index.html
│   ├── js/
│   │   └── app.js
│   ├── css/
│   │   └── styles.css
│   └── assets/
│       └── favicon.svg
├── SETUP.md                      # Detailed setup instructions
├── AGENTS.md                     # Contributor guidelines
├── GEMINI.md                     # Project context
├── wrangler.toml                 # Cloudflare Workers configuration
└── package.json                  # Dependencies and scripts
```

## Setup & Configuration

### Prerequisites
1.  **Node.js** (v18+)
2.  **Cloudflare Account** (Workers enabled)
3.  **Google Cloud Project** with Drive API enabled and a Service Account created.

### Environment Variables
Configuration is managed via `wrangler.toml` and `wrangler secret`.

**Secrets (Set via `wrangler secret put <KEY>`):**
-   `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Service account email.
-   `GOOGLE_PRIVATE_KEY`: Service account private key (PEM format).

**Variables (`wrangler.toml` `[vars]`):**
-   `DRIVE_FOLDER_ID`: Google Drive folder ID for storage.
-   `UPLOAD_PASSWORD`: Password for uploading files (Default: `CloudLink_Upload_2024!@#`).
-   `ADMIN_PASSWORD`: Password for admin access (Default: `CloudLink_Admin_2024!@#`).
-   `MAX_FILE_SIZE`: Max file size in bytes (Default: 2GB).
-   `ALLOWED_EXTENSIONS`: Comma-separated list of allowed file extensions.
-   `REQUIRE_SHARE_TOKEN`: Whether to require share link for downloads.
-   `MAX_SHARE_TTL_SECONDS`: Max share link lifetime in seconds.
-   `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds.
-   `MAX_UPLOAD_REQUESTS_PER_MIN`: Upload requests per minute.
-   `MAX_ADMIN_REQUESTS_PER_MIN`: Admin requests per minute.
-   `MAX_CHUNK_REQUESTS_PER_MIN`: Chunk upload requests per minute.
-   `STORAGE_PROVIDER`: Storage provider type (default: google-drive).

### KV Namespaces
Requires a KV namespace bound as `UPLOAD_SESSIONS`.
```bash
wrangler kv namespace create "UPLOAD_SESSIONS"
```

## Development Workflow

### Build & Run
-   **Install Dependencies:** `npm install`
-   **Local Development:** `npm run dev` (Runs `wrangler dev` on `http://localhost:8787`)
-   **Deploy:** `npm run deploy` (Runs `wrangler deploy`)

### Testing
-   **Speed Test:** `POST /speed-test` endpoint available.
-   **Debug Mode:** Frontend has a "Show Debug Log" feature.

## Architecture Highlights
-   **Router:** `src/index.js` handles routing, CORS, and initialization of `GoogleDriveAPI` and `RateLimiter`.
-   **Chunked Uploads:**
    -   Small files (<50MB): Direct upload.
    -   Large files (>50MB): Chunked upload using `chunked-upload-handler.js`.
    -   **Optimization:** Adaptive chunk sizing (1MB-64MB) based on network speed.
-   **Static Assets:** Served directly by the Worker using `env.ASSETS` (Cloudflare Workers Sites/Assets).
-   **Share Links:** `/share/create` creates share tokens; `/s/:token` validates passcode/expiry and proxies download.

## Important Notes
-   **Security:** Always change default passwords before production use.
-   **Rate Limiting:** IP-based rate limiting is implemented for upload and admin endpoints.
-   **Compatibility:** Frontend is optimized for desktop but responsive for mobile (iOS/Android).
