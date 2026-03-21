<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  console.log('Elysia 教育平台 (移动端) 已启动');
  
  // 开发模式下，检查是否需要清除缓存
  if (import.meta.env.DEV) {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (token || userType) {
      console.log('🔍 检测到登录信息:');
      console.log('  - Token:', token ? '已存在' : '未设置');
      console.log('  - 用户类型:', userType || '未设置');
      console.log('');
      console.log('💡 如果需要测试登录流程，请在控制台执行:');
      console.log('   localStorage.clear(); location.reload();');
      console.log('');
    } else {
      console.log('✅ 未检测到登录信息，将显示角色选择页面');
    }
  }
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #F7F9FC;
}

#app {
  width: 100%;
  min-height: 100vh;
}

/* 清新明亮风格全局样式 */
.gradient-bg {
  background: linear-gradient(180deg, #F6F9FD 0%, #FFFFFF 58%, #EEF4FF 100%);
}

.card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(79, 110, 247, 0.08);
}

.fresh-primary {
  background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
  color: white;
}

.fresh-success {
  background: linear-gradient(135deg, #34D399 0%, #10B981 100%);
  color: white;
}

.fresh-warning {
  background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
  color: white;
}

.fresh-danger {
  background: linear-gradient(135deg, #F87171 0%, #EF4444 100%);
  color: white;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}
</style>