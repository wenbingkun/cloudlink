import { clearElement, formatFileSize } from '../utils.js';
import { subscribe, state } from '../state.js';

let appCallbacks = {};

export function initReactiveUI(callbacks) {
    appCallbacks = callbacks;
    
    // Subscribe to state changes
    subscribe('allFiles', renderFiles);
    subscribe('fileQueue', renderFileQueue);

    // Global Event Delegation for file grid
    const grid = document.getElementById('file-grid');
    if (grid) {
        grid.addEventListener('click', handleGridClick);
        grid.addEventListener('contextmenu', handleGridContextMenu);
        
        // Touch events for long press and swipe
        let pressTimer = null;
        let pressStartX = 0;
        let pressStartY = 0;
        let currentCard = null;
        let isSwiping = false;

        const clearPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        grid.addEventListener('touchstart', (event) => {
            if (!event.touches || event.touches.length !== 1) return;
            const touch = event.touches[0];
            pressStartX = touch.clientX;
            pressStartY = touch.clientY;
            isSwiping = false;
            currentCard = touch.target.closest('.file-card');
            
            clearPress();
            
            if (currentCard) {
                currentCard.style.transition = 'none'; // Disable transition for 1:1 tracking
                pressTimer = setTimeout(() => {
                    if (isSwiping) return;
                    currentCard.dataset.suppressClick = 'true';
                    openContextMenu(touch.clientX, touch.clientY, currentCard);
                    resetSwipe();
                }, 500);
            }
        }, { passive: true });

        grid.addEventListener('touchmove', (event) => {
            if (!event.touches || event.touches.length !== 1 || !currentCard) return;
            const touch = event.touches[0];
            const deltaX = touch.clientX - pressStartX;
            const deltaY = Math.abs(touch.clientY - pressStartY);
            
            if (Math.abs(deltaX) > 10 || deltaY > 10) {
                clearPress();
            }

            // Only track horizontal swipes
            if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
                isSwiping = true;
                const moveX = deltaX * 0.4; // Dampen the movement
                currentCard.style.transform = `translateX(${moveX}px) scale(0.98)`;
            }
        }, { passive: true });

        const resetSwipe = () => {
            clearPress();
            if (currentCard) {
                currentCard.style.transition = 'transform 0.3s var(--spring)';
                currentCard.style.transform = '';
                currentCard = null;
            }
            setTimeout(() => { isSwiping = false; }, 50);
        };

        grid.addEventListener('touchend', (event) => {
            if (isSwiping && currentCard) {
                const touch = event.changedTouches[0];
                const deltaX = touch.clientX - pressStartX;
                const id = currentCard.dataset.id;
                const name = currentCard.dataset.name;

                if (deltaX < -80 && appCallbacks.deleteFile) {
                    // Swipe Left: Delete
                    appCallbacks.deleteFile(id, name);
                } else if (deltaX > 80 && appCallbacks.renameFile) {
                    // Swipe Right: Rename
                    appCallbacks.renameFile(id, name);
                }
                
                if (Math.abs(deltaX) > 10) {
                    currentCard.dataset.suppressClick = 'true';
                }
            }
            resetSwipe();
        });
        
        grid.addEventListener('touchcancel', resetSwipe);
    }
}

function handleGridClick(e) {
    const card = e.target.closest('.file-card');
    if (!card) return;
    
    if (card.dataset.suppressClick === 'true') {
        card.dataset.suppressClick = 'false';
        return;
    }

    const id = card.dataset.id;
    const name = card.dataset.name;
    const type = card.dataset.type;
    
    if (appCallbacks.previewFile) {
        appCallbacks.previewFile(id, name, type);
    }
}

function handleGridContextMenu(e) {
    const card = e.target.closest('.file-card');
    if (!card) return;
    
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, card);
}

function openContextMenu(x, y, card) {
    const id = card.dataset.id;
    const name = card.dataset.name;
    const type = card.dataset.type;
    
    showContextMenu({
        x, y,
        file: { id, name, mimeType: type },
        callbacks: appCallbacks
    });
}

function renderFileQueue(queue) {
    const container = document.getElementById('upload-queue');
    if (!container) return;

    container.className = 'dynamic-island';
    clearElement(container);
    
    if (!queue || queue.length === 0) {
        return;
    }

    const pending = queue.filter(f => f.status === 'pending');
    const uploading = queue.filter(f => f.status === 'uploading');
    const success = queue.filter(f => f.status === 'success');
    const error = queue.filter(f => f.status === 'error');
    
    const active = uploading.length > 0 || pending.length > 0;
    
    // Auto-clear success state
    if (!active && success.length > 0 && error.length === 0) {
        showIslandState(container, {
            icon: '✅',
            title: 'Upload Complete',
            disableIconAnimation: true
        });
        setTimeout(() => {
            if (container.className.includes('active') && !queue.find(f => f.status === 'uploading')) {
                container.classList.remove('active');
            }
        }, 3000);
        return;
    }

    if (!active && error.length > 0) {
        const lastError = error[error.length - 1];
        showIslandState(container, {
            icon: '⚠️',
            title: lastError.name || 'Upload failed',
            subtitle: lastError.error || 'Please try again'
        });
        return;
    }
    
    if (!active) {
        container.classList.remove('active');
        return;
    }

    const totalFiles = queue.length;
    const totalProgress = queue.reduce((sum, f) => sum + (f.progress || 0), 0) / totalFiles;
    
    const currentFile = uploading[0] || pending[0];
    const text = queue.length > 1 
        ? `Uploading ${success.length + 1} of ${totalFiles}...` 
        : currentFile.name;

    showIslandState(container, {
        icon: '⬆️',
        title: text,
        progress: totalProgress,
        percentText: `${Math.round(totalProgress)}%`
    });
}

function renderFiles(files) {
    const grid = document.getElementById('file-grid');
    if (!grid) return;

    clearElement(grid);

    if (!files || files.length === 0) {
        renderEmptyState();
        return;
    }

    const fragment = document.createDocumentFragment();

    files.forEach((file) => {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.dataset.id = file.id;
        card.dataset.name = file.name;
        card.dataset.type = file.mimeType || '';

        const preview = document.createElement('div');
        preview.className = 'card-preview';

        if (file.mimeType && file.mimeType.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = `/d/${file.id}`;
            img.loading = 'lazy';

            const fallback = document.createElement('span');
            fallback.textContent = '🖼️';
            fallback.style.display = 'none';

            img.addEventListener('error', () => {
                img.style.display = 'none';
                fallback.style.display = 'block';
            });

            preview.appendChild(img);
            preview.appendChild(fallback);
        } else {
            preview.textContent = getFileIconChar(file.mimeType);
        }

        const info = document.createElement('div');
        info.className = 'card-info';

        const title = document.createElement('h4');
        title.textContent = file.name;

        const meta = document.createElement('span');
        meta.textContent = formatFileSize(file.size);

        info.appendChild(title);
        info.appendChild(meta);

        card.appendChild(preview);
        card.appendChild(info);
        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
}

export function renderEmptyState() {
    const grid = document.getElementById('file-grid');
    if (grid) {
        clearElement(grid);

        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';

        const icon = document.createElement('div');
        icon.className = 'empty-icon';
        icon.textContent = '🔒';

        const message = document.createElement('p');
        message.textContent = 'Please log in as admin';

        emptyState.appendChild(icon);
        emptyState.appendChild(message);
        grid.appendChild(emptyState);
    }
}

function showIslandState(container, {
    icon,
    title,
    subtitle = '',
    progress = null,
    percentText = '',
    disableIconAnimation = false
}) {
    container.className = 'dynamic-island active';
    clearElement(container);

    const iconNode = document.createElement('div');
    iconNode.className = 'island-icon';
    iconNode.textContent = icon;
    if (disableIconAnimation) {
        iconNode.style.animation = 'none';
    }

    const content = document.createElement('div');
    content.className = 'island-content';

    const titleNode = document.createElement('div');
    titleNode.className = 'island-title';
    titleNode.textContent = title;
    content.appendChild(titleNode);

    if (subtitle) {
        const subtitleNode = document.createElement('div');
        subtitleNode.className = 'island-subtitle';
        subtitleNode.textContent = subtitle;
        content.appendChild(subtitleNode);
    }

    if (typeof progress === 'number') {
        const progressBar = document.createElement('div');
        progressBar.className = 'island-progress-bar';

        const progressFill = document.createElement('div');
        progressFill.className = 'island-progress-fill';
        progressFill.style.width = `${progress}%`;

        progressBar.appendChild(progressFill);
        content.appendChild(progressBar);
    }

    container.appendChild(iconNode);
    container.appendChild(content);

    if (percentText) {
        const percentNode = document.createElement('div');
        percentNode.className = 'island-percent';
        percentNode.textContent = percentText;
        container.appendChild(percentNode);
    }
}

// Helper
function getFileIconChar(mimeType) {
    if (!mimeType) return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
    return '📄';
}

function ensureContextMenu() {
    let menu = document.getElementById('contextMenu');
    if (menu) return menu;

    menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.className = 'context-menu hidden';
    document.body.appendChild(menu);

    document.addEventListener('click', () => hideContextMenu());
    window.addEventListener('resize', () => hideContextMenu());
    window.addEventListener('scroll', () => hideContextMenu(), true);

    return menu;
}

function hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) {
        menu.classList.remove('active');
        setTimeout(() => menu.classList.add('hidden'), 200); // Wait for transition
    }
}

function showContextMenu({ x, y, file, callbacks }) {
    const menu = ensureContextMenu();
    menu.innerHTML = '';

    const items = [
        callbacks.copyLink ? { label: 'Copy Link', action: () => callbacks.copyLink(file.id) } : null,
        callbacks.downloadFile ? { label: 'Download', action: () => callbacks.downloadFile(file.id) } : null,
        callbacks.renameFile ? { label: 'Rename', action: () => callbacks.renameFile(file.id, file.name) } : null,
        callbacks.deleteFile ? { label: 'Delete', action: () => callbacks.deleteFile(file.id, file.name), danger: true } : null,
    ].filter(Boolean);

    items.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `context-menu-item${item.danger ? ' danger' : ''}`;
        button.textContent = item.label;
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            hideContextMenu();
            item.action();
        });
        menu.appendChild(button);
    });

    const padding = 12;
    const menuWidth = 200;
    const menuHeight = items.length * 40 + 12;
    const maxX = window.innerWidth - menuWidth - padding;
    const maxY = window.innerHeight - menuHeight - padding;

    menu.style.left = `${Math.max(padding, Math.min(x, maxX))}px`;
    menu.style.top = `${Math.max(padding, Math.min(y, maxY))}px`;
    
    menu.classList.remove('hidden');
    // Trigger transition
    requestAnimationFrame(() => {
        menu.classList.add('active');
    });
}
