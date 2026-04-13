import type { CSSProperties } from 'react';

/** Même écart qu’entre le bas d’un champ et le libellé du bloc suivant (textarea → Horaires), −0,7 mm pour alignement visuel. */
export const profilVendeurAfterFieldGap: NonNullable<CSSProperties['marginTop']> =
  'calc(18px - 0.7mm)';

/** Libellés du formulaire profil vendeur (Téléphone, Description, Horaires, etc.) */
export const profilVendeurLabelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 8,
  color: '#333',
};
