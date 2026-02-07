<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  console.log('Elysia 教育平台已启动');
});
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
