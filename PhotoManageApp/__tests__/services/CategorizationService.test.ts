import CategorizationService from '../../src/services/CategorizationService';
import { Photo, CategoryType } from '../../src/types/photo';

describe('CategorizationService', () => {
  it('should categorize photos by date', () => {
    const photos: Photo[] = [
      { id: '1', uri: 'file:///test1.jpg', filename: 'test1.jpg', timestamp: new Date('2024-01-01').getTime(), width: 100, height: 100, exif: {} },
      { id: '2', uri: 'file:///test2.jpg', filename: 'test2.jpg', timestamp: new Date('2024-01-01').getTime(), width: 100, height: 100, exif: {} },
      { id: '3', uri: 'file:///test3.jpg', filename: 'test3.jpg', timestamp: new Date('2024-01-02').getTime(), width: 100, height: 100, exif: {} },
    ];

    const categories = CategorizationService.getAllCategories(photos);
    const dateCategories = categories[CategoryType.DATE];
    expect(dateCategories.length).toBe(2);
    expect(dateCategories[0].title).toContain('1/2/2024');
    expect(dateCategories[0].photos.length).toBe(1);
    expect(dateCategories[1].title).toContain('1/1/2024');
    expect(dateCategories[1].photos.length).toBe(2);
  });

  it('should categorize photos by location', () => {
    const photos: Photo[] = [
      { id: '1', uri: 'file:///test1.jpg', filename: 'test1.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 12.34, GPSLongitude: 56.78 } },
      { id: '2', uri: 'file:///test2.jpg', filename: 'test2.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 12.34, GPSLongitude: 56.78 } },
      { id: '3', uri: 'file:///test3.jpg', filename: 'test3.jpg', timestamp: Date.now(), width: 100, height: 100, exif: { GPSLatitude: 43.21, GPSLongitude: 87.65 } },
    ];

    const categories = CategorizationService.getAllCategories(photos);
    const locationCategories = categories[CategoryType.LOCATION];
    expect(locationCategories.length).toBe(2);
    expect(locationCategories[0].title).toContain('12.34');
    expect(locationCategories[0].photos.length).toBe(2);
    expect(locationCategories[1].title).toContain('43.21');
    expect(locationCategories[1].photos.length).toBe(1);
  });
});
