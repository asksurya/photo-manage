import SearchService, { SearchFilters } from '../../src/services/SearchService';
import { Photo } from '../../src/types/photo';

describe('SearchService', () => {
  const mockPhotos: Photo[] = [
    {
      id: '1',
      uri: 'uri1',
      filename: 'IMG_20230101.jpg',
      type: 'image/jpeg',
      size: 1000,
      timestamp: new Date('2023-01-01T12:00:00').getTime(),
      isFavorite: true,
      exif: { Make: 'Canon', Model: 'EOS R5' },
    },
    {
      id: '2',
      uri: 'uri2',
      filename: 'DSC00123.jpg',
      type: 'image/jpeg',
      size: 2000,
      timestamp: new Date('2023-02-15T15:30:00').getTime(),
      isFavorite: false,
      exif: { Make: 'Sony', Model: 'A7III' },
    },
    {
      id: '3',
      uri: 'uri3',
      filename: 'Photo_Vacation.jpg',
      type: 'image/jpeg',
      size: 1500,
      timestamp: new Date('2023-06-20T10:00:00').getTime(),
      isFavorite: true,
    },
  ];

  it('should filter by text query (filename)', () => {
    const filters: SearchFilters = { query: 'Vacation' };
    const results = SearchService.searchPhotos(mockPhotos, filters);
    expect(results.length).toBe(1);
    expect(results[0].filename).toBe('Photo_Vacation.jpg');
  });

  it('should filter by text query (metadata)', () => {
    const filters: SearchFilters = { query: 'Sony' };
    const results = SearchService.searchPhotos(mockPhotos, filters);
    expect(results.length).toBe(1);
    expect(results[0].exif?.Make).toBe('Sony');
  });

  it('should filter by favorites only', () => {
    const filters: SearchFilters = { favoritesOnly: true };
    const results = SearchService.searchPhotos(mockPhotos, filters);
    expect(results.length).toBe(2);
    expect(results.every(p => p.isFavorite)).toBe(true);
  });

  it('should filter by date range', () => {
    const filters: SearchFilters = {
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-31'),
    };
    const results = SearchService.searchPhotos(mockPhotos, filters);
    expect(results.length).toBe(1);
    expect(results[0].filename).toBe('IMG_20230101.jpg');
  });

  it('should combine filters', () => {
    const filters: SearchFilters = {
      query: 'IMG',
      favoritesOnly: true,
    };
    const results = SearchService.searchPhotos(mockPhotos, filters);
    expect(results.length).toBe(1);
    expect(results[0].filename).toBe('IMG_20230101.jpg');
  });

  it('should return empty list if no matches', () => {
    const filters: SearchFilters = { query: 'NonExistent' };
    const results = SearchService.searchPhotos(mockPhotos, filters);
    expect(results.length).toBe(0);
  });
});
