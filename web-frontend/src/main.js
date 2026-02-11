import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import App from './App.vue';
import router from './router';
import './styles/student.css'; // 引入学生端样式
import './styles/teacher.css'; // 引入教师端样式

const app = createApp(App);

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 使用Element Plus（中文语言包）
app.use(ElementPlus, {
  locale: zhCn,
});

// 使用路由
app.use(router);

// 挂载应用
app.mount('#app');