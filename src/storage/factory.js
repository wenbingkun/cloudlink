import { GoogleDriveProvider } from './providers/google-drive/index.js';

let cachedProvider = null;
let cachedType = null;

export async function getStorageProvider(env) {
  const providerType = (env.STORAGE_PROVIDER || 'google-drive').toLowerCase();

  if (cachedProvider && cachedType === providerType) {
    return cachedProvider;
  }

  let provider;
  switch (providerType) {
    case 'google-drive':
      provider = new GoogleDriveProvider(env);
      break;
    default:
      throw new Error(`Unsupported storage provider: ${providerType}`);
  }

  await provider.init();
  cachedProvider = provider;
  cachedType = providerType;
  return provider;
}
