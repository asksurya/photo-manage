import Geolocation from 'react-native-geolocation-service';
import MetadataService from '../../src/services/MetadataService';
import { Photo } from '../../src/types/photo';

jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
}));

describe('MetadataService', () => {
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
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        address: {
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
        },
      }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const locationName = await MetadataService.getLocationName(12.34, 56.78);

    expect(locationName).toBe('Test City, Test State');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/reverse'),
      expect.objectContaining({
        headers: { 'User-Agent': 'PhotoManageApp/1.0' },
      })
    );
  });

  it('should use cached location name for subsequent requests', async () => {
    // Manually clear cache/reset for this test if needed, but since we can't access private cache,
    // we rely on a new set of coordinates
    const lat = 10.0;
    const lng = 20.0;

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        address: {
          city: 'Cached City',
        },
      }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    // First request
    await MetadataService.getLocationName(lat, lng);

    // Second request should hit cache
    const locationName = await MetadataService.getLocationName(lat, lng);

    expect(locationName).toBe('Cached City');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should fallback to coordinates if geocoding fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    // Use unique coordinates to bypass cache from previous tests
    const locationName = await MetadataService.getLocationName(99.99, 88.88);

    expect(locationName).toBe('99.9900, 88.8800');
  });
});
