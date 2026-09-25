import { getAccessToken } from './googleAuth';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

const BACKUP_FOLDER_NAME = "DCarWash_Data_Backup";

/**
 * Find or create our specific app backup folder in Google Drive
 */
export async function getOrCreateBackupFolder(accessToken: string): Promise<string> {
  const query = encodeURIComponent(
    `name = '${BACKUP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!searchRes.ok) {
    throw new Error(`Gagal mencari folder backup: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Folder pencadangan otomatis & laporan transaksi DCarWash',
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Gagal membuat folder di Google Drive: ${createRes.statusText}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Upload or save a JSON/CSV file into Google Drive
 */
export async function uploadFileToDrive(
  fileName: string,
  content: string,
  mimeType: string,
  folderId?: string
): Promise<DriveFileItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('Silakan Masuk dengan Google terlebih dahulu.');

  const targetFolderId = folderId || (await getOrCreateBackupFolder(token));

  const metadata = {
    name: fileName,
    mimeType: mimeType,
    parents: [targetFolderId],
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,webViewLink,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload ke Google Drive gagal: ${errorText || response.statusText}`);
  }

  return await response.json();
}

/**
 * List files saved in the app's backup folder or created by the app
 */
export async function listDriveBackupFiles(): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Silakan Masuk dengan Google terlebih dahulu.');

  const folderId = await getOrCreateBackupFolder(token);
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink)&pageSize=20`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Gagal mengambil daftar file dari Google Drive: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Read the text content of a Drive file
 */
export async function downloadDriveFileContent(fileId: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('Silakan Masuk dengan Google terlebih dahulu.');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengunduh file dari Google Drive: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Delete a file from Google Drive (Requires explicit user confirmation!)
 */
export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Silakan Masuk dengan Google terlebih dahulu.');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Gagal menghapus file dari Google Drive: ${response.statusText}`);
  }
}
