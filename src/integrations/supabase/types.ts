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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      characters: {
        Row: {
          advantages: Json | null
          ambition: string | null
          appearance: string | null
          attachments: Json | null
          avatar_url: string | null
          blood_potency: number | null
          charisma: number | null
          chronicle_id: string
          chronicle_tenets: string[] | null
          clan: string
          composure: number | null
          concept: string | null
          convictions: string[] | null
          coterie: string | null
          created_at: string
          desire: string | null
          dexterity: number | null
          disciplines: Json | null
          distinguishing_features: string | null
          experience_spent: number | null
          experience_total: number | null
          flaws: Json | null
          generation: number | null
          health_aggravated: number | null
          health_max: number | null
          health_superficial: number | null
          history: string | null
          humanity: number | null
          hunger: number | null
          id: string
          intelligence: number | null
          loresheets: Json | null
          manipulation: number | null
          name: string
          notes: string | null
          powers: Json | null
          predator_type: string | null
          resolve: number | null
          resonance: string | null
          sire: string | null
          skills: Json | null
          stamina: number | null
          status: string
          strength: number | null
          touchstones: Json | null
          type: string
          updated_at: string
          user_id: string
          willpower_aggravated: number | null
          willpower_max: number | null
          willpower_superficial: number | null
          wits: number | null
        }
        Insert: {
          advantages?: Json | null
          ambition?: string | null
          appearance?: string | null
          attachments?: Json | null
          avatar_url?: string | null
          blood_potency?: number | null
          charisma?: number | null
          chronicle_id: string
          chronicle_tenets?: string[] | null
          clan: string
          composure?: number | null
          concept?: string | null
          convictions?: string[] | null
          coterie?: string | null
          created_at?: string
          desire?: string | null
          dexterity?: number | null
          disciplines?: Json | null
          distinguishing_features?: string | null
          experience_spent?: number | null
          experience_total?: number | null
          flaws?: Json | null
          generation?: number | null
          health_aggravated?: number | null
          health_max?: number | null
          health_superficial?: number | null
          history?: string | null
          humanity?: number | null
          hunger?: number | null
          id?: string
          intelligence?: number | null
          loresheets?: Json | null
          manipulation?: number | null
          name: string
          notes?: string | null
          powers?: Json | null
          predator_type?: string | null
          resolve?: number | null
          resonance?: string | null
          sire?: string | null
          skills?: Json | null
          stamina?: number | null
          status?: string
          strength?: number | null
          touchstones?: Json | null
          type?: string
          updated_at?: string
          user_id: string
          willpower_aggravated?: number | null
          willpower_max?: number | null
          willpower_superficial?: number | null
          wits?: number | null
        }
        Update: {
          advantages?: Json | null
          ambition?: string | null
          appearance?: string | null
          attachments?: Json | null
          avatar_url?: string | null
          blood_potency?: number | null
          charisma?: number | null
          chronicle_id?: string
          chronicle_tenets?: string[] | null
          clan?: string
          composure?: number | null
          concept?: string | null
          convictions?: string[] | null
          coterie?: string | null
          created_at?: string
          desire?: string | null
          dexterity?: number | null
          disciplines?: Json | null
          distinguishing_features?: string | null
          experience_spent?: number | null
          experience_total?: number | null
          flaws?: Json | null
          generation?: number | null
          health_aggravated?: number | null
          health_max?: number | null
          health_superficial?: number | null
          history?: string | null
          humanity?: number | null
          hunger?: number | null
          id?: string
          intelligence?: number | null
          loresheets?: Json | null
          manipulation?: number | null
          name?: string
          notes?: string | null
          powers?: Json | null
          predator_type?: string | null
          resolve?: number | null
          resonance?: string | null
          sire?: string | null
          skills?: Json | null
          stamina?: number | null
          status?: string
          strength?: number | null
          touchstones?: Json | null
          type?: string
          updated_at?: string
          user_id?: string
          willpower_aggravated?: number | null
          willpower_max?: number | null
          willpower_superficial?: number | null
          wits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "chronicles"
            referencedColumns: ["id"]
          },
        ]
      }
      chronicles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          setting: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          setting?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          setting?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          category: string | null
          chronicle_id: string
          content: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          chronicle_id: string
          content?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          chronicle_id?: string
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "chronicles"
            referencedColumns: ["id"]
          },
        ]
      }
      plot_characters: {
        Row: {
          character_id: string
          created_at: string
          id: string
          plot_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          plot_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          plot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plot_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_characters_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      plots: {
        Row: {
          attachments: Json | null
          chronicle_id: string
          created_at: string
          description: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          chronicle_id: string
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          chronicle_id?: string
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plots_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "chronicles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          attachments: Json | null
          chronicle_id: string
          created_at: string
          date_played: string
          experience_awarded: number | null
          id: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          chronicle_id: string
          created_at?: string
          date_played?: string
          experience_awarded?: number | null
          id?: string
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          chronicle_id?: string
          created_at?: string
          date_played?: string
          experience_awarded?: number | null
          id?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "chronicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
