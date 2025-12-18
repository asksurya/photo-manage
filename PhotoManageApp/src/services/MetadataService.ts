import Geolocation from 'react-native-geolocation-service';
import { Photo } from '../types/photo';

class MetadataService {
  /**
   * Request current GPS location for geotagging
   */
  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number; altitude: number | null } | null> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, altitude } = position.coords;
          resolve({ latitude, longitude, altitude });
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
          GPSAltitude: location.altitude,
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
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'User-Agent': 'PhotoManageApp/1.0',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.address) {
          const { city, town, village, hamlet, suburb, county, country } = data.address;
          const place = city || town || village || hamlet || suburb || county;
          if (place && country) {
            return `${place}, ${country}`;
          }
        }
        if (data.display_name) {
          return data.display_name.split(',').slice(0, 2).join(',');
        }
      }
    } catch (error) {
      console.warn('Geocoding error:', error);
    }

    // Fallback
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
