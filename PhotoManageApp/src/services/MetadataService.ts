import Geolocation from 'react-native-geolocation-service';
import { Photo } from '../types/photo';

class MetadataService {
  /**
   * Request current GPS location for geotagging
   */
  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        (error) => {
          console.warn('Location error:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Update photo metadata with GPS coordinates
   */
  static async geotagPhoto(photo: Photo): Promise<Photo> {
    const location = await this.getCurrentLocation();

    if (location && !photo.exif?.GPSLatitude) {
      const updatedPhoto: Photo = {
        ...photo,
        exif: {
          ...photo.exif,
          GPSLatitude: location.latitude,
          GPSLongitude: location.longitude,
        },
      };
      return updatedPhoto;
    }

    return photo;
  }

  /**
   * Extract location display name from coordinates
   */
  static async getLocationName(latitude: number, longitude: number): Promise<string> {
    // In a real implementation, this would use a geocoding service
    // For now, return formatted coordinates
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  /**
   * Verify and validate EXIF metadata
   */
  static validateMetadata(photo: Photo): boolean {
    return !!(
      photo.exif?.DateTimeOriginal ||
      photo.width ||
      photo.height ||
      (photo.exif?.GPSLatitude && photo.exif?.GPSLongitude)
    );
  }

  /**
   * Update metadata fields
   */
  static updateMetadata(
    photo: Photo,
    updates: Partial<Photo['exif']>
  ): Photo {
    return {
      ...photo,
      exif: {
        ...photo.exif,
        ...updates,
      },
    };
  }
}

export default MetadataService;
