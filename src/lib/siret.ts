/**
 * Récupère les suggestions d'entreprises à partir d'un SIRET ou SIREN (9 à 14 chiffres)
 * via la route API /api/siret (proxy vers API Recherche d'Entreprises).
 */

export type SiretSuggestion = {
  companyName: string;
  address: string;
  siret?: string;
};

/** Ancien type conservé pour compatibilité (une suggestion = CompanyInfo) */
export type CompanyInfo = SiretSuggestion;

/**
 * Appel à l'API /api/siret pour récupérer la liste de suggestions.
 * À appeler dès 9 chiffres (SIREN). Retourne un tableau vide si erreur ou aucun résultat.
 */
export async function fetchSiretSuggestions(digits: string): Promise<SiretSuggestion[]> {
  const cleaned = digits.replace(/\D/g, '');
  if (cleaned.length < 9 || cleaned.length > 14) return [];

  try {
    const res = await fetch(`/api/siret?siret=${encodeURIComponent(cleaned)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.suggestions) ? data.suggestions : [];
  } catch {
    return [];
  }
}

/**
 * Récupère une seule entreprise pour un SIRET complet (14 chiffres).
 * Utilise la première suggestion correspondant au SIRET exact.
 */
export async function fetchCompanyBySiret(siret: string): Promise<CompanyInfo | null> {
  const suggestions = await fetchSiretSuggestions(siret);
  return suggestions.length > 0 ? suggestions[0] : null;
}
