'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Package, Heart, Clock, CheckCircle, XCircle, AlertCircle, MessageCircle, Phone, Search, ChevronDown, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isSubscriptionLimitError } from '@/lib/subscription';
import { getSellerListings, deleteListing, updateListing } from '@/lib/supabase/listings';
import { listingAnnoncePath } from '@/lib/listingPaths';
import { recordListingDeletion, getSellerDeletionsByReason } from '@/lib/supabase/sales';
import { getSellerConversationsCount } from '@/lib/supabase/messaging';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Listing } from '@/types';
import { formatPrice, formatDate, parsePriceInputToNumber, sanitizePriceInputWhileTyping, formatEurosForPriceInput, CATEGORIES } from '@/lib/utils';
import { ListingPhoto } from '@/components/ListingPhoto';

/** Normalise pour la recherche : minuscules, sans accents, sans tirets ni espaces (ex. "T-shirt" et "tshirt" matchent). */
function normalizeForSearch(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[-'\s]+/g, '');
}

const ANNONCES_SORT_OPTIONS = [
  { value: 'recent' as const, label: 'Plus récents' },
  { value: 'oldest' as const, label: 'Plus anciens' },
  { value: 'price_asc' as const, label: 'Prix croissant' },
  { value: 'price_desc' as const, label: 'Prix décroissant' },
];

const SUPPRESSION_RAISONS = [
  { value: 'vendu', label: 'Article vendu' },
  { value: 'retire', label: 'Article retiré de la vente' },
] as const;

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, seller, isSeller, isApprovedSeller, loading: authLoading, refreshUser } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  type SortOption = 'recent' | 'oldest' | 'price_asc' | 'price_desc';
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalStep, setDeleteModalStep] = useState<1 | 2>(1);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [listingToToggle, setListingToToggle] = useState<Listing | null>(null);
  const [toggling, setToggling] = useState(false);
  const [listingToReserve, setListingToReserve] = useState<Listing | null>(null);
  const [reserving, setReserving] = useState(false);
  const [listingToSell, setListingToSell] = useState<Listing | null>(null);
  const [selling, setSelling] = useState(false);
  const [deleteVenduPriceInput, setDeleteVenduPriceInput] = useState('');
  const [sellPriceInput, setSellPriceInput] = useState('');
  const [sellPriceError, setSellPriceError] = useState<string | null>(null);
  const [reservedListingIds, setReservedListingIds] = useState<Set<string>>(new Set());
  const mesAnnoncesGridRef = useRef<HTMLDivElement>(null);
  const [depotInactiveLimiteBanner, setDepotInactiveLimiteBanner] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('listingDepotInactiveLimite') === '1') {
        sessionStorage.removeItem('listingDepotInactiveLimite');
        setDepotInactiveLimiteBanner(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || !seller)) {
      router.push('/connexion');
      return;
    }
    if (!authLoading && user && (seller?.status === 'rejected' || seller?.status === 'banned')) {
      router.replace('/profil');
    }
  }, [authLoading, user, seller, router]);

  // Synchronisation en temps réel du statut (validé/refusé) quand l'admin met à jour
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user?.uid) return;
    const client = supabase;
    const channel = client
      .channel('seller-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sellers', filter: `id=eq.${user.uid}` },
        () => {
          refreshUser();
        }
      )
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [user?.uid, refreshUser]);

  useEffect(() => {
    async function loadListings() {
      if (!user) return;
      try {
        const [sellerListings, count, reserveDeletions] = await Promise.all([
          getSellerListings(user.uid),
          getSellerConversationsCount(user.uid),
          getSellerDeletionsByReason(user.uid, 'reserve'),
        ]);
        setListings(sellerListings);
        setTotalMessages(count);
        setReservedListingIds(new Set(reserveDeletions.map((d) => d.listingId)));
      } catch (error) {
        console.error('Error loading listings:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadListings();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (listingToSell?.price != null && Number.isFinite(Number(listingToSell.price))) {
      setSellPriceInput(formatEurosForPriceInput(Number(listingToSell.price)));
    } else {
      setSellPriceInput('');
    }
    setSellPriceError(null);
  }, [listingToSell]);

  useEffect(() => {
    if (!sortDropdownOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [sortDropdownOpen]);

  const openDeleteModal = (listing: Listing) => {
    setListingToDelete(listing);
    setShowDeleteModal(true);
    setDeleteModalStep(1);
    setDeleteReason('');
    setDeleteError(null);
    setDeleteVenduPriceInput('');
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteModalStep(1);
    setDeleteReason('');
    setDeleteError(null);
    setListingToDelete(null);
    setDeleteVenduPriceInput('');
  };

  const handleDeleteListing = async () => {
    if (!user?.uid || !listingToDelete) return;
    if (deleteReason === 'vendu') {
      const euros = parsePriceInputToNumber(deleteVenduPriceInput);
      if (euros == null) {
        setDeleteError('Indiquez un prix de vente valide (supérieur à 0).');
        return;
      }
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      let amountCents: number | undefined;
      if (deleteReason === 'vendu') {
        amountCents = Math.round(parsePriceInputToNumber(deleteVenduPriceInput)! * 100);
      }
      try {
        await recordListingDeletion(user.uid, listingToDelete.id, deleteReason || 'autre', amountCents, listingToDelete.title);
      } catch (e) {
        console.warn('Enregistrement suppression ignoré:', e);
      }
      await deleteListing(listingToDelete.id);
      setListings((prev) => prev.filter((l) => l.id !== listingToDelete.id));
      closeDeleteModal();
    } catch (err) {
      console.error(err);
      setDeleteError('Impossible de supprimer l\'annonce. Réessayez ou contactez le support.');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmToggleActive = async () => {
    if (!listingToToggle) return;
    setToggling(true);
    try {
      await updateListing(listingToToggle.id, { isActive: !listingToToggle.isActive });
      setListings((prev) => prev.map((l) => (l.id === listingToToggle.id ? { ...l, isActive: !l.isActive } : l)));
      setListingToToggle(null);
    } catch (err) {
      if (isSubscriptionLimitError(err)) {
        router.push('/vendeur/abonnement?limite=1');
        setListingToToggle(null);
      } else {
        console.error(err);
      }
    } finally {
      setToggling(false);
    }
  };

  const handleConfirmReserve = async () => {
    if (!user?.uid || !listingToReserve) return;
    setReserving(true);
    try {
      const amountCents = listingToReserve.price != null ? Math.round(Number(listingToReserve.price) * 100) : undefined;
      try {
        await recordListingDeletion(user.uid, listingToReserve.id, 'reserve', amountCents, listingToReserve.title);
      } catch (e) {
        console.warn('Enregistrement réservation ignoré:', e);
      }
      await updateListing(listingToReserve.id, { isActive: false });
      setListings((prev) => prev.map((l) => (l.id === listingToReserve.id ? { ...l, isActive: false } : l)));
      setReservedListingIds((prev) => new Set([...prev, listingToReserve.id]));
      setListingToReserve(null);
    } catch (err) {
      console.error(err);
    } finally {
      setReserving(false);
    }
  };

  const handleConfirmSell = async () => {
    if (!user?.uid || !listingToSell) return;
    const euros = parsePriceInputToNumber(sellPriceInput);
    if (euros == null) {
      setSellPriceError('Indiquez un prix de vente valide (supérieur à 0).');
      return;
    }
    setSelling(true);
    setSellPriceError(null);
    try {
      const amountCents = Math.round(euros * 100);
      try {
        await recordListingDeletion(user.uid, listingToSell.id, 'vendu', amountCents, listingToSell.title);
      } catch (e) {
        console.warn('Enregistrement vente ignoré:', e);
      }
      await deleteListing(listingToSell.id);
      setListings((prev) => prev.filter((l) => l.id !== listingToSell.id));
      setListingToSell(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSelling(false);
    }
  };

  const totalLikes = listings.reduce((sum, l) => sum + l.likesCount, 0);
  const activeListings = listings.filter((l) => l.isActive).length;
  const totalAppels = listings.reduce((sum, l) => sum + (l.phoneRevealsCount ?? 0), 0);

  const q = normalizeForSearch(searchQuery.trim());
  const filteredBySearch = q
    ? listings.filter(
        (l) =>
          normalizeForSearch(l.title).includes(q) ||
          (l.brand && normalizeForSearch(l.brand).includes(q)) ||
          (l.category && normalizeForSearch(CATEGORIES.find((c) => c.value === l.category)?.label ?? '').includes(q))
      )
    : listings;

  const filteredListings = [...filteredBySearch].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'recent':
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  const showSkeletons = authLoading || loading;

  /** Inclut l’ordre + titres pour resynchroniser après tri / édition sans dépendre d’une nouvelle référence tableau à chaque render. */
  const mesAnnoncesTitleSyncKey = filteredListings.map((l) => `${l.id}:${l.title}`).join('\n');

  /** Titres : même hauteur seulement entre cartes d’une même ligne (max des hauteurs naturelles de la ligne). */
  useLayoutEffect(() => {
    if (showSkeletons || filteredListings.length === 0) return;

    const grid = mesAnnoncesGridRef.current;
    if (!grid) return;

    const sync = () => {
      const cards = grid.querySelectorAll<HTMLElement>('.mes-annonces-card');
      if (!cards.length) return;

      const titles: HTMLElement[] = [];
      cards.forEach((card) => {
        const t = card.querySelector<HTMLElement>('.mes-annonces-grid-title');
        if (t) titles.push(t);
      });
      titles.forEach((t) => {
        t.style.minHeight = '';
      });

      const rowMap = new Map<number, HTMLElement[]>();
      cards.forEach((card) => {
        const title = card.querySelector<HTMLElement>('.mes-annonces-grid-title');
        if (!title) return;
        const rowKey = Math.round(card.getBoundingClientRect().top);
        if (!rowMap.has(rowKey)) rowMap.set(rowKey, []);
        rowMap.get(rowKey)!.push(title);
      });

      rowMap.forEach((rowTitles) => {
        const maxH = Math.max(...rowTitles.map((el) => el.getBoundingClientRect().height));
        const px = Math.ceil(maxH);
        rowTitles.forEach((el) => {
          el.style.minHeight = `${px}px`;
        });
      });
    };

    sync();

    const ro = new ResizeObserver(() => {
      sync();
    });
    ro.observe(grid);
    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [showSkeletons, mesAnnoncesTitleSyncKey, filteredListings.length]);

  if (!authLoading && (!user || !seller)) return null;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div className="mes-annonces-page-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
              Mes annonces
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {showSkeletons ? (
                <div className="catalogue-skeleton" style={{ width: 140, height: 18, borderRadius: 4 }} />
              ) : (
                <span style={{ fontSize: 14, color: '#666' }}>{seller?.companyName}</span>
              )}
              {!showSkeletons && seller?.status === 'approved' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', backgroundColor: '#dcfce7', color: '#166534', fontSize: 12, fontWeight: 500, borderRadius: 8 }}>
                  <CheckCircle size={12} /> Validé
                </span>
              )}
              {!showSkeletons && seller?.status === 'pending' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 500, borderRadius: 8 }}>
                  <Clock size={12} /> En attente
                </span>
              )}
              {!showSkeletons && seller?.status === 'rejected' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 500, borderRadius: 8 }}>
                  <XCircle size={12} /> Refusé
                </span>
              )}
            </div>
          </div>
          {!showSkeletons && isApprovedSeller && (
            <Link href="/vendeur/annonces/nouvelle" className="mes-annonces-deposer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', backgroundColor: '#000', color: '#fff', fontSize: 14, fontWeight: 500, borderRadius: 12 }}>
              <Plus size={18} /> Déposer une annonce
            </Link>
          )}
        </div>

        {depotInactiveLimiteBanner ? (
          <div
            role="status"
            style={{
              marginBottom: 20,
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid #bfdbfe',
              backgroundColor: '#eff6ff',
              color: '#1e3a5f',
              fontSize: 14,
              lineHeight: 1.5,
              fontFamily: 'var(--font-inter), var(--font-sans)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              boxSizing: 'border-box',
            }}
          >
            <span>
              Votre annonce a été enregistrée <strong>inactive</strong> : vous aviez déjà atteint le nombre maximal
              d&apos;annonces actives pour votre formule. Désactivez une annonce en ligne pour pouvoir activer celle-ci.
            </span>
            <button
              type="button"
              onClick={() => setDepotInactiveLimiteBanner(false)}
              aria-label="Fermer"
              style={{
                flexShrink: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 4,
                color: '#1e3a5f',
                lineHeight: 1,
              }}
            >
              <X size={18} />
            </button>
          </div>
        ) : null}

        {/* Status alerts */}
        {!showSkeletons && seller?.status === 'pending' && (
          <div
            style={{
              marginBottom: 32,
              padding: 16,
              borderRadius: 12,
              border: '1px solid #fde68a',
              backgroundColor: '#fffbeb',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: 13, fontWeight: 600, borderRadius: 8 }}>
              <Clock size={14} /> En attente
            </span>
            <p style={{ fontSize: 14, color: '#92400e', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
              Demande en cours d&apos;étude
            </p>
            <p style={{ fontSize: 13, color: '#a16207', margin: 0, lineHeight: 1.5 }}>
              Notre équipe examine vos documents. Vous ne pouvez pas encore publier d&apos;annonces.
            </p>
          </div>
        )}

        {!showSkeletons && seller?.status === 'rejected' && (
          <div style={{ padding: 20, backgroundColor: '#fee2e2', marginBottom: 32, display: 'flex', gap: 16 }}>
            <XCircle size={24} color="#991b1b" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Demande refusée</h3>
              <p style={{ fontSize: 14, color: '#b91c1c' }}>
                Votre demande n'a pas été acceptée. Contactez-nous pour plus d'informations.
              </p>
            </div>
          </div>
        )}

        {!showSkeletons && seller?.status === 'suspended' && (
          <div
            style={{
              marginBottom: 32,
              padding: 16,
              borderRadius: 12,
              border: '1px solid #fdba74',
              backgroundColor: '#fff7ed',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', backgroundColor: '#ffedd5', color: '#c2410c', fontSize: 13, fontWeight: 600, borderRadius: 8 }}>
              <AlertCircle size={14} /> Compte suspendu
            </span>
            <p style={{ fontSize: 14, color: '#c2410c', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
              Votre compte vendeur est temporairement suspendu. Vous ne pouvez pas déposer de nouvelles annonces.
            </p>
            <p style={{ fontSize: 13, color: '#9a3412', margin: 0, lineHeight: 1.5 }}>
              {seller.suspendedUntil
                ? `Suspension jusqu'au ${formatDate(seller.suspendedUntil)}. Contactez-nous pour plus d'informations.`
                : 'Contactez-nous pour plus d\'informations.'}
            </p>
          </div>
        )}

        {/* Stats */}
        {(showSkeletons || isApprovedSeller) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: showSkeletons ? 'transparent' : '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                {showSkeletons ? <div className="catalogue-skeleton" style={{ width: 44, height: 44, borderRadius: 8 }} /> : <Package size={22} color="#6e6e73" />}
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}><span className="mes-annonces-stat-desktop">Annonces actives</span><span className="mes-annonces-stat-mobile">Annonces</span></p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{showSkeletons ? <span className="catalogue-skeleton" style={{ display: 'inline-block', width: 32, height: 22, borderRadius: 4, verticalAlign: 'middle' }} /> : activeListings}</p>
              </div>
            </div>
            <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: showSkeletons ? 'transparent' : '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                {showSkeletons ? <div className="catalogue-skeleton" style={{ width: 44, height: 44, borderRadius: 8 }} /> : <Heart size={22} color="#6e6e73" />}
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}><span className="mes-annonces-stat-desktop">Total likes</span><span className="mes-annonces-stat-mobile">Likes</span></p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{showSkeletons ? <span className="catalogue-skeleton" style={{ display: 'inline-block', width: 28, height: 22, borderRadius: 4, verticalAlign: 'middle' }} /> : totalLikes}</p>
              </div>
            </div>
            <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: showSkeletons ? 'transparent' : '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                {showSkeletons ? <div className="catalogue-skeleton" style={{ width: 44, height: 44, borderRadius: 8 }} /> : <MessageCircle size={22} color="#6e6e73" />}
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}><span className="mes-annonces-stat-desktop">Total messages</span><span className="mes-annonces-stat-mobile">Messages</span></p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{showSkeletons ? <span className="catalogue-skeleton" style={{ display: 'inline-block', width: 24, height: 22, borderRadius: 4, verticalAlign: 'middle' }} /> : totalMessages}</p>
              </div>
            </div>
            <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: showSkeletons ? 'transparent' : '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                {showSkeletons ? <div className="catalogue-skeleton" style={{ width: 44, height: 44, borderRadius: 8 }} /> : <Phone size={22} color="#6e6e73" />}
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}><span className="mes-annonces-stat-desktop">Total appels</span><span className="mes-annonces-stat-mobile">Appels</span></p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{showSkeletons ? <span className="catalogue-skeleton" style={{ display: 'inline-block', width: 20, height: 22, borderRadius: 4, verticalAlign: 'middle' }} /> : totalAppels}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mes-annonces-search-row" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className="mes-annonces-search-input-wrap" style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans mes annonces..."
                autoComplete="off"
                style={{
                  width: '100%',
                  height: 48,
                  padding: '0 16px 0 44px',
                  fontSize: 14,
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div className="mes-annonces-sort-dropdown" ref={sortDropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setSortDropdownOpen((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 48,
                  padding: '0 14px 0 16px',
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  fontSize: 14,
                  color: '#1d1d1f',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: 'none',
                  minWidth: 160,
                }}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>
                  {ANNONCES_SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Trier'}
                </span>
                <ChevronDown size={16} style={{ color: '#86868b', flexShrink: 0 }} />
              </button>
              {sortDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    backgroundColor: '#fff',
                    border: '1px solid #d2d2d7',
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 9999,
                    overflow: 'hidden',
                  }}
                >
                  {ANNONCES_SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value);
                        setSortDropdownOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        background: sortBy === opt.value ? '#f5f5f7' : 'transparent',
                        fontSize: 14,
                        color: '#1d1d1f',
                        cursor: 'pointer',
                        textAlign: 'left',
                        outline: 'none',
                        boxShadow: 'none',
                        fontWeight: sortBy === opt.value ? 600 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        {/* Listings */}
        <div>
          {showSkeletons ? (
            <div className="mes-annonces-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="catalogue-skeleton-card" style={{ border: '1px solid #e8e6e3', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', ['--skeleton-index' as string]: i }}>
                  <div className="catalogue-skeleton" style={{ width: '100%', aspectRatio: '1', borderRadius: 0 }} />
                  <div style={{ padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: '88px' }}>
                    <div className="catalogue-skeleton" style={{ height: 20, width: '85%' }} />
                    <div className="catalogue-skeleton" style={{ height: 24, width: '45%' }} />
                    <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                      <div className="catalogue-skeleton" style={{ height: 14, width: 48 }} />
                      <div className="catalogue-skeleton" style={{ height: 14, width: 72 }} />
                    </div>
                  </div>
                  <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
                    <div className="catalogue-skeleton" style={{ flex: 1, height: 36, borderRadius: 6 }} />
                    <div className="catalogue-skeleton" style={{ flex: 1, height: 36, borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div style={{ padding: 60, border: '1px solid #eee', textAlign: 'center', borderRadius: 12 }}>
              <Package size={48} color="#ccc" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Aucune annonce</h3>
              <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Créez votre première annonce</p>
              {isApprovedSeller && (
                <Link href="/vendeur/annonces/nouvelle" className="mes-annonces-deposer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', backgroundColor: '#000', color: '#fff', fontSize: 14, fontWeight: 500, borderRadius: 12 }}>
                  <Plus size={18} /> Déposer une annonce
                </Link>
              )}
            </div>
          ) : filteredListings.length > 0 ? (
            <div
              ref={mesAnnoncesGridRef}
              className="mes-annonces-list-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}
            >
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="mes-annonces-card"
                  style={{ position: 'relative', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDeleteModal(listing); }}
                      disabled={deleting && listingToDelete?.id === listing.id}
                      aria-label="Supprimer l'annonce"
                      style={{
                        padding: 4,
                        width: 22,
                        height: 22,
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        borderRadius: 4,
                        backgroundColor: '#f0f0f0',
                        color: '#1d1d1f',
                        cursor: deleting && listingToDelete?.id === listing.id ? 'not-allowed' : 'pointer',
                        opacity: deleting && listingToDelete?.id === listing.id ? 0.7 : 1,
                      }}
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                  <Link href={`${listingAnnoncePath(listing)}?from=vendeur`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{ width: '100%', aspectRatio: '1', backgroundColor: '#fff', overflow: 'hidden', position: 'relative' }}>
                      <ListingPhoto src={listing.photos[0]} alt={listing.title} sizes="25vw" />
                      {!listing.isActive && reservedListingIds.has(listing.id) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/vendeur/ventes?reserve=${listing.id}`);
                          }}
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            padding: '4px 10px',
                            backgroundColor: '#f5f5f5',
                            color: '#666',
                            fontSize: 11,
                            fontWeight: 500,
                            borderRadius: 4,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Inactive
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setListingToToggle(listing);
                          }}
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            padding: '4px 10px',
                            backgroundColor: listing.isActive ? '#dcfce7' : '#f5f5f5',
                            color: listing.isActive ? '#166534' : '#666',
                            fontSize: 11,
                            fontWeight: 500,
                            borderRadius: 4,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {listing.isActive ? 'Active' : 'Inactive'}
                        </button>
                      )}
                    </div>
                    <div style={{ padding: '16px 16px 12px' }}>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {(() => {
                            const lineText = listing.title || '';
                            return (
                              <h3
                                className="listing-grid-title mes-annonces-grid-title"
                                title={lineText}
                                style={{
                                  fontSize: 15,
                                  fontWeight: 500,
                                  color: '#1d1d1f',
                                  margin: '0 0 4px 0',
                                  minWidth: 0,
                                  overflow: 'hidden',
                                  lineHeight: 1.3,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {lineText}
                              </h3>
                            );
                          })()}
                          <p style={{ fontSize: 18, fontWeight: 600, color: '#000' }}>{formatPrice(listing.price)}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#888' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={12} /> {listing.likesCount}</span>
                        <span>{formatDate(listing.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="mes-annonces-card-actions" style={{ padding: '0 16px 16px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      {isApprovedSeller && (
                        <Link href={`/vendeur/annonces/${listing.id}`} style={{ flex: 1, padding: '8px 14px', border: '1px solid #ddd', fontSize: 13, textAlign: 'center', borderRadius: 6, color: '#1d1d1f' }}>
                          Modifier
                        </Link>
                      )}
                      <Link href={`/vendeur/annonces/${listing.id}/voir`} style={{ flex: 1, padding: '8px 14px', backgroundColor: '#000', color: '#fff', fontSize: 13, textAlign: 'center', borderRadius: 6 }}>
                        Détails
                      </Link>
                    </div>
                    {listing.isActive && isApprovedSeller && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setListingToReserve(listing); }}
                          style={{ flex: 1, padding: '8px 14px', border: '0.5px solid #ea580c', backgroundColor: 'transparent', color: '#ea580c', fontSize: 13, textAlign: 'center', borderRadius: 6, cursor: 'pointer' }}
                        >
                          Réserver
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setListingToSell(listing); }}
                          style={{ flex: 1, padding: '8px 14px', border: '0.5px solid #16a34a', backgroundColor: 'transparent', color: '#16a34a', fontSize: 13, textAlign: 'center', borderRadius: 6, cursor: 'pointer' }}
                        >
                          Vendu
                        </button>
                      </div>
                    )}
                    {!listing.isActive && reservedListingIds.has(listing.id) && isApprovedSeller && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link
                          href={`/vendeur/ventes?reserve=${listing.id}`}
                          style={{ flex: 1, padding: '8px 14px', border: '0.5px solid #ea580c', backgroundColor: 'transparent', color: '#ea580c', fontSize: 13, textAlign: 'center', borderRadius: 6, textDecoration: 'none' }}
                        >
                          Article réservé
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 60, border: '1px solid #eee', textAlign: 'center', borderRadius: 12 }}>
              <p style={{ fontSize: 15, color: '#6e6e73' }}>Aucun résultat pour « {searchQuery.trim()} »</p>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={closeDeleteModal} aria-hidden />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 410,
              backgroundColor: '#fff',
              padding: '24px 20px',
              borderRadius: 16,
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>
              Supprimer l&apos;annonce
            </h2>
            {deleteModalStep === 1 ? (
              <>
                <p style={{ fontSize: 14, color: '#1d1d1f', fontWeight: 500, marginTop: 16, marginBottom: 10 }}>
                  Pour quelle raison souhaitez-vous retirer cette annonce ?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {SUPPRESSION_RAISONS.map((r) => (
                    <label
                      key={r.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${deleteReason === r.value ? '#1d1d1f' : '#e5e5e7'}`,
                        backgroundColor: deleteReason === r.value ? '#f5f5f7' : '#fff',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: '#1d1d1f',
                      }}
                    >
                      <input
                        type="radio"
                        name="deleteReason"
                        value={r.value}
                        checked={deleteReason === r.value}
                        onChange={() => setDeleteReason(r.value)}
                        style={{ width: 18, height: 18, accentColor: '#1d1d1f' }}
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    style={{ flex: 1, height: 44, backgroundColor: '#fff', color: '#1d1d1f', fontSize: 14, fontWeight: 500, border: '1.5px solid #d2d2d7', borderRadius: 980, cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (deleteReason === 'vendu' && listingToDelete?.price != null && Number.isFinite(Number(listingToDelete.price))) {
                        setDeleteVenduPriceInput(formatEurosForPriceInput(Number(listingToDelete.price)));
                      } else if (deleteReason === 'vendu') {
                        setDeleteVenduPriceInput('');
                      } else {
                        setDeleteVenduPriceInput('');
                      }
                      setDeleteModalStep(2);
                    }}
                    disabled={!deleteReason}
                    style={{ flex: 1, height: 44, backgroundColor: '#1d1d1f', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 980, cursor: !deleteReason ? 'not-allowed' : 'pointer', opacity: !deleteReason ? 0.7 : 1 }}
                  >
                    Suivant
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginTop: 16, marginBottom: deleteReason === 'vendu' ? 12 : 20, textAlign: 'center' }}>
                  Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.
                </p>
                {deleteReason === 'vendu' && (
                  <div style={{ marginBottom: 16 }}>
                    <label htmlFor="delete-vendu-price" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>
                      Prix de vente (€)
                    </label>
                    <input
                      id="delete-vendu-price"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={deleteVenduPriceInput}
                      onChange={(e) => setDeleteVenduPriceInput(sanitizePriceInputWhileTyping(e.target.value))}
                      placeholder="0,00"
                      style={{ width: '100%', boxSizing: 'border-box', height: 44, padding: '0 12px', fontSize: 16, border: '1px solid #d2d2d7', borderRadius: 10, backgroundColor: '#fff' }}
                    />
                  </div>
                )}
                {deleteError && (
                  <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16, textAlign: 'center' }}>{deleteError}</p>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setDeleteModalStep(1)}
                    style={{ flex: 1, height: 44, backgroundColor: '#fff', color: '#1d1d1f', fontSize: 14, fontWeight: 500, border: '1.5px solid #d2d2d7', borderRadius: 980, cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteListing}
                    disabled={deleting}
                    style={{ flex: 1, height: 44, backgroundColor: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 980, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}
                  >
                    {deleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {listingToToggle && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => !toggling && setListingToToggle(null)} aria-hidden />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 410,
              backgroundColor: '#fff',
              padding: '24px 20px',
              borderRadius: 16,
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>
              {listingToToggle.isActive ? 'Désactiver l\'annonce' : 'Activer l\'annonce'}
            </h2>
            <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginTop: 16, marginBottom: 20, textAlign: 'center' }}>
              {listingToToggle.isActive
                ? 'Voulez-vous désactiver cette annonce ? Elle ne sera plus visible dans le catalogue.'
                : 'Voulez-vous activer cette annonce ? Elle sera à nouveau visible dans le catalogue.'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => !toggling && setListingToToggle(null)}
                style={{ flex: 1, height: 44, backgroundColor: '#fff', color: '#1d1d1f', fontSize: 14, fontWeight: 500, border: '1.5px solid #d2d2d7', borderRadius: 980, cursor: toggling ? 'not-allowed' : 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleActive}
                disabled={toggling}
                style={{ flex: 1, height: 44, backgroundColor: '#1d1d1f', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 980, cursor: toggling ? 'not-allowed' : 'pointer', opacity: toggling ? 0.7 : 1 }}
              >
                {toggling ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {listingToReserve && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => !reserving && setListingToReserve(null)} aria-hidden />
          <div style={{ position: 'relative', width: '100%', maxWidth: 410, backgroundColor: '#fff', padding: '24px 20px', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>
              Marquer comme réservé
            </h2>
            <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginTop: 16, marginBottom: 20, textAlign: 'center' }}>
              Cet article sera retiré du catalogue et apparaîtra dans la page Mes ventes &gt; Articles réservés.
              <br />
              Vous pourrez l’annuler ou le marquer comme vendu.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => !reserving && setListingToReserve(null)}
                style={{ flex: 1, height: 44, backgroundColor: '#fff', color: '#1d1d1f', fontSize: 14, fontWeight: 500, border: '1.5px solid #d2d2d7', borderRadius: 980, cursor: reserving ? 'not-allowed' : 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReserve}
                disabled={reserving}
                style={{ flex: 1, height: 44, backgroundColor: '#ea580c', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 980, cursor: reserving ? 'not-allowed' : 'pointer', opacity: reserving ? 0.7 : 1 }}
              >
                {reserving ? 'En cours...' : 'Réserver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {listingToSell && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => { if (!selling) { setListingToSell(null); setSellPriceError(null); } }} aria-hidden />
          <div style={{ position: 'relative', width: '100%', maxWidth: 460, maxHeight: '90vh', overflow: 'auto', backgroundColor: '#fff', padding: 20, borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>
              Article vendu
            </h2>
            <p style={{ fontSize: 15, color: '#1d1d1f', fontWeight: 500, lineHeight: 1.5, marginTop: 16, marginBottom: 12, textAlign: 'center' }}>
              Êtes-vous sûr de passer cet article en vendu ?
            </p>
            <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginTop: 0, marginBottom: 12, textAlign: 'center', padding: '0 4px' }}>
              Cette action est irréversible. Vous pourrez le voir dans Articles vendu mais <strong>il sera supprimé de votre catalogue.</strong>
            </p>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="sell-price-confirm" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>
                Prix de vente (€)
              </label>
              <input
                id="sell-price-confirm"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={sellPriceInput}
                onChange={(e) => setSellPriceInput(sanitizePriceInputWhileTyping(e.target.value))}
                placeholder="0,00"
                style={{ width: '100%', boxSizing: 'border-box', height: 44, padding: '0 12px', fontSize: 16, border: '1px solid #d2d2d7', borderRadius: 10, backgroundColor: '#fff' }}
              />
              {sellPriceError && (
                <p style={{ fontSize: 13, color: '#dc2626', margin: '8px 0 0' }}>{sellPriceError}</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => { if (!selling) { setListingToSell(null); setSellPriceError(null); } }}
                style={{ flex: 1, height: 44, backgroundColor: '#fff', color: '#1d1d1f', fontSize: 14, fontWeight: 500, border: '1.5px solid #d2d2d7', borderRadius: 980, cursor: selling ? 'not-allowed' : 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSell}
                disabled={selling}
                style={{ flex: 1, height: 44, backgroundColor: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 980, cursor: selling ? 'not-allowed' : 'pointer', opacity: selling ? 0.7 : 1 }}
              >
                {selling ? 'En cours...' : 'Vendu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
