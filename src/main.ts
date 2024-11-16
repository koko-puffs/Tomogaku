import { createApp } from "vue";
import "./styles/main.css";
import App from "./App.vue";
import { createPinia } from "pinia";
import { autoAnimatePlugin } from "@formkit/auto-animate/vue";
import { useAuthStore } from "./stores/authStore.ts";
import { useDeckStore } from "./stores/deckStore.ts";
import { useUsersStore } from "./stores/usersStore.ts";
import router from "./router";

const app = createApp(App);

app.use(router);
app.use(createPinia());
app.use(autoAnimatePlugin);

const authStore = useAuthStore();
const deckStore = useDeckStore();
const usersStore = useUsersStore();

app.provide("authStore", authStore);
app.provide("deckStore", deckStore);
app.provide("usersStore", usersStore);

app.mount("#app");