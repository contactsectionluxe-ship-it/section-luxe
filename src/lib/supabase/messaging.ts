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
  
  // Check if conversation already exists
  const { data: existing } = await client
    .from('conversations')
    .select('*')
    .eq('listing_id', data.listingId)
    .eq('buyer_id', data.buyerId)
    .single();

  if (existing) {
    return rowToConversation(existing);
  }

  // Create new conversation
  const { data: newConv, error } = await client
    .from('conversations')
    .insert({
      listing_id: data.listingId,
      listing_title: data.listingTitle,
      listing_photo: data.listingPhoto,
      buyer_id: data.buyerId,
      buyer_name: data.buyerName,
      seller_id: data.sellerId,
      seller_name: data.sellerName,
      last_message: '',
      unread_buyer: 0,
      unread_seller: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToConversation(newConv);
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

// Send a message
export async function sendMessage(data: {
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  isBuyer: boolean;
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

  await client
    .from('conversations')
    .update({
      last_message: data.content,
      last_message_at: new Date().toISOString(),
      [unreadField]: currentUnread + 1,
    })
    .eq('id', data.conversationId);

  return rowToMessage(message);
}

// Get messages for a conversation
export async function getMessages(
  conversationId: string,
  limitCount = 50
): Promise<Message[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limitCount);

  if (error) throw error;
  return (data || []).map(rowToMessage);
}

// Subscribe to messages (real-time)
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void {
  if (!isSupabaseConfigured || !supabase) {
    callback([]);
    return () => {};
  }
  
  // Initial load
  getMessages(conversationId).then(callback);
  
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
        // Reload all messages on new insert
        getMessages(conversationId).then(callback);
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
  
  // Real-time subscription
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `${field}=eq.${userId}`,
      },
      () => {
        getUserConversations(userId, role).then(callback);
      }
    )
    .subscribe();

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
