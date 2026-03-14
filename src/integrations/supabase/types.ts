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
      captions: {
        Row: {
          clip_id: string
          created_at: string
          end_time: number
          id: string
          start_time: number
          style: Json | null
          text: string
          user_id: string
        }
        Insert: {
          clip_id: string
          created_at?: string
          end_time: number
          id?: string
          start_time: number
          style?: Json | null
          text: string
          user_id: string
        }
        Update: {
          clip_id?: string
          created_at?: string
          end_time?: number
          id?: string
          start_time?: number
          style?: Json | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "captions_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "clips"
            referencedColumns: ["id"]
          },
        ]
      }
      clips: {
        Row: {
          created_at: string
          duration_seconds: number | null
          end_time: number
          file_path: string | null
          format: string | null
          id: string
          is_favorite: boolean | null
          start_time: number
          status: string | null
          template_id: string | null
          thumbnail_path: string | null
          title: string
          transcript_text: string | null
          updated_at: string
          user_id: string
          video_id: string
          virality_details: Json | null
          virality_score: number | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          end_time: number
          file_path?: string | null
          format?: string | null
          id?: string
          is_favorite?: boolean | null
          start_time: number
          status?: string | null
          template_id?: string | null
          thumbnail_path?: string | null
          title: string
          transcript_text?: string | null
          updated_at?: string
          user_id: string
          video_id: string
          virality_details?: Json | null
          virality_score?: number | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          end_time?: number
          file_path?: string | null
          format?: string | null
          id?: string
          is_favorite?: boolean | null
          start_time?: number
          status?: string | null
          template_id?: string | null
          thumbnail_path?: string | null
          title?: string
          transcript_text?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
          virality_details?: Json | null
          virality_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clips_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          job_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          job_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          job_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "processing_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      editor_sessions: {
        Row: {
          created_at: string
          id: string
          state: Json
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          state?: Json
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          state?: Json
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editor_sessions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      job_logs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          level: string
          message: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          level?: string
          message: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          level?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "job_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "processing_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          billing_updates: boolean
          clip_ready: boolean
          created_at: string
          id: string
          processing_errors: boolean
          processing_updates: boolean
          product_news: boolean
          system_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_updates?: boolean
          clip_ready?: boolean
          created_at?: string
          id?: string
          processing_errors?: boolean
          processing_updates?: boolean
          product_news?: boolean
          system_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_updates?: boolean
          clip_ready?: boolean
          created_at?: string
          id?: string
          processing_errors?: boolean
          processing_updates?: boolean
          product_news?: boolean
          system_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: string | null
          error_message: string | null
          id: string
          options: Json | null
          progress: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          id?: string
          options?: Json | null
          progress?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          id?: string
          options?: Json | null
          progress?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_ideas: {
        Row: {
          category: string | null
          created_at: string
          hooks: string[] | null
          id: string
          source: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          hooks?: string[] | null
          id?: string
          source?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          hooks?: string[] | null
          id?: string
          source?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      transcript_segments: {
        Row: {
          confidence: number | null
          created_at: string
          end_time: number
          id: string
          speaker: string | null
          start_time: number
          text: string
          transcript_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          end_time: number
          id?: string
          speaker?: string | null
          start_time: number
          text: string
          transcript_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          end_time?: number
          id?: string
          speaker?: string | null
          start_time?: number
          text?: string
          transcript_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcript_segments_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          created_at: string
          full_text: string | null
          id: string
          language: string | null
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          full_text?: string | null
          id?: string
          language?: string | null
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          full_text?: string | null
          id?: string
          language?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
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
      videos: {
        Row: {
          category: string | null
          created_at: string
          current_step: string | null
          description: string | null
          duration_seconds: number | null
          error_message: string | null
          external_video_id: string | null
          file_path: string | null
          file_size: number | null
          id: string
          language: string | null
          progress: number | null
          source_type: string | null
          source_url: string | null
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_step?: string | null
          description?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          external_video_id?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          language?: string | null
          progress?: number | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_step?: string | null
          description?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          external_video_id?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          language?: string | null
          progress?: number | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    }
    Enums: {
      app_role: "admin" | "user"
      job_status:
        | "queued"
        | "processing"
        | "transcribing"
        | "analyzing"
        | "generating_clips"
        | "rendering"
        | "completed"
        | "failed"
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
      app_role: ["admin", "user"],
      job_status: [
        "queued",
        "processing",
        "transcribing",
        "analyzing",
        "generating_clips",
        "rendering",
        "completed",
        "failed",
      ],
    },
  },
} as const
