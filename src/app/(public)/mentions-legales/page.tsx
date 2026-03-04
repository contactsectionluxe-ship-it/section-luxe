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

export default function MentionsLegalesPage() {
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
            Mentions légales
          </h1>
          <p style={{ fontSize: 15, color: '#6e6e73', marginBottom: 4 }}>Section Luxe</p>
          <p style={{ fontSize: 13, color: '#86868b' }}>Dernière mise à jour : 22/02/2026</p>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <h2 style={{ ...sectionTitleStyle, marginTop: 0 }}>1. Éditeur du site</h2>
          <p style={paragraphStyle}>
            Le site exploité sous la marque Section Luxe est édité par :
          </p>
          <p style={paragraphStyle}>
            <strong>SL INVEST</strong><br />
            Société par Actions Simplifiée (SAS) au capital de 1 000 €<br />
            Siège social : [Numéro] Boulevard Murat, 75016 Paris, France<br />
            Immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro 912 345 678 RCS Paris<br />
            Numéro SIRET : 912 345 678 00012<br />
            Numéro de TVA intracommunautaire : FR 12 912345678<br />
            Directeur de la publication : Michael Labrador, Président<br />
            Adresse de contact : <a href="mailto:contact@sectionluxe.fr" style={{ color: '#1d1d1f', fontWeight: 600 }}>contact@sectionluxe.fr</a>
          </p>

          <h2 style={sectionTitleStyle}>2. Hébergement</h2>
          <p style={paragraphStyle}>
            Le site est hébergé par :
          </p>
          <p style={paragraphStyle}>
            <strong>Vercel Inc.</strong><br />
            340 S Lemon Ave #4133<br />
            Walnut, CA 91789<br />
            États-Unis<br />
            Site internet : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#1d1d1f', fontWeight: 600 }}>https://vercel.com</a>
          </p>

          <h2 style={sectionTitleStyle}>3. Statut de la plateforme</h2>
          <p style={paragraphStyle}>
            Section Luxe est une plateforme en ligne de mise en relation entre vendeurs professionnels du secteur du luxe et acheteurs.
            SL INVEST agit exclusivement en qualité d&apos;opérateur de plateforme technique.
          </p>
          <p style={paragraphStyle}>
            À ce titre, SL INVEST :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>ne vend aucun produit ;</li>
            <li style={listItemStyle}>ne devient jamais propriétaire des biens proposés ;</li>
            <li style={listItemStyle}>n&apos;intervient pas dans la négociation ni dans la conclusion des contrats entre vendeurs et acheteurs ;</li>
            <li style={listItemStyle}>n&apos;est pas partie aux contrats conclus entre les utilisateurs.</li>
          </ul>
          <p style={paragraphStyle}>
            Les contrats de vente sont conclus directement entre le vendeur professionnel et l&apos;acheteur.
            Les paiements effectués sur la plateforme concernent exclusivement les services proposés aux vendeurs professionnels (publication d&apos;annonces, options de visibilité ou services associés).
          </p>

          <h2 style={sectionTitleStyle}>4. Responsabilité et contenus utilisateurs</h2>
          <p style={paragraphStyle}>
            Les contenus publiés sur la plateforme (annonces, descriptions, images, informations commerciales) sont fournis sous la seule responsabilité des vendeurs professionnels.
          </p>
          <p style={paragraphStyle}>
            Conformément à l&apos;article 6-I-2 de la loi n°2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN), SL INVEST agit en qualité d&apos;hébergeur des contenus publiés par les utilisateurs.
            À ce titre, SL INVEST ne peut voir sa responsabilité engagée concernant les contenus stockés qu&apos;à compter du moment où elle a eu connaissance de leur caractère manifestement illicite et n&apos;a pas agi promptement pour les retirer.
          </p>
          <p style={paragraphStyle}>
            SL INVEST se réserve le droit de supprimer tout contenu manifestement illicite ou non conforme aux CGU.
          </p>

          <h2 style={sectionTitleStyle}>5. Signalement de contenu illicite</h2>
          <p style={paragraphStyle}>
            Toute personne peut signaler un contenu manifestement illicite à l&apos;adresse suivante :{' '}
            <a href="mailto:contact@sectionluxe.fr" style={{ color: '#1d1d1f', fontWeight: 600 }}>contact@sectionluxe.fr</a>
          </p>
          <p style={paragraphStyle}>
            Le signalement doit comporter :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>l&apos;identification précise du contenu concerné ;</li>
            <li style={listItemStyle}>les motifs juridiques justifiant le retrait ;</li>
            <li style={listItemStyle}>les coordonnées du déclarant.</li>
          </ul>

          <h2 style={sectionTitleStyle}>6. Limitation de responsabilité</h2>
          <p style={paragraphStyle}>
            SL INVEST met en œuvre les moyens raisonnables pour assurer le bon fonctionnement et la sécurité du site.
            Toutefois, la société ne saurait être tenue responsable :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>de l&apos;exactitude des informations publiées par les vendeurs ;</li>
            <li style={listItemStyle}>de la conformité des produits vendus ;</li>
            <li style={listItemStyle}>de l&apos;exécution des contrats conclus entre utilisateurs ;</li>
            <li style={listItemStyle}>des dommages indirects liés à l&apos;utilisation du site ;</li>
            <li style={listItemStyle}>d&apos;une interruption temporaire ou d&apos;une indisponibilité du service.</li>
          </ul>
          <p style={paragraphStyle}>
            Chaque vendeur est seul responsable de son activité, de ses produits et de ses obligations légales.
          </p>

          <h2 style={sectionTitleStyle}>7. Propriété intellectuelle</h2>
          <p style={paragraphStyle}>
            L&apos;ensemble des éléments composant le site Section Luxe (textes, images, graphismes, logos, base de données, structure, marque, etc.) est protégé par le droit de la propriété intellectuelle.
          </p>
          <p style={paragraphStyle}>
            Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation écrite préalable de SL INVEST est strictement interdite.
          </p>
          <p style={paragraphStyle}>
            Les contenus publiés par les vendeurs demeurent leur propriété, sous réserve des droits nécessaires à leur diffusion sur la plateforme.
          </p>

          <h2 style={sectionTitleStyle}>8. Données personnelles</h2>
          <p style={paragraphStyle}>
            Les modalités de collecte et de traitement des données personnelles sont détaillées dans la{' '}
            <Link href="/politique-confidentialite" style={{ color: '#1d1d1f', fontWeight: 600 }}>Politique de confidentialité</Link> accessible sur le site.
          </p>

          <h2 style={sectionTitleStyle}>9. Cookies</h2>
          <p style={paragraphStyle}>
            Les règles relatives aux cookies sont précisées dans la Politique de confidentialité et la Politique Cookies accessibles sur le site.
          </p>

          <h2 style={sectionTitleStyle}>10. Droit applicable</h2>
          <p style={paragraphStyle}>
            Les présentes mentions légales sont régies par le droit français.
          </p>
          <p style={paragraphStyle}>
            En cas de litige relatif à l&apos;utilisation du site et à défaut de résolution amiable, les tribunaux compétents seront ceux du ressort du siège social de SL INVEST, sous réserve des règles impératives applicables.
          </p>

          <h2 style={sectionTitleStyle}>11. Validité partielle</h2>
          <p style={paragraphStyle}>
            Si une disposition des présentes mentions légales était déclarée nulle ou inapplicable, les autres dispositions demeureront pleinement en vigueur.
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
