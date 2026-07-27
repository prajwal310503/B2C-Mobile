/* eslint-env jest */
const { API_BASE } = require('./fakeBackend');

// The React Native resolver maps axios to its browser build, which has the
// Node http adapter stubbed out. Loading the node build (and dropping the
// mocked XMLHttpRequest) makes tests issue real requests to the fake backend.
delete global.XMLHttpRequest;

jest.mock('axios', () => {
  const axios = require('axios/dist/node/axios.cjs');
  axios.defaults.adapter = 'http';
  return axios;
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { apiUrl: 'http://127.0.0.1:8899/api' }, hostUri: '127.0.0.1:8081' },
  },
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
  getStringAsync: jest.fn().mockResolvedValue(''),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///tmp/pick.jpg', fileName: 'pick.jpg', mimeType: 'image/jpeg' }],
  }),
}));

// Icon fonts pull in the whole expo-font/expo-asset chain, which adds nothing
// to these assertions. Icons render as views tagged with their glyph name.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const iconSet = (family) =>
    Object.assign(
      ({ name, ...rest }) =>
        React.createElement(View, { ...rest, accessibilityLabel: `${family}:${name}` }),
      { loadFont: jest.fn(), font: {} }
    );
  return {
    __esModule: true,
    Ionicons: iconSet('ion'),
    MaterialIcons: iconSet('material'),
    MaterialCommunityIcons: iconSet('mci'),
    Feather: iconSet('feather'),
    FontAwesome: iconSet('fa'),
    AntDesign: iconSet('antd'),
    Entypo: iconSet('entypo'),
  };
});

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Image = (props) => React.createElement(View, { ...props, testID: props.testID ?? 'image' });
  return { __esModule: true, Image, default: Image };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    LinearGradient: (props) => React.createElement(View, props, props.children),
  };
});

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    BlurView: (props) => React.createElement(View, props, props.children),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => {
  const mock = require('@react-native-async-storage/async-storage/jest/async-storage-mock');
  return { __esModule: true, default: mock, ...mock };
});

// The library's own mock keeps the insets/frame contexts intact, which
// @react-navigation/elements reads from directly.
jest.mock('react-native-safe-area-context', () => {
  // The shipped mock uses a default export; spread it so named imports resolve.
  const mock = require('react-native-safe-area-context/jest/mock');
  return { __esModule: true, ...(mock.default || mock) };
});

global.__API_BASE__ = API_BASE;
