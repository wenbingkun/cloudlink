# CloudLink 📁

一个基于 Cloudflare Workers + Google Drive 的轻量级文件分享服务。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)

## 🚀 特性

### 核心功能
- **🌍 全球 CDN**：基于 Cloudflare 全球网络，访问速度快
- **📤 多文件上传**：支持批量上传，拖拽操作，最大支持 2GB 文件
- **🔐 智能认证**：Token持久化认证，24小时免密登录
- **📥 直链下载**：生成永久直链，方便分享
- **👨‍💼 强化管理**：搜索、筛选、排序、批量操作的完整管理界面
- **📱 响应式设计**：完美适配手机、平板、桌面端
- **🔒 安全可靠**：33种文件格式支持，安全的文件处理

### 上传体验
- **📁 批量上传**：一次选择多个文件，智能队列管理
- **🚀 智能分块上传**：大文件自动分块，移动端20MB+，桌面端50MB+启用
- **📊 详细进度显示**：进度百分比、上传速度、剩余时间、字节传输状态
- **🎯 智能判断**：根据设备类型自动调整上传策略
- **🛡️ 错误重试机制**：网络中断自动重试，友好的错误提示

### 管理增强
- **🔍 实时搜索**：文件名即时搜索，无需等待
- **🏷️ 类型筛选**：按图片、视频、音频、文档等分类查看
- **📈 智能排序**：按名称、大小、时间灵活排序
- **☑️ 批量操作**：批量选择、删除，提高管理效率
- **📊 统计面板**：文件数量、总大小、选择状态一目了然

### 文件支持（39种格式）
- **🖼️ 图片格式**：jpg, jpeg, png, gif, webp, svg, bmp, tiff
- **🎬 视频格式**：mp4, avi, mov, mkv, flv, wmv
- **🎵 音频格式**：mp3, wav, flac, aac, ogg
- **📄 文档类型**：pdf, doc, docx, ppt, pptx, xls, xlsx, csv, rtf
- **💻 开发文件**：js, css, html, json, xml, md, txt
- **🎤 字幕歌词**：lrc, srt, ass, ssa, vtt, sub
- **🗜️ 压缩包**：zip, rar, 7z, tar, gz

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

1. 访问网站首页，点击右上角⚙️进入管理后台
2. 输入上传密码
3. **单文件**：点击上传区域选择文件
4. **多文件**：选择多个文件或拖拽到上传区域
5. 查看上传队列，可移除不需要的文件
6. 点击上传，实时查看每个文件的上传进度
7. 上传完成后获得下载链接

### 管理后台

1. 访问 `/admin` 或点击首页右上角⚙️图标
2. 输入管理员密码（首次登录后24小时内免密）
3. **浏览文件**：查看所有上传的文件
4. **搜索筛选**：
   - 在搜索框输入文件名进行实时搜索
   - 使用类型筛选下拉框按文件类型分类查看
   - 选择排序方式（按名称、大小、时间）
5. **批量管理**：
   - 勾选文件进行批量选择
   - 使用"全选"/"取消选择"快速操作
   - 批量删除选中的文件
6. **单文件操作**：预览、复制链接、下载、删除

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

- **文件大小限制**：2GB（可在 `wrangler.toml` 中的 `MAX_FILE_SIZE` 修改）
- **文件类型限制**：支持33种格式（可在 `wrangler.toml` 中的 `ALLOWED_EXTENSIONS` 配置）
- **智能认证**：Token机制替代明文密码传输，24小时持久化登录
- **并发控制**：多文件上传时自动限制并发数量，保护服务器资源

## 🛠️ 开发

### 项目结构

```
cloudlink/
├── src/
│   ├── index.js              # 主入口文件
│   ├── google-drive-api.js   # Google Drive API 封装
│   ├── upload-handler.js     # 文件上传处理 (支持分块上传)
│   ├── download-handler.js   # 文件下载处理
│   ├── admin-handler.js      # 管理功能处理 (Token认证)
│   ├── auth-manager.js       # 认证管理器 (新增)
│   ├── utils.js              # 工具函数
│   └── pages/
│       ├── upload-page.js    # 上传页面 (多文件支持)
│       └── admin-page.js     # 管理页面 (搜索筛选)
├── wrangler.toml             # Cloudflare 配置
├── package.json              # 项目配置
└── README.md                 # 项目文档
```

### API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/` | 上传页面 (多文件支持) |
| `POST` | `/upload` | 普通文件上传 |
| `POST` | `/chunked-upload/start` | 开始分块上传 |
| `PUT` | `/chunked-upload/chunk/:sessionId` | 上传文件块 |
| `GET` | `/d/:fileId` | 文件下载 |
| `GET` | `/admin` | 管理后台 (增强UI) |
| `POST` | `/admin/login` | 管理员登录 (Token认证) |
| `POST` | `/admin/verify-token` | Token验证 (新增) |
| `GET` | `/admin/files` | 文件列表 (支持搜索筛选) |
| `DELETE` | `/admin/delete/:fileId` | 删除文件 (支持批量) |

### 本地开发

```bash
# 启动开发服务器
npm run dev

# 部署到生产环境
npm run deploy
```

## 🎉 版本更新

### v2.1.0 - 完美跨平台体验

**🌐 全平台支持**
- 📱 **iOS/Android 完美适配**：iPhone、iPad、Android手机/平板全支持
- 💻 **桌面端完整功能**：Windows、macOS、Linux 全平台兼容
- 🌐 **浏览器全覆盖**：Safari、Chrome、Firefox、Edge、Samsung Browser
- 🎯 **智能设备识别**：自动检测设备类型并优化交互体验

**🔧 技术升级**
- 🎨 **统一弹窗系统**：美观的自定义对话框，告别浏览器默认弹窗
- 🛠️ **友好错误提示**：智能错误分析，提供清晰的解决建议
- 📂 **文件格式扩展**：支持39种文件格式，包含lrc、srt等字幕文件
- 🔄 **保留原文件名**：上传后完全保持文件原始名称

**📱 移动端优化**
- 👆 **触摸事件优化**：touchstart/touchend 完美支持
- 📷 **iOS Safari 深度优化**：增强iOS相册访问，支持HEIC/HEIF格式
- 🎯 **智能提示文案**：根据设备类型显示对应操作提示
- 📏 **触摸目标优化**：符合iOS/Android人机交互指南
- 🔧 **多级降级处理**：iOS文件选择失败时自动尝试备用方案

**💡 用户体验升级**
- 🚀 **单页应用**：无刷新切换，流畅如原生应用
- 🔐 **智能认证**：Token持久化，登录一次24小时有效
- 📊 **即时反馈**：上传完成立即显示下载链接
- 🎪 **动画效果**：毛玻璃、渐变、过渡动画提升视觉体验
- 📱 **iOS专用提示**：为iOS Safari用户提供详细的操作指引

### v2.0.0 - 全面功能升级

**🚀 核心改进**
- ✨ **认证持久化**：Token机制，24小时免密登录
- 📁 **多文件上传**：批量选择，智能队列管理  
- ⚙️ **管理按钮图标化**：右上角⚙️图标，更简洁的界面
- 📈 **文件格式扩展**：从11种扩展到39种，几乎支持所有常用格式
- 🔍 **管理界面增强**：实时搜索、类型筛选、智能排序、批量操作

**💡 用户体验提升**
- 🎯 智能分块上传策略（移动端20MB+，桌面端50MB+）
- 📊 实时进度显示，每个文件独立状态
- ⚡ 并发上传控制，最多同时3个文件
- 🎨 流畅动画效果和视觉反馈
- 📱 完善的响应式设计优化

**🔧 技术优化**
- 🔐 Token认证替代明文密码传输
- 📦 智能文件类型识别和图标显示
- 🗃️ 高效的文件筛选和排序算法
- 🚀 性能优化的批量操作处理

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

**Q: iOS Safari 无法选择照片/视频**
- 确保使用最新版本的 Safari 浏览器（iOS 14+推荐）
- 点击上传区域后，选择"照片图库"来访问相册
- 如果首次访问失败，请刷新页面并重试
- 检查 Safari 设置 → 隐私与安全 → 相机/照片访问权限
- 清除 Safari 缓存：设置 → Safari → 清除历史记录与网站数据
- 尝试重启 Safari 浏览器或设备

**Q: 大文件上传失败或进度卡住**
- 大文件(>20MB)会自动使用分块上传，上传期间请保持网页打开
- 确保网络连接稳定，建议在WiFi环境下上传大文件
- 如果上传中断，刷新页面重新上传（已支持断点续传）
- 移动端建议关闭省电模式，避免后台网络被限制
- 检查浏览器是否有弹窗拦截，可能影响进度显示

**Q: Android 手机文件选择没有反应**
- 尝试使用 Chrome 浏览器
- 检查是否允许网站访问文件
- 确认文件管理器权限已开启

**Q: 文件添加到队列后无法删除**
- 刷新页面重试
- 确保 JavaScript 已启用
- 检查浏览器控制台错误信息

### 平台兼容性

✅ **iOS**: Safari 14+, Chrome, Firefox  
✅ **Android**: Chrome 80+, Firefox, Samsung Browser  
✅ **Desktop**: Chrome, Firefox, Safari, Edge

### 调试模式

在浏览器开发者工具中查看控制台，CloudLink 提供详细的调试信息：
- 设备检测信息
- 文件选择过程
- 上传状态跟踪
- 错误详细说明

## 📝 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 支持

如有问题，请创建 Issue 或联系开发者。

---

**注意**：部署前请务必修改默认密码，确保服务安全。