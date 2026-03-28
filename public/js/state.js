// Simple Publisher-Subscriber for Reactive State
const listeners = new Map();

export function subscribe(key, callback) {
    if (!listeners.has(key)) {
        listeners.set(key, []);
    }
    listeners.get(key).push(callback);
}

function notify(key, value) {
    if (listeners.has(key)) {
        listeners.get(key).forEach(cb => cb(value));
    }
}

// Global State Object
const rawState = {
    authManager: null,
    fileQueue: [],
    isUploading: false,
    uploadPassword: null,
    nextPageToken: null,
    allFiles: [],
    filteredFiles: [],
    selectedFiles: new Set(),
};

// Reactive Proxy
// Note: Arrays must be updated via assignment (e.g. state.allFiles = [...state.allFiles, ...new]) to trigger reactivity
export const state = new Proxy(rawState, {
    set(target, key, value) {
        target[key] = value;
        notify(key, value);
        return true;
    }
});

export function resetAdminState() {
    state.allFiles = [];
    state.filteredFiles = [];
    state.selectedFiles = new Set();
    state.nextPageToken = null;
}
