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
let nextPageToken = null;

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
    document.getElementById('refreshBtn').addEventListener('click', () => loadFiles(true));
    document.getElementById('loadMoreBtn').addEventListener('click', () => loadFiles(false));
    
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
        loadFiles(true); // true to reset
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
}

async function uploadFile(fileObj) {
    // Implementation for uploading a single file
}

// 管理界面相关函数
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
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load files: ${response.statusText}`);
        }

        const data = await response.json();
        allFiles.push(...data.files);
        nextPageToken = data.nextPageToken;

        updateFileList();

        if (nextPageToken) {
            loadMoreBtn.classList.remove('hidden');
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = '加载更多';
        } else {
            loadMoreBtn.classList.add('hidden');
        }

    } catch (error) {
        showToast(`Failed to load files: ${error.message}`, 'error');
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = '加载更多';
    }
}

function updateFileList() {
    // filter and sort allFiles
    handleFilter(); 
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    filteredFiles = allFiles.filter(file => file.name.toLowerCase().includes(searchTerm));
    renderFiles();
}

function handleFilter() {
    const type = document.getElementById('typeFilter').value;
    if (type) {
        filteredFiles = allFiles.filter(file => getFileType(file.mimeType) === type);
    } else {
        filteredFiles = [...allFiles];
    }
    handleSort();
}

function handleSort() {
    const sortBy = document.getElementById('sortBy').value;
    filteredFiles.sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'size') {
            return b.size - a.size;
        } else {
            return new Date(b.createdTime) - new Date(a.createdTime);
        }
    });
    renderFiles();
}

function renderFiles() {
    const grid = document.getElementById('filesGrid');
    if (nextPageToken === null) { // Only clear if we are not loading more
        grid.innerHTML = '';
    }

    filteredFiles.forEach(file => {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.dataset.fileId = file.id;
        if (selectedFiles.has(file.id)) {
            card.classList.add('selected');
        }

        card.innerHTML = `
            <div class="file-card-header">
                <input type="checkbox" class="file-checkbox" data-file-id="${file.id}" ${selectedFiles.has(file.id) ? 'checked' : ''}>
                <div class="file-icon">${getFileIcon(file.mimeType)}</div>
                <div class="file-card-title">${file.name}</div>
            </div>
            <div class="file-card-info">
                <span>${formatFileSize(file.size)}</span>
                <span>${new Date(file.createdTime).toLocaleDateString()}</span>
            </div>
            <div class="file-card-actions">
                <button class="btn btn-secondary btn-xs" onclick="copyToClipboard('/d/${file.id}')">复制链接</button>
                <button class="btn btn-secondary btn-xs" onclick="window.open('/d/${file.id}', '_blank')">下载</button>
                <button class="btn btn-danger btn-xs" onclick="deleteFile('${file.id}')">删除</button>
            </div>
        `;
        grid.appendChild(card);
    });

    // Add event listeners to new checkboxes
    grid.querySelectorAll('.file-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleFileSelectToggle);
    });

    updateAdminStats();
    updateBatchActions();
}

function handleFileSelectToggle(event) {
    const fileId = event.target.dataset.fileId;
    if (event.target.checked) {
        selectedFiles.add(fileId);
        document.querySelector(`.file-card[data-file-id='${fileId}']`).classList.add('selected');
    } else {
        selectedFiles.delete(fileId);
        document.querySelector(`.file-card[data-file-id='${fileId}']`).classList.remove('selected');
    }
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
    const confirmed = await showConfirmModal(`确定要删除选中的 ${selectedFiles.size} 个文件吗？`);
    if (confirmed) {
        const promises = Array.from(selectedFiles).map(id => deleteFile(id, true));
        await Promise.all(promises);
        showToast(`成功删除了 ${selectedFiles.size} 个文件`, 'success');
        loadFiles(true);
    }
}

async function deleteFile(fileId, isBatch = false) {
    try {
        const token = authManager.getCurrentToken();
        const response = await fetch(`/admin/delete/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete file');
        }

        if (!isBatch) {
            showToast('文件删除成功', 'success');
            loadFiles(true);
        }
    } catch (error) {
        if (!isBatch) {
            showToast(`文件删除失败: ${error.message}`, 'error');
        }
    }
}

function updateAdminStats() {
    document.getElementById('totalFiles').textContent = allFiles.length;
    document.getElementById('totalSize').textContent = formatFileSize(allFiles.reduce((sum, f) => sum + Number(f.size), 0));
    document.getElementById('selectedCount').textContent = selectedFiles.size;
}

function updateBatchActions() {
    const batchActions = document.getElementById('batchActions');
    if (selectedFiles.size > 0) {
        batchActions.classList.remove('hidden');
    } else {
        batchActions.classList.add('hidden');
    }
}

// 辅助函数
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStatusText(status) {
    switch (status) {
        case 'pending': return '待上传';
        case 'uploading': return '上传中';
        case 'success': return '上传成功';
        case 'error': return '上传失败';
        default: return '未知';
    }
}

function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
    return '📁';
}

function getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    return 'other';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板', 'success');
    }, () => {
        showToast('复制失败', 'error');
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function getFriendlyErrorMessage(status, message) {
    if (status === 401) return '密码错误或认证已过期';
    if (status === 429) return '请求过于频繁，请稍后再试';
    if (message.includes('Failed to fetch')) return '网络连接失败，请检查您的网络';
    return message || '发生未知错误';
}

function formatTime(seconds) {
    if (seconds === Infinity || isNaN(seconds)) {
        return '--:--';
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
