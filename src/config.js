import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_PORT = 8000;

/**
 * In development the phone can't reach "localhost", so we reuse the LAN address
 * Metro is already serving from. Emulators fall back to their loopback alias.
 */
function inferDevHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host) return host;
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

const raw = Constants.expoConfig?.extra?.apiUrl;
const configured = typeof raw === 'string' && raw.trim() ? raw.trim() : null;

export const API_BASE = configured || `http://${inferDevHost()}:${BACKEND_PORT}/api`;

export const ORIGIN = API_BASE.replace(/\/api\/?$/, '');
