/** Recalculate jewellery price for a given weight + rate (keep in sync with Frontend calc). */
export function calcJewelleryPriceForWeight({
  weight,
  rate,
  diamondStoneTotal = 0,
  additionalItems = [],
  makingChargePercent = 0,
  gstPercent = 3,
}) {
  const w = Number(weight) || 0;
  const r = Number(rate) || 0;
  const metalValue = Math.round(w * r * 100) / 100;
  const additionalTotal = (additionalItems || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const baseSubtotal = Math.round((metalValue + Number(diamondStoneTotal || 0) + additionalTotal) * 100) / 100;
  const makingCharges = Math.round(baseSubtotal * ((Number(makingChargePercent) || 0) / 100) * 100) / 100;
  const taxableSubtotal = Math.round((baseSubtotal + makingCharges) * 100) / 100;
  const gst = Math.round(taxableSubtotal * ((Number(gstPercent) || 0) / 100) * 100) / 100;
  const finalPrice = Math.round((taxableSubtotal + gst) * 100) / 100;
  return { metalValue, additionalTotal, baseSubtotal, makingCharges, taxableSubtotal, gst, finalPrice, weight: w };
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Category size chart for existing products without sizeVariants (keep in sync with Frontend catalog). */
function categorySizes(category) {
  const slug = norm(typeof category === 'string' ? category : category?.slug);
  const name = norm(typeof category === 'string' ? category : category?.name);
  const hay = `${slug} ${name}`;
  if (hay.includes('mangalsutra') && hay.includes('bracelet')) {
    return ['16', '17', '18', '19', 'adjustable'];
  }
  if (hay.includes('earring') || hay.includes('nosepin') || hay.includes('brooch')) return [];
  if (/\brings?\b/.test(hay)) {
    return ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
  }
  if (hay.includes('bangle')) return ['2.2', '2.4', '2.6', '2.8', '2.10', '2.12', '2.14', '3'];
  if (hay.includes('kada')) return ['2.4', '2.6', '2.8', '2.10'];
  if (hay.includes('chain') || hay.includes('necklace')) return ['16', '18', '20', '22'];
  if (hay.includes('pendant')) return [];
  if (hay.includes('mangalsutra')) return ['5', '5.5', '6', '6.5', '7', '7.5'];
  if (hay.includes('bracelet')) return ['14', '15', '16', '17', '18', '19', '20', '21', 'adjustable'];
  if (hay.includes('anklet')) return ['24', '25', '26', '27', '28', 'adjustable'];
  return [];
}

export function resolveProductSizeList(product) {
  if (!product) return [];
  const sf = product.jewelleryPricing?.storefrontOptions || {};
  if (sf.showSize === false) return [];
  // Only vendor/admin-selected sizeVariants (with weights) — no category fallback
  const variants = product.jewelleryPricing?.sizeVariants || [];
  if (variants.length) {
    return variants
      .filter((v) => v && String(v.size ?? '').trim() !== '')
      .map((v) => String(v.size));
  }
  if (product.sizes?.enabled && product.sizes?.available?.length) {
    return product.sizes.available.map(String);
  }
  return [];
}

export function resolveActiveWeight(product, selectedMetalOption, selectedSize) {
  if (!product) return 0;
  const jp = product.jewelleryPricing || {};
  if (selectedMetalOption?.weightOverridden) return Number(selectedMetalOption.weight) || 0;
  if (selectedSize && (jp.sizeVariants || []).length) {
    const hit = (jp.sizeVariants || []).find((v) => String(v.size) === String(selectedSize));
    if (hit && hit.weight != null && hit.weight !== '') return Number(hit.weight) || 0;
  }
  if (selectedMetalOption?.weight != null) return Number(selectedMetalOption.weight) || 0;
  if (jp.weight != null) return Number(jp.weight) || 0;
  return Number(product.metalWeight) || 0;
}
