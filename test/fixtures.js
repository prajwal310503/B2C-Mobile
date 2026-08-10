/**
 * Fixtures mirror the field names the real backend models expose, so a test
 * failure here means the app is reading a field the API does not send.
 * Sources: Backend/src/models/{Product,Category,Store,Blog,Coupon,User}.js
 */

const categories = [
  { _id: 'cat1', name: 'Rings', slug: 'rings', image: 'https://cdn.test/rings.jpg', productCount: 42 },
  { _id: 'cat2', name: 'Necklaces', slug: 'necklaces', image: 'https://cdn.test/neck.jpg', productCount: 18 },
  { _id: 'cat3', name: 'Earrings', slug: 'earrings', image: null, productCount: 7 },
];

const stores = [
  {
    _id: 'store1',
    name: 'Shree Jewellers',
    slug: 'shree-jewellers',
    tagline: 'Heritage craftsmanship since 1974',
    description: '<p>Four generations of goldsmiths.</p>',
    logo: 'https://cdn.test/logo1.jpg',
    banner: 'https://cdn.test/banner1.jpg',
    address: '12 Zaveri Bazaar, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    phone: '9594555962',
    email: 'hello@shree.test',
    hoursDisplay: '10:30 am - 9:30 pm',
    facilities: ['Parking', 'Lounge', 'Wheelchair access'],
    services: [{ icon: 'ring', title: 'Custom design' }, { icon: 'clean', title: 'Free cleaning' }],
    rating: 4.6,
    totalReviews: 128,
    bookingLink: 'https://book.test/shree',
    isFeatured: true,
  },
  {
    _id: 'store2',
    name: 'Kalyan Gold',
    slug: 'kalyan-gold',
    city: 'Pune',
    rating: 4.2,
    totalReviews: 64,
    logo: null,
    isFeatured: false,
  },
];

const makeProduct = (i, overrides = {}) => ({
  _id: `prod${i}`,
  title: `Test Product ${i}`,
  slug: `test-product-${i}`,
  price: 40000 + i * 1000,
  discountedPrice: 36000 + i * 1000,
  discountPercentage: 10,
  images: [{ url: `https://cdn.test/p${i}-a.jpg` }, { url: `https://cdn.test/p${i}-b.jpg` }],
  category: categories[0],
  store: stores[0],
  rating: 4.5,
  totalReviews: 12,
  totalSold: 30,
  stock: 5,
  isFeatured: true,
  isNewArrival: i % 2 === 0,
  isBestSeller: i % 3 === 0,
  metalColors: ['Yellow Gold', 'Rose Gold'],
  purity: '22K',
  metalWeight: 6.4,
  sizes: { enabled: true, available: [12, 14, 16] },
  lengths: { enabled: false, available: [] },
  stoneColors: ['White', 'Champagne'],
  certifications: [
    { lab: 'BIS', certNumber: 'HALLMARK' },
    { lab: 'IGI', certNumber: 'IGI-1001' },
  ],
  priceBreakup: {
    metalType: '22KT Yellow Gold',
    grossWeight: 7.1,
    netWeight: 6.4,
    metalRate: 6200,
    metalAmount: 39680,
    makingCharges: 3200,
    gstPct: 3,
  },
  description: 'A finely crafted test piece.',
  ...overrides,
});

const products = Array.from({ length: 24 }, (_, idx) => makeProduct(idx + 1));

const blogs = [
  {
    _id: 'blog1',
    title: 'How to care for your gold jewellery',
    slug: 'gold-care',
    category: 'EDUCATION',
    excerpt: 'Simple habits that keep gold bright for decades.',
    content: '<p>Store pieces separately.</p><p>Avoid chlorine and perfume.</p><ul><li>Wipe after wear</li></ul>',
    image: 'https://cdn.test/blog1.jpg',
    imageTitle: 'Gold care guide',
    author: 'Editorial Desk',
    publishedAt: '2026-05-01T00:00:00.000Z',
    isPublished: true,
  },
  {
    _id: 'blog2',
    title: 'Choosing the right diamond cut',
    slug: 'diamond-cut',
    category: 'BUYING GUIDE',
    excerpt: 'Cut matters more than carat.',
    content: '<p>Brilliance comes from proportion.</p>',
    image: null,
    author: 'Admin',
    publishedAt: '2026-04-11T00:00:00.000Z',
    isPublished: true,
  },
];

const attributes = [
  {
    _id: 'attr1',
    name: 'Metal',
    slug: 'metal',
    isFilterable: true,
    values: [
      { _id: 'v1', value: 'Yellow Gold' },
      { _id: 'v2', value: 'Rose Gold' },
      { _id: 'v3', value: 'Platinum' },
    ],
  },
  {
    _id: 'attr2',
    name: 'Purity',
    slug: 'purity',
    isFilterable: true,
    values: [{ _id: 'v4', value: '18K' }, { _id: 'v5', value: '22K' }],
  },
  {
    _id: 'attr3',
    name: 'Internal note',
    slug: 'internal',
    isFilterable: false,
    values: [{ _id: 'v6', value: 'hidden' }],
  },
];

const coupons = [
  {
    _id: 'coup1',
    code: 'FESTIVE10',
    title: '10% off this festive season',
    description: 'On orders above ₹20,000',
    type: 'percentage',
    value: 10,
    minOrderAmount: 20000,
    maxDiscountAmount: 5000,
  },
  {
    _id: 'coup2',
    code: 'BIGSPEND',
    title: '₹8,000 off',
    description: 'On orders above ₹2,00,000',
    type: 'fixed',
    value: 8000,
    minOrderAmount: 200000,
  },
];

const reviews = [
  {
    _id: 'rev1',
    rating: 5,
    title: 'Stunning finish',
    comment: 'Even better in person. The polish is flawless and it arrived insured.',
    user: { _id: 'u9', name: 'Ananya R' },
    createdAt: '2026-06-02T00:00:00.000Z',
  },
  {
    _id: 'rev2',
    rating: 4,
    title: 'Good value',
    comment: 'Making charges were fair compared to my local shop.',
    user: { _id: 'u10', name: 'Vikram S' },
    createdAt: '2026-06-10T00:00:00.000Z',
  },
];

const user = {
  _id: 'user1',
  name: 'Test Customer',
  email: 'test@customer.com',
  phone: '9876543210',
  role: 'customer',
  avatar: null,
  addresses: [
    {
      label: 'Home',
      fullName: 'Test Customer',
      phone: '9876543210',
      addressLine1: '404 Marine Drive',
      addressLine2: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400020',
      isDefault: true,
    },
  ],
};

const orders = [
  {
    _id: 'order1',
    orderNumber: 'VK-1001',
    createdAt: '2026-07-01T00:00:00.000Z',
    status: 'shipped',
    items: [
      {
        product: products[0],
        title: products[0].title,
        quantity: 1,
        price: products[0].discountedPrice,
        image: products[0].images[0].url,
      },
    ],
    subtotal: 36000,
    shippingCost: 0,
    discount: 0,
    total: 36000,
    payment: { method: 'full_payment', status: 'paid', paidAmount: 36000, dueAmount: 0 },
    shippingAddress: user.addresses[0],
    courierName: 'BlueDart',
    trackingNumber: 'BD123456789',
    store: stores[0],
  },
];

const tickets = [
  {
    _id: 'tick1',
    ticketNumber: 'SUP-501',
    subject: 'Ring size exchange',
    reason: 'Exchange',
    status: 'open',
    createdAt: '2026-07-05T00:00:00.000Z',
    messages: [
      { _id: 'm1', body: 'I need a size 16 instead of 14.', sender: 'customer', createdAt: '2026-07-05T00:00:00.000Z' },
      { _id: 'm2', body: 'Sure, we have arranged a pickup.', sender: 'admin', createdAt: '2026-07-06T00:00:00.000Z' },
    ],
  },
];

const referral = {
  referralCode: 'TEST500',
  shareLink: 'https://royalbutterfly.in/r/TEST500',
  referralBalance: 1500,
  pendingBalance: 500,
  totalReferred: 3,
  defaultRewardAmount: 500,
  rewards: [
    { _id: 'r1', amount: 500, status: 'credited', createdAt: '2026-06-01T00:00:00.000Z', referredUser: { name: 'Friend A' } },
    { _id: 'r2', amount: 500, status: 'pending', createdAt: '2026-06-20T00:00:00.000Z', referredUser: { name: 'Friend B' } },
  ],
};

const banners = [
  {
    _id: 'ban1',
    title: 'Festive Edit',
    subtitle: 'Up to 20% off making charges',
    image: 'https://cdn.test/hero1.jpg',
    link: '/category/rings',
    position: 'home-hero',
  },
  {
    _id: 'ban2',
    title: 'New Arrivals',
    image: 'https://cdn.test/hero2.jpg',
    position: 'home-hero',
  },
];

module.exports = {
  attributes,
  banners,
  blogs,
  categories,
  coupons,
  makeProduct,
  orders,
  products,
  referral,
  reviews,
  stores,
  tickets,
  user,
};
