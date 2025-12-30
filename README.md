# CloudLink 📁

一个基于 Cloudflare Workers + Google Drive 的轻量级文件分享服务。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)

## 🚀 特性

### 核心功能
- **🌍 全球 CDN**：基于 Cloudflare 全球网络，访问速度快。
- **📤 多文件上传**：支持批量上传，拖拽操作，最大支持 2GB 文件。
- **🔐 智能认证**：基于 HMAC-SHA256 的安全 Token 认证，24小时免密。
- **📥 直链下载**：生成永久直链，支持断点续传。
- **👨‍💼 强化管理**：搜索、筛选、排序、批量删除的完整管理界面。
- **📱 响应式设计**：完美适配手机、平板、桌面端，新增**灵动悬浮按钮 (FAB)**。
- **🔒 安全加固**：彻底根除 XSS 风险，支持速率限制 (Rate Limiting)。

### 极致上传体验 (v3.1)
- **🚀 稳定分块**：采用 2MB 保守分块策略，根除 HTTP 500 错误。
- **🔄 指数退避重试**：网络抖动时自动执行最多 3 次智能重试。
- **⚡ 并发控制**：智能限制上传并发数，保护服务器资源。
- **🎯 全局拖拽**：页面任意位置释放文件即可触发上传遮罩。

## 📦 快速开始

### 1. 环境要求
- [Node.js](https://nodejs.org/) (v18+)
- Cloudflare 账号 & [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Google Cloud 账号（启用 Drive API）

### 2. 配置 Google Drive API
1.  **创建项目**：在 [Google Cloud Console](https://console.cloud.google.com) 创建新项目并启用 **Google Drive API**。
2.  **创建服务账号**：在 "IAM & 管理" -> "服务账号" 创建账号并下载 **JSON 密钥文件**。
3.  **共享目录**：在 Google Drive 创建存储文件夹，将其“编辑者”权限**共享**给服务账号邮箱，并记录该**文件夹 ID**。

### 3. 部署与配置
```bash
# 克隆并安装
git clone <your-repo-url>
cd cloudlink
npm install

# 设置敏感密钥 (Secrets)
wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL # 输入服务账号邮箱
wrangler secret put GOOGLE_PRIVATE_KEY           # 输入 JSON 中的 private_key 内容
wrangler secret put AUTH_TOKEN_SECRET            # 输入一段长随机字符串用于加密签名

# 创建 KV 命名空间
wrangler kv namespace create "UPLOAD_SESSIONS"
# 将输出的 binding 和 id 填入 wrangler.toml
```

### 4. 运行
```bash
npm run dev    # 本地预览 (http://localhost:8787)
npm run deploy # 部署到 Cloudflare
```

## 🔧 配置说明 (wrangler.toml)

| 变量名 | 说明 | 示例/默认值 |
|--------|------|------|
| `UPLOAD_PASSWORD` | 上传密码 | `your-upload-pass` |
| `ADMIN_PASSWORD` | 管理员密码 | `your-admin-pass` |
| `DRIVE_FOLDER_ID` | Google Drive 文件夹 ID | `1BxiMVs0...` |
| `MAX_FILE_SIZE` | 最大文件大小 (Bytes) | `2147483648` (2GB) |
| `ALLOWED_EXTENSIONS` | 允许的后缀（留空则不限制） | `jpg,png,pdf,mp4` |
| `RATE_LIMIT_WINDOW_MS` | 限流窗口（毫秒） | `60000` |
| `ALLOWED_ORIGINS` | 允许的跨域来源 | `https://your-domain.com` |

## 🛠️ 架构与开发 (Architecture & Dev)

CloudLink 从单体式工具演进为**模块化、可扩展的通用文件分享网关**。核心业务逻辑与底层存储实现完全解耦。

### 目录结构规范

**后端 (`src/`)** 采用 **处理器-驱动 (Handler-Provider)** 模式：
- **`src/index.js`**: 统一入口，负责路由分发与依赖注入。
- **`src/core/`**: 存储无关的核心业务层。
    - `auth/`: JWT 签名与密码哈希校验。
    - `handlers/`: 请求处理器（上传、下载、管理）。
    - `utils/`: 通用工具（限流器、CORS 辅助）。
- **`src/storage/`**: 存储抽象层。
    - `factory.js`: 根据配置动态生成存储实例。
    - `provider-interface.js`: 定义 `IStorageProvider` 接口规范。
    - `providers/`: 具体的云盘实现（目前实现 `google-drive/`）。

**前端 (`public/`)** 采用 **ES Modules (ESM)** 原生模块化：
- **`js/app.js`**: 主入口，负责初始化。
- **`js/ui/`**: 负责 DOM 渲染与交互。

### 存储接口规范 (IStorageProvider)

任何新的存储驱动（如 OneDrive, S3）只需实现以下接口即可无缝接入：

```javascript
/** @interface */
class IStorageProvider {
  async init() {}                                   // 初始化认证
  async listFiles(options) {}                       // 获取文件列表
  async uploadFile(file, fileName) {}               // 小文件直传
  async createUploadSession(fileName, fileSize) {}   // 启动分块上传
  async uploadChunk(sessionUrl, data, start, total) // 上传数据分块
  async checkUploadStatus(sessionUrl, totalSize)    // 检查上传进度
  async getFileInfo(fileId) {}                      // 获取元数据
  async deleteFile(fileId) {}                       // 删除文件
}
```

## 🔮 演进路线 (Roadmap)

1. **[已完成] 后端重构**：实现了目录分层与 Google Drive Provider 封装。
2. **[进行中] 前端模块化**：逐步将 `client.js` 拆分为 `js/ui/` 子模块。
3. **[计划中] 多盘支持**：接入 Cloudflare R2 或 OneDrive。
4. **[计划中] 分享增强**：支持分享链接设置独立访问密码与有效期（TTL）。

## 🔍 故障排除
-   **上传 401**: 检查 `AUTH_TOKEN_SECRET` 是否已设置。
-   **下载 404**: 确认文件 ID 正确且服务账号有权访问该文件夹。
-   **部署报错**: 确保已运行 `wrangler login` 且已创建 KV 命名空间。

## 📝 许可证
本项目基于 [MIT License](LICENSE) 开源。
