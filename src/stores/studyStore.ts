import { defineStore } from "pinia";
import { useCardStore } from "./cardStore";
import { useFSRSStore } from "./fsrsStore";
import { useDeckStore } from "./deckStore";
import { 
  Card, 
  StudySession, 
  ReviewRating,
  DeckSettings,
  CardStatus 
} from "../types/deck.types";

// Type for status order
type StatusOrder = {
  [K in CardStatus]: number;
};

interface StudyState {
  currentCard: Card | null;
  studySession: StudySession;
  loading: {
    session: boolean;
    review: boolean;
  };
  error: string | null;
}

export const useStudyStore = defineStore("study", {
  state: (): StudyState => ({
    currentCard: null as Card | null,
    studySession: {
      currentCardIndex: 0,
      remainingCards: [] as Card[],
      completedCards: [] as Card[],
    },
    loading: {
      session: false,
      review: false,
    },
    error: null,
  }),

  getters: {
    studyProgress: (state) => ({
      total: 
        state.studySession.remainingCards.length + 
        state.studySession.completedCards.length,
      completed: state.studySession.completedCards.length,
    }),

    hasRemainingCards: (state) => state.studySession.remainingCards.length > 0,
  },

  actions: {
    async startStudySession(deckId: string) {
      this.loading.session = true;
      const cardStore = useCardStore();
      const deckStore = useDeckStore();

      try {
        // Ensure cards are loaded
        if (!cardStore.getCardsByDeckId(deckId).length) {
          await cardStore.fetchCards(deckId);
        }

        const deck = await deckStore.getDeckById(deckId);
        if (!deck) throw new Error("Deck not found");

        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));

        const cards = cardStore.getCardsByDeckId(deckId);
        const settings = deck.settings as DeckSettings;

        // Get study counts for today
        const todayCounts = this._getStudyCountsForToday(cards, today);

        // Get due cards based on settings and limits
        const dueCards: Card[] = this._getDueCards(cards, {
          now,
          today,
          settings,
          deck,
          todayCounts,
        });

        // Initialize study session
        const newSession: StudySession = {
          currentCardIndex: 0,
          remainingCards: dueCards,
          completedCards: [],
        };

        // @ts-ignore
        this.studySession = newSession;
        this.currentCard = dueCards[0] || null;

        // Log session start for debugging
        console.log('Study session started:', {
          new: dueCards.filter(c => c.status === 'new').length,
          learning: dueCards.filter(c => c.status === 'learning').length,
          relearning: dueCards.filter(c => c.status === 'relearning').length,
          review: dueCards.filter(c => c.status === 'review').length,
        });

      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error starting study session";
        throw error;
      } finally {
        this.loading.session = false;
      }
    },

    async recordCardReview(cardId: string, rating: ReviewRating) {
      if (!this.currentCard || this.currentCard.id !== cardId) return;

      this.loading.review = true;
      const cardStore = useCardStore();
      const fsrsStore = useFSRSStore();
      const deckStore = useDeckStore();

      try {
        const deck = await deckStore.getDeckById(this.currentCard.deck_id);
        if (!deck) throw new Error("Deck not found");

        const settings = (deck.settings as DeckSettings).fsrs;
        
        // Calculate FSRS updates
        const fsrsUpdate = fsrsStore.calculateFSRSUpdate(
          this.currentCard, 
          rating, 
          settings
        );

        // Calculate next due date
        const dueDate = fsrsStore.calculateNextDueDate(fsrsUpdate.scheduledDays);

        // Update card with new FSRS values
        await cardStore.updateCard(cardId, {
          stability: fsrsUpdate.stability,
          difficulty: fsrsUpdate.difficulty,
          state: fsrsUpdate.newState,
          status: fsrsUpdate.newState,
          scheduled_days: fsrsUpdate.scheduledDays,
          elapsed_days: fsrsUpdate.elapsed_days,
          due_date: dueDate.toISOString(),
          last_review_date: new Date().toISOString(),
          last_review_rating: rating,
          reps: (this.currentCard.reps || 0) + 1,
          lapses_count: rating === 'again' 
            ? (this.currentCard.lapses_count || 0) + 1 
            : this.currentCard.lapses_count,
        });

        // Update deck statistics
        await deckStore.updateDeckStats(this.currentCard.deck_id);

        // Move to next card
        this.studySession.completedCards.push(this.currentCard);
        this.studySession.remainingCards.shift();
        this.currentCard = this.studySession.remainingCards[0] || null;

      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error recording review";
        throw error;
      } finally {
        this.loading.review = false;
      }
    },

    _getStudyCountsForToday(cards: Card[], today: Date) {
      return cards.reduce((counts, card) => {
        if (card.last_review_date && new Date(card.last_review_date) >= today) {
          // Count reviews
          if (card.status === 'review') {
            counts.reviewsToday++;
          }
          
          // Count cards that were new but have been studied today
          if (card.status === 'learning' || card.status === 'review') {
            counts.newStudiedToday++;
          }
        }
        return counts;
      }, { reviewsToday: 0, newStudiedToday: 0 });
    },

    _getDueCards(
      cards: Card[], 
      params: {
        now: Date;
        today: Date;
        settings: DeckSettings;
        deck: any;
        todayCounts: { reviewsToday: number; newStudiedToday: number };
      }
    ): Card[] {
      const dailyNewLimit = params.deck.daily_new_cards_limit || 20;
      const dailyReviewLimit = params.deck.daily_review_limit || 100;

      // Filter due cards
      const dueCards = cards.filter(card => {
        if (card.deleted_at) return false;
        
        const dueDate = new Date(card.due_date);
        const status = card.status as CardStatus;

        // If FSRS is disabled, use simple due date check
        if (!params.settings.fsrs.enable_fsrs) {
          if (status === 'new') {
            return params.todayCounts.newStudiedToday < dailyNewLimit;
          }
          return dueDate <= params.now;
        }

        // Check based on card status
        switch (status) {
          case 'new':
            return params.todayCounts.newStudiedToday < dailyNewLimit;
          case 'learning':
          case 'relearning':
            return dueDate <= params.now;
          case 'review':
            return dueDate <= params.now && 
                   params.todayCounts.reviewsToday < dailyReviewLimit;
          default:
            return false;
        }
      });

      // Sort cards by priority
      return this._sortCardsByPriority(dueCards);
    },

    _sortCardsByPriority(cards: Card[]): Card[] {
      const statusOrder: StatusOrder = {
        learning: 0,
        relearning: 0,
        review: 1,
        new: 2
      };

      return [...cards].sort((a, b) => {
        const aStatus = a.status as CardStatus;
        const bStatus = b.status as CardStatus;
        
        return statusOrder[aStatus] - statusOrder[bStatus] || 
               new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    },
  },
});