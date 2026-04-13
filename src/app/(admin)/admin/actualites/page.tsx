'use client';

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  type ChangeEvent,
  type ClipboardEvent,
  type CSSProperties,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ImagePlus, Newspaper, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/constants';
import { formatDateShort, formatRelativeTime } from '@/lib/utils';
import { pickApiErrorBodyMessage, toUserFacingErrorString } from '@/lib/user-facing-error';
import type { BlogArticleAdminRow } from '@/app/api/admin/blog-articles/route';
import { normalizeBlogBodyFormat, type BlogBodyFormat } from '@/lib/blog-body-format';
import { BlogArticleBody } from '@/app/(public)/actualites/BlogArticleBody';
import { validateImageFile } from '@/lib/file-validation';
import { isTrustedBlogImageUrl } from '@/lib/blog-body';

function todayDateInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Jour calendaire local pour un champ `type="date"` (YYYY-MM-DD). */
function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Minuit local du jour choisi → ISO pour la base. */
function parseDateInputAtLocalMidnight(dateStr: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  const dt = new Date(y, mo - 1, day, 0, 0, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== day) return null;
  return dt;
}

export default function AdminActualitesPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const canAccessAdmin = isAdmin && isAdminEmail(user?.email);

  const [articles, setArticles] = useState<BlogArticleAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formBodyFormat, setFormBodyFormat] = useState<BlogBodyFormat>('text');
  /** Une seule vue à la fois : éditer ou prévisualiser (même rendu que le site selon Texte/HTML). */
  const [bodyEditorPane, setBodyEditorPane] = useState<'edit' | 'preview'>('edit');
  const [formPublishedLocal, setFormPublishedLocal] = useState(todayDateInputValue);
  const [formCoverImageUrl, setFormCoverImageUrl] = useState('');

  const resetForm = useCallback(() => {
    setEditingId(null);
    setFormTitle('');
    setFormSlug('');
    setFormExcerpt('');
    setFormBody('');
    setFormBodyFormat('text');
    setBodyEditorPane('edit');
    setFormPublishedLocal(todayDateInputValue());
    setFormCoverImageUrl('');
  }, []);

  const loadArticles = useCallback(async () => {
    const { getSession } = await import('@/lib/supabase/auth');
    const session = await getSession();
    if (!session?.access_token) {
      setError('Session expirée');
      setArticles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/blog-articles', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(pickApiErrorBodyMessage(data, 'Erreur chargement'));
        setArticles([]);
      } else {
        setArticles((data as { articles: BlogArticleAdminRow[] }).articles || []);
      }
    } catch {
      setError('Erreur réseau');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !canAccessAdmin) {
      router.push('/');
    }
  }, [authLoading, canAccessAdmin, router]);

  useEffect(() => {
    if (canAccessAdmin) void loadArticles();
  }, [canAccessAdmin, loadArticles]);

  const openNew = () => {
    resetForm();
    setEditingId('new');
  };

  const openEdit = (a: BlogArticleAdminRow) => {
    setEditingId(a.id);
    setFormTitle(a.title);
    setFormSlug(a.slug);
    setFormExcerpt(a.excerpt || '');
    setFormBody(a.body);
    setFormBodyFormat(normalizeBlogBodyFormat(a.body_format));
    setBodyEditorPane('edit');
    setFormPublishedLocal(toDateInputValue(a.published_at));
    setFormCoverImageUrl(a.cover_image_url || '');
  };

  const snippetForImageUrl = useCallback((url: string, format: BlogBodyFormat) => {
    return format === 'html'
      ? `\n\n<img src="${url.replace(/"/g, '&quot;')}" alt="" loading="lazy" />\n\n`
      : `\n\n{{IMG:${url}}}\n\n`;
  }, []);

  /** Upload une image (JPEG/PNG) et insère le marqueur ou la balise à la position indiquée. */
  const uploadPastedImageAndInsert = useCallback(
    async (file: File, selectionStart: number, selectionEnd: number, format: BlogBodyFormat) => {
      const check = validateImageFile(file);
      if (!check.ok) {
        setError(check.error);
        return;
      }

      setImageUploading(true);
      setError(null);
      try {
        const { getSession } = await import('@/lib/supabase/auth');
        const session = await getSession();
        if (!session?.access_token) {
          setError('Session expirée');
          return;
        }
        const fd = new FormData();
        fd.append('image', file);
        const res = await fetch('/api/admin/blog-image', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(pickApiErrorBodyMessage(data, 'Échec envoi de l’image'));
          return;
        }
        const url = (data as { url?: string }).url;
        if (!url) {
          setError('Réponse serveur sans URL');
          return;
        }
        const snippet = snippetForImageUrl(url, format);
        const start = selectionStart;
        setFormBody((prev) => prev.slice(0, start) + snippet + prev.slice(selectionEnd));
        requestAnimationFrame(() => {
          const el = bodyTextareaRef.current;
          if (!el) return;
          const pos = start + snippet.length;
          el.focus();
          el.setSelectionRange(pos, pos);
        });
      } catch {
        setError('Erreur réseau');
      } finally {
        setImageUploading(false);
      }
    },
    [snippetForImageUrl]
  );

  const handleBodyPaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items?.length) return;

      let imageFile: File | null = null;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind !== 'file') continue;
        const f = it.getAsFile();
        if (f && f.type.startsWith('image/')) {
          imageFile = f;
          break;
        }
      }
      if (!imageFile) return;

      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      void uploadPastedImageAndInsert(imageFile, start, end, formBodyFormat);
    },
    [formBodyFormat, uploadPastedImageAndInsert]
  );

  const handleCoverImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setCoverUploading(true);
    setError(null);
    try {
      const { getSession } = await import('@/lib/supabase/auth');
      const session = await getSession();
      if (!session?.access_token) {
        setError('Session expirée');
        return;
      }
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/admin/blog-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(pickApiErrorBodyMessage(data, 'Échec envoi de l’image de couverture'));
        return;
      }
      const url = (data as { url?: string }).url;
      if (!url) {
        setError('Réponse serveur sans URL');
        return;
      }
      setFormCoverImageUrl(url);
    } catch {
      setError('Erreur réseau');
    } finally {
      setCoverUploading(false);
    }
  };

  const submitForm = async () => {
    const { getSession } = await import('@/lib/supabase/auth');
    const session = await getSession();
    if (!session?.access_token) {
      setError('Session expirée');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const publishedAt = parseDateInputAtLocalMidnight(formPublishedLocal);
      if (!publishedAt) {
        setError('Date de mise en ligne invalide');
        setSaving(false);
        return;
      }

      const coverPayload = formCoverImageUrl.trim() || null;

      if (editingId === 'new') {
        const res = await fetch('/api/admin/blog-articles', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formTitle,
            slug: formSlug.trim() || undefined,
            excerpt: formExcerpt.trim() || null,
            body: formBody,
            body_format: formBodyFormat,
            cover_image_url: coverPayload,
            published_at: publishedAt.toISOString(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(pickApiErrorBodyMessage(data, 'Erreur enregistrement'));
        } else {
          resetForm();
          await loadArticles();
        }
      } else if (editingId) {
        const res = await fetch(`/api/admin/blog-articles/${editingId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formTitle,
            slug: formSlug.trim() || undefined,
            excerpt: formExcerpt.trim() || null,
            body: formBody,
            body_format: formBodyFormat,
            cover_image_url: coverPayload,
            published_at: publishedAt.toISOString(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(pickApiErrorBodyMessage(data, 'Erreur enregistrement'));
        } else {
          resetForm();
          await loadArticles();
        }
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    const { getSession } = await import('@/lib/supabase/auth');
    const session = await getSession();
    if (!session?.access_token) {
      setError('Session expirée');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/blog-articles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(pickApiErrorBodyMessage(data, 'Erreur suppression'));
      } else {
        if (editingId === id) resetForm();
        await loadArticles();
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredArticles = useMemo(() => {
    if (!q) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        (a.excerpt && a.excerpt.toLowerCase().includes(q))
    );
  }, [articles, q]);

  if (!canAccessAdmin && !authLoading) {
    return null;
  }

  const nowMs = Date.now();

  const inputBaseStyle: CSSProperties = {
    height: 44,
    padding: '0 14px',
    fontSize: 15,
    borderRadius: 12,
    border: '1px solid #d2d2d7',
    backgroundColor: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <main style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div
        className="actualites-page-inner messages-page-inner admin-actualites-page-inner"
        style={{ maxWidth: 1100, margin: '0 auto', padding: '30px 24px 60px' }}
      >
        <div style={{ marginBottom: 20 }}>
          <Link
            href="/admin"
            style={{ fontSize: 14, color: '#6e6e73', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={16} /> Retour à l’admin
          </Link>
        </div>

        <div
          className="admin-actualites-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div className="admin-actualites-title-block" style={{ flex: '1 1 auto', minWidth: 0 }}>
            <h1
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: 28,
                fontWeight: 500,
                margin: '0 0 8px',
                color: '#1d1d1f',
              }}
            >
              Actualités
            </h1>
            <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
              {loading ? 'Chargement…' : `${articles.length} ${articles.length === 1 ? 'article' : 'articles'}`}
            </p>
          </div>
          <div
            className="admin-actualites-header-actions"
            style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10 }}
          >
            <button
              type="button"
              onClick={openNew}
              disabled={saving}
              className="admin-actualites-nouvel-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                backgroundColor: '#000',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 12,
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Plus size={18} /> Nouvel article
            </button>
          </div>
        </div>

        {error && (
          <p style={{ color: '#b91c1c', fontSize: 14, marginBottom: 16 }} role="alert">
            {toUserFacingErrorString(error)}
          </p>
        )}

        {(articles.length > 0 || searchQuery.trim()) && (
          <div className="messages-search-row" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="messages-search-input-wrap" style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#86868b',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans les actualités…"
                autoComplete="off"
                disabled={loading}
                style={{
                  width: '100%',
                  height: 48,
                  padding: '0 16px 0 44px',
                  fontSize: 14,
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        {editingId && (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              border: '1px solid #e8e6e3',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              padding: '28px 28px 32px',
              marginBottom: 32,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: 22,
                fontWeight: 500,
                marginBottom: 20,
                color: '#1d1d1f',
              }}
            >
              {editingId === 'new' ? 'Nouvel article' : 'Modifier l’article'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#6e6e73' }}>Titre</span>
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} style={{ ...inputBaseStyle, width: '100%' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#6e6e73' }}>Slug URL (optionnel, généré depuis le titre si vide)</span>
                <input
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="ex. nouvelle-saison-2026"
                  style={{ ...inputBaseStyle, width: '100%' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#6e6e73' }}>Chapô (optionnel)</span>
                <input value={formExcerpt} onChange={(e) => setFormExcerpt(e.target.value)} style={{ ...inputBaseStyle, width: '100%' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#6e6e73' }}>Date de mise en ligne</span>
                <input
                  type="date"
                  value={formPublishedLocal}
                  onChange={(e) => setFormPublishedLocal(e.target.value)}
                  style={{ ...inputBaseStyle, maxWidth: 200 }}
                />
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#6e6e73' }}>Photo de l’article (liste + en-tête)</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <input
                      ref={coverImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      style={{ display: 'none' }}
                      onChange={(ev) => void handleCoverImageChange(ev)}
                    />
                    <button
                      type="button"
                      onClick={() => coverImageInputRef.current?.click()}
                      disabled={saving || coverUploading}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        fontSize: 13,
                        fontWeight: 500,
                        backgroundColor: '#fff',
                        color: '#1d1d1f',
                        border: '1px solid #d2d2d7',
                        borderRadius: 12,
                        cursor: saving || coverUploading ? 'not-allowed' : 'pointer',
                        opacity: saving || coverUploading ? 0.6 : 1,
                      }}
                    >
                      <ImagePlus size={16} />
                      {coverUploading ? 'Envoi…' : 'Choisir une image'}
                    </button>
                    {formCoverImageUrl ? (
                      <button
                        type="button"
                        onClick={() => setFormCoverImageUrl('')}
                        disabled={saving || coverUploading}
                        style={{
                          padding: '8px 14px',
                          fontSize: 13,
                          backgroundColor: '#fff',
                          color: '#6e6e73',
                          border: '1px solid #d2d2d7',
                          borderRadius: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Retirer
                      </button>
                    ) : null}
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#86868b', margin: 0, lineHeight: 1.45 }}>
                  JPEG ou PNG, max 10&nbsp;Mo — même stockage que les images du corps (bucket blog).
                </p>
                {formCoverImageUrl &&
                isTrustedBlogImageUrl(formCoverImageUrl, supabasePublicUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formCoverImageUrl}
                    alt=""
                    style={{
                      width: '100%',
                      maxWidth: 420,
                      maxHeight: 220,
                      objectFit: 'cover',
                      borderRadius: 12,
                      border: '1px solid #e8e6e3',
                    }}
                  />
                ) : null}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#6e6e73', marginRight: 4 }}>Format du corps</span>
                  <div
                    role="group"
                    aria-label="Format du corps"
                    style={{ display: 'inline-flex', borderRadius: 10, border: '1px solid #d2d2d7', overflow: 'hidden' }}
                  >
                    {(['text', 'html'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setFormBodyFormat(fmt)}
                        style={{
                          padding: '8px 14px',
                          fontSize: 13,
                          fontWeight: formBodyFormat === fmt ? 600 : 400,
                          border: 'none',
                          backgroundColor: formBodyFormat === fmt ? '#1d1d1f' : '#fff',
                          color: formBodyFormat === fmt ? '#fff' : '#1d1d1f',
                          cursor: 'pointer',
                        }}
                      >
                        {fmt === 'text' ? 'Texte' : 'HTML'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#6e6e73', marginRight: 4 }}>Vue</span>
                  <div
                    role="group"
                    aria-label="Édition ou prévisualisation"
                    style={{ display: 'inline-flex', borderRadius: 10, border: '1px solid #d2d2d7', overflow: 'hidden' }}
                  >
                    {(['edit', 'preview'] as const).map((pane) => (
                      <button
                        key={pane}
                        type="button"
                        onClick={() => setBodyEditorPane(pane)}
                        style={{
                          padding: '8px 14px',
                          fontSize: 13,
                          fontWeight: bodyEditorPane === pane ? 600 : 400,
                          border: 'none',
                          backgroundColor: bodyEditorPane === pane ? '#1d1d1f' : '#fff',
                          color: bodyEditorPane === pane ? '#fff' : '#1d1d1f',
                          cursor: 'pointer',
                        }}
                      >
                        {pane === 'edit' ? 'Édition' : 'Prévisualisation'}
                      </button>
                    ))}
                  </div>
                  {bodyEditorPane === 'edit' && imageUploading ? (
                    <span style={{ fontSize: 12, color: '#6e6e73' }} aria-live="polite">
                      Envoi de l’image…
                    </span>
                  ) : null}
                </div>
                <p style={{ fontSize: 12, color: '#86868b', margin: 0, lineHeight: 1.45 }}>
                  {bodyEditorPane === 'edit' ? (
                    <>
                      JPEG ou PNG, max 10&nbsp;Mo. Collez une image dans le champ : envoi au stockage et insertion au
                      curseur.{' '}
                      {formBodyFormat === 'html' ? (
                        <>
                          Balises <code style={{ fontSize: 11, background: '#f0f0f2', padding: '2px 6px', borderRadius: 4 }}>{'<img>'}</code> ou{' '}
                          <code style={{ fontSize: 11, background: '#f0f0f2', padding: '2px 6px', borderRadius: 4 }}>{'{{IMG:…}}'}</code>.
                        </>
                      ) : (
                        <>
                          Marqueur <code style={{ fontSize: 11, background: '#f0f0f2', padding: '2px 6px', borderRadius: 4 }}>{'{{IMG:…}}'}</code> sur le site public.
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      Rendu identique à la page publique pour le format choisi (
                      {formBodyFormat === 'html' ? 'HTML' : 'texte'}). Utilisez l’onglet Édition pour modifier.
                    </>
                  )}
                </p>
                {bodyEditorPane === 'edit' ? (
                  <textarea
                    ref={bodyTextareaRef}
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    onPaste={handleBodyPaste}
                    rows={14}
                    disabled={saving}
                    style={{
                      minHeight: 360,
                      padding: 14,
                      fontSize: 15,
                      borderRadius: 12,
                      border: '1px solid #d2d2d7',
                      resize: 'vertical',
                      fontFamily:
                        formBodyFormat === 'html'
                          ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                          : 'inherit',
                      backgroundColor: '#fff',
                      boxSizing: 'border-box',
                      width: '100%',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      minHeight: 360,
                      maxHeight: 560,
                      overflowY: 'auto',
                      padding: 16,
                      borderRadius: 12,
                      border: '1px solid #d2d2d7',
                      backgroundColor: '#fafafa',
                      boxSizing: 'border-box',
                    }}
                  >
                    <BlogArticleBody
                      body={formBody}
                      bodyFormat={formBodyFormat}
                      supabaseUrl={supabasePublicUrl}
                    />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => void submitForm()}
                  disabled={saving || !formTitle.trim() || !formBody.trim()}
                  style={{
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 500,
                    backgroundColor: '#1d1d1f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving || !formTitle.trim() || !formBody.trim() ? 0.5 : 1,
                  }}
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={() => resetForm()}
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    fontSize: 14,
                    backgroundColor: '#fff',
                    color: '#1d1d1f',
                    border: '1px solid #d2d2d7',
                    borderRadius: 12,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? null : filteredArticles.length > 0 ? (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              border: '1px solid #e8e6e3',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredArticles.map((a, index) => {
                const published = new Date(a.published_at);
                const pubMs = published.getTime();
                const scheduled = pubMs > nowMs;
                const thumb =
                  a.cover_image_url && isTrustedBlogImageUrl(a.cover_image_url, supabasePublicUrl)
                    ? a.cover_image_url
                    : null;
                return (
                  <div
                    key={a.id}
                    className="admin-actualites-list-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 24,
                      padding: '18px 28px',
                      borderBottom: index < filteredArticles.length - 1 ? '1px solid #e8e6e3' : 'none',
                      backgroundColor: '#fff',
                    }}
                  >
                    <div style={{ flexShrink: 0 }} aria-hidden>
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 12,
                          backgroundColor: '#f5f5f7',
                          border: '1px solid #e8e6e3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Newspaper size={28} color="#86868b" />
                        )}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 500,
                            color: '#1d1d1f',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {a.title}
                        </span>
                        <span style={{ fontSize: 12, color: '#86868b', flexShrink: 0 }}>
                          <span className="messages-date-relative">{formatRelativeTime(published)}</span>
                          <span className="messages-date-short">{formatDateShort(published)}</span>
                        </span>
                      </div>
                      {a.excerpt ? (
                        <p
                          style={{
                            fontSize: 13,
                            color: '#6e6e73',
                            marginTop: 4,
                            marginBottom: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {a.excerpt}
                        </p>
                      ) : null}
                      <p style={{ fontSize: 12, color: '#6e6e73', marginTop: 6, marginBottom: 0, wordBreak: 'break-all' }}>
                        /actualites/{a.slug}
                        {scheduled ? (
                          <span style={{ marginLeft: 8, color: '#92400e', fontWeight: 500 }}>· Programmé</span>
                        ) : (
                          <span style={{ marginLeft: 8, color: '#15803d', fontWeight: 500 }}>· En ligne</span>
                        )}
                      </p>
                    </div>
                    <div
                      className="admin-actualites-actions"
                      style={{
                        flexShrink: 0,
                        borderLeft: '1px solid #e8e6e3',
                        paddingLeft: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        alignSelf: 'stretch',
                        minHeight: 80,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        disabled={saving}
                        aria-label="Modifier"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          fontSize: 13,
                          backgroundColor: '#fff',
                          border: '1px solid #d2d2d7',
                          borderRadius: 12,
                          cursor: 'pointer',
                        }}
                      >
                        <Pencil size={16} /> Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteArticle(a.id)}
                        disabled={saving}
                        aria-label="Supprimer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          fontSize: 13,
                          backgroundColor: '#fff',
                          border: '1px solid #fecaca',
                          color: '#b91c1c',
                          borderRadius: 12,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={16} /> Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : q ? (
          <div style={{ textAlign: 'center', padding: '60px 28px' }}>
            <p style={{ fontSize: 15, color: '#6e6e73' }}>Aucun résultat pour « {searchQuery.trim()} »</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 28px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                backgroundColor: '#f5f5f7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: '1px solid #e8e6e3',
              }}
            >
              <Newspaper size={28} color="#86868b" />
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: 20,
                fontWeight: 500,
                marginBottom: 8,
                color: '#1d1d1f',
              }}
            >
              Aucun article
            </h2>
            <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 20 }}>Créez un premier article avec « Nouvel article ».</p>
          </div>
        )}
      </div>
    </main>
  );
}
