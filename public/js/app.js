import { state, resetAdminState } from './state.js';
import { loginAdmin, listFiles, deleteFile, renameFile } from './api.js';
import { parsePositiveInt, clearElement } from './utils.js';
import { renderFileQueue, renderFiles } from './ui/render.js';
import { showToast, hidePasswordModal, confirmPassword, hideConfirmModal, confirmAction, closePreview, downloadCurrentFile, copyCurrentFileLink, previewFile, showPasswordModal, showConfirmModal, showRenameModal, hideRenameModal, confirmRename } from './ui/modal.js';
import { initGlobalDrag } from './ui/drag.js';
import { initLiquidDock } from './ui/fab.js';

// =================================================================================
// CloudLink 6.0 Client-Side Application
// =================================================================================

// --- Constants ---
const CLOUDLINK_CONFIG = window.CLOUDLINK_CONFIG || {};
const CHUNK_UPLOAD_THRESHOLD = parsePositiveInt(CLOUDLINK_CONFIG.chunkUploadThreshold, 50 * 1024 * 1024);
const CHUNK_SIZE = parsePositiveInt(CLOUDLINK_CONFIG.chunkSize, 2 * 1024 * 1024);
const MAX_CONCURRENT_UPLOADS = parsePositiveInt(CLOUDLINK_CONFIG.maxConcurrentUploads, 2);

// =================================================================================
// Initialization
// =================================================================================

document.addEventListener('DOMContentLoaded', function() {
    initAuthManager();
    initTheme();
    initUI();
    
    // Modules
    initGlobalDrag({ addFilesToQueue });
    initLiquidDock();
    
    if (state.authManager.isAuthenticated()) {
        document.getElementById('auth-btn')?.classList.add('auth-active');
        loadFiles(true);
    }
});

function initAuthManager() {
    state.authManager = {
        tokenKey: 'cloudlink_auth_token',
        tokenExpiry: 'cloudlink_token_expiry',
        sessionDuration: 24 * 60 * 60 * 1000, 
        saveAuth: (token) => {
            const expiry = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem('cloudlink_auth_token', token);
            localStorage.setItem('cloudlink_token_expiry', expiry.toString());
        },
        getCurrentToken: () => localStorage.getItem('cloudlink_auth_token'),
        isAuthenticated: () => {
            const token = localStorage.getItem('cloudlink_auth_token');
            const expiry = localStorage.getItem('cloudlink_token_expiry');
            return token && expiry && Date.now() < parseInt(expiry);
        },
        clearAuth: () => {
            localStorage.removeItem('cloudlink_auth_token');
            localStorage.removeItem('cloudlink_token_expiry');
        }
    };
}

function initTheme() {
    const themeBtn = document.getElementById('theme-btn');
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };
    applyTheme(localStorage.getItem('theme') || 'light');
    themeBtn?.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(next);
    });
}

function initUI() {
    // 1. Panel Toggles
    const uploadPanel = document.getElementById('upload-panel');
    const loginModal = document.getElementById('login-modal');

    window.toggleUploadPanel = () => {
        uploadPanel?.classList.toggle('hidden');
        setTimeout(() => uploadPanel?.classList.toggle('active'), 10);
    };

    // Helper to close login modal
    const closeLoginModal = () => {
        loginModal?.classList.remove('active');
        setTimeout(() => loginModal?.classList.add('hidden'), 300);
    };

    window.toggleLoginModal = async () => {
        if (state.authManager.isAuthenticated()) {
            const confirmed = await showConfirmModal('确定要退出登录吗？');
            if (confirmed) {
                state.authManager.clearAuth();
                document.getElementById('auth-btn')?.classList.remove('auth-active');
                renderEmptyState();
                showToast('已退出登录', 'info');
            }
        } else {
            loginModal?.classList.toggle('hidden');
            setTimeout(() => loginModal?.classList.toggle('active'), 10);
        }
    };

    window.closeLoginModal = closeLoginModal;

    // 2. Event Listeners
    document.getElementById('auth-btn')?.addEventListener('click', window.toggleLoginModal);

    // File input
    const fileInput = document.getElementById('file-input');
    fileInput?.addEventListener('change', (e) => {
        addFilesToQueue(Array.from(e.target.files));
        e.target.value = '';
    });

    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = document.getElementById('admin-password').value;
        try {
            const data = await loginAdmin(pwd);
            state.authManager.saveAuth(data.token);
            document.getElementById('auth-btn')?.classList.add('auth-active');
            closeLoginModal();
            document.getElementById('admin-password').value = '';
            loadFiles(true);
            showToast('欢迎回来，管理员', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // 3. Generic Modals
    document.getElementById('modalCancelBtn')?.addEventListener('click', hidePasswordModal);
    document.getElementById('modalConfirmBtn')?.addEventListener('click', confirmPassword);
    document.getElementById('confirmCancelBtn')?.addEventListener('click', hideConfirmModal);
    document.getElementById('confirmOkBtn')?.addEventListener('click', confirmAction);
    document.getElementById('renameCancelBtn')?.addEventListener('click', hideRenameModal);
    document.getElementById('renameConfirmBtn')?.addEventListener('click', confirmRename);
    document.getElementById('previewCloseBtn')?.addEventListener('click', closePreview);
    document.getElementById('previewDownloadBtn')?.addEventListener('click', downloadCurrentFile);
    document.getElementById('previewCopyLinkBtn')?.addEventListener('click', copyCurrentFileLink);
}

// --- Upload Logic ---

function addFilesToQueue(files) {
    files.forEach(file => {
        state.fileQueue.push({
            id: Date.now() + Math.random(),
            file, name: file.name, size: file.size,
            status: 'pending', progress: 0
        });
    });

    // Auto-show upload panel when files are added
    const uploadPanel = document.getElementById('upload-panel');
    if (uploadPanel && !uploadPanel.classList.contains('active')) {
        uploadPanel.classList.remove('hidden');
        setTimeout(() => uploadPanel.classList.add('active'), 10);
    }

    renderFileQueue(state, getRenderCallbacks());
    startUpload();
}

async function startUpload() {
    const pending = state.fileQueue.filter(f => f.status === 'pending');
    if (pending.length === 0) return;

    if (!state.authManager.isAuthenticated() && !state.uploadPassword) {
        try {
            state.uploadPassword = await showPasswordModal();
        } catch { return; }
    }
    
    state.isUploading = true;
    for (let i = 0; i < pending.length; i += MAX_CONCURRENT_UPLOADS) {
        const batch = pending.slice(i, i + MAX_CONCURRENT_UPLOADS);
        await Promise.all(batch.map(f => uploadFile(f)));
    }
    state.isUploading = false;
}

async function uploadFile(fileObj) {
    fileObj.status = 'uploading';
    renderFileQueue(state, getRenderCallbacks());
    try {
        if (fileObj.file.size < CHUNK_UPLOAD_THRESHOLD) await uploadSmallFile(fileObj);
        else await uploadLargeFile(fileObj);
        fileObj.status = 'success';
    } catch (e) {
        fileObj.status = 'error';
        fileObj.error = e.message;
    } finally {
        renderFileQueue(state, getRenderCallbacks());
    }
}

async function uploadSmallFile(fileObj) {
    const formData = new FormData();
    formData.append('file', fileObj.file);
    const headers = {};
    if (state.authManager.isAuthenticated()) headers['Authorization'] = `Bearer ${state.authManager.getCurrentToken()}`;
    else formData.append('password', state.uploadPassword);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload');
        for (const h in headers) xhr.setRequestHeader(h, headers[h]);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                fileObj.progress = Math.round((e.loaded / e.total) * 100);
                renderFileQueue(state, getRenderCallbacks());
            }
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(parseJsonResponse(xhr.responseText));
                return;
            }
            reject(new Error(extractErrorMessage(xhr.responseText, 'Upload Failed')));
        };
        xhr.onerror = () => reject(new Error('Network Error'));
        xhr.send(formData);
    });
}

async function uploadLargeFile(fileObj) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.authManager.isAuthenticated()) headers['Authorization'] = `Bearer ${state.authManager.getCurrentToken()}`;
    
    const res = await fetch('/chunked-upload/start', { 
        method: 'POST', 
        headers, 
        body: JSON.stringify({ fileName: fileObj.name, fileSize: fileObj.size, password: state.uploadPassword }) 
    });
    const startData = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(startData.error || 'Session Failed');
    const { sessionId, sessionToken, chunkSize } = startData;
    const effectiveChunkSize = chunkSize || CHUNK_SIZE;

    let start = 0;
    while (start < fileObj.size) {
        const end = Math.min(start + effectiveChunkSize, fileObj.size);
        const chunk = fileObj.file.slice(start, end);
        const chunkResult = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', `/chunked-upload/chunk/${sessionId}`);
            xhr.setRequestHeader('Content-Range', `bytes ${start}-${end - 1}/${fileObj.size}`);
            xhr.setRequestHeader('X-Upload-Token', sessionToken);
            if (state.authManager.isAuthenticated()) xhr.setRequestHeader('Authorization', `Bearer ${state.authManager.getCurrentToken()}`);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    fileObj.progress = Math.round(((start + e.loaded) / fileObj.size) * 100);
                    renderFileQueue(state, getRenderCallbacks());
                }
            };
            xhr.onload = () => {
                const data = parseJsonResponse(xhr.responseText);
                if (xhr.status < 200 || xhr.status >= 300) {
                    reject(new Error(data.error || 'Chunk upload failed'));
                    return;
                }
                if (data.error) {
                    reject(new Error(data.error));
                    return;
                }
                resolve(data);
            };
            xhr.onerror = () => reject(new Error('Network Error'));
            xhr.send(chunk);
        });
        start = chunkResult.completed
            ? fileObj.size
            : (typeof chunkResult.bytesUploaded === 'number' ? chunkResult.bytesUploaded : end);
        fileObj.progress = Math.min(100, Math.round((start / fileObj.size) * 100));
        renderFileQueue(state, getRenderCallbacks());
    }
}

function parseJsonResponse(responseText) {
    if (!responseText) return {};
    try {
        return JSON.parse(responseText);
    } catch {
        return {};
    }
}

function extractErrorMessage(responseText, fallbackMessage) {
    const data = parseJsonResponse(responseText);
    return data.error || fallbackMessage;
}

// --- List & Actions ---

async function loadFiles(reset = false) {
    if (!state.authManager.isAuthenticated()) {
        renderEmptyState();
        return;
    }

    if (reset) {
        resetAdminState();
        clearElement(document.getElementById('file-grid'));
    }

    try {
        const data = await listFiles(state.authManager.getCurrentToken(), state.nextPageToken);
        state.allFiles.push(...data.files);
        state.nextPageToken = data.nextPageToken;
        renderFiles(state, getRenderCallbacks());
    } catch (e) {
        console.error(e);
        showToast('加载文件列表失败: ' + e.message, 'error');
    }
}

function getRenderCallbacks() {
    return {
        previewFile: (id, name, type) => previewFile(id, name, type),
        copyLink: (id) => {
            const link = `${window.location.origin}/d/${id}`;
            navigator.clipboard.writeText(link)
                .then(() => showToast('链接已复制', 'success'))
                .catch(() => showToast('复制失败', 'error'));
        },
        downloadFile: (id) => {
            window.open(`/d/${id}`, '_blank');
        },
        renameFile: async (id, name) => {
            try {
                const newName = await showRenameModal(name);
                if (!newName || newName === name) return;
                await renameFile(state.authManager.getCurrentToken(), id, newName);
                showToast('重命名成功', 'success');
                loadFiles(true);
            } catch (e) {
                if (e && e.message) {
                    showToast(e.message, 'error');
                }
            }
        },
        deleteFile: async (id, name) => {
            const confirmed = await showConfirmModal(`确定删除 "${name}" 吗？`);
            if (confirmed) {
                try {
                    await deleteFile(state.authManager.getCurrentToken(), id);
                    showToast('删除成功', 'success');
                    loadFiles(true);
                } catch (e) {
                    showToast(e.message, 'error');
                }
            }
        }
    };
}

function renderEmptyState() {
    const grid = document.getElementById('file-grid');
    if (grid) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔒</div>
                <p>请先登录管理员账户</p>
            </div>`;
    }
}
