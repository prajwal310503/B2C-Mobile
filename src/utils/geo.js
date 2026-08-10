/**
 * Reverse-geocode lat/lng → 6-digit Indian pincode. Tries two free, keyless
 * providers for reliability (mirrors Frontend/src/components/product/DeliveryCheck.jsx
 * so web and mobile resolve pincodes the same way).
 */
export async function reverseGeocodePincode(latitude, longitude) {
  // 1) BigDataCloud — fast, no key, works most of the time in India
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    if (res.ok) {
      const geo = await res.json();
      const pin = String(geo.postcode || '').replace(/\D/g, '').slice(0, 6);
      if (/^\d{6}$/.test(pin)) return pin;
    }
  } catch {
    /* try fallback */
  }

  // 2) OpenStreetMap Nominatim — fallback when BigDataCloud has no postcode for the area
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&addressdetails=1&zoom=18`,
      { headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const geo = await res.json();
      const pin = String(geo?.address?.postcode || '').replace(/\D/g, '').slice(0, 6);
      if (/^\d{6}$/.test(pin)) return pin;
    }
  } catch {
    /* give up */
  }

  return null;
}
