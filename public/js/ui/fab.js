export function initDraggableFAB() {
  const fab = document.getElementById('fab-container');
  const mainBtn = document.getElementById('fab-main');
  if (!fab || !mainBtn) return;

  let isPointerDown = false;
  let isDragging = false;
  let hasMoved = false;
  let startX;
  let startY;
  let initialLeft;
  let initialTop;

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

      fab.style.transition = 'none';
      fab.style.bottom = 'auto';
      fab.style.right = 'auto';
      fab.style.left = `${initialLeft}px`;
      fab.style.top = `${initialTop}px`;
    }

    if (!isDragging) return;

    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

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
      fab.classList.toggle('active');
    } else {
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

  document.addEventListener('click', (e) => {
    if (!fab.contains(e.target) && fab.classList.contains('active')) {
      fab.classList.remove('active');
    }
  });
}
