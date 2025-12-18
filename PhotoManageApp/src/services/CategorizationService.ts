import { Photo, PhotoPair, CategoryType } from '../types/photo';
import MetadataService from './MetadataService';

interface CategoryGroup {
  id: string;
  title: string;
  photos: Photo[];
  pairs: PhotoPair[];
  type: CategoryType;
}

class CategorizationService {
  /**
   * Categorize photos by date (day level)
   */
  static categorizeByDate(photos: Photo[]): CategoryGroup[] {
    const groups = new Map<string, CategoryGroup>();

    photos.forEach(photo => {
      const date = new Date(photo.timestamp).toDateString(); // Group by day
      const dateLabel = new Date(photo.timestamp).toLocaleDateString();

      if (!groups.has(date)) {
        groups.set(date, {
          id: `date-${date}`,
          title: dateLabel,
          photos: [],
          pairs: [],
          type: CategoryType.DATE,
        });
      }

      groups.get(date)!.photos.push(photo);
    });

    // Sort photos within each group by timestamp
    groups.forEach(group => {
      group.photos.sort((a, b) => b.timestamp - a.timestamp);
    });

    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      return b.photos[0].timestamp - a.photos[0].timestamp;
    });

    return sortedGroups;
  }

  /**
   * Categorize photos by location (if GPS data exists)
   */
  static async categorizeByLocation(photos: Photo[]): Promise<CategoryGroup[]> {
    const groups = new Map<string, CategoryGroup>();
    const locationPromises: Promise<void>[] = [];

    // Only categorize photos that have GPS data
    const photosWithLocation = photos.filter(photo =>
      photo.exif?.GPSLatitude && photo.exif?.GPSLongitude
    );

    photosWithLocation.forEach(photo => {
      // Create a rough location key (rounded to ~100m precision)
      const lat = Math.round((photo.exif!.GPSLatitude!) * 1000) / 1000;
      const lng = Math.round((photo.exif!.GPSLongitude!) * 1000) / 1000;
      const locationKey = `${lat},${lng}`;

      if (!groups.has(locationKey)) {
        groups.set(locationKey, {
          id: `location-${locationKey}`,
          title: `Location: ${locationKey}`, // Temporary title
          photos: [],
          pairs: [],
          type: CategoryType.LOCATION,
        });

        // Fetch actual location name. MetadataService handles throttling and caching.
        locationPromises.push(
          MetadataService.getLocationName(lat, lng).then(name => {
            const group = groups.get(locationKey);
            if (group) {
              group.title = name;
            }
          })
        );
      }

      groups.get(locationKey)!.photos.push(photo);
    });

    // Wait for all location names to be fetched
    // MetadataService ensures these execute sequentially if not cached
    await Promise.all(locationPromises);

    // Add photos without location to a separate group
    const photosWithoutLocation = photos.filter(photo =>
      !photo.exif?.GPSLatitude || !photo.exif?.GPSLongitude
    );

    if (photosWithoutLocation.length > 0) {
      groups.set('no-location', {
        id: 'location-no-location',
        title: 'No Location Data',
        photos: photosWithoutLocation,
        pairs: [],
        type: CategoryType.LOCATION,
      });
    }

    return this.sortGroupsByLocation(Array.from(groups.values()));
  }

  /**
   * Categorize photos by content (basic implementation)
   * This would require ML/image recognition in a real implementation
   */
  static categorizeByContent(photos: Photo[]): CategoryGroup[] {
    const groups = new Map<string, CategoryGroup>();

    // Simple categorization based on filename patterns and other metadata
    photos.forEach(photo => {
      let category = 'General';

      // Categorize based on filename patterns
      const filename = photo.filename.toLowerCase();

      if (filename.includes('portrait') || filename.includes(' portrait')) {
        category = 'Portraits';
      } else if (filename.includes('landscape') || filename.includes('scenery')) {
        category = 'Landscapes';
      } else if (filename.includes('wedding') || filename.includes('event')) {
        category = 'Events';
      } else if (photo.exif?.Model) {
        // Group by camera model if available
        category = `Camera: ${photo.exif.Model}`;
      }

      if (!groups.has(category)) {
        groups.set(category, {
          id: `content-${category.replace(/\s+/g, '-').toLowerCase()}`,
          title: category,
          photos: [],
          pairs: [],
          type: CategoryType.CONTENT,
        });
      }

      groups.get(category)!.photos.push(photo);
    });

    return this.sortGroupsByName(Array.from(groups.values()));
  }

  /**
   * Get all categorization options
   */
  static async getAllCategories(photos: Photo[]): Promise<{ [key in CategoryType]: CategoryGroup[] }> {
    const locationCategories = await this.categorizeByLocation(photos);

    return {
      [CategoryType.DATE]: this.categorizeByDate(photos),
      [CategoryType.LOCATION]: locationCategories,
      [CategoryType.CONTENT]: this.categorizeByContent(photos),
    };
  }

  private static sortGroupsByName(groups: CategoryGroup[]): CategoryGroup[] {
    return groups.sort((a, b) => a.title.localeCompare(b.title));
  }

  private static sortGroupsByLocation(groups: CategoryGroup[]): CategoryGroup[] {
    // Prioritize groups with actual GPS data over "No Location"
    return groups.sort((a, b) => {
      if (a.id === 'location-no-location') return 1;
      if (b.id === 'location-no-location') return -1;
      return a.title.localeCompare(b.title);
    });
  }
}

export default CategorizationService;
export type { CategoryGroup };
