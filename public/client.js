// =================================================================================
// CloudLink Client-Side Application
// =================================================================================

// --- Global State ---
let authManager = null;
let fileQueue = [];
let isUploading = false;
let uploadPassword = null; // Cache upload password for the session
let debugLogVisible = false;
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
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Upload Area
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Upload Controls
    document.getElementById('uploadBtn').addEventListener('click', startUpload);
    document.getElementById('clearBtn').addEventListener('click', clearQueue);
    document.getElementById('debugToggle').addEventListener('click', toggleDebugLog);

    // Admin Controls
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('typeFilter').addEventListener('change', handleFilter);
    document.getElementById('sortBy').addEventListener('change', handleSort);
    document.getElementById('refreshBtn').addEventListener('click', () => loadFiles(true));
    document.getElementById('loadMoreBtn').addEventListener('click', () => loadFiles(false));
    document.getElementById('selectAllBtn').addEventListener('click', selectAll);
    document.getElementById('deselectAllBtn').addEventListener('click', deselectAll);
    document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);

    // Modals
    document.getElementById('modalCancelBtn').addEventListener('click', hidePasswordModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', confirmPassword);
    document.getElementById('confirmCancelBtn').addEventListener('click', hideConfirmModal);
    document.getElementById('confirmOkBtn').addEventListener('click', confirmAction);
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
    const password = document.getElementById('adminPassword').value;
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
        });
    });
    renderFileQueue();
    updateUploadButton();
}

async function startUpload() {
    const pendingFiles = fileQueue.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    // If not authenticated as admin, and no upload password cached, ask for it.
    // If authenticated as admin, use that token for upload.
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

    logToPage(`开始上传 ${pendingFiles.length} 个文件...`, 'info');

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
    renderFileQueue();

    try {
        if (fileObj.file.size < CHUNK_UPLOAD_THRESHOLD) {
            await uploadSmallFile(fileObj);
        } else {
            await uploadLargeFile(fileObj);
        }
        fileObj.status = 'success';
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
    logToPage(`小文件直传: ${fileObj.name}`);
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
                fileObj.uploadSpeed = event.loaded / ((Date.now() - fileObj.startTime) / 1000); // Simple speed calc
                renderFileQueue();
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const result = JSON.parse(xhr.responseText);
                fileObj.downloadUrl = result.downloadUrl;
                logToPage(`✅ 上传成功: ${fileObj.name}`);
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
    logToPage(`大文件分块上传: ${fileObj.name}`);
    
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
            logToPage(`⏸️ 已暂停: ${fileObj.name}`, 'warn');
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
                logToPage(`分块上传失败，${delay}ms后重试 (${retryCount}/${MAX_RETRIES})...`, 'warn');
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
            logToPage(`✅ 上传成功: ${fileObj.name}`);
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
        logToPage(`▶️ 继续上传: ${fileObj.name}`, 'info');
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
    container.innerHTML = '';
    fileQueue.forEach(fileObj => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.dataset.fileId = fileObj.id;

        let statusText = '';
        let statusColor = '#333';
        switch (fileObj.status) {
            case 'pending': statusText = '待上传'; statusColor = '#6c757d'; break;
            case 'uploading': statusText = `上传中... ${fileObj.progress}%`; statusColor = '#007bff'; break;
            case 'paused': statusText = `已暂停... ${fileObj.progress}%`; statusColor = '#ffc107'; break;
            case 'success': statusText = '✅ 上传成功'; statusColor = '#28a745'; break;
            case 'error': statusText = `❌ 上传失败`; statusColor = '#dc3545'; break;
        }

        let actionsHtml = '';
        if (fileObj.status === 'pending') {
            actionsHtml = `<button class="btn btn-danger btn-sm" onclick="removeFromQueue(${fileObj.id})">移除</button>`;
        } else if (fileObj.status === 'uploading' || fileObj.status === 'paused') {
            const pauseText = fileObj.isPaused ? '继续' : '暂停';
            actionsHtml = `<button class="btn btn-secondary btn-sm" onclick="togglePause(${fileObj.id})">${pauseText}</button>`;
        }

        let errorHtml = '';
        if (fileObj.status === 'error' && fileObj.error) {
            errorHtml = `<div class="file-error">${fileObj.error}</div>`;
        }
        
        let successHtml = '';
        if (fileObj.status === 'success' && fileObj.downloadUrl) {
            successHtml = `
                <div class="success-info">
                    <input type="text" value="${fileObj.downloadUrl}" readonly/>
                    <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${fileObj.downloadUrl}')">复制</button>
                </div>`;
        }

        item.innerHTML = `
            <div class="file-info">
                <div class="file-name">${fileObj.name}</div>
                <div class="file-meta">
                    <span class="file-size">${formatFileSize(fileObj.size)}</span>
                    <span class="file-status" style="color: ${statusColor};">${statusText}</span>
                </div>
                ${fileObj.status === 'uploading' || fileObj.status === 'paused' ? `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${fileObj.progress}%;"></div>
                </div>
                <div class="upload-details">
                    <span>${formatFileSize(fileObj.uploadedBytes)} / ${formatFileSize(fileObj.size)}</span>
                    <span>${fileObj.uploadSpeed ? formatFileSize(fileObj.uploadSpeed) + '/s' : ''}</span>
                </div>
                ` : ''}
                ${errorHtml}
                ${successHtml}
            </div>
            <div class="file-actions">${actionsHtml}</div>
        `;
        container.appendChild(item);
    });
}

function updateUploadButton() {
    const uploadBtn = document.getElementById('uploadBtn');
    const pendingCount = fileQueue.filter(f => f.status === 'pending').length;
    uploadBtn.disabled = pendingCount === 0 || isUploading;
    uploadBtn.textContent = isUploading ? '上传中...' : `开始上传 (${pendingCount})`;
}

function removeFromQueue(fileId) {
    fileQueue = fileQueue.filter(f => f.id !== fileId);
    renderFileQueue();
    updateUploadButton();
}

function clearQueue() {
    fileQueue = fileQueue.filter(f => f.status === 'uploading' || f.status === 'paused');
    renderFileQueue();
    updateUploadButton();
}

// ... (Rest of the functions: admin, modals, helpers - they remain largely the same)
// ... (I will paste the rest of the unchanged code here to ensure a complete file)

function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('dragover'); }
function handleDragLeave(e) { e.currentTarget.classList.remove('dragover'); }

async function loadFiles(reset = false) {
    if (reset) {
        allFiles = [];
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
    const type = document.getElementById('typeFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
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
    const sortBy = document.getElementById('sortBy').value;
    filteredFiles.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'size') return b.size - a.size;
        return new Date(b.createdTime) - new Date(a.createdTime);
    });
    renderFiles();
}
function renderFiles() {
    const grid = document.getElementById('filesGrid');
    grid.innerHTML = ''; // Clear and re-render all filtered files
    filteredFiles.forEach(file => {
        const card = document.createElement('div');
        card.className = `file-card ${selectedFiles.has(file.id) ? 'selected' : ''}`;
        card.dataset.fileId = file.id;
        card.innerHTML = `
            <div class="file-card-header">
                <input type="checkbox" class="file-checkbox" data-file-id="${file.id}" onchange="handleFileSelectToggle('${file.id}')" ${selectedFiles.has(file.id) ? 'checked' : ''}>
                <div class="file-card-title">${file.name}</div>
            </div>
            <div class="file-card-info">
                <span>${formatFileSize(file.size)}</span>
                <span>${new Date(file.createdTime).toLocaleDateString()}</span>
            </div>
            <div class="file-card-actions">
                <button class="btn btn-secondary btn-xs" onclick="copyToClipboard('${window.location.origin}/d/${file.id}')">复制链接</button>
                <button class="btn btn-danger btn-xs" onclick="deleteSingleFile('${file.id}')">删除</button>
            </div>`;
        grid.appendChild(card);
    });
    updateAdminStats();
    updateBatchActions();
}
function handleFileSelectToggle(fileId) {
    if (selectedFiles.has(fileId)) {
        selectedFiles.delete(fileId);
    } else {
        selectedFiles.add(fileId);
    }
    document.querySelector(`.file-card[data-file-id='${fileId}']`).classList.toggle('selected');
    updateAdminStats();
    updateBatchActions();
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
        // In a real app, you'd have a batch delete endpoint.
        // Here we do it one by one.
        for (const id of ids) {
            await deleteFileAPI(id);
        }
        showToast(`成功删除了 ${ids.length} 个文件`, 'success');
        loadFiles(true); // Refresh
    }
}
async function deleteSingleFile(fileId) {
    const confirmed = await showConfirmModal(`确定要删除这个文件吗？`);
    if (confirmed) {
        await deleteFileAPI(fileId);
        showToast('文件已删除', 'success');
        loadFiles(true); // Refresh
    }
}
async function deleteFileAPI(fileId) {
    try {
        const response = await fetch(`/admin/delete/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authManager.getCurrentToken()}` }
        });
        if (!response.ok) throw new Error('删除失败');
    } catch (error) {
        showToast(error.message, 'error');
    }
}
function updateAdminStats() {
    document.getElementById('totalFiles').textContent = allFiles.length;
    document.getElementById('totalSize').textContent = formatFileSize(allFiles.reduce((sum, f) => sum + Number(f.size), 0));
    document.getElementById('selectedCount').textContent = selectedFiles.size;
}
function updateBatchActions() {
    document.getElementById('batchActions').classList.toggle('hidden', selectedFiles.size === 0);
}

// --- Helper & Utility Functions ---
function formatFileSize(bytes) {
    if (!bytes) return '0 Bytes';
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
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
function showPasswordModal() {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById('passwordModal');
        modal.style.display = 'flex';
        window.passwordModalResolve = resolve;
        window.passwordModalReject = reject;
    });
}
function hidePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    if (window.passwordModalReject) window.passwordModalReject();
}
function confirmPassword() {
    const password = document.getElementById('modalPasswordInput').value;
    if (password && window.passwordModalResolve) window.passwordModalResolve(password);
    hidePasswordModal();
}
function showConfirmModal(message) {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmMessage').textContent = message;
        modal.style.display = 'flex';
        window.confirmModalResolve = resolve;
    });
}
function hideConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}
function confirmAction() {
    if (window.confirmModalResolve) window.confirmModalResolve(true);
    hideConfirmModal();
}
function getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    return 'other';
}
function toggleDebugLog() {
    debugLogVisible = !debugLogVisible;
    const debugLog = document.getElementById('debugLog');
    debugLog.style.display = debugLogVisible ? 'block' : 'none';
    document.getElementById('debugToggle').textContent = debugLogVisible ? '隐藏调试日志' : '显示调试日志';
}
function logToPage(message, type = 'info') {
    if (!debugLogVisible) return;
    const content = document.getElementById('debugLogContent');
    const entry = document.createElement('div');
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    content.appendChild(entry);
    content.scrollTop = content.scrollHeight;
}