import AsyncStorage from '@react-native-async-storage/async-storage';
import { Photo, PhotoPair, Album } from '../types/photo';
import RNFS from 'react-native-fs'; // Ready for file operations
import Exif from 'react-native-exif';

class PhotoService {
  private static PHOTO_STORAGE_KEY = '@photo_manage_photos';
  private static ALBUM_STORAGE_KEY = '@photo_manage_albums';
  static TRASH_RETENTION_DAYS = 30;

  /**
   * Load saved photos from local storage (excludes trashed photos by default)
   */
  static async loadPhotos(includeTrash: boolean = false): Promise<Photo[]> {
    try {
      const storedPhotos = await AsyncStorage.getItem(this.PHOTO_STORAGE_KEY);
      if (storedPhotos) {
        const photos: Photo[] = JSON.parse(storedPhotos);
        if (includeTrash) {
          return photos;
        }
        // Exclude trashed photos by default
        return photos.filter(p => !p.deletedAt);
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
    const { uri, fileName, type, fileSize, width, height, duration } = asset;

    const filename = fileName || uri.split('/').pop() || 'unknown';
    const isVideo = this.isVideoFile(filename);

    // Extract EXIF data (only for photos, not videos)
    let exifData;
    if (!isVideo) {
      try {
        exifData = await Exif.getExif(uri);
      } catch (error) {
        console.warn('Failed to extract EXIF data:', error);
      }
    }

    // Create photo object
    const photo: Photo = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uri,
      filename,
      type: type || (isVideo ? 'video/mp4' : 'image/jpeg'),
      size: fileSize || 0,
      width: width,
      height: height,
      timestamp: exifData?.DateTimeOriginal
        ? new Date(exifData.DateTimeOriginal).getTime()
        : Date.now(),
      exif: exifData,
      mediaType: isVideo ? 'video' : 'photo',
      duration: isVideo ? (duration || 0) : undefined,
      thumbnailUri: isVideo ? uri : undefined, // Use same URI as thumbnail placeholder
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
   * Check if a file is a video based on extension
   */
  static isVideoFile(filename: string): boolean {
    const videoExtensions = ['.mp4', '.mov', '.m4v'];
    return videoExtensions.some(ext =>
      filename.toLowerCase().endsWith(ext)
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
   * Delete photos by their IDs (soft delete - moves to trash)
   */
  static async deletePhotos(photoIds: string[]): Promise<void> {
    // Use moveToTrash for soft delete
    await this.moveToTrash(photoIds);
  }

  /**
   * Move photos to trash by setting deletedAt timestamp
   */
  static async moveToTrash(photoIds: string[]): Promise<void> {
    try {
      const photos = await this.loadPhotos(true); // Include already trashed
      const idsToTrash = new Set(photoIds);
      const now = Date.now();

      const updatedPhotos = photos.map(p => {
        if (idsToTrash.has(p.id) && !p.deletedAt) {
          return { ...p, deletedAt: now };
        }
        return p;
      });

      await this.savePhotos(updatedPhotos);

      // Also remove from any albums
      const albums = await this.getAlbums();
      const updatedAlbums = albums.map(album => ({
        ...album,
        photoIds: album.photoIds.filter((id: string) => !idsToTrash.has(id)),
      }));
      await this.saveAlbums(updatedAlbums);
    } catch (error) {
      console.error('Error moving photos to trash:', error);
      throw new Error('Failed to move photos to trash');
    }
  }

  /**
   * Restore photos from trash by clearing deletedAt
   */
  static async restoreFromTrash(photoIds: string[]): Promise<void> {
    try {
      const photos = await this.loadPhotos(true); // Include trashed
      const idsToRestore = new Set(photoIds);

      const updatedPhotos = photos.map(p => {
        if (idsToRestore.has(p.id) && p.deletedAt) {
          const { deletedAt, ...photoWithoutDeletedAt } = p;
          return photoWithoutDeletedAt;
        }
        return p;
      });

      await this.savePhotos(updatedPhotos);
    } catch (error) {
      console.error('Error restoring photos from trash:', error);
      throw new Error('Failed to restore photos from trash');
    }
  }

  /**
   * Permanently delete all photos in trash
   */
  static async emptyTrash(): Promise<void> {
    try {
      const photos = await this.loadPhotos(true); // Include trashed
      const remaining = photos.filter(p => !p.deletedAt);
      await this.savePhotos(remaining);
    } catch (error) {
      console.error('Error emptying trash:', error);
      throw new Error('Failed to empty trash');
    }
  }

  /**
   * Get all trashed photos
   */
  static async getTrashPhotos(): Promise<Photo[]> {
    try {
      const photos = await this.loadPhotos(true); // Include trashed
      return photos.filter(p => p.deletedAt);
    } catch (error) {
      console.error('Error getting trash photos:', error);
      return [];
    }
  }

  /**
   * Permanently delete photos older than TRASH_RETENTION_DAYS
   */
  static async cleanupExpiredTrash(): Promise<number> {
    try {
      const photos = await this.loadPhotos(true); // Include trashed
      const now = Date.now();
      const retentionMs = this.TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

      const { remaining, deleted } = photos.reduce(
        (acc, photo) => {
          if (photo.deletedAt && (now - photo.deletedAt) > retentionMs) {
            acc.deleted.push(photo);
          } else {
            acc.remaining.push(photo);
          }
          return acc;
        },
        { remaining: [] as Photo[], deleted: [] as Photo[] }
      );

      if (deleted.length > 0) {
        await this.savePhotos(remaining);
      }

      return deleted.length;
    } catch (error) {
      console.error('Error cleaning up expired trash:', error);
      throw new Error('Failed to cleanup expired trash');
    }
  }

  /**
   * Permanently delete specific photos (bypass trash)
   */
  static async permanentlyDeletePhotos(photoIds: string[]): Promise<void> {
    try {
      const photos = await this.loadPhotos(true); // Include trashed
      const idsToDelete = new Set(photoIds);
      const remaining = photos.filter(p => !idsToDelete.has(p.id));
      await this.savePhotos(remaining);
    } catch (error) {
      console.error('Error permanently deleting photos:', error);
      throw new Error('Failed to permanently delete photos');
    }
  }

  /**
   * Favorites Management
   */

  /**
   * Toggle the favorite status of a photo
   */
  static async toggleFavorite(photoId: string): Promise<Photo | null> {
    const photos = await this.loadPhotos();
    const photo = photos.find(p => p.id === photoId);
    if (!photo) {
      return null;
    }
    photo.isFavorite = !photo.isFavorite;
    await this.savePhotos(photos);
    return photo;
  }

  /**
   * Get all favorited photos
   */
  static async getFavorites(): Promise<Photo[]> {
    const photos = await this.loadPhotos();
    return photos.filter(p => p.isFavorite === true);
  }

  /**
   * Set the favorite status of a photo explicitly
   */
  static async setFavorite(photoId: string, isFavorite: boolean): Promise<Photo | null> {
    const photos = await this.loadPhotos();
    const photo = photos.find(p => p.id === photoId);
    if (!photo) {
      return null;
    }
    photo.isFavorite = isFavorite;
    await this.savePhotos(photos);
    return photo;
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
}

export default PhotoService;
