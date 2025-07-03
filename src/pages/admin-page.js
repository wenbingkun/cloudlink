export function getAdminPageHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理后台 - CloudLink</title>
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
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
            pointer-events: none;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 30px;
            border-radius: 25px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2);
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 1;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .header h1 {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        
        .back-btn {
            padding: 15px 25px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 15px;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        .back-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.6s ease;
        }
        
        .back-btn:hover::before {
            left: 100%;
        }
        
        .back-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
        }
        
        .auth-form {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 50px;
            border-radius: 25px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2);
            max-width: 450px;
            margin: 80px auto;
            position: relative;
            z-index: 1;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .auth-input {
            width: 100%;
            padding: 18px 24px;
            border: 2px solid rgba(226, 232, 240, 0.8);
            border-radius: 15px;
            font-size: 16px;
            margin-bottom: 20px;
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        
        .auth-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            background: rgba(255, 255, 255, 0.95);
            transform: translateY(-1px);
        }
        
        .auth-btn {
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
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        .auth-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.6s ease;
        }
        
        .auth-btn:hover::before {
            left: 100%;
        }
        
        .auth-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
        }
        
        .file-list {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 25px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2);
            overflow: hidden;
            position: relative;
            z-index: 1;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .file-item {
            padding: 20px 25px;
            border-bottom: 1px solid rgba(226, 232, 240, 0.5);
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .file-item:hover {
            background: rgba(102, 126, 234, 0.03);
            transform: translateX(5px);
        }
        
        .file-item:last-child {
            border-bottom: none;
        }
        
        .file-info {
            flex: 1;
        }
        
        .file-name {
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: color 0.3s ease;
        }
        
        .file-name:hover {
            color: #667eea;
        }
        
        .file-meta {
            font-size: 14px;
            color: #666;
        }
        
        .file-actions {
            display: flex;
            gap: 10px;
        }
        
        .action-btn {
            padding: 10px 18px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
        }
        
        .action-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s ease;
        }
        
        .action-btn:hover::before {
            left: 100%;
        }
        
        .action-btn:hover {
            transform: translateY(-2px);
        }
        
        .download-btn {
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }
        
        .download-btn:hover {
            box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
        }
        
        .delete-btn {
            background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
        }
        
        .delete-btn:hover {
            box-shadow: 0 8px 25px rgba(244, 67, 54, 0.4);
        }
        
        .copy-btn {
            background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
        }
        
        .copy-btn:hover {
            box-shadow: 0 8px 25px rgba(33, 150, 243, 0.4);
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .stats {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 30px;
            border-radius: 25px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2);
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 30px;
            position: relative;
            z-index: 1;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .stat-item {
            text-align: center;
            padding: 20px;
            border-radius: 20px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
            transition: all 0.3s ease;
        }
        
        .stat-item:hover {
            transform: translateY(-3px);
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
        }
        
        .stat-number {
            font-size: 40px;
            font-weight: 800;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
            line-height: 1;
        }
        
        .stat-label {
            color: #4a5568;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .pagination {
            padding: 25px 30px;
            text-align: center;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
            border-top: 1px solid rgba(226, 232, 240, 0.5);
        }

        .pagination button {
            padding: 12px 20px;
            margin: 0 8px;
            border: 2px solid rgba(102, 126, 234, 0.2);
            background: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            border-radius: 12px;
            font-weight: 600;
            transition: all 0.3s ease;
            color: #667eea;
        }

        .pagination button:hover:not(:disabled) {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .pagination button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none;
        }
        
        .preview-btn {
            background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
        }
        
        .preview-btn:hover {
            box-shadow: 0 8px 25px rgba(255, 152, 0, 0.4);
        }
        
        /* 预览模态框 */
        .preview-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: modalFadeIn 0.3s ease-out;
        }
        
        @keyframes modalFadeIn {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        .preview-content {
            max-width: 90vw;
            max-height: 90vh;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 30px;
            position: relative;
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid rgba(226, 232, 240, 0.3);
        }
        
        .preview-title {
            font-size: 20px;
            font-weight: 700;
            color: #2d3748;
            margin: 0;
        }
        
        .close-btn {
            background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
        }
        
        .close-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 25px rgba(244, 67, 54, 0.4);
        }
        
        .preview-body {
            max-height: 70vh;
            overflow: auto;
            text-align: center;
        }
        
        .preview-image {
            max-width: 100%;
            max-height: 100%;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .preview-text {
            text-align: left;
            font-family: 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', monospace;
            font-size: 14px;
            line-height: 1.6;
            background: rgba(248, 250, 252, 0.8);
            padding: 20px;
            border-radius: 15px;
            max-height: 60vh;
            overflow: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .preview-video {
            max-width: 100%;
            max-height: 70vh;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .preview-audio {
            width: 100%;
            margin: 20px 0;
        }
        
        .preview-pdf {
            width: 100%;
            height: 70vh;
            border: none;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .preview-unsupported {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .preview-unsupported h3 {
            margin-bottom: 15px;
            color: #4a5568;
        }
        
        .file-icon-large {
            font-size: 64px;
            margin-bottom: 20px;
            opacity: 0.7;
        }
        
        @media (max-width: 768px) {
            .file-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 15px;
            }
            
            .file-actions {
                width: 100%;
                justify-content: flex-end;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .header {
                flex-direction: column;
                gap: 20px;
                text-align: center;
            }
            
            .stats {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .preview-content {
                max-width: 95vw;
                max-height: 95vh;
                padding: 20px;
            }
            
            .action-btn {
                font-size: 12px;
                padding: 8px 12px;
            }
        }
    </style>
</head>
<body>
    <div id="authSection" class="auth-form">
        <h2 style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 28px; font-weight: 700;">🔐 管理员登录</h2>
        <input type="password" id="adminPassword" class="auth-input" placeholder="请输入管理密码">
        <button onclick="authenticate()" class="auth-btn">登录</button>
    </div>
    
    <div id="adminSection" style="display: none;">
        <div class="header">
            <h1>📁 CloudLink 管理后台</h1>
            <a href="/" class="back-btn">返回上传页面</a>
        </div>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number" id="totalFiles">-</div>
                <div class="stat-label">总文件数</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="totalSize">-</div>
                <div class="stat-label">总大小</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="currentPage">1</div>
                <div class="stat-label">当前页码</div>
            </div>
        </div>
        
        <div class="file-list">
            <div id="loadingIndicator" class="loading">
                正在加载文件列表...
            </div>
            <div id="fileListContent"></div>
            <div id="paginationSection" class="pagination" style="display: none;">
                <button id="prevBtn" onclick="loadPrevPage()">上一页</button>
                <span id="pageInfo"></span>
                <button id="nextBtn" onclick="loadNextPage()">下一页</button>
            </div>
        </div>
    </div>
    
    <!-- 预览模态框 -->
    <div id="previewModal" class="preview-modal">
        <div class="preview-content">
            <div class="preview-header">
                <h3 class="preview-title" id="previewTitle">文件预览</h3>
                <button class="close-btn" onclick="closePreview()">&times;</button>
            </div>
            <div class="preview-body" id="previewBody">
                <!-- 预览内容将在这里动态加载 -->
            </div>
        </div>
    </div>

    <script>
        let currentPassword = '';
        let currentPageToken = null;
        let nextPageToken = null;
        
        async function authenticate() {
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
                    currentPassword = password;
                    document.getElementById('authSection').style.display = 'none';
                    document.getElementById('adminSection').style.display = 'block';
                    loadFileList();
                } else {
                    alert('密码错误');
                }
            } catch (error) {
                alert('认证失败');
            }
        }
        
        async function loadFileList(pageToken = null) {
            try {
                const params = new URLSearchParams({
                    password: currentPassword,
                    pageSize: '20'
                });
                
                if (pageToken) {
                    params.append('pageToken', pageToken);
                }
                
                const response = await fetch(\`/admin/files?\${params}\`);
                const data = await response.json();
                
                if (response.ok) {
                    displayFiles(data.files);
                    updatePagination(data.nextPageToken);
                    updateStats(data);
                    document.getElementById('currentPage').textContent = currentPageToken ? '2+' : '1';
                } else {
                    throw new Error(data.error || '加载失败');
                }
            } catch (error) {
                document.getElementById('fileListContent').innerHTML = 
                    '<div class="loading">加载失败：' + error.message + '</div>';
            }
        }

        function loadNextPage() {
            if (nextPageToken) {
                currentPageToken = nextPageToken;
                loadFileList(nextPageToken);
            }
        }

        function loadPrevPage() {
            currentPageToken = null;
            loadFileList();
        }

        function updatePagination(nextToken) {
            nextPageToken = nextToken;
            const paginationSection = document.getElementById('paginationSection');
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            
            if (nextToken || currentPageToken) {
                paginationSection.style.display = 'block';
                prevBtn.disabled = !currentPageToken;
                nextBtn.disabled = !nextToken;
            } else {
                paginationSection.style.display = 'none';
            }
        }
        
        function displayFiles(files) {
            const container = document.getElementById('fileListContent');
            document.getElementById('loadingIndicator').style.display = 'none';
            
            if (files.length === 0) {
                container.innerHTML = '<div class="loading">暂无文件</div>';
                return;
            }
            
            container.innerHTML = files.map(file => \`
                <div class="file-item">
                    <div class="file-info">
                        <div class="file-name" onclick="previewFile('\${file.id}', '\${file.name}', '\${file.mimeType}', '\${file.downloadUrl}')">\${getFileIcon(file.mimeType)} \${file.name}</div>
                        <div class="file-meta">
                            \${formatFileSize(file.size)} • 
                            \${formatDate(file.createdTime)} • 
                            \${getFileTypeLabel(file.mimeType)}
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="action-btn preview-btn" onclick="previewFile('\${file.id}', '\${file.name}', '\${file.mimeType}', '\${file.downloadUrl}')">
                            预览
                        </button>
                        <button class="action-btn copy-btn" onclick="copyDownloadLink('\${file.downloadUrl}', '\${file.name}')">
                            复制链接
                        </button>
                        <a href="\${file.downloadUrl}" class="action-btn download-btn" target="_blank">
                            下载
                        </a>
                        <button class="action-btn delete-btn" onclick="deleteFile('\${file.id}', '\${file.name}')">
                            删除
                        </button>
                    </div>
                </div>
            \`).join('');
        }
        
        function updateStats(data) {
            document.getElementById('totalFiles').textContent = data.files.length;
            const totalSize = data.files.reduce((sum, file) => sum + (file.size || 0), 0);
            document.getElementById('totalSize').textContent = formatFileSize(totalSize);
        }
        
        function formatFileSize(bytes) {
            if (!bytes || bytes === 0) return '0 B';
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
        
        function getFileTypeLabel(mimeType) {
            if (!mimeType) return '未知类型';
            
            if (mimeType.startsWith('image/')) return '图片';
            if (mimeType.startsWith('video/')) return '视频';
            if (mimeType.startsWith('audio/')) return '音频';
            if (mimeType.includes('pdf')) return 'PDF';
            if (mimeType.includes('document') || mimeType.includes('word')) return '文档';
            if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '表格';
            if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '演示文稿';
            if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '压缩包';
            if (mimeType.includes('text/')) return '文本';
            
            return mimeType.split('/')[0] || '未知';
        }
        
        async function copyDownloadLink(downloadUrl, fileName) {
            try {
                await navigator.clipboard.writeText(downloadUrl);
                alert(\`已复制 "\${fileName}" 的下载链接\`);
            } catch {
                const textArea = document.createElement('textarea');
                textArea.value = downloadUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert(\`已复制 "\${fileName}" 的下载链接\`);
            }
        }
        
        async function deleteFile(fileId, fileName) {
            if (!confirm(\`确定要删除 "\${fileName}" 吗？此操作无法撤销。\`)) {
                return;
            }
            
            try {
                const response = await fetch(\`/admin/delete/\${fileId}\`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password: currentPassword })
                });
                
                if (response.ok) {
                    alert('文件删除成功');
                    loadFileList(currentPageToken);
                } else {
                    const data = await response.json();
                    alert('删除失败：' + (data.error || '未知错误'));
                }
            } catch (error) {
                alert('删除失败：网络错误');
            }
        }
        
        async function previewFile(fileId, fileName, mimeType, downloadUrl) {
            const modal = document.getElementById('previewModal');
            const title = document.getElementById('previewTitle');
            const body = document.getElementById('previewBody');
            
            title.textContent = fileName;
            body.innerHTML = '<div class="loading">正在加载预览...</div>';
            modal.style.display = 'flex';
            
            try {
                if (mimeType.startsWith('image/')) {
                    body.innerHTML = \`<img src="\${downloadUrl}" alt="\${fileName}" class="preview-image" onload="this.style.opacity=1" style="opacity:0;transition:opacity 0.3s">\`;
                } else if (mimeType.startsWith('video/')) {
                    body.innerHTML = \`
                        <video controls class="preview-video" preload="metadata">
                            <source src="\${downloadUrl}" type="\${mimeType}">
                            您的浏览器不支持视频播放。
                        </video>
                    \`;
                } else if (mimeType.startsWith('audio/')) {
                    body.innerHTML = \`
                        <div class="file-icon-large">🎵</div>
                        <h3>\${fileName}</h3>
                        <audio controls class="preview-audio" preload="metadata">
                            <source src="\${downloadUrl}" type="\${mimeType}">
                            您的浏览器不支持音频播放。
                        </audio>
                    \`;
                } else if (mimeType.includes('pdf')) {
                    body.innerHTML = \`<iframe src="\${downloadUrl}" class="preview-pdf" title="\${fileName}"></iframe>\`;
                } else if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml')) {
                    // 对于文本文件，获取内容进行预览
                    try {
                        const response = await fetch(downloadUrl);
                        const text = await response.text();
                        const truncatedText = text.length > 10000 ? text.substring(0, 10000) + '\\n\\n... (文件内容过长，已截断)' : text;
                        body.innerHTML = \`<div class="preview-text">\${escapeHtml(truncatedText)}</div>\`;
                    } catch (error) {
                        body.innerHTML = \`
                            <div class="preview-unsupported">
                                <div class="file-icon-large">📃</div>
                                <h3>文本文件预览失败</h3>
                                <p>无法加载文件内容，请下载查看。</p>
                            </div>
                        \`;
                    }
                } else {
                    // 不支持预览的文件类型
                    body.innerHTML = \`
                        <div class="preview-unsupported">
                            <div class="file-icon-large">\${getFileIcon(mimeType)}</div>
                            <h3>暂不支持预览此文件类型</h3>
                            <p>文件类型：\${getFileTypeLabel(mimeType)}</p>
                            <p>请下载文件到本地查看。</p>
                            <a href="\${downloadUrl}" class="action-btn download-btn" style="margin-top: 20px;">立即下载</a>
                        </div>
                    \`;
                }
            } catch (error) {
                body.innerHTML = \`
                    <div class="preview-unsupported">
                        <div class="file-icon-large">❌</div>
                        <h3>预览加载失败</h3>
                        <p>错误信息：\${error.message}</p>
                    </div>
                \`;
            }
        }
        
        function closePreview() {
            document.getElementById('previewModal').style.display = 'none';
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // 点击模态框背景关闭预览
        document.getElementById('previewModal').addEventListener('click', (e) => {
            if (e.target.id === 'previewModal') {
                closePreview();
            }
        });
        
        // ESC键关闭预览
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closePreview();
            }
        });
        
        document.getElementById('adminPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                authenticate();
            }
        });
    </script>
</body>
</html>`;
}