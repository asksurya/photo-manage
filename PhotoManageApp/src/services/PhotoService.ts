import AsyncStorage from '@react-native-async-storage/async-storage';
import { Photo, PhotoPair, Album } from '../types/photo';
import RNFS from 'react-native-fs'; // Ready for file operations
import Exif from 'react-native-exif';

class PhotoService {
  private static PHOTO_STORAGE_KEY = '@photo_manage_photos';
  private static ALBUM_STORAGE_KEY = '@photo_manage_albums';

  /**
   * Load saved photos from local storage
   */
  static async loadPhotos(): Promise<Photo[]> {
    try {
      const storedPhotos = await AsyncStorage.getItem(this.PHOTO_STORAGE_KEY);
      if (storedPhotos) {
        return JSON.parse(storedPhotos);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
    return [];
  }

  /**
   * Save photos to local storage
   */
  static async savePhotos(photos: Photo[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.PHOTO_STORAGE_KEY, JSON.stringify(photos));
    } catch (error) {
      console.error('Error saving photos:', error);
      throw new Error('Failed to save photos');
    }
  }

  /**
   * Import photos from image picker response
   */
  static async importPhotos(assets: any[]): Promise<Photo[]> {
    const importedPhotos: Photo[] = [];

    for (const asset of assets) {
      try {
        const photo = await this.createPhotoFromAsset(asset);
        importedPhotos.push(photo);
      } catch (error) {
        console.error('Error importing photo:', error);
      }
    }

    // Save the imported photos
    const existingPhotos = await this.loadPhotos();
    const allPhotos = [...existingPhotos, ...importedPhotos];
    await this.savePhotos(allPhotos);

    return importedPhotos;
  }

  /**
   * Create a Photo object from an image picker asset
   */
  private static async createPhotoFromAsset(asset: any): Promise<Photo> {
    const { uri, fileName, type, fileSize, width, height } = asset;

    // Extract EXIF data
    let exifData;
    try {
      exifData = await Exif.getExif(uri);
    } catch (error) {
      console.warn('Failed to extract EXIF data:', error);
    }

    // Create photo object
    const photo: Photo = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uri,
      filename: fileName || uri.split('/').pop() || 'unknown',
      type: type || 'image/jpeg',
      size: fileSize || 0,
      width: width,
      height: height,
      timestamp: exifData?.DateTimeOriginal
        ? new Date(exifData.DateTimeOriginal).getTime()
        : Date.now(),
      exif: exifData,
    };

    return photo;
  }

  /**
   * Generate photo pairs by matching RAW and JPEG files
   */
  static generatePairs(photos: Photo[]): PhotoPair[] {
    const pairs: Map<string, PhotoPair> = new Map();
    const unmatchedPhotos: Photo[] = [];

    for (const photo of photos) {
      const pairingKey = this.getPairingKey(photo);

      if (!pairs.has(pairingKey)) {
        pairs.set(pairingKey, {
          id: `${pairingKey}-${Date.now()}`,
          pairingKey,
          raw: undefined,
          jpeg: undefined,
        });
      }

      const pair = pairs.get(pairingKey)!;

      if (this.isRawFile(photo)) {
        pair.raw = photo;
      } else if (this.isJpegFile(photo)) {
        pair.jpeg = photo;
      } else {
        unmatchedPhotos.push(photo);
      }
    }

    return Array.from(pairs.values()).filter(
      pair => pair.raw || pair.jpeg
    );
  }

  /**
   * Generate a pairing key for matching RAW and JPEG files
   */
  private static getPairingKey(photo: Photo): string {
    // Extract base name without extension
    const baseName = photo.filename.replace(/\.(jpg|jpeg|raw|cr2|nef|arw)$/i, '');

    // Extract timestamp if available
    const timestamp = photo.timestamp;

    // Create pairing key based on filename and timestamp
    return `${baseName}_${timestamp}`;
  }

  /**
   * Check if a photo is a RAW file
   */
  private static isRawFile(photo: Photo): boolean {
    const extensions = ['.cr2', '.nef', '.arw', '.raw', '.orf', '.raf'];
    return extensions.some(ext =>
      photo.filename.toLowerCase().endsWith(ext)
    );
  }

  /**
   * Check if a photo is a JPEG file
   */
  private static isJpegFile(photo: Photo): boolean {
    const extensions = ['.jpg', '.jpeg'];
    return extensions.some(ext =>
      photo.filename.toLowerCase().endsWith(ext)
    );
  }

  /**
   * Get photos sorted by timestamp
   */
  static sortPhotosByDate(photos: Photo[]): Photo[] {
    return photos.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Album Management
   */

  static async getAlbums(): Promise<Album[]> {
    try {
      const storedAlbums = await AsyncStorage.getItem(this.ALBUM_STORAGE_KEY);
      return storedAlbums ? JSON.parse(storedAlbums) : [];
    } catch (error) {
      console.error('Error loading albums:', error);
      return [];
    }
  }

  static async saveAlbums(albums: Album[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ALBUM_STORAGE_KEY, JSON.stringify(albums));
    } catch (error) {
      console.error('Error saving albums:', error);
      throw new Error('Failed to save albums');
    }
  }

  static async createAlbum(name: string): Promise<Album> {
    const albums = await this.getAlbums();
    const newAlbum: Album = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      photoIds: [],
    };
    const updatedAlbums = [...albums, newAlbum];
    await this.saveAlbums(updatedAlbums);
    return newAlbum;
  }

  static async addPhotoToAlbum(photoId: string, albumId: string): Promise<void> {
    const albums = await this.getAlbums();
    const album = albums.find((a) => a.id === albumId);
    if (album && !album.photoIds.includes(photoId)) {
      album.photoIds.push(photoId);
      await this.saveAlbums(albums);
    }
  }

  static async getPhotosForAlbum(albumId: string): Promise<Photo[]> {
    const albums = await this.getAlbums();
    const album = albums.find((a) => a.id === albumId);
    if (!album) {
      return [];
    }
    const allPhotos = await this.loadPhotos();
    return allPhotos.filter((p) => album.photoIds.includes(p.id));
  }

  static async deleteAlbum(albumId: string): Promise<void> {
    const albums = await this.getAlbums();
    const updatedAlbums = albums.filter((a) => a.id !== albumId);
    await this.saveAlbums(updatedAlbums);
  }

  static async renameAlbum(albumId: string, newName: string): Promise<void> {
    const albums = await this.getAlbums();
    const album = albums.find((a) => a.id === albumId);
    if (album) {
      album.name = newName;
      await this.saveAlbums(albums);
    }
  }

  static async removePhotoFromAlbum(photoId: string, albumId: string): Promise<void> {
    const albums = await this.getAlbums();
    const album = albums.find((a) => a.id === albumId);
    if (album) {
      album.photoIds = album.photoIds.filter((id) => id !== photoId);
      await this.saveAlbums(albums);
    }
  }

  /**
   * Delete photos by their IDs
   */
  static async deletePhotos(photoIds: string[]): Promise<void> {
    try {
      const photos = await this.loadPhotos();
      const idsToDelete = new Set(photoIds);
      const remaining = photos.filter(p => !idsToDelete.has(p.id));
      await this.savePhotos(remaining);

      // Also remove from any albums
      const albums = await this.getAlbums();
      const updatedAlbums = albums.map(album => ({
        ...album,
        photoIds: album.photoIds.filter((id: string) => !idsToDelete.has(id)),
      }));
      await this.saveAlbums(updatedAlbums);
    } catch (error) {
      console.error('Error deleting photos:', error);
      throw new Error('Failed to delete photos');
    }
  }

  /**
   * File Operations
   */

  /**
   * Check if a file exists
   */
  static async fileExists(path: string): Promise<boolean> {
    try {
      return await RNFS.exists(path);
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Delete a file
   */
  static async deleteFile(path: string): Promise<void> {
    try {
      if (await this.fileExists(path)) {
        await RNFS.unlink(path);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Failed to delete file: ${path}`);
    }
  }

  /**
   * Move a file
   */
  static async moveFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      await RNFS.moveFile(sourcePath, destPath);
    } catch (error) {
      console.error('Error moving file:', error);
      throw new Error(`Failed to move file from ${sourcePath} to ${destPath}`);
    }
  }

  /**
   * Copy a file
   */
  static async copyFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      await RNFS.copyFile(sourcePath, destPath);
    } catch (error) {
      console.error('Error copying file:', error);
      throw new Error(`Failed to copy file from ${sourcePath} to ${destPath}`);
    }
  }

  /**
   * Tag Management
   */

  /**
   * Add a tag to multiple photos
   */
  static async addTagToPhotos(tagId: string, photoIds: string[]): Promise<void> {
    try {
      const photos = await this.loadPhotos();
      const photoIdSet = new Set(photoIds);
      const updatedPhotos = photos.map((photo) => {
        if (photoIdSet.has(photo.id)) {
          const existingTagIds = photo.tagIds || [];
          if (!existingTagIds.includes(tagId)) {
            return { ...photo, tagIds: [...existingTagIds, tagId] };
          }
        }
        return photo;
      });
      await this.savePhotos(updatedPhotos);
    } catch (error) {
      console.error('Error adding tag to photos:', error);
      throw new Error('Failed to add tag to photos');
    }
  }

  /**
   * Remove a tag from multiple photos
   */
  static async removeTagFromPhotos(tagId: string, photoIds: string[]): Promise<void> {
    try {
      const photos = await this.loadPhotos();
      const photoIdSet = new Set(photoIds);
      const updatedPhotos = photos.map((photo) => {
        if (photoIdSet.has(photo.id) && photo.tagIds) {
          return { ...photo, tagIds: photo.tagIds.filter((id) => id !== tagId) };
        }
        return photo;
      });
      await this.savePhotos(updatedPhotos);
    } catch (error) {
      console.error('Error removing tag from photos:', error);
      throw new Error('Failed to remove tag from photos');
    }
  }

  /**
   * Get all photos that have a specific tag
   */
  static async getPhotosByTag(tagId: string): Promise<Photo[]> {
    try {
      const photos = await this.loadPhotos();
      return photos.filter((photo) => photo.tagIds?.includes(tagId));
    } catch (error) {
      console.error('Error getting photos by tag:', error);
      return [];
    }
  }

  /**
   * Remove a tag from all photos (used when deleting a tag)
   */
  static async removeTagFromAllPhotos(tagId: string): Promise<void> {
    try {
      const photos = await this.loadPhotos();
      const updatedPhotos = photos.map((photo) => {
        if (photo.tagIds?.includes(tagId)) {
          return { ...photo, tagIds: photo.tagIds.filter((id) => id !== tagId) };
        }
        return photo;
      });
      await this.savePhotos(updatedPhotos);
    } catch (error) {
      console.error('Error removing tag from all photos:', error);
      throw new Error('Failed to remove tag from all photos');
    }
  }

  /**
   * Get the count of photos for each tag
   */
  static async getPhotoCountByTags(): Promise<Map<string, number>> {
    try {
      const photos = await this.loadPhotos();
      const countMap = new Map<string, number>();
      for (const photo of photos) {
        if (photo.tagIds) {
          for (const tagId of photo.tagIds) {
            countMap.set(tagId, (countMap.get(tagId) || 0) + 1);
          }
        }
      }
      return countMap;
    } catch (error) {
      console.error('Error getting photo count by tags:', error);
      return new Map();
    }
  }
}

export default PhotoService;
