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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 500px;
        }
        
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 28px;
        }
        
        .upload-area {
            border: 2px dashed #ccc;
            border-radius: 10px;
            padding: 40px 20px;
            text-align: center;
            margin-bottom: 20px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .upload-area:hover, .upload-area.dragover {
            border-color: #667eea;
            background-color: #f8f9ff;
        }
        
        .upload-icon {
            font-size: 48px;
            color: #ccc;
            margin-bottom: 15px;
        }
        
        .upload-text {
            color: #666;
            font-size: 16px;
            margin-bottom: 10px;
        }
        
        .file-input {
            display: none;
        }
        
        .password-input {
            width: 100%;
            padding: 15px;
            border: 2px solid #eee;
            border-radius: 10px;
            font-size: 16px;
            margin-bottom: 20px;
            transition: border-color 0.3s ease;
        }
        
        .password-input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .upload-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .upload-btn:hover {
            transform: translateY(-2px);
        }
        
        .upload-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .progress-bar {
            width: 100%;
            height: 6px;
            background-color: #eee;
            border-radius: 3px;
            margin: 20px 0;
            overflow: hidden;
            display: none;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s ease;
        }
        
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            display: none;
        }
        
        .result.success {
            background-color: #e7f5e7;
            border: 1px solid #4caf50;
            color: #2e7d32;
        }
        
        .result.error {
            background-color: #ffeaea;
            border: 1px solid #f44336;
            color: #c62828;
        }
        
        .download-link {
            word-break: break-all;
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
            font-family: monospace;
        }
        
        .copy-btn {
            margin-top: 10px;
            padding: 8px 16px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .copy-btn:hover {
            background: #45a049;
        }
        
        .selected-file {
            background: #e3f2fd;
            border: 2px solid #2196f3;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            display: none;
        }
        
        .file-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .file-icon {
            font-size: 24px;
            color: #2196f3;
        }
        
        .file-details {
            flex: 1;
        }
        
        .file-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
        }
        
        .file-size {
            color: #666;
            font-size: 14px;
        }

        .admin-link {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }

        .admin-link a {
            color: #667eea;
            text-decoration: none;
            font-size: 14px;
        }

        .admin-link a:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 20px;
                margin: 10px;
            }
            
            h1 {
                font-size: 24px;
            }
            
            .upload-area {
                padding: 30px 15px;
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
            <div style="font-size: 14px; color: #999;">支持多种格式文件，最大100MB</div>
        </div>
        
        <input type="file" id="fileInput" class="file-input">
        
        <div class="selected-file" id="selectedFile">
            <div class="file-info">
                <div class="file-icon">📄</div>
                <div class="file-details">
                    <div class="file-name" id="fileName"></div>
                    <div class="file-size" id="fileSize"></div>
                </div>
            </div>
        </div>
        
        <input type="password" id="passwordInput" class="password-input" placeholder="请输入上传密码">
        
        <button id="uploadBtn" class="upload-btn">上传文件</button>
        
        <div class="progress-bar" id="progressBar">
            <div class="progress-fill" id="progressFill"></div>
        </div>
        
        <div class="result" id="result"></div>

        <div class="admin-link">
            <a href="/admin">管理后台</a>
        </div>
    </div>

    <script>
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const passwordInput = document.getElementById('passwordInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        const result = document.getElementById('result');
        const selectedFile = document.getElementById('selectedFile');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        
        let selectedFileObj = null;

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            handleFileSelect(e.target.files[0]);
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
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });

        function handleFileSelect(file) {
            if (!file) return;
            
            selectedFileObj = file;
            
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            selectedFile.style.display = 'block';
            
            uploadArea.innerHTML = \`
                <div class="upload-icon">✅</div>
                <div class="upload-text">已选择文件: \${file.name}</div>
                <div style="font-size: 14px; color: #999;">点击重新选择</div>
            \`;
            
            result.style.display = 'none';
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        uploadBtn.addEventListener('click', async () => {
            if (!selectedFileObj) {
                showResult('请先选择文件', 'error');
                return;
            }

            const password = passwordInput.value.trim();
            if (!password) {
                showResult('请输入上传密码', 'error');
                return;
            }

            uploadBtn.disabled = true;
            uploadBtn.textContent = '上传中...';
            progressBar.style.display = 'block';
            result.style.display = 'none';

            try {
                const formData = new FormData();
                formData.append('file', selectedFileObj);
                formData.append('password', password);

                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                progressFill.style.width = '100%';

                const data = await response.json();
                
                if (response.ok && data.success) {
                    showResult(\`
                        <strong>上传成功！</strong><br>
                        文件名: \${data.fileName}<br>
                        文件大小: \${formatFileSize(data.fileSize)}<br>
                        <div class="download-link" id="downloadLink">\${data.downloadUrl}</div>
                        <button class="copy-btn" onclick="copyToClipboard()">复制链接</button>
                    \`, 'success');
                    
                    window.currentDownloadUrl = data.downloadUrl;
                } else {
                    showResult(data.error || '上传失败', 'error');
                }
            } catch (error) {
                console.error('上传错误:', error);
                showResult('网络错误，请重试', 'error');
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.textContent = '上传文件';
                progressBar.style.display = 'none';
                progressFill.style.width = '0%';
            }
        });

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

        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                uploadBtn.click();
            }
        });
    </script>
</body>
</html>`;
}