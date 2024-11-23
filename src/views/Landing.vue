<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Brain, Users, Share2, ChartLine } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const features = [
  {
    icon: Brain,
    title: 'Smart Cards',
    description: 'Our flashcards adapt to your brain. Ace it? See you later! Forgot it? We\'ll help you remember.'
  },
  {
    icon: Users,
    title: 'Learn Together',
    description: 'Why study alone? Join others who are learning the same things and share those "aha!" moments.'
  },
  {
    icon: Share2,
    title: 'Share Your Smarts',
    description: 'Created an awesome deck? Share it! Need study material? Grab it from the community!'
  },
  {
    icon: ChartLine,
    title: 'Watch Yourself Grow',
    description: 'See your progress with pretty charts (because who doesn\'t love watching their brain level up?)'
  }
];

const handleGetStarted = () => {
  if (authStore.user) {
    router.push('/learn');
  } else {
    authStore.signInWithDiscord();
  }
};

// Animation triggers
const isVisible = ref(false);
onMounted(() => {
  isVisible.value = true;
});

// Modify the cards array for more random rotation
const cardCount = 12;
const sampleContent = [
  // Languages
  'What is "Hello" in Japanese?',
  'Conjugate "être" in French',
  'Define "Schadenfreude"',
  'Spanish: Ser vs Estar',
  
  // Biology
  'Function of mitochondria?',
  'Define photosynthesis',
  'Parts of a neuron',
  'Types of blood cells',
  
  // Geography
  'Capital of Mongolia',
  'Longest river in Europe',
  'What causes tsunamis?',
  'Largest desert on Earth',
  
  // History
  'When was Rome founded?',
  'Who was Cleopatra?',
  'First Moon landing date',
  'French Revolution causes',
  
  // Science
  'Define entropy',
  'Newton\'s Third Law',
  'States of matter',
  'What is DNA?',
  
  // Math
  'Pythagorean theorem',
  'What is Pi?',
  'Define derivative',
  'Types of triangles'
];

const cards = Array.from({ length: cardCount }, (_, i) => ({
  id: i,
  initialRotation: (Math.random() * 360),
  finalRotation: (Math.random() * 360),
  scale: 0.7 + Math.random() * 0.3,
  duration: 20 + Math.random() * 15,
  delay: -Math.random() * 40,
  content: sampleContent[Math.floor(Math.random() * sampleContent.length)],
  startPosition: {
    left: Math.random() * 100,
    top: Math.random() * 100
  }
}));
</script>

<template>
  <div class="relative w-full min-h-screen overflow-hidden motion-preset-fade motion-duration-1000">
    <!-- Animated Background -->
    <div class="fixed inset-0 w-full h-full -z-10">
      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-b from-pink-500/5 to-transparent"></div>

      <!-- Floating cards -->
      <div class="absolute inset-0">
        <div v-for="card in cards" :key="card.id" class="absolute floating-card" :style="{
          left: `${card.startPosition.left}%`,
          top: `${card.startPosition.top}%`,
          transform: `rotate(${card.initialRotation}deg) scale(${card.scale})`,
          '--duration': `${card.duration}s`,
          '--delay': `${card.delay}s`,
          '--initial-rotation': `${card.initialRotation}deg`,
          '--final-rotation': `${card.finalRotation}deg`,
        }">
          <div
            class="w-40 h-56 border rounded-lg bg-gradient-to-br from-pink-500/5 to-purple-500/5 backdrop-blur-sm border-white/5">
            <div class="flex items-center justify-center h-full p-4 text-center">
              <p class="text-sm font-medium text-white/20">{{ card.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hero Section -->
    <div class="relative flex flex-col items-center w-full px-6 pt-32 pb-20 text-center">
      <!-- Main content -->
      <div class="relative max-w-3xl space-y-6">
        <h1 class="text-5xl font-bold leading-tight md:text-6xl motion-translate-y-in-[-3%] motion-opacity-in-[0%] motion-duration-[1s] motion-duration-[1s]/opacity motion-delay-[100ms]">
          Learning is better
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">
            together
          </span>
        </h1>

        <p class="max-w-xl mx-auto text-lg text-neutral-400 motion-translate-y-in-[-3%] motion-opacity-in-[0%] motion-duration-[1s] motion-duration-[1s]/opacity motion-delay-[200ms]">
          Remember stuff with flashcards that actually work (thanks, science!),
          share your genius with others, and join a community of people who love learning as much as you do.
        </p>

        <div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button @click="handleGetStarted"
            class="w-full px-8 py-3 font-medium transition-all rounded-lg shadow-lg text-md sm:w-44 button-pink-visible hover:shadow-pink-500/25 motion-translate-y-in-[-3%] motion-opacity-in-[0%] motion-duration-[1s] motion-duration-[1s]/opacity motion-delay-[300ms]">
            Get started
          </button>
          <a href="#features"
            class="w-full px-8 py-3 font-medium transition-all rounded-lg shadow-lg text-md sm:w-44 button-visible hover:shadow-neutral-700/25 motion-translate-y-in-[-3%] motion-opacity-in-[0%] motion-duration-[1s] motion-duration-[1s]/opacity motion-delay-[350ms]">
            Learn more
          </a>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div id="features" class="px-6 py-20">
      <div class="max-w-6xl mx-auto">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div v-for="(feature, index) in features" :key="index" :class="[
            'p-6 transition-all duration-250 transform hover:-translate-y-1 panel-clickable motion-translate-y-in-[-3%] motion-opacity-in-[0%] motion-duration-[1s] motion-duration-[1s]/opacity motion-delay-[350ms]',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          ]">
            <component :is="feature.icon" class="w-12 h-12 mb-4 text-pink-500" />
            <h3 class="mb-2 text-lg font-semibold">{{ feature.title }}</h3>
            <p class="text-neutral-400">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.floating-card {
  animation: float var(--duration) infinite linear;
  animation-delay: var(--delay);
  will-change: transform;
  pointer-events: none;
}

@keyframes float {
  0% {
    transform: translate(0, 0) rotate(var(--initial-rotation));
    opacity: 0;
  }

  10% {
    opacity: 0.15;
  }

  90% {
    opacity: 0.15;
  }

  100% {
    transform: translate(0, -1000px) rotate(var(--final-rotation));
    opacity: 0;
  }
}

/* Subtle glow effect */
.floating-card::after {
  content: '';
  position: absolute;
  inset: -1px;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.03), transparent);
  border-radius: inherit;
  pointer-events: none;
}
</style>