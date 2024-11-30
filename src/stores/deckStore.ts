import { defineStore } from "pinia";
import { supabase } from "../supabase";
import { useAuthStore } from "./authStore";
import { Deck, DeckStats } from "../types/deck.types";

interface DeckState {
  decks: Deck[];
  currentDeck: Deck | null;
  loading: {
    decks: boolean;
    operations: boolean;
  };
  error: string | null;
  deckStats: Map<string, DeckStats>;
}

interface DeckWithStats {
  stats: DeckStats;
  [key: string]: any; // For other deck properties
}

export const useDeckStore = defineStore("decks", {
  state: (): DeckState => ({
    decks: [],
    currentDeck: null,
    loading: {
      decks: false,
      operations: false,
    },
    error: null,
    deckStats: new Map(),
  }),

  getters: {
    userDecks: (state): Deck[] => {
      const authStore = useAuthStore();
      // @ts-ignore
      return state.decks.filter((deck) => deck.user_id === (authStore.user?.id ?? null));
    },

    getDeckById: (state) => (id: string) => 
      // @ts-ignore
      state.decks.find((deck) => deck.id === id),

    getDeckStats: (state) => (deckId: string) => 
      state.deckStats.get(deckId),
  },

  actions: {
    async fetchDecks() {
      const authStore = useAuthStore();
      if (!authStore.user) return;

      this.loading.decks = true;
      try {
        const { data, error } = await supabase
          .from("decks")
          .select("*")
          .eq("user_id", authStore.user.id)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false });

        if (error) throw error;
        this.decks = data;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error fetching decks";
        throw error;
      } finally {
        this.loading.decks = false;
      }
    },

    async fetchDeckById(id: string) {
      this.loading.operations = true;
      try {
        const { data, error } = await supabase
          .from("decks")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        
        // Update decks array if deck not present or outdated
        const index = this.decks.findIndex(d => d.id === id);
        if (index === -1) {
          this.decks.push(data);
        } else {
          this.decks[index] = data;
        }
        
        return data;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error fetching deck";
        throw error;
      } finally {
        this.loading.operations = false;
      }
    },

    async createDeck(deckData: Partial<Deck>) {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("Must be logged in to create decks");

      this.loading.operations = true;
      try {
        const { data, error } = await supabase
          .from("decks")
          .insert([{
            ...deckData,
            user_id: authStore.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) throw error;
        this.decks.unshift(data);
        return data;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error creating deck";
        throw error;
      } finally {
        this.loading.operations = false;
      }
    },

    async updateDeck(id: string, updates: Partial<Deck>) {
      this.loading.operations = true;
      try {
        const { data, error } = await supabase
          .from("decks")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        const index = this.decks.findIndex(d => d.id === id);
        if (index !== -1) {
          this.decks[index] = data;
        }
        
        return data;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error updating deck";
        throw error;
      } finally {
        this.loading.operations = false;
      }
    },

    async deleteDeck(id: string) {
      this.loading.operations = true;
      try {
        const { error } = await supabase
          .from("decks")
          .update({
            deleted_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) throw error;
        this.decks = this.decks.filter(d => d.id !== id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error deleting deck";
        throw error;
      } finally {
        this.loading.operations = false;
      }
    },

    async updateDeckStats(deckId: string) {
      this.loading.operations = true;
      try {
        const { data, error } = await supabase
          .rpc('get_deck_stats', {
            p_deck_id: deckId,
            p_today: new Date().toISOString()
          });

        if (error) throw error;

        // Update the deckStats Map with the new stats
        if (data) {
          this.deckStats.set(deckId, data);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error updating deck stats";
        throw error;
      } finally {
        this.loading.operations = false;
      }
    },

    async updateDeckVisibility(id: string, visibility: 'private' | 'public' | 'unlisted') {
      return this.updateDeck(id, { visibility });
    },

    async incrementDeckStudyCount(id: string) {
      const deck = this.getDeckById(id);
      if (!deck) return;

      return this.updateDeck(id, {
        study_count: (deck.study_count || 0) + 1,
        last_studied_at: new Date().toISOString(),
      });
    },

    async updateLastStudied(id: string) {
      return this.updateDeck(id, {
        last_studied_at: new Date().toISOString(),
      });
    },

    async fetchPublicDecksByUserId(userId: string) {
      this.loading.decks = true;
      try {
        const { data, error } = await supabase
          .from("decks")
          .select("*")
          .eq("user_id", userId)
          .eq("visibility", "public")
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (error) throw error;
        this.decks = data;
      } catch (error) {
        this.error = error instanceof Error 
          ? error.message 
          : "Error fetching user's public decks";
        throw error;
      } finally {
        this.loading.decks = false;
      }
    },

    async fetchDecksByUserId(userId: string) {
      this.loading.decks = true;
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .rpc('get_decks_with_stats', {
            p_user_id: userId,
            p_today: today.toISOString(),
          });

        if (error) throw error;
        
        if (data) {
          // Update decks
          this.decks = data.map((deckWithStats: DeckWithStats) => {
            const { stats, ...deck } = deckWithStats;
            // Update stats map
            this.deckStats.set(deck.id, stats);
            return deck;
          });
        }
      } catch (error) {
        this.error = error instanceof Error 
          ? error.message 
          : "Error fetching user's decks";
        throw error;
      } finally {
        this.loading.decks = false;
      }
    },
  },
});