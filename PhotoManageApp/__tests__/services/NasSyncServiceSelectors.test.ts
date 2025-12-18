import NasSyncService from '../../src/services/NasSyncService';
import { Photo, NasConfig } from '../../src/types/photo';

// Mock dependencies
jest.mock('react-native-fs', () => ({}));
jest.mock('react-native-exif', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));

describe('NasSyncService Selectors', () => {
  const mockPhotos: Photo[] = [
    {
      id: '1',
      uri: 'uri1',
      filename: 'photo1.jpg',
      type: 'image/jpeg',
      size: 1000,
      timestamp: 1000,
      isFavorite: false,
    },
    {
      id: '2',
      uri: 'uri2',
      filename: 'photo2.jpg',
      type: 'image/jpeg',
      size: 2000,
      timestamp: 2000,
      isFavorite: true,
    },
  ];

  const mockConfig: NasConfig = {
    host: '192.168.1.100',
    username: 'user',
    password: 'pass',
  };

  beforeEach(() => {
    // Mock uploadPhoto to always return true
    jest.spyOn(NasSyncService, 'uploadPhoto').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should sync all photos when syncFavoritesOnly is false', async () => {
    const config = { ...mockConfig, syncFavoritesOnly: false };
    const result = await NasSyncService.syncToNas(mockPhotos, config);

    expect(result.successful).toBe(2);
    expect(NasSyncService.uploadPhoto).toHaveBeenCalledTimes(2);
  });

  it('should sync only favorite photos when syncFavoritesOnly is true', async () => {
    const config = { ...mockConfig, syncFavoritesOnly: true };
    const result = await NasSyncService.syncToNas(mockPhotos, config);

    expect(result.successful).toBe(1);
    expect(NasSyncService.uploadPhoto).toHaveBeenCalledTimes(1);
    expect(NasSyncService.uploadPhoto).toHaveBeenCalledWith(mockPhotos[1], config);
  });
});
