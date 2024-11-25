<template>
    <Modal v-if="isOpen" @close="closeModal">
        <template #title>
            Are you sure?
        </template>

        <template #content>
            <div class="flex items-center gap-4">
                <AlertTriangle class="flex-shrink-0 w-8 h-8 text-yellow-500" />
                <p class="text-sm text-neutral-400">
                    <span class="block">Deleting this deck will also delete all the cards in it.</span>
                    <span class="block">This action cannot be undone.</span>
                </p>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-between gap-2">
                <button @click="closeModal" class="w-24 button-lighter" :disabled="loading">
                    Cancel
                </button>
                <div class="relative">
                    <button @mousedown="startDelete" @mouseup="cancelDelete" @mouseleave="cancelDelete"
                        class="w-24 button-cancel-visible relative overflow-hidden active:scale-[0.97] transition-transform"
                        :disabled="loading">
                        <LoadingSpinner v-if="loading" class="w-5 h-5" />
                        <span v-else class="relative z-10">{{ isHolding ? 'Deleting...' : 'Delete' }}</span>
                        <div class="absolute inset-0 transition-all duration-75 bg-white opacity-25"
                            :style="{ width: `${holdProgress}%` }" />
                    </button>
                </div>
            </div>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import Modal from '../../common/Modal.vue';
import LoadingSpinner from '../../common/LoadingSpinner.vue';
import { AlertTriangle } from 'lucide-vue-next';

const isOpen = ref(false);
const loading = ref(false);
const holdProgress = ref(0);
const holdTimer = ref<number | null>(null);
const isHolding = ref(false);

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
        holdProgress.value = 0;
        isHolding.value = false;
        closeModal();
    }
};

const startDelete = () => {
    if (loading.value) return;

    isHolding.value = true;
    holdProgress.value = 0;
    const startTime = Date.now();

    holdTimer.value = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        holdProgress.value = Math.min((elapsed / 600) * 100, 100);

        if (holdProgress.value >= 100) {
            clearInterval(holdTimer.value!);
            handleDelete();
        }
    }, 20);
};

const cancelDelete = () => {
    if (holdTimer.value) {
        clearInterval(holdTimer.value);
        holdTimer.value = null;
    }
    isHolding.value = false;
    holdProgress.value = 0;
};

// Clean up timer if component is destroyed
onUnmounted(() => {
    if (holdTimer.value) clearInterval(holdTimer.value);
});

defineExpose({ openModal, closeModal });
</script>