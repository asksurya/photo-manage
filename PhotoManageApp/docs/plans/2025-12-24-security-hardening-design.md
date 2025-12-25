# Security Hardening Design

**Date:** 2025-12-24
**Status:** Approved
**Branch:** security/fix-password-hashing-and-credentials

## Overview

Additional security hardening for the photo-manage app, building on the PBKDF2 password hashing and Keychain credential storage implemented in PR #54.

## Design Decisions

| Feature | Decision |
|---------|----------|
| Session timeout | 24 hours |
| Rate limiting | 10 attempts, 30 min lockout |
| Biometric scope | Available for login and session re-auth |
| Biometric enrollment | Prompt during registration |

## 1. Session Management

### Current State
Sessions store `{ userId, createdAt }` in AsyncStorage with no expiration check.

### Changes

**Extended Session Object:**
```typescript
interface Session {
  userId: string;
  createdAt: number;
  expiresAt: number;      // createdAt + 24 hours
  lastActivityAt: number; // Updated on app foreground
}
```

**Expiration Logic:**
- `isLoggedIn()` and `isAuthenticated()` check if `Date.now() < expiresAt`
- If expired, session is cleared and user sees login screen
- `lastActivityAt` updated when app comes to foreground

**Session Refresh:**
- Successful biometric auth extends `expiresAt` by another 24 hours
- Password login creates a fresh session

**New Methods:**
- `refreshSession()` - Extends expiration
- `getSessionTimeRemaining()` - For UI display

## 2. Rate Limiting

### Storage
```typescript
interface RateLimitState {
  attempts: number;       // Failed attempts count
  firstAttemptAt: number; // When counting started
  lockedUntil: number;    // 0 if not locked, timestamp if locked
}
```

### Logic Flow
1. On login attempt, check if `lockedUntil > Date.now()` → reject with time remaining
2. If not locked, attempt authentication
3. On failure: increment `attempts`, if `attempts >= 10` set `lockedUntil = Date.now() + 30min`
4. On success: reset all counters to zero

### Auto-Reset
- If `firstAttemptAt` is older than 30 minutes and not locked, reset counter
- Prevents permanent lockout from accumulated typos over days

### New Methods
- `getRateLimitStatus()` - Returns `{ isLocked, attemptsRemaining, unlockTime }`
- `private checkRateLimit()` - Called before password verification
- `private recordFailedAttempt()` - Called after failed login
- `private clearRateLimit()` - Called after successful login

### UI Impact
- Login screen shows "X attempts remaining" after 5 failures
- When locked, shows countdown timer and disables login button

## 3. Biometric Authentication

### Dependencies
Using `react-native-keychain` built-in biometric support.

### Enrollment Flow (during registration)
1. After successful registration, check `Keychain.getSupportedBiometryType()`
2. If device supports biometrics, prompt: "Enable Face ID/Touch ID for faster login?"
3. If accepted, store flag: `biometricsEnabled: true`

### Login Flow
1. Check if biometrics enabled for this user
2. If yes, show "Use Face ID" button alongside password form
3. Biometric auth retrieves credentials from Keychain with `authenticationPrompt`
4. On success, create/refresh session
5. Password form always available as fallback

### Keychain Configuration
```typescript
await Keychain.setGenericPassword(email, hashedPassword, {
  service: KEYCHAIN_SERVICE_AUTH,
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
  authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
});
```

### New Methods
- `isBiometricsAvailable()` - Check device capability
- `isBiometricsEnabled()` - Check user preference
- `enableBiometrics()` / `disableBiometrics()` - Toggle preference
- `loginWithBiometrics()` - Authenticate using Face ID/Touch ID

## Implementation Order

1. **Session expiration** - Foundation, self-contained
2. **Rate limiting** - Builds on login flow
3. **Biometrics** - Requires UI changes and enrollment flow

## Test Coverage

### Session Tests
- Session expires after 24 hours
- Expired session clears on `isLoggedIn()` check
- `refreshSession()` extends expiration
- `lastActivityAt` updates correctly

### Rate Limiting Tests
- Allows 10 attempts before lockout
- Lockout lasts 30 minutes
- Successful login clears attempt counter
- Counter auto-resets after 30 min window
- Lockout persists across app restart

### Biometric Tests
- Detects device biometric capability
- Enrollment saves preference
- `loginWithBiometrics()` succeeds with valid biometrics
- Falls back gracefully when biometrics unavailable
- Biometric login refreshes session

## Files Modified

- `src/services/UserService.ts` - All new logic
- `src/types/photo.ts` - Extended session type if needed
- `__tests__/services/UserService.test.ts` - New test cases
