<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-center bg-black/50" @click="closeModal">
        <div
            class="relative w-[400px] h-fit mt-24 bg-neutral-900 rounded-lg shadow-xl border border-neutral-800 motion-translate-y-in-[-3%] motion-opacity-in-[0%] motion-duration-[0.2s]"
            @click.stop>
            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
                <h2 class="text-xl font-semibold">Delete this deck?</h2>
                <button @click="closeModal" class="p-2 transition-colors rounded-lg hover:bg-neutral-800">
                    <X :size="20" />
                </button>
            </div>

            <!-- Content area -->
            <div class="p-6">
                <p class="text-sm">
                    <span class="block">Are you sure you want to delete this deck?</span>
                    <span class="block">This action cannot be undone.</span>
                </p>
            </div>

            <!-- Footer -->
            <div class="flex justify-end gap-2 px-5 py-3 border-t border-neutral-800">
                <button @click="closeModal" class="w-24 button-lighter" :disabled="loading">
                    Cancel
                </button>
                <button @click="handleDelete" class="w-24 button-cancel-visible" :disabled="loading">
                    <LoadingSpinner v-if="loading" class="w-5 h-5" />
                    <span v-else>Delete</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { X } from 'lucide-vue-next';
import LoadingSpinner from '../../common/LoadingSpinner.vue';

const isOpen = ref(false);
const loading = ref(false);

const emit = defineEmits<{
    (e: 'confirm'): void
}>();

const openModal = () => {
    isOpen.value = true;
};

const closeModal = () => {
    if (loading.value) return;
    isOpen.value = false;
};

const handleDelete = async () => {
    if (loading.value) return;
    loading.value = true;

    try {
        emit('confirm');
    } finally {
        loading.value = false;
        closeModal();
    }
};

defineExpose({ openModal, closeModal });
</script>