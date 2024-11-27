import { computed } from 'vue';
import { useDeckStore } from '../stores/deckStore';

export function useCardStats(deckId: string) {
  const deckStore = useDeckStore();

  const availableNewCards = computed(() => {
    const stats = deckStore.deckStats.get(deckId);
    if (!stats) return 0;

    const dailyNewCardsLimit = deckStore.getDeckById(deckId)?.daily_new_cards_limit || 20;
    const remainingNewCardsLimit = Math.max(0, dailyNewCardsLimit - stats.new_studied_today);
    return Math.min(stats.new_count, remainingNewCardsLimit);
  });

  const dueReviewCards = computed(() => {
    const stats = deckStore.deckStats.get(deckId);
    if (!stats) return 0;

    const dailyReviewLimit = deckStore.getDeckById(deckId)?.daily_review_limit || 100;
    if (stats.review_studied_today >= dailyReviewLimit) return 0;
    
    return Math.min(
      stats.due_review_count,
      dailyReviewLimit - stats.review_studied_today
    );
  });

  const dueLearningCards = computed(() => {
    const stats = deckStore.deckStats.get(deckId);
    return stats?.due_learning_count || 0;
  });

  return {
    availableNewCards,
    dueReviewCards,
    dueLearningCards
  };
}