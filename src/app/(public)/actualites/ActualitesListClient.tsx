'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Newspaper, Search } from 'lucide-react';
import type { BlogArticleListItem } from '@/lib/supabase/blog-articles';
import { isTrustedBlogImageUrl } from '@/lib/blog-body';
import { formatDateShort } from '@/lib/utils';

export function ActualitesListClient({
  articles,
  supabaseUrl,
}: {
  articles: BlogArticleListItem[];
  supabaseUrl: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const q = searchQuery.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.excerpt && a.excerpt.toLowerCase().includes(q))
    );
  }, [articles, q]);

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
          Actualités
        </h1>
        <p style={{ fontSize: 14, color: '#888' }}>
          {articles.length} {articles.length === 1 ? 'article' : 'articles'}
        </p>
      </div>

      {articles.length > 0 && (
        <div className="messages-search-row" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div className="messages-search-input-wrap" style={{ flex: 1, position: 'relative', minWidth: 0 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans les actualités..."
              autoComplete="off"
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

      {filtered.length > 0 ? (
        <div className="actualites-cards-grid">
          {filtered.map((a) => {
            const published = new Date(a.published_at);
            const cover =
              a.cover_image_url && isTrustedBlogImageUrl(a.cover_image_url, supabaseUrl) ? a.cover_image_url : null;
            return (
              <Link
                key={a.id}
                href={`/actualites/${encodeURIComponent(a.slug)}`}
                className="actualites-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  color: 'inherit',
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  border: '1px solid #e8e6e3',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                  minHeight: 0,
                }}
              >
                <div className="actualites-card-image-wrap">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL Supabase bucket blog
                    <img className="actualites-card-cover-img" src={cover} alt="" />
                  ) : (
                    <div className="actualites-card-image-placeholder">
                      <Newspaper size={40} color="#86868b" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="actualites-card-body" style={{ padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  <span
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: '#1d1d1f',
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                      fontFamily: 'var(--font-playfair), Georgia, serif',
                    }}
                  >
                    {a.title}
                  </span>
                  <p style={{ fontSize: 13, color: '#6e6e73', margin: '10px 0 0', alignSelf: 'flex-start' }}>
                    {formatDateShort(published)}
                  </p>
                </div>
              </Link>
            );
          })}
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
          <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 0 }}>Les actualités apparaîtront ici dès publication.</p>
        </div>
      )}
    </>
  );
}
