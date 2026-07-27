import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_PORT = 8000;
const LIVE_API = 'https://api.royalbutterfly.in/api';

/**
 * Prefer the baked-in production URL (app.json extra.apiUrl).
 * Fall back to Metro LAN host only when apiUrl is missing (local Expo Go without a build).
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

export const API_BASE = configured || LIVE_API || `http://${inferDevHost()}:${BACKEND_PORT}/api`;

export const ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export const GOOGLE_WEB_CLIENT_ID =
  (typeof Constants.expoConfig?.extra?.googleWebClientId === 'string' &&
    Constants.expoConfig.extra.googleWebClientId.trim()) ||
  '';
