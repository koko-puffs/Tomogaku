<script setup lang="ts">
interface Props {
  modelValue: boolean;
  disabled?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  label: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const toggle = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
};
</script>

<template>
  <div class="flex items-center">
    <button type="button" role="switch" :aria-checked="modelValue" :disabled="disabled" @click="toggle"
      class="relative inline-flex items-center h-6 rounded-full w-11 bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 before:absolute before:inset-0 before:rounded-full before:bg-green-700 before:transition-opacity before:duration-150"
      :class="[
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