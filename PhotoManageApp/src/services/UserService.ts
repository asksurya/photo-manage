import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import CryptoJS from 'crypto-js';
import { UserProfile, NasConfig } from '../types/photo';

// Keychain service identifiers for different credential types
const KEYCHAIN_SERVICE_AUTH = 'com.photomanage.auth';
const KEYCHAIN_SERVICE_NAS = 'com.photomanage.nas';

// PBKDF2 configuration - OWASP recommended settings
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_SIZE = 256 / 32; // 256 bits
const SALT_SIZE = 128 / 8; // 128 bits

class UserService {
  private static USER_PROFILE_KEY = '@photo_manage_user_profile';
  private static SESSION_KEY = '@photo_manage_session';
  private static ONBOARDING_KEY = '@photo_manage_onboarding_seen';

  /**
   * Register a new user with local credentials
   */
  static async register(email: string, password: string, displayName: string): Promise<UserProfile> {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Hash password with PBKDF2 (includes salt)
    const hashedPassword = await this.hashPassword(password);

    // Store credentials in keychain with service identifier
    await Keychain.setGenericPassword(email, hashedPassword, {
      service: KEYCHAIN_SERVICE_AUTH,
    });

    // Create and save profile
    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      email,
      displayName,
    };

    await this.saveUserProfile(profile);
    await this.createSession(profile.id);

    return profile;
  }

  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<UserProfile> {
    const credentials = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE_AUTH,
    });

    if (!credentials || credentials.username !== email) {
      throw new Error('Invalid credentials');
    }

    const isValid = await this.verifyPassword(password, credentials.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const profile = await this.loadUserProfile();
    if (!profile) {
      throw new Error('Invalid credentials');
    }

    await this.createSession(profile.id);
    return profile;
  }

  /**
   * Logout - clear session but keep credentials for re-login
   */
  static async logout(): Promise<void> {
    await AsyncStorage.removeItem(this.SESSION_KEY);
  }

  /**
   * Check if user has active session
   */
  static async isLoggedIn(): Promise<boolean> {
    const session = await AsyncStorage.getItem(this.SESSION_KEY);
    return !!session;
  }

  /**
   * Check if user is authenticated (has session and profile)
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await AsyncStorage.getItem(this.SESSION_KEY);
    const profile = await this.loadUserProfile();
    return !!(session && profile);
  }

  /**
   * Delete account - remove all data including credentials
   */
  static async deleteAccount(): Promise<void> {
    // Reset both auth and NAS credentials from keychain
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE_AUTH });
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE_NAS });
    await AsyncStorage.multiRemove([this.USER_PROFILE_KEY, this.SESSION_KEY]);
  }

  /**
   * Save user profile to storage
   */
  static async saveUserProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
  }

  /**
   * Load user profile from storage
   */
  static async loadUserProfile(): Promise<UserProfile | null> {
    try {
      const profileData = await AsyncStorage.getItem(this.USER_PROFILE_KEY);
      if (profileData) {
        return JSON.parse(profileData);
      }
    } catch {
      console.error('Error loading user profile');
    }
    return null;
  }

  /**
   * Update NAS configuration for user
   * Credentials are stored securely in Keychain, non-sensitive config in profile
   */
  static async updateNasConfig(nasConfig: NasConfig): Promise<void> {
    const profile = await this.loadUserProfile();
    if (profile) {
      // Store credentials securely in Keychain
      if (nasConfig.username && nasConfig.password) {
        await Keychain.setGenericPassword(nasConfig.username, nasConfig.password, {
          service: KEYCHAIN_SERVICE_NAS,
        });
      }

      // Store non-sensitive config in profile (without credentials)
      profile.nasConfig = {
        host: nasConfig.host,
        port: nasConfig.port,
        useHttps: nasConfig.useHttps,
        remotePath: nasConfig.remotePath,
        // username/password stored in Keychain, not here
        username: nasConfig.username, // Keep username for display purposes
        password: '', // Never store password in AsyncStorage
      };
      await this.saveUserProfile(profile);
    }
  }

  /**
   * Get current NAS configuration with credentials from Keychain
   */
  static async getNasConfig(): Promise<NasConfig | null> {
    const profile = await this.loadUserProfile();
    if (!profile?.nasConfig) {
      return null;
    }

    // Retrieve credentials from Keychain
    const credentials = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE_NAS,
    });

    return {
      ...profile.nasConfig,
      username: credentials ? credentials.username : profile.nasConfig.username || '',
      password: credentials ? credentials.password : '',
    };
  }

  /**
   * Clear NAS configuration
   */
  static async clearNasConfig(): Promise<void> {
    const profile = await this.loadUserProfile();
    if (profile) {
      delete profile.nasConfig;
      await this.saveUserProfile(profile);
    }
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE_NAS });
  }

  /**
   * Check if user has seen onboarding
   */
  static async hasSeenOnboarding(): Promise<boolean> {
    const seen = await AsyncStorage.getItem(this.ONBOARDING_KEY);
    return seen === 'true';
  }

  /**
   * Mark onboarding as seen
   */
  static async setOnboardingSeen(): Promise<void> {
    await AsyncStorage.setItem(this.ONBOARDING_KEY, 'true');
  }

  // Private helpers
  private static async createSession(userId: string): Promise<void> {
    const session = { userId, createdAt: Date.now() };
    await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  /**
   * Generate a cryptographically secure random salt
   */
  private static generateSalt(): string {
    const randomWords = CryptoJS.lib.WordArray.random(SALT_SIZE);
    return randomWords.toString(CryptoJS.enc.Hex);
  }

  /**
   * Hash password using PBKDF2 with a random salt
   * Returns format: salt:hash (both hex encoded)
   */
  private static async hashPassword(password: string): Promise<string> {
    const salt = this.generateSalt();
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: PBKDF2_KEY_SIZE,
      iterations: PBKDF2_ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    });
    return `${salt}:${hash.toString(CryptoJS.enc.Hex)}`;
  }

  /**
   * Verify password against stored hash
   * Extracts salt from stored hash and recomputes
   */
  private static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [salt, expectedHash] = storedHash.split(':');
    if (!salt || !expectedHash) {
      return false;
    }

    const computedHash = CryptoJS.PBKDF2(password, salt, {
      keySize: PBKDF2_KEY_SIZE,
      iterations: PBKDF2_ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    });

    return computedHash.toString(CryptoJS.enc.Hex) === expectedHash;
  }
}

export default UserService;
