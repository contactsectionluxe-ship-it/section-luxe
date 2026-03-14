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
const iconLabelStyle = {
  display: 'flex' as const,
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
  gap: 2,
  padding: '10px 10px',
  minWidth: 64,
  fontSize: 12,
  fontWeight: 500,
  color: '#6e6e73',
};
const iconWrapStyle = {
  width: iconSize,
  height: iconSize,
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  color: '#1d1d1f',
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center', marginLeft: 8, justifySelf: 'start' }}>
          <img src="/logo.png" alt="Section Luxe" style={{ height: 24, width: 'auto', display: 'block', marginTop: -4 }} />
        </Link>

        <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: '1mm' }}>
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} style={linkStyle}>
              {item.name}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0, justifySelf: 'end' }}>
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <Link href="/favoris" style={iconLabelStyle}>
              <div style={iconWrapStyle}>
                <Heart size={iconSize} strokeWidth={1.5} />
              </div>
              <span>Favoris</span>
            </Link>
            <Link href="/messages" style={iconLabelStyle}>
              <div style={iconWrapStyle}>
                <MessageCircle size={20} strokeWidth={1.5} />
              </div>
              <span>Messages</span>
            </Link>
            <Link href="/connexion" style={{ ...iconLabelStyle, minWidth: 64 }}>
              <div style={{ ...iconWrapStyle, width: 24, height: 24 }}>
                <User size={24} strokeWidth={1.5} />
              </div>
              <span style={{ width: 64, textAlign: 'center' }}>Connexion</span>
            </Link>
          </div>
          <div className="hide-desktop" style={{ width: 44, height: 44 }} aria-hidden />
        </div>
      </div>
    </header>
  );
}
