'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, Store, ArrowLeft, Share2, ChevronLeft, ChevronRight, Phone, Tag, Award, Package, Calendar, CheckCircle, Layers, Palette, Ruler, MapPin, Plus, Minus, Euro, Info, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getListing, getSellerListings, getListings } from '@/lib/supabase/listings';
import { getFavorite, addFavorite, removeFavorite } from '@/lib/supabase/favorites';
import { getOrCreateConversation, sendMessage } from '@/lib/supabase/messaging';
import { getSellerData } from '@/lib/supabase/auth';
import { Listing, Seller } from '@/types';
import { formatPrice, formatDate, CATEGORIES } from '@/lib/utils';
import { CONDITIONS, COLORS, MATERIALS } from '@/lib/constants';

/** Affiche le téléphone au format 00 00 00 00 00 */
function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.replace(/(.{2})/g, '$1 ').trim();
}

function getDealLevel(price: number, average: number): { label: string; color: string; description: string } {
  if (price <= average * 0.85) return { label: 'Très bonne affaire', color: '#248a3d', description: 'Le prix est très en-dessous de la moyenne des articles similaires.' };
  if (price <= average * 0.95) return { label: 'Bonne affaire', color: '#248a3d', description: 'Le prix est en-dessous de la moyenne des articles similaires.' };
  if (price <= average * 1.05) return { label: 'Offre équitable', color: '#6e6e73', description: 'Le prix est dans la moyenne des articles similaires.' };
  return { label: 'Au-dessus du marché', color: '#ff9500', description: 'Le prix est supérieur à la moyenne des prix des articles similaires.' };
}
function getDealDefault(): { label: string; color: string; description: string } {
  return { label: 'Offre équitable', color: '#6e6e73', description: 'Le prix de l\'annonce est dans la moyenne des prix des annonces similaires.' };
}
function getBarPosition(price: number, min: number, max: number): number {
  if (max <= min) return 0.5;
  return Math.max(0, Math.min(1, (price - min) / (max - min)));
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showLegalMore, setShowLegalMore] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: 'Bonjour,\nVotre produit est-il toujours disponible ?',
  });
  const [contactFormSubmitting, setContactFormSubmitting] = useState(false);
  const [contactFormError, setContactFormError] = useState('');
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [mapZoom, setMapZoom] = useState(15);
  const [sellerListingsCount, setSellerListingsCount] = useState(0);
  const [showMoreAbout, setShowMoreAbout] = useState(false);
  const [showPrixEnSavoirPlus, setShowPrixEnSavoirPlus] = useState(false);
  /** Comparaison de prix : moyenne / min / max des annonces même catégorie et même année (hors annonce actuelle) */
  const [priceStats, setPriceStats] = useState<{ average: number; min: number; max: number; count: number } | null>(null);

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
    const title = listing ? `${listing.title} - Section Luxe` : 'Section Luxe';
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
    if (user?.displayName) {
      const parts = user.displayName.trim().split(/\s+/);
      setContactForm((prev) => ({
        ...prev,
        firstName: parts[0] || prev.firstName,
        lastName: parts.slice(1).join(' ') || prev.lastName,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleContactSeller = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!listing || !seller || contactLoading) return;
    if (user?.uid === listing.sellerId) return;
    setContactLoading(true);
    try {
      const conversation = await getOrCreateConversation({
        listingId: listing.id,
        listingTitle: listing.title,
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
    if (!listing || !seller || !user || user.uid === listing.sellerId) return;
    const { firstName, lastName, email, phone, message } = contactForm;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !message.trim() || !phone.trim()) {
      setContactFormError('Tous les champs obligatoires doivent être renseignés.');
      return;
    }
    setContactFormError('');
    setContactFormSubmitting(true);
    try {
      const buyerName = `${firstName.trim()} ${lastName.trim()}`;
      const conversation = await getOrCreateConversation({
        listingId: listing.id,
        listingTitle: listing.title,
        listingPhoto: listing.photos[0] || '',
        buyerId: user.uid,
        buyerName,
        sellerId: listing.sellerId,
        sellerName: seller.companyName,
      });
      const fullMessage = `${message.trim()}\n\n— Contact : ${email}, tél. ${phone.trim()}`;
      await sendMessage({
        conversationId: conversation.id,
        senderId: user.uid,
        senderName: buyerName,
        content: fullMessage,
        isBuyer: true,
      });
      setShowContactForm(false);
      router.push(`/messages/${conversation.id}`);
    } catch (err) {
      console.error('Error sending contact form:', err);
      setContactFormError('Une erreur est survenue. Réessayez.');
    } finally {
      setContactFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    );
  }

  if (!listing) return null;

  const categoryLabel = CATEGORIES.find((c) => c.value === listing.category)?.label;

  return (
    <>
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 20px 60px' }}>
        {/* Back button */}
        <Link
          href="/catalogue"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#666', marginBottom: 24 }}
        >
          <ArrowLeft size={16} />
          Retour au catalogue
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }}>
          {/* Desktop: photo et détails même hauteur (hauteur = photo), puis miniatures en dessous */}
          <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 40, alignItems: 'stretch' }}>
              {/* Photo principale — définit la hauteur de la ligne (aspect 4/3) pour aligner le bas de la carte vendeur */}
              <div style={{ flex: '1.15 0 0', minWidth: 0, aspectRatio: '4/3' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#f5f5f7', position: 'relative', overflow: 'hidden', borderRadius: 18 }}>
                  {listing.photos[currentPhotoIndex] ? (
                    <img
                      src={listing.photos[currentPhotoIndex]}
                      alt={listing.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                      Photo
                    </div>
                  )}
                  {listing.photos.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentPhotoIndex(i => i > 0 ? i - 1 : listing.photos.length - 1)}
                        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, backgroundColor: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => setCurrentPhotoIndex(i => i < listing.photos.length - 1 ? i + 1 : 0)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, backgroundColor: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Détails — même hauteur que la photo, bloc vendeur en bas */}
            <div style={{ flex: '0.85 0 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {categoryLabel && (
                  <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: '#f5f5f5', fontSize: 11, fontWeight: 500 }}>
                    {categoryLabel}
                  </span>
                )}
                {listing.brand && (
                  <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: '#f5f5f5', fontSize: 11, fontWeight: 500 }}>
                    {listing.brand}
                  </span>
                )}
              </div>
              <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: '#0a0a0a' }}>
                {listing.title}
              </h1>
              {listing.listingNumber && (
                <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>N° annonce {listing.listingNumber}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>{formatPrice(listing.price)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#888', marginBottom: 24 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Heart size={14} /> {likesCount} likes
                </span>
                <span>Publié le {formatDate(listing.createdAt)}</span>
              </div>

              {user?.uid !== listing.sellerId && showContactForm && (
                <div style={{ marginBottom: 32, padding: 24, backgroundColor: '#f9f9f9', borderRadius: 18, border: '1px solid #eee' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Contacter le vendeur</h3>
                  {contactFormError && (
                    <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{contactFormError}</p>
                  )}
                  <form onSubmit={handleContactFormSubmit}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: '#555' }}>Prénom *</label>
                        <input required value={contactForm.firstName} onChange={(e) => setContactForm((p) => ({ ...p, firstName: e.target.value }))} style={{ width: '100%', height: 44, padding: '0 12px', fontSize: 14, border: '1px solid #d2d2d7', borderRadius: 10 }} placeholder="Prénom" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: '#555' }}>Nom *</label>
                        <input required value={contactForm.lastName} onChange={(e) => setContactForm((p) => ({ ...p, lastName: e.target.value }))} style={{ width: '100%', height: 44, padding: '0 12px', fontSize: 14, border: '1px solid #d2d2d7', borderRadius: 10 }} placeholder="Nom" />
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: '#555' }}>Email *</label>
                      <input type="email" required value={contactForm.email} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} style={{ width: '100%', height: 44, padding: '0 12px', fontSize: 14, border: '1px solid #d2d2d7', borderRadius: 10 }} placeholder="email@exemple.fr" />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: '#555' }}>Message *</label>
                      <textarea required value={contactForm.message} onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))} rows={4} style={{ width: '100%', padding: 12, fontSize: 14, border: '1px solid #d2d2d7', borderRadius: 10, resize: 'vertical' }} placeholder="Votre message" />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: '#555' }}>Téléphone *</label>
                      <input type="tel" required value={contactForm.phone} onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))} style={{ width: '100%', height: 44, padding: '0 12px', fontSize: 14, border: '1px solid #d2d2d7', borderRadius: 10 }} placeholder="+33 6 12 34 56 78" />
                    </div>
                    <p style={{ fontSize: 11, color: '#666', marginBottom: 12 }}>Obligatoire * — Le vendeur pourra vous répondre directement depuis sa messagerie Section Luxe. Veuillez ne pas mentionner vos données personnelles dans le contenu de votre message. Les données que vous renseignez dans ce formulaire sont traitées par Section Luxe en qualité de responsable de traitement.</p>
                    {!showLegalMore ? (
                      <button type="button" onClick={() => setShowLegalMore(true)} style={{ background: 'none', border: 'none', fontSize: 11, color: '#888', cursor: 'pointer', padding: 0, marginBottom: 16, textDecoration: 'underline' }}>Afficher plus</button>
                    ) : (
                      <>
                        <p style={{ fontSize: 11, color: '#666', marginBottom: 12 }}>Elles sont transmises directement au vendeur que vous souhaitez contacter et le cas échéant, aux vendeurs professionnels. Les données obligatoires sont celles signalées par un astérisque. Ces données sont utilisées à des fins de : mise en relation avec le vendeur ; mesure et étude de l&apos;audience du site ; lutte anti-fraude ; gestion de vos demandes d&apos;exercice de vos droits. Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition, à la portabilité et d&apos;introduire une réclamation auprès d&apos;une autorité de contrôle (CNIL). Pour en savoir plus : https://www.sectionluxe.fr/politique-confidentialite</p>
                        <button type="button" onClick={() => setShowLegalMore(false)} style={{ background: 'none', border: 'none', fontSize: 11, color: '#888', cursor: 'pointer', padding: 0, marginBottom: 16, textDecoration: 'underline' }}>Afficher moins</button>
                      </>
                    )}
                    <button type="submit" disabled={contactFormSubmitting} style={{ width: '100%', height: 48, backgroundColor: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 980, fontSize: 15, fontWeight: 500, cursor: contactFormSubmitting ? 'not-allowed' : 'pointer' }}>
                      {contactFormSubmitting ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </form>
                </div>
              )}

              {seller && (
                <div style={{ marginTop: 'auto', padding: 28, backgroundColor: '#f5f5f7', borderRadius: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {seller.avatarUrl ? (
                        <img src={seller.avatarUrl} alt={seller.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Store size={40} color="#888" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 24, fontWeight: 600, margin: 0, marginBottom: 4 }}>{seller.companyName}</h3>
                      <p style={{ fontSize: 14, color: '#888', margin: 0 }}>Vendeur professionnel</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => setShowPhone((v) => !v)}
                      style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                    >
                      {showPhone ? (
                        <span style={{ fontSize: 18 }}>{formatPhoneDisplay(seller.phone)}</span>
                      ) : (
                        <>
                          <Phone size={18} />
                          N° téléphone
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (!isAuthenticated) setShowAuthModal(true); else setShowContactForm((v) => !v); }}
                      style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                    >
                      <MessageCircle size={18} />
                      Message
                    </button>
                  </div>
                  {seller.address && (
                    <button
                      type="button"
                      onClick={() => { setMapZoom(15); setShowMapPopup(true); }}
                      style={{ width: '100%', marginTop: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/map-plan.png')", backgroundSize: '115%', backgroundPosition: 'center', backgroundColor: '#f6f6f8', border: '1px solid #c8c8cc', borderRadius: 14, cursor: 'pointer' }}
                    >
                      <MapPin size={22} color="#1d1d1f" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f' }}>{seller.postcode}</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', textDecoration: 'underline' }}>{seller.city}</span>
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
                        width: 60,
                        height: 60,
                        border: currentPhotoIndex === index ? '2px solid #000' : '1px solid #ddd',
                        padding: 0,
                        cursor: 'pointer',
                        overflow: 'hidden',
                      }}
                    >
                      <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <h2 className="produit-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: '#0a0a0a', margin: 0, marginBottom: 8 }}>
                  <Info size={18} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, marginTop: 3 }} />
                  Informations
                </h2>
                <p style={{ fontSize: 13, color: '#6e6e73', marginBottom: 20, marginTop: 0 }}>{listing.title}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Tag size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>Catégorie</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>{categoryLabel || '…'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Award size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>Marque</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>{listing.brand || '…'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Package size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>Modèle</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>{listing.model ?? ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Calendar size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>Année</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>{listing.year != null ? listing.year : '…'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>État</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>
                        {listing.condition ? (CONDITIONS.find((c) => c.value === listing.condition)?.label ?? listing.condition) : '…'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Layers size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>Matière</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>
                        {listing.material ? (MATERIALS.find((m) => m.value === listing.material)?.label ?? listing.material) : '…'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Palette size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>Couleur</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>
                        {listing.color ? (COLORS.find((c) => c.value === listing.color)?.label ?? listing.color) : '…'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Ruler size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>Dimensions</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>
                        L. {listing.widthCm != null ? listing.widthCm : '   '} × H. {listing.heightCm != null ? listing.heightCm : '   '} cm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 24, marginTop: 24 }}>
                <h2 className="produit-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: '#0a0a0a', margin: 0, marginBottom: 8 }}>
                  <FileText size={18} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  Description
                </h2>
                {seller && <p style={{ fontSize: 13, color: '#6e6e73', marginBottom: 20, marginTop: 0 }}>{seller.companyName}</p>}
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>{listing.description}</p>
              </div>
              {/* Section Prix — design type barre de comparaison (offre et prix) */}
              <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 24, marginTop: 24 }}>
                <h2 className="produit-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: '#0a0a0a', margin: 0, marginBottom: 8 }}>
                  <Euro size={18} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  Prix
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f' }}>{listing.price.toLocaleString('fr-FR')}</span>
                  <span style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f', marginRight: 4 }}>€</span>
                  {(() => {
                    const deal = priceStats ? getDealLevel(listing.price, priceStats.average) : getDealDefault();
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
                    <div style={{ flex: 1, backgroundColor: '#248a3d' }} />
                    <div style={{ flex: 1, backgroundColor: '#6e6e73' }} />
                    <div style={{ flex: 1, backgroundColor: '#ff9500' }} />
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: `${priceStats ? getBarPosition(listing.price, priceStats.min, priceStats.max) * 100 : 62.5}%`,
top: -4,
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '6px solid #1d1d1f',
                      transform: 'translateX(-50%)',
                    }}
                  />
                </div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5, margin: 0 }}>
                  {(priceStats ? getDealLevel(listing.price, priceStats.average) : getDealDefault()).description}
                </p>
                {priceStats && (
                  <p style={{ fontSize: 13, color: '#86868b', lineHeight: 1.5, margin: '4px 0 0', marginTop: 4, marginBottom: 0 }}>
                    Par rapport à {priceStats.count} annonce{priceStats.count > 1 ? 's' : ''} similaires (même catégorie{listing.year != null ? ', même année' : ''}).
                  </p>
                )}
                <p style={{ fontSize: 13, color: '#86868b', lineHeight: 1.5, margin: '12px 0 0', marginTop: 12, marginBottom: 0 }}>
                  L&apos;estimation indiquée est donnée à titre informatif et peut différer de la valeur réelle du marché. Nous vous recommandons de réaliser votre propre analyse.
                </p>
                {!showPrixEnSavoirPlus ? (
                  <button type="button" onClick={() => setShowPrixEnSavoirPlus(true)} style={{ marginTop: 6, padding: 0, background: 'none', border: 'none', fontSize: 13, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}>
                    Voir plus
                  </button>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: '#86868b', lineHeight: 1.5, margin: 0 }}>
                      Cette estimation ne constitue pas une valeur contractuelle et peut comporter des variations ou des erreurs. Nous vous recommandons d&apos;effectuer votre propre comparaison et vos vérifications avant toute décision d&apos;achat.
                    </p>
                    <button type="button" onClick={() => setShowPrixEnSavoirPlus(false)} style={{ marginTop: 6, padding: 0, background: 'none', border: 'none', fontSize: 13, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}>
                      Voir moins
                    </button>
                  </>
                )}
              </div>
            </div>

          {/* Section Vendeur Professionnel — même largeur que les autres (100 % colonne gauche) */}
          {seller && (
            <div style={{ marginTop: 24, borderTop: '1px solid #e5e5e7', paddingTop: 24, width: '100%' }}>
              <h2 className="produit-section-title produit-section-title-vendeur" style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.2, fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: '#0a0a0a', margin: 0, marginBottom: 24 }}>
                <Store size={20} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, alignSelf: 'center', marginTop: 2 }} />
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
                    <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 6 }}>{seller.companyName}</h3>
                    {seller.description && (
                      <>
                        <p
                          style={{
                            fontSize: 14,
                            color: '#666',
                            margin: 0,
                            lineHeight: 1.5,
                            ...(showMoreAbout ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' as const }),
                          }}
                        >
                          {seller.description}
                        </p>
                        {seller.description.length > 100 && (
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
                {seller.address && (
                  <div
                    style={{
                      width: '100%',
                      minHeight: 140,
                      padding: '20px 16px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 14,
                      backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/map-plan.png')",
                      backgroundSize: '115%',
                      backgroundPosition: 'center',
                      backgroundColor: '#f6f6f8',
                      border: '1px solid #c8c8cc',
                      borderRadius: 14,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      <MapPin size={24} color="#1d1d1f" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>{seller.postcode}</span>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', textDecoration: 'underline' }}>{seller.city}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMapZoom(15); setShowMapPopup(true); }}
                      style={{ padding: '10px 20px', backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                    >
                      Voir la carte
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

            </div>
          </div>
          {/* Section publicité — même largeur que cadre vendeur, uniquement sur PC (pas sur téléphone) */}
          <div className="hide-mobile" style={{ minWidth: 0, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', paddingLeft: 32 }}>
            <div style={{ width: '100%', flex: 1, minHeight: 300, padding: 20, backgroundColor: '#f5f5f7', borderRadius: 18, border: '1px solid #e5e5e7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#888' }}>
              Publicité
            </div>
          </div>
          </div>

          {/* Mobile: single column */}
          <div className="hide-desktop">
            {/* Gallery */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ aspectRatio: '4/3', backgroundColor: '#f5f5f7', marginBottom: 12, position: 'relative', overflow: 'hidden', borderRadius: 18 }}>
                {listing.photos[currentPhotoIndex] ? (
                  <img src={listing.photos[currentPhotoIndex]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>Photo</div>
                )}
              </div>
              {listing.photos.length > 1 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                  {listing.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      style={{ width: 50, height: 50, flexShrink: 0, border: currentPhotoIndex === index ? '2px solid #1d1d1f' : '1px solid #d2d2d7', borderRadius: 12, padding: 0, cursor: 'pointer', overflow: 'hidden' }}
                    >
                      <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}

              {/* Informations puis Description en dessous - mobile */}
              <div style={{ marginTop: 20, borderTop: '1px solid #e5e5e7', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1, fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', color: '#0a0a0a', margin: 0, marginBottom: 6 }}>
                  <Info size={14} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  Informations
                </h2>
                  <p style={{ fontSize: 12, color: '#6e6e73', marginBottom: 14, marginTop: 0 }}>{listing.title}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>Catégorie</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13 }}>{categoryLabel || '…'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Award size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>Marque</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13 }}>{listing.brand || '…'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Package size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>Modèle</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13 }}>{listing.model || '…'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>Année</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13 }}>{listing.year != null ? listing.year : '…'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>État</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13 }}>
                        {listing.condition ? (CONDITIONS.find((c) => c.value === listing.condition)?.label ?? listing.condition) : '…'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Layers size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>Matière</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13 }}>
                        {listing.material ? (MATERIALS.find((m) => m.value === listing.material)?.label ?? listing.material) : '…'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Palette size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>Couleur</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13 }}>
                        {listing.color ? (COLORS.find((c) => c.value === listing.color)?.label ?? listing.color) : '…'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Ruler size={16} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 13 }}>Dimensions</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13 }}>
                        L. {listing.widthCm != null ? listing.widthCm : '   '} × H. {listing.heightCm != null ? listing.heightCm : '   '} cm
                      </span>
                    </div>
                  </div>
                </div>
                </div>
                <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 20, marginTop: 20 }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1, fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', color: '#0a0a0a', margin: 0, marginBottom: 6 }}>
                  <FileText size={14} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                  Description
                </h2>
                  {seller && <p style={{ fontSize: 12, color: '#6e6e73', marginBottom: 14, marginTop: 0 }}>{seller.companyName}</p>}
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>{listing.description}</p>
                </div>
                {/* Section Prix - mobile */}
                <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 20, marginTop: 20 }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1, fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', color: '#0a0a0a', margin: 0, marginBottom: 6 }}>
                    <Euro size={14} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                    Prix
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f' }}>{listing.price.toLocaleString('fr-FR')}</span>
                    <span style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', marginRight: 2 }}>€</span>
                    {(() => {
                      const deal = priceStats ? getDealLevel(listing.price, priceStats.average) : getDealDefault();
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', backgroundColor: '#fff', border: `1px solid ${deal.color}`, borderRadius: 5, fontSize: 11, fontWeight: 500, color: deal.color }}>
                          <span style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: deal.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Euro size={9} color="#fff" strokeWidth={2.5} />
                          </span>
                          {deal.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    <div style={{ height: 6, display: 'flex', gap: 1, borderRadius: 3, overflow: 'hidden', backgroundColor: '#e5e5e7' }}>
                      <div style={{ flex: 1, backgroundColor: '#248a3d' }} />
                      <div style={{ flex: 1, backgroundColor: '#248a3d' }} />
                      <div style={{ flex: 1, backgroundColor: '#6e6e73' }} />
                      <div style={{ flex: 1, backgroundColor: '#ff9500' }} />
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        left: `${priceStats ? getBarPosition(listing.price, priceStats.min, priceStats.max) * 100 : 62.5}%`,
                        top: -3,
                        width: 0,
                        height: 0,
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderTop: '5px solid #1d1d1f',
                        transform: 'translateX(-50%)',
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5, margin: 0 }}>
                    {(priceStats ? getDealLevel(listing.price, priceStats.average) : getDealDefault()).description}
                  </p>
                  {priceStats && (
                    <p style={{ fontSize: 12, color: '#86868b', lineHeight: 1.5, margin: '4px 0 0', marginTop: 4, marginBottom: 0 }}>
                      Par rapport à {priceStats.count} annonce{priceStats.count > 1 ? 's' : ''} similaires (même catégorie{listing.year != null ? ', même année' : ''}).
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: '#86868b', lineHeight: 1.5, margin: '10px 0 0', marginTop: 10, marginBottom: 0 }}>
                    L&apos;estimation indiquée est donnée à titre informatif et peut différer de la valeur réelle du marché. Nous vous recommandons de réaliser votre propre analyse.
                  </p>
                  {!showPrixEnSavoirPlus ? (
                    <button type="button" onClick={() => setShowPrixEnSavoirPlus(true)} style={{ marginTop: 4, padding: 0, background: 'none', border: 'none', fontSize: 12, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}>
                      Voir plus
                    </button>
                  ) : (
                    <>
                      <p style={{ fontSize: 12, color: '#86868b', lineHeight: 1.5, margin: 0 }}>
                        Cette estimation ne constitue pas une valeur contractuelle et peut comporter des variations ou des erreurs. Nous vous recommandons d&apos;effectuer votre propre comparaison et vos vérifications avant toute décision d&apos;achat.
                      </p>
                      <button type="button" onClick={() => setShowPrixEnSavoirPlus(false)} style={{ marginTop: 6, padding: 0, background: 'none', border: 'none', fontSize: 12, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}>
                        Voir moins
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {categoryLabel && (
                <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: '#f5f5f5', fontSize: 11, fontWeight: 500 }}>{categoryLabel}</span>
              )}
              {listing.brand && (
                <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: '#f5f5f5', fontSize: 11, fontWeight: 500 }}>{listing.brand}</span>
              )}
            </div>
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, fontWeight: 500, marginBottom: 12, color: '#0a0a0a' }}>{listing.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginBottom: 12 }}>
              <p style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{formatPrice(listing.price)}</p>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#888', marginBottom: 20 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={12} /> {likesCount}</span>
              <span>{formatDate(listing.createdAt)}</span>
            </div>

            {seller && (
              <div style={{ padding: 24, backgroundColor: '#f5f5f7', borderRadius: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {seller.avatarUrl ? (
                      <img src={seller.avatarUrl} alt={seller.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Store size={34} color="#888" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 22, fontWeight: 600, margin: 0, marginBottom: 2 }}>{seller.companyName}</h3>
                    <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Vendeur professionnel</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button type="button" onClick={() => setShowPhone((v) => !v)} style={{ flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    {showPhone ? (
                      <span style={{ fontSize: 17 }}>{formatPhoneDisplay(seller.phone)}</span>
                    ) : (
                      <>
                        <Phone size={16} />
                        N° téléphone
                      </>
                    )}
                  </button>
                  <button type="button" onClick={() => { if (!isAuthenticated) setShowAuthModal(true); else setShowContactForm((v) => !v); }} style={{ flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    <MessageCircle size={16} />
                    Message
                  </button>
                </div>
                {seller.address && (
                  <button
                    type="button"
                    onClick={() => { setMapZoom(15); setShowMapPopup(true); }}
                    style={{ width: '100%', marginTop: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/map-plan.png')", backgroundSize: '115%', backgroundPosition: 'center', backgroundColor: '#f6f6f8', border: '1px solid #c8c8cc', borderRadius: 14, cursor: 'pointer' }}
                  >
                    <MapPin size={20} color="#1d1d1f" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>{seller.postcode}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', textDecoration: 'underline' }}>{seller.city}</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Popup Plan vendeur */}
      {showMapPopup && seller && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowMapPopup(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ padding: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 22, fontWeight: 500, margin: 0, marginBottom: 16, textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>Plan vendeur</h2>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 8 }}>{seller.companyName}</p>
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

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowAuthModal(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 380, backgroundColor: '#fff', padding: 36, borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, marginBottom: 8 }}>Connectez-vous</h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>Créez un compte pour sauvegarder vos favoris et contacter les vendeurs.</p>
            <Link href="/inscription" onClick={() => setShowAuthModal(false)} style={{ display: 'block', width: '100%', height: 50, backgroundColor: '#1d1d1f', color: '#fff', fontSize: 15, fontWeight: 500, textAlign: 'center', lineHeight: '50px', marginBottom: 12, borderRadius: 980 }}>
              Créer un compte
            </Link>
            <Link href="/connexion" onClick={() => setShowAuthModal(false)} style={{ display: 'block', width: '100%', height: 50, border: '1.5px solid #d2d2d7', color: '#1d1d1f', fontSize: 15, fontWeight: 500, textAlign: 'center', lineHeight: '50px', borderRadius: 980 }}>
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
