---
date: 2025-12-24T22:45:00-06:00
researcher: claude
git_commit: 99fa82d60373583c2255bbb79f6ba9c632d0f3d6
branch: security/fix-password-hashing-and-credentials
repository: photo-manage
topic: "Feature Gap Analysis: photo-manage vs Immich"
tags: [research, codebase, feature-comparison, immich, roadmap]
status: complete
last_updated: 2025-12-24
---

# Research: Feature Gap Analysis - photo-manage vs Immich

**Date**: 2025-12-24T22:45:00-06:00
**Git Commit**: 99fa82d
**Branch**: security/fix-password-hashing-and-credentials
**Repository**: photo-manage

## Research Question
What features are missing in photo-manage when compared to Immich?

## Summary

Photo-manage is a React Native mobile app focused on RAW/JPEG pair management with NAS sync. Immich is a full-featured self-hosted photo/video platform with server infrastructure, AI/ML capabilities, and web interface. The comparison reveals that photo-manage has solid core functionality but lacks the server-side features that define Immich.

**Key Gaps by Priority:**
1. **Critical**: No server component (Immich is client+server architecture)
2. **High**: No AI/ML features (face recognition, smart search, object detection)
3. **High**: No video support
4. **Medium**: Limited sharing capabilities
5. **Medium**: No web interface

## Feature Comparison Matrix

### Legend
- ✅ Implemented
- ⚠️ Partial
- ❌ Missing
- N/A Not applicable (architectural difference)

| Category | Feature | photo-manage | Immich |
|----------|---------|--------------|--------|
| **Architecture** | Server component | ❌ | ✅ |
| | Mobile app | ✅ | ✅ |
| | Web interface | ❌ | ✅ |
| | CLI tool | ❌ | ✅ |
| | REST API | ❌ | ✅ |
| **Photo Management** | Photo import | ✅ | ✅ |
| | RAW format support | ✅ | ✅ |
| | RAW/JPEG pairing | ✅ | ✅ (stacking) |
| | EXIF extraction | ✅ | ✅ |
| | Photo deletion | ✅ | ✅ |
| | Trash/recycle bin | ❌ | ✅ |
| | Archive feature | ❌ | ✅ |
| | Favorites | ❌ | ✅ |
| **Video** | Video import | ❌ | ✅ |
| | Video playback | ❌ | ✅ |
| | Live Photos | ❌ | ✅ |
| | Motion Photos | ❌ | ✅ |
| | Video transcoding | ❌ | ✅ |
| **Organization** | Albums | ✅ | ✅ |
| | Shared albums | ❌ | ✅ |
| | Date categorization | ✅ | ✅ |
| | Location categorization | ✅ | ✅ |
| | Content categorization | ⚠️ Basic | ✅ AI-powered |
| | Tags/labels | ❌ | ✅ |
| | Hierarchical tags | ❌ | ✅ |
| | Memories ("X years ago") | ❌ | ✅ |
| **Search** | Filename search | ✅ | ✅ |
| | Date range filter | ✅ | ✅ |
| | Location filter | ⚠️ Has/no GPS | ✅ Full geo |
| | Smart search (CLIP) | ❌ | ✅ |
| | Face search | ❌ | ✅ |
| | Object search | ❌ | ✅ |
| | OCR search | ❌ | ✅ |
| **AI/ML** | Face detection | ❌ | ✅ |
| | Face recognition | ❌ | ✅ |
| | Object detection | ❌ | ✅ |
| | Scene classification | ❌ | ✅ |
| | CLIP embeddings | ❌ | ✅ |
| | Duplicate detection | ❌ | ✅ |
| **Maps** | GPS display | ✅ | ✅ |
| | Map view | ❌ | ✅ |
| | Reverse geocoding | ✅ | ✅ |
| | Geotagging | ✅ | ✅ |
| **Backup & Sync** | Local storage | ✅ | ✅ |
| | NAS sync | ⚠️ WebDAV | ✅ External libs |
| | Background backup | ❌ | ✅ |
| | Selective album backup | ❌ | ✅ |
| | S3 storage | ❌ | ✅ |
| **Sharing** | Public links | ❌ | ✅ |
| | Password-protected links | ❌ | ✅ |
| | Partner sharing | ❌ | ✅ |
| | Album sharing | ❌ | ✅ |
| **Authentication** | Email/password | ✅ | ✅ |
| | Biometrics | ✅ | ❌ |
| | OAuth/SSO | ❌ | ✅ |
| | Rate limiting | ✅ | ✅ |
| | Session expiration | ✅ | ✅ |
| **Multi-user** | User accounts | ✅ | ✅ |
| | Admin dashboard | ❌ | ✅ |
| | User management | ❌ | ✅ |
| | Per-user libraries | ❌ | ✅ |
| **Viewing** | Split view (RAW/JPEG) | ✅ | ❌ |
| | 360-degree photos | ❌ | ✅ |
| | Timeline virtual scroll | ❌ | ✅ |
| | Folder view | ❌ | ✅ |
| **Metadata** | EXIF viewing | ✅ | ✅ |
| | XMP sidecar support | ❌ | ✅ |
| | Metadata editing | ❌ | ✅ |

## Detailed Gap Analysis

### 1. Critical Gaps (Architectural)

#### No Server Component
**Immich**: Full microservices architecture with Node.js server, PostgreSQL, Redis, ML service
**photo-manage**: Mobile-only app with local storage + optional NAS sync

**Impact**: Without a server, photo-manage cannot support:
- Multi-device sync
- Web access
- Background processing
- Centralized storage
- API for integrations

**Recommendation**: Consider if server architecture is in scope. If not, position as "companion app" rather than "Immich alternative."

### 2. High Priority Gaps

#### No AI/ML Features
Missing:
- Face detection & recognition (InsightFace)
- Smart search (CLIP-based semantic search)
- Object detection (TensorFlow)
- OCR (text in photos)
- Duplicate detection
- Scene/content classification

**Current**: Basic content categorization via filename patterns
**Impact**: Manual organization required; no "search for beach photos" capability

#### No Video Support
Missing:
- Video import/playback
- Live Photos (iOS)
- Motion Photos (Android)
- Video transcoding

**Impact**: Photos-only app in a photos+videos world

#### Limited Sharing
Missing:
- Public share links
- Password-protected shares
- Partner library sharing
- Shared albums with other users

**Current**: Single-user app only
**Impact**: No collaboration or easy sharing

### 3. Medium Priority Gaps

#### No Map View
**Current**: GPS coordinates displayed, reverse geocoding works
**Missing**: Visual map with photo clusters, geographic browsing

#### No Trash/Archive
**Current**: Immediate deletion
**Missing**:
- Trash with configurable retention
- Archive (hide from timeline, keep searchable)

#### No Tags System
**Current**: Albums only
**Missing**: Hierarchical tags, tag-based organization

#### No Memories Feature
**Missing**: "X years ago on this day" automatic collections

#### No Background Backup
**Current**: Manual sync via NAS
**Missing**: Automatic background upload when app not active

### 4. Lower Priority Gaps

- Web interface (requires server)
- CLI tool
- OAuth/SSO
- XMP sidecar files
- 360-degree photo viewer
- External library import
- Hardware-accelerated transcoding
- Home Assistant integration

## What photo-manage Does Better

1. **RAW/JPEG Split View** - Side-by-side comparison with metadata (Immich lacks this)
2. **Biometric Auth** - Face ID/Touch ID support (Immich doesn't have mobile biometrics)
3. **Photographer Focus** - Built specifically for RAW workflow
4. **Simpler Setup** - No server infrastructure required
5. **Offline First** - Works entirely offline

## Recommended Feature Roadmap

### Phase 1: Core Enhancements (No Server Required)
1. **Video support** - Import and playback
2. **Trash/recycle bin** - Soft delete with recovery
3. **Favorites** - Star photos
4. **Map view** - Visual geographic browsing
5. **Tags** - Flexible organization beyond albums

### Phase 2: Enhanced Organization
1. **Memories** - "X years ago" feature
2. **Archive** - Hide from timeline
3. **Smart albums** - Auto-populate based on criteria
4. **Improved search** - Date picker, location radius

### Phase 3: Sharing (May Require Backend)
1. **Export/share** - Share to other apps
2. **Album export** - Export album as zip
3. **QR code sharing** - Direct device-to-device

### Phase 4: AI Features (Requires ML Integration)
1. **On-device ML** - Use Core ML (iOS) / ML Kit (Android)
2. **Face grouping** - Local face clustering
3. **Scene detection** - Beach, mountain, city, etc.
4. **Duplicate detection** - Similar photo grouping

### Phase 5: Server Option (Major Architecture Change)
1. **Optional server** - Self-hosted sync server
2. **Multi-device** - Sync across devices
3. **Web access** - Browser-based viewing
4. **Shared libraries** - Multi-user support

## Code References

Current implementation files:
- `src/services/PhotoService.ts` - Core photo management
- `src/services/UserService.ts` - Authentication with security features
- `src/services/CategorizationService.ts` - Date/location/content grouping
- `src/services/NasSyncService.ts` - WebDAV NAS sync
- `src/services/SearchService.ts` - Basic search/filter
- `src/components/SplitView.tsx` - RAW/JPEG comparison (unique feature)

## Architecture Insights

**photo-manage Architecture:**
- React Native mobile app (iOS + Android)
- Local storage: AsyncStorage for data, Keychain for credentials
- Optional NAS: WebDAV protocol
- No server dependency

**Immich Architecture:**
- Server: Node.js + PostgreSQL + Redis
- ML: Python FastAPI service
- Mobile: Flutter app
- Web: TypeScript/Svelte
- Storage: Local filesystem or S3

The fundamental difference is photo-manage is a standalone mobile app while Immich is a client-server platform. Many of Immich's features (AI/ML, sharing, multi-user) require server infrastructure.

## Open Questions

1. Should photo-manage add optional server support, or stay mobile-only?
2. Is on-device ML (Core ML/ML Kit) sufficient for AI features?
3. What's the minimum viable sharing feature set without a server?
4. Should video support be prioritized given the mobile-first focus?
