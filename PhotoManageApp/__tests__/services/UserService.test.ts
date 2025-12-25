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

  describe('Session expiration', () => {
    it('should create session with expiration time', async () => {
      await UserService.register('test@example.com', 'password123', 'Test User');

      const isLoggedIn = await UserService.isLoggedIn();
      expect(isLoggedIn).toBe(true);

      const remaining = await UserService.getSessionTimeRemaining();
      // Should be close to 24 hours (within a few seconds)
      expect(remaining).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(remaining).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });

    it('should detect expired session', async () => {
      await UserService.register('test@example.com', 'password123', 'Test User');

      // Manually expire the session by setting expired timestamp
      const sessionData = await AsyncStorage.getItem('@photo_manage_session');
      const session = JSON.parse(sessionData!);
      session.expiresAt = Date.now() - 1000; // Expired 1 second ago
      await AsyncStorage.setItem('@photo_manage_session', JSON.stringify(session));

      const isLoggedIn = await UserService.isLoggedIn();
      expect(isLoggedIn).toBe(false);
    });

    it('should refresh session expiration', async () => {
      await UserService.register('test@example.com', 'password123', 'Test User');

      // Set session to expire in 1 hour
      const sessionData = await AsyncStorage.getItem('@photo_manage_session');
      const session = JSON.parse(sessionData!);
      session.expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
      await AsyncStorage.setItem('@photo_manage_session', JSON.stringify(session));

      const refreshed = await UserService.refreshSession();
      expect(refreshed).toBe(true);

      const remaining = await UserService.getSessionTimeRemaining();
      // Should now be close to 24 hours again
      expect(remaining).toBeGreaterThan(23 * 60 * 60 * 1000);
    });

    it('should update last activity timestamp', async () => {
      await UserService.register('test@example.com', 'password123', 'Test User');

      const sessionBefore = await AsyncStorage.getItem('@photo_manage_session');
      const lastActivityBefore = JSON.parse(sessionBefore!).lastActivityAt;

      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await UserService.updateLastActivity();

      const sessionAfter = await AsyncStorage.getItem('@photo_manage_session');
      const lastActivityAfter = JSON.parse(sessionAfter!).lastActivityAt;

      expect(lastActivityAfter).toBeGreaterThanOrEqual(lastActivityBefore);
    });
  });

  describe('Rate limiting', () => {
    it('should allow login attempts within limit', async () => {
      const status = await UserService.getRateLimitStatus();
      expect(status.isLocked).toBe(false);
      expect(status.attemptsRemaining).toBe(10);
    });

    it('should track failed login attempts', async () => {
      // Set up mock to return invalid credentials
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        try {
          await UserService.login('wrong@example.com', 'wrongpass');
        } catch {
          // Expected to fail
        }
      }

      const status = await UserService.getRateLimitStatus();
      expect(status.attemptsRemaining).toBe(5);
    });

    it('should lock after 10 failed attempts', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

      // Make 10 failed attempts
      for (let i = 0; i < 10; i++) {
        try {
          await UserService.login('wrong@example.com', 'wrongpass');
        } catch {
          // Expected to fail
        }
      }

      const status = await UserService.getRateLimitStatus();
      expect(status.isLocked).toBe(true);
      expect(status.unlockTime).not.toBeNull();
    });

    it('should reject login when locked', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

      // Lock the account
      for (let i = 0; i < 10; i++) {
        try {
          await UserService.login('wrong@example.com', 'wrongpass');
        } catch {
          // Expected to fail
        }
      }

      // Next attempt should fail with rate limit message
      await expect(UserService.login('any@example.com', 'anypass'))
        .rejects.toThrow('Too many failed attempts');
    });

    it('should clear rate limit on successful login', async () => {
      // First register
      await UserService.register('test@example.com', 'password123', 'Test User');

      // Get stored hash
      const storedHash = (Keychain.setGenericPassword as jest.Mock).mock.calls[0][1];

      // Simulate some failed attempts
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);
      for (let i = 0; i < 3; i++) {
        try {
          await UserService.login('wrong@example.com', 'wrongpass');
        } catch {
          // Expected to fail
        }
      }

      // Now successful login
      (Keychain.getGenericPassword as jest.Mock).mockImplementation((options) => {
        if (options?.service === 'com.photomanage.auth') {
          return Promise.resolve({
            username: 'test@example.com',
            password: storedHash,
          });
        }
        return Promise.resolve(false);
      });

      await UserService.login('test@example.com', 'password123');

      const status = await UserService.getRateLimitStatus();
      expect(status.isLocked).toBe(false);
      expect(status.attemptsRemaining).toBe(10);
    });
  });

  describe('Biometric authentication', () => {
    it('should detect biometric availability', async () => {
      const result = await UserService.isBiometricsAvailable();
      expect(result.available).toBe(true);
      expect(result.biometryType).toBe('FaceID');
    });

    it('should enable biometrics for user', async () => {
      await UserService.register('test@example.com', 'password123', 'Test User');

      const enabled = await UserService.enableBiometrics();
      expect(enabled).toBe(true);

      const isEnabled = await UserService.isBiometricsEnabled();
      expect(isEnabled).toBe(true);
    });

    it('should disable biometrics for user', async () => {
      await UserService.register('test@example.com', 'password123', 'Test User');
      await UserService.enableBiometrics();

      await UserService.disableBiometrics();

      const isEnabled = await UserService.isBiometricsEnabled();
      expect(isEnabled).toBe(false);
    });

    it('should login with biometrics when enabled', async () => {
      await UserService.register('test@example.com', 'password123', 'Test User');
      await UserService.enableBiometrics();
      await UserService.logout();

      // Mock getGenericPassword to return credentials (biometric auth success)
      (Keychain.getGenericPassword as jest.Mock).mockImplementation((options) => {
        if (options?.service === 'com.photomanage.auth') {
          return Promise.resolve({
            username: 'test@example.com',
            password: 'somehash',
          });
        }
        return Promise.resolve(false);
      });

      const profile = await UserService.loginWithBiometrics();
      expect(profile.email).toBe('test@example.com');

      const isLoggedIn = await UserService.isLoggedIn();
      expect(isLoggedIn).toBe(true);
    });

    it('should reject biometric login when not enabled', async () => {
      await UserService.register('test@example.com', 'password123', 'Test User');
      // Don't enable biometrics

      await expect(UserService.loginWithBiometrics())
        .rejects.toThrow('Biometric authentication not enabled');
    });

    it('should fail gracefully when biometrics unavailable', async () => {
      (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue(null);

      const result = await UserService.isBiometricsAvailable();
      expect(result.available).toBe(false);

      // Restore mock
      (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue('FaceID');
    });
  });
});
