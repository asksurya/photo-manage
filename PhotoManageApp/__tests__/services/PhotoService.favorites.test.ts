import AsyncStorage from '@react-native-async-storage/async-storage';
import PhotoService from '../../src/services/PhotoService';
import { Photo } from '../../src/types/photo';

describe('PhotoService Favorites', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  describe('toggleFavorite', () => {
    it('should toggle a photo from not favorite to favorite', async () => {
      const mockPhotos: Photo[] = [
        { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg', type: 'image/jpeg', size: 1000, timestamp: Date.now(), isFavorite: false },
        { id: '2', uri: 'file:///photo2.jpg', filename: 'photo2.jpg', type: 'image/jpeg', size: 2000, timestamp: Date.now(), isFavorite: false },
      ];
      await PhotoService.savePhotos(mockPhotos);

      const result = await PhotoService.toggleFavorite('1');

      expect(result).not.toBeNull();
      expect(result?.isFavorite).toBe(true);

      const photos = await PhotoService.loadPhotos();
      expect(photos.find(p => p.id === '1')?.isFavorite).toBe(true);
      expect(photos.find(p => p.id === '2')?.isFavorite).toBe(false);
    });

    it('should toggle a photo from favorite to not favorite', async () => {
      const mockPhotos: Photo[] = [
        { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg', type: 'image/jpeg', size: 1000, timestamp: Date.now(), isFavorite: true },
      ];
      await PhotoService.savePhotos(mockPhotos);

      const result = await PhotoService.toggleFavorite('1');

      expect(result).not.toBeNull();
      expect(result?.isFavorite).toBe(false);

      const photos = await PhotoService.loadPhotos();
      expect(photos.find(p => p.id === '1')?.isFavorite).toBe(false);
    });

    it('should return null for non-existent photo', async () => {
      const mockPhotos: Photo[] = [
        { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg', type: 'image/jpeg', size: 1000, timestamp: Date.now() },
      ];
      await PhotoService.savePhotos(mockPhotos);

      const result = await PhotoService.toggleFavorite('non-existent');

      expect(result).toBeNull();
    });

    it('should handle photo without isFavorite field (undefined)', async () => {
      const mockPhotos: Photo[] = [
        { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg', type: 'image/jpeg', size: 1000, timestamp: Date.now() },
      ];
      await PhotoService.savePhotos(mockPhotos);

      const result = await PhotoService.toggleFavorite('1');

      expect(result).not.toBeNull();
      expect(result?.isFavorite).toBe(true);
    });
  });

  describe('getFavorites', () => {
    it('should return only favorited photos', async () => {
      const mockPhotos: Photo[] = [
        { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg', type: 'image/jpeg', size: 1000, timestamp: Date.now(), isFavorite: true },
        { id: '2', uri: 'file:///photo2.jpg', filename: 'photo2.jpg', type: 'image/jpeg', size: 2000, timestamp: Date.now(), isFavorite: false },
        { id: '3', uri: 'file:///photo3.jpg', filename: 'photo3.jpg', type: 'image/jpeg', size: 3000, timestamp: Date.now(), isFavorite: true },
      ];
      await PhotoService.savePhotos(mockPhotos);

      const favorites = await PhotoService.getFavorites();

      expect(favorites.length).toBe(2);
      expect(favorites.map(p => p.id)).toEqual(['1', '3']);
    });

    it('should return empty array when no photos are favorited', async () => {
      const mockPhotos: Photo[] = [
        { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg', type: 'image/jpeg', size: 1000, timestamp: Date.now(), isFavorite: false },
        { id: '2', uri: 'file:///photo2.jpg', filename: 'photo2.jpg', type: 'image/jpeg', size: 2000, timestamp: Date.now() },
      ];
      await PhotoService.savePhotos(mockPhotos);

      const favorites = await PhotoService.getFavorites();

      expect(favorites.length).toBe(0);
    });

    it('should return empty array when no photos exist', async () => {
      const favorites = await PhotoService.getFavorites();

      expect(favorites.length).toBe(0);
    });
  });

  describe('setFavorite', () => {
    it('should set a photo as favorite', async () => {
      const mockPhotos: Photo[] = [
        { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg', type: 'image/jpeg', size: 1000, timestamp: Date.now(), isFavorite: false },
      ];
      await PhotoService.savePhotos(mockPhotos);

      const result = await PhotoService.setFavorite('1', true);

      expect(result).not.toBeNull();
      expect(result?.isFavorite).toBe(true);

      const photos = await PhotoService.loadPhotos();
      expect(photos.find(p => p.id === '1')?.isFavorite).toBe(true);
    });

    it('should unset a photo as favorite', async () => {
      const mockPhotos: Photo[] = [
        { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg', type: 'image/jpeg', size: 1000, timestamp: Date.now(), isFavorite: true },
      ];
      await PhotoService.savePhotos(mockPhotos);

      const result = await PhotoService.setFavorite('1', false);

      expect(result).not.toBeNull();
      expect(result?.isFavorite).toBe(false);

      const photos = await PhotoService.loadPhotos();
      expect(photos.find(p => p.id === '1')?.isFavorite).toBe(false);
    });

    it('should return null for non-existent photo', async () => {
      const mockPhotos: Photo[] = [
        { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg', type: 'image/jpeg', size: 1000, timestamp: Date.now() },
      ];
      await PhotoService.savePhotos(mockPhotos);

      const result = await PhotoService.setFavorite('non-existent', true);

      expect(result).toBeNull();
    });

    it('should not affect other photos when setting favorite', async () => {
      const mockPhotos: Photo[] = [
        { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg', type: 'image/jpeg', size: 1000, timestamp: Date.now(), isFavorite: true },
        { id: '2', uri: 'file:///photo2.jpg', filename: 'photo2.jpg', type: 'image/jpeg', size: 2000, timestamp: Date.now(), isFavorite: false },
      ];
      await PhotoService.savePhotos(mockPhotos);

      await PhotoService.setFavorite('2', true);

      const photos = await PhotoService.loadPhotos();
      expect(photos.find(p => p.id === '1')?.isFavorite).toBe(true);
      expect(photos.find(p => p.id === '2')?.isFavorite).toBe(true);
    });
  });
});
