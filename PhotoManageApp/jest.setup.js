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
}));
