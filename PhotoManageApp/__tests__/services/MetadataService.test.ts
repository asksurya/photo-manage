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
});
