import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://recherche-entreprises.api.gouv.fr';

type Siege = {
  adresse?: string;
  geo_adresse?: string;
  numero_voie?: string;
  type_voie?: string;
  libelle_voie?: string;
  code_postal?: string;
  libelle_commune?: string;
};

type ApiResult = {
  denomination?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  siege?: Siege;
  adresse?: string;
  [key: string]: unknown;
};

type ApiResponse = {
  results?: ApiResult[];
};

function buildAddress(siege: Siege | undefined, fallback?: string): string {
  if (!siege) return fallback || '';
  if (siege.geo_adresse && typeof siege.geo_adresse === 'string') return siege.geo_adresse;
  if (siege.adresse && typeof siege.adresse === 'string') return siege.adresse;
  const parts = [
    siege.numero_voie,
    siege.type_voie,
    siege.libelle_voie,
    siege.code_postal,
    siege.libelle_commune,
  ].filter(Boolean) as string[];
  return parts.join(' ').trim() || fallback || '';
}

function getCompanyName(r: ApiResult): string {
  return (
    r.nom_complet ||
    r.denomination ||
    r.nom_raison_sociale ||
    ''
  ).trim();
}

export async function GET(request: NextRequest) {
  const siret = request.nextUrl.searchParams.get('siret');
  const digits = (siret || '').replace(/\D/g, '');
  if (digits.length !== 14) {
    return NextResponse.json({ error: 'SIRET invalide' }, { status: 400 });
  }

  try {
    // Essayer d'abord avec préfixe siret:, puis avec le numéro seul (SIREN = 9 premiers chiffres)
    const urls = [
      `${API_BASE}/search?q=siret:${digits}`,
      `${API_BASE}/search?q=${digits}`,
    ];
    let data: ApiResponse | null = null;
    for (const url of urls) {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 0 },
      });
      if (res.ok) {
        data = await res.json();
        if (data?.results?.length) break;
      }
    }
    if (!data?.results?.length) {
      return NextResponse.json({ companyName: null, address: null });
    }
    const first = data.results[0];
    const companyName = getCompanyName(first);
    const address = buildAddress(first.siege, first.adresse as string);
    return NextResponse.json({
      companyName: companyName || null,
      address: address || null,
    });
  } catch (err) {
    console.error('SIRET API error:', err);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 502 }
    );
  }
}
