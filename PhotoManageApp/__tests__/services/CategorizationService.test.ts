import CategorizationService from '../../src/services/CategorizationService';
import MetadataService from '../../src/services/MetadataService';
import { Photo, CategoryType } from '../../src/types/photo';

// Mock MetadataService
jest.mock('../../src/services/MetadataService', () => ({
  getLocationName: jest.fn().mockImplementation((lat, lng) => Promise.resolve(`${lat.toFixed(2)}, ${lng.toFixed(2)} Name`)),
}));

describe('CategorizationService', () => {
  it('should categorize photos by date', () => {
    const photos: Photo[] = [
      { id: '1', uri: 'file:///test1.jpg', filename: 'test1.jpg', timestamp: new Date('2024-01-01').getTime(), width: 100, height: 100, exif: {} },
      { id: '2', uri: 'file:///test2.jpg', filename: 'test2.jpg', timestamp: new Date('2024-01-01').getTime(), width: 100, height: 100, exif: {} },
      { id: '3', uri: 'file:///test3.jpg', filename: 'test3.jpg', timestamp: new Date('2024-01-02').getTime(), width: 100, height: 100, exif: {} },
    ];

    const categories = CategorizationService.categorizeByDate(photos);
    expect(categories.length).toBe(2);
    expect(categories[0].title).toContain('1/2/2024');
    expect(categories[0].photos.length).toBe(1);
    expect(categories[1].title).toContain('1/1/2024');
    expect(categories[1].photos.length).toBe(2);
  });

  it('should categorize photos by location', async () => {
    const photos: Photo[] = [
      { id: '1', uri: 'file:///test1.jpg', filename: 'test1.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 12.34, GPSLongitude: 56.78 } },
      { id: '2', uri: 'file:///test2.jpg', filename: 'test2.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 12.34, GPSLongitude: 56.78 } },
      { id: '3', uri: 'file:///test3.jpg', filename: 'test3.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 43.21, GPSLongitude: 87.65 } },
    ];

    const categories = await CategorizationService.categorizeByLocation(photos);
    expect(categories.length).toBe(2);
    // The implementation groups by rounded coordinates (3 decimals), so 12.34 becomes 12.34
    // We mocked MetadataService.getLocationName to return "lat, lng Name"
    expect(categories[0].title).toContain('12.34, 56.78 Name');
    expect(categories[0].photos.length).toBe(2);
    expect(categories[1].title).toContain('43.21, 87.65 Name');
    expect(categories[1].photos.length).toBe(1);

    expect(MetadataService.getLocationName).toHaveBeenCalledTimes(2);
  });

  it('should get all categories', async () => {
    const photos: Photo[] = [
      { id: '1', uri: 'file:///test1.jpg', filename: 'test1.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 12.34, GPSLongitude: 56.78 } },
    ];

    const categories = await CategorizationService.getAllCategories(photos);

    expect(categories[CategoryType.DATE]).toBeDefined();
    expect(categories[CategoryType.LOCATION]).toBeDefined();
    expect(categories[CategoryType.CONTENT]).toBeDefined();

    const locationCategories = categories[CategoryType.LOCATION];
    expect(locationCategories.length).toBe(1);
    expect(locationCategories[0].title).toContain('12.34, 56.78 Name');
  });
});
