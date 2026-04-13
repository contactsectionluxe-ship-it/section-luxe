import sanitizeHtml from 'sanitize-html';
import type { Attributes } from 'sanitize-html';
import { isTrustedBlogImageUrl } from '@/lib/blog-body';

const emptyAttribs: Attributes = {};

/** Échappement minimal pour src dans un attribut HTML. */
function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Remplace les marqueurs {{IMG:url}} par des <img> (même logique qu’en mode texte) avant nettoyage.
 */
export function expandBlogImgMarkersInHtml(html: string, supabaseUrl: string): string {
  return html.replace(/\{\{IMG:([^}]+)\}\}/g, (_m, urlRaw: string) => {
    const u = String(urlRaw).trim();
    if (!isTrustedBlogImageUrl(u, supabaseUrl)) return '';
    return `<img src="${escapeAttr(u)}" alt="" loading="lazy" />`;
  });
}

/** Couleurs : hex, rgb, rgba (pas d’url() ni expression). */
const STYLE_COLOR: RegExp[] = [
  /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i,
  /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/i,
];

/** Taille / espacement : unités courantes (copier-coller Word, éditeurs). */
const UNIT = String.raw`\d+(\.\d+)?(px|em|rem|%|pt|vh|vw)`;
const STYLE_LEN: RegExp[] = [new RegExp(`^${UNIT}$`, 'i')];
const STYLE_LEN_OR_ZERO: RegExp[] = [/^0$/, new RegExp(`^${UNIT}$`, 'i')];
const STYLE_MARGIN_PAD: RegExp[] = [
  /^0$/,
  new RegExp(`^(${UNIT})(\\s+${UNIT}){0,3}$`, 'i'),
];

const STYLE_FONT_WEIGHT: RegExp[] = [
  /^(100|200|300|400|500|600|700|800|900)$/,
  /^normal$/i,
  /^bold$/i,
  /^bolder$/i,
  /^lighter$/i,
];

const STYLE_TEXT_ALIGN: RegExp[] = [/^left$/i, /^right$/i, /^center$/i, /^justify$/i];

const STYLE_TEXT_DECORATION: RegExp[] = [
  /^none$/i,
  /^underline$/i,
  /^line-through$/i,
  /^overline$/i,
];

const STYLE_LINE_HEIGHT: RegExp[] = [
  /^\d+(\.\d+)?$/,
  new RegExp(`^${UNIT}$`, 'i'),
];

/**
 * Styles inline autorisés (typographie, couleurs, espacements) — pas de background-image / url().
 */
const allowedStylesGlobal: Record<string, RegExp[]> = {
  color: STYLE_COLOR,
  'background-color': STYLE_COLOR,
  'font-size': STYLE_LEN,
  'font-weight': STYLE_FONT_WEIGHT,
  'font-style': [/^normal$/i, /^italic$/i, /^oblique$/i],
  'line-height': STYLE_LINE_HEIGHT,
  'text-align': STYLE_TEXT_ALIGN,
  'text-decoration': STYLE_TEXT_DECORATION,
  'letter-spacing': STYLE_LEN,
  'word-spacing': STYLE_LEN,
  'text-indent': STYLE_LEN_OR_ZERO,
  'vertical-align': [
    /^top$/i,
    /^middle$/i,
    /^bottom$/i,
    /^baseline$/i,
    /^sub$/i,
    /^super$/i,
    new RegExp(`^${UNIT}$`, 'i'),
  ],
  margin: STYLE_MARGIN_PAD,
  'margin-top': STYLE_LEN_OR_ZERO,
  'margin-bottom': STYLE_LEN_OR_ZERO,
  'margin-left': STYLE_LEN_OR_ZERO,
  'margin-right': STYLE_LEN_OR_ZERO,
  padding: STYLE_MARGIN_PAD,
  'padding-top': STYLE_LEN_OR_ZERO,
  'padding-bottom': STYLE_LEN_OR_ZERO,
  'padding-left': STYLE_LEN_OR_ZERO,
  'padding-right': STYLE_LEN_OR_ZERO,
  width: [...STYLE_LEN, /^auto$/i],
  'max-width': [...STYLE_LEN, /^none$/i, /^100%$/i],
  height: [...STYLE_LEN, /^auto$/i],
  'border-radius': STYLE_LEN,
  // Bordures simples sans url()
  border: [/^0$/, /^\d+(\.\d+)?(px|pt)\s+(solid|dashed|dotted)\s+#[0-9a-f]{3,8}$/i],
  'border-top': [/^0$/, /^\d+(\.\d+)?(px|pt)\s+(solid|dashed|dotted)\s+#[0-9a-f]{3,8}$/i],
  'border-bottom': [/^0$/, /^\d+(\.\d+)?(px|pt)\s+(solid|dashed|dotted)\s+#[0-9a-f]{3,8}$/i],
  'border-left': [/^0$/, /^\d+(\.\d+)?(px|pt)\s+(solid|dashed|dotted)\s+#[0-9a-f]{3,8}$/i],
  'border-right': [/^0$/, /^\d+(\.\d+)?(px|pt)\s+(solid|dashed|dotted)\s+#[0-9a-f]{3,8}$/i],
  // Polices : pas de parenthèses (évite url(), expression)
  'font-family': [/^[-a-zA-Z0-9\s,"'. ]{1,220}$/],
  'white-space': [/^normal$/i, /^nowrap$/i, /^pre-wrap$/i, /^pre-line$/i],
};

const tagsWithStyle = [
  'p',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'div',
  'span',
  'pre',
  'code',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'mark',
  'small',
  'sub',
  'sup',
  'hr',
  'article',
  'section',
  'header',
] as const;

function buildAllowedAttributes(): Record<string, string[]> {
  const out: Record<string, string[]> = {
    a: ['href', 'target', 'rel', 'style'],
    img: ['src', 'alt', 'loading', 'style', 'width', 'height'],
  };
  for (const t of tagsWithStyle) {
    if (out[t]) {
      if (!out[t].includes('style')) out[t].push('style');
    } else {
      out[t] = ['style'];
    }
  }
  return out;
}

/**
 * HTML article : balises + styles de mise en forme courants ; pas de script ; images bucket blog uniquement.
 */
export function sanitizeBlogArticleHtml(html: string, supabaseUrl: string): string {
  const withMarkers = expandBlogImgMarkersInHtml(html, supabaseUrl);
  return sanitizeHtml(withMarkers, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'a',
      'img',
      'div',
      'span',
      'hr',
      'pre',
      'code',
      'mark',
      'small',
      'sub',
      'sup',
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'caption',
      'article',
      'section',
      'header',
    ],
    allowedAttributes: buildAllowedAttributes(),
    allowedStyles: {
      '*': allowedStylesGlobal,
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['https'],
      a: ['http', 'https', 'mailto'],
    },
    transformTags: {
      a: (_tagName, attribs) => {
        const href = (attribs.href || '').trim();
        const lower = href.toLowerCase();
        if (!href || lower.startsWith('javascript:') || lower.startsWith('data:')) {
          if (attribs.style) {
            return { tagName: 'span', attribs: { style: attribs.style } };
          }
          return { tagName: 'span', attribs: emptyAttribs };
        }
        const next: Attributes = {
          href,
          target: '_blank',
          rel: 'noopener noreferrer',
        };
        if (attribs.style) next.style = attribs.style;
        return { tagName: 'a', attribs: next };
      },
    },
    exclusiveFilter(frame) {
      if (frame.tag === 'img') {
        const src = frame.attribs?.src || '';
        if (!isTrustedBlogImageUrl(src, supabaseUrl)) return 'excludeTag';
      }
      return false;
    },
  });
}
