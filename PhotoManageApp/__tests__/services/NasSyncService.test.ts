import NasSyncService from '../../src/services/NasSyncService';
import { NasConfig, Photo } from '../../src/types/photo';
import RNFS from 'react-native-fs';
import Exif from 'react-native-exif';
import { jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock btoa if not present (Node environment)
if (!global.btoa) {
  global.btoa = (str: string) => Buffer.from(str).toString('base64');
}

// Mock atob if not present
if (!global.atob) {
  global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}

describe('NasSyncService', () => {
  const mockConfig: NasConfig = {
    host: '192.168.1.100',
    port: 8080,
    username: 'user',
    password: 'password',
    useHttps: false,
    remotePath: '/photos',
  };

  afterEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('uploadPhoto', () => {
    const mockPhoto: Photo = {
      id: '1',
      uri: 'file:///path/to/photo.jpg',
      filename: 'photo.jpg',
      type: 'image/jpeg',
      size: 1024,
      width: 800,
      height: 600,
      timestamp: 1629876543210,
    };

    it('should upload photo correctly', async () => {
      // Setup mocks
      const mockBase64 = Buffer.from('test data').toString('base64');
      (RNFS.readFile as jest.Mock).mockResolvedValue(mockBase64);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201, // Created
      });

      const result = await NasSyncService.uploadPhoto(mockPhoto, mockConfig);

      expect(result).toBe(true);

      expect(RNFS.readFile).toHaveBeenCalledWith(mockPhoto.uri, 'base64');

      const expectedAuth = 'Basic ' + Buffer.from('user:password').toString('base64');
      const expectedUrl = 'http://192.168.1.100:8080/photos/photo.jpg';

      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
             'Authorization': expectedAuth,
             'Content-Type': 'application/octet-stream'
          }),
          // Body verification is tricky with Uint8Array in jest, checking type
          body: expect.any(Uint8Array)
        })
      );
    });

    it('should handle upload failure', async () => {
       // Setup mocks
       (RNFS.readFile as jest.Mock).mockResolvedValue('base64data');
       mockFetch.mockResolvedValue({
         ok: false,
         status: 500,
         statusText: 'Internal Server Error'
       });

       const result = await NasSyncService.uploadPhoto(mockPhoto, mockConfig);

       expect(result).toBe(false);
    });

    it('should handle network error during upload', async () => {
       (RNFS.readFile as jest.Mock).mockResolvedValue('base64data');
       mockFetch.mockRejectedValue(new Error('Network Error'));

       const result = await NasSyncService.uploadPhoto(mockPhoto, mockConfig);

       expect(result).toBe(false);
    });

    it('should construct correct URL with HTTPS and default port', async () => {
       const httpsConfig = { ...mockConfig, useHttps: true, port: undefined };
       (RNFS.readFile as jest.Mock).mockResolvedValue('base64data');
       mockFetch.mockResolvedValue({ ok: true });

       await NasSyncService.uploadPhoto(mockPhoto, httpsConfig);

       const expectedUrl = 'https://192.168.1.100:443/photos/photo.jpg';
       expect(mockFetch).toHaveBeenCalledWith(expectedUrl, expect.anything());
    });
  });

  describe('downloadPhoto', () => {
    it('should download photo correctly', async () => {
      const remotePath = '/2023/photo.jpg';

      // Setup mocks
      (RNFS.downloadFile as jest.Mock).mockReturnValue({
        promise: Promise.resolve({ statusCode: 200, bytesWritten: 1024 })
      });
      (RNFS.stat as jest.Mock).mockResolvedValue({
        size: 2048,
        mtime: new Date(),
        ctime: new Date(),
        isFile: () => true,
      });
      (Exif.getExif as jest.Mock).mockResolvedValue({
        DateTimeOriginal: '2023:01:01 12:00:00',
        Make: 'Camera',
        Model: 'Model',
      });

      const photo = await NasSyncService.downloadPhoto(remotePath, mockConfig);

      expect(photo).not.toBeNull();
      if (photo) {
        expect(photo.filename).toBe('photo.jpg');
        expect(photo.size).toBe(2048);
        expect(photo.exif?.Make).toBe('Camera');
        expect(photo.type).toBe('image/jpeg');

        // Check auth header
        const expectedAuth = 'Basic ' + Buffer.from('user:password').toString('base64');

        expect(RNFS.downloadFile).toHaveBeenCalledWith(expect.objectContaining({
          fromUrl: 'http://192.168.1.100:8080/photos/2023/photo.jpg',
          toFile: expect.stringContaining('photo.jpg'),
          headers: expect.objectContaining({
              Authorization: expectedAuth
          })
        }));
      }
    });

    it('should detect mime type correctly', async () => {
      // Setup mocks
      (RNFS.downloadFile as jest.Mock).mockReturnValue({
        promise: Promise.resolve({ statusCode: 200, bytesWritten: 1024 })
      });
      (RNFS.stat as jest.Mock).mockResolvedValue({
        size: 2048,
      });

      // Test PNG
      let photo = await NasSyncService.downloadPhoto('test.png', mockConfig);
      expect(photo?.type).toBe('image/png');

      // Test RAW
      photo = await NasSyncService.downloadPhoto('test.ARW', mockConfig);
      expect(photo?.type).toBe('image/x-raw');
    });

    it('should handle download failure', async () => {
      const remotePath = '/2023/photo.jpg';

      // Setup mocks to fail
      (RNFS.downloadFile as jest.Mock).mockReturnValue({
        promise: Promise.reject(new Error('Download failed'))
      });

      const photo = await NasSyncService.downloadPhoto(remotePath, mockConfig);

      expect(photo).toBeNull();
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await NasSyncService.testConnection(mockConfig);

      expect(result).toBe(true);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://192.168.1.100:8080/photos',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Basic ' + global.btoa('user:password'),
          }),
        })
      );
    });

    it('should handle remotePath without leading slash', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      const config = { ...mockConfig, remotePath: 'photos' };
      const result = await NasSyncService.testConnection(config);

      expect(result).toBe(true);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://192.168.1.100:8080/photos',
        expect.anything()
      );
    });

    it('should return false when connection fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await NasSyncService.testConnection(mockConfig);

      expect(result).toBe(false);
    });

    it('should return false when fetch throws an error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await NasSyncService.testConnection(mockConfig);

      expect(result).toBe(false);
    });
  });

  describe('getLastSyncTime', () => {
    it('should return the last sync time when it exists', async () => {
      const mockTimestamp = 1629876543210;
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockTimestamp.toString());

      const result = await NasSyncService.getLastSyncTime();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@photo_manage_sync_status');
      expect(result).toEqual(new Date(mockTimestamp));
    });

    it('should return null when no sync time exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await NasSyncService.getLastSyncTime();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@photo_manage_sync_status');
      expect(result).toBeNull();
    });

    it('should return null when there is an error retrieving the sync time', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('AsyncStorage error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await NasSyncService.getLastSyncTime();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@photo_manage_sync_status');
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting last sync time:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('setLastSyncTime', () => {
    it('should store the sync timestamp correctly', async () => {
      const mockTimestamp = 1629876543210;
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await NasSyncService.setLastSyncTime(mockTimestamp);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_sync_status',
        mockTimestamp.toString()
      );

      consoleLogSpy.mockRestore();
    });

    it('should log an error when storing the sync time fails', async () => {
      const mockTimestamp = 1629876543210;
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('AsyncStorage error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await NasSyncService.setLastSyncTime(mockTimestamp);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_sync_status',
        mockTimestamp.toString()
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error setting last sync time:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });
});
