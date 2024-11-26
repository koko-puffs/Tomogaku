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
  loading: {
    decks: boolean;
    cards: boolean;
    operations: boolean;
  };
  error: string | null;
  currentCard: Card | null;
  studySession: {
    currentCardIndex: number;
    remainingCards: Card[];
    completedCards: Card[];
  };
  deckLikes: Map<string, boolean>; // Keyed by deck_id
}

interface FSRSSettings {
  request_retention: number;
  maximum_stability: number;
  weights: number[];
  learning_steps: number[];
  enable_fsrs: boolean;
}

interface DeckSettings {
  fsrs: FSRSSettings;
  [key: string]: any; // For other potential settings
}

export const useDeckStore = defineStore("decks", {
  state: (): DeckState => ({
    decks: [],
    currentDeck: null,
    cards: {},
    loading: {
      decks: false,
      cards: false,
      operations: false,
    },
    error: null,
    currentCard: null,
    studySession: {
      currentCardIndex: 0,
      remainingCards: [],
      completedCards: [],
    },
    deckLikes: new Map(),
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

    isDeckLiked:
      (state) =>
      (deckId: string): boolean =>
        state.deckLikes.get(deckId) || false,
  },

  actions: {
    async fetchDecks() {
      this.loading.decks = true;
      try {
        const { data, error } = await supabase
          .from("decks")
          .select("*")
          .is("deleted_at", null) // Only fetch non-deleted decks
          .order("created_at", { ascending: false });

        if (error) throw error;
        this.decks = data;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error fetching decks";
      } finally {
        this.loading.decks = false;
      }
    },

    async fetchDecksByUserId(userId: string) {
      this.loading.decks = true;
      try {
        const { data, error } = await supabase
          .from("decks")
          .select("*")
          .eq("user_id", userId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (error) throw error;
        this.decks = data;
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Error fetching user's decks";
        throw error;
      } finally {
        this.loading.decks = false;
      }
    },

    async createDeck(deckData: Partial<Deck>) {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("Please sign in to create a deck");
    
      // Initialize FSRS settings
      const fullDeckData = {
        ...deckData,
        user_id: authStore.user.id,
        settings: {
          ...((deckData.settings as object) || {}),
          fsrs: {
            request_retention: 0.9,
            maximum_stability: 36500,
            weights: [2.2, 0.7, 2.6, 1.7, 0.5, -0.2, 0.2, 1.0, -0.5, -0.1, 0.5, -0.1, 0.8],
            learning_steps: [1, 10],
            enable_fsrs: true
          }
        }
      };
    
      this.loading.operations = true;
      try {
        const { data, error } = await supabase
          .from("decks")
          .insert([fullDeckData])
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
        this.loading.operations = false;
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

      this.loading.operations = true;
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
        this.loading.operations = false;
      }
    },

    async deleteDeck(id: string) {
      const authStore = useAuthStore();
      if (!authStore.user) {
        throw new Error("Please sign in to delete this deck");
      }

      // Check if user owns the deck
      const deck = this.getDeckById(id);
      if (!deck || deck.user_id !== authStore.user.id) {
        throw new Error("You do not have permission to delete this deck");
      }

      this.loading.operations = true;
      try {
        // Soft delete by updating deleted_at
        const { error } = await supabase
          .from("decks")
          .update({
            deleted_at: new Date().toISOString(),
            // Also update visibility to prevent access
            visibility: "private" as const,
          })
          .eq("id", id);

        if (error) throw error;

        // Update local state
        this.decks = this.decks.filter((deck) => deck.id !== id);
        if (this.currentDeck?.id === id) {
          this.currentDeck = null;
        }
        // Clear cards for this deck
        delete this.cards[id];
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error deleting deck";
        throw error;
      } finally {
        this.loading.operations = false;
      }
    },

    async fetchCards(deckId: string) {
      this.loading.cards = true;
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
        this.loading.cards = false;
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
    
      // Safely parse deck settings with type assertion
      const deckSettings = deck.settings as DeckSettings;
      const fsrsSettings = deckSettings?.fsrs || {
        request_retention: 0.9,
        maximum_stability: 36500,
        weights: [2.2, 0.7, 2.6, 1.7, 0.5, -0.2, 0.2, 1.0, -0.5, -0.1, 0.5, -0.1, 0.8],
        learning_steps: [1, 10],
        enable_fsrs: true
      };
    
      // Prepare card data with FSRS initialization
      const fullCardData: Partial<Card> = {
        ...cardData,
        // FSRS core fields
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        state: "new",
        status: "new",
        // FSRS parameters from deck settings
        request_retention: fsrsSettings.request_retention,
        maximum_stability: fsrsSettings.maximum_stability,
        w: fsrsSettings.weights,
        // Initialize due date to now for new cards
        due_date: new Date().toISOString(),
        // Keep track of reviews
        last_review_date: null,
        last_review_rating: null,
        lapses_count: 0
      };
    
      this.loading.operations = true;
      try {
        const { data, error } = await supabase
          .from("cards")
          .insert([fullCardData])
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
        this.loading.operations = false;
      }
    },

    async updateCard(id: string, updates: Partial<Card>) {
      this.loading.operations = true;
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
        this.loading.operations = false;
      }
    },

    async deleteCard(deckId: string, cardId: string) {
      this.loading.operations = true;
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
        this.loading.operations = false;
      }
    },

    // Study Session Actions
    async recordCardReview(
      cardId: string,
      rating: "again" | "hard" | "good" | "easy"
    ) {
      if (!this.currentCard) return;

      // Get FSRS parameters from deck settings
      const deckSettings = this.currentDeck?.settings?.fsrs || {
        request_retention: 0.9,
        maximum_stability: 36500,
        weights: [2.2, 0.7, 2.6, 1.7, 0.5, -0.2, 0.2, 1.0, -0.5, -0.1, 0.5, -0.1, 0.8]
      };

      // Calculate FSRS updates
      const {
        stability,
        difficulty,
        newState,
        scheduledDays,
        elapsed_days
      } = this.calculateFSRSUpdate(
        this.currentCard,
        rating,
        deckSettings
      );

      // Calculate new due date based on scheduled days
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + scheduledDays);

      // Update card with FSRS parameters
      await this.updateCard(cardId, {
        stability,
        difficulty,
        state: newState,
        status: newState, // Keep status and state in sync
        scheduled_days: scheduledDays,
        elapsed_days,
        due_date: dueDate.toISOString(),
        last_review_date: new Date().toISOString(),
        last_review_rating: rating,
        reps: (this.currentCard.reps || 0) + 1
      });

      // Move to next card in study session
      this.studySession.completedCards.push(this.currentCard);
      this.studySession.remainingCards.shift();
      this.currentCard = this.studySession.remainingCards[0] || null;
    },

    calculateFSRSUpdate(
      card: Card,
      rating: "again" | "hard" | "good" | "easy",
      settings: {
        request_retention: number;
        maximum_stability: number;
        weights: number[];
      }
    ) {
      const w = settings.weights;
      const stability = card.stability || 0;
      const difficulty = card.difficulty || 0;
    
      let newStability = stability;
      let newDifficulty = difficulty;
      let newState: "new" | "learning" | "review" | "relearning" = card.state as any;
      let scheduledDays = 0;
    
      const elapsedDays = card.last_review_date 
        ? (new Date().getTime() - new Date(card.last_review_date).getTime()) / (1000 * 60 * 60 * 24)
        : 0;
    
      // Calculate retrievability
      const r = stability > 0 
        ? Math.exp(Math.log(settings.request_retention) * elapsedDays / stability)
        : 0;
    
      // Update parameters based on rating and retrievability
      switch (rating) {
        case "again":
          newDifficulty = difficulty + w[3] * (1 - r);
          newStability = stability * w[0] * (1 + r);
          newState = "relearning";
          scheduledDays = 0; // Review same day
          break;
        case "hard":
          newDifficulty = difficulty + w[4] * (1 - r);
          newStability = stability * w[1] * (1 + r * w[8]);
          newState = card.state === "new" ? "learning" : "review";
          scheduledDays = Math.ceil(newStability * w[5]);
          break;
        case "good":
          newDifficulty = difficulty + w[6] * (1 - r);
          newStability = stability * w[2] * (1 + r * w[9]);
          newState = card.state === "new" ? "learning" : "review";
          scheduledDays = Math.ceil(newStability * (1 + w[10] * (1 - r)));
          break;
        case "easy":
          newDifficulty = difficulty + w[7] * (1 - r);
          newStability = stability * w[2] * (1 + r * w[11]) * w[12];
          newState = "review";
          scheduledDays = Math.ceil(newStability * (1 + w[10] * (1 - r)) * 1.3);
          break;
      }
    
      // Enforce bounds
      newDifficulty = Math.min(Math.max(newDifficulty, -3), 3);
      newStability = Math.min(Math.max(newStability, 0.1), settings.maximum_stability);
      
      return {
        stability: newStability,
        difficulty: newDifficulty,
        newState,
        scheduledDays,
        elapsed_days: elapsedDays
      };
    },

    /* startStudySession(deckId: string) {
      const deckCards = this.cards[deckId] || [];
      // Get deck's FSRS settings with defaults
      const settings = (this.currentDeck?.settings as DeckSettings)?.fsrs || {
        request_retention: 0.9,
        maximum_stability: 36500,
        weights: [2.2, 0.7, 2.6, 1.7, 0.5, -0.2, 0.2, 1.0, -0.5, -0.1, 0.5, -0.1, 0.8],
        learning_steps: [1, 10],
        enable_fsrs: true
      };
    
      // Filter cards due for review using FSRS settings
      const dueCards = deckCards.filter((card) => {
        const dueDate = new Date(card.due_date);
        const now = new Date();
    
        // If FSRS is disabled, use simple due date check
        if (!settings.enable_fsrs) {
          return card.state === "new" || dueDate <= now;
        }
    
        // For new cards, respect the daily new cards limit
        if (card.state === "new") {
          const newCardsToday = this.studySession.completedCards.filter(
            c => c.state === "new"
          ).length;
          return newCardsToday < (this.currentDeck?.daily_new_cards_limit || 20);
        }
    
        // For learning/relearning cards, use learning steps
        if (card.state === "learning" || card.state === "relearning") {
          return dueDate <= now;
        }
    
        // For review cards, check due date and daily review limit
        if (card.state === "review") {
          const reviewsToday = this.studySession.completedCards.filter(
            c => c.state === "review"
          ).length;
          return dueDate <= now && reviewsToday < (this.currentDeck?.daily_review_limit || 100);
        }
    
        return false;
      });
    
      // Sort cards: new -> learning/relearning -> review
      const sortedDueCards = dueCards.sort((a, b) => {
        const stateOrder = {
          learning: 0,
          relearning: 0,
          new: 1,
          review: 2
        };
        const aOrder = stateOrder[a.state as keyof typeof stateOrder];
        const bOrder = stateOrder[b.state as keyof typeof stateOrder];
        if (aOrder === bOrder) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        return aOrder - bOrder;
      });
    
      this.studySession = {
        currentCardIndex: 0,
        remainingCards: sortedDueCards,
        completedCards: [],
      };
      this.currentCard = sortedDueCards[0] || null;
    },
 */
    startStudySession(deckId: string) {
      const deckCards = this.cards[deckId] || [];
      // Get deck's FSRS settings with defaults
      const settings = (this.currentDeck?.settings as DeckSettings)?.fsrs || {
        request_retention: 0.9,
        maximum_stability: 36500,
        weights: [2.2, 0.7, 2.6, 1.7, 0.5, -0.2, 0.2, 1.0, -0.5, -0.1, 0.5, -0.1, 0.8],
        learning_steps: [1, 10],
        enable_fsrs: true
      };

      // Get today's start timestamp (midnight)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count new cards already studied today
      const newCardsStudiedToday = deckCards.filter(card => 
        card.last_review_date && 
        new Date(card.last_review_date) >= today && 
        card.state === "new"
      ).length;
    
      // Filter cards due for review using FSRS settings
      const dueCards = deckCards.filter((card) => {
        const dueDate = new Date(card.due_date);
        const now = new Date();
    
        // If FSRS is disabled, use simple due date check
        if (!settings.enable_fsrs) {
          return card.state === "new" || dueDate <= now;
        }
    
        // For new cards, respect the daily new cards limit
        if (card.state === "new") {
          return newCardsStudiedToday < (this.currentDeck?.daily_new_cards_limit || 20);
        }
    
        // For learning/relearning cards, use learning steps
        if (card.state === "learning" || card.state === "relearning") {
          return dueDate <= now;
        }
    
        // For review cards, check due date and daily review limit
        if (card.state === "review") {
          const reviewsToday = deckCards.filter(c => 
            c.last_review_date && 
            new Date(c.last_review_date) >= today && 
            c.state === "review"
          ).length;
          return dueDate <= now && reviewsToday < (this.currentDeck?.daily_review_limit || 100);
        }
    
        return false;
      });
    
      // Sort cards: new -> learning/relearning -> review
      const sortedDueCards = dueCards.sort((a, b) => {
        const stateOrder = {
          learning: 0,
          relearning: 0,
          new: 1,
          review: 2
        };
        const aOrder = stateOrder[a.state as keyof typeof stateOrder];
        const bOrder = stateOrder[b.state as keyof typeof stateOrder];
        if (aOrder === bOrder) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        return aOrder - bOrder;
      });
    
      this.studySession = {
        currentCardIndex: 0,
        remainingCards: sortedDueCards,
        completedCards: [],
      };
      this.currentCard = sortedDueCards[0] || null;
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
        this.error =
          error instanceof Error
            ? error.message
            : "Error fetching user's public decks";
        throw error;
      } finally {
        this.loading.decks = false;
      }
    },

    async forkDeck(deckId: string) {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("Please sign in to fork this deck");
    
      this.loading.operations = true;
      try {
        // First ensure we have the source deck data
        const sourceDeck = this.getDeckById(deckId) || (await this.fetchDeckById(deckId));
        if (!sourceDeck) throw new Error("Deck not found");
    
        // Create new deck as a fork with FSRS settings
        const { data: newDeck, error: deckError } = await supabase
          .from("decks")
          .insert([
            {
              user_id: authStore.user.id,
              title: `${sourceDeck.title} (forked)`,
              description: sourceDeck.description,
              tags: sourceDeck.tags,
              visibility: "private" as const,
              is_forked: true,
              original_deck_id: deckId,
              // Initialize with default counts
              new_cards_count: 0,
              learning_cards_count: 0,
              review_cards_count: 0,
              relearning_cards_count: 0,
              due_cards_count: 0,
              // Copy limits from source deck
              daily_new_cards_limit: sourceDeck.daily_new_cards_limit,
              daily_review_limit: sourceDeck.daily_review_limit,
              // Initialize deck settings with FSRS
              settings: {
                ...(sourceDeck.settings as object || {}),
                fsrs: {
                  request_retention: 0.9,
                  maximum_stability: 36500,
                  weights: [2.2, 0.7, 2.6, 1.7, 0.5, -0.2, 0.2, 1.0, -0.5, -0.1, 0.5, -0.1, 0.8],
                  learning_steps: [1, 10],
                  enable_fsrs: true
                }
              }
            },
          ])
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
            // Copy FSRS parameters from new deck settings
            request_retention: (newDeck.settings as DeckSettings).fsrs.request_retention,
            maximum_stability: (newDeck.settings as DeckSettings).fsrs.maximum_stability,
            w: (newDeck.settings as DeckSettings).fsrs.weights,
            // Set timestamps
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
    
        // Update local state
        this.decks.unshift(newDeck);
        return newDeck;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error forking deck";
        throw error;
      } finally {
        this.loading.operations = false;
      }
    },

    async fetchDeckLikes(deckIds: string[]) {
      const authStore = useAuthStore();
      if (!authStore.user) return;

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
        this.error =
          error instanceof Error ? error.message : "Error fetching deck likes";
      }
    },

    async toggleDeckLike(deckId: string) {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("Must be logged in to like decks");

      const isLiked = this.isDeckLiked(deckId);

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
          const { error } = await supabase.from("deck_likes").insert([
            {
              deck_id: deckId,
              user_id: authStore.user.id,
            },
          ]);

          if (error) throw error;
        }

        // Return the delta to update the likes count
        return isLiked ? -1 : 1;
      } catch (error) {
        // Rollback optimistic update on error
        this.deckLikes.set(deckId, isLiked);
        this.error =
          error instanceof Error ? error.message : "Error toggling deck like";
        throw error;
      }
    },

    // Add this new action to fetch a single deck
    async fetchDeckById(deckId: string) {
      try {
        const { data, error } = await supabase
          .from("decks")
          .select("*")
          .eq("id", deckId)
          .is("deleted_at", null)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Deck not found");

        // Add to local state if not already present
        if (!this.decks.some((deck) => deck.id === data.id)) {
          this.decks.push(data);
        }
        return data;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error fetching deck";
        throw error;
      }
    },

    async duplicateCard(cardId: string) {
      const card = Object.values(this.cards)
        .flat()
        .find(c => c.id === cardId);
      
      if (!card) throw new Error("Card not found");

      this.loading.operations = true;
      try {
        // Create a new object without the id field
        const { id, ...cardWithoutId } = card;

        const { data, error } = await supabase
          .from("cards")
          .insert([{
            ...cardWithoutId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // Reset FSRS fields for the new card
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
            lapses_count: 0
          }])
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
        this.loading.operations = false;
      }
    }
  },
});
