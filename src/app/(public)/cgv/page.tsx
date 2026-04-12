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
    <nav className="conditions-sidebar-nav" style={{ width: sidebarWidth, flexShrink: 0 }}>
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

export default function CGVPage() {
  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div className="conditions-page-layout" style={{ padding: '30px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 720px 1fr', gap: 40, alignItems: 'flex-start' }}>
        <div className="conditions-page-sidebar-col" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ConditionsSidebar active="cgv" />
        </div>
        <div className="conditions-page-main">
          <div className="conditions-page-title-wrap" style={{ textAlign: 'center', marginBottom: 36 }}>
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
              Conditions générales de vente (CGV)
            </h1>
            <p style={{ fontSize: 15, color: '#6e6e73', marginBottom: 4 }}>Vendeurs professionnels – Section Luxe</p>
            <p style={{ fontSize: 13, color: '#86868b' }}>Dernière mise à jour : 22/02/2026</p>
          </div>

          <div className="conditions-page-card-wrap" style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h2 style={{ ...sectionTitleStyle, marginTop: 0 }}>Article 1 – Identification de la société</h2>
            <p style={paragraphStyle}>
              Les présentes Conditions Générales de Vente (ci-après les « CGV ») régissent les relations contractuelles entre :
            </p>
            <p style={paragraphStyle}>
              <strong>SL INVEST</strong><br />
              SAS au capital de 1 000 €<br />
              Siège social : Boulevard Murat, 75016 Paris, France<br />
              RCS Paris : en création<br />
              SIRET : en création<br />
              TVA intracommunautaire : en création<br />
              Email : <a href="mailto:contact@sectionluxe.fr" style={{ color: '#6e6e73', textDecoration: 'none' }}>contact@sectionluxe.fr</a>
            </p>
            <p style={paragraphStyle}>
              Ci-après « la Société »
              <br />
              <br />
              La Société exploite la plateforme en ligne &quot;Section Luxe&quot;, accessible à l&apos;adresse{' '}
              <a href="https://www.sectionluxe.com/" style={{ color: '#6e6e73', textDecoration: 'none' }}>
                https://www.sectionluxe.com/
              </a>
              .
            </p>
            <p style={paragraphStyle}>
              <strong>ET</strong>
              <br />
              Tout professionnel souhaitant publier des annonces sur la plateforme Section Luxe (ci-après le « Vendeur »).
            </p>
            <p style={paragraphStyle}>
              Les présentes CGV sont réservées aux vendeurs professionnels. En s&apos;inscrivant sur la plateforme, le Vendeur
              reconnaît agir dans le cadre de son activité professionnelle.
            </p>

            <h2 style={sectionTitleStyle}>Article 2 – Objet</h2>
            <p style={paragraphStyle}>
              Les présentes CGV définissent les conditions dans lesquelles la Société fournit au Vendeur un service payant de :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>publication et diffusion d&apos;annonces ;</li>
              <li style={listItemStyle}>mise à disposition d&apos;un espace professionnel ;</li>
              <li style={listItemStyle}>mise en relation avec des acheteurs potentiels ;</li>
              <li style={listItemStyle}>outils techniques de gestion d&apos;annonces.</li>
            </ul>
            <p style={paragraphStyle}>
              La Société agit exclusivement en qualité d&apos;intermédiaire technique.
              Elle n&apos;intervient jamais dans :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>la négociation ;</li>
              <li style={listItemStyle}>la conclusion du contrat de vente ;</li>
              <li style={listItemStyle}>l&apos;encaissement du prix ;</li>
              <li style={listItemStyle}>la livraison ;</li>
              <li style={listItemStyle}>le service après-vente ;</li>
              <li style={listItemStyle}>la gestion des litiges entre Vendeur et Acheteur.</li>
            </ul>

            <h2 style={sectionTitleStyle}>Article 3 – Nature de la relation</h2>
            <p style={paragraphStyle}>
              Les présentes CGV constituent un contrat de prestation de services à durée indéterminée.
              Les parties sont juridiquement, financièrement et commercialement indépendantes.
              Aucune relation de mandat, d&apos;agence commerciale, de commissionnaire, de courtage, de représentation ou de société de fait n&apos;est créée.
            </p>

            <h2 style={sectionTitleStyle}>Article 4 – Acceptation et preuve</h2>
            <p style={paragraphStyle}>
              L&apos;ouverture d&apos;un compte vendeur, la commande d&apos;une annonce ou toute utilisation du service impliquent l&apos;acceptation expresse et sans réserve des présentes CGV.
              L&apos;acceptation s&apos;effectue par case à cocher non pré-cochée.
              La validation électronique vaut signature contractuelle.
              Les enregistrements informatiques conservés par la Société font foi entre les parties.
            </p>

            <h2 style={sectionTitleStyle}>Article 5 – Conditions d&apos;éligibilité</h2>
            <p style={paragraphStyle}>
              Le Vendeur doit :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>être un professionnel légalement constitué ;</li>
              <li style={listItemStyle}>fournir un extrait Kbis de moins de 3 mois (ou équivalent) ;</li>
              <li style={listItemStyle}>transmettre une pièce d&apos;identité ou passeport du représentant légal ;</li>
              <li style={listItemStyle}>fournir des informations exactes, complètes et à jour.</li>
            </ul>
            <p style={paragraphStyle}>
              La Société peut refuser, suspendre ou supprimer un compte en cas d&apos;informations inexactes, trompeuses ou frauduleuses.
            </p>

            <h2 style={sectionTitleStyle}>Article 6 – Durée des annonces</h2>
            <p style={paragraphStyle}>
              Chaque annonce est publiée pour une durée maximale de six (6) mois.
              À l&apos;issue de cette période, elle pourra être renouvelée moyennant nouveau paiement.
              La Société peut retirer ou suspendre toute annonce en cas de non-respect des CGV ou d&apos;obligation légale.
            </p>

            <h2 style={sectionTitleStyle}>Article 7 – Tarifs</h2>
            <p style={paragraphStyle}>
              Les services de la plateforme sont fournis moyennant le paiement d&apos;un abonnement mensuel, selon les
              formules suivantes :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>
                <strong>Start</strong> : gratuit, limité à 50 annonces actives
              </li>
              <li style={listItemStyle}>
                <strong>Plus</strong> : 99 € HT par mois, jusqu&apos;à 200 annonces actives
              </li>
              <li style={listItemStyle}>
                <strong>Pro</strong> : 325 € HT par mois, jusqu&apos;à 800 annonces actives
              </li>
            </ul>
            <p style={paragraphStyle}>
              Les tarifs applicables sont ceux affichés au moment de la souscription. La TVA est appliquée selon la
              réglementation en vigueur.
            </p>
            <p style={paragraphStyle}>
              La Société se réserve le droit de modifier ses tarifs à tout moment pour l&apos;avenir. En cas de
              modification, un préavis raisonnable sera communiqué aux Vendeurs.
            </p>

            <h2 style={sectionTitleStyle}>Article 8 – Paiement</h2>
            <p style={paragraphStyle}>
              8.1 Modalités
              <br />
              Le paiement de l&apos;abonnement est effectué à la souscription puis prélevé automatiquement à chaque échéance
              mensuelle via un prestataire de paiement sécurisé.
            </p>
            <p style={paragraphStyle}>
              8.2 Suspension pour non-paiement
              <br />
              En cas de défaut ou d&apos;incident de paiement, l&apos;accès aux services pourra être suspendu ou résilié
              jusqu&apos;à régularisation.
            </p>
            <p style={paragraphStyle}>
              8.3 Sommes acquises
              <br />
              Toute somme versée pour la période en cours est définitivement acquise, sauf inexécution du service ou
              disposition légale impérative contraire.
            </p>
            <p style={paragraphStyle}>
              8.4 Renonciation au droit de rétractation
              <br />
              Le Vendeur reconnaît que l&apos;exécution du service commence immédiatement après la souscription et renonce
              expressément à tout droit de rétractation pour la période en cours.
            </p>

            <h2 style={sectionTitleStyle}>Article 9 – Abonnements</h2>
            <p style={paragraphStyle}>
              9.1 Durée
              <br />
              Les abonnements sont conclus pour une durée mensuelle.
            </p>
            <p style={paragraphStyle}>
              9.2 Reconduction
              <br />
              Les abonnements sont reconduits automatiquement pour des périodes successives d&apos;un mois, sauf résiliation
              par le Vendeur.
            </p>
            <p style={paragraphStyle}>
              9.3 Paiement
              <br />
              Le paiement est effectué à la souscription puis prélevé automatiquement à chaque échéance mensuelle.
            </p>
            <p style={paragraphStyle}>
              9.4 Résiliation
              <br />
              Le Vendeur peut résilier son abonnement à tout moment depuis son compte.
              <br />
              La résiliation prend effet à la fin de la période en cours.
              <br />
              Aucun remboursement n&apos;est effectué pour la période déjà payée.
            </p>
            <p style={paragraphStyle}>
              9.5 Suspension
              <br />
              En cas de non-paiement ou de violation des CGV, la Société peut suspendre ou résilier l&apos;abonnement.
            </p>

            <h2 style={sectionTitleStyle}>Article 10 – Remises et offres promotionnelles</h2>
            <p style={paragraphStyle}>
              La Société peut accorder des remises ou offres promotionnelles à sa seule discrétion.
              Ces offres :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>peuvent être temporaires ou conditionnelles ;</li>
              <li style={listItemStyle}>ne créent aucun droit acquis ;</li>
              <li style={listItemStyle}>peuvent être modifiées ou supprimées à tout moment.</li>
            </ul>

            <h2 style={sectionTitleStyle}>Article 11 – Obligations et garanties du vendeur</h2>
            <p style={paragraphStyle}>
              Le Vendeur garantit :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>être propriétaire légitime des biens proposés ;</li>
              <li style={listItemStyle}>que les produits sont authentiques ;</li>
              <li style={listItemStyle}>qu&apos;ils ne sont ni contrefaits ni volés ;</li>
              <li style={listItemStyle}>qu&apos;ils respectent les droits de propriété intellectuelle ;</li>
              <li style={listItemStyle}>qu&apos;ils sont conformes aux lois applicables ;</li>
              <li style={listItemStyle}>qu&apos;il respecte ses obligations fiscales, sociales et douanières.</li>
            </ul>
            <p style={paragraphStyle}>
              Le Vendeur est seul responsable :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>du contenu des annonces ;</li>
              <li style={listItemStyle}>des informations publiées ;</li>
              <li style={listItemStyle}>de la relation contractuelle avec l&apos;Acheteur ;</li>
              <li style={listItemStyle}>des garanties légales ;</li>
              <li style={listItemStyle}>des réclamations et litiges.</li>
            </ul>

            <h2 style={sectionTitleStyle}>Article 12 – Interdictions</h2>
            <p style={paragraphStyle}>
              Sont strictement interdits :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>produits contrefaits ;</li>
              <li style={listItemStyle}>produits volés ;</li>
              <li style={listItemStyle}>biens interdits à la vente ;</li>
              <li style={listItemStyle}>annonces trompeuses ;</li>
              <li style={listItemStyle}>atteintes aux marques ou droits de tiers.</li>
            </ul>
            <p style={paragraphStyle}>
              La Société peut retirer tout contenu sans préavis.
            </p>
            <p style={paragraphStyle}>
              La Société se réserve également le droit de refuser toute annonce portant atteinte à l&apos;image ou au
              positionnement haut de gamme de la plateforme.
            </p>

            <h2 style={sectionTitleStyle}>Article 13 – Responsabilité</h2>
            <p style={paragraphStyle}>
              <strong>13.1 Responsabilité du Vendeur</strong><br />
              Le Vendeur indemnisera intégralement la Société de toute réclamation, condamnation, frais, dommages et intérêts, honoraires d&apos;avocat ou procédure résultant :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>d&apos;une violation des CGV ;</li>
              <li style={listItemStyle}>d&apos;une contrefaçon ;</li>
              <li style={listItemStyle}>d&apos;une fraude ;</li>
              <li style={listItemStyle}>d&apos;informations inexactes fournies par le Vendeur ;</li>
              <li style={listItemStyle}>d&apos;un manquement aux obligations légales.</li>
            </ul>
            <p style={paragraphStyle}>
              <strong>13.2 Responsabilité de la Société</strong><br />
              La Société est responsable uniquement de la bonne exécution de ses services techniques, dans les limites autorisées par la loi applicable.
              Elle ne saurait être tenue responsable, notamment :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>des litiges entre Vendeur et Acheteur ;</li>
              <li style={listItemStyle}>des pertes indirectes ;</li>
              <li style={listItemStyle}>des pertes d&apos;exploitation ;</li>
              <li style={listItemStyle}>des pertes de chiffre d&apos;affaires ;</li>
              <li style={listItemStyle}>des atteintes à l&apos;image ;</li>
              <li style={listItemStyle}>des données perdues ;</li>
              <li style={listItemStyle}>des cyberattaques, intrusions ou virus ;</li>
              <li style={listItemStyle}>des interruptions liées à des opérations de maintenance ;</li>
              <li style={listItemStyle}>d&apos;une faute, négligence ou information inexacte fournie par le Vendeur ;</li>
              <li style={listItemStyle}>d&apos;un cas de force majeure.</li>
            </ul>
            <p style={paragraphStyle}>
              La responsabilité totale de la Société est strictement plafonnée au montant total HT versé par le Vendeur au cours des douze (12) derniers mois précédant le fait générateur.
            </p>

            <h2 style={sectionTitleStyle}>Article 14 – Suspension technique</h2>
            <p style={paragraphStyle}>
              La Société peut suspendre temporairement l&apos;accès à la Plateforme pour des raisons techniques, de maintenance, de mise à jour, de sécurité ou en cas d&apos;incident affectant le fonctionnement du service.
              Ces suspensions n&apos;ouvrent droit à aucune indemnisation.
            </p>

            <h2 style={sectionTitleStyle}>Article 15 – Résiliation</h2>
            <p style={paragraphStyle}>
              <strong>15.1 Résiliation par le Vendeur</strong><br />
              Le Vendeur peut résilier son compte à tout moment.
              Les sommes versées restent acquises.
            </p>
            <p style={paragraphStyle}>
              <strong>15.2 Résiliation par la Société</strong><br />
              La Société peut suspendre ou résilier sans préavis en cas de :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>fraude ;</li>
              <li style={listItemStyle}>contrefaçon ;</li>
              <li style={listItemStyle}>manquement grave ;</li>
              <li style={listItemStyle}>violation des CGV ;</li>
              <li style={listItemStyle}>obligation légale.</li>
            </ul>

            <h2 style={sectionTitleStyle}>Article 16 – Propriété intellectuelle</h2>
            <p style={paragraphStyle}>
              Le Vendeur concède à la Société une licence non exclusive, gratuite et mondiale d&apos;utilisation des contenus publiés aux fins d&apos;exploitation, promotion et diffusion de la Plateforme.
              La Société demeure titulaire de tous droits relatifs à la Plateforme et à ses bases de données.
            </p>

            <h2 style={sectionTitleStyle}>Article 17 – Conservation et archivage</h2>
            <p style={paragraphStyle}>
              La Société pourra conserver ou archiver les données et annonces pendant une durée conforme aux obligations légales et à ses besoins probatoires.
              Après résiliation, les données pourront être supprimées dans un délai raisonnable.
            </p>

            <h2 style={sectionTitleStyle}>Article 18 – Force majeure</h2>
            <p style={paragraphStyle}>
              La Société ne pourra être tenue responsable en cas d&apos;événement imprévisible, irrésistible et extérieur empêchant l&apos;exécution du service.
            </p>

            <h2 style={sectionTitleStyle}>Article 19 – Modification des CGV</h2>
            <p style={paragraphStyle}>
              La Société peut modifier les CGV.
              Les modifications seront notifiées avec un délai raisonnable avant leur entrée en vigueur.
              En cas de refus, le Vendeur pourra résilier son compte avant l&apos;entrée en vigueur des nouvelles conditions.
              La poursuite de l&apos;utilisation vaut acceptation.
            </p>

            <h2 style={sectionTitleStyle}>Article 20 – Prescription</h2>
            <p style={paragraphStyle}>
              Toute action se prescrit conformément aux délais légaux applicables.
            </p>

            <h2 style={sectionTitleStyle}>Article 21 – Intégralité – Non-renonciation – Divisibilité</h2>
            <p style={paragraphStyle}>
              Les CGV constituent l&apos;intégralité de l&apos;accord entre les parties.
              Le fait pour la Société de ne pas se prévaloir d&apos;une clause ne vaut pas renonciation.
              Si une clause est déclarée nulle, les autres demeurent applicables.
            </p>

            <h2 style={sectionTitleStyle}>Article 22 – Hiérarchie contractuelle</h2>
            <p style={paragraphStyle}>
              En cas de contradiction entre les présentes CGV et les Conditions Générales d&apos;Utilisation (CGU) de la Plateforme, les CGV prévalent pour toutes les relations commerciales entre la Société et le Vendeur.
            </p>

            <h2 style={sectionTitleStyle}>Article 23 – Cession</h2>
            <p style={paragraphStyle}>
              La Société peut céder les présentes CGV dans le cadre d&apos;une fusion, restructuration ou cession d&apos;activité.
            </p>

            <h2 style={sectionTitleStyle}>Article 24 – Droit applicable – Juridiction</h2>
            <p style={paragraphStyle}>
              Les présentes CGV sont régies par le droit français.
              Tout litige entre professionnels relève de la compétence exclusive des tribunaux du ressort du siège social de la Société, y compris en cas de pluralité de défendeurs ou d&apos;appel en garantie.
</p>
        </div>

        <p className="conditions-page-back-link" style={{ textAlign: 'center', marginTop: 28, fontSize: 15, color: '#6e6e73' }}>
          <Link href="/" style={{ color: '#1d1d1f', fontWeight: 500 }}>Retour à l&apos;accueil</Link>
        </p>
      </div>
    </div>
  </div>
  );
}
