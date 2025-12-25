import { Photo } from '../types/photo';

class SearchService {
  static searchByFilename(photos: Photo[], query: string): Photo[] {
    if (!query.trim()) return photos;
    const lowerQuery = query.toLowerCase();
    return photos.filter(p => p.filename.toLowerCase().includes(lowerQuery));
  }

  static filterByDateRange(photos: Photo[], start: Date, end: Date): Photo[] {
    const startTime = start.getTime();
    const endTime = end.getTime();
    return photos.filter(p => {
      const photoTime = typeof p.timestamp === 'number' ? p.timestamp : new Date(p.timestamp).getTime();
      return photoTime >= startTime && photoTime <= endTime;
    });
  }

  static filterByLocation(photos: Photo[]): Photo[] {
    return photos.filter(p => p.exif?.GPSLatitude && p.exif?.GPSLongitude);
  }

  static filterWithoutLocation(photos: Photo[]): Photo[] {
    return photos.filter(p => !(p.exif?.GPSLatitude && p.exif?.GPSLongitude));
  }

  static combineFilters(
    photos: Photo[],
    filters: {
      query?: string;
      startDate?: Date;
      endDate?: Date;
      hasLocation?: boolean;
    }
  ): Photo[] {
    let result = photos;

    if (filters.query) {
      result = this.searchByFilename(result, filters.query);
    }

    if (filters.startDate && filters.endDate) {
      result = this.filterByDateRange(result, filters.startDate, filters.endDate);
    }

    if (filters.hasLocation === true) {
      result = this.filterByLocation(result);
    } else if (filters.hasLocation === false) {
      result = this.filterWithoutLocation(result);
    }

    return result;
  }
}

export default SearchService;
