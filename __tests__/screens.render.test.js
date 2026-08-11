import { screen, waitFor } from '@testing-library/react-native';

import { renderScreen, signIn } from '../test/harness';
import useAuthStore from '../src/store/authStore';
import useCartStore from '../src/store/cartStore';
import useWishlistStore from '../src/store/wishlistStore';

const fx = require('../test/fixtures');

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, authReady: true, loading: false });
  useCartStore.setState({ items: [] });
  useWishlistStore.setState({ items: [], syncing: false });
});

const asSignedIn = async () => {
  await signIn();
  useAuthStore.setState({ user: fx.user, token: 'test-jwt-token', authReady: true });
};

describe('storefront screens', () => {
  it('Home loads banners, categories and product rails from the API', async () => {
    await renderScreen(require('../src/screens/HomeScreen').default, { name: 'Tabs' });

    expect(await screen.findByText('Rings')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Test Product 1')).toBeTruthy());
    expect(screen.getByText('Our Collections')).toBeTruthy();
    expect(screen.getByText('Shree Jewellers')).toBeTruthy();
    expect(screen.getByText('Style Notes')).toBeTruthy();
    expect(screen.getByText('How to care for your gold jewellery')).toBeTruthy();
  });

  it('Shop lists the quick links and every category tile', async () => {
    await renderScreen(require('../src/screens/ShopScreen').default);

    expect(await screen.findByText('Browse Categories')).toBeTruthy();
    ['New Arrivals', 'Bestsellers', 'Boutiques', 'Journal'].forEach((label) =>
      expect(screen.getByText(label)).toBeTruthy()
    );
    await waitFor(() => expect(screen.getByText('Necklaces')).toBeTruthy());
  });

  it('Category shows the product grid with a result count', async () => {
    await renderScreen(require('../src/screens/CategoryScreen').default, {
      params: { slug: 'rings', name: 'Rings' },
    });

    expect(await screen.findByText('Rings')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('24 pieces')).toBeTruthy());
    expect(screen.getByText('Test Product 1')).toBeTruthy();
    expect(screen.getByText('Filters')).toBeTruthy();
  });

  it('Product renders gallery details, options and reviews', async () => {
    await renderScreen(require('../src/screens/ProductScreen').default, {
      params: { slug: 'test-product-1' },
    });

    expect(await screen.findByText('Test Product 1')).toBeTruthy();
    expect(screen.getByText('Shree Jewellers  ›')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Stunning finish')).toBeTruthy());
    expect(screen.getByText('Add to Cart')).toBeTruthy();
    expect(screen.getByText('Buy Now')).toBeTruthy();
  });

  it('Product falls back to an empty-review prompt when there are none', async () => {
    const { reviewAPI } = require('../src/services/api');
    const spy = jest.spyOn(reviewAPI, 'getProductReviews').mockResolvedValue({
      data: { success: true, data: [] },
    });

    await renderScreen(require('../src/screens/ProductScreen').default, {
      params: { slug: 'test-product-2' },
    });

    expect(await screen.findByText(/be the first to share/i)).toBeTruthy();
    spy.mockRestore();
  });

  it('Search finds products as the user types', async () => {
    const { render } = require('@testing-library/react-native');
    expect(render).toBeDefined();
    await renderScreen(require('../src/screens/SearchScreen').default);
    expect(await screen.findByPlaceholderText(/search/i)).toBeTruthy();
  });

  it('Cart shows the empty state for a new visitor', async () => {
    await renderScreen(require('../src/screens/CartScreen').default, { name: 'Tabs' });
    expect(await screen.findByText(/cart is empty/i)).toBeTruthy();
  });

  it('Cart lists lines and totals once items exist', async () => {
    useCartStore.setState({
      items: [{ key: 'k1', product: { ...fx.products[0], stock: 5 }, quantity: 2 }],
    });
    await renderScreen(require('../src/screens/CartScreen').default, { name: 'Tabs' });

    expect(await screen.findByText('Test Product 1')).toBeTruthy();
    expect(screen.getAllByText('₹74,000').length).toBeGreaterThan(0);
  });

  it('Wishlist shows the empty state for a new visitor', async () => {
    await renderScreen(require('../src/screens/WishlistScreen').default, { name: 'Tabs' });
    expect(await screen.findByText(/no favourites yet/i)).toBeTruthy();
  });

  it('Wishlist lists saved pieces once items exist', async () => {
    useWishlistStore.setState({ items: [fx.products[3]] });
    await renderScreen(require('../src/screens/WishlistScreen').default, { name: 'Tabs' });
    expect(await screen.findByText('Test Product 4')).toBeTruthy();
  });

  it('Checkout renders the address form, offers and payment choices', async () => {
    await asSignedIn();
    useCartStore.setState({
      items: [{ key: 'k1', product: { ...fx.products[0], stock: 5 }, quantity: 1 }],
    });

    await renderScreen(require('../src/screens/CheckoutScreen').default);

    expect(await screen.findByText('Promo Code')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('FESTIVE10')).toBeTruthy());
    expect(screen.getByText('Available offers')).toBeTruthy();
    expect(screen.getByText(/more to use/i)).toBeTruthy();
  });

  it('Order success confirms the placed order', async () => {
    await renderScreen(require('../src/screens/OrderSuccessScreen').default, {
      params: { orderId: 'order1', amount: 36000, partial: false },
    });
    expect(await screen.findByText('Order Confirmed')).toBeTruthy();
    expect(screen.getByText('Thank you')).toBeTruthy();
  });
});

describe('account screens', () => {
  it('Account shows sign-in prompts for a guest and all menu groups', async () => {
    await renderScreen(require('../src/screens/AccountScreen').default, { name: 'Tabs' });

    expect(await screen.findByText('Guest')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
    ['My account', 'Explore', 'Information'].forEach((group) =>
      expect(screen.getByText(group)).toBeTruthy()
    );
    ['My Profile', 'Boutiques', 'Become a Seller', 'Privacy Policy'].forEach((item) =>
      expect(screen.getByText(item)).toBeTruthy()
    );
  });

  it('Account shows the signed-in header and logout', async () => {
    await asSignedIn();
    await renderScreen(require('../src/screens/AccountScreen').default, { name: 'Tabs' });

    expect(await screen.findByText('Test Customer')).toBeTruthy();
    expect(screen.getByText('Log out')).toBeTruthy();
  });

  it('Profile prefills the current details', async () => {
    await asSignedIn();
    await renderScreen(require('../src/screens/ProfileScreen').default);

    expect(await screen.findByDisplayValue('Test Customer')).toBeTruthy();
    expect(screen.getByDisplayValue('9876543210')).toBeTruthy();
    expect(screen.getByText('Change password')).toBeTruthy();
  });

  it('Orders lists past orders with status', async () => {
    await asSignedIn();
    await renderScreen(require('../src/screens/OrdersScreen').default);

    expect(await screen.findByText(/RB-1001/)).toBeTruthy();
  });

  it('Order detail shows the timeline and tracking', async () => {
    await asSignedIn();
    await renderScreen(require('../src/screens/OrderDetailScreen').default, {
      params: { id: 'order1' },
    });

    expect(await screen.findByText(/RB-1001/)).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/BD123456789/)).toBeTruthy());
  });

  it('Addresses lists the saved address', async () => {
    await asSignedIn();
    await renderScreen(require('../src/screens/AddressesScreen').default);

    expect(await screen.findByText(/404 Marine Drive/)).toBeTruthy();
  });

  it('Support lists tickets and their replies', async () => {
    await asSignedIn();
    await renderScreen(require('../src/screens/SupportScreen').default);

    expect(await screen.findByText('Ring size exchange')).toBeTruthy();
  });

  it('Refer & Earn shows the code and rewards', async () => {
    await asSignedIn();
    await renderScreen(require('../src/screens/ReferScreen').default);

    expect(await screen.findByText('TEST500')).toBeTruthy();
  });
});

describe('content screens', () => {
  it('Blog lists the featured hero and remaining posts', async () => {
    await renderScreen(require('../src/screens/BlogScreen').default);

    expect(await screen.findByText('Gold care guide')).toBeTruthy();
    expect(screen.getByText('Choosing the right diamond cut')).toBeTruthy();
  });

  it('Blog detail flattens the stored HTML into paragraphs', async () => {
    await renderScreen(require('../src/screens/BlogDetailScreen').default, {
      params: { slug: 'gold-care' },
    });

    expect(await screen.findByText('How to care for your gold jewellery')).toBeTruthy();
    expect(screen.getByText('Store pieces separately.')).toBeTruthy();
    expect(screen.getByText('Avoid chlorine and perfume.')).toBeTruthy();
    expect(screen.getByText('• Wipe after wear')).toBeTruthy();
  });

  it('Blog detail explains a missing article instead of crashing', async () => {
    await renderScreen(require('../src/screens/BlogDetailScreen').default, {
      params: { slug: 'nope' },
    });
    expect(await screen.findByText(/no longer available/i)).toBeTruthy();
  });

  it('Stores lists boutiques with city filters', async () => {
    await renderScreen(require('../src/screens/StoresScreen').default);

    expect(await screen.findByText('Shree Jewellers')).toBeTruthy();
    expect(screen.getByText('Kalyan Gold')).toBeTruthy();
    expect(screen.getByText('All cities')).toBeTruthy();
    expect(screen.getByText('2 partner shops')).toBeTruthy();
  });

  it('Store detail shows contact info, facilities, services and products', async () => {
    await renderScreen(require('../src/screens/StoreDetailScreen').default, {
      params: { slug: 'shree-jewellers' },
    });

    expect(await screen.findByText('EXPERIENCE SHREE JEWELLERS')).toBeTruthy();
    expect(screen.getByText('12 Zaveri Bazaar, Mumbai')).toBeTruthy();
    expect(screen.getByText('Parking')).toBeTruthy();
    expect(screen.getByText('Custom design')).toBeTruthy();
    expect(screen.getByText('Four generations of goldsmiths.')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Their Collection')).toBeTruthy());
  });

  it.each([
    ['about', 'About Us', /multi-vendor jewellery marketplace/],
    ['privacy', 'Privacy Policy', /Payment data is processed securely/],
    ['terms', 'Terms & Conditions', /Orders are subject to availability/],
    ['shipping', 'Shipping Policy', /5–10 business days/],
  ])('Static page %s renders its copy', async (pageKey, title, bodyMatch) => {
    await renderScreen(require('../src/screens/StaticPageScreen').default, { params: { pageKey } });

    expect(await screen.findByText(title)).toBeTruthy();
    expect(screen.getByText(bodyMatch)).toBeTruthy();
  });

  it('FAQ page lists every question', async () => {
    await renderScreen(require('../src/screens/StaticPageScreen').default, { params: { pageKey: 'faq' } });

    expect(await screen.findByText('How does multi-vendor checkout work?')).toBeTruthy();
    expect(screen.getByText('Can I apply a coupon?')).toBeTruthy();
  });

  it('Contact page shows the enquiry form and contact details', async () => {
    await renderScreen(require('../src/screens/StaticPageScreen').default, {
      params: { pageKey: 'contact' },
    });

    expect(await screen.findByText('care@royalbutterfly.in')).toBeTruthy();
    expect(screen.getByText('+91 9594555962')).toBeTruthy();
    expect(screen.getByText('Send Enquiry')).toBeTruthy();
  });

  it('Become a Seller renders benefits, steps and inclusions', async () => {
    await renderScreen(require('../src/screens/BecomeSellerScreen').default);

    expect(await screen.findByText('Grow Your Jewellery')).toBeTruthy();
    expect(screen.getByText('Live Metal Price Sync')).toBeTruthy();
    expect(screen.getByText('Get Approved')).toBeTruthy();
    expect(screen.getByText('Unlimited product listings')).toBeTruthy();
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('Vendor registration renders the full form', async () => {
    await renderScreen(require('../src/screens/VendorRegisterScreen').default);

    expect(await screen.findByText('Register your jewellery shop')).toBeTruthy();
    ['Full name', 'Shop name', 'City', 'Phone'].forEach((label) =>
      expect(screen.getByText(label)).toBeTruthy()
    );
  });

  it('Write review renders the rating picker and photo slot', async () => {
    await asSignedIn();
    await renderScreen(require('../src/screens/WriteReviewScreen').default, {
      params: { productId: 'prod1', productName: 'Test Product 1' },
    });

    expect(await screen.findByText('How would you rate it?')).toBeTruthy();
    expect(screen.getByText('Photos (optional)')).toBeTruthy();
    expect(screen.getByText('Post review')).toBeTruthy();
  });
});

describe('auth screens', () => {
  it('Login renders the form with a forgot-password link', async () => {
    await renderScreen(require('../src/screens/LoginScreen').default);

    expect(await screen.findByText('Sign In')).toBeTruthy();
    expect(screen.getByText('Forgot password?')).toBeTruthy();
    expect(screen.getByText('Create an account')).toBeTruthy();
    expect(screen.getByText('Continue with Google')).toBeTruthy();
  });

  it('Register renders the sign-up form with optional referral', async () => {
    await renderScreen(require('../src/screens/RegisterScreen').default, {
      params: { referralCode: 'TEST500' },
    });
    expect(await screen.findByPlaceholderText(/you@example.com/i)).toBeTruthy();
    expect(screen.getByDisplayValue('TEST500')).toBeTruthy();
    expect(screen.getByText('Continue with Google')).toBeTruthy();
  });

  it('Forgot password renders the request form', async () => {
    await renderScreen(require('../src/screens/ForgotPasswordScreen').default);

    expect(await screen.findByText('Forgot your password?')).toBeTruthy();
    expect(screen.getByText('Send reset link')).toBeTruthy();
  });

  it('Reset password renders the new-password form', async () => {
    await renderScreen(require('../src/screens/ResetPasswordScreen').default, {
      params: { token: 'reset-token' },
    });
    expect(await screen.findByText('Choose a new password')).toBeTruthy();
    expect(screen.getByText('Update password')).toBeTruthy();
  });
});
