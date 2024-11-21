import { defineStore } from "pinia";
import { supabase } from "../supabase";
import { Database } from "../types/supabase";
import { useAuthStore } from "./authStore";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
type Comment = Database["public"]["Tables"]["comments"]["Row"];

interface UsersState {
  profiles: Map<string, UserProfile>;
  comments: Map<string, Comment[]>;
  commentLikes: Map<string, Set<string>>;
  following: Set<string>;
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
    getUserProfile: (state) => (userId: string): UserProfile | undefined =>
      state.profiles.get(userId),

    getCurrentUserProfile(): UserProfile | undefined {
      const authStore = useAuthStore();
      // @ts-ignore - Ignoring deep type instantiation error
      return authStore.userProfile || undefined;
    },

    getDeckComments: (state) => (deckId: string): Comment[] =>
      state.comments.get(deckId) || [],

    isFollowing: (state) => (userId: string): boolean =>
      state.following.has(userId),

    hasLikedComment: (state) => (commentId: string): boolean => {
      const authStore = useAuthStore();
      return authStore.userProfile
        ? state.commentLikes.get(commentId)?.has(authStore.userProfile.id) || false
        : false;
    },

    getThreadedComments: (state) => (deckId: string): Comment[] => {
      const comments = state.comments.get(deckId) || [];
      return comments
        .filter((comment) => !comment.parent_id)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    },

    getCommentReplies: (state) => (commentId: string, deckId: string): Comment[] => {
      const comments = state.comments.get(deckId) || [];
      return comments
        .filter((comment) => comment.parent_id === commentId)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    },
  },

  actions: {
    // Cache Management
    clearProfileCache() {
      this.profiles.clear();
      this.following.clear();
      this.comments.clear();
      this.commentLikes.clear();
    },

    updateProfileInCache(profile: UserProfile) {
      this.profiles.set(profile.id, profile);
      
      const authStore = useAuthStore();
      if (authStore.userProfile?.id === profile.id) {
        authStore.userProfile = profile;
      }
    },

    // Profile Actions
    async fetchUserProfile(userId: string) {
      if (!userId) return undefined;
      if (this.profiles.has(userId)) return this.profiles.get(userId);

      this.loading.profiles = true;
      try {
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;

        if (!profile) {
          throw new Error(`Profile not found for user ${userId}`);
        }

        this.updateProfileInCache(profile);
        return profile;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error fetching user profile";
        throw error;
      } finally {
        this.loading.profiles = false;
      }
    },

    async createUserProfile(profileData: Partial<UserProfile>) {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("Must be logged in to create profile");

      this.loading.profiles = true;
      try {
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .insert([{ ...profileData, id: authStore.user.id }])
          .select("*")
          .single();

        if (error) throw error;

        if (profile) {
          this.updateProfileInCache(profile);
          return profile;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error creating user profile";
        throw error;
      } finally {
        this.loading.profiles = false;
      }
    },

    async updateUserProfile(updates: Partial<UserProfile>) {
      const authStore = useAuthStore();
      if (!authStore.userProfile) throw new Error("Must be logged in to update profile");

      this.loading.profiles = true;
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .update(updates)
          .eq("id", authStore.userProfile.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          this.updateProfileInCache(data);
          return data;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error updating user profile";
        throw error;
      } finally {
        this.loading.profiles = false;
      }
    },

    // Comment Actions
    async fetchDeckCommentsWithProfiles(deckId: string) {
      this.loading.comments = true;
      try {
        // First fetch comments
        const { data: comments, error: commentsError } = await supabase
          .from("comments")
          .select("*")
          .eq("deck_id", deckId)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (commentsError) throw commentsError;
        if (!comments) return;

        // Get unique user IDs from comments
        const userIds = [...new Set(comments.map(comment => comment.user_id))];

        // Fetch user profiles for all commenters
        const { data: profiles, error: profilesError } = await supabase
          .from("user_profiles")
          .select("*")
          .in("id", userIds);

        if (profilesError) throw profilesError;
        if (profiles) {
          // Store user profiles in cache
          profiles.forEach(profile => {
            this.updateProfileInCache(profile);
          });
        }

        // Store comments
        this.comments.set(deckId, comments);

        // Fetch likes for these comments
        const commentIds = comments.map(comment => comment.id);
        await this.fetchCommentLikes(commentIds);
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error fetching comments";
        throw error;
      } finally {
        this.loading.comments = false;
      }
    },

    async createComment(deckId: string, content: string, parentId?: string) {
      const authStore = useAuthStore();
      if (!authStore.userProfile) throw new Error("Must be logged in to comment");

      this.loading.comments = true;
      try {
        const { data, error } = await supabase
          .from("comments")
          .insert([{
            deck_id: deckId,
            user_id: authStore.userProfile.id,
            content,
            parent_id: parentId,
          }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const deckComments = this.comments.get(deckId) || [];
          this.comments.set(deckId, [data, ...deckComments]);
          return data;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error creating comment";
        throw error;
      } finally {
        this.loading.comments = false;
      }
    },

    async updateComment(commentId: string, content: string) {
      const authStore = useAuthStore();
      if (!authStore.userProfile) throw new Error("Must be logged in to update comment");

      this.loading.comments = true;
      try {
        const { data, error } = await supabase
          .from("comments")
          .update({
            content,
            edited_at: new Date().toISOString(),
          })
          .eq("id", commentId)
          .eq("user_id", authStore.userProfile.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          for (const [deckId, comments] of this.comments.entries()) {
            const index = comments.findIndex(c => c.id === commentId);
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
        this.error = error instanceof Error ? error.message : "Error updating comment";
        throw error;
      } finally {
        this.loading.comments = false;
      }
    },

    async deleteComment(commentId: string, deckId: string) {
      const authStore = useAuthStore();
      if (!authStore.userProfile) throw new Error("Must be logged in to delete comment");

      this.loading.comments = true;
      try {
        const { error } = await supabase
          .from("comments")
          .delete()
          .eq("id", commentId)
          .eq("user_id", authStore.userProfile.id);

        if (error) throw error;

        const deckComments = this.comments.get(deckId) || [];
        this.comments.set(
          deckId,
          deckComments.filter(c => c.id !== commentId && c.parent_id !== commentId)
        );
        this.commentLikes.delete(commentId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error deleting comment";
        throw error;
      } finally {
        this.loading.comments = false;
      }
    },

    // Comment Likes
    async fetchCommentLikes(commentIds: string[]) {
      const authStore = useAuthStore();
      if (!authStore.userProfile) return;

      try {
        const { data, error } = await supabase
          .from("comment_likes")
          .select("*")
          .in("comment_id", commentIds);

        if (error) throw error;
        if (data) {
          data.forEach(like => {
            const likes = this.commentLikes.get(like.comment_id) || new Set();
            likes.add(like.user_id);
            this.commentLikes.set(like.comment_id, likes);
          });
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error fetching comment likes";
      }
    },

    async toggleCommentLike(commentId: string) {
      const authStore = useAuthStore();
      if (!authStore.userProfile) throw new Error("Must be logged in to like comments");

      const hasLiked = this.hasLikedComment(commentId);
      try {
        if (hasLiked) {
          const { error } = await supabase
            .from("comment_likes")
            .delete()
            .eq("comment_id", commentId)
            .eq("user_id", authStore.userProfile.id);

          if (error) throw error;
          const likes = this.commentLikes.get(commentId);
          if (likes) {
            likes.delete(authStore.userProfile.id);
            this.commentLikes.set(commentId, likes);
          }
        } else {
          const { error } = await supabase
            .from("comment_likes")
            .insert([{
              comment_id: commentId,
              user_id: authStore.userProfile.id,
            }]);

          if (error) throw error;
          const likes = this.commentLikes.get(commentId) || new Set();
          likes.add(authStore.userProfile.id);
          this.commentLikes.set(commentId, likes);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error toggling comment like";
        throw error;
      }
    },

    // Following Actions
    async fetchFollowing() {
      const authStore = useAuthStore();
      if (!authStore.userProfile) return;

      this.loading.following = true;
      try {
        const { data, error } = await supabase
          .from("user_followers")
          .select("following_id")
          .eq("follower_id", authStore.userProfile.id);

        if (error) throw error;
        if (data) {
          this.following = new Set(data.map(f => f.following_id));
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error fetching following";
      } finally {
        this.loading.following = false;
      }
    },

    async toggleFollow(userId: string) {
      const authStore = useAuthStore();
      if (!authStore.userProfile) throw new Error("Must be logged in to follow users");
      if (userId === authStore.userProfile.id) throw new Error("Cannot follow yourself");
    
      this.loading.following = true;
      try {
        if (this.following.has(userId)) {
          // Unfollow
          const { error } = await supabase
            .from("user_followers")
            .delete()
            .eq("follower_id", authStore.userProfile.id)
            .eq("following_id", userId);
    
          if (error) throw error;
          this.following.delete(userId);
          
          // Update counts immediately
          const targetProfile = this.profiles.get(userId);
          const currentProfile = this.profiles.get(authStore.userProfile.id);
          if (targetProfile) {
            targetProfile.followers_count--;
            this.updateProfileInCache(targetProfile);
          }
          if (currentProfile) {
            currentProfile.following_count--;
            this.updateProfileInCache(currentProfile);
          }
        } else {
          // Follow
          const { error } = await supabase
            .from("user_followers")
            .insert([{
              follower_id: authStore.userProfile.id,
              following_id: userId,
            }]);
    
          if (error) throw error;
          this.following.add(userId);
          
          // Update counts immediately
          const targetProfile = this.profiles.get(userId);
          const currentProfile = this.profiles.get(authStore.userProfile.id);
          if (targetProfile) {
            targetProfile.followers_count++;
            this.updateProfileInCache(targetProfile);
          }
          if (currentProfile) {
            currentProfile.following_count++;
            this.updateProfileInCache(currentProfile);
          }
        }
    
        // Still fetch the latest data in the background
        await Promise.all([
          this.fetchUserProfile(userId),
          this.fetchUserProfile(authStore.userProfile.id)
        ]);
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Error toggling follow";
        throw error;
      } finally {
        this.loading.following = false;
      }
    },
  },
});