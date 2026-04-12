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
const articleTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), Georgia, serif',
  fontSize: 17,
  fontWeight: 600,
  color: '#1d1d1f',
  letterSpacing: '-0.02em',
  marginTop: 24,
  marginBottom: 10,
};
const subSectionTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: '#1d1d1f',
  marginTop: 18,
  marginBottom: 6,
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

export default function CGUPage() {
  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div className="conditions-page-layout" style={{ padding: '30px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 720px 1fr', gap: 40, alignItems: 'flex-start' }}>
        <div className="conditions-page-sidebar-col" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ConditionsSidebar active="cgu" />
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
              Conditions générales d&apos;utilisation
            </h1>
            <p style={{ fontSize: 15, color: '#6e6e73', marginBottom: 4 }}>Section Luxe</p>
            <p style={{ fontSize: 13, color: '#86868b' }}>Dernière mise à jour : 22/06/2026</p>
          </div>

          <div className="conditions-page-card-wrap" style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <h2 style={{ ...sectionTitleStyle, marginTop: 0 }}>I. Dispositions générales communes</h2>

          <h3 style={articleTitleStyle}>Article 1 – Identification de l&apos;éditeur</h3>
          <p style={paragraphStyle}>
            Le site « Section Luxe » (ci-après la « Plateforme ») est édité par :
          </p>
          <p style={paragraphStyle}>
            <strong>SL INVEST</strong><br />
            SAS au capital de 1 000 €<br />
            Siège social : en création<br />
            RCS Paris : en création<br />
            SIRET : en création<br />
            TVA intracommunautaire : en création<br />
            Email : <a href="mailto:contact@sectionluxe.fr" style={{ color: '#6e6e73', textDecoration: 'none' }}>contact@sectionluxe.fr</a>
          </p>

          <h3 style={articleTitleStyle}>Article 2 – Acceptation et opposabilité</h3>
          <p style={paragraphStyle}>
            Les présentes Conditions Générales d&apos;Utilisation (ci-après les « CGU ») sont accessibles à tout moment sur la Plateforme dans une rubrique dédiée permettant leur consultation, téléchargement et impression.
            Toute personne accédant à la Plateforme reconnaît avoir pris connaissance des présentes CGU.
          </p>
          <h4 style={{ ...subSectionTitleStyle, marginTop: 12 }}>1. Acceptation par navigation</h4>
          <p style={paragraphStyle}>
            La simple consultation, navigation ou utilisation de la Plateforme vaut acceptation des stipulations applicables aux visiteurs, notamment celles relatives à la responsabilité, à la propriété intellectuelle et au fonctionnement du service.
          </p>
          <h4 style={subSectionTitleStyle}>2. Acceptation expresse pour les utilisateurs identifiés</h4>
          <p style={paragraphStyle}>
            La création d&apos;un compte, la publication d&apos;une annonce, l&apos;accès à un espace personnel, ou toute action impliquant une identification ou un paiement nécessite l&apos;acceptation préalable, expresse et sans réserve des présentes CGU.
            Cette acceptation s&apos;effectue par le biais d&apos;une case à cocher non pré-cochée accompagnée d&apos;un mécanisme de validation.
            La validation électronique constitue une acceptation ferme et définitive des CGU.
          </p>
          <h4 style={subSectionTitleStyle}>3. Preuve de l&apos;acceptation</h4>
          <p style={paragraphStyle}>
            Les données informatiques, enregistrements électroniques, logs de connexion et confirmations conservés par la Société constituent la preuve de l&apos;acceptation des CGU et des opérations effectuées.
            L&apos;utilisateur reconnaît leur valeur probante.
          </p>
          <h4 style={subSectionTitleStyle}>4. Opposabilité</h4>
          <p style={paragraphStyle}>
            Les CGU sont opposables à compter de leur acceptation.
            En cas de modification des CGU, la poursuite de l&apos;utilisation de la Plateforme après information de l&apos;utilisateur vaut acceptation des nouvelles conditions.
          </p>
          <h4 style={subSectionTitleStyle}>5. Refus</h4>
          <p style={paragraphStyle}>
            En cas de désaccord avec tout ou partie des CGU, l&apos;utilisateur doit immédiatement cesser toute utilisation de la Plateforme.
          </p>

          <h3 style={articleTitleStyle}>Article 3 – Objet de la plateforme</h3>
          <p style={paragraphStyle}>
            La Plateforme permet :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>la publication d&apos;annonces par des vendeurs professionnels ;</li>
            <li style={listItemStyle}>la mise en relation entre vendeurs et visiteurs/acheteurs.</li>
          </ul>
          <p style={paragraphStyle}>
            La Société fournit un service d&apos;intermédiation technique exclusivement.
          </p>

          <h3 style={articleTitleStyle}>Article 4 – Rôle strictement technique</h3>
          <p style={paragraphStyle}>
            La Société :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>n&apos;est jamais propriétaire des biens ;</li>
            <li style={listItemStyle}>n&apos;achète ni ne revend ;</li>
            <li style={listItemStyle}>ne fixe aucun prix ;</li>
            <li style={listItemStyle}>n&apos;intervient pas dans la négociation ;</li>
            <li style={listItemStyle}>n&apos;intervient pas dans la conclusion du contrat ;</li>
            <li style={listItemStyle}>n&apos;encaisse aucun prix de vente ;</li>
            <li style={listItemStyle}>n&apos;intervient pas dans les paiements ;</li>
            <li style={listItemStyle}>n&apos;assure ni livraison ni logistique ;</li>
            <li style={listItemStyle}>n&apos;assure aucun service après-vente ;</li>
            <li style={listItemStyle}>n&apos;agit ni comme mandataire, ni agent commercial, ni commissionnaire, ni courtier.</li>
          </ul>
          <p style={paragraphStyle}>
            Aucune relation de mandat, agence, société de fait, co-entreprise ou exclusivité n&apos;est créée.
            Aucun volume minimum de ventes ni aucune exclusivité ne sont garantis.
            La Société ne garantit aucun chiffre d&apos;affaires, trafic ou visibilité minimale.
          </p>

          <h3 style={articleTitleStyle}>Article 5 – Statut d&apos;hébergeur (LCEN – DSA)</h3>
          <p style={paragraphStyle}>
            La Société agit en qualité d&apos;hébergeur au sens :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>de la loi n°2004-575 du 21 juin 2004 (LCEN) ;</li>
            <li style={listItemStyle}>du Règlement (UE) 2022/2065 (Digital Services Act).</li>
          </ul>
          <p style={paragraphStyle}>
            Elle n&apos;est soumise à aucune obligation générale de surveillance.
            Sa responsabilité ne peut être engagée qu&apos;en cas de connaissance effective d&apos;un contenu manifestement illicite et d&apos;absence de retrait prompt.
          </p>
          <p style={paragraphStyle}>
            Point de contact DSA : <a href="mailto:contact@sectionluxe.fr" style={{ color: '#6e6e73', textDecoration: 'none' }}>contact@sectionluxe.fr</a>
          </p>

          <h3 style={articleTitleStyle}>Article 6 – Classement des annonces</h3>
          <p style={paragraphStyle}>
            Les annonces sont classées selon des critères automatisés, notamment :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>date de publication ;</li>
            <li style={listItemStyle}>pertinence des mots-clés ;</li>
            <li style={listItemStyle}>catégorie sélectionnée ;</li>
            <li style={listItemStyle}>nombre de « likes ».</li>
          </ul>
          <p style={paragraphStyle}>
            Le classement ne repose pas sur une relation capitalistique ou contractuelle particulière.
            Aucune priorisation payante n&apos;est appliquée, sauf mention explicite.
          </p>

          <h3 style={articleTitleStyle}>Article 7 – Création et gestion de compte</h3>
          <p style={paragraphStyle}>
            L&apos;utilisateur s&apos;engage à fournir des informations exactes et à jour.
          </p>
          <p style={paragraphStyle}>
            Il est interdit :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>de créer plusieurs comptes ;</li>
            <li style={listItemStyle}>d&apos;usurper l&apos;identité d&apos;un tiers ;</li>
            <li style={listItemStyle}>d&apos;utiliser le compte d&apos;autrui.</li>
          </ul>
          <p style={paragraphStyle}>
            L&apos;utilisateur est seul responsable de la confidentialité de ses identifiants.
            La Société peut suspendre tout compte en cas d&apos;usage frauduleux.
          </p>

          <h3 style={articleTitleStyle}>Article 8 – Procédure de signalement</h3>
          <p style={paragraphStyle}>
            Toute notification doit comporter :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>identité complète du notifiant ;</li>
            <li style={listItemStyle}>URL précise ;</li>
            <li style={listItemStyle}>description détaillée ;</li>
            <li style={listItemStyle}>fondement juridique ;</li>
            <li style={listItemStyle}>déclaration sur l&apos;honneur.</li>
          </ul>
          <p style={paragraphStyle}>
            Toute notification abusive engage la responsabilité de son auteur.
          </p>

          <h3 style={articleTitleStyle}>Article 9 – Absence d&apos;authentification et garanties</h3>

          <h4 style={subSectionTitleStyle}>9.1 Absence de vérification physique ou certification</h4>
          <p style={paragraphStyle}>
            La Société ne procède à aucune authentification physique, expertise ou certification des produits publiés par les vendeurs professionnels.
          </p>

          <h4 style={subSectionTitleStyle}>9.2 Responsabilité du vendeur</h4>
          <p style={paragraphStyle}>Le vendeur est seul responsable :</p>
          <ul style={listStyle}>
            <li style={listItemStyle}>De l&apos;authenticité et de la conformité de ses produits ;</li>
            <li style={listItemStyle}>Du respect des droits de propriété intellectuelle et légaux ;</li>
            <li style={listItemStyle}>Des informations publiées sur les annonces ;</li>
            <li style={listItemStyle}>Du service après-vente, de la livraison et des garanties légales.</li>
          </ul>

          <h4 style={subSectionTitleStyle}>9.3 Limitation de la responsabilité de la Société</h4>
          <p style={paragraphStyle}>
            La Plateforme est fournie « en l&apos;état » et « selon disponibilité ». La Société ne garantit ni :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>L&apos;authenticité, l&apos;absence de contrefaçon ou de vol des biens ;</li>
            <li style={listItemStyle}>La conformité des informations publiées aux usages ou lois locales ;</li>
            <li style={listItemStyle}>L&apos;aboutissement d&apos;une transaction ou le succès commercial d&apos;une annonce.</li>
          </ul>

          <h3 style={articleTitleStyle}>Article 10 – Modèle économique</h3>

          <h4 style={subSectionTitleStyle}>10.1 Formules d&apos;abonnement</h4>
          <p style={paragraphStyle}>La Société propose les formules suivantes :</p>
          <ul style={listStyle}>
            <li style={listItemStyle}>Start : gratuit, limité à 50 annonces actives ;</li>
            <li style={listItemStyle}>Plus : 99 € HT par mois, jusqu&apos;à 200 annonces actives ;</li>
            <li style={listItemStyle}>Pro : 325 € HT par mois, jusqu&apos;à 800 annonces actives.</li>
          </ul>

          <h4 style={subSectionTitleStyle}>10.2 Modalités et reconduction</h4>
          <ul style={listStyle}>
            <li style={listItemStyle}>Les abonnements sont conclus pour une durée mensuelle ;</li>
            <li style={listItemStyle}>
              La reconduction est automatique pour des périodes successives d&apos;un mois, sauf résiliation par le vendeur ;
            </li>
            <li style={listItemStyle}>
              Le paiement est effectué à la souscription puis prélevé automatiquement à chaque échéance.
            </li>
          </ul>

          <h4 style={subSectionTitleStyle}>10.3 Suspension et résiliation</h4>
          <ul style={listStyle}>
            <li style={listItemStyle}>
              En cas de non-paiement ou de violation des CGU/CGV, la Société peut suspendre ou résilier l&apos;abonnement ;
            </li>
            <li style={listItemStyle}>
              La résiliation prend effet à la fin de la période en cours ; aucun remboursement n&apos;est effectué pour la période déjà payée.
            </li>
          </ul>

          <h4 style={subSectionTitleStyle}>10.4 Renonciation au droit de rétractation</h4>
          <p style={paragraphStyle}>
            Le vendeur reconnaît que le service commence immédiatement après la souscription et renonce expressément à tout droit de rétractation pour la période en cours, conformément à la réglementation applicable aux services numériques.
          </p>

          <h4 style={subSectionTitleStyle}>10.5 Modification des tarifs</h4>
          <p style={paragraphStyle}>
            La Société se réserve le droit de modifier les tarifs à tout moment pour l&apos;avenir. Un préavis raisonnable sera communiqué aux abonnés avant toute modification.
          </p>

          <h4 style={subSectionTitleStyle}>10.6 Remises et offres promotionnelles</h4>
          <p style={paragraphStyle}>
            La Société peut accorder, à sa seule discrétion, des remises, offres promotionnelles ou conditions tarifaires particulières :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>Ces remises peuvent être temporaires ou conditionnelles ;</li>
            <li style={listItemStyle}>Elles peuvent être réservées à certaines catégories d&apos;utilisateurs ;</li>
            <li style={listItemStyle}>Elles ne créent aucun droit acquis pour l&apos;avenir ;</li>
            <li style={listItemStyle}>Elles peuvent être modifiées ou supprimées à tout moment.</li>
          </ul>
          <p style={paragraphStyle}>
            L&apos;application d&apos;une remise pour une opération donnée ne saurait obliger la Société à reconduire cette remise ultérieurement.
          </p>

          <h3 style={articleTitleStyle}>Article 11 – Durée des annonces</h3>
          <p style={paragraphStyle}>Durée maximale : 6 mois.</p>
          <p style={paragraphStyle}>La Société peut retirer toute annonce en cas :</p>
          <ul style={listStyle}>
            <li style={listItemStyle}>de fraude ;</li>
            <li style={listItemStyle}>de suspicion de contrefaçon ;</li>
            <li style={listItemStyle}>de violation des CGU ;</li>
            <li style={listItemStyle}>d&apos;obligation légale.</li>
          </ul>

          <h3 style={articleTitleStyle}>Article 12 – Fraude / Blanchiment</h3>
          <p style={paragraphStyle}>
            La Société peut suspendre ou bloquer tout compte en cas de suspicion :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>de fraude ;</li>
            <li style={listItemStyle}>de blanchiment ;</li>
            <li style={listItemStyle}>d&apos;activité illicite ;</li>
            <li style={listItemStyle}>de contrefaçon.</li>
          </ul>

          <h3 style={articleTitleStyle}>Article 13 – Disponibilité – Maintenance – Force majeure</h3>
          <p style={paragraphStyle}>
            La Société peut suspendre ou interrompre l&apos;accès au service sans indemnité pour :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>maintenance ;</li>
            <li style={listItemStyle}>mise à jour ;</li>
            <li style={listItemStyle}>bug ;</li>
            <li style={listItemStyle}>incident technique ;</li>
            <li style={listItemStyle}>cyberattaque ;</li>
            <li style={listItemStyle}>force majeure.</li>
          </ul>
          <p style={paragraphStyle}>
            La Société ne peut être tenue responsable en cas d&apos;événement imprévisible, irrésistible et extérieur.
          </p>

          <h3 style={articleTitleStyle}>Article 14 – Sécurité informatique</h3>
          <p style={paragraphStyle}>
            La Société met en œuvre des mesures raisonnables de sécurité.
            Elle ne garantit pas l&apos;absence totale :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>d&apos;intrusion ;</li>
            <li style={listItemStyle}>de virus ;</li>
            <li style={listItemStyle}>d&apos;accès non autorisé ;</li>
            <li style={listItemStyle}>de défaillance technique.</li>
          </ul>

          <h3 style={articleTitleStyle}>Article 15 – Propriété intellectuelle</h3>
          <p style={paragraphStyle}>
            La Plateforme, ses éléments, textes, bases de données, logo et structure sont protégés.
            La Société est producteur de la base de données.
            Toute extraction, reproduction ou réutilisation substantielle est interdite.
          </p>

          <h3 style={articleTitleStyle}>Article 16 – Preuve</h3>
          <p style={paragraphStyle}>
            Les enregistrements informatiques de la Société font foi entre les parties.
          </p>

          <h3 style={articleTitleStyle}>Article 17 – Responsabilité – Limitation</h3>
          <p style={paragraphStyle}>
            La Société ne peut être tenue responsable :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>des litiges entre utilisateurs ;</li>
            <li style={listItemStyle}>des produits contrefaits ou volés ;</li>
            <li style={listItemStyle}>des pertes indirectes ;</li>
            <li style={listItemStyle}>des pertes d&apos;exploitation ;</li>
            <li style={listItemStyle}>des pertes de chance ;</li>
            <li style={listItemStyle}>des dommages immatériels.</li>
          </ul>
          <p style={paragraphStyle}>
            Responsabilité plafonnée : aux sommes versées au cours des 12 derniers mois ; à défaut, 100 € maximum.
            Sauf faute lourde ou dolosive.
          </p>

          <h3 style={articleTitleStyle}>Article 18 – Modification des CGU</h3>
          <p style={paragraphStyle}>
            La Société peut modifier les CGU à tout moment.
            Les utilisateurs seront informés.
            La poursuite d&apos;utilisation vaut acceptation.
          </p>

          <h3 style={articleTitleStyle}>Article 19 – Cession</h3>
          <p style={paragraphStyle}>
            La Société peut céder les présentes CGU en cas de restructuration, fusion ou cession.
          </p>

          <h3 style={articleTitleStyle}>Article 20 – Survie</h3>
          <p style={paragraphStyle}>
            Les clauses relatives à la responsabilité, limitation, indemnisation, propriété intellectuelle, preuve et droit applicable survivent à la résiliation.
          </p>

          <h3 style={articleTitleStyle}>Article 21 – Médiation</h3>

          <h4 style={subSectionTitleStyle}>21.1 Accès à la médiation</h4>
          <p style={paragraphStyle}>
            Conformément aux dispositions légales applicables, les utilisateurs (consommateurs) peuvent saisir gratuitement un médiateur de la consommation en cas de litige non résolu à l&apos;amiable.
          </p>

          <h4 style={subSectionTitleStyle}>21.2 Limitation B2B</h4>
          <p style={paragraphStyle}>
            Pour les vendeurs professionnels, l&apos;usage de la médiation n&apos;est pas obligatoire. Tout litige entre professionnels relève des tribunaux compétents selon le droit applicable (Article 23 CGU/CGV).
          </p>

          <h4 style={subSectionTitleStyle}>21.3 Contact médiation</h4>
          <p style={paragraphStyle}>
            L&apos;utilisateur peut demander les coordonnées du médiateur à l&apos;adresse : contact@sectionluxe.fr
          </p>

          <h3 style={articleTitleStyle}>Article 22 – Langue</h3>
          <p style={paragraphStyle}>
            La version française fait foi.
          </p>

          <h3 style={articleTitleStyle}>Article 23 – Droit applicable</h3>
          <p style={paragraphStyle}>
            Droit français.
            Tribunaux de Paris compétents pour les professionnels.
            Les consommateurs bénéficient des règles impératives de leur pays de résidence.
          </p>

          <h2 style={sectionTitleStyle}>II. Dispositions visiteurs / acheteurs</h2>
          <p style={paragraphStyle}>
            Les acheteurs contractent exclusivement avec les vendeurs.
            La Société :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>n&apos;est pas partie au contrat ;</li>
            <li style={listItemStyle}>n&apos;intervient pas dans le paiement ;</li>
            <li style={listItemStyle}>n&apos;assure aucune garantie commerciale ;</li>
            <li style={listItemStyle}>n&apos;assure aucun service après-vente.</li>
          </ul>
          <p style={paragraphStyle}>
            Les garanties légales sont dues uniquement par le vendeur.
          </p>

          <h2 style={sectionTitleStyle}>III. Dispositions vendeurs professionnels</h2>

          <h3 style={articleTitleStyle}>Article 1 – Vérification d&apos;identité (KYC)</h3>
          <p style={paragraphStyle}>
            Documents obligatoires :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>extrait Kbis &lt; 3 mois ;</li>
            <li style={listItemStyle}>CNI ou passeport valide ;</li>
            <li style={listItemStyle}>justificatif de lien avec la société.</li>
          </ul>
          <p style={paragraphStyle}>
            Les données sont conservées conformément à la réglementation applicable et à la <Link href="/politique-confidentialite" style={{ color: '#6e6e73', textDecoration: 'none' }}>Politique de confidentialité</Link>.
          </p>

          <h3 style={articleTitleStyle}>Article 2 – Obligations du vendeur</h3>
          <p style={paragraphStyle}>
            Le vendeur garantit :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>être professionnel légalement constitué ;</li>
            <li style={listItemStyle}>être propriétaire des biens ;</li>
            <li style={listItemStyle}>que les biens sont authentiques ;</li>
            <li style={listItemStyle}>qu&apos;ils ne sont ni volés ni contrefaits ;</li>
            <li style={listItemStyle}>respecter droit consommation, fiscalité et douanes ;</li>
            <li style={listItemStyle}>disposer de toutes autorisations nécessaires.</li>
          </ul>

          <h3 style={articleTitleStyle}>Article 3 – Responsabilité exclusive</h3>
          <p style={paragraphStyle}>
            Le vendeur est seul responsable :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>de l&apos;authenticité ;</li>
            <li style={listItemStyle}>de la conformité ;</li>
            <li style={listItemStyle}>de la livraison ;</li>
            <li style={listItemStyle}>des garanties légales ;</li>
            <li style={listItemStyle}>des réclamations clients.</li>
          </ul>

          <h3 style={articleTitleStyle}>Article 4 – Indemnisation</h3>
          <p style={paragraphStyle}>
            Le vendeur indemnisera intégralement la Société de toute réclamation, procédure, condamnation ou frais liés à ses produits.
          </p>

          <h3 style={articleTitleStyle}>Article 5 – Suspension / Résiliation</h3>
          <p style={paragraphStyle}>
            La Société peut suspendre ou supprimer sans préavis en cas :
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}>de fraude ;</li>
            <li style={listItemStyle}>de contrefaçon ;</li>
            <li style={listItemStyle}>de manquement grave ;</li>
            <li style={listItemStyle}>de violation légale.</li>
          </ul>
          <p style={paragraphStyle}>
            Aucun remboursement des annonces publiées.
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
