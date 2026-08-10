import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, ORIGIN } from '../config';
import { toast } from '../store/toastStore';

export const TOKEN_KEY = 'luxury-token';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 25000,
  headers: { 'Content-Type': 'application/json' },
});

let unauthorizedHandler = null;
export const onUnauthorized = (fn) => {
  unauthorizedHandler = fn;
};

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

// Server may hand back absolute localhost URLs or Google Drive share links,
// neither of which a device can load directly.
const LOCAL_URL_RE = /http:\/\/(?:localhost|127\.0\.0\.1):\d+(\/uploads\/[^"'\s]+)/g;
const GDRIVE_RE =
  /https?:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^"'\s]*id=)([a-zA-Z0-9_-]+)[^"'\s]*/g;

function sanitise(data) {
  try {
    let raw = JSON.stringify(data);
    let changed = false;
    if (raw.includes('/uploads/')) {
      // Absolute localhost → device-reachable origin
      const before = raw;
      raw = raw.replace(LOCAL_URL_RE, (_, p) => `${ORIGIN}${p}`);
      // Relative /uploads/... (admin CMS / local disk) → absolute
      raw = raw.replace(/"(\/uploads\/[^"]+)"/g, (_, p) => `"${ORIGIN}${p}"`);
      if (raw !== before) changed = true;
    }
    if (raw.includes('drive.google.com')) {
      raw = raw.replace(GDRIVE_RE, (_, id) => `https://drive.google.com/thumbnail?id=${id}&sz=w1200`);
      changed = true;
    }
    return changed ? JSON.parse(raw) : data;
  } catch {
    return data;
  }
}

api.interceptors.response.use(
  (response) => {
    response.data = sanitise(response.data);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED' ? 'Request timed out' : null) ||
      (!error.response ? 'Cannot reach the server' : 'Something went wrong');

    if (status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      unauthorizedHandler?.();
    } else if (status === 403) {
      toast.error('You do not have permission for this action');
    } else if (status >= 500) {
      toast.error('Server error. Please try again.');
    }

    return Promise.reject({ message, status, data: error.response?.data });
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  googleAuth: (data) => api.post('/auth/google', data),
  getGoogleClientId: () => api.get('/auth/google/client-id'),
  updatePassword: (data) => api.put('/auth/update-password', data),
  updateProfile: (data) => api.put('/auth/profile', data),
  updateAddresses: (addresses) => api.put('/auth/addresses', { addresses }),
  getWishlist: () => api.get('/auth/wishlist'),
  setWishlist: (productIds) => api.put('/auth/wishlist', { productIds }),
  getReferral: () => api.get('/auth/referral'),
  requestReferralPayout: (data) => api.post('/auth/referral/payout', data),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
};

export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
};

export const attributeAPI = {
  getAll: (params) => api.get('/attributes', { params }),
};

export const vendorAPI = {
  register: (data) => api.post('/vendor/register', data),
};

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  requestCancel: (id, data) => api.post(`/orders/${id}/cancel-request`, data),
  requestReturn: (id, data) => api.post(`/orders/${id}/return-request`, data),
  payRemaining: (id) => api.post(`/orders/${id}/pay-remaining`),
  downloadInvoice: (id) =>
    api.get(`/orders/${id}/invoice`, { responseType: 'arraybuffer' }),
};

export const cmsAPI = {
  getPageSections: (page) => api.get(`/cms/pages/${page}`),
  getBanners: (position) => api.get('/cms/banners', { params: { position } }),
  getMenu: (location) => api.get(`/cms/menus/${location}`),
};

export const reviewAPI = {
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  create: (data) => api.post('/reviews', data),
};

export const storeAPI = {
  getStores: (params) => api.get('/stores', { params }),
  getStoreBySlug: (slug) => api.get(`/stores/${slug}`),
};

export const couponAPI = {
  validate: (data) => api.post('/coupons/validate', data),
  getAvailable: () => api.get('/coupons/available'),
};

export const blogAPI = {
  getAll: (params) => api.get('/blog', { params }),
  getBySlug: (slug) => api.get(`/blog/${slug}`),
};

export const pincodeAPI = {
  check: (pincode) => api.get('/pincodes/check', { params: { pincode } }),
};

export const supportAPI = {
  create: (data) => api.post('/support', data),
  getMyTickets: () => api.get('/support/my'),
  getById: (id) => api.get(`/support/${id}`),
  reply: (id, data) => api.put(`/support/${id}/reply`, data),
};

export const settingsAPI = {
  getSiteImages: () => api.get('/settings/site-images'),
};

export default api;
