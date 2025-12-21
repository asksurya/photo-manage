module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-permissions|react-native-image-picker|react-native-exif|react-native-geolocation-service|webdav)/)',
  ],
  setupFilesAfterEnv: ['./jest.setup.js'],
};
