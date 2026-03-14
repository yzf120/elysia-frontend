<template>
  <el-aside width="240px" class="admin-sidebar">
    <div class="sidebar-logo">
      <el-icon style="margin-right: 8px;"><Platform /></el-icon>
      Elysia 管理端
    </div>
    <el-menu
      :default-active="activeMenu"
      background-color="transparent"
      text-color="#4B5563"
      active-text-color="#10B981"
      router
      class="fresh-menu"
    >
      <el-menu-item index="/admin/dashboard">
        <el-icon><HomeFilled /></el-icon>
        <span>管理员首页</span>
      </el-menu-item>
      <el-menu-item index="/admin/knowledge">
        <el-icon><Reading /></el-icon>
        <span>知识库管理</span>
      </el-menu-item>
      <el-menu-item index="/admin/bookshelf">
        <el-icon><Collection /></el-icon>
        <span>平台书架</span>
      </el-menu-item>
      <el-menu-item index="/admin/announcements">
        <el-icon><Bell /></el-icon>
        <span>系统公告管理</span>
      </el-menu-item>
      <el-menu-item index="/admin/users">
        <el-icon><User /></el-icon>
        <span>用户管理</span>
      </el-menu-item>
      <el-menu-item index="/admin/models">
        <el-icon><Setting /></el-icon>
        <span>模型管理</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script setup>
defineProps({
  activeMenu: {
    type: String,
    default: '/admin/dashboard'
  }
})
</script>

<style scoped>
.fresh-menu :deep(.el-menu-item) {
  border-radius: 8px;
  margin: 4px 12px;
  transition: all 0.3s;
}

.fresh-menu :deep(.el-menu-item:hover) {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%) !important;
}

.fresh-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #10B981 0%, #06B6D4 100%) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.fresh-menu :deep(.el-menu-item.is-active .el-icon) {
  color: white;
}
</style>
