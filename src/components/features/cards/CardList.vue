<script setup lang="ts">
import { Plus, Filter, ArrowUpDown } from 'lucide-vue-next';
import { useCardStore } from '../../../stores/cardStore';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { State } from 'ts-fsrs';

const props = defineProps<{
    deckId: string;
    selectedCard: string | null;
}>();

const emit = defineEmits<{
    'select-card': [cardId: string];
    'create-card': [];
}>();

const cardStore = useCardStore();

// Add filter state
const showFilters = ref(false);
const searchQuery = ref('');
const selectedTags = ref<string[]>([]);
const selectedState = ref<State[]>([]);

// Add helper function to convert string status to State enum
const getStateFromString = (state: string): State => {
    switch (state) {
        case 'new': return State.New; // 0
        case 'learning': return State.Learning; // 1
        case 'review': return State.Review; // 2
        case 'relearning': return State.Relearning; // 3
        default: return State.New;
    }
};

// Add computed for two-way binding of status checkboxes
const selectedStatus = computed({
    get: () => selectedState.value.map(state => {
        switch (state) {
            case State.New: return 'new';
            case State.Learning: return 'learning';
            case State.Review: return 'review';
            case State.Relearning: return 'relearning';
            default: return 'new';
        }
    }),
    set: (values: string[]) => {
        selectedState.value = values.map(getStateFromString);
    }
});

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
    let cards = cardStore.getCardsByDeckId(props.deckId);

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
    if (selectedState.value.length > 0) {
        cards = cards.filter(card =>
            card.state !== null && selectedState.value.includes(card.state as State)
        );
    }

    // Apply sorting
    return [...cards].sort((a, b) => {
        switch (sortBy.value) {
            case 'newest':
                return (b.created_at ? new Date(b.created_at).getTime() : 0) - 
                       (a.created_at ? new Date(a.created_at).getTime() : 0);
            case 'oldest':
                return (a.created_at ? new Date(a.created_at).getTime() : 0) - 
                       (b.created_at ? new Date(b.created_at).getTime() : 0);
            case 'position':
                return (a.position ?? Infinity) - (b.position ?? Infinity);
            case 'due date':
                return (a.due ? new Date(a.due).getTime() : 0) - 
                       (b.due ? new Date(b.due).getTime() : 0);
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
        <div class="flex items-center justify-between motion-opacity-in-[0%] motion-duration-[0.1s]/opacity">
            <h2 class="pl-1 text-xl font-bold">Cards ({{ filteredCards.length }})</h2>
            <div class="flex">
                <!-- Filter Button -->
                <button @click="showFilters = !showFilters" title="Filter cards" class="w-10" :class="[
                    showFilters
                        ? 'button-lighter-visible hover:bg-neutral-800 bg-neutral-800 hover:border-neutral-700/70'
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
            class="w-full p-4 space-y-4 panel motion-translate-y-in-[-1.7%] motion-opacity-in-[0%] motion-duration-[0.2s] motion-duration-[0.1s]/opacity">
            <!-- Sort Options -->
            <div class="space-y-2">
                <label class="text-sm text-neutral-400">Sort by</label>
                <div class="relative" ref="sortDropdownRef">
                    <button @click.stop="isSortDropdownOpen = !isSortDropdownOpen"
                        class="flex items-center justify-between w-full px-3 input-lighter-filled">
                        <span>{{ currentSortText }}</span>
                        <ArrowUpDown :size="16" />
                    </button>

                    <div v-if="isSortDropdownOpen"
                        class="absolute left-0 right-0 z-10 w-full py-2 mt-1 border rounded-lg shadow-xl bg-neutral-900 border-neutral-800 motion-translate-y-in-[-4%] motion-opacity-in-[0%] motion-duration-[0.2s] motion-duration-[0.1s]/opacity">
                        <button v-for="option in ['newest', 'oldest', 'position', 'due date']" :key="option"
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
                <input type="text" v-model="searchQuery" class="w-full input-lighter-filled"
                    placeholder="Search cards...">
            </div>

            <!-- State Filter -->
            <div class="space-y-2">
                <label class="text-sm text-neutral-400">State</label>
                <div class="space-y-1">
                    <label v-for="status in ['new', 'learning', 'review', 'relearning']" :key="status"
                        class="flex items-center gap-2">
                        <input type="checkbox" :value="status" v-model="selectedStatus" class="checkbox">
                        <span class="text-sm capitalize mt-0.5">{{ status }}</span>
                    </label>
                </div>
            </div>

            <!-- Tags Filter -->
            <div class="space-y-2">
                <label class="text-sm text-neutral-400">Tags</label>
                <div class="space-y-1">
                    <div v-if="cardStore.getUniqueTags(deckId).length === 0" class="pl-1 text-sm text-neutral-500">
                        —
                    </div>
                    <label v-else v-for="tag in cardStore.getUniqueTags(deckId)" :key="tag"
                        class="flex items-center gap-2">
                        <input type="checkbox" :value="tag" v-model="selectedTags" class="checkbox">
                        <span class="text-sm mt-0.5">{{ tag }}</span>
                    </label>
                </div>
            </div>
        </div>

        <div v-if="showFilters" class="h-px bg-neutral-800"></div>

        <!-- Card List -->
        <div class="space-y-1">
            <div v-for="card in filteredCards" :key="card.id"
                class="relative px-3 py-2 flex items-center justify-between group motion-opacity-in-[0%] motion-duration-[0.2s]/opacity"
                :class="[
                    selectedCard === card.id
                        ? 'panel-active'
                        : 'panel-clickable hover:bg-neutral-800/50'
                ]" @click="emit('select-card', card.id)">

                <div class="flex items-center flex-1 min-w-0 gap-2">
                    <div class="text-sm truncate" :class="{
                        'text-neutral-500': !stripHtml(card.front_content)
                    }">
                        {{ stripHtml(card.front_content) || 'Empty card' }}
                    </div>
                </div>

                <span v-if="card.position" 
                      class="text-xs text-neutral-400">
                    #{{ card.position }}
                </span>
            </div>
        </div>
    </div>
</template>