<script setup lang="ts">
import { ref } from 'vue';
import { useUsersStore } from '../../../stores/usersStore';
import { Pencil, Trash2, Heart, MessageSquare } from 'lucide-vue-next';

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

// Comment handlers
const addComment = async () => {
    if (!props.deckId || !newComment.value) return;
    try {
        await usersStore.createComment(props.deckId, newComment.value);
        newComment.value = '';
    } catch (error) {
        console.error('Failed to create comment:', error);
    }
};

const startEditComment = (comment: any) => {
    editingComment.value = comment.id;
    editCommentContent.value = comment.content;
};

const updateComment = async () => {
    if (!editingComment.value || !editCommentContent.value) return;
    try {
        await usersStore.updateComment(editingComment.value, editCommentContent.value);
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
    if (!props.deckId || !replyingTo.value || !replyContent.value) return;
    try {
        await usersStore.createComment(props.deckId, replyContent.value, replyingTo.value);
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
</script>

<template>
    <div
        class="!mt-8 space-y-2">
        <!-- Add Comment -->
        <div class="flex gap-2">
            <textarea v-model="newComment" placeholder="Add a comment..." @keydown="handleNewCommentKeydown"
                rows="1" @input="(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    const newHeight = Math.max(40, target.scrollHeight);
                    target.style.height = newHeight + 'px';
                }"
                class="flex-1 min-h-[40px] max-h-[200px] input-filled resize-none overflow-hidden" />
            <button @click="addComment" :disabled="!newComment" class="w-24 h-10 button-visible">
                Comment
            </button>
        </div>

        <!-- Comments List -->
        <div class="space-y-2">
            <div v-for="comment in usersStore.getThreadedComments(props.deckId)" :key="comment.id"
                class="p-3 space-y-3 panel motion-translate-y-in-[-5%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
                <!-- Comment Header -->
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <router-link :to="`/user/${comment.user_id}`" class="transition-opacity hover:opacity-80">
                            <img :src="usersStore.getUserProfile(comment.user_id)?.avatar_url || '/default-avatar.png'"
                                :alt="usersStore.getUserProfile(comment.user_id)?.username"
                                class="w-8 h-8 rounded-full bg-neutral-700" />
                        </router-link>
                        <div class="flex flex-col">
                            <router-link :to="`/user/${comment.user_id}`"
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
                            @click="usersStore.deleteComment(comment.id, props.deckId)"
                            class="p-1 text-neutral-400 hover:text-red-400">
                            <Trash2 :size="17" />
                        </button>
                        <button @click="replyingTo = comment.id" class="p-1 text-neutral-400 hover:text-neutral-300">
                            <MessageSquare :size="17" />
                        </button>
                        <button @click="toggleCommentLike(comment.id)" class="flex items-center gap-1.5 p-1" :class="{
                            'text-pink-400': usersStore.hasLikedComment(comment.id),
                            'text-neutral-400 hover:text-neutral-300': !usersStore.hasLikedComment(comment.id)
                        }">
                            <Heart :size="17" />
                            <span class="text-sm leading-none">{{ comment.likes_count }}</span>
                        </button>
                    </div>
                </div>

                <!-- Comment Content -->
                <div>
                    <div v-if="editingComment === comment.id" class="motion-translate-y-in-[-3%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
                        <textarea v-model="editCommentContent" @keydown="handleEditKeydown"
                            class="w-full h-20 resize-none input-lighter-filled" rows="3" />
                        <div class="flex justify-end gap-2 mt-1">
                            <button @click="editingComment = null" class="w-24 button-lighter-visible">
                                Cancel
                            </button>
                            <button @click="updateComment" class="w-24 button-lighter-visible">
                                Save
                            </button>
                        </div>
                    </div>
                    <div v-else class="flex-1 pl-1 break-words whitespace-pre-wrap">
                        {{ comment.content }}
                    </div>
                </div>

                <!-- Reply Input -->
                <div v-if="replyingTo === comment.id" class="motion-translate-y-in-[-3%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
                    <textarea v-model="replyContent" placeholder="Write a reply..." @keydown="handleReplyKeydown"
                        class="w-full h-20 resize-none input-lighter-filled" rows="3" />
                    <div class="flex justify-end gap-2 mt-1">
                        <button @click="replyingTo = null" class="w-24 button-lighter-visible">
                            Cancel
                        </button>
                        <button @click="addReply" :disabled="!replyContent" class="w-24 button-lighter-visible">
                            Reply
                        </button>
                    </div>
                </div>

                <!-- Replies -->
                <div v-if="usersStore.getCommentReplies(comment.id, props.deckId).length > 0" class="space-y-2">
                    <div v-for="reply in usersStore.getCommentReplies(comment.id, props.deckId)" :key="reply.id"
                        class="p-3 rounded-lg bg-neutral-800 motion-translate-y-in-[-5%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
                        <!-- Reply Header -->
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2">
                                <router-link :to="`/user/${reply.user_id}`" class="transition-opacity hover:opacity-80">
                                    <img :src="usersStore.getUserProfile(reply.user_id)?.avatar_url || '/default-avatar.png'"
                                        :alt="usersStore.getUserProfile(reply.user_id)?.username"
                                        class="w-6 h-6 rounded-full bg-neutral-700" />
                                </router-link>
                                <router-link :to="`/user/${reply.user_id}`"
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
                            <div class="flex items-center gap-1"
                                v-if="reply.user_id === usersStore.getCurrentUserProfile?.id">
                                <button @click="startEditComment(reply)"
                                    class="p-1 text-neutral-400 hover:text-neutral-300">
                                    <Pencil :size="14" />
                                </button>
                                <button @click="usersStore.deleteComment(reply.id, props.deckId)"
                                    class="p-1 text-neutral-400 hover:text-red-400">
                                    <Trash2 :size="14" />
                                </button>
                            </div>
                        </div>

                        <!-- Reply Content -->
                        <div v-if="editingComment === reply.id" class="motion-translate-y-in-[-3%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
                            <textarea v-model="editCommentContent" @keydown="handleEditKeydown"
                                class="w-full h-20 resize-none input-lighter-filled" rows="3" />
                            <div class="flex justify-end gap-2 mt-1">
                                <button @click="editingComment = null" class="w-24 button-lighter-visible">
                                    Cancel
                                </button>
                                <button @click="updateComment" class="w-24 button-lighter-visible">
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
        </div>
    </div>
</template>