// Enum Types
export type DeckVisibility = 'private' | 'public' | 'unlisted';
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
export type CardState = 'new' | 'learning' | 'review' | 'relearning';
export type GenderType = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type AccountType = 'free' | 'premium' | 'enterprise';
export type CommentStatus = 'active' | 'hidden' | 'deleted' | 'flagged';

// Base Interfaces
interface Timestamps {
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

// Settings Interfaces
export interface NotificationSettings {
  study_reminders: boolean;
  marketing_emails: boolean;
  email_notifications: boolean;
  social_notifications: boolean;
}

export interface PrivacySettings {
  show_birthday: boolean;
  allow_messages: boolean;
  show_study_stats: boolean;
  show_online_status: boolean;
}

export interface StudySettings {
  default_weights: number[];
  default_retention: number;
  next_day_starts_at: number;
  default_max_interval: number;
  default_learning_steps: number[];
  default_new_cards_per_day: number;
  default_graduating_interval: number;
  default_review_cards_per_day: number;
}

export interface UIPreferences {
  theme: 'light' | 'dark';
  card_size: 'small' | 'medium' | 'large';
  show_timestamps: boolean;
}

// Main Interfaces
export interface UserProfile extends Timestamps {
  id: string;  // UUID
  bio?: string | null;
  gender?: GenderType | null;
  birthday?: Date | null;
  location?: string | null;
  language?: string;
  timezone?: string | null;
  account_type?: AccountType;
  is_verified?: boolean;
  reputation_score?: number;
  joined_at?: Date;
  last_active_at?: Date | null;
  followers_count?: number;
  following_count?: number;
  decks_created_count?: number;
  total_cards_studied?: number;
  total_study_time_minutes?: number;
  notification_settings?: NotificationSettings;
  privacy_settings?: PrivacySettings;
  study_settings?: StudySettings;
  ui_preferences?: UIPreferences;
  achievements?: any[];  // Type can be more specific based on achievement structure
  badges?: any[];       // Type can be more specific based on badge structure
  streak_days?: number;
  longest_streak?: number;
  last_study_date?: Date | null;
  subscription_expires_at?: Date | null;
  storage_used_bytes?: number;
  custom_theme?: any;   // Type can be more specific based on theme structure
  username?: string | null;
  avatar_url?: string | null;
  email?: string | null;
}

export interface UserFollower {
  follower_id: string;  // UUID
  following_id: string;  // UUID
  created_at?: Date;
}

export interface DeckLike {
  deck_id: string;  // UUID
  user_id: string;  // UUID
  created_at?: Date;
}

export interface Comment extends Timestamps {
  id: string;  // UUID
  deck_id: string;  // UUID
  user_id: string;  // UUID
  content: string;
  parent_id?: string | null;  // UUID
  reply_count?: number;
  depth?: number;
  path?: string[];  // UUID array
  edited_at?: Date | null;
  status?: CommentStatus;
  likes_count?: number;
  flags_count?: number;
  moderated_by?: string | null;  // UUID
  moderated_at?: Date | null;
  moderation_reason?: string | null;
  metadata?: Record<string, any>;
}

export interface CommentLike {
  comment_id: string;  // UUID
  user_id: string;    // UUID
  created_at?: Date;
}

// Previously defined interfaces
export interface CardFormattingSettings {
  [key: string]: any;
}

export interface DeckSettings {
  [key: string]: any;
}

export interface Card extends Timestamps {
  id: string;
  deck_id: string;
  front_content: string;
  back_content: string;
  note?: string | null;
  due?: Date | null;
  lapses?: number;
  last_review?: Date | null;
  position?: number | null;
  formatting_settings?: CardFormattingSettings;
  stability?: number;
  difficulty?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  reps?: number;
  state?: number;
  tags?: string[] | null;
}

export interface Deck extends Timestamps {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  visibility?: DeckVisibility;
  tags?: string[] | null;
  last_studied_at?: Date | null;
  card_count?: number;
  likes_count?: number;
  study_count?: number;
  fork_count?: number;
  is_forked?: boolean;
  original_deck_id?: string | null;
  version?: number;
  settings?: DeckSettings;
  new_cards_count?: number;
  learning_cards_count?: number;
  review_cards_count?: number;
  due_cards_count?: number;
  next_due_date?: Date | null;
  daily_new_cards_limit?: number;
  daily_review_limit?: number;
  relearning_cards_count?: number;
}

export interface ReviewLog extends Pick<Timestamps, 'created_at'> {
  id: string;
  card_id: string;
  deck_id: string;
  user_id: string;
  rating: ReviewRating;
  state: CardState;
  scheduled_days: number;
  elapsed_days: number;
  last_elapsed_days: number;
  review_time: Date;
  stability: number;
  difficulty: number;
  review_duration_ms?: number | null;
}