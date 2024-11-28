import { defineStore } from "pinia";
import { 
  FSRSSettings, 
  FSRSUpdateResult, 
  Card, 
  ReviewRating 
} from "../types/deck.types";

export const useFSRSStore = defineStore("fsrs", {
  state: () => ({
    defaultSettings: {
      request_retention: 0.9,
      maximum_stability: 36500,
      weights: [2.2, 0.7, 2.6, 1.7, 0.5, -0.2, 0.2, 1.0, -0.5, -0.1, 0.5, -0.1, 0.8],
      learning_steps: [1, 10],
      enable_fsrs: true,
    } as FSRSSettings
  }),

  actions: {
    calculateFSRSUpdate(
      this: { defaultSettings: FSRSSettings },
      card: Card,
      rating: ReviewRating,
      settings: FSRSSettings = this.defaultSettings
    ): FSRSUpdateResult {
      const w = settings.weights;
      const stability = card.stability || 0;
      const difficulty = card.difficulty || 0;

      let newStability = stability;
      let newDifficulty = difficulty;
      let newState = card.state;
      let scheduledDays = 0;

      const elapsedDays = card.last_review_date
        ? (new Date().getTime() - new Date(card.last_review_date).getTime()) /
          (1000 * 60 * 60 * 24)
        : 0;

      // Calculate retrievability
      const r = stability > 0
        ? Math.exp((Math.log(settings.request_retention) * elapsedDays) / stability)
        : 0;

      // Update parameters based on rating
      switch (rating) {
        case "again":
          newDifficulty = difficulty + w[3] * (1 - r);
          newStability = stability * w[0] * (1 + r);
          newState = "relearning";
          scheduledDays = 0;
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
        elapsed_days: elapsedDays,
      };
    },

    calculateNextDueDate(scheduledDays: number): Date {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + scheduledDays);
      return dueDate;
    }
  }
});