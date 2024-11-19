import { defineStore } from "pinia";
import { supabase } from "../supabase";
import { Database } from "../types/supabase";
import { useAuthStore } from "./authStore";

type Deck = Database["public"]["Tables"]["decks"]["Row"];
type Card = Database["public"]["Tables"]["cards"]["Row"];

interface DeckState {
  decks: Deck[];
  currentDeck: Deck | null;
  cards: Record<string, Card[]>; // Keyed by deck_id
  loading: boolean;
  error: string | null;
  currentCard: Card | null;
  studySession: {
    currentCardIndex: number;
    remainingCards: Card[];
    completedCards: Card[];
  };
}

export const useDeckStore = defineStore("decks", {
  state: (): DeckState => ({
    decks: [],
    currentDeck: null,
    cards: {},
    loading: false,
    error: null,
    currentCard: null,
    studySession: {
      currentCardIndex: 0,
      remainingCards: [],
      completedCards: [],
    },
  }),

  getters: {
    userDecks(): Deck[] {
      const authStore = useAuthStore();
      // @ts-ignore - Ignoring deep type instantiation error
      // TODO: Fix this
      return this.decks.filter((deck) => deck.user_id === authStore.user?.id);
    },

    publicDecks(): Deck[] {
      return this.decks.filter((deck) => deck.visibility === "public");
    },

    getDeckById:
      (state) =>
      (id: string): Deck | undefined =>
        state.decks.find((deck) => deck.id === id),

    getCardsByDeckId:
      (state) =>
      (deckId: string): Card[] =>
        state.cards[deckId] || [],

    currentDeckCards(state): Card[] {
      return state.currentDeck ? this.cards[state.currentDeck.id] || [] : [];
    },

    studyProgress: (state) => ({
      total:
        state.studySession.remainingCards.length +
        state.studySession.completedCards.length,
      completed: state.studySession.completedCards.length,
    }),

    // Add getter to check if user owns current deck
    isCurrentDeckOwner(): boolean {
      const authStore = useAuthStore();
      return (
        !!this.currentDeck && this.currentDeck.user_id === authStore.user?.id
      );
    },
  },

  actions: {
    async fetchDecks() {
      this.loading = true;
      try {
        const { data, error } = await supabase
          .from("decks")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        this.decks = data;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error fetching decks";
      } finally {
        this.loading = false;
      }
    },

    async createDeck(deckData: Partial<Deck>) {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("Please sign in to create a deck");

      this.loading = true;
      try {
        const { data, error } = await supabase
          .from("decks")
          .insert([{ ...deckData, user_id: authStore.user.id }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          this.decks.unshift(data);
          this.currentDeck = data;
        }
        return data;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error creating deck";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateDeck(id: string, updates: Partial<Deck>) {
      const authStore = useAuthStore();
      if (!authStore.user)
        throw new Error("Please sign in to update this deck");

      // Check if user owns the deck
      const deck = this.getDeckById(id);
      if (!deck || deck.user_id !== authStore.user.id) {
        throw new Error("You do not have permission to update this deck");
      }

      this.loading = true;
      try {
        const { data, error } = await supabase
          .from("decks")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const index = this.decks.findIndex((deck) => deck.id === id);
          if (index !== -1) {
            this.decks[index] = data;
          }
          if (this.currentDeck?.id === id) {
            this.currentDeck = data;
          }
        }
        return data;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error updating deck";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteDeck(id: string) {
      const authStore = useAuthStore();
      if (!authStore.user)
        throw new Error("Please sign in to delete this deck");

      // Check if user owns the deck
      const deck = this.getDeckById(id);
      if (!deck || deck.user_id !== authStore.user.id) {
        throw new Error("You do not have permission to delete this deck");
      }

      this.loading = true;
      try {
        const { error } = await supabase.from("decks").delete().eq("id", id);

        if (error) throw error;
        this.decks = this.decks.filter((deck) => deck.id !== id);
        if (this.currentDeck?.id === id) {
          this.currentDeck = null;
        }
        delete this.cards[id];
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error deleting deck";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchCards(deckId: string) {
      this.loading = true;
      try {
        const { data, error } = await supabase
          .from("cards")
          .select("*")
          .eq("deck_id", deckId)
          .order("position");

        if (error) throw error;
        this.cards[deckId] = data;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error fetching cards";
      } finally {
        this.loading = false;
      }
    },

    // Card operations
    async createCard(cardData: Partial<Card>) {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("Please sign in to create a card");

      // Check if user owns the deck
      const deck = this.getDeckById(cardData.deck_id!);
      if (!deck || deck.user_id !== authStore.user.id) {
        throw new Error("You do not have permission to add cards to this deck");
      }

      this.loading = true;
      try {
        const { data, error } = await supabase
          .from("cards")
          .insert([cardData])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const deckCards = this.cards[data.deck_id] || [];
          this.cards[data.deck_id] = [...deckCards, data];
        }
        return data;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error creating card";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateCard(id: string, updates: Partial<Card>) {
      this.loading = true;
      try {
        const { data, error } = await supabase
          .from("cards")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const deckCards = this.cards[data.deck_id] || [];
          const index = deckCards.findIndex((card) => card.id === id);
          if (index !== -1) {
            deckCards[index] = data;
            this.cards[data.deck_id] = [...deckCards];
          }
        }
        return data;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error updating card";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteCard(deckId: string, cardId: string) {
      this.loading = true;
      try {
        const { error } = await supabase
          .from("cards")
          .delete()
          .eq("id", cardId);

        if (error) throw error;
        if (this.cards[deckId]) {
          this.cards[deckId] = this.cards[deckId].filter(
            (card) => card.id !== cardId
          );
        }
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error deleting card";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Study Session Actions
    startStudySession(deckId: string) {
      const deckCards = this.cards[deckId] || [];
      // Filter cards due for review based on spaced repetition algorithm
      const dueCards = deckCards.filter((card) => {
        const dueDate = new Date(card.due_date);
        return dueDate <= new Date();
      });

      this.studySession = {
        currentCardIndex: 0,
        remainingCards: dueCards,
        completedCards: [],
      };
      this.currentCard = dueCards[0] || null;
    },

    async recordCardReview(
      cardId: string,
      rating: "again" | "hard" | "good" | "easy"
    ) {
      if (!this.currentCard) return;

      // Calculate new interval based on rating and spaced repetition algorithm
      const newInterval = this.calculateNewInterval(this.currentCard, rating);
      const dueDate = new Date();
      dueDate.setMinutes(dueDate.getMinutes() + newInterval);

      // Update card with new interval and due date
      await this.updateCard(cardId, {
        interval: newInterval,
        due_date: dueDate.toISOString(),
        last_review_date: new Date().toISOString(),
        last_review_rating: rating,
        reviews_count: (this.currentCard.reviews_count || 0) + 1,
      });

      // Move to next card in study session
      this.studySession.completedCards.push(this.currentCard);
      this.studySession.remainingCards.shift();
      this.currentCard = this.studySession.remainingCards[0] || null;
    },

    // Helper function for spaced repetition calculations
    calculateNewInterval(
      card: Card,
      rating: "again" | "hard" | "good" | "easy"
    ): number {
      const currentInterval = card.interval || 0;
      const easeFactor = card.ease_factor || 2.5;

      switch (rating) {
        case "again":
          return 1; // Reset to 1 minute
        case "hard":
          return Math.round(currentInterval * 1.2);
        case "good":
          return Math.round(currentInterval * easeFactor);
        case "easy":
          return Math.round(currentInterval * easeFactor * 1.3);
        default:
          return currentInterval;
      }
    },
  },
});