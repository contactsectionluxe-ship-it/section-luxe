'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, Store, ArrowLeft, Share2, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getListing } from '@/lib/supabase/listings';
import { getFavorite, addFavorite, removeFavorite } from '@/lib/supabase/favorites';
import { getOrCreateConversation, sendMessage } from '@/lib/supabase/messaging';
import { getSellerData } from '@/lib/supabase/auth';
import { Listing, Seller } from '@/types';
import { formatPrice, formatDate, CATEGORIES } from '@/lib/utils';

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
          {/* Desktop: 2 columns */}
          <div className="hide-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {/* Gallery */}
            <div>
              <div style={{ aspectRatio: '1', backgroundColor: '#f5f5f7', marginBottom: 12, position: 'relative', overflow: 'hidden', borderRadius: 18 }}>
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
              {listing.photos.length > 1 && (
                <div style={{ display: 'flex', gap: 8 }}>
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
              )}
            </div>

            {/* Details */}
            <div>
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
              <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
                {listing.title}
              </h1>
              {listing.listingNumber && (
                <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>N° annonce {listing.listingNumber}</p>
              )}
              <p style={{ fontSize: 28, fontWeight: 600, marginBottom: 16 }}>{formatPrice(listing.price)}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#888', marginBottom: 24 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Heart size={14} /> {likesCount} likes
                </span>
                <span>Publié le {formatDate(listing.createdAt)}</span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button
                  onClick={handleFavoriteClick}
                  disabled={favoriteLoading}
                  style={{
                    flex: 1,
                    height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: isFavorited ? '#1d1d1f' : '#fff',
                    color: isFavorited ? '#fff' : '#1d1d1f',
                    border: '1.5px solid #d2d2d7',
                    borderRadius: 980,
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Heart size={18} fill={isFavorited ? '#fff' : 'none'} />
                  {isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </button>
                <button
                  onClick={handleShare}
                  style={{
                    height: 50,
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#fff',
                    color: '#1d1d1f',
                    border: '1.5px solid #d2d2d7',
                    borderRadius: 980,
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Share2 size={18} />
                  Partager
                </button>
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

              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Description</h2>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{listing.description}</p>
              </div>

              {seller && (
                <div style={{ padding: 20, backgroundColor: '#f5f5f7', borderRadius: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {seller.avatarUrl ? (
                        <img src={seller.avatarUrl} alt={seller.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Store size={24} color="#888" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600 }}>{seller.companyName}</h3>
                      <p style={{ fontSize: 12, color: '#888' }}>Vendeur professionnel</p>
                      {seller.address && <p style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{seller.address}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => setShowPhone((v) => !v)}
                      style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                    >
                      <Phone size={18} />
                      {showPhone ? seller.phone : 'N° téléphone'}
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
                </div>
              )}
            </div>
          </div>

          {/* Mobile: single column */}
          <div className="hide-desktop">
            {/* Gallery */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ aspectRatio: '1', backgroundColor: '#f5f5f7', marginBottom: 12, position: 'relative', overflow: 'hidden', borderRadius: 18 }}>
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
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, fontWeight: 500, marginBottom: 12 }}>{listing.title}</h1>
            <p style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>{formatPrice(listing.price)}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#888', marginBottom: 20 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={12} /> {likesCount}</span>
              <span>{formatDate(listing.createdAt)}</span>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <button
                onClick={handleFavoriteClick}
                disabled={favoriteLoading}
                style={{ flex: 1, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: isFavorited ? '#000' : '#fff', color: isFavorited ? '#fff' : '#000', border: '1px solid #000', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
              >
                <Heart size={18} fill={isFavorited ? '#fff' : 'none'} />
                {isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </button>
              <button
                onClick={handleShare}
                style={{ height: 48, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', color: '#000', border: '1px solid #000', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
              >
                <Share2 size={18} />
                Partager
              </button>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Description</h2>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{listing.description}</p>
            </div>

            {seller && (
              <div style={{ padding: 16, backgroundColor: '#f5f5f7', borderRadius: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {seller.avatarUrl ? (
                      <img src={seller.avatarUrl} alt={seller.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Store size={20} color="#888" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>{seller.companyName}</h3>
                    <p style={{ fontSize: 11, color: '#888' }}>Vendeur professionnel</p>
                    {seller.address && <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{seller.address}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="button" onClick={() => setShowPhone((v) => !v)} style={{ flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    <Phone size={16} />
                    {showPhone ? seller.phone : 'N° téléphone'}
                  </button>
                  <button type="button" onClick={() => { if (!isAuthenticated) setShowAuthModal(true); else setShowContactForm((v) => !v); }} style={{ flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1d1d1f', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    <MessageCircle size={16} />
                    Message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
  );
}
