import { defineStore } from "pinia";
import { supabase } from "../supabase";
import type { ReviewLog } from "../types/deck.types";

interface StatsState {
  yearlyReviewLogs: Map<string, ReviewLog[]>; // key: YYYY-MM-DD, value: logs for that day
  loading: boolean;
  error: string | null;
}

export const useStatsStore = defineStore("stats", {
  state: (): StatsState => ({
    yearlyReviewLogs: new Map(),
    loading: false,
    error: null,
  }),

  actions: {
    async fetchYearlyReviewLogs(userId: string, year: number = new Date().getFullYear(), deckId?: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        const groupedLogs = new Map<string, ReviewLog[]>();

        // Paginated fetch
        let page = 0;
        const pageSize = 9999;
        let hasMore = true;

        while (hasMore) {
          let query = supabase
            .from("review_logs")
            .select("*")
            .eq("user_id", userId)
            .gte("review_time", startDate.toISOString())
            .lte("review_time", endDate.toISOString())
            .range(page * pageSize, (page + 1) * pageSize - 1)
            .order("review_time", { ascending: true });

          if (deckId) {
            query = query.eq("deck_id", deckId);
          }

          const { data, error } = await query;

          if (error) throw error;
          
          // Process the current page of data
          data?.forEach((log) => {
            const date = new Date(log.review_time);
            const dateKey = date.toISOString().split('T')[0];
            
            if (!groupedLogs.has(dateKey)) {
              groupedLogs.set(dateKey, []);
            }
            
            groupedLogs.get(dateKey)?.push(log as ReviewLog);
          });

          // Check if we should continue fetching
          hasMore = (data?.length ?? 0) === pageSize;
          page++;
        }

        this.yearlyReviewLogs = groupedLogs;
        return groupedLogs;

      } catch (error) {
        this.error = error instanceof Error ? error.message : "Failed to fetch review logs";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchDailyReviewCounts(userId: string, year: number = new Date().getFullYear(), deckId?: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        const dailyCounts = new Map<string, number>();

        let query = supabase
          .from("daily_review_counts")
          .select('review_date, review_count, deck_id')
          .eq("user_id", userId)
          .gte("review_date", startDate.toISOString())
          .lte("review_date", endDate.toISOString());

        if (deckId) {
          query = query.eq("deck_id", deckId);
        }

        const { data, error } = await query;

        if (error) throw error;

        data?.forEach((entry) => {
          const dateKey = new Date(entry.review_date).toISOString().split('T')[0];
          if (deckId) {
            // If looking at a specific deck, just use the count directly
            dailyCounts.set(dateKey, Number(entry.review_count));
          } else {
            // If looking at all decks, sum up the counts for each date
            const currentCount = dailyCounts.get(dateKey) || 0;
            dailyCounts.set(dateKey, currentCount + Number(entry.review_count));
          }
        });

        return dailyCounts;

      } catch (error) {
        this.error = error instanceof Error ? error.message : "Failed to fetch review counts";
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },

  getters: {
    // Get review count for a specific date
    getReviewCountForDate: (state) => (date: string) => {
      return state.yearlyReviewLogs.get(date)?.length ?? 0;
    },

    // Get all dates with their review counts
    getAllReviewCounts: (state) => {
      const counts = new Map<string, number>();
      
      state.yearlyReviewLogs.forEach((logs, date) => {
        counts.set(date, logs.length);
      });
      
      return counts;
    },

    // Get total reviews for the year
    totalYearlyReviews: (state) => {
      let total = 0;
      state.yearlyReviewLogs.forEach(logs => {
        total += logs.length;
      });
      return total;
    },

    // Get average reviews per active day
    averageReviewsPerActiveDay: (state) => {
      const activeDays = state.yearlyReviewLogs.size;
      const totalReviews = Array.from(state.yearlyReviewLogs.values())
        .reduce((sum, logs) => sum + logs.length, 0);
      
      return activeDays === 0 ? 0 : totalReviews / activeDays;
    },
  },
});