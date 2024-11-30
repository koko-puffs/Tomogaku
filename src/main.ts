import { createApp } from "vue";
import "./styles/main.css";
import App from "./App.vue";
import { createPinia } from "pinia";
import { autoAnimatePlugin } from "@formkit/auto-animate/vue";
import { useAuthStore } from "./stores/authStore.ts";
import { useDeckStore } from "./stores/deckStore.ts";
import { useCardStore } from "./stores/cardStore.ts";
import { useUsersStore } from "./stores/usersStore.ts";
import { useSocialStore } from "./stores/socialStore.ts";
import { useStatsStore } from "./stores/statsStore.ts";
import { useFSRSStore } from "./stores/fsrsStore.ts";
import router from "./router";

const app = createApp(App);

app.use(router);
app.use(createPinia());
app.use(autoAnimatePlugin);

const authStore = useAuthStore();
const deckStore = useDeckStore();
const usersStore = useUsersStore();
const statsStore = useStatsStore();
const fsrsStore = useFSRSStore();
const socialStore = useSocialStore();
const cardStore = useCardStore();

app.provide("authStore", authStore);
app.provide("deckStore", deckStore);
app.provide("usersStore", usersStore);
app.provide("statsStore", statsStore);
app.provide("fsrsStore", fsrsStore);
app.provide("socialStore", socialStore);
app.provide("cardStore", cardStore);

app.mount("#app");
