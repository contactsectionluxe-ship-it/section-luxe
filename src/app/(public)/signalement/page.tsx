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
const sidebarWidth = 220;

function ConditionsSidebar({ active }: { active: 'cgu' | 'cgv' | 'charte' | 'signalement' }) {
  const linkStyle = (isActive: boolean) => ({
    display: 'block' as const,
    padding: '12px 14px',
    fontSize: 14,
    fontWeight: isActive ? 600 : 500,
    color: isActive ? '#1d1d1f' : '#6e6e73',
    backgroundColor: isActive ? '#ebebed' : 'transparent',
    borderRadius: 10,
    textDecoration: 'none' as const,
  });
  return (
    <nav style={{ width: sidebarWidth, flexShrink: 0 }}>
      <div
        style={{
          position: 'sticky',
          top: 'calc(var(--header-height) + 24px)',
          marginTop: 'calc(120px + 1mm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <Link href="/cgu" style={linkStyle(active === 'cgu')}>
          Conditions générales d&apos;utilisation
        </Link>
        <Link href="/cgv" style={linkStyle(active === 'cgv')}>
          Conditions générales de vente (CGV)
        </Link>
        <Link href="/charte-vendeurs" style={linkStyle(active === 'charte')}>
          Charte vendeurs et règles de publication
        </Link>
        <Link href="/signalement" style={linkStyle(active === 'signalement')}>
          Signalement d&apos;un contenu ou d&apos;une annonce
        </Link>
      </div>
    </nav>
  );
}

export default function SignalementPage() {
  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div style={{ padding: '0.5cm 24px 80px', display: 'grid', gridTemplateColumns: '1fr 720px 1fr', gap: 40, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ConditionsSidebar active="signalement" />
        </div>
        <div>
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
              Signalement d&apos;un contenu ou d&apos;une annonce
            </h1>
            <p style={{ fontSize: 15, color: '#6e6e73', marginBottom: 4 }}>Section Luxe</p>
            <p style={{ fontSize: 13, color: '#86868b' }}>Dernière mise à jour : 22/02/2026</p>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h2 style={{ ...sectionTitleStyle, marginTop: 0 }}>1. Notre engagement</h2>
            <p style={paragraphStyle}>
              Section Luxe est une plateforme de mise en relation entre vendeurs professionnels et acheteurs.
              Nous nous engageons à maintenir un environnement respectueux de la réglementation applicable, notamment en matière de :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>contrefaçon ;</li>
              <li style={listItemStyle}>atteinte aux droits de propriété intellectuelle (marques, droits d&apos;auteur, dessins et modèles) ;</li>
              <li style={listItemStyle}>pratiques commerciales trompeuses ;</li>
              <li style={listItemStyle}>fraude ;</li>
              <li style={listItemStyle}>contenus illicites ou contraires à l&apos;ordre public.</li>
            </ul>
            <p style={paragraphStyle}>
              Tout contenu manifestement illicite peut être signalé conformément à la procédure ci-dessous.
            </p>

            <h2 style={sectionTitleStyle}>2. Comment signaler une annonce ?</h2>
            <p style={{ ...paragraphStyle, fontWeight: 600, color: '#1d1d1f' }}>Depuis l&apos;annonce concernée</p>
            <p style={paragraphStyle}>
              Chaque annonce publiée sur la plateforme comporte un bouton « Signaler ».
              En cliquant sur ce bouton, vous accédez à un formulaire permettant de :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>sélectionner le motif du signalement ;</li>
              <li style={listItemStyle}>décrire précisément les faits reprochés ;</li>
              <li style={listItemStyle}>joindre tout document ou élément justificatif utile.</li>
            </ul>
            <p style={paragraphStyle}>
              Ce dispositif constitue le moyen le plus rapide et le plus efficace pour nous alerter.
            </p>
            <p style={{ ...paragraphStyle, fontWeight: 600, color: '#1d1d1f' }}>Par email</p>
            <p style={paragraphStyle}>
              Vous pouvez également effectuer un signalement à l&apos;adresse suivante :{' '}
              <a href="mailto:contact.sectionluxe@gmail.com" style={{ color: '#6e6e73', textDecoration: 'none' }}>contact.sectionluxe@gmail.com</a>
            </p>
            <p style={paragraphStyle}>
              Le signalement doit comporter :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>l&apos;identification précise de l&apos;annonce concernée (URL ou référence) ;</li>
              <li style={listItemStyle}>la description détaillée des faits ;</li>
              <li style={listItemStyle}>les fondements juridiques invoqués, le cas échéant ;</li>
              <li style={listItemStyle}>vos coordonnées complètes ;</li>
              <li style={listItemStyle}>tout élément permettant d&apos;établir la réalité de l&apos;atteinte alléguée.</li>
            </ul>
            <p style={paragraphStyle}>
              Les titulaires de droits (marques, droits d&apos;auteur, dessins et modèles) peuvent utiliser ce dispositif pour signaler toute atteinte à leurs droits.
            </p>

            <h2 style={sectionTitleStyle}>3. Traitement des signalements</h2>
            <p style={paragraphStyle}>
              Conformément à l&apos;article 6-I-2 de la loi n°2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN), Section Luxe agit en qualité d&apos;hébergeur des contenus publiés par les utilisateurs.
              À ce titre :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>nous examinons les signalements reçus ;</li>
              <li style={listItemStyle}>nous pouvons solliciter des informations complémentaires ;</li>
              <li style={listItemStyle}>nous procédons, lorsque cela est justifié, au retrait du contenu, à la suspension de l&apos;annonce ou à la suspension du compte concerné.</li>
            </ul>
            <p style={paragraphStyle}>
              Les signalements sont traités dans les meilleurs délais, généralement sous 7 jours ouvrés, sauf situation nécessitant une analyse approfondie.
              Le retrait d&apos;un contenu ne constitue pas une reconnaissance de responsabilité de la part de Section Luxe.
            </p>

            <h2 style={sectionTitleStyle}>4. Signalement abusif</h2>
            <p style={paragraphStyle}>
              Tout signalement abusif, mensonger ou manifestement infondé est susceptible d&apos;engager la responsabilité de son auteur.
              Section Luxe se réserve le droit de prendre toute mesure appropriée en cas d&apos;utilisation abusive ou détournée du dispositif de signalement.
            </p>

            <h2 style={sectionTitleStyle}>5. Absence de rôle d&apos;arbitre</h2>
            <p style={paragraphStyle}>
              Section Luxe n&apos;est pas partie aux contrats conclus entre vendeurs et acheteurs.
              Le dispositif de signalement ne constitue pas un mécanisme d&apos;arbitrage des litiges commerciaux entre utilisateurs.
              Les différends relatifs à l&apos;exécution d&apos;une vente doivent être traités directement entre les parties concernées.
            </p>

            <h2 style={sectionTitleStyle}>6. Confidentialité</h2>
            <p style={paragraphStyle}>
              Les informations transmises dans le cadre d&apos;un signalement sont traitées conformément à notre Politique de confidentialité.
              Elles peuvent être communiquées aux autorités compétentes si la réglementation l&apos;exige.
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
