/** Même forme que les entrées « Lieu » du catalogue (filtres). */
export type SaleProposalLocationEntry = {
  label: string;
  prefixes: string[];
};

export function unionPrefixes(entries: SaleProposalLocationEntry[]): string[] {
  const set = new Set<string>();
  for (const e of entries) {
    for (const p of e.prefixes) {
      const t = String(p).trim().toUpperCase();
      if (t) set.add(t);
    }
  }
  return [...set];
}

/** Code postal vendeur : correspond à au moins un préfixe (département, ville CP, etc.). */
export function sellerPostcodeMatchesPrefixes(postcode: string | null | undefined, prefixes: string[]): boolean {
  if (!postcode || prefixes.length === 0) return false;
  const pc = String(postcode).replace(/\s/g, '').toUpperCase();
  if (!pc) return false;
  return prefixes.some((p) => {
    const pref = String(p).trim().toUpperCase();
    return pref && pc.startsWith(pref);
  });
}
