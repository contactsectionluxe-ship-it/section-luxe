import Link from 'next/link';
import { Heart, MessageCircle, User } from 'lucide-react';

const navigation = [
  { name: 'Catalogue', href: '/catalogue?reset=1' },
  { name: 'Occasion', href: '/catalogue?condition=occasion' },
  { name: 'Neuf', href: '/catalogue?condition=new' },
  { name: 'À propos', href: '/a-propos' },
  { name: 'Contact', href: '/contact' },
];

const linkStyle = { fontSize: 15, fontWeight: 500, color: '#6e6e73', padding: '8px 0' };
const iconSize = 22;
const headerIconCellSize = 24;
const headerFavorisIconSize = 24;
const headerMessagesIconSize = 20;
const iconLabelStyle = {
  display: 'flex' as const,
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
  gap: 2,
  padding: '10px 10px',
  minWidth: 64,
  maxWidth: 64,
  fontSize: 12,
  fontWeight: 500,
  color: '#6e6e73',
  boxSizing: 'border-box' as const,
};
const iconWrapStyle = {
  width: iconSize,
  height: iconSize,
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  color: '#1d1d1f',
  flexShrink: 0,
};
const headerActionLabelStyle = {
  display: 'block' as const,
  width: 64,
  maxWidth: 64,
  textAlign: 'center' as const,
  lineHeight: 1.2,
  overflow: 'hidden' as const,
  textOverflow: 'ellipsis' as const,
  whiteSpace: 'nowrap' as const,
};

/** Fallback du header : logo + menu toujours visibles, seul le libellé "Connexion" à droite peut être remplacé par le nom utilisateur après chargement. */
export function HeaderFallback() {
  return (
    <header
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fbfbfb',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="header-inner"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
          height: 72,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Link
          href="/"
          className="header-logo-link"
          aria-label="Accueil — Section Luxe"
          title="Accueil"
          style={{ display: 'flex', alignItems: 'center', marginLeft: 8, justifySelf: 'start', position: 'relative', zIndex: 1 }}
        >
          <img src="/logo.png" alt="" className="header-logo-img" style={{ height: 24, width: 'auto', display: 'block', marginTop: -4 }} />
        </Link>

        <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: '1mm' }}>
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} style={linkStyle}>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0, justifySelf: 'end' }}>
          <div className="hide-mobile header-actions" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <Link href="/favoris" className="header-action-favoris header-action-item" style={iconLabelStyle}>
              <div className="header-action-icon header-action-icon--favoris" style={{ ...iconWrapStyle, width: headerIconCellSize, height: headerIconCellSize }}>
                <Heart size={headerFavorisIconSize} strokeWidth={1.5} style={{ display: 'block', width: headerFavorisIconSize, height: headerFavorisIconSize }} aria-hidden />
              </div><span style={headerActionLabelStyle}>Favoris</span>
            </Link>
            <Link href="/messages" className="header-action-messages header-action-item" style={iconLabelStyle}>
              <div className="header-action-icon header-action-icon--messages" style={{ ...iconWrapStyle, width: headerIconCellSize, height: headerIconCellSize }}>
                <MessageCircle size={headerMessagesIconSize} strokeWidth={1.5} style={{ display: 'block', width: headerMessagesIconSize, height: headerMessagesIconSize }} aria-hidden />
              </div><span style={headerActionLabelStyle}>Messages</span>
            </Link>
            <Link href="/connexion" className="header-action-user header-action-item" style={{ ...iconLabelStyle, minWidth: 64 }}>
              <div className="header-action-icon header-action-icon--user" style={{ ...iconWrapStyle, width: headerIconCellSize, height: headerIconCellSize }}>
                <User size={iconSize} strokeWidth={1.5} style={{ display: 'block', width: iconSize, height: iconSize }} aria-hidden />
              </div><span style={headerActionLabelStyle}>Connexion</span>
            </Link>
          </div>
          <div className="hide-desktop" style={{ width: 44, height: 44 }} aria-hidden />
        </div>
      </div>
    </header>
  );
}
