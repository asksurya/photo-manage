import AlbumService from '../../src/services/AlbumService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Album } from '../../src/types/album';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('AlbumService', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.setItem as jest.Mock).mockClear();
  });

  describe('getAlbums', () => {
    it('should return albums from storage', async () => {
      const albums: Album[] = [
        { id: '1', name: 'Test Album', photos: [] },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));

      const result = await AlbumService.getAlbums();

      expect(result).toEqual(albums);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@photo_manage_albums');
    });

    it('should return empty array when no albums exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await AlbumService.getAlbums();

      expect(result).toEqual([]);
    });
  });

  describe('createAlbum', () => {
    it('should create a new album', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));

      const newAlbum = await AlbumService.createAlbum('Vacation Photos');

      expect(newAlbum.name).toBe('Vacation Photos');
      expect(newAlbum.photos).toEqual([]);
      expect(newAlbum.id).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_albums',
        JSON.stringify([newAlbum])
      );
    });

    it('should add new album to existing albums', async () => {
      const existingAlbums: Album[] = [
        { id: '1', name: 'Existing Album', photos: [] },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingAlbums));

      const newAlbum = await AlbumService.createAlbum('New Album');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_albums',
        JSON.stringify([...existingAlbums, newAlbum])
      );
    });
  });

  describe('deleteAlbum', () => {
    it('should delete an album by id', async () => {
      const albums: Album[] = [
        { id: '1', name: 'Album 1', photos: [] },
        { id: '2', name: 'Album 2', photos: [] },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));

      await AlbumService.deleteAlbum('1');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_albums',
        JSON.stringify([{ id: '2', name: 'Album 2', photos: [] }])
      );
    });

    it('should handle deleting non-existent album', async () => {
      const albums: Album[] = [
        { id: '1', name: 'Album 1', photos: [] },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));

      await AlbumService.deleteAlbum('999');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_albums',
        JSON.stringify(albums)
      );
    });
  });

  describe('renameAlbum', () => {
    it('should rename an existing album', async () => {
      const albums: Album[] = [
        { id: '1', name: 'Old Name', photos: [] },
        { id: '2', name: 'Another Album', photos: [] },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await AlbumService.renameAlbum('1', 'New Name');

      const expectedAlbums = [
        { id: '1', name: 'New Name', photos: [] },
        { id: '2', name: 'Another Album', photos: [] },
      ];
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_albums',
        JSON.stringify(expectedAlbums)
      );
    });

    it('should handle renaming non-existent album', async () => {
      const albums: Album[] = [
        { id: '1', name: 'Album 1', photos: [] },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await AlbumService.renameAlbum('999', 'New Name');

      // Should not call setItem when album doesn't exist (no changes made)
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should preserve album photos when renaming', async () => {
      const albums: Album[] = [
        {
          id: '1',
          name: 'Old Name',
          photos: [
            { id: 'p1', uri: 'file:///photo1.jpg' },
            { id: 'p2', uri: 'file:///photo2.jpg' },
          ],
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await AlbumService.renameAlbum('1', 'New Name');

      const expectedAlbums = [
        {
          id: '1',
          name: 'New Name',
          photos: [
            { id: 'p1', uri: 'file:///photo1.jpg' },
            { id: 'p2', uri: 'file:///photo2.jpg' },
          ],
        },
      ];
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_albums',
        JSON.stringify(expectedAlbums)
      );
    });
  });

  describe('addPhotoToAlbum', () => {
    it('should add a photo to an album', async () => {
      const albums: Album[] = [
        { id: '1', name: 'Album 1', photos: [] },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
      (AsyncStorage.setItem as jest.Mock).mockClear();

      const photo = { id: 'p1', uri: 'file:///photo.jpg' };
      await AlbumService.addPhotoToAlbum('1', photo);

      const expectedAlbums = [
        { id: '1', name: 'Album 1', photos: [photo] },
      ];
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_albums',
        JSON.stringify(expectedAlbums)
      );
    });
  });

  describe('removePhotoFromAlbum', () => {
    it('should remove a photo from an album', async () => {
      const albums: Album[] = [
        {
          id: '1',
          name: 'Album 1',
          photos: [
            { id: 'p1', uri: 'file:///photo1.jpg' },
            { id: 'p2', uri: 'file:///photo2.jpg' },
          ],
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await AlbumService.removePhotoFromAlbum('1', 'p1');

      const expectedAlbums = [
        {
          id: '1',
          name: 'Album 1',
          photos: [{ id: 'p2', uri: 'file:///photo2.jpg' }],
        },
      ];
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_albums',
        JSON.stringify(expectedAlbums)
      );
    });
  });
});
