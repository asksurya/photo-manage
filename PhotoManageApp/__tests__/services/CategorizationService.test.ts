import CategorizationService from '../../src/services/CategorizationService';
import { Photo, CategoryType } from '../../src/types/photo';

import MetadataService from '../../src/services/MetadataService';

// Mock MetadataService to avoid actual network calls
jest.mock('../../src/services/MetadataService', () => ({
  getLocationName: jest.fn(),
}));

describe('CategorizationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (MetadataService.getLocationName as jest.Mock).mockResolvedValue('Mocked City');
  });

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

    (MetadataService.getLocationName as jest.Mock)
      .mockResolvedValueOnce('Place A')
      .mockResolvedValueOnce('Place B');

    const categories = await CategorizationService.getAllCategories(photos);
    const locationCategories = categories[CategoryType.LOCATION];

    // Check that we have 2 location groups
    expect(locationCategories.length).toBe(2);

    // Sort logic in service: alpha sort. 'Place A' < 'Place B'
    // But we mocked return values.
    // The service sorts by title.

    // Find groups by their titles as sorting might vary
    const placeAGroup = locationCategories.find(g => g.title === 'Place A');
    const placeBGroup = locationCategories.find(g => g.title === 'Place B');

    expect(placeAGroup).toBeDefined();
    expect(placeAGroup!.photos.length).toBe(2);

    expect(placeBGroup).toBeDefined();
    expect(placeBGroup!.photos.length).toBe(1);

    expect(MetadataService.getLocationName).toHaveBeenCalledTimes(2);
  });
});
