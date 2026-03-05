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
const subTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#1d1d1f',
  marginTop: 20,
  marginBottom: 8,
};

export default function PolitiqueConfidentialitePage() {
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
              Politique de confidentialité et cookies
            </h1>
            <p style={{ fontSize: 15, color: '#6e6e73', marginBottom: 4 }}>Section Luxe</p>
            <p style={{ fontSize: 13, color: '#86868b' }}>Dernière mise à jour : 22/02/2026</p>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h2 style={{ ...sectionTitleStyle, marginTop: 0 }}>1. Responsable du traitement</h2>
            <p style={paragraphStyle}>
              Le site exploité sous la marque Section Luxe est édité par :
            </p>
            <p style={paragraphStyle}>
              <strong>SL INVEST</strong><br />
              SAS au capital de 1 000 €<br />
              Siège social : Boulevard Murat, 75016 Paris, France<br />
              RCS Paris : 912 345 678<br />
              TVA intracommunautaire : FR 12 912345678<br />
              Email : <a href="mailto:contact.sectionluxe@gmail.com" style={{ color: '#6e6e73', textDecoration: 'none' }}>contact.sectionluxe@gmail.com</a>
            </p>
            <p style={paragraphStyle}>
              SL INVEST agit en qualité de Responsable du traitement au sens du Règlement (UE) 2016/679 du 27 avril 2016 (RGPD).
              Aucun délégué à la protection des données (DPO) n&apos;a été désigné à ce jour.
            </p>

            <h2 style={sectionTitleStyle}>2. Principes applicables</h2>
            <p style={paragraphStyle}>
              SL INVEST s&apos;engage à respecter les principes suivants :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>licéité, loyauté et transparence ;</li>
              <li style={listItemStyle}>limitation des finalités ;</li>
              <li style={listItemStyle}>minimisation des données ;</li>
              <li style={listItemStyle}>exactitude ;</li>
              <li style={listItemStyle}>limitation de la conservation ;</li>
              <li style={listItemStyle}>intégrité et confidentialité ;</li>
              <li style={listItemStyle}>responsabilité (accountability).</li>
            </ul>

            <h2 style={sectionTitleStyle}>3. Origine des données</h2>
            <p style={paragraphStyle}>
              Les données personnelles sont collectées :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>directement auprès des utilisateurs lors de la création de compte, de la publication d&apos;une annonce ou d&apos;une prise de contact ;</li>
              <li style={listItemStyle}>automatiquement lors de la navigation sur la plateforme (données techniques, cookies).</li>
            </ul>
            <p style={paragraphStyle}>
              Aucune donnée n&apos;est achetée auprès de tiers.
            </p>

            <h2 style={sectionTitleStyle}>4. Données collectées</h2>
            <p style={subTitleStyle}>4.1 Visiteurs / Acheteurs potentiels avec compte</p>
            <p style={paragraphStyle}>
              Dans le cadre de la mise en relation avec un vendeur professionnel :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>Nom</li>
              <li style={listItemStyle}>Prénom</li>
              <li style={listItemStyle}>Adresse email</li>
              <li style={listItemStyle}>Numéro de téléphone (facultatif)</li>
            </ul>
            <p style={paragraphStyle}>
              Ces informations sont nécessaires à la mise en relation.
            </p>
            <p style={subTitleStyle}>4.2 Vendeurs professionnels</p>
            <p style={paragraphStyle}>
              Lors de la création et gestion d&apos;un compte :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>Nom et prénom du représentant légal</li>
              <li style={listItemStyle}>Raison sociale</li>
              <li style={listItemStyle}>Numéro SIRET</li>
              <li style={listItemStyle}>Adresse professionnelle</li>
              <li style={listItemStyle}>Email professionnel</li>
              <li style={listItemStyle}>Numéro de téléphone</li>
              <li style={listItemStyle}>Extrait Kbis</li>
              <li style={listItemStyle}>Pièce d&apos;identité ou passeport officielle valide</li>
            </ul>
            <p style={paragraphStyle}>
              Ces données sont nécessaires pour :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>vérifier l&apos;existence légale du vendeur ;</li>
              <li style={listItemStyle}>sécuriser la plateforme ;</li>
              <li style={listItemStyle}>prévenir la fraude et la contrefaçon ;</li>
              <li style={listItemStyle}>respecter les obligations légales.</li>
            </ul>
            <p style={subTitleStyle}>4.3 Données techniques</p>
            <p style={paragraphStyle}>
              Lors de l&apos;utilisation du site :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>Adresse IP</li>
              <li style={listItemStyle}>Données de connexion</li>
              <li style={listItemStyle}>Logs techniques</li>
              <li style={listItemStyle}>Données de navigation</li>
              <li style={listItemStyle}>Cookies</li>
            </ul>
            <p style={paragraphStyle}>
              Ces données assurent la sécurité, la stabilité et l&apos;amélioration du service.
            </p>

            <h2 style={sectionTitleStyle}>5. Caractère obligatoire des données</h2>
            <p style={paragraphStyle}>
              Les informations identifiées comme nécessaires sont obligatoires pour :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>créer un compte ;</li>
              <li style={listItemStyle}>publier une annonce ;</li>
              <li style={listItemStyle}>utiliser les services de la plateforme.</li>
            </ul>
            <p style={paragraphStyle}>
              À défaut de fourniture des informations requises, le service ne pourra être fourni.
            </p>

            <h2 style={sectionTitleStyle}>6. Finalités des traitements</h2>
            <p style={paragraphStyle}>
              Les données personnelles sont utilisées pour :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>la création et gestion des comptes ;</li>
              <li style={listItemStyle}>la mise en relation acheteurs / vendeurs ;</li>
              <li style={listItemStyle}>la gestion des paiements vendeurs ;</li>
              <li style={listItemStyle}>la vérification d&apos;identité ;</li>
              <li style={listItemStyle}>la prévention des fraudes et contenus illicites ;</li>
              <li style={listItemStyle}>le respect des obligations légales et comptables ;</li>
              <li style={listItemStyle}>la gestion des réclamations ;</li>
              <li style={listItemStyle}>l&apos;amélioration des services ;</li>
              <li style={listItemStyle}>la sécurité informatique.</li>
            </ul>
            <p style={paragraphStyle}>
              Aucune décision automatisée produisant des effets juridiques n&apos;est mise en œuvre.
            </p>

            <h2 style={sectionTitleStyle}>7. Bases légales</h2>
            <p style={paragraphStyle}>
              Les traitements reposent sur :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>l&apos;exécution contractuelle ;</li>
              <li style={listItemStyle}>l&apos;intérêt légitime de SL INVEST (sécurisation, lutte contre fraude) ;</li>
              <li style={listItemStyle}>le respect d&apos;obligations légales ;</li>
              <li style={listItemStyle}>le consentement (cookies non essentiels).</li>
            </ul>

            <h2 style={sectionTitleStyle}>8. Destinataires des données</h2>
            <p style={paragraphStyle}>
              Les données peuvent être transmises :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>aux vendeurs concernés (mise en relation) ;</li>
              <li style={listItemStyle}>aux prestataires techniques agissant en qualité de sous-traitants ;</li>
              <li style={listItemStyle}>aux autorités compétentes en cas d&apos;obligation légale.</li>
            </ul>
            <p style={paragraphStyle}>
              SL INVEST ne vend ni ne cède aucune donnée personnelle.
              L&apos;accès aux données est strictement limité aux personnes habilitées au sein de SL INVEST, soumises à une obligation de confidentialité.
            </p>

            <h2 style={sectionTitleStyle}>9. Sous-traitants</h2>
            <p style={paragraphStyle}>
              Les services suivants peuvent traiter certaines données :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>Hébergement : Vercel</li>
              <li style={listItemStyle}>Base de données : Supabase</li>
              <li style={listItemStyle}>Paiement : Stripe</li>
            </ul>
            <p style={paragraphStyle}>
              Les données bancaires ne sont jamais stockées par SL INVEST.
              Des contrats de sous-traitance conformes à l&apos;article 28 du RGPD encadrent ces traitements.
            </p>

            <h2 style={sectionTitleStyle}>10. Transferts hors Union européenne</h2>
            <p style={paragraphStyle}>
              Certains prestataires peuvent être situés hors Union européenne.
              Dans ce cas, des garanties appropriées sont mises en place :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>Clauses contractuelles types approuvées par la Commission européenne ;</li>
              <li style={listItemStyle}>Mesures techniques et organisationnelles complémentaires si nécessaire.</li>
            </ul>

            <h2 style={sectionTitleStyle}>11. Durée de conservation</h2>
            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, color: '#6e6e73' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e5e7' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#1d1d1f' }}>Catégorie</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#1d1d1f' }}>Durée</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e5e7' }}><td style={{ padding: '10px 12px' }}>Comptes actifs</td><td style={{ padding: '10px 12px' }}>Durée de la relation contractuelle</td></tr>
                  <tr style={{ borderBottom: '1px solid #e5e5e7' }}><td style={{ padding: '10px 12px' }}>Documents vendeurs</td><td style={{ padding: '10px 12px' }}>Relation contractuelle + archivage légal</td></tr>
                  <tr style={{ borderBottom: '1px solid #e5e5e7' }}><td style={{ padding: '10px 12px' }}>Prospects</td><td style={{ padding: '10px 12px' }}>3 ans après dernier contact</td></tr>
                  <tr style={{ borderBottom: '1px solid #e5e5e7' }}><td style={{ padding: '10px 12px' }}>Données comptables</td><td style={{ padding: '10px 12px' }}>10 ans</td></tr>
                  <tr style={{ borderBottom: '1px solid #e5e5e7' }}><td style={{ padding: '10px 12px' }}>Logs techniques</td><td style={{ padding: '10px 12px' }}>12 mois maximum</td></tr>
                  <tr style={{ borderBottom: '1px solid #e5e5e7' }}><td style={{ padding: '10px 12px' }}>Cookies</td><td style={{ padding: '10px 12px' }}>13 mois maximum</td></tr>
                </tbody>
              </table>
            </div>
            <p style={paragraphStyle}>
              À l&apos;issue des délais, les données sont supprimées ou anonymisées.
            </p>

            <h2 style={sectionTitleStyle}>12. Sécurité</h2>
            <p style={paragraphStyle}>
              SL INVEST met en œuvre des mesures techniques et organisationnelles adaptées :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>accès limité aux seules personnes habilitées ;</li>
              <li style={listItemStyle}>chiffrement des connexions (HTTPS) ;</li>
              <li style={listItemStyle}>sécurisation des bases de données ;</li>
              <li style={listItemStyle}>gestion des habilitations ;</li>
              <li style={listItemStyle}>surveillance des accès et journalisation.</li>
            </ul>
            <p style={paragraphStyle}>
              Malgré ces mesures, aucun système n&apos;est totalement invulnérable.
            </p>

            <h2 style={sectionTitleStyle}>13. Droits des personnes</h2>
            <p style={paragraphStyle}>
              Conformément au RGPD, vous disposez :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>droit d&apos;accès ;</li>
              <li style={listItemStyle}>droit de rectification ;</li>
              <li style={listItemStyle}>droit d&apos;effacement ;</li>
              <li style={listItemStyle}>droit à la limitation ;</li>
              <li style={listItemStyle}>droit d&apos;opposition ;</li>
              <li style={listItemStyle}>droit à la portabilité ;</li>
              <li style={listItemStyle}>droit de retirer votre consentement ;</li>
              <li style={listItemStyle}>droit de définir des directives relatives au sort de vos données après votre décès ;</li>
              <li style={listItemStyle}>droit d&apos;introduire une réclamation auprès de la CNIL.</li>
            </ul>
            <p style={paragraphStyle}>
              Pour exercer vos droits : <a href="mailto:contact.sectionluxe@gmail.com" style={{ color: '#6e6e73', textDecoration: 'none' }}>contact.sectionluxe@gmail.com</a><br />
              Une réponse sera apportée dans un délai maximal d&apos;un (1) mois.
            </p>

            <h2 style={sectionTitleStyle}>14. Réclamation</h2>
            <p style={paragraphStyle}>
              En cas de difficulté non résolue, vous pouvez saisir :<br />
              Commission Nationale de l&apos;Informatique et des Libertés (CNIL)<br />
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#6e6e73', textDecoration: 'none' }}>www.cnil.fr</a>
            </p>

            <h2 style={sectionTitleStyle}>15. Modification de la politique</h2>
            <p style={paragraphStyle}>
              La présente politique peut être modifiée à tout moment pour tenir compte :
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>d&apos;évolutions légales ;</li>
              <li style={listItemStyle}>d&apos;évolutions techniques ;</li>
              <li style={listItemStyle}>d&apos;évolutions de l&apos;activité.</li>
            </ul>
            <p style={paragraphStyle}>
              La version applicable est celle publiée en ligne à la date de consultation.
            </p>

            <h2 style={{ ...sectionTitleStyle, marginTop: 48 }}>Politique cookies</h2>
            <h3 style={subTitleStyle}>1. Définition</h3>
            <p style={paragraphStyle}>
              Un cookie est un fichier déposé sur votre terminal lors de la navigation.
            </p>
            <h3 style={subTitleStyle}>2. Catégories de cookies</h3>
            <p style={{ ...paragraphStyle, fontWeight: 600, color: '#1d1d1f' }}>Cookies strictement nécessaires</p>
            <p style={paragraphStyle}>Permettent :</p>
            <ul style={listStyle}>
              <li style={listItemStyle}>authentification ;</li>
              <li style={listItemStyle}>gestion de session ;</li>
              <li style={listItemStyle}>sécurisation ;</li>
              <li style={listItemStyle}>prévention fraude.</li>
            </ul>
            <p style={paragraphStyle}>Ils ne nécessitent pas de consentement.</p>
            <p style={{ ...paragraphStyle, fontWeight: 600, color: '#1d1d1f' }}>Cookies analytiques</p>
            <p style={paragraphStyle}>Permettent :</p>
            <ul style={listStyle}>
              <li style={listItemStyle}>mesure d&apos;audience ;</li>
              <li style={listItemStyle}>analyse des performances ;</li>
              <li style={listItemStyle}>amélioration de l&apos;expérience utilisateur.</li>
            </ul>
            <p style={paragraphStyle}>Activés uniquement après consentement.</p>
            <p style={{ ...paragraphStyle, fontWeight: 600, color: '#1d1d1f' }}>Cookies marketing</p>
            <p style={paragraphStyle}>
              Peuvent être utilisés pour : personnalisation publicitaire ; mesure de performance publicitaire.
              Activés uniquement après consentement explicite.
            </p>
            <h3 style={subTitleStyle}>3. Gestion du consentement</h3>
            <p style={paragraphStyle}>
              Lors de la première visite : un bandeau permet d&apos;accepter, refuser ou paramétrer les cookies ; le refus n&apos;empêche pas l&apos;accès aux fonctionnalités essentielles ; le consentement peut être retiré à tout moment.
            </p>
            <h3 style={subTitleStyle}>4. Durée de conservation</h3>
            <p style={paragraphStyle}>
              Les cookies sont conservés pour une durée maximale de 13 mois conformément aux recommandations de la CNIL.
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
