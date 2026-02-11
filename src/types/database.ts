export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          role: 'buyer' | 'seller' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          role?: 'buyer' | 'seller' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          role?: 'buyer' | 'seller' | 'admin'
          created_at?: string
        }
      }
      sellers: {
        Row: {
          id: string
          email: string
          company_name: string
          address: string
          phone: string
          description: string
          status: 'pending' | 'approved' | 'rejected'
          id_card_front_url: string
          id_card_back_url: string
          kbis_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          company_name: string
          address: string
          phone: string
          description: string
          status?: 'pending' | 'approved' | 'rejected'
          id_card_front_url: string
          id_card_back_url: string
          kbis_url: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          company_name?: string
          address?: string
          phone?: string
          description?: string
          status?: 'pending' | 'approved' | 'rejected'
          id_card_front_url?: string
          id_card_back_url?: string
          kbis_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      listings: {
        Row: {
          id: string
          seller_id: string
          seller_name: string
          title: string
          description: string
          price: number
          category: string
          photos: string[]
          likes_count: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          seller_name: string
          title: string
          description: string
          price: number
          category: string
          photos?: string[]
          likes_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          seller_name?: string
          title?: string
          description?: string
          price?: number
          category?: string
          photos?: string[]
          likes_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          listing_id?: string
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          listing_id: string
          listing_title: string
          listing_photo: string
          buyer_id: string
          buyer_name: string
          seller_id: string
          seller_name: string
          last_message: string
          last_message_at: string
          unread_buyer: number
          unread_seller: number
        }
        Insert: {
          id?: string
          listing_id: string
          listing_title: string
          listing_photo?: string
          buyer_id: string
          buyer_name: string
          seller_id: string
          seller_name: string
          last_message?: string
          last_message_at?: string
          unread_buyer?: number
          unread_seller?: number
        }
        Update: {
          id?: string
          listing_id?: string
          listing_title?: string
          listing_photo?: string
          buyer_id?: string
          buyer_name?: string
          seller_id?: string
          seller_name?: string
          last_message?: string
          last_message_at?: string
          unread_buyer?: number
          unread_seller?: number
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          sender_name: string
          content: string
          created_at: string
          read: boolean
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          sender_name: string
          content: string
          created_at?: string
          read?: boolean
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          sender_name?: string
          content?: string
          created_at?: string
          read?: boolean
        }
      }
    }
  }
}
