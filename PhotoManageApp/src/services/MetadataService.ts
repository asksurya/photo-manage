import Geolocation from 'react-native-geolocation-service';
import { Photo } from '../types/photo';

// Simple in-memory cache for location names
const locationCache = new Map<string, string>();

class MetadataService {
  private static requestQueue: Promise<void> = Promise.resolve();

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
   * Extract location display name from coordinates using Nominatim Reverse Geocoding
   * Implements request serialization and rate limiting to respect API usage policy.
   */
  static async getLocationName(latitude: number, longitude: number): Promise<string> {
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;

    // Immediate return if cached
    if (locationCache.has(cacheKey)) {
      return locationCache.get(cacheKey)!;
    }

    // Chain the request to the queue immediately to ensure serialization
    const task = this.requestQueue.then(async () => {
      // Check cache again inside the serialized task
      if (locationCache.has(cacheKey)) {
        return locationCache.get(cacheKey)!;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
          {
            headers: {
              'User-Agent': 'PhotoManageApp/1.0',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.status}`);
        }

        const data = await response.json();
        let locationName = '';

        if (data.address) {
          // Prioritize city, town, village, then county/state
          const city = data.address.city || data.address.town || data.address.village || data.address.hamlet;
          const state = data.address.state || data.address.county;
          const country = data.address.country;

          if (city && country) {
            locationName = `${city}, ${country}`;
          } else if (state && country) {
            locationName = `${state}, ${country}`;
          } else {
            locationName = data.display_name || 'Unknown Location';
          }
        } else {
          locationName = data.display_name || 'Unknown Location';
        }

        // Simplify if too long
        if (locationName.length > 30 && locationName.includes(',')) {
          locationName = locationName.split(',').slice(0, 2).join(',');
        }

        locationCache.set(cacheKey, locationName);

        // Enforce rate limit delay after a successful request
        await new Promise(resolve => setTimeout(resolve, 1100));

        return locationName;
      } catch (error) {
        console.warn('Reverse geocoding error:', error);
        // Fallback to formatted coordinates
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    });

    // Update the queue to wait for this task to finish (ignoring errors for the queue itself)
    this.requestQueue = task.then(() => {}).catch(() => {});

    return task;
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
