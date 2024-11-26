import { createApp } from "vue";
import "./styles/main.css";
import App from "./App.vue";
import { createPinia } from "pinia";
import { autoAnimatePlugin } from "@formkit/auto-animate/vue";
import { useAuthStore } from "./stores/authStore.ts";
import { useDeckStore } from "./stores/deckStore.ts";
import { useUsersStore } from "./stores/usersStore.ts";
import { useCommentsStore } from "./stores/commentsStore.ts";
import { QuillEditor } from "@vueup/vue-quill";
import router from "./router";

const app = createApp(App);

app.use(router);
app.use(createPinia());
app.use(autoAnimatePlugin);
app.component("VueQuillEditor", QuillEditor);

const authStore = useAuthStore();
const deckStore = useDeckStore();
const usersStore = useUsersStore();
const commentsStore = useCommentsStore();

app.provide("authStore", authStore);
app.provide("deckStore", deckStore);
app.provide("usersStore", usersStore);
app.provide("commentsStore", commentsStore);

app.mount("#app");