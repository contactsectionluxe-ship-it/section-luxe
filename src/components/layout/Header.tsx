'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Heart, MessageCircle, User, LogOut, Store, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/supabase/auth';

const navigation = [
  { name: 'À la une', href: '/' },
  { name: 'Catalogue', href: '/catalogue' },
  { name: 'À propos', href: '/a-propos' },
  { name: 'Devenir vendeur', href: '/inscription-vendeur' },
];

export function Header() {
  const { user, isAuthenticated, isSeller, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleClick = () => setUserMenuOpen(false);
    if (userMenuOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [userMenuOpen]);

  const linkStyle = {
    fontSize: 14,
    fontWeight: 500,
    color: '#6e6e73',
    transition: 'color 0.2s',
  };

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 72,
          overflow: 'visible',
          backgroundColor: scrolled ? 'rgba(251,251,251,0.92)' : '#fbfbfb',
          backdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          zIndex: 100,
          transition: 'background-color 0.2s, backdrop-filter 0.2s',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 24px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'flex-start' }}>
            <img src="/logo.png" alt="Section Luxe" style={{ height: 168, width: 'auto', display: 'block' }} />
          </Link>

          <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} style={linkStyle} onMouseEnter={(e) => (e.currentTarget.style.color = '#1d1d1f')} onMouseLeave={(e) => (e.currentTarget.style.color = '#6e6e73')}>
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/favoris"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 500,
                color: '#1d1d1f',
              }}
            >
              <Heart size={20} />
              <span>Favoris</span>
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/messages" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, color: '#6e6e73', borderRadius: 980 }}><MessageCircle size={20} /></Link>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, color: '#6e6e73', background: 'none', border: 'none', borderRadius: 980 }}
                  >
                    <User size={20} />
                  </button>
                  {userMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 52,
                        width: 240,
                        backgroundColor: '#fff',
                        borderRadius: 14,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ padding: '16px 18px', borderBottom: '1px solid #f5f5f7' }}>
                        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 2, color: '#1d1d1f' }}>{user?.displayName || 'Utilisateur'}</p>
                        <p style={{ fontSize: 13, color: '#86868b' }}>{user?.email}</p>
                      </div>
                      <div style={{ padding: 8 }}>
                        <Link href="/favoris" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10 }}><Heart size={18} /> Favoris</Link>
                        <Link href="/messages" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10 }}><MessageCircle size={18} /> Messages</Link>
                        {isSeller && <Link href="/vendeur" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10 }}><Store size={18} /> Espace vendeur</Link>}
                        {isAdmin && <Link href="/admin" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10 }}><Settings size={18} /> Administration</Link>}
                        <div style={{ height: 1, backgroundColor: '#f5f5f7', margin: '8px 0' }} />
                        <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', fontSize: 15, color: '#1d1d1f', background: 'none', border: 'none', textAlign: 'left', borderRadius: 10 }}><LogOut size={18} /> Déconnexion</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/connexion"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    padding: '10px 16px',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#1d1d1f',
                  }}
                >
                  <User size={20} />
                  <span>Connexion</span>
                </Link>
              </>
            )}
          </div>

          <button
            className="hide-desktop"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, background: 'none', border: 'none', color: '#1d1d1f', borderRadius: 12 }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="hide-desktop"
          style={{
            position: 'fixed',
            top: 72,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#fbfbfb',
            zIndex: 99,
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: 24 }}>
            <nav style={{ marginBottom: 32 }}>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ display: 'block', padding: '16px 0', fontSize: 17, fontWeight: 500, color: '#1d1d1f', borderBottom: '1px solid #f5f5f7' }}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            {isAuthenticated ? (
              <div>
                <p style={{ fontSize: 13, color: '#86868b', marginBottom: 16 }}>Connecté : {user?.email}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Link href="/favoris" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0' }}>Mes favoris</Link>
                  <Link href="/messages" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0' }}>Messages</Link>
                  {isSeller && <Link href="/vendeur" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0' }}>Espace vendeur</Link>}
                  {isAdmin && <Link href="/admin" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0' }}>Administration</Link>}
                  <button onClick={handleSignOut} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0', background: 'none', border: 'none', textAlign: 'left', marginTop: 12 }}>Déconnexion</button>
                </div>
              </div>
            ) : (
              <Link href="/connexion" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 50, padding: '0 32px', fontSize: 15, fontWeight: 500, border: '1.5px solid #d2d2d7', color: '#1d1d1f', borderRadius: 980 }}>Connexion</Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
