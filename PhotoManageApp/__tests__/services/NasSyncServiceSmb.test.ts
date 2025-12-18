import NasSyncService from '../../src/services/NasSyncService';
import { SMB2Client } from 'react-native-smb';
import { NasConfig } from '../../src/types/photo';

jest.mock('react-native-smb');

describe('NasSyncService SMB Support', () => {
  const mockConfig: NasConfig = {
    host: '192.168.1.10',
    username: 'user',
    password: 'password',
    remotePath: 'photos/vacation', // Share: photos, Path: vacation
    port: 445,
  };

  let mockConnect: any;
  let mockDisconnect: any;
  let mockUpload: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (SMB2Client as jest.Mock).mockClear();

    mockConnect = jest.fn((cb: any) => cb(null));
    mockDisconnect = jest.fn((cb: any) => cb(null));
    mockUpload = jest.fn((localPath: any, remotePath: any, cb: any) => cb(null, 'id'));

    (SMB2Client as jest.Mock).mockImplementation(() => {
        return {
            connect: mockConnect,
            disconnect: mockDisconnect,
            list: jest.fn((path: any, cb: any) => cb(null, [])),
            upload: mockUpload,
            download: jest.fn((remotePath: any, localPath: any, cb: any) => cb(null, 'id')),
        }
    });
  });

  it('initializeSmbClient creates SMB2Client with correct parameters', async () => {
    const client = await NasSyncService.initializeSmbClient(mockConfig);
    expect(SMB2Client).toHaveBeenCalledWith('192.168.1.10', 'user', 'password', 'photos');
    expect(client).toBeDefined();
  });

  it('initializeSmbClient returns null if no share name found', async () => {
    const badConfig = { ...mockConfig, remotePath: '' };
    const client = await NasSyncService.initializeSmbClient(badConfig);
    expect(client).toBeNull();
  });

  it('testConnection uses SMB client if port is 445', async () => {
    const result = await NasSyncService.testConnection(mockConfig);
    expect(SMB2Client).toHaveBeenCalled();
    // Verify connect and disconnect called
    await new Promise(process.nextTick);

    expect(mockConnect).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('testConnection fails if SMB connect fails', async () => {
     mockConnect.mockImplementation((cb: any) => cb(new Error('Connection failed')));

    const result = await NasSyncService.testConnection(mockConfig);
    expect(result).toBe(false);
  });

  it('uploadPhoto uses SMB client if port is 445', async () => {
    const mockPhoto = {
        id: '1',
        uri: 'file:///path/to/photo.jpg',
        filename: 'photo.jpg',
        type: 'image/jpeg',
        size: 1000,
        timestamp: Date.now()
    };

    const result = await NasSyncService.uploadPhoto(mockPhoto, mockConfig);
    expect(SMB2Client).toHaveBeenCalled();
    expect(mockConnect).toHaveBeenCalled();
    // The path should be relative to share
    expect(mockUpload).toHaveBeenCalledWith('/path/to/photo.jpg', 'vacation/photo.jpg', expect.any(Function));
    expect(mockDisconnect).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
