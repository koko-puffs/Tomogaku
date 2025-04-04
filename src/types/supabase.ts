interface FSRSSettings {
  request_retention: number;
  maximum_stability: number;
  weights: number[];
  learning_steps: number[];
  enable_fsrs: boolean;
}

interface DeckSettings {
  fsrs: FSRSSettings;
  [key: string]: any;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | DeckSettings
  | Json[];

export interface Database {
  public: {
    Tables: {
      decks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          visibility: "private" | "public" | "unlisted";
          tags: string[] | null;
          created_at: string;
          updated_at: string;
          last_studied_at: string | null;
          card_count: number;
          new_cards_count: number;
          learning_cards_count: number;
          review_cards_count: number;
          relearning_cards_count: number;
          due_cards_count: number;
          next_due_date: string | null;
          daily_new_cards_limit: number;
          daily_review_limit: number;
          likes_count: number;
          study_count: number;
          fork_count: number;
          is_forked: boolean;
          original_deck_id: string | null;
          version: number;
          settings: Json;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          visibility?: "private" | "public" | "unlisted";
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
          last_studied_at?: string | null;
          card_count?: number;
          new_cards_count?: number;
          learning_cards_count?: number;
          review_cards_count?: number;
          relearning_cards_count?: number;
          due_cards_count?: number;
          next_due_date?: string | null;
          daily_new_cards_limit?: number;
          daily_review_limit?: number;
          likes_count?: number;
          study_count?: number;
          fork_count?: number;
          is_forked?: boolean;
          original_deck_id?: string | null;
          version?: number;
          settings?: Json;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          visibility?: "private" | "public" | "unlisted";
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
          last_studied_at?: string | null;
          card_count?: number;
          new_cards_count?: number;
          learning_cards_count?: number;
          review_cards_count?: number;
          relearning_cards_count?: number;
          due_cards_count?: number;
          next_due_date?: string | null;
          daily_new_cards_limit?: number;
          daily_review_limit?: number;
          likes_count?: number;
          study_count?: number;
          fork_count?: number;
          is_forked?: boolean;
          original_deck_id?: string | null;
          version?: number;
          settings?: Json;
          deleted_at?: string | null;
        };
      };
      cards: {
        Row: {
          id: string;
          deck_id: string;
          front_content: string;
          back_content: string;
          note: string | null;
          created_at: string | null;
          updated_at: string | null;
          due: string | null;
          lapses: number | null;
          last_review: string | null;
          position: number | null;
          deleted_at: string | null;
          stability: number | null;
          difficulty: number | null;
          elapsed_days: number | null;
          scheduled_days: number | null;
          reps: number | null;
          state: number | null;
          tags: string[] | null;
        };
        Insert: {
          id?: string;
          deck_id?: string;
          front_content?: string;
          back_content?: string;
          note?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          due?: string | null;
          lapses?: number | null;
          last_review?: string | null;
          position?: number | null;
          deleted_at?: string | null;
          stability?: number | null;
          difficulty?: number | null;
          elapsed_days?: number | null;
          scheduled_days?: number | null;
          reps?: number | null;
          state?: number | null;
          tags?: string[] | null;
        };
        Update: {
          id?: string;
          deck_id?: string;
          front_content?: string;
          back_content?: string;
          note?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          due?: string | null;
          lapses?: number | null;
          last_review?: string | null;
          position?: number | null;
          deleted_at?: string | null;
          stability?: number | null;
          difficulty?: number | null;
          elapsed_days?: number | null;
          scheduled_days?: number | null;
          reps?: number | null;
          state?: number | null;
          tags?: string[] | null;
        };
      };
      review_logs: {
        Row: {
          id: string;
          card_id: string;
          deck_id: string;
          user_id: string;
          rating: "manual" | "again" | "hard" | "good" | "easy";
          state: number;
          scheduled_days: number;
          elapsed_days: number;
          last_elapsed_days: number;
          review_time: string;
          stability: number;
          difficulty: number;
          review_duration_ms: number | null;
          created_at: string;
          due: string | null;
        };
        Insert: {
          id?: string;
          card_id?: string;
          deck_id?: string;
          user_id?: string;
          rating?: "manual" | "again" | "hard" | "good" | "easy";
          state?: number;
          scheduled_days?: number;
          elapsed_days?: number;
          last_elapsed_days?: number;
          review_time?: string;
          stability?: number;
          difficulty?: number;
          review_duration_ms?: number | null;
          created_at?: string;
          due?: string | null;
        };
        Update: {
          id?: string;
          card_id?: string;
          deck_id?: string;
          user_id?: string;
          rating?: "manual" | "again" | "hard" | "good" | "easy";
          state?: number;
          scheduled_days?: number;
          elapsed_days?: number;
          last_elapsed_days?: number;
          review_time?: string;
          stability?: number;
          difficulty?: number;
          review_duration_ms?: number | null;
          created_at?: string;
          due?: string | null;
        };
      };
      comments: {
        Row: {
          id: string;
          deck_id: string;
          user_id: string;
          content: string;
          parent_id: string | null;
          reply_count: number;
          depth: number;
          path: string[];
          created_at: string;
          updated_at: string;
          edited_at: string | null;
          status: "active" | "hidden" | "flagged" | "deleted";
          likes_count: number;
          flags_count: number;
          moderated_by: string | null;
          moderated_at: string | null;
          moderation_reason: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          deck_id: string;
          user_id: string;
          content: string;
          parent_id?: string | null;
          reply_count?: number;
          depth?: number;
          path?: string[];
          created_at?: string;
          updated_at?: string;
          edited_at?: string | null;
          status?: "active" | "hidden" | "flagged" | "deleted";
          likes_count?: number;
          flags_count?: number;
          moderated_by?: string | null;
          moderated_at?: string | null;
          moderation_reason?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          deck_id?: string;
          user_id?: string;
          content?: string;
          parent_id?: string | null;
          reply_count?: number;
          depth?: number;
          path?: string[];
          created_at?: string;
          updated_at?: string;
          edited_at?: string | null;
          status?: "active" | "hidden" | "flagged" | "deleted";
          likes_count?: number;
          flags_count?: number;
          moderated_by?: string | null;
          moderated_at?: string | null;
          moderation_reason?: string | null;
          metadata?: Json;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          username?: string;
          email?: string;
          avatar_url?: string;
          bio: string | null;
          gender: "male" | "female" | "non_binary" | "prefer_not_to_say" | null;
          birthday: string | null;
          location: string | null;
          language: string;
          timezone: string | null;
          account_type: "free" | "premium" | "admin";
          is_verified: boolean;
          reputation_score: number;
          joined_at: string;
          last_active_at: string | null;
          followers_count: number;
          following_count: number;
          decks_created_count: number;
          total_cards_studied: number;
          total_study_time_minutes: number;
          notification_settings: Json;
          privacy_settings: Json;
          study_settings: Json;
          ui_preferences: Json;
          achievements: Json[];
          badges: Json[];
          streak_days: number;
          longest_streak: number;
          last_study_date: string | null;
          subscription_expires_at: string | null;
          storage_used_bytes: number;
          custom_theme: Json | null;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          username?: string;
          email?: string;
          avatar_url?: string;
          bio?: string | null;
          gender?:
            | "male"
            | "female"
            | "non_binary"
            | "prefer_not_to_say"
            | null;
          birthday?: string | null;
          location?: string | null;
          language?: string;
          timezone?: string | null;
          account_type?: "free" | "premium" | "admin";
          is_verified?: boolean;
          reputation_score?: number;
          joined_at?: string;
          last_active_at?: string | null;
          followers_count?: number;
          following_count?: number;
          decks_created_count?: number;
          total_cards_studied?: number;
          total_study_time_minutes?: number;
          notification_settings?: Json;
          privacy_settings?: Json;
          study_settings?: Json;
          ui_preferences?: Json;
          achievements?: Json[];
          badges?: Json[];
          streak_days?: number;
          longest_streak?: number;
          last_study_date?: string | null;
          subscription_expires_at?: string | null;
          storage_used_bytes?: number;
          custom_theme?: Json | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          avatar_url?: string;
          bio?: string | null;
          gender?:
            | "male"
            | "female"
            | "non_binary"
            | "prefer_not_to_say"
            | null;
          birthday?: string | null;
          location?: string | null;
          language?: string;
          timezone?: string | null;
          account_type?: "free" | "premium" | "admin";
          is_verified?: boolean;
          reputation_score?: number;
          joined_at?: string;
          last_active_at?: string | null;
          followers_count?: number;
          following_count?: number;
          decks_created_count?: number;
          total_cards_studied?: number;
          total_study_time_minutes?: number;
          notification_settings?: Json;
          privacy_settings?: Json;
          study_settings?: Json;
          ui_preferences?: Json;
          achievements?: Json[];
          badges?: Json[];
          streak_days?: number;
          longest_streak?: number;
          last_study_date?: string | null;
          subscription_expires_at?: string | null;
          storage_used_bytes?: number;
          custom_theme?: Json | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      user_followers: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      comment_likes: {
        Row: {
          comment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          comment_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          comment_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      account_type: "free" | "premium" | "admin";
      gender_type: "male" | "female" | "non_binary" | "prefer_not_to_say";
      deck_visibility: "private" | "public" | "unlisted";
      card_status: "new" | "learning" | "review" | "relearning";
      difficulty_rating: "again" | "hard" | "good" | "easy";
      comment_status: "active" | "hidden" | "flagged" | "deleted";
    };
  };
}

// Helper type for Supabase tables
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
