export function initGlobalDrag(callbacks) {
    const { addFilesToQueue, toggleUploadPanel } = callbacks;
    const uploadPanel = document.getElementById('upload-panel');
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        document.body.classList.add('drag-active');
    });

    window.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            document.body.classList.remove('drag-active');
        }
    });

    window.addEventListener('dragover', (e) => e.preventDefault());

    window.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        document.body.classList.remove('drag-active');

        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
            // Ensure upload panel is open
            if (uploadPanel && !uploadPanel.classList.contains('active')) {
                toggleUploadPanel();
            }
            addFilesToQueue(Array.from(e.dataTransfer.files));
        }
    });
}