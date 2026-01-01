export function initLiquidDock(callbacks) {
    const uploadTrigger = document.getElementById('upload-trigger');
    if (!uploadTrigger) return;

    uploadTrigger.addEventListener('click', callbacks.toggleUploadPanel);
    
    // Add micro-interactions for the liquid dock if needed
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