import { formatFileSize, getFileType } from '../utils.js';

export function renderFileQueue(state, callbacks) {
    const container = document.getElementById('upload-queue');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (state.fileQueue.length === 0) {
        return;
    }

    const fragment = document.createDocumentFragment();
    
    state.fileQueue.forEach(fileObj => {
        const item = document.createElement('div');
        item.className = 'queue-item';
        // Inline styles for queue items (since they are dynamic)
        item.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            padding: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
        `;

        // Icon
        const icon = document.createElement('div');
        icon.textContent = getFileIconChar(fileObj.file.type);
        icon.style.fontSize = '1.5rem';
        item.appendChild(icon);

        // Info
        const info = document.createElement('div');
        info.style.flex = '1';
        
        const name = document.createElement('div');
        name.textContent = fileObj.name;
        name.style.cssText = 'font-size: 0.9rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;';
        info.appendChild(name);

        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = 'height: 4px; background: rgba(0,0,0,0.1); border-radius: 2px; margin-top: 6px; overflow: hidden;';
        
        const bar = document.createElement('div');
        bar.style.cssText = `height: 100%; background: var(--btn-primary); width: ${fileObj.progress}%; transition: width 0.3s;`;
        progressContainer.appendChild(bar);
        info.appendChild(progressContainer);
        
        item.appendChild(info);

        // Status
        const status = document.createElement('div');
        status.textContent = fileObj.status === 'success' ? '✓' : (fileObj.progress + '%');
        status.style.cssText = 'font-size: 0.8rem; color: var(--text-muted); min-width: 30px; text-align: right;';
        item.appendChild(status);

        fragment.appendChild(item);
    });

    container.appendChild(fragment);
}

export function renderFiles(state, callbacks) {
    const grid = document.getElementById('file-grid');
    if (!grid) return;
    
    grid.innerHTML = ''; // Clear existing

    if (state.allFiles.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📂</div>
                <p>No files uploaded yet</p>
            </div>`;
        return;
    }

    const fragment = document.createDocumentFragment();

    state.allFiles.forEach(file => {
        const card = document.createElement('div');
        card.className = 'file-card';

        // Preview Area (clickable for preview)
        const preview = document.createElement('div');
        preview.className = 'card-preview';
        preview.onclick = () => callbacks.previewFile(file.id, file.name, file.mimeType);

        if (file.mimeType && file.mimeType.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = `/d/${file.id}`;
            img.loading = 'lazy';
            img.onerror = () => { img.style.display = 'none'; preview.textContent = '🖼️'; };
            preview.appendChild(img);
        } else {
            preview.textContent = getFileIconChar(file.mimeType);
        }
        card.appendChild(preview);

        // Info Area
        const info = document.createElement('div');
        info.className = 'card-info';

        const title = document.createElement('h4');
        title.textContent = file.name;
        info.appendChild(title);

        const meta = document.createElement('span');
        meta.textContent = formatFileSize(file.size);
        info.appendChild(meta);

        card.appendChild(info);

        // Action Buttons
        const actions = document.createElement('div');
        actions.className = 'card-actions';
        actions.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid var(--glass-border);
        `;

        let hasActions = false;

        if (callbacks.copyLink) {
            const copyBtn = createActionButton('📋', '复制链接', () => {
                callbacks.copyLink(file.id);
            });
            actions.appendChild(copyBtn);
            hasActions = true;
        }

        if (callbacks.downloadFile) {
            const downloadBtn = createActionButton('⬇️', '下载', () => {
                callbacks.downloadFile(file.id);
            });
            actions.appendChild(downloadBtn);
            hasActions = true;
        }

        if (callbacks.renameFile) {
            const renameBtn = createActionButton('✏️', '重命名', () => {
                callbacks.renameFile(file.id, file.name);
            });
            actions.appendChild(renameBtn);
            hasActions = true;
        }

        if (callbacks.deleteFile) {
            const deleteBtn = createActionButton('🗑️', '删除', () => {
                callbacks.deleteFile(file.id, file.name);
            });
            deleteBtn.style.color = '#ef4444';
            actions.appendChild(deleteBtn);
            hasActions = true;
        }

        if (hasActions) {
            card.appendChild(actions);
        }

        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
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

function createActionButton(icon, label, onClick) {
    const button = document.createElement('button');
    button.className = 'glass-btn';
    button.type = 'button';
    button.textContent = icon;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.style.cssText = `
        flex: 1;
        min-width: 44px;
        height: 36px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
    `;
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
    });
    return button;
}

export function updateSelectedActions(state) {
    // No-op for this version, we use context menus
}

export function updateUploadButton(state) {
    // No-op, button is liquid
}
