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
    async fetchYearlyReviewLogs(userId: string, year: number = new Date().getFullYear()) {
      this.loading = true;
      this.error = null;
      
      try {
        // Set date range for the entire calendar year
        const startDate = new Date(year, 0, 1); // January 1st of the specified year
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st of the specified year

        const { data, error } = await supabase
          .from("review_logs")
          .select("*")
          .eq("user_id", userId)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Group reviews by date
        const groupedLogs = new Map<string, ReviewLog[]>();
        
        data?.forEach((log) => {
          const date = new Date(log.created_at);
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          if (!groupedLogs.has(dateKey)) {
            groupedLogs.set(dateKey, []);
          }
          
          groupedLogs.get(dateKey)?.push(log as ReviewLog);
        });

        this.yearlyReviewLogs = groupedLogs;
        return groupedLogs;

      } catch (error) {
        this.error = error instanceof Error ? error.message : "Failed to fetch review logs";
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