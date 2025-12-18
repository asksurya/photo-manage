import NasSyncService from '../../src/services/NasSyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('NasSyncService', () => {
  afterEach(() => {
    jest.clearAllMocks();
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
