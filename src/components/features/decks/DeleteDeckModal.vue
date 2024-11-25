<template>
    <Modal v-if="isOpen" @close="closeModal">
        <template #title>
            Delete this deck?
        </template>

        <template #content>
            <p class="text-sm">
                <span class="block">Are you sure you want to delete this deck?</span>
                <span class="block">This action cannot be undone.</span>
            </p>
        </template>

        <template #footer>
            <button @click="closeModal" class="w-24 button-lighter" :disabled="loading">
                Cancel
            </button>
            <button @click="handleDelete" class="w-24 button-cancel-visible" :disabled="loading">
                <LoadingSpinner v-if="loading" class="w-5 h-5" />
                <span v-else>Delete</span>
            </button>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Modal from '../../common/Modal.vue';
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