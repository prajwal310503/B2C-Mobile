/**
 * Live smoke against the same API URL baked into the APK (app.json extra.apiUrl).
 * Run: node scripts/live-apk-smoke.js
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));
const API = appJson.expo?.extra?.apiUrl;
if (!API || typeof API !== 'string') {
  console.error('FAIL: app.json extra.apiUrl is missing');
  process.exit(1);
}

const results = [];

function request(method, urlPath, body, token) {
  const url = new URL(urlPath.startsWith('http') ? urlPath : `${API.replace(/\/$/, '')}${urlPath}`);
  const lib = url.protocol === 'https:' ? https : http;
  const payload = body ? JSON.stringify(body) : null;
  const headers = { Accept: 'application/json' };
  if (payload) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(payload);
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  return new Promise((resolve) => {
    const req = lib.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method,
        headers,
        timeout: 12000,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => {
          raw += c;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {
            // keep null
          }
          resolve({ status: res.statusCode, json, raw: raw.slice(0, 180) });
        });
      }
    );
    req.on('error', (err) => resolve({ status: 0, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, error: 'timeout' });
    });
    if (payload) req.write(payload);
    req.end();
  });
}

function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log(`\nAPK live smoke → ${API}\n`);

  const health = await request('GET', '/categories');
  check(
    'GET /categories reachable',
    health.status === 200 && health.json?.success === true,
    health.error || `HTTP ${health.status}`
  );

  if (!health.json?.success) {
    console.log('\nBackend not reachable. Start Backend with a valid MONGO_URI, then re-run.\n');
    process.exit(1);
  }

  const cats = health.json.data || [];
  check('Categories returned', cats.length > 0, `${cats.length} categories`);

  const products = await request('GET', '/products?limit=5&page=1');
  check(
    'GET /products paginated',
    products.status === 200 && Array.isArray(products.json?.data) && !!products.json?.meta,
    products.error || `items=${products.json?.data?.length ?? 0}`
  );

  const slug = products.json?.data?.[0]?.slug;
  if (slug) {
    const detail = await request('GET', `/products/${slug}`);
    check(
      'GET /products/:slug',
      detail.status === 200 && detail.json?.data?.slug === slug,
      slug
    );
  } else {
    check('GET /products/:slug', false, 'no products in DB');
  }

  const stores = await request('GET', '/stores');
  check('GET /stores', stores.status === 200 && stores.json?.success, `HTTP ${stores.status}`);

  const blogs = await request('GET', '/blog?limit=4');
  check('GET /blog', blogs.status === 200 && blogs.json?.success, `HTTP ${blogs.status}`);

  const badLogin = await request('POST', '/auth/login', {
    email: 'not-a-real-user@example.com',
    password: 'wrong-password',
  });
  check(
    'POST /auth/login rejects bad creds',
    badLogin.status === 401 || badLogin.status === 400,
    `HTTP ${badLogin.status}`
  );

  const email = `apk.smoke.${Date.now()}@test.com`;
  const register = await request('POST', '/auth/register', {
    name: 'APK Smoke',
    email,
    phone: '9876501234',
    password: 'correct-password',
  });
  const token = register.json?.token;
  check(
    'POST /auth/register',
    register.status >= 200 && register.status < 300 && !!token,
    register.json?.message || `HTTP ${register.status}`
  );

  if (token) {
    const me = await request('GET', '/auth/me', null, token);
    check(
      'GET /auth/me with token',
      me.status === 200 && me.json?.data?.user?.email === email,
      me.json?.data?.user?.email || `HTTP ${me.status}`
    );

    const productId = products.json?.data?.[0]?._id;
    if (productId) {
      const order = await request(
        'POST',
        '/orders',
        {
          items: [
            {
              product: productId,
              title: products.json.data[0].title,
              price: products.json.data[0].discountedPrice || products.json.data[0].price,
              quantity: 1,
            },
          ],
          shippingAddress: {
            fullName: 'APK Smoke',
            phone: '9876501234',
            addressLine1: '404 Marine Drive',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400020',
          },
          payment: { method: 'full_payment' },
        },
        token
      );
      check(
        'POST /orders place order',
        order.status >= 200 && order.status < 300 && !!order.json?.data,
        order.json?.message || `HTTP ${order.status}`
      );
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed\n`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
