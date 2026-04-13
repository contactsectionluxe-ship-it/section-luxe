'use client';

import type { CSSProperties } from 'react';
import { parseBlogBody, isTrustedBlogImageUrl } from '@/lib/blog-body';
import { bodyLooksLikeHtmlMarkup, type BlogBodyFormat } from '@/lib/blog-body-format';
import { sanitizeBlogArticleHtml } from '@/lib/blog-html-sanitize';

const textBlockStyle: CSSProperties = {
  fontSize: 16,
  color: '#1d1d1f',
  lineHeight: 1.75,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

export function BlogArticleBody({
  body,
  bodyFormat,
  supabaseUrl,
}: {
  body: string;
  bodyFormat: BlogBodyFormat;
  supabaseUrl: string;
}) {
  const treatAsHtml = bodyFormat === 'html' || (bodyFormat === 'text' && bodyLooksLikeHtmlMarkup(body));

  if (treatAsHtml) {
    const html = sanitizeBlogArticleHtml(body, supabaseUrl);
    return (
      <div
        className="blog-article-html-body"
        style={{ fontSize: 16, color: '#1d1d1f', lineHeight: 1.75, wordBreak: 'break-word' }}
        // Contenu nettoyé (sanitize-html + URLs d’images limitées au bucket blog)
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  const segments = parseBlogBody(body);

  return (
    <div>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          if (!seg.text) return null;
          return (
            <div key={i} style={textBlockStyle}>
              {seg.text}
            </div>
          );
        }
        if (!isTrustedBlogImageUrl(seg.url, supabaseUrl)) {
          return null;
        }
        return (
          // eslint-disable-next-line @next/next/no-img-element -- URLs Supabase dynamiques (bucket blog), pas d’optimisation next/image requise
          <img
            key={i}
            src={seg.url}
            alt=""
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 8,
              display: 'block',
              margin: '16px 0',
            }}
          />
        );
      })}
    </div>
  );
}
