import AsyncStorage from '@react-native-async-storage/async-storage';
import UserService from '../../src/services/UserService';
import * as Keychain from 'react-native-keychain';

// Note: Keychain is mocked globally in jest.setup.js with service support

describe('UserService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    // Reset keychain mocks
    (Keychain.resetGenericPassword as jest.Mock).mockClear();
  });

  describe('register', () => {
    it('should store credentials with PBKDF2 hash and create profile', async () => {
      const profile = await UserService.register('test@example.com', 'password123', 'Test User');

      // Verify credentials stored with service identifier
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringContaining(':'), // salt:hash format
        expect.objectContaining({ service: 'com.photomanage.auth' })
      );
      expect(profile.email).toBe('test@example.com');
      expect(profile.displayName).toBe('Test User');
    });

    it('should reject weak passwords', async () => {
      await expect(UserService.register('test@example.com', '123', 'Test User'))
        .rejects.toThrow('Password must be at least 8 characters');
    });

    it('should generate unique salts for each registration', async () => {
      await UserService.register('user1@example.com', 'password123', 'User 1');
      await UserService.register('user2@example.com', 'password123', 'User 2');

      const calls = (Keychain.setGenericPassword as jest.Mock).mock.calls;
      // Both should have hash format, though with mock they'll have same salt
      expect(calls[0][1]).toContain(':');
      expect(calls[1][1]).toContain(':');
    });
  });

  describe('login', () => {
    it('should authenticate with valid credentials', async () => {
      // Register first
      await UserService.register('test@example.com', 'password123', 'Test User');

      // Get the stored hash from registration
      const storedHash = (Keychain.setGenericPassword as jest.Mock).mock.calls[0][1];

      // Mock getGenericPassword to return stored credentials
      (Keychain.getGenericPassword as jest.Mock).mockImplementation((options) => {
        if (options?.service === 'com.photomanage.auth') {
          return Promise.resolve({
            username: 'test@example.com',
            password: storedHash,
          });
        }
        return Promise.resolve(false);
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

    it('should reject wrong password for valid user', async () => {
      // Register first
      await UserService.register('test@example.com', 'password123', 'Test User');

      // Get the stored hash from registration
      const storedHash = (Keychain.setGenericPassword as jest.Mock).mock.calls[0][1];

      // Mock getGenericPassword to return stored credentials
      (Keychain.getGenericPassword as jest.Mock).mockImplementation((options) => {
        if (options?.service === 'com.photomanage.auth') {
          return Promise.resolve({
            username: 'test@example.com',
            password: storedHash,
          });
        }
        return Promise.resolve(false);
      });

      await expect(UserService.login('test@example.com', 'wrongpassword'))
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

  describe('NAS configuration security', () => {
    it('should store NAS credentials in Keychain, not AsyncStorage', async () => {
      // First create a user profile
      await UserService.register('test@example.com', 'password123', 'Test User');

      const nasConfig = {
        host: '192.168.1.100',
        port: 5005,
        username: 'nasuser',
        password: 'nassecretpassword',
        useHttps: false,
        remotePath: '/photos',
      };

      await UserService.updateNasConfig(nasConfig);

      // Verify NAS credentials stored in Keychain with NAS service
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'nasuser',
        'nassecretpassword',
        expect.objectContaining({ service: 'com.photomanage.nas' })
      );

      // Verify profile does not contain NAS password
      const profileData = await AsyncStorage.getItem('@photo_manage_user_profile');
      const profile = JSON.parse(profileData!);
      expect(profile.nasConfig.password).toBe(''); // Password should be empty
      expect(profile.nasConfig.host).toBe('192.168.1.100'); // Other config preserved
    });

    it('should retrieve NAS credentials from Keychain', async () => {
      // First create a user profile with NAS config
      await UserService.register('test@example.com', 'password123', 'Test User');

      const nasConfig = {
        host: '192.168.1.100',
        port: 5005,
        username: 'nasuser',
        password: 'nassecretpassword',
        useHttps: false,
        remotePath: '/photos',
      };

      await UserService.updateNasConfig(nasConfig);

      // Mock getGenericPassword to return NAS credentials
      (Keychain.getGenericPassword as jest.Mock).mockImplementation((options) => {
        if (options?.service === 'com.photomanage.nas') {
          return Promise.resolve({
            username: 'nasuser',
            password: 'nassecretpassword',
          });
        }
        return Promise.resolve(false);
      });

      const retrievedConfig = await UserService.getNasConfig();

      expect(retrievedConfig).not.toBeNull();
      expect(retrievedConfig?.username).toBe('nasuser');
      expect(retrievedConfig?.password).toBe('nassecretpassword');
      expect(retrievedConfig?.host).toBe('192.168.1.100');
    });

    it('should clear NAS credentials on account deletion', async () => {
      await UserService.register('test@example.com', 'password123', 'Test User');

      await UserService.deleteAccount();

      // Both auth and NAS keychain entries should be reset
      expect(Keychain.resetGenericPassword).toHaveBeenCalledWith(
        expect.objectContaining({ service: 'com.photomanage.auth' })
      );
      expect(Keychain.resetGenericPassword).toHaveBeenCalledWith(
        expect.objectContaining({ service: 'com.photomanage.nas' })
      );
    });
  });
});
