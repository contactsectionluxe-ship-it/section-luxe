'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Avatar, PageLoader } from '@/components/ui';
import {
  getConversation,
  subscribeToMessages,
  sendMessage,
  markConversationAsRead,
} from '@/lib/supabase/messaging';
import { Conversation, Message } from '@/types';
import { formatRelativeTime, cn } from '@/lib/utils';

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;
  const { user, isAuthenticated, isSeller, loading: authLoading } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/connexion');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    async function loadConversation() {
      try {
        const data = await getConversation(conversationId);
        if (!data) {
          router.push('/messages');
          return;
        }

        // Verify user is a participant
        if (data.buyerId !== user?.uid && data.sellerId !== user?.uid) {
          router.push('/messages');
          return;
        }

        setConversation(data);

        // Mark as read
        const isBuyer = data.buyerId === user?.uid;
        await markConversationAsRead(conversationId, isBuyer);
      } catch (error) {
        console.error('Error loading conversation:', error);
        router.push('/messages');
      }
    }

    if (user) {
      loadConversation();
    }
  }, [conversationId, user, router]);

  useEffect(() => {
    if (!conversation) return;

    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    });

    return () => unsubscribe();
  }, [conversationId, conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !conversation) {
    return null;
  }

  const isBuyer = conversation.buyerId === user?.uid;
  const otherPartyName = isBuyer ? conversation.sellerName : conversation.buyerName;

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="border-b border-[var(--color-silver)] bg-white">
        <div className="container max-w-3xl py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/messages"
              className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-cream)] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            {/* Product thumbnail */}
            <Link
              href={`/produit/${conversation.listingId}`}
              className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-cream)] flex-shrink-0"
            >
              {conversation.listingPhoto ? (
                <img
                  src={conversation.listingPhoto}
                  alt={conversation.listingTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-[var(--color-gray-light)]" />
                </div>
              )}
            </Link>

            <div className="flex-1 min-w-0">
              <h1 className="font-medium truncate">{otherPartyName}</h1>
              <Link
                href={`/produit/${conversation.listingId}`}
                className="text-sm text-[var(--color-gray)] hover:text-[var(--color-black)] truncate block"
              >
                {conversation.listingTitle}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-3xl py-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--color-gray)]">
                  Démarrez la conversation avec {otherPartyName}
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.senderId === user?.uid;
                const showAvatar =
                  index === 0 ||
                  messages[index - 1].senderId !== message.senderId;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex gap-3',
                      isOwn && 'flex-row-reverse'
                    )}
                  >
                    {showAvatar ? (
                      <Avatar
                        size="sm"
                        fallback={message.senderName}
                        className="flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8" />
                    )}

                    <div
                      className={cn(
                        'max-w-[70%] px-4 py-3 rounded-2xl',
                        isOwn
                          ? 'bg-[var(--color-black)] text-white rounded-tr-md'
                          : 'bg-[var(--color-cream)] rounded-tl-md'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          isOwn ? 'text-white/60' : 'text-[var(--color-gray)]'
                        )}
                      >
                        {formatRelativeTime(message.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-silver)] bg-white">
        <div className="container max-w-3xl py-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 h-12 px-4 bg-[var(--color-cream)] rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-black)]"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="h-12 w-12 rounded-full p-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
