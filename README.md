# CloudLink 📁

一个基于 Cloudflare Workers + Google Drive 的轻量级文件分享服务。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)

## 🚀 特性

- **🌍 全球 CDN**：基于 Cloudflare 全球网络，访问速度快
- **📤 简单上传**：支持拖拽上传，最大支持 100MB 文件
- **🔐 密码保护**：上传和管理都需要密码验证
- **📥 直链下载**：生成永久直链，方便分享
- **👨‍💼 管理后台**：完整的文件管理界面
- **📱 响应式设计**：支持手机、平板、桌面端
- **🔒 安全可靠**：文件类型限制，安全的文件名处理

## 🎯 使用场景

- **团队文件分享**：内部文件快速分享
- **个人网盘**：利用 Google Drive 存储空间
- **临时文件传输**：无需注册，密码访问
- **图床服务**：图片直链生成

## 📦 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) (v16+)
- [Cloudflare 账号](https://cloudflare.com/)
- [Google Cloud 账号](https://cloud.google.com/)

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd cloudlink
npm install
```

### 2. Google Drive API 配置

#### 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建新项目或选择现有项目
3. 启用 **Google Drive API**

#### 创建服务账号

1. 导航至 **IAM & Admin** → **Service Accounts**
2. 点击 **Create Service Account**
3. 填写服务账号信息并创建
4. 点击创建的服务账号 → **Keys** → **Add Key** → **Create new key**
5. 选择 **JSON** 格式下载密钥文件

#### 设置 Google Drive 文件夹

1. 在 Google Drive 中创建一个新文件夹（如：`CloudLink-Storage`）
2. 右键点击文件夹 → **共享**
3. 添加服务账号邮箱（格式：`xxx@xxx.iam.gserviceaccount.com`）
4. 设置权限为 **编辑者**
5. 复制文件夹 ID（URL 中 `/folders/` 后面的字符串）

### 3. 配置环境变量

#### 修改 `wrangler.toml`

```toml
[vars]
UPLOAD_PASSWORD = "your-upload-password"
ADMIN_PASSWORD = "your-admin-password"  
DRIVE_FOLDER_ID = "your-google-drive-folder-id"
```

#### 设置 Cloudflare Secrets

```bash
# 安装并登录 Wrangler
npm install -g wrangler
wrangler login

# 设置服务账号邮箱
wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
# 输入：your-service-account@project.iam.gserviceaccount.com

# 设置私钥（从下载的 JSON 文件中复制 private_key 字段的值）
wrangler secret put GOOGLE_PRIVATE_KEY
# 输入：-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

### 4. 本地测试

```bash
npm run dev
```

访问 `http://localhost:8787` 测试功能。

### 5. 部署

```bash
npm run deploy
```

部署成功后会显示访问地址：`https://cloudlink.your-subdomain.workers.dev`

### 6. 绑定自定义域名（可选）

1. 在 Cloudflare Dashboard 中找到你的 Worker
2. **Settings** → **Triggers** → **Add Custom Domain**
3. 输入域名（如：`files.example.com`）
4. Cloudflare 会自动配置 DNS 和 SSL

## 🎮 使用指南

### 文件上传

1. 访问网站首页
2. 输入上传密码
3. 选择文件或拖拽到上传区域
4. 点击上传，获得下载链接

### 管理后台

1. 访问 `/admin`
2. 输入管理员密码
3. 查看文件列表、复制链接、删除文件

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `UPLOAD_PASSWORD` | 上传密码 | `myuploadpass` |
| `ADMIN_PASSWORD` | 管理员密码 | `myadminpass` |
| `DRIVE_FOLDER_ID` | Google Drive 文件夹 ID | `1BxiMVs0...` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | 服务账号邮箱 | `xxx@xxx.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | 服务账号私钥 | `-----BEGIN PRIVATE KEY-----...` |

### 安全设置

- **文件大小限制**：100MB（可在 `upload-handler.js` 中修改）
- **文件类型限制**：支持常见格式（可在 `upload-handler.js` 中配置）
- **密码保护**：上传和管理都需要密码验证

## 🛠️ 开发

### 项目结构

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
└── README.md                 # 项目文档
```

### API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/` | 上传页面 |
| `POST` | `/upload` | 文件上传 |
| `GET` | `/d/:fileId` | 文件下载 |
| `GET` | `/admin` | 管理后台 |
| `POST` | `/admin/login` | 管理员登录 |
| `GET` | `/admin/files` | 文件列表 |
| `DELETE` | `/admin/delete/:fileId` | 删除文件 |

### 本地开发

```bash
# 启动开发服务器
npm run dev

# 部署到生产环境
npm run deploy
```

## 🔍 故障排除

### 常见问题

**Q: 上传失败，显示 "Token request failed"**
- 检查服务账号邮箱和私钥是否正确设置
- 确认 Google Drive API 已启用

**Q: 文件上传成功但下载失败**
- 检查 Google Drive 文件夹权限
- 确认服务账号有文件夹的编辑权限

**Q: 管理后台无法加载文件列表**
- 检查 `DRIVE_FOLDER_ID` 是否正确
- 确认管理员密码是否正确

### 调试模式

在本地开发时，可以在浏览器控制台查看详细错误信息。

## 📝 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 支持

如有问题，请创建 Issue 或联系开发者。

---

**注意**：部署前请务必修改默认密码，确保服务安全。