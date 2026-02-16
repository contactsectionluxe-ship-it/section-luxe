'use client';

import Link from 'next/link';

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), Georgia, serif',
  fontSize: 22,
  fontWeight: 500,
  color: '#1d1d1f',
  letterSpacing: '-0.02em',
  marginTop: 40,
  marginBottom: 16,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: 16,
  color: '#6e6e73',
  lineHeight: 1.7,
  marginBottom: 16,
};

const listStyle: React.CSSProperties = {
  fontSize: 16,
  color: '#6e6e73',
  lineHeight: 1.7,
  marginBottom: 16,
  paddingLeft: 20,
};

const listItemStyle: React.CSSProperties = {
  marginBottom: 8,
};

export default function AProposPage() {
  return (
    <main style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 32,
              fontWeight: 500,
              marginBottom: 10,
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            À propos de Section Luxe
          </h1>
          <p style={{ fontSize: 18, color: '#888', letterSpacing: '-0.01em' }}>
            La marketplace dédiée aux articles de luxe
          </p>
        </div>

        <p style={paragraphStyle}>
          Section Luxe est une plateforme spécialisée dans la mise en relation entre acheteurs et vendeurs professionnels du secteur du luxe. Notre marketplace réunit boutiques, dépôts-vente et maisons spécialisées afin d&apos;offrir une sélection rigoureuse d&apos;articles de luxe, neufs et d&apos;occasion.
        </p>
        <p style={{ ...paragraphStyle, marginBottom: 32 }}>
          Notre objectif : simplifier l&apos;accès au marché du luxe en centralisant les offres et en permettant une comparaison claire, transparente et efficace.
        </p>

        <h2 style={sectionTitleStyle}>Une vision moderne du marché du luxe</h2>
        <p style={paragraphStyle}>
          Le marché des produits de luxe évolue. Les acheteurs recherchent aujourd&apos;hui :
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Plus de transparence</li>
          <li style={listItemStyle}>Une meilleure visibilité des offres</li>
          <li style={listItemStyle}>Une comparaison simple des prix et des états</li>
          <li style={listItemStyle}>Un accès facilité aux pièces rares ou recherchées</li>
        </ul>
        <p style={paragraphStyle}>
          Section Luxe répond à ces attentes en proposant une vision globale du marché, permettant de comparer différentes offres pour un même produit et d&apos;identifier les meilleures opportunités.
        </p>

        <h2 style={sectionTitleStyle}>Une valeur ajoutée pour les vendeurs professionnels</h2>
        <p style={paragraphStyle}>
          Nous accompagnons les vendeurs dans :
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>L&apos;augmentation de leur visibilité en ligne</li>
          <li style={listItemStyle}>La mise en avant qualitative de leurs produits</li>
          <li style={listItemStyle}>L&apos;accès à une clientèle ciblée et qualifiée</li>
          <li style={listItemStyle}>La valorisation de leur expertise</li>
        </ul>
        <p style={paragraphStyle}>
          Section Luxe agit comme un levier de développement pour les acteurs professionnels du luxe.
        </p>

        <h2 style={sectionTitleStyle}>Notre mission</h2>
        <p style={paragraphStyle}>
          Rendre le marché du luxe plus accessible, plus lisible et plus efficace, tout en préservant l&apos;exigence et l&apos;exclusivité qui caractérisent cet univers.
        </p>
        <p style={paragraphStyle}>
          Que vous soyez passionné, collectionneur, investisseur ou acheteur occasionnel, notre plateforme vous permet de trouver la pièce qui correspond à vos attentes, en toute clarté.
        </p>

        <h2 style={sectionTitleStyle}>Section Luxe en quelques mots</h2>
        <ul style={{ ...listStyle, listStyleType: 'none', paddingLeft: 0 }}>
          <li style={{ ...listItemStyle, paddingLeft: 24, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: '#1d1d1f' }}>•</span>
            Marketplace spécialisée en produits de luxe
          </li>
          <li style={{ ...listItemStyle, paddingLeft: 24, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: '#1d1d1f' }}>•</span>
            Articles neufs et d&apos;occasion
          </li>
          <li style={{ ...listItemStyle, paddingLeft: 24, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: '#1d1d1f' }}>•</span>
            Mise en relation entre acheteurs et vendeurs professionnels
          </li>
          <li style={{ ...listItemStyle, paddingLeft: 24, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: '#1d1d1f' }}>•</span>
            Comparaison des offres du marché
          </li>
          <li style={{ ...listItemStyle, paddingLeft: 24, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: '#1d1d1f' }}>•</span>
            Vision complète et structurée du secteur
          </li>
        </ul>

        <div style={{ marginTop: 48 }}>
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
            }}
          >
            Voir catalogue
          </Link>
        </div>
      </div>
    </main>
  );
}
