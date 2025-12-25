import PhotoService from '../../src/services/PhotoService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Photo, Album } from '../../src/types/photo';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('PhotoService Album Management', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.setItem as jest.Mock).mockClear();
  });

  it('should create an album', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));
    const newAlbum = await PhotoService.createAlbum('New Album');
    expect(newAlbum.name).toBe('New Album');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@photo_manage_albums',
      JSON.stringify([newAlbum])
    );
  });

  it('should get albums', async () => {
    const albums: Album[] = [{ id: '1', name: 'Test Album', photoIds: [] }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
    const result = await PhotoService.getAlbums();
    expect(result).toEqual(albums);
  });

  it('should add a photo to an album', async () => {
    const albums: Album[] = [{ id: '1', name: 'Test Album', photoIds: [] }];
    const photo: Photo = {
      id: 'p1',
      uri: 'file:///test.jpg',
      filename: 'test.jpg',
      type: 'image/jpeg',
      size: 100,
      width: 100,
      height: 100,
      timestamp: new Date().getTime(),
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
    await PhotoService.addPhotoToAlbum(photo.id, '1');
    const updatedAlbums = [{
      id: '1',
      name: 'Test Album',
      photoIds: ['p1'],
    }];
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@photo_manage_albums',
      JSON.stringify(updatedAlbums)
    );
  });

  it('should get photos for an album', async () => {
    const albums: Album[] = [{ id: '1', name: 'Test Album', photoIds: ['p1'] }];
    const photos: Photo[] = [
      {
        id: 'p1',
        uri: 'file:///test.jpg',
        filename: 'test.jpg',
        type: 'image/jpeg',
        size: 100,
        width: 100,
        height: 100,
        timestamp: new Date().getTime(),
      },
    ];
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(JSON.stringify(albums))
      .mockResolvedValueOnce(JSON.stringify(photos));
    const result = await PhotoService.getPhotosForAlbum('1');
    expect(result).toEqual(photos);
  });

  it('should delete an album', async () => {
    const albums: Album[] = [{ id: '1', name: 'Test Album', photoIds: [] }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
    await PhotoService.deleteAlbum('1');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@photo_manage_albums',
      JSON.stringify([])
    );
  });

  it('should rename an album', async () => {
    const albums: Album[] = [
      { id: '1', name: 'Old Name', photoIds: [] },
      { id: '2', name: 'Another Album', photoIds: [] },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
    await PhotoService.renameAlbum('1', 'New Name');
    const expectedAlbums = [
      { id: '1', name: 'New Name', photoIds: [] },
      { id: '2', name: 'Another Album', photoIds: [] },
    ];
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@photo_manage_albums',
      JSON.stringify(expectedAlbums)
    );
  });

  it('should preserve photoIds when renaming an album', async () => {
    const albums: Album[] = [
      { id: '1', name: 'Old Name', photoIds: ['p1', 'p2', 'p3'] },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
    await PhotoService.renameAlbum('1', 'New Name');
    const expectedAlbums = [
      { id: '1', name: 'New Name', photoIds: ['p1', 'p2', 'p3'] },
    ];
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@photo_manage_albums',
      JSON.stringify(expectedAlbums)
    );
  });

  it('should remove a photo from an album', async () => {
    const albums: Album[] = [{ id: '1', name: 'Test Album', photoIds: ['p1'] }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
    await PhotoService.removePhotoFromAlbum('p1', '1');
    const updatedAlbums = [{
      id: '1',
      name: 'Test Album',
      photoIds: [],
    }];
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@photo_manage_albums',
      JSON.stringify(updatedAlbums)
    );
  });
});
