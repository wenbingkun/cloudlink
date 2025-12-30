import { state, resetAdminState } from './state.js';
import { loginAdmin, listFiles, deleteFile } from './api.js';
import { parsePositiveInt, formatTime, getFileType, clearElement, buildFileInfo } from './utils.js';
import { renderFileQueue, renderFiles, updateSelectedActions, updateUploadButton } from './ui/render.js';
import { initDraggableFAB } from './ui/fab.js';
import { initGlobalDrag } from './ui/drag.js';
import { showToast, showPasswordModal, hidePasswordModal, confirmPassword, showConfirmModal, hideConfirmModal, confirmAction } from './ui/modal.js';

// =================================================================================
// CloudLink Client-Side Application
// =================================================================================

// --- Constants (allow override via window.CLOUDLINK_CONFIG) ---
const CLOUDLINK_CONFIG = window.CLOUDLINK_CONFIG || {};

const CHUNK_UPLOAD_THRESHOLD = parsePositiveInt(
    CLOUDLINK_CONFIG.chunkUploadThreshold,
    50 * 1024 * 1024
); // 50MB
const CHUNK_SIZE = parsePositiveInt(
    CLOUDLINK_CONFIG.chunkSize,
    2 * 1024 * 1024
); // 2MB - 保守策略防止HTTP 500
const MAX_CONCURRENT_UPLOADS = parsePositiveInt(
    CLOUDLINK_CONFIG.maxConcurrentUploads,
    2
); // 最大并发上传数
const MAX_RETRIES = parsePositiveInt(
    CLOUDLINK_CONFIG.maxRetries,
    3
); // 最大重试次数
const RETRY_DELAY_BASE = parsePositiveInt(
    CLOUDLINK_CONFIG.retryDelayBase,
    1000
); // 重试基础延迟（毫秒）

// =================================================================================
// Initialization
// =================================================================================

document.addEventListener('DOMContentLoaded', function() {
    initAuthManager();
    initEventListeners();
    checkAuthStatus();
    switchToUpload();
    initDraggableFAB();
    initGlobalDrag({ addFilesToQueue, switchToUpload });
});

function initAuthManager() {
    state.authManager = {
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
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
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

    // Preview Modal Controls
    const previewCloseBtn = document.getElementById('previewCloseBtn');
    const previewDownloadBtn = document.getElementById('previewDownloadBtn');
    const previewCopyLinkBtn = document.getElementById('previewCopyLinkBtn');
    
    if (previewCloseBtn) {
        previewCloseBtn.addEventListener('click', closePreview);
    }
    if (previewDownloadBtn) {
        previewDownloadBtn.addEventListener('click', downloadCurrentFile);
    }
    if (previewCopyLinkBtn) {
        previewCopyLinkBtn.addEventListener('click', copyCurrentFileLink);
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
    if (state.authManager.isAuthenticated()) {
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
    if (state.authManager.isAuthenticated()) {
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
        const data = await loginAdmin(password);
        state.authManager.saveAuth(data.token);
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
        state.fileQueue.push({
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
    renderFileQueue(state, getRenderCallbacks());
    updateUploadButton(state);
}

async function startUpload() {
    const pendingFiles = state.fileQueue.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    // 认证检查：已登录管理员可直接上传，未登录需要上传密码
    if (!state.authManager.isAuthenticated() && !state.uploadPassword) {
        try {
            state.uploadPassword = await showPasswordModal();
        } catch {
            showToast('上传已取消', 'info');
            return;
        }
    }
    
    state.isUploading = true;
    updateUploadButton(state);
    const uploadSessionStartTime = Date.now();

    // 控制并发上传数量防止HTTP 500错误
    const uploadPromises = [];
    for (let i = 0; i < pendingFiles.length; i += MAX_CONCURRENT_UPLOADS) {
        const batch = pendingFiles.slice(i, i + MAX_CONCURRENT_UPLOADS);
        const batchPromises = batch.map(fileObj => uploadFile(fileObj));
        await Promise.all(batchPromises);
    }

    state.isUploading = false;
    updateUploadButton(state);

    const totalTime = Date.now() - uploadSessionStartTime;
    const successCount = state.fileQueue.filter(f => f.status === 'success').length;
    const errorCount = state.fileQueue.filter(f => f.status === 'error').length;

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
    renderFileQueue(state, getRenderCallbacks());

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
        renderFileQueue(state, getRenderCallbacks());
    }
}

async function uploadSmallFile(fileObj) {
    fileObj.startTime = Date.now(); // 初始化开始时间
    
    const formData = new FormData();
    formData.append('file', fileObj.file, fileObj.name);
    
    const headers = {};
    if (state.authManager.isAuthenticated()) {
        headers['Authorization'] = `Bearer ${state.authManager.getCurrentToken()}`;
    } else {
        formData.append('password', state.uploadPassword);
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
                
                renderFileQueue(state, getRenderCallbacks());
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
        if (state.authManager.isAuthenticated()) {
            headers['Authorization'] = `Bearer ${state.authManager.getCurrentToken()}`;
        } else {
            body.password = state.uploadPassword;
        }
        
        const startResponse = await fetch('/chunked-upload/start', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        if (!startResponse.ok) throw new Error('无法启动分块上传会话');
        const session = await startResponse.json();
        fileObj.uploadSessionId = session.sessionId;
        fileObj.uploadSessionToken = session.sessionToken;
    }

    // 2. Upload chunks
    let start = fileObj.uploadedBytes;
    let lastProgressTime = Date.now();
    let lastUploadedBytes = fileObj.uploadedBytes;

    while (start < fileObj.size) {
        // Handle pause
        if (fileObj.isPaused) {
            fileObj.status = 'paused';
            renderFileQueue(state, getRenderCallbacks());
            // This promise will resolve when user clicks resume
            await new Promise(resolve => {
                fileObj.resumeHandler = resolve;
            });
            fileObj.status = 'uploading';
            renderFileQueue(state, getRenderCallbacks());
        }

        const end = Math.min(start + CHUNK_SIZE, fileObj.size);
        const chunk = fileObj.file.slice(start, end);

        const uploadChunkWithRetry = async (retryCount = 0) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', `/chunked-upload/chunk/${fileObj.uploadSessionId}`);
            xhr.setRequestHeader('Content-Range', `bytes ${start}-${end - 1}/${fileObj.size}`);
            if (fileObj.uploadSessionToken) {
                xhr.setRequestHeader('X-Upload-Token', fileObj.uploadSessionToken);
            }

            const promise = new Promise((resolve, reject) => {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const currentUploaded = start + event.loaded;
                        const currentTime = Date.now();
                        const timeDiff = (currentTime - lastProgressTime) / 1000;
                        const bytesDiff = currentUploaded - lastUploadedBytes;

                        if (timeDiff > 0) {
                            fileObj.uploadSpeed = bytesDiff / timeDiff;
                            if (fileObj.uploadSpeed > fileObj.peakSpeed) {
                                fileObj.peakSpeed = fileObj.uploadSpeed;
                            }
                        }
                        fileObj.progress = Math.round((currentUploaded / fileObj.size) * 100);
                        fileObj.uploadedBytes = currentUploaded;
                        renderFileQueue(state, getRenderCallbacks());

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

            try {
                return await promise;
            } catch (error) {
                if (retryCount >= MAX_RETRIES) {
                    throw error;
                }
                const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
                console.warn(`Chunk upload failed, retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return uploadChunkWithRetry(retryCount + 1);
            }
        };

        const result = await uploadChunkWithRetry();

        if (result.completed) {
            fileObj.downloadUrl = result.downloadUrl;
            return; // Exit loop
        }
        start = end;
    }
}

function togglePause(fileId) {
    const fileObj = state.fileQueue.find(f => f.id === fileId);
    if (!fileObj || (fileObj.status !== 'uploading' && fileObj.status !== 'paused')) return;

    fileObj.isPaused = !fileObj.isPaused;

    if (!fileObj.isPaused && fileObj.resumeHandler) {
        fileObj.resumeHandler(); // Resolve the promise to continue the loop
        fileObj.resumeHandler = null;
    }
    renderFileQueue(state, getRenderCallbacks());
}

function removeFromQueue(fileId) {
    state.fileQueue = state.fileQueue.filter(f => f.id !== fileId);
    renderFileQueue(state, getRenderCallbacks());
    updateUploadButton(state);
}

function clearQueue() {
    const uploadingFiles = state.fileQueue.filter(f => f.status === 'uploading' || f.status === 'paused');
    if (uploadingFiles.length > 0) {
        showToast('有文件正在上传，无法清空队列', 'info');
        return;
    }
    state.fileQueue = [];
    renderFileQueue(state, getRenderCallbacks());
    updateUploadButton(state);
}

function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('dragover'); }
function handleDragLeave(e) { e.currentTarget.classList.remove('dragover'); }

async function loadFiles(reset = false) {
    if (reset) {
        resetAdminState();
        document.getElementById('filesGrid').replaceChildren();
    }
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = '加载中...';
    try {
        const token = state.authManager.getCurrentToken();
        const data = await listFiles(token, state.nextPageToken);
        state.allFiles.push(...data.files);
        state.nextPageToken = data.nextPageToken;
        updateFileList();
        loadMoreBtn.classList.toggle('hidden', !state.nextPageToken);
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
    let tempFiles = state.allFiles;
    
    if (type) {
        tempFiles = tempFiles.filter(file => getFileType(file.mimeType) === type);
    }
    if (searchTerm) {
        tempFiles = tempFiles.filter(file => file.name.toLowerCase().includes(searchTerm));
    }
    state.filteredFiles = tempFiles;
    handleSort();
}
function handleSort() {
    const sortByElement = document.getElementById('sortBy');
    const sortBy = sortByElement ? sortByElement.value : 'time';
    
    state.filteredFiles.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'size') return b.size - a.size;
        return new Date(b.createdTime) - new Date(a.createdTime);
    });
    renderFiles(state, getRenderCallbacks());
}

function getStatusText(fileObj) {
    switch (fileObj.status) {
        case 'pending': return '等待上传';
        case 'uploading': return `上传中... ${fileObj.progress}%`;
        case 'paused': return `已暂停 ${fileObj.progress}%`;
        case 'success': return '上传成功';
        case 'error': return '上传失败';
        default: return '';
    }
}

function getRenderCallbacks() {
    return {
        removeFromQueue,
        togglePause,
        copyToClipboard,
        previewFile,
        deleteSingleFile,
        updateSelectedActions: () => updateSelectedActions(state),
        updateUploadButton: () => updateUploadButton(state),
        getStatusText
    };
}

function handleFileSelectToggle(fileId) {
    if (state.selectedFiles.has(fileId)) {
        state.selectedFiles.delete(fileId);
    } else {
        state.selectedFiles.add(fileId);
    }
    document.querySelector(`.file-card[data-file-id='${fileId}']`).classList.toggle('selected');
    updateSelectedActions(state);
}

function selectAll() {
    state.filteredFiles.forEach(file => state.selectedFiles.add(file.id));
    renderFiles(state, getRenderCallbacks());
}
function deselectAll() {
    state.selectedFiles.clear();
    renderFiles(state, getRenderCallbacks());
}
async function deleteSelected() {
    if (state.selectedFiles.size === 0) return;
    const confirmed = await showConfirmModal(`确定要删除选中的 ${state.selectedFiles.size} 个文件吗？`);
    if (confirmed) {
        const ids = Array.from(state.selectedFiles);
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
        await deleteFile(state.authManager.getCurrentToken(), fileId);
        return true;
    } catch (error) {
        showToast(error.message, 'error');
        return false;
    }
}
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板', 'success'), () => showToast('复制失败', 'error'));
}

// 预览功能
let currentPreviewFile = null;

function previewFile(fileId, fileName, mimeType) {
    currentPreviewFile = { id: fileId, name: fileName, mimeType: mimeType };
    
    const modal = document.getElementById('previewModal');
    const title = document.getElementById('previewTitle');
    const content = document.getElementById('previewContent');
    
    title.textContent = fileName;
    
    const fileUrl = `/d/${fileId}`;
    const fileType = getFileType(mimeType);

    clearElement(content);

    switch (fileType) {
        case 'image': {
            const img = document.createElement('img');
            img.src = fileUrl;
            img.alt = fileName;
            img.loading = 'lazy';

            const fallback = buildFileInfo({
                fileName,
                mimeType,
                message: '图片加载失败，请下载后查看'
            });
            fallback.style.display = 'none';

            img.addEventListener('error', () => {
                img.style.display = 'none';
                fallback.style.display = 'block';
            });

            content.appendChild(img);
            content.appendChild(fallback);
            break;
        }
        case 'video': {
            const wrapper = document.createElement('div');
            const video = document.createElement('video');
            video.controls = true;
            video.preload = 'metadata';
            video.style.maxWidth = '100%';
            video.style.maxHeight = '500px';
            video.addEventListener('loadstart', () => handleVideoLoadStart(video));
            video.addEventListener('error', () => handleVideoError(video, fileName, mimeType));

            const sourcePrimary = document.createElement('source');
            sourcePrimary.src = fileUrl;
            sourcePrimary.type = mimeType;
            video.appendChild(sourcePrimary);

            const sourceMp4 = document.createElement('source');
            sourceMp4.src = fileUrl;
            sourceMp4.type = 'video/mp4';
            video.appendChild(sourceMp4);

            const isProblematicFormat = mimeType && (mimeType.includes('mov') || mimeType.includes('quicktime'));
            if (!isProblematicFormat) {
                const sourceWebm = document.createElement('source');
                sourceWebm.src = fileUrl;
                sourceWebm.type = 'video/webm';
                video.appendChild(sourceWebm);
            }

            wrapper.appendChild(video);

            if (isProblematicFormat) {
                const warning = document.createElement('div');
                warning.className = 'format-warning';
                warning.style.cssText = 'background: var(--bg-secondary); padding: 0.75rem; border-radius: var(--radius-md); margin-top: 1rem; font-size: 0.875rem; color: var(--text-secondary);';
                const strong = document.createElement('strong');
                strong.textContent = '提示：';
                const text = document.createElement('span');
                text.textContent = 'MOV格式在网页中的兼容性有限，如无法播放请下载后使用专业播放器观看。';
                warning.appendChild(strong);
                warning.appendChild(text);
                wrapper.appendChild(warning);
            }

            content.appendChild(wrapper);
            break;
        }
        case 'audio': {
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.preload = 'metadata';
            audio.style.width = '100%';
            audio.style.maxWidth = '500px';
            audio.addEventListener('error', () => handleAudioError(audio, fileName, mimeType));

            const source = document.createElement('source');
            source.src = fileUrl;
            source.type = mimeType;
            audio.appendChild(source);
            content.appendChild(audio);
            break;
        }
        default: {
            const info = buildFileInfo({
                fileName,
                mimeType,
                message: '此文件类型不支持预览，请下载后查看。'
            });
            content.appendChild(info);
            break;
        }
    }
    
    modal.style.display = 'flex';
}

function closePreview() {
    const modal = document.getElementById('previewModal');
    modal.style.display = 'none';
    currentPreviewFile = null;
}

function downloadCurrentFile() {
    if (currentPreviewFile) {
        window.open(`/d/${currentPreviewFile.id}`, '_blank');
    }
}

function copyCurrentFileLink() {
    if (currentPreviewFile) {
        const link = `${window.location.origin}/d/${currentPreviewFile.id}`;
        copyToClipboard(link);
    }
}

// 视频加载处理函数
function handleVideoLoadStart(video) {
    // 添加加载指示
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'video-loading';
    loadingDiv.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--text-secondary);
        font-size: 14px;
    `;
    loadingDiv.textContent = '加载视频中...';
    
    video.parentNode.style.position = 'relative';
    video.parentNode.appendChild(loadingDiv);
    
    video.addEventListener('loadeddata', () => {
        if (loadingDiv && loadingDiv.parentNode) {
            loadingDiv.remove();
        }
    });
}

function handleVideoError(video, fileName, mimeType) {
    const info = buildFileInfo({
        fileName,
        mimeType,
        message: '此视频格式可能不受浏览器支持，请下载后使用专业播放器观看。'
    });
    const hint = document.createElement('div');
    hint.style.cssText = 'background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); margin: 1rem 0;';
    const hintText = document.createElement('p');
    hintText.style.cssText = 'color: var(--text-secondary); margin: 0;';
    const strong = document.createElement('strong');
    strong.textContent = '视频预览失败';
    hintText.appendChild(strong);
    hintText.appendChild(document.createElement('br'));
    if (mimeType && mimeType.includes('mov')) {
        hintText.appendChild(document.createTextNode('MOV格式在某些浏览器中支持有限。'));
        hintText.appendChild(document.createElement('br'));
    }
    hintText.appendChild(document.createTextNode('请下载后使用专业播放器观看。'));
    hint.appendChild(hintText);
    info.appendChild(hint);

    const content = document.getElementById('previewContent');
    if (content) {
        clearElement(content);
        content.appendChild(info);
    }
    
    showToast('视频格式不受支持，请下载后观看', 'info');
}

function handleAudioError(audio, fileName, mimeType) {
    const info = buildFileInfo({
        fileName,
        mimeType,
        message: '此音频格式可能不受浏览器支持，请下载后使用专业播放器播放。'
    });
    const hint = document.createElement('div');
    hint.style.cssText = 'background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); margin: 1rem 0;';
    const hintText = document.createElement('p');
    hintText.style.cssText = 'color: var(--text-secondary); margin: 0;';
    const strong = document.createElement('strong');
    strong.textContent = '音频预览失败';
    hintText.appendChild(strong);
    hintText.appendChild(document.createElement('br'));
    hintText.appendChild(document.createTextNode('此音频格式可能不受浏览器支持。'));
    hintText.appendChild(document.createElement('br'));
    hintText.appendChild(document.createTextNode('请下载后使用专业播放器播放。'));
    hint.appendChild(hintText);
    info.appendChild(hint);

    const content = document.getElementById('previewContent');
    if (content) {
        clearElement(content);
        content.appendChild(info);
    }
    
    showToast('音频格式不受支持，请下载后播放', 'info');
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
    const fabThemeToggle = document.getElementById('fab-theme-toggle');
    const toggleHandler = () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    if (themeToggleButton) themeToggleButton.addEventListener('click', toggleHandler);
    if (fabThemeToggle) fabThemeToggle.addEventListener('click', toggleHandler);
});

// =================================================================================
// FAB & Global Drag Logic
// =================================================================================

function initDraggableFAB() {
    const fab = document.getElementById('fab-container');
    const mainBtn = document.getElementById('fab-main');
    if (!fab || !mainBtn) return;

    let isPointerDown = false;
    let isDragging = false;
    let hasMoved = false; // Distinguish click from drag
    let startX, startY;
    let initialLeft, initialTop;

    // Use Pointer Events for unified mouse/touch handling
    mainBtn.addEventListener('pointerdown', (e) => {
        isPointerDown = true;
        isDragging = false;
        hasMoved = false;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = fab.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        
        mainBtn.setPointerCapture(e.pointerId);
    });

    mainBtn.addEventListener('pointermove', (e) => {
        if (!isPointerDown) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (!hasMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            hasMoved = true;
            isDragging = true;

            fab.style.transition = 'none'; // Disable transition during drag
            fab.style.bottom = 'auto'; // Switch to top/left positioning
            fab.style.right = 'auto';
            fab.style.left = `${initialLeft}px`;
            fab.style.top = `${initialTop}px`;
        }
        
        if (!isDragging) return;

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;
        
        // Boundaries
        const maxLeft = window.innerWidth - fab.offsetWidth;
        const maxTop = window.innerHeight - fab.offsetHeight;
        
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        fab.style.left = `${newLeft}px`;
        fab.style.top = `${newTop}px`;
    });

    mainBtn.addEventListener('pointerup', (e) => {
        if (!isPointerDown) return;
        isPointerDown = false;
        isDragging = false;
        if (mainBtn.hasPointerCapture(e.pointerId)) {
            mainBtn.releasePointerCapture(e.pointerId);
        }

        if (!hasMoved) {
            // It was a click, toggle menu
            fab.classList.toggle('active');
        } else {
            // It was a drag, snap to edge
            fab.style.transition = 'left 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
            const midPoint = window.innerWidth / 2;
            const currentRect = fab.getBoundingClientRect();
            
            if (currentRect.left + currentRect.width / 2 < midPoint) {
                fab.style.left = '24px';
                fab.classList.add('left-aligned');
            } else {
                fab.style.left = `${window.innerWidth - fab.offsetWidth - 24}px`;
                fab.classList.remove('left-aligned');
            }
        }
    });

    const cancelDrag = (e) => {
        if (!isPointerDown) return;
        isPointerDown = false;
        isDragging = false;
        if (e && mainBtn.hasPointerCapture(e.pointerId)) {
            mainBtn.releasePointerCapture(e.pointerId);
        }
    };

    mainBtn.addEventListener('pointercancel', cancelDrag);
    mainBtn.addEventListener('lostpointercapture', cancelDrag);
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!fab.contains(e.target) && fab.classList.contains('active')) {
            fab.classList.remove('active');
        }
    });
}

function initGlobalDrag() {
    let dragCounter = 0;
    let isFileDrag = false;

    const isFileDragEvent = (event) => {
        if (!event.dataTransfer || !event.dataTransfer.types) {
            return false;
        }
        return Array.from(event.dataTransfer.types).includes('Files');
    };
    
    window.addEventListener('dragenter', (e) => {
        if (!isFileDragEvent(e)) return;
        e.preventDefault();
        isFileDrag = true;
        dragCounter += 1;
        document.body.classList.add('drag-active');
    });

    window.addEventListener('dragleave', (e) => {
        if (!isFileDrag) return;
        e.preventDefault();
        dragCounter = Math.max(0, dragCounter - 1);
        if (dragCounter === 0) {
            isFileDrag = false;
            document.body.classList.remove('drag-active');
        }
    });

    window.addEventListener('dragover', (e) => {
        if (!isFileDrag) return;
        e.preventDefault(); // Necessary to allow dropping
    });

    window.addEventListener('drop', (e) => {
        if (!isFileDragEvent(e)) return;
        e.preventDefault();
        dragCounter = 0;
        isFileDrag = false;
        document.body.classList.remove('drag-active');
        
        // Handle the drop
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
            addFilesToQueue(Array.from(e.dataTransfer.files));
            switchToUpload(); // Ensure we are on the upload tab
        }
    });
}
