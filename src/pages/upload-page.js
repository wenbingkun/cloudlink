export function getUploadPageHTML() {
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
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
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
        }
        
        .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 50px;
            border-radius: 25px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2);
            width: 100%;
            max-width: 550px;
            position: relative;
            z-index: 1;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        h1 {
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 40px;
            font-size: 36px;
            font-weight: 700;
            letter-spacing: -0.5px;
            position: relative;
        }
        
        h1::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 3px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
        }
        
        .upload-area {
            border: 3px dashed rgba(102, 126, 234, 0.3);
            border-radius: 20px;
            padding: 60px 30px;
            text-align: center;
            margin-bottom: 30px;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
            position: relative;
            overflow: hidden;
        }
        
        .upload-area::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
            transition: left 0.6s ease;
        }
        
        .upload-area:hover::before {
            left: 100%;
        }
        
        .upload-area:hover, .upload-area.dragover {
            border-color: #667eea;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
            transform: translateY(-2px);
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.2);
        }
        
        .upload-icon {
            font-size: 64px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
            animation: float 3s ease-in-out infinite;
            display: inline-block;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .upload-text {
            color: #4a5568;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
            line-height: 1.5;
        }
        
        .file-input {
            display: none;
        }
        
        .password-input {
            width: 100%;
            padding: 18px 24px;
            border: 2px solid rgba(226, 232, 240, 0.8);
            border-radius: 15px;
            font-size: 16px;
            margin-bottom: 25px;
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        
        .password-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            background: rgba(255, 255, 255, 0.95);
            transform: translateY(-1px);
        }
        
        .password-input::placeholder {
            color: #a0aec0;
        }
        
        .upload-btn {
            width: 100%;
            padding: 18px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 15px;
            font-size: 17px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        
        .upload-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.6s ease;
        }
        
        .upload-btn:hover::before {
            left: 100%;
        }
        
        .upload-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
        }
        
        .upload-btn:active {
            transform: translateY(-1px);
        }
        
        .upload-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background-color: rgba(226, 232, 240, 0.6);
            border-radius: 10px;
            margin: 25px 0;
            overflow: hidden;
            display: none;
            position: relative;
        }
        
        .progress-bar::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
            animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 10px;
            position: relative;
            overflow: hidden;
        }
        
        .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
            animation: progress-shine 1.5s infinite;
        }
        
        @keyframes progress-shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .result {
            margin-top: 25px;
            padding: 20px;
            border-radius: 20px;
            display: none;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            animation: slideIn 0.5s ease-out;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .result.success {
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.04) 100%);
            border: 2px solid rgba(76, 175, 80, 0.3);
            color: #2e7d32;
        }
        
        .result.error {
            background: linear-gradient(135deg, rgba(244, 67, 54, 0.08) 0%, rgba(244, 67, 54, 0.04) 100%);
            border: 2px solid rgba(244, 67, 54, 0.3);
            color: #c62828;
        }
        
        .download-link {
            word-break: break-all;
            background: rgba(248, 250, 252, 0.8);
            padding: 15px;
            border-radius: 12px;
            margin-top: 15px;
            font-family: 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', monospace;
            border: 1px solid rgba(226, 232, 240, 0.8);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }
        
        .copy-btn {
            margin-top: 15px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            color: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }
        
        .copy-btn:hover {
            background: linear-gradient(135deg, #45a049 0%, #388e3c 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
        }
        
        .file-queue {
            display: none;
            margin-bottom: 25px;
        }
        
        .queue-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding: 0 5px;
        }
        
        .queue-title {
            font-weight: 600;
            color: #4a5568;
            font-size: 16px;
        }
        
        .clear-queue-btn {
            background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
        }
        
        .clear-queue-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);
        }

        .file-item {
            background: linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 150, 243, 0.04) 100%);
            border: 2px solid rgba(33, 150, 243, 0.3);
            padding: 15px 20px;
            border-radius: 15px;
            margin-bottom: 10px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            position: relative;
        }
        
        .file-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(33, 150, 243, 0.15);
        }
        
        .file-item.uploading {
            border-color: rgba(255, 193, 7, 0.6);
            background: linear-gradient(135deg, rgba(255, 193, 7, 0.08) 0%, rgba(255, 193, 7, 0.04) 100%);
        }
        
        .file-item.success {
            border-color: rgba(76, 175, 80, 0.6);
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.04) 100%);
        }
        
        .file-item.error {
            border-color: rgba(244, 67, 54, 0.6);
            background: linear-gradient(135deg, rgba(244, 67, 54, 0.08) 0%, rgba(244, 67, 54, 0.04) 100%);
        }
        
        .file-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .file-icon {
            font-size: 24px;
            color: #2196f3;
            min-width: 24px;
        }
        
        .file-details {
            flex: 1;
            min-width: 0;
        }
        
        .file-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
            word-break: break-all;
            line-height: 1.3;
        }
        
        .file-size {
            color: #666;
            font-size: 14px;
        }
        
        .file-status {
            color: #666;
            font-size: 12px;
            margin-top: 2px;
        }
        
        .file-actions {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .remove-file-btn {
            background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
            color: white;
            border: none;
            border-radius: 6px;
            width: 24px;
            height: 24px;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            box-shadow: 0 2px 6px rgba(244, 67, 54, 0.3);
        }
        
        .remove-file-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
        }
        
        .file-progress {
            width: 100%;
            height: 4px;
            background-color: rgba(226, 232, 240, 0.6);
            border-radius: 3px;
            margin-top: 8px;
            overflow: hidden;
            display: none;
        }
        
        .file-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s ease;
            border-radius: 3px;
        }

        .admin-button {
            position: fixed;
            top: 25px;
            right: 25px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: white;
            font-size: 20px;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            z-index: 1000;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }

        .admin-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.6s ease;
        }

        .admin-button:hover::before {
            left: 100%;
        }

        .admin-button:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
        }

        .admin-button:active {
            transform: translateY(-1px) scale(1.02);
        }

        /* 悬浮提示 */
        .admin-button::after {
            content: '管理后台';
            position: absolute;
            bottom: -45px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .admin-button:hover::after {
            opacity: 1;
            bottom: -40px;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 15px;
            }
            
            .admin-button {
                top: 20px;
                right: 20px;
                width: 45px;
                height: 45px;
                font-size: 18px;
            }
            
            .container {
                padding: 35px 25px;
                margin: 0;
                border-radius: 20px;
                max-width: 100%;
            }
            
            h1 {
                font-size: 30px;
                margin-bottom: 30px;
            }
            
            .upload-area {
                padding: 50px 20px;
            }
            
            .upload-icon {
                font-size: 56px;
            }
            
            .upload-text {
                font-size: 17px;
            }
            
            .password-input, .upload-btn {
                font-size: 16px;
            }
        }
        
        @media (max-width: 480px) {
            body {
                padding: 10px;
            }
            
            .admin-button {
                top: 15px;
                right: 15px;
                width: 40px;
                height: 40px;
                font-size: 16px;
            }
            
            .container {
                padding: 25px 20px;
                border-radius: 18px;
            }
        }
        
        /* Toast动画 */
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
            
            h1 {
                font-size: 26px;
                margin-bottom: 25px;
            }
            
            .upload-area {
                padding: 35px 15px;
            }
            
            .upload-icon {
                font-size: 48px;
            }
            
            .upload-text {
                font-size: 15px;
            }
            
            .password-input, .upload-btn {
                padding: 16px 20px;
                font-size: 15px;
            }
            
            .selected-file {
                padding: 15px;
            }
            
            .file-name {
                font-size: 15px;
            }
            
            .file-size {
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📁 CloudLink</h1>
        
        <div class="upload-area" id="uploadArea">
            <div class="upload-icon">📤</div>
            <div class="upload-text">点击选择文件或拖拽文件到此处</div>
            <div style="font-size: 14px; color: #999; margin-top: 5px;">支持图片、文档、音视频、代码等多种格式，最大2GB<br><span style="font-size: 12px; opacity: 0.8;">大文件自动分块上传，移动端20MB+，桌面端50MB+</span></div>
        </div>
        
        <input type="file" id="fileInput" class="file-input" multiple>
        
        <!-- 文件队列 -->
        <div class="file-queue" id="fileQueue">
            <div class="queue-header">
                <div class="queue-title">上传队列 (<span id="queueCount">0</span>)</div>
                <button class="clear-queue-btn" onclick="clearQueue()">清空队列</button>
            </div>
            <div id="fileList"></div>
        </div>
        
        <input type="password" id="passwordInput" class="password-input" placeholder="请输入上传密码">
        
        <button id="uploadBtn" class="upload-btn">上传文件</button>
        
        <div class="progress-bar" id="progressBar">
            <div class="progress-fill" id="progressFill"></div>
        </div>
        
        <div class="result" id="result"></div>
    </div>
    
    <!-- 管理后台按钮 -->
    <a href="/admin" class="admin-button" title="管理后台">
        ⚙️
    </a>

    <script>
        // 认证管理器（内联版本）
        class AuthManager {
            constructor() {
                this.tokenKey = 'cloudlink_auth_token';
                this.tokenExpiry = 'cloudlink_token_expiry';
                this.sessionDuration = 24 * 60 * 60 * 1000; // 24小时
            }

            checkLocalAuth() {
                const token = localStorage.getItem(this.tokenKey);
                const expiry = localStorage.getItem(this.tokenExpiry);
                
                if (!token || !expiry) {
                    return null;
                }
                
                if (Date.now() > parseInt(expiry)) {
                    this.clearAuth();
                    return null;
                }
                
                return token;
            }

            clearAuth() {
                localStorage.removeItem(this.tokenKey);
                localStorage.removeItem(this.tokenExpiry);
            }

            isAuthenticated() {
                const expiry = localStorage.getItem(this.tokenExpiry);
                return expiry && Date.now() < parseInt(expiry);
            }
        }

        const authManager = new AuthManager();
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const passwordInput = document.getElementById('passwordInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        const result = document.getElementById('result');
        const fileQueue = document.getElementById('fileQueue');
        const fileList = document.getElementById('fileList');
        const queueCount = document.getElementById('queueCount');
        
        let selectedFiles = [];
        let uploadId = 0;
        let isAdminMode = false;

        // 页面加载时检查认证状态
        window.addEventListener('load', () => {
            checkAuthStatus();
        });

        function checkAuthStatus() {
            if (authManager.isAuthenticated()) {
                isAdminMode = true;
                passwordInput.style.display = 'none';
                passwordInput.value = 'admin_authenticated'; // 设置一个标识值
                
                // 显示管理员状态提示
                const statusIndicator = document.createElement('div');
                statusIndicator.id = 'authStatus';
                statusIndicator.style.cssText = \`
                    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    text-align: center;
                    font-weight: 600;
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                \`;
                statusIndicator.innerHTML = \`
                    <span>👨‍💼 管理员模式 - 免密上传</span>
                    <button onclick="switchToGuestMode()" style="background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 6px; padding: 5px 10px; cursor: pointer; font-size: 12px;">切换到游客模式</button>
                \`;
                
                passwordInput.parentNode.insertBefore(statusIndicator, passwordInput);
            } else {
                isAdminMode = false;
                passwordInput.style.display = 'block';
                passwordInput.placeholder = '请输入上传密码';
            }
        }

        function switchToGuestMode() {
            isAdminMode = false;
            passwordInput.style.display = 'block';
            passwordInput.value = '';
            passwordInput.placeholder = '请输入上传密码';
            
            const statusIndicator = document.getElementById('authStatus');
            if (statusIndicator) {
                statusIndicator.remove();
            }
            
            showToast('🔄 已切换到游客模式');
        }

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            handleFileSelect(Array.from(e.target.files));
            e.target.value = ''; // 清空input，允许重复选择相同文件
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                handleFileSelect(files);
            }
        });

        function handleFileSelect(files) {
            if (!files || files.length === 0) return;
            
            files.forEach(file => {
                const fileId = ++uploadId;
                const fileObj = {
                    id: fileId,
                    file: file,
                    status: 'pending', // pending, uploading, success, error
                    progress: 0,
                    downloadUrl: null,
                    error: null
                };
                
                selectedFiles.push(fileObj);
                addFileToQueue(fileObj);
            });
            
            updateUI();
            result.style.display = 'none';
        }
        
        function addFileToQueue(fileObj) {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-item';
            fileElement.id = \`file-\${fileObj.id}\`;
            
            fileElement.innerHTML = \`
                <div class="file-info">
                    <div class="file-icon">\${getFileIcon(fileObj.file.type)}</div>
                    <div class="file-details">
                        <div class="file-name">\${fileObj.file.name}</div>
                        <div class="file-size">\${formatFileSize(fileObj.file.size)}</div>
                        <div class="file-status">等待上传</div>
                    </div>
                    <div class="file-actions">
                        <button class="remove-file-btn" onclick="removeFileFromQueue(\${fileObj.id})" title="移除文件">×</button>
                    </div>
                </div>
                <div class="file-progress">
                    <div class="file-progress-fill" style="width: 0%"></div>
                </div>
            \`;
            
            fileList.appendChild(fileElement);
        }
        
        function removeFileFromQueue(fileId) {
            selectedFiles = selectedFiles.filter(f => f.id !== fileId);
            const fileElement = document.getElementById(\`file-\${fileId}\`);
            if (fileElement) {
                fileElement.remove();
            }
            updateUI();
        }
        
        function clearQueue() {
            selectedFiles = [];
            fileList.innerHTML = '';
            updateUI();
        }
        
        function updateUI() {
            const fileCount = selectedFiles.length;
            queueCount.textContent = fileCount;
            
            if (fileCount > 0) {
                fileQueue.style.display = 'block';
                uploadArea.innerHTML = \`
                    <div class="upload-icon">📁</div>
                    <div class="upload-text">已选择 \${fileCount} 个文件</div>
                    <div style="font-size: 14px; color: #999;">点击添加更多文件或拖拽到此处</div>
                \`;
                uploadBtn.textContent = \`上传 \${fileCount} 个文件\`;
            } else {
                fileQueue.style.display = 'none';
                uploadArea.innerHTML = \`
                    <div class="upload-icon">📤</div>
                    <div class="upload-text">点击选择文件或拖拽文件到此处</div>
                    <div style="font-size: 14px; color: #999; margin-top: 5px;">支持图片、文档、音视频、代码等多种格式，最大2GB<br><span style="font-size: 12px; opacity: 0.8;">大文件自动分块上传，移动端20MB+，桌面端50MB+</span></div>
                \`;
                uploadBtn.textContent = '上传文件';
            }
        }
        
        function getFileIcon(mimeType) {
            if (!mimeType) return '📄';
            
            if (mimeType.startsWith('image/')) return '🖼️';
            if (mimeType.startsWith('video/')) return '🎬';
            if (mimeType.startsWith('audio/')) return '🎵';
            if (mimeType.includes('pdf')) return '📕';
            if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
            if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
            if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
            if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '🗜️';
            if (mimeType.includes('text/')) return '📃';
            
            return '📄';
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        uploadBtn.addEventListener('click', async () => {
            if (selectedFiles.length === 0) {
                showResult('请先选择文件', 'error');
                return;
            }

            const password = passwordInput.value.trim();
            if (!password) {
                showResult('请输入上传密码', 'error');
                return;
            }

            uploadBtn.disabled = true;
            result.style.display = 'none';
            
            // 批量上传文件
            const pendingFiles = selectedFiles.filter(f => f.status === 'pending');
            if (pendingFiles.length === 0) {
                showResult('没有需要上传的文件', 'error');
                uploadBtn.disabled = false;
                return;
            }

            try {
                await uploadMultipleFiles(pendingFiles, password);
            } catch (error) {
                console.error('批量上传错误:', error);
                showResult('上传过程中发生错误：' + error.message, 'error');
            } finally {
                uploadBtn.disabled = false;
                updateUploadButtonText();
            }
        });
        
        function updateUploadButtonText() {
            const pendingCount = selectedFiles.filter(f => f.status === 'pending').length;
            const uploadingCount = selectedFiles.filter(f => f.status === 'uploading').length;
            
            if (uploadingCount > 0) {
                uploadBtn.textContent = \`上传中... (\${uploadingCount})\`;
            } else if (pendingCount > 0) {
                uploadBtn.textContent = \`上传 \${pendingCount} 个文件\`;
            } else {
                uploadBtn.textContent = '上传文件';
            }
        }
        
        async function uploadMultipleFiles(files, password) {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
            const chunkThreshold = isMobile ? 20 * 1024 * 1024 : 50 * 1024 * 1024;
            
            // 并发上传，最多同时上传3个文件
            const concurrency = 3;
            const uploadPromises = [];
            
            for (let i = 0; i < files.length; i += concurrency) {
                const batch = files.slice(i, i + concurrency);
                const batchPromises = batch.map(async (fileObj) => {
                    try {
                        updateFileStatus(fileObj.id, 'uploading', 0);
                        const useChunkedUpload = fileObj.file.size > chunkThreshold;
                        
                        if (useChunkedUpload) {
                            await uploadFileChunked(fileObj, password);
                        } else {
                            await uploadFileNormal(fileObj, password);
                        }
                        
                        updateFileStatus(fileObj.id, 'success', 100);
                    } catch (error) {
                        console.error(\`文件 \${fileObj.file.name} 上传失败:\`, error);
                        updateFileStatus(fileObj.id, 'error', 0, error.message);
                    }
                });
                
                uploadPromises.push(...batchPromises);
                
                // 等待当前批次完成再开始下一批次
                await Promise.all(batchPromises);
                updateUploadButtonText();
            }
            
            await Promise.all(uploadPromises);
            
            // 显示上传结果汇总
            const successFiles = selectedFiles.filter(f => f.status === 'success');
            const errorCount = selectedFiles.filter(f => f.status === 'error').length;
            
            if (errorCount === 0) {
                // 所有文件上传成功，显示汇总链接
                const linksHtml = successFiles.map(f => 
                    \`<div style="margin: 5px 0; padding: 8px; background: rgba(76, 175, 80, 0.1); border-radius: 6px;">
                        <div style="font-weight: 600; color: #4caf50; margin-bottom: 3px;">\${f.file.name}</div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <input type="text" value="\${f.downloadUrl}" readonly style="flex: 1; padding: 3px 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 11px;">
                            <button onclick="copyFileLink('\${f.downloadUrl}', '\${f.file.name}')" style="background: #4caf50; color: white; border: none; border-radius: 4px; padding: 3px 6px; font-size: 10px; cursor: pointer;">复制</button>
                        </div>
                    </div>\`
                ).join('');
                
                showResult(\`
                    <div style="text-align: left;">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <strong style="color: #4caf50;">🎉 所有文件上传成功！共 \${successFiles.length} 个文件</strong>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <button onclick="copyAllLinks()" style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; border: none; border-radius: 8px; padding: 10px 20px; cursor: pointer; font-weight: 600;">📋 复制所有链接</button>
                        </div>
                        <div style="max-height: 200px; overflow-y: auto;">
                            \${linksHtml}
                        </div>
                    </div>
                \`, 'success');
            } else {
                showResult(\`上传完成：\${successFiles.length} 个成功，\${errorCount} 个失败\`, errorCount > successFiles.length ? 'error' : 'success');
            }
        }
        
        function updateFileStatus(fileId, status, progress = 0, error = null) {
            const fileObj = selectedFiles.find(f => f.id === fileId);
            if (!fileObj) return;
            
            fileObj.status = status;
            fileObj.progress = progress;
            fileObj.error = error;
            
            const fileElement = document.getElementById(\`file-\${fileId}\`);
            if (!fileElement) return;
            
            // 更新样式
            fileElement.className = \`file-item \${status}\`;
            
            // 更新状态文本
            const statusElement = fileElement.querySelector('.file-status');
            const progressElement = fileElement.querySelector('.file-progress');
            const progressFill = fileElement.querySelector('.file-progress-fill');
            
            switch (status) {
                case 'uploading':
                    statusElement.textContent = \`上传中... \${progress}%\`;
                    progressElement.style.display = 'block';
                    progressFill.style.width = progress + '%';
                    break;
                case 'success':
                    statusElement.innerHTML = \`
                        <div style="color: #4caf50; font-weight: 600; margin-bottom: 8px;">✅ 上传成功</div>
                        <div style="background: rgba(102, 126, 234, 0.1); padding: 8px; border-radius: 8px; margin-top: 5px;">
                            <div style="font-size: 11px; color: #666; margin-bottom: 3px;">下载链接：</div>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <input type="text" value="\${fileObj.downloadUrl}" readonly style="flex: 1; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 11px; background: white;">
                                <button onclick="copyFileLink('\${fileObj.downloadUrl}', '\${fileObj.file.name}')" style="background: #4caf50; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 10px; cursor: pointer; white-space: nowrap;">复制</button>
                                <a href="\${fileObj.downloadUrl}" target="_blank" style="background: #2196f3; color: white; text-decoration: none; border-radius: 4px; padding: 4px 8px; font-size: 10px; white-space: nowrap;">打开</a>
                            </div>
                        </div>
                    \`;
                    progressElement.style.display = 'none';
                    break;
                case 'error':
                    statusElement.textContent = \`上传失败: \${error || '未知错误'}\`;
                    progressElement.style.display = 'none';
                    break;
                default:
                    statusElement.textContent = '等待上传';
                    progressElement.style.display = 'none';
            }
        }

        // 普通上传
        async function uploadFileNormal(fileObj, password) {
            const formData = new FormData();
            formData.append('file', fileObj.file);
            
            const headers = {};
            
            if (isAdminMode) {
                // 管理员模式，使用token认证
                const token = authManager.checkLocalAuth();
                if (token) {
                    headers['X-Auth-Token'] = token;
                } else {
                    throw new Error('管理员认证已过期，请重新登录');
                }
            } else {
                // 游客模式，使用密码认证
                formData.append('password', password);
            }

            const response = await fetch('/upload', {
                method: 'POST',
                headers: headers,
                body: formData
            });

            updateFileStatus(fileObj.id, 'uploading', 100);

            const data = await response.json();
            
            if (response.ok && data.success) {
                fileObj.downloadUrl = data.downloadUrl;
                updateFileStatus(fileObj.id, 'success', 100);
            } else {
                throw new Error(data.error || '上传失败');
            }
        }

        // 分块上传
        async function uploadFileChunked(fileObj, password) {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            const requestBody = {
                fileName: fileObj.file.name,
                fileSize: fileObj.file.size
            };
            
            if (isAdminMode) {
                // 管理员模式，使用token认证
                const token = authManager.checkLocalAuth();
                if (token) {
                    headers['X-Auth-Token'] = token;
                } else {
                    throw new Error('管理员认证已过期，请重新登录');
                }
            } else {
                // 游客模式，使用密码认证
                requestBody.password = password;
            }
            
            // 开始分块上传会话
            const startResponse = await fetch('/chunked-upload/start', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });

            const startData = await startResponse.json();
            
            if (!startResponse.ok) {
                throw new Error(startData.error || '启动上传失败');
            }

            const { sessionId, chunkSize } = startData;
            const totalChunks = Math.ceil(fileObj.file.size / chunkSize);

            // 逐个上传文件块
            let uploadedBytes = 0;
            
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const start = chunkIndex * chunkSize;
                const end = Math.min(start + chunkSize, fileObj.file.size);
                const chunk = fileObj.file.slice(start, end);

                const chunkResponse = await fetch(\`/chunked-upload/chunk/\${sessionId}\`, {
                    method: 'PUT',
                    headers: {
                        'Content-Range': \`bytes \${start}-\${end - 1}/\${fileObj.file.size}\`
                    },
                    body: chunk
                });

                const chunkData = await chunkResponse.json();
                
                if (!chunkResponse.ok) {
                    throw new Error(chunkData.error || '分块上传失败');
                }

                uploadedBytes = chunkData.bytesUploaded || end;
                const progress = Math.round((uploadedBytes / fileObj.file.size) * 100);
                
                updateFileStatus(fileObj.id, 'uploading', progress);

                if (chunkData.completed) {
                    // 上传完成
                    fileObj.downloadUrl = chunkData.downloadUrl;
                    updateFileStatus(fileObj.id, 'success', 100);
                    return;
                }
            }
        }

        function showResult(message, type) {
            result.innerHTML = message;
            result.className = \`result \${type}\`;
            result.style.display = 'block';
        }

        function copyToClipboard() {
            if (window.currentDownloadUrl) {
                navigator.clipboard.writeText(window.currentDownloadUrl).then(() => {
                    alert('链接已复制到剪贴板！');
                }).catch(() => {
                    const textArea = document.createElement('textarea');
                    textArea.value = window.currentDownloadUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('链接已复制到剪贴板！');
                });
            }
        }
        
        function copyFileLink(url, fileName) {
            navigator.clipboard.writeText(url).then(() => {
                showToast(\`📋 已复制 "\${fileName}" 的下载链接\`);
            }).catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showToast(\`📋 已复制 "\${fileName}" 的下载链接\`);
            });
        }
        
        function copyAllLinks() {
            const successFiles = selectedFiles.filter(f => f.status === 'success');
            const links = successFiles.map(f => \`\${f.file.name}: \${f.downloadUrl}\`).join('\\n');
            
            navigator.clipboard.writeText(links).then(() => {
                showToast(\`📋 已复制 \${successFiles.length} 个文件的下载链接\`);
            }).catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = links;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showToast(\`📋 已复制 \${successFiles.length} 个文件的下载链接\`);
            });
        }
        
        function showToast(message) {
            // 创建toast提示
            const toast = document.createElement('div');
            toast.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(76, 175, 80, 0.9);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 10000;
                font-weight: 600;
                backdrop-filter: blur(10px);
                animation: slideInRight 0.3s ease-out;
            \`;
            toast.textContent = message;
            
            // 添加到页面
            document.body.appendChild(toast);
            
            // 3秒后自动移除
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (toast.parentNode) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        }

        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                uploadBtn.click();
            }
        });
    </script>
</body>
</html>`;
}