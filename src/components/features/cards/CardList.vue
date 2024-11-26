<script setup lang="ts">
import { Plus, Filter, ArrowUpDown } from 'lucide-vue-next';
import { useDeckStore } from '../../../stores/deckStore';
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
    deckId: string;
    selectedCard: string | null;
}>();

const emit = defineEmits<{
    'select-card': [cardId: string];
    'create-card': [];
}>();

const deckStore = useDeckStore();

type CardStatus = 'new' | 'learning' | 'review' | 'relearning';

// Add filter state
const showFilters = ref(false);
const searchQuery = ref('');
const selectedTags = ref<string[]>([]);
const selectedStatus = ref<CardStatus[]>([]);

// Add sort state
type SortOption = 'newest' | 'oldest' | 'position' | 'due date';
const sortBy = ref<SortOption>('newest');
const isSortDropdownOpen = ref(false);

// Add refs for dropdown handling
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
const handleSortSelect = (option: SortOption) => {
    sortBy.value = option;
    isSortDropdownOpen.value = false;
};

// Get display text for current sort
const currentSortText = computed(() => {
    switch (sortBy.value) {
        case 'newest': return 'Newest';
        case 'oldest': return 'Oldest';
        case 'position': return 'Position';
        case 'due date': return 'Due date';
        default: return 'Sort';
    }
});

// Filter cards
const filteredCards = computed(() => {
    let cards = deckStore.getCardsByDeckId(props.deckId);
    
    // Apply search filter
    if (searchQuery.value) {
        cards = cards.filter(card => 
            stripHtml(card.front_content).toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            stripHtml(card.back_content).toLowerCase().includes(searchQuery.value.toLowerCase())
        );
    }

    // Apply tag filter
    if (selectedTags.value.length > 0) {
        cards = cards.filter(card => 
            card.tags?.some(tag => selectedTags.value.includes(tag))
        );
    }

    // Apply status filter
    if (selectedStatus.value.length > 0) {
        cards = cards.filter(card => 
            selectedStatus.value.includes(card.status)
        );
    }

    // Apply sorting
    return [...cards].sort((a, b) => {
        switch (sortBy.value) {
            case 'newest':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'oldest':
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'position':
                return (a.position ?? Infinity) - (b.position ?? Infinity);
            case 'due date':
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            default:
                return 0;
        }
    });
});

const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

// Expose the filtered cards to the parent
defineExpose({
  filteredCards
});
</script>

<template>
    <div class="space-y-4">
        <!-- Card List Header -->
        <div class="flex items-center justify-between">
            <h2 class="pl-1 text-xl font-bold">Cards ({{ filteredCards.length }})</h2>
            <div class="flex">
                <!-- Filter Button -->
                <button 
                    @click="showFilters = !showFilters" 
                    title="Filter cards"
                    class="w-10"
                    :class="[
                        showFilters 
                            ? 'button-lighter-visible hover:bg-neutral-800 bg-neutral-800' 
                            : 'button'
                    ]">
                    <Filter :size="18" />
                </button>

                <button @click="emit('create-card')" class="w-10 button" title="Add a new card">
                    <Plus :size="22" />
                </button>
            </div>
        </div>

        <!-- Filter Section -->
        <div v-if="showFilters" 
            class="w-full p-4 space-y-4 panel motion-translate-y-in-[-1.5%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
            <!-- Sort Options -->
            <div class="space-y-2">
                <label class="text-sm text-neutral-400">Sort by</label>
                <div class="relative" ref="sortDropdownRef">
                    <button 
                        @click.stop="isSortDropdownOpen = !isSortDropdownOpen"
                        class="flex items-center justify-between w-full px-3 input-lighter-filled">
                        <span>{{ currentSortText }}</span>
                        <ArrowUpDown :size="16" />
                    </button>

                    <div v-if="isSortDropdownOpen"
                        class="absolute left-0 right-0 z-10 w-full py-2 mt-1 border rounded-lg shadow-xl bg-neutral-900 border-neutral-800 motion-translate-y-in-[-4%] motion-opacity-in-[0%] motion-duration-[0.2s] motion-duration-[0.1s]/opacity">
                        <button 
                            v-for="option in ['newest', 'oldest', 'position', 'due date']"
                            :key="option"
                            @click="handleSortSelect(option as SortOption)"
                            class="flex items-center w-full px-4 py-2 text-sm cursor-pointer hover:bg-neutral-800"
                            :class="{ 'text-white': sortBy === option, 'text-neutral-400': sortBy !== option }">
                            {{ option.charAt(0).toUpperCase() + option.slice(1) }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Search -->
            <div class="space-y-2">
                <label class="text-sm text-neutral-400">Search</label>
                <input type="text" 
                    v-model="searchQuery"
                    class="w-full input-lighter-filled"
                    placeholder="Search cards...">
            </div>

            <!-- Status Filter -->
            <div class="space-y-2">
                <label class="text-sm text-neutral-400">Status</label>
                <div class="space-y-1">
                    <label v-for="status in ['new', 'learning', 'review', 'relearning']" 
                        :key="status" 
                        class="flex items-center gap-2">
                        <input type="checkbox" 
                            :value="status"
                            v-model="selectedStatus"
                            class="checkbox">
                        <span class="text-sm capitalize mt-0.5">{{ status }}</span>
                    </label>
                </div>
            </div>

            <!-- Tags Filter -->
            <div class="space-y-2">
                <label class="text-sm text-neutral-400">Tags</label>
                <div class="space-y-1">
                    <div v-if="deckStore.getUniqueTags(deckId).length === 0" 
                        class="pl-1 text-sm text-neutral-500">
                        —
                    </div>
                    <label v-else v-for="tag in deckStore.getUniqueTags(deckId)" 
                        :key="tag" 
                        class="flex items-center gap-2">
                        <input type="checkbox" 
                            :value="tag"
                            v-model="selectedTags"
                            class="checkbox">
                        <span class="text-sm mt-0.5">{{ tag }}</span>
                    </label>
                </div>
            </div>
        </div>

        <div v-if="showFilters" class="h-px bg-neutral-800"></div>

        <!-- Card List -->
        <div class="space-y-1.5">
            <div v-for="card in filteredCards" 
                :key="card.id"
                class="relative pl-4 pr-2 py-3 h-10 flex items-center justify-between group motion-translate-y-in-[-10%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity"
                :class="[
                    selectedCard === card.id
                        ? 'panel-active'
                        : 'panel-clickable hover:bg-neutral-800/50'
                ]"
                @click="emit('select-card', card.id)">
                
                <div class="flex items-center flex-1 min-w-0 gap-2">
                    <!-- Position number - only show if exists -->
                    <span v-if="card.position" class="text-sm text-neutral-400">#{{ card.position }}</span>
                    
                    <!-- Front of card preview -->
                    <div class="text-sm truncate">{{ stripHtml(card.front_content) }}</div>
                </div>

                <!-- Status tag -->
                <span class="px-2 py-1 text-xs rounded-md text-neutral-400 shrink-0"
                :class="[
                    selectedCard === card.id
                        ? 'bg-neutral-700'
                        : 'bg-neutral-800'
                ]">
                    {{ card.status }}
                </span>
            </div>
        </div>
    </div>
</template>