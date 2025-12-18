import NasSyncService from '../../src/services/NasSyncService';
import { createClient, AuthType } from 'webdav';
import { NasConfig } from '../../src/types/photo';

// Mock webdav
jest.mock('webdav', () => ({
  createClient: jest.fn(),
  AuthType: {
    Password: 'password',
    Digest: 'digest'
  }
}));

// Mock other dependencies to avoid errors
jest.mock('react-native-fs', () => ({
  readFile: jest.fn(),
  downloadFile: jest.fn(),
  exists: jest.fn(),
  mkdir: jest.fn(),
  stat: jest.fn(),
  DocumentDirectoryPath: '/mock/path',
}));
jest.mock('react-native-exif', () => ({
  getExif: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('NasSyncService.initializeWebDavClient', () => {
  const mockConfig: NasConfig = {
    host: '192.168.1.100',
    port: 5005,
    username: 'user',
    password: 'password',
    useHttps: false,
    remotePath: '/photos',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize WebDAV client with correct config', async () => {
    await NasSyncService.initializeWebDavClient(mockConfig);

    expect(createClient).toHaveBeenCalledWith(
      'http://192.168.1.100:5005/photos',
      {
        username: 'user',
        password: 'password',
        authType: AuthType.Password,
      }
    );
  });

  it('should handle HTTPS and default ports', async () => {
     const httpsConfig: NasConfig = {
        ...mockConfig,
        useHttps: true,
        port: undefined, // Should default to 443
        remotePath: undefined // Should default to /
     };

     await NasSyncService.initializeWebDavClient(httpsConfig);

     expect(createClient).toHaveBeenCalledWith(
        'https://192.168.1.100:443/',
        expect.objectContaining({
            username: 'user'
        })
     );
  });

  it('should handle remotePath without leading slash', async () => {
    const config: NasConfig = {
        ...mockConfig,
        remotePath: 'photos/2023'
    };

    await NasSyncService.initializeWebDavClient(config);

    expect(createClient).toHaveBeenCalledWith(
        'http://192.168.1.100:5005/photos/2023',
        expect.objectContaining({
            username: 'user'
        })
    );
  });
});
