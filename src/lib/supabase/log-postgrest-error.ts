/**
 * PostgREST / Supabase : l’objet `error` peut s’afficher comme `{}` dans la console
 * (propriétés non énumérables). On journalise message, code, details, hint.
 */
export function logPostgrestError(context: string, err: unknown): void {
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    const line = ['message', 'code', 'details', 'hint']
      .map((k) => (o[k] != null && o[k] !== '' ? `${k}=${String(o[k])}` : null))
      .filter(Boolean)
      .join(' | ');
    if (line) {
      const code = o.code != null ? String(o.code) : '';
      if (code === 'PGRST205' || code === '42P01') {
        console.warn(
          `${context}: table ou ressource absente (${code}). Exécutez les migrations Supabase (ex. blog_articles.sql) sur le projet lié à NEXT_PUBLIC_SUPABASE_URL.`
        );
        return;
      }
      console.error(`${context}: ${line}`);
      return;
    }
  }
  console.error(context, err);
}
