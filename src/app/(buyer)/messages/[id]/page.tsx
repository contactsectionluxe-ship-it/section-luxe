'use client';

import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Package, X, Store, MapPin, Plus, Minus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui';
import {
  getConversation,
  subscribeToMessages,
  sendMessage,
  markConversationAsRead,
} from '@/lib/supabase/messaging';
import { getUserData, getSellerData } from '@/lib/supabase/auth';
import { Conversation, Message, User as UserType, Seller } from '@/types';
import { formatRelativeTime, formatDate } from '@/lib/utils';

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPartyPopup, setShowPartyPopup] = useState(false);
  const [popupUser, setPopupUser] = useState<UserType | null>(null);
  const [popupSeller, setPopupSeller] = useState<Seller | null>(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [sellerDescExpanded, setSellerDescExpanded] = useState(false);
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [mapZoom, setMapZoom] = useState(15);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = '50px';
    ta.style.height = Math.min(Math.max(ta.scrollHeight, 50), 120) + 'px';
  };

  useEffect(() => {
    if (!newMessage && textareaRef.current) {
      textareaRef.current.style.height = '50px';
    }
  }, [newMessage]);

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [conversationId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/connexion');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    async function load() {
      try {
        const data = await getConversation(conversationId);
        if (cancelled) return;
        if (!data || !user) {
          if (!data) router.push('/messages');
          return;
        }
        if (data.buyerId !== user.uid && data.sellerId !== user.uid) {
          router.push('/messages');
          return;
        }
        setConversation(data);
        const isBuyer = data.buyerId === user.uid;
        await markConversationAsRead(conversationId, isBuyer);
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('messages:refresh-unread'));
      } catch (err) {
        console.error('Error loading conversation:', err);
        if (!cancelled) router.push('/messages');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [conversationId, user?.uid, router]);

  // Marquer la conversation comme lue dès qu'elle est affichée
  useEffect(() => {
    if (!conversation || !user) return;
    const isBuyer = conversation.buyerId === user.uid;
    markConversationAsRead(conversationId, isBuyer)
      .then(() => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('messages:refresh-unread')); })
      .catch((err) => console.error('markConversationAsRead', err));
  }, [conversationId, conversation?.id, conversation?.buyerId, user?.uid]);

  useEffect(() => {
    if (!conversation || !user) return;
    const isBuyer = conversation.buyerId === user.uid;
    const since = isBuyer ? conversation.buyerClearedAt : conversation.sellerClearedAt;

    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    }, { since: since ?? undefined });
    return () => unsubscribe();
  }, [conversationId, conversation, user?.uid]);

  // À l'arrivée sur la conversation : afficher le bas sans défilement visible
  useLayoutEffect(() => {
    if (!loading && conversation) scrollToBottom();
  }, [conversationId, conversation?.id, loading]);

  // Après envoi (ou nouveau message) : afficher le bas sans défilement visible
  useLayoutEffect(() => {
    if (!loading && conversation && messages.length > 0) scrollToBottom();
  }, [messages, loading, conversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || !user || sending) return;

    setSending(true);
    try {
      const isBuyer = conversation.buyerId === user.uid;
      await sendMessage({
        conversationId,
        senderId: user.uid,
        senderName: user.displayName || 'Utilisateur',
        content: newMessage.trim(),
        isBuyer,
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors de l’envoi');
    } finally {
      setSending(false);
    }
  };

  if (authLoading || !conversation || loading) {
    return (
      <main style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PageLoader />
      </main>
    );
  }

  if (!isAuthenticated) return null;

  const isBuyer = conversation.buyerId === user?.uid;
  const otherPartyName = isBuyer ? conversation.sellerName : conversation.buyerName;
  const otherPartyId = isBuyer ? conversation.sellerId : conversation.buyerId;
  const otherPartyIsSeller = isBuyer;

  const handleShowPartyInfo = async () => {
    setShowPartyPopup(true);
    setPopupUser(null);
    setPopupSeller(null);
    setSellerDescExpanded(false);
    setPopupLoading(true);
    try {
      if (otherPartyIsSeller) {
        const data = await getSellerData(otherPartyId);
        setPopupSeller(data || null);
      } else {
        const data = await getUserData(otherPartyId);
        setPopupUser(data || null);
      }
    } finally {
      setPopupLoading(false);
    }
  };

  return (
    <main style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fff' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 24px 80px' }}>
        {/* En-tête : titre + barre avec retour, miniature, interlocuteur (même style que Ma messagerie) */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
            Conversation
          </h1>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>
            Avec{' '}
            <button type="button" onClick={handleShowPartyInfo} style={{ background: 'none', border: 'none', padding: 0, color: '#1d1d1f', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
              {otherPartyName}
            </button>
          </p>
        </div>

        {/* Carte principale (même design que Ma messagerie : fond blanc, carte blanche) */}
        <div style={{ backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #e8e6e3', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 560 }}>
          {/* Barre supérieure : retour + annonce + interlocuteur */}
          <div
            style={{
              flexShrink: 0,
              padding: '20px 28px',
              borderBottom: '1px solid #e8e6e3',
              backgroundColor: '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Link
                href="/messages"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, color: '#1d1d1f', backgroundColor: '#f5f5f7' }}
                aria-label="Retour aux messages"
              >
                <ArrowLeft size={20} />
              </Link>
              <Link
                href={`/produit/${conversation.listingId}`}
                style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f5f5f7', flexShrink: 0, border: '1px solid #e8e6e3' }}
              >
                {conversation.listingPhoto ? (
                  <img src={conversation.listingPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={22} color="#86868b" />
                  </div>
                )}
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <button type="button" onClick={handleShowPartyInfo} style={{ background: 'none', border: 'none', padding: 0, fontSize: 15, fontWeight: 600, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, cursor: 'pointer', textAlign: 'left', width: '100%', textDecoration: 'underline' }}>
                  {otherPartyName}
                </button>
                <Link
                  href={`/produit/${conversation.listingId}`}
                  style={{ fontSize: 13, color: '#6e6e73', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', marginTop: 2 }}
                >
                  {conversation.listingTitle}
                </Link>
              </div>
            </div>
          </div>

          {/* Zone des messages */}
          <div
            ref={messagesContainerRef}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6e6e73', fontSize: 14 }}>
                Démarrez la conversation avec {otherPartyName}
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.senderId === user?.uid;
                return (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '12px 16px',
                        borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: isOwn ? '#000' : '#f2f2f2',
                        color: isOwn ? '#fff' : '#1d1d1f',
                        border: isOwn ? 'none' : '1px solid #e8e8e8',
                      }}
                    >
                      {message.imageUrl && (() => {
                        const filename = message.imageUrl.split('/').pop()?.split('?')[0] || 'image';
                        return (
                          <a
                            href={message.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={filename}
                            style={{
                              display: 'inline-block',
                              marginBottom: message.content?.trim() ? 8 : 0,
                              fontSize: 14,
                              textDecoration: 'underline',
                              color: 'inherit',
                              wordBreak: 'break-all',
                            }}
                          >
                            {filename}
                          </a>
                        );
                      })()}
                      {message.content?.trim() && (
                        <p style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                          {message.content}
                        </p>
                      )}
                      <p style={{ fontSize: 11, marginTop: 8, marginBottom: 0, opacity: isOwn ? 0.7 : 0.85 }}>
                        {formatRelativeTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div />
          </div>

          {/* Champ d'envoi (style champs Devenir vendeur) */}
          <div
            style={{
              flexShrink: 0,
              padding: '20px 28px',
              borderTop: '1px solid #e8e6e3',
              backgroundColor: '#fff',
            }}
          >
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(e); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    adjustTextareaHeight();
                  }}
                  placeholder="Écrivez votre message..."
                  rows={1}
                  style={{
                    flex: 1,
                    height: 50,
                    minHeight: 50,
                    maxHeight: 120,
                    padding: '14px 16px',
                    fontSize: 15,
                    border: '1px solid #d2d2d7',
                    borderRadius: 12,
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none',
                    overflowY: 'auto',
                  }}
                />
                <button
                  type="submit"
                  className="message-send-btn"
                  disabled={!newMessage.trim() || sending}
                  style={{
                    width: 50,
                    height: 50,
                    flexShrink: 0,
                    borderRadius: 12,
                    color: '#fff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: !newMessage.trim() || sending ? 'not-allowed' : 'pointer',
                  }}
                  aria-label="Envoyer"
                >
                  <Send size={20} color="#ffffff" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Popup infos utilisateur ou vendeur */}
      {showPartyPopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowPartyPopup(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', backgroundColor: '#fff', padding: 28, borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #e5e5e7' }}>
              <h3 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, fontWeight: 600, margin: 0, textAlign: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
                {popupSeller ? (
                  <>
                    <Store size={20} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0 }} />
                    Vendeur professionnel
                  </>
                ) : (
                  'Profil utilisateur'
                )}
              </h3>
              <button type="button" onClick={() => setShowPartyPopup(false)} style={{ position: 'absolute', right: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#f5f5f7', borderRadius: 10, cursor: 'pointer' }} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            {popupLoading ? (
              <p style={{ fontSize: 14, color: '#6e6e73' }}>Chargement...</p>
            ) : popupUser ? (
              <div style={{ fontSize: 14, color: '#1d1d1f' }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>{popupUser.displayName}</p>
                <p style={{ color: '#6e6e73', margin: 0 }}>Membre depuis {formatDate(popupUser.createdAt)}</p>
                {popupUser.email && (
                  <p style={{ margin: '12px 0 0', color: '#1d1d1f' }}>
                    <strong>Email :</strong>{' '}
                    <a href={`mailto:${popupUser.email}`} style={{ color: '#1d1d1f', textDecoration: 'underline' }}>{popupUser.email}</a>
                  </p>
                )}
                {popupUser.phone?.trim() && (
                  <p style={{ margin: '8px 0 0', color: '#1d1d1f' }}>
                    <strong>Téléphone :</strong>{' '}
                    <a href={`tel:${popupUser.phone.trim()}`} style={{ color: '#1d1d1f', textDecoration: 'underline' }}>{popupUser.phone.trim()}</a>
                  </p>
                )}
              </div>
            ) : popupSeller ? (
              <div style={{ color: '#1d1d1f' }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f0f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {popupSeller.avatarUrl ? (
                        <img src={popupSeller.avatarUrl} alt={popupSeller.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Store size={40} color="#888" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 6 }}>{popupSeller.companyName}</h3>
                      {popupSeller.description && (
                        <>
                          <p
                            style={{
                              fontSize: 14,
                              color: '#666',
                              margin: 0,
                              lineHeight: 1.5,
                              ...(sellerDescExpanded ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' as const }),
                            }}
                          >
                            {popupSeller.description}
                          </p>
                          {popupSeller.description.length > 100 && (
                            <button
                              type="button"
                              onClick={() => setSellerDescExpanded((v) => !v)}
                              style={{ marginTop: 6, padding: 0, background: 'none', border: 'none', fontSize: 14, fontWeight: 500, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              {sellerDescExpanded ? 'Voir moins' : 'Voir plus'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/catalogue?sellerId=${popupSeller.uid}`}
                  onClick={() => setShowPartyPopup(false)}
                  style={{ display: 'block', width: '100%', padding: '14px 20px', backgroundColor: '#1d1d1f', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 500, textAlign: 'center', marginBottom: 12 }}
                >
                  Voir les annonces du vendeur
                </Link>
                {(popupSeller.address || popupSeller.city || popupSeller.postcode) && (
                  <div
                    style={{
                      width: '100%',
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <MapPin size={24} color="#1d1d1f" style={{ flexShrink: 0 }} />
                      {popupSeller.postcode && <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>{popupSeller.postcode}</span>}
                      {popupSeller.city && <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', textDecoration: 'underline' }}>{popupSeller.city}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMapPopup(true)}
                      style={{ padding: '10px 20px', backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                    >
                      Voir la carte
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#6e6e73' }}>Impossible de charger les informations.</p>
            )}
          </div>
        </div>
      )}

      {/* Popup Plan vendeur */}
      {showMapPopup && popupSeller && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowMapPopup(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>
                <button type="button" onClick={() => setShowMapPopup(false)} style={{ position: 'absolute', left: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#f5f5f7', borderRadius: 10, cursor: 'pointer' }} aria-label="Retour">
                  <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 22, fontWeight: 500, margin: 0, textAlign: 'center' }}>Plan vendeur</h2>
                <button type="button" onClick={() => setShowMapPopup(false)} style={{ position: 'absolute', right: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#f5f5f7', borderRadius: 10, cursor: 'pointer' }} aria-label="Fermer">
                  <X size={20} />
                </button>
              </div>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 8 }}>{popupSeller.companyName}</p>
              <p style={{ fontSize: 14, color: '#666', margin: 0, marginBottom: 16 }}>{[popupSeller.address, popupSeller.postcode, popupSeller.city].filter(Boolean).join(', ')}</p>
              <div style={{ position: 'relative', width: '100%', height: 220, borderRadius: 12, overflow: 'hidden' }}>
                <iframe
                  title="Carte du vendeur"
                  src={`https://www.google.com/maps?q=${encodeURIComponent([popupSeller.address, popupSeller.postcode, popupSeller.city].filter(Boolean).join(', '))}&z=${mapZoom}&output=embed`}
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
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
