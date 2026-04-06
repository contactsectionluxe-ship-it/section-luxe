export type WeekdayId =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const WEEKDAYS: { id: WeekdayId; labelFr: string }[] = [
  { id: 'monday', labelFr: 'Lundi' },
  { id: 'tuesday', labelFr: 'Mardi' },
  { id: 'wednesday', labelFr: 'Mercredi' },
  { id: 'thursday', labelFr: 'Jeudi' },
  { id: 'friday', labelFr: 'Vendredi' },
  { id: 'saturday', labelFr: 'Samedi' },
  { id: 'sunday', labelFr: 'Dimanche' },
];

export type TimeSlot = { open: string; close: string };

export type DaySchedule = {
  closed: boolean;
  /** Jusqu’à 2 plages (ex. pause déjeuner) */
  slots: TimeSlot[];
};

export type WeeklyOpeningHours = Record<WeekdayId, DaySchedule>;

const DAY_IDS = WEEKDAYS.map((d) => d.id);

export function createDefaultWeeklyOpeningHours(): WeeklyOpeningHours {
  return {
    monday: { closed: true, slots: [] },
    tuesday: { closed: true, slots: [] },
    wednesday: { closed: true, slots: [] },
    thursday: { closed: true, slots: [] },
    friday: { closed: true, slots: [] },
    saturday: { closed: true, slots: [] },
    sunday: { closed: true, slots: [] },
  };
}

function normalizeSlot(s: unknown): TimeSlot | null {
  if (!s || typeof s !== 'object') return null;
  const o = s as Record<string, unknown>;
  const open = typeof o.open === 'string' ? o.open.trim() : '';
  const close = typeof o.close === 'string' ? o.close.trim() : '';
  if (!open || !close) return null;
  return { open, close };
}

/** Lit la colonne JSONB `opening_hours` (ou null). */
export function parseOpeningHoursFromDb(raw: unknown): WeeklyOpeningHours {
  const base = createDefaultWeeklyOpeningHours();
  if (raw == null || typeof raw !== 'object') return base;

  const o = raw as Record<string, unknown>;
  for (const day of DAY_IDS) {
    const v = o[day];
    if (!v || typeof v !== 'object') continue;
    const vo = v as Record<string, unknown>;
    if (vo.closed === true) {
      base[day] = { closed: true, slots: [] };
      continue;
    }
    if (Array.isArray(vo.slots)) {
      const slots = vo.slots.map(normalizeSlot).filter(Boolean) as TimeSlot[];
      const capped = slots.slice(0, 2);
      if (capped.length > 0) {
        base[day] = { closed: false, slots: capped };
      } else {
        base[day] = { closed: true, slots: [] };
      }
    }
  }
  return base;
}

/** Objet prêt pour Supabase JSONB (pas de champs vides). */
export function weeklyOpeningHoursToDbJson(hours: WeeklyOpeningHours): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const day of DAY_IDS) {
    const d = hours[day];
    if (d.closed) {
      out[day] = { closed: true };
      continue;
    }
    const valid = d.slots
      .map((s) => {
        const open = (s.open || '').trim();
        const close = (s.close || '').trim();
        if (!open || !close) return null;
        return { open, close };
      })
      .filter(Boolean) as TimeSlot[];
    if (valid.length === 0) {
      out[day] = { closed: true };
    } else {
      out[day] = { closed: false, slots: valid.slice(0, 2) };
    }
  }
  return out;
}

/** Saisie dans une seule case « HH:MM » : chiffres + « : » auto ; si « : » est tapé, heures / minutes séparées. */
export function formatOpeningTimeTyping(raw: string): string {
  if (raw.includes(':')) {
    const parts = raw.split(':');
    const lh = (parts[0] ?? '').replace(/\D/g, '').slice(0, 2);
    const lm = (parts[1] ?? '').replace(/\D/g, '').slice(0, 2);
    if (lm.length === 0) return lh.length > 0 ? `${lh}:` : lh;
    return `${lh}:${lm}`;
  }
  const d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length === 0) return '';
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** Au blur : normalise en « HH:MM » (24 h) ou chaîne vide. */
export function finalizeOpeningTime(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  const colon = s.indexOf(':');
  if (colon >= 0) {
    const hs = s.slice(0, colon).replace(/\D/g, '') || '0';
    const ms = s.slice(colon + 1).replace(/\D/g, '') || '0';
    let h = Math.min(23, Math.max(0, parseInt(hs, 10)));
    let min = Math.min(59, Math.max(0, parseInt(ms.slice(0, 2), 10)));
    if (Number.isNaN(h)) h = 0;
    if (Number.isNaN(min)) min = 0;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  const d = s.replace(/\D/g, '').slice(0, 4);
  if (d.length === 0) return '';
  if (d.length === 1) {
    const h = Math.min(23, Math.max(0, parseInt(d, 10)));
    if (Number.isNaN(h)) return '';
    return `${String(h).padStart(2, '0')}:00`;
  }
  if (d.length === 2) {
    const h = Math.min(23, Math.max(0, parseInt(d, 10)));
    if (Number.isNaN(h)) return '';
    return `${String(h).padStart(2, '0')}:00`;
  }
  if (d.length === 3) {
    const h = Math.min(23, Math.max(0, parseInt(d[0], 10)));
    const min = Math.min(59, Math.max(0, parseInt(d.slice(1), 10)));
    if (Number.isNaN(h) || Number.isNaN(min)) return '';
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  const h = Math.min(23, Math.max(0, parseInt(d.slice(0, 2), 10)));
  const min = Math.min(59, Math.max(0, parseInt(d.slice(2), 10)));
  if (Number.isNaN(h) || Number.isNaN(min)) return '';
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** `Date#getDay()` : 0 = dimanche … 6 = samedi → clé hebdomadaire. */
export function weekdayIdFromDate(d: Date): WeekdayId {
  const order: WeekdayId[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return order[d.getDay()];
}

/** Libellé pour affichage public (popup visite, etc.). */
export function formatDayScheduleFr(schedule: DaySchedule): string {
  if (schedule.closed || schedule.slots.length === 0) return 'Fermé';
  return schedule.slots.map(({ open, close }) => `${open} - ${close}`).join(' / ');
}
