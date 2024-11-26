<template>
    <Modal v-if="isOpen" @close="closeModal">
        <template #title>
            {{ title }}
        </template>

        <template #content>
            <div class="flex items-center gap-4">
                <AlertTriangle class="flex-shrink-0 w-8 h-8 text-yellow-500" />
                <p class="text-sm text-neutral-400">
                    <span class="block">{{ mainMessage }}</span>
                    <span class="block">{{ subMessage }}</span>
                </p>
            </div>
        </template>

        <template #footer>
            <button @click="closeModal" class="w-24 button-lighter" :disabled="loading">
                Cancel
            </button>
            <div class="relative">
                <button @mousedown="startDelete" @mouseup="cancelDelete" @mouseleave="cancelDelete"
                    class="w-24 button-cancel-visible relative overflow-hidden active:scale-[0.97] transition-transform"
                    :disabled="loading">
                    <LoadingSpinner v-if="loading" class="w-5 h-5" />
                    <span v-else class="relative z-10">{{ isHolding ? 'Hold...' : 'Delete' }}</span>
                    <div class="absolute inset-0 bg-white opacity-30" :class="[
                        isHolding ? 'transition-[width] duration-[600ms] ease-in' : 'transition-[width] duration-150',
                    ]" :style="{ width: `${holdProgress}%` }" />
                </button>
            </div>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import { ref, onUnmounted, onMounted } from 'vue';
import Modal from './Modal.vue';
import LoadingSpinner from './LoadingSpinner.vue';
import { AlertTriangle } from 'lucide-vue-next';

const isOpen = ref(false);
const loading = ref(false);
const holdProgress = ref(0);
const holdTimer = ref<number | null>(null);
const isHolding = ref(false);
const isMobile = ref(false);

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

const checkMobile = () => {
    isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

onMounted(() => {
    checkMobile();
});

const startDelete = () => {
    if (loading.value) return;

    if (isMobile.value) {
        handleDelete();
        return;
    }

    isHolding.value = true;
    holdProgress.value = 0;

    // Small delay to ensure the initial 0% is registered
    requestAnimationFrame(() => {
        holdProgress.value = 100;
    });

    holdTimer.value = window.setTimeout(() => {
        handleDelete();
    }, 600);
};

const cancelDelete = () => {
    if (holdTimer.value) {
        clearTimeout(holdTimer.value);
        holdTimer.value = null;
    }
    isHolding.value = false;
    holdProgress.value = 0;
};

onUnmounted(() => {
    if (holdTimer.value) clearTimeout(holdTimer.value);
});

defineExpose({ openModal, closeModal });

defineProps<{
    title: string;
    mainMessage: string;
    subMessage: string;
}>();
</script>