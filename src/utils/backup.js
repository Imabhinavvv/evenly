import JSZip from 'jszip';
import { Capacitor } from '@capacitor/core';

/**
 * Creates a compressed .evenly backup archive containing manifest.json and data.json.
 * 
 * @param {Object} appData - Application state { roommates, expenses, history }
 * @param {string} [customName] - Optional custom name prefix
 * @returns {Promise<{ success: boolean, fileName: string, uri?: string }>}
 */
export async function createBackup(appData = {}, customName = null) {
  const zip = new JSZip();

  const roommates = Array.isArray(appData.roommates) ? appData.roommates : [];
  const expenses = Array.isArray(appData.expenses) ? appData.expenses : [];
  const history = Array.isArray(appData.history) ? appData.history : [];
  const groups = Array.isArray(appData.groups) ? appData.groups : [];
  const activeGroupId = appData.activeGroupId || (groups[0]?.id || null);

  // 1. Add manifest for file verification and authenticity
  const manifest = {
    app: 'evenly',
    version: 1,
    timestamp: new Date().toISOString(),
    meta: {
      groupsCount: groups.length,
      roommatesCount: roommates.length,
      expensesCount: expenses.length,
      historyCount: history.length,
    },
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 2. Add complete application data
  const data = {
    groups,
    activeGroupId,
    roommates,
    expenses,
    history,
    exportedAt: new Date().toISOString(),
  };
  zip.file('data.json', JSON.stringify(data, null, 2));

  // 3. Generate filename
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const baseName = customName
    ? customName.toLowerCase().replace(/[^a-z0-9_-]+/g, '_')
    : `backup_${dateStr}_${timeStr}`;
  const fileName = `evenly_${baseName}.evenly`;

  // 4. Save directly to device storage without prompting share
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    // Generate Base64 for native filesystem
    const base64Zip = await zip.generateAsync({
      type: 'base64',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    let savedUri = null;
    let savedLocation = `Documents/Evenly/${fileName}`;

    try {
      const res = await Filesystem.writeFile({
        path: `Evenly/${fileName}`,
        data: base64Zip,
        directory: Directory.Documents,
        recursive: true,
      });
      savedUri = res.uri;
    } catch (docErr) {
      console.warn('Could not save to Directory.Documents, saving to Directory.Data:', docErr);
      const res = await Filesystem.writeFile({
        path: fileName,
        data: base64Zip,
        directory: Directory.Data,
      });
      savedUri = res.uri;
      savedLocation = `Device Storage/${fileName}`;
    }

    return {
      success: true,
      fileName,
      uri: savedUri,
      savedLocation,
    };
  } else {
    // Web / browser download
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      fileName,
    };
  }
}

/**
 * Validates and extracts an archive from a raw JSZip source (Base64 string or ArrayBuffer).
 *
 * @param {string|ArrayBuffer} zipSource
 * @param {Object} [options]
 * @returns {Promise<{ manifest: Object, data: { roommates: Array, expenses: Array, history: Array } }>}
 */
export async function parseAndValidateBackup(zipSource, options = {}) {
  const zip = await JSZip.loadAsync(zipSource, options);

  // 1. Verify manifest.json exists
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('Invalid backup archive: missing manifest.json.');
  }

  let manifest;
  try {
    const manifestText = await manifestFile.async('text');
    manifest = JSON.parse(manifestText);
  } catch {
    throw new Error('Corrupted backup archive: manifest.json is not valid JSON.');
  }

  // 2. Validate app identity
  if (!manifest || manifest.app !== 'evenly') {
    const foreignApp = manifest?.app ? `"${manifest.app}"` : 'an unknown application';
    throw new Error(`Incompatible backup: file was created by ${foreignApp}, not Evenly.`);
  }

  // 3. Extract and parse data.json
  const dataFile = zip.file('data.json');
  if (!dataFile) {
    throw new Error('Invalid backup archive: missing data.json.');
  }

  let data;
  try {
    const dataText = await dataFile.async('text');
    data = JSON.parse(dataText);
  } catch {
    throw new Error('Corrupted backup data: data.json is not valid JSON.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup data structure.');
  }

  return {
    manifest,
    data: {
      groups: Array.isArray(data.groups) ? data.groups : [],
      activeGroupId: data.activeGroupId || null,
      roommates: Array.isArray(data.roommates) ? data.roommates : [],
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
      history: Array.isArray(data.history) ? data.history : [],
    },
  };
}

/**
 * Extracts a backup from a native content:// or file:// URI.
 *
 * @param {string} fileUri
 * @returns {Promise<{ manifest: Object, data: Object }>}
 */
export async function extractBackupFromUri(fileUri) {
  const { Filesystem } = await import('@capacitor/filesystem');
  const fileResult = await Filesystem.readFile({
    path: fileUri,
  });

  return await parseAndValidateBackup(fileResult.data, { base64: true });
}

/**
 * Extracts a backup from a DOM File object (e.g. from an <input type="file" />).
 *
 * @param {File} file
 * @returns {Promise<{ manifest: Object, data: Object }>}
 */
export async function extractBackupFromFile(file) {
  const buffer = await file.arrayBuffer();
  return await parseAndValidateBackup(buffer);
}

/**
 * Initializes the Capacitor App listener for incoming file intents (appUrlOpen)
 * and checks for cold start launch URLs.
 *
 * @param {function(backupPayload: { manifest: Object, data: Object }|null, fileUri: string, error?: Error): void} onBackupReceived
 * @returns {function(): void} Cleanup function to unsubscribe listeners
 */
export function initBackupExtractor(onBackupReceived) {
  let isCleanedUp = false;
  let listenerHandle = null;

  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  import('@capacitor/app').then(async ({ App }) => {
    if (isCleanedUp) return;

    // 1. Cold start check: was the app launched from a file tap while closed?
    try {
      const launchUrl = await App.getLaunchUrl();
      if (launchUrl && launchUrl.url) {
        await handleIncomingUri(launchUrl.url, onBackupReceived);
      }
    } catch (launchErr) {
      console.warn('Error reading launch URL on startup:', launchErr);
    }

    // 2. Active / background app handling: app is running and receives a file intent
    try {
      listenerHandle = await App.addListener('appUrlOpen', async (event) => {
        if (event && event.url) {
          await handleIncomingUri(event.url, onBackupReceived);
        }
      });
    } catch (listenErr) {
      console.warn('Error adding appUrlOpen listener:', listenErr);
    }
  });

  return () => {
    isCleanedUp = true;
    if (listenerHandle && typeof listenerHandle.remove === 'function') {
      listenerHandle.remove();
    }
  };
}

async function handleIncomingUri(fileUri, callback) {
  try {
    const backup = await extractBackupFromUri(fileUri);
    if (typeof callback === 'function') {
      callback(backup, fileUri);
    }
  } catch (err) {
    console.error('Failed to extract incoming backup file:', err);
    if (typeof callback === 'function') {
      callback(null, fileUri, err);
    }
  }
}
