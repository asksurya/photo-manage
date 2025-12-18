import { Photo } from '../types/photo';

export interface SearchFilters {
  query?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  favoritesOnly?: boolean;
}

class SearchService {
  /**
   * Search and filter photos based on provided criteria
   */
  static searchPhotos(photos: Photo[], filters: SearchFilters): Photo[] {
    return photos.filter(photo => {
      // 1. Filter by favorites
      if (filters.favoritesOnly && !photo.isFavorite) {
        return false;
      }

      // 2. Filter by date range
      if (filters.startDate || filters.endDate) {
        const photoDate = new Date(photo.timestamp);
        if (filters.startDate && photoDate < filters.startDate) {
          return false;
        }
        if (filters.endDate) {
          // Set end date to end of day
          const endOfDay = new Date(filters.endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (photoDate > endOfDay) {
            return false;
          }
        }
      }

      // 3. Filter by text query (filename or metadata)
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const matchesFilename = photo.filename.toLowerCase().includes(query);

        // Check metadata if available
        let matchesMetadata = false;
        if (photo.exif) {
          matchesMetadata =
            (photo.exif.Make && photo.exif.Make.toLowerCase().includes(query)) ||
            (photo.exif.Model && photo.exif.Model.toLowerCase().includes(query));
        }

        if (!matchesFilename && !matchesMetadata) {
          return false;
        }
      }

      // 4. Filter by location (basic implementation matching coords if query provided as coords, or skip for now)
      // Real location search requires reverse geocoding cache or complex spatial query.
      // For now, text search covers basic metadata.

      return true;
    });
  }
}

export default SearchService;
