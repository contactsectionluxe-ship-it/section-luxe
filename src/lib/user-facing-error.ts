const MAX_DEPTH = 6;

/**
 * Convertit une valeur d’erreur (API, catch, etc.) en chaîne lisible.
 * Évite l’affichage « [object Object] » dans l’UI.
 */
export function toUserFacingErrorString(value: unknown, fallback = 'Une erreur est survenue'): string {
  return inner(value, fallback, 0);
}

function inner(value: unknown, fallback: string, depth: number): string {
  if (depth > MAX_DEPTH) return fallback;
  if (value == null || value === '') return fallback;
  if (Array.isArray(value)) {
    if (value.length === 0) return fallback;
    return inner(value[0], fallback, depth + 1);
  }
  if (typeof value === 'string') {
    const t = value.trim();
    return t || fallback;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Error) {
    const m = value.message?.trim();
    return m || fallback;
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const key of ['message', 'msg', 'description', 'detail', 'error', 'reason', 'hint']) {
      if (!(key in o)) continue;
      const s = inner(o[key], '', depth + 1);
      if (s) return s;
    }
  }
  return fallback;
}

/** Lit `error` dans un corps JSON API `{ error?: … }`. */
export function pickApiErrorBodyMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const raw = (body as { error?: unknown }).error;
  if (raw === undefined || raw === null) return fallback;
  return toUserFacingErrorString(raw, fallback);
}
