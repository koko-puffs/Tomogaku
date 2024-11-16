import { defineStore } from "pinia";
import { supabase } from "../supabase";
import { Database } from "../types/supabase";
import { useAuthStore } from "./authStore";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
type Comment = Database["public"]["Tables"]["comments"]["Row"];
//type CommentLike = Database["public"]["Tables"]["comment_likes"]["Row"];
//type Follower = Database["public"]["Tables"]["user_followers"]["Row"];

interface UsersState {
  profiles: Map<string, UserProfile>;
  comments: Map<string, Comment[]>; // Keyed by deck_id
  commentLikes: Map<string, Set<string>>; // comment_id -> Set of user_ids who liked it
  following: Set<string>; // Set of user_ids that the current user follows
  loading: {
    profiles: boolean;
    comments: boolean;
    following: boolean;
  };
  error: string | null;
}

export const useUsersStore = defineStore("users", {
  state: (): UsersState => ({
    profiles: new Map(),
    comments: new Map(),
    commentLikes: new Map(),
    following: new Set(),
    loading: {
      profiles: false,
      comments: false,
      following: false,
    },
    error: null,
  }),

  getters: {
    getUserProfile:
      (state) =>
      (userId: string): UserProfile | undefined =>
        state.profiles.get(userId),

    getCurrentUserProfile(): UserProfile | undefined {
      const authStore = useAuthStore();
      // @ts-ignore - Ignoring deep type instantiation error
      // TODO: Fix this
      return authStore.user ? this.profiles.get(authStore.user.id) : undefined;
    },

    getDeckComments:
      (state) =>
      (deckId: string): Comment[] =>
        state.comments.get(deckId) || [],

    isFollowing:
      (state) =>
      (userId: string): boolean =>
        state.following.has(userId),

    hasLikedComment:
      (state) =>
      (commentId: string): boolean => {
        const authStore = useAuthStore();
        return authStore.user
          ? state.commentLikes.get(commentId)?.has(authStore.user.id) || false
          : false;
      },

    // Get threaded comments for a deck
    getThreadedComments:
      (state) =>
      (deckId: string): Comment[] => {
        const comments = state.comments.get(deckId) || [];
        return comments
          .filter((comment) => !comment.parent_id)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
      },

    getCommentReplies:
      (state) =>
      (commentId: string, deckId: string): Comment[] => {
        const comments = state.comments.get(deckId) || [];
        return comments
          .filter((comment) => comment.parent_id === commentId)
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
      },
  },

  actions: {
    // Profile Actions
    async fetchUserProfile(userId: string) {
      if (this.profiles.has(userId)) return this.profiles.get(userId);

      this.loading.profiles = true;
      try {
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;

        if (profile) {
          this.profiles.set(userId, profile);
          return profile;
        }

        return undefined;
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Error fetching user profile";
        throw error;
      } finally {
        this.loading.profiles = false;
      }
    },

    async createUserProfile(profileData: Partial<UserProfile>) {
      const authStore = useAuthStore();
      if (!authStore.user)
        throw new Error("Must be logged in to create profile");

      this.loading.profiles = true;
      try {
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .insert([
            {
              ...profileData,
              id: authStore.user.id,
            },
          ])
          .select("*")
          .single();

        if (error) throw error;

        if (profile) {
          this.profiles.set(profile.id, profile);
          return profile;
        }
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Error creating user profile";
        throw error;
      } finally {
        this.loading.profiles = false;
      }
    },

    async updateUserProfile(updates: Partial<UserProfile>) {
      const authStore = useAuthStore();
      if (!authStore.user)
        throw new Error("Must be logged in to update profile");

      this.loading.profiles = true;
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .update(updates)
          .eq("id", authStore.user.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          this.profiles.set(data.id, data);
          return data;
        }
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Error updating user profile";
        throw error;
      } finally {
        this.loading.profiles = false;
      }
    },

    // Comment Actions
    async fetchDeckComments(deckId: string) {
      this.loading.comments = true;
      try {
        const { data, error } = await supabase
          .from("comments")
          .select("*")
          .eq("deck_id", deckId)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) {
          this.comments.set(deckId, data);

          // Fetch likes for these comments
          const commentIds = data.map((comment) => comment.id);
          await this.fetchCommentLikes(commentIds);
        }
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error fetching comments";
        throw error;
      } finally {
        this.loading.comments = false;
      }
    },

    async createComment(deckId: string, content: string, parentId?: string) {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("Must be logged in to comment");

      this.loading.comments = true;
      try {
        const { data, error } = await supabase
          .from("comments")
          .insert([
            {
              deck_id: deckId,
              user_id: authStore.user.id,
              content,
              parent_id: parentId,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const deckComments = this.comments.get(deckId) || [];
          this.comments.set(deckId, [data, ...deckComments]);
          return data;
        }
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error creating comment";
        throw error;
      } finally {
        this.loading.comments = false;
      }
    },

    async updateComment(commentId: string, content: string) {
      const authStore = useAuthStore();
      if (!authStore.user)
        throw new Error("Must be logged in to update comment");

      this.loading.comments = true;
      try {
        const { data, error } = await supabase
          .from("comments")
          .update({
            content,
            edited_at: new Date().toISOString(),
          })
          .eq("id", commentId)
          .eq("user_id", authStore.user.id) // Ensure user owns comment
          .select()
          .single();

        if (error) throw error;
        if (data) {
          // Update comment in store
          for (const [deckId, comments] of this.comments.entries()) {
            const index = comments.findIndex((c) => c.id === commentId);
            if (index !== -1) {
              const updatedComments = [...comments];
              updatedComments[index] = data;
              this.comments.set(deckId, updatedComments);
              break;
            }
          }
          return data;
        }
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error updating comment";
        throw error;
      } finally {
        this.loading.comments = false;
      }
    },

    async deleteComment(commentId: string, deckId: string) {
      const authStore = useAuthStore();
      if (!authStore.user)
        throw new Error("Must be logged in to delete comment");

      this.loading.comments = true;
      try {
        const { error } = await supabase
          .from("comments")
          .delete()
          .eq("id", commentId)
          .eq("user_id", authStore.user.id); // Ensure user owns comment

        if (error) throw error;

        // Remove comment from store
        const deckComments = this.comments.get(deckId) || [];
        this.comments.set(
          deckId,
          deckComments.filter((c) => c.id !== commentId)
        );
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error deleting comment";
        throw error;
      } finally {
        this.loading.comments = false;
      }
    },

    // Comment Likes
    async fetchCommentLikes(commentIds: string[]) {
      const authStore = useAuthStore();
      if (!authStore.user) return;

      try {
        const { data, error } = await supabase
          .from("comment_likes")
          .select("*")
          .in("comment_id", commentIds);

        if (error) throw error;
        if (data) {
          // Group likes by comment_id
          data.forEach((like) => {
            const likes = this.commentLikes.get(like.comment_id) || new Set();
            likes.add(like.user_id);
            this.commentLikes.set(like.comment_id, likes);
          });
        }
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Error fetching comment likes";
      }
    },

    async toggleCommentLike(commentId: string) {
      const authStore = useAuthStore();
      if (!authStore.user)
        throw new Error("Must be logged in to like comments");

      const hasLiked = this.hasLikedComment(commentId);
      try {
        if (hasLiked) {
          // Unlike
          const { error } = await supabase
            .from("comment_likes")
            .delete()
            .eq("comment_id", commentId)
            .eq("user_id", authStore.user.id);

          if (error) throw error;
          const likes = this.commentLikes.get(commentId);
          if (likes) {
            likes.delete(authStore.user.id);
            this.commentLikes.set(commentId, likes);
          }
        } else {
          // Like
          const { error } = await supabase.from("comment_likes").insert([
            {
              comment_id: commentId,
              user_id: authStore.user.id,
            },
          ]);

          if (error) throw error;
          const likes = this.commentLikes.get(commentId) || new Set();
          likes.add(authStore.user.id);
          this.commentLikes.set(commentId, likes);
        }
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Error toggling comment like";
        throw error;
      }
    },

    // Following Actions
    async fetchFollowing() {
      const authStore = useAuthStore();
      if (!authStore.user) return;

      this.loading.following = true;
      try {
        const { data, error } = await supabase
          .from("user_followers")
          .select("following_id")
          .eq("follower_id", authStore.user.id);

        if (error) throw error;
        if (data) {
          this.following = new Set(data.map((f) => f.following_id));
        }
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error fetching following";
      } finally {
        this.loading.following = false;
      }
    },

    async toggleFollow(userId: string) {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("Must be logged in to follow users");
      if (userId === authStore.user.id)
        throw new Error("Cannot follow yourself");

      this.loading.following = true;
      try {
        if (this.following.has(userId)) {
          // Unfollow
          const { error } = await supabase
            .from("user_followers")
            .delete()
            .eq("follower_id", authStore.user.id)
            .eq("following_id", userId);

          if (error) throw error;
          this.following.delete(userId);
        } else {
          // Follow
          const { error } = await supabase.from("user_followers").insert([
            {
              follower_id: authStore.user.id,
              following_id: userId,
            },
          ]);

          if (error) throw error;
          this.following.add(userId);
        }
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Error toggling follow";
        throw error;
      } finally {
        this.loading.following = false;
      }
    },
  },
});
