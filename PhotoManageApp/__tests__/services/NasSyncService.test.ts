import NasSyncService from '../../src/services/NasSyncService';
import { NasConfig } from '../../src/types/photo';
import { jest } from '@jest/globals';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock btoa if not present (Node environment)
if (!global.btoa) {
  global.btoa = (str: string) => Buffer.from(str).toString('base64');
}

describe('NasSyncService', () => {
  const mockConfig: NasConfig = {
    host: '192.168.1.100',
    port: 8080,
    username: 'user',
    password: 'password',
    useHttps: false,
    remotePath: '/photos',
  };

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should return true when connection is successful', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    });

    const result = await NasSyncService.testConnection(mockConfig);

    expect(result).toBe(true);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://192.168.1.100:8080/photos',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Basic ' + global.btoa('user:password'),
        }),
      })
    );
  });

  it('should handle remotePath without leading slash', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    });

    const config = { ...mockConfig, remotePath: 'photos' };
    const result = await NasSyncService.testConnection(config);

    expect(result).toBe(true);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://192.168.1.100:8080/photos',
      expect.anything()
    );
  });

  it('should return false when connection fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
    });

    const result = await NasSyncService.testConnection(mockConfig);

    expect(result).toBe(false);
  });

  it('should return false when fetch throws an error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await NasSyncService.testConnection(mockConfig);

    expect(result).toBe(false);
  });
});
