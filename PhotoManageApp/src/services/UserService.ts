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

// Session configuration
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting configuration
const MAX_LOGIN_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const ATTEMPT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// Types
interface Session {
  userId: string;
  createdAt: number;
  expiresAt: number;
  lastActivityAt: number;
}

interface RateLimitState {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

class UserService {
  private static USER_PROFILE_KEY = '@photo_manage_user_profile';
  private static SESSION_KEY = '@photo_manage_session';
  private static ONBOARDING_KEY = '@photo_manage_onboarding_seen';
  private static RATE_LIMIT_KEY = '@photo_manage_rate_limit';

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
    // Check rate limiting first
    const rateLimitCheck = await this.checkRateLimit();
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.message || 'Account temporarily locked');
    }

    const credentials = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE_AUTH,
    });

    if (!credentials || credentials.username !== email) {
      await this.recordFailedAttempt();
      throw new Error('Invalid credentials');
    }

    const isValid = await this.verifyPassword(password, credentials.password);
    if (!isValid) {
      await this.recordFailedAttempt();
      throw new Error('Invalid credentials');
    }

    const profile = await this.loadUserProfile();
    if (!profile) {
      await this.recordFailedAttempt();
      throw new Error('Invalid credentials');
    }

    // Clear rate limit on successful login
    await this.clearRateLimit();
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
   * Check if user has active (non-expired) session
   */
  static async isLoggedIn(): Promise<boolean> {
    const session = await this.getSession();
    if (!session) {
      return false;
    }
    if (this.isSessionExpired(session)) {
      await this.logout();
      return false;
    }
    return true;
  }

  /**
   * Check if user is authenticated (has valid session and profile)
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    if (!session || this.isSessionExpired(session)) {
      if (session) {
        await this.logout();
      }
      return false;
    }
    const profile = await this.loadUserProfile();
    return !!profile;
  }

  /**
   * Refresh session expiration (called after biometric auth)
   */
  static async refreshSession(): Promise<boolean> {
    const session = await this.getSession();
    if (!session) {
      return false;
    }
    const now = Date.now();
    session.expiresAt = now + SESSION_DURATION_MS;
    session.lastActivityAt = now;
    await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return true;
  }

  /**
   * Update last activity timestamp
   */
  static async updateLastActivity(): Promise<void> {
    const session = await this.getSession();
    if (session && !this.isSessionExpired(session)) {
      session.lastActivityAt = Date.now();
      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }
  }

  /**
   * Get remaining session time in milliseconds
   */
  static async getSessionTimeRemaining(): Promise<number> {
    const session = await this.getSession();
    if (!session) {
      return 0;
    }
    const remaining = session.expiresAt - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Get rate limit status for UI display
   */
  static async getRateLimitStatus(): Promise<{
    isLocked: boolean;
    attemptsRemaining: number;
    unlockTime: number | null;
  }> {
    const state = await this.getRateLimitState();
    const now = Date.now();

    // Reset if window expired and not locked
    if (state.lockedUntil <= now && state.firstAttemptAt > 0 && now - state.firstAttemptAt > ATTEMPT_WINDOW_MS) {
      return { isLocked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS, unlockTime: null };
    }

    const isLocked = state.lockedUntil > now;
    const attemptsRemaining = Math.max(0, MAX_LOGIN_ATTEMPTS - state.attempts);

    return {
      isLocked,
      attemptsRemaining,
      unlockTime: isLocked ? state.lockedUntil : null,
    };
  }

  // Biometric authentication methods

  /**
   * Check if device supports biometric authentication
   */
  static async isBiometricsAvailable(): Promise<{ available: boolean; biometryType: string | null }> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return {
        available: biometryType !== null,
        biometryType: biometryType,
      };
    } catch {
      return { available: false, biometryType: null };
    }
  }

  /**
   * Check if user has enabled biometric authentication
   */
  static async isBiometricsEnabled(): Promise<boolean> {
    const profile = await this.loadUserProfile();
    return profile?.biometricsEnabled === true;
  }

  /**
   * Enable biometric authentication for current user
   */
  static async enableBiometrics(): Promise<boolean> {
    const { available } = await this.isBiometricsAvailable();
    if (!available) {
      return false;
    }

    const profile = await this.loadUserProfile();
    if (!profile) {
      return false;
    }

    profile.biometricsEnabled = true;
    await this.saveUserProfile(profile);
    return true;
  }

  /**
   * Disable biometric authentication for current user
   */
  static async disableBiometrics(): Promise<void> {
    const profile = await this.loadUserProfile();
    if (profile) {
      profile.biometricsEnabled = false;
      await this.saveUserProfile(profile);
    }
  }

  /**
   * Login using biometric authentication
   */
  static async loginWithBiometrics(): Promise<UserProfile> {
    const { available, biometryType } = await this.isBiometricsAvailable();
    if (!available) {
      throw new Error('Biometric authentication not available');
    }

    const profile = await this.loadUserProfile();
    if (!profile?.biometricsEnabled) {
      throw new Error('Biometric authentication not enabled');
    }

    try {
      // Retrieve credentials using biometric authentication
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE_AUTH,
        authenticationPrompt: {
          title: 'Authenticate',
          subtitle: `Use ${biometryType || 'biometrics'} to login`,
          cancel: 'Cancel',
        },
      });

      if (!credentials) {
        throw new Error('Biometric authentication failed');
      }

      // Biometric success - create/refresh session
      await this.createSession(profile.id);
      await this.clearRateLimit();
      return profile;
    } catch (error) {
      throw new Error('Biometric authentication failed');
    }
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

  // Session helpers
  private static async createSession(userId: string): Promise<void> {
    const now = Date.now();
    const session: Session = {
      userId,
      createdAt: now,
      expiresAt: now + SESSION_DURATION_MS,
      lastActivityAt: now,
    };
    await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  private static async getSession(): Promise<Session | null> {
    try {
      const sessionData = await AsyncStorage.getItem(this.SESSION_KEY);
      if (sessionData) {
        return JSON.parse(sessionData) as Session;
      }
    } catch {
      // Invalid session data
    }
    return null;
  }

  private static isSessionExpired(session: Session): boolean {
    return Date.now() > session.expiresAt;
  }

  // Rate limiting helpers
  private static async getRateLimitState(): Promise<RateLimitState> {
    try {
      const data = await AsyncStorage.getItem(this.RATE_LIMIT_KEY);
      if (data) {
        return JSON.parse(data) as RateLimitState;
      }
    } catch {
      // Invalid data
    }
    return { attempts: 0, firstAttemptAt: 0, lockedUntil: 0 };
  }

  private static async saveRateLimitState(state: RateLimitState): Promise<void> {
    await AsyncStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(state));
  }

  private static async checkRateLimit(): Promise<{ allowed: boolean; message?: string; unlockTime?: number }> {
    const state = await this.getRateLimitState();
    const now = Date.now();

    // Check if locked
    if (state.lockedUntil > now) {
      return {
        allowed: false,
        message: 'Too many failed attempts. Please try again later.',
        unlockTime: state.lockedUntil,
      };
    }

    // Reset if window expired
    if (state.firstAttemptAt > 0 && now - state.firstAttemptAt > ATTEMPT_WINDOW_MS) {
      await this.clearRateLimit();
      return { allowed: true };
    }

    return { allowed: true };
  }

  private static async recordFailedAttempt(): Promise<void> {
    const state = await this.getRateLimitState();
    const now = Date.now();

    // Reset if window expired
    if (state.firstAttemptAt > 0 && now - state.firstAttemptAt > ATTEMPT_WINDOW_MS) {
      state.attempts = 0;
      state.firstAttemptAt = 0;
    }

    state.attempts += 1;
    if (state.firstAttemptAt === 0) {
      state.firstAttemptAt = now;
    }

    // Lock if exceeded attempts
    if (state.attempts >= MAX_LOGIN_ATTEMPTS) {
      state.lockedUntil = now + LOCKOUT_DURATION_MS;
    }

    await this.saveRateLimitState(state);
  }

  private static async clearRateLimit(): Promise<void> {
    await AsyncStorage.removeItem(this.RATE_LIMIT_KEY);
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
