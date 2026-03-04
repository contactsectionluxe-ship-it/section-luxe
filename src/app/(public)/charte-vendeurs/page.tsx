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

export default function CharteVendeursPage() {
  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div style={{ padding: '0.5cm 24px 80px', display: 'grid', gridTemplateColumns: '1fr 720px 1fr', gap: 40, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ConditionsSidebar active="charte" />
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
              Charte vendeurs et règles de publication
            </h1>
            <p style={{ fontSize: 15, color: '#6e6e73', marginBottom: 4 }}>Section Luxe</p>
            <p style={{ fontSize: 13, color: '#86868b' }}>Dernière mise à jour : 22/02/2026</p>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h2 style={{ ...sectionTitleStyle, marginTop: 0 }}>1. Objet et portée</h2>
            <p style={paragraphStyle}>
              La présente Charte définit les règles applicables aux vendeurs professionnels publiant des annonces sur la plateforme Section Luxe (ci-après la « Plateforme »).
              Elle fait partie intégrante des Conditions Générales d&apos;Utilisation (CGU) et des Conditions Générales de Vente (CGV).
            </p>
            <p style={paragraphStyle}>
              En cas de contradiction, les CGU et CGV prévaudront.
              Toute création de compte vendeur, publication d&apos;annonce ou utilisation des services proposés implique l&apos;acceptation pleine, entière et sans réserve de la présente Charte.
            </p>

            <h2 style={sectionTitleStyle}>2. Conditions d&apos;accès à la plateforme</h2>
            <p style={paragraphStyle}>
              La publication d&apos;annonces est strictement réservée aux vendeurs professionnels légalement constitués et dûment immatriculés.
              Le vendeur garantit :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>être régulièrement immatriculé ;</li>
              <li style={listItemStyle}>disposer de toutes les autorisations nécessaires ;</li>
              <li style={listItemStyle}>être en conformité avec ses obligations fiscales, sociales et commerciales ;</li>
              <li style={listItemStyle}>disposer, le cas échéant, d&apos;une assurance professionnelle adaptée ;</li>
              <li style={listItemStyle}>fournir des informations exactes, complètes et à jour.</li>
            </ul>
            <p style={paragraphStyle}>
              Section Luxe se réserve le droit :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>de demander tout justificatif ;</li>
              <li style={listItemStyle}>de procéder à toute vérification utile ;</li>
              <li style={listItemStyle}>de refuser, suspendre ou résilier un compte en cas d&apos;informations inexactes, incomplètes ou suspectes.</li>
            </ul>

            <h2 style={sectionTitleStyle}>3. Authenticité, propriété et provenance des produits</h2>
            <p style={paragraphStyle}>
              Le vendeur garantit que :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>les produits proposés sont strictement authentiques ;</li>
              <li style={listItemStyle}>ils ne constituent pas une contrefaçon ;</li>
              <li style={listItemStyle}>il dispose du droit légal de les commercialiser ;</li>
              <li style={listItemStyle}>leur provenance est licite et traçable ;</li>
              <li style={listItemStyle}>ils ne sont ni volés, ni grevés de droits, ni issus d&apos;une activité illicite.</li>
            </ul>
            <p style={paragraphStyle}>
              En cas de doute sérieux, Section Luxe pourra, sans préavis :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>retirer l&apos;annonce ;</li>
              <li style={listItemStyle}>suspendre ou résilier le compte ;</li>
              <li style={listItemStyle}>conserver les éléments justificatifs ;</li>
              <li style={listItemStyle}>coopérer avec les autorités compétentes.</li>
            </ul>

            <h2 style={sectionTitleStyle}>4. Exactitude et transparence des informations</h2>
            <p style={paragraphStyle}>
              Le vendeur est seul responsable des informations publiées.
              Il s&apos;engage à fournir :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>une description fidèle, complète et sincère ;</li>
              <li style={listItemStyle}>des photographies réelles et non trompeuses ;</li>
              <li style={listItemStyle}>toutes les caractéristiques essentielles ;</li>
              <li style={listItemStyle}>un prix clair et définitif.</li>
            </ul>
            <p style={paragraphStyle}>
              Section Luxe agit en qualité d&apos;hébergeur des contenus publiés par les vendeurs.
              Elle n&apos;exerce aucun contrôle systématique préalable et n&apos;est soumise à aucune obligation générale de surveillance des informations stockées via la Plateforme.
            </p>

            <h2 style={sectionTitleStyle}>5. Produits et contenus interdits</h2>
            <p style={paragraphStyle}>
              Il est interdit de publier :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>des produits contrefaits ou suspects ;</li>
              <li style={listItemStyle}>des produits volés ou illicites ;</li>
              <li style={listItemStyle}>des produits dangereux ou interdits ;</li>
              <li style={listItemStyle}>des annonces fictives ;</li>
              <li style={listItemStyle}>tout contenu contraire à la réglementation ou à l&apos;ordre public.</li>
            </ul>
            <p style={paragraphStyle}>
              Toute annonce non conforme pourra être supprimée sans préavis ni indemnité.
            </p>

            <h2 style={sectionTitleStyle}>6. Qualité, image et réputation</h2>
            <p style={paragraphStyle}>
              Les annonces doivent respecter l&apos;image premium de Section Luxe.
              Section Luxe peut refuser, retirer ou suspendre toute annonce ou tout compte portant atteinte :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>à son image ;</li>
              <li style={listItemStyle}>à sa réputation ;</li>
              <li style={listItemStyle}>à la sécurité de la Plateforme ;</li>
              <li style={listItemStyle}>à la confiance des utilisateurs ;</li>
              <li style={listItemStyle}>à sa conformité réglementaire.</li>
            </ul>

            <h2 style={sectionTitleStyle}>7. Obligations légales du vendeur</h2>
            <p style={paragraphStyle}>
              Le vendeur est seul responsable :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>de la conformité des produits ;</li>
              <li style={listItemStyle}>des obligations d&apos;information précontractuelle ;</li>
              <li style={listItemStyle}>du droit de rétractation ;</li>
              <li style={listItemStyle}>des garanties légales ;</li>
              <li style={listItemStyle}>du service après-vente ;</li>
              <li style={listItemStyle}>du respect de toute réglementation applicable.</li>
            </ul>
            <p style={paragraphStyle}>
              Section Luxe n&apos;intervient ni dans la négociation, ni dans la conclusion, ni dans l&apos;exécution des ventes.
              Le contrat est conclu exclusivement entre le vendeur et l&apos;acheteur.
            </p>

            <h2 style={sectionTitleStyle}>8. Interdiction de détournement</h2>
            <p style={paragraphStyle}>
              Il est interdit :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>de conclure des ventes en dehors de la Plateforme avec des utilisateurs rencontrés via celle-ci ;</li>
              <li style={listItemStyle}>d&apos;insérer des coordonnées destinées à contourner la Plateforme ;</li>
              <li style={listItemStyle}>d&apos;utiliser la Plateforme à des fins frauduleuses.</li>
            </ul>
            <p style={paragraphStyle}>
              Tout manquement pourra entraîner une suspension ou résiliation immédiate.
            </p>

            <h2 style={sectionTitleStyle}>9. Données personnelles</h2>
            <p style={paragraphStyle}>
              Le vendeur s&apos;engage à respecter la réglementation applicable en matière de protection des données.
              Il agit en qualité de responsable de traitement pour les données qu&apos;il traite dans le cadre de ses ventes.
            </p>

            <h2 style={sectionTitleStyle}>10. Contrôles, sanctions et résiliation</h2>
            <p style={paragraphStyle}>
              Section Luxe se réserve le droit :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>de contrôler les annonces ;</li>
              <li style={listItemStyle}>de demander tout justificatif ;</li>
              <li style={listItemStyle}>de suspendre ou supprimer toute annonce ;</li>
              <li style={listItemStyle}>de suspendre ou résilier un compte en cas de manquement.</li>
            </ul>
            <p style={paragraphStyle}>
              Une suspension conservatoire peut être décidée sans préavis en cas de suspicion raisonnable.
              Section Luxe pourra également mettre fin à la relation contractuelle pour motif légitime, notamment pour préserver la sécurité de la Plateforme, son image, sa conformité réglementaire ou l&apos;intérêt des utilisateurs.
              Le fait de ne pas se prévaloir d&apos;une stipulation ne vaut pas renonciation.
              Section Luxe ne garantit aucun chiffre d&apos;affaires, aucune visibilité minimale ni aucun résultat commercial.
            </p>

            <h2 style={sectionTitleStyle}>11. Responsabilité et limitation de responsabilité</h2>
            <p style={paragraphStyle}>
              Section Luxe agit exclusivement comme opérateur technique.
              Elle intervient en qualité d&apos;hébergeur au sens de la législation applicable et ne pourra voir sa responsabilité engagée du fait des contenus publiés par les vendeurs, sauf si, ayant eu connaissance d&apos;un contenu manifestement illicite, elle n&apos;a pas agi promptement pour le retirer.
              Elle n&apos;est pas :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>partie aux contrats ;</li>
              <li style={listItemStyle}>responsable des produits ;</li>
              <li style={listItemStyle}>responsable des informations publiées ;</li>
              <li style={listItemStyle}>responsable des litiges entre utilisateurs.</li>
            </ul>
            <p style={paragraphStyle}>
              Aucune disposition ne crée de mandat, partenariat, société, franchise ou lien de subordination.
              Section Luxe ne pourra être tenue responsable des dommages indirects.
              En tout état de cause, sa responsabilité est limitée au montant des sommes perçues auprès du vendeur au cours des douze (12) mois précédant le fait générateur.
              Le vendeur renonce à tout recours contre Section Luxe au titre de ses relations avec d&apos;autres utilisateurs.
            </p>

            <h2 style={sectionTitleStyle}>12. Commissions et rémunération de la plateforme</h2>
            <p style={paragraphStyle}>
              Les commissions et frais perçus par Section Luxe rémunèrent exclusivement la mise à disposition de la Plateforme et des services associés.
              Sauf stipulation contraire prévue dans les CGV, ces commissions demeurent acquises à Section Luxe, y compris en cas d&apos;annulation ou de litige intervenant entre vendeur et acheteur.
            </p>

            <h2 style={sectionTitleStyle}>13. Garantie et indemnisation</h2>
            <p style={paragraphStyle}>
              Le vendeur garantit et indemnisera Section Luxe contre toute réclamation résultant :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>d&apos;un manquement à la présente Charte ;</li>
              <li style={listItemStyle}>d&apos;une violation de la loi ;</li>
              <li style={listItemStyle}>d&apos;une atteinte aux droits d&apos;un tiers ;</li>
              <li style={listItemStyle}>de la vente d&apos;un produit illicite ou non conforme.</li>
            </ul>
            <p style={paragraphStyle}>
              Section Luxe pourra compenser toute somme due.
            </p>

            <h2 style={sectionTitleStyle}>14. Coopération avec les autorités</h2>
            <p style={paragraphStyle}>
              Les informations du vendeur pourront être communiquées aux autorités compétentes en cas de demande légale ou de suspicion d&apos;infraction.
            </p>

            <h2 style={sectionTitleStyle}>15. Force majeure</h2>
            <p style={paragraphStyle}>
              Section Luxe ne pourra être tenue responsable en cas d&apos;événement échappant raisonnablement à son contrôle.
            </p>

            <h2 style={sectionTitleStyle}>16. Survie des obligations</h2>
            <p style={paragraphStyle}>
              Les clauses relatives à la responsabilité, à la limitation de responsabilité, à l&apos;indemnisation, aux commissions et à la coopération avec les autorités survivront à la résiliation.
            </p>

            <h2 style={sectionTitleStyle}>17. Droit applicable et juridiction compétente</h2>
            <p style={paragraphStyle}>
              La présente Charte est régie par le droit français.
              Tout litige sera soumis à la compétence exclusive des tribunaux du ressort du siège social de Section Luxe, sauf disposition légale impérative contraire.
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
