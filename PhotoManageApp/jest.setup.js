import { jest } from '@jest/globals';

jest.mock('react-native-permissions', () => {
  const Permissions = jest.requireActual('react-native-permissions/mock');

  return {
    ...Permissions,
    check: jest.fn(() => Promise.resolve('granted')),
    request: jest.fn(() => Promise.resolve('granted')),
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
}));

jest.mock('react-native-exif', () => ({
  getExif: jest.fn(() => Promise.resolve({})),
}));

jest.mock('react-native-fs', () => ({
  mkdir: jest.fn(() => Promise.resolve()),
  moveFile: jest.fn(() => Promise.resolve()),
  copyFile: jest.fn(() => Promise.resolve()),
  pathForBundle: jest.fn(),
  pathForGroup: jest.fn(),
  getFSInfo: jest.fn(),
  getAllExternalFilesDirs: jest.fn(),
  unlink: jest.fn(() => Promise.resolve()),
  exists: jest.fn(() => Promise.resolve(false)),
  stopDownload: jest.fn(),
  resumeDownload: jest.fn(),
  isResumable: jest.fn(),
  stopUpload: jest.fn(),
  completeHandlerIOS: jest.fn(),
  readDir: jest.fn(() => Promise.resolve([])),
  readDirAssets: jest.fn(),
  existsAssets: jest.fn(),
  readdir: jest.fn(),
  setReadable: jest.fn(),
  stat: jest.fn(),
  readFile: jest.fn(() => Promise.resolve('')),
  read: jest.fn(),
  readFileAssets: jest.fn(),
  hash: jest.fn(),
  copyFileAssets: jest.fn(),
  copyFileAssetsIOS: jest.fn(),
  copyAssetsVideoIOS: jest.fn(),
  writeFile: jest.fn(() => Promise.resolve()),
  appendFile: jest.fn(),
  write: jest.fn(),
  downloadFile: jest.fn(),
  uploadFiles: jest.fn(),
  touch: jest.fn(),
  MainBundlePath: '/mock/MainBundlePath',
  CachesDirectoryPath: '/mock/CachesDirectoryPath',
  DocumentDirectoryPath: '/mock/DocumentDirectoryPath',
  ExternalDirectoryPath: '/mock/ExternalDirectoryPath',
  ExternalStorageDirectoryPath: '/mock/ExternalStorageDirectoryPath',
  TemporaryDirectoryPath: '/mock/TemporaryDirectoryPath',
  LibraryDirectoryPath: '/mock/LibraryDirectoryPath',
  PicturesDirectoryPath: '/mock/PicturesDirectoryPath',
}));

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PinchGestureHandler: View,
    PanGestureHandler: View,
    RotationGestureHandler: View,
    /* etc. */
  };
});

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/document/path',
  CachesDirectoryPath: '/mock/caches/path',
  downloadFile: jest.fn(() => ({
    promise: Promise.resolve({ statusCode: 200, bytesWritten: 1024 })
  })),
  stat: jest.fn(() => Promise.resolve({
    size: 1024,
    mtime: new Date(),
    ctime: new Date(),
    isFile: () => true,
    isDirectory: () => false,
  })),
  readFile: jest.fn(() => Promise.resolve('base64content')),
  exists: jest.fn(() => Promise.resolve(true)),
  mkdir: jest.fn(() => Promise.resolve()),
  uploadFiles: jest.fn(() => ({
    promise: Promise.resolve({ statusCode: 200, body: 'success' })
  })),
}));
