import AsyncStorage from '@react-native-async-storage/async-storage';
import PhotoService from '../../src/services/PhotoService';
import { Photo } from '../../src/types/photo';

describe('PhotoService', () => {
  afterEach(() => {
    AsyncStorage.clear();
  });

  it('should import photos', async () => {
    const photos: any[] = [
      { uri: 'file:///test.jpg', fileName: 'test.jpg', timestamp: new Date().toISOString(), width: 100, height: 100, fileSize: 1234, type: 'image/jpeg' },
    ];
    const importedPhotos = await PhotoService.importPhotos(photos);
    expect(importedPhotos.length).toBe(1);
    expect(importedPhotos[0].uri).toBe('file:///test.jpg');
    expect(importedPhotos[0].filename).toBe('test.jpg');
  });

  it('should load photos', async () => {
    const photos: any[] = [
      { uri: 'file:///test.jpg', fileName: 'test.jpg', timestamp: new Date().toISOString(), width: 100, height: 100, fileSize: 1234, type: 'image/jpeg' },
    ];
    await PhotoService.importPhotos(photos);
    const loadedPhotos = await PhotoService.loadPhotos();
    expect(loadedPhotos.length).toBe(1);
    expect(loadedPhotos[0].uri).toBe('file:///test.jpg');
    expect(loadedPhotos[0].filename).toBe('test.jpg');
  });

  it('should generate pairs', () => {
    const photos: Photo[] = [
      { id: '1', uri: 'file:///test.jpg', filename: 'test.jpg', timestamp: Date.now(), width: 100, height: 100, exif: {} },
      { id: '2', uri: 'file:///test.raw', filename: 'test.raw', timestamp: Date.now(), width: 100, height: 100, exif: {} },
    ];
    const pairs = PhotoService.generatePairs(photos);
    expect(pairs.length).toBe(1);
    expect(pairs[0].jpeg).toEqual(photos[0]);
    expect(pairs[0].raw).toEqual(photos[1]);
  });

  describe('deletePhotos', () => {
    beforeEach(async () => {
      await AsyncStorage.clear();
    });

    it('should delete single photo', async () => {
      const mockPhotos = [
        { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg', timestamp: Date.now() },
        { id: '2', uri: 'file:///photo2.jpg', filename: 'photo2.jpg', timestamp: Date.now() },
      ];
      await PhotoService.savePhotos(mockPhotos);

      await PhotoService.deletePhotos(['1']);

      const remaining = await PhotoService.loadPhotos();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe('2');
    });

    it('should delete multiple photos', async () => {
      const mockPhotos = [
        { id: '1', uri: 'file:///photo1.jpg', filename: 'photo1.jpg', timestamp: Date.now() },
        { id: '2', uri: 'file:///photo2.jpg', filename: 'photo2.jpg', timestamp: Date.now() },
        { id: '3', uri: 'file:///photo3.jpg', filename: 'photo3.jpg', timestamp: Date.now() },
      ];
      await PhotoService.savePhotos(mockPhotos);

      await PhotoService.deletePhotos(['1', '3']);

      const remaining = await PhotoService.loadPhotos();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe('2');
    });
  });
});
