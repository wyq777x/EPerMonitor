import { createApp } from "vue";
import Antd from "ant-design-vue";
import App from "./App.vue";
import "ant-design-vue/dist/reset.css";
import "./css/style.css";
import "./css/components.css";

const app = createApp(App);

// 配置 Ant Design Vue 主题
app.use(Antd);

app.mount("#app");
