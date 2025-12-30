export function initGlobalDrag({ addFilesToQueue, switchToUpload }) {
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
    e.preventDefault();
  });

  window.addEventListener('drop', (e) => {
    if (!isFileDragEvent(e)) return;
    e.preventDefault();
    dragCounter = 0;
    isFileDrag = false;
    document.body.classList.remove('drag-active');

    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
      switchToUpload();
    }
  });
}
