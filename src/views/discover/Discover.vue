<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useDeckStore } from '../../stores/deckStore';
import PublicDeckList from '../../components/features/profile/PublicDeckList.vue';
import LoadingSpinner from '../../components/common/LoadingSpinner.vue';
import PageLayout from '../../components/common/PageLayout.vue';
import { ArrowUpDown } from 'lucide-vue-next';

const deckStore = useDeckStore();
const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref('');
const selectedTags = ref<string[]>([]);
const sortBy = ref('most_liked'); // Default sort

const sortOptions = [
  { value: 'most_liked', label: 'Most Liked' },
  { value: 'most_forked', label: 'Most Forked' },
  { value: 'newest', label: 'Newest' },
  { value: 'most_popular', label: 'Most Popular' },
];

const currentPage = ref(1);
const pageSize = ref(20);
const totalDecks = ref(0);

const fetchPublicDecks = async () => {
  loading.value = true;
  error.value = null;
  try {
    const result = await deckStore.fetchPublicDecks({
      searchQuery: searchQuery.value,
      tags: selectedTags.value,
      sortBy: sortBy.value as 'most_liked' | 'most_forked' | 'newest' | 'most_popular',
      page: currentPage.value,
      pageSize: pageSize.value,
    });
    totalDecks.value = result.count || 0;
  } catch (e) {
    error.value = 'Failed to fetch public decks';
  } finally {
    loading.value = false;
  }
};

const totalPages = computed(() => Math.ceil(totalDecks.value / pageSize.value));

const handlePageChange = (newPage: number) => {
  currentPage.value = newPage;
  fetchPublicDecks();
};

onMounted(() => {
  fetchPublicDecks();
});

const filteredDecks = computed(() => {
  return deckStore.decks;
});

// Add refs for dropdown handling
const isSortDropdownOpen = ref(false);
const sortDropdownRef = ref<HTMLElement | null>(null);

// Add click outside handler
const handleClickOutside = (event: MouseEvent) => {
  if (sortDropdownRef.value && !sortDropdownRef.value.contains(event.target as Node)) {
    isSortDropdownOpen.value = false;
  }
};

// Add lifecycle hooks for event listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Add function to handle sort selection
const handleSortSelect = (option: string) => {
  sortBy.value = option;
  isSortDropdownOpen.value = false;
};

// Get display text for current sort
const currentSortText = computed(() => {
  const option = sortOptions.find(opt => opt.value === sortBy.value);
  return option ? option.label : 'Sort';
});
</script>

<template>
  <!-- Gradient overlay -->
  <div class="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-emerald-950/5 to-transparent"></div>
  <PageLayout>
    <!-- Sidebar Slot -->
    <template #sidebar>
      <div class="w-full p-4 space-y-4 panel">
        <!-- Sort Options -->
        <div class="space-y-2">
          <label class="text-sm text-neutral-400">Sort by</label>
          <div class="relative" ref="sortDropdownRef">
            <button 
              @click.stop="isSortDropdownOpen = !isSortDropdownOpen"
              class="flex items-center justify-between w-full px-3 input-lighter-filled"
            >
              <span>{{ currentSortText }}</span>
              <ArrowUpDown :size="16" />
            </button>

            <div 
              v-if="isSortDropdownOpen"
              class="absolute left-0 right-0 z-10 w-full py-2 mt-1 border rounded-lg shadow-xl bg-neutral-900 border-neutral-800 motion-translate-y-in-[-4%] motion-opacity-in-[0%] motion-duration-[0.2s] motion-duration-[0.1s]/opacity"
            >
              <button 
                v-for="option in sortOptions" 
                :key="option.value"
                @click="handleSortSelect(option.value)"
                class="flex items-center w-full px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800"
                :class="{ 'text-white': sortBy === option.value, 'text-neutral-400': sortBy !== option.value }"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Search -->
        <div class="space-y-2">
          <label class="text-sm text-neutral-400">Search</label>
          <input 
            v-model="searchQuery" 
            type="text" 
            class="w-full input-lighter-filled" 
            placeholder="Search decks..."
          >
        </div>

        <!-- Tags Filter -->
        <div class="space-y-2">
          <label class="text-sm text-neutral-400">Tags</label>
          <div class="space-y-1">
            <div v-if="!selectedTags.length" class="pl-1 text-sm text-neutral-500">
              —
            </div>
            <!-- Add tag checkboxes here when implementing tag filtering -->
          </div>
        </div>

        <button @click="fetchPublicDecks" class="w-full button-accept-visible">
          Apply Filters
        </button>
      </div>
    </template>

    <!-- Content Slot -->
    <template #content>
      <div class="space-y-3">
        <h1 class="pl-1 text-2xl font-bold">Discover</h1>

        <!-- Deck List -->
        <div v-if="loading" class="flex justify-center mt-14 text-neutral-500">
          <LoadingSpinner :size="32" class="mt-4"/>
        </div>
        <div v-else-if="error" class="text-center text-red-500">
          {{ error }}
        </div>
        <div v-else class="space-y-4">
          <PublicDeckList :decks="filteredDecks" />
          
          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-4">
            <button 
              v-for="page in totalPages" 
              :key="page"
              @click="handlePageChange(page)"
              class="px-3 py-1 rounded-md"
              :class="[
                currentPage === page 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              ]"
            >
              {{ page }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </PageLayout>
</template>