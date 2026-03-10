'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, Store, ArrowLeft, Share2, ChevronLeft, ChevronRight, Phone, Tag, Award, Package, Calendar, CheckCircle, Layers, Palette, Ruler, MapPin, Plus, Minus, Euro, Info, FileText, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getListing, getSellerListings, getListings, incrementPhoneReveals, getVisitorId } from '@/lib/supabase/listings';
import { getFavorite, addFavorite, removeFavorite } from '@/lib/supabase/favorites';
import { getOrCreateConversation, sendMessage } from '@/lib/supabase/messaging';
import { getSellerData } from '@/lib/supabase/auth';
import { Listing, Seller } from '@/types';
import { formatPrice, formatDate, CATEGORIES } from '@/lib/utils';
import { CONDITIONS, COLORS, MATERIALS, getArticleTypeLabel } from '@/lib/constants';
import { getDealLevel, getBarPositionFromDeal } from '@/lib/deal';
import { ListingPhoto } from '@/components/ListingPhoto';

/** Titre d’annonce comme dans le catalogue : marque - type modèle (pour vêtements avec " & " dans le type : seulement modèle). */
function getListingDisplayTitle(listing: Listing): string {
  const typeLabel = getArticleTypeLabel(listing.category, listing.genre ?? ['femme', 'homme'], listing.articleType);
  const marque = listing.brand || listing.title;
  const typeModel = (listing.category === 'vetements' && typeLabel.includes(' & '))
    ? (listing.model ?? '')
    : [typeLabel, listing.model].filter(Boolean).join(' ');
  return typeModel ? `${marque} - ${typeModel}` : marque;
}

/** Affiche le téléphone au format 00 00 00 00 00 */
function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.replace(/(.{2})/g, '$1 ').trim();
}

const ETAT_DEFINITIONS: { title: string; text: string }[] = [
  { title: 'Neuf', text: 'Article jamais porté en parfait état. Aucun signe d\'utilisation.' },
  { title: 'Très bon état', text: 'Article peu porté et soigneusement conservé. Peut présenter de très légers signes d\'usage à peine perceptibles.' },
  { title: 'Bon état', text: 'Article porté et bien entretenu. Peut présenter des traces d\'usage visibles liées à une utilisation normale.' },
  { title: 'État correct', text: 'Article régulièrement porté. Présente des signes d\'usure visibles liés à l\'usage, sans défaut majeur ni détérioration importante.' },
];

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listingId = params.id as string;
  /** URL de retour au catalogue avec filtres (si on vient du catalogue). */
  const returnToCatalogue = (() => {
    const returnTo = searchParams.get('returnTo');
    if (!returnTo || typeof returnTo !== 'string') return '/catalogue';
    const path = returnTo.startsWith('/') ? returnTo : `/${returnTo}`;
    return path.startsWith('/catalogue') ? path : '/catalogue';
  })();
  const redirectUrl = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
  const { user, isAuthenticated } = useAuth();
  /** Venu de Mes annonces (clic sur la case) → retour à mes annonces, sinon retour au catalogue */
  const fromVendeurParam = searchParams.get('from') === 'vendeur';

  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showPhotoLightbox, setShowPhotoLightbox] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showLegalMore, setShowLegalMore] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: 'Bonjour,\nVotre article est-il toujours disponible ?',
  });
  const [contactFormSubmitting, setContactFormSubmitting] = useState(false);
  const [contactFormError, setContactFormError] = useState('');
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [mapZoom, setMapZoom] = useState(15);
  const [sellerListingsCount, setSellerListingsCount] = useState(0);
  const [showMoreAbout, setShowMoreAbout] = useState(false);
  const [showPrixEnSavoirPlus, setShowPrixEnSavoirPlus] = useState(false);
  const [showPrixPopup, setShowPrixPopup] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionOverflows, setDescriptionOverflows] = useState(false);
  const descriptionRefDesktop = useRef<HTMLDivElement>(null);
  const descriptionRefMobile = useRef<HTMLDivElement>(null);
  const [sellerDescriptionOverflows, setSellerDescriptionOverflows] = useState(false);
  const sellerDescriptionRef = useRef<HTMLParagraphElement>(null);
  const pubVideoRef = useRef<HTMLVideoElement>(null);
  const pubVideoWrapRef = useRef<HTMLDivElement>(null);
  /** Comparaison de prix : moyenne / min / max des annonces même catégorie et même année (hors annonce actuelle) */
  const [priceStats, setPriceStats] = useState<{ average: number; min: number; max: number; count: number } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportName, setReportName] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportCertify, setReportCertify] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportStep, setReportStep] = useState(1);
  const [reportRgpdExpanded, setReportRgpdExpanded] = useState(false);
  const [etatInfoClicked, setEtatInfoClicked] = useState(false);
  const [etatInfoHover, setEtatInfoHover] = useState(false);
  const etatInfoRefDesktop = useRef<HTMLDivElement>(null);
  const etatInfoRefMobile = useRef<HTMLDivElement>(null);

  /** Afficher « Voir plus » seulement si la description a strictement plus de 5 lignes. Plusieurs vérifications (dont délais) pour que ça marche sur toutes les annonces quel que soit le chargement (polices, viewport). */
  useLayoutEffect(() => {
    if (!listing?.description || descriptionExpanded) {
      setDescriptionOverflows(false);
      return;
    }
    const check = () => {
      const d = descriptionRefDesktop.current;
      const m = descriptionRefMobile.current;
      const overflowD = d && d.clientHeight > 0 && d.scrollHeight > d.clientHeight;
      const overflowM = m && m.clientHeight > 0 && m.scrollHeight > m.clientHeight;
      const overflowFromDom = overflowD || overflowM;
      const overflowFromLines = listing.description.split(/\r?\n/).filter(Boolean).length > 5;
      setDescriptionOverflows((prev) => {
        const next = !!(overflowFromDom || overflowFromLines);
        return next !== prev ? next : prev;
      });
    };
    check();
    requestAnimationFrame(check);
    const t1 = window.setTimeout(check, 100);
    const t2 = window.setTimeout(check, 400);
    const ro = new ResizeObserver(check);
    if (descriptionRefDesktop.current) ro.observe(descriptionRefDesktop.current);
    if (descriptionRefMobile.current) ro.observe(descriptionRefMobile.current);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [listing?.id, listing?.description, descriptionExpanded]);

  // Préremplir le formulaire de signalement avec les infos utilisateur si connecté
  useEffect(() => {
    if (!user) return;
    setReportName((prev) => prev || (user.displayName ?? '').trim());
    setReportEmail((prev) => prev || (user.email ?? '').trim());
  }, [user]);

  // Fermer le tooltip État (i) au clic ailleurs sur la page
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(etatInfoClicked || etatInfoHover)) return;
      const d = etatInfoRefDesktop.current;
      const m = etatInfoRefMobile.current;
      const target = e.target as Node;
      if ((!d || !d.contains(target)) && (!m || !m.contains(target))) {
        setEtatInfoClicked(false);
        setEtatInfoHover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [etatInfoClicked, etatInfoHover]);

  // Vidéo publicité : démarre quand le bloc est visible à l'écran, en boucle ; preload léger
  useEffect(() => {
    if (loading || !listing?.id) return;
    const wrap = pubVideoWrapRef.current;
    const video = pubVideoRef.current;
    if (!wrap || !video) return;

    const playIfVisible = () => {
      const w = pubVideoWrapRef.current;
      const v = pubVideoRef.current;
      if (!w || !v) return;
      const rect = w.getBoundingClientRect();
      const winH = window.innerHeight;
      const visibleTop = Math.max(rect.top, 0);
      const visibleBottom = Math.min(rect.bottom, winH);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const halfVisible = visibleHeight >= rect.height * 0.5;
      if (halfVisible) {
        v.muted = true;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const v = pubVideoRef.current;
          if (v && entry.isIntersecting) {
            v.muted = true;
            v.play().catch(() => {});
          } else if (v) {
            v.pause();
          }
        }
      },
      { threshold: 0.5, root: null, rootMargin: '0px' }
    );

    io.observe(wrap);
    playIfVisible();
    const t1 = setTimeout(playIfVisible, 50);
    const t2 = setTimeout(playIfVisible, 200);
    const t3 = setTimeout(playIfVisible, 500);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(playIfVisible);
    });
    const scrollHandler = () => playIfVisible();
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('resize', scrollHandler);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('resize', scrollHandler);
    };
  }, [listing?.id, loading]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError('');

    if (!reportReason) {
      setReportError('Veuillez sélectionner un motif de signalement.');
      return;
    }
    if (!reportName.trim() || !reportEmail.trim() || !reportDetails.trim()) {
      setReportError('Veuillez renseigner votre nom, votre email et le détail du signalement.');
      return;
    }
    if (!reportCertify) {
      setReportError('Vous devez certifier que le signalement est effectué de bonne foi.');
      return;
    }

    setReportSubmitting(true);
    try {
      const subject = `Signalement annonce ${listing?.id ?? ''} - ${reportReason}`;
      const messageLines = [
        `Signalement d'une annonce sur Section Luxe`,
        '',
        `Annonce ID : ${listing?.id ?? ''}`,
        `Titre : ${listing ? getListingDisplayTitle(listing) : ''}`,
        '',
        `Motif : ${reportReason}`,
        '',
        'Détails du signalement :',
        reportDetails,
        '',
        `Déclarant : ${reportName.trim()} <${reportEmail.trim()}>`,
        `Utilisateur connecté : ${user?.uid ?? 'non authentifié'}`,
      ];
      const message = messageLines.join('\n');

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportName.trim(),
          email: reportEmail.trim(),
          subject,
          message,
          report: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data.error as string) || 'Envoi impossible');
      }

      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
      setReportCertify(false);
      setReportError('');
    } catch (err) {
      console.error('Signalement annonce', err);
      setReportError("L'envoi du signalement a échoué. Veuillez réessayer plus tard.");
    } finally {
      setReportSubmitting(false);
    }
  };

  /** Même règle pour la description vendeur (À propos) : « Voir plus » seulement si plus de 5 lignes. */
  useLayoutEffect(() => {
    if (!seller?.description || showMoreAbout) {
      setSellerDescriptionOverflows(false);
      return;
    }
    const el = sellerDescriptionRef.current;
    if (!el) return;
    const check = () => setSellerDescriptionOverflows((prev) => {
      const next = el.clientHeight > 0 && el.scrollHeight > el.clientHeight;
      return next !== prev ? next : prev;
    });
    check();
    requestAnimationFrame(check);
    const t1 = window.setTimeout(check, 100);
    const t2 = window.setTimeout(check, 400);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro.disconnect();
    };
  }, [seller?.uid, seller?.description, showMoreAbout]);

  useEffect(() => {
    async function loadData() {
      try {
        const listingData = await getListing(listingId);
        if (!listingData) {
          router.push('/catalogue');
          return;
        }

        setListing(listingData);
        setLikesCount(listingData.likesCount);

        const sellerData = await getSellerData(listingData.sellerId);
        setSeller(sellerData);

        const sellerListings = await getSellerListings(listingData.sellerId);
        setSellerListingsCount(sellerListings.filter((l) => l.isActive).length);

        const similar = await getListings({
          category: listingData.category,
          year: listingData.year ?? undefined,
          brand: listingData.brand ?? undefined,
          articleTypes: listingData.articleType ? [listingData.articleType] : undefined,
          limitCount: 100,
        });
        const others = similar.filter((l) => l.id !== listingData.id && l.price > 0);
        if (others.length > 0) {
          const prices = others.map((l) => l.price);
          const sum = prices.reduce((a, b) => a + b, 0);
          setPriceStats({
            average: sum / others.length,
            min: Math.min(...prices),
            max: Math.max(...prices),
            count: others.length,
          });
        } else {
          setPriceStats(null);
        }

        if (isAuthenticated && user) {
          const favorite = await getFavorite(user.uid, listingId);
          setIsFavorited(!!favorite);
        }
      } catch (error) {
        console.error('Error loading listing:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [listingId, isAuthenticated, user, router]);

  useEffect(() => {
    if (!showPhotoLightbox) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowPhotoLightbox(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showPhotoLightbox]);

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(user!.uid, listingId);
        setIsFavorited(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        await addFavorite(user!.uid, listingId);
        setIsFavorited(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/produit/${listingId}` : '';
    const title = listing ? `${getListingDisplayTitle(listing)} - Section Luxe` : 'Section Luxe';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard?.writeText(url);
        alert('Lien copié dans le presse-papiers.');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        try {
          await navigator.clipboard?.writeText(url);
          alert('Lien copié dans le presse-papiers.');
        } catch {
          alert('Impossible de partager.');
        }
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    const updates: { firstName?: string; lastName?: string; email?: string; phone?: string } = {};
    if (user.displayName) {
      const parts = user.displayName.trim().split(/\s+/);
      updates.firstName = parts[0] || '';
      updates.lastName = parts.slice(1).join(' ') || '';
    }
    if (user.email) updates.email = user.email;
    if (user.phone?.trim()) updates.phone = user.phone.trim();
    if (Object.keys(updates).length > 0) {
      setContactForm((prev) => ({ ...prev, ...updates }));
    }
  }, [user]);

  const handleContactSeller = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!listing || !seller || contactLoading) return;
    setContactLoading(true);
    try {
      const conversation = await getOrCreateConversation({
        listingId: listing.id,
        listingTitle: getListingDisplayTitle(listing),
        listingPhoto: listing.photos[0] || '',
        buyerId: user!.uid,
        buyerName: user!.displayName || 'Acheteur',
        sellerId: listing.sellerId,
        sellerName: seller.companyName,
      });
      router.push(`/messages/${conversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setContactLoading(false);
    }
  };

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!listing || !seller || !user) return;
    const { firstName, lastName, email, phone, message } = contactForm;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !message.trim()) {
      setContactFormError('Tous les champs obligatoires doivent être renseignés.');
      return;
    }
    setContactFormError('');
    setContactFormSubmitting(true);
    try {
      const buyerName = `${firstName.trim()} ${lastName.trim()}`;
      const conversation = await getOrCreateConversation({
        listingId: listing.id,
        listingTitle: getListingDisplayTitle(listing),
        listingPhoto: listing.photos[0] || '',
        buyerId: user.uid,
        buyerName,
        sellerId: listing.sellerId,
        sellerName: seller.companyName,
      });
      const messageContent = phone.trim()
        ? `${message.trim()}\n\nTél. ${phone.trim()}`
        : message.trim();
      await sendMessage({
        conversationId: conversation.id,
        senderId: user.uid,
        senderName: buyerName,
        content: messageContent,
        isBuyer: true,
      });
      if (phone.trim()) {
        const { updateUserProfile } = await import('@/lib/supabase/auth');
        updateUserProfile(user.uid, { phone: phone.trim() }).catch(() => {});
      }
      setContactFormError('');
      setContactFormSubmitting(false);
      setShowContactForm(false);
      setShowLegalMore(false);
    } catch (err) {
      console.error('Error sending contact form:', err);
      setContactFormError('Une erreur est survenue. Réessayez.');
    } finally {
      setContactFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
        <div style={{ maxWidth: 'calc(1100px + 1cm)', margin: '0 auto', padding: '30px calc(24px - 1mm) 60px calc(24px - 1mm)' }}>
          <Link href={fromVendeurParam ? '/vendeur' : returnToCatalogue} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#666', marginBottom: 24 }}>
            <ArrowLeft size={16} />
            {fromVendeurParam ? 'Retour à mes annonces' : 'Retour au catalogue'}
          </Link>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }}>
            {/* Desktop skeleton — même structure que la page produit */}
            <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 40, alignItems: 'stretch' }}>
                <div className="catalogue-skeleton" style={{ flex: '0 0 auto', width: 'min(100%, 520px)', aspectRatio: '1/1', borderRadius: 18 }} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="catalogue-skeleton" style={{ width: 72, height: 28, borderRadius: 4 }} />
                    <div className="catalogue-skeleton" style={{ width: 56, height: 28, borderRadius: 4 }} />
                  </div>
                  <div className="catalogue-skeleton" style={{ height: 32, width: '85%', borderRadius: 4 }} />
                  <div className="catalogue-skeleton" style={{ height: 20, width: 120, borderRadius: 4 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="catalogue-skeleton" style={{ height: 32, width: 100, borderRadius: 4 }} />
                    <div className="catalogue-skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                    <div className="catalogue-skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                  </div>
                  <div style={{ marginTop: 'auto', padding: 28, backgroundColor: '#fafafb', borderRadius: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      <div className="catalogue-skeleton" style={{ width: 80, height: 80, borderRadius: '50%', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="catalogue-skeleton" style={{ height: 24, width: '70%', marginBottom: 8, borderRadius: 4 }} />
                        <div className="catalogue-skeleton" style={{ height: 14, width: 140, borderRadius: 4 }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div className="catalogue-skeleton" style={{ flex: 1, height: 44, borderRadius: 10 }} />
                      <div className="catalogue-skeleton" style={{ flex: 1, height: 44, borderRadius: 10 }} />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="catalogue-skeleton" style={{ width: 60, height: 60, borderRadius: 4 }} />
                ))}
              </div>
            </div>
            {/* Bas de page desktop — 2 colonnes */}
            <div className="hide-mobile" style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 40, width: '100%', marginTop: 0, alignItems: 'start' }}>
              <div style={{ minWidth: 0, paddingRight: 32 }}>
                <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 24 }}>
                  <div className="catalogue-skeleton" style={{ height: 19, width: 140, marginBottom: 16, borderRadius: 4 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <div className="catalogue-skeleton" style={{ height: 14, width: 60, borderRadius: 4 }} />
                        <div className="catalogue-skeleton" style={{ height: 14, width: 80, borderRadius: 4 }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 24, marginTop: 24 }}>
                  <div className="catalogue-skeleton" style={{ height: 19, width: 100, marginBottom: 12, borderRadius: 4 }} />
                  <div className="catalogue-skeleton" style={{ height: 60, width: '100%', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="catalogue-skeleton" style={{ width: '100%', minHeight: 300, borderRadius: 18 }} />
              </div>
            </div>
            {/* Mobile skeleton */}
            <div className="hide-desktop" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="catalogue-skeleton" style={{ aspectRatio: '1/1', maxWidth: 400, margin: '0 auto', borderRadius: 18 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="catalogue-skeleton" style={{ width: 50, height: 50, borderRadius: 12 }} />
                ))}
              </div>
              <div className="catalogue-skeleton" style={{ height: 28, width: '90%', borderRadius: 4 }} />
              <div className="catalogue-skeleton" style={{ height: 24, width: 100, borderRadius: 4 }} />
              <div style={{ padding: 28, backgroundColor: '#fafafb', borderRadius: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div className="catalogue-skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
                  <div>
                    <div className="catalogue-skeleton" style={{ height: 22, width: 140, marginBottom: 6, borderRadius: 4 }} />
                    <div className="catalogue-skeleton" style={{ height: 14, width: 120, borderRadius: 4 }} />
                  </div>
                </div>
                <div className="catalogue-skeleton" style={{ width: '100%', height: 44, borderRadius: 10 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const categoryLabel = CATEGORIES.find((c) => c.value === listing.category)?.label;

  return (
    <>
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 'calc(1100px + 1cm)', margin: '0 auto', padding: '30px calc(24px - 1mm) 60px calc(24px - 1mm)' }}>
        {/* Back button */}
        <Link
          href={fromVendeurParam ? '/vendeur' : returnToCatalogue}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#666', marginBottom: 24 }}
        >
          <ArrowLeft size={16} />
          {fromVendeurParam ? 'Retour à mes annonces' : 'Retour au catalogue'}
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }}>
          {/* Desktop: photo et détails même hauteur (hauteur = photo), puis miniatures en dessous */}
          <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 40, alignItems: 'stretch' }}>
              {/* Photo principale — format carré, clic = agrandir */}
              <div style={{ flex: '0 0 auto', width: 'min(100%, 520px)', aspectRatio: '1/1' }}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => listing.photos[currentPhotoIndex] && setShowPhotoLightbox(true)}
                  onKeyDown={(e) => e.key === 'Enter' && listing.photos[currentPhotoIndex] && setShowPhotoLightbox(true)}
                  style={{ width: '100%', height: '100%', backgroundColor: '#f5f5f7', position: 'relative', overflow: 'hidden', borderRadius: 18, cursor: listing.photos[currentPhotoIndex] ? 'zoom-in' : 'default' }}
                >
                  <ListingPhoto
                    src={listing.photos[currentPhotoIndex]}
                    alt={getListingDisplayTitle(listing)}
                    sizes="(max-width: 768px) 100vw, 520px"
                    priority
                  />
                  {listing.photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(i => i > 0 ? i - 1 : listing.photos.length - 1); }}
                        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, backgroundColor: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(i => i < listing.photos.length - 1 ? i + 1 : 0); }}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, backgroundColor: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
      </div>
      </div>

              {/* Détails — reste de la ligne */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {categoryLabel && listing.category && (
                  <Link href={`/catalogue?category=${encodeURIComponent(listing.category)}`} style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: '#f5f5f5', fontSize: 13, fontWeight: 500, color: 'inherit', textDecoration: 'none', borderRadius: 4 }}>
                    {categoryLabel}
                  </Link>
                )}
                {listing.brand && (
                  <Link href={`/catalogue?brand=${encodeURIComponent(listing.brand)}`} style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: '#f5f5f5', fontSize: 13, fontWeight: 500, color: 'inherit', textDecoration: 'none', borderRadius: 4 }}>
                    {listing.brand}
                  </Link>
                )}
              </div>
              <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: '#0a0a0a' }}>
                {getListingDisplayTitle(listing)}
              </h1>
              {listing.listingNumber && (
                <p style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 15, color: '#888', marginBottom: 16 }}>N° annonce {listing.listingNumber}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <p style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>{formatPrice(listing.price)}</p>
                  {priceStats && (() => {
                    const deal = getDealLevel(listing.price, priceStats.average);
                    return (
                      <button
                        type="button"
                        onClick={() => setShowPrixPopup(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', backgroundColor: '#fff', border: `1px solid ${deal.color}`, borderRadius: 6, fontSize: 12, fontWeight: 500, color: deal.color, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        <span style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: deal.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Euro size={9} color="#fff" strokeWidth={2.5} />
                        </span>
                        {deal.label}
                      </button>
                    );
                  })()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {likesCount > 0 ? (
                    <button
                      onClick={handleFavoriteClick}
                      disabled={favoriteLoading}
                      style={{
                        height: 44,
                        paddingLeft: 14,
                        paddingRight: 14,
                        borderRadius: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: '#fff',
                        color: '#1d1d1f',
                        border: '1.5px solid #d2d2d7',
                        cursor: 'pointer',
                        fontSize: 15,
                        fontWeight: 500,
                      }}
                      title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <span>{likesCount}</span>
                      <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
                    </button>
                  ) : (
                    <button
                      onClick={handleFavoriteClick}
                      disabled={favoriteLoading}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#fff',
                        color: '#1d1d1f',
                        border: '1.5px solid #d2d2d7',
                        cursor: 'pointer',
                      }}
                      title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
                    </button>
                  )}
                  <button
                    onClick={handleShare}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fff',
                      color: '#1d1d1f',
                      border: '1.5px solid #d2d2d7',
                      cursor: 'pointer',
                    }}
                    title="Partager"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              {seller && (
                <div style={{ marginTop: 'auto', padding: 28, backgroundColor: '#fafafb', borderRadius: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {seller.avatarUrl ? (
                        <img src={seller.avatarUrl} alt={seller.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Store size={40} color="#888" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Link href={`/catalogue?sellerId=${seller.uid}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        <h3 style={{ fontSize: 24, fontWeight: 600, margin: 0, marginBottom: 4 }}>{seller.companyName}</h3>
                      </Link>
                      <p style={{ fontSize: 14, color: '#888', margin: 0 }}>Vendeur professionnel</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => { const next = !showPhone; if (next) { const revealerId = isAuthenticated && user?.uid ? user.uid : getVisitorId(); incrementPhoneReveals(listing.id, revealerId ?? undefined).catch(() => {}); } setShowPhone(next); }}
                      style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                    >
                      {showPhone ? (
                        <span style={{ fontSize: 18 }}>{formatPhoneDisplay(seller.phone)}</span>
                      ) : (
                        <>
                          <Phone size={18} />
                          <span style={{ fontSize: 16 }}>N° téléphone</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (!isAuthenticated) setShowAuthModal(true); else setShowContactForm(true); }}
                      style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                    >
                      <MessageCircle size={18} />
                      <span style={{ fontSize: 16 }}>Message</span>
                    </button>
                  </div>
                  {seller.address && (
                    <button
                      type="button"
                      onClick={() => { setMapZoom(15); setShowMapPopup(true); }}
                      style={{ width: '100%', marginTop: 12, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <MapPin size={18} color="#1d1d1f" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 16 }}>{seller.postcode}</span>
                      <span style={{ fontSize: 16 }}>{seller.city}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            </div>

            {/* Miniatures sous la photo */}
            {listing.photos.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'row', gap: 40 }}>
                <div style={{ flex: '1.15 0 0', display: 'flex', gap: 8 }}>
                  {listing.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      style={{
                        position: 'relative',
                        width: 60,
                        height: 60,
                        border: currentPhotoIndex === index ? '2px solid #000' : '1px solid #ddd',
                        padding: 0,
                        cursor: 'pointer',
                        overflow: 'hidden',
                      }}
                    >
                      <ListingPhoto src={photo} alt="" sizes="60px" />
                    </button>
                  ))}
                </div>
                <div style={{ flex: '0.85 0 0' }} />
              </div>
            )}
          </div>

          {/* À partir de la ligne au-dessus d'Informations jusqu'en bas : gauche = contenu, droite = pub (même largeur que cadre vendeur 0.85fr) */}
          <div className="hide-mobile" style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 40, gridColumn: '1 / -1', width: '100%', marginTop: 40, alignItems: 'start' }}>
            <div style={{ minWidth: 0, paddingRight: 32 }}>
            {/* Ligne au-dessus d'Informations : même largeur que la ligne au-dessus de Description (contenu uniquement) */}
            <div style={{ width: '100%', borderTop: '1px solid #e5e5e7', paddingTop: 24 }}>
            {/* Informations puis Description en dessous — 50% gauche */}
            <div className="hide-mobile" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div>
                <h2 className="produit-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: 0, marginBottom: 8 }}>
                  <Info size={19} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, display: 'block', lineHeight: 1 }} />
                  Informations
                </h2>
                <p style={{ fontSize: 13, color: '#6e6e73', marginBottom: 20, marginTop: 0 }}>{getListingDisplayTitle(listing)}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px', minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <Tag size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>Catégorie</span>
                      </div>
                      {listing.category ? (
                        <span title={categoryLabel || listing.category} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{categoryLabel || listing.category}</span>
                      ) : (
                        <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}> </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <Award size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>Marque</span>
                      </div>
                      {listing.brand ? (
                        <span title={listing.brand} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.brand}</span>
                      ) : (
                        <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}> </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <Package size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>Modèle</span>
                      </div>
                      <span title={listing.model ?? ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.model ?? ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <Calendar size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>Année</span>
                      </div>
                      <span title={listing.year != null ? String(listing.year) : ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.year != null ? listing.year : ' '}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                      <div ref={etatInfoRefDesktop} style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, position: 'relative' }}>
                        <CheckCircle size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>État</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const visible = etatInfoClicked || etatInfoHover;
                            if (visible) { setEtatInfoClicked(false); setEtatInfoHover(false); } else { setEtatInfoClicked(true); setEtatInfoHover(false); }
                          }}
                          onMouseEnter={() => setEtatInfoHover(true)}
                          onMouseLeave={() => setEtatInfoHover(false)}
                          aria-label="Informations sur les états"
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, padding: 0,
                            border: '1px solid #d2d2d7', borderRadius: '50%',
                            backgroundColor: etatInfoClicked ? '#1d1d1f' : (etatInfoHover ? '#1d1d1f' : '#fff'),
                            color: etatInfoClicked ? '#fff' : (etatInfoHover ? '#fff' : '#6e6e73'),
                            cursor: 'pointer', transition: 'background-color 0.2s, color 0.2s',
                            boxShadow: etatInfoClicked ? '0 1px 3px rgba(0,0,0,0.12)' : (etatInfoHover ? '0 1px 3px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.04)'),
                          }}
                        >
                          <Info size={13} strokeWidth={2.2} />
                        </button>
                        {(etatInfoClicked || etatInfoHover) && (
                          <div
                            role="tooltip"
                            onMouseEnter={() => setEtatInfoHover(true)}
                            onMouseLeave={() => setEtatInfoHover(false)}
                            style={{
                              position: 'absolute', left: 0, top: '100%', marginTop: 6, zIndex: 20, minWidth: 320, maxWidth: 360,
                              padding: 16, backgroundColor: '#fff', border: '1px solid #e8e6e3', borderRadius: 12,
                              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 13, lineHeight: 1.5, color: '#1d1d1f',
                            }}
                          >
                            {ETAT_DEFINITIONS.map((item) => (
                              <div key={item.title} style={{ marginBottom: item.title === 'État correct' ? 0 : 12 }}>
                                <strong style={{ display: 'block', marginBottom: 4 }}>{item.title}</strong>
                                <span style={{ color: '#6e6e73' }}>{item.text}</span>
                              </div>
                            ))}
                            <p style={{ margin: 0, marginTop: 12, paddingTop: 10, borderTop: '1px solid #eee', fontSize: 12, color: '#6e6e73', lineHeight: 1.5 }}>
                              L&apos;article est montré tel qu&apos;il est sur les photos. La description sert uniquement de repère.
                            </p>
                          </div>
                        )}
                      </div>
                      <span title={listing.condition ? (CONDITIONS.find((c) => c.value === listing.condition)?.label ?? listing.condition) : ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {listing.condition ? (CONDITIONS.find((c) => c.value === listing.condition)?.label ?? listing.condition) : ' '}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <Layers size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>Matière</span>
                      </div>
                      <span title={listing.material ? (MATERIALS.find((m) => m.value === listing.material)?.label ?? listing.material) : ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {listing.material ? (MATERIALS.find((m) => m.value === listing.material)?.label ?? listing.material) : ' '}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <Palette size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>Couleur</span>
                      </div>
                      <span title={listing.color ? (COLORS.find((c) => c.value === listing.color)?.label ?? listing.color) : ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {listing.color ? (COLORS.find((c) => c.value === listing.color)?.label ?? listing.color) : ' '}
                      </span>
                    </div>
                    {listing.size && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <Ruler size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                          <span style={{ color: '#1d1d1f', fontSize: 14 }}>{listing.category === 'chaussures' ? 'Pointure' : 'Taille'}</span>
                        </div>
                        <span title={listing.size} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.category === 'chaussures' ? `${listing.size} EU` : listing.size}</span>
                      </div>
                    )}
                    {listing.category !== 'chaussures' && listing.category !== 'vetements' && (listing.widthCm != null || listing.heightCm != null) && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <Ruler size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>
                          {listing.category === 'montres' ? 'Dimension' : 'Dimensions'}
                        </span>
                      </div>
                      <span title={listing.category === 'montres' ? `${(listing.widthCm != null || listing.heightCm != null) ? Math.round((listing.widthCm ?? listing.heightCm ?? 0) * 10) : ''} mm` : `L ${listing.widthCm != null ? listing.widthCm : ''} × H ${listing.heightCm != null ? listing.heightCm : ''} cm`} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {listing.category === 'montres'
                          ? (listing.widthCm != null || listing.heightCm != null) ? `${Math.round((listing.widthCm ?? listing.heightCm ?? 0) * 10)} mm` : ' '
                          : `L ${listing.widthCm != null ? listing.widthCm : '   '} × H ${listing.heightCm != null ? listing.heightCm : '   '} cm`}
                      </span>
                    </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 24, marginTop: 24 }}>
                <h2 className="produit-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: 0, marginBottom: 8 }}>
                  <FileText size={19} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, display: 'block', lineHeight: 1 }} />
                  Description
                </h2>
                {seller && <p style={{ fontSize: 13, color: '#6e6e73', marginBottom: 20, marginTop: 0 }}><Link href={`/catalogue?sellerId=${seller.uid}`} style={{ color: 'inherit', textDecoration: 'none' }}>{seller.companyName}</Link></p>}
                <div ref={descriptionRefDesktop} style={descriptionExpanded ? undefined : { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' as 'vertical' }}>
                  <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>{listing.description}</p>
                </div>
                {listing.description && (descriptionOverflows || descriptionExpanded) && (
                  <button type="button" onClick={() => setDescriptionExpanded((e) => !e)} style={{ marginTop: 2, padding: 0, background: 'none', border: 'none', fontSize: 13, lineHeight: 1.7, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}>
                    {descriptionExpanded ? 'Voir moins' : 'Voir plus'}
                  </button>
                )}
                {(() => {
                  const has = Array.isArray(listing.packaging) ? listing.packaging : [];
                  const labels: Record<string, string> = { box: 'Boîte', certificat: 'Certificat', facture: 'Facture' };
                  const included = has.filter((key) => labels[key]);
                  if (included.length === 0) return null;
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                      {included.map((key) => (
                        <span key={key} style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: '#e8f5e9', fontSize: 13, fontWeight: 500, color: '#2e7d32', borderRadius: 4 }}>
                          {labels[key]} : Oui
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
              {/* Section Prix — design type barre de comparaison (offre et prix) */}
              <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 24, marginTop: 24 }}>
                <h2 className="produit-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: 0, marginBottom: 8 }}>
                  <Euro size={19} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, display: 'block', lineHeight: 1 }} />
                  Indicateur de marché
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f' }}>{listing.price.toLocaleString('fr-FR')}</span>
                  <span style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f', marginRight: 4 }}>€</span>
                  {priceStats && (() => {
                    const deal = getDealLevel(listing.price, priceStats.average);
                    return (
                      <button
                        type="button"
                        onClick={() => setShowPrixPopup(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', backgroundColor: '#fff', border: `1px solid ${deal.color}`, borderRadius: 6, fontSize: 12, fontWeight: 500, color: deal.color, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        <span style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: deal.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Euro size={10} color="#fff" strokeWidth={2.5} />
                        </span>
                        {deal.label}
                      </button>
                    );
                  })()}
                </div>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <div style={{ height: 8, display: 'flex', gap: 2, borderRadius: 4, overflow: 'hidden', backgroundColor: '#e5e5e7' }}>
                    <div style={{ flex: 1, backgroundColor: '#248a3d' }} />
                    <div style={{ flex: 1, backgroundColor: '#5cb85c' }} />
                    <div style={{ flex: 1, backgroundColor: '#6e6e73' }} />
                    <div style={{ flex: 1, backgroundColor: '#ff9500' }} />
                  </div>
                  {priceStats && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${getBarPositionFromDeal(getDealLevel(listing.price, priceStats.average)) * 100}%`,
                        top: -4,
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '6px solid #1d1d1f',
                        transform: 'translateX(-50%)',
                      }}
                    />
                  )}
                </div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5, margin: 0 }}>
                  {priceStats ? getDealLevel(listing.price, priceStats.average).description : 'Aucune comparaison disponible pour cette annonce.'}
                </p>
                {priceStats && (
                  <p style={{ fontSize: 13, color: '#86868b', lineHeight: 1.5, margin: '4px 0 0', marginTop: 4, marginBottom: 0 }}>
                    Par rapport à {priceStats.count} annonce{priceStats.count > 1 ? 's' : ''} similaire{priceStats.count > 1 ? 's' : ''} (même marque, même type).
                  </p>
                )}
                <p style={{ fontSize: 13, color: '#86868b', lineHeight: 1.5, margin: '12px 0 0', marginTop: 12, marginBottom: 0 }}>
                  L&apos;estimation indiquée est donnée à titre informatif et peut différer de la valeur réelle du marché. Nous vous recommandons de réaliser votre propre analyse.
                </p>
                {!showPrixEnSavoirPlus ? (
                  <button type="button" onClick={() => setShowPrixEnSavoirPlus(true)} style={{ marginTop: 2, padding: 0, background: 'none', border: 'none', fontSize: 13, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}>
                    Voir plus
                  </button>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: '#86868b', lineHeight: 1.5, margin: 0 }}>
                      Cette estimation ne constitue pas une valeur contractuelle et peut comporter des variations ou des erreurs. Nous vous recommandons d&apos;effectuer votre propre comparaison et vos vérifications avant toute décision d&apos;achat.
                    </p>
                    <button type="button" onClick={() => setShowPrixEnSavoirPlus(false)} style={{ marginTop: 2, padding: 0, background: 'none', border: 'none', fontSize: 13, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}>
                      Voir moins
                    </button>
                  </>
                )}
              </div>
            </div>

          {/* Section Vendeur Professionnel — même largeur que les autres (100 % colonne gauche) */}
          {seller && (
            <div style={{ marginTop: 24, borderTop: '1px solid #e5e5e7', paddingTop: 24, width: '100%' }}>
              <h2 className="produit-section-title produit-section-title-vendeur" style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.2, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: 0, marginBottom: 24 }}>
                <Store size={21} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, display: 'block', lineHeight: 1 }} />
                Vendeur professionnel
              </h2>
              <div style={{ maxWidth: 480 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f0f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {seller.avatarUrl ? (
                      <img src={seller.avatarUrl} alt={seller.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Store size={40} color="#888" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link href={`/catalogue?sellerId=${seller.uid}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 6 }}>{seller.companyName}</h3>
                    </Link>
                    {seller.description && (
                      <>
                        <p
                          ref={sellerDescriptionRef}
                          style={{
                            fontSize: 14,
                            color: '#666',
                            margin: 0,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-line',
                            ...(showMoreAbout ? {} : { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' as const }),
                          }}
                        >
                          {seller.description}
                        </p>
                        {(sellerDescriptionOverflows || showMoreAbout) && (
                          <button
                            type="button"
                            onClick={() => setShowMoreAbout((v) => !v)}
                            style={{ marginTop: 6, padding: 0, background: 'none', border: 'none', fontSize: 14, fontWeight: 500, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            {showMoreAbout ? 'Voir moins' : 'Voir plus'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Voir les annonces + carte : même largeur que la ligne au-dessus (100 % section) */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                <Link
                  href={`/catalogue?sellerId=${seller.uid}`}
                  style={{ display: 'block', width: '100%', padding: '14px 20px', backgroundColor: '#1d1d1f', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 500, textAlign: 'center' }}
                >
                  Voir les annonces du vendeur ({sellerListingsCount})
                </Link>
                {(seller.address || seller.postcode || seller.city) && (
                  <button
                    type="button"
                    onClick={() => { setMapZoom(15); setShowMapPopup(true); }}
                    style={{ width: '100%', marginTop: 0, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <MapPin size={18} color="#1d1d1f" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 16 }}>{seller.postcode}</span>
                    <span style={{ fontSize: 16 }}>{seller.city}</span>
                  </button>
                )}
              </div>
            </div>
          )}

            </div>
          </div>
          {/* Section publicité — même largeur que cadre vendeur, uniquement sur PC (pas sur téléphone) */}
          <div className="hide-mobile" style={{ minWidth: 0, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', paddingLeft: 32 }}>
            <div ref={pubVideoWrapRef} style={{ width: '100%', flex: 1, minHeight: 300, padding: '20px 0', backgroundColor: '#f5f5f7', borderRadius: 18, border: '1px solid #e5e5e7', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#888' }}>Publicité</p>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video
                  ref={pubVideoRef}
                  src="/pub-section-luxe.mp4"
                  preload="metadata"
                  loop
                  muted
                  playsInline
                  style={{ width: '84%', maxWidth: '100%', height: 'auto', display: 'block', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                  title="Publicité Section Luxe"
                />
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#888' }}>Publicité</p>
              </div>
            </div>
          </div>
          </div>

          {/* Mobile: single column */}
          <div className="hide-desktop">
            {/* Gallery */}
            <div style={{ marginBottom: 24 }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => listing.photos[currentPhotoIndex] && setShowPhotoLightbox(true)}
                onKeyDown={(e) => e.key === 'Enter' && listing.photos[currentPhotoIndex] && setShowPhotoLightbox(true)}
                style={{ aspectRatio: '1/1', maxWidth: 400, margin: '0 auto 12px', backgroundColor: '#f5f5f7', position: 'relative', overflow: 'hidden', borderRadius: 18, cursor: listing.photos[currentPhotoIndex] ? 'zoom-in' : 'default' }}
              >
                <ListingPhoto
                  src={listing.photos[currentPhotoIndex]}
                  alt={getListingDisplayTitle(listing)}
                  sizes="(max-width: 768px) 100vw, 520px"
                  priority
                />
              </div>
              {listing.photos.length > 1 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                  {listing.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      style={{ position: 'relative', width: 50, height: 50, flexShrink: 0, border: currentPhotoIndex === index ? '2px solid #1d1d1f' : '1px solid #d2d2d7', borderRadius: 12, padding: 0, cursor: 'pointer', overflow: 'hidden' }}
                    >
                      <ListingPhoto src={photo} alt="" sizes="50px" />
                    </button>
                  ))}
                </div>
              )}

              {/* Informations puis Description en dessous - mobile */}
              <div style={{ marginTop: 20, borderTop: '1px solid #e5e5e7', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: 0, marginBottom: 6 }}>
                  <Info size={19} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, display: 'block', lineHeight: 1 }} />
                  Informations
                </h2>
                  <p style={{ fontSize: 12, color: '#6e6e73', marginBottom: 14, marginTop: 0 }}>{getListingDisplayTitle(listing)}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px', minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Tag size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>Catégorie</span>
                      </div>
                      {listing.category ? (
                        <span title={categoryLabel || listing.category} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{categoryLabel || listing.category}</span>
                      ) : (
                        <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13 }}> </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Award size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>Marque</span>
                      </div>
                      {listing.brand ? (
                        <span title={listing.brand} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.brand}</span>
                      ) : (
                        <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13 }}> </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Package size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>Modèle</span>
                      </div>
                      <span title={listing.model ?? ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.model || ' '}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Calendar size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>Année</span>
                      </div>
                      <span title={listing.year != null ? String(listing.year) : ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.year != null ? listing.year : ' '}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                      <div ref={etatInfoRefMobile} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative' }}>
                        <CheckCircle size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>État</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const visible = etatInfoClicked || etatInfoHover;
                            if (visible) { setEtatInfoClicked(false); setEtatInfoHover(false); } else { setEtatInfoClicked(true); setEtatInfoHover(false); }
                          }}
                          onMouseEnter={() => setEtatInfoHover(true)}
                          onMouseLeave={() => setEtatInfoHover(false)}
                          aria-label="Informations sur les états"
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, padding: 0,
                            border: '1px solid #d2d2d7', borderRadius: '50%',
                            backgroundColor: etatInfoClicked ? '#1d1d1f' : (etatInfoHover ? '#1d1d1f' : '#fff'),
                            color: etatInfoClicked ? '#fff' : (etatInfoHover ? '#fff' : '#6e6e73'),
                            cursor: 'pointer', transition: 'background-color 0.2s, color 0.2s',
                            boxShadow: etatInfoClicked ? '0 1px 3px rgba(0,0,0,0.12)' : (etatInfoHover ? '0 1px 3px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.04)'),
                          }}
                        >
                          <Info size={12} strokeWidth={2.2} />
                        </button>
                        {(etatInfoClicked || etatInfoHover) && (
                          <div
                            role="tooltip"
                            onMouseEnter={() => setEtatInfoHover(true)}
                            onMouseLeave={() => setEtatInfoHover(false)}
                            style={{
                              position: 'absolute', left: 0, top: '100%', marginTop: 6, zIndex: 20, minWidth: 280, maxWidth: 340,
                              padding: 14, backgroundColor: '#fff', border: '1px solid #e8e6e3', borderRadius: 12,
                              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 12, lineHeight: 1.5, color: '#1d1d1f',
                            }}
                          >
                            {ETAT_DEFINITIONS.map((item) => (
                              <div key={item.title} style={{ marginBottom: item.title === 'État correct' ? 0 : 10 }}>
                                <strong style={{ display: 'block', marginBottom: 2 }}>{item.title}</strong>
                                <span style={{ color: '#6e6e73' }}>{item.text}</span>
                              </div>
                            ))}
                            <p style={{ margin: 0, marginTop: 10, paddingTop: 8, borderTop: '1px solid #eee', fontSize: 11, color: '#6e6e73', lineHeight: 1.5 }}>
                              L&apos;article est montré tel qu&apos;il est sur les photos. La description sert uniquement de repère.
                            </p>
                          </div>
                        )}
                      </div>
                      <span title={listing.condition ? (CONDITIONS.find((c) => c.value === listing.condition)?.label ?? listing.condition) : ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {listing.condition ? (CONDITIONS.find((c) => c.value === listing.condition)?.label ?? listing.condition) : ' '}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Layers size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>Matière</span>
                      </div>
                      <span title={listing.material ? (MATERIALS.find((m) => m.value === listing.material)?.label ?? listing.material) : ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {listing.material ? (MATERIALS.find((m) => m.value === listing.material)?.label ?? listing.material) : ' '}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Palette size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>Couleur</span>
                      </div>
                      <span title={listing.color ? (COLORS.find((c) => c.value === listing.color)?.label ?? listing.color) : ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {listing.color ? (COLORS.find((c) => c.value === listing.color)?.label ?? listing.color) : ' '}
                      </span>
                    </div>
                    {listing.size && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <Ruler size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                          <span style={{ color: '#1d1d1f', fontSize: 13 }}>{listing.category === 'chaussures' ? 'Pointure' : 'Taille'}</span>
                        </div>
                        <span title={listing.size} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.category === 'chaussures' ? `${listing.size} EU` : listing.size}</span>
                      </div>
                    )}
                    {listing.category !== 'chaussures' && listing.category !== 'vetements' && (listing.widthCm != null || listing.heightCm != null) && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Ruler size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>
                          {listing.category === 'montres' ? 'Dimension' : 'Dimensions'}
                        </span>
                      </div>
                      <span title={listing.category === 'montres' ? `${(listing.widthCm != null || listing.heightCm != null) ? Math.round((listing.widthCm ?? listing.heightCm ?? 0) * 10) : ''} mm` : `L ${listing.widthCm != null ? listing.widthCm : ''} × H ${listing.heightCm != null ? listing.heightCm : ''} cm`} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {listing.category === 'montres'
                          ? (listing.widthCm != null || listing.heightCm != null) ? `${Math.round((listing.widthCm ?? listing.heightCm ?? 0) * 10)} mm` : ' '
                          : `L ${listing.widthCm != null ? listing.widthCm : '   '} × H ${listing.heightCm != null ? listing.heightCm : '   '} cm`}
                      </span>
                    </div>
                    )}
                  </div>
                </div>
                </div>
                <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 20, marginTop: 20 }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: 0, marginBottom: 6 }}>
                  <FileText size={19} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, display: 'block', lineHeight: 1 }} />
                  Description
                </h2>
                  {seller && <p style={{ fontSize: 12, color: '#6e6e73', marginBottom: 14, marginTop: 0 }}><Link href={`/catalogue?sellerId=${seller.uid}`} style={{ color: 'inherit', textDecoration: 'none' }}>{seller.companyName}</Link></p>}
                  <div ref={descriptionRefMobile} style={descriptionExpanded ? undefined : { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' as 'vertical' }}>
                    <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>{listing.description}</p>
                  </div>
                  {listing.description && (descriptionOverflows || descriptionExpanded) && (
                    <button type="button" onClick={() => setDescriptionExpanded((e) => !e)} style={{ marginTop: 2, padding: 0, background: 'none', border: 'none', fontSize: 12, lineHeight: 1.7, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}>
                      {descriptionExpanded ? 'Voir moins' : 'Voir plus'}
                    </button>
                  )}
                  {(() => {
                    const has = Array.isArray(listing.packaging) ? listing.packaging : [];
                    const labels: Record<string, string> = { box: 'Boîte', certificat: 'Certificat', facture: 'Facture' };
                    const included = has.filter((key) => labels[key]);
                    if (included.length === 0) return null;
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                        {included.map((key) => (
                          <span key={key} style={{ display: 'inline-block', padding: '5px 10px', backgroundColor: '#e8f5e9', fontSize: 12, fontWeight: 500, color: '#2e7d32', borderRadius: 4 }}>
                            {labels[key]} : Oui
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                {/* Section Prix - mobile */}
                <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 20, marginTop: 20 }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: 0, marginBottom: 6 }}>
                    <Euro size={19} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, display: 'block', lineHeight: 1 }} />
                    Indicateur de marché
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f' }}>{listing.price.toLocaleString('fr-FR')}</span>
                    <span style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', marginRight: 2 }}>€</span>
                    {priceStats && (() => {
                      const deal = getDealLevel(listing.price, priceStats.average);
                      return (
                        <button
                          type="button"
                          onClick={() => setShowPrixPopup(true)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', backgroundColor: '#fff', border: `1px solid ${deal.color}`, borderRadius: 5, fontSize: 11, fontWeight: 500, color: deal.color, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          <span style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: deal.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Euro size={9} color="#fff" strokeWidth={2.5} />
                          </span>
                          {deal.label}
                        </button>
                      );
                    })()}
                  </div>
                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    <div style={{ height: 6, display: 'flex', gap: 1, borderRadius: 3, overflow: 'hidden', backgroundColor: '#e5e5e7' }}>
                      <div style={{ flex: 1, backgroundColor: '#248a3d' }} />
                      <div style={{ flex: 1, backgroundColor: '#5cb85c' }} />
                      <div style={{ flex: 1, backgroundColor: '#6e6e73' }} />
                      <div style={{ flex: 1, backgroundColor: '#ff9500' }} />
                    </div>
                    {priceStats && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${getBarPositionFromDeal(getDealLevel(listing.price, priceStats.average)) * 100}%`,
                          top: -3,
                          width: 0,
                          height: 0,
                          borderLeft: '4px solid transparent',
                          borderRight: '4px solid transparent',
                          borderTop: '5px solid #1d1d1f',
                          transform: 'translateX(-50%)',
                        }}
                      />
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5, margin: 0 }}>
                    {priceStats ? getDealLevel(listing.price, priceStats.average).description : 'Aucune comparaison disponible pour cette annonce.'}
                  </p>
                  {priceStats && (
                    <p style={{ fontSize: 12, color: '#86868b', lineHeight: 1.5, margin: '4px 0 0', marginTop: 4, marginBottom: 0 }}>
                      Par rapport à {priceStats.count} annonce{priceStats.count > 1 ? 's' : ''} similaire{priceStats.count > 1 ? 's' : ''} (même marque, même type).
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: '#86868b', lineHeight: 1.5, margin: '10px 0 0', marginTop: 10, marginBottom: 0 }}>
                    L&apos;estimation indiquée est donnée à titre informatif et peut différer de la valeur réelle du marché. Nous vous recommandons de réaliser votre propre analyse.
                  </p>
                  {!showPrixEnSavoirPlus ? (
                    <button type="button" onClick={() => setShowPrixEnSavoirPlus(true)} style={{ marginTop: 2, padding: 0, background: 'none', border: 'none', fontSize: 12, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}>
                      Voir plus
                    </button>
                  ) : (
                    <>
                      <p style={{ fontSize: 12, color: '#86868b', lineHeight: 1.5, margin: 0 }}>
                        Cette estimation ne constitue pas une valeur contractuelle et peut comporter des variations ou des erreurs. Nous vous recommandons d&apos;effectuer votre propre comparaison et vos vérifications avant toute décision d&apos;achat.
                      </p>
                      <button type="button" onClick={() => setShowPrixEnSavoirPlus(false)} style={{ marginTop: 2, padding: 0, background: 'none', border: 'none', fontSize: 12, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}>
                        Voir moins
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {categoryLabel && listing.category && (
                <Link href={`/catalogue?category=${encodeURIComponent(listing.category)}`} style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: '#f5f5f5', fontSize: 13, fontWeight: 500, color: 'inherit', textDecoration: 'none', borderRadius: 4 }}>{categoryLabel}</Link>
              )}
              {listing.brand && (
                <Link href={`/catalogue?brand=${encodeURIComponent(listing.brand)}`} style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: '#f5f5f5', fontSize: 13, fontWeight: 500, color: 'inherit', textDecoration: 'none', borderRadius: 4 }}>{listing.brand}</Link>
              )}
            </div>
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, fontWeight: 500, marginBottom: 12, color: '#0a0a0a' }}>{getListingDisplayTitle(listing)}</h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{formatPrice(listing.price)}</p>
                {priceStats && (() => {
                  const deal = getDealLevel(listing.price, priceStats.average);
                  return (
                    <button
                      type="button"
                      onClick={() => setShowPrixPopup(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', backgroundColor: '#fff', border: `1px solid ${deal.color}`, borderRadius: 5, fontSize: 11, fontWeight: 500, color: deal.color, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: deal.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Euro size={8} color="#fff" strokeWidth={2.5} />
                      </span>
                      {deal.label}
                    </button>
                  );
                })()}
              </div>
              {likesCount > 0 ? (
                <button
                  onClick={handleFavoriteClick}
                  disabled={favoriteLoading}
                  style={{
                    height: 40,
                    paddingLeft: 12,
                    paddingRight: 12,
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    backgroundColor: '#fff',
                    color: '#1d1d1f',
                    border: '1.5px solid #d2d2d7',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                  title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <span>{likesCount}</span>
                  <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                </button>
              ) : (
                <button
                  onClick={handleFavoriteClick}
                  disabled={favoriteLoading}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    color: '#1d1d1f',
                    border: '1.5px solid #d2d2d7',
                    cursor: 'pointer',
                  }}
                  title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                </button>
              )}
              <button
                onClick={handleShare}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fff',
                  color: '#1d1d1f',
                  border: '1.5px solid #d2d2d7',
                  cursor: 'pointer',
                }}
                title="Partager"
              >
                <Share2 size={18} />
              </button>
            </div>

            {seller && (
              <div style={{ padding: 24, backgroundColor: '#fafafb', borderRadius: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {seller.avatarUrl ? (
                      <img src={seller.avatarUrl} alt={seller.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Store size={34} color="#888" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link href={`/catalogue?sellerId=${seller.uid}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      <h3 style={{ fontSize: 22, fontWeight: 600, margin: 0, marginBottom: 2 }}>{seller.companyName}</h3>
                    </Link>
                    <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Vendeur professionnel</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button type="button" onClick={() => { const next = !showPhone; if (next) { const revealerId = isAuthenticated && user?.uid ? user.uid : getVisitorId(); incrementPhoneReveals(listing.id, revealerId ?? undefined).catch(() => {}); } setShowPhone(next); }} style={{ flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    {showPhone ? (
                      <span style={{ fontSize: 17 }}>{formatPhoneDisplay(seller.phone)}</span>
                    ) : (
                      <>
                        <Phone size={16} />
                        <span style={{ fontSize: 15 }}>N° téléphone</span>
                      </>
                    )}
                  </button>
                  <button type="button" onClick={() => { if (!isAuthenticated) setShowAuthModal(true); else setShowContactForm(true); }} style={{ flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    <MessageCircle size={16} />
                    <span style={{ fontSize: 15 }}>Message</span>
                  </button>
                </div>
                {seller.address && (
                  <button
                    type="button"
                    onClick={() => { setMapZoom(15); setShowMapPopup(true); }}
                    style={{ width: '100%', marginTop: 12, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <MapPin size={16} color="#1d1d1f" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 15 }}>{seller.postcode}</span>
                    <span style={{ fontSize: 15 }}>{seller.city}</span>
                  </button>
                )}
              </div>
            )}
          </div>

      </div>
      </div>

      {/* Boutons Signaler / Conseils de sécurité + infos annonce */}
      <div style={{ maxWidth: 960, margin: 'calc(24px - 1cm) auto 40px', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => { setShowReportModal(true); setReportError(''); setReportStep(1); setReportRgpdExpanded(false); }}
            style={{
              padding: '10px 22px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 999,
              border: '1px solid #d2d2d7',
              backgroundColor: '#fff',
              color: '#1d1d1f',
              cursor: 'pointer',
            }}
          >
            Signaler cette annonce
          </button>
          <button
            type="button"
            onClick={() => setShowSecurityModal(true)}
            style={{
              padding: '10px 22px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 999,
              border: '1px solid #d2d2d7',
              backgroundColor: '#fff',
              color: '#1d1d1f',
              cursor: 'pointer',
            }}
          >
            Conseils de sécurité
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 12, color: '#86868b' }}>
          <span>N° annonce {listing.listingNumber || listing.id}</span>
          <span style={{ margin: '0 10px' }}>|</span>
          <span>
            {(() => {
              const days = Math.floor((Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24));
              if (days > 30) return 'Publiée il y a plus de 30 jours';
              const n = Math.max(1, days);
              return `Publiée il y a ${n} jour${n > 1 ? 's' : ''}`;
            })()}
          </span>
        </div>
      </div>

      {/* Popup Rendre visite au vendeur */}
      {showMapPopup && seller && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowMapPopup(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ padding: 24 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 16, paddingRight: 36 }}>
                <h2 style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>Rendre visite au vendeur</h2>
                <button type="button" onClick={() => setShowMapPopup(false)} style={{ position: 'absolute', right: 0, top: -6, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#f5f5f7', borderRadius: 10, cursor: 'pointer' }} aria-label="Fermer">
                  <X size={20} />
                </button>
              </div>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 8 }}><Link href={`/catalogue?sellerId=${seller.uid}`} style={{ color: 'inherit', textDecoration: 'none' }}>{seller.companyName}</Link></p>
              <p style={{ fontSize: 14, color: '#666', margin: 0, marginBottom: 16 }}>{seller.address}</p>
              <div style={{ position: 'relative', width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                <iframe
                  title="Carte du vendeur"
                  src={`https://www.google.com/maps?q=${encodeURIComponent([seller.address, seller.postcode, seller.city].filter(Boolean).join(', '))}&z=${mapZoom}&output=embed`}
                  style={{ width: '100%', height: '100%', border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMapZoom((z) => Math.min(20, z + 1)); }}
                    style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
                    title="Zoom avant"
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMapZoom((z) => Math.max(10, z - 1)); }}
                    style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
                    title="Zoom arrière"
                  >
                    <Minus size={18} />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowMapPopup(false); if (!isAuthenticated) setShowAuthModal(true); else setShowContactForm(true); }}
                style={{ width: '100%', height: 48, backgroundColor: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}
              >
                Contacter le vendeur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Message / Contacter le vendeur */}
      {showContactForm && listing && seller && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => { setShowContactForm(false); setContactFormError(''); setShowLegalMore(false); }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 24 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 16, paddingRight: 36 }}>
              <h2 style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>Contacter le vendeur</h2>
              <button type="button" onClick={() => { setShowContactForm(false); setContactFormError(''); setShowLegalMore(false); }} style={{ position: 'absolute', right: 0, top: -6, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#f5f5f7', borderRadius: 10, cursor: 'pointer' }} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            {contactFormError && (
              <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{contactFormError}</p>
            )}
            <form onSubmit={handleContactFormSubmit}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: '#555' }}>Prénom *</label>
                  <input required value={contactForm.firstName} onChange={(e) => setContactForm((p) => ({ ...p, firstName: e.target.value }))} style={{ width: '100%', height: 44, padding: '0 12px', fontSize: 14, border: '1px solid #d2d2d7', borderRadius: 10 }} placeholder="Prénom" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: '#555' }}>Nom *</label>
                  <input required value={contactForm.lastName} onChange={(e) => setContactForm((p) => ({ ...p, lastName: e.target.value }))} style={{ width: '100%', height: 44, padding: '0 12px', fontSize: 14, border: '1px solid #d2d2d7', borderRadius: 10 }} placeholder="Nom" />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: '#555' }}>Email *</label>
                <input type="email" required value={contactForm.email} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} style={{ width: '100%', height: 44, padding: '0 12px', fontSize: 14, border: '1px solid #d2d2d7', borderRadius: 10 }} placeholder="email@exemple.fr" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: '#555' }}>Téléphone</label>
                <input type="tel" value={contactForm.phone} onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))} style={{ width: '100%', height: 44, padding: '0 12px', fontSize: 14, border: '1px solid #d2d2d7', borderRadius: 10 }} placeholder="+33 6 12 34 56 78" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: '#555' }}>Message *</label>
                <textarea required value={contactForm.message} onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))} rows={4} style={{ width: '100%', padding: 12, fontSize: 14, border: '1px solid #d2d2d7', borderRadius: 10, resize: 'vertical' }} placeholder="Votre message" />
              </div>
              <p style={{ fontSize: 11, color: '#666', marginBottom: 16, whiteSpace: 'pre-line' }}>
                {!showLegalMore ? (
                  <>
                    {`Obligatoire *

Le vendeur pourra vous répondre directement depuis sa messagerie Section Luxe, veuillez ne pas mentionner vos données personnelles dans le contenu de votre message.

Les données que vous renseignez dans ce formulaire sont traitées par Section Luxe en qualité de responsable de traitement. `}
                    <button type="button" onClick={() => setShowLegalMore(true)} style={{ background: 'none', border: 'none', fontSize: 11, color: '#1d1d1f', fontWeight: 600, cursor: 'pointer', padding: 0, marginLeft: 4, textDecoration: 'underline' }}>Afficher plus</button>
                  </>
                ) : (
                  <>
                    {`Obligatoire *

Le vendeur pourra vous répondre directement depuis sa messagerie Section Luxe, veuillez ne pas mentionner vos données personnelles dans le contenu de votre message.

Les données que vous renseignez dans ce formulaire sont traitées par Section Luxe en qualité de responsable de traitement. Elles sont transmises directement au vendeur que vous souhaitez contacter et le cas échéant, aux vendeurs professionnels. Ces données sont utilisées à des fins de : mise en relation avec le vendeur que vous souhaitez contacter ; mesure et étude de l'audience du site, évaluer son utilisation et améliorer ses services ; lutte anti-fraude ; gestion de vos demandes d'exercice de vos droits. Vous disposez d'un droit d'accès, de rectification, d'effacement de ces données, d'un droit de limitation du traitement, d'un droit d'opposition, du droit à la portabilité de vos données et du droit d'introduire une réclamation auprès d'une autorité de contrôle (en France, la CNIL). Vous pouvez également retirer à tout moment votre consentement au traitement de vos données. Pour en savoir plus sur le traitement de vos données : `}
                    <a href="https://www.sectionluxe.fr/politique-confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: '#1d1d1f', textDecoration: 'underline' }}>https://www.sectionluxe.fr/politique-confidentialite</a>
                    {' '}
                    <button type="button" onClick={() => setShowLegalMore(false)} style={{ background: 'none', border: 'none', fontSize: 11, color: '#1d1d1f', fontWeight: 600, cursor: 'pointer', padding: 0, marginLeft: 4, textDecoration: 'underline' }}>Afficher moins</button>
                  </>
                )}
              </p>
              <button type="submit" disabled={contactFormSubmitting} style={{ width: '100%', height: 48, backgroundColor: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: contactFormSubmitting ? 'not-allowed' : 'pointer' }}>
                {contactFormSubmitting ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Popup Signalement d'annonce */}
      {showReportModal && listing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => { setShowReportModal(false); setReportError(''); setReportStep(1); setReportRgpdExpanded(false); }}
          />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 560,
              maxHeight: '90vh',
              overflow: 'auto',
              backgroundColor: '#fff',
              borderRadius: 18,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 24 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 16, paddingRight: 36 }}>
              {reportStep === 2 && (
                <button
                  type="button"
                  onClick={() => setReportStep(1)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#1d1d1f',
                  }}
                  aria-label="Revenir à l'étape 1"
                >
                  <ChevronLeft size={24} strokeWidth={2.5} />
                </button>
              )}
              <h2
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: 'var(--font-inter), var(--font-sans)',
                  fontSize: 19,
                  fontWeight: 600,
                  margin: 0,
                  color: '#0a0a0a',
                  textAlign: 'center',
                  paddingBottom: 16,
                  borderBottom: '1px solid #e5e5e7',
                }}
              >
                Signaler cette annonce
              </h2>
              <button
                type="button"
                onClick={() => { setShowReportModal(false); setReportError(''); setReportStep(1); setReportRgpdExpanded(false); }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: -6,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: '#f5f5f7',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            {reportError && (
              <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16, textAlign: 'center' }}>{reportError}</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, padding: '0 36px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 980, backgroundColor: '#1d1d1f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600 }}>1</div>
              <div style={{ width: 56, height: 2, backgroundColor: reportStep >= 2 ? '#1d1d1f' : '#d2d2d7', margin: '0 10px', borderRadius: 1 }} />
              <div style={{ width: 40, height: 40, borderRadius: 980, backgroundColor: reportStep >= 2 ? '#1d1d1f' : '#d2d2d7', color: reportStep >= 2 ? '#fff' : '#86868b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600 }}>2</div>
            </div>

            <form onSubmit={handleReportSubmit}>
              {reportStep === 1 ? (
                <>
                  {/* Motif du signalement */}
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', marginBottom: 10 }}>
                      Pour quel motif souhaitez-vous signaler cette annonce ? *
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#1d1d1f' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="report-reason"
                          value="Suspicion de fraude"
                          checked={reportReason === 'Suspicion de fraude'}
                          onChange={() => setReportReason('Suspicion de fraude')}
                          style={{ marginTop: 3, width: 20, height: 20, flexShrink: 0, accentColor: '#1d1d1f' }}
                        />
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>Suspicion de fraude</span>
                          <span style={{ fontSize: 13, color: '#86868b', fontWeight: 400 }}>L&apos;annonce semble présenter un risque ou un comportement trompeur.</span>
                        </span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="report-reason"
                          value="Informations inexactes"
                          checked={reportReason === 'Informations inexactes'}
                          onChange={() => setReportReason('Informations inexactes')}
                          style={{ marginTop: 3, width: 20, height: 20, flexShrink: 0, accentColor: '#1d1d1f' }}
                        />
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>Informations inexactes</span>
                          <span style={{ fontSize: 13, color: '#86868b', fontWeight: 400 }}>Des éléments du descriptif ou des caractéristiques semblent incorrects.</span>
                        </span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="report-reason"
                          value="Article indisponible"
                          checked={reportReason === 'Article indisponible'}
                          onChange={() => setReportReason('Article indisponible')}
                          style={{ marginTop: 3, width: 20, height: 20, flexShrink: 0, accentColor: '#1d1d1f' }}
                        />
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>Article indisponible</span>
                          <span style={{ fontSize: 13, color: '#86868b', fontWeight: 400 }}>Le produit semble vendu ou retiré mais reste affiché en ligne.</span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!reportReason) {
                        setReportError('Veuillez sélectionner un motif.');
                        return;
                      }
                      setReportError('');
                      setReportStep(2);
                    }}
                    style={{
                      width: '100%',
                      height: 48,
                      backgroundColor: '#1d1d1f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 15,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Continuer
                  </button>
                </>
              ) : (
                <>
                  {/* Rappel du motif */}
                  <div style={{ marginBottom: 18, padding: '10px 12px', backgroundColor: '#f5f5f7', borderRadius: 10, fontSize: 13, color: '#1d1d1f', textAlign: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Motif : </span>{reportReason}
                  </div>

              {/* Informations du déclarant */}
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', marginBottom: 10 }}>
                  Informations du déclarant
                </p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 400, marginBottom: 4, color: '#1d1d1f' }}>
                      Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      style={{
                        width: '100%',
                        height: 42,
                        padding: '0 12px',
                        fontSize: 14,
                        border: '1px solid #d2d2d7',
                        borderRadius: 10,
                      }}
                      placeholder="Votre nom"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 400, marginBottom: 4, color: '#1d1d1f' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      style={{
                        width: '100%',
                        height: 42,
                        padding: '0 12px',
                        fontSize: 14,
                        border: '1px solid #d2d2d7',
                        borderRadius: 10,
                      }}
                      placeholder="email@exemple.fr"
                    />
                  </div>
                </div>
              </div>

              {/* Détail du signalement */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 400, marginBottom: 6, color: '#1d1d1f' }}>
                  Merci de préciser les éléments justifiant votre signalement *
                </label>
                <textarea
                  required
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 14,
                    border: '1px solid #d2d2d7',
                    borderRadius: 10,
                    resize: 'vertical',
                  }}
                  placeholder="Détaillez les éléments qui vous semblent problématiques..."
                />
              </div>

              {/* Déclaration obligatoire */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, fontWeight: 400, color: '#1d1d1f', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reportCertify}
                    onChange={(e) => setReportCertify(e.target.checked)}
                    style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: '#1d1d1f' }}
                  />
                  <span style={{ lineHeight: 1.5 }}>
                    Je certifie que ce signalement est effectué de bonne foi et que les informations fournies sont exactes à ma connaissance.
                  </span>
                </label>
              </div>

              {/* Information RGPD */}
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, marginBottom: 16, whiteSpace: 'pre-line' }}>
                {reportRgpdExpanded ? (
                  <>
                    {`Les informations collectées via ce formulaire sont traitées par Section Luxe en qualité de responsable de traitement. Les champs obligatoires sont nécessaires pour permettre l'examen du signalement.

Ces données sont utilisées pour :
- analyser et traiter les signalements,
- assurer la modération des contenus,
- prévenir les fraudes,
- améliorer la sécurité et la qualité des services.

Conformément à la réglementation applicable, vous disposez de droits d'accès, de rectification, d'effacement, d'opposition, de limitation et de portabilité de vos données.
Vous pouvez également introduire une réclamation auprès de l'autorité de contrôle compétente.`}
                    {'\n\n'}
                    Pour plus d&apos;informations, consultez notre{' '}
                    <Link href="/politique-confidentialite" style={{ color: '#1d1d1f', textDecoration: 'underline' }}>
                      Politique de confidentialité
                    </Link>
                    .{' '}
                    <button type="button" onClick={() => setReportRgpdExpanded(false)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#1d1d1f', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>voir moins</button>
                  </>
                ) : (
                  <>
                    {`Les informations collectées via ce formulaire sont traitées par Section Luxe en qualité de responsable de traitement. Les champs obligatoires sont nécessaires pour permettre l'examen du signalement.

Ces données sont utilisées pour :`}
                    {' '}
                    <button type="button" onClick={() => setReportRgpdExpanded(true)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#1d1d1f', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>voir plus</button>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={reportSubmitting}
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: '#1d1d1f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: reportSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {reportSubmitting ? 'Envoi du signalement...' : 'Envoyer le signalement'}
              </button>
                </>
              )}
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Popup Section Prix */}
      {showPrixPopup && listing && (
        <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowPrixPopup(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 24 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 16, paddingRight: 36 }}>
                <h2 style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>
                  Indicateur de marché
                </h2>
                <button type="button" onClick={() => setShowPrixPopup(false)} style={{ position: 'absolute', right: 0, top: -6, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#f5f5f7', borderRadius: 10, cursor: 'pointer' }} aria-label="Fermer">
                  <X size={20} />
                </button>
              </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f' }}>{listing.price.toLocaleString('fr-FR')}</span>
              <span style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f', marginRight: 4 }}>€</span>
              {priceStats && (() => {
                const deal = getDealLevel(listing.price, priceStats.average);
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', backgroundColor: '#fff', border: `1px solid ${deal.color}`, borderRadius: 6, fontSize: 12, fontWeight: 500, color: deal.color }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: deal.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Euro size={10} color="#fff" strokeWidth={2.5} />
                    </span>
                    {deal.label}
                  </span>
                );
              })()}
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={{ height: 8, display: 'flex', gap: 2, borderRadius: 4, overflow: 'hidden', backgroundColor: '#e5e5e7' }}>
                <div style={{ flex: 1, backgroundColor: '#248a3d' }} />
                <div style={{ flex: 1, backgroundColor: '#5cb85c' }} />
                <div style={{ flex: 1, backgroundColor: '#6e6e73' }} />
                <div style={{ flex: 1, backgroundColor: '#ff9500' }} />
              </div>
              {priceStats && (
                <div style={{ position: 'absolute', left: `${getBarPositionFromDeal(getDealLevel(listing.price, priceStats.average)) * 100}%`, top: -4, width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '6px solid #1d1d1f', transform: 'translateX(-50%)' }} />
              )}
            </div>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5, margin: 0 }}>
              {priceStats ? getDealLevel(listing.price, priceStats.average).description : 'Aucune comparaison disponible pour cette annonce.'}
            </p>
            {priceStats && (
              <p style={{ fontSize: 13, color: '#86868b', lineHeight: 1.5, margin: '4px 0 0', marginTop: 4, marginBottom: 0 }}>
                Par rapport à {priceStats.count} annonce{priceStats.count > 1 ? 's' : ''} similaire{priceStats.count > 1 ? 's' : ''} (même marque, même type).
              </p>
            )}
            <p style={{ fontSize: 13, color: '#86868b', lineHeight: 1.5, margin: '12px 0 0', marginTop: 12, marginBottom: 0 }}>
              L&apos;estimation indiquée est donnée à titre informatif et peut différer de la valeur réelle du marché. Nous vous recommandons de réaliser votre propre analyse.
            </p>
            {!showPrixEnSavoirPlus ? (
              <button type="button" onClick={() => setShowPrixEnSavoirPlus(true)} style={{ marginTop: 2, padding: 0, background: 'none', border: 'none', fontSize: 13, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}>Voir plus</button>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#86868b', lineHeight: 1.5, margin: 0 }}>Cette estimation ne constitue pas une valeur contractuelle et peut comporter des variations ou des erreurs. Nous vous recommandons d&apos;effectuer votre propre comparaison et vos vérifications avant toute décision d&apos;achat.</p>
                <button type="button" onClick={() => setShowPrixEnSavoirPlus(false)} style={{ marginTop: 2, padding: 0, background: 'none', border: 'none', fontSize: 13, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}>Voir moins</button>
              </>
            )}
          </div>
        </div>
        </div>
        </>
      )}

      {/* Popup Conseils de sécurité */}
      {(() => {
        if (!showSecurityModal) return null;
        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowSecurityModal(false)}
          />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 560,
              maxHeight: '90vh',
              overflow: 'auto',
              backgroundColor: '#fff',
              borderRadius: 18,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 24 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 16, paddingRight: 36 }}>
                <h2
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: 'var(--font-inter), var(--font-sans)',
                    fontSize: 19,
                    fontWeight: 600,
                    margin: 0,
                    color: '#0a0a0a',
                    textAlign: 'center',
                    paddingBottom: 16,
                    borderBottom: '1px solid #e5e5e7',
                  }}
                >
                  Conseils de sécurité
                </h2>
                <button
                  type="button"
                  onClick={() => setShowSecurityModal(false)}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: -6,
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: '#f5f5f7',
                    borderRadius: 10,
                    cursor: 'pointer',
                  }}
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 16 }}>
              Nos recommandations pour acheter en toute sérénité auprès des professionnels :
            </p>
            <ul style={{ fontSize: 14, color: '#555', lineHeight: 1.6, paddingLeft: 20, marginBottom: 4, listStyleType: 'disc' }}>
              <li style={{ marginBottom: 8 }}>
                Ne versez jamais d’acompte avant d’avoir vu le produit ou obtenu des éléments de vérification suffisants, même en cas d’urgence invoquée par le vendeur.
              </li>
              <li style={{ marginBottom: 8 }}>
                Privilégiez un échange direct avec le vendeur et assurez-vous de l’authenticité et de l’état réel de l’article avant toute transaction.
              </li>
              <li style={{ marginBottom: 8 }}>
                Ne communiquez jamais vos informations bancaires ou documents sensibles à une personne que vous ne connaissez pas.
              </li>
              <li style={{ marginBottom: 8 }}>
                Évitez les moyens de paiement anonymes ou difficilement traçables, tels que les coupons prépayés ou mandats cash.
              </li>
              <li style={{ marginBottom: 8 }}>
                Si un vendeur vous propose une plateforme de paiement externe, vérifiez toujours qu’il s’agit du site officiel (URL correcte, connexion sécurisée, réputation vérifiable). En cas de doute, abstenez-vous.
              </li>
              <li style={{ marginBottom: 8 }}>
                Un prix anormalement attractif peut cacher une fraude. Comparez toujours avec le marché.
              </li>
              <li style={{ marginBottom: 8 }}>
                Refusez toute demande de paiement destinée à couvrir des frais de transport, d’assurance, de douane ou autres frais annexes non justifiés.
              </li>
              <li style={{ marginBottom: 8 }}>
                Soyez prudent si le vendeur insiste pour communiquer uniquement par email ou messagerie privée. N’acceptez pas qu’un tiers intermédiaire non vérifié gère votre paiement.
              </li>
            </ul>

            <button
              type="button"
              onClick={() => setShowSecurityModal(false)}
              style={{
                marginTop: 8,
                width: '100%',
                height: 44,
                backgroundColor: '#1d1d1f',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
        </div>
        );
      })()}

      {/* Lightbox photo agrandie */}
      {showPhotoLightbox && listing?.photos?.[currentPhotoIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo agrandie"
          style={{ position: 'fixed', inset: 0, zIndex: 199, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setShowPhotoLightbox(false)} />
          <button
            type="button"
            onClick={() => setShowPhotoLightbox(false)}
            style={{ position: 'absolute', top: 16, right: 16, zIndex: 1, width: 44, height: 44, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
          {listing.photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(i => i > 0 ? i - 1 : listing.photos.length - 1); }}
                style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: 48, height: 48, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Photo précédente"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(i => i < listing.photos.length - 1 ? i + 1 : 0); }}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: 48, height: 48, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Photo suivante"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={listing.photos[currentPhotoIndex]}
              alt={getListingDisplayTitle(listing)}
              style={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 8 }}
            />
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowAuthModal(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 380, backgroundColor: '#fff', padding: 36, borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, marginBottom: 8, color: '#0a0a0a', textAlign: 'center' }}>Connectez-vous</h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' }}>Créez un compte pour ajouter vos favoris et contacter le vendeur.</p>
            <Link href={`/connexion${redirectUrl}`} onClick={() => setShowAuthModal(false)} style={{ display: 'block', width: '100%', height: 50, border: '1.5px solid #d2d2d7', color: '#1d1d1f', fontSize: 15, fontWeight: 500, textAlign: 'center', lineHeight: '50px', marginBottom: 12, borderRadius: 980 }}>
              J&apos;ai déjà un compte
            </Link>
            <Link href={`/inscription${redirectUrl}`} onClick={() => setShowAuthModal(false)} style={{ display: 'block', width: '100%', height: 50, backgroundColor: '#1d1d1f', color: '#fff', fontSize: 15, fontWeight: 500, textAlign: 'center', lineHeight: '50px', borderRadius: 980 }}>
              Créer un compte
            </Link>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
