import AsyncStorage from '@react-native-async-storage/async-storage';
import { act } from '@testing-library/react-native';

import useCartStore from '../src/store/cartStore';
import useWishlistStore from '../src/store/wishlistStore';
import useAuthStore from '../src/store/authStore';
import useToastStore from '../src/store/toastStore';
import { TOKEN_KEY } from '../src/services/api';

const fx = require('../test/fixtures');

const ring = fx.products[0];
const inStock = { ...ring, stock: 3 };
const soldOut = { ...fx.products[1], stock: 0 };

beforeEach(() => {
  useCartStore.setState({ items: [] });
  useWishlistStore.setState({ items: [], syncing: false });
  useAuthStore.setState({ user: null, token: null, authReady: false, loading: false });
  useToastStore.setState({ toasts: [] });
});

describe('cart store', () => {
  it('adds an item and computes the subtotal from the discounted price', () => {
    act(() => useCartStore.getState().addItem(inStock, 2));
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.getTotalItems()).toBe(2);
    expect(state.getSubtotal()).toBe(inStock.discountedPrice * 2);
    expect(state.getTotal()).toBe(state.getSubtotal() + state.getShipping());
  });

  it('keeps different size selections as separate lines', () => {
    act(() => {
      useCartStore.getState().addItem(inStock, 1, null, { size: '12' });
      useCartStore.getState().addItem(inStock, 1, null, { size: '14' });
    });
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('merges a repeat add of the same selection into one line', () => {
    act(() => {
      useCartStore.getState().addItem(inStock, 1, null, { size: '12' });
      useCartStore.getState().addItem(inStock, 1, null, { size: '12' });
    });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('refuses out-of-stock products and explains why', () => {
    act(() => useCartStore.getState().addItem(soldOut, 1));
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
      type: 'error',
      message: 'This item is out of stock',
    });
  });

  it('caps quantity at the available stock', () => {
    act(() => useCartStore.getState().addItem(inStock, 99));
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    const key = useCartStore.getState().items[0].key;
    act(() => useCartStore.getState().updateQuantity(key, 50));
    expect(useCartStore.getState().items[0].quantity).toBe(3);
    expect(useToastStore.getState().toasts.at(-1).message).toBe('Only 3 left in stock');
  });

  it('removes the line when quantity drops to zero', () => {
    act(() => useCartStore.getState().addItem(inStock, 1));
    const key = useCartStore.getState().items[0].key;
    act(() => useCartStore.getState().updateQuantity(key, 0));
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('persists the cart to AsyncStorage', async () => {
    act(() => useCartStore.getState().addItem(inStock, 1));
    await new Promise((r) => setTimeout(r, 0));
    const raw = await AsyncStorage.getItem('luxury-cart');
    expect(JSON.parse(raw).state.items).toHaveLength(1);
  });

  it('flags a cart holding an item that went out of stock', () => {
    act(() => useCartStore.setState({ items: [{ key: 'k', product: soldOut, quantity: 1 }] }));
    expect(useCartStore.getState().hasOutOfStock()).toBe(true);
  });
});

describe('wishlist store', () => {
  it('toggles a product on and off', async () => {
    await act(async () => {
      await useWishlistStore.getState().toggleItem(ring);
    });
    expect(useWishlistStore.getState().isInWishlist(ring._id)).toBe(true);

    await act(async () => {
      await useWishlistStore.getState().toggleItem(ring);
    });
    expect(useWishlistStore.getState().isInWishlist(ring._id)).toBe(false);
  });

  it('does not add the same product twice', async () => {
    await act(async () => {
      await useWishlistStore.getState().addItem(ring);
      await useWishlistStore.getState().addItem(ring);
    });
    expect(useWishlistStore.getState().items).toHaveLength(1);
    expect(useToastStore.getState().toasts.at(-1).message).toBe('Already in wishlist');
  });

  it('pushes the list to the server once signed in', async () => {
    await AsyncStorage.setItem(TOKEN_KEY, 'test-jwt-token');
    await act(async () => {
      await useWishlistStore.getState().addItem(ring);
    });
    const requests = await global.serverRequests();
    const put = requests.find((r) => r.method === 'PUT' && r.path === '/auth/wishlist');
    expect(put.body.productIds).toEqual([ring._id]);
  });

  it('merges the server wishlist with local guest picks on sign-in', async () => {
    await AsyncStorage.setItem(TOKEN_KEY, 'test-jwt-token');
    // Seed the server with product 3, keep product 1 only on the device.
    const { authAPI } = require('../src/services/api');
    await authAPI.setWishlist([fx.products[2]._id]);
    useWishlistStore.setState({ items: [ring] });

    await act(async () => {
      await useWishlistStore.getState().syncFromServer();
    });

    const ids = useWishlistStore.getState().items.map((i) => i._id).sort();
    expect(ids).toEqual([ring._id, fx.products[2]._id].sort());
  });

  it('leaves the local list untouched for a guest', async () => {
    useWishlistStore.setState({ items: [ring] });
    await act(async () => {
      await useWishlistStore.getState().syncFromServer();
    });
    expect(useWishlistStore.getState().items).toHaveLength(1);
  });
});

describe('auth store', () => {
  it('stores the token and user returned next to each other by the API', async () => {
    await act(async () => {
      await useAuthStore.getState().login({ email: 'a@b.com', password: 'correct-password' });
    });
    const state = useAuthStore.getState();
    expect(state.token).toBe('test-jwt-token');
    expect(state.user).toMatchObject({ email: 'a@b.com', name: 'Test Customer' });
    expect(state.isAuthenticated()).toBe(true);
    expect(await AsyncStorage.getItem(TOKEN_KEY)).toBe('test-jwt-token');
  });

  it('reports a failed login and stays signed out', async () => {
    await act(async () => {
      await expect(
        useAuthStore.getState().login({ email: 'a@b.com', password: 'wrong' })
      ).rejects.toBeDefined();
    });
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().loading).toBe(false);
    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
      type: 'error',
      message: 'Invalid credentials',
    });
  });

  it('registers and signs the user straight in', async () => {
    await act(async () => {
      await useAuthStore
        .getState()
        .register({ name: 'New Person', email: 'new@test.com', password: 'secret1' });
    });
    expect(useAuthStore.getState().user).toMatchObject({ name: 'New Person' });
  });

  it('rehydrates the session from a stored token', async () => {
    await AsyncStorage.setItem(TOKEN_KEY, 'test-jwt-token');
    await act(async () => {
      await useAuthStore.getState().bootstrap();
    });
    const state = useAuthStore.getState();
    expect(state.authReady).toBe(true);
    expect(state.user).toMatchObject({ email: 'test@customer.com' });
  });

  it('drops an invalid stored token during bootstrap', async () => {
    await AsyncStorage.setItem(TOKEN_KEY, 'test-jwt-token');
    await global.armFailure(401, 'Session expired');
    await act(async () => {
      await useAuthStore.getState().bootstrap();
    });
    expect(useAuthStore.getState().token).toBeNull();
    expect(await AsyncStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('finishes bootstrap for a guest without calling the API', async () => {
    await act(async () => {
      await useAuthStore.getState().bootstrap();
    });
    expect(useAuthStore.getState().authReady).toBe(true);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('clears the token and the wishlist on logout', async () => {
    await AsyncStorage.setItem(TOKEN_KEY, 'test-jwt-token');
    useAuthStore.setState({ token: 'test-jwt-token', user: fx.user });
    useWishlistStore.setState({ items: [ring] });

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    expect(useAuthStore.getState().token).toBeNull();
    expect(useWishlistStore.getState().items).toHaveLength(0);
    expect(await AsyncStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('signs the user out when any request returns 401', async () => {
    useAuthStore.setState({ token: 'test-jwt-token', user: fx.user });
    const { orderAPI } = require('../src/services/api');
    await AsyncStorage.removeItem(TOKEN_KEY);
    await act(async () => {
      await expect(orderAPI.getMyOrders()).rejects.toMatchObject({ status: 401 });
    });
    expect(useAuthStore.getState().token).toBeNull();
  });
});

describe('toast store', () => {
  it('queues messages and drops them by id', () => {
    act(() => {
      useToastStore.getState().push('success', 'Saved');
      useToastStore.getState().push('error', 'Nope');
    });
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(2);

    act(() => useToastStore.getState().dismiss(toasts[0].id));
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });
});
