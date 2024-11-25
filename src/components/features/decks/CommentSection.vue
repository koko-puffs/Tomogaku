<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useUsersStore } from '../../../stores/usersStore';
import { Pencil, Trash2, Heart } from 'lucide-vue-next';
import LoadingSpinner from '../../common/LoadingSpinner.vue';
import DeleteModal from '../../common/DeleteModal.vue';

const props = defineProps<{
    deckId: string;
}>();

const usersStore = useUsersStore();

// Comment state
const newComment = ref('');
const editingComment = ref<string | null>(null);
const editCommentContent = ref('');
const replyingTo = ref<string | null>(null);
const replyContent = ref('');

// Add sort state
const sortBy = ref<'newest' | 'likes'>('likes');

// Add ref for the modal and comment to delete
const deleteModalRef = ref<InstanceType<typeof DeleteModal> | null>(null);
const commentToDelete = ref<string | null>(null);

// Comment handlers
const addComment = async () => {
    if (!props.deckId || !newComment.value.trim()) return;
    try {
        await usersStore.createComment(props.deckId, newComment.value.trim());
        newComment.value = '';
        // Reset textarea height
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) {
            textarea.style.height = '40px';
            textarea.classList.add('rounded-r-none', 'border-r-0', 'hover:border-r', 'focus:border-r');
            textarea.classList.remove('mr-2');
            const button = textarea.nextElementSibling as HTMLElement;
            button?.classList.add('rounded-l-none');
        }
    } catch (error) {
        console.error('Failed to create comment:', error);
    }
};

const startEditComment = (comment: any) => {
    editingComment.value = comment.id;
    editCommentContent.value = comment.content;
};

const updateComment = async () => {
    if (!editingComment.value || !editCommentContent.value.trim()) return;
    try {
        await usersStore.updateComment(editingComment.value, editCommentContent.value.trim());
        editingComment.value = null;
        editCommentContent.value = '';
    } catch (error) {
        console.error('Failed to update comment:', error);
    }
};

const toggleCommentLike = async (commentId: string) => {
    try {
        await usersStore.toggleCommentLike(commentId);
    } catch (error) {
        console.error('Failed to toggle like:', error);
    }
};

const addReply = async () => {
    if (!props.deckId || !replyingTo.value || !replyContent.value.trim()) return;
    try {
        await usersStore.createComment(props.deckId, replyContent.value.trim(), replyingTo.value);
        replyContent.value = '';
        replyingTo.value = null;
    } catch (error) {
        console.error('Failed to create reply:', error);
    }
};

// Add these new methods
const handleNewCommentKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        addComment();
    }
};

const handleEditKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        updateComment();
    }
};

const handleReplyKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        addReply();
    }
};

// Load more comments handler
const loadMoreComments = async () => {
    const pagination = usersStore.getCommentsPagination(props.deckId);
    if (pagination.isLoading || !pagination.hasMore) return;
    
    try {
        await usersStore.fetchDeckCommentsWithProfiles(
            props.deckId,
            pagination.currentPage + 1,
            10,
            sortBy.value
        );
    } catch (error) {
        console.error('Failed to load more comments:', error);
    }
};

// Update watch for sortBy
watch(sortBy, async () => {
    // Reset pagination
    usersStore.commentsPagination.set(props.deckId, {
        currentPage: 1,
        hasMore: true,
        isLoading: false,
    });
    // Fetch comments with new sort
    await usersStore.fetchDeckCommentsWithProfiles(props.deckId, 1, 10, sortBy.value);
    // Explicitly sort comments after fetching
    usersStore.sortComments(props.deckId, sortBy.value);
});

// Initial load
onMounted(async () => {
    await usersStore.fetchDeckCommentsWithProfiles(props.deckId, 1, 10, sortBy.value);
});

// Replace direct deletion with modal
const handleDeleteComment = (commentId: string) => {
    commentToDelete.value = commentId;
    deleteModalRef.value?.openModal();
};

// Add confirmation handler
const confirmDeleteComment = async () => {
    if (commentToDelete.value) {
        await usersStore.deleteComment(commentToDelete.value, props.deckId);
        commentToDelete.value = null;
    }
};
</script>

<template>
    <div class="space-y-2">
        <!-- Sort Controls -->
        <div class="flex items-center justify-between motion-translate-y-in-[-10%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
            <!-- Comment Count -->
            <span class="pl-2 text-sm text-neutral-400">
                {{ usersStore.getCommentsPagination(props.deckId).totalCount || 0 }} Comments
            </span>

            <!-- Sort Buttons -->
            <div class="flex text-sm">
                <button 
                    @click="sortBy = 'newest'"
                    class="px-3 py-1.5 rounded-lg transition-colors duration-75"
                    :class="sortBy === 'newest' 
                        ? 'bg-neutral-400/10 text-neutral-200' 
                        : 'text-neutral-400 hover:text-neutral-200'">
                    Newest
                </button>
                <button 
                    @click="sortBy = 'likes'"
                    class="px-3 py-1.5 rounded-lg transition-colors duration-75"
                    :class="sortBy === 'likes' 
                        ? 'bg-neutral-400/10 text-neutral-200' 
                        : 'text-neutral-400 hover:text-neutral-200'">
                    Most Liked
                </button>
            </div>
        </div>

        <!-- Add Comment -->
        <div class="flex motion-translate-y-in-[-10%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
            <textarea v-model="newComment" placeholder="Add a comment..." @keydown="handleNewCommentKeydown"
                rows="1" @input="(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    const newHeight = Math.max(40, target.scrollHeight);
                    target.style.height = newHeight + 'px';
                    
                    // Update classes based on height
                    const button = target.nextElementSibling as HTMLElement;
                    if (newHeight > 40) {
                        target.classList.remove('rounded-r-none', 'border-r-0', 'hover:border-r', 'focus:border-r');
                        target.classList.add('mr-2');
                        button?.classList.remove('rounded-l-none');
                    } else {
                        target.classList.add('rounded-r-none', 'border-r-0', 'hover:border-r', 'focus:border-r');
                        target.classList.remove('mr-2');
                        button?.classList.add('rounded-l-none');
                    }
                }"
                class="flex-1 min-h-[40px] input-filled resize-none overflow-hidden rounded-r-none border-r-0 hover:border-r focus:border-r" />
            <button @click="addComment" 
                :disabled="!newComment.trim()" 
                class="w-24 h-10 rounded-l-none button-visible"
                :class="{ 'text-neutral-600 pointer-events-none': !newComment.trim() }">
                Comment
            </button>
        </div>

        <!-- Loading State -->
        <div v-if="usersStore.loading.comments" class="flex items-center justify-center py-10 text-neutral-500">
            <LoadingSpinner size="32" />
        </div>

        <!-- Comments List -->
        <div v-else class="space-y-2">
            <div v-for="comment in usersStore.getThreadedComments(props.deckId)" :key="comment.id"
                class="p-3 space-y-3 panel motion-translate-y-in-[-4%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
                <!-- Comment Header -->
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <router-link :to="`/discover/user/${comment.user_id}`" class="transition-opacity hover:opacity-80">
                            <img :src="usersStore.getUserProfile(comment.user_id)?.avatar_url"
                                :alt="usersStore.getUserProfile(comment.user_id)?.username"
                                class="w-8 h-8 rounded-full bg-neutral-700" />
                        </router-link>
                        <div class="flex flex-col">
                            <router-link :to="`/discover/user/${comment.user_id}`"
                                class="text-sm font-medium transition-colors hover:text-neutral-300">
                                {{ usersStore.getUserProfile(comment.user_id)?.username || 'Anonymous' }}
                            </router-link>
                            <span class="text-xs text-neutral-400">
                                {{ new Date(comment.created_at).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                }) }}
                                at
                                {{ new Date(comment.created_at).toLocaleTimeString(undefined, {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) }}
                                {{ comment.edited_at ? '(edited)' : '' }}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-start gap-1">
                        <button v-if="comment.user_id === usersStore.getCurrentUserProfile?.id"
                            @click="startEditComment(comment)" class="p-1 text-neutral-400 hover:text-neutral-300">
                            <Pencil :size="17" />
                        </button>
                        <button v-if="comment.user_id === usersStore.getCurrentUserProfile?.id"
                            @click="handleDeleteComment(comment.id)"
                            class="p-1 text-neutral-400 hover:text-red-400">
                            <Trash2 :size="17" />
                        </button>
                        <button @click="toggleCommentLike(comment.id)" 
                            class="flex items-center gap-1.5 p-1 group active:scale-90 transition-transform">
                            <Heart :size="17" :class="{
                                'text-rose-400 fill-rose-400': usersStore.hasLikedComment(comment.id),
                                'text-neutral-400 group-hover:text-neutral-300': !usersStore.hasLikedComment(comment.id)
                            }" />
                            <span class="text-sm leading-none -mb-0.5" :class="{
                                'text-rose-400': usersStore.hasLikedComment(comment.id),
                                'text-neutral-400 group-hover:text-neutral-300': !usersStore.hasLikedComment(comment.id)
                            }">{{ comment.likes_count }}</span>
                        </button>
                    </div>
                </div>

                <!-- Comment Content -->
                <div class="flex items-end gap-4">
                    <div v-if="editingComment === comment.id" class="flex-1 min-w-0 motion-translate-y-in-[-3%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
                        <textarea v-model="editCommentContent" @keydown="handleEditKeydown"
                            class="w-full h-32 resize-none input-lighter-filled" rows="3" />
                        <div class="flex justify-end gap-2 mt-1">
                            <button @click="editingComment = null" class="w-24 button-lighter">
                                Cancel
                            </button>
                            <button @click="updateComment" 
                                :disabled="!editCommentContent.trim() || editCommentContent.trim() === comment.content.trim()"
                                class="w-24 button-lighter-visible"
                                :class="{ 'text-neutral-600 pointer-events-none': !editCommentContent.trim() || editCommentContent.trim() === comment.content.trim() }">
                                Save
                            </button>
                        </div>
                    </div>
                    <div v-else class="flex-1 min-w-0 pl-1 break-words whitespace-pre-wrap">
                        {{ comment.content }}
                    </div>
                    <button v-if="replyingTo !== comment.id && editingComment !== comment.id"
                        @click="replyingTo = comment.id" 
                        class="flex-shrink-0 pr-1 text-sm text-neutral-400 hover:text-neutral-300">
                        Reply
                    </button>
                </div>

                <!-- Add Reply Input when replying -->
                <div v-if="replyingTo === comment.id" 
                    class="mt-2 motion-translate-y-in-[-3%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
                    <textarea 
                        v-model="replyContent" 
                        @keydown="handleReplyKeydown"
                        placeholder="Write a reply..."
                        class="w-full resize-none input-lighter-filled flex-1 min-h-[40px] overflow-hidden" 
                        rows="1"
                        @input="(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = Math.max(40, target.scrollHeight) + 'px';
                        }"
                    />
                    <div class="flex justify-end gap-2 mt-1">
                        <button @click="replyingTo = null" class="w-24 button-lighter">
                            Cancel
                        </button>
                        <button @click="addReply" 
                            :disabled="!replyContent.trim()" 
                            class="w-24 button-lighter-visible"
                            :class="{ 'text-neutral-600 pointer-events-none': !replyContent.trim()  }">
                            Reply
                        </button>
                    </div>
                </div>

                <!-- Replies -->
                <div v-if="usersStore.getCommentReplies(comment.id, props.deckId).length > 0" class="space-y-2">
                    <div v-for="reply in usersStore.getCommentReplies(comment.id, props.deckId)" :key="reply.id"
                        class="p-3 rounded-lg bg-neutral-800/70 motion-translate-y-in-[-5%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
                        <!-- Reply Header -->
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2">
                                <router-link :to="`/discover/user/${reply.user_id}`" class="transition-opacity hover:opacity-80">
                                    <img :src="usersStore.getUserProfile(reply.user_id)?.avatar_url"
                                        :alt="usersStore.getUserProfile(reply.user_id)?.username"
                                        class="w-6 h-6 rounded-full bg-neutral-700" />
                                </router-link>
                                <router-link :to="`/discover/user/${reply.user_id}`"
                                    class="text-xs font-medium transition-colors hover:text-neutral-300">
                                    {{ usersStore.getUserProfile(reply.user_id)?.username || 'Anonymous' }}
                                </router-link>
                                <span class="text-xs text-neutral-400">
                                    {{ new Date(reply.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    }) }}
                                    at
                                    {{ new Date(reply.created_at).toLocaleTimeString(undefined, {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) }}
                                    {{ reply.edited_at ? '(edited)' : '' }}
                                </span>
                            </div>
                            <!-- Reply Actions -->
                            <div class="flex items-center gap-1">
                                <button v-if="reply.user_id === usersStore.getCurrentUserProfile?.id"
                                    @click="startEditComment(reply)"
                                    class="p-1 text-neutral-400 hover:text-neutral-300">
                                    <Pencil :size="17" />
                                </button>
                                <button v-if="reply.user_id === usersStore.getCurrentUserProfile?.id"
                                    @click="handleDeleteComment(reply.id)"
                                    class="p-1 text-neutral-400 hover:text-red-400">
                                    <Trash2 :size="17" />
                                </button>
                                <button @click="toggleCommentLike(reply.id)" 
                                    class="flex items-center gap-1.5 p-1 group active:scale-90 transition-transform">
                                    <Heart :size="17" :class="{
                                        'text-rose-400 fill-rose-400': usersStore.hasLikedComment(reply.id),
                                        'text-neutral-400 group-hover:text-neutral-300': !usersStore.hasLikedComment(reply.id)
                                    }" />
                                    <span class="text-sm leading-none -mb-0.5" :class="{
                                        'text-rose-400': usersStore.hasLikedComment(reply.id),
                                        'text-neutral-400 group-hover:text-neutral-300': !usersStore.hasLikedComment(reply.id)
                                    }">{{ reply.likes_count }}</span>
                                </button>
                            </div>
                        </div>

                        <!-- Reply Content -->
                        <div v-if="editingComment === reply.id" class="motion-translate-y-in-[-3%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
                            <textarea v-model="editCommentContent" @keydown="handleEditKeydown"
                                class="w-full h-32 resize-none input-lighter-filled" rows="3" />
                            <div class="flex justify-end gap-2 mt-1">
                                <button @click="editingComment = null" class="w-24 button-lighter">
                                    Cancel
                                </button>
                                <button @click="updateComment" 
                                    :disabled="!editCommentContent.trim() || editCommentContent.trim() === reply.content.trim()"
                                    class="w-24 button-lighter-visible"
                                    :class="{ 'text-neutral-600 pointer-events-none': !editCommentContent.trim() || editCommentContent.trim() === reply.content.trim() }">
                                    Save
                                </button>
                            </div>
                        </div>
                        <div v-else class="pl-1 break-words whitespace-pre-wrap">
                            {{ reply.content }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Load More Button -->
            <div v-if="usersStore.getCommentsPagination(props.deckId).hasMore"
                 class="flex justify-center pt-2">
                <button @click="loadMoreComments"
                        :disabled="usersStore.getCommentsPagination(props.deckId).isLoading"
                        class="px-4 button-lighter">
                    <template v-if="usersStore.getCommentsPagination(props.deckId).isLoading">
                        <LoadingSpinner size="16" class="inline mr-2" />
                        Loading...
                    </template>
                    <template v-else>Load More Comments</template>
                </button>
            </div>
        </div>

        <!-- Add the modal at the bottom of the template -->
        <DeleteModal 
            ref="deleteModalRef"
            @confirm="confirmDeleteComment"
            title="Delete Comment?"
            mainMessage="Deleting this comment will also delete all the replies to it."
            subMessage="This action cannot be undone."
        />
    </div>
</template>