import { Database } from "./supabase";

// Base types from Supabase
export type Deck = Database["public"]["Tables"]["decks"]["Row"];
export type Card = Database["public"]["Tables"]["cards"]["Row"];
export type ReviewLog = Database["public"]["Tables"]["review_logs"]["Row"];

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

export interface FSRSUpdateResult {
  stability: number;
  difficulty: number;
  newState: 'new' | 'learning' | 'review' | 'relearning';
  scheduledDays: number;
  elapsed_days: number;
}

// Loading state type
export interface LoadingState {
  decks: boolean;
  cards: boolean;
  operations: boolean;
}