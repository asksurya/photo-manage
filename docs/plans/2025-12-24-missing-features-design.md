# Missing Features Design

## Overview

This document outlines the design for implementing the remaining features from `requirements.md`:
1. **Local Authentication** - Secure local user credentials
2. **WebDAV NAS Sync** - Real file synchronization with network storage
3. **Settings UI** - Tab-based navigation with configuration screens

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Authentication | Local-only | No cloud dependency, self-contained app |
| NAS Protocol | WebDAV | HTTP-based, works with most NAS devices, easy to implement |
| Settings Access | Tab navigation | Standard mobile pattern, always accessible |

---

## 1. Local Authentication

### Dependencies
- `react-native-keychain` - Secure credential storage (iOS Keychain / Android Keystore)
- `react-native-bcrypt` or pure JS bcrypt - Password hashing

### UserService Changes

```typescript
// New methods in UserService.ts
register(email: string, password: string, displayName: string): Promise<UserProfile>
login(email: string, password: string): Promise<UserProfile>
logout(): Promise<void>
deleteAccount(): Promise<void>
isLoggedIn(): Promise<boolean>
```

### Security Model
- Passwords hashed with bcrypt before storage
- Hash stored in platform keychain (not AsyncStorage)
- Session token kept in memory only
- Credentials persist for re-login; session cleared on app close

### New Screens
- `LoginScreen.tsx` - Email/password form with "Register" link
- `RegisterScreen.tsx` - Registration form with password confirmation

### Auth Flow
1. App launch → check `isLoggedIn()`
2. Not logged in → show `LoginScreen`
3. After login → navigate to `GalleryScreen`
4. Settings → shows logout button

---

## 2. WebDAV NAS Sync

### Dependencies
- `react-native-blob-util` - File upload/download with progress tracking

### NasSyncService Implementation

```typescript
// Real implementations replacing stubs
testConnection(config: NasConfig): Promise<boolean>       // PROPFIND request
listRemotePhotos(config: NasConfig): Promise<RemoteFile[]> // PROPFIND directory
uploadPhoto(photo: Photo, config: NasConfig, onProgress?: (p: number) => void): Promise<boolean>
downloadPhoto(remotePath: string, config: NasConfig): Promise<Photo | null>
syncToNas(photos: Photo[], config: NasConfig): Promise<SyncResult>
syncFromNas(config: NasConfig): Promise<Photo[]>
```

### WebDAV Protocol Details
- **Authentication**: Basic Auth header (`Authorization: Basic base64(user:pass)`)
- **Test Connection**: `PROPFIND` request to remote path
- **List Files**: `PROPFIND` with `Depth: 1` header
- **Upload**: `PUT` request with `Content-Type: application/octet-stream`
- **Download**: `GET` request, save to local filesystem
- **Create Directory**: `MKCOL` request if remote path doesn't exist

### Sync Strategy
- Compare local vs remote by filename + modification timestamp
- **Upload**: Local photos not present on NAS
- **Download**: Remote photos not present locally (user-controlled)
- **Conflict**: Newer file wins (configurable)

### Progress & Status
- Callback for upload/download progress percentage
- Last sync timestamp stored in AsyncStorage
- Sync status displayed in Settings UI

---

## 3. Settings UI & Tab Navigation

### Dependencies
- `@react-navigation/native` - Navigation container
- `@react-navigation/bottom-tabs` - Tab navigator
- `react-native-screens` - Native screen optimization
- `react-native-vector-icons` - Tab icons

### Screen Structure

```
src/screens/
├── GalleryScreen.tsx      # Existing - no changes
├── SettingsScreen.tsx     # New - settings hub
├── LoginScreen.tsx        # New - auth flow
├── RegisterScreen.tsx     # New - auth flow
└── NasConfigScreen.tsx    # New - NAS configuration form
```

### Navigation Structure

```
RootNavigator
├── AuthStack (when not logged in)
│   ├── LoginScreen
│   └── RegisterScreen
└── MainTabs (when logged in)
    ├── GalleryScreen (tab: Gallery)
    └── SettingsScreen (tab: Settings)
        └── NasConfigScreen (stack push)
```

### SettingsScreen Layout

```
┌─────────────────────────────┐
│ Settings                    │
├─────────────────────────────┤
│ Account                     │
│   user@example.com          │
│   [Logout]                  │
├─────────────────────────────┤
│ NAS Sync                    │
│   Status: Connected         │
│   Last sync: 2 hours ago    │
│   [Configure] [Sync Now]    │
├─────────────────────────────┤
│ Storage                     │
│   Local: 245 photos         │
│   Remote: 240 photos        │
└─────────────────────────────┘
```

### NasConfigScreen Form

| Field | Type | Default |
|-------|------|---------|
| Host | TextInput | — |
| Port | TextInput (numeric) | 5005 |
| Username | TextInput | — |
| Password | TextInput (secure) | — |
| Remote Path | TextInput | `/photos` |
| Use HTTPS | Switch | true |
| [Test Connection] | Button | — |
| [Save] | Button | — |

---

## Implementation Order

1. **Navigation setup** - Add react-navigation, create tab structure
2. **Auth screens** - Login/Register UI without backend logic
3. **Auth service** - Implement secure credential storage
4. **Settings screen** - Create settings hub UI
5. **NAS config screen** - Create configuration form
6. **WebDAV sync** - Implement real sync logic
7. **Integration** - Wire everything together, test end-to-end

## New Types

```typescript
// Add to src/types/photo.ts or new file

interface RemoteFile {
  path: string;
  filename: string;
  size: number;
  modified: Date;
  isDirectory: boolean;
}

interface SyncResult {
  uploaded: number;
  downloaded: number;
  failed: number;
  errors: string[];
}

interface SyncStatus {
  lastSync: Date | null;
  inProgress: boolean;
  progress: number; // 0-100
}
```

## Testing Considerations

- Mock `react-native-keychain` in tests
- Mock WebDAV responses for sync tests
- Test auth flow with navigation testing
- Test sync conflict resolution logic
