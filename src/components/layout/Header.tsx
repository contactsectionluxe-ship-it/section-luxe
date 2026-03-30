'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Menu, X, Heart, MessageCircle, User, Check, LogOut, Store, Settings, Package, Handbag, FileText, PlusCircle, BarChart2, Send, CreditCard, Search, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/supabase/auth';
import { isAdminEmail } from '@/lib/constants';
import { subscribeToConversations, getUserConversations } from '@/lib/supabase/messaging';
import { Conversation } from '@/types';

type HeaderNavItem = { name: string; href: string; mobileIcon: LucideIcon };

function getHeaderNavItems(isAuthenticated: boolean): HeaderNavItem[] {
  return [
    { name: 'Trouver une pièce', href: '/catalogue?reset=1', mobileIcon: Search },
    {
      name: 'Proposer ma pièce',
      href: isAuthenticated ? '/proposer-vente' : '/connexion?redirect=/proposer-vente',
      mobileIcon: PlusCircle,
    },
    { name: 'Section Luxe', href: '/a-propos', mobileIcon: Info },
  ];
}

function matchNavActive(
  pathname: string,
  sp: { get: (key: string) => string | null },
  href: string
) {
  if (href === '/') return pathname === '/';
  if (href.includes('/connexion')) {
    const q = href.split('?')[1];
    if (q) {
      const p = new URLSearchParams(q);
      const want = p.get('redirect') || '';
      if (want.includes('proposer-vente')) {
        return pathname === '/connexion' && (sp.get('redirect') || '').includes('proposer-vente');
      }
    }
  }
  if (href === '/proposer-vente' || href.split('?')[0] === '/proposer-vente') {
    return pathname === '/proposer-vente';
  }
  if (href === '/a-propos') return pathname === '/a-propos' || pathname.startsWith('/a-propos/');
  if (href === '/catalogue') return pathname === '/catalogue' && !sp.get('condition');
  if (href.startsWith('/catalogue?')) {
    const params = new URLSearchParams(href.split('?')[1] || '');
    const wantCondition = params.get('condition');
    if (pathname !== '/catalogue') return false;
    if (wantCondition === null) return !sp.get('condition');
    return sp.get('condition') === wantCondition;
  }
  return pathname === href || pathname.startsWith(href + '/');
}

/** Couleur alignée sur les icônes Favoris / Messages / User du header (#1d1d1f). */
const HEADER_ACTION_ICON_COLOR = '#1d1d1f';

/** Même police / cassage que `.listing-grid-vendeur` des cartes « À la une » (accueil). */
const CENTER_NAV_LINK_STYLE: CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  color: HEADER_ACTION_ICON_COLOR,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  transition: 'color 0.2s',
};

/** Menu burger téléphone : même typo que les liens du sous-menu compte (fontSize 15, casse naturelle). */
const HEADER_MOBILE_BURGER_NAV_TEXT_STYLE: CSSProperties = {
  fontSize: 15,
  fontWeight: 400,
  fontFamily: 'inherit',
  color: '#1d1d1f',
  textTransform: 'none',
  letterSpacing: 'normal',
};

/** Icône User + petit marqueur à droite : croix (invité) ou coche (connecté). Toujours afficher le marqueur (y compris pendant le chargement auth si session déjà connue). */
function HeaderAccountIcon({
  iconSize,
  headerIconCellSize,
  iconWrapStyle,
  state,
}: {
  iconSize: number;
  headerIconCellSize: number;
  iconWrapStyle: CSSProperties;
  state: 'guest' | 'member';
}) {
  const userSvg = (
    <User size={iconSize} strokeWidth={1.5} style={{ display: 'block', width: iconSize, height: iconSize }} aria-hidden />
  );
  const markClass =
    state === 'guest' ? 'header-user-status-mark header-user-status-mark--guest' : 'header-user-status-mark header-user-status-mark--member';
  const Mark = state === 'guest' ? X : Check;
  const markColor = HEADER_ACTION_ICON_COLOR;
  /** Même taille pour les deux états : la largeur réelle est fixée sur le span (pas de saut au refresh). */
  const markSize = 15;
  const markStroke = state === 'guest' ? 1.9 : 2.2;
  return (
    <div
      className="header-action-icon header-action-icon--user header-account-icon-row"
      style={{
        ...iconWrapStyle,
        width: 'auto',
        minWidth: headerIconCellSize,
        height: headerIconCellSize,
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 0,
        flexShrink: 0,
      }}
    >
      <div
        className="header-account-icon-user-slot"
        style={{
          width: headerIconCellSize,
          height: headerIconCellSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {userSvg}
      </div>
      <span
        className={markClass}
        aria-hidden
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          flexShrink: 0,
          lineHeight: 0,
          marginLeft: -2,
          height: headerIconCellSize,
          width: 14,
          minWidth: 14,
          boxSizing: 'border-box',
        }}
      >
        <Mark size={markSize} strokeWidth={markStroke} color={markColor} style={{ display: 'block' }} />
      </span>
    </div>
  );
}

function HeaderDesktopNavFallback({ items }: { items: HeaderNavItem[] }) {
  return (
    <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginTop: '1mm' }}>
      {items.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className="header-center-nav-link"
          style={{
            ...CENTER_NAV_LINK_STYLE,
            padding: '8px 0',
            textDecoration: 'none',
          }}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}

function HeaderDesktopNavWithParams({ items }: { items: HeaderNavItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isNavActive = useCallback(
    (href: string) => matchNavActive(pathname, searchParams, href),
    [pathname, searchParams]
  );
  return (
    <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginTop: '1mm' }}>
      {items.map((item) => {
        const active = isNavActive(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`header-center-nav-link${active ? ' header-center-nav-link--active' : ''}`}
            style={{
              ...CENTER_NAV_LINK_STYLE,
              padding: '8px 0',
              textDecoration: 'none',
            }}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

function HeaderMobileNavLinks({
  items,
  isNavActive,
  onItemClick,
}: {
  items: HeaderNavItem[];
  isNavActive: (href: string) => boolean;
  onItemClick: () => void;
}) {
  return (
    <>
      {items.map((item) => {
        const active = isNavActive(item.href);
        const ItemIcon = item.mobileIcon;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={`header-center-nav-link-mobile${active ? ' header-center-nav-link--active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              ...HEADER_MOBILE_BURGER_NAV_TEXT_STYLE,
              borderRadius: 10,
              transition: 'background-color 0.15s, color 0.2s',
              backgroundColor: active ? '#e8e8ed' : 'transparent',
              whiteSpace: 'nowrap',
              width: 'max-content',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e8e8ed';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = active ? '#e8e8ed' : 'transparent';
            }}
          >
            <ItemIcon size={18} color="#1d1d1f" style={{ flexShrink: 0 }} aria-hidden />
            {item.name}
          </Link>
        );
      })}
    </>
  );
}

function HeaderMobileNavWithParams({
  items,
  onItemClick,
}: {
  items: HeaderNavItem[];
  onItemClick: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isNavActive = useCallback(
    (href: string) => matchNavActive(pathname, searchParams, href),
    [pathname, searchParams]
  );
  return <HeaderMobileNavLinks items={items} isNavActive={isNavActive} onItemClick={onItemClick} />;
}

function HeaderMain() {
  const { user, seller, supabaseUser, loading: authLoading, isAuthenticated, isSeller, isAdmin } = useAuth();
  /** Croix si invité ; coche si connecté ou session Supabase déjà là pendant le chargement profil (évite l’icône seule au refresh). */
  const headerAccountIconMark = isAuthenticated || (authLoading && !!supabaseUser) ? 'member' : 'guest';
  const headerNavItems = useMemo(
    () => getHeaderNavItems(!!isAuthenticated),
    [isAuthenticated]
  );
  const showAdmin = isAdmin && isAdminEmail(user?.email);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [userMenuRight, setUserMenuRight] = useState(24);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [mobileMenuRight, setMobileMenuRight] = useState(12);
  const [scrolled, setScrolled] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (userMenuOpen && userMenuButtonRef.current) {
      const rect = userMenuButtonRef.current.getBoundingClientRect();
      setUserMenuRight(window.innerWidth - rect.right);
    }
  }, [userMenuOpen]);

  useEffect(() => {
    const handleClick = () => setUserMenuOpen(false);
    if (userMenuOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [userMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen && mobileMenuButtonRef.current) {
      const rect = mobileMenuButtonRef.current.getBoundingClientRect();
      setMobileMenuRight(window.innerWidth - rect.right);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleClick = () => setMobileMenuOpen(false);
    if (mobileMenuOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [mobileMenuOpen]);

  const updateUnreadCount = useCallback(
    (conversations: Conversation[]) => {
      if (!user || !isAuthenticated) return;
      const uid = user.uid;
      const total = conversations.reduce((sum, c) => {
        const unreadForMe = c.sellerId === uid ? c.unreadSeller : c.unreadBuyer;
        return sum + (unreadForMe || 0);
      }, 0);
      setUnreadMessages(total);
    },
    [user?.uid, isAuthenticated]
  );

  const mergeConversations = useCallback((buyer: Conversation[], seller: Conversation[]) => {
    const byId = new Map<string, Conversation>();
    [...buyer, ...seller].forEach((c) => byId.set(c.id, c));
    return Array.from(byId.values());
  }, []);

  useEffect(() => {
    if (!user || !isAuthenticated) {
      setUnreadMessages(0);
      return;
    }
    let buyerConversations: Conversation[] = [];
    let sellerConversations: Conversation[] = [];

    const unsubscribeBuyer = subscribeToConversations(user.uid, 'buyer', (convos) => {
      buyerConversations = convos;
      updateUnreadCount(mergeConversations(buyerConversations, sellerConversations));
    });

    let unsubscribeSeller = () => {};
    if (isSeller) {
      unsubscribeSeller = subscribeToConversations(user.uid, 'seller', (convos) => {
        sellerConversations = convos;
        updateUnreadCount(mergeConversations(buyerConversations, sellerConversations));
      });
    }

    return () => {
      unsubscribeBuyer();
      unsubscribeSeller();
    };
  }, [user?.uid, isAuthenticated, isSeller, updateUnreadCount, mergeConversations]);

  const refreshUnread = useCallback(() => {
    if (!user || !isAuthenticated) return;
    Promise.all([
      getUserConversations(user.uid, 'buyer'),
      isSeller ? getUserConversations(user.uid, 'seller') : Promise.resolve([] as Conversation[]),
    ]).then(([buyer, seller]) => {
      updateUnreadCount(mergeConversations(buyer, seller));
    });
  }, [user?.uid, isAuthenticated, isSeller, updateUnreadCount, mergeConversations]);

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

  /** Icônes seules (Favoris, Messages, compte) — sans libellé sous l’icône */
  const iconSize = 22;
  /** Un peu plus petit que User (22) : MessageCircle paraît plus massif à taille égale */
  const messagesIconSize = 20;
  const favorisIconSize = 23;
  const headerIconCellSize = 24;
  /** Favoris / Messages : cellule 44px. Compte : User 24px + marqueur (~13px) − chevauchement, + padding tap. */
  const HEADER_ACTION_ACCOUNT_MIN_WIDTH = 52;
  const iconOnlyActionStyle = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: '10px 8px',
    width: 44,
    minWidth: 44,
    maxWidth: 44,
    boxSizing: 'border-box' as const,
  };
  const iconOnlyActionStyleAccount = {
    ...iconOnlyActionStyle,
    width: HEADER_ACTION_ACCOUNT_MIN_WIDTH,
    minWidth: HEADER_ACTION_ACCOUNT_MIN_WIDTH,
    maxWidth: HEADER_ACTION_ACCOUNT_MIN_WIDTH,
  };
  const iconWrapStyle = {
    width: iconSize,
    height: iconSize,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    color: HEADER_ACTION_ICON_COLOR,
    flexShrink: 0,
  };

  return (
    <>
      <header
        className="site-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          overflow: 'visible',
          backgroundColor: scrolled ? 'rgba(251,251,251,0.68)' : 'rgba(251,251,251,0.78)',
          backdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'saturate(180%) blur(16px)',
          WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'saturate(180%) blur(16px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          zIndex: 100,
          transition: 'background-color 0.2s, backdrop-filter 0.2s',
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
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <Link
            href="/"
            className="header-logo-link"
            aria-label="Accueil — Section Luxe"
            title="Accueil"
            style={{ display: 'flex', alignItems: 'center', marginLeft: 8, position: 'relative', zIndex: 1, flexShrink: 0 }}
          >
            <img src="/logo.png" alt="" className="header-logo-img" style={{ height: 24, width: 'auto', display: 'block', marginTop: -4 }} />
          </Link>

          <div
            className="hide-mobile header-center-nav-wrap"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
            }}
          >
            <Suspense fallback={<HeaderDesktopNavFallback items={headerNavItems} />}>
              <HeaderDesktopNavWithParams items={headerNavItems} />
            </Suspense>
          </div>

          <div className="header-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0, flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <Link href="/favoris" className="header-action-favoris header-action-item" aria-label="Favoris" style={iconOnlyActionStyle}>
              <div className="header-action-icon header-action-icon--favoris" style={{ ...iconWrapStyle, width: headerIconCellSize, height: headerIconCellSize }}>
                <Heart size={favorisIconSize} strokeWidth={1.5} style={{ display: 'block', width: favorisIconSize, height: favorisIconSize }} aria-hidden />
              </div>
            </Link>
            <Link href="/messages" className="header-action-messages header-action-item" aria-label="Messages" style={iconOnlyActionStyle}>
              <div className="header-action-icon header-action-icon--messages" style={{ position: 'relative', ...iconWrapStyle, width: headerIconCellSize, height: headerIconCellSize }}>
                <MessageCircle size={messagesIconSize} strokeWidth={1.5} style={{ display: 'block', width: messagesIconSize, height: messagesIconSize }} aria-hidden />
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
            </Link>
            <div className="header-action-user" style={{ position: 'relative', minWidth: HEADER_ACTION_ACCOUNT_MIN_WIDTH, maxWidth: HEADER_ACTION_ACCOUNT_MIN_WIDTH }}>
              {authLoading ? (
                <button
                  type="button"
                  disabled
                  className="header-action-item"
                  aria-busy="true"
                  aria-label="Chargement du compte"
                  style={{
                    ...iconOnlyActionStyleAccount,
                    background: 'none',
                    border: 'none',
                    cursor: 'default',
                    fontFamily: 'inherit',
                    opacity: 1,
                    color: HEADER_ACTION_ICON_COLOR,
                    pointerEvents: 'none',
                  }}
                >
                  <HeaderAccountIcon iconSize={iconSize} headerIconCellSize={headerIconCellSize} iconWrapStyle={iconWrapStyle} state={headerAccountIconMark} />
                </button>
              ) : isAuthenticated ? (
                <>
                  <button
                    ref={userMenuButtonRef}
                    type="button"
                    className="header-action-item"
                    aria-label={(user?.displayName || 'Compte').trim() || 'Menu compte'}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                    style={{
                      ...iconOnlyActionStyleAccount,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <HeaderAccountIcon iconSize={iconSize} headerIconCellSize={headerIconCellSize} iconWrapStyle={iconWrapStyle} state="member" />
                  </button>
                  {userMenuOpen && (
                    <div
                      className="header-user-menu-dropdown"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'fixed',
                        top: 'calc(var(--header-height) + 1px)',
                        right: userMenuRight,
                        width: 240,
                        minWidth: 240,
                        maxWidth: 240,
                        backgroundColor: '#fbfbfb',
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        borderBottomLeftRadius: 18,
                        borderBottomRightRadius: 18,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                        zIndex: 110,
                      }}
                    >
                      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 2, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName || 'Utilisateur'}</p>
                        <p style={{ fontSize: 13, color: '#86868b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                      </div>
                      <div style={{ padding: 8 }}>
                        {seller ? (
                          <>
                            {seller.status === 'approved' && (
                              <Link href="/vendeur/annonces/nouvelle" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10, transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><PlusCircle size={18} /> Déposer une annonce</Link>
                            )}
                            {(seller.status === 'approved' || seller.status === 'suspended') && (
                              <>
                                <Link href="/vendeur" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10, transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><Package size={18} /> Mes annonces</Link>
                                <Link href="/vendeur/ventes" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10, transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><BarChart2 size={18} /> Mes ventes</Link>
                              </>
                            )}
                            {seller.status === 'approved' && (seller.subscriptionTier === 'plus' || seller.subscriptionTier === 'pro') && (
                              <Link href="/vendeur/demandes-mise-en-vente" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10, transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><Handbag size={18} /> Sourcing</Link>
                            )}
                            <Link href="/contact" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10, transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><Send size={18} color="#1d1d1f" style={{ flexShrink: 0 }} /> Contact</Link>
                            <Link href="/profil" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10, transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><User size={18} /> Mon profil</Link>
                            <Link href="/vendeur/abonnement" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10, transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><CreditCard size={18} /> Mon abonnement</Link>
                            {(seller.status === 'approved' || seller.status === 'suspended') && (
                              <Link href="/vendeur/factures" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10, transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><FileText size={18} /> Mes factures</Link>
                            )}
                            {showAdmin && <Link href="/admin" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10, transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><Settings size={18} /> Admin</Link>}
                            <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />
                            <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', fontSize: 15, color: '#1d1d1f', background: 'none', border: 'none', textAlign: 'left', borderRadius: 10, cursor: 'pointer', transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><LogOut size={18} /> Se déconnecter</button>
                          </>
                        ) : (
                          <>
                            <Link href="/suivre-mes-offres" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10, transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><BarChart2 size={18} color="#1d1d1f" style={{ flexShrink: 0 }} /> Suivre mes offres</Link>
                            <Link href="/contact" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10, transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><Send size={18} color="#1d1d1f" style={{ flexShrink: 0 }} /> Contact</Link>
                            <Link href="/profil" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10, transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><User size={18} /> Mon profil</Link>
                            {showAdmin && <Link href="/admin" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 15, color: '#1d1d1f', borderRadius: 10, transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><Settings size={18} /> Admin</Link>}
                            <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />
                            <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', fontSize: 15, color: '#1d1d1f', background: 'none', border: 'none', textAlign: 'left', borderRadius: 10, cursor: 'pointer', transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}><LogOut size={18} /> Déconnexion</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link href="/connexion" className="header-action-item" aria-label="Connexion" style={{ ...iconOnlyActionStyleAccount, textDecoration: 'none' }}>
                  <HeaderAccountIcon iconSize={iconSize} headerIconCellSize={headerIconCellSize} iconWrapStyle={iconWrapStyle} state="guest" />
                </Link>
              )}
            </div>
            </div>
            <button
              ref={mobileMenuButtonRef}
              className="hide-desktop"
              onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(!mobileMenuOpen); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, background: 'none', border: 'none', color: '#1d1d1f', borderRadius: 12, transform: 'translateY(0.5px)' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="hide-desktop"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 'calc(var(--header-height) + 1px)',
            right: mobileMenuRight,
            width: 'max-content',
            maxWidth: 'calc(100vw - 20px)',
            minWidth: 0,
            backgroundColor: '#fbfbfb',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            zIndex: 110,
          }}
        >
          <div
            style={{
              padding: 8,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              width: 'max-content',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Suspense
              fallback={
                <HeaderMobileNavLinks items={headerNavItems} isNavActive={() => false} onItemClick={() => setMobileMenuOpen(false)} />
              }
            >
              <HeaderMobileNavWithParams items={headerNavItems} onItemClick={() => setMobileMenuOpen(false)} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}

export function Header() {
  return <HeaderMain />;
}
