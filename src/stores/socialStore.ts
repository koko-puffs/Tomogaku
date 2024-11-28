import { defineStore } from "pinia";
import { supabase } from "../supabase";
import { useAuthStore } from "./authStore";
import { useDeckStore } from "./deckStore";

interface SocialState {
  deckLikes: Map<string, boolean>; // Keyed by deck_id
  loading: {
    likes: boolean;
    fork: boolean;
    operations: boolean;
  };
  error: string | null;
}

export const useSocialStore = defineStore("social", {
  state: (): SocialState => ({
    deckLikes: new Map(),
    loading: {
      likes: false,
      fork: false,
      operations: false,
    },
    error: null,
  }),

  getters: {
    isDeckLiked: (state) => (deckId: string): boolean => 
      state.deckLikes.get(deckId) || false,
  },

  actions: {
    async fetchDeckLikes(deckIds: string[]) {
      const authStore = useAuthStore();
      if (!authStore.user) return;

      this.loading.likes = true;
      try {
        const { data, error } = await supabase
          .from("deck_likes")
          .select("deck_id")
          .in("deck_id", deckIds)
          .eq("user_id", authStore.user.id);

        if (error) throw error;

        // Initialize all decks as not liked
        deckIds.forEach((id) => this.deckLikes.set(id, false));

        // Mark liked decks
        if (data) {
          data.forEach((like) => {
            this.deckLikes.set(like.deck_id, true);
          });
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error fetching deck likes";
        throw error;
      } finally {
        this.loading.likes = false;
      }
    },

    async toggleDeckLike(deckId: string) {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("Must be logged in to like decks");

      const isLiked = this.isDeckLiked(deckId);
      this.loading.operations = true;

      try {
        // Update local state optimistically
        this.deckLikes.set(deckId, !isLiked);

        if (isLiked) {
          const { error } = await supabase
            .from("deck_likes")
            .delete()
            .eq("deck_id", deckId)
            .eq("user_id", authStore.user.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("deck_likes")
            .insert([{
              deck_id: deckId,
              user_id: authStore.user.id,
            }]);

          if (error) throw error;
        }

        // Return the delta to update the likes count
        return isLiked ? -1 : 1;
      } catch (error) {
        // Rollback optimistic update on error
        this.deckLikes.set(deckId, isLiked);
        this.error = error instanceof Error ? error.message : "Error toggling deck like";
        throw error;
      } finally {
        this.loading.operations = false;
      }
    },

    async forkDeck(deckId: string) {
      const authStore = useAuthStore();
      const deckStore = useDeckStore();
      
      if (!authStore.user) throw new Error("Please sign in to fork this deck");

      this.loading.fork = true;
      try {
        // First ensure we have the source deck data
        const sourceDeck = await deckStore.fetchDeckById(deckId);
        if (!sourceDeck) throw new Error("Deck not found");

        // Create new deck as a fork
        const { data: newDeck, error: deckError } = await supabase
          .from("decks")
          .insert([{
            user_id: authStore.user.id,
            title: `${sourceDeck.title} (forked)`,
            description: sourceDeck.description,
            tags: sourceDeck.tags,
            visibility: "private" as const,
            is_forked: true,
            original_deck_id: deckId,
            daily_new_cards_limit: sourceDeck.daily_new_cards_limit,
            daily_review_limit: sourceDeck.daily_review_limit,
            settings: sourceDeck.settings,
          }])
          .select()
          .single();

        if (deckError) throw deckError;
        if (!newDeck) throw new Error("Failed to create forked deck");

        // Copy all cards from source deck
        const { data: sourceCards } = await supabase
          .from("cards")
          .select("*")
          .eq("deck_id", deckId);

        if (sourceCards && sourceCards.length > 0) {
          const newCards = sourceCards.map((card) => ({
            deck_id: newDeck.id,
            front_content: card.front_content,
            back_content: card.back_content,
            note: card.note,
            tags: card.tags,
            formatting_settings: card.formatting_settings,
            position: card.position,
            // Reset all FSRS and study-related fields
            stability: 0,
            difficulty: 0,
            elapsed_days: 0,
            scheduled_days: 0,
            reps: 0,
            state: "new",
            status: "new",
            due_date: new Date().toISOString(),
            last_review_date: null,
            last_review_rating: null,
            lapses_count: 0,
            request_retention: (newDeck.settings as any).fsrs.request_retention,
            maximum_stability: (newDeck.settings as any).fsrs.maximum_stability,
            w: (newDeck.settings as any).fsrs.weights,
          }));

          const { error: cardsError } = await supabase
            .from("cards")
            .insert(newCards);

          if (cardsError) throw cardsError;
        }

        // Update fork count on original deck
        await supabase
          .from("decks")
          .update({ fork_count: (sourceDeck.fork_count || 0) + 1 })
          .eq("id", deckId);

        return newDeck;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error forking deck";
        throw error;
      } finally {
        this.loading.fork = false;
      }
    },
  },
});