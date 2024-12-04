<template>
  <Modal @close="closeModal">
    <template #title>
      Generate Card Content
    </template>

    <template #content>
      <div class="space-y-2">
        <label class="block text-sm text-neutral-400">Enter your prompt:</label>
        <textarea v-model="prompt" class="w-full h-32 resize-none input-lighter-filled"
          placeholder="Enter your prompt here..." />
      </div>
    </template>

    <template #footer>
      <button @click="closeModal" class="w-24 button-lighter" :disabled="isLoading">
        Cancel
      </button>
      <button @click="generateContent" class="w-24 button-accept-visible" :disabled="isLoading">
        <LoadingSpinner v-if="isLoading" class="w-5 h-5" />
        <span v-else>Generate</span>
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, } from 'vue';
import { geminiService } from '../../../utils/geminiService';
import Modal from '../../common/Modal.vue';
import LoadingSpinner from '../../common/LoadingSpinner.vue';

const prompt = ref('');
const isLoading = ref(false);

const emit = defineEmits<{
  (e: 'generated', frontContent: string, backContent: string): void;
  (e: 'close'): void;
}>();

const closeModal = () => {
  if (isLoading.value) return;
  prompt.value = '';
  emit('close');
};

const generateContent = async () => {
  if (!prompt.value.trim()) return;

  const prePrompt = `You are helping to create a flashcard. Follow these strict HTML formatting rules:
1. Only use these HTML tags: <p>, <b>, <i>, <u>, <h1>, <h2>
2. Every piece of text must be inside a <p> tag
3. Never use empty tags or self-closing tags
4. Never use line breaks (<br>) or empty paragraphs
5. Always close all tags properly
6. Do not nest headings inside paragraphs
7. Do not include any HTML comments
8. Do not include any attributes in the tags
9. Do not include any text that suggests you are making the front or back of the card.

Example of good format:
<h1>Title</h1>
<p>This is a paragraph with <b>bold</b> and <i>italic</i> text.</p>
<p>Another paragraph.</p>

For the front of the card: Make it clear and concise, and ensure not to reveal or even hint at the answer on the front of the card. If the prompt is a question, make sure it is not too long. If it is language related for vocab, try to include just the word or phrase as a header. Example: <h1>Word</h1>
For the back of the card: Provide a focused answer using paragraphs with proper formatting.`;

  try {
    isLoading.value = true;
    const frontContent = await geminiService.generateContent(
      `${prePrompt}\nCreate the front of the flashcard for this topic, remember to not reveal or hint at the answer on the front of the card: ${prompt.value}`
    );
    const backContent = await geminiService.generateContent(
      `${prePrompt}\nThe front of the flashcard shows: ${frontContent}\nNow create the back of the flashcard that appropriately answers this: ${prompt.value}`
    );
    emit('generated', frontContent, backContent);
  } catch (error) {
    console.error('Failed to generate content:', error);
  } finally {
    isLoading.value = false;
    closeModal();
  }
};
</script>