import { ElButton } from "element-plus/es/components/button/index";
import { ElDrawer } from "element-plus/es/components/drawer/index";
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from "element-plus/es/components/dropdown/index";
import { ElInput } from "element-plus/es/components/input/index";
import { ElPagination } from "element-plus/es/components/pagination/index";
import { ElSkeleton } from "element-plus/es/components/skeleton/index";
import "element-plus/dist/index.css";
import "highlight.js/styles/github.css";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { i18n } from "./i18n";
import { router } from "./router";
import "./styles/variables.css";
import "./styles/element-plus.css";
import "./styles/base.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);
app.use(ElButton);
app.use(ElDrawer);
app.use(ElDropdown);
app.use(ElDropdownItem);
app.use(ElDropdownMenu);
app.use(ElInput);
app.use(ElPagination);
app.use(ElSkeleton);

app.mount("#app");
