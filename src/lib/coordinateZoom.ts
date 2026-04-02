/**
 * Determines Google Maps zoom level based on coordinate decimal precision.
 * More decimal places = higher precision = closer zoom.
 */
export function getZoomForCoordinates(coordinates: string): number {
  const parts = coordinates.split(',').map(s => s.trim());
  let maxDecimals = 0;

  for (const part of parts) {
    const dotIndex = part.indexOf('.');
    if (dotIndex !== -1) {
      const decimals = part.replace(/\s/g, '').length - dotIndex - 1;
      maxDecimals = Math.max(maxDecimals, decimals);
    }
  }

  // Map: 0-1 decimals → 8, 2 → 9, 3 → 10, ..., 13+ → 18
  if (maxDecimals <= 1) return 8;
  const zoom = Math.min(7 + maxDecimals, 18);
  return zoom;
}
