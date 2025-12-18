import NasSyncService from '../../src/services/NasSyncService';
import { NasConfig } from '../../src/types/photo';
import { jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock btoa if not present (Node environment)
if (!global.btoa) {
  global.btoa = (str: string) => Buffer.from(str).toString('base64');
}

// Mock AsyncStorage - already mocked in setup but good to be explicit if overriding
// However, since we are merging, we should ensure we don't double mock or conflict.
// The origin/main change added tests for getLastSyncTime and setLastSyncTime which use AsyncStorage.
// My changes added tests for testConnection which use fetch.
// I will combine them.

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
