'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const LINE_HEIGHT = 1.75;
const FONT_SIZE = 16;
const SPACE_LINE = FONT_SIZE * LINE_HEIGHT;
const SPACE_PARAGRAPH = SPACE_LINE;
const SPACE_AFTER_TITLE = SPACE_LINE * 0.75;
const SPACE_AROUND_LIST = SPACE_LINE * 0.5;

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), Georgia, serif',
  fontSize: 22,
  fontWeight: 500,
  color: '#1d1d1f',
  letterSpacing: '-0.02em',
  lineHeight: LINE_HEIGHT,
  marginTop: SPACE_LINE * 1.5,
  marginBottom: SPACE_AFTER_TITLE,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: FONT_SIZE,
  color: '#6e6e73',
  lineHeight: LINE_HEIGHT,
  marginTop: 0,
  marginBottom: SPACE_PARAGRAPH,
  textAlign: 'center',
};

const listStyle: React.CSSProperties = {
  fontSize: FONT_SIZE,
  color: '#6e6e73',
  lineHeight: LINE_HEIGHT,
  margin: 0,
  marginTop: SPACE_AROUND_LIST,
  marginBottom: SPACE_AROUND_LIST,
  padding: 0,
  paddingLeft: 24,
  textAlign: 'center',
};

const listItemStyle: React.CSSProperties = {
  fontSize: FONT_SIZE,
  color: '#6e6e73',
  lineHeight: LINE_HEIGHT,
  margin: 0,
  padding: 0,
  textAlign: 'center',
};

const sectionBlockWidth = 'calc(60% + 2cm)';

function BulletItem({ children, centered }: { children: React.ReactNode; centered?: boolean }) {
  if (centered) {
    return (
      <li style={{ ...listItemStyle, textAlign: 'center', paddingLeft: 0 }}>
        <span style={{ color: '#1d1d1f' }}>• </span>
        {children}
      </li>
    );
  }
  return (
    <li style={{ ...listItemStyle, paddingLeft: 24, position: 'relative' }}>
      <span style={{ position: 'absolute', left: 0, color: '#1d1d1f' }}>•</span>
      {children}
    </li>
  );
}

export default function AProposPage() {
  return (
    <main style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: 28,
                fontWeight: 500,
                marginBottom: 8,
                color: '#1d1d1f',
                letterSpacing: '-0.02em',
              }}
            >
              À propos de Section Luxe
            </h1>
            <p style={{ fontSize: 14, color: '#888' }}>
              Le luxe, en un seul regard.
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <section style={{ maxWidth: sectionBlockWidth, marginLeft: 'auto', marginRight: 'auto', marginBottom: SPACE_LINE * 2 }}>
          <p style={paragraphStyle}>
            Section Luxe est la plateforme qui référence les articles des plus grands revendeurs professionnels du luxe.
            Nous ne vendons pas les produits.
            Nous rendons le marché visible.
          </p>
          <p style={paragraphStyle}>
            Dans un univers souvent fragmenté, nous rassemblons les offres, les organisons et les rendons comparables.
            En quelques clics, il devient possible de voir l&apos;ensemble des opportunités disponibles pour un même article.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ maxWidth: sectionBlockWidth, marginLeft: 'auto', marginRight: 'auto', marginBottom: SPACE_LINE * 2 }}>
          <h2 style={{ ...sectionTitleStyle, marginTop: 0, textAlign: 'center' }}>Comparez, analysez, choisissez</h2>
          <p style={{ ...paragraphStyle, marginBottom: SPACE_AROUND_LIST }}>
            Aujourd&apos;hui, acheter dans le luxe exige précision et visibilité.
            Section Luxe permet de :
          </p>
          <ul style={{ ...listStyle, listStyleType: 'none', paddingLeft: 0 }}>
            <BulletItem centered>comparer les prix</BulletItem>
            <BulletItem centered>analyser l&apos;état et les caractéristiques</BulletItem>
            <BulletItem centered>identifier la meilleure offre disponible</BulletItem>
            <BulletItem centered>découvrir les pièces proches de chez vous</BulletItem>
          </ul>
          <p style={paragraphStyle}>
            Clair. Rapide. Structuré.
          </p>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: SPACE_LINE * 2 }}>
            <Link
              href="/catalogue"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                backgroundColor: '#1d1d1f',
                color: '#fff',
                fontSize: 15,
                fontWeight: 500,
                borderRadius: 980,
                lineHeight: LINE_HEIGHT,
              }}
            >
              Accéder au catalogue
            </Link>
          </div>
        </section>

        {/* Section 3 */}
        <section style={{ maxWidth: sectionBlockWidth, marginLeft: 'auto', marginRight: 'auto', marginBottom: SPACE_LINE * 2 }}>
          <h2 style={{ ...sectionTitleStyle, marginTop: 0, textAlign: 'center' }}>Une plateforme exclusivement professionnelle</h2>
          <p style={paragraphStyle}>
            Section Luxe réunit boutiques, dépôts-vente et maisons spécialisées légalement établies.
            Chaque vendeur reste indépendant et responsable de ses articles.
            Nous leur offrons une vitrine structurée, une visibilité élargie et un accès à une clientèle qualifiée.
            <br />
            <br />
            Pour les professionnels, Section Luxe est un levier.
            Pour les acheteurs, un outil de décision.
          </p>
        </section>

        {/* Section 4 */}
        <section style={{ maxWidth: sectionBlockWidth, marginLeft: 'auto', marginRight: 'auto', marginBottom: SPACE_LINE * 2 }}>
          <h2 style={{ ...sectionTitleStyle, marginTop: 0, textAlign: 'center' }}>Une nouvelle référence du marché</h2>
          <p style={paragraphStyle}>
            Le luxe évolue.
            La recherche devient digitale.
            La comparaison devient essentielle.
            <br />
            <br />
            Section Luxe accompagne cette transformation en apportant transparence, lisibilité et efficacité sans jamais compromettre l&apos;élégance et l&apos;exclusivité propres à cet univers.
          </p>
        </section>

        {/* Section 5 */}
        <section style={{ maxWidth: sectionBlockWidth, marginLeft: 'auto', marginRight: 'auto', marginBottom: SPACE_LINE * 2 }}>
          <h2 style={{ ...sectionTitleStyle, marginTop: 0, textAlign: 'center' }}>Notre ambition</h2>
          <p style={paragraphStyle}>
            Devenir la plateforme de référence du marché du luxe professionnel.
            Un espace clair dans un univers complexe.
            Un accès direct aux meilleures offres.
            Une vision moderne d&apos;un secteur intemporel.
          </p>
        </section>

        {/* Section 6 */}
        <section style={{ maxWidth: sectionBlockWidth, marginLeft: 'auto', marginRight: 'auto', marginBottom: 0, textAlign: 'center' }}>
          <h2 style={{ ...sectionTitleStyle, marginTop: 0, textAlign: 'center' }}>Section Luxe en quelques mots</h2>
          <ul style={{ ...listStyle, listStyleType: 'none', paddingLeft: 0, marginTop: SPACE_AFTER_TITLE }}>
            <BulletItem centered>Plateforme de référencement d&apos;articles de luxe</BulletItem>
            <BulletItem centered>Réservée aux vendeurs professionnels</BulletItem>
            <BulletItem centered>Comparaison claire des offres</BulletItem>
            <BulletItem centered>Articles neufs et d&apos;occasion</BulletItem>
            <BulletItem centered>Vision globale en quelques clics</BulletItem>
          </ul>
        </section>
      </div>

      {/* CTA vendeur — même section, même taille et même dégradé que la page d'accueil (pleine largeur) */}
      <section
        style={{
          position: 'relative',
          marginTop: -40,
          padding: '120px 24px 88px',
          backgroundImage: 'url(/section-vendeur-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 82%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.6) 45%, transparent 75%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 72% 42% at 50% 50%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.5) 55%, rgba(255,255,255,0.15) 85%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 500,
              color: '#1d1d1f',
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            Vous êtes un vendeur professionnel ?
          </h2>
          <p style={{ fontSize: 16, color: '#6e6e73', marginBottom: 32, lineHeight: 1.5 }}>
            Rejoignez notre réseau de vendeurs partenaires et donnez de la visibilité à vos articles.
          </p>
          <Link
            href="/inscription-vendeur"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 50,
              padding: '0 28px',
              backgroundColor: '#1d1d1f',
              color: '#fff',
              fontSize: 15,
              fontWeight: 500,
              borderRadius: 980,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Devenir partenaire
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
        </div>
      </section>
    </main>
  );
}
