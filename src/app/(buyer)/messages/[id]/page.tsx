'use client';

import { useEffect, useLayoutEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Package, PackageX, X, Store, MapPin, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui';
import {
  getConversation,
  subscribeToMessages,
  sendMessage,
  markConversationAsRead,
} from '@/lib/supabase/messaging';
import { getListingsCatalogVisibility } from '@/lib/supabase/listings';
import { sellerCataloguePath } from '@/lib/sellerCatalogueUrl';
import { getUserData, getSellerData } from '@/lib/supabase/auth';
import { Conversation, Message, User as UserType, Seller } from '@/types';
import { formatRelativeTime, formatDate, formatDateShort, getSellerAvatarUrl } from '@/lib/utils';
import { SellerVisitMapPopup } from '@/components/SellerVisitMapPopup';
import { ListingPhoto, LISTING_PHOTO_QUALITY_SHARP } from '@/components/ListingPhoto';

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
  const [mapZoom, setMapZoom] = useState(13);
  /** null = chargement ; true = annonce au catalogue ; false = inactive ou annonce supprimée (snapshot sur la conversation) */
  const [listingInCatalog, setListingInCatalog] = useState<boolean | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastAutoReadMessageIdRef = useRef<string | null>(null);

  const lastOwnMessageId = useMemo(() => {
    const uid = user?.uid;
    if (!uid) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderId === uid) return messages[i].id;
    }
    return null;
  }, [messages, user?.uid]);

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
        let nextInCatalog: boolean | null;
        if (data.saleProposalId) {
          nextInCatalog = true;
        } else if (!data.listingId) {
          nextInCatalog = false;
        } else {
          const map = await getListingsCatalogVisibility([data.listingId]);
          if (!(data.listingId in map)) nextInCatalog = true;
          else nextInCatalog = map[data.listingId] === true;
        }
        setListingInCatalog(nextInCatalog);
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

      // Si l'utilisateur est déjà sur cette conversation et reçoit un nouveau message,
      // marquer immédiatement comme lu pour éviter la bulle rouge.
      const last = msgs.length ? msgs[msgs.length - 1] : null;
      if (!last) return;
      if (last.senderId === user.uid) return;
      if (lastAutoReadMessageIdRef.current === last.id) return;
      lastAutoReadMessageIdRef.current = last.id;
      markConversationAsRead(conversationId, isBuyer)
        .then(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('messages:refresh-unread'));
          }
        })
        .catch((err) => console.error('markConversationAsRead (auto)', err));
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
    const offCatalog =
      !conversation.saleProposalId &&
      (!conversation.listingId || listingInCatalog === false);
    if (offCatalog) return;

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
  const listingOffCatalog =
    !conversation.saleProposalId &&
    (!conversation.listingId || listingInCatalog === false);

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
      <div className="messages-conversation-inner" style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: '30px 24px 80px', boxSizing: 'border-box' }}>
        {/* En-tête : titre + barre avec retour, miniature, interlocuteur (même niveau que page Contact) */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
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

        {/* Carte principale (même contour et ombre que Annonces mises en ligne / Mes ventes) */}
        <div
          className="messages-conversation-main-card"
          style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e8e6e3', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'min(638px, calc(70vh + 1cm))', minHeight: 438, marginTop: '-0.5cm' }}
        >
          {/* Barre supérieure : retour + annonce + interlocuteur */}
          <div
            className="messages-convo-header-shell"
            style={{
              flexShrink: 0,
              padding: '20px 28px',
              borderBottom: '1px solid #e8e6e3',
              backgroundColor: '#fff',
            }}
          >
            <div className="messages-convo-header-row" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <Link
              href="/messages"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, color: '#1d1d1f', backgroundColor: '#f5f5f7' }}
                aria-label="Retour aux messages"
            >
                <ArrowLeft size={20} />
            </Link>
            {conversation.saleProposalId ? (
              <div style={{ flexShrink: 0 }}>
                <div
                  className="messages-listing-photo-wrap"
                  style={{ position: 'relative', width: 72, height: 72, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f5f5f7', border: '1px solid #e8e6e3' }}
                >
                  {conversation.listingPhoto ? (
                    <ListingPhoto src={conversation.listingPhoto} alt="" sizes="72px" quality={LISTING_PHOTO_QUALITY_SHARP} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={26} color="#86868b" />
                    </div>
                  )}
                </div>
              </div>
            ) : listingOffCatalog ? (
              <div style={{ flexShrink: 0 }} aria-hidden>
                <div
                  className="messages-listing-photo-wrap messages-listing-photo-wrap--placeholder"
                  style={{
                    position: 'relative',
                    width: 72,
                    height: 72,
                    borderRadius: 12,
                    backgroundColor: '#e8e8ed',
                    border: '1px solid #e8e6e3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PackageX size={28} color="#86868b" strokeWidth={2} />
                </div>
              </div>
            ) : (
              <Link
                href={`/annonce/${conversation.listingId}`}
                style={{ flexShrink: 0, textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className="messages-listing-photo-wrap"
                  style={{ position: 'relative', width: 72, height: 72, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f5f5f7', border: '1px solid #e8e6e3' }}
                >
                  {conversation.listingPhoto ? (
                    <ListingPhoto src={conversation.listingPhoto} alt="" sizes="72px" quality={LISTING_PHOTO_QUALITY_SHARP} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={26} color="#86868b" />
                    </div>
                  )}
                </div>
              </Link>
            )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-playfair), Georgia, serif',
                    fontSize: 18,
                    fontWeight: 500,
                    margin: 0,
                    color: '#1d1d1f',
                    letterSpacing: '-0.02em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {listingOffCatalog
                    ? "L'annonce a été supprimée"
                    : conversation.saleProposalId
                      ? `Proposition : ${conversation.listingTitle || 'Annonce'}`
                      : conversation.listingTitle || 'Annonce'}
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: '#6e6e73',
                    margin: 0,
                    marginTop: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {otherPartyName}
                </p>
          </div>
        </div>
      </div>

          {/* Zone des messages */}
          <div
            ref={messagesContainerRef}
            className="messages-convo-scroll"
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
                const showReadReceipt = isOwn && message.id === lastOwnMessageId;
                return (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      className="messages-bubble-column"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                      }}
                    >
                      <div
                        style={{
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
                          <span className="messages-date-relative">{formatRelativeTime(message.createdAt)}</span>
                          <span className="messages-date-short">{formatDateShort(message.createdAt)}</span>
                        </p>
                      </div>
                      {showReadReceipt ? (
                        <div
                          style={{
                            marginTop: 4,
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: 18,
                          }}
                          aria-label={message.read ? 'Lu' : 'Envoyé'}
                        >
                          {message.read ? (
                            <span
                              style={{ display: 'inline-flex', alignItems: 'center', color: '#86868b' }}
                              aria-hidden
                            >
                              <Check size={15} strokeWidth={2.25} style={{ marginRight: -5 }} />
                              <Check size={15} strokeWidth={2.25} />
                            </span>
                          ) : (
                            <Check size={16} strokeWidth={2.25} color="#86868b" aria-hidden />
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
            <div />
          </div>

          {/* Champ d'envoi (style champs Devenir vendeur) */}
          <div
            className="messages-convo-compose-shell"
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
                  placeholder={listingOffCatalog ? "L'annonce a été supprimée" : 'Écrivez votre message...'}
                  rows={1}
                  readOnly={listingOffCatalog}
                  disabled={listingOffCatalog}
                  aria-readonly={listingOffCatalog || undefined}
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
                    backgroundColor: listingOffCatalog ? '#f5f5f7' : '#fff',
                    color: listingOffCatalog ? '#86868b' : '#1d1d1f',
                    cursor: listingOffCatalog ? 'not-allowed' : 'text',
                  }}
                />
                <button
                  type="submit"
                  className="message-send-btn"
                  disabled={listingOffCatalog || !newMessage.trim() || sending}
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
                    cursor: listingOffCatalog || !newMessage.trim() || sending ? 'not-allowed' : 'pointer',
                    opacity: listingOffCatalog ? 0.45 : 1,
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
              <h3 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
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
                <p style={{ color: '#6e6e73', margin: 0 }}>Membre depuis le {formatDate(popupUser.createdAt)}</p>
                {popupUser.email && (
                  <p style={{ margin: '12px 0 0', color: '#1d1d1f' }}>
                    <strong>Email :</strong>{' '}
                    <a href={`mailto:${popupUser.email}`} style={{ color: '#1d1d1f', textDecoration: 'underline' }}>{popupUser.email}</a>
                  </p>
                )}
              </div>
            ) : popupSeller ? (
              <div style={{ color: '#1d1d1f' }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f0f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {popupSeller.avatarUrl ? (
                        <img src={getSellerAvatarUrl(popupSeller) ?? ''} alt={popupSeller.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Store size={40} color="#888" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 6 }}>{popupSeller.companyName}</h3>
                      {popupSeller.description && (
                        <>
                          {!sellerDescExpanded ? (
                            popupSeller.description.length > 100 ? (
                              <div style={{ position: 'relative', margin: 0, fontSize: 14, color: '#666', lineHeight: 1.5, minHeight: '3em' }}>
                                <div
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical' as const,
                                    overflow: 'hidden' as const,
                                    paddingRight: 72,
                                  }}
                                >
                                  {popupSeller.description}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSellerDescExpanded(true)}
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    bottom: 0,
                                    padding: 0,
                                    margin: 0,
                                    background: 'none',
                                    border: 'none',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: '#1d1d1f',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    fontFamily: 'inherit',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  Voir plus
                                </button>
                              </div>
                            ) : (
                              <p style={{ fontSize: 14, color: '#666', margin: 0, lineHeight: 1.5 }}>{popupSeller.description}</p>
                            )
                          ) : (
                            <>
                              <p style={{ fontSize: 14, color: '#666', margin: 0, lineHeight: 1.5 }}>{popupSeller.description}</p>
                              {popupSeller.description.length > 100 && (
                                <button
                                  type="button"
                                  onClick={() => setSellerDescExpanded(false)}
                                  style={{ marginTop: 6, padding: 0, background: 'none', border: 'none', fontSize: 14, fontWeight: 500, color: '#1d1d1f', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  Voir moins
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={sellerCataloguePath(popupSeller)}
                  onClick={() => setShowPartyPopup(false)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 44, backgroundColor: '#1d1d1f', color: '#fff', borderRadius: 10, fontSize: 16, fontWeight: 500, fontFamily: 'inherit', textAlign: 'center', marginBottom: 12, textDecoration: 'none' }}
                >
                  Voir les annonces du vendeur
                </Link>
                {(popupSeller.address || popupSeller.city || popupSeller.postcode) && (
                  <button
                    type="button"
                    onClick={() => setShowMapPopup(true)}
                    style={{ width: '100%', marginTop: 0, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <MapPin size={18} color="#1d1d1f" style={{ flexShrink: 0 }} />
                    {popupSeller.postcode && <span style={{ fontSize: 16 }}>{popupSeller.postcode}</span>}
                    {popupSeller.city && <span style={{ fontSize: 16 }}>{popupSeller.city}</span>}
                  </button>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#6e6e73' }}>Impossible de charger les informations.</p>
            )}
          </div>
        </div>
      )}

      {/* Popup Rendre visite au vendeur */}
      {popupSeller && (
        <SellerVisitMapPopup
          seller={popupSeller}
          open={showMapPopup}
          onClose={() => setShowMapPopup(false)}
          mapZoom={mapZoom}
          setMapZoom={setMapZoom}
          showBackButton
        />
      )}
    </main>
  );
}
