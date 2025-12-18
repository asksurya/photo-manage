import AsyncStorage from '@react-native-async-storage/async-storage';
import { Photo, NasConfig } from '../types/photo';
import RNFS from 'react-native-fs';
import Exif from 'react-native-exif';

class NasSyncService {
  private static SYNC_STATUS_KEY = '@photo_manage_sync_status';

  /**
   * Test NAS connection
   */
  static async testConnection(config: NasConfig): Promise<boolean> {
    try {
      const { host, port, username, password, useHttps, remotePath } = config;

      if (!host || !username || !password) {
        return false;
      }

      const protocol = useHttps ? 'https' : 'http';
      const actualPort = port || (useHttps ? 443 : 80);

      let path = remotePath || '/';
      if (!path.startsWith('/')) {
        path = `/${path}`;
      }

      const url = `${protocol}://${host}:${actualPort}${path}`;

      const credentials = btoa(`${username}:${password}`);

      console.log(`Testing connection to ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${credentials}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('NAS connection test failed:', error);
      return false;
    }
  }

  /**
   * Helper to encode base64
   */
  private static btoa(input: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = input;
    let output = '';

    for (let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || (map = '=', i % 1);
    output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
      charCode = str.charCodeAt(i += 3 / 4);
      if (charCode > 0xFF) {
        throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  }

  /**
   * Upload photo to NAS
   */
  static async uploadPhoto(photo: Photo, config: NasConfig): Promise<boolean> {
    try {
      // 1. Read the file from local storage using RNFS
      const path = photo.uri.startsWith('file://') ? photo.uri.substring(7) : photo.uri;
      const fileContentBase64 = await RNFS.readFile(path, 'base64');

      // Helper to convert base64 to Uint8Array
      const base64ToUint8Array = (base64: string): Uint8Array => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let str = base64.replace(/=+$/, '');
        let output = '';

        if (str.length % 4 == 1) {
          throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
        }
        for (let bc = 0, bs = 0, buffer, i = 0;
          buffer = str.charAt(i++);
        ) {
          buffer = chars.indexOf(buffer);
          if (~buffer) {
            bs = bc % 4 ? bs * 64 + buffer : buffer;
            if (bc++ % 4) output += String.fromCharCode(255 & bs >> (-2 * bc & 6));
          }
        }

        const len = output.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = output.charCodeAt(i);
        }
        return bytes;
      };

      // Use global atob if available
      const body = typeof global.atob === 'function'
        ? Uint8Array.from(global.atob(fileContentBase64), c => c.charCodeAt(0))
        : base64ToUint8Array(fileContentBase64);

      // 2. Upload via HTTP to NAS endpoint
      const uploadUrl = `${config.useHttps ? 'https' : 'http'}://${config.host}:${config.port || 80}${config.remotePath || '/photos'}/${photo.filename}`;

      console.log(`Uploading ${photo.filename} to ${uploadUrl}`);

      const headers: { [key: string]: string } = {
        'Content-Type': 'application/octet-stream',
        'Content-Length': body.byteLength.toString(),
      };

      // 3. Handle authentication
      if (config.username && config.password) {
        const credentials = `${config.username}:${config.password}`;
        const base64Auth = typeof global.btoa === 'function'
          ? global.btoa(credentials)
          : this.btoa(credentials);
        headers['Authorization'] = `Basic ${base64Auth}`;
      }

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: headers,
        body: body,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('NAS upload failed:', error);
      return false;
    }
  }

  /**
   * Download photo from NAS
   */
  static async downloadPhoto(remotePath: string, config: NasConfig): Promise<Photo | null> {
    try {
      console.log(`Downloading from ${remotePath}`);

      // 1. Construct URL
      const basePath = config.remotePath || '';
      // Ensure no double slashes
      const pathPart = `${basePath.replace(/\/$/, '')}/${remotePath.replace(/^\//, '')}`;

      const downloadUrl = `${config.useHttps ? 'https' : 'http'}://${config.host}:${config.port || 80}${pathPart}`;

      // 2. Define local path
      const filename = remotePath.split('/').pop() || 'downloaded_photo.jpg';
      const localDir = `${RNFS.DocumentDirectoryPath}/downloaded`;
      const localPath = `${localDir}/${filename}`;

      // Ensure directory exists
      if (!(await RNFS.exists(localDir))) {
        await RNFS.mkdir(localDir);
      }

      // Prepare headers
      const headers: { [key: string]: string } = {};
      if (config.username && config.password) {
        const credentials = `${config.username}:${config.password}`;
        // Note: Buffer is not available in RN by default, often used with 'buffer' package or btoa
        // Using a simpler approach if Buffer is not available or assume 'buffer' polyfill
        // But since this is TS and RN environment, let's use a simple base64 helper if possible or assume Buffer is available via polyfill
        // If not, we can use a custom function.
        // For this environment, let's assume we can use a basic base64 implementation.
        // Actually, RN often provides 'btoa' or we can import 'buffer'.
        // Since I don't want to add dependencies, I will check if btoa is available or implement simple one.
        // However, 'react-native' exposes 'btoa' on global in newer versions.

        // Let's implement a simple base64 encoder to be safe if Buffer is missing
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        const btoa = (input: string) => {
          let str = input;
          let output = '';

          for (let block = 0, charCode, i = 0, map = chars;
          str.charAt(i | 0) || (map = '=', i % 1);
          output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
            charCode = str.charCodeAt(i += 3 / 4);
            if (charCode > 0xFF) {
              throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
            }
            block = block << 8 | charCode;
          }

          return output;
        };

        // Try to use global btoa if available
        const base64 = typeof global.btoa === 'function' ? global.btoa(credentials) : btoa(credentials);
        headers['Authorization'] = `Basic ${base64}`;
      }

      // 3. Download file
      const downloadResult = await RNFS.downloadFile({
        fromUrl: downloadUrl,
        toFile: localPath,
        headers: headers,
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error(`Download failed with status code: ${downloadResult.statusCode}`);
      }

      // 4. Get file stats
      const stats = await RNFS.stat(localPath);

      // 5. Extract Exif
      let exifData;
      try {
        exifData = await Exif.getExif(localPath);
      } catch (exifError) {
        console.warn('Failed to extract EXIF from downloaded file:', exifError);
      }

      // Determine mime type
      const ext = filename.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg';
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'heic') mimeType = 'image/heic';
      else if (['raw', 'arw', 'cr2', 'nef', 'dng'].includes(ext || '')) mimeType = 'image/x-raw';

      // 6. Create Photo object
      const photo: Photo = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        uri: `file://${localPath}`,
        filename: filename,
        type: mimeType,
        size: stats.size,
        width: 0, // Would need image size library or EXIF
        height: 0,
        timestamp: exifData?.DateTimeOriginal
          ? new Date(exifData.DateTimeOriginal.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')).getTime()
          : Date.now(),
        exif: exifData,
      };

      return photo;

    } catch (error) {
      console.error('NAS download failed:', error);
      return null;
    }
  }

  /**
   * Sync all local photos to NAS
   */
  static async syncToNas(photos: Photo[], config: NasConfig): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    for (const photo of photos) {
      try {
        const uploaded = await this.uploadPhoto(photo, config);
        if (uploaded) {
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to sync photo ${photo.filename}:`, error);
        failed++;
      }
    }

    return { successful, failed };
  }

  /**
   * Get last sync timestamp
   */
  static async getLastSyncTime(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      if (timestamp) {
        const parsed = parseInt(timestamp, 10);
        if (!isNaN(parsed)) {
          return new Date(parsed);
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Set last sync timestamp
   */
  static async setLastSyncTime(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SYNC_STATUS_KEY, timestamp.toString());
      console.log(`Last sync time updated to: ${new Date(timestamp).toISOString()}`);
    } catch (error) {
      console.error('Error setting last sync time:', error);
    }
  }

  /**
   * Foundation for WebDAV/SMB sync protocols
   * These would require additional native modules
   */
  static async initializeWebDavClient(_config: NasConfig): Promise<any> {
    // Future implementation for WebDAV sync
    return null;
  }

  static async initializeSmbClient(_config: NasConfig): Promise<any> {
    // Future implementation for SMB sync
    return null;
  }
}

export default NasSyncService;
