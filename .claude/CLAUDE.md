# CloudLink - 企业级文件分享服务

## 项目概述
CloudLink 是一个基于 Cloudflare Workers + Google Drive 的企业级文件分享服务，支持2GB超大文件上传，具备智能分块上传、实时性能监控和持久化会话管理功能。

## 技术栈
- **后端**: Cloudflare Workers + KV存储
- **存储**: Google Drive API (resumable upload)
- **前端**: 原生 HTML/CSS/JavaScript (单页应用)
- **会话管理**: Cloudflare KV (持久化)
- **监控**: 实时性能分析系统
- **部署**: Cloudflare Workers

## 开发命令
```bash
# 本地开发
npm run dev

# 部署到生产环境
npm run deploy

# 创建KV命名空间
wrangler kv namespace create "UPLOAD_SESSIONS"
wrangler kv namespace create "UPLOAD_SESSIONS" --preview

# 设置环境变量
wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
wrangler secret put GOOGLE_PRIVATE_KEY
```

## 项目结构
```
cloudlink/
├── src/
│   ├── index.js                  # 主入口文件
│   ├── google-drive-api.js       # Google Drive API 封装
│   ├── upload-handler.js         # 普通文件上传处理
│   ├── chunked-upload-handler.js # 分块上传处理 (新增)
│   ├── download-handler.js       # 文件下载处理
│   ├── admin-handler.js          # 管理功能处理
│   ├── auth-manager.js           # 认证管理 (新增)
│   ├── utils.js                  # 工具函数
│   └── pages/
│       ├── unified-page.js       # 统一界面 (主要页面)
│       ├── upload-page.js        # 上传页面
│       └── admin-page.js         # 管理页面
├── wrangler.toml             # Cloudflare 配置
├── package.json              # 项目配置
└── .gitignore               # Git 忽略文件
```

## 功能特性 (v3.0)

### 🚀 超大文件上传系统
- ✅ **2GB文件支持**: 智能分块上传，突破浏览器限制
- ✅ **双向网络检测**: 实时测试上传/下载带宽
- ✅ **自适应分块**: 1MB-64MB动态调整，根据网络优化
- ✅ **高并发上传**: 最高12路并发，管道化处理
- ✅ **断点续传**: KV持久化会话，24小时有效

### 📊 性能监控系统
- ✅ **实时监控**: 6级性能等级，停滞检测，ETA预测
- ✅ **智能策略**: ≤50MB直传，>50MB分块上传
- ✅ **性能报告**: 完整的上传分析和效率统计
- ✅ **XMLHttpRequest**: 精确到字节的进度追踪

### 🎯 核心功能
- ✅ **批量上传**: 支持拖拽，智能队列管理
- ✅ **双重认证**: Token持久化 + 密码保护
- ✅ **直链下载**: 永久分享链接
- ✅ **管理后台**: 搜索、筛选、批量操作
- ✅ **39种格式**: 图片、视频、音频、文档全支持
- ✅ **响应式设计**: 完美适配移动端

## 配置说明

### wrangler.toml 配置
```toml
[vars]
UPLOAD_PASSWORD = "your-upload-password"
ADMIN_PASSWORD = "your-admin-password"  
DRIVE_FOLDER_ID = "google-drive-folder-id"
MAX_FILE_SIZE = "2147483648"  # 2GB
ALLOWED_EXTENSIONS = "jpg,jpeg,png,..."

[[kv_namespaces]]
binding = "UPLOAD_SESSIONS"
id = "your-kv-namespace-id"
```

### Secrets (通过 wrangler secret 设置)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: 服务账号邮箱
- `GOOGLE_PRIVATE_KEY`: 服务账号私钥

## 路由说明

### 主要路由
- `GET /` - 统一上传/管理界面
- `POST /upload` - 普通文件上传
- `GET /d/:fileId` - 文件下载

### 分块上传路由 (新增)
- `POST /chunked-upload/start` - 启动分块上传会话
- `PUT /chunked-upload/chunk/:sessionId` - 上传文件分块
- `GET /chunked-upload/status/:sessionId` - 查询上传状态

### 管理路由
- `GET /admin` - 管理后台
- `POST /admin/login` - 管理员登录
- `POST /admin/verify-token` - Token验证
- `GET /admin/files` - 文件列表
- `DELETE /admin/delete/:fileId` - 删除文件

### 性能测试路由 (新增)
- `POST /speed-test` - 上传带宽测试

## 安全特性
- **Token认证**: 持久化身份验证，24小时有效
- **双重保护**: 管理员Token + 游客密码
- **文件限制**: 类型/大小/格式全方位验证
- **会话安全**: KV存储会话，自动过期清理
- **CORS配置**: 安全的跨域访问控制
- **文件名安全**: 防止路径遍历和注入攻击

## 性能特性 (v3.0)

### 网络自适应算法
```javascript
// 根据网络速度自动选择最优参数
超高速(>50Mbps): 32-64MB分块, 12路并发
高速(10-50Mbps): 16-32MB分块, 6-10路并发  
中速(2-10Mbps):  4-8MB分块,  2-6路并发
低速(<2Mbps):    1-4MB分块,  单路上传
```

### 性能监控系统
- **实时检测**: 10秒停滞检测，自动恢复提示
- **性能分级**: 🚀⚡📈🔄🐌⏳ 6级可视化等级
- **ETA预测**: 智能时间预测，精确到秒/分/小时
- **效率分析**: 完整性能报告，优化建议

## 注意事项
- 需要先设置 Google Drive API 服务账号
- 确保 Google Drive 文件夹正确共享给服务账号
- 生产环境部署前请修改默认密码
- 创建KV命名空间用于会话持久化
- 大文件上传需要稳定网络连接