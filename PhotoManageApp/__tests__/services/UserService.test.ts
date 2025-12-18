import UserService from '../../src/services/UserService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
  clear: jest.fn(),
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const displayName = 'Test User';

      const profile = await UserService.registerUser(email, password, displayName);

      expect(profile).toBeDefined();
      expect(profile.email).toBe(email);
      expect(profile.displayName).toBe(displayName);
      expect(profile.passwordHash).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_user_profile',
        expect.stringContaining(email)
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_auth_token',
        expect.stringContaining('token-')
      );
    });
  });

  describe('loginUser', () => {
    it('should login successfully with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = '321drowssap-hashed'; // reverse of 'password123' + '-hashed'

      const mockProfile = {
        id: 'user-123',
        email,
        displayName: 'Test User',
        passwordHash: hashedPassword,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockProfile));

      const result = await UserService.loginUser(email, password);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_auth_token',
        `token-${mockProfile.id}`
      );
    });

    it('should fail login with incorrect password', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const hashedPassword = '321drowssap-hashed';

      const mockProfile = {
        id: 'user-123',
        email,
        displayName: 'Test User',
        passwordHash: hashedPassword,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockProfile));

      const result = await UserService.loginUser(email, password);

      expect(result).toBe(false);
    });

    it('should fail login with incorrect email', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockProfile = {
        id: 'user-123',
        email: 'other@example.com',
        displayName: 'Test User',
        passwordHash: 'somehash',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockProfile));

      const result = await UserService.loginUser(email, password);

      expect(result).toBe(false);
    });
  });

  describe('updateNasConfig', () => {
    it('should update NAS config when user is logged in', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      const nasConfig = {
        host: '192.168.1.100',
        username: 'admin',
        password: 'password',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockProfile));

      await UserService.updateNasConfig(nasConfig);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_user_profile',
        expect.stringContaining('"host":"192.168.1.100"')
      );
    });

    it('should throw error when user is not logged in', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const nasConfig = {
        host: '192.168.1.100',
        username: 'admin',
        password: 'password',
      };

      await expect(UserService.updateNasConfig(nasConfig)).rejects.toThrow(
        'User must be logged in to update NAS config'
      );
    });
  });
});
