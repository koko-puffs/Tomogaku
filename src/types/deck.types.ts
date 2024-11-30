import { Database } from "./supabase";
import { Card as FSRSCard } from "ts-fsrs";

type DBCard = Database["public"]["Tables"]["cards"]["Row"];
type FSRSFields = Omit<FSRSCard, 'last_review' | 'due'>;
type DBFields = Omit<DBCard, 'difficulty' | 'stability' | 'elapsed_days' | 'scheduled_days' | 'reps' | 'lapses' | 'state'>;

// Extend both the database type and FSRS type, while overriding date fields
export interface Card extends FSRSFields, DBFields {
  last_review: string | null;
  due: string;
}

// Base types from Supabase
export type Deck = Database["public"]["Tables"]["decks"]["Row"];
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