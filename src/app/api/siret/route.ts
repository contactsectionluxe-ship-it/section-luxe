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
  siret?: string;
};

type EtablissementMatch = {
  siret?: string;
  adresse?: string;
  libelle_commune?: string;
  code_postal?: string;
  [key: string]: unknown;
};

type ApiResult = {
  denomination?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  siege?: Siege;
  adresse?: string;
  matching_etablissements?: EtablissementMatch[];
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

function buildAddressFromEtablissement(etab: EtablissementMatch | undefined): string {
  if (!etab) return '';
  if (etab.adresse && typeof etab.adresse === 'string') return etab.adresse;
  const parts = [etab.code_postal, etab.libelle_commune].filter(Boolean) as string[];
  return parts.join(' ').trim();
}

function getCompanyName(r: ApiResult): string {
  return (
    r.nom_complet ||
    r.denomination ||
    r.nom_raison_sociale ||
    ''
  ).trim();
}

/** Construit la liste de suggestions : siège + établissements ; si 14 chiffres, filtre sur SIRET exact */
function buildSuggestionsFromResults(
  results: ApiResult[],
  digits: string
): Array<{ companyName: string; address: string; siret?: string }> {
  const list: Array<{ companyName: string; address: string; siret?: string }> = [];
  const exactMatch = digits.length === 14;
  for (const r of results) {
    const companyName = getCompanyName(r);
    const siegeAddress = buildAddress(r.siege, r.adresse as string);
    if (r.siege?.siret && (!exactMatch || r.siege.siret === digits)) {
      list.push({ companyName, address: siegeAddress, siret: r.siege.siret });
    }
    for (const e of r.matching_etablissements ?? []) {
      if (!e.siret || (exactMatch && e.siret !== digits)) continue;
      if (!exactMatch || e.siret === digits) {
        list.push({
          companyName,
          address: buildAddressFromEtablissement(e) || siegeAddress,
          siret: e.siret,
        });
      }
    }
    if (!r.siege?.siret && (r.matching_etablissements?.length ?? 0) === 0 && (companyName || siegeAddress)) {
      list.push({ companyName, address: siegeAddress, siret: undefined });
    }
  }
  return list;
}

export async function GET(request: NextRequest) {
  const siret = request.nextUrl.searchParams.get('siret');
  const digits = (siret || '').replace(/\D/g, '');
  const len = digits.length;
  if (len < 9 || len > 14) {
    return NextResponse.json({ error: 'Saisir entre 9 et 14 chiffres' }, { status: 400 });
  }

  try {
    const siren = digits.slice(0, 9);
    const urls =
      len === 14
        ? [
            `${API_BASE}/search?q=${digits}`,
            `${API_BASE}/search?q=siret:${digits}`,
            `${API_BASE}/search?q=${siren}`,
          ]
        : [`${API_BASE}/search?q=${siren}`];
    let data: ApiResponse | null = null;
    for (const url of urls) {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'SectionLuxe/1.0' },
        next: { revalidate: 0 },
      });
      if (res.ok) {
        data = await res.json();
        if (data?.results?.length) break;
      }
    }
    if (!data?.results?.length) {
      const res = NextResponse.json({ suggestions: [] });
      res.headers.set('Cache-Control', 'private, max-age=60');
      return res;
    }
    const suggestions = buildSuggestionsFromResults(data.results, digits);
    const res = NextResponse.json({ suggestions });
    res.headers.set('Cache-Control', 'private, max-age=60');
    return res;
  } catch (err) {
    console.error('SIRET API error:', err);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 502 }
    );
  }
}
