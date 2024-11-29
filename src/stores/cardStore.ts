import { defineStore } from "pinia";
import { supabase } from "../supabase";
import { useAuthStore } from "./authStore";
import { useDeckStore } from "./deckStore";
import { 
  Card,
} from "../types/deck.types";
import { State } from "ts-fsrs";

interface CardState {
  cards: Record<string, Card[]>; // Keyed by deck_id
  currentCard: Card | null;
  loading: boolean;
  error: string | null;
}

export const useCardStore = defineStore("cards", {
  state: (): CardState => ({
    cards: {},
    currentCard: null,
    loading: false,
    error: null,
  }),

  getters: {
    getCardsByDeckId: (state) => (deckId: string): Card[] => 
      state.cards[deckId] || [],

    getUniqueTags: (state) => (deckId: string): string[] => {
      const cards = state.cards[deckId] || [];
      const allTags = cards.flatMap((card) => card.tags || []);
      return [...new Set(allTags)];
    },

    getCardById: (state) => (cardId: string): Card | undefined => {
      return Object.values(state.cards)
        .flat()
        .find((card) => card.id === cardId);
    },
  },

  actions: {
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
        this.error = error instanceof Error ? error.message : "Error fetching cards";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createCard(cardData: Partial<Card>) {
      const authStore = useAuthStore();
      const deckStore = useDeckStore();
      
      if (!authStore.user) throw new Error("Please sign in to create a card");

      // Check if user owns the deck
      const deck = await deckStore.getDeckById(cardData.deck_id!);
      if (!deck || deck.user_id !== authStore.user.id) {
        throw new Error("You do not have permission to add cards to this deck");
      }

      this.loading = true;
      try {
        const fullCardData = this.prepareNewCardData(cardData);
        
        const { data, error } = await supabase
          .from("cards")
          .insert([fullCardData])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const deckCards = this.cards[data.deck_id] || [];
          this.cards[data.deck_id] = [...deckCards, data];
          await deckStore.updateDeckStats(data.deck_id);
        }
        return data;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error creating card";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateCard(id: string, updates: Partial<Card>) {
      this.loading = true;
      const deckStore = useDeckStore();
      
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
          await deckStore.updateDeckStats(data.deck_id);
        }
        return data;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error updating card";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteCard(deckId: string, cardId: string) {
      this.loading = true;
      const deckStore = useDeckStore();
      
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
          await deckStore.updateDeckStats(deckId);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error deleting card";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async duplicateCard(cardId: string) {
      const card = this.getCardById(cardId);
      if (!card) throw new Error("Card not found");

      this.loading = true;
      try {
        // Only keep non-FSRS fields
        const { 
          id, 
          stability, 
          difficulty, 
          elapsed_days, 
          scheduled_days, 
          reps, 
          state, 
          due, 
          last_review,
          lapses,
          created_at,
          updated_at,
          ...cardWithoutFSRSFields 
        } = card;

        const newCardData = {
          ...cardWithoutFSRSFields,
          // Reset FSRS fields to initial values
          stability: 0,
          difficulty: 0,
          elapsed_days: 0,
          scheduled_days: 0,
          reps: 0,
          state: 0, // State.New
          due: new Date().toISOString(),
          last_review: null,
          lapses: 0,
        };

        const { data, error } = await supabase
          .from("cards")
          .insert([newCardData])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const deckCards = this.cards[data.deck_id] || [];
          this.cards[data.deck_id] = [...deckCards, data];
        }
        return data;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error duplicating card";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    prepareNewCardData(cardData: Partial<Card>): Partial<Card> {
      return {
        // FSRS core fields
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        state: State.New,
        // Initialize dates
        due: new Date().toISOString(),
        last_review: null,
        lapses: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...cardData,
      };
    },
  },
});