# CloudLink - 文件分享服务

## 项目概述
CloudLink 是一个基于 Cloudflare Workers + Google Drive 的文件分享服务，提供简单安全的文件上传和分享功能。

## 技术栈
- **后端**: Cloudflare Workers
- **存储**: Google Drive API
- **前端**: 原生 HTML/CSS/JavaScript
- **部署**: Cloudflare Workers

## 开发命令
```bash
# 本地开发
npm run dev

# 部署到生产环境
npm run deploy

# 设置环境变量
wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
wrangler secret put GOOGLE_PRIVATE_KEY
```

## 项目结构
```
cloudlink/
├── src/
│   ├── index.js              # 主入口文件
│   ├── google-drive-api.js   # Google Drive API 封装
│   ├── upload-handler.js     # 文件上传处理
│   ├── download-handler.js   # 文件下载处理
│   ├── admin-handler.js      # 管理功能处理
│   ├── utils.js              # 工具函数
│   └── pages/
│       ├── upload-page.js    # 上传页面
│       └── admin-page.js     # 管理页面
├── wrangler.toml             # Cloudflare 配置
├── package.json              # 项目配置
└── .gitignore               # Git 忽略文件
```

## 功能特性
- ✅ 文件上传（支持拖拽）
- ✅ 密码保护上传
- ✅ 直链下载
- ✅ 管理后台
- ✅ 文件列表和删除
- ✅ 文件大小限制（100MB）
- ✅ 文件类型限制
- ✅ 响应式设计

## 配置说明
在 `wrangler.toml` 中配置：
- `UPLOAD_PASSWORD`: 上传密码
- `ADMIN_PASSWORD`: 管理员密码  
- `DRIVE_FOLDER_ID`: Google Drive 文件夹 ID

通过 wrangler secret 设置敏感信息：
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: 服务账号邮箱
- `GOOGLE_PRIVATE_KEY`: 服务账号私钥

## 路由说明
- `GET /` - 上传页面
- `POST /upload` - 文件上传
- `GET /d/:fileId` - 文件下载
- `GET /admin` - 管理后台
- `POST /admin/login` - 管理员登录
- `GET /admin/files` - 文件列表
- `DELETE /admin/delete/:fileId` - 删除文件

## 安全特性
- 密码保护的上传功能
- 管理员身份验证
- 文件类型和大小限制
- CORS 头配置
- 安全的文件名处理

## 注意事项
- 需要先设置 Google Drive API 服务账号
- 确保 Google Drive 文件夹正确共享给服务账号
- 生产环境部署前请修改默认密码