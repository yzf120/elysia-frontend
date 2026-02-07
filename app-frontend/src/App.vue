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
}

#app {
  width: 100%;
  min-height: 100vh;
}
</style>
