/** Distance en km entre deux points (formule de Haversine). */
export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Récupère les coordonnées du centre d'une commune par code postal (API geo.api.gouv.fr, puis fallback api-adresse). */
export async function fetchCoordsForPostcode(
  codePostal: string
): Promise<{ lat: number; lon: number } | null> {
  let q = codePostal.replace(/\s/g, '').trim().slice(0, 5);
  if (!q) return null;
  if (q === '2A' || q === '2B') q = '20';
  try {
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(q)}&limit=1`
    );
    if (res.ok) {
      const data = await res.json();
      const first = Array.isArray(data) ? data[0] : null;
      if (first && typeof first === 'object') {
        const o = first as {
          centre?: { coordinates?: number[] };
          geometry?: { type?: string; coordinates?: number[] };
        };
        const centre =
          o.centre?.coordinates ??
          (o.geometry?.type === 'Point' ? o.geometry?.coordinates : null);
        if (centre && Array.isArray(centre) && centre.length >= 2) {
          const [lon, lat] = centre;
          if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
        }
      }
    }
  } catch {
    // ignore
  }
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const feat = data?.features?.[0];
    const coords = feat?.geometry?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      const [lon, lat] = coords;
      if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
    }
  } catch {
    // ignore
  }
  return null;
}
