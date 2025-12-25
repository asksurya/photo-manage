import AsyncStorage from '@react-native-async-storage/async-storage';
import PhotoService from '../../src/services/PhotoService';
import { Photo } from '../../src/types/photo';

describe('PhotoService - Trash functionality', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  const createMockPhotos = (): Photo[] => [
    {
      id: '1',
      uri: 'file:///photo1.jpg',
      filename: 'photo1.jpg',
      type: 'image/jpeg',
      size: 1000,
      timestamp: Date.now(),
    },
    {
      id: '2',
      uri: 'file:///photo2.jpg',
      filename: 'photo2.jpg',
      type: 'image/jpeg',
      size: 2000,
      timestamp: Date.now(),
    },
    {
      id: '3',
      uri: 'file:///photo3.jpg',
      filename: 'photo3.jpg',
      type: 'image/jpeg',
      size: 3000,
      timestamp: Date.now(),
    },
  ];

  describe('moveToTrash', () => {
    it('should set deletedAt timestamp on photos', async () => {
      const mockPhotos = createMockPhotos();
      await PhotoService.savePhotos(mockPhotos);

      const beforeMove = Date.now();
      await PhotoService.moveToTrash(['1']);
      const afterMove = Date.now();

      const trashPhotos = await PhotoService.getTrashPhotos();
      expect(trashPhotos.length).toBe(1);
      expect(trashPhotos[0].id).toBe('1');
      expect(trashPhotos[0].deletedAt).toBeGreaterThanOrEqual(beforeMove);
      expect(trashPhotos[0].deletedAt).toBeLessThanOrEqual(afterMove);
    });

    it('should move multiple photos to trash', async () => {
      const mockPhotos = createMockPhotos();
      await PhotoService.savePhotos(mockPhotos);

      await PhotoService.moveToTrash(['1', '3']);

      const trashPhotos = await PhotoService.getTrashPhotos();
      expect(trashPhotos.length).toBe(2);
      expect(trashPhotos.map(p => p.id).sort()).toEqual(['1', '3']);
    });

    it('should not modify already trashed photos', async () => {
      const mockPhotos = createMockPhotos();
      const originalDeletedAt = Date.now() - 1000000;
      mockPhotos[0].deletedAt = originalDeletedAt;
      await PhotoService.savePhotos(mockPhotos);

      await PhotoService.moveToTrash(['1']);

      const trashPhotos = await PhotoService.getTrashPhotos();
      const photo1 = trashPhotos.find(p => p.id === '1');
      expect(photo1?.deletedAt).toBe(originalDeletedAt);
    });

    it('should remove photo from albums when moved to trash', async () => {
      const mockPhotos = createMockPhotos();
      await PhotoService.savePhotos(mockPhotos);
      await PhotoService.createAlbum('Test Album');
      const albums = await PhotoService.getAlbums();
      await PhotoService.addPhotoToAlbum('1', albums[0].id);

      await PhotoService.moveToTrash(['1']);

      const updatedAlbums = await PhotoService.getAlbums();
      expect(updatedAlbums[0].photoIds).not.toContain('1');
    });
  });

  describe('restoreFromTrash', () => {
    it('should clear deletedAt timestamp on photos', async () => {
      const mockPhotos = createMockPhotos();
      mockPhotos[0].deletedAt = Date.now();
      await PhotoService.savePhotos(mockPhotos);

      await PhotoService.restoreFromTrash(['1']);

      const photos = await PhotoService.loadPhotos();
      const restoredPhoto = photos.find(p => p.id === '1');
      expect(restoredPhoto).toBeDefined();
      expect(restoredPhoto?.deletedAt).toBeUndefined();
    });

    it('should restore multiple photos', async () => {
      const mockPhotos = createMockPhotos();
      mockPhotos[0].deletedAt = Date.now();
      mockPhotos[2].deletedAt = Date.now();
      await PhotoService.savePhotos(mockPhotos);

      await PhotoService.restoreFromTrash(['1', '3']);

      const trashPhotos = await PhotoService.getTrashPhotos();
      expect(trashPhotos.length).toBe(0);

      const photos = await PhotoService.loadPhotos();
      expect(photos.length).toBe(3);
    });

    it('should not modify non-trashed photos', async () => {
      const mockPhotos = createMockPhotos();
      await PhotoService.savePhotos(mockPhotos);

      await PhotoService.restoreFromTrash(['1']);

      const photos = await PhotoService.loadPhotos();
      expect(photos.length).toBe(3);
    });
  });

  describe('emptyTrash', () => {
    it('should permanently delete all trashed photos', async () => {
      const mockPhotos = createMockPhotos();
      mockPhotos[0].deletedAt = Date.now();
      mockPhotos[2].deletedAt = Date.now();
      await PhotoService.savePhotos(mockPhotos);

      await PhotoService.emptyTrash();

      const allPhotos = await PhotoService.loadPhotos(true);
      expect(allPhotos.length).toBe(1);
      expect(allPhotos[0].id).toBe('2');
    });

    it('should not affect non-trashed photos', async () => {
      const mockPhotos = createMockPhotos();
      await PhotoService.savePhotos(mockPhotos);

      await PhotoService.emptyTrash();

      const photos = await PhotoService.loadPhotos();
      expect(photos.length).toBe(3);
    });
  });

  describe('getTrashPhotos', () => {
    it('should return only trashed photos', async () => {
      const mockPhotos = createMockPhotos();
      mockPhotos[1].deletedAt = Date.now();
      await PhotoService.savePhotos(mockPhotos);

      const trashPhotos = await PhotoService.getTrashPhotos();

      expect(trashPhotos.length).toBe(1);
      expect(trashPhotos[0].id).toBe('2');
    });

    it('should return empty array when no photos are trashed', async () => {
      const mockPhotos = createMockPhotos();
      await PhotoService.savePhotos(mockPhotos);

      const trashPhotos = await PhotoService.getTrashPhotos();

      expect(trashPhotos.length).toBe(0);
    });
  });

  describe('cleanupExpiredTrash', () => {
    it('should delete photos older than retention period', async () => {
      const mockPhotos = createMockPhotos();
      const retentionMs = PhotoService.TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
      // Set deletedAt to be older than retention period
      mockPhotos[0].deletedAt = Date.now() - retentionMs - 1000;
      mockPhotos[1].deletedAt = Date.now() - retentionMs - 2000;
      // This one is still within retention
      mockPhotos[2].deletedAt = Date.now() - 1000;
      await PhotoService.savePhotos(mockPhotos);

      const deletedCount = await PhotoService.cleanupExpiredTrash();

      expect(deletedCount).toBe(2);
      const allPhotos = await PhotoService.loadPhotos(true);
      expect(allPhotos.length).toBe(1);
      expect(allPhotos[0].id).toBe('3');
    });

    it('should not delete photos within retention period', async () => {
      const mockPhotos = createMockPhotos();
      mockPhotos[0].deletedAt = Date.now() - 1000;
      await PhotoService.savePhotos(mockPhotos);

      const deletedCount = await PhotoService.cleanupExpiredTrash();

      expect(deletedCount).toBe(0);
      const trashPhotos = await PhotoService.getTrashPhotos();
      expect(trashPhotos.length).toBe(1);
    });

    it('should return 0 when no expired photos', async () => {
      const mockPhotos = createMockPhotos();
      await PhotoService.savePhotos(mockPhotos);

      const deletedCount = await PhotoService.cleanupExpiredTrash();

      expect(deletedCount).toBe(0);
    });
  });

  describe('loadPhotos - excludes trashed', () => {
    it('should exclude trashed photos by default', async () => {
      const mockPhotos = createMockPhotos();
      mockPhotos[1].deletedAt = Date.now();
      await PhotoService.savePhotos(mockPhotos);

      const photos = await PhotoService.loadPhotos();

      expect(photos.length).toBe(2);
      expect(photos.map(p => p.id).sort()).toEqual(['1', '3']);
    });

    it('should include trashed photos when includeTrash is true', async () => {
      const mockPhotos = createMockPhotos();
      mockPhotos[1].deletedAt = Date.now();
      await PhotoService.savePhotos(mockPhotos);

      const photos = await PhotoService.loadPhotos(true);

      expect(photos.length).toBe(3);
    });

    it('should return all photos when none are trashed', async () => {
      const mockPhotos = createMockPhotos();
      await PhotoService.savePhotos(mockPhotos);

      const photos = await PhotoService.loadPhotos();

      expect(photos.length).toBe(3);
    });
  });

  describe('deletePhotos - uses moveToTrash', () => {
    it('should soft delete photos (move to trash)', async () => {
      const mockPhotos = createMockPhotos();
      await PhotoService.savePhotos(mockPhotos);

      await PhotoService.deletePhotos(['1']);

      // Photo should be in trash, not permanently deleted
      const trashPhotos = await PhotoService.getTrashPhotos();
      expect(trashPhotos.length).toBe(1);
      expect(trashPhotos[0].id).toBe('1');

      // Photo should be excluded from normal load
      const photos = await PhotoService.loadPhotos();
      expect(photos.length).toBe(2);

      // But still exists in storage
      const allPhotos = await PhotoService.loadPhotos(true);
      expect(allPhotos.length).toBe(3);
    });
  });

  describe('permanentlyDeletePhotos', () => {
    it('should permanently delete specified photos', async () => {
      const mockPhotos = createMockPhotos();
      mockPhotos[0].deletedAt = Date.now();
      await PhotoService.savePhotos(mockPhotos);

      await PhotoService.permanentlyDeletePhotos(['1']);

      const allPhotos = await PhotoService.loadPhotos(true);
      expect(allPhotos.length).toBe(2);
      expect(allPhotos.map(p => p.id).sort()).toEqual(['2', '3']);
    });

    it('should work on non-trashed photos', async () => {
      const mockPhotos = createMockPhotos();
      await PhotoService.savePhotos(mockPhotos);

      await PhotoService.permanentlyDeletePhotos(['2']);

      const allPhotos = await PhotoService.loadPhotos(true);
      expect(allPhotos.length).toBe(2);
      expect(allPhotos.map(p => p.id).sort()).toEqual(['1', '3']);
    });
  });

  describe('TRASH_RETENTION_DAYS', () => {
    it('should be 30 days', () => {
      expect(PhotoService.TRASH_RETENTION_DAYS).toBe(30);
    });
  });
});
