/**
 * A stand-in for Backend/ that speaks the same HTTP contract, so tests exercise
 * the real axios client, interceptors, stores and screens over a real socket.
 *
 * Response envelopes copy Backend/src/utils/response.js exactly:
 *   success  -> { success: true, message, data?, meta? }
 *   error    -> { success: false, message, errors? }
 *   paginated-> { success: true, data, meta: { total, page, limit, pages, hasNextPage, hasPrevPage } }
 */

const http = require('http');
const { URL } = require('url');
const fx = require('./fixtures');

const PORT = Number(process.env.FAKE_API_PORT || 8899);
const TOKEN = 'test-jwt-token';

function createServer() {
  // Reset between tests so one test's cart/orders never leak into the next.
  let state = freshState();

  function freshState() {
    return {
      requests: [],
      wishlist: [],
      addresses: JSON.parse(JSON.stringify(fx.user.addresses)),
      profile: JSON.parse(JSON.stringify(fx.user)),
      orders: JSON.parse(JSON.stringify(fx.orders)),
      tickets: JSON.parse(JSON.stringify(fx.tickets)),
      reviews: JSON.parse(JSON.stringify(fx.reviews)),
      failNext: null,
      latency: 0,
    };
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const path = url.pathname.replace(/^\/api/, '');
    const query = Object.fromEntries(url.searchParams.entries());
    const authed = (req.headers.authorization || '').startsWith('Bearer ');
    const contentType = req.headers['content-type'] || '';
    const body = await readBody(req, contentType);

    state.requests.push({ method: req.method, path, query, body, authed, contentType });

    const ok = (data, message = 'Success', status = 200, meta = null) => {
      const payload = { success: true, message };
      if (data !== null && data !== undefined) payload.data = data;
      if (meta) payload.meta = meta;
      send(res, status, payload);
    };
    const fail = (status, message, errors) =>
      send(res, status, { success: false, message, ...(errors ? { errors } : {}) });
    const paginated = (data, page, limit, total) =>
      send(res, 200, {
        success: true,
        data,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      });

    if (state.latency) await sleep(state.latency);

    // ── test-only control plane ───────────────────────────────────────────
    if (path === '/__test__/reset') {
      state = freshState();
      return ok(null, 'reset');
    }
    if (path === '/__test__/requests') return ok(state.requests);
    if (path === '/__test__/fail-next') {
      state.failNext = body;
      return ok(null, 'armed');
    }

    if (state.failNext) {
      const { status, message } = state.failNext;
      state.failNext = null;
      return fail(status || 500, message || 'Simulated failure');
    }

    const needsAuth = () => {
      if (authed) return false;
      fail(401, 'Not authorised, no token');
      return true;
    };

    // Mirrors Backend/src/utils/generateToken.js sendTokenResponse: the token
    // sits next to `data`, and `data` is the user object itself.
    const tokenResponse = (user, status, message) =>
      send(res, status, { success: true, message, token: TOKEN, data: user });

    // ── auth ──────────────────────────────────────────────────────────────
    if (path === '/auth/login' && req.method === 'POST') {
      if (!body?.email || !body?.password) return fail(400, 'Please provide email and password');
      if (body.password !== 'correct-password') return fail(401, 'Invalid credentials');
      state.profile = { ...state.profile, email: body.email };
      return tokenResponse(state.profile, 200, 'Login successful');
    }
    if (path === '/auth/register' && req.method === 'POST') {
      if (!body?.email) return fail(400, 'Validation failed', [{ msg: 'Email is required' }]);
      if (body.email === 'taken@test.com') return fail(400, 'Email already registered');
      state.profile = { ...state.profile, name: body.name, email: body.email };
      return tokenResponse(state.profile, 201, 'Account created successfully');
    }
    if (path === '/auth/logout') return ok(null, 'Logged out');
    if (path === '/auth/me') {
      if (needsAuth()) return undefined;
      return ok({ user: { ...state.profile, addresses: state.addresses } });
    }
    if (path === '/auth/forgot-password' && req.method === 'POST') {
      if (!body?.email) return fail(400, 'Email is required');
      return ok(null, 'Reset link sent');
    }
    if (path === '/auth/update-password' && req.method === 'PUT') {
      if (needsAuth()) return undefined;
      if (body?.currentPassword !== 'correct-password') return fail(401, 'Current password is incorrect');
      return tokenResponse(state.profile, 200, 'Password updated successfully');
    }
    if (path === '/auth/profile' && req.method === 'PUT') {
      if (needsAuth()) return undefined;
      // Multipart bodies arrive as raw text; pull the name field back out.
      const name = body?.name || extractField(body, 'name') || state.profile.name;
      const phone = body?.phone || extractField(body, 'phone') || state.profile.phone;
      state.profile = { ...state.profile, name, phone };
      return ok({ user: state.profile }, 'Profile updated');
    }
    if (path === '/auth/addresses' && req.method === 'PUT') {
      if (needsAuth()) return undefined;
      state.addresses = body?.addresses || [];
      return ok({ addresses: state.addresses }, 'Addresses updated');
    }
    if (path === '/auth/wishlist') {
      if (needsAuth()) return undefined;
      if (req.method === 'PUT') {
        state.wishlist = body?.productIds || [];
      }
      const items = state.wishlist
        .map((id) => fx.products.find((p) => p._id === id))
        .filter(Boolean);
      return ok({ items }, req.method === 'PUT' ? 'Wishlist saved' : 'Wishlist fetched');
    }
    if (path === '/auth/referral') {
      if (needsAuth()) return undefined;
      return ok(fx.referral);
    }
    if (path === '/auth/referral/payout' && req.method === 'POST') {
      if (needsAuth()) return undefined;
      return ok(null, 'Payout requested');
    }

    // ── catalogue ─────────────────────────────────────────────────────────
    if (path === '/products') {
      const page = Number(query.page || 1);
      const limit = Number(query.limit || 20);
      let list = [...fx.products];

      if (query.category) list = list.filter((p) => p.category.slug === query.category);
      if (query.store) list = list.filter((p) => p.store?.slug === query.store);
      if (query.isNewArrival === 'true') list = list.filter((p) => p.isNewArrival);
      if (query.isBestSeller === 'true') list = list.filter((p) => p.isBestSeller);
      if (query.isFeatured === 'true') list = list.filter((p) => p.isFeatured);
      if (query.search) {
        const term = query.search.toLowerCase();
        list = list.filter((p) => p.title.toLowerCase().includes(term));
      }
      if (query.minPrice) list = list.filter((p) => p.discountedPrice >= Number(query.minPrice));
      if (query.maxPrice) list = list.filter((p) => p.discountedPrice <= Number(query.maxPrice));
      if (query.sort === 'price_asc') list.sort((a, b) => a.discountedPrice - b.discountedPrice);
      if (query.sort === 'price_desc') list.sort((a, b) => b.discountedPrice - a.discountedPrice);

      const start = (page - 1) * limit;
      return paginated(list.slice(start, start + limit), page, limit, list.length);
    }
    if (path.startsWith('/products/')) {
      const slug = decodeURIComponent(path.split('/')[2]);
      const found = fx.products.find((p) => p.slug === slug || p._id === slug);
      return found ? ok(found) : fail(404, 'Product not found');
    }

    if (path === '/categories') return ok(fx.categories);
    if (path.startsWith('/categories/')) {
      const slug = path.split('/')[2];
      const found = fx.categories.find((c) => c.slug === slug);
      return found ? ok(found) : fail(404, 'Category not found');
    }

    if (path === '/attributes') {
      const list = query.filterable ? fx.attributes.filter((a) => a.isFilterable) : fx.attributes;
      return ok(list);
    }

    if (path === '/stores') {
      const list = query.featured === 'true' ? fx.stores.filter((s) => s.isFeatured) : fx.stores;
      return ok(list);
    }
    if (path.startsWith('/stores/')) {
      const slug = path.split('/')[2];
      const found = fx.stores.find((s) => s.slug === slug);
      return found ? ok(found) : fail(404, 'Store not found');
    }

    if (path === '/blog') return ok(fx.blogs);
    if (path.startsWith('/blog/')) {
      const slug = path.split('/')[2];
      const found = fx.blogs.find((b) => b.slug === slug);
      return found ? ok(found) : fail(404, 'Post not found');
    }

    if (path.startsWith('/reviews/product/')) return ok(state.reviews);
    if (path === '/reviews' && req.method === 'POST') {
      if (needsAuth()) return undefined;
      const rating = Number(body?.rating || extractField(body, 'rating') || 5);
      const created = {
        _id: `rev${state.reviews.length + 1}`,
        rating,
        title: extractField(body, 'title') || body?.title || '',
        comment: extractField(body, 'comment') || body?.comment || '',
        user: { _id: state.profile._id, name: state.profile.name },
        createdAt: new Date().toISOString(),
      };
      state.reviews.unshift(created);
      return ok(created, 'Review submitted', 201);
    }

    // ── commerce ──────────────────────────────────────────────────────────
    if (path === '/coupons/available') {
      if (needsAuth()) return undefined;
      return ok(fx.coupons);
    }
    if (path === '/coupons/validate' && req.method === 'POST') {
      const coupon = fx.coupons.find((c) => c.code === body?.code);
      if (!coupon) return fail(404, 'Invalid coupon code');
      if ((body?.subtotal || 0) < coupon.minOrderAmount) {
        return fail(400, `Minimum order value is ₹${coupon.minOrderAmount}`);
      }
      const raw =
        coupon.type === 'percentage' ? (body.subtotal * coupon.value) / 100 : coupon.value;
      const discount = coupon.maxDiscountAmount ? Math.min(raw, coupon.maxDiscountAmount) : raw;
      return ok(
        {
          discount: Math.round(discount),
          eligibleSubtotal: body.subtotal,
          isGiftCard: false,
          coupon: {
            _id: coupon._id,
            code: coupon.code,
            title: coupon.title,
            couponKind: 'global',
            type: coupon.type,
          },
        },
        'Code applied'
      );
    }

    if (path === '/orders' && req.method === 'POST') {
      if (needsAuth()) return undefined;
      if (!body?.items?.length) return fail(400, 'Cart is empty');
      if (!body?.shippingAddress?.pincode) return fail(400, 'Shipping address is incomplete');
      const created = {
        _id: `order${state.orders.length + 1}`,
        orderNumber: `RB-20${state.orders.length + 1}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        items: body.items,
        total: body.items.reduce((t, i) => t + (i.price || 0) * (i.quantity || 1), 0),
        payment: { method: body.payment?.method || 'full_payment', status: 'pending' },
        shippingAddress: body.shippingAddress,
      };
      state.orders.unshift(created);
      return ok(
        { orderGroupId: `grp-${created._id}`, orders: [created], primaryOrderId: created._id },
        'Order placed successfully',
        201
      );
    }
    if (path === '/orders/my') {
      if (needsAuth()) return undefined;
      return paginated(state.orders, query.page || 1, query.limit || 10, state.orders.length);
    }
    if (/^\/orders\/[^/]+$/.test(path)) {
      if (needsAuth()) return undefined;
      const id = path.split('/')[2];
      const found = state.orders.find((o) => o._id === id);
      return found ? ok(found) : fail(404, 'Order not found');
    }
    if (/^\/orders\/[^/]+\/(cancel-request|return-request|pay-remaining)$/.test(path)) {
      if (needsAuth()) return undefined;
      return ok(null, 'Request submitted');
    }

    // ── content & misc ────────────────────────────────────────────────────
    if (path === '/cms/pages/home') {
      return ok([
        {
          sectionType: 'visit_stores',
          content: {
            title: 'Our Collections',
            subtitle: 'Styled for every moment',
            stores: fx.stores.map((s) => ({ name: s.name, image: s.banner, link: `/stores/${s.slug}` })),
          },
        },
      ]);
    }
    if (path.startsWith('/cms/pages/')) return ok([]);
    if (path === '/cms/banners') return ok(fx.banners);
    if (path.startsWith('/cms/menus/')) return ok({ items: [] });
    if (path === '/settings/site-images') return ok({});

    if (path === '/pincodes/check') {
      if (!/^\d{6}$/.test(query.pincode || '')) return fail(400, 'Enter a valid 6-digit pincode');
      if (query.pincode === '999999') return fail(404, 'We do not deliver to this pincode yet');
      return ok({ serviceable: true, city: 'Mumbai', state: 'Maharashtra', etaDays: 5 });
    }

    if (path === '/support' && req.method === 'POST') {
      if (needsAuth()) return undefined;
      const created = {
        _id: `tick${state.tickets.length + 1}`,
        ticketNumber: `SUP-6${state.tickets.length + 1}`,
        subject: body?.subject,
        reason: body?.reason,
        status: 'open',
        createdAt: new Date().toISOString(),
        messages: [{ _id: 'nm1', body: body?.body, sender: 'customer', createdAt: new Date().toISOString() }],
      };
      state.tickets.unshift(created);
      return ok(created, 'Ticket created', 201);
    }
    if (path === '/support/my') {
      if (needsAuth()) return undefined;
      return ok(state.tickets);
    }
    if (/^\/support\/[^/]+$/.test(path) && req.method === 'GET') {
      if (needsAuth()) return undefined;
      const found = state.tickets.find((t) => t._id === path.split('/')[2]);
      return found ? ok(found) : fail(404, 'Ticket not found');
    }
    if (/^\/support\/[^/]+\/reply$/.test(path)) {
      if (needsAuth()) return undefined;
      const ticket = state.tickets.find((t) => t._id === path.split('/')[2]);
      if (!ticket) return fail(404, 'Ticket not found');
      ticket.messages.push({
        _id: `m${ticket.messages.length + 1}`,
        body: body?.body,
        sender: 'customer',
        createdAt: new Date().toISOString(),
      });
      return ok(ticket, 'Reply sent');
    }

    if (path === '/vendor/register' && req.method === 'POST') {
      const missing = ['name', 'email', 'password', 'shopName', 'phone'].filter((k) => !body?.[k]);
      if (missing.length) {
        return fail(400, 'Validation failed', missing.map((k) => ({ path: k, msg: `${k} is required` })));
      }
      return ok({ vendorId: 'vend1' }, 'Vendor registered', 201);
    }

    return fail(404, `No fake route for ${req.method} ${path}`);
  });

  return { server, getRequests: () => state.requests };
}

function readBody(req, contentType) {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'HEAD') return resolve(null);
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve(null);
      if (contentType.includes('application/json')) {
        try {
          return resolve(JSON.parse(raw));
        } catch {
          return resolve(raw);
        }
      }
      resolve(raw);
    });
  });
}

/** Pull `name="field"` values out of a raw multipart body. */
function extractField(raw, field) {
  if (typeof raw !== 'string') return null;
  const match = raw.match(new RegExp(`name="${field}"\\r?\\n\\r?\\n([^\\r\\n]*)`));
  return match ? match[1] : null;
}

function send(res, status, payload) {
  const json = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) });
  res.end(json);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { createServer, PORT, TOKEN, API_BASE: `http://127.0.0.1:${PORT}/api` };
