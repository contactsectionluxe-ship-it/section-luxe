'use client';

import { useEffect, useMemo, useState } from 'react';
import { REGIONS_FR, DEPARTEMENTS_FR } from '@/lib/constants';
import { searchCommuneArrondissement } from '@/lib/communes-arrondissements';

/** Rayons (km) pour le filtre « autour de ma position » — aligné catalogue. */
export const RADIUS_KM_OPTIONS: number[] = [5, 10, 20, 50, 100, 200];

export type CatalogueLocationSuggestion = {
  type: 'region' | 'postal' | 'city';
  label: string;
  prefixes: string[];
};

function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[-'\s]+/g, '');
}

const allDeptCodes = DEPARTEMENTS_FR.map((d) => d.code);

/**
 * Suggestions localisation catalogue : France + régions + départements + communes (API),
 * même logique que la page catalogue.
 */
export function useCatalogueLocationSuggestions(locationQuery: string): {
  suggestions: CatalogueLocationSuggestion[];
  cityLoading: boolean;
} {
  const [locationCitySuggestions, setLocationCitySuggestions] = useState<
    Array<{ nom: string; codesPostaux: string[] }>
  >([]);
  const [locationCityLoading, setLocationCityLoading] = useState(false);

  const locationSuggestionsStatic = useMemo(() => {
    const q = normalizeForSearch(locationQuery.trim());
    if (q.length < 1) return [];
    const out: CatalogueLocationSuggestion[] = [];
    if (normalizeForSearch('France').includes(q)) {
      out.push({ type: 'region', label: 'France', prefixes: allDeptCodes });
    }
    for (const r of REGIONS_FR) {
      if (normalizeForSearch(r.name).includes(q)) out.push({ type: 'region', label: r.name, prefixes: r.depts });
    }
    for (const d of DEPARTEMENTS_FR) {
      const codeNorm = normalizeForSearch(d.code);
      const nameNorm = normalizeForSearch(d.name);
      if (codeNorm.startsWith(q) || nameNorm.includes(q)) {
        const prefixes = d.code === '2A' || d.code === '2B' ? ['2A', '2B'] : [d.code];
        out.push({ type: 'postal', label: `${d.code} - ${d.name}`, prefixes });
      }
    }
    return out;
  }, [locationQuery]);

  useEffect(() => {
    const q = locationQuery.trim();
    if (q.length < 2) {
      setLocationCitySuggestions([]);
      return;
    }
    const qNorm = q.replace(/\s/g, '');
    const isPostalCode = /^\d{2,5}$/.test(qNorm) || qNorm === '2A' || qNorm === '2B';
    const isDeptCode = qNorm.length === 2 && (/^\d{2}$/.test(qNorm) || qNorm === '2A' || qNorm === '2B');
    const t = setTimeout(async () => {
      setLocationCityLoading(true);
      try {
        const limit = 200;
        let byPostal: Array<{ nom: string; codesPostaux: string[] }> = [];
        if (isPostalCode) {
          if (isDeptCode) {
            const r = await fetch(
              `https://geo.api.gouv.fr/departements/${encodeURIComponent(qNorm)}/communes?fields=nom,codesPostaux`
            );
            if (r.ok) {
              const data = await r.json();
              byPostal = Array.isArray(data) ? data : [];
            }
          } else {
            const r = await fetch(
              `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(qNorm)}&fields=nom,codesPostaux&limit=${limit}`
            );
            if (r.ok) {
              const data = await r.json();
              byPostal = Array.isArray(data) ? data : [];
            }
            if (byPostal.length === 0 && qNorm.length >= 3 && qNorm.length <= 5) {
              const depts = qNorm.startsWith('20') ? ['2A', '2B'] : [qNorm.slice(0, 2)];
              for (const dept of depts) {
                const rDept = await fetch(
                  `https://geo.api.gouv.fr/departements/${encodeURIComponent(dept)}/communes?fields=nom,codesPostaux`
                );
                if (rDept.ok) {
                  const dataDept = await rDept.json();
                  const communes = Array.isArray(dataDept) ? dataDept : [];
                  const found = communes.filter((c: { codesPostaux?: string[] }) =>
                    (c.codesPostaux ?? []).some((cp: string) => cp.replace(/\s/g, '') === qNorm)
                  );
                  byPostal = byPostal.concat(found);
                }
                if (byPostal.length > 0) break;
              }
            }
          }
        }
        const byNom = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,codesPostaux,codePostal&limit=${limit}&boost=population`
        )
          .then((r) => r.json() as Promise<Array<{ nom: string; codesPostaux?: string[]; codePostal?: string }>>)
          .catch(() => []);
        const listNom = Array.isArray(byNom) ? byNom : [];
        const listPostal = Array.isArray(byPostal) ? byPostal : [];
        const normalizeCommune = (c: { nom: string; codesPostaux?: string[]; codePostal?: string }) => {
          const raw = c.codesPostaux ?? [];
          const single = c.codePostal;
          const codes = (raw.length ? raw : single != null ? [String(single)] : [])
            .map((x) => String(x).replace(/\s/g, '').trim())
            .filter(Boolean);
          return { nom: c.nom, codesPostaux: codes };
        };
        const seen = new Set<string>();
        const merged: Array<{ nom: string; codesPostaux: string[] }> = [];
        for (const c of listPostal) {
          const { nom, codesPostaux } = normalizeCommune(c as { nom: string; codesPostaux?: string[]; codePostal?: string });
          if (codesPostaux.length === 0) continue;
          const key = `${nom}|${codesPostaux.join(',')}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push({ nom, codesPostaux });
          }
        }
        for (const c of listNom) {
          const { nom, codesPostaux } = normalizeCommune(c);
          if (codesPostaux.length === 0) continue;
          const key = `${nom}|${codesPostaux.join(',')}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push({ nom, codesPostaux });
          }
        }
        setLocationCitySuggestions(merged);
      } catch {
        setLocationCitySuggestions([]);
      } finally {
        setLocationCityLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [locationQuery]);

  const suggestions = useMemo(() => {
    const fromLocal: CatalogueLocationSuggestion[] = [];
    const localCommunes = searchCommuneArrondissement(locationQuery, normalizeForSearch);
    for (const c of localCommunes) {
      for (const code of c.codesPostaux) {
        fromLocal.push({
          type: 'city',
          label: `${code} - ${c.nom}`,
          prefixes: code === '75016' || code === '75116' ? ['75016', '75116'] : [code],
        });
      }
    }
    const fromCities: CatalogueLocationSuggestion[] = [];
    for (const c of locationCitySuggestions) {
      const raw = (c as { codesPostaux?: string[]; codePostal?: string }).codesPostaux ?? [];
      const single = (c as { codePostal?: string }).codePostal;
      const codes = (raw.length ? raw : single != null ? [String(single)] : [])
        .map((x) => String(x).replace(/\s/g, '').trim())
        .filter(Boolean);
      if (codes.length === 0) continue;
      if (codes.length === 1) {
        fromCities.push({
          type: 'city',
          label: `${codes[0]} - ${c.nom}`,
          prefixes:
            codes[0] === '75016' || codes[0] === '75116' ? ['75016', '75116'] : [codes[0]],
        });
      } else {
        for (const code of codes) {
          fromCities.push({
            type: 'city',
            label: `${code} - ${c.nom}`,
            prefixes: code === '75016' || code === '75116' ? ['75016', '75116'] : [code],
          });
        }
      }
    }
    const fromCitiesAndLocal = [...fromLocal, ...fromCities];
    const cityLabelSet = new Set(fromCitiesAndLocal.map((s) => s.label));
    const seen = new Set<string>();
    const qNorm = locationQuery.trim().replace(/\s/g, '');
    const isPostalQuery = /^\d{2,5}$/.test(qNorm) || qNorm === '2A' || qNorm === '2B';
    const isPrecisePostal = isPostalQuery && qNorm.length >= 3;
    const exactMatch = isPostalQuery ? fromCitiesAndLocal.filter((s) => s.prefixes.some((p) => p === qNorm)) : [];
    const postalFirst = isPostalQuery
      ? fromCitiesAndLocal.filter((s) => s.prefixes.some((p) => p === qNorm || qNorm.startsWith(p)))
      : [];
    const out: CatalogueLocationSuggestion[] = [];
    if (exactMatch.length > 0) {
      for (const s of exactMatch) {
        if (!seen.has(s.label)) {
          seen.add(s.label);
          out.push(s);
        }
      }
    }
    if (postalFirst.length > 0 && exactMatch.length === 0) {
      for (const s of postalFirst) {
        if (!seen.has(s.label)) {
          seen.add(s.label);
          out.push(s);
        }
      }
    }
    for (const s of locationSuggestionsStatic) {
      if (isPrecisePostal && s.type === 'postal') continue;
      if (s.type === 'postal') {
        const matchDept = s.label.match(/^(\d{2}|2A|2B)\s*-\s*(.+)$/);
        if (matchDept) {
          const code = matchDept[1];
          const name = matchDept[2].trim();
          if (cityLabelSet.has(`${code} - ${name}`)) continue;
        }
      }
      if (!seen.has(s.label)) {
        seen.add(s.label);
        out.push(s);
      }
    }
    for (const s of fromLocal) {
      if (!seen.has(s.label)) {
        seen.add(s.label);
        out.push(s);
      }
    }
    for (const s of fromCities) {
      if (!seen.has(s.label)) {
        seen.add(s.label);
        out.push(s);
      }
    }
    return out;
  }, [locationSuggestionsStatic, locationCitySuggestions, locationQuery]);

  return { suggestions, cityLoading: locationCityLoading };
}
