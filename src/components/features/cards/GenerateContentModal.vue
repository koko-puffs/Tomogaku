<template>
    <Modal @close="closeModal">
      <template #title>
        Generate Card Content
      </template>
  
      <template #content>
        <div class="space-y-2">
          <label class="block text-sm text-neutral-400">Enter your prompt:</label>
          <textarea 
            v-model="prompt" 
            class="w-full h-32 resize-none input-lighter-filled"
            placeholder="Enter your prompt here..."
          />
        </div>
      </template>
  
      <template #footer>
        <button @click="closeModal" class="w-24 button-lighter" :disabled="isLoading">
          Cancel
        </button>
        <button @click="generateContent" class="w-24 button-yellow-visible" :disabled="isLoading">
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
  
    const prePrompt = `You are helping to create a flashcard. Format your response using HTML with <p> tags. Do not include any other text than the HTML tags and what you are asked to do.
For the front of the card: Make it clear and concise, and ensure not to reveal or even hint at the answer on the front of the card. If the prompt is a question, make sure it is not too long. If it is language related for vocab, try to include just the word or phrase as a header. Example: <h1>Word</h1>
For the back of the card: Provide a comprehensive but focused answer. Example: <p>Definition</p><p>Example sentence (in the same language as the word, with a translation if needed)</p>
Keep the content educational and accurate. Format the answer using HTML with <p> tags. Use bold, italics and underline where appropriate, meaning <b>, <i>, <u>, as well as <h1> and <h2>. And do not include \`\`\`html or \`\`\` at the beginning or end of your response.`;
  
    try {
      isLoading.value = true;
      const frontContent = await geminiService.generateContent(
        `${prePrompt}\nCreate the front of the flashcard for this topic: ${prompt.value}`
      );
      const backContent = await geminiService.generateContent(
        `${prePrompt}\nCreate the back of the flashcard that answers this: ${prompt.value}`
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