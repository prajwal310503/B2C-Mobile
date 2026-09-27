// Product photos are tagged per metal color; Silver and White Gold intentionally
// share one group since they look the same in photos.
const METAL_CODE_TO_IMAGE_GROUP = {
  YELLOW_GOLD: 'GOLD',
  ROSE_GOLD: 'ROSE_GOLD',
  SILVER: 'SILVER_WHITE_GOLD',
  WHITE_GOLD: 'SILVER_WHITE_GOLD',
};

export function resolveMetalImageGroup(metalCode) {
  return METAL_CODE_TO_IMAGE_GROUP[String(metalCode || '').toUpperCase()] || '';
}

/**
 * Photos tagged for the selected metal color, plus any untagged (shared) photos.
 * Falls back to every photo when the product has no per-metal tagging, or when
 * filtering by the active color would otherwise leave the gallery empty.
 */
export function filterImagesForMetal(images, metalCode) {
  const all = images || [];
  const group = resolveMetalImageGroup(metalCode);
  const hasGrouped = all.some((img) => img?.metalGroup);
  if (!hasGrouped || !group) return all;
  const filtered = all.filter((img) => !img.metalGroup || img.metalGroup === group);
  return filtered.length ? filtered : all;
}
