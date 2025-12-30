# CloudLink 配置指南

## 快速开始

### 1. 环境要求
- Node.js 18+
- Cloudflare Workers 账户
- Google Cloud Platform 账户（用于 Google Drive API）

### 2. Google Drive API 配置

#### 创建服务账户
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google Drive API
4. 创建服务账户：
   - 转到 IAM & Admin > Service Accounts
   - 点击 "Create Service Account"
   - 填写服务账户详情
   - 创建并下载 JSON 密钥文件

#### 配置 Google Drive 权限
1. 创建一个 Google Drive 文件夹用于存储上传的文件
2. 右键点击文件夹 → 共享
3. 添加服务账户邮箱地址（从 JSON 文件中获取）
4. 授予 "编辑者" 权限
5. 复制文件夹 ID（URL 中 `/folders/` 后面的部分）

### 3. 环境变量配置

#### 方法一：使用 wrangler secret（推荐）
```bash
# 设置 Google Drive 服务账户邮箱
wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
# 输入: your-service-account@your-project.iam.gserviceaccount.com

# 设置 Google Drive 私钥
wrangler secret put GOOGLE_PRIVATE_KEY
# 输入: -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

# 设置认证签名密钥（用于JWT签名）
wrangler secret put AUTH_TOKEN_SECRET
# 输入: 32+位随机字符串
```

#### 方法二：修改 wrangler.toml
在 `wrangler.toml` 的 `[vars]` 部分添加：
```toml
DRIVE_FOLDER_ID = "your-google-drive-folder-id"
UPLOAD_PASSWORD = "your-secure-upload-password"
ADMIN_PASSWORD = "your-secure-admin-password"
ALLOWED_ORIGINS = "http://localhost:8787,https://files.example.com"
```

### 4. 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:8787
```

### 5. 部署到 Cloudflare Workers

```bash
# 部署到生产环境
npm run deploy
```

## 配置参数说明

### 必需配置
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Google 服务账户邮箱
- `GOOGLE_PRIVATE_KEY`: Google 服务账户私钥
- `DRIVE_FOLDER_ID`: Google Drive 文件夹 ID
- `AUTH_TOKEN_SECRET`: 管理员Token签名密钥（用于分享与登录）
- `AUTH_TOKEN_SECRET`: 管理员Token签名密钥

### 可选配置
- `UPLOAD_PASSWORD`: 上传密码（默认: CloudLink_Upload_2024!@#）
- `ADMIN_PASSWORD`: 管理员密码（默认: CloudLink_Admin_2024!@#）
- `MAX_FILE_SIZE`: 最大文件大小，字节（默认: 2147483648 = 2GB）
- `ALLOWED_EXTENSIONS`: 允许的文件扩展名，逗号分隔
- `ALLOWED_ORIGINS`: 允许的跨域来源，逗号分隔
- `REQUIRE_SHARE_TOKEN`: 是否强制分享链接下载（默认: false）
- `MAX_SHARE_TTL_SECONDS`: 分享链接最大有效期（默认: 604800）
- `STORAGE_PROVIDER`: 存储提供者类型（默认: google-drive）
- `RATE_LIMIT_WINDOW_MS`: 限流时间窗口（默认: 60000）
- `MAX_UPLOAD_REQUESTS_PER_MIN`: 上传接口限流次数/分钟
- `MAX_ADMIN_REQUESTS_PER_MIN`: 管理接口限流次数/分钟
- `MAX_CHUNK_REQUESTS_PER_MIN`: 分块上传限流次数/分钟

## 性能优化配置

### 保守策略（防止 HTTP 500 错误）
- 分块大小: 2MB（小文件1MB，大文件2MB）
- 最大并发上传: 2个
- 自动重试: 最多3次，指数退避延迟

### 自定义优化
可以在 `public/js/client.js` 中调整以下常量，或在 `public/index.html` 设置 `window.CLOUDLINK_CONFIG` 覆盖：
```javascript
const CHUNK_SIZE = 2 * 1024 * 1024; // 分块大小
const MAX_CONCURRENT_UPLOADS = 2; // 最大并发数
const MAX_RETRIES = 3; // 最大重试次数
```

## 故障排除

### 1. Google Drive API 配置问题
**错误**: "Google Drive API未配置"
**解决**: 确保已正确设置 `GOOGLE_SERVICE_ACCOUNT_EMAIL` 和 `GOOGLE_PRIVATE_KEY`

### 2. 上传失败 HTTP 500
**解决**: 项目已采用保守策略，降低分块大小和并发数

### 3. 权限错误
**错误**: "403 Forbidden"
**解决**: 检查 Google Drive 文件夹权限，确保服务账户有编辑权限

### 4. 文件大小限制
**错误**: "文件大小超过限制"
**解决**: 调整 `MAX_FILE_SIZE` 配置或升级 Cloudflare Workers 计划

## 安全建议

1. **更改默认密码**: 务必修改默认的上传和管理员密码
2. **使用 Secret**: 敏感信息使用 `wrangler secret` 而非明文配置
3. **权限最小化**: Google Drive 服务账户只授予必要的最小权限
4. **定期轮换**: 定期轮换密码和 API 密钥

## 监控和日志

### 启用调试日志
在前端点击 "显示调试日志" 按钮查看详细上传进度和错误信息。

### Cloudflare Workers 日志
使用 `wrangler tail` 查看实时日志：
```bash
wrangler tail
```

## KV 存储

需要创建并绑定分享链接 KV 命名空间：

```bash
wrangler kv namespace create "SHARE_LINKS"
```

### 性能监控
项目包含以下性能监控功能：
- 上传速度统计
- 错误分类和重试记录
- 处理时间追踪
- 内存使用优化

## 升级指南

### 从旧版本升级
1. 备份现有配置
2. 更新代码
3. 检查新的环境变量要求
4. 测试上传功能
5. 部署到生产环境

项目已实现向后兼容，但建议测试所有功能确保正常工作。
