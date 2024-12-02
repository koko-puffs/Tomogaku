<script setup lang="ts">
import { computed } from 'vue';
interface Props {
  modelValue: boolean;
  disabled?: boolean;
  label?: string;
  color?: 'emerald' | 'pink' | 'grey';
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  label: '',
  color: 'emerald',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const toggle = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
};

const colorClasses = computed(() => {
  const colors = {
    emerald: 'before:bg-emerald-700',
    pink: 'before:bg-pink-700',
    grey: 'before:bg-neutral-700',
  };
  return colors[props.color];
});
</script>

<template>
  <div class="flex items-center">
    <button type="button" role="switch" :aria-checked="modelValue" :disabled="disabled" @click="toggle"
      class="relative inline-flex items-center h-6 rounded-full w-11 bg-neutral-700/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 before:absolute before:inset-0 before:rounded-full before:transition-opacity before:duration-150"
      :class="[
        colorClasses,
        modelValue ? 'before:opacity-100' : 'before:opacity-0',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      ]">
      <span class="sr-only">{{ label }}</span>
      <span
        class="relative inline-block w-4 h-4 transition-transform duration-150 ease-in-out transform bg-white rounded-full"
        :class="[
          modelValue ? 'translate-x-6' : 'translate-x-1',
        ]" />
    </button>
    <label v-if="label" class="ml-3 text-sm text-neutral-300">{{ label }}</label>
  </div>
</template>