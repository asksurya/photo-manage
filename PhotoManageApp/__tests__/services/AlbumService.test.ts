import AlbumService from '../../src/services/AlbumService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Photo } from '../../src/types/photo';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('AlbumService', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.setItem as jest.Mock).mockClear();
  });

  it('should create an album', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));
    const newAlbum = await AlbumService.createAlbum('New Album');
    expect(newAlbum.name).toBe('New Album');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@photo_manage_albums',
      JSON.stringify([newAlbum])
    );
  });

  it('should get albums', async () => {
    const albums = [{ id: '1', name: 'Test Album', photos: [] }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
    const result = await AlbumService.getAlbums();
    expect(result).toEqual(albums);
  });

  it('should delete an album', async () => {
    const albums = [{ id: '1', name: 'Test Album', photos: [] }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
    await AlbumService.deleteAlbum('1');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@photo_manage_albums',
      JSON.stringify([])
    );
  });

  it('should add a photo to an album', async () => {
    const albums = [{ id: '1', name: 'Test Album', photos: [] }];
    const photo: Photo = {
      id: 'p1',
      uri: 'file:///test.jpg',
      filename: 'test.jpg',
      type: 'image/jpeg',
      size: 100,
      width: 100,
      height: 100,
      timestamp: new Date(),
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
    await AlbumService.addPhotoToAlbum('1', photo);
    const updatedAlbums = [{
      id: '1',
      name: 'Test Album',
      photos: [{ id: 'p1', uri: 'file:///test.jpg' }],
    }];
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@photo_manage_albums',
      JSON.stringify(updatedAlbums)
    );
  });

  it('should remove a photo from an album', async () => {
    const albums = [
      {
        id: '1',
        name: 'Test Album',
        photos: [{ id: 'p1', uri: 'file:///test.jpg' }],
      },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(albums));
    await AlbumService.removePhotoFromAlbum('1', 'p1');
    const updatedAlbums = [{ id: '1', name: 'Test Album', photos: [] }];
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@photo_manage_albums',
      JSON.stringify(updatedAlbums)
    );
  });
});
