// =================================================================================
// CloudLink Client-Side Application
// =================================================================================

// --- Global State ---
let authManager = null;
let fileQueue = [];
let isUploading = false;
let uploadPassword = null; // Cache upload password for the session
let nextPageToken = null; // For admin file pagination
let allFiles = []; // For admin file list
let filteredFiles = [];
let selectedFiles = new Set();

// --- Constants ---
const CHUNK_UPLOAD_THRESHOLD = 50 * 1024 * 1024; // 50MB
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB - 保守策略防止HTTP 500
const MAX_CONCURRENT_UPLOADS = 2; // 最大并发上传数
const MAX_RETRIES = 3; // 最大重试次数
const RETRY_DELAY_BASE = 1000; // 重试基础延迟（毫秒）

// =================================================================================
// Initialization
// =================================================================================

document.addEventListener('DOMContentLoaded', function() {
    initAuthManager();
    initEventListeners();
    checkAuthStatus();
    switchToUpload();
});

function initAuthManager() {
    authManager = {
        tokenKey: 'cloudlink_auth_token',
        tokenExpiry: 'cloudlink_token_expiry',
        sessionDuration: 24 * 60 * 60 * 1000, // 24 hours

        // Client-side now directly uses the token from the server
        saveAuth: function(token) {
            const expiry = Date.now() + this.sessionDuration;
            localStorage.setItem(this.tokenKey, token);
            localStorage.setItem(this.tokenExpiry, expiry.toString());
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

function initEventListeners() {
    // Tab Switching
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Upload Area
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadArea) {
        if (fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
        }
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Upload Controls
    const uploadBtn = document.getElementById('uploadBtn');
    const clearBtn = document.getElementById('clearBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', startUpload);
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', clearQueue);
    }

    // Admin Controls
    const searchInput = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshBtn');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadFiles(true));
    }
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => loadFiles(false));
    }
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', selectAll);
    }
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', deselectAll);
    }
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', deleteSelected);
    }

    // Modals
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', hidePasswordModal);
    }
    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener('click', confirmPassword);
    }
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', hideConfirmModal);
    }
    if (confirmOkBtn) {
        confirmOkBtn.addEventListener('click', confirmAction);
    }
}

function checkAuthStatus() {
    if (authManager.isAuthenticated()) {
        showToast('已自动登录', 'success');
    }
}

// =================================================================================
// UI & Page Logic
// =================================================================================

function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));

    if (tabName === 'upload') {
        switchToUpload();
    } else if (tabName === 'admin') {
        switchToAdmin();
    }
}

function switchToUpload() {
    document.getElementById('upload-section').classList.add('active');
}

function switchToAdmin() {
    if (authManager.isAuthenticated()) {
        document.getElementById('admin-section').classList.add('active');
        loadFiles(true); // Reset and load files
    } else {
        document.getElementById('login-section').classList.add('active');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const adminPasswordInput = document.getElementById('adminPassword');
    if (!adminPasswordInput) return;
    const password = adminPasswordInput.value;
    try {
        const response = await fetch('/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        if (!response.ok) throw new Error((await response.json()).error || '登录失败');
        const data = await response.json();
        authManager.saveAuth(data.token); // Save the token received from the server
        showToast('🎉 登录成功', 'success');
        switchToAdmin();
    } catch (error) {
        showToast(`🔐 ${error.message}`, 'error');
    }
}

// =================================================================================
// File Handling & Upload Logic
// =================================================================================

function handleFileSelect(e) {
    addFilesToQueue(Array.from(e.target.files));
    e.target.value = ''; // Reset input
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    addFilesToQueue(Array.from(e.dataTransfer.files));
}

function addFilesToQueue(files) {
    files.forEach(file => {
        const fileId = Date.now() + Math.random();
        fileQueue.push({
            id: fileId,
            file: file,
            name: file.name,
            size: file.size,
            status: 'pending', // pending, uploading, paused, success, error
            progress: 0,
            uploadedBytes: 0,
            isPaused: false,
            error: null,
            startTime: null,
            endTime: null,
            peakSpeed: 0,
            avgSpeed: 0,
        });
    });
    renderFileQueue();
    updateUploadButton();
}

async function startUpload() {
    const pendingFiles = fileQueue.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    // 认证检查：已登录管理员可直接上传，未登录需要上传密码
    if (!authManager.isAuthenticated() && !uploadPassword) {
        try {
            uploadPassword = await showPasswordModal();
        } catch {
            showToast('上传已取消', 'info');
            return;
        }
    }
    
    isUploading = true;
    updateUploadButton();
    const uploadSessionStartTime = Date.now();

    // 控制并发上传数量防止HTTP 500错误
    const uploadPromises = [];
    for (let i = 0; i < pendingFiles.length; i += MAX_CONCURRENT_UPLOADS) {
        const batch = pendingFiles.slice(i, i + MAX_CONCURRENT_UPLOADS);
        const batchPromises = batch.map(fileObj => uploadFile(fileObj));
        await Promise.all(batchPromises);
    }

    isUploading = false;
    updateUploadButton();

    const totalTime = Date.now() - uploadSessionStartTime;
    const successCount = fileQueue.filter(f => f.status === 'success').length;
    const errorCount = fileQueue.filter(f => f.status === 'error').length;

    if (successCount > 0) {
        showToast(`上传完成！${successCount}个文件成功，总用时 ${formatTime(totalTime / 1000)}`, 'success');
    }
    if (errorCount > 0) {
        showToast(`${errorCount}个文件上传失败，请检查队列`, 'error');
    }
}

async function uploadFile(fileObj) {
    fileObj.status = 'uploading';
    fileObj.isPaused = false;
    fileObj.startTime = Date.now();
    renderFileQueue();

    try {
        if (fileObj.file.size < CHUNK_UPLOAD_THRESHOLD) {
            await uploadSmallFile(fileObj);
        } else {
            await uploadLargeFile(fileObj);
        }
        fileObj.status = 'success';
        fileObj.endTime = Date.now();
        
        // 计算统计信息
        const totalTime = (fileObj.endTime - fileObj.startTime) / 1000; // 秒
        fileObj.avgSpeed = totalTime > 0 ? fileObj.size / totalTime : 0;
    } catch (error) {
        // Don't set to error if it was a user-initiated pause
        if (!fileObj.isPaused) {
            fileObj.status = 'error';
            fileObj.error = error.message;
        }
    } finally {
        renderFileQueue();
    }
}

async function uploadSmallFile(fileObj) {
    fileObj.startTime = Date.now(); // 初始化开始时间
    
    const formData = new FormData();
    formData.append('file', fileObj.file, fileObj.name);
    
    const headers = {};
    if (authManager.isAuthenticated()) {
        headers['Authorization'] = `Bearer ${authManager.getCurrentToken()}`;
    } else {
        formData.append('password', uploadPassword);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload');
    for (const header in headers) {
        xhr.setRequestHeader(header, headers[header]);
    }

    return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                fileObj.progress = Math.round((event.loaded / event.total) * 100);
                fileObj.uploadedBytes = event.loaded;
                const elapsed = (Date.now() - fileObj.startTime) / 1000;
                fileObj.uploadSpeed = elapsed > 0 ? event.loaded / elapsed : 0;
                
                // 记录峰值速度
                if (fileObj.uploadSpeed > fileObj.peakSpeed) {
                    fileObj.peakSpeed = fileObj.uploadSpeed;
                }
                
                renderFileQueue();
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const result = JSON.parse(xhr.responseText);
                fileObj.downloadUrl = result.downloadUrl;
                resolve();
            } else {
                const errorData = JSON.parse(xhr.responseText);
                reject(new Error(errorData.error || '上传失败'));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('网络错误或服务器无响应')));
        xhr.addEventListener('abort', () => reject(new Error('上传已取消')));

        xhr.send(formData);
    });
}

async function uploadLargeFile(fileObj) {
    
    // 1. Start session
    if (!fileObj.uploadSessionId) {
        const headers = { 'Content-Type': 'application/json' };
        const body = {
            fileName: fileObj.name,
            fileSize: fileObj.size
        };
        
        // 根据认证状态选择认证方式
        if (authManager.isAuthenticated()) {
            headers['Authorization'] = `Bearer ${authManager.getCurrentToken()}`;
        } else {
            body.password = uploadPassword;
        }
        
        const startResponse = await fetch('/chunked-upload/start', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        if (!startResponse.ok) throw new Error('无法启动分块上传会话');
        const session = await startResponse.json();
        fileObj.uploadSessionId = session.sessionId;
    }

    // 2. Upload chunks
    let start = fileObj.uploadedBytes;
    let lastProgressTime = Date.now();
    let lastUploadedBytes = fileObj.uploadedBytes;

    while (start < fileObj.size) {
        // Handle pause
        if (fileObj.isPaused) {
            fileObj.status = 'paused';
            renderFileQueue();
            // This promise will resolve when user clicks resume
            await new Promise(resolve => {
                fileObj.resumeHandler = resolve;
            });
            fileObj.status = 'uploading';
            renderFileQueue();
        }

        const end = Math.min(start + CHUNK_SIZE, fileObj.size);
        const chunk = fileObj.file.slice(start, end);

        const xhr = new XMLHttpRequest();
        xhr.open('PUT', `/chunked-upload/chunk/${fileObj.uploadSessionId}`);
        xhr.setRequestHeader('Content-Range', `bytes ${start}-${end - 1}/${fileObj.size}`);

        const chunkUploadPromise = new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const currentUploaded = start + event.loaded;
                    const currentTime = Date.now();
                    const timeDiff = (currentTime - lastProgressTime) / 1000; // in seconds
                    const bytesDiff = currentUploaded - lastUploadedBytes;

                    if (timeDiff > 0) {
                        fileObj.uploadSpeed = bytesDiff / timeDiff;
                        // 记录峰值速度
                        if (fileObj.uploadSpeed > fileObj.peakSpeed) {
                            fileObj.peakSpeed = fileObj.uploadSpeed;
                        }
                    }
                    fileObj.progress = Math.round((currentUploaded / fileObj.size) * 100);
                    fileObj.uploadedBytes = currentUploaded;
                    renderFileQueue();

                    lastProgressTime = currentTime;
                    lastUploadedBytes = currentUploaded;
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 308) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error(JSON.parse(xhr.responseText).error || `分块上传失败: HTTP ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('网络错误或服务器无响应')));
            xhr.addEventListener('abort', () => reject(new Error('上传已取消')));

            xhr.send(chunk);
        });

        let result;
        let retryCount = 0;
        
        while (retryCount <= MAX_RETRIES) {
            try {
                result = await chunkUploadPromise;
                break; // 成功则退出重试循环
            } catch (error) {
                retryCount++;
                if (retryCount > MAX_RETRIES) {
                    throw error; // 超过最大重试次数，抛出错误
                }
                
                // 指数退避延迟
                const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // 重新创建 xhr 请求
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', `/chunked-upload/chunk/${fileObj.uploadSessionId}`);
                xhr.setRequestHeader('Content-Range', `bytes ${start}-${end - 1}/${fileObj.size}`);
                
                const chunkUploadPromise = new Promise((resolve, reject) => {
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const currentUploaded = start + event.loaded;
                            const currentTime = Date.now();
                            const timeDiff = (currentTime - lastProgressTime) / 1000;
                            const bytesDiff = currentUploaded - lastUploadedBytes;

                            if (timeDiff > 0) {
                                fileObj.uploadSpeed = bytesDiff / timeDiff;
                            }
                            fileObj.progress = Math.round((currentUploaded / fileObj.size) * 100);
                            fileObj.uploadedBytes = currentUploaded;
                            renderFileQueue();

                            lastProgressTime = currentTime;
                            lastUploadedBytes = currentUploaded;
                        }
                    });

                    xhr.addEventListener('load', () => {
                        if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 308) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            reject(new Error(JSON.parse(xhr.responseText).error || `分块上传失败: HTTP ${xhr.status}`));
                        }
                    });

                    xhr.addEventListener('error', () => reject(new Error('网络错误或服务器无响应')));
                    xhr.addEventListener('abort', () => reject(new Error('上传已取消')));

                    xhr.send(chunk);
                });
            }
        }

        if (result.completed) {
            fileObj.downloadUrl = result.downloadUrl;
            return; // Exit loop
        }
        start = end;
    }
}

function togglePause(fileId) {
    const fileObj = fileQueue.find(f => f.id === fileId);
    if (!fileObj || (fileObj.status !== 'uploading' && fileObj.status !== 'paused')) return;

    fileObj.isPaused = !fileObj.isPaused;

    if (!fileObj.isPaused && fileObj.resumeHandler) {
        fileObj.resumeHandler(); // Resolve the promise to continue the loop
        fileObj.resumeHandler = null;
    }
    renderFileQueue();
}

// =================================================================================
// DOM & UI Rendering
// =================================================================================

function renderFileQueue() {
    const container = document.getElementById('fileQueue');
    if (fileQueue.length === 0) {
        container.innerHTML = '';
        updateUploadButton(); // 确保隐藏上传按钮
        return;
    }
    const fragment = document.createDocumentFragment();
    fileQueue.forEach(fileObj => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.dataset.fileId = fileObj.id;

        let statusText = '';
        switch (fileObj.status) {
            case 'pending': statusText = '等待上传'; break;
            case 'uploading': statusText = `上传中... ${fileObj.progress}%`; break;
            case 'paused': statusText = `已暂停 ${fileObj.progress}%`; break;
            case 'success': statusText = '上传成功'; break;
            case 'error': statusText = '上传失败'; break;
        }

        let actionsHtml = '';
        if (fileObj.status === 'pending') {
            actionsHtml = `<button class="btn btn-secondary" onclick="removeFromQueue(${fileObj.id})">移除</button>`;
        } else if (fileObj.status === 'uploading' || fileObj.status === 'paused') {
            const pauseText = fileObj.isPaused ? '继续' : '暂停';
            actionsHtml = `<button class="btn btn-secondary" onclick="togglePause(${fileObj.id})">${pauseText}</button>`;
        } else if (fileObj.status === 'success') {
            actionsHtml = `<button class="btn btn-secondary" onclick="copyToClipboard('${fileObj.downloadUrl}')">复制链接</button>`;
        }

        let progressHtml = '';
        if (fileObj.status === 'uploading' || fileObj.status === 'paused') {
            progressHtml = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${fileObj.progress}%;"></div>
                </div>`;
        }
        
        let successHtml = '';
        if (fileObj.status === 'success' && fileObj.downloadUrl) {
            successHtml = `
                <div class="success-info">
                    <input type="text" class="download-link-input" value="${fileObj.downloadUrl}" readonly/>
                </div>`;
        }

        let errorHtml = '';
        if (fileObj.status === 'error' && fileObj.error) {
            errorHtml = `<div class="file-error">${fileObj.error}</div>`;
        }

        item.innerHTML = `
            <div class="file-item-icon">${getFileTypeIcon(fileObj.file.type)}</div>
            <div class="file-item-info">
                <div class="file-name">${fileObj.name}</div>
                <div class="file-meta">
                    <span>${formatFileSize(fileObj.size)}</span>
                    <span>${statusText}</span>
                </div>
                ${progressHtml}
            </div>
            <div class="file-item-actions">${actionsHtml}</div>
            ${successHtml}
            ${errorHtml}
        `;
        fragment.appendChild(item);
    });
    container.innerHTML = '';
    container.appendChild(fragment);
}

function updateUploadButton() {
    const uploadControls = document.getElementById('uploadControls');
    const uploadBtn = document.getElementById('uploadBtn');
    const pendingCount = fileQueue.filter(f => f.status === 'pending').length;
    
    // 显示或隐藏上传控制按钮
    if (fileQueue.length > 0) {
        uploadControls.style.display = 'flex';
    } else {
        uploadControls.style.display = 'none';
    }
    
    // 更新按钮状态和文本
    if (uploadBtn) {
        uploadBtn.disabled = pendingCount === 0 || isUploading;
        
        if (isUploading) {
            uploadBtn.textContent = '上传中...';
        } else {
            uploadBtn.textContent = `开始上传 (${pendingCount})`;
        }
    }
}

function removeFromQueue(fileId) {
    fileQueue = fileQueue.filter(f => f.id !== fileId);
    renderFileQueue();
    updateUploadButton();
}

function clearQueue() {
    const uploadingFiles = fileQueue.filter(f => f.status === 'uploading' || f.status === 'paused');
    if (uploadingFiles.length > 0) {
        showToast('有文件正在上传，无法清空队列', 'info');
        return;
    }
    fileQueue = [];
    renderFileQueue();
    updateUploadButton();
}

function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('dragover'); }
function handleDragLeave(e) { e.currentTarget.classList.remove('dragover'); }

async function loadFiles(reset = false) {
    if (reset) {
        allFiles = [];
        filteredFiles = [];
        selectedFiles.clear();
        nextPageToken = null;
        document.getElementById('filesGrid').innerHTML = '';
    }
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = '加载中...';
    try {
        const token = authManager.getCurrentToken();
        const url = nextPageToken ? `/admin/files?pageToken=${nextPageToken}` : '/admin/files';
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('无法加载文件列表');
        const data = await response.json();
        allFiles.push(...data.files);
        nextPageToken = data.nextPageToken;
        updateFileList();
        loadMoreBtn.classList.toggle('hidden', !nextPageToken);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = '加载更多';
    }
}

function updateFileList() { handleFilter(); }
function handleSearch(e) { handleFilter(); }
function handleFilter() {
    const typeFilter = document.getElementById('typeFilter');
    const searchInput = document.getElementById('searchInput');
    
    const type = typeFilter ? typeFilter.value : '';
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    let tempFiles = allFiles;
    
    if (type) {
        tempFiles = tempFiles.filter(file => getFileType(file.mimeType) === type);
    }
    if (searchTerm) {
        tempFiles = tempFiles.filter(file => file.name.toLowerCase().includes(searchTerm));
    }
    filteredFiles = tempFiles;
    handleSort();
}
function handleSort() {
    const sortByElement = document.getElementById('sortBy');
    const sortBy = sortByElement ? sortByElement.value : 'time';
    
    filteredFiles.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'size') return b.size - a.size;
        return new Date(b.createdTime) - new Date(a.createdTime);
    });
    renderFiles();
}

function getFileTypeIcon(mimeType) {
    const type = getFileType(mimeType);
    switch (type) {
        case 'image':
            return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
        case 'video':
            return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>';
        case 'audio':
            return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
        case 'document':
            return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
        case 'archive':
            return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="1" x2="10" y2="5"></line><line x1="14" y1="1" x2="14" y2="5"></line><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"></path><path d="M4 12h16"></path><path d="M10 5h4"></path><path d="M12 5v14"></path></svg>';
        default:
            return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path></svg>';
    }
}

function renderFiles() {
    const grid = document.getElementById('filesGrid');
    const fragment = document.createDocumentFragment();

    filteredFiles.forEach(file => {
        const card = document.createElement('div');
        card.className = `file-card ${selectedFiles.has(file.id) ? 'selected' : ''}`;
        card.dataset.fileId = file.id;
        card.onclick = () => handleFileSelectToggle(file.id);

        card.innerHTML = `
            <div class="file-card-icon">${getFileTypeIcon(file.mimeType)}</div>
            <div class="file-card-name">${file.name}</div>
            <div class="file-card-info">${formatFileSize(file.size)}</div>
            <div class="file-card-actions">
                <button class="btn btn-secondary" onclick="event.stopPropagation(); copyToClipboard('${window.location.origin}/d/${file.id}')">复制</button>
                <button class="btn btn-danger" onclick="event.stopPropagation(); deleteSingleFile('${file.id}')">删除</button>
            </div>
        `;
        fragment.appendChild(card);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
}

function handleFileSelectToggle(fileId) {
    const checkbox = document.querySelector(`.file-card-checkbox[data-file-id='${fileId}']`);
    if (selectedFiles.has(fileId)) {
        selectedFiles.delete(fileId);
        if (checkbox) checkbox.checked = false;
    } else {
        selectedFiles.add(fileId);
        if (checkbox) checkbox.checked = true;
    }
    document.querySelector(`.file-card[data-file-id='${fileId}']`).classList.toggle('selected');
}

function selectAll() {
    filteredFiles.forEach(file => selectedFiles.add(file.id));
    renderFiles();
}
function deselectAll() {
    selectedFiles.clear();
    renderFiles();
}
async function deleteSelected() {
    if (selectedFiles.size === 0) return;
    const confirmed = await showConfirmModal(`确定要删除选中的 ${selectedFiles.size} 个文件吗？`);
    if (confirmed) {
        const ids = Array.from(selectedFiles);
        showToast(`正在删除 ${ids.length} 个文件...`, 'info');
        let successCount = 0;
        for (const id of ids) {
            if (await deleteFileAPI(id)) {
                successCount++;
            }
        }
        showToast(`成功删除了 ${successCount} 个文件`, 'success');
        loadFiles(true); // Refresh
    }
}
async function deleteSingleFile(fileId) {
    const confirmed = await showConfirmModal(`确定要删除这个文件吗？`);
    if (confirmed) {
        if (await deleteFileAPI(fileId)) {
            showToast('文件已删除', 'success');
            loadFiles(true); // Refresh
        }
    }
}
async function deleteFileAPI(fileId) {
    try {
        const response = await fetch(`/admin/delete/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authManager.getCurrentToken()}` }
        });
        if (!response.ok) throw new Error('删除失败');
        return true;
    } catch (error) {
        showToast(error.message, 'error');
        return false;
    }
}

// --- Helper & Utility Functions ---
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
function formatTime(seconds) {
    if (seconds < 0 || !isFinite(seconds)) return '0s';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
}
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板', 'success'), () => showToast('复制失败', 'error'));
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
            break;
        case 'error':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
            break;
        case 'info':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
            break;
    }

    toast.innerHTML = `${icon}<span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        // Animate out
        setTimeout(() => {
            toast.style.animation = 'toast-out 0.5s forwards';
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    }, 100); // Small delay to ensure animation plays
}

function showPasswordModal() {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById('passwordModal');
        const input = document.getElementById('modalPasswordInput');
        if (!modal || !input) return;
        
        input.value = '';
        
        const enterListener = (e) => {
            if (e.key === 'Enter') {
                confirmPassword();
                input.removeEventListener('keydown', enterListener);
            }
        };
        input.addEventListener('keydown', enterListener);

        modal.style.display = 'flex';
        input.focus();
        
        window.passwordModalResolve = resolve;
        window.passwordModalReject = reject;
    });
}
function hidePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'none';
    }
    if (window.passwordModalReject) {
        window.passwordModalReject();
    }
    window.passwordModalResolve = null;
    window.passwordModalReject = null;
}
function confirmPassword() {
    const modalPasswordInput = document.getElementById('modalPasswordInput');
    if (!modalPasswordInput) return;
    const password = modalPasswordInput.value;
    if (password && window.passwordModalResolve) {
        window.passwordModalResolve(password);
    } else if (!password) {
        // Maybe show a small error message on the modal itself
    }
    hidePasswordModal();
}
function showConfirmModal(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const confirmMessage = document.getElementById('confirmMessage');
        if (!modal || !confirmMessage) return;
        confirmMessage.textContent = message;
        modal.style.display = 'flex';
        window.confirmModalResolve = resolve;
    });
}
function hideConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
function confirmAction() {
    if (window.confirmModalResolve) {
        window.confirmModalResolve(true);
    }
    hideConfirmModal();
}
function getFileType(mimeType) {
    if (!mimeType) return 'other';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('x-gtar') || mimeType.includes('x-tar')) return 'archive';
    if (mimeType.startsWith('text/') || mimeType.includes('document')) return 'document';
    return 'other';
}

// =================================================================================
// Theme Switching Logic (iOS 26 Style)
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    const htmlElement = document.documentElement;

    // Function to apply the theme
    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    };

    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Event listener for the toggle button
    themeToggleButton.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Save the new theme to localStorage
        localStorage.setItem('theme', newTheme);
        
        // Apply the new theme
        applyTheme(newTheme);
    });
});
