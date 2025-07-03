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
        
        .selected-file {
            background: linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 150, 243, 0.04) 100%);
            border: 2px solid rgba(33, 150, 243, 0.3);
            padding: 20px;
            border-radius: 20px;
            margin-bottom: 25px;
            display: none;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        
        .selected-file:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(33, 150, 243, 0.15);
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
        
        @media (max-width: 768px) {
            body {
                padding: 15px;
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
            
            .container {
                padding: 25px 20px;
                border-radius: 18px;
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
            <div style="font-size: 14px; color: #999; margin-top: 5px;">支持多种格式文件，最大2GB<br><span style="font-size: 12px; opacity: 0.8;">大文件自动分块上传，移动端20MB+，桌面端50MB+</span></div>
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
                // 智能判断是否使用分块上传（移动端 20MB，桌面端 50MB）
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
            const chunkThreshold = isMobile ? 20 * 1024 * 1024 : 50 * 1024 * 1024;
                const useChunkedUpload = selectedFileObj.size > chunkThreshold;

                if (useChunkedUpload) {
                    await uploadFileChunked(selectedFileObj, password);
                } else {
                    await uploadFileNormal(selectedFileObj, password);
                }
            } catch (error) {
                console.error('上传错误:', error);
                showResult('网络错误：' + error.message, 'error');
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.textContent = '上传文件';
                progressBar.style.display = 'none';
                progressFill.style.width = '0%';
            }
        });

        // 普通上传
        async function uploadFileNormal(file, password) {
            const formData = new FormData();
            formData.append('file', file);
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
        }

        // 分块上传
        async function uploadFileChunked(file, password) {
            // 开始分块上传会话
            const startResponse = await fetch('/chunked-upload/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileSize: file.size,
                    password: password
                })
            });

            const startData = await startResponse.json();
            
            if (!startResponse.ok) {
                showResult(startData.error || '启动上传失败', 'error');
                return;
            }

            const { sessionId, chunkSize } = startData;
            const totalChunks = Math.ceil(file.size / chunkSize);
            
            uploadBtn.textContent = \`上传中... (0/\${totalChunks})\`;

            // 逐个上传文件块
            let uploadedBytes = 0;
            
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const start = chunkIndex * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);

                const chunkResponse = await fetch(\`/chunked-upload/chunk/\${sessionId}\`, {
                    method: 'PUT',
                    headers: {
                        'Content-Range': \`bytes \${start}-\${end - 1}/\${file.size}\`
                    },
                    body: chunk
                });

                const chunkData = await chunkResponse.json();
                
                if (!chunkResponse.ok) {
                    showResult(chunkData.error || '分块上传失败', 'error');
                    return;
                }

                uploadedBytes = chunkData.bytesUploaded || end;
                const progress = Math.round((uploadedBytes / file.size) * 100);
                
                progressFill.style.width = progress + '%';
                uploadBtn.textContent = \`上传中... (\${chunkIndex + 1}/\${totalChunks}) \${progress}%\`;

                if (chunkData.completed) {
                    // 上传完成
                    showResult(\`
                        <strong>上传成功！</strong><br>
                        文件名: \${chunkData.fileName}<br>
                        文件大小: \${formatFileSize(chunkData.fileSize)}<br>
                        <div class="download-link" id="downloadLink">\${chunkData.downloadUrl}</div>
                        <button class="copy-btn" onclick="copyToClipboard()">复制链接</button>
                    \`, 'success');
                    
                    window.currentDownloadUrl = chunkData.downloadUrl;
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

        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                uploadBtn.click();
            }
        });
    </script>
</body>
</html>`;
}