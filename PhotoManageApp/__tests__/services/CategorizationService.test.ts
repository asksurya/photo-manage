import CategorizationService from '../../src/services/CategorizationService';
import MetadataService from '../../src/services/MetadataService';
import { Photo, CategoryType } from '../../src/types/photo';

// Mock MetadataService
jest.mock('../../src/services/MetadataService', () => ({
  getLocationName: jest.fn().mockImplementation((lat, lng) => Promise.resolve(`${lat.toFixed(2)}, ${lng.toFixed(2)} Name`)),
}));

describe('CategorizationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should categorize photos by date', async () => {
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

  it('should categorize photos by location', () => {
    const photos: Photo[] = [
      { id: '1', uri: 'file:///test1.jpg', filename: 'test1.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 12.34, GPSLongitude: 56.78 } },
      { id: '2', uri: 'file:///test2.jpg', filename: 'test2.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 12.34, GPSLongitude: 56.78 } },
      { id: '3', uri: 'file:///test3.jpg', filename: 'test3.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 43.21, GPSLongitude: 87.65 } },
    ];

    const categories = CategorizationService.categorizeByLocation(photos);
    expect(categories.length).toBe(2);
    expect(categories[0].title).toContain('12.34');
    expect(categories[0].photos.length).toBe(2);
    expect(categories[1].title).toContain('43.21');
    expect(categories[1].photos.length).toBe(1);
  });

  it('should enrich category titles', async () => {
    const photos: Photo[] = [
      { id: '1', uri: 'file:///test1.jpg', filename: 'test1.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 12.34, GPSLongitude: 56.78 } },
    ];

    const initialCategories = CategorizationService.getAllCategories(photos);
    expect(initialCategories[CategoryType.LOCATION][0].title).toContain('12.34');

    const enrichedCategories = await CategorizationService.enrichCategoryTitles(initialCategories);
    expect(enrichedCategories[CategoryType.LOCATION][0].title).toContain('12.34, 56.78 Name');
    expect(MetadataService.getLocationName).toHaveBeenCalledTimes(1);
  });
});
