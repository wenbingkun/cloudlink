export function initLiquidDock(callbacks) {
    const uploadTrigger = document.getElementById('upload-trigger');
    const fileInput = document.getElementById('file-input');
    if (!uploadTrigger || !fileInput) return;

    // Click to open file picker directly
    uploadTrigger.addEventListener('click', () => {
        fileInput.click();
    });

    // Add micro-interactions for the liquid dock
    uploadTrigger.addEventListener('pointerdown', () => {
        uploadTrigger.style.transform = 'scale(0.9)';
    });

    uploadTrigger.addEventListener('pointerup', () => {
        uploadTrigger.style.transform = 'scale(1.1)';
        setTimeout(() => {
            uploadTrigger.style.transform = '';
        }, 200);
    });
}
