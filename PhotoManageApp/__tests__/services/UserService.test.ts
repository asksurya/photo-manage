import UserService from '../../src/services/UserService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthToken } from '../../src/types/auth';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  multiRemove: jest.fn(),
  removeItem: jest.fn(),
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBasicProfile', () => {
    it('should create a user profile and save a structured auth token', async () => {
      const email = 'test@example.com';
      const displayName = 'Test User';

      const profile = await UserService.createBasicProfile(email, displayName);

      expect(profile.email).toBe(email);
      expect(profile.displayName).toBe(displayName);
      expect(profile.id).toBeDefined();

      // Check if profile was saved
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_user_profile',
        JSON.stringify(profile)
      );

      // Check if auth token was saved and is structured
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@photo_manage_auth_token',
        expect.stringMatching(/"accessToken":/)
      );

      const setTokenCall = (AsyncStorage.setItem as jest.Mock).mock.calls.find(call => call[0] === '@photo_manage_auth_token');
      const savedToken = JSON.parse(setTokenCall[1]);

      expect(savedToken).toHaveProperty('accessToken');
      expect(savedToken).toHaveProperty('refreshToken');
      expect(savedToken).toHaveProperty('expiresIn');
      expect(savedToken).toHaveProperty('issuedAt');
      expect(savedToken).toHaveProperty('tokenType', 'Bearer');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if valid token and profile exist', async () => {
      const validToken: AuthToken = {
        accessToken: 'valid',
        refreshToken: 'valid',
        expiresIn: 3600,
        issuedAt: Date.now(),
        tokenType: 'Bearer'
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@photo_manage_auth_token') return Promise.resolve(JSON.stringify(validToken));
        if (key === '@photo_manage_user_profile') return Promise.resolve(JSON.stringify({ id: '1' }));
        return Promise.resolve(null);
      });

      const result = await UserService.isAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false if token is expired', async () => {
      const expiredToken: AuthToken = {
        accessToken: 'expired',
        refreshToken: 'valid',
        expiresIn: 3600,
        issuedAt: Date.now() - 4000000, // Expired
        tokenType: 'Bearer'
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@photo_manage_auth_token') return Promise.resolve(JSON.stringify(expiredToken));
        if (key === '@photo_manage_user_profile') return Promise.resolve(JSON.stringify({ id: '1' }));
        return Promise.resolve(null);
      });

      const result = await UserService.isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return false if no token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await UserService.isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('saveAuthToken & getAuthSession & getAuthToken', () => {
    it('should save and retrieve auth token correctly', async () => {
      const token: AuthToken = {
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 1234,
        issuedAt: 1234567890,
        tokenType: 'Bearer'
      };

      await UserService.saveAuthToken(token);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@photo_manage_auth_token', JSON.stringify(token));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(token));

      const session = await UserService.getAuthSession();
      expect(session).toEqual(token);

      const accessToken = await UserService.getAuthToken();
      expect(accessToken).toEqual('access');
    });
  });
});
