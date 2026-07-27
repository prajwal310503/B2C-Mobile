# Luxury Jewellery — Mobile App

Customer-facing React Native app (Android + iOS) built with Expo. It talks to the same
`Backend` REST API that powers the web storefront, and mirrors its visual language:
the `#5a413f` cocoa primary, champagne gold accents and warm cream surfaces.

## Requirements

- Node 20+
- The `Backend` server running (defaults to `http://localhost:8000`)
- Expo Go on your phone, or an Android emulator / iOS simulator

## Getting started

```bash
cd Mobile
npm install
npm start
```

Then scan the QR code with Expo Go, or press `a` for Android / `i` for iOS.

## API connection

`src/config.js` resolves the backend URL in this order:

1. `expo.extra.apiUrl` in `app.json` — set this for staging/production, e.g.
   `"apiUrl": "https://api.yourdomain.com/api"`
2. The LAN address Metro is already serving from, on port `8000`. This is what makes a
   physical phone work without any manual IP editing.
3. `10.0.2.2` (Android emulator) or `localhost` (iOS simulator) as a last resort.

Make sure the backend listens on all interfaces (`0.0.0.0`) so your phone can reach it.

## Project structure

```
src/
  config.js              Backend URL resolution
  theme/                 Colours, gradients, radii, shadows, typography
  services/api.js        Axios client + endpoint groups (auth, products, orders…)
  store/                 Zustand stores persisted to AsyncStorage
    authStore.js         Session + bootstrap from stored JWT
    cartStore.js         Cart lines, quantities, totals
    wishlistStore.js     Local wishlist merged with the server copy
    toastStore.js        In-app toast queue
  components/
    ui/                  Button, Field, Screen, Stars, Skeleton, ToastHost, AppHeader…
    product/ProductCard  Grid/rail card with badges, swatches and add-to-cart
    home/HeroCarousel    Auto-playing banner carousel
  navigation/            Bottom tabs (custom tab bar) wrapped in a native stack
  screens/               One file per screen
```

## Screens

| Screen | Purpose |
| --- | --- |
| Home | Hero banners, categories, featured / deals / new arrivals, boutiques, journal |
| Shop | Quick filters and the full category grid |
| Category | Paginated listing with the full filter sheet — sort, price bands, boutique, dynamic attributes |
| Search | Debounced search with recent and popular terms |
| Product | Gallery, size/length/stone selectors, price breakup, pincode check, reviews, related |
| Cart | Line editing plus order summary |
| Checkout | Address (with saved addresses), promo code plus available offers, full vs 50% payment, place order |
| Order success | Confirmation with amount paid |
| Orders / Order detail | History, status timeline, tracking, pay remaining, cancel request |
| Wishlist | Saved pieces, add-all-to-cart |
| Account | Grouped menu across account, explore, and information links |
| Profile | Edit name, phone, avatar upload, change password |
| Addresses | Add, edit, delete, set default |
| Support | Raise and follow up on tickets |
| Refer & Earn | Referral code, wallet balance, reward history |
| Boutiques / Boutique detail | Partner shop directory with city filter; hero, facilities, services, collection |
| Journal / Article | Blog list with category tabs and the full article reader |
| Write review | Star rating, headline, comment, up to five photos |
| Become a Seller | Benefits, process, inclusions |
| Vendor registration | Shop application form |
| Static pages | About, Contact (with enquiry form), FAQ, Shipping, Privacy, Terms |
| Login / Register / Forgot password | Email + password auth and reset link request |

## Building for stores

```bash
npm install -g eas-cli
eas login
eas build --platform android    # .aab for Play Store
eas build --platform ios        # .ipa for App Store (Apple Developer account required)
```

Set `expo.extra.apiUrl` to your production API before building.

## Not included

Admin and vendor panels stay on the web app — dense dashboards and bulk media uploads
are a much better fit for a desktop browser than a phone.
