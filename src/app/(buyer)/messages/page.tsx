'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Trash2, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToConversations, deleteConversation } from '@/lib/supabase/messaging';
import { Conversation } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

type FilterTab = 'all' | 'read' | 'unread';

const MESSAGES_FILTER_OPTIONS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'unread', label: 'Non lus' },
  { value: 'read', label: 'Lus' },
];

export default function MessagesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isSeller, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/connexion');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;

    const role = isSeller ? 'seller' : 'buyer';
    const unsubscribe = subscribeToConversations(user.uid, role, (convos) => {
      setConversations(convos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isSeller]);

  useEffect(() => {
    if (!filterDropdownOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [filterDropdownOpen]);

  const getUnreadCount = (c: Conversation) => (isSeller ? c.unreadSeller : c.unreadBuyer);
  const hasUnread = (c: Conversation) => getUnreadCount(c) > 0;
  const getOtherPartyName = (c: Conversation) => (isSeller ? c.buyerName : c.sellerName);

  const filteredByTab = conversations.filter((c) => {
    if (filter === 'unread') return hasUnread(c);
    if (filter === 'read') return !hasUnread(c);
    return true;
  });
  const q = searchQuery.trim().toLowerCase();
  const filteredConversations = q
    ? filteredByTab.filter(
        (c) =>
          getOtherPartyName(c).toLowerCase().includes(q) ||
          (c.listingTitle && c.listingTitle.toLowerCase().includes(q)) ||
          (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
      )
    : filteredByTab;

  const handleDelete = async (conversationId: string) => {
    if (!conversationId || deleting) return;
    setDeleting(true);
    try {
      const role = isSeller ? 'seller' : 'buyer';
      await deleteConversation(conversationId, role);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      setDeleteTargetId(null);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('messages:refresh-unread'));
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'Impossible de supprimer la conversation.';
      console.error('Error deleting conversation:', msg, err);
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement...</p>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <main style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px' }}>
        {/* Même structure que Mes favoris : bloc titre puis barre de recherche + filtre sur une ligne */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
            Ma messagerie
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>
            {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
          </p>
        </div>

        {conversations.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans ma messagerie..."
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
            <div ref={filterDropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setFilterDropdownOpen((v) => !v)}
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
                  minWidth: 140,
                }}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>
                  {MESSAGES_FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? 'Tous'}
                </span>
                <ChevronDown size={16} style={{ color: '#86868b', flexShrink: 0 }} />
              </button>
              {filterDropdownOpen && (
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
                  {MESSAGES_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setFilter(opt.value);
                        setFilterDropdownOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        background: filter === opt.value ? '#f5f5f7' : 'transparent',
                        fontSize: 14,
                        color: '#1d1d1f',
                        cursor: 'pointer',
                        textAlign: 'left',
                        outline: 'none',
                        boxShadow: 'none',
                        fontWeight: filter === opt.value ? 600 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Liste des discussions : même arrondi que la barre de recherche (12), bloc unique non séparé */}
        {filteredConversations.length > 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e8e6e3', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredConversations.map((conversation, index) => {
                const unreadCount = getUnreadCount(conversation);
                const isUnread = unreadCount > 0;
                return (
                  <div
                    key={conversation.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '18px 28px',
                      borderBottom: index < filteredConversations.length - 1 ? '1px solid #e8e6e3' : 'none',
                      backgroundColor: isUnread ? '#fafaf9' : '#fff',
                    }}
                  >
                    <Link
                      href={`/produit/${conversation.listingId}`}
                      style={{ flexShrink: 0, textDecoration: 'none', color: 'inherit' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f5f5f7', border: '1px solid #e8e6e3' }}>
                        {conversation.listingPhoto ? (
                          <img src={conversation.listingPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageCircle size={28} color="#86868b" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <Link
                      href={`/messages/${conversation.id}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 28, minWidth: 0, textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: isUnread ? 600 : 500, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getOtherPartyName(conversation)}
                          </span>
                          <span style={{ fontSize: 12, color: '#86868b', flexShrink: 0 }}>
                            {formatRelativeTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: '#6e6e73', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conversation.listingTitle}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                          <p style={{ fontSize: 13, color: isUnread ? '#1d1d1f' : '#86868b', fontWeight: isUnread ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                            {conversation.lastMessage || 'Nouvelle conversation'}
                          </p>
                          {isUnread && (
                            <span style={{ marginLeft: 8, padding: '2px 8px', backgroundColor: '#1d1d1f', color: '#fff', fontSize: 11, fontWeight: 600, borderRadius: 8, flexShrink: 0 }}>
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div style={{ flexShrink: 0, borderLeft: '1px solid #e8e6e3', paddingLeft: 14, display: 'flex', alignItems: 'center', alignSelf: 'stretch', minHeight: 80 }}>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setDeleteTargetId(conversation.id); }}
                        style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', backgroundColor: 'transparent', color: '#86868b', cursor: 'pointer', borderRadius: 10 }}
                        aria-label="Supprimer la conversation"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : q ? (
            <div style={{ textAlign: 'center', padding: '60px 28px' }}>
              <p style={{ fontSize: 15, color: '#6e6e73' }}>Aucun résultat pour « {searchQuery.trim()} »</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 28px' }}>
              <div style={{ width: 64, height: 64, backgroundColor: '#f5f5f7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #e8e6e3' }}>
                <MessageCircle size={28} color="#86868b" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>
                Aucun message
              </h2>
              <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 24 }}>
                {filter === 'all' ? 'Contactez un vendeur pour démarrer une conversation' : filter === 'unread' ? 'Aucune conversation non lue' : 'Aucune conversation lue'}
              </p>
              {filter === 'all' && (
                <Link
                  href="/catalogue"
                  style={{ display: 'inline-block', padding: '14px 28px', backgroundColor: '#1d1d1f', color: '#fff', fontSize: 15, fontWeight: 500, borderRadius: 12 }}
                >
                  Accéder au catalogue
                </Link>
              )}
            </div>
          )}
      </div>

      {/* Popup confirmation suppression */}
      {deleteTargetId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => !deleting && setDeleteTargetId(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 380, backgroundColor: '#fff', padding: 32, borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, marginBottom: 12, color: '#0a0a0a', textAlign: 'center' }}>
              Supprimer la conversation
            </h3>
            <p style={{ fontSize: 14, color: '#6e6e73', textAlign: 'center', marginBottom: 24 }}>
              Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => !deleting && setDeleteTargetId(null)}
                disabled={deleting}
                style={{ flex: 1, height: 50, border: '1px solid #d2d2d7', borderRadius: 12, backgroundColor: '#fff', fontSize: 15, fontWeight: 500, color: '#1d1d1f', cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTargetId)}
                disabled={deleting}
                style={{ flex: 1, height: 50, border: 'none', borderRadius: 12, backgroundColor: '#dc2626', fontSize: 15, fontWeight: 500, color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
