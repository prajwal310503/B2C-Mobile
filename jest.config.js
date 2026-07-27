module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/test/jestSetup.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setupAfterEnv.js'],
  globalSetup: '<rootDir>/test/globalSetup.js',
  globalTeardown: '<rootDir>/test/globalTeardown.js',
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  testTimeout: 30000,
  forceExit: true,
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|zustand)',
  ],
  collectCoverageFrom: ['src/**/*.js', '!src/**/index.js'],
};
