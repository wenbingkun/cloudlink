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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .header {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            color: #333;
            font-size: 24px;
        }
        
        .back-btn {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        
        .back-btn:hover {
            background: #5a6fd8;
        }
        
        .auth-form {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 400px;
            margin: 50px auto;
        }
        
        .auth-input {
            width: 100%;
            padding: 15px;
            border: 2px solid #eee;
            border-radius: 5px;
            font-size: 16px;
            margin-bottom: 15px;
        }
        
        .auth-btn {
            width: 100%;
            padding: 15px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
        }
        
        .file-list {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .file-item {
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .file-item:last-child {
            border-bottom: none;
        }
        
        .file-info {
            flex: 1;
        }
        
        .file-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
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
            padding: 8px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
        }
        
        .download-btn {
            background: #4caf50;
            color: white;
        }
        
        .delete-btn {
            background: #f44336;
            color: white;
        }
        
        .copy-btn {
            background: #2196f3;
            color: white;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .stats {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #666;
            font-size: 14px;
        }

        .pagination {
            padding: 20px;
            text-align: center;
            background: #f9f9f9;
        }

        .pagination button {
            padding: 8px 16px;
            margin: 0 5px;
            border: 1px solid #ddd;
            background: white;
            cursor: pointer;
            border-radius: 4px;
        }

        .pagination button:hover {
            background: #f0f0f0;
        }

        .pagination button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
            .file-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
            .file-actions {
                width: 100%;
                justify-content: flex-end;
            }
            
            .header {
                flex-direction: column;
                gap: 15px;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div id="authSection" class="auth-form">
        <h2 style="text-align: center; margin-bottom: 20px;">管理员登录</h2>
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
                        <div class="file-name">\${file.name}</div>
                        <div class="file-meta">
                            \${formatFileSize(file.size)} • 
                            \${formatDate(file.createdTime)}
                        </div>
                    </div>
                    <div class="file-actions">
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
        
        document.getElementById('adminPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                authenticate();
            }
        });
    </script>
</body>
</html>`;
}