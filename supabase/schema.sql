-- LUXE Marketplace - Supabase Schema
-- Execute this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sellers table
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  siret TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  postcode TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  id_card_front_url TEXT NOT NULL,
  id_card_back_url TEXT,
  kbis_url TEXT NOT NULL,
  avatar_url TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings table
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  listing_number TEXT UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  listing_title TEXT NOT NULL,
  listing_photo TEXT DEFAULT '',
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  last_message TEXT DEFAULT '',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_buyer INTEGER DEFAULT 0,
  unread_seller INTEGER DEFAULT 0,
  UNIQUE(listing_id, buyer_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON public.listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON public.favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Anyone can read, only owner can insert/update
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Sellers: Anyone can read (for product page), only owner can insert/update
CREATE POLICY "Sellers are viewable by everyone" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "Users can create their seller profile" ON public.sellers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Sellers can update their own profile" ON public.sellers FOR UPDATE 
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Listings: Anyone can read active, only approved sellers can create
CREATE POLICY "Active listings are viewable by everyone" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Approved sellers can create listings" ON public.listings FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.sellers WHERE id = auth.uid() AND status = 'approved'));
CREATE POLICY "Sellers can update their own listings" ON public.listings FOR UPDATE USING (seller_id = auth.uid());
CREATE POLICY "Sellers can delete their own listings" ON public.listings FOR DELETE USING (seller_id = auth.uid());

-- Favorites: Only owner can CRUD
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove their favorites" ON public.favorites FOR DELETE USING (user_id = auth.uid());

-- Conversations: Participants only
CREATE POLICY "Participants can view conversations" ON public.conversations FOR SELECT 
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Participants can update conversations" ON public.conversations FOR UPDATE 
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Messages: Participants only
CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  ));
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT 
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  ));

-- Function to increment likes
CREATE OR REPLACE FUNCTION increment_likes(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET likes_count = likes_count + 1 WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement likes
CREATE OR REPLACE FUNCTION decrement_likes(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET likes_count = GREATEST(0, likes_count - 1) WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for conversations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
