import { supabase, isSupabaseConfigured } from './client';
import { Conversation, Message } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

function checkSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase non configuré');
  }
  return supabase;
}

function rowToConversation(row: any): Conversation {
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title,
    listingPhoto: row.listing_photo || '',
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    lastMessage: row.last_message || '',
    lastMessageAt: new Date(row.last_message_at),
    unreadBuyer: row.unread_buyer || 0,
    unreadSeller: row.unread_seller || 0,
    buyerClearedAt: row.buyer_cleared_at ? new Date(row.buyer_cleared_at) : null,
    sellerClearedAt: row.seller_cleared_at ? new Date(row.seller_cleared_at) : null,
  };
}

function rowToMessage(row: any): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    content: row.content,
    createdAt: new Date(row.created_at),
    read: row.read || false,
    imageUrl: row.image_url || null,
  };
}

// Get or create a conversation
export async function getOrCreateConversation(data: {
  listingId: string;
  listingTitle: string;
  listingPhoto: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
}): Promise<Conversation> {
  const client = checkSupabase();
  
  // RPC gère : créer si besoin, ou réafficher pour l'acheteur si il avait "supprimé" la conversation
  const { data: rows, error } = await client.rpc('get_or_create_conversation', {
    p_listing_id: data.listingId,
    p_listing_title: data.listingTitle,
    p_listing_photo: data.listingPhoto ?? '',
    p_buyer_id: data.buyerId,
    p_buyer_name: data.buyerName,
    p_seller_id: data.sellerId,
    p_seller_name: data.sellerName,
  });

  if (error) throw error;
  const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  if (!row) throw new Error('get_or_create_conversation n\'a pas renvoyé de conversation');
  return rowToConversation(row);
}

// Get conversation by ID
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error || !data) return null;
  return rowToConversation(data);
}

// Get user's conversations
export async function getUserConversations(
  userId: string,
  role: 'buyer' | 'seller'
): Promise<Conversation[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  
  const field = role === 'buyer' ? 'buyer_id' : 'seller_id';
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq(field, userId)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToConversation);
}

/** Nombre de conversations (utilisateurs ayant cliqué Message et envoyé le formulaire Contacter le vendeur) pour un vendeur. */
export async function getSellerConversationsCount(sellerId: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  const { count, error } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', sellerId);
  if (error) return 0;
  return count ?? 0;
}

/** Nombre de conversations (messages) pour une annonce donnée. */
export async function getConversationsCountForListing(listingId: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  const { count, error } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId);
  if (error) return 0;
  return count ?? 0;
}

// Send a message
export async function sendMessage(data: {
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  isBuyer: boolean;
  imageUrl?: string | null;
}): Promise<Message> {
  const client = checkSupabase();
  
  // Insert message
  const { data: message, error: msgError } = await client
    .from('messages')
    .insert({
      conversation_id: data.conversationId,
      sender_id: data.senderId,
      sender_name: data.senderName,
      content: data.content,
      read: false,
      ...(data.imageUrl != null && data.imageUrl !== '' && { image_url: data.imageUrl }),
    })
    .select()
    .single();

  if (msgError) throw msgError;

  // Update conversation
  const unreadField = data.isBuyer ? 'unread_seller' : 'unread_buyer';
  
  // Get current unread count
  const { data: conv } = await client
    .from('conversations')
    .select(unreadField)
    .eq('id', data.conversationId)
    .single();
  
  const currentUnread = conv ? (conv as any)[unreadField] || 0 : 0;

  const lastMessagePreview = data.content || (data.imageUrl ? '📷 Image' : '');
  await client
    .from('conversations')
    .update({
      last_message: lastMessagePreview,
      last_message_at: new Date().toISOString(),
      [unreadField]: currentUnread + 1,
    })
    .eq('id', data.conversationId);

  return rowToMessage(message);
}

// Get messages for a conversation (optionnel : since = n'afficher que les messages après cette date)
// Avec since, on utilise la RPC pour garantir le filtre côté serveur.
export async function getMessages(
  conversationId: string,
  limitCount = 50,
  since?: Date | null
): Promise<Message[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  if (since) {
    const { data: rows, error } = await supabase.rpc('get_messages_for_conversation', {
      p_conversation_id: conversationId,
      p_since_timestamptz: since.toISOString(),
      p_limit: limitCount,
    });
    if (error) throw error;
    return (Array.isArray(rows) ? rows : []).map(rowToMessage);
  }
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limitCount);
  if (error) throw error;
  return (data || []).map(rowToMessage);
}

// Subscribe to messages (real-time). since = n'afficher que les messages après cette date (ex. après "suppression")
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
  options?: { since?: Date | string | null }
): () => void {
  if (!isSupabaseConfigured || !supabase) {
    callback([]);
    return () => {};
  }
  const raw = options?.since ?? null;
  const since = raw instanceof Date ? raw : (raw ? new Date(raw) : null);

  // Initial load (filtrée par since si fourni)
  getMessages(conversationId, 50, since).then(callback);

  // Real-time subscription
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      () => {
        getMessages(conversationId, 50, since).then(callback);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

// Subscribe to conversations (real-time)
export function subscribeToConversations(
  userId: string,
  role: 'buyer' | 'seller',
  callback: (conversations: Conversation[]) => void
): () => void {
  if (!isSupabaseConfigured || !supabase) {
    callback([]);
    return () => {};
  }
  
  // Initial load
  getUserConversations(userId, role).then(callback);
  
  const field = role === 'buyer' ? 'buyer_id' : 'seller_id';

  const refetch = () => getUserConversations(userId, role).then(callback);

  // Real-time subscription (INSERT/UPDATE/DELETE sur conversations)
  const channel = supabase
    .channel(`conversations:${userId}:${role}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `${field}=eq.${userId}`,
      },
      refetch
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') refetch();
    });

  return () => {
    channel.unsubscribe();
  };
}

// Mark conversation as read
export async function markConversationAsRead(
  conversationId: string,
  isBuyer: boolean
): Promise<void> {
  const client = checkSupabase();
  const unreadField = isBuyer ? 'unread_buyer' : 'unread_seller';
  
  await client
    .from('conversations')
    .update({ [unreadField]: 0 })
    .eq('id', conversationId);
}

// "Supprimer" une conversation côté utilisateur uniquement (masquée pour lui, reste visible pour l'autre)
// Passe par une RPC SECURITY DEFINER pour éviter le blocage RLS sur la nouvelle ligne après UPDATE.
export async function deleteConversation(conversationId: string, role: 'buyer' | 'seller'): Promise<void> {
  const client = checkSupabase();
  const { error } = await client.rpc('hide_conversation_for_me', {
    p_conversation_id: conversationId,
    p_is_buyer: role === 'buyer',
  });
  if (error) throw new Error(error.message || 'Erreur lors de la suppression.');
}
