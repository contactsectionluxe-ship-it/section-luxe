'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToConversations, deleteConversation } from '@/lib/supabase/messaging';
import { Conversation } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

type FilterTab = 'all' | 'read' | 'unread';

export default function MessagesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isSeller, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const getUnreadCount = (c: Conversation) => (isSeller ? c.unreadSeller : c.unreadBuyer);
  const hasUnread = (c: Conversation) => getUnreadCount(c) > 0;
  const getOtherPartyName = (c: Conversation) => (isSeller ? c.buyerName : c.sellerName);

  const filteredConversations = conversations.filter((c) => {
    if (filter === 'unread') return hasUnread(c);
    if (filter === 'read') return !hasUnread(c);
    return true;
  });

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
      <main style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement...</p>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <main style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 24px 80px' }}>
        {/* Titre (style Devenir vendeur) */}
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
            Ma messagerie
          </h1>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>
            {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
          </p>
        </div>

        {/* Filtres Tous / Non lus / Lus */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {(['all', 'unread', 'read'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              style={{
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 500,
                border: '1px solid ' + (filter === tab ? '#1d1d1f' : '#d2d2d7'),
                borderRadius: 12,
                backgroundColor: filter === tab ? '#1d1d1f' : '#fff',
                color: filter === tab ? '#fff' : '#1d1d1f',
                cursor: 'pointer',
              }}
            >
              {tab === 'all' ? 'Tous' : tab === 'read' ? 'Lus' : 'Non lus'}
            </button>
          ))}
        </div>

        {/* Carte liste (style Devenir vendeur) */}
        <div style={{ backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {filteredConversations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredConversations.map((conversation) => {
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
                      borderBottom: '1px solid #e8e6e3',
                      backgroundColor: isUnread ? '#fafaf9' : '#fff',
                    }}
                  >
                    <Link
                      href={`/messages/${conversation.id}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f5f5f7', flexShrink: 0, border: '1px solid #e8e6e3' }}>
                        {conversation.listingPhoto ? (
                          <img src={conversation.listingPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageCircle size={22} color="#86868b" />
                          </div>
                        )}
                      </div>
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
                    <div style={{ flexShrink: 0, borderLeft: '1px solid #e8e6e3', paddingLeft: 14, display: 'flex', alignItems: 'center', alignSelf: 'stretch', minHeight: 52 }}>
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
                  Découvrir le catalogue
                </Link>
              )}
            </div>
          )}
        </div>
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
