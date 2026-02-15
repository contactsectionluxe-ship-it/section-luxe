'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Menu, X, Heart, MessageCircle, User, LogOut, Store, Settings, Package, FileText, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/supabase/auth';
import { isAdminEmail } from '@/lib/constants';
import { subscribeToConversations, getUserConversations } from '@/lib/supabase/messaging';
const navigation = [
  { name: 'À la une', href: '/' },
  { name: 'Catalogue', href: '/catalogue' },
  { name: 'À propos', href: '/a-propos' },
  { name: 'Devenir vendeur', href: '/inscription-vendeur' },
];

export function Header() {
  const { user, seller, isAuthenticated, isSeller, isAdmin } = useAuth();
  const showAdmin = isAdmin && isAdminEmail(user?.email);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

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

  const updateUnreadCount = useCallback(
    (conversations: { unreadBuyer: number; unreadSeller: number }[]) => {
      if (!user || !isAuthenticated) return;
      const role = isSeller ? 'seller' : 'buyer';
      const total = conversations.reduce((sum, c) => sum + (role === 'seller' ? c.unreadSeller : c.unreadBuyer), 0);
      setUnreadMessages(total);
    },
    [user?.uid, isAuthenticated, isSeller]
  );

  useEffect(() => {
    if (!user || !isAuthenticated) {
      setUnreadMessages(0);
      return;
    }
    const role = isSeller ? 'seller' : 'buyer';
    const unsubscribe = subscribeToConversations(user.uid, role, updateUnreadCount);
    return () => unsubscribe();
  }, [user?.uid, isAuthenticated, isSeller, updateUnreadCount]);

  const refreshUnread = useCallback(() => {
    if (!user || !isAuthenticated) return;
    const role = isSeller ? 'seller' : 'buyer';
    getUserConversations(user.uid, role).then(updateUnreadCount);
  }, [user?.uid, isAuthenticated, isSeller, updateUnreadCount]);

  // Rafraîchir le compteur quand l'onglet redevient visible (autre onglet, autre appareil)
  useEffect(() => {
    if (!user || !isAuthenticated) return;
    const onVisible = () => { if (document.visibilityState === 'visible') refreshUnread(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshUnread]);

  // Rafraîchir le compteur dès qu'une conversation est marquée lue (ouverture d'un fil)
  useEffect(() => {
    if (!user || !isAuthenticated) return;
    const onRefresh = () => refreshUnread();
    window.addEventListener('messages:refresh-unread', onRefresh);
    return () => window.removeEventListener('messages:refresh-unread', onRefresh);
  }, [refreshUnread]);

  const linkStyle = {
    fontSize: 14,
    fontWeight: 500,
    color: '#6e6e73',
    transition: 'color 0.2s',
  };

  const iconSize = 22;
  const iconLabelStyle = {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: 2,
    padding: '10px 10px',
    minWidth: 64,
    fontSize: 12,
    fontWeight: linkStyle.fontWeight,
    color: linkStyle.color,
  };
  const iconWrapStyle = {
    width: iconSize,
    height: iconSize,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    color: '#1d1d1f',
  };

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          overflow: 'visible',
          backgroundColor: scrolled ? 'rgba(251,251,251,0.92)' : '#fbfbfb',
          backdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          zIndex: 100,
          transition: 'background-color 0.2s, backdrop-filter 0.2s',
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
            <img src="/logo.png" alt="Section Luxe" style={{ height: 24, width: 'auto', display: 'block', marginTop: -3 }} />
          </Link>

          <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: '1mm' }}>
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} style={linkStyle} onMouseEnter={(e) => (e.currentTarget.style.color = '#1d1d1f')} onMouseLeave={(e) => (e.currentTarget.style.color = '#6e6e73')}>
                {item.name}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0, justifySelf: 'end' }}>
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <Link href="/favoris" style={iconLabelStyle}>
              <div style={iconWrapStyle}><Heart size={iconSize} strokeWidth={1.5} /></div>
              <span>Favoris</span>
            </Link>
            <Link href="/messages" style={iconLabelStyle}>
              <div style={{ position: 'relative', ...iconWrapStyle }}>
                <MessageCircle size={20} strokeWidth={1.5} />
                {unreadMessages > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      minWidth: 18,
                      height: 18,
                      padding: '0 5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#dc2626',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 9,
                      lineHeight: 1,
                    }}
                  >
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </div>
              <span>Messages</span>
            </Link>
            {isAuthenticated ? (
              <>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                    style={{
                      ...iconLabelStyle,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ ...iconWrapStyle, width: 24, height: 24 }}>
                      <User size={24} strokeWidth={1.5} />
                    </div>
                    <span>{(user?.displayName || '').trim().split(/\s+/)[0] || 'Compte'}</span>
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
                        zIndex: 110,
                      }}
                    >
                      <div style={{ padding: '16px 18px', borderBottom: '1px solid #f5f5f7' }}>
                        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 2, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName || 'Utilisateur'}</p>
                        <p style={{ fontSize: 13, color: '#86868b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                      </div>
                      <div style={{ padding: 8 }}>
                        {seller ? (
                          <>
                            <Link href="/vendeur/annonces/nouvelle" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10 }}><PlusCircle size={18} /> Déposer une annonce</Link>
                            <Link href="/vendeur" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10 }}><Package size={18} /> Mes annonces</Link>
                            <Link href="/messages" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10 }}><MessageCircle size={18} /> Ma messagerie {unreadMessages > 0 && <span style={{ marginLeft: 'auto', backgroundColor: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{unreadMessages > 99 ? '99+' : unreadMessages}</span>}</Link>
                            <Link href="/vendeur/factures" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10 }}><FileText size={18} /> Mes factures</Link>
                            <Link href="/vendeur/profil" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10 }}><User size={18} /> Mon profil</Link>
                            {showAdmin && <Link href="/admin" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10 }}><Settings size={18} /> Admin</Link>}
                            <div style={{ height: 1, backgroundColor: '#f5f5f7', margin: '8px 0' }} />
                            <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', fontSize: 15, color: '#1d1d1f', background: 'none', border: 'none', textAlign: 'left', borderRadius: 10 }}><LogOut size={18} /> Se déconnecter</button>
                          </>
                        ) : (
                          <>
                            <Link href="/favoris" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10 }}><Heart size={18} /> Favoris</Link>
                            <Link href="/messages" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10 }}><MessageCircle size={18} /> Messages {unreadMessages > 0 && <span style={{ marginLeft: 'auto', backgroundColor: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{unreadMessages > 99 ? '99+' : unreadMessages}</span>}</Link>
                            {showAdmin && <Link href="/admin" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10 }}><Settings size={18} /> Admin</Link>}
                            <div style={{ height: 1, backgroundColor: '#f5f5f7', margin: '8px 0' }} />
                            <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', fontSize: 15, color: '#1d1d1f', background: 'none', border: 'none', textAlign: 'left', borderRadius: 10 }}><LogOut size={18} /> Déconnexion</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/connexion" style={iconLabelStyle}>
                <div style={{ ...iconWrapStyle, width: 24, height: 24 }}><User size={24} strokeWidth={1.5} /></div>
                <span>Se connecter</span>
              </Link>
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
                <p style={{ fontSize: 13, color: '#86868b', marginBottom: 4 }}>Connecté</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', marginBottom: 16 }}>
                  {(user?.displayName || '').trim().split(/\s+/)[0] || user?.email || 'Compte'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {seller ? (
                    <>
                      <Link href="/vendeur/annonces/nouvelle" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0' }}>Déposer une annonce</Link>
                      <Link href="/vendeur" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0' }}>Mes annonces</Link>
                      <Link href="/messages" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: '#1d1d1f', padding: '12px 0' }}>Ma messagerie {unreadMessages > 0 && <span style={{ backgroundColor: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{unreadMessages > 99 ? '99+' : unreadMessages}</span>}</Link>
                      <Link href="/vendeur/factures" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0' }}>Mes factures</Link>
                      <Link href="/vendeur/profil" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0' }}>Mon profil</Link>
                      {showAdmin && <Link href="/admin" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0' }}>Admin</Link>}
                      <button onClick={handleSignOut} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0', background: 'none', border: 'none', textAlign: 'left', marginTop: 12 }}>Se déconnecter</button>
                    </>
                  ) : (
                    <>
                      <Link href="/favoris" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0' }}>Mes favoris</Link>
                      <Link href="/messages" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: '#1d1d1f', padding: '12px 0' }}>Messages {unreadMessages > 0 && <span style={{ backgroundColor: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{unreadMessages > 99 ? '99+' : unreadMessages}</span>}</Link>
                      {showAdmin && <Link href="/admin" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0' }}>Admin</Link>}
                      <button onClick={handleSignOut} style={{ fontSize: 16, color: '#1d1d1f', padding: '12px 0', background: 'none', border: 'none', textAlign: 'left', marginTop: 12 }}>Déconnexion</button>
                    </>
                  )}
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
