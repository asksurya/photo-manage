import CategorizationService from '../../src/services/CategorizationService';
import MetadataService from '../../src/services/MetadataService';
import { Photo, CategoryType } from '../../src/types/photo';

// Mock MetadataService
jest.mock('../../src/services/MetadataService', () => ({
  getLocationName: jest.fn(),
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

    // Use mock resolved value for getLocationName to avoid errors in getAllCategories
    (MetadataService.getLocationName as jest.Mock).mockResolvedValue('Unknown Location');

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

    // Mock getLocationName implementation based on coordinates
    (MetadataService.getLocationName as jest.Mock).mockImplementation(async (lat, lon) => {
      if (lat === 12.34 && lon === 56.78) return 'City A';
      if (lat === 43.21 && lon === 87.65) return 'City B';
      return 'Unknown';
    });

    const categories = await CategorizationService.getAllCategories(photos);
    const locationCategories = categories[CategoryType.LOCATION];

    expect(locationCategories.length).toBe(2);

    // Check first location group (sorted by title)
    // "City A" < "City B"
    const groupA = locationCategories.find(g => g.title === 'City A');
    expect(groupA).toBeDefined();
    expect(groupA!.photos.length).toBe(2);

    const groupB = locationCategories.find(g => g.title === 'City B');
    expect(groupB).toBeDefined();
    expect(groupB!.photos.length).toBe(1);

    expect(MetadataService.getLocationName).toHaveBeenCalledTimes(2);
  });
});
