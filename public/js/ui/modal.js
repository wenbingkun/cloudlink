import { createToastIcon } from '../utils.js';

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

    modal.style.display = 'flex';
    input.focus();

    window.passwordModalResolve = resolve;
    window.passwordModalReject = reject;
  });
}

export function hidePasswordModal() {
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

export function confirmPassword() {
  const modalPasswordInput = document.getElementById('modalPasswordInput');
  if (!modalPasswordInput) return;
  const password = modalPasswordInput.value;
  if (password && window.passwordModalResolve) {
    window.passwordModalResolve(password);
  }
  hidePasswordModal();
}

export function showConfirmModal(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    if (!modal || !confirmMessage) return;
    confirmMessage.textContent = message;
    modal.style.display = 'flex';
    window.confirmModalResolve = resolve;
  });
}

export function hideConfirmModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

export function confirmAction() {
  if (window.confirmModalResolve) {
    window.confirmModalResolve(true);
  }
  hideConfirmModal();
}
