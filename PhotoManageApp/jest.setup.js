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
  };
});

jest.mock('react-native-fs', () => ({
  mkdir: jest.fn(() => Promise.resolve()),
  moveFile: jest.fn(() => Promise.resolve()),
  copyFile: jest.fn(() => Promise.resolve()),
  pathForBundle: jest.fn(),
  pathForGroup: jest.fn(),
  getFSInfo: jest.fn(),
  getAllExternalFilesDirs: jest.fn(),
  unlink: jest.fn(() => Promise.resolve()),
  exists: jest.fn(() => Promise.resolve(true)),
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
  stat: jest.fn(() => Promise.resolve({
    size: 1024,
    mtime: new Date(),
    ctime: new Date(),
    isFile: () => true,
    isDirectory: () => false,
  })),
  readFile: jest.fn(() => Promise.resolve('base64content')),
  read: jest.fn(),
  readFileAssets: jest.fn(),
  hash: jest.fn(),
  copyFileAssets: jest.fn(),
  copyFileAssetsIOS: jest.fn(),
  copyAssetsVideoIOS: jest.fn(),
  writeFile: jest.fn(() => Promise.resolve()),
  appendFile: jest.fn(),
  write: jest.fn(),
  downloadFile: jest.fn(() => ({
    promise: Promise.resolve({ statusCode: 200, bytesWritten: 1024 })
  })),
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

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }) => children,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Mock react-native-keychain with service support and biometrics
const keychainStore = {};
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn((username, password, options) => {
    const service = options?.service || 'default';
    keychainStore[service] = { username, password };
    return Promise.resolve(true);
  }),
  getGenericPassword: jest.fn((options) => {
    const service = options?.service || 'default';
    const creds = keychainStore[service];
    if (creds) {
      return Promise.resolve(creds);
    }
    return Promise.resolve(false);
  }),
  resetGenericPassword: jest.fn((options) => {
    const service = options?.service || 'default';
    delete keychainStore[service];
    return Promise.resolve(true);
  }),
  getSupportedBiometryType: jest.fn(() => Promise.resolve('FaceID')),
  ACCESS_CONTROL: {
    BIOMETRY_ANY: 'BiometryAny',
    BIOMETRY_ANY_OR_DEVICE_PASSCODE: 'BiometryAnyOrDevicePasscode',
  },
  AUTHENTICATION_TYPE: {
    BIOMETRICS: 'AuthenticationWithBiometrics',
  },
}));

// Mock crypto-js for password hashing tests
jest.mock('crypto-js', () => {
  return {
    lib: {
      WordArray: {
        random: jest.fn(() => ({
          toString: jest.fn(() => 'mockedsalt1234567890abcdef'),
        })),
      },
    },
    enc: {
      Hex: 'hex',
    },
    algo: {
      SHA256: 'sha256',
    },
    PBKDF2: jest.fn((password, salt) => ({
      toString: jest.fn(() => `pbkdf2hash_${password}_${salt}`),
    })),
  };
});

jest.mock(
  'react-native-blob-util',
  () => ({
    fetch: jest.fn(() => Promise.resolve({ status: 200, data: '' })),
    fs: {
      readFile: jest.fn(() => Promise.resolve('base64data')),
      writeFile: jest.fn(() => Promise.resolve()),
      dirs: {
        CacheDir: '/mock/cache',
      },
    },
  }),
  { virtual: true }
);

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
  })),
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  const MockMapView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      animateToRegion: jest.fn(),
      animateCamera: jest.fn(),
      fitToCoordinates: jest.fn(),
    }));
    return React.createElement(View, { testID: props.testID || 'map-view', ...props }, props.children);
  });
  MockMapView.displayName = 'MapView';

  const MockMarker = (props) => React.createElement(View, { testID: 'map-marker', ...props }, props.children);
  MockMarker.displayName = 'Marker';

  const MockCallout = (props) => React.createElement(View, { testID: 'map-callout', ...props }, props.children);
  MockCallout.displayName = 'Callout';

  const MockPolyline = (props) => React.createElement(View, { testID: 'map-polyline', ...props });
  MockPolyline.displayName = 'Polyline';

  const MockPolygon = (props) => React.createElement(View, { testID: 'map-polygon', ...props });
  MockPolygon.displayName = 'Polygon';

  const MockCircle = (props) => React.createElement(View, { testID: 'map-circle', ...props });
  MockCircle.displayName = 'Circle';

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Callout: MockCallout,
    Polyline: MockPolyline,
    Polygon: MockPolygon,
    Circle: MockCircle,
    PROVIDER_GOOGLE: 'google',
    PROVIDER_DEFAULT: null,
  };
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (props) => React.createElement(Text, { testID: `icon-${props.name}`, ...props }, props.name);
});
