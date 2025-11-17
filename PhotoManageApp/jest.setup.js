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
