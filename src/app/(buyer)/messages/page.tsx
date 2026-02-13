'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToConversations } from '@/lib/supabase/messaging';
import { Conversation } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

export default function MessagesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isSeller, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const getUnreadCount = (conversation: Conversation) => {
    return isSeller ? conversation.unreadSeller : conversation.unreadBuyer;
  };

  const getOtherPartyName = (conversation: Conversation) => {
    return isSeller ? conversation.buyerName : conversation.sellerName;
  };

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', paddingTop: 38, paddingRight: 20, paddingBottom: 60, paddingLeft: 20 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
            Messages
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>
            {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
          </p>
        </div>

        {conversations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {conversations.map((conversation) => {
              const unreadCount = getUnreadCount(conversation);
              const hasUnread = unreadCount > 0;

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  style={{
                    display: 'flex',
                    gap: 16,
                    padding: 16,
                    backgroundColor: hasUnread ? '#f8f8f8' : '#fff',
                    border: '1px solid #eee',
                  }}
                >
                  <div style={{ width: 56, height: 56, backgroundColor: '#f0f0f0', flexShrink: 0, overflow: 'hidden' }}>
                    {conversation.listingPhoto ? (
                      <img src={conversation.listingPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle size={20} color="#ccc" />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <h3 style={{ fontSize: 14, fontWeight: hasUnread ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getOtherPartyName(conversation)}
                      </h3>
                      <span style={{ fontSize: 11, color: '#888', flexShrink: 0 }}>
                        {formatRelativeTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conversation.listingTitle}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <p style={{ fontSize: 13, color: hasUnread ? '#000' : '#666', fontWeight: hasUnread ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conversation.lastMessage || 'Nouvelle conversation'}
                      </p>
                      {hasUnread && (
                        <span style={{ marginLeft: 8, padding: '2px 8px', backgroundColor: '#000', color: '#fff', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ width: 64, height: 64, backgroundColor: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <MessageCircle size={28} color="#ccc" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, marginBottom: 8 }}>Aucun message</h2>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
              Contactez un vendeur pour démarrer une conversation
            </p>
            <Link href="/catalogue" style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#000', color: '#fff', fontSize: 14, fontWeight: 500 }}>
              Découvrir le catalogue
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
