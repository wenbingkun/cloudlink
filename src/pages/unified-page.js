export function getUnifiedPageHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudLink - 文件分享服务</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            background-attachment: fixed;
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }
        
        body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
            pointer-events: none;
            z-index: 0;
        }
        
        .main-container {
            position: relative;
            z-index: 1;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .header h1 {
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 36px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin-bottom: 20px;
        }
        
        .nav-tabs {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 20px;
        }
        
        .nav-tab {
            padding: 12px 25px;
            border: 2px solid rgba(102, 126, 234, 0.3);
            border-radius: 15px;
            background: rgba(102, 126, 234, 0.1);
            color: #667eea;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
            user-select: none;
            position: relative;
            overflow: hidden;
        }
        
        .nav-tab::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.2), transparent);
            transition: left 0.6s ease;
        }
        
        .nav-tab:hover::before {
            left: 100%;
        }
        
        .nav-tab.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-color: #667eea;
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }
        
        .content-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 25px;
            padding: 50px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .content-section {
            display: none;
            animation: fadeIn 0.3s ease-in-out;
        }
        
        .content-section.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* 登录界面样式 */
        .login-container {
            text-align: center;
            max-width: 400px;
            margin: 0 auto;
        }
        
        .login-container h2 {
            color: #333;
            margin-bottom: 30px;
            font-size: 24px;
        }
        
        .login-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .form-group label {
            font-weight: 600;
            color: #555;
            text-align: left;
        }
        
        .form-group input {
            padding: 15px;
            border: 2px solid rgba(102, 126, 234, 0.2);
            border-radius: 12px;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
        
        .btn-secondary {
            background: rgba(102, 126, 234, 0.1);
            color: #667eea;
            border: 2px solid rgba(102, 126, 234, 0.3);
        }
        
        .btn-secondary:hover {
            background: rgba(102, 126, 234, 0.2);
        }
        
        /* 上传界面样式 */
        .upload-area {
            border: 3px dashed rgba(102, 126, 234, 0.3);
            border-radius: 20px;
            padding: 60px 30px;
            text-align: center;
            margin-bottom: 30px;
            transition: all 0.4s ease;
            cursor: pointer;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
            position: relative;
            overflow: hidden;
        }
        
        .upload-area:hover {
            border-color: #667eea;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
            transform: translateY(-2px);
        }
        
        .upload-area.dragover {
            border-color: #667eea;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            transform: scale(1.02);
        }
        
        .upload-icon {
            font-size: 48px;
            margin-bottom: 20px;
            color: #667eea;
        }
        
        .upload-text {
            font-size: 18px;
            color: #333;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .upload-hint {
            font-size: 14px;
            color: #666;
        }
        
        .file-queue {
            margin-top: 30px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .file-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            border: 2px solid rgba(102, 126, 234, 0.1);
            border-radius: 12px;
            margin-bottom: 10px;
            background: rgba(102, 126, 234, 0.02);
            transition: all 0.3s ease;
        }
        
        .file-info {
            display: flex;
            flex-direction: column;
            gap: 5px;
            flex-grow: 1;
        }
        
        .file-name {
            font-weight: 600;
            color: #333;
        }
        
        .file-size {
            font-size: 14px;
            color: #666;
        }
        
        .file-status {
            font-size: 14px;
            font-weight: 600;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(102, 126, 234, 0.1);
            border-radius: 4px;
            overflow: hidden;
            margin-top: 8px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.3s ease;
        }
        
        .file-actions {
            display: flex;
            gap: 10px;
        }
        
        .btn-sm {
            padding: 8px 15px;
            font-size: 14px;
        }
        
        .btn-danger {
            background: #ff4757;
            color: white;
        }
        
        .btn-danger:hover {
            background: #ff3742;
        }
        
        .upload-controls {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 30px;
        }
        
        .hidden {
            display: none !important;
        }
        
        /* 管理界面样式 */
        .admin-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 30px;
            align-items: center;
        }
        
        .search-input {
            flex: 1;
            min-width: 200px;
            padding: 12px 15px;
            border: 2px solid rgba(102, 126, 234, 0.2);
            border-radius: 12px;
            font-size: 16px;
        }
        
        .filter-select {
            padding: 12px 15px;
            border: 2px solid rgba(102, 126, 234, 0.2);
            border-radius: 12px;
            font-size: 16px;
            background: white;
        }
        
        .admin-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .stat-item {
            background: rgba(102, 126, 234, 0.1);
            padding: 15px 20px;
            border-radius: 12px;
            text-align: center;
            flex: 1;
            min-width: 120px;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #667eea;
        }
        
        .stat-label {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        
        .files-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .file-card {
            border: 2px solid rgba(102, 126, 234, 0.1);
            border-radius: 15px;
            padding: 20px;
            background: rgba(102, 126, 234, 0.02);
            transition: all 0.3s ease;
        }
        
        .file-card:hover {
            border-color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.1);
        }
        
        .file-card.selected {
            border-color: #667eea;
            background: rgba(102, 126, 234, 0.1);
        }
        
        .file-card-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .file-checkbox {
            width: 20px;
            height: 20px;
            cursor: pointer;
        }
        
        .file-icon {
            font-size: 24px;
            color: #667eea;
        }
        
        .file-card-title {
            font-weight: 600;
            color: #333;
            flex-grow: 1;
            word-break: break-word;
        }
        
        .file-card-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            font-size: 14px;
            color: #666;
        }
        
        .file-card-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .btn-xs {
            padding: 6px 12px;
            font-size: 12px;
        }
        
        .batch-actions {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .batch-actions.hidden {
            display: none;
        }
        
        /* Toast 通知样式 */
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-left: 4px solid #667eea;
            border-radius: 12px;
            padding: 15px 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 350px;
        }
        
        .toast.success {
            border-left-color: #4caf50;
        }
        
        .toast.error {
            border-left-color: #f44336;
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* 密码输入模态框样式 */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        }
        
        .modal-content {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.2);
            max-width: 400px;
            width: 90%;
            animation: scaleIn 0.3s ease;
        }
        
        @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        
        .modal-title {
            font-size: 24px;
            font-weight: 700;
            color: #333;
            margin-bottom: 20px;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .modal-description {
            color: #666;
            margin-bottom: 25px;
            text-align: center;
        }
        
        .modal-input {
            width: 100%;
            padding: 15px;
            border: 2px solid rgba(102, 126, 234, 0.2);
            border-radius: 12px;
            font-size: 16px;
            margin-bottom: 25px;
            transition: all 0.3s ease;
        }
        
        .modal-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .modal-actions {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
        }
        
        .modal-btn {
            padding: 12px 25px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .modal-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .modal-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
        
        .modal-btn-secondary {
            background: rgba(102, 126, 234, 0.1);
            color: #667eea;
            border: 2px solid rgba(102, 126, 234, 0.3);
        }
        
        .modal-btn-secondary:hover {
            background: rgba(102, 126, 234, 0.2);
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .main-container {
                padding: 10px;
            }
            
            .header, .content-container {
                padding: 25px;
            }
            
            .nav-tabs {
                flex-direction: column;
                gap: 10px;
            }
            
            .nav-tab {
                padding: 15px 20px;
            }
            
            .admin-controls {
                flex-direction: column;
                align-items: stretch;
            }
            
            .search-input {
                min-width: unset;
            }
            
            .files-grid {
                grid-template-columns: 1fr;
            }
            
            .upload-area {
                padding: 40px 20px;
                min-height: 140px;
                border-width: 2px;
            }
            
            .upload-area:hover,
            .upload-area:active {
                transform: none;
                border-color: #667eea;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
            }
            
            .upload-icon {
                font-size: 36px;
            }
            
            .upload-text {
                font-size: 16px;
            }
            
            .upload-hint {
                font-size: 13px;
            }
            
            /* 移动端触摸优化 */
            .upload-area {
                -webkit-tap-highlight-color: rgba(102, 126, 234, 0.2);
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
            }
        }
        
        /* Android特定优化 */
        @media screen and (max-width: 768px) {
            .upload-area {
                border-radius: 15px;
                transition: all 0.2s ease;
            }
            
            .modal-content {
                width: 95%;
                padding: 30px 20px;
            }
            
            .btn {
                min-height: 44px; /* iOS/Android推荐的最小触摸目标 */
            }
        }
    </style>
</head>
<body>
    <div class="main-container">
        <!-- 头部导航 -->
        <div class="header">
            <h1>CloudLink</h1>
            <div class="nav-tabs">
                <div class="nav-tab active" data-tab="upload">
                    📁 文件上传
                </div>
                <div class="nav-tab" data-tab="admin">
                    ⚙️ 文件管理
                </div>
            </div>
        </div>

        <!-- 主内容区域 -->
        <div class="content-container">
            <!-- 登录界面 -->
            <div id="login-section" class="content-section">
                <div class="login-container">
                    <h2>管理员登录</h2>
                    <form class="login-form" id="loginForm">
                        <div class="form-group">
                            <label for="adminPassword">管理员密码</label>
                            <input type="password" id="adminPassword" required>
                        </div>
                        <button type="submit" class="btn btn-primary">登录</button>
                    </form>
                </div>
            </div>

            <!-- 上传界面 -->
            <div id="upload-section" class="content-section active">
                <div class="upload-area" id="uploadArea">
                    <div class="upload-icon">📁</div>
                    <div class="upload-text">拖拽文件到这里，或点击选择文件</div>
                    <div class="upload-hint">支持多文件上传，最大 2GB</div>
                    <input type="file" id="fileInput" style="display: none;" multiple accept="image/*,video/*,audio/*,application/*,text/*,.pdf,.doc,.docx,.txt,.zip,.rar,.7z,.mp3,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.ppt,.pptx,.xls,.xlsx,.csv,.rtf,.md,.json,.xml,.html,.css,.js,.lrc,.srt,.ass,.ssa,.vtt,.sub,.tar,.gz,.wav,.flac,.aac,.ogg,.mkv,.flv,.wmv">
                </div>
                
                <div class="file-queue" id="fileQueue"></div>
                
                <div class="upload-controls">
                    <button id="uploadBtn" class="btn btn-primary" disabled>开始上传</button>
                    <button id="clearBtn" class="btn btn-secondary">清空队列</button>
                </div>
            </div>

            <!-- 管理界面 -->
            <div id="admin-section" class="content-section">
                <div class="admin-controls">
                    <input type="text" id="searchInput" class="search-input" placeholder="搜索文件...">
                    <select id="typeFilter" class="filter-select">
                        <option value="">所有类型</option>
                        <option value="image">图片</option>
                        <option value="video">视频</option>
                        <option value="audio">音频</option>
                        <option value="document">文档</option>
                        <option value="archive">压缩包</option>
                        <option value="other">其他</option>
                    </select>
                    <select id="sortBy" class="filter-select">
                        <option value="name">按名称</option>
                        <option value="size">按大小</option>
                        <option value="date">按日期</option>
                    </select>
                    <button id="refreshBtn" class="btn btn-secondary">刷新</button>
                </div>
                
                <div class="admin-stats">
                    <div class="stat-item">
                        <div class="stat-value" id="totalFiles">0</div>
                        <div class="stat-label">总文件数</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="totalSize">0</div>
                        <div class="stat-label">总大小</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="selectedCount">0</div>
                        <div class="stat-label">已选择</div>
                    </div>
                </div>
                
                <div class="batch-actions hidden" id="batchActions">
                    <button id="selectAllBtn" class="btn btn-secondary btn-sm">全选</button>
                    <button id="deselectAllBtn" class="btn btn-secondary btn-sm">取消选择</button>
                    <button id="deleteSelectedBtn" class="btn btn-danger btn-sm">删除选中</button>
                </div>
                
                <div class="files-grid" id="filesGrid"></div>
            </div>
        </div>
    </div>

    <!-- 密码输入模态框 -->
    <div id="passwordModal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <div class="modal-title">输入上传密码</div>
            <div class="modal-description">请输入上传密码以继续上传文件</div>
            <input type="password" id="modalPasswordInput" class="modal-input" placeholder="请输入上传密码">
            <div class="modal-actions">
                <button id="modalCancelBtn" class="modal-btn modal-btn-secondary">取消</button>
                <button id="modalConfirmBtn" class="modal-btn modal-btn-primary">确认</button>
            </div>
        </div>
    </div>

    <!-- 确认对话框 -->
    <div id="confirmModal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <div class="modal-title">确认操作</div>
            <div class="modal-description" id="confirmMessage">确定要执行此操作吗？</div>
            <div class="modal-actions">
                <button id="confirmCancelBtn" class="modal-btn modal-btn-secondary">取消</button>
                <button id="confirmOkBtn" class="modal-btn modal-btn-primary">确认</button>
            </div>
        </div>
    </div>

    <script>
        // 全局变量
        let authManager = null;
        let isAuthenticated = false;
        let fileQueue = [];
        let uploadingFiles = [];
        let allFiles = [];
        let filteredFiles = [];
        let selectedFiles = new Set();
        let isUploading = false;
        let uploadPassword = null; // 缓存本次会话的上传密码
        
        // 初始化
        document.addEventListener('DOMContentLoaded', function() {
            initAuthManager();
            initEventListeners();
            checkAuthStatus();
            
            // 默认显示上传界面
            switchToUpload();
        });
        
        // 初始化认证管理器
        function initAuthManager() {
            authManager = {
                tokenKey: 'cloudlink_auth_token',
                tokenExpiry: 'cloudlink_token_expiry',
                sessionDuration: 24 * 60 * 60 * 1000, // 24小时
                
                generateToken: function(password) {
                    const timestamp = Date.now();
                    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
                    const randomString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
                    
                    const payload = {
                        pwd: this.hashPassword(password),
                        timestamp: timestamp,
                        random: randomString
                    };
                    
                    return btoa(JSON.stringify(payload));
                },
                
                hashPassword: function(password) {
                    let hash = 0;
                    const salt = 'cloudlink_salt_2024';
                    const input = password + salt;
                    
                    for (let i = 0; i < input.length; i++) {
                        const char = input.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash;
                    }
                    
                    return hash.toString(36);
                },
                
                saveAuth: function(password) {
                    const token = this.generateToken(password);
                    const expiry = Date.now() + this.sessionDuration;
                    
                    localStorage.setItem(this.tokenKey, token);
                    localStorage.setItem(this.tokenExpiry, expiry.toString());
                    
                    return token;
                },
                
                getCurrentToken: function() {
                    return localStorage.getItem(this.tokenKey);
                },
                
                isAuthenticated: function() {
                    const expiry = localStorage.getItem(this.tokenExpiry);
                    return expiry && Date.now() < parseInt(expiry);
                },
                
                clearAuth: function() {
                    localStorage.removeItem(this.tokenKey);
                    localStorage.removeItem(this.tokenExpiry);
                }
            };
        }
        
        // 初始化事件监听器
        function initEventListeners() {
            // 标签页切换
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabName = this.dataset.tab;
                    switchTab(tabName);
                });
            });
            
            // 登录表单
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            
            // 上传相关
            const uploadArea = document.getElementById('uploadArea');
            const fileInput = document.getElementById('fileInput');
            const deviceInfo = getDeviceInfo();
            
            // 跨平台点击事件处理
            uploadArea.addEventListener('click', function(e) {
                console.log('Upload area clicked');
                e.preventDefault();
                e.stopPropagation();
                
                triggerFileSelection();
            });
            
            // 移动端触摸事件支持
            if (deviceInfo.touchSupport) {
                uploadArea.addEventListener('touchend', function(e) {
                    console.log('Upload area touched (touchend)');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    triggerFileSelection();
                });
                
                // Android 特殊处理：某些Android浏览器需要touchstart
                if (deviceInfo.isAndroid) {
                    uploadArea.addEventListener('touchstart', function(e) {
                        console.log('Upload area touched (touchstart - Android)');
                        // 不阻止默认行为，让touchend处理
                    });
                }
            }
            
            // 桌面端拖拽支持
            if (deviceInfo.isDesktop) {
                uploadArea.addEventListener('dragover', handleDragOver);
                uploadArea.addEventListener('dragleave', handleDragLeave);
                uploadArea.addEventListener('drop', handleDrop);
            }
            
            // 文件选择事件（通用）
            fileInput.addEventListener('change', handleFileSelect);
            
            // 确保文件输入可以被正确触发
            fileInput.addEventListener('click', function(e) {
                console.log('File input clicked');
                e.stopPropagation();
            });
            
            // 统一的文件选择触发函数
            function triggerFileSelection() {
                console.log('Triggering file selection for:', deviceInfo.browser);
                
                // 重置文件输入，确保可以重新选择相同文件
                fileInput.value = '';
                
                // 小延迟确保重置生效（特别是Android）
                setTimeout(() => {
                    fileInput.click();
                }, 10);
            }
            
            document.getElementById('uploadBtn').addEventListener('click', startUpload);
            document.getElementById('clearBtn').addEventListener('click', clearQueue);
            
            // 管理相关
            document.getElementById('searchInput').addEventListener('input', handleSearch);
            document.getElementById('typeFilter').addEventListener('change', handleFilter);
            document.getElementById('sortBy').addEventListener('change', handleSort);
            document.getElementById('refreshBtn').addEventListener('click', loadFiles);
            
            document.getElementById('selectAllBtn').addEventListener('click', selectAll);
            document.getElementById('deselectAllBtn').addEventListener('click', deselectAll);
            document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);
            
            // 密码模态框相关
            document.getElementById('modalCancelBtn').addEventListener('click', hidePasswordModal);
            document.getElementById('modalConfirmBtn').addEventListener('click', confirmPassword);
            document.getElementById('modalPasswordInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    confirmPassword();
                }
            });
            
            // 确认对话框相关
            document.getElementById('confirmCancelBtn').addEventListener('click', hideConfirmModal);
            document.getElementById('confirmOkBtn').addEventListener('click', confirmAction);
        }
        
        // 检查认证状态
        function checkAuthStatus() {
            isAuthenticated = authManager.isAuthenticated();
            
            if (isAuthenticated) {
                showToast('已自动登录', 'success');
            }
            
            // 设备特定优化
            const deviceInfo = getDeviceInfo();
            console.log('Device info:', deviceInfo);
            
            applyDeviceSpecificOptimizations(deviceInfo);
        }
        
        // 应用设备特定优化
        function applyDeviceSpecificOptimizations(deviceInfo) {
            const uploadHint = document.querySelector('.upload-hint');
            const uploadText = document.querySelector('.upload-text');
            
            if (deviceInfo.isMobile) {
                // 移动端优化
                if (uploadText) {
                    uploadText.textContent = '点击选择文件进行上传';
                }
                
                if (deviceInfo.isIOS) {
                    console.log('iOS device detected, applying iOS-specific optimizations');
                    if (uploadHint) {
                        uploadHint.textContent = '支持照片、视频等文件，最大 2GB';
                    }
                } else if (deviceInfo.isAndroid) {
                    console.log('Android device detected, applying Android-specific optimizations');
                    if (uploadHint) {
                        uploadHint.textContent = '支持图片、视频、文档等，最大 2GB';
                    }
                } else {
                    // 其他移动设备
                    if (uploadHint) {
                        uploadHint.textContent = '点击选择文件，最大 2GB';
                    }
                }
                
                // 移动端特殊样式调整
                adjustMobileStyles();
            } else {
                // 桌面端保持原有提示
                console.log('Desktop device detected');
                if (uploadHint) {
                    uploadHint.textContent = '支持多文件上传，最大 2GB';
                }
                if (uploadText) {
                    uploadText.textContent = '拖拽文件到这里，或点击选择文件';
                }
            }
        }
        
        // 移动端样式调整
        function adjustMobileStyles() {
            const uploadArea = document.getElementById('uploadArea');
            if (uploadArea) {
                // 增加移动端点击区域
                uploadArea.style.minHeight = '150px';
                uploadArea.style.cursor = 'pointer';
                
                // 添加移动端友好的视觉反馈
                uploadArea.style.webkitTapHighlightColor = 'rgba(102, 126, 234, 0.2)';
            }
        }
        
        // 设备检测函数
        function getDeviceInfo() {
            const userAgent = navigator.userAgent;
            
            return {
                isIOS: /iPad|iPhone|iPod/.test(userAgent) || 
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
                isAndroid: /Android/.test(userAgent),
                isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(userAgent) ||
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
                isDesktop: !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(userAgent) &&
                          !(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
                browser: getBrowserInfo(userAgent),
                touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
            };
        }
        
        function getBrowserInfo(userAgent) {
            if (/Chrome/.test(userAgent) && /Android/.test(userAgent)) return 'Android Chrome';
            if (/Samsung/.test(userAgent)) return 'Samsung Browser';
            if (/Firefox/.test(userAgent) && /Android/.test(userAgent)) return 'Android Firefox';
            if (/Safari/.test(userAgent) && /iPhone|iPad/.test(userAgent)) return 'iOS Safari';
            if (/Chrome/.test(userAgent)) return 'Desktop Chrome';
            if (/Firefox/.test(userAgent)) return 'Desktop Firefox';
            if (/Safari/.test(userAgent)) return 'Desktop Safari';
            if (/Edge/.test(userAgent)) return 'Edge';
            return 'Unknown';
        }
        
        // 兼容性检查
        function isIOSDevice() {
            return getDeviceInfo().isIOS;
        }
        
        // 切换标签页
        function switchTab(tabName) {
            // 移除所有active类
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // 添加active类到当前标签页
            document.querySelector(\`[data-tab="\${tabName}"]\`).classList.add('active');
            
            if (tabName === 'upload') {
                switchToUpload();
            } else if (tabName === 'admin') {
                switchToAdmin();
            }
        }
        
        // 切换到上传界面
        function switchToUpload() {
            document.getElementById('upload-section').classList.add('active');
            document.getElementById('admin-section').classList.remove('active');
            document.getElementById('login-section').classList.remove('active');
        }
        
        // 切换到管理界面
        function switchToAdmin() {
            if (!isAuthenticated) {
                // 需要登录
                document.getElementById('login-section').classList.add('active');
                document.getElementById('upload-section').classList.remove('active');
                document.getElementById('admin-section').classList.remove('active');
            } else {
                // 已登录，显示管理界面
                document.getElementById('admin-section').classList.add('active');
                document.getElementById('upload-section').classList.remove('active');
                document.getElementById('login-section').classList.remove('active');
                
                // 加载文件列表
                loadFiles();
            }
        }
        
        // 处理登录
        async function handleLogin(e) {
            e.preventDefault();
            
            const password = document.getElementById('adminPassword').value;
            
            try {
                const response = await fetch('/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    authManager.saveAuth(password);
                    isAuthenticated = true;
                    
                    showToast('🎉 登录成功', 'success');
                    switchToAdmin();
                } else {
                    let errorMsg = '登录失败';
                    try {
                        const error = await response.json();
                        errorMsg = getFriendlyErrorMessage(response.status, error.error || '');
                    } catch (e) {
                        errorMsg = getFriendlyErrorMessage(response.status, '');
                    }
                    showToast('🔐 ' + errorMsg, 'error');
                }
            } catch (error) {
                const errorMsg = getFriendlyErrorMessage(0, error.message);
                showToast('🔐 ' + errorMsg, 'error');
            }
        }
        
        // 文件上传相关函数
        function handleDragOver(e) {
            e.preventDefault();
            e.currentTarget.classList.add('dragover');
        }
        
        function handleDragLeave(e) {
            e.currentTarget.classList.remove('dragover');
        }
        
        function handleDrop(e) {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            addFilesToQueue(files);
        }
        
        function handleFileSelect(e) {
            console.log('File select triggered, files:', e.target.files);
            const files = Array.from(e.target.files);
            console.log('Files array:', files);
            
            if (files.length === 0) {
                showToast('📁 没有选择任何文件', 'error');
                return;
            }
            
            addFilesToQueue(files);
        }
        
        function addFilesToQueue(files) {
            console.log('Adding files to queue:', files);
            
            if (!files || files.length === 0) {
                showToast('📁 没有文件可以添加到队列', 'error');
                return;
            }
            
            let addedCount = 0;
            
            files.forEach(file => {
                console.log('Processing file:', file.name, 'size:', file.size);
                
                const fileId = Date.now() + Math.random();
                const fileObj = {
                    id: fileId,
                    file: file,
                    name: file.name,
                    size: file.size,
                    status: 'pending',
                    progress: 0
                };
                
                fileQueue.push(fileObj);
                addedCount++;
            });
            
            console.log('Added', addedCount, 'files to queue. Total queue size:', fileQueue.length);
            
            renderFileQueue();
            updateUploadButton();
            
            // 显示成功提示
            if (addedCount > 0) {
                showToast(\`📁 已添加 \${addedCount} 个文件到上传队列\`, 'success');
            }
        }
        
        function renderFileQueue() {
            const container = document.getElementById('fileQueue');
            container.innerHTML = '';
            
            fileQueue.forEach(fileObj => {
                const item = document.createElement('div');
                item.className = 'file-item';
                
                // 创建文件信息容器
                const fileInfo = document.createElement('div');
                fileInfo.className = 'file-info';
                
                // 文件名
                const fileName = document.createElement('div');
                fileName.className = 'file-name';
                fileName.textContent = fileObj.name;
                fileInfo.appendChild(fileName);
                
                // 文件大小
                const fileSize = document.createElement('div');
                fileSize.className = 'file-size';
                fileSize.textContent = formatFileSize(fileObj.size);
                fileInfo.appendChild(fileSize);
                
                // 文件状态
                const fileStatus = document.createElement('div');
                fileStatus.className = 'file-status';
                fileStatus.textContent = getStatusText(fileObj.status);
                fileInfo.appendChild(fileStatus);
                
                // 进度条（上传中）
                if (fileObj.status === 'uploading') {
                    const progressBar = document.createElement('div');
                    progressBar.className = 'progress-bar';
                    progressBar.style.marginTop = '8px';
                    
                    const progressFill = document.createElement('div');
                    progressFill.className = 'progress-fill';
                    progressFill.style.width = fileObj.progress + '%';
                    
                    progressBar.appendChild(progressFill);
                    fileInfo.appendChild(progressBar);
                }
                
                // 下载链接（上传成功）
                if (fileObj.status === 'success' && fileObj.downloadUrl) {
                    const successContainer = document.createElement('div');
                    successContainer.style.cssText = 'background: rgba(102, 126, 234, 0.1); padding: 8px; border-radius: 8px; margin-top: 8px;';
                    
                    const successText = document.createElement('div');
                    successText.style.cssText = 'color: #4caf50; font-weight: 600; margin-bottom: 4px;';
                    successText.textContent = '✅ 上传成功';
                    successContainer.appendChild(successText);
                    
                    const linkContainer = document.createElement('div');
                    linkContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';
                    
                    const linkInput = document.createElement('input');
                    linkInput.type = 'text';
                    linkInput.value = fileObj.downloadUrl;
                    linkInput.readOnly = true;
                    linkInput.style.cssText = 'flex: 1; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;';
                    
                    const copyBtn = document.createElement('button');
                    copyBtn.className = 'btn btn-secondary btn-xs';
                    copyBtn.textContent = '复制';
                    copyBtn.onclick = () => copyToClipboard(fileObj.downloadUrl);
                    
                    linkContainer.appendChild(linkInput);
                    linkContainer.appendChild(copyBtn);
                    successContainer.appendChild(linkContainer);
                    fileInfo.appendChild(successContainer);
                }
                
                item.appendChild(fileInfo);
                
                // 文件操作按钮
                const fileActions = document.createElement('div');
                fileActions.className = 'file-actions';
                
                if (fileObj.status === 'pending') {
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'btn btn-danger btn-sm';
                    removeBtn.textContent = '移除';
                    removeBtn.onclick = () => removeFromQueue(fileObj.id);
                    fileActions.appendChild(removeBtn);
                }
                
                item.appendChild(fileActions);
                container.appendChild(item);
            });
        }
        
        function updateUploadButton() {
            const uploadBtn = document.getElementById('uploadBtn');
            const pendingFiles = fileQueue.filter(f => f.status === 'pending');
            
            uploadBtn.disabled = pendingFiles.length === 0 || isUploading;
            uploadBtn.textContent = isUploading ? '上传中...' : \`开始上传 (\${pendingFiles.length})\`;
        }
        
        function removeFromQueue(fileId) {
            fileQueue = fileQueue.filter(f => f.id !== fileId);
            renderFileQueue();
            updateUploadButton();
        }
        
        function clearQueue() {
            fileQueue = fileQueue.filter(f => f.status === 'uploading');
            renderFileQueue();
            updateUploadButton();
        }
        
        // 密码模态框相关函数
        function showPasswordModal() {
            return new Promise((resolve, reject) => {
                const modal = document.getElementById('passwordModal');
                const input = document.getElementById('modalPasswordInput');
                
                modal.style.display = 'flex';
                input.value = '';
                input.focus();
                
                // 保存回调函数到全局，供按钮事件使用
                window.passwordModalResolve = resolve;
                window.passwordModalReject = reject;
            });
        }
        
        function hidePasswordModal() {
            const modal = document.getElementById('passwordModal');
            modal.style.display = 'none';
            
            if (window.passwordModalReject) {
                window.passwordModalReject(new Error('用户取消'));
                window.passwordModalResolve = null;
                window.passwordModalReject = null;
            }
        }
        
        function confirmPassword() {
            const input = document.getElementById('modalPasswordInput');
            const password = input.value.trim();
            
            if (!password) {
                showToast('请输入密码', 'error');
                return;
            }
            
            const modal = document.getElementById('passwordModal');
            modal.style.display = 'none';
            
            if (window.passwordModalResolve) {
                window.passwordModalResolve(password);
                window.passwordModalResolve = null;
                window.passwordModalReject = null;
            }
        }
        
        // 确认对话框相关函数
        function showConfirmModal(message) {
            return new Promise((resolve, reject) => {
                const modal = document.getElementById('confirmModal');
                const messageElement = document.getElementById('confirmMessage');
                
                messageElement.textContent = message;
                modal.style.display = 'flex';
                
                // 保存回调函数到全局，供按钮事件使用
                window.confirmModalResolve = resolve;
                window.confirmModalReject = reject;
            });
        }
        
        function hideConfirmModal() {
            const modal = document.getElementById('confirmModal');
            modal.style.display = 'none';
            
            if (window.confirmModalReject) {
                window.confirmModalReject(false);
                window.confirmModalResolve = null;
                window.confirmModalReject = null;
            }
        }
        
        function confirmAction() {
            const modal = document.getElementById('confirmModal');
            modal.style.display = 'none';
            
            if (window.confirmModalResolve) {
                window.confirmModalResolve(true);
                window.confirmModalResolve = null;
                window.confirmModalReject = null;
            }
        }
        
        async function startUpload() {
            const pendingFiles = fileQueue.filter(f => f.status === 'pending');
            if (pendingFiles.length === 0) return;
            
            // 检查认证状态，如果未认证且没有缓存密码，则获取密码
            const token = authManager.getCurrentToken();
            if (!token && !uploadPassword) {
                try {
                    uploadPassword = await showPasswordModal();
                } catch (error) {
                    showToast('上传已取消', 'error');
                    return;
                }
            }
            
            isUploading = true;
            updateUploadButton();
            
            const concurrentUploads = 3; // 并发上传数量
            
            for (let i = 0; i < pendingFiles.length; i += concurrentUploads) {
                const batch = pendingFiles.slice(i, i + concurrentUploads);
                const batchPromises = batch.map(fileObj => uploadFile(fileObj));
                
                await Promise.all(batchPromises);
            }
            
            isUploading = false;
            updateUploadButton();
            
            const successCount = fileQueue.filter(f => f.status === 'success').length;
            const errorCount = fileQueue.filter(f => f.status === 'error').length;
            
            if (errorCount === 0) {
                showToast(\`所有文件上传成功 (\${successCount}个)\`, 'success');
            } else {
                showToast(\`上传完成：成功 \${successCount}个，失败 \${errorCount}个\`, 'error');
            }
        }
        
        async function uploadFile(fileObj) {
            fileObj.status = 'uploading';
            renderFileQueue();
            
            try {
                const formData = new FormData();
                formData.append('file', fileObj.file);
                
                // 如果已认证，使用token
                const token = authManager.getCurrentToken();
                if (token) {
                    formData.append('password', 'admin_authenticated');
                } else {
                    // 游客模式，使用缓存的上传密码
                    formData.append('password', uploadPassword);
                }
                
                const headers = {};
                if (token) {
                    headers['X-Auth-Token'] = token;
                }
                
                const response = await fetch('/upload', {
                    method: 'POST',
                    headers: headers,
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    fileObj.status = 'success';
                    fileObj.downloadUrl = result.downloadUrl;
                    fileObj.fileId = result.fileId;
                } else {
                    let errorMessage = '上传失败';
                    try {
                        const error = await response.json();
                        errorMessage = getFriendlyErrorMessage(response.status, error.error || '');
                    } catch (e) {
                        errorMessage = getFriendlyErrorMessage(response.status, '');
                    }
                    
                    fileObj.status = 'error';
                    fileObj.error = errorMessage;
                    
                    // 如果是密码错误，清除缓存的密码
                    if (errorMessage.includes('密码') || errorMessage.includes('认证')) {
                        uploadPassword = null;
                    }
                }
            } catch (error) {
                fileObj.status = 'error';
                fileObj.error = getFriendlyErrorMessage(0, error.message);
            }
            
            renderFileQueue();
        }
        
        // 管理界面相关函数
        async function loadFiles() {
            if (!isAuthenticated) return;
            
            try {
                const token = authManager.getCurrentToken();
                const response = await fetch('/admin/files', {
                    headers: {
                        'X-Auth-Token': token
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    allFiles = data.files || [];
                    filteredFiles = [...allFiles];
                    
                    updateStats();
                    renderFiles();
                } else {
                    const errorMsg = getFriendlyErrorMessage(response.status, '加载文件列表失败');
                    showToast(errorMsg, 'error');
                }
            } catch (error) {
                const errorMsg = getFriendlyErrorMessage(0, error.message);
                showToast('📂 ' + errorMsg, 'error');
            }
        }
        
        function updateStats() {
            const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);
            
            document.getElementById('totalFiles').textContent = allFiles.length;
            document.getElementById('totalSize').textContent = formatFileSize(totalSize);
            document.getElementById('selectedCount').textContent = selectedFiles.size;
            
            const batchActions = document.getElementById('batchActions');
            if (selectedFiles.size > 0) {
                batchActions.classList.remove('hidden');
            } else {
                batchActions.classList.add('hidden');
            }
        }
        
        function renderFiles() {
            const container = document.getElementById('filesGrid');
            container.innerHTML = '';
            
            filteredFiles.forEach(file => {
                const card = document.createElement('div');
                card.className = 'file-card';
                if (selectedFiles.has(file.id)) {
                    card.classList.add('selected');
                }
                
                const fileIcon = getFileIcon(file.name);
                const downloadUrl = \`/d/\${file.id}\`;
                
                card.innerHTML = \`
                    <div class="file-card-header">
                        <input type="checkbox" class="file-checkbox" \${selectedFiles.has(file.id) ? 'checked' : ''} onchange="toggleFileSelection('\${file.id}')">
                        <div class="file-icon">\${fileIcon}</div>
                        <div class="file-card-title">\${file.name}</div>
                    </div>
                    <div class="file-card-info">
                        <span>\${formatFileSize(file.size)}</span>
                        <span>\${formatDate(file.createdTime)}</span>
                    </div>
                    <div class="file-card-actions">
                        <button onclick="previewFile('\${file.id}', '\${file.name}')" class="btn btn-secondary btn-xs">预览</button>
                        <button onclick="copyToClipboard('\${downloadUrl}')" class="btn btn-secondary btn-xs">复制链接</button>
                        <button onclick="deleteFile('\${file.id}')" class="btn btn-danger btn-xs">删除</button>
                    </div>
                \`;
                
                container.appendChild(card);
            });
        }
        
        function toggleFileSelection(fileId) {
            if (selectedFiles.has(fileId)) {
                selectedFiles.delete(fileId);
            } else {
                selectedFiles.add(fileId);
            }
            
            updateStats();
            renderFiles();
        }
        
        function selectAll() {
            filteredFiles.forEach(file => {
                selectedFiles.add(file.id);
            });
            updateStats();
            renderFiles();
        }
        
        function deselectAll() {
            selectedFiles.clear();
            updateStats();
            renderFiles();
        }
        
        function handleSearch() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            applyFilters();
        }
        
        function handleFilter() {
            applyFilters();
        }
        
        function handleSort() {
            const sortBy = document.getElementById('sortBy').value;
            
            filteredFiles.sort((a, b) => {
                switch (sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'size':
                        return b.size - a.size;
                    case 'date':
                        return new Date(b.createdTime) - new Date(a.createdTime);
                    default:
                        return 0;
                }
            });
            
            renderFiles();
        }
        
        function applyFilters() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            const typeFilter = document.getElementById('typeFilter').value;
            
            filteredFiles = allFiles.filter(file => {
                const matchesSearch = file.name.toLowerCase().includes(query);
                const matchesType = !typeFilter || getFileType(file.name) === typeFilter;
                
                return matchesSearch && matchesType;
            });
            
            handleSort();
            updateStats();
        }
        
        async function deleteFile(fileId) {
            const confirmed = await showConfirmModal('确定要删除这个文件吗？');
            if (!confirmed) return;
            
            try {
                const token = authManager.getCurrentToken();
                const response = await fetch(\`/admin/delete/\${fileId}\`, {
                    method: 'DELETE',
                    headers: {
                        'X-Auth-Token': token
                    }
                });
                
                if (response.ok) {
                    showToast('🗑️ 文件删除成功', 'success');
                    loadFiles();
                } else {
                    const errorMsg = getFriendlyErrorMessage(response.status, '删除文件失败');
                    showToast('🗑️ ' + errorMsg, 'error');
                }
            } catch (error) {
                const errorMsg = getFriendlyErrorMessage(0, error.message);
                showToast('🗑️ ' + errorMsg, 'error');
            }
        }
        
        async function deleteSelected() {
            if (selectedFiles.size === 0) return;
            
            const confirmed = await showConfirmModal(\`确定要删除选中的 \${selectedFiles.size} 个文件吗？\`);
            if (!confirmed) return;
            
            const promises = Array.from(selectedFiles).map(fileId => {
                const token = authManager.getCurrentToken();
                return fetch(\`/admin/delete/\${fileId}\`, {
                    method: 'DELETE',
                    headers: {
                        'X-Auth-Token': token
                    }
                });
            });
            
            try {
                await Promise.all(promises);
                selectedFiles.clear();
                showToast('🗑️ 批量删除成功', 'success');
                loadFiles();
            } catch (error) {
                const errorMsg = getFriendlyErrorMessage(0, error.message);
                showToast('🗑️ 批量删除失败：' + errorMsg, 'error');
            }
        }
        
        function previewFile(fileId, fileName) {
            const downloadUrl = \`/d/\${fileId}\`;
            window.open(downloadUrl, '_blank');
        }
        
        // 友好错误信息处理函数
        function getFriendlyErrorMessage(statusCode, originalError) {
            // 根据状态码提供友好提示
            switch (statusCode) {
                case 400:
                    if (originalError.includes('文件大小超过限制')) {
                        return '⚠️ 文件太大了！请选择小于 2GB 的文件';
                    }
                    if (originalError.includes('不支持的文件类型')) {
                        return '❌ 不支持这种文件格式，请检查文件扩展名';
                    }
                    if (originalError.includes('未选择文件')) {
                        return '📁 请选择要上传的文件';
                    }
                    if (originalError.includes('认证失败') || originalError.includes('密码错误')) {
                        return '🔐 密码错误，请重新输入正确的上传密码';
                    }
                    return '❌ 文件格式或内容有问题：' + originalError;
                
                case 401:
                    return '🔐 身份验证失败，请检查密码或重新登录';
                
                case 403:
                    return '⛔ 没有上传权限，请联系管理员';
                
                case 413:
                    return '📦 文件太大！请选择小于 2GB 的文件';
                
                case 429:
                    return '⏰ 上传太频繁了，请稍后再试';
                
                case 500:
                    return '🔧 服务器出了点问题，请稍后重试';
                
                case 502:
                case 503:
                    return '🌐 服务暂时不可用，请稍后重试';
                
                case 504:
                    return '⏱️ 上传超时，请检查网络连接后重试';
                
                default:
                    // 网络错误或其他异常
                    if (statusCode === 0) {
                        if (originalError.includes('Failed to fetch') || originalError.includes('NetworkError')) {
                            return '🌐 网络连接失败，请检查网络后重试';
                        }
                        if (originalError.includes('timeout')) {
                            return '⏱️ 连接超时，请检查网络连接';
                        }
                        return '🔗 网络错误：' + originalError;
                    }
                    
                    // 如果有原始错误信息，优化显示
                    if (originalError) {
                        return '❗ ' + originalError;
                    }
                    
                    return '❌ 上传失败，请重试';
            }
        }
        
        // 工具函数
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        function getStatusText(status) {
            const statusMap = {
                'pending': '等待上传',
                'uploading': '上传中...',
                'success': '上传成功',
                'error': '上传失败'
            };
            return statusMap[status] || status;
        }
        
        function getFileIcon(fileName) {
            const extension = fileName.split('.').pop().toLowerCase();
            
            const iconMap = {
                // 图片
                'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️', 'svg': '🖼️',
                // 视频
                'mp4': '🎬', 'avi': '🎬', 'mov': '🎬', 'mkv': '🎬',
                // 音频
                'mp3': '🎵', 'wav': '🎵', 'flac': '🎵',
                // 文档
                'pdf': '📄', 'doc': '📄', 'docx': '📄', 'txt': '📄',
                // 字幕/歌词
                'lrc': '🎤', 'srt': '📝', 'ass': '📝', 'ssa': '📝', 'vtt': '📝', 'sub': '📝',
                // 压缩包
                'zip': '📦', 'rar': '📦', '7z': '📦',
                // 其他
                'js': '💻', 'html': '💻', 'css': '💻', 'json': '💻'
            };
            
            return iconMap[extension] || '📁';
        }
        
        function getFileType(fileName) {
            const extension = fileName.split('.').pop().toLowerCase();
            
            const typeMap = {
                image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'],
                video: ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv'],
                audio: ['mp3', 'wav', 'flac', 'aac', 'ogg'],
                document: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'rtf', 'csv', 'lrc', 'srt', 'ass', 'ssa', 'vtt', 'sub', 'md', 'json', 'xml', 'html', 'css', 'js'],
                archive: ['zip', 'rar', '7z', 'tar', 'gz']
            };
            
            for (const [type, extensions] of Object.entries(typeMap)) {
                if (extensions.includes(extension)) {
                    return type;
                }
            }
            
            return 'other';
        }
        
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('链接已复制到剪贴板', 'success');
            }).catch(() => {
                showToast('复制失败', 'error');
            });
        }
        
        function showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = \`toast \${type}\`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }
        
        // 全局函数（供HTML调用）
        window.removeFromQueue = removeFromQueue;
        window.toggleFileSelection = toggleFileSelection;
        window.deleteFile = deleteFile;
        window.previewFile = previewFile;
        window.copyToClipboard = copyToClipboard;
    </script>
</body>
</html>`;
}