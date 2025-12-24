import AsyncStorage from '@react-native-async-storage/async-storage';
import UserService from '../../src/services/UserService';
import * as Keychain from 'react-native-keychain';

jest.mock('react-native-keychain');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  describe('register', () => {
    it('should store credentials and create profile', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(true);

      const profile = await UserService.register('test@example.com', 'password123', 'Test User');

      expect(Keychain.setGenericPassword).toHaveBeenCalled();
      expect(profile.email).toBe('test@example.com');
      expect(profile.displayName).toBe('Test User');
    });

    it('should reject weak passwords', async () => {
      await expect(UserService.register('test@example.com', '123', 'Test User'))
        .rejects.toThrow('Password must be at least 8 characters');
    });
  });

  describe('login', () => {
    it('should authenticate with valid credentials', async () => {
      // First register to set up proper credentials and profile
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(true);
      await UserService.register('test@example.com', 'password123', 'Test User');

      // Get the hash that was stored during registration
      const storedHash = (Keychain.setGenericPassword as jest.Mock).mock.calls[0][1];

      // Setup: simulate stored credentials with the actual hash
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        username: 'test@example.com',
        password: storedHash,
      });

      const profile = await UserService.login('test@example.com', 'password123');

      expect(profile).not.toBeNull();
      expect(profile?.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

      await expect(UserService.login('wrong@example.com', 'wrongpass'))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear session but preserve credentials', async () => {
      await UserService.logout();

      const isLoggedIn = await UserService.isLoggedIn();
      expect(isLoggedIn).toBe(false);
    });
  });
});
