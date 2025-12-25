import SearchService from '../../src/services/SearchService';
import { Photo } from '../../src/types/photo';

describe('SearchService', () => {
  const mockPhotos: Photo[] = [
    { id: '1', filename: 'vacation_beach.jpg', timestamp: new Date('2024-01-15').getTime(), uri: '', exif: { GPSLatitude: 25.0, GPSLongitude: -80.0 } },
    { id: '2', filename: 'birthday_party.jpg', timestamp: new Date('2024-02-20').getTime(), uri: '', exif: {} },
    { id: '3', filename: 'vacation_mountain.jpg', timestamp: new Date('2024-01-16').getTime(), uri: '', exif: { GPSLatitude: 39.0, GPSLongitude: -106.0 } },
  ];

  describe('searchByFilename', () => {
    it('should find photos matching filename query', () => {
      const results = SearchService.searchByFilename(mockPhotos, 'vacation');
      expect(results.length).toBe(2);
      expect(results.every(p => p.filename.includes('vacation'))).toBe(true);
    });

    it('should be case insensitive', () => {
      const results = SearchService.searchByFilename(mockPhotos, 'BEACH');
      expect(results.length).toBe(1);
    });

    it('should return all photos for empty query', () => {
      const results = SearchService.searchByFilename(mockPhotos, '');
      expect(results.length).toBe(3);
    });

    it('should return all photos for whitespace query', () => {
      const results = SearchService.searchByFilename(mockPhotos, '   ');
      expect(results.length).toBe(3);
    });
  });

  describe('filterByDateRange', () => {
    it('should filter photos within date range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      const results = SearchService.filterByDateRange(mockPhotos, start, end);
      expect(results.length).toBe(2);
    });
  });

  describe('filterByLocation', () => {
    it('should filter photos with GPS data', () => {
      const results = SearchService.filterByLocation(mockPhotos);
      expect(results.length).toBe(2);
    });
  });

  describe('filterWithoutLocation', () => {
    it('should filter photos without GPS data', () => {
      const results = SearchService.filterWithoutLocation(mockPhotos);
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('2');
    });

    it('should filter photos with partial GPS data (only latitude)', () => {
      const photosWithPartialGPS: Photo[] = [
        { id: '1', filename: 'test.jpg', timestamp: Date.now(), uri: '', exif: { GPSLatitude: 25.0 } },
      ];
      const results = SearchService.filterWithoutLocation(photosWithPartialGPS);
      expect(results.length).toBe(1);
    });

    it('should filter photos with partial GPS data (only longitude)', () => {
      const photosWithPartialGPS: Photo[] = [
        { id: '1', filename: 'test.jpg', timestamp: Date.now(), uri: '', exif: { GPSLongitude: -80.0 } },
      ];
      const results = SearchService.filterWithoutLocation(photosWithPartialGPS);
      expect(results.length).toBe(1);
    });

    it('should handle empty array', () => {
      const results = SearchService.filterWithoutLocation([]);
      expect(results.length).toBe(0);
    });
  });

  describe('combineFilters', () => {
    it('should combine filename and location filters', () => {
      const results = SearchService.combineFilters(mockPhotos, {
        query: 'vacation',
        hasLocation: true,
      });
      expect(results.length).toBe(2);
      expect(results.every(p => p.filename.includes('vacation'))).toBe(true);
      expect(results.every(p => p.exif?.GPSLatitude && p.exif?.GPSLongitude)).toBe(true);
    });

    it('should combine date range and location filters', () => {
      const results = SearchService.combineFilters(mockPhotos, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        hasLocation: true,
      });
      expect(results.length).toBe(2);
    });

    it('should filter photos without location', () => {
      const results = SearchService.combineFilters(mockPhotos, {
        hasLocation: false,
      });
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('2');
    });

    it('should return all photos with no filters', () => {
      const results = SearchService.combineFilters(mockPhotos, {});
      expect(results.length).toBe(3);
    });

    it('should handle empty array', () => {
      const results = SearchService.combineFilters([], {
        query: 'vacation',
        hasLocation: true,
      });
      expect(results.length).toBe(0);
    });

    it('should combine all filters', () => {
      const results = SearchService.combineFilters(mockPhotos, {
        query: 'vacation',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        hasLocation: true,
      });
      expect(results.length).toBe(2);
      expect(results.every(p => p.filename.includes('vacation'))).toBe(true);
    });
  });
});
