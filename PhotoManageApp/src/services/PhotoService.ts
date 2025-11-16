import AsyncStorage from '@react-native-async-storage/async-storage';
import { Photo, PhotoPair } from '../types/photo';
// import RNFS from 'react-native-fs'; // Ready for file operations
import Exif from 'react-native-exif';

class PhotoService {
  private static PHOTO_STORAGE_KEY = '@photo_manage_photos';

  /**
   * Load saved photos from local storage
   */
  static async loadPhotos(): Promise<Photo[]> {
    try {
      const storedPhotos = await AsyncStorage.getItem(this.PHOTO_STORAGE_KEY);
      if (storedPhotos) {
        const photos: Photo[] = JSON.parse(storedPhotos);
        return photos.map(photo => ({
          ...photo,
          timestamp: new Date(photo.timestamp).getTime(),
        }));
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
        : new Date().getTime(),
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
    const timestamp = photo.exif?.DateTimeOriginal
      ? new Date(photo.exif.DateTimeOriginal).getTime()
      : photo.timestamp;

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
}

export default PhotoService;
