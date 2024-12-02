<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useStatsStore } from '../../../stores/statsStore';
import { ChevronLeft, ChevronRight, User, Layers3 } from 'lucide-vue-next';
import LoadingSpinner from '../../common/LoadingSpinner.vue';
import ToggleSlider from '../../common/ToggleSlider.vue';

const props = defineProps<{
  userId: string;
  deckId?: string;
}>();

const statsStore = useStatsStore();
const currentYear = ref(new Date().getFullYear());
const isLoading = ref(false);

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const maxReviews = computed(() => {
  let max = 0;
  statsStore.yearlyReviewLogs.forEach(logs => {
    max = Math.max(max, logs.length);
  });
  return max;
});

const minReviews = computed(() => {
  let min = Infinity;
  statsStore.yearlyReviewLogs.forEach(logs => {
    if (logs.length > 0) {  // Exclude zero counts
      min = Math.min(min, logs.length);
    }
  });
  return min === Infinity ? 0 : min;
});

const getIntensityClass = (count: number, date: string) => {
  // Return neutral color for future dates
  if (date && new Date(date) > new Date()) {
    return 'bg-neutral-900';
  }
  
  if (count === 0) return 'bg-neutral-800/75';
  
  // Calculate percentage based on the range between min and max
  const range = maxReviews.value - minReviews.value;
  const percentage = range === 0 
    ? 100  // If min equals max, show full intensity
    : ((count - minReviews.value) / range) * 100;
  
  if (percentage <= 5) return 'bg-emerald-900';
  if (percentage <= 20) return 'bg-emerald-800';
  if (percentage <= 35) return 'bg-emerald-700';
  if (percentage <= 50) return 'bg-emerald-600';
  if (percentage <= 65) return 'bg-emerald-500';
  if (percentage <= 80) return 'bg-emerald-400';
  if (percentage <= 95) return 'bg-emerald-300';
  return 'bg-emerald-200';
};

const legendValues = computed(() => {
  const max = maxReviews.value;
  return [
    0,
    Math.ceil(max * 0.2),
    Math.ceil(max * 0.5),
    Math.ceil(max * 0.8),
    max
  ];
});

const generateCalendarData = computed(() => {
  const year = currentYear.value;
  const calendar: { date: string; count: number; }[][] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  let currentWeek: { date: string; count: number; }[] = [];
  const firstDayOfWeek = startDate.getDay();
  
  // Fill in the first week with empty days if needed
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: '', count: 0 });
  }
  
  // Generate calendar data
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Format date manually to avoid timezone issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const count = statsStore.getReviewCountForDate(dateStr);
    
    if (currentWeek.length === 7) {
      calendar.push(currentWeek);
      currentWeek = [];
    }
    
    currentWeek.push({ date: dateStr, count });
  }
  
  // Fill in the last week with empty days if needed
  while (currentWeek.length < 7) {
    currentWeek.push({ date: '', count: 0 });
  }
  calendar.push(currentWeek);
  
  return calendar;
});

const showAllActivity = ref(false);

const loadYear = async (year: number) => {
  isLoading.value = true;
  try {
    await statsStore.fetchYearlyReviewLogs(
      props.userId, 
      year, 
      showAllActivity.value ? undefined : props.deckId
    );
  } catch (error) {
    console.error('Failed to load review data:', error);
  } finally {
    isLoading.value = false;
  }
};

const changeYear = async (delta: number) => {
  currentYear.value += delta;
};

watch(showAllActivity, async () => {
  await loadYear(currentYear.value);
});

watch(currentYear, async (newYear) => {
  await loadYear(newYear);
});

onMounted(async () => {
  await loadYear(currentYear.value);
});

const isToday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  return dateStr === todayStr;
};
</script>

<template>
  <div class="space-y-4 p-4 panel motion-opacity-in-[0%] motion-duration-[0.1s]/opacity" :class="{
    'motion-translate-y-in-[-3%] motion-duration-[0.2s]': !props.deckId
  }">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-medium text-neutral-400">
          {{ props.deckId ? 'Review Activity:' : 'All Review Activity' }}
        </h3>
        <div v-if="props.deckId">
          <div class="flex items-center gap-3">
            <ToggleSlider v-model="showAllActivity" />
            <div class="flex items-center gap-1.5">
              <component :is="showAllActivity ? User : Layers3" :size="16" class="text-neutral-200" />
              <span class="-mb-0.5 text-sm font-medium text-neutral-200">
                {{ showAllActivity ? 'All' : 'Deck' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button 
          @click="changeYear(-1)"
          class="p-1 rounded-md hover:bg-neutral-800"
          :disabled="isLoading"
        >
          <ChevronLeft :size="16" />
        </button>
        <span class="mt-[1px] text-sm font-medium">{{ currentYear }}</span>
        <button 
          @click="changeYear(1)"
          class="p-1 rounded-md disabled:opacity-50 disabled:hover:bg-transparent hover:bg-neutral-800"
          :disabled="isLoading || currentYear >= new Date().getFullYear()"
        >
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <!-- Heatmap -->
    <div class="relative">
      <div v-if="isLoading" 
           class="absolute inset-0 flex items-center justify-center rounded-lg bg-neutral-900/50">
        <LoadingSpinner :size="32" class="mb-8 text-neutral-500" />
      </div>

      <div class="flex gap-2 overflow-x-auto">
        <!-- Days of week labels -->
        <div class="flex flex-col gap-[3px] pr-0.5 items-center">
          <div v-for="day in weekDays" 
               :key="day" 
               class="h-[10px] text-[10px] text-neutral-500 leading-none">
            {{ day[0] }}
          </div>
        </div>

        <!-- Calendar grid -->
        <div class="flex-1">
          <div class="flex gap-[3px] mb-1">
            <div v-for="(week, weekIndex) in generateCalendarData" 
                 :key="weekIndex" 
                 class="flex flex-col gap-[3px]">
              <div v-for="(day, dayIndex) in week" 
                   :key="`${weekIndex}-${dayIndex}`" 
                   :class="[
                     'w-[10px] h-[10px] rounded-sm transition-colors',
                     day.date ? getIntensityClass(day.count, day.date) : 'bg-transparent',
                     isToday(day.date) ? 'border border-white/40' : ''
                   ]"
                   :title="day.date ? `${day.date}: ${day.count} reviews` : ''"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex items-center justify-end gap-2 mt-2">
        <span class="text-xs text-neutral-500">Less</span>
        <div class="flex gap-1">
          <div v-for="(value, index) in legendValues" 
               :key="index"
               :class="[
                 'w-[10px] h-[10px] rounded-sm',
                 getIntensityClass(value, '')
               ]"
               :title="`${value} reviews`"
          ></div>
        </div>
        <span class="text-xs text-neutral-500">More</span>
      </div>
    </div>
  </div>
</template>