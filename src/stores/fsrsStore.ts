import { defineStore } from "pinia";
import {
  fsrs,
  createEmptyCard,
  FSRSParameters,
  Card as FSRSCard,
  State,
  Rating,
  RecordLogItem,
} from "ts-fsrs";
import { supabase } from "../supabase";
import type { Card, StudySession, ReviewLog } from "../types/deck.types";

const ratingToString = (rating: Rating): ReviewLog["rating"] => {
  const map: Record<Rating, ReviewLog["rating"]> = {
    [Rating.Manual]: "manual",
    [Rating.Again]: "again",
    [Rating.Hard]: "hard",
    [Rating.Good]: "good",
    [Rating.Easy]: "easy",
  };
  return map[rating];
};

interface CardRecord {
  id: string;
  deck_id: string;
  // FSRS specific fields aligned with database
  due: Date | string; // timestamp without time zone in DB
  stability: number; // double precision in DB
  difficulty: number; // double precision in DB
  elapsed_days: number; // double precision in DB
  scheduled_days: number; // double precision in DB
  reps: number; // integer in DB
  lapses: number; // integer in DB
  state: State; // integer in DB (0-3)
  last_review: Date | string | null; // timestamp without time zone in DB
  // Database specific fields
  front_content: string; // renamed from front to match DB
  back_content: string; // renamed from back to match DB
  note: string | null;
  created_at: string;
  updated_at: string;
  position: number | null;
  deleted_at: string | null;
  tags: string[] | null;
}

interface StudyState {
  scheduler: ReturnType<typeof fsrs>;
  currentCard: CardRecord | null;
  reviewLogs: ReviewLog[];
  fsrsParameters: FSRSParameters;
  studySession: StudySession | null;
  cardStartTime: number;
}

export const useFSRSStore = defineStore("fsrs", {
  state: (): StudyState => ({
    scheduler: fsrs(),
    currentCard: null,
    reviewLogs: [],
    fsrsParameters: {
      request_retention: 0.9,
      maximum_interval: 36500,
      w: [
        0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18,
        0.05, 0.34, 1.26, 0.29, 2.61,
      ],
      enable_fuzz: true,
      enable_short_term: true,
    },
    studySession: null,
    cardStartTime: 0,
  }),

  actions: {
    initializeFSRS(params?: Partial<FSRSParameters>) {
      if (params) {
        this.fsrsParameters = { ...this.fsrsParameters, ...params };
      }
      this.scheduler = fsrs(this.fsrsParameters);
    },

    toFSRSCard(cardRecord: CardRecord): FSRSCard {
      return {
        due: new Date(cardRecord.due),
        stability: cardRecord.stability,
        difficulty: cardRecord.difficulty,
        elapsed_days: cardRecord.elapsed_days,
        scheduled_days: cardRecord.scheduled_days,
        reps: cardRecord.reps,
        lapses: cardRecord.lapses,
        state: cardRecord.state,
        last_review: cardRecord.last_review
          ? new Date(cardRecord.last_review)
          : new Date(),
      };
    },

    createNewCard(deckId: string): Partial<CardRecord> {
      const emptyCard = createEmptyCard();
      return {
        deck_id: deckId,
        ...emptyCard,
        front_content: "",
        back_content: "",
      };
    },

    getSchedule(card: CardRecord): Record<Rating, RecordLogItem> {
      const fsrsCard = this.toFSRSCard(card);
      return this.scheduler.repeat(fsrsCard, new Date());
    },

    // Get due cards for a deck
    async getDueCards(
      deckId: string,
      newCardLimit: number = 20,
      reviewLimit: number = 200
    ) {
      const now = new Date();

      try {
        // Get cards that are due for review (due date <= now)
        const { data: dueCards, error: dueError } = await supabase
          .from("cards")
          .select("*")
          .eq("deck_id", deckId)
          .lte("due", now.toISOString())
          .is("deleted_at", null)
          .order("due");

        if (dueError) throw dueError;

        // Get new cards
        const { data: newCards, error: newError } = await supabase
          .from("cards")
          .select("*")
          .eq("deck_id", deckId)
          .eq("state", State.New)
          .is("deleted_at", null)
          .limit(newCardLimit);

        if (newError) throw newError;

        // Filter and sort cards
        const reviewCards = dueCards
          .filter((card) => card.state !== State.New)
          .slice(0, reviewLimit);

        return {
          newCards: newCards || [],
          reviewCards: reviewCards || [],
        };
      } catch (error) {
        console.error("Error fetching due cards:", error);
        throw error;
      }
    },

    // Start a study session
    async startStudySession(
      deckId: string,
      newCardLimit: number = 20,
      reviewLimit: number = 200
    ) {
      const { newCards, reviewCards } = await this.getDueCards(
        deckId,
        newCardLimit,
        reviewLimit
      );

      // Mix new cards with review cards using spaced insertion
      const mixed = this.mixNewAndReviewCards(newCards, reviewCards);

      this.studySession = {
        currentCardIndex: 0,
        remainingCards: mixed,
        completedCards: [],
      };

      return this.studySession;
    },

    // Mix new cards with review cards using spaced insertion
    mixNewAndReviewCards(newCards: Card[], reviewCards: Card[]): Card[] {
      const mixed: Card[] = [];
      const newCardInterval = Math.max(
        Math.ceil(reviewCards.length / newCards.length),
        1
      );

      let newCardIndex = 0;
      let reviewCardIndex = 0;

      while (
        reviewCardIndex < reviewCards.length ||
        newCardIndex < newCards.length
      ) {
        // Add review cards
        if (reviewCardIndex < reviewCards.length) {
          mixed.push(reviewCards[reviewCardIndex]);
          reviewCardIndex++;
        }

        // Insert new card every newCardInterval positions
        if (
          newCardIndex < newCards.length &&
          mixed.length % newCardInterval === 0
        ) {
          mixed.push(newCards[newCardIndex]);
          newCardIndex++;
        }
      }

      return mixed;
    },

    // Get the next card in the study session
    getNextCard(): Card | null {
      if (!this.studySession) return null;

      if (
        this.studySession.currentCardIndex >=
        this.studySession.remainingCards.length
      ) {
        return null;
      }

      this.cardStartTime = Date.now();
      return this.studySession.remainingCards[
        this.studySession.currentCardIndex
      ];
    },

    // Process a review and update the study session
    async processReview(card: Card, rating: Rating, userId: string) {
      const reviewDuration = Date.now() - this.cardStartTime;
      const result = await this.recordReview(
        this.toCardRecord(card),
        rating,
        userId,
        reviewDuration
      );

      if (this.studySession) {
        // Move current card to completed cards
        this.studySession.completedCards.push(card);

        // Move to next card
        this.studySession.currentCardIndex++;

        // If the card needs to be relearned (Again rating), add it back to queue
        if (rating === Rating.Again) {
          const relearningPosition = Math.min(
            this.studySession.currentCardIndex + 3,
            this.studySession.remainingCards.length
          );

          this.studySession.remainingCards.splice(relearningPosition, 0, {
            ...card,
            ...result.card,
            due: result.card.due.toISOString(),
            last_review: result.card.last_review?.toISOString() || null,
          });
        }
      }

      return result;
    },

    // Get study session statistics
    getStudySessionStats() {
      if (!this.studySession) return null;

      return {
        totalCards:
          this.studySession.remainingCards.length +
          this.studySession.completedCards.length,
        completedCards: this.studySession.completedCards.length,
        remainingCards:
          this.studySession.remainingCards.length -
          this.studySession.currentCardIndex,
        newCardsStudied: this.studySession.completedCards.filter(
          (c) => c.reps === 1 || c.reps === null
        ).length,
        reviewsCompleted: this.studySession.completedCards.filter(
          (c) => c.reps !== null && c.reps > 1
        ).length,
      };
    },

    // End the study session
    async endStudySession(_deckId: string) {
      if (!this.studySession) return;

      // Clear the study session
      this.studySession = null;
    },

    async recordReview(card: CardRecord, rating: Rating, userId: string, reviewDuration: number) {
      const schedule = this.getSchedule(card);
      const result = schedule[rating];

      // Update card in database
      const updatedCard: Partial<CardRecord> = {
        ...result.card,
        id: card.id,
        deck_id: card.deck_id,
      };

      // Create review log with explicit review_duration_ms
      const reviewLog: Partial<ReviewLog> = {
        card_id: card.id,
        deck_id: card.deck_id,
        user_id: userId,
        rating: ratingToString(rating),
        state: result.log.state,
        scheduled_days: result.log.scheduled_days,
        elapsed_days: result.log.elapsed_days,
        last_elapsed_days: result.log.last_elapsed_days,
        review_time: result.log.review.toISOString(),
        stability: result.log.stability,
        difficulty: result.log.difficulty,
        created_at: new Date().toISOString(),
        due: result.card.due.toISOString(),
        review_duration_ms: Math.round(reviewDuration), // Ensure it's a rounded integer
      };

      try {
        await this.updateCard(updatedCard);
        await this.saveReviewLog(reviewLog as ReviewLog);

        return result;
      } catch (error) {
        console.error("Error recording review:", error);
        throw error;
      }
    },

    getRetrievability(card: CardRecord): string | number {
      return this.scheduler.get_retrievability(this.toFSRSCard(card));
    },

    async updateCard(card: Partial<CardRecord>) {
      const { data, error } = await supabase
        .from("cards")
        .update(card)
        .eq("id", card.id)
        .single();

      if (error) throw error;
      return data;
    },

    async saveReviewLog(log: ReviewLog) {
      const { data, error } = await supabase
        .from("review_logs")
        .insert(log)
        .single();

      if (error) throw error;
      return data;
    },

    resetCard(card: CardRecord) {
      const emptyCard = createEmptyCard();
      return {
        ...card,
        ...emptyCard,
        last_review: undefined,
      };
    },

    async forgetCard(card: CardRecord) {
      const result = this.scheduler.forget(this.toFSRSCard(card), new Date());
      const updatedCard = {
        ...card,
        ...result.card,
      };
      await this.updateCard(updatedCard);
      return updatedCard;
    },

    toCardRecord(card: Card): CardRecord {
      return {
        ...card,
        due: card.due || new Date().toISOString(),
        stability: card.stability || 0,
        difficulty: card.difficulty || 0,
        elapsed_days: card.elapsed_days || 0,
        scheduled_days: card.scheduled_days || 0,
        reps: card.reps || 0,
        lapses: card.lapses || 0,
        state: card.state || State.New,
        created_at: card.created_at || new Date().toISOString(),
        updated_at: card.updated_at || new Date().toISOString(),
      };
    },
  },
});
