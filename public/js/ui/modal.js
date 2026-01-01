import { createToastIcon, getFileType, clearElement, buildFileInfo } from '../utils.js';

let currentPreviewFile = null;

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = createToastIcon(type);
  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(icon);
  toast.appendChild(text);

  container.appendChild(toast);

  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
      setTimeout(() => {
        if (toast && toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, 3000);
}

// --- Preview Logic ---

export function previewFile(fileId, fileName, mimeType) {
    currentPreviewFile = { id: fileId, name: fileName, mimeType: mimeType };
    
    const modal = document.getElementById('previewModal');
    const title = document.getElementById('previewTitle');
    const content = document.getElementById('previewContent');
    
    if (title) title.textContent = fileName;
    
    const fileUrl = `/d/${fileId}`;
    const fileType = getFileType(mimeType);

    if (content) {
        clearElement(content);

        switch (fileType) {
            case 'image': {
                const img = document.createElement('img');
                img.src = fileUrl;
                img.alt = fileName;
                img.loading = 'lazy';
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.style.borderRadius = '16px';
                img.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';

                img.onerror = () => { 
                    img.style.display = 'none'; 
                    content.appendChild(buildFileInfo({ fileName, mimeType, message: 'Image load failed' })); 
                };
                content.appendChild(img);
                break;
            }
            case 'video': {
                const video = document.createElement('video');
                video.controls = true;
                video.preload = 'metadata';
                video.style.maxWidth = '100%';
                video.style.maxHeight = '100%';
                video.style.borderRadius = '16px';
                
                const source = document.createElement('source');
                source.src = fileUrl;
                source.type = mimeType;
                video.appendChild(source);
                
                content.appendChild(video);
                break;
            }
            case 'audio': {
                const audio = document.createElement('audio');
                audio.controls = true;
                audio.src = fileUrl;
                content.appendChild(audio);
                break;
            }
            default: {
                content.appendChild(buildFileInfo({
                    fileName,
                    mimeType,
                    message: 'Preview not available for this file type'
                }));
                break;
            }
        }
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
}

export function closePreview() {
    const modal = document.getElementById('previewModal');
    modal.classList.remove('active');
    setTimeout(() => modal.classList.add('hidden'), 300);
    currentPreviewFile = null;
}

export function downloadCurrentFile() {
    if (currentPreviewFile) {
        window.open(`/d/${currentPreviewFile.id}`, '_blank');
    }
}

export function copyCurrentFileLink() {
    if (currentPreviewFile) {
        const link = `${window.location.origin}/d/${currentPreviewFile.id}`;
        navigator.clipboard.writeText(link);
        showToast('Link copied to clipboard', 'success');
    }
}

// --- Auth Modals ---

export function showPasswordModal() {
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

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
    input.focus();

    window.passwordModalResolve = resolve;
    window.passwordModalReject = reject;
  });
}

export function hidePasswordModal() {
  const modal = document.getElementById('passwordModal');
  modal.classList.remove('active');
  setTimeout(() => modal.classList.add('hidden'), 300);

  if (window.passwordModalReject) {
    window.passwordModalReject();
  }
  window.passwordModalResolve = null;
  window.passwordModalReject = null;
}

export function confirmPassword() {
  const modalPasswordInput = document.getElementById('modalPasswordInput');
  if (!modalPasswordInput) return;
  const password = modalPasswordInput.value;
  if (password && window.passwordModalResolve) {
    window.passwordModalResolve(password);
  }
  // Don't hide here, let the caller handle success/failure logic or hide manually
  // But for simple flow:
  const modal = document.getElementById('passwordModal');
  modal.classList.remove('active');
  setTimeout(() => modal.classList.add('hidden'), 300);
}

export function showConfirmModal(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    if (!modal || !confirmMessage) return;
    confirmMessage.textContent = message;
    
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
    
    window.confirmModalResolve = resolve;
  });
}

export function hideConfirmModal() {
  const modal = document.getElementById('confirmModal');
  modal.classList.remove('active');
  setTimeout(() => modal.classList.add('hidden'), 300);
  if (window.confirmModalResolve) {
    window.confirmModalResolve(false);
  }
  window.confirmModalResolve = null;
}

export function confirmAction() {
  if (window.confirmModalResolve) {
    window.confirmModalResolve(true);
  }
  window.confirmModalResolve = null;
  const modal = document.getElementById('confirmModal');
  modal.classList.remove('active');
  setTimeout(() => modal.classList.add('hidden'), 300);
}