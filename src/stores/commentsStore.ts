import { defineStore } from "pinia";
import { supabase } from "../supabase";
import { Database } from "../types/supabase";
import { useAuthStore } from "./authStore";

type Comment = Database["public"]["Tables"]["comments"]["Row"];

interface CommentsState {
  comments: Map<string, Comment[]>;
  commentLikes: Map<string, Set<string>>;
  loading: boolean;
  error: string | null;
  pagination: Map<string, {
    currentPage: number;
    hasMore: boolean;
    isLoading: boolean;
    totalCount?: number;
  }>;
  sortedComments: Map<string, Comment[]>;
}

export const useCommentsStore = defineStore("comments", {
  state: (): CommentsState => ({
    comments: new Map(),
    commentLikes: new Map(),
    loading: false,
    error: null,
    pagination: new Map(),
    sortedComments: new Map(),
  }),

  getters: {
    getDeckComments: (state) => (deckId: string): Comment[] =>
      state.comments.get(deckId) || [],

    hasLikedComment: (state) => (commentId: string): boolean => {
      const authStore = useAuthStore();
      return authStore.userProfile
        ? state.commentLikes.get(commentId)?.has(authStore.userProfile.id) || false
        : false;
    },

    getThreadedComments: (state) => (deckId: string): Comment[] => {
      if (state.sortedComments.has(deckId)) {
        return state.sortedComments.get(deckId) || [];
      }
      return state.comments.get(deckId)?.filter(comment => !comment.parent_id) || [];
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

    getPagination: (state) => (deckId: string) => {
      return (
        state.pagination.get(deckId) || {
          currentPage: 1,
          hasMore: true,
          isLoading: false,
        }
      );
    },
  },

  actions: {
    clearCache() {
      this.comments.clear();
      this.commentLikes.clear();
      this.pagination.clear();
      this.sortedComments.clear();
    },

    // Comment Actions
    async fetchDeckCommentsWithProfiles(deckId: string, page = 1, limit = 10, sortBy: 'newest' | 'likes' = 'newest') {
        this.loading = true;
  
        const pagination = this.pagination.get(deckId) || {
          currentPage: 1,
          hasMore: true,
          isLoading: false,
        };
  
        if (pagination.isLoading) return;
        pagination.isLoading = true;
        this.pagination.set(deckId, pagination);
  
        try {
          const from = (page - 1) * limit;
          const to = from + limit - 1;
  
          // First fetch parent comments (no parent_id)
          let query = supabase
            .from("comments")
            .select("*", { count: "exact" })
            .eq("deck_id", deckId)
            .eq("status", "active")
            .is("parent_id", null) // Only fetch parent comments
            .range(from, to);
  
          // Apply sorting
          if (sortBy === 'likes') {
            query = query.order('likes_count', { ascending: false }).order('created_at', { ascending: false });
          } else {
            query = query.order('created_at', { ascending: false });
          }
  
          const { data: parentComments, error: commentsError, count } = await query;
  
          if (commentsError) throw commentsError;
          if (!parentComments) return;
  
          // Then fetch all replies for these parent comments
          const parentIds = parentComments.map(comment => comment.id);
          const { data: replies, error: repliesError } = await supabase
            .from("comments")
            .select("*")
            .eq("deck_id", deckId)
            .eq("status", "active")
            .in("parent_id", parentIds)
            .order('created_at', { ascending: true }); // Replies always sorted by oldest first
  
          if (repliesError) throw repliesError;
  
          // Combine parent comments and replies
          const allComments = [...parentComments, ...(replies || [])];
  
          // Update pagination state
          this.pagination.set(deckId, {
            currentPage: page,
            hasMore: count ? from + parentComments.length < count : false,
            isLoading: false,
            totalCount: count || 0,
          });
  
          // Store comments (append if loading more, replace if first page)
          const existingComments = page === 1 ? [] : (this.comments.get(deckId) || []);
          this.comments.set(deckId, [...existingComments, ...allComments]);
  
          // Get unique user IDs from all comments
          const userIds = [...new Set(allComments.map(comment => comment.user_id))];
  
          // Fetch user profiles for all commenters
          const { data: _profiles, error: profilesError } = await supabase
            .from("user_profiles")
            .select("*")
            .in("id", userIds);
  
          if (profilesError) throw profilesError;
  
          // Fetch current user's likes
          const commentIds = allComments.map(comment => comment.id);
          await this.fetchCommentLikes(commentIds);
  
          // After successfully fetching comments, sort them
          this.sortComments(deckId, sortBy);
        } catch (error) {
          this.error = error instanceof Error ? error.message : "Error fetching comments";
          throw error;
        } finally {
          this.loading = false;
  
          const currentPagination = this.pagination.get(deckId);
          if (currentPagination) {
            currentPagination.isLoading = false;
            this.pagination.set(deckId, currentPagination);
          }
        }
      },
  
      async createComment(deckId: string, content: string, parentId?: string) {
        const authStore = useAuthStore();
        if (!authStore.userProfile) throw new Error("Must be logged in to comment");
  
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
            // Update comments map
            const deckComments = this.comments.get(deckId) || [];
            this.comments.set(deckId, [data, ...deckComments]);
            this.commentLikes.set(data.id, new Set());
  
            // If it's a parent comment (not a reply), update sortedComments too
            if (!parentId) {
              const sortedComments = this.sortedComments.get(deckId) || [];
              this.sortedComments.set(deckId, [data, ...sortedComments]);
  
              // Update comment count in pagination
              const pagination = this.pagination.get(deckId) || {
                currentPage: 1,
                hasMore: false,
                isLoading: false,
                totalCount: 0,
              };
              pagination.totalCount = (pagination.totalCount || 0) + 1;
              this.pagination.set(deckId, pagination);
            }
  
            return data;
          }
        } catch (error) {
          this.error = error instanceof Error ? error.message : "Error creating comment";
          throw error;
        }
      },
  
      async updateComment(commentId: string, content: string) {
        const authStore = useAuthStore();
        if (!authStore.userProfile) throw new Error("Must be logged in to update comment");
  
        try {
          // First verify ownership
          const { data: existingComment, error: verifyError } = await supabase
            .from("comments")
            .select("user_id")
            .eq("id", commentId)
            .single();
  
          if (verifyError) throw verifyError;
          if (!existingComment) throw new Error("Comment not found");
          if (existingComment.user_id !== authStore.userProfile.id) {
            throw new Error("Unauthorized to edit this comment");
          }
  
          // Then proceed with update
          const { data, error } = await supabase
            .from("comments")
            .update({
              content,
              edited_at: new Date().toISOString(),
            })
            .eq("id", commentId)
            .select()
            .single();
  
          if (error) throw error;
          if (data) {
            // Update in comments map
            for (const [deckId, comments] of this.comments.entries()) {
              const index = comments.findIndex(c => c.id === commentId);
              if (index !== -1) {
                const updatedComments = [...comments];
                updatedComments[index] = data;
                this.comments.set(deckId, updatedComments);
  
                // If it's a parent comment, also update sortedComments
                if (!data.parent_id) {
                  const sortedComments = this.sortedComments.get(deckId) || [];
                  const sortedIndex = sortedComments.findIndex(c => c.id === commentId);
                  if (sortedIndex !== -1) {
                    const updatedSortedComments = [...sortedComments];
                    updatedSortedComments[sortedIndex] = data;
                    this.sortedComments.set(deckId, updatedSortedComments);
                  }
                }
                break;
              }
            }
            return data;
          }
        } catch (error) {
          this.error = error instanceof Error ? error.message : "Error updating comment";
          throw error;
        }
      },
  
      async deleteComment(commentId: string, deckId: string) {
        const authStore = useAuthStore();
        if (!authStore.userProfile) throw new Error("Must be logged in to delete comment");
  
        try {
          // First verify ownership
          const { data: existingComment, error: verifyError } = await supabase
            .from("comments")
            .select("user_id")
            .eq("id", commentId)
            .single();
  
          if (verifyError) throw verifyError;
          if (!existingComment) throw new Error("Comment not found");
          if (existingComment.user_id !== authStore.userProfile.id) {
            throw new Error("Unauthorized to delete this comment");
          }
  
          // Then proceed with optimistic update and deletion
          const deckComments = this.comments.get(deckId) || [];
          // @ts-ignore - Ignoring deep type instantiation error
          const updatedComments = deckComments.filter(c => c.id !== commentId && c.parent_id !== commentId);
          this.comments.set(deckId, updatedComments);
  
          // Update sortedComments
          const sortedComments = this.sortedComments.get(deckId) || [];
          const updatedSortedComments = sortedComments.filter(c => c.id !== commentId);
          this.sortedComments.set(deckId, updatedSortedComments);
  
          // Update comment count in pagination
          const pagination = this.pagination.get(deckId);
          if (pagination && pagination.totalCount) {
            pagination.totalCount--;
            this.pagination.set(deckId, pagination);
          }
  
          this.commentLikes.delete(commentId);
  
          // Then send request to backend
          const { error } = await supabase
            .from("comments")
            .delete()
            .eq("id", commentId)
            .eq("user_id", authStore.userProfile.id);
  
          if (error) {
            // If there's an error, rollback the optimistic updates
            this.comments.set(deckId, deckComments);
            this.sortedComments.set(deckId, sortedComments);
            if (pagination && pagination.totalCount) {
              pagination.totalCount++;
              this.pagination.set(deckId, pagination);
            }
            throw error;
          }
        } catch (error) {
          this.error = error instanceof Error ? error.message : "Error deleting comment";
          throw error;
        }
      },
  
      // Comment Likes
      async fetchCommentLikes(commentIds: string[]) {
        const authStore = useAuthStore();
        if (!authStore.userProfile) return;
  
        try {
          const { data, error } = await supabase
            .from("comment_likes")
            .select("comment_id")  // Only select the comment_id field
            .in("comment_id", commentIds)
            .eq("user_id", authStore.userProfile.id);
  
          if (error) throw error;
          
          // Initialize all comments as not liked
          commentIds.forEach(id => this.commentLikes.set(id, new Set()));
          
          // Mark liked comments
          if (data) {
            data.forEach(like => {
              const likes = this.commentLikes.get(like.comment_id) || new Set();
              likes.add(authStore.userProfile!.id);
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
          // Update local state optimistically
          for (const [_deckId, comments] of this.comments.entries()) {
            const comment = comments.find(c => c.id === commentId);
            if (comment) {
              comment.likes_count += hasLiked ? -1 : 1;
              // Don't re-sort here
              break;
            }
          }
  
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
          // Rollback optimistic update on error
          for (const [_deckId, comments] of this.comments.entries()) {
            const comment = comments.find(c => c.id === commentId);
            if (comment) {
              comment.likes_count += hasLiked ? 1 : -1;
              break;
            }
          }
          this.error = error instanceof Error ? error.message : "Error toggling comment like";
          throw error;
        }
      },

      sortComments(deckId: string, sortBy: 'newest' | 'likes') {
        const comments = this.comments.get(deckId) || [];
        const parentComments = comments.filter((comment) => !comment.parent_id);
        
        let sortedComments;
        if (sortBy === 'likes') {
          sortedComments = parentComments.sort((a, b) => {
            const likeDiff = b.likes_count - a.likes_count;
            return likeDiff !== 0 ? likeDiff : 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        } else {
          sortedComments = parentComments.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        
        this.sortedComments.set(deckId, sortedComments);
      },
  },
});