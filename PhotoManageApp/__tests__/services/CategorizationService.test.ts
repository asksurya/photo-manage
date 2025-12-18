import CategorizationService from '../../src/services/CategorizationService';
import { Photo, CategoryType } from '../../src/types/photo';

import MetadataService from '../../src/services/MetadataService';

// Mock fetch for MetadataService
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ display_name: 'Test Place, Test Country' }),
  })
) as jest.Mock;

describe('CategorizationService', () => {
  it('should categorize photos by date', async () => {
    const photos: Photo[] = [
      { id: '1', uri: 'file:///test1.jpg', filename: 'test1.jpg', timestamp: new Date('2024-01-01').getTime(), width: 100, height: 100, exif: {} },
      { id: '2', uri: 'file:///test2.jpg', filename: 'test2.jpg', timestamp: new Date('2024-01-01').getTime(), width: 100, height: 100, exif: {} },
      { id: '3', uri: 'file:///test3.jpg', filename: 'test3.jpg', timestamp: new Date('2024-01-02').getTime(), width: 100, height: 100, exif: {} },
    ];

    const categories = await CategorizationService.getAllCategories(photos);
    const dateCategories = categories[CategoryType.DATE];
    expect(dateCategories.length).toBe(2);
    expect(dateCategories[0].title).toContain('1/2/2024');
    expect(dateCategories[0].photos.length).toBe(1);
    expect(dateCategories[1].title).toContain('1/1/2024');
    expect(dateCategories[1].photos.length).toBe(2);
  });

  it('should categorize photos by location', async () => {
    const photos: Photo[] = [
      { id: '1', uri: 'file:///test1.jpg', filename: 'test1.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 12.34, GPSLongitude: 56.78 } },
      { id: '2', uri: 'file:///test2.jpg', filename: 'test2.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 12.34, GPSLongitude: 56.78 } },
      { id: '3', uri: 'file:///test3.jpg', filename: 'test3.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 43.21, GPSLongitude: 87.65 } },
    ];

    // Mock getLocationName specifically for this test if needed, or rely on fetch mock
    const categories = await CategorizationService.getAllCategories(photos);
    const locationCategories = categories[CategoryType.LOCATION];
    expect(locationCategories.length).toBe(2);
    // Since we mock fetch to return "Test Place, Test Country", we check for that
    expect(locationCategories[0].title).toBe('Test Place, Test Country');
    expect(locationCategories[0].photos.length).toBe(2);
    expect(locationCategories[1].title).toBe('Test Place, Test Country');
    expect(locationCategories[1].photos.length).toBe(1);
  });
});
