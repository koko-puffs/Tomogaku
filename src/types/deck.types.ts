import { Database } from "./supabase";

// Base types from Supabase
export type Deck = Database["public"]["Tables"]["decks"]["Row"];
export type Card = Database["public"]["Tables"]["cards"]["Row"];

// Study session types
export interface StudySession {
  currentCardIndex: number;
  remainingCards: Card[];
  completedCards: Card[];
}

// Statistics types
export interface DeckStats {
  new_count: number;
  new_studied_today: number;
  due_review_count: number;
  review_studied_today: number;
  due_learning_count: number;
}

// FSRS related types
export interface FSRSSettings {
  request_retention: number;
  maximum_stability: number;
  weights: number[];
  learning_steps: number[];
  enable_fsrs: boolean;
}

export interface FSRSUpdateResult {
  stability: number;
  difficulty: number;
  newState: 'new' | 'learning' | 'review' | 'relearning';
  scheduledDays: number;
  elapsed_days: number;
}

// Settings types
export interface DeckSettings {
  fsrs: FSRSSettings;
  [key: string]: any;
}

// Loading state type
export interface LoadingState {
  decks: boolean;
  cards: boolean;
  operations: boolean;
}

// Card status type
export type CardStatus = 'new' | 'learning' | 'review' | 'relearning';

// Review rating type
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';