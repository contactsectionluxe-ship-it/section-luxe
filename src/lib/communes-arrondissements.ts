/**
 * Base locale des communes et arrondissements (France).
 * Utilisée pour les suggestions de localisation du catalogue, en complément de l’API geo.api.gouv.fr.
 * Format : { nom, codesPostaux } — chaque code à 5 chiffres donne une suggestion "CODE - Nom".
 */

/** Arrondissements de Paris (75001–75020). */
const PARIS_CODES = Array.from({ length: 20 }, (_, i) => String(75001 + i).padStart(5, '0'));

/** Arrondissements de Lyon (69001–69009). */
const LYON_CODES = Array.from({ length: 9 }, (_, i) => String(69001 + i).padStart(5, '0'));

/** Arrondissements de Marseille (13001–13016). */
const MARSEILLE_CODES = Array.from({ length: 16 }, (_, i) => String(13001 + i).padStart(5, '0'));

/** Communes avec un seul code postal (villes principales et moyennes). */
const COMMUNES_SIMPLES: { nom: string; code: string }[] = [
  { nom: 'Nantes', code: '44000' },
  { nom: 'Toulouse', code: '31000' },
  { nom: 'Montpellier', code: '34000' },
  { nom: 'Strasbourg', code: '67000' },
  { nom: 'Bordeaux', code: '33000' },
  { nom: 'Lille', code: '59000' },
  { nom: 'Rennes', code: '35000' },
  { nom: 'Reims', code: '51100' },
  { nom: 'Saint-Étienne', code: '42000' },
  { nom: 'Toulon', code: '83000' },
  { nom: 'Le Havre', code: '76600' },
  { nom: 'Grenoble', code: '38000' },
  { nom: 'Dijon', code: '21000' },
  { nom: 'Angers', code: '49000' },
  { nom: 'Nîmes', code: '30000' },
  { nom: 'Villeurbanne', code: '69100' },
  { nom: 'Tassin-la-Demi-Lune', code: '69160' },
  { nom: 'Caluire-et-Cuire', code: '69300' },
  { nom: 'Bron', code: '69500' },
  { nom: 'Vaulx-en-Velin', code: '69120' },
  { nom: 'Rillieux-la-Pape', code: '69140' },
  { nom: 'Oullins', code: '69600' },
  { nom: 'Saint-Priest', code: '69800' },
  { nom: 'Saint-Genis-Laval', code: '69230' },
  { nom: 'Décines-Charpieu', code: '69150' },
  { nom: 'Meyzieu', code: '69330' },
  { nom: 'Villefranche-sur-Saône', code: '69400' },
  { nom: 'Saint-Denis', code: '93200' },
  { nom: 'Le Mans', code: '72000' },
  { nom: 'Aix-en-Provence', code: '13100' },
  { nom: 'Clermont-Ferrand', code: '63000' },
  { nom: 'Brest', code: '29200' },
  { nom: 'Tours', code: '37000' },
  { nom: 'Amiens', code: '80000' },
  { nom: 'Limoges', code: '87000' },
  { nom: 'Annecy', code: '74000' },
  { nom: 'Perpignan', code: '66000' },
  { nom: 'Boulogne-Billancourt', code: '92100' },
  { nom: 'Metz', code: '57000' },
  { nom: 'Besançon', code: '25000' },
  { nom: 'Orléans', code: '45000' },
  { nom: 'Rouen', code: '76000' },
  { nom: 'Mulhouse', code: '68100' },
  { nom: 'Caen', code: '14000' },
  { nom: 'Nancy', code: '54000' },
  { nom: 'Argenteuil', code: '95100' },
  { nom: 'Montreuil', code: '93100' },
  { nom: 'Saint-Paul', code: '97434' },
  { nom: 'Saint-Denis', code: '97400' },
  { nom: 'Nice', code: '06000' },
  { nom: 'Cannes', code: '06400' },
  { nom: 'Antibes', code: '06600' },
  { nom: 'Courbevoie', code: '92400' },
  { nom: 'Versailles', code: '78000' },
  { nom: 'Colombes', code: '92700' },
  { nom: 'Fort-de-France', code: '97200' },
  { nom: 'Saint-Pierre', code: '97410' },
  { nom: 'Levallois-Perret', code: '92300' },
  { nom: 'Neuilly-sur-Seine', code: '92200' },
  { nom: 'Créteil', code: '94000' },
  { nom: 'Vitry-sur-Seine', code: '94400' },
  { nom: 'Cergy', code: '95000' },
  { nom: 'Évry-Courcouronnes', code: '91000' },
  { nom: 'Pau', code: '64000' },
  { nom: 'La Rochelle', code: '17000' },
  { nom: 'Poitiers', code: '86000' },
  { nom: 'Champigny-sur-Marne', code: '94500' },
  { nom: 'Saint-Maur-des-Fossés', code: '94100' },
  { nom: 'Ivry-sur-Seine', code: '94200' },
  { nom: 'Beauvais', code: '60000' },
  { nom: 'Hyères', code: '83400' },
  { nom: 'Avignon', code: '84000' },
  { nom: 'Saint-Nazaire', code: '44600' },
  { nom: 'Poissy', code: '78300' },
  { nom: 'Aulnay-sous-Bois', code: '93600' },
  { nom: 'Drancy', code: '93700' },
  { nom: 'Mérignac', code: '33700' },
  { nom: 'Troyes', code: '10000' },
  { nom: 'Rueil-Malmaison', code: '92500' },
  { nom: 'Saint-Quentin', code: '02100' },
  { nom: 'Noisy-le-Grand', code: '93160' },
  { nom: 'Villeneuve-d\'Ascq', code: '59491' },
  { nom: 'Antony', code: '92160' },
  { nom: 'Sarcelles', code: '95200' },
  { nom: 'Lorient', code: '56100' },
  { nom: 'Niort', code: '79000' },
  { nom: 'Chambéry', code: '73000' },
  { nom: 'Pessac', code: '33600' },
  { nom: 'Vénissieux', code: '69200' },
  { nom: 'Clichy', code: '92110' },
  { nom: 'Cergy-Pontoise', code: '95000' },
  { nom: 'Saint-André', code: '97440' },
  { nom: 'Le Blanc-Mesnil', code: '93150' },
  { nom: 'Pantin', code: '93500' },
  { nom: 'Valence', code: '26000' },
  { nom: 'Bourges', code: '18000' },
  { nom: 'Gennevilliers', code: '92230' },
  { nom: 'Ajaccio', code: '20000' },
  { nom: 'Bastia', code: '20200' },
  { nom: 'Belfort', code: '90000' },
  { nom: 'Épinay-sur-Seine', code: '93800' },
  { nom: 'Bondy', code: '93140' },
  { nom: 'Clamart', code: '92140' },
  { nom: 'Saint-Ouen', code: '93400' },
  { nom: 'Villejuif', code: '94800' },
  { nom: 'Sartrouville', code: '78500' },
  { nom: 'Bobigny', code: '93000' },
  { nom: 'Sevran', code: '93270' },
  { nom: 'Saint-Louis', code: '97450' },
  { nom: 'Montrouge', code: '92120' },
  { nom: 'Les Abymes', code: '97139' },
  { nom: 'Pointe-à-Pitre', code: '97110' },
  { nom: 'Cayenne', code: '97300' },
  { nom: 'Saint-Martin', code: '97150' },
];

/** Base des communes et arrondissements : Paris, Lyon, Marseille (tous codes) + communes simples. */
export const COMMUNES_ET_ARRONDISSEMENTS: { nom: string; codesPostaux: string[] }[] = [
  { nom: 'Paris', codesPostaux: PARIS_CODES },
  { nom: 'Lyon', codesPostaux: LYON_CODES },
  { nom: 'Marseille', codesPostaux: MARSEILLE_CODES },
  ...COMMUNES_SIMPLES.map((c) => ({ nom: c.nom, codesPostaux: [c.code] })),
];

/** Retourne les entrées dont le nom ou un code postal matche la requête (normalisée, sans accents). */
export function searchCommuneArrondissement(
  query: string,
  normalize: (s: string) => string
): { nom: string; codesPostaux: string[] }[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const result: { nom: string; codesPostaux: string[] }[] = [];
  for (const c of COMMUNES_ET_ARRONDISSEMENTS) {
    const nomNorm = normalize(c.nom);
    const matchNom = nomNorm.includes(q) || q.includes(nomNorm);
    const matchCode = c.codesPostaux.some((cp) => {
      const cpNorm = normalize(cp);
      return cpNorm.startsWith(q) || q.startsWith(cpNorm) || cpNorm === q;
    });
    if (matchNom || matchCode) result.push(c);
  }
  return result;
}
