/**
 * End-to-end customer journeys against the fake backend.
 * These exercise the real axios client, auth/cart/wishlist stores, and the
 * HTTP contract the mobile screens depend on — without stacking competing
 * native-stack trees that poison later UI tests.
 */
import { act, waitFor } from '@testing-library/react-native';

import { signIn } from '../test/harness';
import useAuthStore from '../src/store/authStore';
import useCartStore from '../src/store/cartStore';
import useWishlistStore from '../src/store/wishlistStore';
import useToastStore from '../src/store/toastStore';
import {
  authAPI,
  blogAPI,
  categoryAPI,
  couponAPI,
  orderAPI,
  productAPI,
  storeAPI,
  supportAPI,
  vendorAPI,
} from '../src/services/api';

const fx = require('../test/fixtures');

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, authReady: true, loading: false });
  useCartStore.setState({ items: [] });
  useWishlistStore.setState({ items: [], syncing: false });
  useToastStore.setState({ toasts: [] });
});

async function asSignedIn() {
  await signIn();
  useAuthStore.setState({ user: { ...fx.user }, token: 'test-jwt-token', authReady: true });
}

describe('E2E: auth journey', () => {
  it('logs in against the API and persists the session token', async () => {
    await act(async () => {
      await useAuthStore.getState().login({
        email: 'test@customer.com',
        password: 'correct-password',
      });
    });

    expect(useAuthStore.getState().token).toBe('test-jwt-token');
    expect(useAuthStore.getState().user?.email).toBe('test@customer.com');
  });

  it('rejects bad credentials and keeps the guest state', async () => {
    let failed = false;
    await act(async () => {
      try {
        await useAuthStore.getState().login({
          email: 'test@customer.com',
          password: 'wrong-password',
        });
      } catch {
        failed = true;
      }
    });

    expect(failed).toBe(true);
    expect(useAuthStore.getState().token).toBeNull();
    await waitFor(() =>
      expect(useToastStore.getState().toasts.some((t) => t.type === 'error')).toBe(true)
    );
  });

  it('registers a new customer account', async () => {
    await act(async () => {
      await useAuthStore.getState().register({
        name: 'New Shopper',
        email: 'new.shopper@test.com',
        phone: '9876501234',
        password: 'correct-password',
      });
    });

    expect(useAuthStore.getState().token).toBe('test-jwt-token');
    expect(useAuthStore.getState().user?.email).toBe('new.shopper@test.com');
  });

  it('requests a password reset link', async () => {
    const { data } = await authAPI.forgotPassword('test@customer.com');
    expect(data.success).toBe(true);
  });
});

describe('E2E: browse → cart → checkout → order', () => {
  it('completes a full purchase with a coupon', async () => {
    await asSignedIn();

    const { data: list } = await productAPI.getAll({ category: 'rings', limit: 5 });
    expect(list.data.length).toBeGreaterThan(0);
    expect(list.meta.hasNextPage).toBeDefined();

    const { data: detail } = await productAPI.getBySlug('test-product-1');
    const product = detail.data;
    expect(product.sizes).toEqual({ enabled: true, available: [12, 14, 16] });
    expect(product.store.slug).toBe('shree-jewellers');

    act(() => {
      useCartStore.getState().addItem(product, 1, null, { size: 12, stoneColor: 'White' });
    });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].selections).toMatchObject({
      size: 12,
      stoneColor: 'White',
    });

    const subtotal = useCartStore.getState().getSubtotal();
    const { data: coupon } = await couponAPI.validate({
      code: 'FESTIVE10',
      subtotal,
      items: useCartStore.getState().items.map((item) => ({
        product: item.product._id,
        price: item.product.discountedPrice,
        quantity: item.quantity,
      })),
    });
    expect(coupon.data.discount).toBeGreaterThan(0);

    const { data: placed } = await orderAPI.create({
      items: useCartStore.getState().items.map((item) => ({
        product: item.product._id,
        title: item.product.title,
        price: item.product.discountedPrice,
        quantity: item.quantity,
        selections: item.selections,
      })),
      shippingAddress: fx.user.addresses[0],
      payment: { method: 'full_payment' },
      couponCode: 'FESTIVE10',
    });

    expect(placed.data.primaryOrderId).toBeTruthy();
    expect(placed.data.orderGroupId).toMatch(/^grp-/);

    act(() => {
      useCartStore.getState().clearCart();
    });
    expect(useCartStore.getState().items).toHaveLength(0);

    const requests = await global.serverRequests();
    expect(requests.some((r) => r.method === 'POST' && r.path === '/orders')).toBe(true);
    expect(requests.some((r) => r.method === 'POST' && r.path === '/coupons/validate')).toBe(true);
  });

  it('partial payment order is accepted by the API', async () => {
    await asSignedIn();
    act(() => {
      useCartStore.getState().addItem({ ...fx.products[0], stock: 5 }, 2);
    });

    const { data } = await orderAPI.create({
      items: useCartStore.getState().items.map((item) => ({
        product: item.product._id,
        title: item.product.title,
        price: item.product.discountedPrice,
        quantity: item.quantity,
      })),
      shippingAddress: fx.user.addresses[0],
      payment: { method: 'partial_payment' },
    });

    expect(data.data.orders[0].payment.method).toBe('partial_payment');
  });
});

describe('E2E: wishlist sync', () => {
  it('merges a local wishlist with the server after login', async () => {
    await act(async () => {
      await useWishlistStore.getState().addItem(fx.products[0]);
      await useWishlistStore.getState().addItem(fx.products[2]);
    });
    expect(useWishlistStore.getState().items).toHaveLength(2);

    await asSignedIn();
    await act(async () => {
      await useWishlistStore.getState().syncFromServer();
    });

    const requests = await global.serverRequests();
    expect(requests.some((r) => r.path === '/auth/wishlist' && r.method === 'GET')).toBe(true);
    expect(requests.some((r) => r.path === '/auth/wishlist' && r.method === 'PUT')).toBe(true);
    expect(useWishlistStore.getState().items.map((p) => p._id)).toEqual(
      expect.arrayContaining(['prod1', 'prod3'])
    );
  });
});

describe('E2E: account surfaces', () => {
  it('loads orders, referral, support and addresses for a signed-in user', async () => {
    await asSignedIn();

    const me = await authAPI.getMe();
    expect(me.data.data.user.addresses[0].addressLine1).toBe('404 Marine Drive');

    const orders = await orderAPI.getMyOrders({ page: 1, limit: 10 });
    expect(orders.data.data[0].orderNumber).toBe('VK-1001');

    const detail = await orderAPI.getById('order1');
    expect(detail.data.data.trackingNumber).toBe('BD123456789');

    const referral = await authAPI.getReferral();
    expect(referral.data.data.referralCode).toBe('TEST500');
    expect(referral.data.data.referralBalance).toBe(1500);

    const tickets = await supportAPI.getMyTickets();
    expect(tickets.data.data[0].subject).toBe('Ring size exchange');
  });

  it('updates profile and password', async () => {
    await asSignedIn();

    const { data } = await authAPI.updateProfile({ name: 'Updated Customer', phone: '9876543210' });
    expect(data.data.user.name).toBe('Updated Customer');

    await authAPI.updatePassword({
      currentPassword: 'correct-password',
      newPassword: 'new-password',
    });

    // Password change itself succeeds; next login still uses the fake backend's
    // fixed "correct-password" credential for the shared test account.
  });
});

describe('E2E: content + marketplace', () => {
  it('loads categories, stores, blogs and filterable attributes', async () => {
    const [cats, stores, blogs, attrs, store] = await Promise.all([
      categoryAPI.getAll(),
      storeAPI.getStores(),
      blogAPI.getAll({ limit: 4 }),
      require('../src/services/api').attributeAPI.getAll({ filterable: true }),
      storeAPI.getStoreBySlug('shree-jewellers'),
    ]);

    expect(cats.data.data.map((c) => c.slug)).toEqual(['rings', 'necklaces', 'earrings']);
    expect(stores.data.data).toHaveLength(2);
    expect(blogs.data.data[0].slug).toBe('gold-care');
    expect(attrs.data.data.every((a) => a.isFilterable)).toBe(true);
    expect(store.data.data.facilities).toContain('Parking');
  });

  it('registers a vendor application', async () => {
    const { data } = await vendorAPI.register({
      name: 'Ravi Vendor',
      email: 'ravi.vendor@test.com',
      password: 'correct-password',
      phone: '9123456780',
      shopName: 'Ravi Jewels',
      city: 'Surat',
      agreeTerms: true,
    });
    expect(data.success).toBe(true);
    expect(data.data.vendorId).toBe('vend1');
  });
});
