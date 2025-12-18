import Geolocation from 'react-native-geolocation-service';
import MetadataService from '../../src/services/MetadataService';
import { Photo } from '../../src/types/photo';

jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('MetadataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should geotag a photo', async () => {
    const photo: Photo = {
      id: '1',
      uri: 'file:///test.jpg',
      filename: 'test.jpg',
      timestamp: Date.now(),
      width: 100,
      height: 100,
      exif: {},
    };

    (Geolocation.getCurrentPosition as jest.Mock).mockImplementation((successCallback) => {
      successCallback({
        coords: {
          latitude: 12.34,
          longitude: 56.78,
          altitude: 100,
        },
      });
    });

    const geotaggedPhoto = await MetadataService.geotagPhoto(photo);

    expect(geotaggedPhoto.exif.GPSLatitude).toBe(12.34);
    expect(geotaggedPhoto.exif.GPSLongitude).toBe(56.78);
    expect(geotaggedPhoto.exif.GPSAltitude).toBe(100);
  });

  it('should get location name from coordinates', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          city: 'Test City',
          country: 'Test Country',
        },
      }),
    });

    const locationName = await MetadataService.getLocationName(12.34, 56.78);
    expect(locationName).toBe('Test City, Test Country');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org'),
      expect.objectContaining({
        headers: {
          'User-Agent': 'PhotoManageApp/1.0',
        },
      })
    );
  });

  it('should handle location name fallback', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const locationName = await MetadataService.getLocationName(12.34, 56.78);
    expect(locationName).toBe('12.3400, 56.7800');
  });
});
