import { defineStore } from "pinia";
import { supabase } from "../supabase";
import { User } from "@supabase/supabase-js";
import { useUsersStore } from "./usersStore";
import { Database } from "../types/supabase";

const getRedirectTo = () => {
  return import.meta.env.VITE_REDIRECT_URL || "http://localhost:5173";
};

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface UserMetadata {
  avatar_url: string;
  email: string;
  email_verified: boolean;
  full_name: string;
  iss: string;
  name: string;
  phone_verified: boolean;
  picture: string;
  provider_id: string;
  sub: string;
  custom_claims?: {
    global_name: string;
  };
}

interface AuthState {
  user: (User & { user_metadata: UserMetadata }) | null;
  userProfile: UserProfile | null;
  error: string | null;
  loading: boolean;
  initialized: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    userProfile: null,
    error: null,
    loading: false,
    initialized: false,
  }),

  getters: {
    // Convenience getters for commonly used profile data
    username: (state): string | null => state.userProfile?.username ?? null,
    avatarUrl: (state): string | null => state.userProfile?.avatar_url ?? null,
    email: (state): string | null => state.userProfile?.email ?? null,
  },

  actions: {
    async signInWithDiscord(): Promise<void> {
      this.loading = true;
      this.error = null;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: getRedirectTo(),
        },
      });

      if (error) {
        this.error = error.message;
        console.error("Discord sign-in error:", error);
      }

      this.loading = false;
    },

    async initializeUserProfile(
      user: User & { user_metadata: UserMetadata }
    ): Promise<void> {
      const usersStore = useUsersStore();

      try {
        // Try to fetch existing profile
        const existingProfile = await usersStore.fetchUserProfile(user.id);

        // If no profile exists, create one with default values
        if (!existingProfile) {
          console.log("Creating new user profile for:", user.id);
          const newProfile = await usersStore.createUserProfile({
            id: user.id,
            username:
              user.user_metadata.custom_claims?.global_name ||
              user.email?.split("@")[0] ||
              `user_${user.id.slice(0, 8)}`,
            avatar_url:
              user.user_metadata.avatar_url ||
              user.user_metadata.picture,
            email: user.email!,
            language: "en",
            account_type: "free",
            is_verified: false,
            reputation_score: 0,
            followers_count: 0,
            following_count: 0,
            decks_created_count: 0,
            total_cards_studied: 0,
            total_study_time_minutes: 0,
            streak_days: 0,
            longest_streak: 0,
            storage_used_bytes: 0,
            joined_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
          });
          this.userProfile = newProfile;
          console.log("Successfully created profile for:", user.id);
        } else {
          this.userProfile = existingProfile;
          console.log("Found existing profile for:", user.id);
        }
      } catch (error) {
        console.error("Error in initializeUserProfile:", error);
        if (error instanceof Error) {
          console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            user: user.id,
          });
        }
      }
    },

    async handleAuthRedirect(): Promise<User | null> {
      if (this.initialized) return this.user;

      this.loading = true;
      this.error = null;

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          this.error = sessionError.message;
          this.user = null;
          this.userProfile = null;
          return null;
        }

        if (session) {
          const { data, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError) {
            console.warn("Session refresh failed:", refreshError);
            this.error = "Your session has expired. Please log in again.";
            this.user = null;
            this.userProfile = null;
            return null;
          }

          if (data.session && data.user) {
            this.user = data.user as User & { user_metadata: UserMetadata };

            // Initialize user profile after successful authentication
            await this.initializeUserProfile(this.user);

            return data.user;
          }
        }

        this.user = null;
        this.userProfile = null;
        return null;
      } catch (error) {
        console.error("Unexpected error during auth check:", error);
        this.error = "An unexpected error occurred";
        this.user = null;
        this.userProfile = null;
        return null;
      } finally {
        this.initialized = true;
        this.loading = false;
      }
    },

    async logout(): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Logout error:", error);
          this.error = error.message;
        } else {
          console.log("Logout successful");
        }
      } catch (error) {
        console.error("Unexpected error during logout:", error);
        this.error = "An unexpected error occurred during logout";
      } finally {
        // Always clear local state, even if server-side logout fails
        this.user = null;
        this.userProfile = null;
        localStorage.removeItem("supabase.auth.token");
        this.loading = false;
      }
    },

    // New method to update profile
    async updateProfile(updates: Partial<UserProfile>): Promise<void> {
      if (!this.user) throw new Error("Must be logged in to update profile");

      const usersStore = useUsersStore();
      try {
        const updatedProfile = await usersStore.updateUserProfile(updates);
        if (updatedProfile) {
          this.userProfile = updatedProfile;
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
    }
  },
});