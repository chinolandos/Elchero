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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      consumed_process_tokens: {
        Row: {
          consumed_at: string
          consumed_by: string | null
          consumed_for: string | null
          token_hash: string
        }
        Insert: {
          consumed_at?: string
          consumed_by?: string | null
          consumed_for?: string | null
          token_hash: string
        }
        Update: {
          consumed_at?: string
          consumed_by?: string | null
          consumed_for?: string | null
          token_hash?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          color: string | null
          created_at: string | null
          emoji: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          audio_duration_minutes: number | null
          audio_tts_url: string | null
          concepts: Json | null
          created_at: string | null
          detected_confidence: number | null
          flashcards: Json | null
          folder_id: string | null
          id: string
          institution: string | null
          mermaid_chart: string | null
          mode: string
          questions: Json | null
          quick_review: string | null
          regenerate_count: number
          subject: string | null
          summary: string | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          audio_duration_minutes?: number | null
          audio_tts_url?: string | null
          concepts?: Json | null
          created_at?: string | null
          detected_confidence?: number | null
          flashcards?: Json | null
          folder_id?: string | null
          id?: string
          institution?: string | null
          mermaid_chart?: string | null
          mode: string
          questions?: Json | null
          quick_review?: string | null
          regenerate_count?: number
          subject?: string | null
          summary?: string | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          audio_duration_minutes?: number | null
          audio_tts_url?: string | null
          concepts?: Json | null
          created_at?: string | null
          detected_confidence?: number | null
          flashcards?: Json | null
          folder_id?: string | null
          id?: string
          institution?: string | null
          mermaid_chart?: string | null
          mode?: string
          questions?: Json | null
          quick_review?: string | null
          regenerate_count?: number
          subject?: string | null
          summary?: string | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          career: string | null
          created_at: string | null
          email: string | null
          has_guardian_consent: boolean | null
          id: string
          institution: string | null
          is_minor: boolean | null
          preferred_voice: string | null
          subjects: string[] | null
          updated_at: string | null
          user_type: string | null
          year: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          career?: string | null
          created_at?: string | null
          email?: string | null
          has_guardian_consent?: boolean | null
          id: string
          institution?: string | null
          is_minor?: boolean | null
          preferred_voice?: string | null
          subjects?: string[] | null
          updated_at?: string | null
          user_type?: string | null
          year?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          career?: string | null
          created_at?: string | null
          email?: string | null
          has_guardian_consent?: boolean | null
          id?: string
          institution?: string | null
          is_minor?: boolean | null
          preferred_voice?: string | null
          subjects?: string[] | null
          updated_at?: string | null
          user_type?: string | null
          year?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          failed_at: string | null
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          failed_at?: string | null
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          failed_at?: string | null
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usage_counter: {
        Row: {
          id: number
          total_uses: number | null
        }
        Insert: {
          id?: number
          total_uses?: number | null
        }
        Update: {
          id?: number
          total_uses?: number | null
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          last_use: string | null
          user_id: string
          uses: number | null
        }
        Insert: {
          last_use?: string | null
          user_id: string
          uses?: number | null
        }
        Update: {
          last_use?: string | null
          user_id?: string
          uses?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_consumed_tokens: { Args: never; Returns: number }
      consume_token_atomic: {
        Args: {
          p_consumed_for?: string
          p_token_hash: string
          p_user_id: string
        }
        Returns: boolean
      }
      refund_usage: { Args: { p_user_id: string }; Returns: Json }
      try_increment_regenerate: {
        Args: { p_max?: number; p_note_id: string; p_user_id: string }
        Returns: number
      }
      try_increment_usage: {
        Args: { p_max_global: number; p_max_user: number; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
