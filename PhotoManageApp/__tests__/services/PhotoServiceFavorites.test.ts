import PhotoService from '../../src/services/PhotoService';
import { Photo } from '../../src/types/photo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('react-native-fs', () => ({
  exists: jest.fn(),
  unlink: jest.fn(),
  moveFile: jest.fn(),
  copyFile: jest.fn(),
}));

jest.mock('react-native-exif', () => ({
  getExif: jest.fn(),
}));

describe('PhotoService Favorites', () => {
  const mockPhotos: Photo[] = [
    {
      id: 'photo1',
      uri: 'file://photo1.jpg',
      filename: 'photo1.jpg',
      type: 'image/jpeg',
      size: 1000,
      timestamp: 1000,
      isFavorite: false,
    },
    {
      id: 'photo2',
      uri: 'file://photo2.jpg',
      filename: 'photo2.jpg',
      type: 'image/jpeg',
      size: 2000,
      timestamp: 2000,
      isFavorite: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockPhotos));
  });

  it('should toggle favorite status from false to true', async () => {
    const result = await PhotoService.toggleFavorite('photo1');

    expect(result).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@photo_manage_photos',
      expect.stringContaining('"id":"photo1",', )
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_photos',
        expect.stringContaining('"isFavorite":true')
      );
  });

  it('should toggle favorite status from true to false', async () => {
    const result = await PhotoService.toggleFavorite('photo2');

    expect(result).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@photo_manage_photos',
      expect.stringContaining('"id":"photo2"')
    );
     expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_photos',
        expect.stringContaining('"isFavorite":false')
      );
  });

  it('should get favorite photos', async () => {
    const favorites = await PhotoService.getFavoritePhotos();

    expect(favorites.length).toBe(1);
    expect(favorites[0].id).toBe('photo2');
  });

  it('should return empty list if no favorites', async () => {
    const noFavs = mockPhotos.map(p => ({ ...p, isFavorite: false }));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(noFavs));

    const favorites = await PhotoService.getFavoritePhotos();
    expect(favorites.length).toBe(0);
  });
});
