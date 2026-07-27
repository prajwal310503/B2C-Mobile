/* eslint-env jest */
const http = require('http');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const { cleanup } = require('@testing-library/react-native');
const { PORT } = require('./fakeBackend');

/**
 * Expo's fetch polyfill is active in this environment and does not round-trip
 * our control-plane responses, so the harness speaks to the fake backend with
 * Node's http client directly.
 */
function control(method, path, payload) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : null;
    const req = http.request(
      {
        host: '127.0.0.1',
        port: PORT,
        method,
        path: `/api/__test__/${path}`,
        headers: body
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
          : {},
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw || '{}'));
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Screens legitimately log network failures in the error-path tests; keep the
// output readable but still surface real React warnings.
const IGNORED = [
  /useNativeDriver/,
  /VirtualizedList/,
  /not wrapped in act/,
  /overlapping act/,
  /without await/,
];
const realError = console.error;
console.error = (...args) => {
  if (IGNORED.some((re) => re.test(String(args[0])))) return;
  realError(...args);
};

beforeEach(async () => {
  cleanup();
  await AsyncStorage.clear();
  await control('POST', 'reset');
});

afterEach(async () => {
  cleanup();
  // Drain any leftover macrotasks from navigation / animation stubs.
  await new Promise((resolve) => setTimeout(resolve, 0));
  cleanup();
});

global.armFailure = (status, message) => control('POST', 'fail-next', { status, message });
global.serverRequests = async () => (await control('GET', 'requests')).data;
