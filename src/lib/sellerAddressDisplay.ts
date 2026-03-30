/**
 * Affichage public de l’adresse vendeur : même ordre que le catalogue vendeur et la fiche annonce
 * (rue, code postal, ville — parties vides ignorées).
 */
function normalizeAddressPart(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v).trim();
  if (typeof v !== 'string') return '';
  return v.replace(/\u00a0/g, ' ').trim();
}

export function formatSellerPublicAddressLine(parts: {
  address?: unknown;
  city?: unknown;
  postcode?: unknown;
}): string {
  return [
    normalizeAddressPart(parts.address),
    normalizeAddressPart(parts.postcode),
    normalizeAddressPart(parts.city),
  ]
    .filter(Boolean)
    .join(', ');
}

function compactAlnum(s: string): string {
  return s.replace(/\s/g, '').toLowerCase();
}

function normLowerSpaces(s: string): string {
  return s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Liste « Proposer une pièce » : une seule ligne, sans répéter CP / ville s’ils sont déjà dans le champ rue.
 * Ex. « 60 Rue François Ier 75008 Paris » au lieu de « …, 75008, Paris ».
 */
export function formatSellerAddressLineDeduped(parts: {
  address?: unknown;
  city?: unknown;
  postcode?: unknown;
}): string {
  const a = normalizeAddressPart(parts.address);
  const cp = normalizeAddressPart(parts.postcode);
  const c = normalizeAddressPart(parts.city);
  if (!a) {
    return [cp, c].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }
  const aOne = a.replace(/\s+/g, ' ').trim();
  const aCompact = compactAlnum(aOne);
  const aLower = normLowerSpaces(aOne);
  const cLower = c ? normLowerSpaces(c) : '';
  const needCp = Boolean(cp && !aCompact.includes(compactAlnum(cp)));
  const needCity = Boolean(c && !aLower.endsWith(cLower));
  if (!needCp && !needCity) {
    return aOne;
  }
  const tail: string[] = [];
  if (needCp) tail.push(cp);
  if (needCity) tail.push(c);
  if (tail.length === 0) return aOne;
  return `${aOne} ${tail.join(' ')}`.replace(/\s+/g, ' ').trim();
}

/** Extraction tolérante (schéma / casse) depuis une ligne Supabase `sellers`. */
export function sellerRowToPublicAddressLine(row: Record<string, unknown>): string {
  const pick = (...keys: string[]): unknown => {
    for (const k of keys) {
      const v = row[k];
      const s = normalizeAddressPart(v);
      if (s) return s;
    }
    return undefined;
  };
  return formatSellerPublicAddressLine({
    address: pick('address', 'Address', 'street', 'street_address'),
    postcode: pick(
      'postcode',
      'post_code',
      'postal_code',
      'postalCode',
      'postCode',
      'zip',
      'zipcode',
      'code_postal',
    ),
    city: pick('city', 'City', 'ville'),
  });
}

/** Comme `sellerRowToPublicAddressLine` mais avec déduplication rue / CP / ville (formulaire proposition). */
export function sellerRowToPropositionAddressLine(row: Record<string, unknown>): string {
  const pick = (...keys: string[]): unknown => {
    for (const k of keys) {
      const v = row[k];
      const s = normalizeAddressPart(v);
      if (s) return s;
    }
    return undefined;
  };
  return formatSellerAddressLineDeduped({
    address: pick('address', 'Address', 'street', 'street_address'),
    postcode: pick(
      'postcode',
      'post_code',
      'postal_code',
      'postalCode',
      'postCode',
      'zip',
      'zipcode',
      'code_postal',
    ),
    city: pick('city', 'City', 'ville'),
  });
}
