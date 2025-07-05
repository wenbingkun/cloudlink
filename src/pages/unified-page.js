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
                    <input type="file" id="fileInput" style="display: none;" multiple accept="image/*,video/*,audio/*,*">
                </div>
                
                <div class="file-queue" id="fileQueue"></div>
                
                <!-- 调试日志显示区域 -->
                <div id="debugLog" style="background: #000; color: #0f0; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto; padding: 10px; margin: 10px 0; border-radius: 5px; display: none;">
                    <div style="color: #fff; font-weight: bold; margin-bottom: 5px;">🔍 实时上传日志:</div>
                    <div id="debugLogContent"></div>
                </div>
                
                <div class="upload-controls">
                    <button id="uploadBtn" class="btn btn-primary" disabled>开始上传</button>
                    <button id="clearBtn" class="btn btn-secondary">清空队列</button>
                    <button id="debugToggle" class="btn btn-secondary">显示调试日志</button>
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
        let debugLogVisible = false;
        
        // 页面日志函数
        function logToPage(message, type = 'info') {
            console.log(message);
            
            const debugLogContent = document.getElementById('debugLogContent');
            if (debugLogContent) {
                const timestamp = new Date().toTimeString().split(' ')[0];
                const logEntry = document.createElement('div');
                
                let color = '#0f0';
                let prefix = 'ℹ️';
                
                switch(type) {
                    case 'error':
                        color = '#f00';
                        prefix = '❌';
                        break;
                    case 'success':
                        color = '#0f0';
                        prefix = '✅';
                        break;
                    case 'warn':
                        color = '#ff0';
                        prefix = '⚠️';
                        break;
                    case 'progress':
                        color = '#00f';
                        prefix = '📊';
                        break;
                }
                
                logEntry.style.color = color;
                logEntry.innerHTML = '[' + timestamp + '] ' + prefix + ' ' + message;
                debugLogContent.appendChild(logEntry);
                
                // 自动滚动到底部
                debugLogContent.scrollTop = debugLogContent.scrollHeight;
                
                // 限制日志条数
                while (debugLogContent.children.length > 100) {
                    debugLogContent.removeChild(debugLogContent.firstChild);
                }
            }
        }
        
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
            console.log('Initializing event listeners...');
            
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
            
            console.log('Upload area element:', uploadArea);
            console.log('File input element:', fileInput);
            
            if (!uploadArea) {
                console.error('uploadArea element not found!');
                return;
            }
            
            if (!fileInput) {
                console.error('fileInput element not found!');
                return;
            }
            
            const deviceInfo = getDeviceInfo();
            console.log('Device info:', deviceInfo);
            
            // 跨平台点击事件处理
            uploadArea.addEventListener('click', function(e) {
                console.log('Upload area clicked');
                e.preventDefault();
                e.stopPropagation();
                
                try {
                    triggerFileSelection();
                } catch (error) {
                    console.error('Error in triggerFileSelection:', error);
                    showToast('文件选择器启动失败，请重试', 'error');
                }
            });
            
            // 移动端触摸事件支持 - 修复过度触发问题
            if (deviceInfo.touchSupport) {
                let touchStartTime = 0;
                let touchMoved = false;
                
                uploadArea.addEventListener('touchstart', function(e) {
                    console.log('Touch started');
                    touchStartTime = Date.now();
                    touchMoved = false;
                });
                
                uploadArea.addEventListener('touchmove', function(e) {
                    touchMoved = true;
                });
                
                uploadArea.addEventListener('touchend', function(e) {
                    const touchDuration = Date.now() - touchStartTime;
                    console.log('Touch ended, duration:', touchDuration + 'ms, moved:', touchMoved);
                    
                    // 只有在真正的点击（短触摸且没有移动）时才触发
                    if (!touchMoved && touchDuration < 500) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('Valid touch click detected, triggering file selection');
                        triggerFileSelection();
                    }
                });
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
                
                // 确保元素存在
                if (!fileInput) {
                    console.error('fileInput element not found');
                    showToast('文件选择器初始化失败', 'error');
                    return;
                }
                
                // iOS Safari 特殊处理
                if (deviceInfo.isIOS) {
                    console.log('iOS Safari special handling');
                    
                    // iOS Safari 特殊处理 - 尝试最兼容的方法
                    try {
                        const fileSelectionMethod = tryIOSFileSelection();
                        
                        if (!fileSelectionMethod) {
                            showToast('📱 iOS Safari 文件选择器启动失败，请重试', 'error');
                        }
                    } catch (error) {
                        console.error('iOS file selection error:', error);
                        showToast('📱 iOS 文件选择出现错误，请重试', 'error');
                    }
                } else {
                    // 其他浏览器的标准处理
                    try {
                        fileInput.value = '';
                        
                        setTimeout(() => {
                            fileInput.click();
                        }, 10);
                    } catch (error) {
                        console.error('Standard file selection error:', error);
                        showToast('文件选择器启动失败，请重试', 'error');
                    }
                }
            }
            
            // iOS Safari 文件选择器的多种尝试方法
            function tryIOSFileSelection() {
                console.log('Trying iOS file selection methods...');
                
                try {
                    // 方法1: 优化的通用文件选择器
                    const newFileInput = document.createElement('input');
                    newFileInput.type = 'file';
                    newFileInput.multiple = true;
                    
                    // iOS Safari 需要特定的accept属性来访问相册
                    // 不设置capture属性，让用户选择相机或相册
                    newFileInput.accept = 'image/*,video/*';
                    
                    // 完全隐藏但保持可访问性
                    newFileInput.style.cssText = 'position: fixed; left: -9999px; top: -9999px; width: 1px; height: 1px; opacity: 0; pointer-events: none;';
                    
                    // 立即添加到DOM
                    document.body.appendChild(newFileInput);
                    
                    // 监听文件选择
                    newFileInput.addEventListener('change', function(e) {
                        console.log('iOS file selection result:', e.target.files.length, 'files');
                        
                        if (e.target.files && e.target.files.length > 0) {
                            // 显示加载提示
                            showToast('📱 正在处理文件，请稍等...', 'info');
                            
                            console.log('Successfully selected files on iOS:');
                            
                            // 异步处理文件以避免阻塞UI
                            setTimeout(() => {
                                for (let i = 0; i < e.target.files.length; i++) {
                                    const file = e.target.files[i];
                                    console.log('File ' + (i + 1) + ': ' + file.name + ' (' + (file.type || 'unknown type') + ') - ' + file.size + ' bytes');
                                }
                                
                                try {
                                    handleFileSelect(e);
                                    
                                    // 显示成功提示
                                    const fileCount = e.target.files.length;
                                    const totalSize = Array.from(e.target.files).reduce((sum, file) => sum + file.size, 0);
                                    const sizeText = formatFileSize(totalSize);
                                    
                                    showToast('✅ 已选择 ' + fileCount + ' 个文件 (' + sizeText + ')', 'success');
                                } catch (error) {
                                    console.error('Error processing selected files:', error);
                                    showToast('❌ 文件处理失败，请重试', 'error');
                                }
                            }, 100); // 短暂延迟让UI响应
                            
                        } else {
                            console.log('No files selected on iOS');
                            showToast('📱 未选择文件', 'info');
                        }
                        
                        // 清理元素
                        setTimeout(() => {
                            if (document.body.contains(newFileInput)) {
                                try {
                                    document.body.removeChild(newFileInput);
                                } catch (e) {
                                    console.log('Cleanup error (non-critical):', e);
                                }
                            }
                        }, 500);
                    }, { once: true });
                    
                    // 添加错误处理
                    newFileInput.addEventListener('error', function(e) {
                        console.error('iOS file input error:', e);
                        showToast('📱 文件选择器出现错误', 'error');
                    });
                    
                    // 延迟触发点击以确保DOM准备就绪
                    setTimeout(() => {
                        try {
                            console.log('Triggering iOS file input click...');
                            
                            // 不显示过早的提示，等用户真正操作后再提示
                            
                            newFileInput.click();
                        } catch (error) {
                            console.error('iOS file input click failed:', error);
                            
                            // 尝试方法2: 直接使用现有的file input
                            try {
                                console.log('Trying fallback method...');
                                if (fileInput) {
                                    // 保存原始accept属性
                                    const originalAccept = fileInput.accept;
                                    fileInput.accept = 'image/*,video/*';
                                    fileInput.click();
                                    // 恢复原始accept属性
                                    setTimeout(() => {
                                        fileInput.accept = originalAccept;
                                    }, 100);
                                }
                            } catch (fallbackError) {
                                console.error('Fallback method failed:', fallbackError);
                                showToast('📱 无法启动文件选择器', 'error');
                            }
                        }
                    }, 50);
                    
                    return true;
                    
                } catch (error) {
                    console.error('iOS file selection setup failed:', error);
                    return false;
                }
            }
            
            document.getElementById('uploadBtn').addEventListener('click', startUpload);
            document.getElementById('clearBtn').addEventListener('click', clearQueue);
            document.getElementById('debugToggle').addEventListener('click', toggleDebugLog);
            
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
                        uploadHint.textContent = '📱 支持照片、视频等文件，大视频选择需要稍等片刻，最大 2GB';
                    }
                    
                    // 添加iOS专用提示
                    addIOSSpecificHints();
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
        
        // iOS专用提示和调试信息
        function addIOSSpecificHints() {
            // 在上传区域下方添加iOS专用说明
            const uploadSection = document.getElementById('upload-section');
            const existingHint = document.getElementById('ios-hint');
            
            if (!existingHint && uploadSection) {
                const iosHint = document.createElement('div');
                iosHint.id = 'ios-hint';
                iosHint.style.cssText = 'background: rgba(52, 144, 220, 0.1); border: 1px solid rgba(52, 144, 220, 0.3); border-radius: 10px; padding: 15px; margin: 15px 0; font-size: 14px; color: #3490dc; text-align: center;';
                
                iosHint.innerHTML = '<div style="font-weight: 600; margin-bottom: 8px;">📱 iOS Safari 用户提示</div><div style="margin-bottom: 5px;">• 点击上传区域后，会弹出选择框</div><div style="margin-bottom: 5px;">• 选择"照片图库"来访问相册中的照片和视频</div><div style="margin-bottom: 5px;">• ⏳ 大视频文件加载需要时间，请耐心等待不要重复点击</div><div style="margin-bottom: 5px;">• 🚀 文件选择完成后会自动启用高速上传</div><div style="margin-bottom: 5px;">• 如果长时间无响应，请刷新页面重试</div><div>• WiFi环境下可获得最佳体验</div>';
                
                uploadSection.appendChild(iosHint);
            }
            
            // 记录详细的设备信息用于调试
            console.log('=== iOS Device Debug Info ===');
            console.log('User Agent:', navigator.userAgent);
            console.log('Platform:', navigator.platform);
            console.log('Vendor:', navigator.vendor);
            console.log('Max Touch Points:', navigator.maxTouchPoints);
            console.log('Touch Support:', 'ontouchstart' in window);
            console.log('File API Support:', !!(window.File && window.FileReader && window.FileList && window.Blob));
            console.log('Safari Detection:', /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent));
            console.log('==============================');
        }
        
        // 设备检测函数
        function getDeviceInfo() {
            const userAgent = navigator.userAgent;
            
            // 更强的iOS检测 - 包括iPad在iPadOS 13+中被识别为Mac的情况
            const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                         /iPad|iPhone|iPod|iOS/.test(navigator.platform) ||
                         (/Safari/.test(userAgent) && /Mobile/.test(userAgent)) ||
                         (navigator.vendor && navigator.vendor.indexOf('Apple') > -1 && 
                          navigator.userAgent.indexOf('CriOS') === -1 && 
                          navigator.userAgent.indexOf('FxiOS') === -1);
            
            // Safari 特别检测
            const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
            
            return {
                isIOS: isIOS,
                isSafari: isSafari,
                isIOSSafari: isIOS && isSafari,
                isAndroid: /Android/.test(userAgent),
                isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(userAgent) ||
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                         isIOS,
                isDesktop: !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(userAgent) &&
                          !(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) &&
                          !isIOS,
                browser: getBrowserInfo(userAgent),
                touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
                userAgent: userAgent,
                platform: navigator.platform,
                maxTouchPoints: navigator.maxTouchPoints
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
            document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
            
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
            
            const deviceInfo = getDeviceInfo();
            let addedCount = 0;
            
            // iOS优化：立即添加到队列显示，延迟加载文件详情
            if (deviceInfo.isIOS) {
                console.log('iOS detected: using fast queue loading');
                
                Array.from(files).forEach((file, index) => {
                    const fileId = Date.now() + Math.random() + index;
                    
                    // 立即创建文件对象，延迟读取详细信息
                    const fileObj = {
                        id: fileId,
                        file: file,
                        name: file.name || '正在读取文件名...',
                        size: file.size || 0,
                        status: 'loading', // 新状态：加载中
                        progress: 0,
                        isLoading: true
                    };
                    
                    fileQueue.push(fileObj);
                    addedCount++;
                    
                    // 立即显示到队列
                    renderFileQueue();
                    
                    // 异步获取完整文件信息
                    setTimeout(() => {
                        try {
                            // 读取文件的详细信息
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                fileObj.name = file.name;
                                fileObj.size = file.size;
                                fileObj.status = 'pending';
                                fileObj.isLoading = false;
                                
                                console.log('iOS file loaded:', file.name, 'size:', file.size);
                                renderFileQueue();
                                updateUploadButton();
                            };
                            
                            reader.onerror = () => {
                                fileObj.status = 'error';
                                fileObj.error = '文件读取失败';
                                fileObj.isLoading = false;
                                renderFileQueue();
                            };
                            
                            // 只读取文件头部来获取基本信息
                            reader.readAsArrayBuffer(file.slice(0, 1024));
                            
                        } catch (error) {
                            console.error('Error reading file details:', error);
                            fileObj.status = 'pending'; // 即使读取失败也允许上传
                            fileObj.isLoading = false;
                            renderFileQueue();
                        }
                    }, index * 50); // 错开处理时间避免阻塞
                });
                
            } else {
                // 非iOS设备：保持原有逻辑
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
            }
            
            console.log('Added', addedCount, 'files to queue. Total queue size:', fileQueue.length);
            
            renderFileQueue();
            updateUploadButton();
            
            // 显示成功提示
            if (addedCount > 0) {
                if (deviceInfo.isIOS) {
                    showToast('📱 文件已添加到队列，正在读取详情...', 'success');
                } else {
                    showToast('📁 已添加 ' + addedCount + ' 个文件到上传队列', 'success');
                }
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
                
                if (fileObj.isLoading) {
                    fileStatus.textContent = '📱 正在读取文件信息...';
                    fileStatus.style.color = '#667eea';
                } else {
                    fileStatus.textContent = getStatusText(fileObj.status);
                }
                
                fileInfo.appendChild(fileStatus);
                
                // 进度条和详细信息（上传中）
                if (fileObj.status === 'uploading') {
                    // 进度信息容器
                    const progressContainer = document.createElement('div');
                    progressContainer.style.cssText = 'background: rgba(102, 126, 234, 0.05); padding: 10px; border-radius: 8px; margin-top: 8px;';
                    
                    // 进度百分比和速度
                    const progressInfo = document.createElement('div');
                    progressInfo.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12px; color: #666;';
                    
                    const progressText = document.createElement('span');
                    progressText.textContent = (fileObj.progress || 0) + '%';
                    
                    const speedText = document.createElement('span');
                    if (fileObj.uploadSpeed) {
                        const speedIcon = fileObj.speedStatus || '📈';
                        const speedMBps = fileObj.uploadSpeedMBps || (fileObj.uploadSpeed / (1024 * 1024));
                        if (speedMBps >= 1) {
                            speedText.textContent = speedIcon + ' ' + speedMBps.toFixed(1) + ' MB/s';
                        } else {
                            speedText.textContent = speedIcon + ' ' + formatFileSize(fileObj.uploadSpeed) + '/s';
                        }
                        
                        // 高速上传时添加特殊样式
                        if (speedMBps >= 5) {
                            speedText.style.color = '#28a745';
                            speedText.style.fontWeight = 'bold';
                        } else if (speedMBps >= 1) {
                            speedText.style.color = '#17a2b8';
                        }
                    } else {
                        speedText.textContent = '🔍 测速中...';
                    }
                    
                    progressInfo.appendChild(progressText);
                    progressInfo.appendChild(speedText);
                    progressContainer.appendChild(progressInfo);
                    
                    // 进度条
                    const progressBar = document.createElement('div');
                    progressBar.style.cssText = 'width: 100%; height: 6px; background: rgba(0,0,0,0.1); border-radius: 3px; overflow: hidden;';
                    
                    const progressFill = document.createElement('div');
                    progressFill.style.cssText = 'height: 100%; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 3px; transition: width 0.3s ease; width: ' + (fileObj.progress || 0) + '%;';
                    
                    progressBar.appendChild(progressFill);
                    progressContainer.appendChild(progressBar);
                    
                    // 上传详情
                    if (fileObj.uploadedBytes && fileObj.totalBytes) {
                        const uploadDetails = document.createElement('div');
                        uploadDetails.style.cssText = 'margin-top: 6px; font-size: 11px; color: #888; display: flex; justify-content: space-between;';
                        
                        const bytesInfo = document.createElement('span');
                        bytesInfo.textContent = formatFileSize(fileObj.uploadedBytes) + ' / ' + formatFileSize(fileObj.totalBytes);
                        
                        const etaInfo = document.createElement('span');
                        if (fileObj.eta && fileObj.eta.formatted) {
                            etaInfo.textContent = '⏱️ 剩余 ' + fileObj.eta.formatted;
                        } else if (fileObj.uploadSpeed && fileObj.uploadSpeed > 0) {
                            const remainingBytes = fileObj.totalBytes - fileObj.uploadedBytes;
                            const etaSeconds = remainingBytes / fileObj.uploadSpeed;
                            etaInfo.textContent = '⏱️ 剩余 ' + formatTime(etaSeconds);
                        } else {
                            etaInfo.textContent = '⏱️ 计算中...';
                        }
                        
                        uploadDetails.appendChild(bytesInfo);
                        uploadDetails.appendChild(etaInfo);
                        progressContainer.appendChild(uploadDetails);
                        
                        // 性能等级和状态显示
                        if (fileObj.performanceGrade) {
                            const performanceInfo = document.createElement('div');
                            performanceInfo.style.cssText = 'margin-top: 4px; font-size: 10px; display: flex; justify-content: space-between; align-items: center;';
                            
                            const gradeInfo = document.createElement('span');
                            gradeInfo.style.cssText = 'color: ' + fileObj.performanceGrade.color + '; font-weight: bold;';
                            gradeInfo.textContent = fileObj.performanceGrade.icon + ' ' + fileObj.performanceGrade.text;
                            
                            const statusInfo = document.createElement('span');
                            statusInfo.style.cssText = 'color: #666;';
                            if (fileObj.isStalled) {
                                statusInfo.style.color = '#f44336';
                                statusInfo.textContent = '⚠️ 上传停滞';
                            } else {
                                statusInfo.textContent = '🔄 正在上传';
                            }
                            
                            performanceInfo.appendChild(gradeInfo);
                            performanceInfo.appendChild(statusInfo);
                            progressContainer.appendChild(performanceInfo);
                        }
                    }
                    
                    fileInfo.appendChild(progressContainer);
                }
                
                // 错误信息（上传失败）
                if (fileObj.status === 'error' && fileObj.error) {
                    const errorContainer = document.createElement('div');
                    errorContainer.style.cssText = 'background: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.3); padding: 10px; border-radius: 8px; margin-top: 8px;';
                    
                    const errorText = document.createElement('div');
                    errorText.style.cssText = 'color: #f44336; font-weight: 600; margin-bottom: 4px;';
                    errorText.textContent = '❌ 上传失败';
                    errorContainer.appendChild(errorText);
                    
                    const errorDetail = document.createElement('div');
                    errorDetail.style.cssText = 'color: #f44336; font-size: 12px;';
                    errorDetail.textContent = fileObj.error;
                    errorContainer.appendChild(errorDetail);
                    
                    fileInfo.appendChild(errorContainer);
                }
                
                // 下载链接（上传成功）
                if (fileObj.status === 'success' && fileObj.downloadUrl) {
                    const successContainer = document.createElement('div');
                    successContainer.style.cssText = 'background: rgba(102, 126, 234, 0.1); padding: 8px; border-radius: 8px; margin-top: 8px;';
                    
                    const successText = document.createElement('div');
                    successText.style.cssText = 'color: #4caf50; font-weight: 600; margin-bottom: 4px;';
                    successText.textContent = '✅ 上传成功';
                    successContainer.appendChild(successText);
                    
                    // 显示性能报告
                    if (fileObj.performanceReport) {
                        const perfReport = document.createElement('div');
                        perfReport.style.cssText = 'color: #666; font-size: 11px; margin-bottom: 6px; line-height: 1.3;';
                        perfReport.innerHTML = '📊 性能报告：' + 
                            '耗时 ' + fileObj.performanceReport.totalTime + 
                            '，平均 ' + fileObj.performanceReport.averageSpeed + 
                            '，效率 ' + fileObj.performanceReport.efficiency;
                        successContainer.appendChild(perfReport);
                    }
                    
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
            uploadBtn.textContent = isUploading ? '上传中...' : '开始上传 (' + pendingFiles.length + ')';
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
        
        function toggleDebugLog() {
            debugLogVisible = !debugLogVisible;
            const debugLog = document.getElementById('debugLog');
            const debugToggle = document.getElementById('debugToggle');
            
            if (debugLogVisible) {
                debugLog.style.display = 'block';
                debugToggle.textContent = '隐藏调试日志';
                logToPage('调试日志已启用', 'info');
            } else {
                debugLog.style.display = 'none';
                debugToggle.textContent = '显示调试日志';
            }
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
            if (pendingFiles.length === 0) {
                logToPage('没有待上传的文件', 'warn');
                return;
            }
            
            logToPage('开始上传 ' + pendingFiles.length + ' 个文件', 'info');
            
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
            
            // 动态调整文件级别的并发数
            const deviceInfo = getDeviceInfo();
            const concurrentUploads = deviceInfo.isMobile ? 2 : 3; // 移动端2个，桌面端3个
            
            // 智能批处理：小文件可以更多并发，大文件减少并发
            const smallFiles = pendingFiles.filter(f => f.file.size <= 10 * 1024 * 1024);
            const largeFiles = pendingFiles.filter(f => f.file.size > 10 * 1024 * 1024);
            
            // 先并发上传小文件
            if (smallFiles.length > 0) {
                const smallFileConcurrency = Math.min(smallFiles.length, deviceInfo.isMobile ? 3 : 5);
                for (let i = 0; i < smallFiles.length; i += smallFileConcurrency) {
                    const batch = smallFiles.slice(i, i + smallFileConcurrency);
                    const batchPromises = batch.map(fileObj => uploadFile(fileObj));
                    await Promise.all(batchPromises);
                }
            }
            
            // 然后逐个上传大文件（分块上传已经有内部并发）
            for (const fileObj of largeFiles) {
                await uploadFile(fileObj);
            }
            
            isUploading = false;
            updateUploadButton();
            
            const successCount = fileQueue.filter(f => f.status === 'success').length;
            const errorCount = fileQueue.filter(f => f.status === 'error').length;
            
            // 修复时间计算错误
            let totalUploadTime = 10; // 默认10秒，避免除零错误
            const uploadStartTime = uploadingFiles.find(f => f.startTime)?.startTime;
            if (uploadStartTime) {
                totalUploadTime = (Date.now() - uploadStartTime) / 1000;
            }
            const totalBytes = fileQueue.reduce((sum, f) => sum + (f.file?.size || 0), 0);
            const avgSpeed = totalBytes / totalUploadTime;
            const avgSpeedMBps = avgSpeed / (1024 * 1024);
            
            // 生成性能报告
            console.log('📊 Upload session performance report:', {
                totalFiles: fileQueue.length,
                successfulFiles: successCount,
                failedFiles: errorCount,
                totalSize: formatFileSize(totalBytes),
                totalTime: totalUploadTime.toFixed(2) + 's',
                averageSpeed: avgSpeedMBps.toFixed(2) + ' MB/s',
                efficiency: ((successCount / fileQueue.length) * 100).toFixed(1) + '%'
            });
            
            if (errorCount === 0) {
                let successMsg = '🎉 所有文件上传成功 (' + successCount + '个)';
                if (avgSpeedMBps >= 1) {
                    successMsg += ' 平均速度: ' + avgSpeedMBps.toFixed(1) + ' MB/s';
                }
                showToast(successMsg, 'success');
            } else {
                showToast('上传完成：成功 ' + successCount + '个，失败 ' + errorCount + '个', 'error');
            }
        }
        
        async function uploadFile(fileObj) {
            fileObj.status = 'uploading';
            fileObj.progress = 0;
            fileObj.uploadSpeed = 0;
            fileObj.startTime = Date.now();
            renderFileQueue();
            
            try {
                // 网络状态检测
                if (navigator.onLine === false) {
                    throw new Error('🌐 网络连接已断开，请检查网络后重试');
                }
                
                // 判断是否需要分块上传
                const deviceInfo = getDeviceInfo();
                const chunkThreshold = deviceInfo.isMobile ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 移动端5MB，桌面端10MB
                
                if (fileObj.file.size > chunkThreshold) {
                    console.log('File size ' + fileObj.file.size + ' bytes > ' + chunkThreshold + ' bytes, using chunked upload');
                    await uploadFileChunked(fileObj);
                } else {
                    console.log('File size ' + fileObj.file.size + ' bytes <= ' + chunkThreshold + ' bytes, using normal upload');
                    await uploadFileNormal(fileObj);
                }
            } catch (error) {
                console.error('Upload error:', error);
                fileObj.status = 'error';
                fileObj.error = getFriendlyErrorMessage(0, error.message);
                renderFileQueue();
            }
        }
        
        async function uploadFileNormal(fileObj) {
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
                fileObj.progress = 100;
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
            
            renderFileQueue();
        }
        
        async function uploadFileChunked(fileObj) {
            const file = fileObj.file;
            const fileSize = file.size;
            console.log('Starting chunked upload for ' + file.name + ', size: ' + fileSize + ' bytes');
            
            // 网络速度测试和参数优化
            console.log('🚀 Performing network speed test for optimal upload parameters...');
            showToast('🔍 正在检测网络速度，优化上传参数...', 'info');
            
            const deviceInfo = getDeviceInfo();
            let optimalChunkSize, maxConcurrency, strategy;
            
            let speedTest; // 声明在外层作用域
            try {
                logToPage('正在测试网络速度...', 'info');
                // 测试网络速度
                speedTest = await testNetworkSpeed();
                logToPage('网络速度: 下载 ' + speedTest.download.speedMbps.toFixed(2) + ' Mbps, 上传 ' + speedTest.upload.speedMbps.toFixed(2) + ' Mbps', 'success');
                
                const uploadParams = getOptimalUploadParams(speedTest, fileSize, deviceInfo);
                logToPage('选择策略: ' + uploadParams.strategy + ', 分块: ' + formatFileSize(uploadParams.chunkSize) + ', 并发: ' + uploadParams.maxConcurrency, 'info');
                
                optimalChunkSize = uploadParams.chunkSize;
                maxConcurrency = uploadParams.maxConcurrency;
                strategy = uploadParams.strategy;
                
                // 显示优化后的参数
                showToast(
                    '⚡ 已优化：' + strategy + ' 策略，' + formatFileSize(optimalChunkSize) + ' 分块，' + maxConcurrency + ' 路并发', 
                    'success'
                );
                
                console.log('🎯 Optimized upload parameters:', {
                    networkSpeed: speedTest.upload.speedMbps.toFixed(2) + ' Mbps',
                    strategy: strategy,
                    chunkSize: formatFileSize(optimalChunkSize),
                    concurrency: maxConcurrency,
                    http2Support: speedTest.http2Support,
                    serviceWorkerSupport: speedTest.serviceWorkerSupport,
                    estimatedTime: Math.round(fileSize / (speedTest.upload.speedMbps * 0.125 * maxConcurrency)) + 's'
                });
                
            } catch (error) {
                console.warn('Network speed test failed, using fallback parameters:', error);
                // 降级到保守参数
                if (deviceInfo.isMobile) {
                    optimalChunkSize = 4 * 1024 * 1024; // 4MB
                    maxConcurrency = 3;
                } else {
                    optimalChunkSize = 8 * 1024 * 1024; // 8MB  
                    maxConcurrency = 6;
                }
                strategy = 'fallback';
                showToast('⚠️ 网络检测失败，使用默认参数', 'error');
            }
            
            // 智能选择上传方式：根据文件大小选择普通上传或分块上传
            const shouldUseChunkedUpload = fileSize > 50 * 1024 * 1024; // 50MB以上使用分块上传
            
            if (shouldUseChunkedUpload) {
                logToPage('文件较大 (' + formatFileSize(fileSize) + ')，使用分块上传: ' + file.name, 'info');
                return await performChunkedUpload(fileObj, optimalChunkSize, maxConcurrency, strategy, speedTest);
            } else {
                logToPage('文件较小 (' + formatFileSize(fileSize) + ')，使用直接上传: ' + file.name, 'info');
                
                // 为直接上传创建简化的性能监控
                const directUploadMonitor = new UploadPerformanceMonitor(
                    fileSize, 
                    speedTest.upload.speedMbps
                );
            }
            
            // 准备上传数据
            const formData = new FormData();
            formData.append('file', file);
            
            const token = authManager.getCurrentToken();
            if (token) {
                // 管理员模式：使用token
                formData.append('password', 'admin_authenticated');
            } else {
                // 游客模式：使用密码
                formData.append('password', uploadPassword);
            }
            
            const uploadHeaders = {};
            if (token) {
                uploadHeaders['X-Auth-Token'] = token;
            }
            
            // 使用XMLHttpRequest获取实时上传进度
            const result = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                // 设置上传进度监听
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        fileObj.progress = progress;
                        
                        // 使用性能监控更新进度
                        const monitoring = directUploadMonitor.updateProgress(e.loaded, fileObj);
                        
                        // 检测停滞并发出警告
                        if (monitoring.isStalled) {
                            logToPage('⚠️ 检测到上传停滞，正在尝试恢复...', 'warning');
                        }
                        
                        logToPage('上传进度: ' + progress + '%, 速度: ' + monitoring.speed.toFixed(2) + ' MB/s ' + 
                                 monitoring.grade.icon, 'progress');
                        renderFileQueue();
                    }
                });
                
                // 设置请求完成监听
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            
                            // 生成性能报告
                            const perfReport = directUploadMonitor.generatePerformanceReport();
                            logToPage('上传成功: ' + response.fileName, 'success');
                            logToPage('📊 性能报告 - 总时间: ' + perfReport.totalTime + 
                                     ', 平均速度: ' + perfReport.averageSpeed + 
                                     ', 效率: ' + perfReport.efficiency, 'info');
                            
                            response.performanceReport = perfReport;
                            resolve(response);
                        } catch (e) {
                            logToPage('响应解析失败: ' + e.message, 'error');
                            reject(new Error('响应解析失败: ' + e.message));
                        }
                    } else {
                        try {
                            const error = JSON.parse(xhr.responseText);
                            logToPage('上传失败: ' + (error.error || xhr.status), 'error');
                            reject(new Error(error.error || '上传失败: ' + xhr.status));
                        } catch (e) {
                            logToPage('上传失败: HTTP ' + xhr.status, 'error');
                            reject(new Error('上传失败: HTTP ' + xhr.status));
                        }
                    }
                });
                
                // 设置错误监听
                xhr.addEventListener('error', () => {
                    logToPage('网络错误: 上传失败', 'error');
                    reject(new Error('网络错误: 上传失败'));
                });
                
                // 设置超时监听
                xhr.addEventListener('timeout', () => {
                    logToPage('上传超时', 'error');
                    reject(new Error('上传超时'));
                });
                
                // 配置请求
                xhr.open('POST', '/upload');
                xhr.timeout = 300000; // 5分钟超时
                
                // 设置请求头
                if (token) {
                    xhr.setRequestHeader('X-Auth-Token', token);
                }
                
                // 发送请求
                xhr.send(formData);
            });
            
            // 设置文件结果
            fileObj.status = 'success';
            fileObj.progress = 100;
            fileObj.downloadUrl = result.downloadUrl;
            fileObj.fileId = result.fileId;
            fileObj.performanceReport = result.performanceReport;
            renderFileQueue();
            return;
        }
        
        // 性能监控类
        class UploadPerformanceMonitor {
            constructor(fileSize, expectedSpeed) {
                this.fileSize = fileSize;
                this.expectedSpeed = expectedSpeed;
                this.startTime = Date.now();
                this.lastUpdateTime = Date.now();
                this.speedHistory = [];
                this.chunkTimings = [];
                this.stallDetectionThreshold = 10000; // 10秒无进度视为停滞
                this.lastBytesUploaded = 0;
                this.adaptiveAdjustments = 0;
            }
            
            recordChunkCompletion(chunkSize, timeTaken) {
                this.chunkTimings.push({
                    size: chunkSize,
                    time: timeTaken,
                    speed: chunkSize / (timeTaken / 1000),
                    timestamp: Date.now()
                });
                
                // 保持最近20个分块的记录
                if (this.chunkTimings.length > 20) {
                    this.chunkTimings.shift();
                }
            }
            
            updateProgress(bytesUploaded, fileObj) {
                const currentTime = Date.now();
                const elapsed = (currentTime - this.startTime) / 1000;
                const speed = bytesUploaded / elapsed;
                const speedMBps = speed / (1024 * 1024);
                
                // 记录速度历史
                this.speedHistory.push({
                    time: currentTime,
                    speed: speedMBps,
                    bytes: bytesUploaded
                });
                
                // 保持最近50个数据点
                if (this.speedHistory.length > 50) {
                    this.speedHistory.shift();
                }
                
                // 检测停滞
                const isStalled = this.detectStall(bytesUploaded, currentTime);
                
                // 计算预测完成时间
                const eta = this.calculateETA(bytesUploaded, speedMBps);
                
                // 性能分级
                const performanceGrade = this.getPerformanceGrade(speedMBps);
                
                // 更新文件对象
                fileObj.uploadSpeed = speed;
                fileObj.uploadSpeedMBps = speedMBps;
                fileObj.uploadedBytes = bytesUploaded;
                fileObj.totalBytes = this.fileSize;
                fileObj.speedStatus = performanceGrade.icon;
                fileObj.performanceGrade = performanceGrade;
                fileObj.eta = eta;
                fileObj.isStalled = isStalled;
                
                this.lastUpdateTime = currentTime;
                this.lastBytesUploaded = bytesUploaded;
                
                return {
                    speed: speedMBps,
                    grade: performanceGrade,
                    eta: eta,
                    isStalled: isStalled
                };
            }
            
            detectStall(bytesUploaded, currentTime) {
                return (currentTime - this.lastUpdateTime > this.stallDetectionThreshold) && 
                       (bytesUploaded === this.lastBytesUploaded);
            }
            
            calculateETA(bytesUploaded, speedMBps) {
                if (speedMBps <= 0) return null;
                
                const remainingBytes = this.fileSize - bytesUploaded;
                const remainingMB = remainingBytes / (1024 * 1024);
                const etaSeconds = remainingMB / speedMBps;
                
                return {
                    seconds: etaSeconds,
                    formatted: this.formatTime(etaSeconds)
                };
            }
            
            getPerformanceGrade(speedMBps) {
                if (speedMBps >= 20) {
                    return { icon: '🚀', level: 'ultra', text: '极速上传', color: '#ff6b6b' };
                } else if (speedMBps >= 10) {
                    return { icon: '⚡', level: 'high', text: '高速上传', color: '#51cf66' };
                } else if (speedMBps >= 5) {
                    return { icon: '📈', level: 'good', text: '良好速度', color: '#339af0' };
                } else if (speedMBps >= 1) {
                    return { icon: '🔄', level: 'medium', text: '中等速度', color: '#ffd43b' };
                } else if (speedMBps >= 0.1) {
                    return { icon: '🐌', level: 'slow', text: '较慢速度', color: '#ff922b' };
                } else {
                    return { icon: '⏳', level: 'very-slow', text: '极慢速度', color: '#f03e3e' };
                }
            }
            
            formatTime(seconds) {
                if (!seconds || seconds <= 0) return '计算中...';
                
                if (seconds < 60) {
                    return Math.round(seconds) + '秒';
                } else if (seconds < 3600) {
                    const minutes = Math.floor(seconds / 60);
                    const remainingSeconds = Math.round(seconds % 60);
                    return minutes + '分' + (remainingSeconds > 0 ? remainingSeconds + '秒' : '');
                } else {
                    const hours = Math.floor(seconds / 3600);
                    const minutes = Math.floor((seconds % 3600) / 60);
                    return hours + '小时' + (minutes > 0 ? minutes + '分' : '');
                }
            }
            
            getAverageSpeed() {
                if (this.speedHistory.length === 0) return 0;
                
                const recentData = this.speedHistory.slice(-10);
                const sum = recentData.reduce((acc, data) => acc + data.speed, 0);
                return sum / recentData.length;
            }
            
            generatePerformanceReport() {
                const totalTime = (Date.now() - this.startTime) / 1000;
                const avgSpeed = this.getAverageSpeed();
                const efficiency = avgSpeed / this.expectedSpeed;
                
                return {
                    totalTime: this.formatTime(totalTime),
                    averageSpeed: avgSpeed.toFixed(2) + ' MB/s',
                    chunksCompleted: this.chunkTimings.length,
                    efficiency: Math.round(efficiency * 100) + '%',
                    adaptiveAdjustments: this.adaptiveAdjustments
                };
            }
        }
        
        // 分块上传实现
        async function performChunkedUpload(fileObj, chunkSize, maxConcurrency, strategy, speedTest) {
            const file = fileObj.file;
            const fileSize = file.size;
            
            // 初始化性能监控
            const performanceMonitor = new UploadPerformanceMonitor(
                fileSize, 
                speedTest.upload.speedMbps
            );
            
            // 启动分块上传会话
            const token = authManager.getCurrentToken();
            const startPayload = {
                fileName: file.name,
                fileSize: fileSize,
                chunkSize: chunkSize
            };
            
            if (token) {
                // 管理员模式
            } else {
                // 游客模式
                startPayload.password = uploadPassword;
            }
            
            const startHeaders = { 'Content-Type': 'application/json' };
            if (token) {
                startHeaders['X-Auth-Token'] = token;
            }
            
            logToPage('正在启动分块上传会话...', 'info');
            const startResponse = await fetch('/chunked-upload/start', {
                method: 'POST',
                headers: startHeaders,
                body: JSON.stringify(startPayload)
            });
            
            if (!startResponse.ok) {
                const error = await startResponse.json();
                logToPage('启动分块上传失败: ' + (error.error || startResponse.status), 'error');
                throw new Error(error.error || '启动分块上传失败: ' + startResponse.status);
            }
            
            const { sessionId, chunkSize: actualChunkSize } = await startResponse.json();
            logToPage('分块上传会话已启动: ' + sessionId + ', 分块大小: ' + formatFileSize(actualChunkSize), 'success');
            
            // 创建分块
            const totalChunks = Math.ceil(fileSize / actualChunkSize);
            const chunks = [];
            
            for (let i = 0; i < totalChunks; i++) {
                const start = i * actualChunkSize;
                const end = Math.min(start + actualChunkSize, fileSize);
                chunks.push({
                    index: i,
                    start: start,
                    end: end,
                    size: end - start
                });
            }
            
            logToPage('开始分块上传：共 ' + totalChunks + ' 个分块', 'info');
            
            // 管道化上传
            let uploadedBytes = 0;
            let completedChunks = 0;
            let activeUploads = [];
            let chunkIndex = 0;
            
            const uploadChunk = async (chunk) => {
                const chunkData = file.slice(chunk.start, chunk.end);
                
                const xhr = new XMLHttpRequest();
                
                return new Promise((resolve, reject) => {
                    xhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                            // 更新总体进度
                            const chunkProgress = e.loaded / e.total;
                            const totalProgress = ((completedChunks + chunkProgress) / totalChunks) * 100;
                            fileObj.progress = Math.round(totalProgress);
                            
                            const currentBytes = uploadedBytes + e.loaded;
                            
                            // 使用性能监控更新进度
                            const monitoring = performanceMonitor.updateProgress(currentBytes, fileObj);
                            
                            // 检测停滞并发出警告
                            if (monitoring.isStalled) {
                                logToPage('⚠️ 检测到上传停滞，正在尝试恢复...', 'warning');
                            }
                            
                            renderFileQueue();
                        }
                    });
                    
                    xhr.addEventListener('load', async () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const response = JSON.parse(xhr.responseText);
                                resolve(response);
                            } catch (e) {
                                reject(new Error('响应解析失败: ' + e.message));
                            }
                        } else {
                            reject(new Error('分块上传失败: HTTP ' + xhr.status));
                        }
                    });
                    
                    xhr.addEventListener('error', () => {
                        reject(new Error('网络错误'));
                    });
                    
                    xhr.addEventListener('timeout', () => {
                        reject(new Error('上传超时'));
                    });
                    
                    xhr.open('PUT', '/chunked-upload/chunk/' + sessionId);
                    xhr.setRequestHeader('Content-Range', 'bytes ' + chunk.start + '-' + (chunk.end - 1) + '/' + fileSize);
                    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
                    if (token) {
                        xhr.setRequestHeader('X-Auth-Token', token);
                    }
                    xhr.timeout = 60000; // 1分钟超时
                    
                    xhr.send(chunkData);
                });
            };
            
            // 并发上传控制
            while (chunkIndex < chunks.length || activeUploads.length > 0) {
                // 启动新的分块上传
                while (activeUploads.length < maxConcurrency && chunkIndex < chunks.length) {
                    const chunk = chunks[chunkIndex++];
                    logToPage('上传分块 ' + (chunk.index + 1) + '/' + totalChunks + ' (' + formatFileSize(chunk.size) + ')', 'info');
                    
                    const chunkStartTime = Date.now();
                    const uploadPromise = uploadChunk(chunk).then(result => {
                        const chunkTime = Date.now() - chunkStartTime;
                        completedChunks++;
                        uploadedBytes += chunk.size;
                        
                        // 记录分块性能
                        performanceMonitor.recordChunkCompletion(chunk.size, chunkTime);
                        
                        const chunkSpeedMBps = (chunk.size / (1024 * 1024)) / (chunkTime / 1000);
                        logToPage('分块 ' + (chunk.index + 1) + ' 上传完成 (' + chunkSpeedMBps.toFixed(2) + ' MB/s)', 'success');
                        
                        if (result.completed) {
                            // 生成性能报告
                            const perfReport = performanceMonitor.generatePerformanceReport();
                            logToPage('🎉 文件上传完成: ' + file.name, 'success');
                            logToPage('📊 性能报告 - 总时间: ' + perfReport.totalTime + 
                                     ', 平均速度: ' + perfReport.averageSpeed + 
                                     ', 效率: ' + perfReport.efficiency, 'info');
                            
                            fileObj.status = 'success';
                            fileObj.progress = 100;
                            fileObj.downloadUrl = result.downloadUrl;
                            fileObj.fileId = result.fileId;
                            fileObj.performanceReport = perfReport;
                            renderFileQueue();
                            return { completed: true, result };
                        }
                        
                        return { completed: false };
                    }).catch(error => {
                        logToPage('分块 ' + (chunk.index + 1) + ' 上传失败: ' + error.message, 'error');
                        throw error;
                    });
                    
                    activeUploads.push(uploadPromise);
                }
                
                // 等待至少一个分块完成
                if (activeUploads.length > 0) {
                    try {
                        // 为每个Promise添加索引标识
                        const indexedPromises = activeUploads.map((promise, index) => 
                            promise.then(result => ({ index, result, success: true }))
                                  .catch(error => ({ index, error, success: false }))
                        );
                        
                        const { index, result, error, success } = await Promise.race(indexedPromises);
                        
                        // 移除已完成的Promise
                        activeUploads.splice(index, 1);
                        
                        if (success) {
                            // 检查是否上传完成
                            if (result && result.completed) {
                                return;
                            }
                        } else {
                            logToPage('分块上传出错，继续尝试其他分块: ' + error.message, 'error');
                        }
                    } catch (error) {
                        logToPage('Promise处理错误: ' + error.message, 'error');
                        activeUploads = [];
                    }
                }
            }
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
                const downloadUrl = '/d/' + file.id;
                
                // 安全地转义文件名中的特殊字符
                const safeFileName = file.name.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
                const escapedFileName = file.name.replace(/'/g, "\\'").replace(/"/g, '\\"');
                
                card.innerHTML = 
                    '<div class="file-card-header">' +
                        '<input type="checkbox" class="file-checkbox" ' + (selectedFiles.has(file.id) ? 'checked' : '') + ' onchange="toggleFileSelection(&quot;' + file.id + '&quot;)">' +
                        '<div class="file-icon">' + fileIcon + '</div>' +
                        '<div class="file-card-title">' + safeFileName + '</div>' +
                    '</div>' +
                    '<div class="file-card-info">' +
                        '<span>' + formatFileSize(file.size) + '</span>' +
                        '<span>' + formatDate(file.createdTime) + '</span>' +
                    '</div>' +
                    '<div class="file-card-actions">' +
                        '<button onclick="previewFile(&quot;' + file.id + '&quot;,&quot;' + escapedFileName + '&quot;)" class="btn btn-secondary btn-xs">预览</button>' +
                        '<button onclick="copyToClipboard(&quot;' + downloadUrl + '&quot;)" class="btn btn-secondary btn-xs">复制链接</button>' +
                        '<button onclick="deleteFile(&quot;' + file.id + '&quot;)" class="btn btn-danger btn-xs">删除</button>' +
                    '</div>';
                
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
                const response = await fetch('/admin/delete/' + fileId, {
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
            
            const confirmed = await showConfirmModal('确定要删除选中的 ' + selectedFiles.size + ' 个文件吗？');
            if (!confirmed) return;
            
            const promises = Array.from(selectedFiles).map(fileId => {
                const token = authManager.getCurrentToken();
                return fetch('/admin/delete/' + fileId, {
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
            const downloadUrl = '/d/' + fileId;
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
                    if (originalError.includes('分块上传失败') || originalError.includes('启动分块上传失败')) {
                        return '📦 大文件上传失败，可能是网络问题或服务器临时不可用，请稍后重试';
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
                            return '🌐 网络连接失败，大文件上传需要稳定网络，请检查网络后重试';
                        }
                        if (originalError.includes('timeout') || originalError.includes('超时')) {
                            return '⏱️ 上传超时，大文件需要更长时间，请检查网络连接并重试';
                        }
                        if (originalError.includes('分块上传失败')) {
                            return '📦 大文件分块上传失败，网络可能不稳定，请稍后重试';
                        }
                        return '🔗 网络错误：' + originalError;
                    }
                    
                    // 如果有原始错误信息，优化显示
                    if (originalError) {
                        if (originalError.includes('mov') || originalError.includes('video') || originalError.includes('mp4')) {
                            return '🎬 视频文件上传失败：' + originalError + '（💡建议：使用WiFi，关闭省电模式，或尝试压缩视频后上传）';
                        }
                        if (originalError.includes('load failed') || originalError.includes('Failed to fetch')) {
                            return '📡 网络连接中断：' + originalError + '（💡建议：检查网络连接，使用WiFi环境，或稍后重试）';
                        }
                        if (originalError.includes('timeout') || originalError.includes('超时')) {
                            return '⏱️ 上传超时：' + originalError + '（💡建议：检查网络速度，尝试在网络较好时重新上传）';
                        }
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
        
        function formatTime(seconds) {
            if (seconds < 60) {
                return Math.ceil(seconds) + '秒';
            } else if (seconds < 3600) {
                const minutes = Math.ceil(seconds / 60);
                return minutes + '分钟';
            } else {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.ceil((seconds % 3600) / 60);
                return hours + '小时' + (minutes > 0 ? minutes + '分钟' : '');
            }
        }
        
        function getStatusText(status) {
            const statusMap = {
                'pending': '等待上传',
                'uploading': '上传中...',
                'success': '上传成功',
                'error': '上传失败',
                'loading': '📱 正在加载...'
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
            toast.className = 'toast ' + type;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }
        
        // 高级网络速度测试函数
        async function testNetworkSpeed() {
            try {
                console.log('🔍 Performing advanced network speed test...');
                
                // Test download speed
                const downloadResult = await testDownloadSpeed();
                
                // Test upload speed
                const uploadResult = await testUploadSpeed();
                
                // 检测HTTP/2支持
                const isHTTP2Supported = 'h2' in navigator || 'http2' in navigator;
                
                // 检测ServiceWorker支持（用于连接复用）
                const isServiceWorkerSupported = 'serviceWorker' in navigator;
                
                console.log('🌐 Advanced network test result:', {
                    download: {
                        duration: downloadResult.duration.toFixed(2) + 's',
                        totalSize: formatFileSize(downloadResult.totalSize),
                        speed: downloadResult.speedMbps.toFixed(2) + ' Mbps'
                    },
                    upload: {
                        duration: uploadResult.duration.toFixed(2) + 's',
                        totalSize: formatFileSize(uploadResult.totalSize),
                        speed: uploadResult.speedMbps.toFixed(2) + ' Mbps'
                    },
                    http2Support: isHTTP2Supported,
                    serviceWorkerSupport: isServiceWorkerSupported
                });
                
                return {
                    download: {
                        speedMbps: downloadResult.speedMbps,
                        speedBps: downloadResult.speedBps,
                        latency: downloadResult.latency
                    },
                    upload: {
                        speedMbps: uploadResult.speedMbps,
                        speedBps: uploadResult.speedBps,
                        latency: uploadResult.latency
                    },
                    // Keep backward compatibility
                    speedMbps: downloadResult.speedMbps,
                    speedBps: downloadResult.speedBps,
                    latency: downloadResult.latency,
                    http2Support: isHTTP2Supported,
                    serviceWorkerSupported: isServiceWorkerSupported,
                    parallelCapability: 3
                };
            } catch (error) {
                console.error('Network speed test failed:', error);
                return {
                    download: {
                        speedMbps: 1,
                        speedBps: 128 * 1024,
                        latency: 5000
                    },
                    upload: {
                        speedMbps: 0.5,
                        speedBps: 64 * 1024,
                        latency: 5000
                    },
                    // Keep backward compatibility
                    speedMbps: 1,
                    speedBps: 128 * 1024,
                    latency: 5000,
                    http2Support: false,
                    serviceWorkerSupport: false,
                    parallelCapability: 1
                };
            }
        }

        async function testDownloadSpeed() {
            const testStart = Date.now();
            const testPromises = [];
            
            // 发送多个并行请求测试真实下载带宽
            for (let i = 0; i < 3; i++) {
                testPromises.push(
                    fetch('/', {
                        method: 'GET',
                        cache: 'no-cache',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    }).then(response => response.text())
                );
            }
            
            const results = await Promise.all(testPromises);
            const testEnd = Date.now();
            const testDuration = (testEnd - testStart) / 1000; // 秒
            
            // 计算总传输数据量
            const totalSize = results.reduce((sum, data) => sum + new Blob([data]).size, 0);
            const speedBps = totalSize / testDuration; // 字节每秒
            const speedMbps = (speedBps * 8) / (1024 * 1024); // Mbps
            
            return {
                duration: testDuration,
                totalSize: totalSize,
                speedBps: speedBps,
                speedMbps: speedMbps,
                latency: testDuration * 1000 / testPromises.length
            };
        }

        async function testUploadSpeed() {
            return new Promise((resolve, reject) => {
                try {
                    // Create 1MB test payload
                    const testSizeMB = 1;
                    const testPayload = new ArrayBuffer(testSizeMB * 1024 * 1024);
                    const testData = new Uint8Array(testPayload);
                    
                    // Fill with random data to prevent compression
                    for (let i = 0; i < testData.length; i++) {
                        testData[i] = Math.floor(Math.random() * 256);
                    }
                    
                    const xhr = new XMLHttpRequest();
                    const testStart = Date.now();
                    let uploadStart = null;
                    
                    xhr.upload.addEventListener('loadstart', () => {
                        uploadStart = Date.now();
                    });
                    
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const progress = (event.loaded / event.total) * 100;
                            console.log('Upload progress: ' + progress.toFixed(2) + '%');
                        }
                    });
                    
                    xhr.addEventListener('load', () => {
                        const testEnd = Date.now();
                        const testDuration = (testEnd - (uploadStart || testStart)) / 1000;
                        
                        if (testDuration > 0) {
                            const speedBps = testPayload.byteLength / testDuration;
                            const speedMbps = (speedBps * 8) / (1024 * 1024);
                            
                            resolve({
                                duration: testDuration,
                                totalSize: testPayload.byteLength,
                                speedBps: speedBps,
                                speedMbps: speedMbps,
                                latency: testDuration * 1000
                            });
                        } else {
                            // Fallback for very fast uploads
                            resolve({
                                duration: 0.1,
                                totalSize: testPayload.byteLength,
                                speedBps: testPayload.byteLength * 10,
                                speedMbps: (testPayload.byteLength * 10 * 8) / (1024 * 1024),
                                latency: 100
                            });
                        }
                    });
                    
                    xhr.addEventListener('error', (error) => {
                        console.error('Upload speed test error:', error);
                        resolve({
                            duration: 5.0,
                            totalSize: testPayload.byteLength,
                            speedBps: 64 * 1024, // 64KB/s fallback
                            speedMbps: 0.5,
                            latency: 5000
                        });
                    });
                    
                    xhr.addEventListener('timeout', () => {
                        console.error('Upload speed test timeout');
                        resolve({
                            duration: 5.0,
                            totalSize: testPayload.byteLength,
                            speedBps: 64 * 1024, // 64KB/s fallback
                            speedMbps: 0.5,
                            latency: 5000
                        });
                    });
                    
                    xhr.open('POST', '/speed-test', true);
                    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
                    xhr.timeout = 10000; // 10 second timeout
                    
                    xhr.send(testPayload);
                    
                } catch (error) {
                    console.error('Upload speed test setup error:', error);
                    resolve({
                        duration: 5.0,
                        totalSize: 1024 * 1024, // 1MB
                        speedBps: 64 * 1024, // 64KB/s fallback
                        speedMbps: 0.5,
                        latency: 5000
                    });
                }
            });
        }
        
        // 高级上传参数优化算法
        function getOptimalUploadParams(speedTest, fileSize, deviceInfo) {
            // Use the new data structure with separate upload and download speeds
            const uploadSpeed = speedTest.upload.speedMbps;
            const downloadSpeed = speedTest.download.speedMbps;
            
            const { http2Support, serviceWorkerSupported, parallelCapability } = speedTest;
            let chunkSize, maxConcurrency, strategy;
            
            console.log('🎯 Determining optimal upload params:', {
                uploadSpeed: uploadSpeed.toFixed(2) + ' Mbps',
                downloadSpeed: downloadSpeed.toFixed(2) + ' Mbps',
                fileSize: formatFileSize(fileSize),
                device: deviceInfo.isMobile ? 'mobile' : 'desktop',
                http2: http2Support,
                serviceWorker: serviceWorkerSupported
            });
            
            // HTTP/2支持可以增加并发数
            const http2Multiplier = http2Support ? 1.5 : 1.0;
            
            if (uploadSpeed >= 100) {
                // 极高速网络 (>100Mbps) - 激进策略
                strategy = 'ultra-high-performance';
                chunkSize = deviceInfo.isMobile ? 32 * 1024 * 1024 : 64 * 1024 * 1024; // 32MB/64MB
                maxConcurrency = Math.floor((deviceInfo.isMobile ? 12 : 20) * http2Multiplier);
            } else if (uploadSpeed >= 50) {
                // 高速网络 (50-100Mbps)
                strategy = 'high-performance';
                chunkSize = deviceInfo.isMobile ? 16 * 1024 * 1024 : 32 * 1024 * 1024; // 16MB/32MB
                maxConcurrency = Math.floor((deviceInfo.isMobile ? 10 : 15) * http2Multiplier);
            } else if (uploadSpeed >= 20) {
                // 中高速网络 (20-50Mbps)
                strategy = 'enhanced';
                chunkSize = deviceInfo.isMobile ? 12 * 1024 * 1024 : 24 * 1024 * 1024; // 12MB/24MB
                maxConcurrency = Math.floor((deviceInfo.isMobile ? 8 : 12) * http2Multiplier);
            } else if (uploadSpeed >= 10) {
                // 中速网络 (10-20Mbps)
                strategy = 'balanced';
                chunkSize = deviceInfo.isMobile ? 8 * 1024 * 1024 : 16 * 1024 * 1024; // 8MB/16MB
                maxConcurrency = Math.floor((deviceInfo.isMobile ? 6 : 10) * http2Multiplier);
            } else if (uploadSpeed >= 2) {
                // 低速网络 (2-10Mbps) - 极保守策略
                strategy = 'conservative';
                chunkSize = deviceInfo.isMobile ? 1 * 1024 * 1024 : 2 * 1024 * 1024; // 1MB/2MB (大幅降低)
                maxConcurrency = 1; // 强制单线程，避免Failed to fetch
            } else {
                // 极低速网络 (<2Mbps)
                strategy = 'ultra-conservative';
                chunkSize = deviceInfo.isMobile ? 1 * 1024 * 1024 : 2 * 1024 * 1024; // 1MB/2MB
                maxConcurrency = deviceInfo.isMobile ? 1 : 2;
            }
            
            // 文件大小自适应调整
            if (fileSize > 1024 * 1024 * 1024) { // >1GB
                // 超大文件：降低并发，增加分块大小
                maxConcurrency = Math.max(1, Math.floor(maxConcurrency * 0.6));
                chunkSize = Math.min(chunkSize * 1.5, 64 * 1024 * 1024); // 最大64MB
                strategy += '-large-file';
            } else if (fileSize > 500 * 1024 * 1024) { // >500MB
                // 大文件：适度降低并发
                maxConcurrency = Math.max(1, Math.floor(maxConcurrency * 0.8));
                strategy += '-big-file';
            }
            
            // 浏览器并发限制
            const browserConcurrencyLimit = deviceInfo.isMobile ? 12 : 20;
            maxConcurrency = Math.min(maxConcurrency, browserConcurrencyLimit);
            
            console.log('🚀 Optimized strategy selected:', strategy, {
                chunkSize: formatFileSize(chunkSize),
                maxConcurrency: maxConcurrency,
                http2Boost: http2Support ? '+50%' : 'none',
                estimatedSpeed: (uploadSpeed * 0.8).toFixed(1) + ' Mbps expected'
            });
            
            return {
                chunkSize: chunkSize,
                maxConcurrency: maxConcurrency,
                strategy: strategy,
                http2Support: http2Support,
                serviceWorkerSupport: serviceWorkerSupport
            };
        }
        
        // 网络质量检测函数（简化版）
        async function checkNetworkQuality() {
            try {
                const startTime = Date.now();
                
                // 发送一个小的测试请求
                const response = await fetch('/', {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                
                const endTime = Date.now();
                const latency = endTime - startTime;
                
                console.log('Network latency:', latency + 'ms');
                
                // 检查连接类型（如果支持）
                let connectionType = 'unknown';
                if (navigator.connection) {
                    connectionType = navigator.connection.effectiveType || navigator.connection.type || 'unknown';
                    console.log('Connection type:', connectionType);
                }
                
                // 判断网络质量
                const isGood = response.ok && latency < 2000 && 
                              (!navigator.connection || 
                               !['slow-2g', '2g'].includes(navigator.connection.effectiveType));
                
                return {
                    isGood: isGood,
                    latency: latency,
                    connectionType: connectionType
                };
            } catch (error) {
                console.error('Network quality check failed:', error);
                return {
                    isGood: false,
                    latency: 99999,
                    connectionType: 'unknown'
                };
            }
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