// Hitungan kiblat: pembanding offline untuk Aladhan API + jarak ke Ka'bah.
export const KAABA = { lat: 21.4225, lng: 39.8262 };
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
export const norm360 = (d: number) => ((d % 360) + 360) % 360;

/** Bearing great-circle (derajat dari Utara sejati) ke Ka'bah. */
export function qiblaBearing(lat: number, lng: number): number {
  const φ1 = rad(lat), φ2 = rad(KAABA.lat), Δλ = rad(KAABA.lng - lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return norm360(deg(Math.atan2(y, x)));
}

/** Jarak (km) ke Ka'bah (haversine). */
export function distanceToKaabaKm(lat: number, lng: number): number {
  const R = 6371;
  const dφ = rad(KAABA.lat - lat), dλ = rad(KAABA.lng - lng);
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(KAABA.lat)) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Selisih sudut bertanda terkecil -180..180 (positif = putar ke kanan). */
export function angleDiff(target: number, heading: number): number {
  return ((target - heading + 540) % 360) - 180;
}

/** Interpolasi sudut melingkar supaya jarum tidak "berputar balik" di 359°->0°. */
export function smoothAngle(prev: number, next: number, alpha = 0.25): number {
  return norm360(prev + angleDiff(next, prev) * alpha);
}
