export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      advertisements: {
        Row: {
          ad_type: string
          clicks_count: number
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          placement: string
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          ad_type?: string
          clicks_count?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          placement?: string
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          ad_type?: string
          clicks_count?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          placement?: string
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_settings: {
        Row: {
          bkash_number: string | null
          id: number
          inside_dhaka_fee: number
          nagad_number: string | null
          outside_dhaka_fee: number
          updated_at: string
        }
        Insert: {
          bkash_number?: string | null
          id?: number
          inside_dhaka_fee?: number
          nagad_number?: string | null
          outside_dhaka_fee?: number
          updated_at?: string
        }
        Update: {
          bkash_number?: string | null
          id?: number
          inside_dhaka_fee?: number
          nagad_number?: string | null
          outside_dhaka_fee?: number
          updated_at?: string
        }
        Relationships: []
      }
      districts: {
        Row: {
          created_at: string
          district_name: string
          division_id: string
          id: string
        }
        Insert: {
          created_at?: string
          district_name: string
          division_id: string
          id?: string
        }
        Update: {
          created_at?: string
          district_name?: string
          division_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          created_at: string
          division_name: string
          id: string
        }
        Insert: {
          created_at?: string
          division_name: string
          id?: string
        }
        Update: {
          created_at?: string
          division_name?: string
          id?: string
        }
        Relationships: []
      }
      institutes: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          type: string
          updated_at: string
          village_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          type: string
          updated_at?: string
          village_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          type?: string
          updated_at?: string
          village_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institutes_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          buyer_name: string
          buyer_phone: string
          created_at: string
          delivery_address: string
          delivery_area: string
          delivery_fee: number
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          seller_id: string
          status: string
          subtotal: number
          total: number
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          buyer_name: string
          buyer_phone: string
          created_at?: string
          delivery_address: string
          delivery_area?: string
          delivery_fee?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          seller_id: string
          status?: string
          subtotal?: number
          total?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          buyer_name?: string
          buyer_phone?: string
          created_at?: string
          delivery_address?: string
          delivery_area?: string
          delivery_fee?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          seller_id?: string
          status?: string
          subtotal?: number
          total?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prayer_times: {
        Row: {
          asr: string
          dhuhr: string
          fajr: string
          id: string
          institute_id: string
          isha: string
          maghrib: string
          updated_at: string
        }
        Insert: {
          asr?: string
          dhuhr?: string
          fajr?: string
          id?: string
          institute_id: string
          isha?: string
          maghrib?: string
          updated_at?: string
        }
        Update: {
          asr?: string
          dhuhr?: string
          fajr?: string
          id?: string
          institute_id?: string
          isha?: string
          maghrib?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_times_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: true
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          phone_number: string | null
          price: number | null
          seller_id: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          phone_number?: string | null
          price?: number | null
          seller_id: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          phone_number?: string | null
          price?: number | null
          seller_id?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string
          created_at: string
          district_id: string | null
          division_id: string | null
          full_name: string
          id: string
          mobile: string
          union_name: string | null
          upazila: string | null
          updated_at: string
          village_name: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string
          created_at?: string
          district_id?: string | null
          division_id?: string | null
          full_name?: string
          id: string
          mobile?: string
          union_name?: string | null
          upazila?: string | null
          updated_at?: string
          village_name?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string
          created_at?: string
          district_id?: string | null
          division_id?: string | null
          full_name?: string
          id?: string
          mobile?: string
          union_name?: string | null
          upazila?: string | null
          updated_at?: string
          village_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          admin_note: string | null
          category_id: string | null
          content: string
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "story_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      story_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_likes: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unions: {
        Row: {
          created_at: string
          id: string
          union_name: string
          upazila_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          union_name: string
          upazila_id: string
        }
        Update: {
          created_at?: string
          id?: string
          union_name?: string
          upazila_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unions_upazila_id_fkey"
            columns: ["upazila_id"]
            isOneToOne: false
            referencedRelation: "upazilas"
            referencedColumns: ["id"]
          },
        ]
      }
      upazilas: {
        Row: {
          created_at: string
          district_id: string
          id: string
          upazila_name: string
        }
        Insert: {
          created_at?: string
          district_id: string
          id?: string
          upazila_name: string
        }
        Update: {
          created_at?: string
          district_id?: string
          id?: string
          upazila_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "upazilas_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      villages: {
        Row: {
          created_at: string
          id: string
          union_id: string
          village_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          union_id: string
          village_name: string
        }
        Update: {
          created_at?: string
          id?: string
          union_id?: string
          village_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "villages_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ad_click: { Args: { _ad_id: string }; Returns: undefined }
      increment_ad_view: { Args: { _ad_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "editor" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "editor", "user"],
    },
  },
} as const
