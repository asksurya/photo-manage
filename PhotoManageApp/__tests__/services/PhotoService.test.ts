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
});
