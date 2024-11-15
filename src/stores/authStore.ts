import { defineStore } from "pinia";
import { User } from "@supabase/supabase-js";
import { supabase } from "../supabase";

const getRedirectTo = () => {
  return import.meta.env.VITE_REDIRECT_URL || "http://localhost:5173";
};

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
  error: string | null;
  loading: boolean;
  initialized: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    error: null,
    loading: false,
    initialized: false,
  }),

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
          return null;
        }

        if (session) {
          const { data, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError) {
            console.warn("Session refresh failed:", refreshError);
            this.error = "Your session has expired. Please log in again.";
            this.user = null;
            return null;
          }

          if (data.session && data.user) {
            this.user = data.user as User & { user_metadata: UserMetadata };
            return data.user;
          }
        }

        this.user = null;
        return null;
      } catch (error) {
        console.error("Unexpected error during auth check:", error);
        this.error = "An unexpected error occurred";
        this.user = null;
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
        localStorage.removeItem("supabase.auth.token");
        this.loading = false;
      }
    },
  },
});
