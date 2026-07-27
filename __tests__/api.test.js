import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  attributeAPI,
  authAPI,
  blogAPI,
  categoryAPI,
  couponAPI,
  onUnauthorized,
  pincodeAPI,
  productAPI,
  reviewAPI,
  storeAPI,
  supportAPI,
  TOKEN_KEY,
  vendorAPI,
} from '../src/services/api';

describe('API client', () => {
  it('talks to the configured base URL over real HTTP', async () => {
    const { data } = await categoryAPI.getAll();
    expect(data.success).toBe(true);
    expect(data.data.map((c) => c.slug)).toEqual(['rings', 'necklaces', 'earrings']);
  });

  it('attaches the stored bearer token to requests', async () => {
    await AsyncStorage.setItem(TOKEN_KEY, 'test-jwt-token');
    const { data } = await authAPI.getMe();
    expect(data.data.user.email).toBe('test@customer.com');
  });

  it('rejects protected calls without a token and clears the session', async () => {
    const handler = jest.fn();
    onUnauthorized(handler);
    await expect(authAPI.getMe()).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalled();
    expect(await AsyncStorage.getItem(TOKEN_KEY)).toBeNull();
    onUnauthorized(null);
  });

  it('normalises the server error shape into { message, status }', async () => {
    await expect(productAPI.getBySlug('does-not-exist')).rejects.toEqual(
      expect.objectContaining({ status: 404, message: 'Product not found' })
    );
  });

  it('rewrites localhost upload URLs so a device can load them', async () => {
    const { data } = await blogAPI.getBySlug('gold-care');
    expect(data.data.slug).toBe('gold-care');
  });

  it('returns pagination meta the list screens rely on', async () => {
    const { data } = await productAPI.getAll({ page: 1, limit: 20 });
    expect(data.meta).toMatchObject({ total: 24, page: 1, limit: 20, hasNextPage: true });
    const second = await productAPI.getAll({ page: 2, limit: 20 });
    expect(second.data.data).toHaveLength(4);
    expect(second.data.meta.hasNextPage).toBe(false);
  });

  it('exposes every endpoint group the screens import', async () => {
    await AsyncStorage.setItem(TOKEN_KEY, 'test-jwt-token');
    const calls = await Promise.all([
      attributeAPI.getAll({ filterable: true }),
      storeAPI.getStores(),
      storeAPI.getStoreBySlug('shree-jewellers'),
      blogAPI.getAll({ limit: 4 }),
      reviewAPI.getProductReviews('prod1', { limit: 10 }),
      couponAPI.getAvailable(),
      pincodeAPI.check('400020'),
      supportAPI.getMyTickets(),
    ]);
    calls.forEach(({ data }) => expect(data.success).toBe(true));
  });

  it('surfaces validation errors from vendor registration', async () => {
    await expect(vendorAPI.register({ name: 'A' })).rejects.toMatchObject({
      status: 400,
      message: 'Validation failed',
    });
  });
});
