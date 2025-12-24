import NasSyncService from '../../src/services/NasSyncService';
import { NasConfig, Photo } from '../../src/types/photo';

describe('NasSyncService', () => {
  const mockConfig: NasConfig = {
    host: '192.168.1.100',
    port: 5005,
    username: 'admin',
    password: 'password',
    remotePath: '/photos',
    useHttps: false,
  };

  const mockPhoto: Photo = {
    id: '1',
    uri: 'file:///test.jpg',
    filename: 'test.jpg',
    type: 'image/jpeg',
    size: 1024,
    timestamp: new Date(),
  };

  describe('testConnection', () => {
    it('should return true for valid config', async () => {
      const result = await NasSyncService.testConnection(mockConfig);
      expect(result).toBe(true);
    });

    it('should return false for missing host', async () => {
      const invalidConfig = { ...mockConfig, host: '' };
      const result = await NasSyncService.testConnection(invalidConfig);
      expect(result).toBe(false);
    });
  });

  describe('buildWebDavUrl', () => {
    it('should build correct HTTP URL', () => {
      const url = NasSyncService.buildWebDavUrl(mockConfig, 'test.jpg');
      expect(url).toBe('http://192.168.1.100:5005/photos/test.jpg');
    });

    it('should build correct HTTPS URL', () => {
      const httpsConfig = { ...mockConfig, useHttps: true, port: 443 };
      const url = NasSyncService.buildWebDavUrl(httpsConfig, 'test.jpg');
      expect(url).toBe('https://192.168.1.100:443/photos/test.jpg');
    });
  });

  describe('getAuthHeader', () => {
    it('should return valid Basic auth header', () => {
      const header = NasSyncService.getAuthHeader(mockConfig);
      const expected = 'Basic ' + Buffer.from('admin:password').toString('base64');
      expect(header).toBe(expected);
    });
  });

  describe('uploadPhoto', () => {
    it('should upload photo successfully', async () => {
      const result = await NasSyncService.uploadPhoto(mockPhoto, mockConfig);
      expect(result).toBe(true);
    });
  });

  describe('syncToNas', () => {
    it('should return sync results', async () => {
      const photos = [mockPhoto];
      const result = await NasSyncService.syncToNas(photos, mockConfig);
      expect(result).toHaveProperty('successful');
      expect(result).toHaveProperty('failed');
    });
  });
});
