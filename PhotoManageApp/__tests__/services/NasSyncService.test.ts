import NasSyncService from '../../src/services/NasSyncService';
import { NasConfig } from '../../src/types/photo';
import RNFS from 'react-native-fs';
import Exif from 'react-native-exif';

describe('NasSyncService', () => {
  const mockConfig: NasConfig = {
    host: '192.168.1.100',
    port: 8080,
    username: 'user',
    password: 'password',
    useHttps: false,
    remotePath: '/photos',
  };

  it('should download photo correctly', async () => {
    const remotePath = '/2023/photo.jpg';

    // Setup mocks
    (RNFS.downloadFile as jest.Mock).mockReturnValue({
      promise: Promise.resolve({ statusCode: 200, bytesWritten: 1024 })
    });
    (RNFS.stat as jest.Mock).mockResolvedValue({
      size: 2048,
      mtime: new Date(),
      ctime: new Date(),
      isFile: () => true,
    });
    (Exif.getExif as jest.Mock).mockResolvedValue({
      DateTimeOriginal: '2023:01:01 12:00:00',
      Make: 'Camera',
      Model: 'Model',
    });

    const photo = await NasSyncService.downloadPhoto(remotePath, mockConfig);

    expect(photo).not.toBeNull();
    if (photo) {
      expect(photo.filename).toBe('photo.jpg');
      expect(photo.size).toBe(2048);
      expect(photo.exif?.Make).toBe('Camera');
      expect(photo.type).toBe('image/jpeg');

      // Check auth header
      const expectedAuth = 'Basic ' + Buffer.from('user:password').toString('base64');

      expect(RNFS.downloadFile).toHaveBeenCalledWith(expect.objectContaining({
        fromUrl: 'http://192.168.1.100:8080/photos/2023/photo.jpg',
        toFile: expect.stringContaining('photo.jpg'),
        headers: expect.objectContaining({
            Authorization: expectedAuth
        })
      }));
    }
  });

  it('should detect mime type correctly', async () => {
    // Setup mocks
    (RNFS.downloadFile as jest.Mock).mockReturnValue({
      promise: Promise.resolve({ statusCode: 200, bytesWritten: 1024 })
    });
    (RNFS.stat as jest.Mock).mockResolvedValue({
      size: 2048,
    });

    // Test PNG
    let photo = await NasSyncService.downloadPhoto('test.png', mockConfig);
    expect(photo?.type).toBe('image/png');

    // Test RAW
    photo = await NasSyncService.downloadPhoto('test.ARW', mockConfig);
    expect(photo?.type).toBe('image/x-raw');
  });

  it('should handle download failure', async () => {
    const remotePath = '/2023/photo.jpg';

    // Setup mocks to fail
    (RNFS.downloadFile as jest.Mock).mockReturnValue({
      promise: Promise.reject(new Error('Download failed'))
    });

    const photo = await NasSyncService.downloadPhoto(remotePath, mockConfig);

    expect(photo).toBeNull();
  });
});
