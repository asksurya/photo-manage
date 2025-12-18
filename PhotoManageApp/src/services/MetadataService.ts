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
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`,
        {
          headers: {
            'User-Agent': 'PhotoManageApp',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();
      const address = data.address;

      if (address) {
        const city = address.city || address.town || address.village || address.hamlet || address.suburb;
        const country = address.country;

        if (city && country) {
          return `${city}, ${country}`;
        } else if (country) {
          return country;
        } else if (city) {
          return city;
        }
      }

      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      console.warn('Geocoding error:', error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
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
