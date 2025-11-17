import AsyncStorage from '@react-native-async-storage/async-storage';
import { Album } from '../types/album';
import { Photo } from '../types/photo';

class AlbumService {
  private static ALBUM_STORAGE_KEY = '@photo_manage_albums';

  static async getAlbums(): Promise<Album[]> {
    const albums = await AsyncStorage.getItem(this.ALBUM_STORAGE_KEY);
    return albums ? JSON.parse(albums) : [];
  }

  static async saveAlbums(albums: Album[]): Promise<void> {
    await AsyncStorage.setItem(this.ALBUM_STORAGE_KEY, JSON.stringify(albums));
  }

  static async createAlbum(name: string): Promise<Album> {
    const albums = await this.getAlbums();
    const newAlbum: Album = {
      id: `${Date.now()}`,
      name,
      photos: [],
    };
    albums.push(newAlbum);
    await this.saveAlbums(albums);
    return newAlbum;
  }

  static async deleteAlbum(albumId: string): Promise<void> {
    let albums = await this.getAlbums();
    albums = albums.filter(album => album.id !== albumId);
    await this.saveAlbums(albums);
  }

  static async addPhotoToAlbum(albumId: string, photo: Photo): Promise<void> {
    const albums = await this.getAlbums();
    const album = albums.find(a => a.id === albumId);
    if (album) {
      album.photos.push({ id: photo.id, uri: photo.uri });
      await this.saveAlbums(albums);
    }
  }

  static async removePhotoFromAlbum(albumId: string, photoId: string): Promise<void> {
    const albums = await this.getAlbums();
    const album = albums.find(a => a.id === albumId);
    if (album) {
      album.photos = album.photos.filter(p => p.id !== photoId);
      await this.saveAlbums(albums);
    }
  }
}

export default AlbumService;
