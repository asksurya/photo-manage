import { Photo } from '../types/photo';
import PhotoService from './PhotoService';

export interface PhotoCluster {
  id: string;
  latitude: number;
  longitude: number;
  photos: Photo[];
  count: number;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

class MapService {
  /**
   * Default location (San Francisco) when no photos have GPS data
   */
  static readonly DEFAULT_REGION: Region = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  /**
   * Get all photos that have GPS coordinates
   */
  static async getPhotosWithLocation(): Promise<Photo[]> {
    const allPhotos = await PhotoService.loadPhotos();
    return this.filterPhotosWithLocation(allPhotos);
  }

  /**
   * Filter photos that have valid GPS coordinates
   */
  static filterPhotosWithLocation(photos: Photo[]): Photo[] {
    return photos.filter(
      (photo) =>
        photo.exif?.GPSLatitude !== undefined &&
        photo.exif?.GPSLongitude !== undefined &&
        !isNaN(photo.exif.GPSLatitude) &&
        !isNaN(photo.exif.GPSLongitude)
    );
  }

  /**
   * Group photos by location into clusters
   * Uses a simple grid-based clustering approach
   * @param photos - Photos with GPS coordinates
   * @param precision - Grid size in degrees (default ~1km at equator)
   */
  static groupPhotosByLocation(
    photos: Photo[],
    precision: number = 0.01
  ): PhotoCluster[] {
    const clusters: Map<string, PhotoCluster> = new Map();

    for (const photo of photos) {
      if (!photo.exif?.GPSLatitude || !photo.exif?.GPSLongitude) {
        continue;
      }

      const lat = photo.exif.GPSLatitude;
      const lng = photo.exif.GPSLongitude;

      // Create a grid key based on precision
      const gridLat = Math.floor(lat / precision) * precision;
      const gridLng = Math.floor(lng / precision) * precision;
      const key = `${gridLat.toFixed(6)}_${gridLng.toFixed(6)}`;

      if (!clusters.has(key)) {
        clusters.set(key, {
          id: key,
          latitude: gridLat + precision / 2,
          longitude: gridLng + precision / 2,
          photos: [],
          count: 0,
        });
      }

      const cluster = clusters.get(key)!;
      cluster.photos.push(photo);
      cluster.count = cluster.photos.length;

      // Update cluster center to be the average of all photo locations
      const totalLat = cluster.photos.reduce(
        (sum, p) => sum + (p.exif?.GPSLatitude || 0),
        0
      );
      const totalLng = cluster.photos.reduce(
        (sum, p) => sum + (p.exif?.GPSLongitude || 0),
        0
      );
      cluster.latitude = totalLat / cluster.photos.length;
      cluster.longitude = totalLng / cluster.photos.length;
    }

    return Array.from(clusters.values());
  }

  /**
   * Calculate the initial map region based on photo locations
   * Centers on the geographic center of all photos with appropriate zoom
   */
  static calculateInitialRegion(photos: Photo[]): Region {
    const photosWithLocation = this.filterPhotosWithLocation(photos);

    if (photosWithLocation.length === 0) {
      return this.DEFAULT_REGION;
    }

    // Calculate bounds
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const photo of photosWithLocation) {
      const lat = photo.exif!.GPSLatitude!;
      const lng = photo.exif!.GPSLongitude!;

      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }

    // Calculate center and deltas
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Add padding to the deltas
    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.01);

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }

  /**
   * Get cluster precision based on zoom level (latitude delta)
   * Smaller delta = more zoomed in = smaller precision = more clusters
   */
  static getClusterPrecision(latitudeDelta: number): number {
    if (latitudeDelta > 10) {
      return 1; // Very zoomed out, large clusters
    } else if (latitudeDelta > 1) {
      return 0.1;
    } else if (latitudeDelta > 0.1) {
      return 0.01;
    } else if (latitudeDelta > 0.01) {
      return 0.001;
    } else {
      return 0.0001; // Very zoomed in, show individual photos
    }
  }
}

export default MapService;
