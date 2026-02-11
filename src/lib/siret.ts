/**
 * Récupère les informations d'une entreprise à partir de son SIRET
 * via la route API /api/siret (proxy vers API Recherche d'Entreprises).
 */

export type CompanyInfo = {
  companyName: string;
  address: string;
};

/**
 * Appel à la route API /api/siret pour récupérer nom et adresse.
 * Retourne null si SIRET invalide, non trouvé ou erreur réseau.
 */
export async function fetchCompanyBySiret(siret: string): Promise<CompanyInfo | null> {
  const digits = siret.replace(/\D/g, '');
  if (digits.length !== 14) return null;

  try {
    const res = await fetch(`/api/siret?siret=${encodeURIComponent(digits)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const companyName = data.companyName ?? '';
    const address = data.address ?? '';
    if (!companyName && !address) return null;
    return { companyName, address };
  } catch {
    return null;
  }
}
