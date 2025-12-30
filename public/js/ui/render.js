import { createFileTypeIcon, formatFileSize } from '../utils.js';

export function renderFileQueue(state, callbacks) {
  const container = document.getElementById('fileQueue');
  if (!container) return;

  if (state.fileQueue.length === 0) {
    container.replaceChildren();
    if (callbacks.updateUploadButton) callbacks.updateUploadButton();
    return;
  }

  const fragment = document.createDocumentFragment();
  state.fileQueue.forEach((fileObj) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.dataset.fileId = fileObj.id;

    const iconDiv = document.createElement('div');
    iconDiv.className = 'file-item-icon';
    iconDiv.appendChild(createFileTypeIcon(fileObj.file.type));
    item.appendChild(iconDiv);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'file-item-info';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'file-name';
    nameDiv.textContent = fileObj.name;
    infoDiv.appendChild(nameDiv);

    const metaDiv = document.createElement('div');
    metaDiv.className = 'file-meta';

    const sizeSpan = document.createElement('span');
    sizeSpan.textContent = formatFileSize(fileObj.size);
    metaDiv.appendChild(sizeSpan);

    const statusSpan = document.createElement('span');
    statusSpan.textContent = callbacks.getStatusText(fileObj);
    metaDiv.appendChild(statusSpan);
    infoDiv.appendChild(metaDiv);

    if (fileObj.status === 'uploading' || fileObj.status === 'paused') {
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressFill.style.width = `${fileObj.progress}%`;
      progressBar.appendChild(progressFill);
      infoDiv.appendChild(progressBar);
    }
    item.appendChild(infoDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'file-item-actions';

    if (fileObj.status === 'pending') {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.textContent = '移除';
      btn.onclick = () => callbacks.removeFromQueue(fileObj.id);
      actionsDiv.appendChild(btn);
    } else if (fileObj.status === 'uploading' || fileObj.status === 'paused') {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.textContent = fileObj.isPaused ? '继续' : '暂停';
      btn.onclick = () => callbacks.togglePause(fileObj.id);
      actionsDiv.appendChild(btn);
    } else if (fileObj.status === 'success') {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.textContent = '复制链接';
      btn.onclick = () => callbacks.copyToClipboard(fileObj.downloadUrl);
      actionsDiv.appendChild(btn);
    }
    item.appendChild(actionsDiv);

    if (fileObj.status === 'success' && fileObj.downloadUrl) {
      const successDiv = document.createElement('div');
      successDiv.className = 'success-info';
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'download-link-input';
      input.value = fileObj.downloadUrl;
      input.readOnly = true;
      successDiv.appendChild(input);
      item.appendChild(successDiv);
    }

    if (fileObj.status === 'error' && fileObj.error) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'file-error';
      errorDiv.textContent = fileObj.error;
      item.appendChild(errorDiv);
    }

    fragment.appendChild(item);
  });

  container.replaceChildren(fragment);
}

export function updateUploadButton(state) {
  const uploadControls = document.getElementById('uploadControls');
  const uploadBtn = document.getElementById('uploadBtn');
  if (!uploadControls || !uploadBtn) return;

  const pendingCount = state.fileQueue.filter((f) => f.status === 'pending').length;

  uploadControls.style.display = state.fileQueue.length > 0 ? 'flex' : 'none';
  uploadBtn.disabled = pendingCount === 0 || state.isUploading;
  uploadBtn.textContent = state.isUploading ? '上传中...' : `开始上传 (${pendingCount})`;
}

export function renderFiles(state, callbacks) {
  const grid = document.getElementById('filesGrid');
  if (!grid) return;

  const fragment = document.createDocumentFragment();

  state.filteredFiles.forEach((file) => {
    const card = document.createElement('div');
    card.className = `file-card ${state.selectedFiles.has(file.id) ? 'selected' : ''}`;
    card.dataset.fileId = file.id;
    card.onclick = () => callbacks.toggleSelect(file.id);

    const iconDiv = document.createElement('div');
    iconDiv.className = 'file-card-icon';
    iconDiv.appendChild(createFileTypeIcon(file.mimeType));
    card.appendChild(iconDiv);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'file-card-info';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'file-card-name';
    nameDiv.textContent = file.name;
    infoDiv.appendChild(nameDiv);

    const metaDiv = document.createElement('div');
    metaDiv.className = 'file-card-meta';

    const sizeSpan = document.createElement('span');
    sizeSpan.textContent = formatFileSize(file.size);
    metaDiv.appendChild(sizeSpan);

    const dateSpan = document.createElement('span');
    dateSpan.textContent = new Date(file.createdTime).toLocaleDateString();
    metaDiv.appendChild(dateSpan);

    infoDiv.appendChild(metaDiv);
    card.appendChild(infoDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'file-card-actions';

    const previewBtn = document.createElement('button');
    previewBtn.className = 'btn-secondary';
    previewBtn.textContent = '预览';
    previewBtn.onclick = (e) => {
      e.stopPropagation();
      callbacks.previewFile(file.id, file.name, file.mimeType);
    };
    actionsDiv.appendChild(previewBtn);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-secondary';
    copyBtn.textContent = '复制';
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      callbacks.copyToClipboard(`${window.location.origin}/d/${file.id}`);
    };
    actionsDiv.appendChild(copyBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-secondary';
    deleteBtn.textContent = '删除';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      callbacks.deleteSingleFile(file.id);
    };
    actionsDiv.appendChild(deleteBtn);

    card.appendChild(actionsDiv);
    fragment.appendChild(card);
  });

  grid.replaceChildren(fragment);
  callbacks.updateSelectedActions();
}

export function updateSelectedActions(state) {
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  if (!deleteSelectedBtn) return;

  if (state.selectedFiles.size > 0) {
    deleteSelectedBtn.style.display = 'inline-flex';
    deleteSelectedBtn.textContent = `删除选中 (${state.selectedFiles.size})`;
  } else {
    deleteSelectedBtn.style.display = 'none';
  }
}
