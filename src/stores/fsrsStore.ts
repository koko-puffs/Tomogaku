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

interface StudyState {
  scheduler: ReturnType<typeof fsrs>;
  currentCard: Card | null;
  reviewLogs: ReviewLog[];
  fsrsParameters: FSRSParameters;
  studySession: StudySession | null;
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
  }),

  actions: {
    initializeFSRS(params?: Partial<FSRSParameters>) {
      if (params) {
        this.fsrsParameters = { ...this.fsrsParameters, ...params };
      }
      this.scheduler = fsrs(this.fsrsParameters);
    },

    toFSRSCard(card: Card): FSRSCard {
      return {
        due: new Date(card.due),
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days: card.elapsed_days,
        scheduled_days: card.scheduled_days,
        reps: card.reps,
        lapses: card.lapses,
        state: card.state,
        last_review: card.last_review
          ? new Date(card.last_review)
          : new Date(),
      };
    },

    createNewCard(deckId: string): Partial<Card> {
      const emptyCard = createEmptyCard();
      return {
        deck_id: deckId,
        ...emptyCard,
        due: emptyCard.due.toISOString(),
        last_review: emptyCard.last_review?.toISOString() || null,
        front_content: "",
        back_content: "",
      } as Partial<Card>;
    },

    getSchedule(card: Card): Record<Rating, RecordLogItem> {
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
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      try {
        // Get count of new cards already studied today
        const { count: newCardsStudiedToday, error: countError } = await supabase
          .from("review_logs")
          .select("*", { count: 'exact', head: true })
          .eq("deck_id", deckId)
          .eq("state", State.New)
          .gte("created_at", startOfDay.toISOString());

        if (countError) throw countError;

        // Calculate remaining new cards allowed for today
        const remainingNewCards = Math.max(0, newCardLimit - (newCardsStudiedToday || 0));

        // Get learning/relearning cards regardless of due date
        const { data: learningCards, error: learningError } = await supabase
          .from("cards")
          .select("*")
          .eq("deck_id", deckId)
          .in("state", [State.Learning, State.Relearning])
          .is("deleted_at", null)
          .order("due");

        if (learningError) throw learningError;

        // Get regular review cards that are due
        const { data: reviewCards, error: reviewError } = await supabase
          .from("cards")
          .select("*")
          .eq("deck_id", deckId)
          .lte("due", now.toISOString())
          .eq("state", State.Review)
          .is("deleted_at", null)
          .order("due");

        if (reviewError) throw reviewError;

        // Get new cards, limited by remaining daily allowance
        const { data: newCards, error: newError } = await supabase
          .from("cards")
          .select("*")
          .eq("deck_id", deckId)
          .eq("state", State.New)
          .is("deleted_at", null)
          .limit(remainingNewCards);

        if (newError) throw newError;

        // Combine learning cards with review cards, but limit total reviews
        const allReviewCards = [
          ...(learningCards || []),
          ...(reviewCards || [])
        ].slice(0, reviewLimit);

        return {
          newCards: newCards || [],
          reviewCards: allReviewCards || [],
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

      return this.studySession.remainingCards[
        this.studySession.currentCardIndex
      ];
    },

    // Process a review and update the study session
    async processReview(card: Card, rating: Rating, userId: string, reviewDuration: number) {
      const result = await this.recordReview(
        card,
        rating,
        userId,
        reviewDuration
      );

      if (this.studySession) {
        // Move current card to completed cards
        this.studySession.completedCards.push(card);

        // Move to next card
        this.studySession.currentCardIndex++;

        // If the card is in learning/relearning state, add it back to queue
        if (result.card.state === State.Learning || result.card.state === State.Relearning) {
          const nextPosition = Math.min(
            this.studySession.currentCardIndex + 3,
            this.studySession.remainingCards.length
          );

          this.studySession.remainingCards.splice(nextPosition, 0, {
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

    async recordReview(card: Card, rating: Rating, userId: string, reviewDuration: number) {
      const schedule = this.getSchedule(card);
      const result = schedule[rating];

      // Update card in database
      const updatedCard = {
        ...card,
        ...result.card,
        due: result.card.due.toISOString(),
        last_review: result.card.last_review?.toISOString() || null,
      } as Card;

      // Create review log
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
        review_duration_ms: Math.round(reviewDuration),
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

    getRetrievability(card: Card): string | number {
      return this.scheduler.get_retrievability(this.toFSRSCard(card));
    },

    async updateCard(card: Partial<Card>) {
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

    resetCard(card: Card) {
      const emptyCard = createEmptyCard();
      return {
        ...card,
        ...emptyCard,
        last_review: undefined,
      };
    },

    async forgetCard(card: Card) {
      const result = this.scheduler.forget(this.toFSRSCard(card), new Date());
      const updatedCard = {
        ...card,
        ...result.card,
        due: result.card.due.toISOString(),
        last_review: result.card.last_review?.toISOString() || null,
      } as Card;
      await this.updateCard(updatedCard);
      return updatedCard;
    },
  },
});
