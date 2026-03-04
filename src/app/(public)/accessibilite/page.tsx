'use client';

import Link from 'next/link';

const lineHeight = 1.6;
const paragraphStyle: React.CSSProperties = {
  fontSize: 15,
  color: '#6e6e73',
  lineHeight,
  marginBottom: 16,
  textAlign: 'justify',
};
const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), Georgia, serif',
  fontSize: 20,
  fontWeight: 500,
  color: '#1d1d1f',
  letterSpacing: '-0.02em',
  marginTop: 32,
  marginBottom: 12,
};
const listStyle: React.CSSProperties = {
  fontSize: 15,
  color: '#6e6e73',
  lineHeight,
  marginBottom: 16,
  paddingLeft: 24,
  listStyleType: 'disc',
  textAlign: 'justify',
};
const listItemStyle: React.CSSProperties = {
  marginBottom: 6,
};

export default function AccessibilitePage() {
  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div style={{ padding: '0.5cm 24px 80px' }}>
        <div style={{ width: 720, maxWidth: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
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
            Accessibilité
          </h1>
          <p style={{ fontSize: 15, color: '#6e6e73', marginBottom: 4 }}>Section Luxe</p>
          <p style={{ fontSize: 13, color: '#86868b' }}>Dernière mise à jour : 22/02/2026</p>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <h2 style={{ ...sectionTitleStyle, marginTop: 0 }}>1. Notre engagement</h2>
          <p style={paragraphStyle}>
            Chez Section Luxe, nous considérons que l&apos;accessibilité numérique fait partie intégrante de la qualité de service.
            Nous nous engageons à rendre la plateforme accessible au plus grand nombre, y compris aux personnes en situation de handicap, afin de permettre une consultation et une utilisation équitable de nos services.
          </p>
          <p style={paragraphStyle}>
            L&apos;accessibilité est intégrée dans nos choix de conception, de développement et d&apos;évolution de la plateforme.
          </p>

          <h2 style={sectionTitleStyle}>2. Référentiels et standards de référence</h2>
          <p style={paragraphStyle}>
            Dans le développement et l&apos;amélioration continue du site, nous nous appuyons sur les bonnes pratiques issues :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>des Web Content Accessibility Guidelines (WCAG) 2.1, niveau AA ;</li>
            <li style={listItemStyle}>du Référentiel Général d&apos;Amélioration de l&apos;Accessibilité (RGAA).</li>
          </ul>
          <p style={paragraphStyle}>
            Ces standards guident notamment :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>la structuration des contenus ;</li>
            <li style={listItemStyle}>l&apos;ergonomie des interfaces ;</li>
            <li style={listItemStyle}>la lisibilité des textes ;</li>
            <li style={listItemStyle}>la navigation au clavier ;</li>
            <li style={listItemStyle}>la compatibilité avec les technologies d&apos;assistance.</li>
          </ul>

          <h2 style={sectionTitleStyle}>3. Niveau de conformité</h2>
          <p style={paragraphStyle}>
            À ce jour, la plateforme est partiellement conforme aux standards WCAG 2.1 niveau AA.
            Cette déclaration repose sur une auto-évaluation interne réalisée en février 2026.
          </p>
          <p style={paragraphStyle}>
            Des améliorations sont régulièrement mises en œuvre afin d&apos;augmenter progressivement le niveau d&apos;accessibilité du site.
          </p>

          <h2 style={sectionTitleStyle}>4. Mesures mises en œuvre</h2>
          <p style={paragraphStyle}>
            Nous portons une attention particulière aux éléments suivants :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>structuration logique des contenus (titres hiérarchisés, sections cohérentes) ;</li>
            <li style={listItemStyle}>contrastes de couleurs favorisant la lisibilité ;</li>
            <li style={listItemStyle}>alternatives textuelles pour les images lorsque pertinent ;</li>
            <li style={listItemStyle}>formulaires identifiables et compréhensibles ;</li>
            <li style={listItemStyle}>messages d&apos;erreur explicites ;</li>
            <li style={listItemStyle}>navigation utilisable au clavier ;</li>
            <li style={listItemStyle}>limitation des contenus susceptibles de gêner la lecture (animations excessives, éléments instables) ;</li>
            <li style={listItemStyle}>compatibilité avec les navigateurs récents.</li>
          </ul>
          <p style={paragraphStyle}>
            L&apos;accessibilité est intégrée progressivement dans nos développements et mises à jour.
          </p>

          <h2 style={sectionTitleStyle}>5. Spécificité liée à notre modèle marketplace</h2>
          <p style={paragraphStyle}>
            Section Luxe est une plateforme de mise en relation entre acheteurs et vendeurs professionnels indépendants.
          </p>
          <p style={paragraphStyle}>
            Les contenus publiés par les vendeurs (photographies, descriptions, documents, visuels produits) relèvent de leur responsabilité.
            Nous sensibilisons les vendeurs aux bonnes pratiques de clarté et de présentation des contenus, mais nous ne pouvons garantir la conformité totale des contenus tiers aux standards d&apos;accessibilité.
          </p>

          <h2 style={sectionTitleStyle}>6. Limites et amélioration continue</h2>
          <p style={paragraphStyle}>
            Malgré notre engagement, certains contenus ou fonctionnalités peuvent ne pas être totalement conformes aux standards d&apos;accessibilité.
          </p>
          <p style={paragraphStyle}>
            L&apos;accessibilité numérique étant un processus évolutif, nous poursuivons nos efforts afin d&apos;améliorer en permanence l&apos;expérience utilisateur, en fonction :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>des retours utilisateurs ;</li>
            <li style={listItemStyle}>des évolutions techniques ;</li>
            <li style={listItemStyle}>des mises à jour réglementaires.</li>
          </ul>

          <h2 style={sectionTitleStyle}>7. Retour utilisateur et assistance</h2>
          <p style={paragraphStyle}>
            Si vous rencontrez une difficulté d&apos;accès à un contenu ou à une fonctionnalité du site, vous pouvez nous contacter :
          </p>
          <p style={paragraphStyle}>
            <a href="mailto:contact@sectionluxe.fr" style={{ color: '#1d1d1f', fontWeight: 600, textDecoration: 'none' }}>contact@sectionluxe.fr</a>
            <br />
            ou via le <Link href="/contact" style={{ color: '#1d1d1f', fontWeight: 600 }}>formulaire de contact</Link> disponible sur le site.
          </p>
          <p style={paragraphStyle}>
            Nous nous engageons à :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>examiner votre demande avec attention ;</li>
            <li style={listItemStyle}>vous répondre dans un délai maximum de 30 jours ;</li>
            <li style={listItemStyle}>proposer, lorsque cela est possible, une solution alternative accessible.</li>
          </ul>

          <h2 style={sectionTitleStyle}>8. Voies de recours</h2>
          <p style={paragraphStyle}>
            Si vous constatez un défaut d&apos;accessibilité vous empêchant d&apos;accéder à un contenu ou à un service et que vous n&apos;obtenez pas de réponse satisfaisante après nous avoir contactés, vous pouvez saisir les autorités compétentes conformément à la réglementation applicable.
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 15, color: '#6e6e73' }}>
          <Link href="/" style={{ color: '#1d1d1f', fontWeight: 500 }}>Retour à l&apos;accueil</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
