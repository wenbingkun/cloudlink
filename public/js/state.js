export const state = {
  authManager: null,
  fileQueue: [],
  isUploading: false,
  uploadPassword: null,
  nextPageToken: null,
  allFiles: [],
  filteredFiles: [],
  selectedFiles: new Set(),
};

export function resetAdminState() {
  state.allFiles = [];
  state.filteredFiles = [];
  state.selectedFiles.clear();
  state.nextPageToken = null;
}
