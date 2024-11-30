<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useStatsStore } from '../../../stores/statsStore';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import LoadingSpinner from '../../common/LoadingSpinner.vue';

const props = defineProps<{
  userId: string;
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

const getIntensityClass = (count: number) => {
  if (count === 0) return 'bg-neutral-800';
  
  const percentage = (count / maxReviews.value) * 100;
  
  if (percentage <= 10) return 'bg-emerald-900';
  if (percentage <= 25) return 'bg-emerald-800';
  if (percentage <= 40) return 'bg-emerald-700';
  if (percentage <= 55) return 'bg-emerald-600';
  if (percentage <= 70) return 'bg-emerald-500';
  if (percentage <= 85) return 'bg-emerald-400';
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
    const dateStr = d.toISOString().split('T')[0];
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

const loadYear = async (year: number) => {
  isLoading.value = true;
  try {
    await statsStore.fetchYearlyReviewLogs(props.userId, year);
  } catch (error) {
    console.error('Failed to load review data:', error);
  } finally {
    isLoading.value = false;
  }
};

const changeYear = async (delta: number) => {
  currentYear.value += delta;
};

watch(currentYear, async (newYear) => {
  await loadYear(newYear);
});

onMounted(async () => {
  await loadYear(currentYear.value);
});
</script>

<template>
  <div class="space-y-4 p-4 panel motion-translate-y-in-[-2%] motion-opacity-in-[0%] motion-duration-[0.3s] motion-duration-[0.2s]/opacity">
    <!-- Year selector -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-neutral-400">Review Activity</h3>
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
          class="p-1 rounded-md hover:bg-neutral-800"
          :disabled="isLoading"
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
                     day.date ? getIntensityClass(day.count) : 'bg-transparent',
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
                 getIntensityClass(value)
               ]"
               :title="`${value} reviews`"
          ></div>
        </div>
        <span class="text-xs text-neutral-500">More</span>
      </div>
    </div>
  </div>
</template>